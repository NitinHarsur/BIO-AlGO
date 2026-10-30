// Shared helpers for the SwarmFolio report builder (docx-js).
const d = require('docx');
const fs = require('fs');
const path = require('path');

const FONT = 'Times New Roman';
const ROOT = path.join(__dirname, '..');
const FIG = path.join(ROOT, 'fig');
const LOGO = path.join(ROOT, 'logos');
const W = { page: 11906, left: 1758, right: 1417, top: 1134, bottom: 1134 };
W.text = W.page - W.left - W.right;                      // 8731 dxa = 6.06 in

const pagesFile = path.join(ROOT, 'pages.json');
const PAGES = fs.existsSync(pagesFile) ? JSON.parse(fs.readFileSync(pagesFile, 'utf8')) : {};
const pg = (k) => (PAGES[k] !== undefined ? String(PAGES[k]) : '0');

const REG = { heads: [], figs: [], tabs: [] };            // for TOC / lists
const CITE = { order: [], n: {} };
let REFS = {};
const COUNT = { fig: {}, tab: {}, ch: 0 };

const setRefs = (r) => { REFS = r; };
function citeNum(k) {
  if (!REFS[k]) throw new Error('unknown reference ' + k);
  if (!CITE.n[k]) { CITE.order.push(k); CITE.n[k] = CITE.order.length; }
  return CITE.n[k];
}

// inline markup: **bold**, __italic__, {c:key1,key2} citations, ^^sup^^, ~~sub~~
function runs(text, base = {}) {
  const out = [];
  const re = /(\*\*.+?\*\*|__.+?__|\{c:[^}]+\}|\^\^.+?\^\^|~~.+?~~)/g;
  const parts = String(text).split(re).filter((s) => s !== '');
  for (const p of parts) {
    if (p.startsWith('**')) out.push(new d.TextRun({ text: p.slice(2, -2), bold: true, ...base }));
    else if (p.startsWith('__')) out.push(new d.TextRun({ text: p.slice(2, -2), italics: true, ...base }));
    else if (p.startsWith('^^')) out.push(new d.TextRun({ text: p.slice(2, -2), superScript: true, ...base }));
    else if (p.startsWith('~~')) out.push(new d.TextRun({ text: p.slice(2, -2), subScript: true, ...base }));
    else if (p.startsWith('{c:')) {
      const ks = p.slice(3, -1).split(',').map((s) => s.trim());
      out.push(new d.TextRun({ text: ks.map((k) => `[${citeNum(k)}]`).join(', '), ...base }));
    } else out.push(new d.TextRun({ text: p, ...base }));
  }
  return out;
}

const SP15 = { line: 360, lineRule: d.LineRuleType.AUTO };
function para(text, o = {}) {
  return new d.Paragraph({
    alignment: o.align || d.AlignmentType.JUSTIFIED,
    spacing: { ...SP15, before: o.before ?? 0, after: o.after ?? 120, ...(o.spacing || {}) },
    indent: o.indent,
    keepNext: o.keepNext, pageBreakBefore: o.pageBreakBefore,
    children: runs(text, { font: FONT, size: o.size || 24, ...(o.run || {}) }),
  });
}

function chapter(n, title) {
  COUNT.ch = n;
  REG.heads.push({ num: String(n), title, level: 1, key: `h:${n}` });
  return [
    new d.Paragraph({ heading: d.HeadingLevel.HEADING_1, pageBreakBefore: true, alignment: d.AlignmentType.LEFT,
      spacing: { before: 0, after: 60 }, children: [new d.TextRun({ text: `Chapter ${n}`, font: FONT, size: 32, bold: true })] }),
    new d.Paragraph({ style: 'ChapterTitle', alignment: d.AlignmentType.CENTER, spacing: { before: 0, after: 240 },
      children: [new d.TextRun({ text: title, font: FONT, size: 36, bold: true })] }),
  ];
}
function h2(num, title) {
  REG.heads.push({ num, title, level: 2, key: `h:${num}` });
  return new d.Paragraph({ heading: d.HeadingLevel.HEADING_2, keepNext: true, alignment: d.AlignmentType.LEFT,
    spacing: { before: 240, after: 120 }, children: [new d.TextRun({ text: `${num}  ${title}`, font: FONT, size: 32, bold: true })] });
}
function h3(num, title) {
  REG.heads.push({ num, title, level: 3, key: `h:${num}` });
  return new d.Paragraph({ heading: d.HeadingLevel.HEADING_3, keepNext: true, alignment: d.AlignmentType.LEFT,
    spacing: { before: 200, after: 100 }, children: [new d.TextRun({ text: `${num}  ${title}`, font: FONT, size: 28, bold: true })] });
}
function h4(text) {
  return new d.Paragraph({ keepNext: true, spacing: { before: 140, after: 60 }, children: [new d.TextRun({ text, font: FONT, size: 24, bold: true })] });
}

function bullets(items, ref = 'bul') {
  return items.map((t) => new d.Paragraph({
    numbering: { reference: ref, level: 0 }, alignment: d.AlignmentType.JUSTIFIED,
    spacing: { ...SP15, after: 60 }, children: runs(t, { font: FONT, size: 24 }),
  }));
}
let numberedId = 0;
function numbered(items) {
  const ref = `num${numberedId++}`;
  numberedRefs.push(ref);
  return items.map((t) => new d.Paragraph({
    numbering: { reference: ref, level: 0 }, alignment: d.AlignmentType.JUSTIFIED,
    spacing: { ...SP15, after: 60 }, children: runs(t, { font: FONT, size: 24 }),
  }));
}
const numberedRefs = [];

// ---- images
function pngSize(file) {
  const b = fs.readFileSync(file);
  if (b.slice(1, 4).toString() === 'PNG') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  // jpeg
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xc3) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error('bad image ' + file);
}
function image(file, widthIn, type = 'png') {
  const s = pngSize(file);
  const wpx = Math.round(widthIn * 96), hpx = Math.round(wpx * s.h / s.w);
  return new d.ImageRun({ type, data: fs.readFileSync(file), transformation: { width: wpx, height: hpx } });
}
function figure(file, widthIn, caption) {
  const ch = COUNT.ch;
  COUNT.fig[ch] = (COUNT.fig[ch] || 0) + 1;
  const label = `Figure ${ch}.${COUNT.fig[ch]}`;
  REG.figs.push({ label, caption, key: `f:${label}` });
  return {
    label,
    els: [
      new d.Paragraph({ alignment: d.AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 60 },
        children: [image(path.isAbsolute(file) ? file : path.join(FIG, file), widthIn)] }),
      new d.Paragraph({ alignment: d.AlignmentType.CENTER, spacing: { before: 0, after: 200 },
        children: runs(`**${label}:** ${caption}`, { font: FONT, size: 22 }) }),
    ],
  };
}

// ---- tables
const border = { style: d.BorderStyle.SINGLE, size: 4, color: '000000' };
const borders = { top: border, bottom: border, left: border, right: border };
function cell(text, w, o = {}) {
  const paras = String(text).split('\n').map((line) => new d.Paragraph({
    keepNext: o.keepNext, alignment: o.align || d.AlignmentType.LEFT, spacing: { line: 252, lineRule: d.LineRuleType.AUTO, after: 20, before: 20 },
    children: runs(line, { font: o.mono ? 'Courier New' : FONT, size: o.size || 22, bold: o.bold }),
  }));
  return new d.TableCell({
    width: { size: w, type: d.WidthType.DXA }, borders, verticalAlign: d.VerticalAlign.CENTER,
    shading: o.fill ? { fill: o.fill, type: d.ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: 40, bottom: 40, left: 90, right: 90 }, columnSpan: o.span, children: paras,
  });
}
function table(headers, rows, widths, caption, o = {}) {
  const ch = COUNT.ch;
  COUNT.tab[ch] = (COUNT.tab[ch] || 0) + 1;
  const label = `Table ${ch}.${COUNT.tab[ch]}`;
  REG.tabs.push({ label, caption, key: `t:${label}` });
  // every table spans the full text width so that all tables align with the text edges
  const sum0 = widths.reduce((a, b) => a + b, 0);
  widths = widths.map((x) => Math.round(x * W.text / sum0));
  widths[widths.length - 1] += W.text - widths.reduce((a, b) => a + b, 0);
  const total = W.text;
  const keep = rows.length <= 12;               // short tables stay on one page
  const aligns = o.aligns || widths.map(() => d.AlignmentType.LEFT);
  const tbl = new d.Table({
    width: { size: total, type: d.WidthType.DXA }, columnWidths: widths, alignment: d.AlignmentType.CENTER,
    rows: [
      new d.TableRow({ tableHeader: true, cantSplit: true, children: headers.map((h, i) => cell(h, widths[i], { bold: true, fill: 'E7E7E7', align: d.AlignmentType.CENTER, size: o.size, keepNext: keep })) }),
      ...rows.map((r, ri) => new d.TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, widths[i], { align: aligns[i], size: o.size, bold: o.boldFirst && i === 0, keepNext: keep && ri < rows.length - 1 })) })),
    ],
  });
  return [
    new d.Paragraph({ keepNext: true, alignment: d.AlignmentType.CENTER, spacing: { before: 160, after: 80 },
      children: runs(`**${label}:** ${caption}`, { font: FONT, size: 22 }) }),
    tbl,
    new d.Paragraph({ spacing: { before: 0, after: 160 }, children: [] }),
  ];
}
function code(lines, caption) {
  const out = [];
  if (caption) out.push(new d.Paragraph({ keepNext: true, spacing: { before: 120, after: 60 }, alignment: d.AlignmentType.LEFT, children: runs(`**${caption}**`, { font: FONT, size: 22 }) }));
  const rows = lines.map((l) => new d.Paragraph({
    spacing: { line: 240, lineRule: d.LineRuleType.AUTO, after: 0 }, keepLines: true,
    children: [new d.TextRun({ text: l.replace(/^( +)/, (m) => ' '.repeat(m.length)), font: 'Courier New', size: 17 })],
  }));
  out.push(new d.Table({
    width: { size: W.text, type: d.WidthType.DXA }, columnWidths: [W.text],
    rows: [new d.TableRow({ cantSplit: true, children: [new d.TableCell({ width: { size: W.text, type: d.WidthType.DXA }, borders,
      shading: { fill: 'F7F7F7', type: d.ShadingType.CLEAR, color: 'auto' }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: rows })] })],
  }));
  out.push(new d.Paragraph({ spacing: { after: 160 }, children: [] }));
  return out;
}
function equation(text, num) {
  return new d.Paragraph({
    spacing: { before: 60, after: 120, line: 300, lineRule: d.LineRuleType.AUTO },
    tabStops: [{ type: d.TabStopType.CENTER, position: Math.round(W.text / 2) }, { type: d.TabStopType.RIGHT, position: W.text }],
    children: [new d.TextRun({ text: '\t', font: FONT }), ...runs(text, { font: FONT, size: 24 }), new d.TextRun({ text: `\t(${num})`, font: FONT, size: 24 })],
  });
}

module.exports = { d, fs, path, FONT, W, ROOT, FIG, LOGO, PAGES, pg, REG, CITE, COUNT, setRefs, citeNum, runs, para, chapter, h2, h3, h4,
  bullets, numbered, numberedRefs, image, figure, table, code, equation, cell, border, borders, SP15 };
