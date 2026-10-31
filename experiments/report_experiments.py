"""Experiments reported in the project report. Each experiment writes JSON to --out.

    python experiments/report_experiments.py main --out report_data
    python experiments/report_experiments.py all  --out report_data     # runs every experiment in sequence
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from swarmfolio import MOPSO, NSGA2, PortfolioProblem, synthetic_market          # noqa: E402
from swarmfolio.backtest import performance, pick_index                          # noqa: E402
from swarmfolio.baselines import equal_weight, random_search                     # noqa: E402
from swarmfolio.pareto import hypervolume, spacing                               # noqa: E402

POP, ITERS = 100, 150


def shared_hv(fronts: dict) -> dict:
    allF = np.vstack(list(fronts.values()))
    ideal, ref = allF.min(0), allF.max(0) + 1e-9
    return {k: hypervolume(F, ideal, ref, n_samples=200_000, seed=0) for k, F in fronts.items()}


def train_test(n_assets=20, days=1500, seed=0, frac=0.7):
    r = synthetic_market(n_assets, days, seed=seed)
    s = int(frac * len(r))
    return r, r.iloc[:s].to_numpy(), r.iloc[s:].to_numpy()


def run_all(prob_kw, Rtr, seed, pop=POP, iters=ITERS, pso_kw=None, ga_kw=None, rs=True):
    out = {}
    t = time.time()
    out["PSO"] = MOPSO(pop, iters, pop, seed=seed, **(pso_kw or {})).run(PortfolioProblem(Rtr, **prob_kw))
    out["PSO"].seconds = time.time() - t
    t = time.time()
    out["GA"] = NSGA2(pop, iters, seed=seed, **(ga_kw or {})).run(PortfolioProblem(Rtr, **prob_kw))
    out["GA"].seconds = time.time() - t
    if rs:
        out["Random"] = random_search(PortfolioProblem(Rtr, **prob_kw), pop * (iters + 1), seed=seed)
        out["Random"].seconds = 0.0
    return out


# ------------------------------------------------------------------ experiments
def exp_main(out, seeds=10):
    """Seed-0 fronts in detail, plus hypervolume over independent seeds."""
    r, Rtr, Rte = train_test(seed=0)
    kw = dict(max_weight=0.3, min_weight=0.01)
    prob = PortfolioProblem(Rtr, **kw)
    runs = [run_all(kw, Rtr, s) for s in range(seeds)]
    rows = []
    for s, res in enumerate(runs):
        hv = shared_hv({k: v.objs for k, v in res.items()})
        for k, v in res.items():
            rows.append({"seed": s, "alg": k, "hv": hv[k], "size": len(v.objs), "spacing": spacing(v.objs),
                         "seconds": v.seconds, "best_sharpe": float(prob.sharpe(v.objs).max()),
                         "evals": v.n_evals})
    d0 = runs[0]
    detail = {}
    for k in ("PSO", "GA"):
        res = d0[k]
        order = np.argsort(res.objs[:, 1])
        W, F = res.weights[order], res.objs[order]
        picks = {h: int(pick_index(F, h, prob)) for h in ("sharpe", "minvol", "knee")}
        detail[k] = {"objs": F.tolist(), "weights": W.tolist(), "history": res.history, "picks": picks,
                     "test": {h: performance(Rte @ W[i]) for h, i in picks.items()},
                     "train": {h: {"ret": float(-F[i, 0]), "vol": float(F[i, 1]), "cvar": float(F[i, 2])} for h, i in picks.items()},
                     "test_curves": {h: np.cumprod(1 + Rte @ W[i]).tolist() for h, i in picks.items()},
                     "holdings": {h: int((W[i] > 1e-6).sum()) for h, i in picks.items()}}
    rnd = d0["Random"]
    detail["Random"] = {"objs": rnd.objs[np.argsort(rnd.objs[:, 1])].tolist()}
    ew = equal_weight(prob)
    detail["EW"] = {"test": performance(Rte @ ew), "train_objs": prob.evaluate(ew)[0].tolist(),
                    "test_curve": np.cumprod(1 + Rte @ ew).tolist()}
    detail["assets"] = list(r.columns)
    detail["n_train"], detail["n_test"] = len(Rtr), len(Rte)
    detail["asset_stats"] = {"mu": (Rtr.mean(0) * 252).tolist(), "sd": (Rtr.std(0, ddof=1) * np.sqrt(252)).tolist()}
    json.dump({"rows": rows, "detail": detail}, open(f"{out}/main.json", "w"))


def exp_constraints(out, seeds=5):
    r, Rtr, Rte = train_test(seed=0)
    rows = []
    for card in (None, 10, 8, 5):
        kw = dict(max_weight=0.3, min_weight=0.01, cardinality=card)
        prob = PortfolioProblem(Rtr, **kw)
        for s in range(seeds):
            res = run_all(kw, Rtr, s)
            hv = shared_hv({k: v.objs for k, v in res.items()})
            for k, v in res.items():
                W = v.weights
                rows.append({"card": card or 20, "seed": s, "alg": k, "hv": hv[k],
                             "best_sharpe": float(prob.sharpe(v.objs).max()),
                             "max_holdings": int((W > 1e-6).sum(1).max()), "max_w": float(W.max())})
    json.dump(rows, open(f"{out}/constraints.json", "w"))


def exp_scalability(out, seeds=3):
    rows = []
    for n in (10, 20, 40, 60):
        r, Rtr, _ = train_test(n_assets=n, seed=1)
        kw = dict(max_weight=0.3, min_weight=0.01)
        for s in range(seeds):
            res = run_all(kw, Rtr, s)
            hv = shared_hv({k: v.objs for k, v in res.items()})
            for k, v in res.items():
                rows.append({"n": n, "seed": s, "alg": k, "hv": hv[k], "seconds": v.seconds})
    json.dump(rows, open(f"{out}/scalability.json", "w"))


def exp_budget(out, seeds=5):
    """Fronts are stored so that hypervolume can be computed later against ONE reference box for all budgets."""
    r, Rtr, _ = train_test(seed=0)
    kw = dict(max_weight=0.3, min_weight=0.01)
    rows = []
    for iters in (5, 10, 25, 50, 100, 200):
        for s in range(seeds):
            res = run_all(kw, Rtr, s, iters=iters)
            for k, v in res.items():
                rows.append({"iters": iters, "seed": s, "alg": k, "evals": v.n_evals,
                             "objs": v.objs.round(6).tolist()})
    json.dump(rows, open(f"{out}/budget.json", "w"))


def exp_timing(out, seeds=3):
    """Wall-clock time per run, measured with nothing else running."""
    rows = []
    for n in (10, 20, 40, 60):
        r, Rtr, _ = train_test(n_assets=n, seed=1)
        kw = dict(max_weight=0.3, min_weight=0.01)
        for s in range(seeds):
            res = run_all(kw, Rtr, s, rs=False)
            for k, v in res.items():
                rows.append({"n": n, "seed": s, "alg": k, "seconds": v.seconds})
    json.dump(rows, open(f"{out}/timing.json", "w"))


def exp_ablation(out, seeds=8):
    r, Rtr, _ = train_test(seed=0)
    kw = dict(max_weight=0.3, min_weight=0.01, cardinality=8)
    rows = []
    variants = {"PSO (full)": ("PSO", {}), "PSO without turbulence": ("PSO", {"turbulence": 0.0}),
                "GA (full)": ("GA", {}), "GA without swap mutation": ("GA", {"p_swap": 0.0})}
    for s in range(seeds):
        fronts = {}
        for name, (alg, extra) in variants.items():
            p = PortfolioProblem(Rtr, **kw)
            res = (MOPSO(POP, ITERS, POP, seed=s, **extra) if alg == "PSO" else NSGA2(POP, ITERS, seed=s, **extra)).run(p)
            fronts[name] = res.objs
        hv = shared_hv(fronts)
        for k, v in hv.items():
            rows.append({"seed": s, "variant": k, "hv": v})
    json.dump(rows, open(f"{out}/ablation.json", "w"))


def exp_oos(out, datasets=30):
    """Held-out performance over many independent simulated markets."""
    kw = dict(max_weight=0.3, min_weight=0.01)
    rows = []
    for ds in range(datasets):
        r, Rtr, Rte = train_test(seed=100 + ds)
        prob = PortfolioProblem(Rtr, **kw)
        res = run_all(kw, Rtr, ds, pop=100, iters=100)
        strategies = {"Equal weight": equal_weight(prob)}
        for alg, label in (("PSO", "PSO"), ("GA", "GA"), ("Random", "Random search")):
            F, W = res[alg].objs, res[alg].weights
            strategies[f"{label} best Sharpe"] = W[pick_index(F, "sharpe", prob)]
            strategies[f"{label} min volatility"] = W[pick_index(F, "minvol", prob)]
        for name, w in strategies.items():
            p = performance(Rte @ w)
            ftr = prob.evaluate(w)[0]
            rows.append({"dataset": ds, "strategy": name, "train_sharpe": float(-ftr[0] / ftr[1]), **p})
    json.dump(rows, open(f"{out}/oos.json", "w"))


EXPS = {"main": exp_main, "constraints": exp_constraints, "scalability": exp_scalability,
        "budget": exp_budget, "timing": exp_timing, "ablation": exp_ablation, "oos": exp_oos}

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("which", choices=[*EXPS, "all"])
    ap.add_argument("--out", default="report_data")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    for name in (EXPS if a.which == "all" else [a.which]):
        t = time.time()
        EXPS[name](a.out)
        print(f"{name}: {time.time() - t:.0f}s", flush=True)
