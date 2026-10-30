"""Multi-objective Particle Swarm Optimisation (MOPSO) with a crowding-pruned archive."""

from __future__ import annotations

import numpy as np

from .pareto import nondominated_mask, crowding_distance, truncate_by_crowding, dominates
from .problem import OptResult, PortfolioProblem


class MOPSO:
    def __init__(self, n_particles=100, iters=200, archive_size=100,
                 w_start=0.9, w_end=0.4, c1=1.5, c2=1.5, v_max=0.3,
                 turbulence=0.10, seed=0):
        self.n_particles, self.iters, self.archive_size = n_particles, iters, archive_size
        self.w_start, self.w_end, self.c1, self.c2 = w_start, w_end, c1, c2
        self.v_max, self.turbulence = v_max, turbulence
        self.seed = seed

    def _update_archive(self, AW, AF, W, F):
        AW, AF = np.vstack([AW, W]), np.vstack([AF, F])
        keep = nondominated_mask(AF)
        AW, AF = AW[keep], AF[keep]
        _, uniq = np.unique(np.round(AF, 10), axis=0, return_index=True)
        AW, AF = AW[uniq], AF[uniq]
        if len(AF) > self.archive_size:
            k = truncate_by_crowding(AF, self.archive_size)
            AW, AF = AW[k], AF[k]
        return AW, AF

    def run(self, problem: PortfolioProblem) -> OptResult:
        rng = np.random.default_rng(self.seed)
        n0 = problem.n_evals
        P, N = self.n_particles, problem.n

        X = problem.random_weights(P, rng)
        V = rng.uniform(-0.1, 0.1, (P, N))
        F = problem.evaluate(X)
        PB, PBF = X.copy(), F.copy()
        AW, AF = self._update_archive(np.empty((0, N)), np.empty((0, 3)), X, F)
        history = [float(problem.sharpe(AF).max())]

        for it in range(self.iters):
            w = self.w_start - (self.w_start - self.w_end) * it / max(1, self.iters - 1)

            # Leader selection: binary tournament on archive crowding distance.
            cd = crowding_distance(AF)
            cd = np.where(np.isinf(cd), np.nanmax(cd[np.isfinite(cd)], initial=1.0) * 2, cd)
            a, b = rng.integers(len(AF), size=(2, P))
            leaders = AW[np.where(cd[a] >= cd[b], a, b)]

            r1, r2 = rng.random((2, P, N))
            V = w * V + self.c1 * r1 * (PB - X) + self.c2 * r2 * (leaders - X)
            V = np.clip(V, -self.v_max, self.v_max)
            Xn = X + V

            # Turbulence (mutation) keeps the swarm from collapsing onto few holdings.
            turb = rng.random(P) < self.turbulence
            if turb.any():
                noise = rng.normal(0, 0.1, (P, N)) * (rng.random((P, N)) < 0.3)
                Xn[turb] += noise[turb]

            X = problem.repair_many(Xn)
            F = problem.evaluate(X)

            for i in range(P):
                if dominates(F[i], PBF[i]) or (not dominates(PBF[i], F[i]) and rng.random() < 0.5):
                    PB[i], PBF[i] = X[i], F[i]

            AW, AF = self._update_archive(AW, AF, X, F)
            history.append(float(problem.sharpe(AF).max()))

        return OptResult(AW, AF, problem.n_evals - n0, history, "PSO")
