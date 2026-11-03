// step 284 · Switch component (Checked Off|On x State Default|Hover|Disabled) in new Section "10 · Contacts & settings" on 01, Archive pushed right; plus READ-ONLY structure report (Account menu row, Menu icon, Page notice, Empty card) for step 285
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/); await p01.loadAsync();
await figma.setCurrentPageAsync(p01);
const allVars = await figma.variables.getLocalVariablesAsync();
const tryV = (...names) => { for (const n of names) { const v = allVars.find(x => x.name === n); if (v) return v; } return null; };
const V = name => { const v = tryV(name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const sz = n => Math.round(n.width) + 'x' + Math.round(n.height);
const BB = n => n.absoluteBoundingBox;
const SEC = '10 · Contacts & settings';

await step('Switch component set', async () => {
  let sec = p01.findOne(n => n.type === 'SECTION' && n.name === SEC);
  if (!sec) {
    const ev = p01.findOne(n => n.type === 'SECTION' && n.name === '9 · Events');
    if (!ev) throw new Error('9 · Events section missing');
    sec = figma.createSection(); sec.name = SEC; sec.x = ev.x + ev.width + 160; sec.y = ev.y;
  }
  for (const old of sec.children.filter(n => n.name === 'Switch' || n.name === 'Switch note').slice()) old.remove();

  const trackOff = V('color/border/strong'), trackOn = V('color/bg/brand');
  const trackOffHover = tryV('color/text/tertiary', 'color/border/strong'), trackOnHover = tryV('color/bg/brand-hover', 'color/bg/brand');
  const knobV = V('color/bg/surface'), radV = tryV('radius/full');

  const comps = [];
  const states = ['Default', 'Hover', 'Disabled'], checks = ['Off', 'On'];
  checks.forEach((chk, row) => states.forEach((st, col) => {
    const c = figma.createComponent(); c.name = 'Checked=' + chk + ', State=' + st;
    c.resize(44, 24); c.fills = []; c.clipsContent = false;
    const tr = figma.createRectangle(); tr.name = 'Track'; tr.resize(44, 24);
    const tv = chk === 'On' ? (st === 'Hover' ? trackOnHover : trackOn) : (st === 'Hover' ? trackOffHover : trackOff);
    tr.fills = [P(tv)];
    if (radV) { for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) tr.setBoundVariable(k, radV); } else tr.cornerRadius = 12;
    const kn = figma.createEllipse(); kn.name = 'Knob'; kn.resize(20, 20); kn.fills = [P(knobV)];
    c.appendChild(tr); c.appendChild(kn);
    tr.x = 0; tr.y = 0; kn.x = chk === 'On' ? 22 : 2; kn.y = 2;
    tr.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
    kn.constraints = { horizontal: chk === 'On' ? 'MAX' : 'MIN', vertical: 'CENTER' };
    if (st === 'Disabled') c.opacity = 0.4;
    c.x = col * 84; c.y = row * 48;
    sec.appendChild(c); c.x = 80 + col * 84; c.y = 140 + row * 48;
    comps.push(c);
  }));
  const set = figma.combineAsVariants(comps, sec); set.name = 'Switch';
  set.resizeWithoutConstraints(3 * 84 - 40 + 0, 2 * 48 - 24);
  set.x = 80; set.y = 140;

  // prototype: hover -> Hover, click toggles
  const byName = {}; for (const c of set.children) byName[c.name] = c;
  const to = (dest, trig) => ({ trigger: trig, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'CHANGE_TO', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.15 }, preserveScrollPosition: false }] });
  for (const chk of checks) {
    const other = chk === 'On' ? 'Off' : 'On';
    const d = byName['Checked=' + chk + ', State=Default'], h = byName['Checked=' + chk + ', State=Hover'];
    await d.setReactionsAsync([to(h, { type: 'ON_HOVER' }), to(byName['Checked=' + other + ', State=Default'], { type: 'ON_CLICK' })]);
    await h.setReactionsAsync([to(byName['Checked=' + other + ', State=Default'], { type: 'ON_CLICK' })]);
  }

  // one-line note above the set (same pattern as other Foundations sections)
  const styles = await figma.getLocalTextStylesAsync();
  const st = styles.find(s => s.name === 'Label/Small');
  if (!st) throw new Error('text style Label/Small missing');
  await figma.loadFontAsync(st.fontName);
  const t = figma.createText(); t.name = 'Switch note';
  await t.setTextStyleIdAsync(st.id);
  t.characters = 'Switch: on/off control for settings such as notifications. Click it in the prototype to toggle. Track 44 x 24; keep the row it sits in at least 44 px tall.';
  t.fills = [P(V('color/text/secondary'))];
  sec.appendChild(t); t.x = 80; t.y = 90;

  // size the section, move Archive to the right of everything
  sec.resizeWithoutConstraints(Math.max(660, Math.ceil(t.width) + 160), 140 + 2 * 48 + 80);
  const arch = p01.findOne(n => n.type === 'SECTION' && /^Archive/.test(n.name));
  const others = p01.children.filter(n => n.type === 'SECTION' && n !== arch);
  const right = Math.max.apply(null, others.map(s => s.x + s.width));
  if (arch) arch.x = right + 160;

  const bad = [];
  for (const c of set.children) for (const ch of c.children) for (const f of (ch.fills || [])) if (f.type === 'SOLID' && !(f.boundVariables && f.boundVariables.color) ) bad.push(c.name + '/' + ch.name);
  const secs = p01.children.filter(n => n.type === 'SECTION');
  const overlaps = [];
  for (let i = 0; i < secs.length; i++) for (let j = i + 1; j < secs.length; j++) { const a = secs[i], b = secs[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) overlaps.push(a.name + ' x ' + b.name); }
  report.info.switch = { variants: set.children.map(c => c.name), setSize: sz(set), sectionAt: Math.round(sec.x) + ',' + Math.round(sec.y), sectionSize: sz(sec), archiveX: arch ? Math.round(arch.x) : '-', unboundFills: bad, sectionOverlaps: overlaps.length ? overlaps : 'none', noteWidth: Math.round(t.width) };
});

// ---------- READ-ONLY structure report for step 285 ----------
await step('inspect: Account menu row', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Account menu');
  const v = set.children.find(c => c.name === 'Device=Desktop, Role=Other');
  const row = v.findOne(n => n.name === 'Row · My contacts');
  const rows = v.findAll(n => /^Row ·/.test(n.name));
  report.info.accountRow = { rowType: row.type, size: sz(row), tree: row.findAll(() => true).slice(0, 10).map(n => n.name + '(' + n.type.toLowerCase() + ' ' + sz(n) + ')'), rowHeights: rows.map(r => r.name.replace('Row · ', '') + ' ' + Math.round(r.height)), menuLayout: v.layoutMode + ' gap ' + v.itemSpacing + ' pad ' + v.paddingTop + '/' + v.paddingBottom, dividers: v.children.map(c => c.name + ':' + c.type.toLowerCase()).join(' | ') };
  if (row.type === 'INSTANCE') { const m = await row.getMainComponentAsync(); report.info.accountRow.main = m ? (m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent.name + ' / ' : '') + m.name : '-'; }
});
await step('inspect: Menu icon + Icon button names', async () => {
  const mi = p01.findOne(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && n.name === 'Menu icon');
  report.info.menuIcon = mi ? (mi.type === 'COMPONENT_SET' ? mi.children.map(c => c.name).join(' ; ') : 'single') : 'not found';
  if (mi && mi.type === 'COMPONENT_SET') report.info.menuIconSize = sz(mi.children[0]);
});
await step('inspect: Page notice / Empty card / Person row', async () => {
  for (const nm of ['Page notice', 'Empty card', 'Person row', 'Event row']) {
    const s = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === nm); if (!s) continue;
    const v = s.children[0];
    report.info['struct · ' + nm] = v.name + ' ' + sz(v) + ' layout ' + v.layoutMode + ' :: ' + v.findAll(() => true).slice(0, 16).map(n => n.name + '(' + n.type.toLowerCase() + ' ' + sz(n) + (n.type === 'TEXT' ? ' "' + n.characters.slice(0, 40) + '"' : '') + ')').join(' > ');
  }
});
return report;
