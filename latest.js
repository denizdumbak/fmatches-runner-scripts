// step 388 · Faz 7 arama (3/4): All results (masaustu + mobil) iki yeni grup alir (Managers & officials, Intermediaries); Web Search Section satirlari yeniden dizilir
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
async function setText(t, s) { const f = t.fontName; if (f === figma.mixed) { await figma.loadFontAsync(t.getRangeFontName(0, 1)); } else { await figma.loadFontAsync(f); } t.characters = s; }
async function setIn(root, name, s) { const t = root.findOne(n => n.type === 'TEXT' && n.name === name); if (!t) throw new Error('metin yok: ' + name + ' / ' + root.name); await setText(t, s); }
async function clearNav(root) {
  for (const n of [root].concat(root.findAll(() => true))) {
    try { const rs = n.reactions; if (!rs || !rs.length) continue; const keep = rs.filter(r => !(r.actions || (r.action ? [r.action] : [])).some(isNavAct)); if (keep.length !== rs.length) await n.setReactionsAsync(keep); } catch (e) {}
  }
}
function settle(plat, sec) {
  const secs = plat.children.filter(n => n.type === 'SECTION').sort((a, b) => a.y - b.y);
  let prev = null; const moved = [];
  for (const s of secs) { if (s === sec) { prev = s.y + s.height; continue; } if (prev === null) continue; if (s.y < prev + 160) { moved.push(s.name + ' ' + R(s.y) + ' -> ' + R(prev + 160)); s.y = prev + 160; } prev = s.y + s.height; }
  const bottom = Math.max.apply(null, plat.children.map(n => n.y + n.height));
  plat.resizeWithoutConstraints(plat.width, Math.ceil(bottom + 120));
  return moved;
}
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const sWeb = web.children.find(n => n.type === 'SECTION' && n.name === 'Search results');
const sMob = mob.children.find(n => n.type === 'SECTION' && n.name === 'Search results');
const personSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Person result');
if (!sWeb || !sMob || !personSet) throw new Error('Section ya da Person result yok');
const flagSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Flag');
let flagOpts = [];
if (flagSet) { const k = Object.keys(flagSet.componentPropertyDefinitions).find(x => /^Country/.test(x)); if (k) flagOpts = flagSet.componentPropertyDefinitions[k].variantOptions || []; }
const MGR = [
  { name: 'Tom Reilly', meta: 'Head coach · Riverside FC', want: 'Ireland', qual: 'License PRO', g: 'Male', action: 'Message' },
  { name: 'Ana Ferreira', meta: 'Referee', want: 'Portugal', qual: 'FIFA 1st', g: 'Female', action: 'Message' },
  { name: 'Jonas Richter', meta: 'Head coach · Spreeufer FC', want: 'Germany', qual: 'License A', g: 'Male', action: 'Message' }
];
const INT = [
  { name: 'Sofia Lindqvist', meta: 'Intermediary · Northline Sports Agency', want: 'Sweden', qual: '14 clients', g: 'Female', action: 'Message' },
  { name: 'Marc Dubois', meta: 'Intermediary · Atelier Football Management', want: 'France', qual: '9 clients', g: 'Male', action: 'Message' }
];
const GROUPS = [
  { title: 'Managers & officials', lc: 'managers & officials', n: '27', third: 'Qualification', data: MGR },
  { title: 'Intermediaries', lc: 'intermediaries', n: '9', third: 'Clients', data: INT }
];
async function rewriteHeading(g, G) {
  const head = g.findOne(n => n.name === 'Group heading'); const before = [], after = [];
  for (const t of head.findAll(n => n.type === 'TEXT')) {
    before.push(t.characters);
    let s = t.characters.replace(/Players/g, G.title).replace(/players/g, G.lc).replace(/\b84\b/g, G.n);
    if (s !== t.characters) await setText(t, s);
    after.push(t.characters);
  }
  return { before, after };
}
async function fixRows(g, G, device) {
  const list = g.findOne(n => n.name === 'List card');
  const head = list.findOne(n => n.name === 'Table header');
  if (head) for (const t of head.findAll(n => n.type === 'TEXT')) {
    if (t.characters === 'Player') await setText(t, 'Name');
    if (t.characters === 'Contract until') await setText(t, G.third);
    if (t.characters === 'Age') { const par = t.parent; if (par !== head && par.children.length === 1) par.visible = false; else t.visible = false; }
  }
  const rows = list.children.filter(n => n.type === 'INSTANCE' && /^Player ·/.test(n.name));
  for (let i = 0; i < G.data.length; i++) {
    const row = rows[i], d = G.data[i]; if (!row) throw new Error('satir yok ' + i);
    const v = personSet.children.find(x => x.name === 'Device=' + device + ', Action=' + d.action + ', State=Default'); if (!v) throw new Error('varyant yok');
    row.swapComponent(v); row.name = 'Person · ' + d.name;
    await setIn(row, 'Name', d.name); await setIn(row, 'Meta', d.meta);
    const facts = row.findAll(n => n.name === 'Fact' && n.type === 'FRAME'); const natF = facts[1], qualF = facts[2];
    const country = flagOpts.indexOf(d.want) >= 0 ? d.want : (flagOpts.length ? flagOpts[i % flagOpts.length] : d.want);
    await setIn(natF, 'Nation', country);
    const fl = natF.findOne(n => n.name === 'Flag'); if (fl) { try { const k = Object.keys(fl.componentProperties).find(x => /^Country/.test(x)); fl.setProperties({ [k]: country }); } catch (e) { report.errors.push('Flag ' + d.name + ': ' + e.message); } }
    if (d.qual) { await setIn(qualF, 'Value', d.qual); qualF.visible = true; } else if (device === 'Desktop') { qualF.visible = true; const v2 = qualF.findOne(n => n.type === 'TEXT' && n.name === 'Value'); if (v2) await setText(v2, ''); } else { qualF.visible = false; }
    const sil = row.findOne(n => n.type === 'INSTANCE' && n.componentProperties && ('Gender' in n.componentProperties)); if (sil) { try { sil.setProperties({ Gender: d.g }); } catch (e) { report.errors.push('Silhouette ' + d.name + ': ' + e.message); } }
  }
  for (let i = rows.length - 1; i >= G.data.length; i--) { const r = rows[i]; const prev = list.children[list.children.indexOf(r) - 1]; r.remove(); if (prev && prev.name === 'Divider') prev.remove(); }
  return list;
}
async function addGroups(frame, device) {
  const players = frame.findOne(n => n.type === 'FRAME' && /^Group · Players/.test(n.name));
  if (!players) throw new Error('Group · Players yok: ' + frame.name);
  const col = players.parent; const info = {};
  // eski turetmeleri temizle
  for (const c of col.children.slice()) if (/^Group · (Managers|Intermediaries)/.test(c.name)) c.remove();
  let at = col.children.indexOf(players) + 1;
  for (const G of GROUPS) {
    const g = players.clone(); col.insertChild(at++, g); g.name = 'Group · ' + G.title;
    await clearNav(g);
    const h = await rewriteHeading(g, G);
    const list = await fixRows(g, G, device);
    info[G.title] = { heading: h, rows: list.children.filter(n => /^Person ·/.test(n.name)).length, group: R(g.width) + 'x' + R(g.height) };
  }
  info.frame = R(frame.width) + 'x' + R(frame.height);
  info.groups = col.children.filter(n => /^Group ·/.test(n.name)).map(n => n.name);
  return info;
}
await step('All results · Desktop', async () => {
  const f = sWeb.children.find(c => c.name === 'Search / All results · Desktop'); if (!f) throw new Error('yok');
  report.info.desktopAll = await addGroups(f, 'Desktop');
});
await step('All results · Mobile', async () => {
  const f = sMob.children.find(c => c.name === 'Search / All results · Mobile'); if (!f) throw new Error('yok');
  report.info.mobileAll = await addGroups(f, 'Mobile');
});
await step('Web satirlari yeniden diz', async () => {
  const rows = [['All results', 'Players', 'Clubs'], ['Facilities', 'Events', 'No results'], ['Managers & officials', 'Intermediaries']];
  let y = 100; const log = [];
  for (const r of rows) {
    let h = 0;
    for (const nm of r) { const f = sWeb.children.find(c => c.name === 'Search / ' + nm + ' · Desktop'); if (!f) { report.errors.push('ekran yok: ' + nm); continue; } if (Math.abs(f.y - y) > 0.5) log.push(nm + ' ' + R(f.y) + ' -> ' + R(y)); f.y = y; h = Math.max(h, f.height); }
    y += h + 151;
  }
  const bottom = Math.max.apply(null, sWeb.children.map(c => c.y + c.height));
  sWeb.resizeWithoutConstraints(sWeb.width, Math.ceil(bottom + 80));
  report.info.rowMoves = log; report.info.sectionMovedWeb = settle(web, sWeb);
  report.info.webSection = R(sWeb.width) + 'x' + R(sWeb.height) + ' · Web ' + R(web.width) + 'x' + R(web.height);
});
await step('Mobile Section', async () => {
  const bottom = Math.max.apply(null, sMob.children.map(c => c.y + c.height));
  sMob.resizeWithoutConstraints(sMob.width, Math.ceil(bottom + 80));
  report.info.sectionMovedMob = settle(mob, sMob);
  report.info.mobSection = R(sMob.width) + 'x' + R(sMob.height) + ' · Mobile ' + R(mob.width) + 'x' + R(mob.height);
});
await step('Kontrol', async () => {
  const bb = n => n.absoluteBoundingBox;
  for (const [nm, sec] of [['web', sWeb], ['mobile', sMob]]) {
    const ov = []; const kids = sec.children.filter(c => c.type === 'FRAME');
    for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) { const a = bb(kids[i]), b = bb(kids[j]); if (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y) ov.push(kids[i].name + ' x ' + kids[j].name); }
    report.info[nm + 'ScreenOverlaps'] = ov.length ? ov : 'none';
  }
  let unstyled = 0, dash = 0;
  for (const sec of [sWeb, sMob]) for (const f of sec.children.filter(c => /All results/.test(c.name))) for (const t of f.findAll(n => n.type === 'TEXT')) { if (typeof t.textStyleId === 'string' && t.textStyleId === '') unstyled++; if (t.characters.indexOf(String.fromCharCode(8212)) >= 0) dash++; }
  report.info.unstyledText = unstyled; report.info.longDash = dash; report.info.flowStarts = p02.flowStartingPoints.length;
  const wsecs = web.children.filter(n => n.type === 'SECTION').sort((a, b) => a.y - b.y); const sov = [];
  for (let i = 0; i < wsecs.length - 1; i++) if (wsecs[i].y + wsecs[i].height > wsecs[i + 1].y) sov.push(wsecs[i].name + ' x ' + wsecs[i + 1].name);
  report.info.webSectionOverlaps = sov.length ? sov : 'none';
});
return JSON.stringify(report, null, 1);
