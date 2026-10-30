"""Pareto utilities (all objectives minimised)."""

from __future__ import annotations

import numpy as np


def nondominated_mask(F: np.ndarray) -> np.ndarray:
    F = np.asarray(F)
    keep = np.ones(len(F), dtype=bool)
    for i in range(len(F)):
        if np.any(np.all(F <= F[i], axis=1) & np.any(F < F[i], axis=1)):
            keep[i] = False
    return keep


def dominates(a: np.ndarray, b: np.ndarray) -> bool:
    return bool(np.all(a <= b) and np.any(a < b))


def fast_nondominated_sort(F: np.ndarray) -> np.ndarray:
    """Return the front rank (0 = best) of every row."""
    n = len(F)
    le = np.all(F[:, None, :] <= F[None, :, :], axis=2)
    lt = np.any(F[:, None, :] < F[None, :, :], axis=2)
    dom = le & lt                       # dom[i, j]: i dominates j
    count = dom.sum(axis=0)             # number of solutions dominating j
    ranks = np.full(n, -1)
    current = np.where(count == 0)[0]
    r = 0
    while current.size:
        ranks[current] = r
        count = count - dom[current].sum(axis=0)
        count[current] = -1
        current = np.where(count == 0)[0]
        r += 1
    return ranks


def crowding_distance(F: np.ndarray) -> np.ndarray:
    n, m = F.shape
    d = np.zeros(n)
    if n <= 2:
        d[:] = np.inf
        return d
    for j in range(m):
        order = np.argsort(F[:, j])
        span = F[order[-1], j] - F[order[0], j]
        d[order[0]] = d[order[-1]] = np.inf
        if span > 0:
            d[order[1:-1]] += (F[order[2:], j] - F[order[:-2], j]) / span
    return d


def truncate_by_crowding(F: np.ndarray, size: int) -> np.ndarray:
    """Indices of `size` rows kept after repeatedly dropping the most crowded one."""
    idx = np.arange(len(F))
    while len(idx) > size:
        cd = crowding_distance(F[idx])
        idx = np.delete(idx, int(np.argmin(cd)))
    return idx


def hypervolume(F: np.ndarray, ideal: np.ndarray, ref: np.ndarray,
                n_samples: int = 100_000, seed: int = 0) -> float:
    """Monte-Carlo hypervolume as a fraction of the [ideal, ref] box (in 0..1)."""
    F = np.asarray(F)
    F = F[np.all(F <= ref, axis=1)]
    if len(F) == 0:
        return 0.0
    rng = np.random.default_rng(seed)
    S = ideal + rng.random((n_samples, F.shape[1])) * (ref - ideal)
    covered = np.zeros(n_samples, dtype=bool)
    for p in F:
        covered |= np.all(S >= p, axis=1)
    return float(covered.mean())


def spacing(F: np.ndarray) -> float:
    """Schott's spacing metric on range-normalised objectives (lower = more even)."""
    if len(F) < 3:
        return float("nan")
    span = np.ptp(F, axis=0)
    Z = (F - F.min(0)) / np.where(span > 0, span, 1.0)
    D = np.abs(Z[:, None, :] - Z[None, :, :]).sum(2)
    np.fill_diagonal(D, np.inf)
    d = D.min(1)
    return float(np.sqrt(((d - d.mean()) ** 2).sum() / (len(d) - 1)))
