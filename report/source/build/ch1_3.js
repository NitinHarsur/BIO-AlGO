const L = require('./lib');
const { d, para, h2, h3, h4, bullets, numbered, table, figure, chapter } = L;

function ch1() {
  const out = [...chapter(1, 'Introduction')];
  out.push(h2('1.1', 'Overview'));
  out.push(para('Portfolio selection is the problem of dividing a fixed amount of capital across a set of risky assets. The classical answer, mean-variance analysis {c:markowitz}, gives for each level of expected return the portfolio with the least variance; together these portfolios form the efficient frontier. Practice is harder than the textbook model. Investors care about losses in bad periods as well as variance, which Conditional Value-at-Risk (CVaR) measures {c:rockafellar}. Mandates also impose a cap on each holding, a minimum holding size and a limit on the number of holdings, and the last of these makes the problem hard for exact solvers {c:chang}. Because the goals conflict, a good optimiser returns a set of non-dominated trade-offs and not a single answer.'));
  out.push(para('Population-based metaheuristics suit this setting because one run returns a whole population. Particle Swarm Optimization (PSO) {c:kennedy} and the NSGA-II genetic algorithm {c:deb02} are two well-known examples. This project, **SwarmFolio**, implements a multi-objective PSO (MOPSO) and NSGA-II on one shared portfolio model with three objectives (return, volatility, CVaR) and four constraints, and compares them with random search and the equal-weight portfolio on training and held-out data. It is delivered as a Python library with automated tests and as a browser workbench that animates both searches.'));

  out.push(h2('1.2', 'Motivation'));
  out.push(para('Studies that compare PSO and GA for portfolios usually report one benchmark data set and in-sample results only. Michaud {c:michaud} argued that optimisers amplify estimation error, and DeMiguel et al. {c:demiguel} found that the naive 1/N rule was hard to beat out of sample, so evaluation on unseen data and on many markets is needed. Comparisons are also confounded when each algorithm handles constraints differently; one shared repair operator removes that source of difference. Finally, seeing a population move toward the efficient frontier and then clicking a point to see its holdings makes dominance, diversity and over-fitting concrete for students.'));

  out.push(h2('1.3', 'Objectives'));
  out.push(...numbered([
    'Formulate long-only portfolio selection with three objectives (return, volatility, CVaR) and cap, minimum-size and cardinality constraints.',
    'Implement MOPSO and NSGA-II on one shared repair operator so that they can be compared fairly.',
    'Measure front quality with hypervolume, spacing, front size and runtime, against random search at an equal budget.',
    'Study the effect of tighter constraints, more assets, different budgets and removing individual operators.',
    'Test on held-out data, over 30 independent markets, whether chosen portfolios beat the equal-weight portfolio.',
    'Build a browser interface that runs both optimisers, animates the search and accepts the user’s own prices.',
  ]));

  out.push(h2('1.4', 'Scope'));
  out.push(para('**In scope:** long-only equity portfolios; daily returns; empirical estimates of return, volatility and CVaR; MOPSO and NSGA-II; random search and equal weight as baselines; a synthetic market generator and CSV import; a Python library, command-line tool, local web server and tests. **Out of scope:** live data and order execution, short selling, trading costs as an objective, return forecasting, and any claim of investment advice. The experiments use simulated markets; real-market validation is future work (Chapter 8).'));

  out.push(h2('1.5', 'Sustainable Development Goals (SDGs)'));
  out.push(para('The project relates to the United Nations Sustainable Development Goals {c:sdg} in limited ways.'));
  out.push(...table(['SDG', 'Relevance to this project'], [
    ['SDG 4: Quality Education', 'The workbench visualises dominance, Pareto fronts and over-fitting, and the code is open, so it can be used for teaching.'],
    ['SDG 8: Decent Work and Economic Growth', 'Transparent, constraint-aware tools support informed saving decisions; held-out testing discourages over-confident claims.'],
    ['SDG 9: Industry, Innovation and Infrastructure', 'Bio-inspired computing is applied to a financial decision problem and delivered as tested, reusable software.'],
  ], [2900, 5831], 'Relation of the project to the Sustainable Development Goals'));

  out.push(h2('1.6', 'Existing System'));
  out.push(para('Quadratic programming solvers give one efficient portfolio per risk aversion but do not handle cardinality directly. Single-objective heuristics, including PSO {c:cura,zhu,deng} and genetic algorithms {c:chang}, handle realistic constraints but optimise one scalarised objective, so each trade-off needs a new run. Multi-objective evolutionary algorithms return a front in one run {c:anag,skol} (reviewed in {c:meta}). These systems usually lack a common evaluation protocol, mostly evaluate in-sample, and rarely come with software a student can run and inspect.'));

  out.push(h2('1.7', 'Proposed System'));
  out.push(para('SwarmFolio has four parts: (i) a portfolio model with three objectives and a repair operator that turns any real vector into feasible weights; (ii) MOPSO and NSGA-II, which share that model and therefore search the same feasible space; (iii) an evaluation layer with baselines, front-quality indicators, selection rules and held-out back-testing; and (iv) a web workbench that animates the optimisers while they search. What distinguishes it from the existing systems is the shared repair operator, the three-objective formulation with CVaR, a hypervolume normalised across all methods in a run, and a held-out study over 30 markets.'));

  out.push(h2('1.8', 'Work Plan'));
  out.push(para('The work was organised into nine overlapping activities over a fifteen-week semester, as shown below.', { after: 60 }));
  const f = figure('fig_workplan.png', 5.2, 'Work plan of the project (weeks of the semester).');
  out.push(...f.els);
  return out;
}

function ch2() {
  const out = [...chapter(2, 'Literature Survey')];
  out.push(h2('2.1', 'Overview'));
  out.push(para('The relevant literature falls into four groups: the financial foundations, constrained and multi-objective formulations, the metaheuristics used to solve them, and the assessment of Pareto fronts. Each group is summarised below in the authors’ own words, followed by the research gap.'));

  out.push(h2('2.2', 'Detailed Survey'));
  out.push(h3('2.2.1', 'Foundations of portfolio selection'));
  out.push(para('Markowitz {c:markowitz} introduced mean-variance selection and the efficient frontier. Sharpe {c:sharpe} proposed the reward-to-variability ratio used here to pick one portfolio from a front. Rockafellar and Uryasev {c:rockafellar} introduced CVaR optimisation, a tail-risk measure used here as a third objective. Michaud {c:michaud} argued that optimisers behave as error maximisers, and DeMiguel et al. {c:demiguel} reported that optimised strategies did not consistently beat equal weighting out of sample; both motivate the held-out evaluation.'));
  out.push(h3('2.2.2', 'Constrained and multi-objective formulations'));
  out.push(para('Chang et al. {c:chang} studied the cardinality-constrained frontier with genetic algorithms, tabu search and simulated annealing and showed that such constraints make the frontier discontinuous and hard to compute exactly. Anagnostopoulos and Mamanis {c:anag} treated selection as a tri-objective problem over risk, return and the number of securities, and Skolpadungket et al. {c:skol} applied multi-objective genetic algorithms with realistic constraints. Metaxiotis and Liagkouras {c:meta} review the field.'));
  out.push(h3('2.2.3', 'Evolutionary and swarm algorithms'));
  out.push(para('Holland {c:holland} established the genetic algorithm. Deb et al. {c:deb02} proposed NSGA-II (fast non-dominated sorting, crowding distance, elitist survival), and Deb and Agrawal {c:debagr} the simulated binary crossover. Kennedy and Eberhart {c:kennedy} introduced PSO, Shi and Eberhart {c:shi} the inertia weight, and Coello Coello et al. {c:coello} a multi-objective PSO with an external repository. For portfolios, Cura {c:cura}, Zhu et al. {c:zhu} and Deng et al. {c:deng} applied PSO to the constrained problem with a single scalarised objective.'));
  out.push(h3('2.2.4', 'Assessing the quality of a Pareto front'));
  out.push(para('Zitzler et al. {c:zitzler03} analysed performance indicators for multi-objective optimisers; the hypervolume, which originates in {c:zitzler99}, is compatible with Pareto dominance and is the primary indicator here. Schott {c:schott} proposed the spacing metric for how evenly a front is spread. Deb {c:deb01} is the standard reference.'));

  out.push(...table(['Ref.', 'Focus', 'Method', 'Contribution used here'], [
    ['{c:markowitz}', 'Portfolio theory', 'Mean-variance', 'Return-risk trade-off'],
    ['{c:rockafellar}', 'Tail risk', 'CVaR optimisation', 'Third objective'],
    ['{c:chang}', 'Cardinality', 'GA, tabu search, annealing', 'Motivation for heuristics'],
    ['{c:anag}, {c:skol}', 'Multi-objective portfolios', 'MOEAs', 'Multi-objective formulation'],
    ['{c:deb02}', 'Algorithm', 'NSGA-II', 'Basis of the GA'],
    ['{c:coello}', 'Algorithm', 'Multi-objective PSO', 'Basis of the swarm optimiser'],
    ['{c:cura}, {c:zhu}, {c:deng}', 'Portfolio PSO', 'Single-objective PSO', 'PSO suits the constrained problem'],
    ['{c:michaud}, {c:demiguel}', 'Out-of-sample evidence', 'Empirical comparison', 'Held-out tests, 1/N baseline'],
    ['{c:zitzler03}, {c:schott}', 'Indicators', 'Hypervolume, spacing', 'Evaluation of fronts'],
  ], [1700, 2000, 2300, 2731], 'Summary of the literature used in the project'));

  out.push(h2('2.3', 'Research Gap Identification'));
  out.push(...bullets([
    '**Evaluation protocol.** The PSO and GA portfolio studies surveyed report benchmark data and mainly in-sample results; held-out results over many markets with a paired test against equal weight were not found.',
    '**Confounded comparison.** Constraint handling differs between algorithms, so a difference in outcome cannot be attributed to the search strategy alone.',
    '**Tail risk with swarms.** The surveyed portfolio PSO studies {c:cura,zhu,deng} optimise one scalarised objective, so a three-objective front with CVaR is not produced.',
    '**Inspectability.** Few surveyed works ship software in which the search can be observed and a portfolio inspected.',
  ]));
  out.push(para('These gaps describe the papers surveyed here, which are not an exhaustive review of the field.'));

  out.push(h2('2.4', 'Mapping of your Objective with Research Gap Identification'));
  out.push(...table(['Objective (Section 1.3)', 'Gap addressed', 'How the project addresses it'], [
    ['1. Three-objective model with constraints', 'Tail risk', 'Return, volatility and CVaR optimised together under cap, floor and cardinality constraints.'],
    ['2. Shared repair operator, MOPSO and NSGA-II', 'Confounded comparison', 'Both algorithms call the same repair operator and objective function.'],
    ['3. Front-quality indicators and baselines', 'Evaluation protocol', 'Shared-normalisation hypervolume, spacing, runtime, random search at equal budget.'],
    ['4. Constraint, scale, budget and ablation studies', 'Evaluation protocol', 'Experiments E2, E3, E4 and E6 (Section 4.2.1).'],
    ['5. Held-out test over many markets', 'Evaluation protocol', '30 simulated markets, paired Wilcoxon test against equal weight (Chapter 7).'],
    ['6. Browser workbench', 'Inspectability', 'Live animation of both populations and a click-to-inspect panel.'],
  ], [2900, 1700, 4131], 'Mapping of objectives to research gaps'));
  return out;
}

function ch3() {
  const out = [...chapter(3, 'Requirement Analysis and Specification')];
  out.push(h2('3.1', 'Functional Requirements'));
  out.push(...table(['ID', 'Requirement'], [
    ['FR1', 'Accept a market from the synthetic generator (assets, days, seed) or from an uploaded CSV of prices.'],
    ['FR2', 'Let the user set the maximum weight, minimum holding size, optional holding limit, population size, generations and training share; reject impossible combinations.'],
    ['FR3', 'Run MOPSO and NSGA-II on the same problem and return feasible, non-dominated portfolios (long-only, fully invested, within cap and limit).'],
    ['FR4', 'Show the progress of both searches live, including the current population and front, and allow the user to stop a job.'],
    ['FR5', 'Compute hypervolume, spacing, front size, best Sharpe ratio and runtime, with random search as a baseline.'],
    ['FR6', 'Let the user select a portfolio by click, slider or rule (best Sharpe, lowest volatility, balanced) and show its weights.'],
    ['FR7', 'Show training and held-out return, volatility, Sharpe ratio and drawdown next to equal weight, with a held-out wealth curve.'],
    ['FR8', 'Report invalid input and server errors in the interface in plain language.'],
    ['FR9', 'Provide the same functions from Python and from a command-line tool that writes tables and figures.'],
  ], [900, 7831], 'Functional requirements'));

  out.push(h2('3.2', 'Non-functional Requirements'));
  out.push(...table(['Category', 'Requirement'], [
    ['Correctness', 'Constraints hold for every portfolio produced; objective values match an independent calculation (covered by tests).'],
    ['Reproducibility', 'The same data, parameters and seed give the same front.'],
    ['Performance', 'A default run (100 individuals, 150 iterations, 20 assets, 1,500 days) finishes in about ten seconds or less.'],
    ['Usability', 'Plain-language labels, keyboard operation, phone-to-desktop layout, light and dark themes.'],
    ['Portability', 'Standard-library server and a build-free interface that needs no network access.'],
    ['Security', 'Inputs validated and bounded; static files only from the web directory; user text escaped (Section 3.7.1).'],
  ], [1900, 6831], 'Non-functional requirements'));

  out.push(h2('3.3', 'Hardware Requirements'));
  out.push(para('The project is software only. Development and experiments ran in a cloud container with four virtual CPU cores. A dual-core 64-bit laptop with 4 GB RAM and 500 MB of free disk is enough to use it, and no network is needed to run it.'));

  out.push(h2('3.4', 'Software Requirements'));
  out.push(...table(['Software', 'Version used', 'Purpose'], [
    ['Python', '3.13', 'Library, server and experiments'],
    ['NumPy {c:numpy}', '2.5', 'Vectorised evaluation and the optimisers'],
    ['pandas {c:pandas}', '3.0', 'Time-indexed returns, CSV import'],
    ['Matplotlib {c:mpl}', '3.11', 'Plots written by the command-line tool and the report figures'],
    ['SciPy {c:scipy}', '1.18', 'Wilcoxon test in the report analysis only'],
    ['pytest', '-', 'Automated tests'],
    ['Web browser', 'Any current version', 'HTML, CSS and JavaScript interface (canvas)'],
  ], [2700, 1900, 4131], 'Software requirements'));

  out.push(h2('3.5', 'Cost Estimation'));
  out.push(para('All software is free and open source, so the incremental cost is small. Printing and binding of the report depends on the department’s requirements.'));
  out.push(...table(['Item', 'Estimated cost (INR)', 'Note'], [
    ['Python and open-source libraries', '0', 'Open-source licences'],
    ['Web interface (HTML, CSS, JavaScript)', '0', 'No framework or build tool'],
    ['Cloud container for development', '0', 'Provided with the environment used'],
    ['Printing and binding of the report', 'to be filled by the team', 'Department requirements'],
  ], [4300, 2000, 2431], 'Cost estimates'));

  out.push(h2('3.6', 'Assumptions'));
  out.push(...bullets([
    'Daily returns are the unit of analysis (252 trading days a year); the training-window empirical distribution is an adequate basis for estimating return, volatility and CVaR. The held-out tests probe this assumption.',
    'Positions are long-only and fully invested, with no leverage or short selling.',
    'Trading costs are ignored in the optimisation; a flat cost on turnover is used only in the optional walk-forward test.',
    'The simulated markets are a controlled testbed and not a model of any particular exchange.',
  ]));

  out.push(h2('3.7', 'Risks and Challenges'));
  out.push(...table(['Risk', 'Effect', 'Mitigation'], [
    ['Over-fitting to the training window', 'Strong in-sample, weaker on unseen data', 'Held-out evaluation, equal-weight baseline, 30 markets'],
    ['Constraint infeasibility', 'Impossible setting, e.g. 10% cap with five holdings', 'Validation in the interface and the problem constructor'],
    ['Premature convergence', 'Population collapses onto few holdings', 'Turbulence and swap mutation, tested by ablation (Section 7.4)'],
    ['Metric misuse', 'Hypervolume depends on the reference point', 'One shared normalisation per comparison'],
    ['Synthetic data not representative', 'Conclusions may not transfer', 'Stated as a limitation; CSV import allows real data'],
  ], [2400, 3000, 3331], 'Risks and mitigations'));
  out.push(h3('3.7.1', 'AI Security Challenges'));
  out.push(para('Although there is no learned model, the system accepts user data and returns decision support, so several concerns apply. Their handling is described in Section 5.4.'));
  out.push(...bullets([
    '**Malformed or oversized input:** an uploaded CSV could be malformed or crafted to exhaust memory or time.',
    '**Injection into the interface:** column names from a file are shown as asset names and could carry script.',
    '**Resource exhaustion and path traversal:** unbounded parameters or jobs, or a file handler tricked into serving files outside the web directory.',
    '**Data manipulation and access:** outlier prices can bias the optimiser, and the server has no authentication and is meant for local use.',
  ]));
  return out;
}

module.exports = { ch1, ch2, ch3 };
