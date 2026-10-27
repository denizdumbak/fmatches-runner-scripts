// step 230 · Prototype for the map: desktop + mobile ideal flows (NAVIGATE only, hover reactions kept), Home nav -> Interactive map, flow starts

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync(); await figma.setCurrentPageAsync(p02);
const nav = dest => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web'); const mob = p02.children.find(n => n.type === 'SECTION' && /^Mobile/.test(n.name));
const dMap = web.children.find(n => n.type === 'SECTION' && n.name === 'Map'); const mMap = mob.children.find(n => n.type === 'SECTION' && n.name === 'Map');
const D = {}, M = {};
for (const n of dMap.children) if (/ · Desktop$/.test(n.name)) D[n.name.replace(' · Desktop', '')] = n;
for (const n of mMap.children) if (/ · Mobile$/.test(n.name)) M[n.name.replace(' · Mobile', '')] = n;
report.info.desktopScreens = Object.keys(D).length; report.info.mobileScreens = Object.keys(M).length;
const LINKS = [];
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
async function clearNav(pg) { let c = 0; for (const n of [pg].concat(pg.findAll(x => x.reactions && x.reactions.length))) { const keep = n.reactions.filter(rx => !(rx.actions || []).some(isNavAct)); if (keep.length !== n.reactions.length) { try { await n.setReactionsAsync(keep); c++; } catch (e) { report.errors.push('clear ' + n.name + ': ' + e.message); } } } return c; }
const findText = (root, str) => root.findOne(n => n.type === 'TEXT' && n.characters === str);
function tapTarget(t, stop) { let n = t; const p = n.parent; if (p && p !== stop && p.type !== 'SECTION' && !/ · (Desktop|Mobile)$/.test(p.name) && p.children && p.children.length <= 3) n = p; return n; }
async function link(label, el, dest) { if (!el) { report.errors.push('missing element: ' + label); return; } if (!dest) { report.errors.push('missing destination: ' + label); return; } try { await el.setReactionsAsync((el.reactions || []).filter(rx => !(rx.actions || []).some(isNavAct)).concat([nav(dest)])); LINKS.push(label + ' -> ' + dest.name); } catch (e) { report.errors.push('link ' + label + ': ' + e.message); } }
async function segLinks(pg, pgName, dests) { const sw = pg.findOne(n => n.name === 'Type switcher'); if (!sw) { report.errors.push('no Type switcher on ' + pgName); return; } for (const [lab, dn] of dests) { if (dn === pgName) continue; const t = findText(sw, lab); await link(pgName + ' · switcher ' + lab, t && tapTarget(t, sw), SEGDEST[dn]); } }

// 1. clear old page navigation on map screens
await step('clear map navigation', async () => { let c = 0; for (const pg of Object.values(D).concat(Object.values(M))) c += await clearNav(pg); report.info.cleared = c; });

// 2. desktop
const SEGDEST = { Default: D['Map / Default'], 'Stadium card': D['Map / Stadium card'], Events: D['Map / Events'], 'Match requests': D['Map / Match requests'] };
await step('desktop flow', async () => {
  const G = {}; for (const k of Object.keys(D)) G[k.replace('Map / ', '')] = D[k];
  const SEGD = { Clubs: 'Default', Stadiums: 'Stadium card', Events: 'Events', Requests: 'Match requests' };
  const dd = {}; for (const k of Object.keys(SEGD)) dd[k] = SEGD[k];
  for (const k of ['Default', 'Club card', 'Events', 'Match requests', 'Stadium card']) { SEGDEST[k] = G[k]; }
  SEGDEST['Club card'] = G['Club card'];
  // segment destinations: Clubs -> Club card is NOT used, Clubs -> Default
  for (const pgName of ['Default', 'Club card', 'Events', 'Match requests', 'Stadium card']) {
    const pg = G[pgName]; if (!pg) { report.errors.push('desktop page missing: ' + pgName); continue; }
    const sw = pg.findOne(n => n.name === 'Type switcher'); if (!sw) { report.errors.push('no Type switcher on ' + pgName); continue; }
    for (const [lab, dn] of Object.entries(SEGD)) { if (dn === pgName || (pgName === 'Club card' && dn === 'Default')) continue; const t = findText(sw, lab); await link('Desktop ' + pgName + ' · ' + lab, t && tapTarget(t, sw), G[dn]); }
  }
  // Default: biggest cluster -> Club card
  const cl = G['Default'].findOne(n => n.type === 'INSTANCE' && n.name === 'Cluster · 439') || G['Default'].findOne(n => n.type === 'INSTANCE' && /^Cluster/.test(n.name)); await link('Desktop Default · cluster', cl, G['Club card']);
  // Club card: View stadium -> Stadium card
  const cc = G['Club card'].findOne(n => n.type === 'INSTANCE' && /^Map card/.test(n.name)); const vs = cc && findText(cc, 'View stadium'); await link('Desktop Club card · View stadium', vs && tapTarget(vs, cc), G['Stadium card']);
  // Stadium card: View club -> Club card
  const sc = G['Stadium card'].findOne(n => n.type === 'INSTANCE' && /^Map card/.test(n.name)); const vc = sc && findText(sc, 'View club'); await link('Desktop Stadium card · View club', vc && tapTarget(vc, sc), G['Club card']);
  // Scouts: ask -> results
  const sh = G['Scouts near you · ask'].findOne(n => /Show scouts/.test(n.name) && n.type !== 'TEXT'); await link('Desktop Scouts ask · Show scouts', sh, G['Scouts near you']);
  // Home nav -> Interactive map
  for (const hn of ['Home / Main · Desktop', 'Home / Main / Slide 2 · Desktop', 'Home / Main / Slide 3 · Desktop', 'Home / Main / Calendar view · Desktop']) {
    const hp = web.findOne(n => n.type === 'FRAME' && n.name === hn); if (!hp) { report.errors.push('home missing: ' + hn); continue; }
    const nv = hp.children.find(c => c.name === 'Navigation'); const t = nv && findText(nv, 'Interactive map'); await link(hn + ' · nav Interactive map', t, G['Default']);
  }
});

// 3. mobile
await step('mobile flow', async () => {
  const G = {}; for (const k of Object.keys(M)) G[k.replace('Map / ', '')] = M[k];
  const need = ['Default', 'Club card', 'List', 'Stadium card', 'Events', 'Match requests', 'Scouts near you', 'Filters']; for (const k of need) if (!G[k]) throw new Error('mobile page missing: ' + k);
  const cl = G['Default'].findOne(n => n.type === 'INSTANCE' && n.name === 'Cluster · 439') || G['Default'].findOne(n => n.type === 'INSTANCE' && /^Cluster/.test(n.name)); await link('Mobile Default · cluster', cl, G['Club card']);
  const cc = G['Club card'].findOne(n => n.type === 'INSTANCE' && /^Map card/.test(n.name)); const vs = cc && findText(cc, 'View stadium'); await link('Mobile Club card · View stadium', vs && tapTarget(vs, cc), G['Stadium card']);
  const sc = G['Stadium card'].findOne(n => n.type === 'INSTANCE' && /^Map card/.test(n.name)); const vc = sc && findText(sc, 'View club'); await link('Mobile Stadium card · View club', vc && tapTarget(vc, sc), G['Club card']);
  for (const k of ['Default', 'Club card', 'Stadium card', 'Events', 'Match requests']) { const sheet = G[k].findOne(n => n.type === 'INSTANCE' && /^Bottom sheet/.test(n.name)); await link('Mobile ' + k + ' · sheet', sheet, G['List']); }
  const sw = G['List'].findOne(n => n.name === 'Type switcher'); const MS = { Clubs: 'Club card', Stadiums: 'Stadium card', Events: 'Events', Requests: 'Match requests' };
  for (const [lab, dn] of Object.entries(MS)) { const t = sw && findText(sw, lab); await link('Mobile List · switcher ' + lab, t && tapTarget(t, sw), G[dn]); }
  const cx = G['Filters'].findOne(n => n.name === 'Close'); await link('Mobile Filters · Close', cx, G['List']);
  const sb = G['Filters'].findOne(n => n.type === 'INSTANCE' && /^Button · Show/.test(n.name)); await link('Mobile Filters · Show clubs', sb, G['List']);
});

// 4. flow starting points
await step('flow starts', async () => {
  const names = ['Web · Interactive map', 'Web · Scouts near you', 'Mobile · Interactive map', 'Mobile · Scouts near you'];
  const keep = []; for (const s of (p02.flowStartingPoints || [])) { if (names.indexOf(s.name) >= 0) continue; keep.push({ nodeId: s.nodeId, name: s.name }); }
  keep.push({ nodeId: D['Map / Default'].id, name: names[0] }, { nodeId: D['Map / Scouts near you · ask'].id, name: names[1] }, { nodeId: M['Map / Default'].id, name: names[2] }, { nodeId: M['Map / Scouts near you'].id, name: names[3] });
  p02.flowStartingPoints = keep; report.info.flowStarts = keep.length;
});

// 5. self-check: all NAVIGATE destinations of the map screens resolve to screens
const screensById = {}; for (const pg of Object.values(D).concat(Object.values(M))) screensById[pg.id] = pg;
let broken = 0, total = 0; const per = [];
for (const pg of Object.values(D).concat(Object.values(M))) { let c = 0; for (const n of [pg].concat(pg.findAll(x => x.reactions && x.reactions.length))) for (const rx of n.reactions) for (const a of (rx.actions || [])) if (isNavAct(a)) { c++; total++; if (!screensById[a.destinationId]) { const dn = await figma.getNodeByIdAsync(a.destinationId); if (!dn) broken++; } } per.push(pg.name.replace('Map / ', '') + ':' + c); }
report.info.links = LINKS.length; report.info.navTotal = total; report.info.broken = broken; report.info.perScreen = per.join(' | ');
report.info.linkList = LINKS;
return report;
