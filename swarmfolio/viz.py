"""Plots for the SwarmFolio report (matplotlib, headless)."""

from __future__ import annotations

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

COLORS = {"PSO": "#1f77b4", "GA": "#d62728", "Random": "#9aa0a6", "Equal weight": "#2ca02c"}


def plot_fronts(results, asset_stats, eq_point, path):
    fig, ax = plt.subplots(1, 2, figsize=(12, 4.8))
    for name, res in results.items():
        F = res.objs
        ax[0].scatter(F[:, 1], -F[:, 0], s=14, c=COLORS[name], label=f"{name} ({len(F)})", alpha=.8)
        ax[1].scatter(F[:, 2], -F[:, 0], s=14, c=COLORS[name], label=name, alpha=.8)
    mu, sd = asset_stats
    ax[0].scatter(sd, mu, marker="x", c="k", s=25, label="single assets")
    ax[0].scatter(eq_point[1], -eq_point[0], marker="*",
                  s=200, c=COLORS["Equal weight"], label="Equal weight", zorder=5)
    ax[1].scatter(eq_point[2], -eq_point[0], marker="*", s=200, c=COLORS["Equal weight"], zorder=5)
    ax[0].set(xlabel="Annual volatility", ylabel="Annual return", title="Risk-return front (train)")
    ax[1].set(xlabel="Daily CVaR (5%)", ylabel="Annual return", title="Tail-risk-return front (train)")
    ax[0].legend(fontsize=8)
    for a in ax:
        a.grid(alpha=.3)
    fig.tight_layout(); fig.savefig(path, dpi=130); plt.close(fig)


def plot_convergence(results, path):
    fig, ax = plt.subplots(figsize=(6.5, 4.2))
    for name, res in results.items():
        if res.history:
            ax.plot(res.history, label=name, c=COLORS[name])
    ax.set(xlabel="Iteration / generation", ylabel="Best Sharpe on front (train)", title="Convergence")
    ax.legend(); ax.grid(alpha=.3)
    fig.tight_layout(); fig.savefig(path, dpi=130); plt.close(fig)


def plot_wealth(curves: dict, path, title="Out-of-sample wealth"):
    fig, ax = plt.subplots(figsize=(9, 4.5))
    for name, s in curves.items():
        w = (1 + s).cumprod()
        ax.plot(w.index, w.values, label=name)
    ax.set(ylabel="Growth of 1", title=title)
    ax.legend(fontsize=8); ax.grid(alpha=.3)
    fig.tight_layout(); fig.savefig(path, dpi=130); plt.close(fig)


def plot_weights(weights: dict, names, path):
    fig, ax = plt.subplots(figsize=(11, 4.2))
    x = np.arange(len(names)); width = 0.8 / len(weights)
    for i, (k, w) in enumerate(weights.items()):
        ax.bar(x + i * width, w, width, label=k)
    ax.set_xticks(x + 0.4 - width / 2); ax.set_xticklabels(names, rotation=70, fontsize=7)
    ax.set(ylabel="Weight", title="Max-Sharpe portfolios (selected on train)")
    ax.legend(); ax.grid(alpha=.3, axis="y")
    fig.tight_layout(); fig.savefig(path, dpi=130); plt.close(fig)
