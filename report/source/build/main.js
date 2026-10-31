const L = require('./lib');
const { d, fs, path, FONT, W } = L;
L.setRefs(require('./refs'));
const front = require('./front');
const { ch1, ch2, ch3 } = require('./ch1_3');
const { ch4, ch5 } = require('./ch4_5');
const { ch6, ch7, ch8 } = require('./ch6_8');
const end = require('./end');

const abstractText = fs.readFileSync(path.join(L.ROOT, 'abstract.txt'), 'utf8');
const OUT = process.argv[2] || path.join(L.ROOT, 'SwarmFolio_Project_Report.docx');

// body first, so that registries (headings, figures, tables, citations) are filled
const body = [...ch1(), ...ch2(), ...ch3(), ...ch4(), ...ch5(), ...ch6(), ...ch7(), ...ch8()];
const attain = end.attainment();
const refs = end.references();
const apps = end.appendices();

const page = (extra = {}) => ({ size: { width: W.page, height: 16838 }, margin: { top: W.top, bottom: W.bottom, left: W.left, right: W.right, header: 567, footer: 567 }, ...extra });
const footerRoman = new d.Footer({ children: [new d.Paragraph({ alignment: d.AlignmentType.CENTER, children: [new d.TextRun({ children: [d.PageNumber.CURRENT], font: FONT, size: 22 })] })] });
const footerChap = new d.Footer({ children: [new d.Paragraph({
  tabStops: [{ type: d.TabStopType.CENTER, position: Math.round(W.text / 2) }, { type: d.TabStopType.RIGHT, position: W.text }],
  border: { top: { style: d.BorderStyle.SINGLE, size: 4, color: '999999', space: 4 } },
  children: [new d.TextRun({ text: 'Dept. of AI & DS, BMSCE', font: FONT, size: 20 }), new d.TextRun({ text: '\t', font: FONT }),
    new d.TextRun({ children: [d.PageNumber.CURRENT], font: FONT, size: 20 }), new d.TextRun({ text: '\t2026-27', font: FONT, size: 20 })] })] });

const style = (id, name, size, outline) => ({ id, name, basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size, bold: true, color: '000000' }, paragraph: { outlineLevel: outline } });
const doc = new d.Document({
  creator: 'Vivek Boora, Ayush Pandey, Nitin', title: front.TITLE, description: 'Project report, Bio-Inspired Algorithms (23DS7BSBIO), BMSCE',
  styles: {
    default: { document: { run: { font: FONT, size: 24 } } },
    paragraphStyles: [style('Heading1', 'Heading 1', 32, 0), style('Heading2', 'Heading 2', 32, 1), style('Heading3', 'Heading 3', 28, 2), { ...style('ChapterTitle', 'Chapter Title', 36, 0), paragraph: { outlineLevel: 0 } }],
  },
  numbering: { config: [
    { reference: 'bul', levels: [{ level: 0, format: d.LevelFormat.BULLET, text: '•', alignment: d.AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ...L.numberedRefs.map((ref) => ({ reference: ref, levels: [{ level: 0, format: d.LevelFormat.DECIMAL, text: '%1.', alignment: d.AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] })),
  ] },
  sections: [
    { properties: { page: page() }, children: front.cover() },
    { properties: { type: d.SectionType.NEXT_PAGE, page: page() }, children: front.certificate() },
    { properties: { type: d.SectionType.NEXT_PAGE, page: page({ pageNumbers: { start: 1, formatType: d.NumberFormat.LOWER_ROMAN } }) }, footers: { default: footerRoman },
      children: [...front.abstract(abstractText), ...front.declaration(), ...front.acknowledgement(), ...front.tocTables(),
        ...front.listPage('LIST OF TABLES', L.REG.tabs, 'Tables', 'lot'), ...front.listPage('LIST OF FIGURES', L.REG.figs, 'Figures', 'lof')] },
    { properties: { type: d.SectionType.NEXT_PAGE, page: page({ pageNumbers: { start: 1, formatType: d.NumberFormat.DECIMAL } }) }, footers: { default: footerChap },
      children: [...body, ...attain, ...refs, ...apps] },
  ],
});
d.Packer.toBuffer(doc).then((b) => {
  fs.writeFileSync(OUT, b);
  fs.writeFileSync(path.join(L.ROOT, 'layout.json'), JSON.stringify({ heads: L.REG.heads, figs: L.REG.figs, tabs: L.REG.tabs, nrefs: L.CITE.order.length }, null, 1));
  console.log('written', OUT, 'refs', L.CITE.order.length);
});
