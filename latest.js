// step 216 · Map / Match requests · Desktop + Map / Stadium card · Desktop (Events sayfasinin kopyasindan)

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

const cardSet = set01('Map card');
async function buildPage(pageName, cfg) {
  const ev = mapSec.children.find(n => n.name === 'Map / Events · Desktop'); if (!ev) throw new Error('events page missing');
  const old = mapSec.children.find(n => n.name === pageName); if (old) old.remove();
  const prev = mapSec.children.filter(n => /^Map \//.test(n.name) && n.name !== pageName).sort((a, b) => b.x - a.x)[0];
  const cp = ev.clone(); cp.name = pageName; mapSec.appendChild(cp); cp.x = prev.x + prev.width + 480; cp.y = ev.y;
  const area = cp.findOne(n => n.name === 'Map area'), panel = cp.findOne(n => n.name === 'Map panel');
  // marker turu
  let keep = 0;
  for (const m of area.children.slice()) {
    if (m.name === 'Marker · Event') { if (keep >= cfg.singles) { m.remove(); continue; } keep++; m.swapComponent(mv(cfg.marker, 'Default')); m.name = 'Marker · ' + cfg.marker; }
    else if (m.name === 'Marker · Event · selected') { m.swapComponent(mv(cfg.marker, 'Selected')); m.name = 'Marker · ' + cfg.marker + ' · selected'; }
    else if (/^Cluster ·/.test(m.name)) { if (cfg.clusters.indexOf(m.name.replace('Cluster · ', '')) < 0) m.remove(); }
  }
  // kart
  const oc = area.findOne(n => /^Map card/.test(n.name)); const nc = cardSet.children.find(v => v.name === 'Kind=' + cfg.kind).createInstance();
  nc.name = 'Map card · ' + cfg.card.name; area.appendChild(nc); nc.x = oc.x; nc.y = oc.y; oc.remove();
  await setIn(nc, 'Name', cfg.card.name); await setIn(nc, 'Meta', cfg.card.meta); await setIn(nc, 'Location', cfg.card.loc); if (cfg.card.date) await setIn(nc, 'Date', cfg.card.date);
  // filtreler
  const filters = cp.findOne(n => n.name === 'Filters'); report.info[pageName + ' switcher'] = await applySwitcher(cp, cfg.switcher);
  for (const nm of cfg.dropFields) { const f = filters.findOne(n => n.name === 'Field · ' + nm); if (f) f.remove(); }
  if (cfg.dates) { const f = filters.findOne(n => n.name === 'Field · Dates'); if (f) await setIn(f, 'Value', cfg.dates); }
  // panel
  const t1 = panel.findOne(n => n.type === 'TEXT' && n.name === 'Total'), t2 = panel.findOne(n => n.type === 'TEXT' && n.name === 'Breakdown'), t3 = panel.findOne(n => n.type === 'TEXT' && n.name === 'Show all');
  if (t1) await setText(t1, cfg.total); if (t2) await setText(t2, 'Berlin and surroundings'); if (t3) await setText(t3, cfg.showAll);
  const res = panel.findOne(n => n.name === 'Results');
  for (let i = 0; i < res.children.length && i < cfg.rows.length; i++) {
    const row = res.children[i]; await setIn(row, 'Name', cfg.rows[i][0]); await setIn(row, 'Meta', cfg.rows[i][1]);
    const ic = row.findOne(n => n.type === 'INSTANCE' && n.name === 'Map marker'); if (ic) ic.swapComponent(mv(cfg.marker, 'Default'));
  }
  const A = nc.absoluteBoundingBox; const hits = [];
  for (const o of area.children) { if (o === nc || !o.visible || /^Map (base|tint)/.test(o.name)) continue; const B = o.absoluteBoundingBox; if (B && A.x < B.x + B.width && B.x < A.x + A.width && A.y < B.y + B.height && B.y < A.y + A.height) hits.push(o.name); }
  report.info[pageName + ' cardOverlaps'] = hits.length ? hits : 'none';
  report.info[pageName + ' counts'] = 'singles ' + area.children.filter(n => /^Marker · /.test(n.name) && !/selected/.test(n.name)).length + ' · clusters ' + area.children.filter(n => /^Cluster ·/.test(n.name)).length + ' · filters ' + filters.children.map(n => n.name).join(', ');
  return cp;
}

await step('Map / Match requests · Desktop', async () => {
  created.req = await buildPage('Map / Match requests · Desktop', {
    kind: 'Match request', marker: 'Match request', switcher: 'Requests', singles: 6, clusters: ['2'], dropFields: ['Event type'], dates: 'Sat 8 – Sun 9 Nov',
    card: { name: 'Nordpark SC', meta: 'Fifth Division · Tier 5', date: 'Sat 8 – Sun 9 Nov', loc: 'Wedding, Berlin' },
    total: '9 requests in view', showAll: 'Show all 9 requests',
    rows: [['Nordpark SC', 'Sat 8 – Sun 9 Nov · Wedding'], ['Havelblick United', 'Sun 9 Nov · Spandau'], ['Spreeufer FC', 'Sat 15 Nov · Mitte']]
  });
});
await step('Map / Stadium card · Desktop', async () => {
  created.std = await buildPage('Map / Stadium card · Desktop', {
    kind: 'Stadium', marker: 'Stadium', switcher: 'Stadiums', singles: 5, clusters: ['2'], dropFields: ['Event type', 'Dates'], dates: null,
    card: { name: 'Spreeufer Stadium', meta: 'Natural grass · 4,200 capacity', date: null, loc: 'Mitte, Berlin' },
    total: '8 stadiums in view', showAll: 'Show all 8 stadiums',
    rows: [['Spreeufer Stadium', 'Natural grass · 4,200 · Mitte'], ['Nordpark Sportplatz', 'Artificial turf · 1,800 · Wedding'], ['Havelblick Arena', 'Natural grass · 3,100 · Spandau']]
  });
});

await step('check', async () => {
  const gray = [], unst = []; const walk = n => { if ('fills' in n && n.fills !== figma.mixed) n.fills.forEach(f => { if (f.type === 'SOLID' && hex(f) === '#808080') gray.push(n.name); }); if (n.type === 'TEXT' && !n.textStyleId) unst.push(n.name); if ('children' in n) n.children.forEach(walk); };
  for (const p of [created.req, created.std]) if (p) walk(p);
  report.info.grayFills = gray.length ? gray.slice(0, 8) : 'none'; report.info.unstyledText = unst.length ? unst.slice(0, 8) : 'none';
  let right = 0, bottom = 0; for (const ch of mapSec.children) { right = Math.max(right, ch.x + ch.width); bottom = Math.max(bottom, ch.y + ch.height); }
  mapSec.resizeWithoutConstraints(Math.max(mapSec.width, Math.ceil(right + 80)), Math.max(mapSec.height, Math.ceil(bottom + 80)));
  const ovl = []; const top = p02.children.filter(n => n.type === 'SECTION'); for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) { const a = top[i], b = top[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ovl.push(a.name + ' x ' + b.name); }
  report.info.overlap02 = ovl.length ? ovl : 'none'; report.info.mapSection = Math.round(mapSec.width) + 'x' + Math.round(mapSec.height) + ' · web ' + Math.round(web.width) + 'x' + Math.round(web.height);
  report.info.mapPages = mapSec.children.map(c => c.name).join(' | ');
});
return report;
