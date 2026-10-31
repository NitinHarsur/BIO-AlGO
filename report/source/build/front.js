const L = require('./lib');
const { d, FONT, W, LOGO, path, fs } = L;

const TITLE = 'SwarmFolio: Multi-Objective Stock Portfolio Optimization Using Particle Swarm Optimization and Genetic Algorithms';
const STUDENTS = [['Vivek Boora', '1BM23AD073'], ['Ayush Pandey', '1BM23AD074'], ['Nitin', '1BM24AD404']];
const GUIDE = { name: 'Prof. Suman M', desig: 'Assistant Professor', qual: 'B.E, M.Tech, [PhD]' };
const C = d.AlignmentType.CENTER;

const t = (text, o = {}) => new d.TextRun({ text, font: FONT, size: o.size || 24, bold: o.bold, italics: o.italics, underline: o.underline ? {} : undefined });
const p = (children, o = {}) => new d.Paragraph({ alignment: o.align || C, spacing: { before: o.before || 0, after: o.after ?? 80, line: o.line || 276, lineRule: d.LineRuleType.AUTO }, keepNext: o.keepNext, children: Array.isArray(children) ? children : [children] });
const noBorder = { style: d.BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const img = (file, wIn, type = 'png') => L.image(path.join(LOGO, file), wIn, type);

function cover() {
  const rows = STUDENTS.map(([n, u]) => new d.TableRow({ children: [
    new d.TableCell({ width: { size: 2600, type: d.WidthType.DXA }, borders: noBorders, children: [p(t(n, { bold: true }), { align: d.AlignmentType.LEFT, after: 40 })] }),
    new d.TableCell({ width: { size: 2000, type: d.WidthType.DXA }, borders: noBorders, children: [p(t(u, { bold: true }), { align: d.AlignmentType.LEFT, after: 40 })] }),
  ] }));
  return [
    p(t('VISVESVARAYA TECHNOLOGICAL UNIVERSITY', { bold: true, size: 28 }), { after: 60 }),
    p(t('“Jnana Sangama”, Belgaum-590018.', { bold: true }), { after: 100 }),
    p(new d.ImageRun({ ...{ type: 'png', data: fs.readFileSync(path.join(LOGO, 'vtu.png')), transformation: { width: 92, height: 65 } } }), { after: 160 }),
    p(t('PROJECT WORK BIO-INSPIRED ALGORITHMS (23DS7BSBIO) REPORT', { bold: true }), { after: 100 }),
    p(t('ON', { size: 24 }), { after: 100 }),
    p(t(TITLE, { bold: true, size: 28 }), { after: 100, line: 300 }),
    p(t('Risk, return and tail-risk trade-offs with a live optimisation workbench', { bold: true }), { after: 200 }),
    p(t('Submitted in Partial fulfilment for the VII Semester, B.E in', { bold: true, italics: true }), { after: 20 }),
    p(t('Artificial Intelligence & Data Science', { bold: true, italics: true }), { after: 160 }),
    p(t('Submitted by:', { bold: true }), { after: 80 }),
    new d.Table({ width: { size: 4600, type: d.WidthType.DXA }, columnWidths: [2600, 2000], alignment: C, rows }),
    p(t('Under the Guidance of:', { bold: true }), { before: 200, after: 60 }),
    p(t(GUIDE.name, { bold: true }), { after: 0 }),
    p(t(GUIDE.desig, { bold: true }), { after: 0 }),
    p(t(GUIDE.qual, { bold: true }), { after: 0 }),
    p(t('Dept. of AI & DS', { bold: true }), { after: 140 }),
    p(new d.ImageRun({ type: 'png', data: fs.readFileSync(path.join(LOGO, 'bms.png')), transformation: { width: 76, height: 77 } }), { after: 100 }),
    p(t('2026-2027', { bold: true }), { after: 160 }),
    p(t('DEPARTMENT OF ARTIFICIAL INTELLIGENCE & DATA SCIENCE', { bold: true }), { after: 0 }),
    p(t('B.M.S. College of Engineering', { bold: true, size: 28 }), { after: 0 }),
    p(t('Bull Temple Road, Basavanagudi, Bengaluru-560019', { bold: true }), { after: 0 }),
    p(t('(Autonomous Institute under Visvesvaraya Technological University,', { bold: true, size: 20 }), { after: 0 }),
    p(t('Belagavi and Approved by AICTE, New Delhi,', { bold: true, size: 20 }), { after: 0 }),
    p(t('NAAC Accredited with ‘A++’ Grade)', { bold: true, size: 20 }), { after: 0 }),
  ];
}

function certificate() {
  const names = 'Vivek Boora, Ayush Pandey and Nitin';
  const sig = new d.Table({ width: { size: W.text, type: d.WidthType.DXA }, columnWidths: [4365, 4366], rows: [new d.TableRow({ children: [
    new d.TableCell({ width: { size: 4365, type: d.WidthType.DXA }, borders: noBorders, children: [
      p(t('Signature of the Guide'), { after: 300, align: d.AlignmentType.LEFT }),
      p(t(GUIDE.name, { bold: true }), { align: d.AlignmentType.LEFT, after: 0 }),
      p(t('Asst. Prof. Dept. of AI & DS', { size: 22 }), { align: d.AlignmentType.LEFT, after: 0 }),
      p(t('BMSCE, Bengaluru.', { size: 22 }), { align: d.AlignmentType.LEFT, after: 0 })] }),
    new d.TableCell({ width: { size: 4366, type: d.WidthType.DXA }, borders: noBorders, children: [
      p(t('Signature of the HOD'), { after: 300, align: d.AlignmentType.RIGHT }),
      p(t('Dr. Seemanthini K', { bold: true }), { align: d.AlignmentType.RIGHT, after: 0 }),
      p(t('Assoc Prof. & Head, Dept. of AI & DS', { size: 22 }), { align: d.AlignmentType.RIGHT, after: 0 }),
      p(t('BMSCE, Bengaluru.', { size: 22 }), { align: d.AlignmentType.RIGHT, after: 0 })] }),
  ] })] });
  const ex = (n) => new d.TableRow({ height: { value: 420, rule: d.HeightRule.ATLEAST }, children: [
    L.cell(`${n}.`, 600, { align: C }), L.cell('', 4100), L.cell('', 4031)] });
  return [
    p(t('B.M.S. College of Engineering', { bold: true, size: 32 }), { after: 0 }),
    p(t('Bull Temple Road, Basavanagudi, Bengaluru-560019', { bold: true }), { after: 0 }),
    p(t('(Autonomous Institute under Visvesvaraya Technological University, Belagavi and', { bold: true, size: 20 }), { after: 0 }),
    p(t('Approved by AICTE, New Delhi, NAAC Accredited with ‘A++’ Grade)', { bold: true, size: 20 }), { after: 120 }),
    p(t('Department of Artificial Intelligence & Data Science', { bold: true, size: 28 }), { after: 140 }),
    p(new d.ImageRun({ type: 'png', data: fs.readFileSync(path.join(LOGO, 'bms.png')), transformation: { width: 84, height: 85 } }), { after: 200 }),
    p(t('CERTIFICATE', { bold: true, underline: true, size: 32 }), { after: 240 }),
    new d.Paragraph({ alignment: d.AlignmentType.JUSTIFIED, spacing: { line: 360, after: 360 }, indent: { firstLine: 480 }, children: [
      t('Certified that the BIO-INSPIRED ALGORITHMS [23DS7BSBIO] entitled “'), t(TITLE, { bold: true }), t('” carried out by '), t(names, { bold: true }),
      t(' bonafide students of B.M.S. College of Engineering, in partial fulfillment for the award of Bachelor of Engineering in Artificial Intelligence & Data Science of the Visvesvaraya Technological University, Belgaum during the year 2026-27. It is certified that all corrections/suggestions indicated for internal assessment have been incorporated in the report deposited in the department library.')] }),
    sig,
    p(t('Principal', { bold: true }), { before: 240, after: 0 }),
    p(t('Dr. Bheemsha Arya', { bold: true }), { after: 0 }),
    p(t('B.M.S. College of Engineering'), { after: 200 }),
    p(t('External Viva', { underline: true }), { after: 100 }),
    new d.Table({ width: { size: W.text, type: d.WidthType.DXA }, columnWidths: [600, 4100, 4031], rows: [
      new d.TableRow({ children: [L.cell('', 600), L.cell('Name of the Examiners', 4100, { bold: true, align: C }), L.cell('Signature with Date', 4031, { bold: true, align: C })] }), ex(1), ex(2)] }),
  ];
}

const titleP = (text, pb = true) => new d.Paragraph({ alignment: C, pageBreakBefore: pb, spacing: { before: 0, after: 240 }, children: [t(text, { bold: true, size: 28 })] });

function abstract(text) {
  return [titleP('ABSTRACT', false), ...text.split(/\n\n+/).map((x) => new d.Paragraph({ alignment: d.AlignmentType.JUSTIFIED, spacing: { line: 480, lineRule: d.LineRuleType.AUTO, after: 0 }, children: L.runs(x.trim(), { font: FONT, size: 24 }) }))];
}

function declaration() {
  const row = ([n, u]) => new d.TableRow({ height: { value: 480, rule: d.HeightRule.ATLEAST }, children: [L.cell(n, 3200, { bold: true, size: 24 }), L.cell(u, 2400, { bold: true, size: 24 }), L.cell('……………………', 3131, { size: 24 })] });
  return [titleP('DECLARATION'),
    L.para(`We the undersigned students of 7^^th^^ semester, Department of Artificial Intelligence & Data Science, B.M.S. College of Engineering, declare that the project work for bio-inspired algorithms [23DS7BSBIO] entitled “**${TITLE}**”, is a bonafide work of us and our project is neither a copy nor by any means a modification of any other engineering project.`, { indent: { firstLine: 480 } }),
    L.para('We also declare that this project was not entitled for submission to any other university in the past and shall remain the only submission made and will not be submitted by us to any other university in the future.', { indent: { firstLine: 480 }, after: 360 }),
    new d.Table({ width: { size: W.text, type: d.WidthType.DXA }, columnWidths: [3200, 2400, 3131], rows: [
      new d.TableRow({ children: [L.cell('Name', 3200, { bold: true, size: 24, fill: 'E7E7E7' }), L.cell('USN', 2400, { bold: true, size: 24, fill: 'E7E7E7' }), L.cell('Signature', 3131, { bold: true, size: 24, fill: 'E7E7E7' })] }),
      ...STUDENTS.map(row)] }),
  ];
}

function acknowledgement() {
  const g = (x) => L.para(x, { indent: { firstLine: 480 } });
  return [titleP('ACKNOWLEDGEMENT'),
    g('The satisfaction and euphoria that accompany the successful completion of any task would be incomplete without the mention of the people who made it possible, whose constant guidance and encouragement crowned our effort with success.'),
    g('We are grateful to our institution, **B.M.S. College of Engineering**, with its ideals and inspirations for having provided us with the facilities, which has made this project a success.'),
    g('We earnestly thank **Dr. Bheemsha Arya, Principal, BMS College of Engineering**, for facilitating academic excellence in the college and providing us with the congenial environment to work in, that helped us in completing this project.'),
    g('We wish to extend our profound thanks to **Dr. Seemanthini K, Assoc Prof. and Head, Department of Artificial Intelligence & Data Science, BMSCE**, for giving us the consent to carry out this project.'),
    g(`We would like to express our sincere thanks to our guide **${GUIDE.name}, Assistant Professor, Department of Artificial Intelligence & Data Science, BMSCE**, for the valuable guidance at every stage, which helped us in the successful completion of the project.`),
    g('We would like to thank all the teaching and non-teaching staff for their valuable advice and support.'),
    g('We would like to express our sincere thanks to our parents and friends for their support.'),
    ...STUDENTS.map(([n]) => new d.Paragraph({ alignment: d.AlignmentType.RIGHT, spacing: { before: 60, after: 0, line: 360 }, children: [t(n, { bold: true })] })),
  ];
}

// ---------------------------------------------------------------- TOC and lists
const ROMAN = ['', 'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];

function tocTables() {
  const small = [['ABSTRACT', 'abstract'], ['DECLARATION', 'declaration'], ['ACKNOWLEDGEMENTS', 'ack'], ['LIST OF TABLES', 'lot'], ['LIST OF FIGURES', 'lof']];
  const w1 = [7000, 1731];
  const t1 = new d.Table({ width: { size: W.text, type: d.WidthType.DXA }, columnWidths: w1, rows: [
    new d.TableRow({ children: [L.cell('TITLE', w1[0], { bold: true, align: C, fill: 'E7E7E7' }), L.cell('PAGE NO.', w1[1], { bold: true, align: C, fill: 'E7E7E7' })] }),
    ...small.map(([a, k]) => new d.TableRow({ children: [L.cell(a, w1[0], { bold: true, size: 20 }), L.cell(L.pg(k), w1[1], { bold: true, align: C, size: 20 })] })),
  ] });
  const w2 = [1300, 6200, 1231];
  const rows = [new d.TableRow({ tableHeader: true, children: [L.cell('CHAPTER NO.', w2[0], { bold: true, align: C, fill: 'E7E7E7' }), L.cell('TITLE', w2[1], { bold: true, align: C, fill: 'E7E7E7' }), L.cell('PAGE NO.', w2[2], { bold: true, align: C, fill: 'E7E7E7' })] })];
  for (const h of L.REG.heads) {
    rows.push(new d.TableRow({ cantSplit: true, children: [
      L.cell(h.num, w2[0], { bold: h.level === 1, align: C, size: 20 }),
      L.cell(h.level === 3 ? '    ' + h.title : h.title, w2[1], { bold: h.level === 1, size: 20 }),
      L.cell(L.pg(h.key), w2[2], { bold: h.level === 1, align: C, size: 20 })] }));
  }
  for (const [a, k] of [['POs attained with Justification', 'pos'], ['REFERENCES', 'refs'], ['APPENDIX A: Details of list of publications related to this project', 'appA'],
    ['APPENDIX B: POs and PSOs Mapped', 'appB'], ['APPENDIX C: AI Generated Report and Plagiarism report Screen shot', 'appC']]) {
    rows.push(new d.TableRow({ cantSplit: true, children: [L.cell('', w2[0], { size: 20 }), L.cell(a, w2[1], { size: 20 }), L.cell(L.pg(k), w2[2], { align: C, size: 20 })] }));
  }
  return [titleP('TABLE OF CONTENTS'), t1, new d.Paragraph({ spacing: { after: 200 }, children: [] }),
    new d.Table({ width: { size: W.text, type: d.WidthType.DXA }, columnWidths: w2, rows })];
}

function listPage(title, entries, head, key) {
  const w = [1500, 6100, 1131];
  return [titleP(title),
    new d.Table({ width: { size: W.text, type: d.WidthType.DXA }, columnWidths: w, rows: [
      new d.TableRow({ children: [L.cell(head, w[0], { bold: true, fill: 'E7E7E7' }), L.cell('Caption', w[1], { bold: true, fill: 'E7E7E7' }), L.cell('Page No.', w[2], { bold: true, align: C, fill: 'E7E7E7' })] }),
      ...entries.map((e) => new d.TableRow({ cantSplit: true, children: [L.cell(e.label + ':', w[0]), L.cell(e.caption.replace(/\*\*|__/g, ''), w[1]), L.cell(L.pg(e.key), w[2], { align: C })] })),
    ] })];
}

module.exports = { cover, certificate, abstract, declaration, acknowledgement, tocTables, listPage, TITLE, STUDENTS, GUIDE, ROMAN };
