import json
import threading
import urllib.request
from http.server import ThreadingHTTPServer

import pytest

from swarmfolio import server


def wait(job, timeout=60):
    for _ in range(timeout * 20):
        if job.status not in ("running", "analyzing"):
            return
        threading.Event().wait(0.05)
    raise TimeoutError


def test_job_produces_complete_result():
    job = server.Job({"assets": 8, "days": 500, "pop": 20, "iters": 8, "seed": 1})
    job.run()
    d = job.view()
    assert d["status"] == "done", d["error"]
    r = d["result"]
    assert d["progress"]["PSO"] == [8, 8] and d["progress"]["GA"] == [8, 8]
    assert {s["name"] for s in r["scorecard"]} == {"PSO", "GA", "Random"}
    for alg in ("PSO", "GA"):
        f = r["fronts"][alg]
        n = len(f["points"])
        assert len(f["weights"]) == n and len(f["test"]["curves"]) == n
        assert all(abs(sum(w) - 1) < 1e-3 for w in f["weights"])
        assert set(f["picks"]) == {"sharpe", "minvol", "knee"}
    json.dumps(d)  # must be serialisable


def test_infeasible_constraints_surface_as_error():
    job = server.Job({"assets": 8, "days": 500, "max_weight": 0.1, "cardinality": 5})
    job.run()
    assert job.status == "error" and "Infeasible" in job.error


def test_out_of_range_input_rejected():
    job = server.Job({"assets": 500})
    job.run()
    assert job.status == "error" and "assets" in job.error


def test_http_roundtrip_and_static_files():
    srv = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{srv.server_address[1]}"
    try:
        assert b"SwarmFolio" in urllib.request.urlopen(base + "/").read()
        with pytest.raises(urllib.error.HTTPError) as e:
            urllib.request.urlopen(base + "/../pyproject.toml")
        assert e.value.code == 404
        req = urllib.request.Request(base + "/api/run", json.dumps(
            {"assets": 6, "days": 400, "pop": 12, "iters": 5}).encode(), method="POST")
        job_id = json.load(urllib.request.urlopen(req))["id"]
        wait(server.JOBS[job_id])
        d = json.load(urllib.request.urlopen(f"{base}/api/jobs/{job_id}"))
        assert d["status"] == "done"
    finally:
        srv.shutdown()
