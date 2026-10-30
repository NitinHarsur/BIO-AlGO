const L = require('./lib');
const { d, para, h2, h3, h4, bullets, numbered, table, figure, chapter, code, equation } = L;

function ch4() {
  const out = [...chapter(4, 'Design')];
  out.push(h2('4.1', 'High Level Design'));
  out.push(h3('4.1.1', 'System Architecture'));
  out.push(para('SwarmFolio has three layers, shown in the figure below. The browser presents controls and charts and exchanges JSON with a small server. The server owns the jobs: it starts each optimisation on worker threads, stores the most recent snapshot of each population, and returns it when the browser polls. The optimisation core is an ordinary Python package that does not depend on the server, so the same code is used by the command-line tool, the tests and the web application.'));
  const f1 = figure('fig_architecture.png', 5.6, 'Three-layer architecture of SwarmFolio.');
  out.push(...f1.els);
  out.push(para('A run proceeds as follows. The browser sends the configuration to the run endpoint. The server validates it, builds the market and the portfolio problem, draws 300 random feasible portfolios as a visual backdrop, and starts MOPSO and NSGA-II on separate threads. Each optimiser calls a callback once per iteration, which records the current population and front. The browser polls the job about nine times a second and redraws. When both optimisers finish, the server runs the random-search baseline, scores every front on the held-out data, selects portfolios by the three rules, and publishes the final result.'));

  out.push(h3('4.1.2', 'Abstract specification of Sub-systems'));
  out.push(...table(['Sub-system (module)', 'Responsibility', 'Main inputs and outputs'], [
    ['Data (data.py)', 'Generate the synthetic market or load prices from CSV', 'Seed, size, or a file; returns a table of daily returns'],
    ['Problem (problem.py)', 'Define objectives and constraints; repair; evaluate', 'Return matrix and constraint settings; weights in, objective rows out'],
    ['MOPSO (pso.py)', 'Multi-objective swarm search with an external archive', 'Problem and swarm parameters; non-dominated set and history'],
    ['NSGA-II (ga.py)', 'Multi-objective genetic search', 'Problem and GA parameters; non-dominated set and history'],
    ['Pareto utilities (pareto.py)', 'Non-dominated sorting, crowding distance, hypervolume, spacing', 'Objective matrices'],
    ['Baselines (baselines.py)', 'Equal-weight portfolio and random search', 'Problem and a budget'],
    ['Back-test (backtest.py)', 'Selection rules, performance metrics, walk-forward test', 'Fronts and held-out returns'],
    ['Server (server.py)', 'Job manager, JSON API, static files', 'HTTP requests; JSON responses'],
    ['Web interface (web/)', 'Controls, live canvas, inspector, charts', 'User actions; API responses'],
    ['Command line (cli.py)', 'Batch comparison that writes tables and plots', 'Arguments; files'],
  ], [2300, 3500, 2931], 'Sub-systems and their responsibilities'));

  out.push(h3('4.1.3', 'Interface Design'));
  out.push(para('The interface is a single page with a control rail on the left and a working area on the right. On narrow screens the working area comes first and the rail follows. The design aims to keep the swarm visualisation as the focus and to keep everything else quiet. Colour is used for data only: blue stands for the particle swarm, orange for the genetic algorithm and grey for random portfolios, and the same colours are used in every chart. A light and a dark theme are provided and follow the system setting.'));
  out.push(para('The stage shows annual return against volatility, with an option to switch the horizontal axis to CVaR. Dots for each algorithm are coloured, and the legend entries can be toggled. Two thin meters show how far each search has progressed. After the run, the chart shows the two fronts as lines with points, an equal-weight marker, and a ring on the selected portfolio.'));
  out.push(...[ ].concat([]));
  const fo = figure('ui_overview.png', 6.0, 'Main screen after a run: control rail on the left, risk-return stage on the right.');
  out.push(...fo.els);
  const fr = figure('ui_running.png', 6.0, 'The stage while the searches are running. Faint points are the current populations and solid points are the current non-dominated fronts.');
  out.push(...fr.els);
  out.push(para('Below the stage, the inspector lets the user choose an algorithm and a selection rule, or drag a slider along the front. It shows a table of training and held-out performance beside the equal-weight portfolio, the weights as horizontal bars, and the held-out wealth curve. A scorecard and a convergence chart summarise the comparison of the methods.'));
  const fi = figure('ui_inspector.png', 6.0, 'Portfolio inspector with selection controls, performance table and weights.');
  out.push(...fi.els);
  out.push(para('The browser and server communicate through three endpoints, summarised below.'));
  out.push(...table(['Endpoint', 'Method', 'Purpose'], [
    ['/api/run', 'POST', 'Start a job. Body: JSON configuration (data source, constraints, budget). Returns the job id. Rejects invalid values with a message.'],
    ['/api/jobs/<id>', 'GET', 'Poll a job. Returns status, per-algorithm progress, the latest population and front of each algorithm and, when done, the full result.'],
    ['/api/jobs/<id>/cancel', 'POST', 'Stop a running job.'],
  ], [2400, 1100, 5231], 'HTTP interface of the server'));
  out.push(para('Errors are shown where the user can act on them. For example, if the cap and holding limit cannot both be met, the message appears under the constraint fields and the run button is disabled, as in the figure below.'));
  const fe = figure('ui_error.png', 3.0, 'Inline validation message for an infeasible constraint combination.');
  out.push(...fe.els);

  out.push(h2('4.2', 'Methodology'));
  out.push(h3('4.2.1', 'Research Design'));
  out.push(para('The study is a controlled computational experiment. All algorithms see the same training data and the same constraints, and each is given the same number of objective evaluations. Six experiments were run. Each used 5 to 30 independent seeds so that variation could be reported and tested.'));
  out.push(...table(['ID', 'Question', 'Design'], [
    ['E1', 'Does each algorithm approximate the front better than random search, and do the algorithms differ?', 'Default setting (20 assets, 1,500 days), 10 seeds, hypervolume with shared normalisation, spacing, runtime'],
    ['E2', 'How do tighter cardinality limits affect front quality?', 'Limit K of 20 (none), 10, 8 and 5 holdings, 5 seeds each'],
    ['E3', 'How do results and runtime scale with the number of assets?', '10, 20, 40 and 60 assets, 3 seeds each'],
    ['E4', 'How fast does front quality improve with search budget?', '5, 10, 25, 50, 100 and 200 iterations, 5 seeds each'],
    ['E5', 'Do portfolios chosen from the fronts outperform equal weight on unseen data?', '30 independent simulated markets; PSO, GA and random search each pick best-Sharpe and minimum-volatility portfolios on the training window; evaluated on held-out data'],
    ['E6', 'Do the PSO turbulence and GA swap-mutation operators help?', 'Full versus operator removed, cardinality limit 8, 8 seeds'],
  ], [700, 3600, 4431], 'Experimental design'));
  out.push(para('**Indicators.** Hypervolume is the fraction of a normalised objective box that is dominated by a front. The box runs from the best value of each objective over all fronts being compared to a reference point just beyond the worst value, so that methods compared in the same run share one scale. It is estimated by Monte Carlo sampling with 200,000 points. Spacing is the Schott metric {c:schott}. Front size is the number of non-dominated points. Runtime is wall-clock time of one run.'));
  out.push(para('**Held-out metrics.** For a daily return series r~~t~~ of a portfolio the annualised return is 252 times the mean, the annualised volatility is the sample standard deviation times the square root of 252, and the Sharpe ratio is their quotient (risk-free rate taken as zero). Maximum drawdown is the largest peak-to-trough fall of cumulative wealth.'));
  out.push(para('**Statistical test.** For E5 the held-out Sharpe ratio of each strategy is compared with that of equal weight over the 30 markets using the paired Wilcoxon signed-rank test {c:wilcoxon} implemented in SciPy {c:scipy}. For E1 the hypervolumes of two algorithms over the seeds are compared with the same paired test.'));

  out.push(h3('4.2.2', 'Data Collection'));
  out.push(para('No licensed market data was used. The experiments use a seeded synthetic market, which makes every result reproducible and lets the experiments be repeated on many independent markets. Returns of asset i on day t are generated from a one-factor market model plus sector factors and idiosyncratic noise:'));
  out.push(equation('r~~i,t~~ = α~~i~~ + β~~i~~ m~~t~~ + s~~k(i),t~~ + σ~~i~~ ε~~i,t~~', '1'));
  out.push(para('where m~~t~~ is the market factor, s~~k(i),t~~ the factor of the asset’s sector, and ε a standardised Student-t variable with five degrees of freedom, which gives fat tails. The parameters are listed in the table below. A crisis regime between 45% and 51% of the sample multiplies returns by 2.2 and adds a negative drift proportional to beta, so that volatility and tail risk do not move together with mean return.'));
  out.push(...table(['Component', 'Setting'], [
    ['Market factor m~~t~~', 'Mean 7% per year; daily volatility 0.9%; Student-t, 5 d.o.f.'],
    ['Sector factors', '4 sectors; daily volatility 0.5%; Student-t, 5 d.o.f.'],
    ['Asset beta β~~i~~', 'Uniform on [0.5, 1.4]'],
    ['Asset alpha α~~i~~', 'Uniform on [-2%, 10%] per year'],
    ['Idiosyncratic volatility σ~~i~~', 'Uniform on [0.6%, 2.0%] per day'],
    ['Crisis regime', 'Days 45% to 51% of the sample: returns x 2.2, drift -0.15% x beta per day'],
    ['Default size', '20 assets, 1,500 business days from 1 January 2018'],
    ['Train / test split', '70% / 30% in time order (first 1,050 days train, last 450 days test)'],
  ], [3000, 5731], 'Parameters of the synthetic market'));
  out.push(para('The CSV loader accepts a wide file with a date column and one adjusted-close column per ticker. It drops tickers with more than 5% missing prices, forward-fills gaps, and converts prices to daily simple returns. The same train and test split is applied.'));
  return out;
}

function ch5() {
  const out = [...chapter(5, 'Implementation')];
  out.push(h2('5.1', 'Pseudo code'));
  out.push(para('For a portfolio w in R^^N^^ (N assets) and a matrix R of T daily returns, the three objectives that are minimised are'));
  out.push(equation('f~~1~~(w) = \u2212252 \u00B7 mean(Rw)', '2'));
  out.push(equation('f~~2~~(w) = \u221A252 \u00B7 std(Rw)', '3'));
  out.push(equation('f~~3~~(w) = \u2212(mean of the k lowest values of Rw)', '4'));
  out.push(para('where k is the ceiling of 0.05 T. All three are computed for a whole population at once as a matrix product followed by a sort, which is why a population of 100 can be evaluated in well under a millisecond.'));
  out.push(...code([
    'function REPAIR(x):                      # any real vector -> feasible weights',
    '    w <- max(x, 0)',
    '    if K is set: keep the K largest entries of w, zero the rest',
    '    normalise w to sum 1; set entries below w_min to 0',
    '    if fewer than ceil(1/w_max) entries are non-zero:',
    '        activate further assets in order of x with a small weight',
    '    normalise w to sum 1',
    '    repeat while some w_i > w_max:',
    '        excess <- sum over i of (w_i - w_max); set those w_i to w_max',
    '        give the excess to the other non-zero assets in proportion to w',
    '        (if all are capped, give it to the next assets in order of x)',
    '    return w / sum(w)',
  ], 'Algorithm 1: Constraint repair'));
  out.push(...code([
    'function MOPSO(problem, N, T, archive_size):',
    '    X <- REPAIR(random vectors); V <- small random velocities',
    '    F <- EVALUATE(X); PBEST <- X; ARCHIVE <- non-dominated(X, F)',
    '    for t = 1..T:',
    '        w <- 0.9 - 0.5 * t/T                       # linearly decreasing inertia',
    '        for each particle i:',
    '            leader_i <- binary tournament on ARCHIVE by crowding distance',
    '            V_i <- w*V_i + 1.5*r1*(PBEST_i - X_i) + 1.5*r2*(leader_i - X_i)',
    '            clip V_i to [-0.3, 0.3]; X_i <- X_i + V_i',
    '            with probability 0.1: add Gaussian noise (sd 0.1) to 30% of the entries',
    '        X <- REPAIR(X); F <- EVALUATE(X)',
    '        for each i: if F_i dominates PBEST_i, or neither dominates (50% chance):',
    '            PBEST_i <- X_i',
    '        ARCHIVE <- non-dominated(ARCHIVE + X); remove duplicates',
    '        while |ARCHIVE| > archive_size: remove the most crowded point',
    '    return ARCHIVE',
  ], 'Algorithm 2: Multi-objective particle swarm optimiser'));
  out.push(...code([
    'function NSGA2(problem, P, G):',
    '    X <- REPAIR(random vectors); F <- EVALUATE(X)',
    '    for g = 1..G:',
    '        rank, crowd <- NON_DOMINATED_SORT(F), CROWDING_DISTANCE(F)',
    '        parents <- binary tournament (lower rank wins; ties: larger crowding)',
    '        children <- SBX crossover(parents, eta_c=15, p_c=0.9)',
    '        children <- polynomial mutation(eta_m=20); swap mutation with p=0.2',
    '                    (move the weight of one held asset to a random asset)',
    '        children <- REPAIR(children); F_c <- EVALUATE(children)',
    '        pool <- X + children; sort pool by (rank, -crowding)',
    '        X, F <- first P members of the sorted pool',
    '    return rank-0 members of X',
  ], 'Algorithm 3: NSGA-II genetic algorithm'));
  out.push(para('The two flowcharts below show the same procedures graphically, and the third figure shows the repair operator that both algorithms share.'));
  const f1 = figure('fig_flow_pso.png', 3.3, 'Flowchart of the multi-objective particle swarm optimiser.');
  out.push(...f1.els);
  const f2 = figure('fig_flow_ga.png', 3.3, 'Flowchart of the NSGA-II genetic algorithm.');
  out.push(...f2.els);
  const f3 = figure('fig_repair.png', 6.0, 'The repair operator shared by both algorithms.');
  out.push(...f3.els);

  out.push(h2('5.2', 'Use of appropriate advanced tools and techniques'));
  out.push(...table(['Technique or tool', 'Where it is used', 'Reason'], [
    ['Fast non-dominated sorting {c:deb02}', 'NSGA-II survival and tournament', 'Orders solutions by Pareto rank in one pass over a dominance matrix'],
    ['Crowding distance {c:deb02}', 'NSGA-II, MOPSO leader choice and archive pruning', 'Keeps the front spread out'],
    ['External archive {c:coello}', 'MOPSO', 'Stores non-dominated solutions that guide the swarm'],
    ['Inertia weight schedule {c:shi}', 'MOPSO', 'Explores early and refines late'],
    ['Simulated binary crossover {c:debagr}', 'NSGA-II', 'Real-coded crossover with controlled spread'],
    ['Vectorised evaluation (NumPy {c:numpy})', 'All objective calculations', 'One matrix product evaluates the whole population'],
    ['Monte Carlo hypervolume', 'Front comparison', 'A three-objective hypervolume without a specialised library'],
    ['Seeded generators', 'Everything stochastic', 'Exact reproducibility of every experiment'],
    ['Worker threads with progress callbacks', 'Server', 'Both searches run side by side and can be observed and cancelled'],
    ['Canvas rendering with eased axes', 'Interface', 'Smooth animation of hundreds of points without a charting library'],
  ], [3000, 2700, 3031], 'Techniques and tools'));

  out.push(h2('5.3', 'Novelty'));
  out.push(para('The project does not propose a new optimisation algorithm; both optimisers are established methods. Its contribution lies in how they are set up, compared and presented:'));
  out.push(...bullets([
    '**One feasible space for both optimisers.** A single repair operator is applied to every position, offspring and initial candidate, so differences between the algorithms are not confounded by constraint handling.',
    '**Three-objective formulation with CVaR** solved by a swarm and a GA in the same framework, with cardinality, cap and floor constraints.',
    '**Shared-normalisation hypervolume.** Methods compared in one run use the same ideal and reference points, so their hypervolumes are directly comparable.',
    '**Operator ablations.** The PSO turbulence step and the GA swap mutation, which are specific to this implementation, are tested by removing them (E6).',
    '**Evaluation on many markets.** The held-out comparison with equal weight uses 30 independent simulated markets and a paired test, rather than one data set.',
    '**Observable search.** The interface animates both populations during the run and lets the user inspect any portfolio on the final fronts.',
  ]));

  out.push(h2('5.4', 'Mitigation of AI Security threats'));
  out.push(...table(['Threat (Section 3.7.1)', 'Mitigation implemented', 'Verified by'], [
    ['Malformed or oversized input', 'Request bodies are limited to 8 MB; the JSON body must be an object; numeric parameters are range-checked (4 to 60 assets, 300 to 5,000 days, 10 to 300 population, 5 to 500 iterations); CSV parse errors are returned as messages', 'Server tests for out-of-range input; manual upload test'],
    ['Script injection through asset names', 'All text derived from uploaded files is escaped before it is placed in the page', 'Code review of the rendering functions'],
    ['Resource exhaustion', 'Parameter bounds; a new run cancels earlier jobs; only the eight most recent jobs are kept; progress and cancel endpoints', 'Stop-button test'],
    ['Path traversal', 'Requested paths are resolved and must lie inside the web directory; otherwise the server returns 404', 'Server test requesting a parent-directory path'],
    ['Data manipulation or outliers', 'Held-out evaluation and an equal-weight baseline expose over-fitting; the weight cap and cardinality limit reduce concentration; no code is executed from data', 'Experiments E5; test suite'],
    ['Unauthorised access', 'The server binds to the local machine by default and has no accounts; the report states that it is for local use and must not be exposed to the internet without authentication', 'Default bind address'],
  ], [2300, 4331, 2100], 'Security threats and mitigations'));
  out.push(para('These measures are proportionate to a locally run teaching and research tool. They do not make the server suitable for public deployment, and a hosted version would need authentication, rate limiting and an isolated worker process.'));
  return out;
}

module.exports = { ch4, ch5 };
