"""Portfolio problem definition: objectives, constraints and the repair operator.

Objectives (all minimised):
    f1 = -annualised mean return
    f2 =  annualised volatility
    f3 =  CVaR (expected loss in the worst `alpha` fraction of days, daily units)

Constraints (enforced by `repair`, so both metaheuristics only ever see feasible
portfolios): long-only, fully invested, per-asset cap, optional cardinality
(at most K holdings) and a minimum holding size.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

OBJECTIVE_NAMES = ("neg_return", "volatility", "cvar")


@dataclass
class OptResult:
    weights: np.ndarray          # (m, N) non-dominated portfolios
    objs: np.ndarray             # (m, 3)
    n_evals: int
    history: list = field(default_factory=list)  # best Sharpe seen per iteration
    name: str = ""


class PortfolioProblem:
    def __init__(
        self,
        returns: np.ndarray,
        max_weight: float = 0.30,
        cardinality: int | None = None,
        min_weight: float = 0.01,
        cvar_alpha: float = 0.05,
        periods: int = 252,
        risk_free: float = 0.0,
    ):
        R = np.asarray(returns, dtype=float)
        if R.ndim != 2 or R.shape[1] < 2:
            raise ValueError("returns must be a (T, N) array with N >= 2")
        self.R = R
        self.T, self.n = R.shape
        self.max_weight = float(max_weight)
        self.cardinality = cardinality if cardinality and cardinality < self.n else None
        self.min_weight = float(min_weight)
        self.cvar_alpha = cvar_alpha
        self.periods = periods
        self.risk_free = risk_free
        self.n_evals = 0
        self._kmin = int(np.ceil(1.0 / self.max_weight - 1e-12))
        limit = self.cardinality or self.n
        if limit < self._kmin:
            raise ValueError(
                f"Infeasible: need at least {self._kmin} holdings for max_weight={max_weight}, "
                f"but only {limit} allowed."
            )

    # ------------------------------------------------------------------ repair
    def repair(self, x: np.ndarray) -> np.ndarray:
        """Map any real vector to a feasible weight vector."""
        n, wmax = self.n, self.max_weight
        x = np.nan_to_num(np.clip(np.asarray(x, dtype=float), 0.0, None))
        w = x.copy()

        if self.cardinality:
            drop = np.argsort(-w)[self.cardinality:]
            w[drop] = 0.0
        if self.min_weight > 0 and w.sum() > 0:
            w = w / w.sum()
            w[w < self.min_weight] = 0.0

        # Make sure enough assets are held for the cap to be satisfiable.
        floor = max(self.min_weight, 1e-3)
        if (w > 0).sum() < self._kmin:
            for i in np.argsort(-x):
                if w[i] == 0.0:
                    w[i] = floor
                if (w > 0).sum() >= self._kmin:
                    break
        w = w / w.sum()

        # Cap excess weight and redistribute proportionally to unsaturated holdings.
        for _ in range(100):
            over = w > wmax + 1e-12
            if not over.any():
                break
            excess = (w[over] - wmax).sum()
            w[over] = wmax
            free = (w > 0) & (w < wmax - 1e-12)
            if free.any():
                w[free] += excess * w[free] / w[free].sum()
            else:
                for i in np.argsort(-x):
                    if w[i] < wmax - 1e-12:
                        add = min(excess, wmax - w[i])
                        w[i] += add
                        excess -= add
                        if excess <= 1e-15:
                            break
        return w / w.sum()

    def repair_many(self, X: np.ndarray) -> np.ndarray:
        return np.array([self.repair(x) for x in X])

    def random_weights(self, m: int, rng: np.random.Generator, sparsity: float = 3.0) -> np.ndarray:
        return self.repair_many(rng.random((m, self.n)) ** sparsity)

    # -------------------------------------------------------------- evaluation
    def evaluate(self, W: np.ndarray) -> np.ndarray:
        W = np.atleast_2d(W)
        self.n_evals += len(W)
        P = self.R @ W.T                                   # (T, m) daily portfolio returns
        mu = P.mean(0) * self.periods
        sd = P.std(0, ddof=1) * np.sqrt(self.periods)
        k = max(1, int(np.ceil(self.cvar_alpha * self.T)))
        cvar = -np.sort(P, axis=0)[:k].mean(0)
        return np.column_stack([-mu, sd, cvar])

    def sharpe(self, F: np.ndarray) -> np.ndarray:
        """Sharpe ratio of objective rows."""
        return (-F[:, 0] - self.risk_free) / np.maximum(F[:, 1], 1e-12)
