// step 343 · Kulüp kartı (18) Full durumu: masaüstü + mobil, Stadium card kopyalarından türetilir (yeni Section "Club card", Web ve Mobile)
const report = { done: [], errors: [], info: { dimsMissing: [] } };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const D = key => { const v = allVars.find(x => x.name === key) || allVars.find(x => x.name.endsWith('/' + key)); if (!v) report.info.dimsMissing.push(key); return v || null; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const PAD = (n, t, r, b, l) => { const m = { paddingTop: t, paddingRight: r, paddingBottom: b, paddingLeft: l }; for (const k in m) { if (m[k] === 0) { n[k] = 0; continue; } const v = D(m[k]); if (v) n.setBoundVariable(k, v); } };
const GAP = (n, key) => { const v = D(key); if (v) n.setBoundVariable('itemSpacing', v); };
const sz = n => Math.round(n.width) + 'x' + Math.round(n.height);
const sets = p01.findAll(n => n.type === 'COMPONENT_SET' || (n.type === 'COMPONENT' && n.parent && n.parent.type !== 'COMPONENT_SET'));
const byName = nm => { const s = sets.find(n => n.name === nm); if (!s) throw new Error('component yok: ' + nm); return s; };
const variantOf = (nm, re) => { const s = byName(nm); const v = s.type === 'COMPONENT_SET' ? s.children.find(c => re.test(c.name)) : s; if (!v) throw new Error('varyant yok: ' + nm + ' ' + re); return v; };
const styles = {}; for (const s of await figma.getLocalTextStylesAsync()) styles[s.name] = s;
const subSec = (plat, nm) => plat.children.find(n => n.type === 'SECTION' && n.name === nm);
const frameIn = (s, re) => { const f = s.children.find(n => n.type === 'FRAME' && re.test(n.name)); if (!f) throw new Error('frame yok: ' + re + ' in ' + s.name); return f; };

async function loadFor(t) { const fs = t.getRangeAllFontNames(0, Math.max(1, t.characters.length)); for (const f of fs) await figma.loadFontAsync(f); }
async function setT(root, name, str, nth) { const all = root.findAll(n => n.type === 'TEXT' && n.name === name); const t = all[nth || 0]; if (!t) throw new Error('metin yok: ' + name + ' in ' + root.name + ' (var: ' + root.findAll(n => n.type === 'TEXT').slice(0, 8).map(n => n.name).join(',') + ')'); await loadFor(t); t.characters = str; return t; }
async function replT(root, from, to) { const t = root.findAll(n => n.type === 'TEXT').find(n => n.characters === from); if (!t) throw new Error('metin yok: "' + from + '" in ' + root.name); await loadFor(t); t.characters = to; return t; }
async function T(text, styleName, colorName) { const st = styles[styleName]; if (!st) throw new Error('text style missing: ' + styleName); await figma.loadFontAsync(st.fontName); const t = figma.createText(); await t.setTextStyleIdAsync(st.id); t.characters = text; t.fills = [P(V(colorName))]; return t; }
function F(name, dir) { const f = figma.createFrame(); f.name = name; f.layoutMode = dir; f.fills = []; f.clipsContent = false; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; return f; }
function rect(name, w, h, colorName) { const r = figma.createRectangle(); r.name = name; r.resize(w, h); r.fills = [P(V(colorName))]; return r; }
const fill = n => { n.layoutSizingHorizontal = 'FILL'; };

const MGMT = [['Peter Hartmann', 'President'], ['Anna Vogel', 'Sporting Director'], ['Lukas Weiss', 'Director of Football'], ['Maria Keller', 'Director of Operations']];
const FACS = [['STADIUM', 'Spreeufer Stadium', 'Berlin · 4,200 capacity'], ['TRAINING GROUND', 'Spreeufer Training Ground', 'Berlin · Artificial turf'], ['ACADEMY', 'Spreeufer Academy', 'Berlin · Youth teams']];
const chevSrc = variantOf('Event row', /Device=Desktop.*State=Default|State=Default.*Device=Desktop/).findOne(n => n.name === 'Icon · chevron');

async function heading(card, title, summary) { const h = card.children[0]; if (h.type === 'TEXT') { await loadFor(h); h.characters = title; return; } await setT(h, 'Career', title); await setT(h, 'Career summary', summary); }
async function facCard(card) {
  for (const c of card.children.slice(1)) c.remove();
  for (let i = 0; i < FACS.length; i++) {
    const [ty, nm, meta] = FACS[i];
    if (i) { const d = rect('Divider', 100, 1, 'color/border/default'); card.appendChild(d); fill(d); }
    const row = F('Facility · ' + nm, 'HORIZONTAL'); row.counterAxisAlignItems = 'CENTER'; GAP(row, 'spacing/md'); PAD(row, 'spacing/sm', 0, 'spacing/sm', 0);
    const text = F('Text', 'VERTICAL'); GAP(text, 'spacing/2xs');
    text.appendChild(await T(ty, 'Label/Overline', 'color/text/secondary')); text.appendChild(await T(nm, 'Label/Default Strong', 'color/text/primary')); text.appendChild(await T(meta, 'Label/Small', 'color/text/secondary'));
    row.appendChild(text); row.appendChild(chevSrc.clone()); card.appendChild(row); fill(row); fill(text);
  }
}
async function mgmtCard(card) {
  for (const c of card.children.slice(1)) c.remove();
  const pv = variantOf('Person row', /State=Default/);
  for (const [n, r] of MGMT) { const p = pv.createInstance(); p.name = 'Person row · ' + n; card.appendChild(p); fill(p); await setT(p, 'Name', n); await setT(p, 'Meta', r); }
}
async function squadCard(card, dev, srcFrame) {
  for (const c of card.children.slice(1)) c.remove();
  const mobile = dev === 'Mobile';
  const ts = variantOf('Team select', new RegExp('Device=' + dev + ', State=Closed')).createInstance(); card.appendChild(ts); fill(ts);
  await replT(ts, 'Riverside FC', 'Spreeufer FC');
  if (mobile) await replT(ts, 'Third Division · Tier 3', 'Regionalliga Nordost · Tier 4'); else { await replT(ts, 'Third Division', 'Regionalliga Nordost'); await replT(ts, 'Tier 3', 'Tier 4'); }
  const tabs = F('Squad tabs', 'HORIZONTAL'); GAP(tabs, 'spacing/sm'); card.appendChild(tabs);
  for (const [st, lab] of [['Selected', 'Players · 23'], ['Default', 'Staff · 6']]) { const c = variantOf('Filter chip', new RegExp('State=' + st)).createInstance(); c.name = 'Filter chip · ' + lab; tabs.appendChild(c); await setT(c, 'Label', lab); }
  if (!mobile) { const th = srcFrame.findOne(n => n.name === 'Table header'); if (!th) throw new Error('Table header yok'); const c = th.clone(); card.appendChild(c); fill(c); }
  const rows = []; for (const n of srcFrame.findAll(x => x.type === 'INSTANCE')) { const m = await n.getMainComponentAsync(); if (m && m.parent && m.parent.name === 'Player result') rows.push(n); }
  report.info['playerRows ' + dev] = rows.length;
  for (const r of rows.slice(0, 4)) { const c = r.clone(); card.appendChild(c); fill(c); const meta = c.findOne(n => n.type === 'TEXT' && n.name === 'Meta'); if (meta) { await loadFor(meta); meta.characters = meta.characters.split(' · ')[0]; } }
}
async function cropCrest(parent, rectNode, scale) {
  const cr = variantOf('Club crest', /Riverside FC/).createInstance(); cr.name = 'Club crest · large'; parent.appendChild(cr); cr.rescale(scale); cr.layoutPositioning = 'ABSOLUTE';
  cr.x = rectNode.x + (rectNode.width - cr.width) / 2; cr.y = rectNode.y + (rectNode.height - cr.height) / 2;
}
async function facts(root) {
  const f = root.findAll(n => n.type === 'INSTANCE' && /^Fact · /.test(n.name)); if (f.length !== 3) throw new Error('fact sayısı ' + f.length);
  const data = [['League', 'Regionalliga Nordost', 'Tier 4', 'League'], ['Teams', '4', null, 'Teams'], ['City', 'Berlin', 'Germany', 'City']];
  for (let i = 0; i < 3; i++) { const [lab, val, sub, nm] = data[i]; await setT(f[i], 'Label', lab); await setT(f[i], 'Value', val); const s = f[i].findAll(n => n.type === 'TEXT' && n.name === 'Sub')[0]; if (s) { if (sub) { await loadFor(s); s.characters = sub; s.visible = true; } else s.visible = false; } f[i].name = 'Fact · ' + nm; }
}
function cleanReactions(root) { let n = 0; return (async () => { for (const x of [root].concat(root.findAll(() => true))) { try { if ('reactions' in x && x.reactions && x.reactions.length) { const keep = x.reactions.filter(r => !(r.actions || []).some(a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO')); if (keep.length !== x.reactions.length) { await x.setReactionsAsync(keep); n++; } } } catch (e) {} } return n; })(); }

let newWeb, newMob;
await step('Section Club card', async () => {
  for (const [plat, nm] of [[web, 'web'], [mob, 'mob']]) {
    for (const old of plat.children.filter(n => n.name === 'Club card')) old.remove();
    const s = figma.createSection(); s.name = 'Club card'; plat.appendChild(s);
    const refSec = subSec(plat, 'Search results'); const bottom = Math.max(...plat.children.filter(n => n.type === 'SECTION' && n !== s).map(c => c.y + c.height));
    s.x = refSec.x; s.y = bottom + 160; s.resizeWithoutConstraints(1600, 400);
    if (nm === 'web') newWeb = s; else newMob = s;
  }
  report.info.sections = ['Web y=' + Math.round(newWeb.y) + ' x=' + Math.round(newWeb.x), 'Mobile y=' + Math.round(newMob.y) + ' x=' + Math.round(newMob.x)];
});

let fd, fm;
await step('Masaüstü Full', async () => {
  const stadium = subSec(web, 'Stadium card'); const src = frameIn(stadium, /Stadium card · Desktop$/);
  const playersD = frameIn(subSec(web, 'Search results'), /Players · Desktop$/);
  fd = src.clone(); fd.name = 'Clubs / Club card · Desktop'; newWeb.appendChild(fd); fd.x = 80; fd.y = 100;
  const hero = fd.findOne(n => n.name === 'Hero · stadium identity');
  await setT(hero, 'Breadcrumb', 'Clubs / Germany / Spreeufer FC'); await setT(hero, 'Surname', 'Spreeufer FC'); await setT(hero, 'Player category', 'Football club in Berlin, Germany');
  const full = hero.findOne(n => n.name === 'Full name'); if (full) full.visible = false;
  await facts(hero);
  const btn = hero.findOne(n => n.name === 'Button · View on map'); await setT(btn, 'Label', 'Visit website'); btn.name = 'Button · Visit website';
  const tile = hero.findOne(n => n.name === 'Facility photo'); tile.name = 'Crest tile'; tile.fills = [P(V('color/bg/subtle'))]; await cropCrest(hero, tile, 6);
  const body = fd.findOne(n => n.name === 'Profile body'); const cols = body.findOne(n => n.name === 'Profile columns');
  const left = cols.findOne(n => n.name === 'Left column'), right = cols.findOne(n => n.name === 'Right column');
  const tenants = right.findOne(n => n.name === 'Tenants'), upcoming = right.findOne(n => n.name === 'Upcoming events'), gallery = left.findOne(n => n.name === 'Gallery');
  const teams = upcoming.clone(), events = upcoming.clone(); teams.name = 'Teams'; events.name = "Events on club's facilities";
  tenants.name = 'Management'; await heading(tenants, 'Management', '4 people'); await mgmtCard(tenants);
  gallery.name = 'Facilities'; await heading(gallery, 'Facilities', ''); await facCard(gallery);
  right.name = 'Main column'; left.name = 'Side column'; cols.insertChild(0, right);
  body.appendChild(teams); fill(teams); body.appendChild(events); fill(events); upcoming.remove();
  await heading(teams, 'Teams', '4 teams'); await squadCard(teams, 'Desktop', playersD);
  await heading(events, "Events on club's facilities", '2 upcoming');
  const rows = events.findAll(n => n.type === 'INSTANCE' && /^Event row/.test(n.name)); const locs = ['Spreeufer Stadium, Berlin', 'Spreeufer Academy, Berlin'];
  for (let i = 0; i < rows.length; i++) await setT(rows[i], 'Location', locs[i] || locs[0]);
  report.info.desktop = fd.name + ' ' + sz(fd);
});

await step('Mobil Full', async () => {
  const stadium = subSec(mob, 'Stadium card'); const src = frameIn(stadium, /Stadium card · Mobile$/);
  const playersM = frameIn(subSec(mob, 'Search results'), /Players · Mobile$/);
  fm = src.clone(); fm.name = 'Clubs / Club card · Mobile'; newMob.appendChild(fm); fm.x = 80; fm.y = 100;
  const hero = fm.findOne(n => n.name === 'Hero · stadium identity');
  await setT(hero, 'Surname', 'Spreeufer FC');
  const role = hero.findAll(n => n.type === 'TEXT' && /^Home of/.test(n.characters))[0]; if (role) { await loadFor(role); role.characters = 'Football club in Berlin, Germany'; }
  for (const t of hero.findAll(n => n.type === 'TEXT' && /^Name in home country/.test(n.characters))) t.visible = false;
  await facts(hero);
  const btn = hero.findOne(n => n.name === 'Button · View on map'); await setT(btn, 'Label', 'Visit website'); btn.name = 'Button · Visit website';
  const tile = hero.findOne(n => n.name === 'Facility photo'); tile.name = 'Crest tile'; tile.fills = [P(V('color/bg/subtle'))]; await cropCrest(tile.parent, tile, 4);
  const body = fm.findOne(n => n.name === 'Profile body');
  const loc = body.children.find(n => /^Location/.test(n.name)), tenants = body.findOne(n => n.name === 'Tenants'), upcoming = body.findOne(n => n.name === 'Upcoming events'), gallery = body.findOne(n => n.name === 'Gallery');
  const teams = upcoming.clone(); teams.name = 'Teams'; upcoming.name = "Events on club's facilities";
  tenants.name = 'Management'; await heading(tenants, 'Management', '4 people'); await mgmtCard(tenants);
  gallery.name = 'Facilities'; await heading(gallery, 'Facilities', ''); await facCard(gallery);
  await heading(teams, 'Teams', '4 teams'); await squadCard(teams, 'Mobile', playersM);
  await heading(upcoming, "Events on club's facilities", '2 upcoming');
  const rows = upcoming.findAll(n => n.type === 'INSTANCE' && /^Event row/.test(n.name)); const locs = ['Spreeufer Stadium, Berlin', 'Spreeufer Academy, Berlin'];
  for (let i = 0; i < rows.length; i++) await setT(rows[i], 'Location', locs[i] || locs[0]);
  for (const [i, n] of [tenants, teams, upcoming, loc, gallery].entries()) { body.insertChild(i, n); }
  report.info.mobile = fm.name + ' ' + sz(fm) + ' | body order: ' + body.children.map(c => c.name).join(' > ');
});

await step('Temizlik ve boyutlar', async () => {
  const clean = []; for (const f of [fd, fm]) if (f) clean.push(await cleanReactions(f)); report.info.reactionsCleared = clean;
  const flows = p02.flowStartingPoints; const keep = flows.filter(s => !(fd && s.nodeId === fd.id) && !(fm && s.nodeId === fm.id)); report.info.flows = flows.length + ' -> ' + keep.length; if (keep.length !== flows.length) p02.flowStartingPoints = keep;
  if (fd) newWeb.resizeWithoutConstraints(1600, Math.ceil(100 + fd.height + 80));
  if (fm) newMob.resizeWithoutConstraints(560, Math.ceil(100 + fm.height + 80));
  for (const [plat, s] of [[web, newWeb], [mob, newMob]]) plat.resizeWithoutConstraints(plat.width, Math.max(plat.height, Math.ceil(s.y + s.height + 120)));
  report.info.sectionSizes = ['Web ' + sz(newWeb) + ' y=' + Math.round(newWeb.y), 'Mobile ' + sz(newMob) + ' y=' + Math.round(newMob.y), 'platform Web ' + sz(web) + ' Mobile ' + sz(mob)];
});

await step('Kontrol', async () => {
  const out = {};
  for (const f of [fd, fm]) { if (!f) continue; let gray = 0, unstyled = 0, over = [];
    for (const n of f.findAll(() => true)) {
      if (n.type === 'TEXT' && !(typeof n.textStyleId === 'string' && n.textStyleId)) unstyled++;
      if ('fills' in n && Array.isArray(n.fills)) for (const p of n.fills) if (p.type === 'SOLID' && Math.abs(p.color.r - .5) < .01 && Math.abs(p.color.g - .5) < .01 && Math.abs(p.color.b - .5) < .01) gray++;
      const par = n.parent; if (par && par !== f && 'layoutMode' in par && par.layoutMode !== 'NONE' && n.type !== 'TEXT' && !(n.layoutPositioning === 'ABSOLUTE') && par.type !== 'INSTANCE' && n.width > par.width + 1) over.push(par.name + ' :: ' + n.name + ' ' + Math.round(n.width) + '>' + Math.round(par.width));
    }
    out[f.name] = { size: sz(f), grayFills: gray, unstyledText: unstyled, wider: over.slice(0, 8) };
  }
  report.info.check = out;
  const kids = (fd || fm) ? [fd, fm].filter(Boolean) : []; report.info.structure = kids.map(f => f.name + ': ' + f.findOne(n => n.name === 'Profile body').children.map(c => c.name + ' ' + sz(c)).join(' | '));
});
return report;
