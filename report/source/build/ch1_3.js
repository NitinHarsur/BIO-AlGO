const L = require('./lib');
const { d, para, h2, h3, h4, bullets, numbered, table, figure, chapter } = L;
const A = d.AlignmentType;

function ch1() {
  const out = [...chapter(1, 'Introduction')];
  out.push(h2('1.1', 'Overview'));
  out.push(para('Portfolio selection is the problem of deciding how to divide a fixed amount of capital across a set of risky assets. The classical answer, mean-variance analysis, was formulated by Markowitz {c:markowitz}: for every level of expected return there is a portfolio with the smallest possible variance, and the set of such portfolios forms the efficient frontier. An investor then chooses a point on this frontier that matches their appetite for risk.'));
  out.push(para('Practical portfolio construction is harder than the textbook model for three reasons. First, investors care about more than one kind of risk: variance treats gains and losses symmetrically, whereas Conditional Value-at-Risk (CVaR) measures the average loss in the worst days {c:rockafellar}. Second, real mandates impose constraints such as a cap on any single holding, a minimum holding size and a limit on the number of assets held. A cardinality constraint turns the problem into a mixed-integer quadratic programme that exact methods solve slowly, which is why heuristics have been studied for it {c:chang}. Third, the objectives conflict, so the honest output of an optimiser is a set of non-dominated trade-offs and not a single answer.'));
  out.push(para('Population-based metaheuristics suit this setting. Particle Swarm Optimization (PSO) moves a swarm of candidate solutions through the search space using each particle’s own best position and the best positions found by the swarm {c:kennedy}. Genetic Algorithms (GA) evolve a population by selection, crossover and mutation {c:holland}, and the NSGA-II variant is the standard multi-objective form {c:deb02}. Both methods return a whole population in one run, which is exactly what is needed to approximate a Pareto front.'));
  out.push(para('This project, named **SwarmFolio**, implements a multi-objective PSO (MOPSO) and an NSGA-II genetic algorithm on one shared portfolio model with three objectives (return, volatility and CVaR) and four constraints. The two optimisers are compared against random search and the equal-weight portfolio on training data and on held-out data. The work is packaged as a Python library with an automated test suite and as a browser-based workbench in which the user can watch both populations converge onto their fronts and inspect any portfolio on them.'));

  out.push(h2('1.2', 'Motivation'));
  out.push(para('Three observations motivated this project. The first is that studies comparing PSO and GA for portfolio selection usually report results on one benchmark data set and in-sample only. A front that looks excellent on the data it was fitted to may say little about future performance. Michaud {c:michaud} argued that mean-variance optimisers tend to amplify estimation error, and DeMiguel et al. {c:demiguel} found that the naive 1/N rule was hard to beat out of sample across several optimised strategies. An evaluation that includes held-out data and many independent markets is therefore needed before any claim about usefulness can be made.'));
  out.push(para('The second observation is that comparisons are often confounded by how constraints are handled. If each algorithm uses its own penalty or repair scheme, a difference in result may come from the constraint handling and not from the search strategy. Using one repair operator for both algorithms removes that source of difference.'));
  out.push(para('The third is educational. Multi-objective optimisation is difficult to grasp from tables of numbers. Seeing a population of candidate portfolios move toward the efficient frontier, and then clicking a point to see its holdings and its behaviour on unseen data, makes the ideas of dominance, diversity and over-fitting concrete.'));

  out.push(h2('1.3', 'Objectives'));
  out.push(...numbered([
    'To formulate long-only stock portfolio selection as a three-objective problem (maximise annual return, minimise annual volatility, minimise CVaR) with weight-cap, minimum-size and cardinality constraints.',
    'To implement a multi-objective Particle Swarm Optimizer and an NSGA-II genetic algorithm that share one constraint-repair operator, so that they can be compared fairly.',
    'To measure front quality with hypervolume, spacing, front size and runtime, and to compare both algorithms with random search at an equal evaluation budget.',
    'To study how the algorithms respond to tighter constraints, larger asset universes, different search budgets and the removal of individual operators.',
    'To test whether portfolios chosen from the fronts outperform the equal-weight portfolio on held-out data, using many independent simulated markets and a paired statistical test.',
    'To build a browser-based interface that runs both optimisers, animates the search and lets the user inspect portfolios, with data upload for the user’s own prices.',
  ]));

  out.push(h2('1.4', 'Scope'));
  out.push(para('**In scope.** Long-only equity portfolios; daily returns; historical (empirical) estimates of return, volatility and CVaR; the MOPSO and NSGA-II algorithms; random search and equal weight as baselines; a synthetic market generator with fat tails and a crisis regime; CSV import of adjusted close prices; a Python library, command-line tool, local web server and test suite.'));
  out.push(para('**Out of scope.** Live market data feeds and order execution; short selling and leverage; transaction cost as an optimisation objective (costs appear only in the optional walk-forward back-test); forecasting models for returns; and any claim that the portfolios are investment advice. The experimental study uses simulated markets, and real-market validation is listed as future work in Chapter 8.'));

  out.push(h2('1.5', 'Sustainable Development Goals (SDGs)'));
  out.push(para('The project relates to the United Nations Sustainable Development Goals {c:sdg} in the following limited ways.'));
  out.push(...table(['SDG', 'Relevance to this project'], [
    ['SDG 4: Quality Education', 'The workbench visualises dominance, Pareto fronts and over-fitting, and the code is open and documented, so it can be used to teach multi-objective optimisation.'],
    ['SDG 8: Decent Work and Economic Growth', 'Transparent, constraint-aware portfolio tools support better-informed saving and investment decisions, and the held-out evaluation discourages over-confident claims.'],
    ['SDG 9: Industry, Innovation and Infrastructure', 'The project applies bio-inspired computing to a financial decision problem and delivers it as reusable software with tests.'],
  ], [2900, 5831], 'Relation of the project to the Sustainable Development Goals'));

  out.push(h2('1.6', 'Existing System'));
  out.push(para('Several approaches exist for the problem. Quadratic programming solvers return a single efficient portfolio for a chosen risk aversion and can trace the frontier by repeating the solve, but they do not handle cardinality directly. Single-objective heuristics, including PSO {c:cura,zhu,deng} and genetic algorithms {c:chang}, handle cardinality and other realistic constraints but typically optimise one scalarised objective, so a new run is needed for every trade-off. Multi-objective evolutionary algorithms return a front in one run {c:anag,skol}, and a review of this literature is given in {c:meta}.'));
  out.push(para('What these systems usually lack is a common evaluation protocol. Constraint handling differs across papers, evaluation is mostly in-sample, and results are rarely accompanied by software that a student can run and inspect. Commercial portfolio tools are closed, which also limits their use in teaching.'));

  out.push(h2('1.7', 'Proposed System'));
  out.push(para('SwarmFolio is an open, test-covered system with four parts. (i) A portfolio model with three objectives and a repair operator that maps any real vector to a feasible weight vector. (ii) Two optimisers, MOPSO and NSGA-II, that call the same model and therefore search the same feasible space. (iii) An evaluation layer with baselines, front-quality indicators, selection rules, held-out back-testing and an optional walk-forward test. (iv) A web workbench that runs jobs on a local server and animates the optimisers while they search.'));
  out.push(para('The design choices that distinguish it from the existing approaches are the shared repair operator, the explicit three-objective formulation with CVaR, a hypervolume that is normalised across all methods compared in the same run, an out-of-sample study across 30 independent markets, and the interactive front inspector.'));

  out.push(h2('1.8', 'Work Plan'));
  out.push(para('The work was organised into nine overlapping activities over a fifteen-week semester, as shown in the chart below. The chart is the plan that guided the work; activities overlapped because the interface and experiments depended on the optimisers being stable.'));
  const f = figure('fig_workplan.png', 5.8, 'Work plan of the project (weeks of the semester).');
  out.push(...f.els);
  return out;
}

function ch2() {
  const out = [...chapter(2, 'Literature Survey')];
  out.push(h2('2.1', 'Overview'));
  out.push(para('The literature relevant to this project falls into four groups: the financial foundations of portfolio selection, the constrained and multi-objective formulations, the metaheuristics used to solve them, and the methods used to judge the quality of a Pareto front. This chapter summarises each group in the authors’ own words and records the research gap that the project addresses.'));

  out.push(h2('2.2', 'Detailed Survey'));
  out.push(h3('2.2.1', 'Foundations of portfolio selection'));
  out.push(para('Markowitz {c:markowitz} introduced mean-variance portfolio selection and the efficient frontier. Sharpe {c:sharpe} proposed the reward-to-variability ratio, now called the Sharpe ratio, which is used here to pick one portfolio from a front. Rockafellar and Uryasev {c:rockafellar} introduced the optimisation of Conditional Value-at-Risk, a tail-risk measure that is convex and can be minimised by linear programming. In SwarmFolio, CVaR is computed from the empirical distribution of daily portfolio returns and used as a third objective.'));
  out.push(para('Two papers motivate the held-out evaluation. Michaud {c:michaud} argued that optimisers behave as error maximisers because they place large weights on assets whose historical means are over-estimated. DeMiguel, Garlappi and Uppal {c:demiguel} compared many optimised strategies with the equal-weight rule and reported that none consistently beat it out of sample on the data they studied. Both results justify including the equal-weight portfolio as a baseline and judging claims on unseen data.'));

  out.push(h3('2.2.2', 'Constrained and multi-objective formulations'));
  out.push(para('Chang et al. {c:chang} studied the cardinality-constrained efficient frontier and applied genetic algorithms, tabu search and simulated annealing, showing that realistic constraints make the frontier discontinuous and hard to compute exactly. Anagnostopoulos and Mamanis {c:anag} formulated portfolio selection as a tri-objective problem over risk, return and the number of securities and solved it with multi-objective evolutionary algorithms. Skolpadungket et al. {c:skol} applied multi-objective genetic algorithms to portfolio optimisation with realistic constraints. Metaxiotis and Liagkouras {c:meta} reviewed the application of multi-objective evolutionary algorithms to portfolio management and give a broader map of the field.'));

  out.push(h3('2.2.3', 'Evolutionary and swarm algorithms'));
  out.push(para('Holland {c:holland} established the genetic algorithm. Deb et al. {c:deb02} proposed NSGA-II, which combines fast non-dominated sorting, a crowding-distance measure that preserves diversity, and elitist survival of parents and offspring together. The simulated binary crossover (SBX) operator of Deb and Agrawal {c:debagr} gives real-coded GAs a crossover whose spread is controlled by a distribution index. Zitzler and Thiele {c:zitzler99} compared multi-objective evolutionary algorithms and introduced a size-of-dominated-space measure that is the origin of the hypervolume indicator.'));
  out.push(para('Kennedy and Eberhart {c:kennedy} introduced Particle Swarm Optimization, and Shi and Eberhart {c:shi} added the inertia weight that balances exploration and exploitation. Coello Coello et al. {c:coello} extended PSO to several objectives by keeping an external repository of non-dominated solutions that guides the swarm. For portfolio problems, Cura {c:cura} applied PSO to the cardinality-constrained problem, Zhu et al. {c:zhu} to the constrained portfolio problem, and Deng et al. {c:deng} proposed an improved PSO for Markowitz-based selection with cardinality constraints. Those three studies treat the problem with a single scalarised objective, whereas this project returns a three-objective front.'));

  out.push(h3('2.2.4', 'Assessing the quality of a Pareto front'));
  out.push(para('Zitzler et al. {c:zitzler03} analysed performance indicators for multi-objective optimisers and showed that unary indicators can mislead unless their properties are understood. The hypervolume, which measures the region of objective space dominated by a front relative to a reference point, is compatible with Pareto dominance and is used as the primary indicator in this project. Schott {c:schott} proposed the spacing metric, which measures how evenly the points of a front are distributed. Deb {c:deb01} gives the standard reference for these methods.'));

  out.push(...table(['Ref.', 'Focus', 'Method', 'Contribution used here'], [
    ['{c:markowitz}', 'Portfolio theory', 'Mean-variance', 'Return-risk trade-off, efficient frontier'],
    ['{c:sharpe}', 'Performance measure', 'Reward-to-variability', 'Sharpe ratio for selecting a portfolio'],
    ['{c:rockafellar}', 'Tail risk', 'CVaR optimisation', 'Third objective'],
    ['{c:chang}', 'Cardinality', 'GA, tabu search, annealing', 'Motivation for heuristics under constraints'],
    ['{c:anag}', 'Tri-objective model', 'MOEAs', 'Multi-objective formulation'],
    ['{c:skol}', 'Realistic constraints', 'Multi-objective GA', 'Constraint-aware GA precedent'],
    ['{c:meta}', 'Review', 'MOEAs for portfolios', 'Map of the field'],
    ['{c:deb02}', 'Algorithm', 'NSGA-II', 'Basis of the GA'],
    ['{c:coello}', 'Algorithm', 'Multi-objective PSO', 'Basis of the swarm optimiser'],
    ['{c:cura}, {c:zhu}, {c:deng}', 'Portfolio PSO', 'Single-objective PSO variants', 'Evidence that PSO suits the constrained problem'],
    ['{c:michaud}, {c:demiguel}', 'Out-of-sample evidence', 'Empirical comparison', 'Motivates held-out tests and the 1/N baseline'],
    ['{c:zitzler03}, {c:schott}', 'Indicators', 'Hypervolume, spacing', 'Evaluation of fronts'],
  ], [1500, 1900, 2300, 3031], 'Summary of the literature used in the project'));

  out.push(h2('2.3', 'Research Gap Identification'));
  out.push(para('From the literature reviewed in this chapter, four gaps are visible.'));
  out.push(...bullets([
    '**Gap 1: evaluation protocol.** The PSO and GA portfolio studies reviewed report results on benchmark data and mainly in-sample. Held-out results across many independent markets, with a paired test against the equal-weight rule, were not found in the papers surveyed here.',
    '**Gap 2: confounded comparison.** Constraint handling differs between algorithms in the surveyed studies, so a difference in outcome cannot be attributed to the search strategy alone.',
    '**Gap 3: tail risk with swarms.** The PSO studies reviewed here {c:cura,zhu,deng} optimise a single scalarised objective, so a three-objective front including CVaR is not produced in those works.',
    '**Gap 4: inspectability.** Few of the surveyed works ship software in which the search can be observed and a candidate portfolio inspected, which limits their value as teaching and exploration tools.',
  ]));
  out.push(para('These gaps describe the papers surveyed for this report, which are not an exhaustive review of the field. The claim is therefore limited to the surveyed literature.'));

  out.push(h2('2.4', 'Mapping of your Objective with Research Gap Identification'));
  out.push(...table(['Objective (Section 1.3)', 'Gap addressed', 'How the project addresses it'], [
    ['1. Three-objective model with constraints', 'Gap 3', 'Return, volatility and CVaR are optimised together under cap, floor and cardinality constraints.'],
    ['2. Shared repair operator, MOPSO and NSGA-II', 'Gap 2', 'Both algorithms call the same repair operator and objective function, so the feasible space is identical.'],
    ['3. Front-quality indicators and baselines', 'Gap 1', 'Hypervolume (shared normalisation), spacing, front size, runtime, random search at equal budget.'],
    ['4. Constraint, scale, budget and ablation studies', 'Gaps 1 and 2', 'Experiments E2, E3, E4 and E6 (Section 4.2.1) vary one factor at a time.'],
    ['5. Held-out test over many markets', 'Gap 1', '30 independent simulated markets, paired Wilcoxon test against equal weight (Chapter 7).'],
    ['6. Browser workbench', 'Gap 4', 'Live animation of both populations and a click-to-inspect portfolio panel.'],
  ], [2700, 1300, 4731], 'Mapping of objectives to research gaps'));
  return out;
}

function ch3() {
  const out = [...chapter(3, 'Requirement Analysis and Specification')];
  out.push(h2('3.1', 'Functional Requirements'));
  out.push(...table(['ID', 'Requirement'], [
    ['FR1', 'The system shall accept a market either from a built-in synthetic generator (assets, trading days, seed) or from an uploaded CSV of prices.'],
    ['FR2', 'The system shall let the user set the maximum weight per asset, the minimum holding size and an optional limit on the number of holdings, and shall reject combinations that cannot be satisfied.'],
    ['FR3', 'The system shall let the user set the population size, the number of generations and the share of history used for training.'],
    ['FR4', 'The system shall run MOPSO and NSGA-II on the same problem and return a non-dominated set of feasible portfolios for each.'],
    ['FR5', 'Every returned portfolio shall be long-only, fully invested and within the weight cap and cardinality limit.'],
    ['FR6', 'The system shall show the progress of both searches while they run, including the current population and front.'],
    ['FR7', 'The system shall let the user stop a running job.'],
    ['FR8', 'The system shall compute hypervolume, spacing, front size, best Sharpe ratio and runtime for each method, with random search as a baseline.'],
    ['FR9', 'The system shall let the user select a portfolio from a front by clicking, by a slider or by a rule (best Sharpe, lowest volatility, balanced) and show its weights.'],
    ['FR10', 'For a selected portfolio the system shall show training and held-out return, volatility, Sharpe ratio and drawdown next to the equal-weight portfolio, and a held-out wealth curve.'],
    ['FR11', 'The system shall report invalid input and server errors in the interface in plain language.'],
    ['FR12', 'The library shall also be usable from Python and from a command-line tool that writes tables and figures.'],
  ], [900, 7831], 'Functional requirements'));

  out.push(h2('3.2', 'Non-functional Requirements'));
  out.push(...table(['Category', 'Requirement'], [
    ['Correctness', 'Constraint satisfaction shall hold for every portfolio produced; objective values shall match an independent calculation. Both are covered by automated tests.'],
    ['Reproducibility', 'A run with the same data, parameters and seed shall give the same front.'],
    ['Performance', 'A default run (100 particles or individuals, 150 iterations, 20 assets, 1,500 days) shall finish within about ten seconds on a modern laptop, and the interface shall stay responsive during a run.'],
    ['Usability', 'Controls shall be labelled in plain language, work with a keyboard, and the layout shall work from phone width to desktop width in light and dark colour schemes.'],
    ['Portability', 'The server shall use only the Python standard library; the interface shall need no build step and no network access.'],
    ['Security', 'Inputs shall be validated and bounded; static files shall be served only from the web directory; user-supplied text shall be escaped before display. See Section 3.7.1.'],
    ['Maintainability', 'Modules shall have single responsibilities, and behaviour shall be covered by tests that run in under ten seconds.'],
  ], [1900, 6831], 'Non-functional requirements'));

  out.push(h2('3.3', 'Hardware Requirements'));
  out.push(para('The project is software only. The development and experiments were run in a cloud container with four virtual CPU cores. The minimum recommended configuration to use the system is listed below.'));
  out.push(...table(['Component', 'Quantity', 'Specification'], [
    ['Computer (laptop or desktop)', '1', 'Dual-core 64-bit CPU or better, 4 GB RAM, 500 MB free disk'],
    ['Display', '1', 'Any display of phone size or larger'],
    ['Network', '-', 'Not required to run; needed only to install the Python packages'],
  ], [3300, 1300, 4131], 'Hardware requirements'));

  out.push(h2('3.4', 'Software Requirements'));
  out.push(...table(['Software', 'Version used', 'Purpose'], [
    ['Python', '3.13', 'Language of the library, server and experiments'],
    ['NumPy {c:numpy}', '2.5', 'Vectorised portfolio evaluation and the optimisers'],
    ['pandas {c:pandas}', '3.0', 'Time-indexed returns, CSV import'],
    ['Matplotlib {c:mpl}', '3.11', 'Plots written by the command-line tool and the report figures'],
    ['SciPy {c:scipy}', '1.18', 'Wilcoxon signed-rank test in the report analysis only'],
    ['pytest', '-', 'Automated tests'],
    ['Web browser', 'Any current version', 'HTML, CSS and JavaScript interface (canvas)'],
    ['Chromium with Playwright', '-', 'Automated interface checks and the screenshots in this report'],
  ], [2700, 1900, 4131], 'Software requirements'));

  out.push(h2('3.5', 'Cost Estimation'));
  out.push(para('All software used is free and open source, so the incremental cost of the project is small. The table gives an estimate; the figures for the computer represent equipment that the team already owns and are shown only to indicate what is needed.'));
  out.push(...table(['Item', 'Estimated cost (INR)', 'Note'], [
    ['Python, NumPy, pandas, Matplotlib, SciPy, pytest', '0', 'Open-source licences'],
    ['Web interface (HTML, CSS, JavaScript)', '0', 'No framework or build tool'],
    ['Cloud container for development and experiments', '0', 'Provided with the development environment used'],
    ['Printing and binding of the report', 'to be filled by the team', 'Depends on the department’s requirements'],
    ['Computer for running the system', '0 (existing)', 'Not purchased for the project'],
  ], [4300, 2000, 2431], 'Cost estimates'));

  out.push(h2('3.6', 'Assumptions'));
  out.push(...bullets([
    'Daily returns are the unit of analysis, and 252 trading days make a year.',
    'The historical empirical distribution of returns on the training window is an adequate basis for estimating return, volatility and CVaR. This is the assumption that the held-out tests probe.',
    'Positions are long-only and fully invested, with no leverage, no cash and no short selling.',
    'Trading costs and taxes are ignored in the optimisation. A flat cost on turnover is applied only in the optional walk-forward back-test.',
    'The simulated markets are a controlled testbed and not a model of any particular exchange.',
  ]));

  out.push(h2('3.7', 'Risks and Challenges'));
  out.push(...table(['Risk', 'Effect', 'Mitigation'], [
    ['Over-fitting to the training window', 'Fronts look strong in-sample and weaken on unseen data', 'Held-out evaluation, equal-weight baseline, 30 independent markets, honest reporting'],
    ['Constraint infeasibility', 'Impossible configuration, for example a 10% cap with five holdings', 'Validation in the interface and in the problem constructor with a clear error'],
    ['Premature convergence', 'Population collapses onto few holdings', 'PSO turbulence and GA swap mutation, with ablation tests (Section 7.4)'],
    ['Metric misuse', 'Hypervolume depends on the reference point', 'One shared normalisation for all methods compared in a run'],
    ['Long runtime at large scale', 'Slow response in the interface', 'Bounded parameters, vectorised evaluation, progress display and a Stop button'],
    ['Synthetic data not representative', 'Conclusions may not transfer to real markets', 'Stated as a limitation; CSV import supports real data for future validation'],
  ], [2300, 2900, 3531], 'Risks and mitigations'));
  out.push(h3('3.7.1', 'AI Security Challenges'));
  out.push(para('Although the system contains no learned model, it is an AI system in the sense that it accepts user data and returns decision support, so several security concerns apply. They are listed here and their handling is described in Section 5.4.'));
  out.push(...bullets([
    '**Malicious or malformed input.** An uploaded CSV could be malformed, oversized or crafted to exhaust memory or time.',
    '**Injection into the interface.** Column names in an uploaded file are displayed as asset names and could carry markup intended to run script in the browser.',
    '**Resource exhaustion.** Unbounded population sizes, iteration counts or concurrent jobs could stall the server.',
    '**Path traversal.** A static file handler could be tricked into serving files outside the web directory.',
    '**Data manipulation.** A user (or an upstream data error) can bias the optimiser by supplying outlier prices, which the optimiser will exploit.',
    '**Unauthorised access.** The server has no authentication and is intended for local use.',
  ]));
  return out;
}

module.exports = { ch1, ch2, ch3 };
