const L = require('./lib');
const { d, para, h2, h3, h4, bullets, numbered, table, figure, chapter, code, equation } = L;

function ch4() {
  const out = [...chapter(4, 'Design')];
  out.push(h2('4.1', 'High Level Design'));
  out.push(h3('4.1.1', 'System Architecture'));
  out.push(para('SwarmFolio has three layers (figure below). The browser presents controls and charts and exchanges JSON with a small server. The server owns the jobs: it runs each optimisation on worker threads, keeps the latest snapshot of each population and returns it when the browser polls. The optimisation core is an ordinary Python package with no dependence on the server, so the command-line tool, the tests and the web application all use the same code.'));
  const f1 = figure('fig_architecture.png', 5.2, 'Three-layer architecture of SwarmFolio.');
  out.push(...f1.els);
  out.push(para('A run proceeds as follows. The browser sends the configuration; the server validates it, builds the market and the problem, and starts MOPSO and NSGA-II on separate threads. Each optimiser calls a callback every iteration that records its population and front. The browser polls about nine times a second and redraws. When both finish, the server runs the random-search baseline, scores every front on the held-out data and publishes the result.'));

  out.push(h3('4.1.2', 'Abstract specification of Sub-systems'));
  out.push(...table(['Sub-system (module)', 'Responsibility', 'Inputs and outputs'], [
    ['Data (data.py)', 'Synthetic market or CSV loader', 'Seed and size, or a file; daily returns'],
    ['Problem (problem.py)', 'Objectives, constraints, repair, evaluation', 'Returns and settings; weights in, objectives out'],
    ['MOPSO (pso.py)', 'Multi-objective swarm search with archive', 'Problem and parameters; non-dominated set'],
    ['NSGA-II (ga.py)', 'Multi-objective genetic search', 'Problem and parameters; non-dominated set'],
    ['Pareto, baselines, back-test', 'Sorting, hypervolume, spacing; equal weight and random search; selection and performance metrics', 'Objective matrices, fronts and held-out returns'],
    ['Server (server.py)', 'Job manager, JSON API, static files', 'HTTP requests; JSON responses'],
    ['Web interface (web/)', 'Controls, live canvas, inspector, charts', 'User actions; API responses'],
  ], [2400, 3600, 2731], 'Sub-systems and their responsibilities'));

  out.push(h3('4.1.3', 'Interface Design'));
  out.push(para('The interface is a single page with a control rail on the left and a working area on the right; on narrow screens the working area comes first. Colour is used for data only (blue for the swarm, orange for the genetic algorithm, grey for random portfolios), and light and dark themes follow the system setting. The stage plots annual return against volatility (or CVaR) and shows both populations while they search; afterwards it shows the two fronts, an equal-weight marker and a ring on the selected portfolio. Below it, the inspector shows weights, training against held-out performance and a held-out wealth curve. If a setting is impossible, for example a 10% cap with five holdings, a message appears under the field and the run button is disabled.'));
  const fo = figure('ui_overview.png', 5.6, 'Main screen after a run: control rail on the left, risk-return stage on the right.');
  out.push(...fo.els);
  const fi = figure('ui_inspector.png', 5.6, 'Portfolio inspector with selection controls, performance table and weights.');
  out.push(...fi.els);
  out.push(...table(['Endpoint', 'Method', 'Purpose'], [
    ['/api/run', 'POST', 'Start a job from a JSON configuration; returns the job id or an error message.'],
    ['/api/jobs/<id>', 'GET', 'Poll status, progress, the latest population and front of each algorithm and, when done, the full result.'],
    ['/api/jobs/<id>/cancel', 'POST', 'Stop a running job.'],
  ], [2400, 1100, 5231], 'HTTP interface of the server'));

  out.push(h2('4.2', 'Methodology'));
  out.push(h3('4.2.1', 'Research Design'));
  out.push(para('The study is a controlled computational experiment. All algorithms see the same training data and constraints and get the same number of objective evaluations. Six experiments were run with 3 to 30 independent seeds.'));
  out.push(...table(['ID', 'Question', 'Design'], [
    ['E1', 'Do both algorithms beat random search, and do they differ?', 'Default setting (20 assets, 1,500 days), 10 seeds'],
    ['E2', 'How do tighter holding limits affect front quality?', 'K of none, 10, 8 and 5 holdings, 5 seeds each'],
    ['E3', 'How do results and run time scale with assets?', '10, 20, 40 and 60 assets, 3 seeds each'],
    ['E4', 'How fast does front quality improve with budget?', '5 to 200 iterations, 5 seeds each'],
    ['E5', 'Do chosen portfolios beat equal weight on unseen data?', '30 simulated markets; best-Sharpe and minimum-volatility picks'],
    ['E6', 'Do the turbulence and swap-mutation operators help?', 'Full against operator removed, K = 8, 8 seeds'],
  ], [700, 3900, 4131], 'Experimental design'));
  out.push(para('**Indicators.** Hypervolume is the fraction of a normalised objective box dominated by a front. The box runs from the best value of each objective over all fronts compared to a reference point just beyond the worst, so methods compared in one run share a scale; it is estimated with 200,000 Monte Carlo samples. Spacing is the Schott metric {c:schott}, front size is the number of non-dominated points, and runtime is wall-clock time. **Held-out metrics:** annualised return is 252 times the mean daily return, volatility is the daily standard deviation times the square root of 252, the Sharpe ratio is their quotient (risk-free rate zero) and maximum drawdown is the largest peak-to-trough fall of wealth. **Statistics:** paired Wilcoxon signed-rank tests {c:wilcoxon} from SciPy {c:scipy}.'));

  out.push(h3('4.2.2', 'Data Collection'));
  out.push(para('No licensed market data was used. The experiments use a seeded synthetic market, which makes every result reproducible and allows many independent markets. Returns of asset i on day t follow a market-plus-sector factor model with fat-tailed noise:'));
  out.push(equation('r~~i,t~~ = α~~i~~ + β~~i~~ m~~t~~ + s~~k(i),t~~ + σ~~i~~ ε~~i,t~~', '1'));
  out.push(para('Here m~~t~~ is the market factor, s~~k(i),t~~ the asset’s sector factor and ε a standardised Student-t variable with five degrees of freedom. A crisis regime between 45% and 51% of the sample multiplies returns by 2.2 and adds negative drift. The CSV loader accepts a wide file of adjusted close prices, drops tickers with more than 5% missing values, forward-fills gaps and converts to daily returns; the same 70/30 split applies.'));
  out.push(...table(['Component', 'Setting'], [
    ['Market factor m~~t~~', 'Mean 7% a year; daily volatility 0.9%; Student-t, 5 d.o.f.'],
    ['Sector factors', '4 sectors; daily volatility 0.5%'],
    ['Beta β~~i~~ and alpha α~~i~~', 'Uniform on [0.5, 1.4]; uniform on [-2%, 10%] a year'],
    ['Idiosyncratic volatility σ~~i~~', 'Uniform on [0.6%, 2.0%] a day'],
    ['Crisis regime', 'Days 45% to 51% of the sample: returns x 2.2, drift -0.15% x beta a day'],
    ['Default size and split', '20 assets, 1,500 business days; first 1,050 days train, last 450 days test'],
  ], [3000, 5731], 'Parameters of the synthetic market'));
  return out;
}

function ch5() {
  const out = [...chapter(5, 'Implementation')];
  out.push(h2('5.1', 'Pseudo code'));
  out.push(para('This section first explains, in plain words, what the two optimisation algorithms are, what they do in this project and how they work, and then gives the pseudo code of the implementation.'));

  out.push(h3('5.1.1', 'Particle Swarm Optimization (PSO)'));
  out.push(para('**What it is.** Particle Swarm Optimization is a search method inspired by a flock of birds looking for food. No bird knows where the food is, but each one remembers the best place it has found and watches where its neighbours have done well, and the flock gradually drifts toward good areas {c:kennedy}. In SwarmFolio each bird, called a particle, is one candidate portfolio: a list of weights, one per stock, that add up to 100%. A swarm of 100 particles moves around the space of possible portfolios.'));
  out.push(para('**What it does here.** The swarm looks for portfolios with high return and low volatility and CVaR. Because these goals conflict, it does not seek one best portfolio. It builds a set of non-dominated portfolios (the Pareto front), where no portfolio can be improved on one goal without getting worse on another. This multi-objective version keeps an external archive of such portfolios and lets it guide the swarm {c:coello}.'));
  out.push(para('**How it works.** Each particle has a position (its current weights) and a velocity (the direction and size of its next step). Every iteration, for each particle:', { after: 60, keepNext: true }));
  out.push(...numbered([
    '**Score** the portfolio on the three objectives and remember the particle’s own best portfolio so far (its personal best).',
    '**Pick a leader** from the archive of non-dominated portfolios. Leaders in sparsely populated parts of the front are preferred, which keeps the front spread out.',
    '**Move.** The new velocity combines three pulls: momentum (keep going the same way), the particle’s own best, and the leader. The particle then steps along that velocity (equations 2 and 3).',
    '**Repair and shake.** The new weights are repaired so they stay legal (long-only, capped, within the holding limit), and with small probability random noise (turbulence) is added so that the swarm does not pile onto the same few stocks.',
    '**Update the archive**: add new non-dominated portfolios, remove dominated and duplicate ones, and trim the most crowded points.',
  ]));
  out.push(equation('v ← w · v + c~~1~~ r~~1~~ (pbest − x) + c~~2~~ r~~2~~ (leader − x)', '2'));
  out.push(equation('x ← x + v', '3'));
  out.push(para('Here x is the particle’s weights, v its velocity, r~~1~~ and r~~2~~ random numbers between 0 and 1, and c~~1~~ = c~~2~~ = 1.5. The inertia weight w falls from 0.9 to 0.4 {c:shi}, so the swarm explores widely at first and refines later. After 150 iterations the archive is the result.'));

  out.push(h3('5.1.2', 'Genetic Algorithm (NSGA-II)'));
  out.push(para('**What it is.** A genetic algorithm copies natural selection {c:holland}. Better candidates are more likely to become parents, parents mix their genes to make children, random mutation adds novelty, and over many generations the population improves. NSGA-II {c:deb02} is the standard version for several objectives. In SwarmFolio each individual is a portfolio, and its genes are the weights of the stocks.'));
  out.push(para('**What it does here.** Like the swarm, it searches for a front of non-dominated portfolios. Since “better” cannot be a single number with three objectives, NSGA-II ranks individuals by dominance. Rank 0 holds the portfolios that no other portfolio dominates; remove them and the next set is rank 1, and so on. Among equals, the one in a less crowded region wins, using the crowding distance, so that the front stays diverse.'));
  out.push(para('**How it works.** A population of 100 portfolios goes through the following steps each generation:', { after: 60, keepNext: true }));
  out.push(...numbered([
    '**Rank** every individual by non-domination and compute its crowding distance.',
    '**Select parents** by tournament: pick two at random and keep the one with the better rank, or the larger crowding distance if the ranks are equal.',
    '**Crossover.** Simulated binary crossover {c:debagr} blends the weights of two parents into two children that lie near the parents.',
    '**Mutate.** Small random changes are made to the weights, and a swap mutation moves the whole weight of one holding to another stock, which changes which stocks are held.',
    '**Repair** the children so they are legal portfolios, and score them.',
    '**Survive.** Parents and children (200 in all) are pooled and the best 100 by rank, then crowding distance, are kept. Because good portfolios are never discarded (elitism), the front can only improve.',
  ]));
  out.push(para('After 150 generations, the rank-0 individuals are the result.'));

  out.push(h3('5.1.3', 'How the two algorithms differ'));
  out.push(...table(['Aspect', 'MOPSO (particle swarm)', 'NSGA-II (genetic algorithm)'], [
    ['Inspired by', 'Flocking of birds or fish', 'Natural selection and genetics'],
    ['New candidates', 'Particles move: velocity pulled by own best and an archive leader', 'Selected parents are crossed and mutated into children'],
    ['What guides the search', 'Leaders drawn from the archive of non-dominated portfolios', 'Rank by dominance, then crowding distance'],
    ['Memory', 'Personal best of each particle plus the archive', 'The whole population, with elitist survival'],
    ['Keeps the front spread out', 'Crowding-based leader choice and archive pruning', 'Crowding distance in selection and survival'],
    ['Strength in our results', 'Converges fast; best at small budgets', 'Slightly better from about 100 iterations'],
  ], [2000, 3400, 3331], 'Comparison of the two algorithms'));
  out.push(...table(['Setting', 'MOPSO', 'NSGA-II'], [
    ['Population and iterations', '100 particles, 150 iterations', '100 individuals, 150 generations'],
    ['Main parameters', 'Inertia 0.9 to 0.4, c~~1~~ = c~~2~~ = 1.5, maximum velocity 0.3, turbulence 10%', 'Crossover probability 0.9, SBX index 15, mutation index 20, swap mutation 0.2'],
    ['Result kept', 'Archive of up to 100 portfolios', 'Rank-0 front of the final population'],
    ['Evaluations', '15,100 per run', '15,100 per run'],
  ], [2300, 3500, 2931], 'Parameter settings used for both algorithms'));

  out.push(h3('5.1.4', 'Pseudo code of the implementation'));
  out.push(para('For a portfolio w in R^^N^^ and a matrix R of T daily returns, the three objectives that are minimised are'));
  out.push(equation('f~~1~~(w) = −252 · mean(Rw)', '4'));
  out.push(equation('f~~2~~(w) = √252 · std(Rw)', '5'));
  out.push(equation('f~~3~~(w) = −(mean of the k lowest values of Rw)', '6'));
  out.push(para('where k is the ceiling of 0.05 T. All three are computed for a whole population at once as a matrix product followed by a sort. Algorithm 1 is the repair operator shared by both optimisers; Algorithms 2 and 3 are the optimisers themselves.'));
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
    '            with probability 0.1: add Gaussian noise (sd 0.1) to 30% of entries',
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
    '        children <- REPAIR(children); F_c <- EVALUATE(children)',
    '        pool <- X + children; sort pool by (rank, -crowding)',
    '        X, F <- first P members of the sorted pool',
    '    return rank-0 members of X',
  ], 'Algorithm 3: NSGA-II genetic algorithm'));
  const f3 = figure('fig_flowcharts.png', 5.6, 'Flowcharts of (a) the multi-objective particle swarm optimiser and (b) the NSGA-II genetic algorithm.');
  out.push(...f3.els);

  out.push(h2('5.2', 'Use of appropriate advanced tools and techniques'));
  out.push(...table(['Technique or tool', 'Where it is used', 'Reason'], [
    ['Fast non-dominated sorting, crowding distance {c:deb02}', 'NSGA-II; MOPSO leader choice and archive pruning', 'Pareto ranking in one pass; keeps the front spread out'],
    ['External archive {c:coello}', 'MOPSO', 'Stores the non-dominated solutions that guide the swarm'],
    ['Inertia weight schedule {c:shi}', 'MOPSO', 'Explores early and refines late'],
    ['Simulated binary crossover {c:debagr}', 'NSGA-II', 'Real-coded crossover with controlled spread'],
    ['Vectorised evaluation (NumPy {c:numpy})', 'All objective calculations', 'One matrix product scores a whole population'],
    ['Monte Carlo hypervolume, seeded generators', 'Front comparison and every stochastic step', 'Three-objective hypervolume without extra libraries; exact reproducibility'],
    ['Worker threads and a canvas interface', 'Server and browser', 'Both searches run side by side, can be cancelled and are animated smoothly'],
  ], [3100, 2700, 2931], 'Techniques and tools'));

  out.push(h2('5.3', 'Novelty'));
  out.push(para('Both optimisers are established methods, so the contribution lies in how they are set up, compared and presented:'));
  out.push(...bullets([
    '**One feasible space for both optimisers:** a single repair operator is applied to every position, offspring and initial candidate.',
    '**Three-objective formulation with CVaR** solved by a swarm and a GA in one framework, with cap, floor and cardinality constraints.',
    '**Shared-normalisation hypervolume, operator ablations and a 30-market held-out study** with paired tests.',
    '**Observable search:** the interface animates both populations and lets the user inspect any portfolio on the fronts.',
  ]));

  out.push(h2('5.4', 'Mitigation of AI Security threats'));
  out.push(...table(['Threat (Section 3.7.1)', 'Mitigation implemented', 'Verified by'], [
    ['Malformed or oversized input', 'Bodies limited to 8 MB; JSON object required; numeric parameters range-checked; CSV errors returned as messages', 'Server tests; upload test'],
    ['Script injection through asset names', 'All text from uploaded files is escaped before it enters the page', 'Code review'],
    ['Resource exhaustion', 'Parameter bounds; a new run cancels earlier jobs; only the eight latest jobs are kept; cancel endpoint', 'Stop-button test'],
    ['Path traversal', 'Requested paths must resolve inside the web directory, otherwise 404', 'Server test'],
    ['Data manipulation; unauthorised access', 'Held-out evaluation and equal-weight baseline expose over-fitting; cap and limit reduce concentration; local-only default, no accounts', 'Experiment E5; default bind address'],
  ], [2300, 4331, 2100], 'Security threats and mitigations'));
  out.push(para('These measures suit a locally run teaching and research tool. A hosted version would need authentication, rate limiting and an isolated worker process.'));
  return out;
}

module.exports = { ch4, ch5 };
