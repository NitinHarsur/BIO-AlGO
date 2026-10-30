"""SwarmFolio: multi-objective portfolio optimization with PSO and GA."""

from .problem import PortfolioProblem, OptResult
from .pso import MOPSO
from .ga import NSGA2
from .data import synthetic_market, load_prices_csv

__all__ = [
    "PortfolioProblem",
    "OptResult",
    "MOPSO",
    "NSGA2",
    "synthetic_market",
    "load_prices_csv",
]
__version__ = "0.1.0"
