const L = require('./lib');
const { d, para, h2, h3, h4, bullets, numbered, table, figure, chapter } = L;
const F = JSON.parse(L.fs.readFileSync(L.path.join(L.ROOT, 'facts.json'), 'utf8'));
const pc = (x, dd = 1) => (x * 100).toFixed(dd) + '%';
const A = d.AlignmentType;
const LT = A.LEFT, CT = A.CENTER;

function ch6() {
  const out = [...chapter(6, 'Testing and Validation')];
  out.push(h2('6.1', 'Data interpretation'));
  out.push(para(`The default market has 20 assets and 1,500 business days. The first ${F.n_train.toLocaleString()} days form the training window on which every optimiser works, and the last ${F.n_test} days are held out and used only to evaluate chosen portfolios. On the training window the single assets have annualised returns from ${pc(F.asset_ranges.mu[0])} to ${pc(F.asset_ranges.mu[1])} and volatilities from ${pc(F.asset_ranges.sd[0])} to ${pc(F.asset_ranges.sd[1])}, so a diversified portfolio can reach a much lower volatility than any single asset.`));
  out.push(para('Return is the mean daily return times 252, volatility is the daily standard deviation times the square root of 252, and CVaR is the average loss on the worst 5% of days (a CVaR of 1.9% means such days lost 1.9% on average). A point on the front is better than another if it is no worse on all three objectives and better on at least one. Two cautions apply: training numbers are in-sample and only held-out numbers speak about unseen data, and hypervolumes are comparable only between methods sharing one normalisation, not between scenarios.'));

  out.push(h2('6.2', 'Analysis'));
  out.push(para('Verification was organised in three levels.', { after: 60, keepNext: true }));
  out.push(...bullets([
    '**Component level:** the repair operator is tested on random, all-zero, all-one and unit vectors with and without a cardinality limit; the objective function is checked against an independent calculation; the Pareto utilities against a worked example.',
    '**Algorithm level:** each optimiser must return only feasible, mutually non-dominated portfolios whose stored objectives match a re-evaluation, must be reproducible for a fixed seed, and must beat random search at equal budget.',
    '**System level:** the server is tested through a complete job, error paths and the HTTP interface, and the interface is exercised in a real browser.',
  ]));
  out.push(para(`Across all fronts of experiment E2, which includes limits of 10, 8 and 5 holdings, there were ${F.e2.violations} violations of the 30% cap or the holding limit.`));

  out.push(h2('6.3', 'Test results'));
  out.push(h3('6.3.1', 'Testing process'));
  out.push(para('The automated tests are written with pytest, run in a few seconds and are executed after each change; all 14 passed in the final run for this report. Interface tests ran in headless Chromium (Playwright) against the running server in light desktop, dark desktop and phone-sized windows.'));
  out.push(h3('6.3.2', 'System test cases'));
  out.push(...table(['ID', 'Test case', 'Expected result', 'Result'], [
    ['T1', 'Repair on random, zero, ones and unit vectors; no limit and K = 5', 'Non-negative weights summing to 1, each at most 30%, at most K non-zero', 'Pass'],
    ['T2', 'A 10% cap with a limit of 5 holdings', 'Error that the configuration is infeasible', 'Pass'],
    ['T3', 'Objectives of equal weight against a manual calculation', 'Return, volatility and CVaR agree', 'Pass'],
    ['T4', 'Dominance mask, ranks, crowding distance and hypervolume on a worked example', 'Expected values', 'Pass'],
    ['T5', 'MOPSO and NSGA-II with a limit of 6 holdings', 'Feasible, non-dominated, objectives match a re-evaluation', 'Pass (both)'],
    ['T6', 'Both algorithms against random search at equal budget', 'Larger hypervolume for both', 'Pass'],
    ['T7', 'Two MOPSO runs with the same seed; a command-line run', 'Identical fronts; tables and figures written', 'Pass'],
    ['T8', 'Complete job; infeasible job; 500 assets; HTTP requests including a parent-directory path', 'Full result; clear errors; traversal path returns 404', 'Pass'],
    ['T9', 'Browser: load, hover and click a point, switch algorithm, rule and axis', 'Fronts drawn; tooltip, weights and metrics update', 'Pass'],
    ['T10', 'Browser: 10% cap with 5 holdings; CSV without and with a file; Stop', 'Inline message and disabled Run; CSV run completes; run stops', 'Pass'],
    ['T11', 'Browser: phone width 390 px and dark scheme', 'No horizontal scrolling (found and fixed); text readable', 'Pass'],
  ], [650, 3500, 3631, 950], 'System test cases and results', { size: 20 }));
  return out;
}

function ch7() {
  const out = [...chapter(7, 'Results and Discussion')];
  out.push(h2('7.1', 'Presentation of Results'));
  out.push(para('This section presents the six experiments of Section 4.2.1. Values after the plus-minus sign are sample standard deviations over seeds, and all algorithms received the same data, constraints and evaluation budget.'));

  out.push(h4('E1: Front quality at the default setting'));
  out.push(...table(['Method', 'Hypervolume', 'Front size', 'Spacing', 'Best Sharpe', 'Seconds', 'Evaluations'], F.e1.table, [2100, 1400, 800, 900, 1000, 900, 1200], `Front quality over ${F.e1.seeds} seeds (20 assets, 100 particles or individuals, 150 iterations)`, { size: 20, aligns: [LT, CT, CT, CT, CT, CT, CT] }));
  out.push(para(`Both algorithms dominate random search (hypervolume about ${F.e1.hv.PSO[0].toFixed(2)} against ${F.e1.hv.Random[0].toFixed(2)}, Wilcoxon p = ${F.e1.p_pso_rnd}); random search finds only about 20 non-dominated points against about 100. NSGA-II is marginally higher than MOPSO (difference ${Math.abs(F.e1.diff_pso_ga).toFixed(4)}, higher in ${F.e1.ga_wins} of ${F.e1.seeds} seeds, p = ${F.e1.p_pso_ga}), which is small next to the seed-to-seed spread of about ${F.e1.hv.PSO[1].toFixed(3)}. MOPSO gives a more evenly spread front (spacing ${F.e1.spacing.PSO.toFixed(4)} against ${F.e1.spacing.GA.toFixed(4)}, p = ${F.e1.spacing_p}). Run times, measured separately with nothing else running, are about ${F.e1.sec.PSO.toFixed(1)} s for MOPSO and ${F.e1.sec.GA.toFixed(1)} s for NSGA-II.`));

  out.push(h4('Selected portfolios on the default market'));
  out.push(...table(['Portfolio', 'Held', 'Train return', 'Train vol.', 'Train Sharpe', 'Held-out CAGR', 'Held-out vol.', 'Held-out Sharpe', 'Held-out max DD'], F.selected, [1700, 560, 800, 740, 800, 850, 800, 850, 850], 'Selected portfolios on the default market (seed 0)', { size: 20, aligns: [LT, CT, CT, CT, CT, CT, CT, CT, CT] }));
  out.push(para(`All strategies lost money on this held-out window, including equal weight, because it is a weak stretch of the simulated path; the optimised portfolios lost less (for example ${F.selected[0][5]} a year against ${F.selected[6][5]}), but one market cannot separate skill from luck, hence experiment E5. The best-Sharpe portfolios hold four assets at the 30% cap and the lowest-volatility ones hold twelve.`));

  out.push(h4('E2: Effect of the holding limit'));
  const e2 = F.e2.table, byK = {};
  e2.forEach((r) => { (byK[r[0]] = byK[r[0]] || {})[r[1]] = r; });
  const e2rows = Object.keys(byK).map((k) => [k, byK[k]['MOPSO'][2], byK[k]['NSGA-II'][2], byK[k]['Random'][2], byK[k]['MOPSO'][3], byK[k]['MOPSO'][4] + ' / ' + byK[k]['NSGA-II'][4]]);
  out.push(...table(['Max holdings K', 'MOPSO', 'NSGA-II', 'Random', 'Best Sharpe', 'Most holdings seen'], e2rows, [1500, 1700, 1700, 1700, 1100, 1031], 'Hypervolume against the holding limit (5 seeds each; 20 assets; scale shared within each row)', { size: 20, aligns: [CT, CT, CT, CT, CT, CT] }));
  out.push(para(`The limit was respected in every run and the cap was never exceeded (${F.e2.violations} violations). The best Sharpe ratio is the same for every K because the best portfolio needs only four assets, so even K = 5 does not bind. Random search improves as K falls because the feasible region shrinks, whereas the two optimisers stay close to each other. Hypervolumes must not be compared across K.`));

  out.push(h4('E3: Number of assets'));
  const e3 = F.e3.table, byN = {};
  e3.forEach((r) => { (byN[r[0]] = byN[r[0]] || {})[r[1]] = r; });
  const e3rows = Object.keys(byN).map((n) => [n, byN[n]['MOPSO'][2], byN[n]['NSGA-II'][2], byN[n]['Random'][2], byN[n]['MOPSO'][3], byN[n]['NSGA-II'][3]]);
  out.push(...table(['Assets', 'MOPSO', 'NSGA-II', 'Random', 'MOPSO seconds', 'NSGA-II seconds'], e3rows, [1100, 1850, 1850, 1850, 1041, 1040], 'Hypervolume and run time against the number of assets (3 seeds; run time measured separately)', { size: 20, aligns: [CT, CT, CT, CT, CT, CT] }));
  out.push(para(`Run time stays between about ${Math.min(...F.e3.sec.PSO, ...F.e3.sec.GA).toFixed(1)} and ${Math.max(...F.e3.sec.PSO, ...F.e3.sec.GA).toFixed(1)} seconds from 10 to 60 assets because evaluation is one matrix product. The advantage over random search grows with dimension: at 60 assets the optimisers reach about ${F.e3.hv.PSO[3].toFixed(2)} and ${F.e3.hv.GA[3].toFixed(2)} against ${F.e3.hv.Random[3].toFixed(2)}, whereas at 10 assets the gap is much smaller.`));

  out.push(h4('E4: Search budget'));
  out.push(...table(['Iterations', 'Evaluations', 'MOPSO', 'NSGA-II', 'Random search'], F.e4.table, [1300, 1500, 1950, 1950, 2031], `Hypervolume against budget (${F.e4.seeds} seeds each; one fixed reference for all rows)`, { size: 20, aligns: [CT, CT, CT, CT, CT] }));
  out.push(para(`MOPSO is much better at small budgets: with 10 iterations (1,100 evaluations) it reaches ${F.e4.hv.PSO[1].toFixed(2)}, which NSGA-II needs 25 to 50 iterations to match, and it was ahead in all ${F.e4.seeds} seeds at 50 iterations or fewer. From 100 iterations on, NSGA-II was ahead in all ${F.e4.seeds} seeds (${F.e4.hv.GA[5].toFixed(3)} against ${F.e4.hv.PSO[5].toFixed(3)} at 200). With five seeds the smallest attainable p value is 0.062, which is reported for these unanimous comparisons.`));

  out.push(h4('E5: Held-out performance over 30 markets'));
  out.push(...table(['Strategy', 'Train Sharpe', 'Held-out Sharpe', 'Median', 'Held-out volatility', 'Held-out max DD', 'Wins vs EW', 'p vs EW'], F.e5.table, [2100, 800, 1250, 750, 1000, 950, 900, 981], 'Held-out performance over 30 independent markets (mean over markets; p is the paired Wilcoxon test of held-out Sharpe against equal weight)', { size: 20, aligns: [LT, CT, CT, CT, CT, CT, CT, CT] }));
  const v = F.e5.vol, dd = F.e5.dd, sm = F.e5.sharpe_means;
  out.push(para(`**Best-Sharpe portfolios.** The mean training Sharpe ratio is ${sm['PSO best Sharpe'][0].toFixed(2)} for MOPSO and ${sm['GA best Sharpe'][0].toFixed(2)} for NSGA-II, but on held-out data it falls to ${sm['PSO best Sharpe'][1].toFixed(2)} and ${sm['GA best Sharpe'][1].toFixed(2)}, no better than equal weight (${sm['Equal weight'][1].toFixed(2)}). The differences from equal weight are not significant, MOPSO and NSGA-II do not differ (p = ${F.e5.psoga_sharpe_p}), and random search with a much poorer front does about as well.`));
  out.push(para(`**Lowest-volatility portfolios.** Held-out volatility is lower than that of equal weight in ${v['PSO min volatility'].wins} of 30 markets for MOPSO and ${v['GA min volatility'].wins} of 30 for NSGA-II (means ${pc(v['PSO min volatility'].mean)} and ${pc(v['GA min volatility'].mean)} against ${pc(v['PSO min volatility'].ew)}, p ${v['PSO min volatility'].p}). Maximum drawdown is shallower in ${dd['PSO min volatility'].wins} markets for MOPSO (p = ${dd['PSO min volatility'].p}) and ${dd['GA min volatility'].wins} for NSGA-II (p = ${dd['GA min volatility'].p}), with a Sharpe ratio similar to equal weight.`));

  out.push(h4('E6: Operator ablation'));
  out.push(...table(['Variant', 'Hypervolume'], F.e6.table, [5000, 3731], `Effect of removing an operator (${F.e6.seeds} seeds; limit of 8 holdings)`, { size: 22, aligns: [LT, CT] }));
  out.push(para(`Removing the PSO turbulence step changed the hypervolume by ${F.e6.pso.diff.toFixed(4)} on average (p = ${F.e6.pso.p}) and removing the GA swap mutation by ${F.e6.ga.diff.toFixed(4)} (p = ${F.e6.ga.p}); neither is distinguishable from seed-to-seed variation at this setting.`));

  out.push(h3('7.1.1', 'Statistical Analysis'));
  out.push(para('With few seeds and no known distribution, paired Wilcoxon signed-rank tests were used. All tests are two-sided and uncorrected for multiple comparisons, so they are indicative, and p values near 0.05 are not firm.'));
  out.push(...table(['Comparison', 'Pairs', 'Result', 'p'], [
    ['Hypervolume: MOPSO against random search', String(F.e1.seeds), 'MOPSO higher in all pairs', F.e1.p_pso_rnd],
    ['Hypervolume: NSGA-II against random search', String(F.e1.seeds), 'NSGA-II higher in all pairs', F.e1.p_ga_rnd],
    ['Hypervolume: MOPSO against NSGA-II', String(F.e1.seeds), `NSGA-II higher in ${F.e1.ga_wins} of ${F.e1.seeds}`, F.e1.p_pso_ga],
    ['Hypervolume at 25 / 200 iterations: MOPSO against NSGA-II', String(F.e4.seeds), 'MOPSO ahead at 25, NSGA-II at 200 (all pairs)', `${F.e4.p25} / ${F.e4.p200}`],
    ['Held-out Sharpe: best-Sharpe picks against equal weight', '30', 'Not different (MOPSO, NSGA-II)', `${F.e5.table[1][7]} / ${F.e5.table[2][7]}`],
    ['Held-out volatility: minimum-volatility picks against equal weight', '30', 'Lower in all 30 (both)', v['PSO min volatility'].p],
    ['Held-out drawdown: NSGA-II minimum-volatility against equal weight', '30', `Shallower in ${dd['GA min volatility'].wins} of 30`, dd['GA min volatility'].p],
    ['Ablation: with and without turbulence / swap mutation', String(F.e6.seeds), 'Not different', `${F.e6.pso.p} / ${F.e6.ga.p}`],
  ], [4300, 700, 2831, 900], 'Summary of paired Wilcoxon signed-rank tests', { size: 20, aligns: [LT, CT, LT, CT] }));

  out.push(h2('7.2', 'Figures'));
  const f1 = figure('fig_budget.png', 4.2, 'Hypervolume against the number of objective evaluations (error bars: standard deviation over five seeds).');
  out.push(para(`${f1.label} and the next figure show single quantities: front quality against budget, and the training against held-out Sharpe ratio of each strategy.`, { after: 60 }));
  out.push(...f1.els);
  const f2 = figure('fig_train_test.png', 4.2, 'Mean Sharpe ratio on the training and the held-out window for each strategy, over 30 markets.');
  out.push(...f2.els);

  out.push(h2('7.3', 'Subfigures'));
  const g1 = figure('fig_fronts_main.png', 5.8, 'Fronts found on the training window of the default market: (a) return against volatility; (b) return against CVaR.');
  out.push(para('The multi-panel figures below show the fronts, the convergence and the distributions behind the tables.', { after: 60 }));
  out.push(...g1.els);
  const g2 = figure('fig_convergence_hv.png', 5.8, 'Best training Sharpe on the front per iteration for seed 0 (a) and hypervolume over ten seeds (b).');
  out.push(...g2.els);
  out.push(para(`In ${g2.label}(a), MOPSO reaches 99% of its final best Sharpe ratio after ${F.e1.conv99.PSO} iterations and NSGA-II after ${F.e1.conv99.GA}, and both end at ${F.e1.final_sharpe.PSO.toFixed(3)}.`));
  const g3 = figure('fig_weights_wealth.png', 5.8, 'Best-Sharpe portfolios on the default market: (a) weights of the largest holdings; (b) held-out wealth against equal weight.');
  out.push(...g3.els);
  const g6 = figure('fig_oos.png', 5.8, 'Held-out distributions over 30 markets: (a) Sharpe ratio; (b) volatility; (c) maximum drawdown.');
  out.push(...g6.els);

  out.push(h2('7.4', 'Discussion'));
  out.push(para(`**Both optimisers approximate the front well and are close to each other.** Both reach a hypervolume of about 0.70 against about 0.25 for random search and return about 100 non-dominated portfolios. NSGA-II is marginally ahead at the default budget and MOPSO has the more even front, but the differences are small. The budget study shows why the ranking depends on the set-up: MOPSO reaches ${F.e4.hv.PSO[1].toFixed(2)} after 10 iterations, which NSGA-II needs 25 to 50 iterations to match, whereas NSGA-II keeps improving and finishes slightly ahead from 100 iterations. Neither is better overall: MOPSO is preferable when evaluations are scarce and NSGA-II when they are plentiful.`));
  out.push(para('**Constraints and cost.** With one repair operator no run violated the cap or the holding limit, and tight limits did not hurt the best Sharpe ratio because the best portfolio holds only four assets. A default run takes about a second and a half, almost independent of the number of assets, and the advantage over random search widens as the universe grows.'));
  out.push(para('**Operator ablations show no measurable benefit.** Removing the turbulence step or the swap mutation changed the hypervolume by less than 0.002 on average, within seed-to-seed variation. At these settings they are harmless safeguards and not drivers of performance.'));
  out.push(para(`**A better front does not mean a better portfolio on new data.** Portfolios chosen for the best Sharpe ratio looked excellent in training (${sm['PSO best Sharpe'][0].toFixed(2)}) and fell to ${sm['PSO best Sharpe'][1].toFixed(2)} on unseen data, below equal weight at ${sm['Equal weight'][1].toFixed(2)}, and random search did about as well. This agrees with Michaud {c:michaud} and DeMiguel et al. {c:demiguel}. A simple calculation shows why: with about four years of data, the standard error of an annual mean return is roughly the annual volatility divided by the square root of the number of years, about 12 percentage points for an asset with 25% volatility, which is as large as the whole spread of true alphas used to generate the markets (-2% to 10%). The optimiser therefore mostly fits noise in the means.`));
  out.push(para('**Risk-based choices do transfer.** Volatility is estimated far more precisely from the same data. The lowest-volatility portfolios had lower held-out volatility than equal weight in all 30 markets and often shallower drawdowns, with a similar Sharpe ratio. Selecting from the low-risk end of the front is therefore the more dependable choice, and the high-return end should be treated with scepticism. Since random search also finds acceptable minimum-volatility portfolios, the value of the metaheuristics lies in producing a full, well-spread front.'));
  out.push(h4('Limitations'));
  out.push(...bullets([
    'All markets are simulated; real prices have time-varying correlations and regime changes, so the held-out findings must be repeated on real data.',
    'Hypervolume is estimated by sampling and depends on the reference point; algorithm parameters were fixed at common values and not tuned.',
    'Two optimisers, zero risk-free rate, long-only portfolios, no trading costs, uncorrected tests and five to ten seeds give limited power.',
  ]));

  out.push(h2('7.5', 'Conclusion'));
  out.push(para('Both MOPSO and NSGA-II find much better fronts than random search under identical constraints and budget. MOPSO is faster at small budgets and NSGA-II marginally better at large ones. Portfolios chosen for return do not beat equal weight on unseen data, while low-risk portfolios keep their risk advantage.'));
  return out;
}

function ch8() {
  const out = [...chapter(8, 'Conclusion')];
  out.push(h2('8.1', 'Conclusion'));
  out.push(para('This project built SwarmFolio, a library and a browser workbench for multi-objective portfolio selection with a particle swarm optimiser and a genetic algorithm. Both optimisers search one shared constrained space of long-only portfolios, trading off annual return, volatility and CVaR, and both are covered by an automated test suite and interface tests in a real browser. The main findings are:', { after: 60, keepNext: true }));
  out.push(...bullets([
    `Both algorithms approximate the Pareto front far better than random search at equal budget (hypervolume about ${F.e1.hv.PSO[0].toFixed(2)} against ${F.e1.hv.Random[0].toFixed(2)}) and respect every constraint in every run.`,
    'MOPSO converges in far fewer iterations and gives a more even front; NSGA-II ends marginally ahead from 100 iterations. At the default budget they cannot be separated in practical terms.',
    'A run takes about a second and a half, nearly independent of the number of assets up to 60, and the extra operators did not measurably change front quality.',
    'Best-Sharpe portfolios did not outperform equal weight on held-out data over 30 simulated markets, while minimum-volatility portfolios kept clearly lower held-out volatility in all 30. Training quality is therefore not a promise of future return.',
  ]));
  out.push(para('The limits are stated in Section 7.4: the markets are simulated, parameters were not tuned and the number of seeds is modest.'));

  out.push(h2('8.2', 'Future Scope'));
  out.push(...bullets([
    '**Real-market validation:** repeat the held-out study on historical prices across many rolling windows, using the existing CSV import.',
    '**Better estimation:** add shrinkage covariance and robust return estimates, the standard remedy for the estimation-error problem seen here.',
    '**More objectives and algorithms:** turnover and trading cost as objectives, sector limits, decomposition-based algorithms and tuned parameters.',
    '**Deployment and teaching:** authentication and an isolated worker so the workbench can be hosted for a class, with guided exercises on dominance and over-fitting.',
  ]));
  return out;
}

module.exports = { ch6, ch7, ch8 };
