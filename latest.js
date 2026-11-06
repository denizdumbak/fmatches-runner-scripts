// step 331 · arama sonuçları MOBİL ekranları (7): All · Players · Clubs · Facilities · Events · No results + Filters (Players, tam ekran). Mobile Shortlists sayfasından türetilir; Mobile Section "Search results". Ayrıca masaüstü Players satır yükseklikleri ölçülür (salt okunur).
const report = { done: [], errors: [], info: { missing: [] } };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = Math.round;
const p01 = figma.root.children.find(p => /^01/.test(p.name));
const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const sub = (plat, re) => plat.children.find(n => n.type === 'SECTION' && re.test(n.name));
const frameIn = (sec, re) => sec && sec.children.find(n => n.type === 'FRAME' && re.test(n.name));
const pick = re => { let r = null; (function w(n) { if (r) return; if ((n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name)) { r = n; return; } if ('children' in n) for (const k of n.children) w(k); })(p01); return r; };
const variant = (set, re) => (set.type === 'COMPONENT_SET' ? set.children.find(c => re.test(c.name)) : set);
async function setText(t, str) { if (!t) throw new Error('metin katmanı yok: ' + str); for (const f of t.getRangeAllFontNames(0, Math.max(t.characters.length, 1))) await figma.loadFontAsync(f); t.characters = str; }
const tn = (root, nm) => root.findOne(n => n.type === 'TEXT' && n.name === nm);
const byName = (root, nm) => root.findOne(n => n.name === nm);
async function safeText(root, nm, str) { const t = tn(root, nm); if (!t) { report.info.missing.push(nm + ' @ ' + root.name); return; } await setText(t, str); }
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
const allVars = await figma.variables.getLocalVariablesAsync();
const V = nm => { const v = allVars.find(x => x.name === nm); if (!v) throw new Error('variable yok: ' + nm); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const styles = await figma.getLocalTextStylesAsync();
const S = nm => { const s = styles.find(x => x.name === nm); if (!s) throw new Error('stil yok: ' + nm); return s; };
async function txt(str, styleName, colorVar) { const t = figma.createText(); const st = S(styleName); await figma.loadFontAsync(st.fontName); await t.setTextStyleIdAsync(st.id); t.characters = str; t.fills = [P(V(colorVar))]; return t; }

const shortD = frameIn(sub(web, /^Shortlists$/), /^Shortlists \/ Shortlists · Desktop$/);
const src = frameIn(sub(mob, /^Shortlists$/), /^Shortlists \/ Shortlists · Mobile$/);
const contactsM = frameIn(sub(mob, /^My contacts$/), /^Contacts \/ My contacts · Mobile$/) || sub(mob, /^My contacts$/).children.find(n => n.type === 'FRAME');
const contactsD = sub(web, /^My contacts$/).children.find(n => n.type === 'FRAME');
const tabsSrc = (contactsM && contactsM.findOne(n => n.name === 'Tabs')) || contactsD.findOne(n => n.name === 'Tabs');
const listCardSrc = src.findOne(n => n.name === 'List card');
const dividerSrc = listCardSrc.findOne(n => n.type === 'RECTANGLE' && n.name === 'Divider');
const mapDesk = frameIn(sub(web, /^Map$/), /^Map \/ Default · Desktop$/);
const filtersSrc = mapDesk.findOne(n => n.name === 'Filters');
const selCountry = filtersSrc.findOne(n => n.name === 'Field · Country'), selLeague = filtersSrc.findOne(n => n.name === 'Field · League');
const tierSrc = filtersSrc.findOne(n => n.name === 'Tier'), genderSrc = filtersSrc.findOne(n => n.name === 'Gender');
const shortRows = shortD.findAll(n => n.type === 'INSTANCE' && /^Player ·/.test(n.name));
const playerSet = pick(/^Player result$/), clubSet = pick(/^Club result$/), facSet = pick(/^Facility result$/), eventSet = pick(/^Event row$/), emptySet = pick(/^Empty card$/), buttonSet = pick(/^Button$/);
report.info.src = { src: !!src, tabsFromMobile: !!(contactsM && contactsM.findOne(n => n.name === 'Tabs')), tabW: R(tabsSrc.width), sets: [!!playerSet, !!clubSet, !!facSet, !!eventSet, !!emptySet] };

const old = mob.children.find(n => n.type === 'SECTION' && n.name === 'Search results'); if (old) old.remove();
for (const k of mob.children.slice()) if (k.type === 'FRAME' && /^Search \//.test(k.name)) k.remove();
const stadiumM = sub(mob, /^Stadium card$/);
const sec = figma.createSection(); sec.name = 'Search results'; mob.appendChild(sec);
sec.x = stadiumM.x; sec.y = Math.round(stadiumM.y + stadiumM.height + 160); sec.resizeWithoutConstraints(7 * 470 + 80, 3000);

const QUERY = 'riverside';
async function makeTabs(active) {
  const tabs = tabsSrc.clone(); const sel = tabsSrc.children[0].clone(), def = tabsSrc.children[1].clone();
  for (const k of tabs.children.slice()) k.remove();
  const labels = ['All', 'Players (84)', 'Clubs (12)', 'Facilities (3)', 'Events (5)'];
  for (let i = 0; i < labels.length; i++) { const c = (i === active ? sel : def).clone(); tabs.appendChild(c); c.name = 'Tab · ' + labels[i].replace(/ \(.*\)/, ''); await setText(tn(c, 'Label'), labels[i]); }
  sel.remove(); def.remove();
  return tabs;
}
async function selectField(srcSel, label, value) {
  const main = await srcSel.getMainComponentAsync(); const inst = main.createInstance();
  try { const props = {}; for (const k of Object.keys(srcSel.componentProperties)) props[k] = srcSel.componentProperties[k].value; inst.setProperties(props); } catch (e) { /* varsayılan */ }
  await setText(tn(inst, 'Label'), label); await setText(tn(inst, 'Value'), value); inst.name = 'Field · ' + label; return inst;
}
const FIELDS = {
  Players: [[selLeague, 'Position', 'All positions'], [selCountry, 'Nationality', 'All countries'], [selLeague, 'Age', 'Any age']],
  Clubs: [[selCountry, 'Country', 'All countries'], [selLeague, 'League', 'All leagues']],
  Facilities: [[selCountry, 'Country', 'All countries'], [selLeague, 'Capacity', 'Any capacity'], [selCountry, 'Surface', 'Any surface']],
  Events: [[selCountry, 'Country', 'All countries'], [selLeague, 'Event type', 'All types'], [selCountry, 'Dates', 'Any dates']]
};
async function filterPanel(kind) {
  const panel = listCardSrc.clone(); for (const k of panel.children.slice()) k.remove();
  panel.name = 'Filter panel'; panel.layoutMode = 'VERTICAL'; panel.setBoundVariable('itemSpacing', V('spacing/md'));
  for (const k of ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight']) panel.setBoundVariable(k, V('spacing/md'));
  panel.primaryAxisSizingMode = 'AUTO';
  for (const [s, l, v] of FIELDS[kind]) { const f = await selectField(s, l, v); panel.appendChild(f); f.layoutSizingHorizontal = 'FILL'; }
  const groups = kind === 'Clubs' ? [tierSrc, genderSrc] : kind === 'Players' ? [genderSrc] : [];
  for (const g of groups) { const c = g.clone(); panel.appendChild(c); c.layoutMode = 'VERTICAL'; c.itemSpacing = 8; c.layoutSizingHorizontal = 'FILL'; const ch = c.findOne(n => n.name === 'Chips'); if (ch) { ch.layoutWrap = 'WRAP'; ch.layoutSizingHorizontal = 'FILL'; } }
  return panel;
}
function newCard() { const c = listCardSrc.clone(); for (const k of c.children.slice()) k.remove(); c.primaryAxisSizingMode = 'AUTO'; return c; }
function addRow(card, node, last) { card.appendChild(node); node.layoutSizingHorizontal = 'FILL'; if (!last) { const d = dividerSrc.clone(); card.appendChild(d); d.layoutSizingHorizontal = 'FILL'; } }

const PLAYERS = shortRows.map((r, i) => ({ name: tn(r, 'Name').characters, meta: tn(r, 'Meta').characters, row: r, action: i === 3 ? 'Add to contacts' : 'Message' }));
async function playerRow(p) {
  const inst = variant(playerSet, new RegExp('Device=Mobile, Action=' + p.action + ', State=Default')).createInstance(); inst.name = 'Player · ' + p.name;
  await setText(tn(inst, 'Name'), p.name); await setText(tn(inst, 'Meta'), p.meta);
  const sf = p.row.findOne(n => n.name === 'Key facts'), df = inst.findOne(n => n.name === 'Key facts');
  const sv = sf.findAll(n => n.type === 'TEXT' && n.name === 'Value'), dv = df.findAll(n => n.type === 'TEXT' && n.name === 'Value');
  for (let i = 0; i < Math.min(sv.length, dv.length); i++) await setText(dv[i], sv[i].characters);
  const sn = sf.findOne(n => n.name === 'Nation'), dn = df.findOne(n => n.name === 'Nation'); if (sn && dn) await setText(dn, sn.characters);
  const sfl = sf.findOne(n => n.type === 'INSTANCE' && n.name === 'Flag'), dfl = df.findOne(n => n.type === 'INSTANCE' && n.name === 'Flag');
  if (sfl && dfl) { try { const pr = {}; for (const k of Object.keys(sfl.componentProperties)) pr[k] = sfl.componentProperties[k].value; dfl.setProperties(pr); } catch (e) { report.errors.push('flag ' + p.name); } }
  return inst;
}
async function clubRow(name, meta) { const i = variant(clubSet, /Device=Mobile, State=Default/).createInstance(); i.name = 'Club · ' + name; await setText(tn(i, 'Name'), name); await setText(tn(i, 'Meta'), meta); return i; }
async function facRow(name, meta) { const i = variant(facSet, /Device=Mobile, State=Default/).createInstance(); i.name = 'Facility · ' + name; await setText(tn(i, 'Name'), name); await setText(tn(i, 'Meta'), meta); return i; }
async function eventRow(mon, day, name, type, loc, dates) {
  const i = variant(eventSet, /Device=Mobile, State=Default/).createInstance(); i.name = 'Event · ' + name;
  await safeText(i, 'Month', mon); await safeText(i, 'Day', day); await safeText(i, 'Event name', name);
  const tt = byName(i, 'Type tag'); if (tt) await safeText(tt, 'Label', type); await safeText(i, 'Location', loc); await safeText(i, 'Dates', dates);
  return i;
}
const CLUBS = [['Riverside FC', 'England · Third Division'], ['Riverside Youth', 'England · Under-18 league'], ['Riverside Rovers', 'Scotland · Fifth Division'], ['Riverside Women', 'England · Women\'s Second Division'], ['Riverside United', 'Ireland · Fourth Division']];
const FACS = [['Riverside Park', 'Riverside, England · Natural grass · 4,200'], ['Riverside Training Ground', 'Riverside, England · Artificial turf · 800'], ['Riverside Sports Centre', 'Leeds, England · Artificial turf · 1,500']];
const EVENTS = [['OCT', '17', 'Riverside Autumn Cup', 'Tournament', 'Riverside, England', '17 - 25 Oct'], ['NOV', '08', 'Riverside Open Trial', 'Trial', 'Riverside, England', '8 Nov'], ['NOV', '22', 'Riverside v Northgate', 'Match', 'Riverside, England', '22 Nov'], ['DEC', '06', 'Riverside Winter Camp', 'Camp', 'Leeds, England', '6 - 10 Dec']];

async function buildScreen(title, active, query, build, noHeadButton) {
  const fr = src.clone(); sec.appendChild(fr); fr.name = `Search / ${title} · Mobile`;
  try { p02.flowStartingPoints = p02.flowStartingPoints.filter(f => f.nodeId !== fr.id); } catch (e) { /* yok say */ }
  for (const n of [fr].concat(fr.findAll(() => true))) if ('reactions' in n && n.reactions && n.reactions.length) { const keep = n.reactions.filter(r => !(r.actions || []).some(isNavAct)); if (keep.length !== n.reactions.length) await n.setReactionsAsync(keep); }
  const body = fr.findOne(n => n.name === 'Shortlists body'); body.name = 'Search body';
  const col = body.findOne(n => n.name === 'Column'); const head = col.findOne(n => n.name === 'Heading row');
  const btn = head.findOne(n => /^Button/.test(n.name)); if (btn) btn.remove();
  const ttl = tn(head, 'Title'); await setText(ttl, title === 'No results' ? 'No results for “' + query + '”' : title === 'Filters' ? 'Filters' : 'Results for “' + query + '”');
  head.primaryAxisSizingMode = 'AUTO';
  for (const k of col.children.slice()) if (k !== head) k.remove();
  if (active >= 0) { const tabs = await makeTabs(active); col.appendChild(tabs); tabs.name = 'Tabs'; tabs.layoutSizingHorizontal = 'FILL'; tabs.clipsContent = true; }
  await build(col);
  return fr;
}
async function withFilters(col, kind, rows, count) {
  const bar = figma.createFrame(); col.appendChild(bar); bar.name = 'Result bar'; bar.fills = []; bar.layoutMode = 'HORIZONTAL'; bar.primaryAxisAlignItems = 'SPACE_BETWEEN'; bar.counterAxisAlignItems = 'CENTER'; bar.layoutSizingHorizontal = 'FILL'; bar.primaryAxisSizingMode = 'FIXED'; bar.counterAxisSizingMode = 'AUTO';
  bar.appendChild(await txt(count, 'Body/Small', 'color/text/secondary'));
  const b = variant(buttonSet, /Style=Secondary, State=Default/).createInstance(); bar.appendChild(b); b.name = 'Button · Filters'; await setText(tn(b, 'Label'), 'Filters');
  const card = newCard(); col.appendChild(card); card.layoutSizingHorizontal = 'FILL'; card.name = 'List card';
  for (let i = 0; i < rows.length; i++) addRow(card, rows[i], i === rows.length - 1);
}

await step('all', () => buildScreen('All results', 0, QUERY, async col => {
  const groups = [
    ['Players', 'Show all 84', async () => [await playerRow(PLAYERS[0]), await playerRow(PLAYERS[3])]],
    ['Clubs', 'Show all 12', async () => [await clubRow(...CLUBS[0]), await clubRow(...CLUBS[1])]],
    ['Facilities', 'Show all 3', async () => [await facRow(...FACS[0]), await facRow(...FACS[1])]],
    ['Events', 'Show all 5', async () => [await eventRow(...EVENTS[0]), await eventRow(...EVENTS[1])]]
  ];
  for (const [t, label, mk] of groups) {
    const g = figma.createFrame(); col.appendChild(g); g.name = 'Group · ' + t; g.fills = []; g.layoutMode = 'VERTICAL'; g.setBoundVariable('itemSpacing', V('spacing/sm')); g.layoutSizingHorizontal = 'FILL'; g.counterAxisSizingMode = 'AUTO';
    const hr = figma.createFrame(); g.appendChild(hr); hr.name = 'Group heading'; hr.fills = []; hr.layoutMode = 'HORIZONTAL'; hr.primaryAxisAlignItems = 'SPACE_BETWEEN'; hr.counterAxisAlignItems = 'CENTER'; hr.layoutSizingHorizontal = 'FILL'; hr.primaryAxisSizingMode = 'FIXED'; hr.counterAxisSizingMode = 'AUTO';
    hr.appendChild(await txt(t, 'Heading/H4', 'color/text/primary'));
    const b = variant(buttonSet, /Style=Subtle, State=Default/).createInstance(); hr.appendChild(b); b.name = 'Button · ' + label; await setText(tn(b, 'Label'), label);
    const card = newCard(); g.appendChild(card); card.layoutSizingHorizontal = 'FILL'; card.name = 'List card';
    const rows = await mk(); for (let i = 0; i < rows.length; i++) addRow(card, rows[i], i === rows.length - 1);
  }
}));
await step('players', () => buildScreen('Players', 1, QUERY, async col => { const rows = []; for (const p of PLAYERS) rows.push(await playerRow(p)); await withFilters(col, 'Players', rows, '84 players'); }));
await step('clubs', () => buildScreen('Clubs', 2, QUERY, async col => { const rows = []; for (const c of CLUBS) rows.push(await clubRow(...c)); await withFilters(col, 'Clubs', rows, '12 clubs'); }));
await step('facilities', () => buildScreen('Facilities', 3, QUERY, async col => { const rows = []; for (const f of FACS) rows.push(await facRow(...f)); await withFilters(col, 'Facilities', rows, '3 facilities'); }));
await step('events', () => buildScreen('Events', 4, QUERY, async col => { const rows = []; for (const e of EVENTS) rows.push(await eventRow(...e)); await withFilters(col, 'Events', rows, '5 events'); }));
await step('no results', () => buildScreen('No results', -1, 'riverfc', async col => {
  const ev = variant(emptySet, /Device=Mobile/).createInstance(); col.appendChild(ev); ev.layoutSizingHorizontal = 'FILL'; ev.name = 'No results card';
  await setText(tn(ev, 'Section heading'), 'Search results'); await setText(tn(ev, 'Title'), 'Nothing matches your search'); await setText(tn(ev, 'Body'), 'Check the spelling or try a shorter name. You can also look for clubs and facilities on the map.');
  const eb = ev.findOne(n => n.type === 'INSTANCE' && /Button/.test(n.name)); if (eb) { await setText(eb.findOne(n => n.type === 'TEXT'), 'Open the map'); eb.name = 'Button · Open the map'; }
}));
await step('filters screen', () => buildScreen('Filters', -1, QUERY, async col => {
  const panel = await filterPanel('Players'); col.appendChild(panel); panel.layoutSizingHorizontal = 'FILL';
  const b = variant(buttonSet, /Style=Primary, State=Default/).createInstance(); col.appendChild(b); b.layoutSizingHorizontal = 'FILL'; b.name = 'Button · Show results'; await setText(tn(b, 'Label'), 'Show 84 players');
}));

await step('layout', async () => {
  const order = ['All results', 'Players', 'Clubs', 'Facilities', 'Events', 'No results', 'Filters'].map(t => sec.children.find(n => n.name === `Search / ${t} · Mobile`)).filter(Boolean);
  order.forEach((f, i) => { f.x = 80 + i * 470; f.y = 100; });
  let right = 0, bottom = 0; for (const k of sec.children) { right = Math.max(right, k.x + k.width); bottom = Math.max(bottom, k.y + k.height); }
  sec.resizeWithoutConstraints(right + 80, bottom + 80);
  mob.resizeWithoutConstraints(mob.width, Math.max(mob.height, sec.y + sec.height + 120));
});
await step('check', async () => {
  const out = [];
  for (const fr of sec.children.filter(n => n.type === 'FRAME')) {
    const un = fr.findAll(n => n.type === 'TEXT' && !(typeof n.textStyleId === 'string' && n.textStyleId)).length;
    const gray = fr.findAll(n => { try { return Array.isArray(n.fills) && n.fills.some(f => f.type === 'SOLID' && !(f.boundVariables && f.boundVariables.color) && Math.abs(f.color.r - 0.5) < 0.01 && Math.abs(f.color.g - 0.5) < 0.01); } catch (e) { return false; } }).length;
    const over = [];
    for (const n of fr.findAll(x => x.visible !== false && x.type !== 'VECTOR')) { const p = n.parent; if (!p || p === fr || p.type === 'INSTANCE' || n.layoutPositioning === 'ABSOLUTE' || p.type !== 'FRAME' || p.name === 'Tabs') continue; const a = n.absoluteBoundingBox, b = p.absoluteBoundingBox; if (a && b && a.x + a.width > b.x + b.width + 0.5) over.push(`${p.name} :: ${n.name}`); }
    out.push(`${fr.name}: ${R(fr.width)}x${R(fr.height)} unstyled ${un} grayFills ${gray} overflow ${over.length ? over.slice(0, 4).join('; ') : 'none'}`);
  }
  const sb = sec.absoluteBoundingBox, ov = [];
  for (const s of mob.children) if (s !== sec && s.type === 'SECTION') { const c = s.absoluteBoundingBox; if (sb.x < c.x + c.width && c.x < sb.x + sb.width && sb.y < c.y + c.height && c.y < sb.y + sb.height) ov.push(s.name); }
  report.info.check = out; report.info.section = `${R(sec.x)},${R(sec.y)} ${R(sec.width)}x${R(sec.height)} overlaps ${ov.length ? ov.join(',') : 'none'}`;
});
await step('desktop player row heights (read only)', async () => {
  const fr = p02.findAll(n => n.type === 'FRAME' && n.name === 'Search / Players · Desktop')[0];
  report.info.rowHeights = fr.findAll(n => n.type === 'INSTANCE' && /^Player ·/.test(n.name)).map(r => { const tx = r.findOne(n => n.name === 'Text'); const nm = tn(r, 'Name'), mt = tn(r, 'Meta'); return `${r.name.slice(9)}: row ${R(r.height)} text ${tx ? R(tx.height) : '?'} name ${nm ? R(nm.height) : '?'} meta ${mt ? R(mt.height) : '?'}`; });
});
await step('view', async () => { await figma.setCurrentPageAsync(p02); const f = sec.children.find(n => /All results/.test(n.name)); if (f) { p02.selection = [f]; figma.viewport.scrollAndZoomIntoView([sec]); } });
return report;
