"""Reference strategies to judge the metaheuristics against."""

from __future__ import annotations

import numpy as np

from .pareto import nondominated_mask
from .problem import OptResult, PortfolioProblem


def equal_weight(problem: PortfolioProblem) -> np.ndarray:
    return np.full(problem.n, 1.0 / problem.n)


def random_search(problem: PortfolioProblem, n_evals: int, seed: int = 0) -> OptResult:
    """Sample feasible portfolios uniformly-ish and keep the non-dominated set."""
    rng = np.random.default_rng(seed)
    n0 = problem.n_evals
    W = problem.random_weights(n_evals, rng, sparsity=float(rng.choice([1.0, 3.0])))
    F = problem.evaluate(W)
    keep = nondominated_mask(F)
    return OptResult(W[keep], F[keep], problem.n_evals - n0, [], "Random")
