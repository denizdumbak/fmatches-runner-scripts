// step 341 · Foundations › 5 · Forms: yeni `Team select` seti (Device Desktop|Mobile × State Closed|Hover|Focus|Open, 8 varyant), kulüp kartı takım dropdown'ı için
const report = { done: [], errors: [], info: { dimsMissing: [] } };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
await figma.setCurrentPageAsync(p01);
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const D = key => { const v = allVars.find(x => x.name === key) || allVars.find(x => x.name.endsWith('/' + key)); if (!v) report.info.dimsMissing.push(key); return v || null; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const PAD = (n, t, r, b, l) => { const m = { paddingTop: t, paddingRight: r, paddingBottom: b, paddingLeft: l }; for (const k in m) { const v = D(m[k]); if (v) n.setBoundVariable(k, v); } };
const GAP = (n, key) => { const v = D(key); if (v) n.setBoundVariable('itemSpacing', v); };
const RAD = (n, key) => { const v = D(key); if (v) for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) n.setBoundVariable(k, v); };
const sets = p01.findAll(n => n.type === 'COMPONENT_SET' || (n.type === 'COMPONENT' && n.parent && n.parent.type !== 'COMPONENT_SET'));
const byName = nm => sets.find(n => n.name === nm);
const styles = {}; for (const s of await figma.getLocalTextStylesAsync()) styles[s.name] = s;
const shadow = (await figma.getLocalEffectStylesAsync()).find(s => s.name === 'Shadow/Raised');
const sz = n => Math.round(n.width) + 'x' + Math.round(n.height);

async function T(text, styleName, colorName) {
  const st = styles[styleName]; if (!st) throw new Error('text style missing: ' + styleName);
  await figma.loadFontAsync(st.fontName);
  const t = figma.createText(); await t.setTextStyleIdAsync(st.id); t.characters = text; t.fills = [P(V(colorName))]; return t;
}
function F(name, dir) { const f = figma.createFrame(); f.name = name; f.layoutMode = dir; f.fills = []; f.clipsContent = false; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; return f; }
function rect(name, w, h, colorName) { const r = figma.createRectangle(); r.name = name; r.resize(w, h); r.fills = [P(V(colorName))]; return r; }

const formSet = byName('Form field'); if (!formSet) throw new Error('Form field yok');
const selVar = formSet.children.find(c => /Type=Select/.test(c.name) && /State=Default/.test(c.name));
const chevSrc = selVar.findOne(n => n.name === 'Icon · Chevron');
const optVar = byName('Option row').children.find(c => /State=Default/.test(c.name));
const checkSrc = optVar.findOne(n => n.name === 'Icon · Check');
const tagVar = byName('Tag').children.find(c => /Brand subtle/.test(c.name));
let sec = formSet.parent; while (sec && sec.type !== 'SECTION') sec = sec.parent;
if (!sec) throw new Error('5 · Forms Section yok');

async function womenTag() { const t = tagVar.createInstance(); t.name = 'Tag · Women'; const lab = t.findOne(n => n.type === 'TEXT'); await figma.loadFontAsync(lab.fontName); lab.characters = "Women's"; return t; }
const ROWS = [
  { n: 'Riverside FC', l: 'Third Division', t: 'Tier 3', sel: true },
  { n: 'Riverside FC B', l: 'Fifth Division', t: 'Tier 5' },
  { n: 'Riverside FC U19', l: 'U19 League' },
  { n: 'Riverside FC Women', l: "Women's Premier", t: 'Tier 1', w: true }
];
const metaOf = r => r.l + (r.t ? ' · ' + r.t : '');

async function mkRow(r) {
  const row = F('Row · ' + r.n, 'HORIZONTAL'); row.counterAxisAlignItems = 'CENTER'; GAP(row, 'spacing/sm'); PAD(row, 'spacing/sm', 'spacing/md', 'spacing/sm', 'spacing/md'); RAD(row, 'radius/md');
  if (r.sel) row.fills = [P(V('color/bg/brand-subtle'))];
  const text = F('Text', 'VERTICAL'); GAP(text, 'spacing/2xs');
  const nameRow = F('Name row', 'HORIZONTAL'); nameRow.counterAxisAlignItems = 'CENTER'; GAP(nameRow, 'spacing/xs');
  nameRow.appendChild(await T(r.n, r.sel ? 'Label/Default Strong' : 'Body/Default', 'color/text/primary'));
  if (r.w) nameRow.appendChild(await womenTag());
  text.appendChild(nameRow);
  text.appendChild(await T(metaOf(r), 'Label/Small', 'color/text/secondary'));
  row.appendChild(text); text.layoutSizingHorizontal = 'FILL';
  if (r.sel) row.appendChild(checkSrc.clone());
  return row;
}

async function mkVariant(dev, st, x, y) {
  const mobile = dev === 'Mobile'; const W = mobile ? 358 : 776;
  const root = figma.createComponent(); root.name = 'Device=' + dev + ', State=' + st;
  root.layoutMode = 'VERTICAL'; root.fills = []; root.clipsContent = false; GAP(root, 'spacing/xs');
  root.resize(W, 48); root.primaryAxisSizingMode = 'AUTO'; root.counterAxisSizingMode = 'FIXED';
  const field = F('Field', 'HORIZONTAL'); field.counterAxisAlignItems = 'CENTER'; GAP(field, 'spacing/sm'); { const pv = D('spacing/md'); if (pv) { field.setBoundVariable('paddingLeft', pv); field.setBoundVariable('paddingRight', pv); } field.paddingTop = 0; field.paddingBottom = 0; } RAD(field, 'radius/md');
  field.fills = [P(V('color/bg/surface'))]; field.strokes = [P(V(st === 'Hover' || st === 'Open' ? 'color/border/strong' : 'color/border/default'))]; field.strokeWeight = 1; field.strokeAlign = 'INSIDE';
  field.resize(W, 48); field.counterAxisSizingMode = 'FIXED'; field.primaryAxisSizingMode = 'FIXED';
  const name = await T('Riverside FC', 'Label/Large Strong', 'color/text/primary'); field.appendChild(name);
  const tag = await womenTag(); tag.visible = false; field.appendChild(tag);
  if (!mobile) {
    const meta = F('League and tier', 'HORIZONTAL'); meta.counterAxisAlignItems = 'CENTER'; GAP(meta, 'spacing/sm');
    meta.appendChild(await T('Third Division', 'Label/Default', 'color/text/primary'));
    meta.appendChild(rect('Divider', 1, 16, 'color/border/default'));
    meta.appendChild(await T('Tier 3', 'Label/Default', 'color/text/secondary'));
    field.appendChild(meta);
  }
  const chev = chevSrc.clone(); field.appendChild(chev);
  root.appendChild(field); field.layoutSizingHorizontal = 'FILL';
  name.layoutSizingHorizontal = 'FILL'; name.textAutoResize = 'HEIGHT'; name.textTruncation = 'ENDING'; name.maxLines = 1;
  if (mobile) { const ln = await T('Third Division · Tier 3', 'Label/Small', 'color/text/secondary'); ln.name = 'League line'; root.appendChild(ln); }
  if (st === 'Focus') {
    const ring = figma.createRectangle(); ring.name = 'Focus ring'; ring.fills = []; ring.strokes = [P(V('color/border/focus'))]; ring.strokeWeight = 2; ring.strokeAlign = 'INSIDE'; ring.resize(W + 8, 56); RAD(ring, 'radius/lg');
    root.appendChild(ring); ring.layoutPositioning = 'ABSOLUTE'; ring.x = -4; ring.y = -4; ring.constraints = { horizontal: 'STRETCH', vertical: 'MIN' };
  }
  if (st === 'Open') {
    const menu = F('Menu', 'VERTICAL'); GAP(menu, 'spacing/2xs'); PAD(menu, 'spacing/xs', 'spacing/xs', 'spacing/xs', 'spacing/xs'); RAD(menu, 'radius/md');
    menu.fills = [P(V('color/bg/surface'))]; if (shadow) await menu.setEffectStyleIdAsync(shadow.id);
    for (const r of ROWS) { const row = await mkRow(r); menu.appendChild(row); row.layoutSizingHorizontal = 'FILL'; }
    menu.resize(W, 100); menu.primaryAxisSizingMode = 'AUTO';
    root.appendChild(menu); menu.layoutPositioning = 'ABSOLUTE'; menu.x = 0; menu.y = 56;
  }
  sec.appendChild(root); root.x = x; root.y = y; return root;
}

await step('Team select seti', async () => {
  for (const old of sec.children.filter(n => n.name === 'Team select')) old.remove();
  const bottom = Math.max(...sec.children.map(c => c.y + c.height)); const baseY = bottom + 120;
  const ys = { Closed: 0, Hover: 110, Focus: 220, Open: 340 }; const made = [];
  for (const [dev, bx] of [['Desktop', 80], ['Mobile', 980]]) for (const st of ['Closed', 'Hover', 'Focus', 'Open']) made.push(await mkVariant(dev, st, bx, baseY + ys[st] + 4));
  const set = figma.combineAsVariants(made, sec); set.name = 'Team select';
  set.resizeWithoutConstraints(set.width, 340 + 400);
  // prototip: Closed -> Hover (0.15 sn)
  for (const dev of ['Desktop', 'Mobile']) {
    const c = set.children.find(x => x.name === 'Device=' + dev + ', State=Closed'), h = set.children.find(x => x.name === 'Device=' + dev + ', State=Hover');
    await c.setReactionsAsync([{ trigger: { type: 'ON_HOVER' }, actions: [{ type: 'NODE', destinationId: h.id, navigation: 'CHANGE_TO', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.15 }, preserveScrollPosition: false, resetVideoPosition: false }] }]);
  }
  const need = Math.ceil(set.y + set.height + 80 - sec.y); sec.resizeWithoutConstraints(Math.max(sec.width, Math.ceil(set.x + set.width + 80)), Math.max(sec.height, need));
  report.info.variants = set.children.map(c => c.name + ' ' + sz(c));
  report.info.set = 'x=' + Math.round(set.x) + ' y=' + Math.round(set.y) + ' ' + sz(set); report.info.section = sec.name + ' ' + sz(sec);
});

await step('Kontrol', async () => {
  const set = sec.children.find(n => n.name === 'Team select'); if (!set) throw new Error('set yok');
  let gray = 0, unstyled = 0, nodes = 0;
  for (const n of set.findAll(() => true)) { nodes++;
    if (n.type === 'TEXT' && !(typeof n.textStyleId === 'string' && n.textStyleId)) unstyled++;
    if ('fills' in n && Array.isArray(n.fills)) for (const f of n.fills) if (f.type === 'SOLID' && Math.abs(f.color.r - .5) < .01 && Math.abs(f.color.g - .5) < .01 && Math.abs(f.color.b - .5) < .01) gray++;
    if ('strokes' in n && Array.isArray(n.strokes)) for (const f of n.strokes) if (f.type === 'SOLID' && Math.abs(f.color.r - .5) < .01 && Math.abs(f.color.g - .5) < .01 && Math.abs(f.color.b - .5) < .01) gray++;
  }
  report.info.check = { nodes, grayFills: gray, unstyledText: unstyled };
  const a = set.absoluteBoundingBox; const hit = [];
  for (const s of sec.children) { if (s === set) continue; const b = s.absoluteBoundingBox; if (b && a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y) hit.push(s.name); }
  report.info.overlapsWithSiblings = hit.length ? hit : 'none';
  report.info.open = set.children.filter(c => /Open/.test(c.name)).map(c => c.name + ' menu ' + (c.findOne(n => n.name === 'Menu') ? sz(c.findOne(n => n.name === 'Menu')) : 'yok'));
});
return report;
