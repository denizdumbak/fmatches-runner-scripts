// step 215 · Map key kapali hal = Legend varyanti (ayni genislik, ok asagi); Map key button kaldirildi; Events sayfasinda kapali Legend

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync(); await figma.setCurrentPageAsync(p02);
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const PAD = (n, t, r, b, l) => { n.setBoundVariable('paddingTop', V(t)); n.setBoundVariable('paddingRight', V(r)); n.setBoundVariable('paddingBottom', V(b)); n.setBoundVariable('paddingLeft', V(l)); };
const GAP = (n, v) => n.setBoundVariable('itemSpacing', V(v));
const RAD = (n, v) => { for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) n.setBoundVariable(k, V(v)); };
const hex = p => p && p.color ? '#' + [p.color.r, p.color.g, p.color.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('') : '-';
const effects = await figma.getLocalEffectStylesAsync(); const effect = nm => effects.find(s => s.name === nm);
const texts = await figma.getLocalTextStylesAsync();
const tstyle = (...names) => { for (const n of names) { const s = texts.find(t => t.name === n) || texts.find(t => t.name.indexOf(n) === 0); if (s) return s; } return null; };
const S_H4 = tstyle('Heading/H4'), S_LABEL = tstyle('Label/Default'), S_SMALL = tstyle('Label/Small');
for (const s of [S_H4, S_LABEL, S_SMALL]) await figma.loadFontAsync(s.fontName);
async function txt(str, style, colorVar) { const t = figma.createText(); await t.setTextStyleIdAsync(style.id); t.characters = str; t.fills = [P(V(colorVar))]; return t; }
async function setText(node, str) { const f = node.fontName === figma.mixed ? node.getRangeFontName(0, 1) : node.fontName; await figma.loadFontAsync(f); node.characters = str; }
const set01 = nm => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === nm);
const sec7 = p01.children.find(n => n.type === 'SECTION' && /^7 /.test(n.name));
const markerSet = set01('Map marker'), clusterSet = set01('Map cluster');
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web'); const mapSec = web.children.find(n => n.type === 'SECTION' && n.name === 'Map');
const created = {};
const mv = (kind, state) => markerSet.children.find(c => c.name === 'Kind=' + kind + ', State=' + state);
const setIn = async (root, nm, str) => { const t = root.findOne(n => n.type === 'TEXT' && n.name === nm); if (t) await setText(t, str); return !!t; };


const ICON_UP = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>';
const ICON_DOWN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
const ICON_LIST = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h.01M3 18h.01M3 6h.01M8 12h13M8 18h13M8 6h13"/></svg>';
function mkIcon(svg, colorVar, size) {
  const ic = figma.createNodeFromSvg(svg); ic.name = 'Icon'; ic.fills = []; ic.resize(size, size); ic.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
  const walk = x => { if ('children' in x) x.children.forEach(walk); if (x.type !== 'FRAME' && x.type !== 'GROUP') { if (x.strokes && x.strokes.length) x.strokes = [P(V(colorVar))]; x.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; } };
  walk(ic); return ic;
}


const clickChange = dest => [{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'CHANGE_TO', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.15 }, preserveScrollPosition: false }] }];

// 1. Eski Map key button'i kaldir (sayfadaki ornek once)
await step('Remove Map key button', async () => {
  for (const pg of mapSec.children) for (const k of pg.findAll(n => n.name === 'Map key button · collapsed')) k.remove();
  await figma.setCurrentPageAsync(p01);
  for (const k of sec7.children.filter(n => n.name === 'Map key button')) k.remove();
  await figma.setCurrentPageAsync(p02);
});
await figma.setCurrentPageAsync(p02);

// 2. Legend: State=Open / State=Collapsed
await step('Legend State variants', async () => {
  await figma.setCurrentPageAsync(p01);
  let lg = sec7.children.find(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && n.name === 'Legend'); if (!lg) throw new Error('Legend missing');
  let openC, set;
  if (lg.type === 'COMPONENT_SET') { set = lg; for (const v of set.children.slice()) if (/Collapsed/.test(v.name)) v.remove(); openC = set.children.find(v => /State=Open/.test(v.name)) || set.children[0]; }
  else openC = lg;
  const desc = (set || openC).description; const lx = (set || openC).x, ly = (set || openC).y;
  openC.name = 'State=Open';
  const col = openC.clone(); col.name = 'State=Collapsed';
  const W0 = openC.width;
  const header = col.findOne(n => n.name === 'Legend header'); if (!header) throw new Error('Legend header missing (run 214 first)');
  for (const k of col.children) if (k !== header) k.visible = false;
  const btn = header.findOne(n => n.name === 'Collapse'); const oi = btn.findOne(n => n.name === 'Icon'); if (oi) oi.remove();
  const di = mkIcon(ICON_DOWN, 'color/icon/default', 16); btn.appendChild(di); di.x = 8; di.y = 8;
  if (set) { set.appendChild(col); } else { col.x = openC.x + W0 + 40; col.y = openC.y; set = figma.combineAsVariants([openC, col], sec7); set.name = 'Legend'; set.x = lx; set.y = ly; }
  col.resize(W0, col.height); col.primaryAxisSizingMode = 'AUTO'; col.counterAxisSizingMode = 'FIXED';
  openC.x = 0; openC.y = 0; col.x = Math.round(W0 + 40); col.y = 0;
  let r = 0, b = 0; for (const v of set.children) { r = Math.max(r, v.x + v.width); b = Math.max(b, v.y + v.height); } set.resizeWithoutConstraints(Math.ceil(r), Math.ceil(b));
  set.description = 'Map key. Open lists the four types. Collapsed keeps only the header, at the same width, with the arrow pointing down. The round arrow button toggles between the two, in the same corner. Remembered per user.';
  const ob = openC.findOne(n => n.name === 'Collapse'), cb = col.findOne(n => n.name === 'Collapse');
  await ob.setReactionsAsync(clickChange(col)); await cb.setReactionsAsync(clickChange(openC));
  created.legendSet = set; created.legendOpen = openC; created.legendCol = col;
  report.info.legendWidths = 'open ' + Math.round(openC.width) + 'x' + Math.round(openC.height) + ' · collapsed ' + Math.round(col.width) + 'x' + Math.round(col.height);
  await figma.setCurrentPageAsync(p02);
});
await figma.setCurrentPageAsync(p02);

// 3. Events sayfasi: Legend kapali hal
await step('Events page: Legend collapsed', async () => {
  const pg = mapSec.children.find(n => n.name === 'Map / Events · Desktop'); if (!pg) throw new Error('events page missing');
  const area = pg.findOne(n => n.name === 'Map area'); const lg = area.findOne(n => n.name === 'Legend'); if (!lg) throw new Error('legend instance missing');
  lg.visible = true; lg.swapComponent(created.legendCol);
  lg.x = Math.round(area.width - 16 - lg.width); lg.y = 16; area.appendChild(lg);
  const card = area.findOne(n => /^Map card/.test(n.name)); if (card) area.appendChild(card);
  const A = card.absoluteBoundingBox, B = lg.absoluteBoundingBox;
  report.info.legendEvents = Math.round(lg.width) + 'x' + Math.round(lg.height) + ' at ' + Math.round(lg.x) + ',' + Math.round(lg.y) + ' · overlaps card: ' + (A.x < B.x + B.width && B.x < A.x + A.width && A.y < B.y + B.height && B.y < A.y + A.height);
  created.page = pg;
});

// 4. Kontrol
await step('check', async () => {
  const gray = [], unst = []; const walk = n => { if ('fills' in n && n.fills !== figma.mixed) n.fills.forEach(f => { if (f.type === 'SOLID' && hex(f) === '#808080') gray.push(n.name); }); if (n.type === 'TEXT' && !n.textStyleId) unst.push(n.name); if ('children' in n) n.children.forEach(walk); };
  walk(created.page); walk(created.legendSet);
  report.info.grayFills = gray.length ? gray.slice(0, 8) : 'none'; report.info.unstyledText = unst.length ? unst.slice(0, 8) : 'none';
  const insts = []; for (const pg of mapSec.children) for (const k of pg.findAll(n => n.type === 'INSTANCE' && n.name === 'Legend')) insts.push(pg.name.replace('Map / ', '') + (k.visible ? '' : ' (hidden)'));
  report.info.legendInstances = insts;
  let r7 = 0, b7 = 0; for (const ch of sec7.children) { r7 = Math.max(r7, ch.x + ch.width); b7 = Math.max(b7, ch.y + ch.height); } sec7.resizeWithoutConstraints(Math.max(1200, Math.ceil(r7 + 80)), Math.ceil(b7 + 80));
  const ovl = []; const top = p02.children.filter(n => n.type === 'SECTION'); for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) { const a = top[i], b = top[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ovl.push(a.name + ' x ' + b.name); }
  report.info.overlap02 = ovl.length ? ovl : 'none';
});
return report;
