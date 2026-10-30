"""Web server for the SwarmFolio frontend (standard library only).

    python -m swarmfolio.server --port 8000

POST /api/run        start an optimisation job, returns {"id": ...}
GET  /api/jobs/<id>  poll progress; includes the full result once status == "done"
POST /api/jobs/<id>/cancel
"""

from __future__ import annotations

import argparse
import io
import json
import mimetypes
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import numpy as np

from .backtest import performance, pick_index
from .baselines import equal_weight, random_search
from .data import load_prices_csv, synthetic_market
from .ga import NSGA2
from .pareto import hypervolume, spacing
from .problem import PortfolioProblem
from .pso import MOPSO

WEB_DIR = Path(__file__).parent / "web"
MAX_BODY = 8 * 1024 * 1024
LIMITS = {"assets": (4, 60), "days": (300, 5000), "pop": (10, 300), "iters": (5, 500)}


class Cancelled(Exception):
    pass


def _front_rows(objs: np.ndarray) -> list:
    """[volatility, annual return, cvar] rows."""
    return np.column_stack([objs[:, 1], -objs[:, 0], objs[:, 2]]).round(5).tolist()


def _clamp(cfg, key, default, cast=int):
    lo, hi = LIMITS[key]
    try:
        v = cast(cfg.get(key, default))
    except (TypeError, ValueError):
        raise ValueError(f"'{key}' must be a number")
    if not lo <= v <= hi:
        raise ValueError(f"'{key}' must be between {lo} and {hi}")
    return v


class Job:
    def __init__(self, cfg: dict):
        self.id = uuid.uuid4().hex[:12]
        self.cfg = cfg
        self.status = "running"
        self.error = None
        self.progress = {"PSO": [0, 1], "GA": [0, 1]}
        self.snap = {}
        self.cloud = []
        self.result = None
        self.cancel = threading.Event()
        self.lock = threading.Lock()

    # ---------------------------------------------------------------- polling
    def view(self) -> dict:
        with self.lock:
            out = {"id": self.id, "status": self.status, "error": self.error,
                   "progress": self.progress, "snap": self.snap, "cloud": self.cloud}
            if self.status == "done":
                out["result"] = self.result
            return out

    def _callback(self, name):
        def cb(it, total, pop, front):
            if self.cancel.is_set():
                raise Cancelled()
            snap = {"pop": _front_rows(pop), "front": _front_rows(front)}
            with self.lock:
                self.progress[name] = [it, total]
                self.snap[name] = snap
        return cb

    # ---------------------------------------------------------------- the work
    def run(self):
        try:
            self._run()
        except Cancelled:
            with self.lock:
                self.status = "cancelled"
        except Exception as e:  # surfaced to the UI, never swallowed silently
            with self.lock:
                self.status, self.error = "error", str(e)

    def _run(self):
        c = self.cfg
        if c.get("csv_text"):
            rets = load_prices_csv(io.StringIO(c["csv_text"]))
        else:
            rets = synthetic_market(_clamp(c, "assets", 20), _clamp(c, "days", 1500),
                                    seed=int(c.get("seed", 0)))
        names = list(rets.columns)
        frac = float(c.get("train_frac", 0.7))
        if not 0.3 <= frac <= 0.95:
            raise ValueError("'train_frac' must be between 0.3 and 0.95")
        split = int(frac * len(rets))
        if split < 60 or len(rets) - split < 30:
            raise ValueError("Not enough history for a train/test split.")
        Rtr, Rte = rets.iloc[:split].to_numpy(), rets.iloc[split:].to_numpy()
        card = c.get("cardinality")
        kw = dict(max_weight=float(c.get("max_weight", 0.3)),
                  cardinality=int(card) if card else None,
                  min_weight=float(c.get("min_weight", 0.01)))
        pop, iters = _clamp(c, "pop", 100), _clamp(c, "iters", 150)
        seed = int(c.get("seed", 0))

        probs = {k: PortfolioProblem(Rtr, **kw) for k in ("PSO", "GA", "base")}   # raises if infeasible
        base = probs["base"]
        rng = np.random.default_rng(seed)
        cloud = base.evaluate(base.random_weights(300, rng))
        with self.lock:
            self.cloud = _front_rows(cloud)

        results, timing = {}, {}

        def work(name, opt):
            t0 = time.time()
            try:
                results[name] = opt.run(probs[name], callback=self._callback(name))
            except Cancelled:
                results[name] = None
            timing[name] = time.time() - t0

        threads = [threading.Thread(target=work, args=("PSO", MOPSO(pop, iters, pop, seed=seed))),
                   threading.Thread(target=work, args=("GA", NSGA2(pop, iters, seed=seed)))]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        if self.cancel.is_set() or any(v is None for v in results.values()):
            raise Cancelled()

        with self.lock:
            self.status = "analyzing"
        budget = pop * (iters + 1)
        results["Random"] = random_search(base, budget, seed=seed)
        self._finish(rets, names, split, Rtr, Rte, base, results, timing, pop, iters)

    def _finish(self, rets, names, split, Rtr, Rte, base, results, timing, pop, iters):
        allF = np.vstack([r.objs for r in results.values()])
        ideal, ref = allF.min(0), allF.max(0) + 1e-9
        step = max(1, len(Rte) // 120)
        keep_idx = np.unique(np.r_[0:len(Rte):step, len(Rte) - 1])
        dates = [d.strftime("%Y-%m-%d") for d in rets.index[split:][keep_idx]]

        def test_stats(W):
            P = Rte @ W.T
            wealth = np.cumprod(1 + P, axis=0)
            vol = P.std(0, ddof=1) * np.sqrt(252)
            ret = P.mean(0) * 252
            mdd = (wealth / np.maximum.accumulate(wealth, axis=0) - 1).min(0)
            return {"ret": ret.round(5).tolist(), "vol": vol.round(5).tolist(),
                    "sharpe": (ret / np.where(vol > 0, vol, np.nan)).round(4).tolist(),
                    "mdd": mdd.round(5).tolist(),
                    "curves": wealth[keep_idx].T.round(4).tolist()}

        fronts, score = {}, []
        for name, r in results.items():
            order = np.argsort(r.objs[:, 1])
            objs, W = r.objs[order], r.weights[order]
            entry = {"points": _front_rows(objs)}
            if name != "Random":
                entry["weights"] = W.round(4).tolist()
                entry["test"] = test_stats(W)
                entry["history"] = [round(h, 4) for h in r.history]
                entry["picks"] = {how: int(pick_index(objs, how, base))
                                  for how in ("sharpe", "minvol", "knee")}
            fronts[name] = entry
            score.append({"name": name, "hypervolume": round(hypervolume(r.objs, ideal, ref), 4),
                          "front_size": len(r.objs), "spacing": round(spacing(r.objs), 4),
                          "evals": int(r.n_evals), "seconds": round(timing.get(name, 0.0), 2),
                          "best_sharpe": round(float(base.sharpe(r.objs).max()), 3)})

        ew = equal_weight(base)[None, :]
        ew_f = base.evaluate(ew)[0]
        ew_test = test_stats(ew)
        result = {
            "assets": names, "n_train": len(Rtr), "n_test": len(Rte),
            "train_start": rets.index[0].strftime("%Y-%m-%d"), "split_date": rets.index[split].strftime("%Y-%m-%d"),
            "end_date": rets.index[-1].strftime("%Y-%m-%d"),
            "dates": dates, "fronts": fronts, "scorecard": score, "pop": pop, "iters": iters,
            "equal_weight": {"train": _front_rows(np.atleast_2d(ew_f))[0],
                             "test": {k: v[0] for k, v in ew_test.items()}},
            "max_weight": base.max_weight, "cardinality": base.cardinality,
        }
        with self.lock:
            self.result, self.status = result, "done"


JOBS: dict[str, Job] = {}
JOBS_LOCK = threading.Lock()


def start_job(cfg: dict) -> Job:
    with JOBS_LOCK:
        for j in JOBS.values():
            j.cancel.set()
        job = Job(cfg)
        JOBS[job.id] = job
        while len(JOBS) > 8:
            JOBS.pop(next(iter(JOBS)))
    threading.Thread(target=job.run, daemon=True).start()
    return job


class Handler(BaseHTTPRequestHandler):
    server_version = "SwarmFolio"

    def log_message(self, fmt, *args):
        pass

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split("?")[0]
        if path.startswith("/api/jobs/"):
            job = JOBS.get(path.rsplit("/", 1)[-1])
            return self._json(200, job.view()) if job else self._json(404, {"error": "Unknown job."})
        rel = "index.html" if path == "/" else path.lstrip("/")
        f = (WEB_DIR / rel).resolve()
        if WEB_DIR.resolve() not in f.parents or not f.is_file():
            return self._json(404, {"error": "Not found."})
        data = f.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mimetypes.guess_type(f.name)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        path = self.path.split("?")[0]
        if path.endswith("/cancel"):
            job = JOBS.get(path.split("/")[-2])
            if job:
                job.cancel.set()
            return self._json(200, {"ok": True})
        if path != "/api/run":
            return self._json(404, {"error": "Not found."})
        n = int(self.headers.get("Content-Length", 0))
        if n > MAX_BODY:
            return self._json(413, {"error": "Upload is larger than 8 MB."})
        try:
            cfg = json.loads(self.rfile.read(n) or b"{}")
            assert isinstance(cfg, dict)
        except Exception:
            return self._json(400, {"error": "Request body must be a JSON object."})
        job = start_job(cfg)
        self._json(200, {"id": job.id})


def main(argv=None):
    p = argparse.ArgumentParser(description="SwarmFolio web app")
    p.add_argument("--host", default="127.0.0.1")
    p.add_argument("--port", type=int, default=8000)
    a = p.parse_args(argv)
    srv = ThreadingHTTPServer((a.host, a.port), Handler)
    print(f"SwarmFolio running at http://{a.host}:{a.port}")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
