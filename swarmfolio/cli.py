"""Command line entry point: `python -m swarmfolio`."""

from __future__ import annotations

import argparse
import os

import numpy as np
import pandas as pd

from . import viz
from .backtest import performance, pick, walk_forward
from .baselines import equal_weight, random_search
from .data import load_prices_csv, synthetic_market
from .ga import NSGA2
from .pareto import hypervolume, spacing
from .problem import PortfolioProblem
from .pso import MOPSO


def build_parser():
    p = argparse.ArgumentParser(prog="swarmfolio", description=__doc__)
    p.add_argument("--csv", help="wide CSV of prices (Date + one column per ticker); default: synthetic data")
    p.add_argument("--assets", type=int, default=20, help="synthetic: number of assets")
    p.add_argument("--days", type=int, default=1500, help="synthetic: number of trading days")
    p.add_argument("--train-frac", type=float, default=0.7)
    p.add_argument("--pop", type=int, default=100, help="swarm / population size")
    p.add_argument("--iters", type=int, default=150, help="iterations / generations")
    p.add_argument("--runs", type=int, default=3, help="independent seeds for the algorithm comparison")
    p.add_argument("--max-weight", type=float, default=0.30)
    p.add_argument("--cardinality", type=int, default=None, help="max number of holdings")
    p.add_argument("--min-weight", type=float, default=0.01)
    p.add_argument("--walk-forward", action="store_true", help="also run a rolling re-optimisation backtest")
    p.add_argument("--seed", type=int, default=0)
    p.add_argument("--out", default="results")
    return p


def main(argv=None):
    a = build_parser().parse_args(argv)
    os.makedirs(a.out, exist_ok=True)

    rets = load_prices_csv(a.csv) if a.csv else synthetic_market(a.assets, a.days, seed=a.seed)
    split = int(a.train_frac * len(rets))
    train, test = rets.iloc[:split], rets.iloc[split:]
    kw = dict(max_weight=a.max_weight, cardinality=a.cardinality, min_weight=a.min_weight)
    print(f"Data: {rets.shape[1]} assets, {len(train)} train / {len(test)} test days")

    # ---------- algorithm comparison on the training window ----------
    budget = a.pop * (a.iters + 1)
    runs = {"PSO": [], "GA": [], "Random": []}
    for r in range(a.runs):
        s = a.seed + r
        prob = PortfolioProblem(train.to_numpy(), **kw)
        runs["PSO"].append(MOPSO(a.pop, a.iters, a.pop, seed=s).run(prob))
        runs["GA"].append(NSGA2(a.pop, a.iters, seed=s).run(prob))
        runs["Random"].append(random_search(prob, budget, seed=s))
    allF = np.vstack([x.objs for rs in runs.values() for x in rs])
    ideal, ref = allF.min(0), allF.max(0) + 1e-9
    rows = []
    for name, rs in runs.items():
        hv = [hypervolume(x.objs, ideal, ref, seed=0) for x in rs]
        rows.append({"algorithm": name, "evals": rs[0].n_evals,
                     "hypervolume_mean": np.mean(hv), "hypervolume_std": np.std(hv),
                     "front_size": np.mean([len(x.objs) for x in rs]),
                     "spacing": np.nanmean([spacing(x.objs) for x in rs]),
                     "best_train_sharpe": np.mean([PortfolioProblem(train.to_numpy(), **kw).sharpe(x.objs).max() for x in rs])})
    comp = pd.DataFrame(rows).round(4)
    comp.to_csv(f"{a.out}/algorithm_comparison.csv", index=False)
    print("\nFront quality (train, higher hypervolume is better):\n" + comp.to_string(index=False))

    # ---------- out-of-sample evaluation of selected portfolios ----------
    prob = PortfolioProblem(train.to_numpy(), **kw)
    best = {k: v[0] for k, v in runs.items()}
    names = list(rets.columns)
    test_curves, rows, wsel = {}, [], {}
    eq = equal_weight(prob)
    test_curves["Equal weight"] = test @ eq
    rows.append({"strategy": "Equal weight", **performance(test_curves["Equal weight"])})
    for alg in ("PSO", "GA"):
        for how in ("sharpe", "minvol", "knee"):
            w = pick(best[alg], how, prob)
            label = f"{alg} {how}"
            test_curves[label] = test @ w
            rows.append({"strategy": label, "holdings": int((w > 1e-6).sum()), **performance(test_curves[label])})
            if how == "sharpe":
                wsel[label] = w
                pd.Series(w, index=names).to_csv(f"{a.out}/weights_{alg.lower()}_sharpe.csv", header=["weight"])
    oos = pd.DataFrame(rows).round(4)
    oos.to_csv(f"{a.out}/out_of_sample.csv", index=False)
    print("\nOut-of-sample performance:\n" + oos.to_string(index=False))

    for alg in ("PSO", "GA"):
        res = best[alg]
        df = pd.DataFrame(res.weights, columns=names)
        df.insert(0, "volatility", res.objs[:, 1]); df.insert(0, "cvar", res.objs[:, 2])
        df.insert(0, "annual_return", -res.objs[:, 0])
        df.sort_values("volatility").to_csv(f"{a.out}/front_{alg.lower()}.csv", index=False)

    if a.walk_forward:
        wf = {"Equal weight (rebalanced)": rets.iloc[split:].mean(axis=1)}
        facs = {"PSO": lambda: MOPSO(60, 60, 60, seed=a.seed), "GA": lambda: NSGA2(60, 60, seed=a.seed)}
        for name, f in facs.items():
            wf[f"{name} walk-forward"] = walk_forward(rets, f, kw, start=split)
        wfm = pd.DataFrame([{"strategy": k, **performance(v)} for k, v in wf.items()]).round(4)
        wfm.to_csv(f"{a.out}/walk_forward.csv", index=False)
        print("\nWalk-forward (63d rebalance, 10 bps cost):\n" + wfm.to_string(index=False))
        viz.plot_wealth(wf, f"{a.out}/walk_forward.png", "Walk-forward wealth")

    # ---------- plots ----------
    Rt = train.to_numpy()
    viz.plot_fronts({k: v for k, v in best.items()},
                    (Rt.mean(0) * 252, Rt.std(0, ddof=1) * np.sqrt(252)),
                    prob.evaluate(eq)[0], f"{a.out}/pareto_fronts.png")
    viz.plot_convergence(best, f"{a.out}/convergence.png")
    viz.plot_wealth({k: v for k, v in test_curves.items() if "sharpe" in k or k == "Equal weight" or "knee" in k},
                    f"{a.out}/oos_wealth.png")
    viz.plot_weights(wsel, names, f"{a.out}/weights.png")
    print(f"\nWrote results and plots to {a.out}/")


if __name__ == "__main__":
    main()
