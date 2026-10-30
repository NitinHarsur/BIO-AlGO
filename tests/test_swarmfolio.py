import numpy as np
import pytest

from swarmfolio import MOPSO, NSGA2, PortfolioProblem, synthetic_market
from swarmfolio.baselines import random_search
from swarmfolio.pareto import (crowding_distance, fast_nondominated_sort, hypervolume,
                               nondominated_mask)


@pytest.fixture(scope="module")
def returns():
    return synthetic_market(12, 600, seed=1).to_numpy()


def check_feasible(problem, W):
    assert np.allclose(W.sum(1), 1.0)
    assert (W >= -1e-12).all()
    assert (W <= problem.max_weight + 1e-9).all()
    if problem.cardinality:
        assert ((W > 1e-9).sum(1) <= problem.cardinality).all()


@pytest.mark.parametrize("card", [None, 5])
def test_repair_always_feasible(returns, card):
    p = PortfolioProblem(returns, max_weight=0.3, cardinality=card)
    rng = np.random.default_rng(0)
    X = np.vstack([rng.normal(0, 1, (200, p.n)), np.zeros((1, p.n)), np.ones((1, p.n)),
                   np.eye(p.n)])
    check_feasible(p, p.repair_many(X))


def test_infeasible_config_rejected(returns):
    with pytest.raises(ValueError):
        PortfolioProblem(returns, max_weight=0.1, cardinality=5)


def test_evaluate_matches_manual(returns):
    p = PortfolioProblem(returns)
    w = np.full(p.n, 1 / p.n)
    f = p.evaluate(w)[0]
    r = returns @ w
    assert f[0] == pytest.approx(-r.mean() * 252)
    assert f[1] == pytest.approx(r.std(ddof=1) * np.sqrt(252))
    k = int(np.ceil(0.05 * len(r)))
    assert f[2] == pytest.approx(-np.sort(r)[:k].mean())


def test_pareto_utils():
    F = np.array([[1, 5, 1], [2, 2, 2], [3, 3, 3], [5, 1, 1.0]])
    assert nondominated_mask(F).tolist() == [True, True, False, True]
    assert fast_nondominated_sort(F).tolist() == [0, 0, 1, 0]
    assert np.isinf(crowding_distance(F[[0, 1, 3]])).sum() >= 2
    ideal, ref = np.zeros(3), np.full(3, 6.0)
    assert hypervolume(F[:1], ideal, ref, 50_000) < hypervolume(F, ideal, ref, 50_000)


@pytest.mark.parametrize("opt", [MOPSO(30, 25, 30, seed=3), NSGA2(30, 25, seed=3)])
def test_optimizers_return_feasible_nondominated_front(returns, opt):
    p = PortfolioProblem(returns, cardinality=6)
    res = opt.run(p)
    check_feasible(p, res.weights)
    assert nondominated_mask(res.objs).all()
    assert np.allclose(res.objs, p.evaluate(res.weights))
    assert len(res.history) == opt_iters(opt) + 1


def test_metaheuristics_beat_random_search(returns):
    p = PortfolioProblem(returns)
    pso = MOPSO(40, 40, 40, seed=0).run(p)
    ga = NSGA2(40, 40, seed=0).run(p)
    rs = random_search(p, pso.n_evals, seed=0)
    allF = np.vstack([pso.objs, ga.objs, rs.objs])
    ideal, ref = allF.min(0), allF.max(0) + 1e-9
    hv = lambda r: hypervolume(r.objs, ideal, ref)
    assert hv(pso) > hv(rs) and hv(ga) > hv(rs)


def test_seed_reproducible(returns):
    p1, p2 = PortfolioProblem(returns), PortfolioProblem(returns)
    a = MOPSO(20, 10, 20, seed=5).run(p1)
    b = MOPSO(20, 10, 20, seed=5).run(p2)
    assert np.allclose(a.objs, b.objs)


def test_cli_smoke(tmp_path):
    from swarmfolio.cli import main
    main(["--assets", "8", "--days", "500", "--pop", "20", "--iters", "10", "--runs", "1",
          "--walk-forward", "--out", str(tmp_path)])
    for f in ["algorithm_comparison.csv", "out_of_sample.csv", "pareto_fronts.png", "walk_forward.csv"]:
        assert (tmp_path / f).exists()


def opt_iters(opt):
    return getattr(opt, "iters", None) or opt.generations
