const L = require('./lib');
const { d, FONT, W, para, table, REG, CITE } = L;
const C = d.AlignmentType.CENTER;
const { TITLE } = require('./front');
const T = (text, o = {}) => new d.TextRun({ text, font: FONT, size: o.size || 24, bold: o.bold, underline: o.underline ? {} : undefined });
const head = (text, pb = true) => new d.Paragraph({ alignment: C, pageBreakBefore: pb, spacing: { before: 0, after: 240 }, children: [T(text, { bold: true, size: 28 })] });

function attainment() {
  const levelTable = (rows, label, w) => new d.Table({ width: { size: W.text, type: d.WidthType.DXA }, columnWidths: w, rows: [
    new d.TableRow({ children: [L.cell(label, w[0], { bold: true, fill: 'E7E7E7', align: C }), L.cell('Level (3/2/1)\n3-High\n2-Medium\n1-Low', w[1], { bold: true, fill: 'E7E7E7', align: C }), L.cell('Justification if addressed', w[2], { bold: true, fill: 'E7E7E7', align: C })] }),
    ...rows.map(([id, lv, j]) => new d.TableRow({ cantSplit: true, children: [L.cell(id, w[0], { align: C, bold: true }), L.cell(String(lv), w[1], { align: C }), L.cell(j, w[2], { size: 20 })] })),
  ] });
  const po = [
    ['PO1', 3, 'Portfolio theory, probability and statistics, and multi-objective optimisation were applied to formulate and solve the problem in software.'],
    ['PO2', 3, 'The problem was formulated with three objectives and four constraints; literature was reviewed (Chapter 2), gaps identified and conclusions supported by experiments.'],
    ['PO3', 2, 'A layered system (library, server, interface) was designed and built to meet the requirements in Chapter 3; public-health and environmental considerations are not directly relevant.'],
    ['PO4', 3, 'Six controlled experiments with seeds, statistical tests and ablations were designed and analysed (Chapters 4 and 7).'],
    ['PO5', 3, 'NumPy, pandas, Matplotlib, SciPy, pytest and a browser canvas were used, and their limitations (for example the Monte Carlo hypervolume) are stated.'],
    ['PO6', 1, 'Societal relevance is discussed through the SDGs (Section 1.5); sustainability impact is limited.'],
    ['PO7', 2, 'Sources are cited in IEEE style, results are reported without selection, and the report states that the tool is not investment advice.'],
    ['PO8', 3, 'The work was divided among three team members across modules, experiments and documentation, and integrated through one repository.'],
    ['PO9', 2, 'A structured report, figures and an interactive interface communicate the work to technical and non-technical readers.'],
    ['PO10', 2, 'A work plan, cost estimate and risk register were prepared and followed (Sections 1.8, 3.5 and 3.7).'],
    ['PO11', 2, 'The team learned multi-objective metaheuristics, statistical evaluation and browser-based visualisation, which were new to the course content.'],
  ];
  const pso = [
    ['PSO1', 3, 'A computing system using AI techniques (swarm and evolutionary search) was designed and developed.'],
    ['PSO2', 2, 'Optimisation and statistical methods were applied to a financial decision problem and its results were interpreted for decision making.'],
    ['PSO3', 3, 'An end-to-end system was built, from data generation and import through optimisation and evaluation to an interactive interface and tests.'],
  ];
  return [
    new d.Paragraph({ pageBreakBefore: true, alignment: C, spacing: { after: 0 }, children: [T('B.M.S. College of Engineering.', { bold: true, size: 28 })] }),
    new d.Paragraph({ alignment: C, spacing: { after: 0 }, children: [T('Department of AI & DS', { bold: true })] }),
    new d.Paragraph({ alignment: C, spacing: { after: 120 }, children: [T('Attainment of POs and PSOs', { bold: true, underline: true })] }),
    new d.Paragraph({ spacing: { after: 40 }, children: [T('Batch no.: ____', { size: 22 }), T('\t\t\t\t\tDate: ____________', { size: 22 })] }),
    new d.Paragraph({ spacing: { after: 100 }, children: [T('Project Title: ', { size: 22, bold: true }), T(TITLE, { size: 22 })] }),
    new d.Paragraph({ spacing: { after: 60 }, keepNext: true, children: [T('PROGRAM OUTCOMES', { bold: true, size: 22 })] }),
    levelTable(po, 'PO', [800, 1500, 6431]),
    new d.Paragraph({ spacing: { before: 120, after: 60 }, keepNext: true, children: [T('PROGRAM SPECIFIC OUTCOMES', { bold: true, size: 22 })] }),
    levelTable(pso, 'PSO', [800, 1500, 6431]),
  ];
}

function references() {
  const els = [head('REFERENCES')];
  CITE.order.forEach((k, i) => {
    els.push(new d.Paragraph({
      alignment: d.AlignmentType.LEFT, spacing: { line: 240, after: 160 }, indent: { left: 540, hanging: 540 },
      tabStops: [{ type: d.TabStopType.LEFT, position: 540 }],
      children: [T(`[${i + 1}]\t`, { size: 22 }), ...L.runs(require('./refs')[k], { font: FONT, size: 22 })],
    }));
  });
  return els;
}

const POTXT = [
  ['PO1', 'Engineering Knowledge: Apply knowledge of mathematics, natural science, computing, engineering fundamentals and an engineering specialization as specified in WK1 to WK4 respectively to develop to the solution of complex engineering problems.'],
  ['PO2', 'Problem Analysis: Identify, formulate, review research literature and analyze complex engineering problems reaching substantiated conclusions with consideration for sustainable development. (WK1 to WK4)'],
  ['PO3', 'Design/Development of Solutions: Design creative solutions for complex engineering problems and design/develop systems/components/processes to meet identified needs with consideration for the public health and safety, whole-life cost, net zero carbon, culture, society and environment as required. (WK5)'],
  ['PO4', 'Conduct Investigations of Complex Problems: Conduct investigations of complex engineering problems using research-based knowledge including design of experiments, modelling, analysis & interpretation of data to provide valid conclusions. (WK8).'],
  ['PO5', 'Engineering Tool Usage: Create, select and apply appropriate techniques, resources and modern engineering & IT tools, including prediction and modelling recognizing their limitations to solve complex engineering problems. (WK2 and WK6)'],
  ['PO6', 'The Engineer and The World: Analyze and evaluate societal and environmental aspects while solving complex engineering problems for its impact on sustainability with reference to economy, health, safety, legal framework, culture and environment. (WK1, WK5, and WK7).'],
  ['PO7', 'Ethics: Apply ethical principles and commit to professional ethics, human values, diversity and inclusion; adhere to national & international laws. (WK9)'],
  ['PO8', 'Individual and Collaborative Team work: Function effectively as an individual, and as a member or leader in diverse/multi-disciplinary teams.'],
  ['PO9', 'Communication: Communicate effectively and inclusively within the engineering community and society at large, such as being able to comprehend and write effective reports and design documentation, make effective presentations considering cultural, language, and learning differences'],
  ['PO10', 'Project Management and Finance: Apply knowledge and understanding of engineering management principles and economic decision-making and apply these to one’s own work, as a member and leader in a team, and to manage projects and in multidisciplinary environments.'],
  ['PO11', 'Life-Long Learning: Recognize the need for, and have the preparation and ability for i) independent and life-long learning ii) adaptability to new and emerging technologies and iii) critical thinking in the broadest context of technological change. (WK8)'],
];
const PSOTXT = [
  ['PSO1', 'Design and develop computing systems using principles and concepts of Artificial Intelligence and Data science'],
  ['PSO2', 'Apply the concepts, principles of functional data science, machine learning and AI tools and techniques to address common challenges and make better-informed decisions in business processes'],
  ['PSO3', 'Effectively build end-to-end Data Science, & AI systems/projects and solve complex interdisciplinary problems'],
];

function appendices() {
  const out = [];
  out.push(head('APPENDIX A: Details of list of publications related to this project'));
  out.push(para('No publication related to this project is listed at the time of writing. If a paper is submitted or accepted, add its details here, together with the certificate of publication and the published paper.'));
  out.push(head('APPENDIX B: POs and PSOs Mapped'));
  out.push(para('The Program Outcomes and Programme Specific Outcomes of the Department of AI & DS, BMSCE, are reproduced below with the project components that address them. The levels and justifications are given on the attainment sheet at the end of Chapter 8.', { after: 120 }));
  const map = {
    PO1: 'Chapters 1 to 5: portfolio model, objectives, algorithms', PO2: 'Chapter 2 and Chapter 4: literature, gaps and problem formulation',
    PO3: 'Chapters 3 to 5: requirements, architecture and implementation', PO4: 'Chapters 4, 6 and 7: experimental design, statistical analysis',
    PO5: 'Chapter 5 and Section 3.4: NumPy, pandas, SciPy, Matplotlib, pytest', PO6: 'Section 1.5: SDGs', PO7: 'Sections 3.7.1 and 5.4; reference list',
    PO8: 'Team organisation of the project', PO9: 'This report and the interactive interface', PO10: 'Sections 1.8, 3.5 and 3.7', PO11: 'Whole project',
  };
  out.push(...table(['PO', 'Statement', 'Addressed in'], POTXT.map(([id, t]) => [id, t, map[id]]), [700, 5231, 2800], 'Program Outcomes (PO) mapped to the project', { size: 19 }));
  const pmap = { PSO1: 'Chapters 4 and 5: design and implementation', PSO2: 'Chapter 7: results interpreted for investment decisions', PSO3: 'Whole system: data, optimisation, evaluation, interface, tests' };
  out.push(...table(['PSO', 'Statement', 'Addressed in'], PSOTXT.map(([id, t]) => [id, t, pmap[id]]), [700, 5231, 2800], 'Programme Specific Outcomes (PSO) mapped to the project', { size: 19 }));
  out.push(head('APPENDIX C: AI Generated Report and Plagiarism report Screen shot'));
  out.push(para('Insert here the screenshots of the AI-generated-content report and the plagiarism (similarity) report produced by the institution’s checking tool for this report, as required by the department. These reports can only be generated from the final document after it is submitted to the tool, so this page is left for the team to complete.'));
  return out;
}

module.exports = { attainment, references, appendices };
