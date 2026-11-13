// step 387 · Faz 7 arama (2/4): mobil ekranlar. Managers & officials ve Intermediaries icin liste + Filters ekranlari (Mobile Section'in sagina 4 yuva)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
async function setText(t, s) { const f = t.fontName; if (f === figma.mixed) { await figma.loadFontAsync(t.getRangeFontName(0, 1)); } else { await figma.loadFontAsync(f); } t.characters = s; }
async function setIn(root, name, s) { const t = root.findOne(n => n.type === 'TEXT' && n.name === name); if (!t) throw new Error('metin yok: ' + name + ' / ' + root.name); await setText(t, s); }
const stateKey = n => Object.keys(n.componentProperties || {}).find(k => /^State/.test(k));
const stateOf = n => { const k = stateKey(n); return k ? n.componentProperties[k].value : null; };
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
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const sMob = mob.children.find(n => n.type === 'SECTION' && n.name === 'Search results');
const personSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Person result');
if (!sMob || !personSet) throw new Error('Mobile Search Section ya da Person result yok');
const NEW_RE = /Managers & officials|Intermediaries/;
const TAB_MGR = 'Managers & officials', TAB_INT = 'Intermediaries';
await step('Eski mobil ciktilari temizle', async () => { let n = 0; for (const c of sMob.children.slice()) if (/^Search \//.test(c.name) && NEW_RE.test(c.name)) { c.remove(); n++; } report.info.removed = n; });
const flagSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Flag');
let flagOpts = [];
if (flagSet) { const k = Object.keys(flagSet.componentPropertyDefinitions).find(x => /^Country/.test(x)); if (k) flagOpts = flagSet.componentPropertyDefinitions[k].variantOptions || []; }
const MGR = [
  { name: 'Tom Reilly', meta: 'Head coach · Riverside FC', want: 'Ireland', qual: 'License PRO', g: 'Male', action: 'Message' },
  { name: 'Ana Ferreira', meta: 'Referee', want: 'Portugal', qual: 'FIFA 1st', g: 'Female', action: 'Message' },
  { name: 'Jonas Richter', meta: 'Head coach · Spreeufer FC', want: 'Germany', qual: 'License A', g: 'Male', action: 'Message' },
  { name: 'Anna Vogel', meta: 'Sporting director · Spreeufer FC', want: 'Germany', qual: null, g: 'Female', action: 'Add to contacts' },
  { name: 'Daniel Brandt', meta: 'Chief scout · Northgate Athletic', want: 'Germany', qual: null, g: 'Male', action: 'Message' },
  { name: 'Sven Hoffmann', meta: 'Goalkeeping coach · Spreeufer FC', want: 'Germany', qual: 'License B', g: 'Male', action: 'Message' }
];
const INT = [
  { name: 'Sofia Lindqvist', meta: 'Intermediary · Northline Sports Agency', want: 'Sweden', qual: '14 clients', g: 'Female', action: 'Message' },
  { name: 'Marc Dubois', meta: 'Intermediary · Atelier Football Management', want: 'France', qual: '9 clients', g: 'Male', action: 'Message' },
  { name: 'Pieter Jansen', meta: 'Intermediary · Harbour Sports Partners', want: 'Netherlands', qual: '22 clients', g: 'Male', action: 'Message' },
  { name: 'Laura Keller', meta: 'Intermediary · Meridian Football Partners', want: 'Germany', qual: '6 clients', g: 'Female', action: 'Add to contacts' },
  { name: 'Tomasz Nowak', meta: 'Intermediary · Baltic Football Group', want: 'Poland', qual: '11 clients', g: 'Male', action: 'Message' },
  { name: 'Rui Almeida', meta: 'Intermediary · Riverbend Representation', want: 'Portugal', qual: '17 clients', g: 'Male', action: 'Message' }
];
const CFG = {
  mgr: { title: TAB_MGR, data: MGR, count: '27 managers & officials', show: 'Show 27 managers & officials', field: ['Role', 'All roles'], groups: [['License', ['A', 'B', 'C', 'PRO']], ['Referee category', ['FIFA 1st', 'FIFA 2nd', 'FIFA 3rd']]] },
  int: { title: TAB_INT, data: INT, count: '9 intermediaries', show: 'Show 9 intermediaries', field: ['Agency', 'All agencies'], groups: [] }
};
async function setChips(group, labels) {
  const chips = group.children.find(c => c.name === 'Chips'); const first = chips.children[0];
  while (chips.children.length < labels.length) chips.appendChild(first.clone());
  while (chips.children.length > labels.length) chips.children[chips.children.length - 1].remove();
  for (let i = 0; i < labels.length; i++) { const tx = chips.children[i].findOne(n => n.type === 'TEXT'); await setText(tx, labels[i]); }
}
async function buildPanel(f, cfg) {
  const panel = f.findOne(n => n.name === 'Filter panel');
  const pos = panel.children.find(c => c.name === 'Field · Position'); const age = panel.children.find(c => c.name === 'Field · Age'); const gen = panel.children.find(c => c.name === 'Gender');
  if (age) age.remove();
  await setIn(pos, 'Label', cfg.field[0]); await setIn(pos, 'Value', cfg.field[1]); pos.name = 'Field · ' + cfg.field[0];
  let at = panel.children.indexOf(gen);
  for (const gr of cfg.groups) { const c = gen.clone(); panel.insertChild(at++, c); c.name = gr[0]; await setIn(c, 'Group label', gr[0]); await setChips(c, gr[1]); }
  return panel;
}
const base = 100; const info = {};
async function deriveList(cfg, slot) {
  const src = sMob.children.find(c => c.name === 'Search / Players · Mobile'); if (!src) throw new Error('Search / Players · Mobile yok');
  const f = src.clone(); sMob.appendChild(f); f.name = 'Search / ' + cfg.title + ' · Mobile'; f.x = 80 + slot * 470; f.y = base;
  await clearNav(f);
  const tabs = f.findOne(n => n.name === 'Tabs' && n.type === 'FRAME');
  for (const t of tabs.children) { const want = t.name === 'Tab · ' + cfg.title ? 'Selected' : 'Default'; const k = stateKey(t); if (k && stateOf(t) !== want) t.setProperties({ [k]: want }); }
  const bar = f.findOne(n => n.name === 'Result bar');
  const ct = bar.children.find(n => n.type === 'TEXT'); if (!ct) throw new Error('Result bar metni yok'); await setText(ct, cfg.count); ct.name = cfg.count;
  const list = f.findOne(n => n.name === 'List card');
  const rows = list.children.filter(n => n.type === 'INSTANCE' && /^Player ·/.test(n.name));
  const picks = [];
  for (let i = 0; i < cfg.data.length; i++) {
    const row = rows[i], d = cfg.data[i];
    const v = personSet.children.find(x => x.name === 'Device=Mobile, Action=' + d.action + ', State=Default'); if (!v) throw new Error('varyant yok: ' + d.action);
    row.swapComponent(v); row.name = 'Person · ' + d.name;
    await setIn(row, 'Name', d.name); await setIn(row, 'Meta', d.meta);
    const facts = row.findAll(n => n.name === 'Fact' && n.type === 'FRAME'); const natF = facts[1], qualF = facts[2];
    const country = flagOpts.indexOf(d.want) >= 0 ? d.want : (flagOpts.length ? flagOpts[i % flagOpts.length] : d.want);
    picks.push(d.name + ': ' + country);
    await setIn(natF, 'Nation', country);
    const fl = natF.findOne(n => n.name === 'Flag'); if (fl) { try { const k = Object.keys(fl.componentProperties).find(x => /^Country/.test(x)); fl.setProperties({ [k]: country }); } catch (e) { report.errors.push('Flag ' + d.name + ': ' + e.message); } }
    if (d.qual) { await setIn(qualF, 'Value', d.qual); qualF.visible = true; } else { qualF.visible = false; }
    const sil = row.findOne(n => n.type === 'INSTANCE' && n.componentProperties && ('Gender' in n.componentProperties)); if (sil) { try { sil.setProperties({ Gender: d.g }); } catch (e) { report.errors.push('Silhouette ' + d.name + ': ' + e.message); } }
  }
  for (let i = rows.length - 1; i >= cfg.data.length; i--) { const r = rows[i]; const prev = list.children[list.children.indexOf(r) - 1]; r.remove(); if (prev && prev.name === 'Divider') prev.remove(); }
  const rr = list.children.filter(n => /^Person ·/.test(n.name));
  info[cfg.title + ' list'] = { frame: R(f.width) + 'x' + R(f.height), rowHeights: rr.map(r => R(r.height)), rowWidths: rr.map(r => R(r.width)), picks, tabsRight: R(tabs.width) };
  return f;
}
async function deriveFilters(cfg, slot) {
  const src = sMob.children.find(c => c.name === 'Search / Filters · Mobile'); if (!src) throw new Error('Search / Filters · Mobile yok');
  const f = src.clone(); sMob.appendChild(f); f.name = 'Search / Filters · ' + cfg.title + ' · Mobile'; f.x = 80 + slot * 470; f.y = base;
  await clearNav(f);
  const panel = await buildPanel(f, cfg);
  const btn = f.findOne(n => n.name === 'Button · Show results'); if (!btn) throw new Error('Button · Show results yok');
  const bt = btn.findOne(n => n.type === 'TEXT' && /^(Show|Label)/.test(n.name + n.characters)) || btn.findOne(n => n.type === 'TEXT'); await setText(bt, cfg.show);
  info[cfg.title + ' filters'] = { frame: R(f.width) + 'x' + R(f.height), panelKids: panel.children.map(c => c.name + ' ' + R(c.width) + 'x' + R(c.height)), button: bt.characters, buttonH: R(btn.height) };
  return f;
}
const frames = [];
await step('Managers & officials · Mobile', async () => { frames.push(await deriveList(CFG.mgr, 7)); });
await step('Intermediaries · Mobile', async () => { frames.push(await deriveList(CFG.int, 8)); });
await step('Filters · Managers & officials · Mobile', async () => { frames.push(await deriveFilters(CFG.mgr, 9)); });
await step('Filters · Intermediaries · Mobile', async () => { frames.push(await deriveFilters(CFG.int, 10)); });
report.info.screens = info;
await step('Section ve Mobile platformu', async () => {
  const right = Math.max.apply(null, sMob.children.map(c => c.x + c.width)); const bottom = Math.max.apply(null, sMob.children.map(c => c.y + c.height));
  sMob.resizeWithoutConstraints(Math.ceil(right + 80), Math.ceil(bottom + 80));
  if (mob.width < sMob.x + sMob.width + 120) mob.resizeWithoutConstraints(Math.ceil(sMob.x + sMob.width + 120), mob.height);
  report.info.sectionMoved = settle(mob, sMob);
  report.info.mobSection = R(sMob.width) + 'x' + R(sMob.height) + ' · Mobile ' + R(mob.width) + 'x' + R(mob.height);
});
await step('Kontrol', async () => {
  const bb = n => n.absoluteBoundingBox; const ov = []; const kids = sMob.children.filter(c => c.type === 'FRAME');
  for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) { const a = bb(kids[i]), b = bb(kids[j]); if (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y) ov.push(kids[i].name + ' x ' + kids[j].name); }
  report.info.screenOverlaps = ov.length ? ov : 'none';
  const secs = mob.children.filter(n => n.type === 'SECTION').sort((a, b) => a.y - b.y); const sov = [];
  for (let i = 0; i < secs.length - 1; i++) if (secs[i].y + secs[i].height > secs[i + 1].y) sov.push(secs[i].name + ' x ' + secs[i + 1].name);
  report.info.sectionOverlaps = sov.length ? sov : 'none';
  let unstyled = 0, dash = 0, wrapQ = [];
  for (const f of frames) for (const t of f.findAll(n => n.type === 'TEXT')) { if (typeof t.textStyleId === 'string' && t.textStyleId === '') unstyled++; if (t.characters.indexOf(String.fromCharCode(8212)) >= 0) dash++; }
  for (const f of frames) for (const r of f.findAll(n => n.type === 'INSTANCE' && /^Person ·/.test(n.name))) { const l = r.findAll(n => n.type === 'TEXT' && n.visible && n.name === 'Label'); for (const t of l) if (t.height > 20) wrapQ.push(r.name + ' ' + t.characters); }
  report.info.unstyledText = unstyled; report.info.longDash = dash; report.info.wrappedLabels = wrapQ.length ? wrapQ : 'none';
  report.info.flowStarts = p02.flowStartingPoints.length;
});
return JSON.stringify(report, null, 1);
