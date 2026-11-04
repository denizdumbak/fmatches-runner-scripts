// step 307 · mobil dokunma alanı 44 px: (1) Social icon kökü 44 (görünen daire 32, içte "Disc"), Social links aralığı 8 -> 0 · (2) Icon button 40'lık varyantlar 44 · (3) Filter chip yüksekliği 40 -> 44 · (4) Switch: tüm satır tıklanır notu · yerleşim ve taşma kontrolü
const report = { done: [], errors: [], fixes: [], moved: [] };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const p01 = figma.root.children.find(p => /^01/.test(p.name));
const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
await figma.setCurrentPageAsync(p01);
const vars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = vars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
function resolve(v, d) { const val = v.valuesByMode[Object.keys(v.valuesByMode)[0]]; if (val && val.type === 'VARIABLE_ALIAS' && (d || 0) < 6) { const t = vars.find(x => x.id === val.id); return t ? resolve(t, (d || 0) + 1) : null; } return val; }
const BB = n => n.absoluteBoundingBox;
const getSet = nm => { const s = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === nm); if (!s) throw new Error('set yok: ' + nm); return s; };
const blockOf = s => { let x = s; while (x.parent && x.parent.type !== 'SECTION') x = x.parent; return x; };
const before = new Map();
function remember(s) { const b = blockOf(s); if (!before.has(b.id)) before.set(b.id, { node: b, box: Object.assign({}, BB(b)) }); }
const inInstance = n => { let x = n.parent; while (x && x.type !== 'PAGE') { if (x.type === 'INSTANCE') return true; x = x.parent; } return false; };
function fitSet(s) {
  if (s.layoutMode && s.layoutMode !== 'NONE') { s.primaryAxisSizingMode = 'AUTO'; s.counterAxisSizingMode = 'AUTO'; return; }
  let r = 0, b = 0; for (const c of s.children) { r = Math.max(r, c.x + c.width); b = Math.max(b, c.y + c.height); }
  s.resizeWithoutConstraints(R(r + 24), R(b + 24));
}

// (1) Social icon
await step('1 Social icon 44', async () => {
  const s = getSet('Social icon'); remember(s);
  let done = 0;
  for (const c of s.children) {
    if (c.findOne(n => n.name === 'Disc')) { done++; continue; }
    const disc = figma.createFrame();
    disc.name = 'Disc';
    disc.fills = JSON.parse(JSON.stringify(c.fills));
    disc.layoutMode = 'HORIZONTAL'; disc.primaryAxisAlignItems = 'CENTER'; disc.counterAxisAlignItems = 'CENTER';
    disc.primaryAxisSizingMode = 'FIXED'; disc.counterAxisSizingMode = 'FIXED';
    disc.resize(32, 32); disc.cornerRadius = 999;
    for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) disc.setBoundVariable(k, V('radius/full'));
    disc.clipsContent = false;
    const glyph = c.findOne(n => n.name === 'Glyph');
    c.insertChild(0, disc);
    if (glyph) disc.appendChild(glyph);
    c.fills = [];
    c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
    c.resize(44, 44);
    done++;
  }
  fitSet(s);
  report.fixes.push(`1 Social icon: ${done} varyant 44x44, görünen daire 32 (Disc)`);
  // Social links aralığı 0
  let rows = 0; const widths = new Set();
  for (const page of [p01, p02]) for (const row of page.findAll(n => n.type === 'FRAME' && n.name === 'Social links')) {
    if (inInstance(row)) continue;
    if (row.boundVariables && row.boundVariables.itemSpacing) row.setBoundVariable('itemSpacing', null);
    row.itemSpacing = 0; rows++; widths.add(R(row.width) + 'x' + R(row.height));
  }
  report.fixes.push(`1 Social links düzenlenen satır ${rows} (instance dışı) · boyutlar ${[...widths].join(', ')}`);
});

// (2) Icon button 40 -> 44
await step('2 Icon button 44', async () => {
  const s = getSet('Icon button'); remember(s);
  const out = [];
  for (const c of s.children) {
    if (R(c.width) !== 40) continue;
    const badge = c.findOne(n => n.name === 'Badge');
    let br = null, bt = null; if (badge) { br = c.width - (badge.x + badge.width); bt = badge.y; }
    c.resize(44, 44);
    if (badge && badge.layoutPositioning === 'ABSOLUTE') { badge.x = c.width - badge.width - br; badge.y = bt; }
    out.push(c.name.replace(', State=', '/'));
  }
  fitSet(s);
  report.fixes.push(`2 Icon button 40 -> 44: ${out.length} varyant`);
});

// (3) Filter chip 44
await step('3 Filter chip 44', async () => {
  const s = getSet('Filter chip'); remember(s);
  for (const c of s.children) { c.resize(c.width, 44); c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED'; }
  fitSet(s);
  report.fixes.push('3 Filter chip: ' + s.children.map(c => `${c.name} ${R(c.width)}x${R(c.height)}`).join(' · '));
});

// (4) Switch notu
await step('4 Switch notu', async () => {
  const s = getSet('Switch'); const sec = blockOf(s).parent;
  const old = sec.findOne(n => n.name === 'Note · Switch tap area'); if (old) old.remove();
  const styles = await figma.getLocalTextStylesAsync(); const st = styles.find(x => x.name === 'Label/Small');
  await figma.loadFontAsync(st.fontName);
  const t = figma.createText(); t.name = 'Note · Switch tap area';
  await t.setTextStyleIdAsync(st.id);
  t.characters = 'For the developer · Tap area. The whole setting row toggles the switch, so the touch target is the full row (at least 44 px high), not only the 44 x 24 track.';
  const wv = V('color/text/warning'); const wc = resolve(wv);
  t.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: wc.r, g: wc.g, b: wc.b } }, 'color', wv)];
  sec.appendChild(t); t.textAutoResize = 'HEIGHT'; t.resize(520, t.height);
  const b = blockOf(s); t.x = b.x; t.y = b.y + b.height + 16;
  // altındakileri it
  const dy = t.height + 16;
  for (const k of sec.children) { if (k === t || k === b) continue; if (k.y >= b.y + b.height - 1 && k.x < b.x + Math.max(b.width, 520) && k.x + k.width > b.x) { k.y += dy; report.moved.push(`${sec.name} › ${k.name} +${R(dy)}`); } }
  report.fixes.push(`4 not ${sec.name} @${R(t.x)},${R(t.y)}`);
});

// yerleşim: büyüyen bloklar
await step('5 yerleşim 01', async () => {
  for (const { node: b, box: o } of before.values()) {
    const nb = BB(b); const dy = (nb.y + nb.height) - (o.y + o.height); const dx = (nb.x + nb.width) - (o.x + o.width);
    const sec = b.parent;
    if (dy > 0) for (const k of sec.children) {
      if (k === b) continue; const kb = BB(k); if (!kb) continue;
      const xHit = kb.x < o.x + o.width + Math.max(dx, 0) && kb.x + kb.width > o.x;
      if (xHit && kb.y >= o.y + o.height - 1) { k.y += dy; report.moved.push(`${sec.name} › ${k.name} +${R(dy)}`); }
    }
  }
  const secs = p01.children.filter(n => n.type === 'SECTION');
  for (const sec of secs) { let r = 0, bt = 0; for (const k of sec.children) { r = Math.max(r, k.x + k.width); bt = Math.max(bt, k.y + k.height); } if (r + 80 > sec.width || bt + 80 > sec.height) sec.resizeWithoutConstraints(Math.max(sec.width, R(r + 80)), Math.max(sec.height, R(bt + 80))); }
  secs.sort((a, b) => a.x - b.x);
  for (let i = 1; i < secs.length; i++) { const want = secs[i - 1].x + secs[i - 1].width + 160; if (secs[i].x < want) secs[i].x = want; }
  const inter = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
  const out = [];
  for (const sec of new Set([...before.values()].map(x => x.node.parent))) { const k = sec.children; for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) { const a = BB(k[i]), c = BB(k[j]); if (a && c && inter(a, c)) out.push(`${sec.name}: ${k[i].name} x ${k[j].name}`); } }
  report.overlaps01 = out.length ? out.slice(0, 12) : 'none';
});

// 02 kontrolü: büyüyen satırlar ebeveyninden taşıyor mu
await step('6 kontrol 02', async () => {
  const over = new Map();
  const rightOver = (n, p) => R(BB(n).x + BB(n).width - (BB(p).x + BB(p).width));
  for (const plat of p02.children.filter(n => n.type === 'SECTION')) for (const sec of plat.children.filter(n => n.type === 'SECTION')) for (const scr of sec.children.filter(n => n.type === 'FRAME' && !/^Flow ·/.test(n.name))) {
    for (const n of scr.findAll(n => n.name === 'Header actions' || n.name === 'Social links' || n.name === 'Tabs' || n.name === 'Thread header' || n.name === 'Composer' || n.name === 'Filters')) {
      if (n.visible === false || !BB(n)) continue;
      const o1 = rightOver(n, n.parent), o2 = rightOver(n, scr);
      if (o1 > 0 || o2 > 0) { const k = `${plat.name} › ${n.name} in ${n.parent.name} (+${Math.max(o1, o2)})`; const g = over.get(k) || { n: 0, ex: scr.name }; g.n++; over.set(k, g); }
    }
  }
  report.overflow02 = over.size ? [...over.entries()].map(([k, g]) => `${g.n}x ${k} · ${g.ex}`).slice(0, 15) : 'none';
  // örnek ölçüler
  const m = p02.findOne(n => n.type === 'FRAME' && n.name === 'Messenger / Thread · Mobile') || p02.findOne(n => n.type === 'FRAME' && /Messenger .*· Mobile/.test(n.name));
  const ha = p02.findOne(n => n.name === 'Header actions' && R(n.width) > 150);
  const sl = p02.findOne(n => n.name === 'Social links');
  report.samples = `Header actions ${ha ? R(ha.width) + 'x' + R(ha.height) : '-'} · Social links ${sl ? R(sl.width) + 'x' + R(sl.height) : '-'}`;
});
return report;
