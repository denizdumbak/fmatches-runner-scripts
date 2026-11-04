// step 305 · Focus: border/focus -> green/750 (#0a783a), yeni border/focus-inverse (green/400) · 6 set'e State=Focus varyantı (2 px halka, öğeden 2 px dışarıda, ayrı "Focus ring" katmanı) · Icon button'a State özelliği · Buttons & tags'e geliştirici notu
const report = { done: [], errors: [], fixes: [], sets: [], moved: [] };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const hex = c => '#' + [c.r, c.g, c.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
const p01 = figma.root.children.find(p => /^01/.test(p.name));
await p01.loadAsync();
await figma.setCurrentPageAsync(p01);
let vars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = vars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const byId = id => vars.find(v => v.id === id);
function resolve(v, d) { const val = v.valuesByMode[Object.keys(v.valuesByMode)[0]]; if (val && val.type === 'VARIABLE_ALIAS' && (d || 0) < 6) { const t = byId(val.id); return t ? resolve(t, (d || 0) + 1) : null; } return val; }
const lin = v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
const lum = c => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
const ratio = (a, b) => { const x = lum(a), y = lum(b); return Math.round((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) * 100) / 100; };
const BB = n => n.absoluteBoundingBox;

// ---------- 1. tokenlar ----------
await step('1 focus tokenları', async () => {
  const focus = V('color/border/focus');
  const g750 = vars.find(v => v.name === 'green/750'); if (!g750) throw new Error('green/750 yok (303 çalışmış olmalı)');
  const g400 = vars.find(v => v.name === 'green/400'); if (!g400) throw new Error('green/400 yok');
  const before = hex(resolve(focus));
  for (const m of Object.keys(focus.valuesByMode)) focus.setValueForMode(m, figma.variables.createVariableAlias(g750));
  let inv = vars.find(v => v.name === 'color/border/focus-inverse');
  if (!inv) {
    const col = await figma.variables.getVariableCollectionByIdAsync(focus.variableCollectionId);
    inv = figma.variables.createVariable('color/border/focus-inverse', col, 'COLOR');
    for (const m of col.modes) inv.setValueForMode(m.modeId, figma.variables.createVariableAlias(g400));
  }
  inv.description = 'Focus ring on dark surfaces (bg/inverse): ticker, footer, dark hero.';
  focus.description = 'Focus ring on light surfaces. 2 px, 2 px outside the element.';
  vars = await figma.variables.getLocalVariablesAsync();
  const f = resolve(V('color/border/focus')), fi = resolve(V('color/border/focus-inverse'));
  report.fixes.push(`1 border/focus ${before} -> ${hex(f)} · beyazda ${ratio(f, resolve(V('color/bg/surface')))}:1, canvas ${ratio(f, resolve(V('color/bg/canvas')))}:1 · focus-inverse ${hex(fi)} bg/inverse üstünde ${ratio(fi, resolve(V('color/bg/inverse')))}:1`);
});

// ---------- yardımcılar ----------
const focusPaint = () => { const v = V('color/border/focus'); const c = resolve(v); return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: c.r, g: c.g, b: c.b } }, 'color', v); };
const radVar = r => r >= 100 ? 'radius/full' : r === 8 ? 'radius/sm' : r === 12 ? 'radius/md' : null;
function addRing(comp, target, rad) {
  const old = comp.findOne(n => n.name === 'Focus ring'); if (old) old.remove();
  const cb = BB(comp), tb = BB(target);
  const tx = target === comp ? 0 : tb.x - cb.x, ty = target === comp ? 0 : tb.y - cb.y;
  const r = figma.createRectangle();
  r.name = 'Focus ring'; r.fills = []; r.strokes = [focusPaint()]; r.strokeWeight = 2; r.strokeAlign = 'INSIDE';
  comp.appendChild(r);
  if (comp.layoutMode && comp.layoutMode !== 'NONE') r.layoutPositioning = 'ABSOLUTE';
  r.resize(tb.width + 8, tb.height + 8); r.x = tx - 4; r.y = ty - 4;
  r.constraints = target === comp ? { horizontal: 'STRETCH', vertical: 'STRETCH' } : { horizontal: 'MIN', vertical: 'MIN' };
  r.cornerRadius = rad;
  const rv = radVar(rad); if (rv) for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) r.setBoundVariable(k, V(rv));
  comp.clipsContent = false;
  return r;
}
const getSet = nm => { const s = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === nm); if (!s) throw new Error('set yok: ' + nm); return s; };
const blockOf = s => { let x = s; while (x.parent && x.parent.type !== 'SECTION') x = x.parent; return x; };
const before = new Map();
function remember(s) { const b = blockOf(s); if (!before.has(b.id)) before.set(b.id, { node: b, box: Object.assign({}, BB(b)) }); }
function makeFocus(s, srcRe, nameFrom, targetOf, radOf) {
  remember(s);
  for (const c of s.children.filter(c => /State=Focus/.test(c.name))) c.remove();
  const srcs = s.children.filter(c => srcRe.test(c.name));
  const made = [];
  for (const src of srcs) {
    const cl = src.clone();
    s.appendChild(cl);
    cl.name = nameFrom(src.name);
    cl.reactions = [];
    if (s.layoutMode === 'NONE') {
      const row = s.children.filter(c => c !== cl && c.y < src.y + src.height && c.y + c.height > src.y);
      const right = Math.max.apply(null, row.map(c => c.x + c.width));
      cl.x = right + 40; cl.y = src.y;
    }
    addRing(cl, targetOf(cl), radOf(cl));
    made.push(cl.name);
  }
  if (s.layoutMode === 'NONE') {
    let r = 0, b = 0; for (const c of s.children) { r = Math.max(r, c.x + c.width); b = Math.max(b, c.y + c.height); }
    s.resizeWithoutConstraints(R(r + 24), R(b + 24));
  } else { s.primaryAxisSizingMode = 'AUTO'; s.counterAxisSizingMode = 'AUTO'; }
  report.sets.push(`${s.name}: +${made.length} Focus · toplam ${s.children.length} varyant · ${R(s.width)}x${R(s.height)}`);
}
const pill = () => 999;

// ---------- 2. setler ----------
await step('2a Button', async () => {
  makeFocus(getSet('Button'), /State=Default/, n => n.replace('State=Default', 'State=Focus'), c => c, pill);
});
await step('2b Icon button (State özelliği + Focus)', async () => {
  const s = getSet('Icon button');
  for (const c of s.children) if (!/State=/.test(c.name)) c.name = c.name + ', State=Default';
  makeFocus(s, /State=Default/, n => n.replace('State=Default', 'State=Focus'), c => c, pill);
  const g = s.variantGroupProperties || {};
  report.fixes.push('2b Icon button özellikleri: ' + Object.keys(g).map(k => `${k}=${g[k].values.length}`).join(', '));
});
await step('2c Filter chip', async () => {
  makeFocus(getSet('Filter chip'), /^State=Default$/, () => 'State=Focus', c => c, pill);
});
await step('2d Checkbox', async () => {
  makeFocus(getSet('Checkbox'), /State=Default/, n => n.replace('State=Default', 'State=Focus'), c => c.findOne(n => n.name === 'Box'), () => 8);
});
await step('2e Switch', async () => {
  makeFocus(getSet('Switch'), /State=Default/, n => n.replace('State=Default', 'State=Focus'), c => c.findOne(n => n.name === 'Track'), pill);
});
await step('2f Link row', async () => {
  makeFocus(getSet('Link row'), /State=Default/, n => n.replace('State=Default', 'State=Focus'), c => c, () => 8);
});

// ---------- 3. geliştirici notu ----------
await step('3 not', async () => {
  const s = getSet('Button'); const sec = blockOf(s).parent;
  const old = sec.findOne(n => n.name === 'Note · Focus ring'); if (old) old.remove();
  const styles = await figma.getLocalTextStylesAsync();
  const st = styles.find(x => x.name === 'Label/Small'); if (!st) throw new Error('Label/Small yok');
  await figma.loadFontAsync(st.fontName);
  const t = figma.createText();
  t.name = 'Note · Focus ring';
  await t.setTextStyleIdAsync(st.id);
  t.characters = `For the developer · Focus ring. Every clickable element shows a 2 px ring in color/border/focus, 2 px outside the element, when reached with the keyboard (:focus-visible). On dark surfaces use color/border/focus-inverse. Drawn here on Button, Icon button, Filter chip, Checkbox, Switch and Link row; apply the same ring to all other interactive elements (rows, cards, menu items, map markers).`;
  const wv = V('color/text/warning'); const wc = resolve(wv);
  t.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: wc.r, g: wc.g, b: wc.b } }, 'color', wv)];
  sec.appendChild(t);
  t.textAutoResize = 'HEIGHT'; t.resize(520, t.height);
  let bottom = 0; for (const k of sec.children) if (k !== t) bottom = Math.max(bottom, k.y + k.height);
  t.x = 80; t.y = bottom + 80;
  sec.resizeWithoutConstraints(Math.max(sec.width, t.x + t.width + 80), t.y + t.height + 80);
  report.fixes.push(`3 not ${sec.name} içinde @${R(t.x)},${R(t.y)} ${R(t.width)}x${R(t.height)}`);
});

// ---------- 4. büyüyen bloklar: altındakileri it, Section'ı uzat ----------
await step('4 yerleşim', async () => {
  for (const { node: b, box: o } of before.values()) {
    const nb = BB(b); const dy = (nb.y + nb.height) - (o.y + o.height); const dx = (nb.x + nb.width) - (o.x + o.width);
    const sec = b.parent;
    if (dy > 0) for (const k of sec.children) {
      if (k === b) continue; const kb = BB(k); if (!kb) continue;
      const xHit = kb.x < o.x + o.width + Math.max(dx, 0) && kb.x + kb.width > o.x;
      if (xHit && kb.y >= o.y + o.height - 1) { k.y += dy; report.moved.push(`${sec.name} › ${k.name} +${R(dy)}`); }
    }
    let r = 0, bt = 0; for (const k of sec.children) { r = Math.max(r, k.x + k.width); bt = Math.max(bt, k.y + k.height); }
    if (r + 80 > sec.width || bt + 80 > sec.height) sec.resizeWithoutConstraints(Math.max(sec.width, R(r + 80)), Math.max(sec.height, R(bt + 80)));
  }
  // Section'lar yan yana: x sırası, 160 aralık
  const secs = p01.children.filter(n => n.type === 'SECTION').sort((a, b) => a.x - b.x);
  for (let i = 1; i < secs.length; i++) { const want = secs[i - 1].x + secs[i - 1].width + 160; if (secs[i].x < want) secs[i].x = want; }
  // kontrol: Section içi doğrudan çocuk çakışması (dokunulan Section'lar)
  const inter = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
  const out = [];
  const touched = new Set([...before.values()].map(x => x.node.parent));
  for (const sec of touched) { const k = sec.children; for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) { const a = BB(k[i]), b = BB(k[j]); if (a && b && inter(a, b)) out.push(`${sec.name}: ${k[i].name} x ${k[j].name}`); } }
  report.overlapsAfter = out.length ? out.slice(0, 15) : 'none';
  const ss = p01.children.filter(n => n.type === 'SECTION'); const so = [];
  for (let i = 0; i < ss.length; i++) for (let j = i + 1; j < ss.length; j++) if (inter(BB(ss[i]), BB(ss[j]))) so.push(ss[i].name + ' x ' + ss[j].name);
  report.sectionOverlaps = so.length ? so : 'none';
});

// ---------- 5. kontrol ----------
await step('5 kontrol', async () => {
  const rings = p01.findAll(n => n.name === 'Focus ring');
  const bad = rings.filter(r => !(r.strokes.length && r.strokes[0].boundVariables && r.strokes[0].boundVariables.color && r.strokes[0].boundVariables.color.id === V('color/border/focus').id));
  report.rings = `${rings.length} halka, değişkene bağlı olmayan ${bad.length}`;
  const ib = getSet('Icon button');
  const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
  let inst = 0, noState = 0;
  for (const n of p02.findAll(n => n.type === 'INSTANCE' && /Icon button/.test(n.name))) { const m = await n.getMainComponentAsync(); if (m && m.parent === ib) { inst++; if (!/State=Default/.test(m.name)) noState++; } }
  report.iconButtonInstances = `02'de ${inst} Icon button instance, Default dışı ${noState} (0 olmalı)`;
});
return report;
