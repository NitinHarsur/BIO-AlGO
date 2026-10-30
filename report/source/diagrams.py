import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Polygon

plt.rcParams.update({"font.family": "Liberation Serif", "font.size": 11})
import os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fig") + "/"
INK, FILL, FILL2 = "#111111", "#f2f2f2", "#dfe6f5"


def box(ax, x, y, w, h, text, fill=FILL, bold=False, fs=10.5):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.08", fc=fill, ec=INK, lw=1.1))
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", fontsize=fs, fontweight="bold" if bold else "normal", linespacing=1.25)


def arrow(ax, p, q, text=None, both=False, side="top"):
    ax.add_patch(FancyArrowPatch(p, q, arrowstyle="<|-|>" if both else "-|>", mutation_scale=12, lw=1.1, color=INK, shrinkA=0, shrinkB=0))
    if text:
        mx, my = (p[0] + q[0]) / 2, (p[1] + q[1]) / 2
        ax.text(mx + 0.06, my, text, fontsize=9, va="center", ha="left", style="italic")


def diamond(ax, cx, cy, w, h, text, fs=10):
    ax.add_patch(Polygon([(cx, cy + h / 2), (cx + w / 2, cy), (cx, cy - h / 2), (cx - w / 2, cy)], fc="#fff8e1", ec=INK, lw=1.1))
    ax.text(cx, cy, text, ha="center", va="center", fontsize=fs, linespacing=1.2)


def canvas(w, h):
    fig, ax = plt.subplots(figsize=(w, h))
    ax.set_xlim(0, w); ax.set_ylim(0, h); ax.axis("off")
    return fig, ax


# ------------------------------------------------------------ architecture
fig, ax = canvas(8.6, 6.4)
ax.add_patch(FancyBboxPatch((0.2, 5.0), 8.2, 1.25, boxstyle="round,pad=0.02,rounding_size=0.08", fc="#eef3ff", ec=INK, lw=1.1))
ax.text(0.4, 6.05, "Presentation layer (browser, no build step)", fontsize=10.5, fontweight="bold", va="center")
for x, t in [(0.45, "Control panel\n(data, constraints,\nbudget)"), (2.43, "Live swarm canvas\n(risk-return scatter)"), (4.41, "Portfolio inspector\n(weights, metrics)"), (6.39, "Wealth and\nconvergence charts")]:
    box(ax, x, 5.08, 1.8, 0.72, t, fill="white", fs=9)
ax.add_patch(FancyBboxPatch((0.2, 3.25), 8.2, 1.2, boxstyle="round,pad=0.02,rounding_size=0.08", fc="#f6f6f6", ec=INK, lw=1.1))
ax.text(0.4, 4.25, "Service layer (server.py, Python standard library)", fontsize=10.5, fontweight="bold", va="center")
for x, t in [(0.45, "POST /api/run\n(start a job)"), (2.43, "GET /api/jobs/<id>\n(progress, result)"), (4.41, "POST /api/jobs/<id>\n/cancel"), (6.39, "Job manager\n(worker threads)")]:
    box(ax, x, 3.33, 1.8, 0.62, t, fill="white", fs=9)
ax.add_patch(FancyBboxPatch((0.2, 0.2), 8.2, 2.7, boxstyle="round,pad=0.02,rounding_size=0.08", fc="#f6f6f6", ec=INK, lw=1.1))
ax.text(0.4, 2.7, "Optimisation core (swarmfolio package, NumPy)", fontsize=10.5, fontweight="bold", va="center")
box(ax, 0.45, 1.55, 1.8, 0.8, "PortfolioProblem\nrepair + 3 objectives", fill="white", fs=9)
box(ax, 2.43, 1.55, 1.8, 0.8, "MOPSO\n(pso.py)", fill="white", fs=9)
box(ax, 4.41, 1.55, 1.8, 0.8, "NSGA-II\n(ga.py)", fill="white", fs=9)
box(ax, 6.39, 1.55, 1.8, 0.8, "Pareto utilities\n(pareto.py)", fill="white", fs=9)
box(ax, 0.45, 0.35, 1.8, 0.8, "Data\n(synthetic, CSV)", fill="white", fs=9)
box(ax, 2.43, 0.35, 1.8, 0.8, "Baselines\n(equal weight, random)", fill="white", fs=8.6)
box(ax, 4.41, 0.35, 3.78, 0.8, "Back-test and metrics (backtest.py)\nselection rules, Sharpe, drawdown, walk-forward", fill="white", fs=9)
arrow(ax, (4.3, 5.0), (4.3, 4.45), "JSON over HTTP", both=True)
arrow(ax, (4.3, 3.25), (4.3, 2.9), "calls", both=True)
fig.savefig(OUT + "fig_architecture.png", dpi=200, bbox_inches="tight"); plt.close(fig)


# ------------------------------------------------------------ PSO flowchart
fig, ax = canvas(5.6, 8.4)
cx = 2.8
steps = [(7.9, "Start: load returns, build problem\n(constraints, objectives)"),
         (6.85, "Initialise N particles with feasible\nweights (repair) and random velocities"),
         (5.8, "Evaluate objectives; set personal bests;\nbuild non-dominated archive")]
for y, t in steps:
    box(ax, cx - 2.2, y - 0.4, 4.4, 0.8, t, fs=9.5)
box(ax, cx - 2.2, 4.75 - 0.4, 4.4, 0.8, "Pick a leader per particle by binary\ntournament on archive crowding distance", fs=9.5)
box(ax, cx - 2.2, 3.7 - 0.4, 4.4, 0.8, "Update velocity (inertia, personal,\nleader terms) and position; add turbulence", fs=9.5)
box(ax, cx - 2.2, 2.65 - 0.4, 4.4, 0.8, "Repair positions to feasible weights;\nevaluate; update personal bests", fs=9.5)
box(ax, cx - 2.2, 1.6 - 0.4, 4.4, 0.8, "Merge into archive; drop dominated and\nduplicate points; prune by crowding", fs=9.5)
diamond(ax, cx, 0.55, 3.4, 0.95, "Iterations\nfinished?", fs=9.5)
ys = [7.5, 6.45, 5.4, 4.35, 3.3, 2.25, 1.2]
for a_, b_ in zip(ys[:-1], [6.85 + .4, 5.8 + .4, 4.75 + .4, 3.7 + .4, 2.65 + .4, 1.6 + .4][:]):
    pass
arrow(ax, (cx, 7.5), (cx, 7.25)); arrow(ax, (cx, 6.45), (cx, 6.2)); arrow(ax, (cx, 5.4), (cx, 5.15))
arrow(ax, (cx, 4.35), (cx, 4.1)); arrow(ax, (cx, 3.3), (cx, 3.05)); arrow(ax, (cx, 2.25), (cx, 2.0)); arrow(ax, (cx, 1.2), (cx, 1.03))
ax.plot([cx + 1.7, 5.3, 5.3], [0.55, 0.55, 4.75], color=INK, lw=1.1); arrow(ax, (5.3, 4.75), (cx + 2.2, 4.75))
ax.text(cx + 1.75, 0.68, "no", fontsize=9, style="italic")
ax.text(cx - 0.25, -0.2, "yes: return archive (Pareto front)", fontsize=9, style="italic", ha="center")
fig.savefig(OUT + "fig_flow_pso.png", dpi=200, bbox_inches="tight"); plt.close(fig)


# ------------------------------------------------------------ NSGA-II flowchart
fig, ax = canvas(5.6, 8.4)
items = [(7.9, "Start: build problem and parameters"),
         (6.85, "Initialise population of P feasible\nportfolios; evaluate"),
         (5.8, "Non-dominated sort and crowding distance;\nbinary tournament selection (rank, crowding)"),
         (4.75, "SBX crossover on weight vectors;\npolynomial and swap mutation"),
         (3.7, "Repair offspring to feasible weights;\nevaluate offspring"),
         (2.65, "Merge parents and offspring (2P);\nsort into fronts"),
         (1.6, "Keep best P by rank, then by crowding\ndistance (elitist survival)")]
for y, t in items:
    box(ax, cx - 2.2, y - 0.4, 4.4, 0.8, t, fs=9.5)
for y in (7.5, 6.45, 5.4, 4.35, 3.3, 2.25):
    arrow(ax, (cx, y), (cx, y - 0.25))
arrow(ax, (cx, 1.2), (cx, 1.03))
diamond(ax, cx, 0.55, 3.4, 0.95, "Generations\nfinished?", fs=9.5)
ax.plot([cx + 1.7, 5.3, 5.3], [0.55, 0.55, 5.8], color=INK, lw=1.1); arrow(ax, (5.3, 5.8), (cx + 2.2, 5.8))
ax.text(cx + 1.75, 0.68, "no", fontsize=9, style="italic")
ax.text(cx - 0.25, -0.2, "yes: return rank-0 front", fontsize=9, style="italic", ha="center")
fig.savefig(OUT + "fig_flow_ga.png", dpi=200, bbox_inches="tight"); plt.close(fig)


# ------------------------------------------------------------ repair operator
fig, ax = canvas(12.1, 2.4)
labels = ["Raw vector x\n(any real values)", "Clip negatives\nto zero", "Keep the K largest\n(cardinality)", "Drop weights below\nminimum size", "Activate extra assets\nif cap needs more", "Cap at w_max and\nredistribute excess", "Feasible weights\n(sum = 1)"]
w, gap = 1.5, 0.2
for i, t in enumerate(labels):
    x = 0.1 + i * (w + gap)
    box(ax, x, 0.6, w, 1.1, t, fill=FILL2 if i in (0, 6) else FILL, fs=9)
    if i:
        arrow(ax, (x - gap, 1.15), (x, 1.15))
fig.savefig(OUT + "fig_repair.png", dpi=200, bbox_inches="tight"); plt.close(fig)


# ------------------------------------------------------------ work plan (Gantt)
tasks = [("Problem study and literature survey", 1, 3), ("Requirements and design", 3, 5), ("Problem model and repair operator", 4, 6),
         ("MOPSO implementation", 5, 8), ("NSGA-II implementation", 6, 9), ("Baselines, metrics and back-test", 8, 10),
         ("Web frontend and API", 9, 12), ("Experiments and analysis", 11, 14), ("Testing and report writing", 12, 15)]
fig, ax = plt.subplots(figsize=(8.6, 3.9))
for i, (t, a, b) in enumerate(tasks):
    ax.barh(len(tasks) - 1 - i, b - a, left=a, color="#8da2d6", edgecolor=INK, height=0.55)
ax.set_yticks(range(len(tasks))); ax.set_yticklabels([t for t, _, _ in tasks][::-1], fontsize=9.5)
ax.set_xlim(1, 15); ax.set_xticks(range(1, 16)); ax.set_xlabel("Week")
ax.grid(axis="x", alpha=0.3); ax.set_axisbelow(True)
for s in ("top", "right"): ax.spines[s].set_visible(False)
fig.savefig(OUT + "fig_workplan.png", dpi=200, bbox_inches="tight"); plt.close(fig)
print("ok")
