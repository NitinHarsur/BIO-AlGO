const L = require('./lib');
const { d, para, h2, h3, h4, bullets, numbered, table, figure, chapter } = L;
const F = JSON.parse(L.fs.readFileSync(L.path.join(L.ROOT, 'facts.json'), 'utf8'));
const pc = (x, dd = 1) => (x * 100).toFixed(dd) + '%';
const A = d.AlignmentType;
const R = A.RIGHT, CT = A.CENTER, LT = A.LEFT;

function ch6() {
  const out = [...chapter(6, 'Testing and Validation')];
  out.push(h2('6.1', 'Data interpretation'));
  out.push(para(`The default market has 20 assets and 1,500 business days. In time order, the first ${F.n_train.toLocaleString()} days form the training window on which every optimiser works, and the last ${F.n_test} days are held out and used only to evaluate the chosen portfolios. On the training window the annualised mean returns of the single assets range from ${pc(F.asset_ranges.mu[0])} to ${pc(F.asset_ranges.mu[1])} and their annualised volatilities from ${pc(F.asset_ranges.sd[0])} to ${pc(F.asset_ranges.sd[1])}. A portfolio of these assets can reach a much lower volatility than any single asset, which is the diversification effect the optimisers exploit.`));
  out.push(para('The three objectives are interpreted as follows. Return is the mean daily return multiplied by 252. Volatility is the standard deviation of daily returns multiplied by the square root of 252. CVaR is the average loss on the worst 5% of days, expressed as a daily percentage, so a CVaR of 1.9% means that on its worst days the portfolio lost on average 1.9%. A point on the front is better than another if it is no worse on all three objectives and better on at least one. Because return is maximised while the other two are minimised, the front rises to the right in the return-volatility plane: more return can only be had by accepting more risk.'));
  out.push(para('Two cautions apply to reading the results. First, the training numbers are in-sample: they describe how well a portfolio would have done on the very data used to pick it. Only the held-out numbers speak about unseen data. Second, hypervolume values are comparable only between methods that share one normalisation, that is, within a row group of a table, and not between different scenarios.'));

  out.push(h2('6.2', 'Analysis'));
  out.push(para('Verification was organised in three levels, from the smallest unit to the whole experiment.'));
  out.push(...bullets([
    '**Component level.** The repair operator is tested on random, all-zero, all-one and unit vectors, with and without a cardinality limit, and must always return weights that are non-negative, sum to one, do not exceed the cap and respect the limit. The objective function is checked against an independent calculation of mean, standard deviation and the CVaR average. The Pareto utilities are checked on a small hand-worked example.',
    '**Algorithm level.** Each optimiser must return only feasible, mutually non-dominated portfolios whose stored objective values match a fresh evaluation, must be reproducible for a fixed seed, and must beat random search at an equal budget.',
    '**System level.** The server is tested through a complete job, error paths and the HTTP interface, and the interface is exercised in a real browser.',
  ]));
  out.push(para(`The experiments add a further check on constraint handling: across all fronts produced in experiment E2, which includes limits of 10, 8 and 5 holdings, there were ${F.e2.violations} violations of the 30% cap or of the holding limit.`));

  out.push(h2('6.3', 'Test results'));
  out.push(h3('6.3.1', 'Testing process'));
  out.push(para('The automated tests are written with pytest and run in a few seconds. They are executed after each change. The 14 automated tests passed in the final run for this report. Interface tests were run in headless Chromium through Playwright against the running server, in a light desktop, a dark desktop and a phone-sized window.'));
  out.push(h3('6.3.2', 'System test cases'));
  out.push(...table(['ID', 'Test case', 'Expected result', 'Result'], [
    ['T1', 'Repair on random, zero, ones and unit vectors, with no limit and with K = 5', 'Weights non-negative, sum to 1, each at most 30%, at most K non-zero', 'Pass'],
    ['T2', 'Construct a problem with a 10% cap and a limit of 5 holdings', 'Error that the configuration is infeasible', 'Pass'],
    ['T3', 'Objectives of the equal-weight portfolio versus a manual calculation', 'Return, volatility and CVaR agree', 'Pass'],
    ['T4', 'Non-dominated mask, sorting ranks, crowding distance and hypervolume on a worked example', 'Expected mask and ranks; hypervolume grows with more points', 'Pass'],
    ['T5', 'MOPSO and NSGA-II with a limit of 6 holdings', 'Feasible, mutually non-dominated; stored objectives match a re-evaluation; history length correct', 'Pass (both)'],
    ['T6', 'Both algorithms versus random search at equal budget', 'Larger hypervolume for both algorithms', 'Pass'],
    ['T7', 'Two runs of MOPSO with the same seed', 'Identical fronts', 'Pass'],
    ['T8', 'Command-line run with walk-forward test', 'Result tables and figures written', 'Pass'],
    ['T9', 'Complete job through the job manager', 'Status done; fronts, weights summing to 1, held-out statistics and picks present; JSON-serialisable', 'Pass'],
    ['T10', 'Infeasible constraints through the job manager', 'Status error with an explanatory message', 'Pass'],
    ['T11', 'Number of assets set to 500', 'Rejected with a message naming the field', 'Pass'],
    ['T12', 'HTTP: home page, a parent-directory path, a run request and polling', 'Page served; traversal path returns 404; job completes', 'Pass'],
    ['T13', 'Browser: page load starts a run and results appear without console errors', 'Fronts drawn, inspector filled', 'Pass'],
    ['T14', 'Browser: hover and click a point; switch algorithm, rule and axis', 'Tooltip appears; weights and metrics update; axes re-scale', 'Pass'],
    ['T15', 'Browser: 10% cap with 5 holdings', 'Inline message appears and Run is disabled', 'Pass'],
    ['T16', 'Browser: My prices without a file, then with a CSV of 8 assets', 'Run disabled without a file; run completes with the file’s tickers', 'Pass'],
    ['T17', 'Browser: Stop during a large run', 'Run ends with the status Stopped', 'Pass'],
    ['T18', 'Browser: phone width 390 px', 'No horizontal scrolling of the page (found and fixed during testing)', 'Pass'],
    ['T19', 'Browser: dark colour scheme', 'All text and charts readable', 'Pass'],
  ], [650, 3500, 3631, 950], 'System test cases and results', { size: 19 }));
  return out;
}

function ch7() {
  const out = [...chapter(7, 'Results and Discussion')];
  out.push(h2('7.1', 'Presentation of Results'));
  out.push(para(`This section presents the measured results of the six experiments described in Section 4.2.1. Values after the plus-minus sign are sample standard deviations over seeds. In all experiments the algorithms received the same training data, the same constraints and the same number of objective evaluations.`));

  out.push(h4('E1: Front quality at the default setting'));
  out.push(...table(['Method', 'Hypervolume', 'Front size', 'Spacing', 'Best Sharpe', 'Seconds', 'Evaluations'], F.e1.table, [2100, 1400, 800, 900, 1000, 900, 1200], `Front quality over ${F.e1.seeds} seeds (20 assets, 100 particles or individuals, 150 iterations)`, { size: 19, aligns: [LT, CT, CT, CT, CT, CT, CT] }));
  out.push(para(`Both algorithms dominate random search by a wide margin (hypervolume about ${F.e1.hv.PSO[0].toFixed(2)} against ${F.e1.hv.Random[0].toFixed(2)}, Wilcoxon p = ${F.e1.p_pso_rnd}). Random search finds only about 20 non-dominated points, against about 100 for the optimisers. The mean hypervolume of NSGA-II is marginally higher than that of MOPSO (a difference of ${Math.abs(F.e1.diff_pso_ga).toFixed(4)}, higher in ${F.e1.ga_wins} of ${F.e1.seeds} seeds, p = ${F.e1.p_pso_ga}), but this is small compared with the seed-to-seed spread of about ${F.e1.hv.PSO[1].toFixed(3)}. MOPSO gives a more evenly spread front (spacing ${F.e1.spacing.PSO.toFixed(4)} against ${F.e1.spacing.GA.toFixed(4)}, p = ${F.e1.spacing_p}). Run times were measured separately with nothing else running (see the scaling results below) and are about ${F.e1.sec.PSO.toFixed(1)} s for MOPSO and ${F.e1.sec.GA.toFixed(1)} s for NSGA-II.`));

  out.push(h4('Selected portfolios on the default market'));
  out.push(...table(['Portfolio', 'Held', 'Train return', 'Train vol.', 'Train Sharpe', 'Held-out CAGR', 'Held-out vol.', 'Held-out Sharpe', 'Held-out max DD'], F.selected, [1700, 560, 800, 740, 800, 850, 800, 850, 850], 'Selected portfolios on the default market (seed 0): training and held-out performance', { size: 17, aligns: [LT, CT, CT, CT, CT, CT, CT, CT, CT] }));
  out.push(para(`On this one market all strategies lost money on the held-out window, including equal weight, because the held-out period is a weak stretch of the simulated path. The optimised portfolios lost less than equal weight (for example ${F.selected[0][5]} a year against ${F.selected[6][5]} for the best-Sharpe portfolio of MOPSO), but a single market cannot show whether this is skill or luck, which is why experiment E5 uses 30 markets. The best-Sharpe portfolios hold only four assets at the 30% cap, whereas the lowest-volatility portfolios hold twelve.`));

  out.push(h4('E2: Effect of the cardinality limit'));
  out.push(...table(['Max holdings K', 'Method', 'Hypervolume', 'Best Sharpe', 'Most holdings seen', 'Largest weight'], F.e2.table, [1300, 1300, 1900, 1300, 1600, 1331], 'Effect of the holding limit (5 seeds each; 20 assets)', { size: 19, aligns: [CT, CT, CT, CT, CT, CT] }));
  out.push(para(`The limit was respected in every run and the cap was never exceeded (${F.e2.violations} violations). The best Sharpe ratio on the front is the same for every K because the best-Sharpe portfolio needs only four assets at a 30% cap, so even K = 5 does not bind there. The hypervolume of random search rises as K falls, since fewer holdings shrink the feasible region and make random sampling more effective, whereas the two optimisers stay close to each other. Hypervolumes are normalised within each K and must not be compared across K.`));

  out.push(h4('E3: Number of assets'));
  out.push(...table(['Assets', 'Method', 'Hypervolume', 'Seconds per run'], F.e3.table, [1500, 2000, 2600, 2631], 'Scaling with the number of assets (3 seeds each for quality; run time measured separately with 3 seeds)', { size: 19, aligns: [CT, CT, CT, CT] }));
  out.push(para(`Run time stays between about ${Math.min(...F.e3.sec.PSO, ...F.e3.sec.GA).toFixed(1)} and ${Math.max(...F.e3.sec.PSO, ...F.e3.sec.GA).toFixed(1)} seconds from 10 to 60 assets, because evaluation is a single matrix product whose cost is small next to the sorting and repair steps. The advantage over random search grows with dimension: with 60 assets the optimisers' hypervolume is about ${F.e3.hv.PSO[3].toFixed(2)} and ${F.e3.hv.GA[3].toFixed(2)} against ${F.e3.hv.Random[3].toFixed(2)} for random search, whereas at 10 assets the gap is much smaller (${F.e3.hv.PSO[0].toFixed(2)} and ${F.e3.hv.GA[0].toFixed(2)} against ${F.e3.hv.Random[0].toFixed(2)}).`));

  out.push(h4('E4: Search budget'));
  out.push(...table(['Iterations', 'Evaluations', 'MOPSO', 'NSGA-II', 'Random search'], F.e4.table, [1300, 1500, 1950, 1950, 2031], `Hypervolume against budget (${F.e4.seeds} seeds each; one fixed reference for all rows)`, { size: 19, aligns: [CT, CT, CT, CT, CT] }));
  out.push(para(`MOPSO is much better at small budgets: with 10 iterations (1,100 evaluations) it reaches a hypervolume of ${F.e4.hv.PSO[1].toFixed(2)}, which NSGA-II needs between 25 and 50 iterations to match. MOPSO was ahead of NSGA-II in all ${F.e4.seeds} seeds at budgets of 50 iterations or fewer. From 100 iterations on, NSGA-II was ahead in all ${F.e4.seeds} seeds, and at 200 iterations its hypervolume is ${F.e4.hv.GA[5].toFixed(3)} against ${F.e4.hv.PSO[5].toFixed(3)}. With five seeds the smallest attainable p value of the paired test is 0.062, which is what is reported for these unanimous comparisons. Random search improves slowly with budget and stays far below both optimisers.`));

  out.push(h4('E5: Held-out performance over 30 markets'));
  out.push(...table(['Strategy', 'Train Sharpe', 'Held-out Sharpe', 'Median', 'Held-out volatility', 'Held-out max DD', 'Wins vs EW', 'p vs EW'], F.e5.table, [2100, 800, 1250, 750, 1000, 950, 900, 981], 'Held-out performance over 30 independent markets (mean over markets; p is the paired Wilcoxon test of held-out Sharpe against equal weight)', { size: 18, aligns: [LT, CT, CT, CT, CT, CT, CT, CT] }));
  const v = F.e5.vol, dd = F.e5.dd, sm = F.e5.sharpe_means;
  out.push(para(`**Best-Sharpe portfolios.** The mean training Sharpe ratio of the chosen portfolios is ${sm['PSO best Sharpe'][0].toFixed(2)} for MOPSO and ${sm['GA best Sharpe'][0].toFixed(2)} for NSGA-II, but on held-out data it falls to ${sm['PSO best Sharpe'][1].toFixed(2)} and ${sm['GA best Sharpe'][1].toFixed(2)}, which is not better than equal weight (${sm['Equal weight'][1].toFixed(2)}). The differences from equal weight are not statistically significant, and MOPSO and NSGA-II do not differ from each other (p = ${F.e5.psoga_sharpe_p}). Random search, which has a much poorer front, performs about as well out of sample.`));
  out.push(para(`**Lowest-volatility portfolios.** These behave differently. Their held-out volatility is lower than that of equal weight in ${v['PSO min volatility'].wins} of 30 markets for MOPSO and ${v['GA min volatility'].wins} of 30 for NSGA-II (means ${pc(v['PSO min volatility'].mean)} and ${pc(v['GA min volatility'].mean)} against ${pc(v['PSO min volatility'].ew)}, p ${v['PSO min volatility'].p}). Their maximum drawdown is shallower than equal weight in ${dd['PSO min volatility'].wins} markets for MOPSO (p = ${dd['PSO min volatility'].p}) and ${dd['GA min volatility'].wins} for NSGA-II (p = ${dd['GA min volatility'].p}). Their held-out Sharpe ratio is similar to that of equal weight (${sm['PSO min volatility'][1].toFixed(2)} and ${sm['GA min volatility'][1].toFixed(2)} against ${sm['Equal weight'][1].toFixed(2)}).`));

  out.push(h4('E6: Operator ablation'));
  out.push(...table(['Variant', 'Hypervolume'], F.e6.table, [5000, 3731], `Effect of removing an operator (${F.e6.seeds} seeds; limit of 8 holdings)`, { size: 20, aligns: [LT, CT] }));
  out.push(para(`Removing the PSO turbulence step changed the hypervolume by ${F.e6.pso.diff.toFixed(4)} on average (p = ${F.e6.pso.p}), and removing the GA swap mutation by ${F.e6.ga.diff.toFixed(4)} (p = ${F.e6.ga.p}). Neither effect is distinguishable from seed-to-seed variation at this setting.`));

  out.push(h3('7.1.1', 'Statistical Analysis'));
  out.push(para('Because the number of seeds is small and the distributions of hypervolume and Sharpe ratio are not known to be normal, paired Wilcoxon signed-rank tests were used instead of t-tests. All tests are two-sided and uncorrected for multiple comparisons, so they should be read as indicative, and p values near 0.05 should not be treated as firm.'));
  out.push(...table(['Comparison', 'Pairs', 'Result', 'p'], [
    ['Hypervolume: MOPSO against random search', String(F.e1.seeds), 'MOPSO higher in all pairs', F.e1.p_pso_rnd],
    ['Hypervolume: NSGA-II against random search', String(F.e1.seeds), 'NSGA-II higher in all pairs', F.e1.p_ga_rnd],
    ['Hypervolume: MOPSO against NSGA-II', String(F.e1.seeds), `NSGA-II higher in ${F.e1.ga_wins} of ${F.e1.seeds}; mean difference ${Math.abs(F.e1.diff_pso_ga).toFixed(4)}`, F.e1.p_pso_ga],
    ['Spacing: MOPSO against NSGA-II', String(F.e1.seeds), 'MOPSO more even', F.e1.spacing_p],
    ['Hypervolume at 25 iterations: MOPSO against NSGA-II', String(F.e4.seeds), 'MOPSO higher in all pairs (smallest attainable p)', F.e4.p25],
    ['Hypervolume at 200 iterations: MOPSO against NSGA-II', String(F.e4.seeds), 'NSGA-II higher in all pairs (smallest attainable p)', F.e4.p200],
    ['Held-out Sharpe: MOPSO best Sharpe against equal weight', '30', 'Not different', F.e5.table[1][7]],
    ['Held-out Sharpe: NSGA-II best Sharpe against equal weight', '30', 'Not different', F.e5.table[2][7]],
    ['Held-out Sharpe: MOPSO against NSGA-II (best Sharpe)', '30', 'Not different', F.e5.psoga_sharpe_p],
    ['Held-out volatility: MOPSO minimum volatility against equal weight', '30', 'Lower in all 30', v['PSO min volatility'].p],
    ['Held-out volatility: NSGA-II minimum volatility against equal weight', '30', 'Lower in all 30', v['GA min volatility'].p],
    ['Held-out drawdown: NSGA-II minimum volatility against equal weight', '30', `Shallower in ${dd['GA min volatility'].wins} of 30`, dd['GA min volatility'].p],
    ['Ablation: PSO with and without turbulence', String(F.e6.seeds), 'Not different', F.e6.pso.p],
    ['Ablation: GA with and without swap mutation', String(F.e6.seeds), 'Not different', F.e6.ga.p],
  ], [4000, 700, 3131, 900], 'Summary of paired Wilcoxon signed-rank tests', { size: 19, aligns: [LT, CT, LT, CT] }));

  out.push(h2('7.2', 'Figures'));
  out.push(para('The figures in this section show single quantities. The first compares front quality at different budgets, the second contrasts the training and held-out Sharpe ratios, and the third shows the effect of removing an operator.'));
  const f1 = figure('fig_budget.png', 4.6, 'Hypervolume against the number of objective evaluations. Error bars are standard deviations over five seeds.');
  out.push(...f1.els);
  const f2 = figure('fig_train_test.png', 4.6, 'Mean Sharpe ratio on the training and the held-out window for each strategy, over 30 markets.');
  out.push(...f2.els);
  const f3 = figure('fig_ablation.png', 4.6, 'Hypervolume with and without the turbulence step (MOPSO) and the swap mutation (NSGA-II). Dots are individual seeds.');
  out.push(...f3.els);
  const f4 = figure('ui_lower.png', 6.0, 'Interface: held-out wealth curve of the selected portfolio against equal weight, with the comparison scorecard and the convergence chart.');
  out.push(...f4.els);

  out.push(h2('7.3', 'Subfigures'));
  out.push(para('The multi-panel figures below present the fronts, the convergence and the distributions behind the tables. Panels are labelled (a), (b) and (c) in the figures.'));
  const g1 = figure('fig_fronts_main.png', 6.0, 'Fronts found on the training window of the default market: (a) return against volatility; (b) return against CVaR.');
  out.push(...g1.els);
  const g2 = figure('fig_convergence_hv.png', 6.0, 'Best training Sharpe on the front per iteration for seed 0 (a) and hypervolume distribution over ten seeds (b).');
  out.push(...g2.els);
  out.push(para(`In ${g2.label}(a), MOPSO reaches 99% of its final best Sharpe ratio after ${F.e1.conv99.PSO} iterations and NSGA-II after ${F.e1.conv99.GA} iterations, and both end at the same value (${F.e1.final_sharpe.PSO.toFixed(3)}).`));
  const g3 = figure('fig_weights_wealth.png', 6.0, 'Best-Sharpe portfolios on the default market: (a) weights of the largest holdings; (b) held-out wealth of selected portfolios against equal weight.');
  out.push(...g3.els);
  const g4 = figure('fig_constraints.png', 6.0, 'Effect of the holding limit K: (a) hypervolume; (b) best training Sharpe on the front.');
  out.push(...g4.els);
  const g5 = figure('fig_scalability.png', 6.0, 'Scaling with the number of assets: (a) measured run time; (b) hypervolume.');
  out.push(...g5.els);
  const g6 = figure('fig_oos.png', 6.0, 'Held-out distributions over 30 markets: (a) Sharpe ratio; (b) volatility; (c) maximum drawdown. Boxes show quartiles and whiskers the range excluding outliers.');
  out.push(...g6.els);
  const g7 = figure('ui_dark.png', 6.0, 'The same screen in the dark colour scheme.');
  out.push(...g7.els);
  const g8 = figure('ui_mobile.png', 2.4, 'Phone-width layout: the stage comes first and the controls follow.');
  out.push(...g8.els);

  out.push(h2('7.4', 'Discussion'));
  out.push(para(`**Both optimisers approximate the front well and are close to each other.** Both reach a hypervolume of about 0.70 against about 0.25 for random search at the same budget, and they return about 100 non-dominated portfolios each. NSGA-II is marginally ahead on hypervolume at the default budget and MOPSO has the more even front, but the differences are small. The budget study explains why the ranking depends on how the comparison is set up: MOPSO converges in far fewer iterations (it reaches a hypervolume of ${F.e4.hv.PSO[1].toFixed(2)} after 10 iterations, a level that NSGA-II reaches after between 25 and 50), so it wins at small budgets, whereas NSGA-II keeps improving and finishes slightly ahead when given 100 iterations or more. A fair statement is that neither algorithm is better overall, MOPSO is preferable when evaluations are scarce, and NSGA-II is preferable when they are plentiful. This is consistent with a comparison at one budget being able to favour either algorithm.`));
  out.push(para('**Constraints are handled reliably and do not penalise the optimisers.** Using one repair operator for both algorithms meant that no run in the constraint study violated the cap or the holding limit. Tight limits do not hurt the best Sharpe ratio in this market because the best portfolio holds only four assets, while random search profits from the smaller feasible region.'));
  out.push(para('**The cost of a run is small and almost independent of the number of assets.** Evaluation is a single matrix product for the whole population, so a default run takes about a second and a half on four cores. The advantage over random search widens as the universe grows, as expected for a search space that grows with the number of assets.'));
  out.push(para('**Operator ablations show no measurable benefit.** The turbulence step and the swap mutation were added to keep the populations diverse, but removing them changed the hypervolume by less than 0.002 on average, well within seed-to-seed variation. The honest conclusion is that at these settings they are harmless safeguards and not drivers of performance. It remains possible that they matter in harder or longer runs.'));
  out.push(para(`**A better front does not mean a better portfolio on new data.** The most important result for a practitioner is in E5. Portfolios chosen for the best Sharpe ratio looked excellent in training (${sm['PSO best Sharpe'][0].toFixed(2)}) and fell to ${sm['PSO best Sharpe'][1].toFixed(2)} on unseen data, below the equal-weight portfolio at ${sm['Equal weight'][1].toFixed(2)}. Random search, with a far worse front, did about as well. This agrees with the arguments of Michaud {c:michaud} and the evidence of DeMiguel et al. {c:demiguel}. A simple calculation shows why it is expected in these markets: with about four years of data, the standard error of an annual mean return is roughly the asset’s annual volatility divided by the square root of the number of years, which for an asset with 25% volatility is about 12 percentage points. That is as large as the whole spread of true alphas used to generate the markets (from -2% to 10% a year), so the optimiser mostly fits noise in the means.`));
  out.push(para(`**Risk-based choices do transfer.** In contrast with returns, volatility is estimated far more precisely from the same data. The lowest-volatility portfolios had lower held-out volatility than equal weight in all 30 markets and often shallower drawdowns, while earning a similar Sharpe ratio. In the practical use of the tool, selecting from the low-risk end of the front is therefore the more dependable choice, and the high-return end should be treated sceptically. Because random search also finds acceptable minimum-volatility portfolios, the main value of the metaheuristics lies in producing a full, well-spread front rather than in a single extreme point.`));
  out.push(h4('Limitations'));
  out.push(...bullets([
    'All markets are simulated. Real prices have time-varying correlations, trends and regime changes that the generator does not capture, so the held-out findings need to be repeated on real data before any practical conclusion is drawn.',
    'Hypervolume is estimated by sampling and depends on the reference point. Only comparisons within a shared normalisation are made.',
    'The algorithm parameters (inertia, acceleration constants, distribution indices) were fixed at common values and not tuned, and a different setting could change the ranking.',
    'Two optimisers, one risk-free rate of zero, long-only portfolios and no trading costs in the main experiments.',
    'The tests are uncorrected for multiple comparisons, and five to ten seeds give limited power.',
  ]));

  out.push(h2('7.5', 'Conclusion'));
  out.push(para('The experiments show that both MOPSO and NSGA-II find much better fronts than random search under identical constraints and budget, that they are close to one another with MOPSO faster at small budgets and NSGA-II marginally better at large ones, and that portfolios chosen for return do not beat equal weight on unseen data while low-risk portfolios keep their risk advantage. The next chapter summarises the conclusions and future work.'));
  return out;
}

function ch8() {
  const out = [...chapter(8, 'Conclusion')];
  out.push(h2('8.1', 'Conclusion'));
  out.push(para('This project built SwarmFolio, a library and a browser workbench for multi-objective portfolio selection with a particle swarm optimiser and a genetic algorithm. Both optimisers search one shared constrained space of long-only portfolios, trading off annual return, volatility and CVaR, and both are checked by an automated test suite and by an interface test in a real browser.'));
  out.push(para('The main findings are as follows.'));
  out.push(...bullets([
    `Both algorithms approximate the Pareto front far better than random search at an equal budget (hypervolume about ${F.e1.hv.PSO[0].toFixed(2)} against ${F.e1.hv.Random[0].toFixed(2)}), and respect every constraint in every run.`,
    `MOPSO converges in far fewer iterations and gives a more even front. NSGA-II ends marginally ahead when given 100 or more iterations. The two cannot be separated in practical terms at the default budget.`,
    'A run takes about a second and a half and the cost is nearly independent of the number of assets up to 60.',
    'The PSO turbulence step and the GA swap mutation did not measurably change front quality at the tested settings.',
    'Portfolios chosen for the best Sharpe ratio on training data did not outperform the equal-weight portfolio on held-out data in 30 simulated markets, while minimum-volatility portfolios kept clearly lower held-out volatility in all 30. Optimisation quality on the training window should therefore not be read as a promise of future return.',
    'The interface makes the search observable and each portfolio inspectable, and lets users bring their own prices.',
  ]));
  out.push(para('The study has limits that are stated in Section 7.4: the markets are simulated, parameters were not tuned and the number of seeds is modest. The conclusions about out-of-sample behaviour are consistent with the literature, but are demonstrated here only on simulated data.'));

  out.push(h2('8.2', 'Future Scope'));
  out.push(...bullets([
    '**Real-market validation.** Repeat the held-out study on historical prices of a stock index across many rolling windows, using the CSV import that already exists.',
    '**Better risk and return estimation.** Add shrinkage covariance estimators and robust return estimates, which are the standard remedy for the estimation-error problem seen in the held-out results.',
    '**More objectives and constraints.** Add turnover and transaction cost as objectives, sector limits, and a minimum-lot constraint.',
    '**More algorithms.** Add decomposition-based and indicator-based evolutionary algorithms, and hybrid swarm-genetic variants, and tune parameters with a systematic search.',
    '**Exact hypervolume and statistical rigour.** Use an exact hypervolume routine and correct for multiple comparisons, with more seeds.',
    '**Deployment.** Add authentication, rate limiting and an isolated worker process so that the workbench can be hosted for a class, and store jobs and results on disk.',
    '**Education features.** Add guided exercises in the interface that explain dominance, the effect of constraints and over-fitting on the user’s own run.',
  ]));
  return out;
}

module.exports = { ch6, ch7, ch8 };
