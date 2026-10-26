// step 220 · Sonuc yok durumu: Map empty state component + Map / No results (Clubs) + Map / Scouts near you · none

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




async function applySwitcher(pg, active) {
  const sset = set01('Map type switcher'); const filters = pg.findOne(n => n.name === 'Filters'); if (!filters) return 'no Filters';
  for (const k of filters.children.slice()) if (k.name === 'Type switcher') k.remove();
  const inst = sset.children.find(v => v.name === 'Active=' + active).createInstance(); inst.name = 'Type switcher';
  filters.insertChild(0, inst); inst.layoutAlign = 'STRETCH'; return 'ok';
}


const cardSet = set01('Map card'); const silSet = set01('Silhouette'); const btnSet = set01('Button');
const S_H3 = tstyle('Heading/H3', 'Heading/H4'), S_BODY = tstyle('Body/Default', 'Body/Small');
for (const s of [S_H3, S_BODY]) await figma.loadFontAsync(s.fontName);
function mkIcon(svg, colorVar, size) {
  const ic = figma.createNodeFromSvg(svg); ic.name = 'Icon'; ic.fills = []; ic.resize(size, size); ic.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
  const walk = x => { if ('children' in x) x.children.forEach(walk); if (x.type !== 'FRAME' && x.type !== 'GROUP') { if (x.strokes && x.strokes.length) x.strokes = [P(V(colorVar))]; x.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; } };
  walk(ic); return ic;
}
const SEARCH_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>';
const USER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>';
async function mkBtn(label, style) {
  const bv = btnSet.children.find(v => new RegExp('Style=' + style).test(v.name) && /State=Default/.test(v.name)) || btnSet.children[0];
  const b = bv.createInstance(); b.name = 'Button · ' + label; const cp = b.componentProperties || {};
  const lk = Object.keys(cp).find(k => /^Label/.test(k)); const ik = Object.keys(cp).find(k => /^Icon/.test(k));
  if (lk) b.setProperties({ [lk]: label }); if (ik) b.setProperties({ [ik]: false });
  const bt = b.findOne(n => n.type === 'TEXT'); if (bt) await setText(bt, label); return b;
}


// 1. Map empty state component
await step('Map empty state component', async () => {
  await figma.setCurrentPageAsync(p01);
  for (const k of sec7.children.filter(n => n.name === 'Map empty state')) k.remove();
  const c = figma.createComponent(); c.name = 'Map empty state'; c.layoutMode = 'VERTICAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED'; c.resize(352, 100); c.primaryAxisSizingMode = 'AUTO';
  c.counterAxisAlignItems = 'CENTER'; GAP(c, 'spacing/sm'); PAD(c, 'spacing/lg', 'spacing/md', 'spacing/lg', 'spacing/md'); RAD(c, 'radius/md');
  c.fills = []; c.strokes = [P(V('color/border/default'))]; c.strokeWeight = 1; c.dashPattern = [6, 4];
  const ring = figma.createFrame(); ring.name = 'Icon circle'; ring.layoutMode = 'NONE'; ring.resize(48, 48); RAD(ring, 'radius/full'); ring.fills = [P(V('color/bg/subtle'))];
  const ic = mkIcon(SEARCH_SVG, 'color/icon/default', 24); ring.appendChild(ic); ic.x = 12; ic.y = 12; c.appendChild(ring);
  const t = await txt('No clubs match', S_H4, 'color/text/primary'); t.name = 'Title'; t.textAlignHorizontal = 'CENTER'; c.appendChild(t); t.layoutAlign = 'STRETCH'; t.textAutoResize = 'HEIGHT';
  const b = await txt('Try zooming out or clearing a filter.', S_LABEL, 'color/text/secondary'); b.name = 'Body'; b.textAlignHorizontal = 'CENTER'; c.appendChild(b); b.layoutAlign = 'STRETCH'; b.textAutoResize = 'HEIGHT';
  const bt = await mkBtn('Clear all filters', 'Secondary'); c.appendChild(bt);
  const sw = sec7.children.find(n => n.name === 'Map type switcher'); c.x = sw ? sw.x : 80; c.y = sw ? sw.y + sw.height + 80 : 80;
  c.description = 'Map empty state. Replaces the result list when nothing matches: say what is empty, then offer the one step that fixes it (clear filters, or widen the radius).';
  created.empty = c; report.info.empty = Math.round(c.width) + 'x' + Math.round(c.height);
  let r7 = 0, b7 = 0; for (const ch of sec7.children) { r7 = Math.max(r7, ch.x + ch.width); b7 = Math.max(b7, ch.y + ch.height); } sec7.resizeWithoutConstraints(Math.max(1200, Math.ceil(r7 + 80)), Math.ceil(b7 + 80));
  await figma.setCurrentPageAsync(p02);
});
await figma.setCurrentPageAsync(p02);

const slotX = i => 80 + i * 1920;
async function emptyPage(pageName, srcName, slot, cfg) {
  const src = mapSec.children.find(n => n.name === srcName); if (!src) throw new Error('source page missing: ' + srcName);
  const old = mapSec.children.find(n => n.name === pageName); if (old) old.remove();
  const cp = src.clone(); cp.name = pageName; mapSec.appendChild(cp); cp.x = slotX(slot); cp.y = 80;
  const area = cp.findOne(n => n.name === 'Map area'), panel = cp.findOne(n => n.name === 'Map panel');
  for (const k of area.children.slice()) if (/^(Marker|Cluster) ·/.test(k.name) || /^Map card/.test(k.name)) k.remove();
  for (const nm of ['Results', 'Show all']) { const k = panel.findOne(n => n.name === nm); if (k) k.remove(); }
  const t1 = panel.findOne(n => n.type === 'TEXT' && n.name === 'Total'), t2 = panel.findOne(n => n.type === 'TEXT' && n.name === 'Breakdown');
  if (t1) await setText(t1, cfg.total); if (t2) await setText(t2, cfg.breakdown);
  const inst = created.empty.createInstance(); inst.name = 'Map empty state'; panel.appendChild(inst); inst.layoutAlign = 'STRETCH';
  await setIn(inst, 'Title', cfg.title); await setIn(inst, 'Body', cfg.body);
  const bi = inst.findOne(n => n.type === 'INSTANCE' && /^Button/.test(n.name));
  if (bi) { bi.name = 'Button · ' + cfg.btn; const cpr = bi.componentProperties || {}; const lk = Object.keys(cpr).find(k => /^Label/.test(k)); if (lk) bi.setProperties({ [lk]: cfg.btn }); const bt = bi.findOne(n => n.type === 'TEXT'); if (bt) await setText(bt, cfg.btn); }
  report.info[pageName] = 'panel ' + Math.round(panel.width) + 'x' + Math.round(panel.height) + ' · empty ' + Math.round(inst.width) + 'x' + Math.round(inst.height) + ' · markers left ' + area.children.filter(n => /^Marker ·/.test(n.name)).length;
  return cp;
}
await step('Map / No results · Desktop', async () => {
  created.p1 = await emptyPage('Map / No results · Desktop', 'Map / Club card · Desktop', 7, { total: '0 clubs in view', breakdown: 'Berlin and surroundings', title: 'No clubs match', body: 'Try zooming out or clearing a filter.', btn: 'Clear all filters' });
});
await step('Map / Scouts near you · none · Desktop', async () => {
  created.p2 = await emptyPage('Map / Scouts near you · none · Desktop', 'Map / Scouts near you · Desktop', 8, { total: '0 scouts within 50 km', breakdown: 'Managers and officials who shortlist players', title: 'No scouts nearby', body: 'No scouts or managers who shortlist players are within 50 km. Try a wider radius.', btn: 'Search within 100 km' });
});

// 2. Sabit siraya diz + Section'i daralt
await step('Relayout Map pages', async () => {
  const order = ['Map / Default · Desktop', 'Map / Club card · Desktop', 'Map / Events · Desktop', 'Map / Match requests · Desktop', 'Map / Stadium card · Desktop', 'Map / Scouts near you · ask · Desktop', 'Map / Scouts near you · Desktop', 'Map / No results · Desktop', 'Map / Scouts near you · none · Desktop'];
  const missing = []; order.forEach((nm, i) => { const pg = mapSec.children.find(n => n.name === nm); if (!pg) missing.push(nm); else { pg.x = slotX(i); pg.y = 80; } });
  report.info.missing = missing.length ? missing : 'none';
  let right = 0, bottom = 0; for (const ch of mapSec.children) { right = Math.max(right, ch.x + ch.width); bottom = Math.max(bottom, ch.y + ch.height); }
  mapSec.resizeWithoutConstraints(Math.ceil(right + 80), Math.ceil(bottom + 80)); web.appendChild(mapSec);
  const A = mapSec.absoluteBoundingBox; const hits = [];
  for (const s of web.children) { if (s === mapSec || !s.absoluteBoundingBox) continue; const B = s.absoluteBoundingBox; if (A.x < B.x + B.width && B.x < A.x + A.width && A.y < B.y + B.height && B.y < A.y + A.height) hits.push(s.name); }
  report.info.mapSection = Math.round(mapSec.width) + 'x' + Math.round(mapSec.height) + ' · overlaps ' + (hits.length ? hits.join(', ') : 'none');
  report.info.pages = mapSec.children.map(c => c.name.replace('Map / ', '') + ' ' + Math.round(c.x)).join(' | ');
});
await step('check', async () => {
  const gray = [], unst = []; const walk = n => { if ('fills' in n && n.fills !== figma.mixed) n.fills.forEach(f => { if (f.type === 'SOLID' && hex(f) === '#808080') gray.push(n.name); }); if (n.type === 'TEXT' && !n.textStyleId) unst.push(n.name); if ('children' in n) n.children.forEach(walk); };
  for (const p of [created.p1, created.p2, created.empty]) if (p) walk(p);
  report.info.grayFills = gray.length ? gray.slice(0, 8) : 'none'; report.info.unstyledText = unst.length ? unst.slice(0, 8) : 'none';
});
return report;
