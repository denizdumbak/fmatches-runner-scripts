// step 378 · Shortlists: "Filters applied" ekranları (masaüstü + mobil; düğme "Filters · N", seçili çipler + Clear all, liste süzülmüş) + prototip + eski "Position list open" ekranları 03 · Archive'a + Section yeniden dizilir
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const p03 = figma.root.children.find(p => /^03/.test(p.name)); await p03.loadAsync();
await figma.setCurrentPageAsync(p02);
const R = n => Math.round(n);
const BB = n => n.absoluteBoundingBox;
const allVars = await figma.variables.getLocalVariablesAsync();
const tryV = (...names) => { for (const n of names) { const v = allVars.find(x => x.name === n || x.name.endsWith('/' + n)); if (v) return v; } return null; };
const nav = dest => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
const DEV = { Web: 'Desktop', Mobile: 'Mobile' };
const secOf = plat => p02.children.find(n => n.type === 'SECTION' && n.name === plat).children.find(n => n.type === 'SECTION' && n.name === 'Shortlists');
const defName = d => 'Shortlists / Shortlists · ' + d, openName = d => 'Shortlists / Filters open · ' + d, appName = d => 'Shortlists / Filters applied · ' + d, oldName = d => 'Shortlists / Position list open · ' + d, noName = d => 'Shortlists / No players · ' + d;
const frameOf = (sec, nm) => sec.children.find(c => c.type === 'FRAME' && c.name === nm);
const btnSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Button');
const subtle = () => { const v = btnSet.children.find(c => c.name.indexOf('Style=Subtle') >= 0 && c.name.indexOf('State=Default') >= 0); if (!v) throw new Error('Subtle Button yok'); return v; };
const chipSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Filter chip');
async function setLabel(btn, str) {
  const key = Object.keys(btn.componentProperties).find(k => /^Label/.test(k)); if (key) btn.setProperties({ [key]: str });
  const t = btn.findOne(n => n.type === 'TEXT'); if (t) { await figma.loadFontAsync(t.fontName); if (t.characters !== str) t.characters = str; }
}
const rowsOf = f => f.findAll(n => n.type === 'INSTANCE' && /^Player ·/.test(n.name));
function parse(row) {
  const out = {};
  for (const fct of row.findAll(n => n.name === 'Fact')) { const l = fct.findOne(n => n.type === 'TEXT' && n.name === 'Label'), v = fct.findOne(n => n.type === 'TEXT' && n.name === 'Value'); if (l && v) out[l.characters] = v.characters; }
  const age = parseInt(out['Age'], 10); const m = /(\d{4})/.exec(out['Contract until'] || ''); return { name: row.name.replace('Player · ', ''), age: isNaN(age) ? null : age, year: m ? parseInt(m[1], 10) : null, raw: out };
}

// 1) Filters applied ekranları
await step('Filters applied ekranlari', async () => {
  const res = [];
  // kriter secimi masaustu satirlarindan
  const base0 = frameOf(secOf('Web'), defName('Desktop')); const data = rowsOf(base0).map(parse);
  report.info.rowData = data.map(d => d.name + ' | yas ' + d.age + ' | sozlesme ' + d.year);
  const cands = [
    { chips: ['Contract until 2027', 'Age up to 25'], test: d => d.year != null && d.year <= 2027 && d.age != null && d.age <= 25 },
    { chips: ['Contract until 2027'], test: d => d.year != null && d.year <= 2027 },
    { chips: ['Age up to 25'], test: d => d.age != null && d.age <= 25 },
    { chips: ['Contract until 2026'], test: d => d.year != null && d.year <= 2026 }
  ];
  const crit = cands.find(c => { const k = data.filter(c.test).length; return k >= 1 && k <= data.length - 1; });
  if (!crit) throw new Error('uygun kriter yok: ' + JSON.stringify(report.info.rowData));
  report.info.criteria = crit.chips.join(' + ') + ' -> ' + data.filter(crit.test).map(d => d.name).join(', ');
  const selVar = chipSet.children.find(v => /State=Selected/.test(v.name)); if (!selVar) throw new Error('Filter chip Selected yok');
  const gv = tryV('spacing/sm', 'spacing/md');
  for (const plat of ['Web', 'Mobile']) {
    const d = DEV[plat]; const sec = secOf(plat); const base = frameOf(sec, defName(d)); if (!base) throw new Error('ekran yok: ' + plat);
    for (const o of p02.findAll(n => n.type === 'FRAME' && n.name === appName(d))) o.remove();
    const siblings = sec.children.filter(c => c.type === 'FRAME' && c.name !== appName(d)); const xs = siblings.map(f => f.x).sort((a, b) => a - b); const stepX = xs[1] - xs[0];
    const clone = base.clone(); clone.name = appName(d); sec.appendChild(clone); clone.x = xs[0] + stepX * siblings.length; clone.y = base.y;
    const col = clone.findOne(n => n.name === 'Column'); const bar = clone.findOne(n => n.name === 'Filter bar'); const fb = bar.findOne(n => n.name === 'Button · Filters');
    await setLabel(fb, 'Filters · ' + crit.chips.length);
    // secili cipler + Clear all
    const wrap = figma.createFrame(); wrap.name = 'Applied filters'; wrap.fills = []; wrap.layoutMode = 'HORIZONTAL'; wrap.layoutWrap = 'WRAP'; wrap.primaryAxisSizingMode = 'FIXED'; wrap.counterAxisSizingMode = 'AUTO'; wrap.counterAxisAlignItems = 'CENTER';
    if (gv) { wrap.setBoundVariable('itemSpacing', gv); wrap.setBoundVariable('counterAxisSpacing', gv); } else { wrap.itemSpacing = 12; wrap.counterAxisSpacing = 12; }
    col.insertChild(col.children.indexOf(bar) + 1, wrap); wrap.layoutSizingHorizontal = 'FILL';
    for (const label of crit.chips) {
      const chip = selVar.createInstance(); chip.name = 'Filter chip · ' + label; wrap.appendChild(chip);
      const t = chip.findOne(n => n.type === 'TEXT'); await figma.loadFontAsync(t.fontName); t.characters = label + '  ×'; chip.layoutSizingHorizontal = 'HUG';
    }
    const clear = subtle().createInstance(); clear.name = 'Button · Clear all'; wrap.appendChild(clear); await setLabel(clear, 'Clear all'); clear.layoutSizingHorizontal = 'HUG';
    // liste suzme
    const list = clone.findOne(n => n.name === 'List card'); const rows = rowsOf(list); const parents = new Set(rows.map(r => r.parent)); let removed = 0;
    for (const r of rows) { if (crit.test(parse(r))) continue; const par = r.parent; const i = par.children.indexOf(r); const next = par.children[i + 1], prev = par.children[i - 1]; if (next && /Divider/.test(next.name)) next.remove(); else if (prev && /Divider/.test(prev.name)) prev.remove(); r.remove(); removed++; }
    for (const par of parents) { const last = par.children[par.children.length - 1]; if (last && /Divider/.test(last.name)) last.remove(); }
    const kept = rowsOf(list).map(r => r.name.replace('Player · ', ''));
    const need = clone.x + clone.width + 80; if (need > sec.width) sec.resizeWithoutConstraints(R(need), R(sec.height));
    res.push(plat + ': ' + clone.name + ' ' + R(clone.width) + 'x' + R(clone.height) + ' | silinen ' + removed + ' | kalan ' + kept.join(', ') + ' | dugme "' + (fb.findOne(n => n.type === 'TEXT') || {}).characters + '" | ciplerin ust satiri ' + wrap.children.map(c => c.name).join(' > ') + ' | wrap ' + R(wrap.width) + 'x' + R(wrap.height));
  }
  report.info.applied = res;
});

// 2) prototip
await step('prototip', async () => {
  const links = [];
  const add = async (node, dest) => { await node.setReactionsAsync((node.reactions || []).filter(r => !(r.actions || []).some(isNavAct)).concat([nav(dest)])); };
  for (const plat of ['Web', 'Mobile']) {
    const d = DEV[plat]; const sec = secOf(plat); const def = frameOf(sec, defName(d)), open = frameOf(sec, openName(d)), app = frameOf(sec, appName(d));
    if (!def || !open || !app) throw new Error('ekran eksik: ' + plat);
    await add(open.findOne(n => n.name === 'Button · Show players'), app); links.push(plat + ': Show players -> Filters applied');
    await add(app.findOne(n => n.name === 'Button · Clear all'), def); links.push(plat + ': Clear all -> Shortlists');
    await add(app.findOne(n => n.name === 'Button · Filters'), open); links.push(plat + ': Filters (uygulanmis) -> Filters open');
  }
  const ids = new Set(); for (const plat of ['Web', 'Mobile']) { const f = frameOf(secOf(plat), appName(DEV[plat])); if (f) ids.add(f.id); }
  const before = p02.flowStartingPoints.length; p02.flowStartingPoints = p02.flowStartingPoints.filter(fp => !ids.has(fp.nodeId));
  report.info.prototype = { links, flowStarts: before + ' -> ' + p02.flowStartingPoints.length };
});

// 3) eski Position list open ekranlari -> Archive
await step('Position list open -> Archive', async () => {
  let right = 0; for (const k of p03.children) right = Math.max(right, k.x + k.width);
  let x = right + 400; const moved = [];
  for (const plat of ['Web', 'Mobile']) {
    const f = frameOf(secOf(plat), oldName(DEV[plat])); if (!f) { moved.push(plat + ': zaten yok'); continue; }
    const id = f.id; f.x = x; f.y = 0; p03.appendChild(f); x += f.width + 200; moved.push(plat + ': ' + f.name + ' -> Archive');
    p02.flowStartingPoints = p02.flowStartingPoints.filter(fp => fp.nodeId !== id);
  }
  report.info.archived = moved;
});

// 4) Section'lari yeniden diz (Shortlists, No players, Filters open, Filters applied)
await step('Shortlists Section yeniden dizilis', async () => {
  const out = [];
  for (const plat of ['Web', 'Mobile']) {
    const d = DEV[plat]; const sec = secOf(plat); const order = [defName(d), noName(d), openName(d), appName(d)].map(nm => frameOf(sec, nm));
    if (order.some(f => !f)) throw new Error('ekran eksik: ' + plat);
    const y0 = order[0].y; const x0 = order[0].x; const stepX = plat === 'Web' ? 1920 : 470;
    order.forEach((f, i) => { f.x = x0 + i * stepX; f.y = y0; });
    let r = 0, b = 0; for (const f of order) { r = Math.max(r, f.x + f.width); b = Math.max(b, f.y + f.height); }
    sec.resizeWithoutConstraints(R(r + 80), R(b + 80));
    out.push(plat + ': ' + order.map(f => f.name.replace('Shortlists / ', '') + ' @' + R(f.x) + ' ' + R(f.height)).join(' ; ') + ' | section ' + R(sec.width) + 'x' + R(sec.height));
  }
  report.info.layout = out;
});

// 5) kontrol
await step('kontrol', async () => {
  const out = {};
  for (const plat of ['Web', 'Mobile']) {
    const sec = secOf(plat); const frames = sec.children.filter(c => c.type === 'FRAME'); const unstyled = [], gray = [];
    for (const f of frames) {
      for (const t of f.findAll(n => n.type === 'TEXT' && n.visible !== false)) if (!t.textStyleId) unstyled.push(f.name.replace('Shortlists / ', '') + ': "' + String(t.characters).slice(0, 18) + '"');
      for (const n of f.findAll(x => 'fills' in x && Array.isArray(x.fills))) for (const p of n.fills) if (p.type === 'SOLID' && p.visible !== false && Math.abs(p.color.r - .5) < .003 && Math.abs(p.color.g - .5) < .003 && Math.abs(p.color.b - .5) < .003 && !(p.boundVariables && p.boundVariables.color)) gray.push(f.name + ': ' + n.name);
    }
    let ov = 0; for (let i = 0; i < frames.length; i++) for (let j = i + 1; j < frames.length; j++) { const A = frames[i], B = frames[j]; if (A.x < B.x + B.width && B.x < A.x + A.width && A.y < B.y + B.height && B.y < A.y + A.height) ov++; }
    const plt = p02.children.find(n => n.type === 'SECTION' && n.name === plat); let so = 0;
    for (const s of plt.children.filter(n => n.type === 'SECTION' && n !== sec)) if (sec.x < s.x + s.width && s.x < sec.x + sec.width && sec.y < s.y + s.height && s.y < sec.y + sec.height) so++;
    out[plat] = { frames: frames.map(f => f.name.replace('Shortlists / ', '') + ' ' + R(f.width) + 'x' + R(f.height)), unstyledText: unstyled.length ? unstyled : 0, grayFills: gray.length ? gray : 0, frameOverlaps: ov, sectionOverlaps: so };
  }
  // kopuk prototip baglantisi
  let links = 0, broken = 0; const bad = [];
  for (const n of p02.findAll(x => x.reactions && x.reactions.length)) for (const r of n.reactions) for (const a of (r.actions || [])) if (a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO' && a.destinationId) { links++; const t = await figma.getNodeByIdAsync(a.destinationId); if (!t) { broken++; if (bad.length < 5) bad.push(n.name); } }
  out.prototype = { navLinks: links, broken, examples: bad.length ? bad : 'none', flowStarts: p02.flowStartingPoints.length };
  report.info.check = out;
});
return report;
