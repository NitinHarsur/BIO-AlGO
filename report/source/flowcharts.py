import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Polygon

plt.rcParams.update({"font.family": "Liberation Serif"})
INK, FILL = "#111111", "#f2f2f2"
FS = 7.6


def flow(ax, x0, title, steps, loop_to, final_text, decision):
    cx, w, h, gap = x0 + 1.5, 2.7, 0.5, 0.17
    top = 5.25
    ax.text(cx, 5.72, title, ha="center", va="center", fontsize=9.5, fontweight="bold")
    ys = [top - i * (h + gap) for i in range(len(steps))]
    for y, t in zip(ys, steps):
        ax.add_patch(FancyBboxPatch((cx - w / 2, y - h / 2), w, h, boxstyle="round,pad=0.01,rounding_size=0.06", fc=FILL, ec=INK, lw=0.9))
        ax.text(cx, y, t, ha="center", va="center", fontsize=FS, linespacing=1.2)
    for a, b in zip(ys[:-1], ys[1:]):
        ax.add_patch(FancyArrowPatch((cx, a - h / 2), (cx, b + h / 2), arrowstyle="-|>", mutation_scale=8, lw=0.9, color=INK))
    dy = ys[-1] - h / 2 - gap - 0.36
    ax.add_patch(FancyArrowPatch((cx, ys[-1] - h / 2), (cx, dy + 0.36), arrowstyle="-|>", mutation_scale=8, lw=0.9, color=INK))
    ax.add_patch(Polygon([(cx, dy + 0.36), (cx + 1.0, dy), (cx, dy - 0.36), (cx - 1.0, dy)], fc="#fff8e1", ec=INK, lw=0.9))
    ax.text(cx, dy, decision, ha="center", va="center", fontsize=FS, linespacing=1.15)
    lx = cx + 1.42
    ax.plot([cx + 1.0, lx, lx], [dy, dy, ys[loop_to]], color=INK, lw=0.9)
    ax.add_patch(FancyArrowPatch((lx, ys[loop_to]), (cx + w / 2, ys[loop_to]), arrowstyle="-|>", mutation_scale=8, lw=0.9, color=INK))
    ax.text(cx + 1.05, dy + 0.1, "no", fontsize=FS - 0.6, style="italic")
    ax.text(cx, dy - 0.5, final_text, ha="center", va="center", fontsize=FS - 0.4, style="italic")


fig, ax = plt.subplots(figsize=(6.4, 5.9))
ax.set_xlim(0, 6.4); ax.set_ylim(0.0, 6.0); ax.axis("off")
flow(ax, 0.0, "(a) MOPSO", [
    "Build problem; start N particles\nwith feasible weights (repair)",
    "Evaluate; set personal bests;\nfill the non-dominated archive",
    "Pick a leader per particle from the\narchive (crowding tournament)",
    "Update velocity and position;\nadd turbulence",
    "Repair to feasible weights;\nevaluate; update personal bests",
    "Merge into archive; drop dominated\nand duplicates; prune by crowding"], 2, "yes: return the archive (Pareto front)", "Iterations\nfinished?")
flow(ax, 3.2, "(b) NSGA-II", [
    "Build problem; start P feasible\nportfolios; evaluate",
    "Non-dominated sort; crowding\ndistance",
    "Tournament selection\n(rank, then crowding)",
    "SBX crossover, polynomial and\nswap mutation",
    "Repair offspring; evaluate",
    "Merge parents + offspring; keep\nbest P by rank, then crowding"], 1, "yes: return the rank-0 front", "Generations\nfinished?")
fig.savefig("fig/fig_flowcharts.png", dpi=250, bbox_inches="tight"); plt.close(fig)
print("ok")
