# SwarmFolio

Multi-objective stock portfolio optimization using **Particle Swarm Optimization (MOPSO)** and a
**Genetic Algorithm (NSGA-II)**, compared head-to-head against random search and an equal-weight
benchmark.

## What it optimizes

Three objectives, all optimized simultaneously (the result is a Pareto front, not one portfolio):

| Objective | Direction |
|---|---|
| Annualized mean return | maximize |
| Annualized volatility | minimize |
| CVaR (5%) – average loss on the worst 5% of days | minimize |

Constraints (long-only, fully invested, per-asset cap, optional max number of holdings, minimum
holding size) are enforced by a shared **repair operator**, so both algorithms only ever evaluate
feasible portfolios.

## Algorithms

- **MOPSO** (`swarmfolio/pso.py`): particles move toward their personal best and a leader drawn from an
  external non-dominated archive (binary tournament on crowding distance); linearly decaying inertia,
  turbulence mutation, crowding-pruned archive.
- **NSGA-II** (`swarmfolio/ga.py`): fast non-dominated sorting + crowding distance, binary tournament,
  SBX crossover, polynomial mutation, and a swap mutation that moves one holding's weight to another asset.
- **Baselines** (`swarmfolio/baselines.py`): equal weight, and random search with the same evaluation budget.

## Quick start

```bash
pip install -e ".[dev]"
python -m swarmfolio --out results                    # synthetic market, 20 assets
python -m swarmfolio --walk-forward --cardinality 8   # + rolling re-optimization backtest, max 8 holdings
python -m swarmfolio --csv prices.csv                 # your own prices: Date column + one column per ticker
python -m pytest
```

Outputs in `results/`: `algorithm_comparison.csv` (hypervolume, spacing, front size, over several seeds),
`out_of_sample.csv` (selected portfolios on held-out data), `front_pso.csv` / `front_ga.csv` (full fronts
with weights), `walk_forward.csv`, and plots (`pareto_fronts.png`, `convergence.png`, `oos_wealth.png`,
`weights.png`).

From each front, three portfolios are picked on the training window: max-Sharpe, min-volatility and
the "knee" (closest to the ideal point), then evaluated on the held-out test period.

## Use as a library

```python
from swarmfolio import PortfolioProblem, MOPSO, NSGA2, synthetic_market
rets = synthetic_market(20, 1500, seed=0)
prob = PortfolioProblem(rets.to_numpy(), max_weight=0.3, cardinality=8)
front = MOPSO(100, 150).run(prob)       # or NSGA2(100, 150).run(prob)
print(front.objs.shape, front.weights.shape)
```

## Notes and limits

- Default data is a **synthetic** factor-model market (fat tails, a crisis regime) so the project runs offline;
  real data works through `--csv`.
- Out-of-sample results on a single synthetic path are noisy and should not be read as evidence that one
  method earns more money. The measurable claim is front quality (hypervolume) versus random search.
- Walk-forward assumes constant target weights between rebalances and a flat transaction cost on turnover.
- This is a research/teaching tool, not investment advice.
