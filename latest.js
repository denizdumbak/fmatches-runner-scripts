// step 328 · (327'nin düzeltmesi: newCard'da ebeveynsiz FILL hatası) arama sonuçları masaüstü ekranları (6): All · Players · Clubs · Facilities · Events · No results. Shortlists sayfasından türetilir; yeni Section "Search results" (Web, Stadium card'ın altı).
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = Math.round;
const p01 = figma.root.children.find(p => /^01/.test(p.name));
const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const sub = (plat, re) => plat.children.find(n => n.type === 'SECTION' && re.test(n.name));
const frameIn = (sec, re) => sec && sec.children.find(n => n.type === 'FRAME' && re.test(n.name));
const pick = re => { let r = null; (function w(n) { if (r) return; if ((n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name)) { r = n; return; } if ('children' in n) for (const k of n.children) w(k); })(p01); return r; };
const variant = (set, re) => (set.type === 'COMPONENT_SET' ? set.children.find(c => re.test(c.name)) : set);
async function setText(t, str) { if (!t) throw new Error('metin katmanı yok: ' + str); for (const f of t.getRangeAllFontNames(0, Math.max(t.characters.length, 1))) await figma.loadFontAsync(f); t.characters = str; }
const tn = (root, nm) => root.findOne(n => n.type === 'TEXT' && n.name === nm);
const byName = (root, nm) => root.findOne(n => n.name === nm);
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
const allVars = await figma.variables.getLocalVariablesAsync();
const V = nm => { const v = allVars.find(x => x.name === nm); if (!v) throw new Error('variable yok: ' + nm); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const styles = await figma.getLocalTextStylesAsync();
const S = nm => { const s = styles.find(x => x.name === nm); if (!s) throw new Error('stil yok: ' + nm + ' (var: ' + styles.slice(0, 40).map(x => x.name).join(', ') + ')'); return s; };
async function txt(str, styleName, colorVar) {
  const t = figma.createText(); const st = S(styleName);
  await figma.loadFontAsync(st.fontName); await t.setTextStyleIdAsync(st.id); t.characters = str;
  t.fills = [P(V(colorVar))]; return t;
}

const shortSec = sub(web, /^Shortlists$/), contactsSec = sub(web, /^My contacts$/), mapSec = sub(web, /^Map$/), stadiumSec = sub(web, /^Stadium card$/);
const src = frameIn(shortSec, /^Shortlists \/ Shortlists · Desktop$/);
const contactsFr = frameIn(contactsSec, /^Contacts \/ My contacts · Desktop$/) || contactsSec.children.find(n => n.type === 'FRAME');
const mapFr = frameIn(mapSec, /^Map \/ Default · Desktop$/);
const tabsSrc = contactsFr.findOne(n => n.name === 'Tabs');
const listCardSrc = src.findOne(n => n.name === 'List card');
const dividerSrc = listCardSrc.findOne(n => n.type === 'RECTANGLE' && n.name === 'Divider');
const filtersSrc = mapFr.findOne(n => n.name === 'Filters');
const selCountry = filtersSrc.findOne(n => n.name === 'Field · Country'), selLeague = filtersSrc.findOne(n => n.name === 'Field · League');
const tierSrc = filtersSrc.findOne(n => n.name === 'Tier'), genderSrc = filtersSrc.findOne(n => n.name === 'Gender');
const shortRows = listCardSrc.findAll(n => n.type === 'INSTANCE' && /^Player ·/.test(n.name));
const playerSet = pick(/^Player result$/), clubSet = pick(/^Club result$/), facSet = pick(/^Facility result$/), eventSet = pick(/^Event row$/), emptySet = pick(/^Empty card$/);
report.info.src = { src: !!src, tabs: !!tabsSrc, list: !!listCardSrc, divider: !!dividerSrc, sel: !!selCountry && !!selLeague, tier: !!tierSrc, gender: !!genderSrc, shortRows: shortRows.length, sets: [!!playerSet, !!clubSet, !!facSet, !!eventSet, !!emptySet] };

// eski çalıştırmayı sil
const old = web.children.find(n => n.type === 'SECTION' && n.name === 'Search results'); if (old) old.remove();
for (const k of web.children.slice()) if (k.type === 'FRAME' && /^Search \//.test(k.name)) k.remove();

const sec = figma.createSection(); sec.name = 'Search results'; web.appendChild(sec);
sec.x = 120; sec.y = Math.round(stadiumSec.y + stadiumSec.height + 160);
sec.resizeWithoutConstraints(3 * 1920, 3000);

const QUERY = 'riverside';
const made = [];
function relabelTab(tab, label) { const t = tn(tab, 'Label'); return setText(t, label); }

async function makeTabs(active) {
  const tabs = tabsSrc.clone(); const sel = tabsSrc.children[0], def = tabsSrc.children[1];
  const tmpl = { sel: sel.clone(), def: def.clone() };
  for (const k of tabs.children.slice()) k.remove();
  const labels = ['All', 'Players (84)', 'Clubs (12)', 'Facilities (3)', 'Events (5)'];
  for (let i = 0; i < labels.length; i++) {
    const c = (i === active ? tmpl.sel : tmpl.def).clone(); tabs.appendChild(c); c.name = 'Tab · ' + labels[i].replace(/ \(.*\)/, '');
    await relabelTab(c, labels[i]);
  }
  tmpl.sel.remove(); tmpl.def.remove();
  return tabs;
}

async function selectField(srcSel, label, value) {
  const main = await srcSel.getMainComponentAsync(); const inst = main.createInstance();
  try { const props = {}; for (const k of Object.keys(srcSel.componentProperties)) props[k] = srcSel.componentProperties[k].value; inst.setProperties(props); } catch (e) { /* varsayılan */ }
  await setText(tn(inst, 'Label'), label); await setText(tn(inst, 'Value'), value);
  inst.name = 'Field · ' + label;
  return inst;
}

async function filterPanel(kind) {
  const panel = listCardSrc.clone(); for (const k of panel.children.slice()) k.remove();
  panel.name = 'Filter panel'; panel.layoutMode = 'VERTICAL'; panel.itemSpacing = 0;
  panel.setBoundVariable('itemSpacing', V('spacing/md'));
  for (const k of ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight']) panel.setBoundVariable(k, V('spacing/lg'));
  panel.resize(304, 100); panel.primaryAxisSizingMode = 'AUTO'; panel.counterAxisSizingMode = 'FIXED';
  const head = await txt('Filters', 'Heading/H4', 'color/text/primary'); panel.appendChild(head); head.name = 'Filters title';
  const fields = {
    Players: [[selLeague, 'Position', 'All positions'], [selCountry, 'Nationality', 'All countries'], [selLeague, 'Age', 'Any age']],
    Clubs: [[selCountry, 'Country', 'All countries'], [selLeague, 'League', 'All leagues']],
    Facilities: [[selCountry, 'Country', 'All countries'], [selLeague, 'Capacity', 'Any capacity'], [selCountry, 'Surface', 'Any surface']],
    Events: [[selCountry, 'Country', 'All countries'], [selLeague, 'Event type', 'All types'], [selCountry, 'Dates', 'Any dates']]
  }[kind];
  for (const [s, l, v] of fields) { const f = await selectField(s, l, v); panel.appendChild(f); f.layoutSizingHorizontal = 'FILL'; }
  const groups = kind === 'Clubs' ? [tierSrc, genderSrc] : kind === 'Players' ? [genderSrc] : [];
  for (const g of groups) { const c = g.clone(); panel.appendChild(c); c.layoutMode = 'VERTICAL'; c.itemSpacing = 8; c.layoutSizingHorizontal = 'FILL'; const ch = c.findOne(n => n.name === 'Chips'); if (ch) { ch.layoutWrap = 'WRAP'; ch.layoutSizingHorizontal = 'FILL'; } }
  panel.layoutSizingHorizontal = 'FIXED';
  return panel;
}

function newCard() { const c = listCardSrc.clone(); for (const k of c.children.slice()) k.remove(); c.primaryAxisSizingMode = 'AUTO'; return c; }
function addRow(card, node, last) { card.appendChild(node); node.layoutSizingHorizontal = 'FILL'; if (!last) { const d = dividerSrc.clone(); card.appendChild(d); d.layoutSizingHorizontal = 'FILL'; } }

const PLAYERS = shortRows.map((r, i) => ({ name: tn(r, 'Name').characters, meta: tn(r, 'Meta').characters, age: (r.findAll(n => n.type === 'TEXT' && n.name === 'Value')[0] || { characters: '' }).characters, row: r, action: i === 3 ? 'Add to contacts' : 'Message' }));
async function playerRow(p) {
  const v = variant(playerSet, new RegExp('Device=Desktop, Action=' + p.action + ', State=Default'));
  const inst = v.createInstance(); inst.name = 'Player · ' + p.name;
  await setText(tn(inst, 'Name'), p.name); await setText(tn(inst, 'Meta'), p.meta);
  const sf = p.row.findOne(n => n.name === 'Key facts'), df = inst.findOne(n => n.name === 'Key facts');
  const sv = sf.findAll(n => n.type === 'TEXT' && n.name === 'Value'), dv = df.findAll(n => n.type === 'TEXT' && n.name === 'Value');
  for (let i = 0; i < Math.min(sv.length, dv.length); i++) await setText(dv[i], sv[i].characters);
  const sn = sf.findOne(n => n.name === 'Nation'), dn = df.findOne(n => n.name === 'Nation'); if (sn && dn) await setText(dn, sn.characters);
  const sfl = sf.findOne(n => n.type === 'INSTANCE' && n.name === 'Flag'), dfl = df.findOne(n => n.type === 'INSTANCE' && n.name === 'Flag');
  if (sfl && dfl) { try { const pr = {}; for (const k of Object.keys(sfl.componentProperties)) pr[k] = sfl.componentProperties[k].value; dfl.setProperties(pr); } catch (e) { report.errors.push('flag ' + p.name); } }
  return inst;
}
async function clubRow(name, meta) { const i = variant(clubSet, /Device=Desktop, State=Default/).createInstance(); i.name = 'Club · ' + name; await setText(tn(i, 'Name'), name); await setText(tn(i, 'Meta'), meta); return i; }
async function facRow(name, meta) { const i = variant(facSet, /Device=Desktop, State=Default/).createInstance(); i.name = 'Facility · ' + name; await setText(tn(i, 'Name'), name); await setText(tn(i, 'Meta'), meta); return i; }
async function eventRow(mon, day, name, type, loc, dates) {
  const i = variant(eventSet, /Device=Desktop, State=Default/).createInstance(); i.name = 'Event · ' + name;
  await setText(tn(i, 'Month'), mon); await setText(tn(i, 'Day'), day); await setText(tn(i, 'Event name'), name);
  await setText(tn(byName(i, 'Type tag'), 'Label'), type); await setText(tn(i, 'Location'), loc); await setText(tn(i, 'Dates'), dates);
  return i;
}
const CLUBS = [['Riverside FC', 'England · Third Division'], ['Riverside Youth', 'England · Under-18 league'], ['Riverside Rovers', 'Scotland · Fifth Division'], ['Riverside Women', 'England · Women\'s Second Division'], ['Riverside United', 'Ireland · Fourth Division']];
const FACS = [['Riverside Park', 'Riverside, England · Natural grass · 4,200'], ['Riverside Training Ground', 'Riverside, England · Artificial turf · 800'], ['Riverside Sports Centre', 'Leeds, England · Artificial turf · 1,500']];
const EVENTS = [['OCT', '17', 'Riverside Autumn Cup', 'Tournament', 'Riverside, England', '17 - 25 Oct'], ['NOV', '08', 'Riverside Open Trial', 'Trial', 'Riverside, England', '8 Nov'], ['NOV', '22', 'Riverside v Northgate', 'Match', 'Riverside, England', '22 Nov'], ['DEC', '06', 'Riverside Winter Camp', 'Camp', 'Leeds, England', '6 - 10 Dec']];

async function buildScreen(key, title, active, query, build) {
  const fr = src.clone(); sec.appendChild(fr); fr.name = `Search / ${title} · Desktop`;
  try { p02.flowStartingPoints = p02.flowStartingPoints.filter(f => f.nodeId !== fr.id); } catch (e) { /* yok say */ }
  for (const n of [fr].concat(fr.findAll(() => true))) if ('reactions' in n && n.reactions && n.reactions.length) { const keep = n.reactions.filter(r => !(r.actions || []).some(isNavAct)); if (keep.length !== n.reactions.length) await n.setReactionsAsync(keep); }
  const sv = fr.findOne(n => n.type === 'TEXT' && n.name === 'Search players, clubs, agents'); if (sv) { await setText(sv, query); sv.fills = [P(V('color/text/primary'))]; }
  const body = fr.findOne(n => n.name === 'Shortlists body'); body.name = 'Search body';
  const col = body.findOne(n => n.name === 'Column');
  const head = col.findOne(n => n.name === 'Heading row');
  const btn = head.findOne(n => /^Button/.test(n.name)); if (btn) btn.remove();
  await setText(tn(head, 'Title'), key === 'none' ? 'No results for “' + query + '”' : 'Results for “' + query + '”');
  for (const k of col.children.slice()) if (k !== head) k.remove();
  if (active >= 0) { const tabs = await makeTabs(active); col.appendChild(tabs); tabs.name = 'Tabs'; }
  await build(col);
  made.push(fr);
  return fr;
}

async function withFilters(col, kind, rows, count) {
  const wrap = figma.createFrame(); col.appendChild(wrap); wrap.name = 'Search layout'; wrap.fills = []; wrap.layoutMode = 'HORIZONTAL'; wrap.itemSpacing = 24; wrap.counterAxisAlignItems = 'MIN';
  wrap.setBoundVariable('itemSpacing', V('spacing/lg')); wrap.layoutSizingHorizontal = 'FILL'; wrap.primaryAxisSizingMode = 'FIXED'; wrap.counterAxisSizingMode = 'AUTO';
  wrap.appendChild(await filterPanel(kind));
  const res = figma.createFrame(); wrap.appendChild(res); res.name = 'Results'; res.fills = []; res.layoutMode = 'VERTICAL'; res.itemSpacing = 16; res.setBoundVariable('itemSpacing', V('spacing/md')); res.layoutSizingHorizontal = 'FILL'; res.counterAxisSizingMode = 'AUTO';
  const sum = await txt(count, 'Body/Small', 'color/text/secondary'); res.appendChild(sum); sum.name = 'Result count';
  const card = newCard(); res.appendChild(card); card.layoutSizingHorizontal = 'FILL'; card.name = 'List card';
  for (let i = 0; i < rows.length; i++) addRow(card, rows[i], i === rows.length - 1);
}

await step('all', () => buildScreen('all', 'All results', 0, QUERY, async col => {
  const groups = [
    ['Players', 'Show all 84 players', async () => [await playerRow(PLAYERS[0]), await playerRow(PLAYERS[1]), await playerRow(PLAYERS[3])]],
    ['Clubs', 'Show all 12 clubs', async () => [await clubRow(...CLUBS[0]), await clubRow(...CLUBS[1])]],
    ['Facilities', 'Show all 3 facilities', async () => [await facRow(...FACS[0]), await facRow(...FACS[1])]],
    ['Events', 'Show all 5 events', async () => [await eventRow(...EVENTS[0]), await eventRow(...EVENTS[1])]]
  ];
  for (const [t, label, mk] of groups) {
    const g = figma.createFrame(); col.appendChild(g); g.name = 'Group · ' + t; g.fills = []; g.layoutMode = 'VERTICAL'; g.itemSpacing = 16; g.setBoundVariable('itemSpacing', V('spacing/md')); g.layoutSizingHorizontal = 'FILL'; g.counterAxisSizingMode = 'AUTO';
    const hr = figma.createFrame(); g.appendChild(hr); hr.name = 'Group heading'; hr.fills = []; hr.layoutMode = 'HORIZONTAL'; hr.primaryAxisAlignItems = 'SPACE_BETWEEN'; hr.counterAxisAlignItems = 'CENTER'; hr.layoutSizingHorizontal = 'FILL'; hr.primaryAxisSizingMode = 'FIXED'; hr.counterAxisSizingMode = 'AUTO';
    hr.appendChild(await txt(t, 'Heading/H3', 'color/text/primary'));
    const b = (await variant(pick(/^Button$/), /Style=Subtle, State=Default/).createInstance()); hr.appendChild(b); b.name = 'Button · ' + label; await setText(tn(b, 'Label'), label);
    const card = newCard(); g.appendChild(card); card.layoutSizingHorizontal = 'FILL'; card.name = 'List card';
    const rows = await mk(); for (let i = 0; i < rows.length; i++) addRow(card, rows[i], i === rows.length - 1);
  }
}));
await step('players', () => buildScreen('players', 'Players', 1, QUERY, async col => { const rows = []; for (const p of PLAYERS) rows.push(await playerRow(p)); await withFilters(col, 'Players', rows, '84 players for “' + QUERY + '”'); }));
await step('clubs', () => buildScreen('clubs', 'Clubs', 2, QUERY, async col => { const rows = []; for (const c of CLUBS) rows.push(await clubRow(...c)); await withFilters(col, 'Clubs', rows, '12 clubs for “' + QUERY + '”'); }));
await step('facilities', () => buildScreen('facilities', 'Facilities', 3, QUERY, async col => { const rows = []; for (const f of FACS) rows.push(await facRow(...f)); await withFilters(col, 'Facilities', rows, '3 facilities for “' + QUERY + '”'); }));
await step('events', () => buildScreen('events', 'Events', 4, QUERY, async col => { const rows = []; for (const e of EVENTS) rows.push(await eventRow(...e)); await withFilters(col, 'Events', rows, '5 events for “' + QUERY + '”'); }));
await step('no results', () => buildScreen('none', 'No results', -1, 'riverfc', async col => {
  const ev = variant(emptySet, /Device=Desktop/).createInstance(); col.appendChild(ev); ev.layoutSizingHorizontal = 'FILL'; ev.name = 'No results card';
  await setText(tn(ev, 'Section heading'), 'Search results'); await setText(tn(ev, 'Title'), 'Nothing matches your search'); await setText(tn(ev, 'Body'), 'Check the spelling or try a shorter name. You can also look for clubs and facilities on the map.');
  const eb = ev.findOne(n => n.type === 'INSTANCE' && /Button/.test(n.name)); if (eb) { await setText(eb.findOne(n => n.type === 'TEXT'), 'Open the map'); eb.name = 'Button · Open the map'; }
}));

// ızgara: 3 sütun, satır y'si en uzun ekrandan
await step('layout', async () => {
  const frs = sec.children.filter(n => n.type === 'FRAME').sort((a, b) => a.name.localeCompare(b.name));
  const order = ['Search / All results · Desktop', 'Search / Players · Desktop', 'Search / Clubs · Desktop', 'Search / Facilities · Desktop', 'Search / Events · Desktop', 'Search / No results · Desktop'];
  const list = order.map(nm => sec.children.find(n => n.name === nm)).filter(Boolean);
  let y = 100;
  for (let r = 0; r < 2; r++) { let h = 0; for (let c = 0; c < 3; c++) { const f = list[r * 3 + c]; if (!f) continue; f.x = 80 + c * 1920; f.y = y; h = Math.max(h, f.height); } y += h + 160; }
  let right = 0, bottom = 0; for (const k of sec.children) { right = Math.max(right, k.x + k.width); bottom = Math.max(bottom, k.y + k.height); }
  sec.resizeWithoutConstraints(right + 80, bottom + 80);
  web.resizeWithoutConstraints(web.width, Math.max(web.height, sec.y + sec.height + 120));
});
await step('check', async () => {
  const out = [];
  for (const fr of sec.children.filter(n => n.type === 'FRAME')) {
    const un = fr.findAll(n => n.type === 'TEXT' && !(typeof n.textStyleId === 'string' && n.textStyleId)).length;
    const gray = fr.findAll(n => { try { return Array.isArray(n.fills) && n.fills.some(f => f.type === 'SOLID' && !(f.boundVariables && f.boundVariables.color) && Math.abs(f.color.r - 0.5) < 0.01 && Math.abs(f.color.g - 0.5) < 0.01); } catch (e) { return false; } }).length;
    const over = [];
    for (const n of fr.findAll(x => x.visible !== false && x.type !== 'VECTOR')) { const p = n.parent; if (!p || p === fr || p.type === 'INSTANCE' || n.layoutPositioning === 'ABSOLUTE' || p.type !== 'FRAME') continue; const a = n.absoluteBoundingBox, b = p.absoluteBoundingBox; if (a && b && (a.x + a.width > b.x + b.width + 0.5)) over.push(`${p.name} :: ${n.name}`); }
    out.push(`${fr.name}: ${R(fr.width)}x${R(fr.height)} at ${R(fr.x)},${R(fr.y)} unstyled ${un} grayFills ${gray} overflow ${over.length ? over.slice(0, 4).join('; ') : 'none'}`);
  }
  report.info.check = out; report.info.section = `${R(sec.x)},${R(sec.y)} ${R(sec.width)}x${R(sec.height)} web ${R(web.width)}x${R(web.height)}`;
  const sb = sec.absoluteBoundingBox, ov = [];
  for (const s of web.children) if (s !== sec && s.type === 'SECTION') { const c = s.absoluteBoundingBox; if (sb.x < c.x + c.width && c.x < sb.x + sb.width && sb.y < c.y + c.height && c.y < sb.y + sb.height) ov.push(s.name); }
  report.info.overlaps = ov.length ? ov.join(',') : 'none';
});
await step('view', async () => { await figma.setCurrentPageAsync(p02); const f = sec.children.find(n => /All results/.test(n.name)); if (f) { p02.selection = [f]; figma.viewport.scrollAndZoomIntoView([sec]); } });
return report;
