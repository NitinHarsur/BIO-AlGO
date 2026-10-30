"""Market data: a reproducible synthetic generator and a CSV price loader."""

from __future__ import annotations

import numpy as np
import pandas as pd


def synthetic_market(
    n_assets: int = 20,
    n_days: int = 1500,
    n_sectors: int = 4,
    seed: int = 0,
) -> pd.DataFrame:
    """Daily simple returns from a market + sector + idiosyncratic factor model.

    Fat tails (Student-t, df=5) and a volatility "crisis" regime in the middle
    of the sample make the problem non-trivial: CVaR and volatility disagree.
    """
    rng = np.random.default_rng(seed)

    def t_noise(size):
        df = 5
        return rng.standard_t(df, size) / np.sqrt(df / (df - 2))

    market = 0.07 / 252 + 0.009 * t_noise(n_days)
    sector_f = 0.005 * t_noise((n_days, n_sectors))
    sector_of = np.arange(n_assets) % n_sectors
    beta = rng.uniform(0.5, 1.4, n_assets)
    alpha = rng.uniform(-0.02, 0.10, n_assets) / 252
    idio_vol = rng.uniform(0.006, 0.020, n_assets)

    R = (
        alpha
        + np.outer(market, beta)
        + sector_f[:, sector_of]
        + idio_vol * t_noise((n_days, n_assets))
    )

    # Crisis regime: elevated volatility and negative drift for ~6% of the sample.
    c0, c1 = int(0.45 * n_days), int(0.51 * n_days)
    R[c0:c1] = R[c0:c1] * 2.2 - 0.0015 * beta
    R = np.maximum(R, -0.5)

    idx = pd.bdate_range("2018-01-01", periods=n_days)
    cols = [f"S{sector_of[i]}_A{i:02d}" for i in range(n_assets)]
    return pd.DataFrame(R, index=idx, columns=cols)


def load_prices_csv(path: str, date_col: str = "Date", max_na_frac: float = 0.05) -> pd.DataFrame:
    """Load a wide CSV of adjusted close prices (one column per ticker) -> daily returns."""
    px = pd.read_csv(path, parse_dates=[date_col], index_col=date_col).sort_index()
    px = px.dropna(axis=1, thresh=int((1 - max_na_frac) * len(px)))
    px = px.ffill().dropna()
    rets = px.pct_change().dropna()
    if rets.shape[1] < 2:
        raise ValueError("Need at least two assets with enough price history.")
    return rets
