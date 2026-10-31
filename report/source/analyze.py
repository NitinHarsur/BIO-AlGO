import json, os, sys
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from scipy import stats
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from swarmfolio.pareto import hypervolume

plt.rcParams.update({"font.family": "Liberation Serif", "font.size": 11, "axes.spines.top": False, "axes.spines.right": False,
                     "axes.grid": True, "grid.alpha": 0.25, "figure.dpi": 100})
D, F = "data/", "fig/"
COL = {"PSO": "#2336e5", "GA": "#c4560b", "Random": "#7b8798", "EW": "#1b7f3b"}
MK = {"PSO": "o", "GA": "s", "Random": "^"}
facts = {}
TM = json.load(open(D + "timing.json"))
def tmean(n, a): return float(np.mean([r["seconds"] for r in TM if r["n"] == n and r["alg"] == a]))


def pct(x, d=1): return f"{x*100:.{d}f}%"
def f3(x): return f"{x:.3f}"
def pv(p): return "< 0.001" if p < 0.001 else f"{p:.3f}"


# ------------------------------------------------------------------ E1 main
m = json.load(open(D + "main.json")); rows, det = m["rows"], m["detail"]
def col(alg, k): return np.array([r[k] for r in sorted([x for x in rows if x["alg"] == alg], key=lambda r: r["seed"])])
t1 = []
for a in ("PSO", "GA", "Random"):
    t1.append([{"PSO": "Particle swarm (MOPSO)", "GA": "Genetic algorithm (NSGA-II)", "Random": "Random search"}[a],
               f"{col(a,'hv').mean():.3f} ± {col(a,'hv').std(ddof=1):.3f}", f"{col(a,'size').mean():.1f}", f"{col(a,'spacing').mean():.4f}",
               f"{col(a,'best_sharpe').mean():.3f}", (f"{tmean(20, a):.1f}" if a != "Random" else "<0.1"), f"{int(col(a,'evals')[0]):,}"])
w_pg = stats.wilcoxon(col("PSO", "hv"), col("GA", "hv"))
facts["e1"] = {"table": t1, "p_pso_ga": pv(w_pg.pvalue), "diff_pso_ga": float((col("PSO", "hv") - col("GA", "hv")).mean()),
               "ga_wins": int(np.sum(col("GA", "hv") > col("PSO", "hv"))), "seeds": len(col("PSO", "hv")),
               "p_pso_rnd": pv(stats.wilcoxon(col("PSO", "hv"), col("Random", "hv")).pvalue),
               "p_ga_rnd": pv(stats.wilcoxon(col("GA", "hv"), col("Random", "hv")).pvalue),
               "spacing_p": pv(stats.wilcoxon(col("PSO", "spacing"), col("GA", "spacing")).pvalue),
               "hv": {a: [float(col(a, "hv").mean()), float(col(a, "hv").std(ddof=1))] for a in ("PSO", "GA", "Random")},
               "spacing": {a: float(col(a, "spacing").mean()) for a in ("PSO", "GA", "Random")},
               "sec": {a: tmean(20, a) for a in ("PSO", "GA")}}

# fronts figure
fig, ax = plt.subplots(1, 2, figsize=(10, 4.2))
mu, sd = np.array(det["asset_stats"]["mu"]), np.array(det["asset_stats"]["sd"])
for a in ("Random", "GA", "PSO"):
    o = np.array(det[a]["objs"])
    for i, (xi, nm) in enumerate(((1, "Annual volatility"), (2, "Daily CVaR (5%)"))):
        ax[i].scatter(o[:, xi], -o[:, 0], s=14 if a != "Random" else 20, c=COL[a], marker=MK[a], alpha=.85, label={"PSO": "MOPSO", "GA": "NSGA-II", "Random": "Random search"}[a], zorder=3 if a != "Random" else 2)
        ax[i].set_xlabel(nm); ax[i].set_ylabel("Annual return")
ax[0].scatter(sd, mu, marker="x", c="k", s=22, label="Single assets", zorder=2)
ew = det["EW"]["train_objs"]
ax[0].scatter(ew[1], -ew[0], marker="*", s=190, c=COL["EW"], label="Equal weight", zorder=5); ax[1].scatter(ew[2], -ew[0], marker="*", s=190, c=COL["EW"], zorder=5)
ax[0].legend(fontsize=8.5, frameon=False); ax[0].set_title("(a) Return against volatility", fontsize=11); ax[1].set_title("(b) Return against CVaR", fontsize=11)
fig.tight_layout(); fig.savefig(F + "fig_fronts_main.png", dpi=200); plt.close(fig)

# convergence + hv box
fig, ax = plt.subplots(1, 2, figsize=(10, 3.8), gridspec_kw={"width_ratios": [1.3, 1]})
for a in ("GA", "PSO"):
    ax[0].plot(det[a]["history"], color=COL[a], label={"PSO": "MOPSO", "GA": "NSGA-II"}[a], lw=1.8, ls="-" if a == "PSO" else "--")
ax[0].set_xlabel("Iteration / generation"); ax[0].set_ylabel("Best training Sharpe on front"); ax[0].legend(frameon=False); ax[0].set_title("(a) Convergence, seed 0", fontsize=11)
bp = ax[1].boxplot([col(a, "hv") for a in ("PSO", "GA", "Random")], tick_labels=["MOPSO", "NSGA-II", "Random"], patch_artist=True, widths=.55)
for patch, a in zip(bp["boxes"], ("PSO", "GA", "Random")): patch.set_facecolor(COL[a]); patch.set_alpha(.45)
for med in bp["medians"]: med.set_color("k")
ax[1].set_ylabel("Hypervolume"); ax[1].set_title(f"(b) Hypervolume, {facts['e1']['seeds']} seeds", fontsize=11)
fig.tight_layout(); fig.savefig(F + "fig_convergence_hv.png", dpi=200); plt.close(fig)
hist = {a: det[a]["history"] for a in ("PSO", "GA")}
def first_reach(h, frac=0.99): 
    tgt = frac * max(h); return int(next(i for i, v in enumerate(h) if v >= tgt))
facts["e1"]["conv99"] = {a: first_reach(hist[a]) for a in hist}
facts["e1"]["final_sharpe"] = {a: hist[a][-1] for a in hist}

# selected portfolios (seed 0)
sel = []
names = {"sharpe": "Best Sharpe", "minvol": "Lowest volatility", "knee": "Balanced"}
for a in ("PSO", "GA"):
    for h in ("sharpe", "minvol", "knee"):
        tr, te = det[a]["train"][h], det[a]["test"][h]
        sel.append([f"{'MOPSO' if a=='PSO' else 'NSGA-II'} {names[h].lower()}", str(det[a]["holdings"][h]), pct(tr["ret"]), pct(tr["vol"]), f3(tr["ret"] / tr["vol"]),
                    pct(te["cagr"]), pct(te["volatility"]), f3(te["sharpe"]), pct(te["max_drawdown"])])
e = det["EW"]["test"]; eo = det["EW"]["train_objs"]
sel.append(["Equal weight", "20", pct(-eo[0]), pct(eo[1]), f3(-eo[0] / eo[1]), pct(e["cagr"]), pct(e["volatility"]), f3(e["sharpe"]), pct(e["max_drawdown"])])
facts["selected"] = sel
facts["n_train"], facts["n_test"] = det["n_train"], det["n_test"]
facts["asset_ranges"] = {"mu": [min(mu), max(mu)], "sd": [min(sd), max(sd)]}
facts["ew_test_sharpe"] = e["sharpe"]

# weights + wealth fig
assets = det["assets"]
fig, ax = plt.subplots(1, 2, figsize=(10, 3.9), gridspec_kw={"width_ratios": [1.1, 1.2]})
Wp = np.array(det["PSO"]["weights"])[det["PSO"]["picks"]["sharpe"]]; Wg = np.array(det["GA"]["weights"])[det["GA"]["picks"]["sharpe"]]
idx = np.argsort(-(Wp + Wg))[:10]; x = np.arange(len(idx))
ax[0].bar(x - .2, Wp[idx], .4, color=COL["PSO"], label="MOPSO"); ax[0].bar(x + .2, Wg[idx], .4, color=COL["GA"], label="NSGA-II")
ax[0].set_xticks(x); ax[0].set_xticklabels([assets[i] for i in idx], rotation=60, ha="right", fontsize=8.5); ax[0].set_ylabel("Weight"); ax[0].legend(frameon=False)
ax[0].set_title("(a) Best-Sharpe portfolios (top holdings)", fontsize=11)
for a, h, ls in (("PSO", "sharpe", "-"), ("GA", "sharpe", "--"), ("PSO", "minvol", "-"), ("GA", "minvol", "--")):
    ax[1].plot(det[a]["test_curves"][h], color=COL[a], ls=ls, lw=1.4 if h == "sharpe" else 1.0, alpha=1 if h == "sharpe" else .6,
               label=f"{'MOPSO' if a=='PSO' else 'NSGA-II'} {'best Sharpe' if h=='sharpe' else 'min vol.'}")
ax[1].plot(det["EW"]["test_curve"], color=COL["EW"], lw=1.6, label="Equal weight"); ax[1].axhline(1, color="grey", lw=.8, ls=":")
ax[1].set_xlabel("Held-out trading day"); ax[1].set_ylabel("Growth of 1"); ax[1].legend(fontsize=7.5, frameon=False, ncol=1); ax[1].set_title("(b) Held-out wealth, seed 0", fontsize=11)
fig.tight_layout(); fig.savefig(F + "fig_weights_wealth.png", dpi=200); plt.close(fig)

# ------------------------------------------------------------------ E2 constraints
c = json.load(open(D + "constraints.json"))
def cagg(k, a, v): 
    x = np.array([r[v] for r in c if r["card"] == k and r["alg"] == a]); return x.mean(), (x.std(ddof=1) if len(x) > 1 else 0)
t2, Ks = [], (20, 10, 8, 5)
for k in Ks:
    for a in ("PSO", "GA", "Random"):
        mh, sh = cagg(k, a, "hv"); ms = cagg(k, a, "best_sharpe")[0]
        mx = max(r["max_holdings"] for r in c if r["card"] == k and r["alg"] == a); mw = max(r["max_w"] for r in c if r["card"] == k and r["alg"] == a)
        t2.append(["None" if k == 20 else str(k), {"PSO": "MOPSO", "GA": "NSGA-II", "Random": "Random"}[a], f"{mh:.3f} ± {sh:.3f}", f"{ms:.3f}", str(mx), f"{mw:.3f}"])
facts["e2"] = {"table": t2, "violations": int(sum(1 for r in c if (r["card"] < 20 and r["max_holdings"] > r["card"]) or r["max_w"] > 0.3 + 1e-9))}
fig, ax = plt.subplots(1, 2, figsize=(10, 3.7))
for j, a in enumerate(("PSO", "GA", "Random")):
    hv = [cagg(k, a, "hv") for k in Ks]; sh = [cagg(k, a, "best_sharpe") for k in Ks]
    xs = np.arange(len(Ks)) + (j - 1) * .26
    ax[0].bar(xs, [h[0] for h in hv], .26, yerr=[h[1] for h in hv], color=COL[a], alpha=.8, label={"PSO": "MOPSO", "GA": "NSGA-II", "Random": "Random"}[a], capsize=2)
    ax[1].bar(xs, [s[0] for s in sh], .26, yerr=[s[1] for s in sh], color=COL[a], alpha=.8, capsize=2)
for a_ in ax: a_.set_xticks(range(len(Ks))); a_.set_xticklabels(["None", "10", "8", "5"]); a_.set_xlabel("Maximum number of holdings K")
ax[0].set_ylabel("Hypervolume (shared scale per K)"); ax[1].set_ylabel("Best training Sharpe"); ax[0].legend(frameon=False, fontsize=9)
ax[0].set_title("(a) Front quality", fontsize=11); ax[1].set_title("(b) Best Sharpe on the front", fontsize=11)
fig.tight_layout(); fig.savefig(F + "fig_constraints.png", dpi=200); plt.close(fig)

# ------------------------------------------------------------------ E3 scalability
s = json.load(open(D + "scalability.json")); Ns = (10, 20, 40, 60)
def sagg(n, a, v): 
    x = np.array([r[v] for r in s if r["n"] == n and r["alg"] == a]); return x.mean(), x.std(ddof=1)
t3 = []
for n in Ns:
    for a in ("PSO", "GA", "Random"):
        mh, sh = sagg(n, a, "hv")
        t3.append([str(n), {"PSO": "MOPSO", "GA": "NSGA-II", "Random": "Random"}[a], f"{mh:.3f} ± {sh:.3f}", f"{tmean(n, a):.2f}" if a != "Random" else "<0.1"])
facts["e3"] = {"table": t3, "sec": {a: [tmean(n, a) for n in Ns] for a in ("PSO", "GA")},
               "hv": {a: [sagg(n, a, "hv")[0] for n in Ns] for a in ("PSO", "GA", "Random")}}
fig, ax = plt.subplots(1, 2, figsize=(10, 3.6))
for a in ("PSO", "GA"):
    ax[0].plot(Ns, [tmean(n, a) for n in Ns], marker=MK[a], color=COL[a], label={"PSO": "MOPSO", "GA": "NSGA-II"}[a])
ax[0].set_xlabel("Number of assets"); ax[0].set_ylabel("Seconds per run"); ax[0].legend(frameon=False); ax[0].set_title("(a) Runtime", fontsize=11); ax[0].set_ylim(bottom=0)
for a in ("PSO", "GA", "Random"):
    ax[1].errorbar(Ns, [sagg(n, a, "hv")[0] for n in Ns], yerr=[sagg(n, a, "hv")[1] for n in Ns], marker=MK[a], color=COL[a], capsize=2, label={"PSO": "MOPSO", "GA": "NSGA-II", "Random": "Random"}[a])
ax[1].set_xlabel("Number of assets"); ax[1].set_ylabel("Hypervolume (shared scale per size)"); ax[1].set_title("(b) Front quality", fontsize=11); ax[1].legend(frameon=False, fontsize=9)
fig.tight_layout(); fig.savefig(F + "fig_scalability.png", dpi=200); plt.close(fig)

# ------------------------------------------------------------------ E4 budget (global reference)
if os.path.exists(D + "budget.json"):
    b = json.load(open(D + "budget.json"))
    allF = np.vstack([np.array(r["objs"]) for r in b]); ideal, ref = allF.min(0), allF.max(0) + 1e-9
    for r in b: r["hv"] = hypervolume(np.array(r["objs"]), ideal, ref, n_samples=100_000, seed=0)
    its = sorted({r["iters"] for r in b})
    def bagg(i, a): x = np.array([r["hv"] for r in b if r["iters"] == i and r["alg"] == a]); return x.mean(), x.std(ddof=1)
    ev = {i: [r["evals"] for r in b if r["iters"] == i][0] for i in its}
    t4 = [[str(i), f"{ev[i]:,}"] + [f"{bagg(i, a)[0]:.3f} ± {bagg(i, a)[1]:.3f}" for a in ("PSO", "GA", "Random")] for i in its]
    facts["e4"] = {"table": t4, "hv": {a: [bagg(i, a)[0] for i in its] for a in ("PSO", "GA", "Random")}, "its": its,
                   "p25": pv(stats.wilcoxon([r["hv"] for r in sorted([x for x in b if x["iters"] == 25 and x["alg"] == "PSO"], key=lambda r: r["seed"])],
                                           [r["hv"] for r in sorted([x for x in b if x["iters"] == 25 and x["alg"] == "GA"], key=lambda r: r["seed"])]).pvalue)}
    def hv_list(i, a): return [r["hv"] for r in sorted([x for x in b if x["iters"] == i and x["alg"] == a], key=lambda r: r["seed"])]
    facts["e4"]["wins_pso"] = {str(i): int(np.sum(np.array(hv_list(i, "PSO")) > np.array(hv_list(i, "GA")))) for i in its}
    facts["e4"]["p200"] = pv(stats.wilcoxon(hv_list(200, "PSO"), hv_list(200, "GA")).pvalue)
    facts["e4"]["p100"] = pv(stats.wilcoxon(hv_list(100, "PSO"), hv_list(100, "GA")).pvalue)
    facts["e4"]["seeds"] = len(hv_list(5, "PSO"))
    fig, ax = plt.subplots(figsize=(6.2, 3.8))
    for a in ("PSO", "GA", "Random"):
        ax.errorbar([ev[i] for i in its], [bagg(i, a)[0] for i in its], yerr=[bagg(i, a)[1] for i in its], marker=MK[a], color=COL[a], capsize=2, label={"PSO": "MOPSO", "GA": "NSGA-II", "Random": "Random search"}[a])
    ax.set_xscale("log"); ax.set_xlabel("Objective evaluations (log scale)"); ax.set_ylabel("Hypervolume (one fixed reference)"); ax.legend(frameon=False)
    fig.tight_layout(); fig.savefig(F + "fig_budget.png", dpi=200); plt.close(fig)

# ------------------------------------------------------------------ E5 held-out over 30 markets
o = json.load(open(D + "oos.json"))
strategies = ["Equal weight", "PSO best Sharpe", "GA best Sharpe", "Random search best Sharpe", "PSO min volatility", "GA min volatility", "Random search min volatility"]
def oc(sname, k): return np.array([r[k] for r in sorted([x for x in o if x["strategy"] == sname], key=lambda r: r["dataset"])])
ewS, ewV, ewD = oc("Equal weight", "sharpe"), oc("Equal weight", "volatility"), oc("Equal weight", "max_drawdown")
t5 = []
for sname in strategies:
    sh = oc(sname, "sharpe"); vol = oc(sname, "volatility"); dd = oc(sname, "max_drawdown"); tr = oc(sname, "train_sharpe")
    p = "-" if sname == "Equal weight" else pv(stats.wilcoxon(sh, ewS).pvalue)
    t5.append([sname.replace("PSO", "MOPSO").replace("GA ", "NSGA-II "), f"{tr.mean():.2f}", f"{sh.mean():.2f} ± {sh.std(ddof=1):.2f}", f"{np.median(sh):.2f}", pct(vol.mean()), pct(dd.mean()),
               "-" if sname == "Equal weight" else f"{int(round(np.mean(sh > ewS) * 30))}/30", p])
facts["e5"] = {"table": t5, "n": len(ewS)}
def pair(sname, k, ew, better):
    x = oc(sname, k); return {"wins": int(np.sum(better(x, ew))), "p": pv(stats.wilcoxon(x, ew).pvalue), "mean": float(x.mean()), "ew": float(ew.mean())}
facts["e5"]["vol"] = {s_: pair(s_, "volatility", ewV, lambda a, b: a < b) for s_ in ("PSO min volatility", "GA min volatility", "Random search min volatility")}
facts["e5"]["dd"] = {s_: pair(s_, "max_drawdown", ewD, lambda a, b: a > b) for s_ in ("PSO min volatility", "GA min volatility", "Random search min volatility")}
facts["e5"]["sharpe_means"] = {s_: [float(oc(s_, "train_sharpe").mean()), float(oc(s_, "sharpe").mean())] for s_ in strategies}
# PSO vs GA head to head, held-out
facts["e5"]["psoga_sharpe_p"] = pv(stats.wilcoxon(oc("PSO best Sharpe", "sharpe"), oc("GA best Sharpe", "sharpe")).pvalue)
facts["e5"]["psoga_minvol_p"] = pv(stats.wilcoxon(oc("PSO min volatility", "sharpe"), oc("GA min volatility", "sharpe")).pvalue)
fig, ax = plt.subplots(1, 3, figsize=(10.4, 4.0))
short = ["Equal\nweight", "MOPSO\nSharpe", "NSGA-II\nSharpe", "Random\nSharpe", "MOPSO\nmin vol", "NSGA-II\nmin vol", "Random\nmin vol"]
colors = [COL["EW"], COL["PSO"], COL["GA"], COL["Random"], COL["PSO"], COL["GA"], COL["Random"]]
for a_, k, ttl in ((ax[0], "sharpe", "(a) Held-out Sharpe ratio"), (ax[1], "volatility", "(b) Held-out volatility"), (ax[2], "max_drawdown", "(c) Held-out max drawdown")):
    bp = a_.boxplot([oc(s_, k) for s_ in strategies], tick_labels=short, patch_artist=True, widths=.6, flierprops={"markersize": 3})
    for patch, cc in zip(bp["boxes"], colors): patch.set_facecolor(cc); patch.set_alpha(.45)
    for med in bp["medians"]: med.set_color("k")
    a_.set_title(ttl, fontsize=11); a_.tick_params(axis="x", labelsize=7.2)
fig.tight_layout(); fig.savefig(F + "fig_oos.png", dpi=200); plt.close(fig)
fig, ax = plt.subplots(figsize=(6.2, 3.6))
tr = [oc(s_, "train_sharpe").mean() for s_ in strategies]; te = [oc(s_, "sharpe").mean() for s_ in strategies]
x = np.arange(len(strategies)); ax.bar(x - .2, tr, .4, color="#9fb0d6", label="Training window"); ax.bar(x + .2, te, .4, color="#2b3a67", label="Held-out window")
ax.set_xticks(x); ax.set_xticklabels(short, fontsize=7.5); ax.set_ylabel("Mean Sharpe over 30 markets"); ax.legend(frameon=False)
fig.tight_layout(); fig.savefig(F + "fig_train_test.png", dpi=200); plt.close(fig)

# ------------------------------------------------------------------ E6 ablation
a_ = json.load(open(D + "ablation.json"))
by = {}
for r in a_: by.setdefault(r["variant"], {})[r["seed"]] = r["hv"]
var = ["PSO (full)", "PSO without turbulence", "GA (full)", "GA without swap mutation"]
def vv(v): return np.array([by[v][k] for k in sorted(by[v])])
t6 = [[v, f"{vv(v).mean():.4f} ± {vv(v).std(ddof=1):.4f}"] for v in var]
facts["e6"] = {"table": t6, "seeds": len(vv(var[0])),
               "pso": {"diff": float((vv(var[0]) - vv(var[1])).mean()), "p": pv(stats.wilcoxon(vv(var[0]), vv(var[1])).pvalue), "wins": int(np.sum(vv(var[0]) > vv(var[1])))},
               "ga": {"diff": float((vv(var[2]) - vv(var[3])).mean()), "p": pv(stats.wilcoxon(vv(var[2]), vv(var[3])).pvalue), "wins": int(np.sum(vv(var[2]) > vv(var[3])))}}
fig, ax = plt.subplots(figsize=(6.2, 3.6))
for i, v in enumerate(var):
    ax.bar(i, vv(v).mean(), .55, color=COL["PSO" if "PSO" in v else "GA"], alpha=.8 if "full" in v else .4, yerr=vv(v).std(ddof=1), capsize=3)
    ax.scatter(np.full(len(vv(v)), i) + np.linspace(-.15, .15, len(vv(v))), vv(v), s=10, c="k", zorder=3)
ax.set_xticks(range(4)); ax.set_xticklabels(["MOPSO\nfull", "MOPSO, no\nturbulence", "NSGA-II\nfull", "NSGA-II, no\nswap mutation"], fontsize=8.5)
lo = min(min(vv(v)) for v in var); ax.set_ylim(lo - 0.03, max(max(vv(v)) for v in var) + 0.02); ax.set_ylabel("Hypervolume (K = 8)")
fig.tight_layout(); fig.savefig(F + "fig_ablation.png", dpi=200); plt.close(fig)

json.dump(facts, open("facts.json", "w"), indent=1)
print("facts written; budget:", "e4" in facts)
