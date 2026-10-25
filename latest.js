// step 207 · Map / Club card · Desktop: Berlin marker dagilimi duzensizlestirildi (yogun ceplenme + tek kalanlar); Map card + Default sayfa adimlari onceki haliyle korunuyor

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

// 1. Map card (Kind=Club)
await step('Map card component', async () => {
  await figma.setCurrentPageAsync(p01);
  const old = sec7.children.find(n => n.name === 'Map card'); if (old) old.remove();
  const c = figma.createComponent(); c.name = 'Kind=Club'; c.layoutMode = 'VERTICAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED'; c.resize(320, 100); c.counterAxisSizingMode = 'FIXED';
  GAP(c, 'spacing/sm'); PAD(c, 'spacing/md', 'spacing/md', 'spacing/md', 'spacing/md'); RAD(c, 'radius/lg'); c.fills = [P(V('color/bg/surface'))];
  const e = effect('Shadow/Raised'); if (e) await c.setEffectStyleIdAsync(e.id);
  const head = figma.createFrame(); head.name = 'Head'; head.layoutMode = 'HORIZONTAL'; head.primaryAxisSizingMode = 'FIXED'; head.counterAxisSizingMode = 'AUTO'; head.counterAxisAlignItems = 'CENTER'; head.resize(288, 44); head.counterAxisSizingMode = 'AUTO'; head.fills = []; GAP(head, 'spacing/sm');
  const crestV = set01('Club crest').children.filter(v => !/No crest/.test(v.name)); const crest = crestV[0].createInstance(); crest.name = 'Club crest'; head.appendChild(crest);
  const col = figma.createFrame(); col.name = 'Text'; col.layoutMode = 'VERTICAL'; col.primaryAxisSizingMode = 'AUTO'; col.counterAxisSizingMode = 'AUTO'; col.fills = []; GAP(col, 'spacing/2xs');
  const nm = await txt('Riverside FC', S_H4, 'color/text/primary'); nm.name = 'Name'; col.appendChild(nm);
  const mt = await txt('Third Division · Tier 3', S_SMALL, 'color/text/secondary'); mt.name = 'Meta'; col.appendChild(mt);
  head.appendChild(col); col.layoutGrow = 1;
  const cl = figma.createFrame(); cl.name = 'Close'; cl.layoutMode = 'NONE'; cl.resize(32, 32); RAD(cl, 'radius/full'); cl.fills = [P(V('color/bg/subtle'))];
  const xi = figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'); xi.name = 'Icon'; xi.fills = []; xi.resize(16, 16); xi.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
  const walk = x => { if ('children' in x) x.children.forEach(walk); if (x.type !== 'FRAME' && x.type !== 'GROUP') { if (x.strokes && x.strokes.length) x.strokes = [P(V('color/icon/default'))]; x.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; } };
  walk(xi); cl.appendChild(xi); xi.x = 8; xi.y = 8; head.appendChild(cl);
  c.appendChild(head); head.layoutAlign = 'STRETCH';
  const loc = await txt('Riverside, England', S_LABEL, 'color/text/secondary'); loc.name = 'Location'; c.appendChild(loc);
  const btnSet = set01('Button'); let btnInfo = 'Button set missing';
  if (btnSet) {
    const bv = btnSet.children.find(v => /Style=Primary/.test(v.name) && /State=Default/.test(v.name)) || btnSet.children[0];
    const b = bv.createInstance(); b.name = 'Button · View club'; const cp = b.componentProperties || {};
    const lk = Object.keys(cp).find(k => /^Label/.test(k)); const ik = Object.keys(cp).find(k => /^Icon/.test(k));
    if (lk) b.setProperties({ [lk]: 'View club' }); if (ik) b.setProperties({ [ik]: false });
    const bt = b.findOne(n => n.type === 'TEXT'); if (bt) await setText(bt, 'View club');
    c.appendChild(b); b.layoutAlign = 'STRETCH'; btnInfo = 'variant ' + bv.name + ' props ' + Object.keys(cp).join(',');
  }
  report.info.cardButton = btnInfo;
  const set = figma.combineAsVariants([c], sec7); set.name = 'Map card';
  set.description = 'Map card. Opens when a marker is clicked, next to it; the page behind does not change. Kind: Club (this one), Stadium, Event, Match request (to come). Close (x) or Esc dismisses it.';
  const row = sec7.children.find(n => n.name === 'Map result row'); set.x = row.x + row.width + 80; set.y = row.y; created.card = set;
  report.info.cardSize = Math.round(c.width) + 'x' + Math.round(c.height);
  await figma.setCurrentPageAsync(p02);
});
await figma.setCurrentPageAsync(p02);


// 1b. Default sayfa: Legend 4 tur, seyrek ve duzensiz cluster/marker
await step('Default map: legend + sparse irregular markers', async () => {
  const pg = mapSec.children.find(n => n.name === 'Map / Default · Desktop'); if (!pg) throw new Error('default page missing');
  const area = pg.findOne(n => n.name === 'Map area'); const W = area.width, H = area.height;
  const sc = Math.max(W / 1830, H / 1000), ox = (W - 1830 * sc) / 2, oy = (H - 1000 * sc) / 2;
  for (const k of area.children.slice()) if (/^(Cluster|Marker) ·/.test(k.name)) k.remove();
  const lg = area.findOne(n => n.name === 'Legend');
  for (const nm of ['Row · Events', 'Row · Teams looking for an opponent']) { const lr = lg.findOne(n => n.name === nm); if (lr) lr.visible = true; }
  lg.x = W - 16 - lg.width; lg.y = 16;
  const at = area.children.indexOf(lg);
  const CL = [[715, 360, 312], [585, 300, 48], [840, 470, 276], [1010, 415, 439], [1115, 720, 187], [1295, 365, 71], [1180, 150, 38], [1540, 640, 27], [690, 820, 92]];
  for (const [x, y, n] of CL) { const sz = n >= 200 ? 'L' : n >= 50 ? 'M' : 'S'; const i = clusterSet.children.find(c => c.name === 'Size=' + sz).createInstance(); i.name = 'Cluster · ' + n; area.insertChild(at, i); const t = i.findOne(k => k.type === 'TEXT'); if (t) await setText(t, String(n)); i.x = Math.round(ox + x * sc - i.width / 2); i.y = Math.round(oy + y * sc - i.height / 2); }
  const SG = [['Club', 945, 235], ['Club', 1395, 520], ['Stadium', 1245, 615], ['Club', 615, 600], ['Club', 1470, 250], ['Stadium', 780, 650]];
  for (const [kind, x, y] of SG) { const i = markerSet.children.find(c => c.name === 'Kind=' + kind + ', State=Default').createInstance(); i.name = 'Marker · ' + kind; area.insertChild(at, i); i.x = Math.round(ox + x * sc - i.width / 2); i.y = Math.round(oy + y * sc - i.height / 2); }
  report.info.legendH = Math.round(lg.height);
});

// 2. Sayfa: Default'un kopyasi
await step('Map / Club card · Desktop', async () => {
  if (!created.card) throw new Error('card component missing');
  const old = mapSec.children.find(n => n.name === 'Map / Club card · Desktop'); if (old) old.remove();
  const pg = mapSec.children.find(n => n.name === 'Map / Default · Desktop'); if (!pg) throw new Error('default map page missing');
  const cp = pg.clone(); cp.name = 'Map / Club card · Desktop'; mapSec.appendChild(cp); cp.x = pg.x + pg.width + 480; cp.y = pg.y;
  const area = cp.findOne(n => n.name === 'Map area'), panel = cp.findOne(n => n.name === 'Map panel'), legend = cp.findOne(n => n.name === 'Legend');
  for (const k of area.children.slice()) if (/^Cluster ·/.test(k.name)) k.remove();
  const base = area.findOne(n => n.name === 'Map base · Europe'); base.name = 'Map base · Berlin';
  const img = await figma.createImageAsync('https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/img/map/city-z12.png'); base.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: img.hash }];
  const at = area.children.indexOf(legend);
  const mv = (kind, state) => markerSet.children.find(c => c.name === 'Kind=' + kind + ', State=' + state);
  const M = [['Club', 498, 254], ['Club', 552, 500], ['Club', 586, 536], ['Club', 540, 568], ['Club', 624, 478], ['Club', 668, 652], ['Club', 884, 548], ['Club', 1004, 494], ['Club', 1188, 404], ['Club', 1262, 666], ['Stadium', 706, 206], ['Stadium', 950, 700], ['Stadium', 1130, 540]];
  for (const [kind, x, y] of M) { const i = mv(kind, 'Default').createInstance(); i.name = 'Marker · ' + kind; area.insertChild(at, i); i.x = Math.round(x - i.width / 2); i.y = Math.round(y - i.height / 2); }
  for (const [x, y, n] of [[600, 164, '4'], [806, 672, '2']]) { const i = clusterSet.children.find(c => c.name === 'Size=S').createInstance(); i.name = 'Cluster · ' + n; area.insertChild(at, i); const t = i.findOne(k => k.type === 'TEXT'); if (t) await setText(t, n); i.x = Math.round(x - i.width / 2); i.y = Math.round(y - i.height / 2); }
  const sx = 760, sy = 320; const sel = mv('Club', 'Selected').createInstance(); sel.name = 'Marker · Club · selected'; area.insertChild(at, sel); sel.x = Math.round(sx - sel.width / 2); sel.y = Math.round(sy - sel.height / 2);
  const card = created.card.children[0].createInstance(); card.name = 'Map card · Riverside FC'; area.insertChild(at, card); card.x = sx + 40; card.y = sy - 50;
  const t1 = panel.findOne(n => n.type === 'TEXT' && n.name === 'Total'), t2 = panel.findOne(n => n.type === 'TEXT' && n.name === 'Breakdown'), t3 = panel.findOne(n => n.type === 'TEXT' && n.name === 'Show all');
  if (t1) await setText(t1, '20 in view'); if (t2) await setText(t2, '16 clubs · 4 stadiums'); if (t3) await setText(t3, 'Show all 20 results');
  const res = panel.findOne(n => n.name === 'Results'); const r0 = res && res.children[0]; if (r0) { r0.fills = [P(V('color/bg/subtle'))]; RAD(r0, 'radius/md'); r0.name = r0.name + ' · selected'; }
  report.info.card = Math.round(card.x) + ',' + Math.round(card.y) + ' ' + Math.round(card.width) + 'x' + Math.round(card.height) + ' (area ' + Math.round(area.width) + 'x' + Math.round(area.height) + ')';
  created.page = cp;
});

// 3. Kontrol ve Section boyutlari
await step('check', async () => {
  const gray = [], unst = []; const walk = n => { if ('fills' in n && n.fills !== figma.mixed) n.fills.forEach(f => { if (f.type === 'SOLID' && hex(f) === '#808080') gray.push(n.name); }); if (n.type === 'TEXT' && !n.textStyleId) unst.push(n.name); if ('children' in n) n.children.forEach(walk); };
  walk(created.page); report.info.grayFills = gray.length ? gray.slice(0, 8) : 'none'; report.info.unstyledText = unst.length ? unst.slice(0, 8) : 'none';
  let right = 0, bottom = 0; for (const ch of mapSec.children) { right = Math.max(right, ch.x + ch.width); bottom = Math.max(bottom, ch.y + ch.height); }
  mapSec.resizeWithoutConstraints(Math.max(mapSec.width, Math.ceil(right + 80)), Math.max(mapSec.height, Math.ceil(bottom + 80)));
  let r7 = 0, b7 = 0; for (const ch of sec7.children) { r7 = Math.max(r7, ch.x + ch.width); b7 = Math.max(b7, ch.y + ch.height); } sec7.resizeWithoutConstraints(Math.max(1200, Math.ceil(r7 + 80)), Math.ceil(b7 + 80));
  const ovl = []; const top = p02.children.filter(n => n.type === 'SECTION'); for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) { const a = top[i], b = top[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ovl.push(a.name + ' x ' + b.name); }
  report.info.overlap02 = ovl.length ? ovl : 'none'; report.info.mapSection = Math.round(mapSec.width) + 'x' + Math.round(mapSec.height) + ' · web ' + Math.round(web.width) + 'x' + Math.round(web.height);
});
return report;
