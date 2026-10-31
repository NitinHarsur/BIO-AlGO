"""NSGA-II style genetic algorithm with real-coded SBX crossover and portfolio-aware mutation."""

from __future__ import annotations

import numpy as np

from .pareto import fast_nondominated_sort, crowding_distance, nondominated_mask
from .problem import OptResult, PortfolioProblem


class NSGA2:
    def __init__(self, pop_size=100, generations=200, p_cross=0.9, eta_c=15.0,
                 eta_m=20.0, p_swap=0.2, seed=0):
        self.pop_size, self.generations = pop_size, generations
        self.p_cross, self.eta_c, self.eta_m, self.p_swap = p_cross, eta_c, eta_m, p_swap
        self.seed = seed

    @staticmethod
    def _rank_and_crowd(F):
        ranks = fast_nondominated_sort(F)
        crowd = np.zeros(len(F))
        for r in np.unique(ranks):
            m = np.where(ranks == r)[0]
            crowd[m] = crowding_distance(F[m])
        return ranks, crowd

    def _tournament(self, ranks, crowd, m, rng):
        a, b = rng.integers(len(ranks), size=(2, m))
        better_a = (ranks[a] < ranks[b]) | ((ranks[a] == ranks[b]) & (crowd[a] >= crowd[b]))
        return np.where(better_a, a, b)

    def _crossover(self, P1, P2, rng):
        m, n = P1.shape
        u = rng.random((m, n))
        beta = np.where(u <= 0.5, (2 * u) ** (1 / (self.eta_c + 1)),
                        (1 / (2 * (1 - u) + 1e-12)) ** (1 / (self.eta_c + 1)))
        C1 = 0.5 * ((1 + beta) * P1 + (1 - beta) * P2)
        C2 = 0.5 * ((1 - beta) * P1 + (1 + beta) * P2)
        do = (rng.random((m, 1)) < self.p_cross) & (rng.random((m, n)) < 0.5)
        return np.where(do, C1, P1), np.where(do, C2, P2)

    def _mutate(self, X, rng):
        m, n = X.shape
        u = rng.random((m, n))
        delta = np.where(u < 0.5, (2 * u) ** (1 / (self.eta_m + 1)) - 1,
                         1 - (2 * (1 - u)) ** (1 / (self.eta_m + 1)))
        X = X + delta * (rng.random((m, n)) < 1.0 / n) * 0.5
        # Swap mutation: move a holding's weight to a different asset.
        for i in np.where(rng.random(m) < self.p_swap)[0]:
            held = np.where(X[i] > 1e-9)[0]
            if len(held):
                src, dst = rng.choice(held), rng.integers(n)
                X[i, dst] += X[i, src]
                X[i, src] = 0.0
        return X

    def run(self, problem: PortfolioProblem, callback=None) -> OptResult:
        rng = np.random.default_rng(self.seed)
        n0 = problem.n_evals
        P = self.pop_size
        X = problem.random_weights(P, rng)
        F = problem.evaluate(X)
        history = [float(problem.sharpe(F).max())]
        if callback:
            callback(0, self.generations, F, F[nondominated_mask(F)])

        for gen in range(self.generations):
            ranks, crowd = self._rank_and_crowd(F)
            p1 = self._tournament(ranks, crowd, P, rng)
            p2 = self._tournament(ranks, crowd, P, rng)
            C1, C2 = self._crossover(X[p1], X[p2], rng)
            kids = np.vstack([C1, C2])[rng.permutation(2 * P)[:P]]
            kids = problem.repair_many(self._mutate(kids, rng))
            Fk = problem.evaluate(kids)

            XA, FA = np.vstack([X, kids]), np.vstack([F, Fk])
            ranks, crowd = self._rank_and_crowd(FA)
            order = np.lexsort((-crowd, ranks))[:P]       # rank asc, crowding desc
            X, F = XA[order], FA[order]
            history.append(float(problem.sharpe(F).max()))
            if callback:
                callback(gen + 1, self.generations, F, F[ranks[order] == 0])

        keep = nondominated_mask(F)
        _, uniq = np.unique(np.round(F[keep], 10), axis=0, return_index=True)
        return OptResult(X[keep][uniq], F[keep][uniq], problem.n_evals - n0, history, "GA")
