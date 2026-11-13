// step 385 · Faz 7 arama (1/4): Person result component'i (01), iki yeni sekme (Managers & officials, Intermediaries) tum arama ekranlarinda, iki masaustu ekrani (Web Section'in 3. satiri)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
async function setText(t, s) {
  const f = t.fontName;
  if (f === figma.mixed) { await figma.loadFontAsync(t.getRangeFontName(0, 1)); } else { await figma.loadFontAsync(f); }
  t.characters = s;
}
async function setIn(root, name, s) {
  const t = root.findOne(n => n.type === 'TEXT' && n.name === name);
  if (!t) throw new Error('metin yok: ' + name + ' / ' + root.name);
  await setText(t, s);
}
const stateKey = n => Object.keys(n.componentProperties || {}).find(k => /^State/.test(k));
const stateOf = n => { const k = stateKey(n); return k ? n.componentProperties[k].value : null; };
async function clearNav(root) {
  const all = [root].concat(root.findAll(() => true));
  for (const n of all) {
    try {
      const rs = n.reactions; if (!rs || !rs.length) continue;
      const keep = rs.filter(r => !(r.actions || (r.action ? [r.action] : [])).some(isNavAct));
      if (keep.length !== rs.length) await n.setReactionsAsync(keep);
    } catch (e) {}
  }
}
function settle(plat, sec) {
  const secs = plat.children.filter(n => n.type === 'SECTION').sort((a, b) => a.y - b.y);
  let prevBottom = null; const moved = [];
  for (const s of secs) {
    if (s === sec) { prevBottom = s.y + s.height; continue; }
    if (prevBottom === null) continue;
    if (s.y < prevBottom + 160) { moved.push(s.name + ' ' + R(s.y) + ' -> ' + R(prevBottom + 160)); s.y = prevBottom + 160; }
    prevBottom = s.y + s.height;
  }
  const bottom = Math.max.apply(null, plat.children.map(n => n.y + n.height));
  plat.resizeWithoutConstraints(plat.width, Math.ceil(bottom + 120));
  return moved;
}
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const sWeb = web.children.find(n => n.type === 'SECTION' && n.name === 'Search results');
const sMob = mob.children.find(n => n.type === 'SECTION' && n.name === 'Search results');
if (!sWeb || !sMob) throw new Error('Search results Section yok');
report.info.flowStartsBefore = p02.flowStartingPoints.length;
const NEW_RE = /Managers & officials|Intermediaries/;

// ---------- 0. temizlik (tekrar calistirilabilir)
await step('Eski ciktilari temizle', async () => {
  let n = 0;
  for (const c of sWeb.children.slice()) if (/^Search \//.test(c.name) && NEW_RE.test(c.name)) { c.remove(); n++; }
  const old = p01.findOne(n2 => n2.type === 'COMPONENT_SET' && n2.name === 'Person result');
  if (old) { old.remove(); n++; }
  report.info.removed = n;
});

// ---------- 1. Person result component
let personSet = null;
await step('Person result component', async () => {
  await figma.setCurrentPageAsync(p01);
  const ps = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Player result');
  if (!ps) throw new Error('Player result set yok');
  const sec = ps.parent;
  const clones = []; let y = 0; const log = [];
  for (const v of ps.children) {
    const c = v.clone(); sec.appendChild(c); c.x = 0; c.y = y; y += c.height + 24;
    const star = c.findOne(n => n.name === 'Icon button · Shortlist'); if (star) star.visible = false;
    const facts = c.findAll(n => n.name === 'Fact' && n.type === 'FRAME');
    for (const f of facts) {
      const lab = f.findOne(n => n.type === 'TEXT' && n.name === 'Label');
      const lt = lab ? lab.characters : '';
      if (lt === 'Age') f.visible = false;
      if (lt === 'Contract until') { await setText(lab, 'Qualification'); const val = f.findOne(n => n.type === 'TEXT' && n.name === 'Value'); if (val) await setText(val, 'License PRO'); }
    }
    await setIn(c, 'Name', 'Tom Reilly');
    await setIn(c, 'Meta', 'Head coach · Riverside FC');
    clones.push(c); log.push(c.name + ' facts=' + facts.length);
  }
  const ns = figma.combineAsVariants(clones, sec);
  ns.name = 'Person result';
  const others = sec.children.filter(n => n !== ns);
  const bottom = Math.max.apply(null, others.map(n => n.y + n.height));
  ns.x = ps.x; ns.y = bottom + 120;
  sec.resizeWithoutConstraints(Math.max(sec.width, ns.x + ns.width + 80), Math.max(sec.height, ns.y + ns.height + 80));
  // hover baglantilari (klon reactions'i tasimaz)
  for (const v of ns.children) {
    if (stateOf(v) !== 'Default') continue;
    const hov = ns.children.find(h => h.name === v.name.replace('State=Default', 'State=Hover'));
    if (!hov) { report.errors.push('Hover varyanti yok: ' + v.name); continue; }
    await v.setReactionsAsync([{ trigger: { type: 'ON_HOVER' }, actions: [{ type: 'NODE', destinationId: hov.id, navigation: 'CHANGE_TO', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.15 }, preserveScrollPosition: false, resetVideoPosition: false }] }]);
  }
  personSet = ns;
  const bb = n => n.absoluteBoundingBox;
  const ov = [];
  for (const o of others) { const a = bb(ns), b = bb(o); if (a && b && a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y) ov.push(o.name); }
  report.info.personSet = { variants: ns.children.map(v => v.name + ' ' + R(v.width) + 'x' + R(v.height)), at: R(ns.x) + ',' + R(ns.y) + ' ' + R(ns.width) + 'x' + R(ns.height), overlaps: ov.length ? ov : 'none', section: sec.name, log };
  const d = ns.children.find(v => v.name === 'Device=Desktop, Action=Message, State=Default');
  if (d) { const a = d.findOne(n => n.name === 'Actions'); const b = a && a.findOne(n => /^Button/.test(n.name)); report.info.desktopActions = a ? R(a.width) + ' / button ' + (b ? R(b.width) : '-') : 'Actions yok'; }
  await figma.setCurrentPageAsync(p02);
});
await figma.setCurrentPageAsync(p02);

// ---------- 2. iki yeni sekme, mevcut tum arama ekranlarinda (masaustu + mobil)
const TAB_MGR = 'Managers & officials', TAB_INT = 'Intermediaries';
async function addTabs(screen) {
  const tabs = screen.findOne(n => n.name === 'Tabs' && n.type === 'FRAME');
  if (!tabs) return 'Tabs yok';
  if (tabs.children.some(n => n.name === 'Tab · ' + TAB_MGR)) return 'zaten var';
  const players = tabs.children.find(n => n.name === 'Tab · Players');
  const src = tabs.children.find(n => n.type === 'INSTANCE' && stateOf(n) === 'Default');
  if (!players || !src) return 'Players/Default sekme yok';
  const idx = tabs.children.indexOf(players) + 1;
  const names = [TAB_MGR, TAB_INT];
  for (let i = 0; i < 2; i++) {
    const t = src.clone(); tabs.insertChild(idx + i, t); t.name = 'Tab · ' + names[i];
    try { await t.setReactionsAsync([]); } catch (e) {}
    const tx = t.findOne(n => n.type === 'TEXT'); await setText(tx, names[i]);
    try { t.layoutSizingHorizontal = 'HUG'; } catch (e) {}
  }
  return 'eklendi, Tabs ' + R(tabs.width) + ' px';
}
await step('Sekmeler (mevcut ekranlar)', async () => {
  const out = {};
  for (const [plat, sec] of [['Web', sWeb], ['Mobile', sMob]]) for (const f of sec.children) { if (f.type !== 'FRAME' || !/^Search \//.test(f.name) || NEW_RE.test(f.name)) continue; out[plat + ' · ' + f.name] = await addTabs(f); }
  report.info.tabs = out;
});

// ---------- 3. masaustu ekranlari
const flagSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Flag');
let flagOpts = [];
if (flagSet) { const k = Object.keys(flagSet.componentPropertyDefinitions).find(x => /^Country/.test(x)); if (k) flagOpts = flagSet.componentPropertyDefinitions[k].variantOptions || []; }
report.info.flagOptions = flagOpts;
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
const base = Math.max.apply(null, sWeb.children.filter(c => !NEW_RE.test(c.name)).map(c => c.y + c.height)) + 151;
const nat = {};
async function setChips(group, labels) {
  const chips = group.children.find(c => c.name === 'Chips');
  const first = chips.children[0];
  while (chips.children.length < labels.length) chips.appendChild(first.clone());
  while (chips.children.length > labels.length) chips.children[chips.children.length - 1].remove();
  for (let i = 0; i < labels.length; i++) { const ch = chips.children[i]; const tx = ch.findOne(n => n.type === 'TEXT'); await setText(tx, labels[i]); }
}
async function derive(cfg) {
  const players = sWeb.children.find(c => c.name === 'Search / Players · Desktop');
  if (!players) throw new Error('Search / Players · Desktop yok');
  const f = players.clone(); sWeb.appendChild(f);
  f.name = 'Search / ' + cfg.title + ' · Desktop'; f.x = cfg.x; f.y = base;
  await clearNav(f);
  // sekmeler
  const tabs = f.findOne(n => n.name === 'Tabs' && n.type === 'FRAME');
  for (const t of tabs.children) {
    const want = t.name === 'Tab · ' + cfg.title ? 'Selected' : 'Default';
    const k = stateKey(t); if (k && stateOf(t) !== want) t.setProperties({ [k]: want });
  }
  // sayac
  await setIn(f, 'Result count', cfg.count);
  // filtre paneli
  const panel = f.findOne(n => n.name === 'Filter panel');
  const pos = panel.children.find(c => c.name === 'Field · Position');
  const age = panel.children.find(c => c.name === 'Field · Age');
  const gen = panel.children.find(c => c.name === 'Gender');
  if (age) age.remove();
  await setIn(pos, 'Label', cfg.field[0]); await setIn(pos, 'Value', cfg.field[1]); pos.name = 'Field · ' + cfg.field[0];
  let at = panel.children.indexOf(gen);
  for (const gr of cfg.groups) {
    const c = gen.clone(); panel.insertChild(at++, c); c.name = gr[0];
    await setIn(c, 'Group label', gr[0]); await setChips(c, gr[1]);
  }
  // tablo basligi
  const list = f.findOne(n => n.name === 'List card');
  const head = list.findOne(n => n.name === 'Table header');
  const hts = head.findAll(n => n.type === 'TEXT');
  for (const t of hts) {
    if (t.characters === 'Player') await setText(t, 'Name');
    if (t.characters === 'Contract until') await setText(t, cfg.third);
    if (t.characters === 'Age') { const par = t.parent; if (par !== head && par.children.length === 1) par.visible = false; else t.visible = false; }
  }
  // satirlar
  const rows = list.children.filter(n => n.type === 'INSTANCE' && /^Player ·/.test(n.name));
  if (rows.length < cfg.data.length) throw new Error('satir sayisi yetersiz: ' + rows.length);
  const picks = [];
  for (let i = 0; i < cfg.data.length; i++) {
    const row = rows[i], d = cfg.data[i];
    const v = personSet.children.find(x => x.name === 'Device=Desktop, Action=' + d.action + ', State=Default');
    if (!v) throw new Error('varyant yok: ' + d.action);
    row.swapComponent(v); row.name = 'Person · ' + d.name;
    await setIn(row, 'Name', d.name); await setIn(row, 'Meta', d.meta);
    const facts = row.findAll(n => n.name === 'Fact' && n.type === 'FRAME');
    const natF = facts[1], qualF = facts[2];
    let country = flagOpts.indexOf(d.want) >= 0 ? d.want : (flagOpts.length ? flagOpts[i % flagOpts.length] : d.want);
    picks.push(d.name + ': ' + d.want + (country === d.want ? '' : ' -> ' + country));
    await setIn(natF, 'Nation', country);
    const fl = natF.findOne(n => n.name === 'Flag');
    if (fl) { try { const k = Object.keys(fl.componentProperties).find(x => /^Country/.test(x)); fl.setProperties({ [k]: country }); } catch (e) { report.errors.push('Flag ' + d.name + ': ' + e.message); } }
    if (d.qual) { await setIn(qualF, 'Value', d.qual); qualF.visible = true; } else { qualF.visible = false; }
    const sil = row.findOne(n => n.type === 'INSTANCE' && n.componentProperties && ('Gender' in n.componentProperties));
    if (sil) { try { sil.setProperties({ Gender: d.g }); } catch (e) { report.errors.push('Silhouette ' + d.name + ': ' + e.message); } }
  }
  // fazla satir ve ayiraclar
  for (let i = rows.length - 1; i >= cfg.data.length; i--) {
    const r = rows[i]; const prev = list.children[list.children.indexOf(r) - 1];
    r.remove(); if (prev && prev.name === 'Divider') prev.remove();
  }
  // hiza olcumu: baslik ile ilk satir
  const hx = n => { const b = n.absoluteBoundingBox; return b ? R(b.x) : null; };
  const hn = head.findOne(n => n.type === 'TEXT' && n.characters === 'Nationality');
  const h3 = head.findOne(n => n.type === 'TEXT' && n.characters === cfg.third);
  const r0 = list.children.find(n => /^Person ·/.test(n.name)); const f0 = r0.findAll(n => n.name === 'Fact' && n.type === 'FRAME');
  const hh = head.findAll(n => n.type === 'TEXT').filter(t => t.visible).map(t => t.characters + '@' + (hx(t) - hx(head)));
  nat[cfg.title] = { picks, headerTexts: hh, natDx: (hn && f0[1]) ? hx(hn) - hx(f0[1]) : 'n/a', thirdDx: (h3 && f0[2]) ? hx(h3) - hx(f0[2]) : 'n/a', frame: R(f.width) + 'x' + R(f.height), panel: R(panel.width) + 'x' + R(panel.height), panelKids: panel.children.map(c => c.name + ' ' + R(c.width) + 'x' + R(c.height)) };
  return f;
}
const frames = [];
await step('Managers & officials · Desktop', async () => {
  frames.push(await derive({ title: TAB_MGR, x: 80, count: `27 managers & officials for “riverside”`, field: ['Role', 'All roles'], groups: [['License', ['A', 'B', 'C', 'PRO']], ['Referee category', ['FIFA 1st', 'FIFA 2nd', 'FIFA 3rd']]], third: 'Qualification', data: MGR }));
});
await step('Intermediaries · Desktop', async () => {
  frames.push(await derive({ title: TAB_INT, x: 2000, count: `9 intermediaries for “riverside”`, field: ['Agency', 'All agencies'], groups: [], third: 'Clients', data: INT }));
});
report.info.desktop = nat;

// ---------- 4. Section ve platform boyutu
await step('Section ve Web platformu', async () => {
  const bottom = Math.max.apply(null, sWeb.children.map(c => c.y + c.height));
  sWeb.resizeWithoutConstraints(sWeb.width, Math.ceil(bottom + 80));
  report.info.sectionMoved = settle(web, sWeb);
  report.info.webSection = R(sWeb.width) + 'x' + R(sWeb.height) + ' · Web ' + R(web.width) + 'x' + R(web.height);
});

// ---------- 5. kontrol
await step('Kontrol', async () => {
  const bb = n => n.absoluteBoundingBox; const ov = [];
  const kids = sWeb.children.filter(c => c.type === 'FRAME');
  for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) { const a = bb(kids[i]), b = bb(kids[j]); if (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y) ov.push(kids[i].name + ' x ' + kids[j].name); }
  report.info.screenOverlaps = ov.length ? ov : 'none';
  const secs = web.children.filter(n => n.type === 'SECTION').sort((a, b) => a.y - b.y); const sov = [];
  for (let i = 0; i < secs.length - 1; i++) if (secs[i].y + secs[i].height > secs[i + 1].y) sov.push(secs[i].name + ' x ' + secs[i + 1].name);
  report.info.sectionOverlaps = sov.length ? sov : 'none';
  let unstyled = 0, dash = 0;
  for (const f of frames) for (const t of f.findAll(n => n.type === 'TEXT')) { if (typeof t.textStyleId === 'string' && t.textStyleId === '') unstyled++; if (t.characters.indexOf(String.fromCharCode(8212)) >= 0) dash++; }
  report.info.unstyledText = unstyled; report.info.longDash = dash;
  report.info.flowStartsAfter = p02.flowStartingPoints.length;
  const hidden = frames.map(f => f.name + ': ' + f.findAll(n => n.type === 'INSTANCE' && /^Person ·/.test(n.name)).length + ' satir');
  report.info.rows = hidden;
});
return JSON.stringify(report, null, 1);
