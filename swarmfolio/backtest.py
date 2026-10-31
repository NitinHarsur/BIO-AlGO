"""Portfolio selection from a Pareto front, performance metrics and walk-forward testing."""

from __future__ import annotations

import numpy as np
import pandas as pd

from .problem import OptResult, PortfolioProblem

PERIODS = 252


def pick_index(F: np.ndarray, how: str, problem: PortfolioProblem) -> int:
    """Row of a front chosen by rule: 'sharpe', 'minvol' or 'knee'."""
    if how == "sharpe":
        i = int(np.argmax(problem.sharpe(F)))
    elif how == "minvol":
        i = int(np.argmin(F[:, 1]))
    elif how == "knee":
        span = np.ptp(F, axis=0)
        Z = (F - F.min(0)) / np.where(span > 0, span, 1.0)
        i = int(np.argmin(np.linalg.norm(Z, axis=1)))
    else:
        raise ValueError(f"unknown selection rule {how!r}")
    return i


def pick(result: OptResult, how: str, problem: PortfolioProblem) -> np.ndarray:
    return result.weights[pick_index(result.objs, how, problem)]


def performance(daily: np.ndarray | pd.Series, rf: float = 0.0, alpha: float = 0.05) -> dict:
    r = np.asarray(daily, dtype=float)
    wealth = np.cumprod(1 + r)
    peak = np.maximum.accumulate(wealth)
    k = max(1, int(np.ceil(alpha * len(r))))
    vol = r.std(ddof=1) * np.sqrt(PERIODS)
    cagr = wealth[-1] ** (PERIODS / len(r)) - 1
    return {
        "total_return": wealth[-1] - 1,
        "cagr": cagr,
        "volatility": vol,
        "sharpe": (r.mean() * PERIODS - rf) / vol if vol > 0 else float("nan"),
        "max_drawdown": float((wealth / peak - 1).min()),
        "cvar_5": float(-np.sort(r)[:k].mean()),
    }


def walk_forward(returns: pd.DataFrame, optimizer_factory, problem_kwargs: dict,
                 how: str = "sharpe", lookback: int = 252, rebalance: int = 63,
                 cost_bps: float = 10.0, start: int | None = None) -> pd.Series:
    """Re-optimise every `rebalance` days on the trailing `lookback` window.

    Weights are held constant between rebalances; each rebalance pays
    `cost_bps` per unit of one-way turnover versus the previous target weights.
    """
    R = returns.to_numpy()
    T, N = R.shape
    start = lookback if start is None else start
    out = np.empty(T - start)
    w_prev = np.full(N, 1.0 / N)
    for t in range(start, T, rebalance):
        problem = PortfolioProblem(R[t - lookback:t], **problem_kwargs)
        w = pick(optimizer_factory().run(problem), how, problem)
        end = min(t + rebalance, T)
        seg = R[t:end] @ w
        seg[0] -= cost_bps * 1e-4 * np.abs(w - w_prev).sum()
        out[t - start:end - start] = seg
        w_prev = w
    return pd.Series(out, index=returns.index[start:])
