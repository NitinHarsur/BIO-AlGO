(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AX = { vol: { i: 0, label: 'Annual volatility', dec: 0 }, cvar: { i: 2, label: 'Worst 5% day loss (CVaR)', dec: 1 } };
  const ALG_NAME = { PSO: 'Particle swarm', GA: 'Genetic algorithm', Random: 'Random search' };

  const S = {
    jobId: null, timer: null, running: false,
    xKey: 'vol', show: { PSO: true, GA: true },
    cloud: [], snap: {}, progress: {}, result: null,
    sel: null, hover: null, source: 'synthetic', csvText: null,
    view: null, animating: false,
  };
  let colors = {};

  // ---------------------------------------------------------------- helpers
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pct = (v, d = 1) => (v * 100).toFixed(d) + '%';
  const num = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : '-');
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const readColors = () => {
    colors = { ink: css('--ink'), muted: css('--muted'), line: css('--line'), panel: css('--panel'),
      PSO: css('--pso'), GA: css('--ga'), rand: css('--rand'), accent: css('--accent') };
  };

  function fit(canvas) {
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: r.width, h: r.height };
  }

  function niceTicks(lo, hi, n = 5) {
    const span = hi - lo || 1, raw = span / n, mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
    const out = [];
    for (let t = Math.ceil(lo / step) * step; t <= hi + 1e-12; t += step) out.push(+t.toFixed(10));
    return out;
  }

  // ---------------------------------------------------------------- theme
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('swarmfolio-theme', t); } catch (e) { /* storage unavailable */ }
    $('#theme').textContent = t === 'dark' ? 'Light' : 'Dark';
    readColors(); redrawAll();
  }
  function initTheme() {
    let t = null;
    try { t = localStorage.getItem('swarmfolio-theme'); } catch (e) { /* ignore */ }
    if (!t) t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(t);
    $('#theme').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  }

  // ---------------------------------------------------------------- stage canvas
  const stageCv = $('#stage-canvas');
  const M = { l: 54, r: 16, t: 22, b: 38 };

  function frontPoints(alg) { return S.result ? S.result.fronts[alg].points : null; }

  function targetView() {
    const xi = AX[S.xKey].i;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const add = (rows) => { for (const p of rows) { x0 = Math.min(x0, p[xi]); x1 = Math.max(x1, p[xi]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } };
    add(S.cloud);
    for (const a of ['PSO', 'GA']) {
      if (!S.show[a]) continue;
      const fp = frontPoints(a);
      if (fp) add(fp); else if (S.snap[a]) { add(S.snap[a].pop); add(S.snap[a].front); }
    }
    if (!Number.isFinite(x0)) return { x0: 0, x1: 1, y0: 0, y1: 1 };
    const px = (x1 - x0) * 0.06 || 0.01, py = (y1 - y0) * 0.08 || 0.01;
    return { x0: x0 - px, x1: x1 + px, y0: y0 - py, y1: y1 + py };
  }

  function drawStage() {
    const { ctx, w, h } = fit(stageCv);
    ctx.clearRect(0, 0, w, h);
    const tv = targetView();
    if (!S.view || reduceMotion) S.view = { ...tv };
    let moving = false;
    for (const k of ['x0', 'x1', 'y0', 'y1']) {
      const d = tv[k] - S.view[k];
      if (Math.abs(d) > (tv.x1 - tv.x0) * 1e-4) { S.view[k] += d * 0.14; moving = true; } else S.view[k] = tv[k];
    }
    const V = S.view, xi = AX[S.xKey].i;
    const pw = w - M.l - M.r, ph = h - M.t - M.b;
    const X = (v) => M.l + ((v - V.x0) / (V.x1 - V.x0)) * pw;
    const Y = (v) => M.t + ph - ((v - V.y0) / (V.y1 - V.y0)) * ph;
    S.map = { X, Y, xi };

    ctx.font = '12px ' + css('--mono');
    ctx.lineWidth = 1;
    // grid and ticks
    ctx.fillStyle = colors.muted; ctx.strokeStyle = colors.line;
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (const t of niceTicks(V.y0, V.y1, 5)) {
      const y = Math.round(Y(t)) + 0.5;
      if (y < M.t - 1 || y > M.t + ph + 1) continue;
      ctx.beginPath(); ctx.moveTo(M.l, y); ctx.lineTo(w - M.r, y); ctx.stroke();
      ctx.fillText(pct(t, 0), M.l - 8, y);
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const t of niceTicks(V.x0, V.x1, 6)) {
      const x = Math.round(X(t)) + 0.5;
      if (x < M.l - 1 || x > w - M.r + 1) continue;
      ctx.beginPath(); ctx.moveTo(x, M.t); ctx.lineTo(x, M.t + ph); ctx.stroke();
      ctx.fillText(pct(t, AX[S.xKey].dec), x, M.t + ph + 8);
    }
    ctx.fillStyle = colors.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('Annual return', M.l, 12);
    ctx.textAlign = 'right';
    ctx.fillText(AX[S.xKey].label, w - M.r, h - 4);

    ctx.save();
    ctx.beginPath(); ctx.rect(M.l, M.t - 4, pw + 6, ph + 8); ctx.clip();
    // random portfolios as backdrop
    ctx.globalAlpha = 0.5; ctx.fillStyle = colors.rand;
    for (const p of S.cloud) { ctx.beginPath(); ctx.arc(X(p[xi]), Y(p[1]), 1.8, 0, 6.2832); ctx.fill(); }
    ctx.globalAlpha = 1;

    for (const a of ['GA', 'PSO']) {
      if (!S.show[a]) continue;
      ctx.fillStyle = colors[a]; ctx.strokeStyle = colors[a];
      const fp = frontPoints(a);
      if (fp) {
        const pts = [...fp].sort((p, q) => p[xi] - q[xi]);
        ctx.lineWidth = 1.5; ctx.globalAlpha = 0.9; ctx.beginPath();
        pts.forEach((p, i) => (i ? ctx.lineTo(X(p[xi]), Y(p[1])) : ctx.moveTo(X(p[xi]), Y(p[1]))));
        ctx.stroke();
        ctx.globalAlpha = 1;
        for (const p of fp) { ctx.beginPath(); ctx.arc(X(p[xi]), Y(p[1]), 3, 0, 6.2832); ctx.fill(); }
      } else if (S.snap[a]) {
        ctx.globalAlpha = 0.4;
        for (const p of S.snap[a].pop) { ctx.beginPath(); ctx.arc(X(p[xi]), Y(p[1]), 2.6, 0, 6.2832); ctx.fill(); }
        ctx.globalAlpha = 1;
        for (const p of S.snap[a].front) { ctx.beginPath(); ctx.arc(X(p[xi]), Y(p[1]), 3.4, 0, 6.2832); ctx.fill(); }
      }
    }
    // equal weight marker
    if (S.result) {
      const e = S.result.equal_weight.train;
      ctx.fillStyle = colors.ink; ctx.save(); ctx.translate(X(e[xi]), Y(e[1])); ctx.rotate(Math.PI / 4);
      ctx.fillRect(-4, -4, 8, 8); ctx.restore();
    }
    // selection ring
    const sp = selectedPoint();
    if (sp) {
      ctx.strokeStyle = colors.ink; ctx.lineWidth = 2; ctx.fillStyle = colors.panel;
      ctx.beginPath(); ctx.arc(X(sp[xi]), Y(sp[1]), 7, 0, 6.2832); ctx.fill(); ctx.stroke();
      ctx.fillStyle = colors[S.sel.alg]; ctx.beginPath(); ctx.arc(X(sp[xi]), Y(sp[1]), 3.5, 0, 6.2832); ctx.fill();
    }
    ctx.restore();

    if (moving && !S.animating) { S.animating = true; requestAnimationFrame(() => { S.animating = false; drawStage(); }); }
  }

  function selectedPoint() {
    if (!S.result || !S.sel || !S.show[S.sel.alg]) return null;
    return S.result.fronts[S.sel.alg].points[S.sel.idx];
  }

  // pointer interaction: nearest front point within reach
  function nearest(ev) {
    if (!S.result || !S.map) return null;
    const r = stageCv.getBoundingClientRect(), mx = ev.clientX - r.left, my = ev.clientY - r.top;
    let best = null, bd = 18 * 18;
    for (const a of ['PSO', 'GA']) {
      if (!S.show[a]) continue;
      S.result.fronts[a].points.forEach((p, i) => {
        const dx = S.map.X(p[S.map.xi]) - mx, dy = S.map.Y(p[1]) - my, d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = { alg: a, idx: i, x: mx, y: my }; }
      });
    }
    return best;
  }
  stageCv.addEventListener('pointermove', (ev) => {
    const n = nearest(ev), tip = $('#tip');
    if (!n) { tip.hidden = true; return; }
    const p = S.result.fronts[n.alg].points[n.idx];
    tip.innerHTML = `<b>${ALG_NAME[n.alg]}</b>Return <span>${pct(p[1])}</span><br>Volatility <span>${pct(p[0])}</span><br>CVaR <span>${pct(p[2], 2)}</span>`;
    tip.hidden = false;
    const box = $('#plot').getBoundingClientRect();
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    tip.style.left = Math.min(Math.max(4, n.x + 14), box.width - tw - 4) + 'px';
    tip.style.top = Math.min(Math.max(4, n.y - th - 10), box.height - th - 4) + 'px';
  });
  stageCv.addEventListener('pointerleave', () => { $('#tip').hidden = true; });
  stageCv.addEventListener('click', (ev) => {
    const n = nearest(ev);
    if (n) select(n.alg, n.idx);
  });

  // ---------------------------------------------------------------- wealth + convergence charts
  function lineChart(canvas, series, opts) {
    const { ctx, w, h } = fit(canvas);
    ctx.clearRect(0, 0, w, h);
    const m = { l: 44, r: 10, t: 8, b: 22 };
    let lo = Infinity, hi = -Infinity, n = 0;
    for (const s of series) { for (const v of s.data) { lo = Math.min(lo, v); hi = Math.max(hi, v); } n = Math.max(n, s.data.length); }
    if (!Number.isFinite(lo)) return;
    const pad = (hi - lo) * 0.08 || 0.05; lo -= pad; hi += pad;
    const pw = w - m.l - m.r, ph = h - m.t - m.b;
    const X = (i) => m.l + (i / Math.max(1, n - 1)) * pw, Y = (v) => m.t + ph - ((v - lo) / (hi - lo)) * ph;
    ctx.font = '11.5px ' + css('--mono'); ctx.lineWidth = 1;
    ctx.fillStyle = colors.muted; ctx.strokeStyle = colors.line; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (const t of niceTicks(lo, hi, 4)) {
      const y = Math.round(Y(t)) + 0.5;
      ctx.beginPath(); ctx.moveTo(m.l, y); ctx.lineTo(w - m.r, y); ctx.stroke();
      ctx.fillText(opts.fmt(t), m.l - 6, y);
    }
    if (opts.baseline != null) {
      ctx.setLineDash([4, 4]); ctx.strokeStyle = colors.muted; const y = Math.round(Y(opts.baseline)) + 0.5;
      ctx.beginPath(); ctx.moveTo(m.l, y); ctx.lineTo(w - m.r, y); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.textBaseline = 'top';
    (opts.xLabels || []).forEach(([i, text, align]) => { ctx.textAlign = align; ctx.fillText(text, X(i), m.t + ph + 6); });
    for (const s of series) {
      ctx.strokeStyle = s.color; ctx.lineWidth = s.width || 1.75; ctx.beginPath();
      s.data.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))));
      ctx.stroke();
    }
  }

  // ---------------------------------------------------------------- detail panel
  function select(alg, idx) {
    S.sel = { alg, idx };
    renderDetail(); drawStage();
  }

  function rulePick(alg, rule) { return S.result.fronts[alg].picks[rule]; }

  function renderDetail() {
    if (!S.result || !S.sel) return;
    const R = S.result, { alg, idx } = S.sel, F = R.fronts[alg];
    const pt = F.points[idx], w = F.weights[idx], t = F.test;
    const ew = R.equal_weight;

    $$('[data-pick-alg]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.pickAlg === alg));
    const matchRule = Object.entries(F.picks).find(([, i]) => i === idx);
    $$('[data-rule]').forEach((b) => b.setAttribute('aria-pressed', !!matchRule && b.dataset.rule === matchRule[0]));
    const sl = $('#slide'); sl.max = F.points.length - 1; sl.value = idx;

    const trainSharpe = pt[1] / pt[0], testSharpe = t.sharpe[idx];
    const rows = [
      ['Annual return', pct(pt[1]), pct(t.ret[idx]), pct(ew.test.ret)],
      ['Volatility', pct(pt[0]), pct(t.vol[idx]), pct(ew.test.vol)],
      ['Sharpe ratio', num(trainSharpe), num(testSharpe), num(ew.test.sharpe)],
      ['Worst 5% day (CVaR)', pct(pt[2], 2), '-', '-'],
      ['Max drawdown', '-', pct(t.mdd[idx]), pct(ew.test.mdd)],
    ];
    $('#metrics-title').textContent = `${ALG_NAME[alg]} portfolio`;
    $('#metrics').innerHTML =
      `<thead><tr><th></th><th>Training<br>${R.n_train} days</th><th>Held out<br>${R.n_test} days</th><th>Equal weight<br>held out</th></tr></thead><tbody>` +
      rows.map((r, i) => `<tr><td>${r[0]}</td><td class="${i === 2 ? 'lead' : ''}">${r[1]}</td><td class="${i === 2 ? 'lead' : ''}">${r[2]}</td><td class="dim">${r[3]}</td></tr>`).join('') + '</tbody>';

    const held = w.map((v, i) => [R.assets[i], v]).filter(([, v]) => v > 1e-4).sort((a, b) => b[1] - a[1]);
    const top = held.slice(0, 12), maxv = top[0] ? top[0][1] : 1;
    $('#weights').innerHTML = top.map(([n, v]) =>
      `<li><span class="nm" title="${esc(n)}">${esc(n)}</span><span class="bar" style="width:${(v / maxv * 100).toFixed(1)}%"></span><span class="pct">${pct(v)}</span></li>`).join('') +
      (held.length > top.length ? `<li class="more-row"><span class="more">and ${held.length - top.length} smaller holdings</span></li>` : '') +
      `<li class="more-row"><span class="more">${held.length} holdings in total</span></li>`;
    $('#weights .bar') && $$('#weights .bar').forEach((b) => { b.style.background = colors[alg]; });

    drawWealth();
    const gap = t.sharpe[idx] - ew.test.sharpe;
    $('#wealth-note').textContent =
      `Held-out Sharpe is ${num(testSharpe)} against ${num(ew.test.sharpe)} for equal weight (${gap >= 0 ? '+' : ''}${num(gap)}). ` +
      `This is one price path, so differences of this size are mostly noise. Treat the training-to-held-out gap as the honest number.`;
    $('#wealth-title').textContent = `Growth of 1 on held-out data, ${R.split_date} to ${R.end_date}`;
  }

  function drawWealth() {
    if (!S.result || !S.sel) return;
    const R = S.result, { alg, idx } = S.sel;
    const n = R.dates.length;
    lineChart($('#wealth-canvas'), [
      { data: R.equal_weight.test.curves, color: colors.rand, width: 1.5 },
      { data: R.fronts[alg].test.curves[idx], color: colors[alg], width: 2 },
    ], { fmt: (v) => v.toFixed(2), baseline: 1, xLabels: [[0, R.dates[0], 'left'], [n - 1, R.dates[n - 1], 'right']] });
  }

  function drawConv() {
    if (!S.result) return;
    const P = S.result.fronts.PSO.history, G = S.result.fronts.GA.history;
    lineChart($('#conv-canvas'), [
      { data: G, color: colors.GA }, { data: P, color: colors.PSO },
    ], { fmt: (v) => v.toFixed(2), xLabels: [[0, '0', 'left'], [Math.max(P.length, G.length) - 1, `${S.result.iters}`, 'right']] });
  }

  function renderScore() {
    const R = S.result;
    $('#scorecard').innerHTML =
      '<thead><tr><th>Method</th><th>Hypervolume</th><th>Front size</th><th>Spacing</th><th>Best Sharpe</th><th>Seconds</th></tr></thead><tbody>' +
      R.scorecard.map((s) => `<tr><td>${ALG_NAME[s.name]}</td><td>${num(s.hypervolume, 3)}</td><td>${s.front_size}</td><td>${num(s.spacing, 3)}</td><td>${num(s.best_sharpe)}</td><td>${num(s.seconds, 1)}</td></tr>`).join('') + '</tbody>';
  }

  function redrawAll() { drawStage(); if (S.result) { drawWealth(); drawConv(); } }

  // ---------------------------------------------------------------- run lifecycle
  function setStatus(msg, isError) {
    const el = $('#status'); el.textContent = msg; el.classList.toggle('error', !!isError);
  }
  function setProgress() {
    for (const [a, id] of [['PSO', 'pso'], ['GA', 'ga']]) {
      const [it, total] = S.progress[a] || [0, 1];
      $('#m-' + id).textContent = `${it} of ${total}`;
      $('#mb-' + id).style.transform = `scaleX(${total ? it / total : 0})`;
    }
  }
  function setRunning(on) {
    S.running = on;
    $('#run').hidden = on; $('#stop').hidden = !on;
    $('#plot-empty').hidden = true;
  }

  function readConfig() {
    const v = (id) => $('#' + id).value;
    const cfg = {
      max_weight: +v('maxw') / 100, min_weight: +v('minw') / 100,
      cardinality: v('card') ? +v('card') : null,
      pop: +v('pop'), iters: +v('iters'), train_frac: +v('train') / 100, seed: +v('seed') || 0,
    };
    if (S.source === 'csv') cfg.csv_text = S.csvText; else { cfg.assets = +v('assets'); cfg.days = +v('days'); }
    return cfg;
  }

  function validate() {
    const cfg = readConfig(), el = $('#err-constraints');
    let msg = '';
    const need = Math.ceil(1 / cfg.max_weight - 1e-9);
    if (cfg.cardinality && cfg.cardinality < need) msg = `A ${pct(cfg.max_weight, 0)} cap needs at least ${need} holdings. Raise the cap or the holding limit.`;
    if (S.source === 'csv' && !S.csvText) msg = msg || 'Choose a price file first.';
    el.textContent = S.source === 'csv' && !S.csvText ? '' : msg; el.hidden = !el.textContent;
    const bad = !!msg;
    $('#run').disabled = bad;
    return bad ? null : cfg;
  }

  async function run() {
    const cfg = validate();
    if (!cfg) return;
    clearTimeout(S.timer);
    if (S.jobId) fetch(`/api/jobs/${S.jobId}/cancel`, { method: 'POST' }).catch(() => {});
    Object.assign(S, { result: null, sel: null, snap: {}, cloud: [], progress: {}, view: null });
    $('#detail-body').hidden = true; $('#detail-empty').hidden = false;
    setProgress(); setRunning(true); setStatus('Starting both searches.'); drawStage();
    try {
      const r = await fetch('/api/run', { method: 'POST', body: JSON.stringify(cfg) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'The server rejected the request.');
      S.jobId = d.id; poll(d.id);
    } catch (e) { fail(e.message); }
  }

  function fail(msg) { setRunning(false); setStatus(msg, true); }

  async function poll(id) {
    if (S.jobId !== id) return;
    try {
      const r = await fetch('/api/jobs/' + id);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Lost contact with the server.');
      Object.assign(S, { snap: d.snap, cloud: d.cloud, progress: d.progress });
      setProgress(); drawStage();
      if (d.status === 'error') return fail(d.error);
      if (d.status === 'cancelled') { setRunning(false); return setStatus('Stopped.'); }
      if (d.status === 'analyzing') setStatus('Both searches finished. Scoring portfolios on held-out data.');
      else setStatus(`Searching. Each method has evaluated ${Math.max(...Object.values(d.progress).map((p) => p[0])) * (+$('#pop').value)} portfolios so far.`);
      if (d.status === 'done') { S.result = d.result; return done(); }
    } catch (e) { return fail(e.message); }
    S.timer = setTimeout(() => poll(id), 110);
  }

  function done() {
    setRunning(false);
    const R = S.result;
    setStatus(`Finished. Each method evaluated ${(R.pop * (R.iters + 1)).toLocaleString()} portfolios. The black diamond marks equal weight.`);
    $('#detail-empty').hidden = true;
    const body = $('#detail-body'); body.hidden = false;
    body.classList.remove('reveal'); void body.offsetWidth; body.classList.add('reveal');
    renderScore();
    select('PSO', R.fronts.PSO.picks.sharpe);
    drawConv(); drawStage();
  }

  // ---------------------------------------------------------------- wiring
  function wire() {
    $('#form').addEventListener('submit', (e) => { e.preventDefault(); run(); });
    $('#stop').addEventListener('click', () => {
      if (S.jobId) fetch(`/api/jobs/${S.jobId}/cancel`, { method: 'POST' }).catch(() => {});
    });
    $$('[data-x]').forEach((b) => b.addEventListener('click', () => {
      S.xKey = b.dataset.x; S.view = null;
      $$('[data-x]').forEach((o) => o.setAttribute('aria-pressed', o === b)); drawStage();
    }));
    $$('.key[data-alg]').forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.alg; S.show[a] = !S.show[a]; b.setAttribute('aria-pressed', S.show[a]); drawStage();
    }));
    $$('[data-src]').forEach((b) => b.addEventListener('click', () => {
      S.source = b.dataset.src;
      $$('[data-src]').forEach((o) => o.setAttribute('aria-pressed', o === b));
      $('#src-synth').hidden = S.source !== 'synthetic'; $('#src-csv').hidden = S.source !== 'csv'; validate();
    }));
    $('#csv').addEventListener('change', async (e) => {
      const f = e.target.files[0]; S.csvText = f ? await f.text() : null; validate();
    });
    for (const [id, out, suffix] of [['maxw', 'o-maxw', '%'], ['minw', 'o-minw', '%'], ['train', 'o-train', '%']]) {
      $('#' + id).addEventListener('input', () => { $('#' + out).textContent = $('#' + id).value + suffix; validate(); });
    }
    $('#card').addEventListener('input', validate);
    $$('[data-pick-alg]').forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.pickAlg, F = S.result.fronts[a];
      const cur = Object.entries(S.result.fronts[S.sel.alg].picks).find(([, i]) => i === S.sel.idx);
      select(a, F.picks[cur ? cur[0] : 'sharpe']);
    }));
    $$('[data-rule]').forEach((b) => b.addEventListener('click', () => select(S.sel.alg, rulePick(S.sel.alg, b.dataset.rule))));
    $('#slide').addEventListener('input', (e) => select(S.sel.alg, +e.target.value));
    new ResizeObserver(() => { if (S.view) { redrawAll(); } else drawStage(); }).observe($('#plot'));
    new ResizeObserver(() => { if (S.result) { drawWealth(); drawConv(); } }).observe($('#detail'));
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (!document.documentElement.dataset.theme) { readColors(); redrawAll(); } });
  }

  initTheme(); wire(); validate(); run();
})();
