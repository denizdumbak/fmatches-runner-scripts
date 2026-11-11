// step 380 · Sergey 11 Kasim: kulup kartinda (1) hero'dan Teams fact'i kalkar (2) Visit website butonu kalkar, web adresi Location kartinda sessiz satir (3) oyuncu/staff listesi sikilasir (satir arasi 24 -> 8, masaustu satir ici dikey bosluk azalir) (4) View facility butonu cizgiden ayrilir; Section'lar kisalir
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const R = n => Math.round(n);
const allVars = await figma.variables.getLocalVariablesAsync();
async function resolveVal(v) { let val = v.valuesByMode[Object.keys(v.valuesByMode)[0]]; let g = 0; while (val && val.type === 'VARIABLE_ALIAS' && g++ < 6) { const t = await figma.variables.getVariableByIdAsync(val.id); val = t.valuesByMode[Object.keys(t.valuesByMode)[0]]; } return val; }
const spaceMap = {};
for (const v of allVars.filter(x => x.resolvedType === 'FLOAT' && /space|spacing|gap|pad/i.test(x.name))) { const val = await resolveVal(v); if (typeof val === 'number' && (spaceMap[val] === undefined || /^space\//i.test(v.name) && !/^space\//i.test(spaceMap[val].name))) spaceMap[val] = v; }
const SP = n => { const v = spaceMap[n]; if (!v) throw new Error('spacing degiskeni yok: ' + n); return v; };
report.info.spaceVars = [4, 8, 12, 16].map(n => n + ':' + (spaceMap[n] ? spaceMap[n].name : 'YOK')).join(' ');
const borderVar = allVars.find(v => /^border\/(subtle|default|muted)$/i.test(v.name)) || allVars.find(v => /^border/i.test(v.name) && v.resolvedType === 'COLOR');
report.info.borderVar = borderVar ? borderVar.name : 'YOK';
const secs = {}; for (const plat of ['Web', 'Mobile']) secs[plat] = p02.children.find(n => n.type === 'SECTION' && n.name === plat).children.find(n => n.type === 'SECTION' && n.name === 'Club card');
const screens = []; for (const plat of ['Web', 'Mobile']) for (const f of secs[plat].children.filter(c => c.type === 'FRAME')) screens.push({ plat, f });
report.info.screens = screens.map(s => s.plat[0] + ':' + s.f.name.replace('Clubs / Club card', 'CC')).join(' | ');
const before = {}; screens.forEach(s => before[s.f.id] = R(s.f.height));

// 1 + 2: Teams fact ve Visit website
await step('1-2 Teams fact + Visit website', async () => {
  let facts = 0, btns = 0; const parents = [];
  for (const { f } of screens) {
    for (const n of f.findAll(x => x.type === 'INSTANCE' && x.name === 'Fact · Teams')) { n.remove(); facts++; }
    for (const b of f.findAll(x => x.type === 'INSTANCE' && x.name === 'Button · Visit website')) {
      const p = b.parent; b.remove(); btns++; parents.push(p.name + ' ' + R(p.width) + 'x' + R(p.height) + (p.children.length === 0 ? ' (bos)' : ''));
      if (p.children.length === 0 && /action|button|cta/i.test(p.name)) { const pp = p.parent; p.remove(); parents.push('  bos kap silindi, ust: ' + pp.name + ' ' + R(pp.width) + 'x' + R(pp.height)); }
    }
  }
  report.info.removed = { teamsFacts: facts, visitButtons: btns, parents };
});

// 3: Website satiri (Location karti)
const GLOBE = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>';
await step('3 Website row', async () => {
  const log = [];
  for (const { plat, f } of screens) {
    if (/Minimal/i.test(f.name)) { log.push(plat[0] + ' Minimal: atlandi'); continue; }
    let card = f.findAll(n => /^Location · /.test(n.name) && (n.type === 'FRAME' || n.type === 'INSTANCE'))[0];
    if (!card) { log.push(plat[0] + ' ' + f.name + ': Location karti yok'); continue; }
    if (card.findOne(n => n.name === 'Website row')) { log.push(plat[0] + ' ' + f.name + ': zaten var'); continue; }
    if (card.type === 'INSTANCE') { card = card.detachInstance(); log.push(plat[0] + ' ' + f.name + ': Location ayrildi (detach)'); }
    const mapB = card.findOne(n => n.name === 'Map' && n.type === 'FRAME'); const mapBefore = mapB ? R(mapB.height) : -1;
    const body = card.findOne(n => n.name === 'Body' && n.type === 'FRAME'); if (!body) throw new Error(f.name + ': Body yok');
    if (card.layoutMode === 'NONE' || body.parent.layoutMode === 'NONE') throw new Error(f.name + ': Location auto layout degil');
    const row = body.clone(); row.name = 'Website row';
    const iconF = row.children.find(c => c.name === 'Icon'); const old = iconF.findOne(n => n.type === 'VECTOR');
    const ref = old && old.strokes && old.strokes.length ? old.strokes : (old ? old.fills : []);
    for (const k of iconF.children.slice()) k.remove();
    const svg = figma.createNodeFromSvg(GLOBE);
    for (const g of svg.findAll(n => n.type !== 'FRAME' && 'strokes' in n)) { g.strokes = ref; if ('fills' in g) g.fills = []; }
    iconF.appendChild(svg); svg.resize(20, 20); svg.x = 0; svg.y = 0;
    const place = row.findOne(n => n.name === 'Place'), hint = row.findOne(n => n.name === 'Hint'), act = row.findOne(n => n.name === 'Action');
    await figma.loadFontAsync(place.fontName); place.characters = 'spreeufer-fc.de'; place.textDecoration = 'UNDERLINE';
    await figma.loadFontAsync(hint.fontName); hint.characters = 'Club website';
    if (act) act.visible = false;
    if (borderVar) { row.strokes = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', borderVar)]; row.strokeTopWeight = 1; row.strokeBottomWeight = 0; row.strokeLeftWeight = 0; row.strokeRightWeight = 0; }
    body.parent.insertChild(body.parent.children.indexOf(body) + 1, row);
    row.layoutSizingHorizontal = 'FILL';
    log.push(plat[0] + ' ' + f.name.replace('Clubs / Club card', 'CC') + ': row eklendi, map ' + mapBefore + ' -> ' + (mapB ? R(mapB.height) : -1) + ', row ' + R(row.width) + 'x' + R(row.height));
  }
  report.info.websiteRows = log;
});

// 4: liste siki
await step('4 Rows list + satir ici', async () => {
  const log = []; const v8 = SP(8), v12 = spaceMap[12];
  for (const { plat, f } of screens) {
    const teams = f.findAll(n => n.type === 'FRAME' && n.name === 'Teams' && n.layoutMode === 'VERTICAL')[0]; if (!teams) continue;
    if (teams.findOne(n => n.name === 'Rows list')) { log.push(plat[0] + ' ' + f.name + ': zaten sarildi'); continue; }
    const kids = teams.children.filter(c => /^(Player|Person row) · /.test(c.name) || c.name === 'Table header'); if (!kids.length) continue;
    const h0 = kids.filter(k => /^(Player|Person row) · /.test(k.name)).map(k => R(k.height));
    const idx = teams.children.indexOf(kids[0]);
    const list = figma.createFrame(); list.name = 'Rows list'; list.fills = []; list.layoutMode = 'VERTICAL'; list.clipsContent = false; list.setBoundVariable('itemSpacing', v8);
    teams.insertChild(idx, list); list.layoutSizingHorizontal = 'FILL'; list.layoutSizingVertical = 'HUG';
    for (const k of kids) { list.appendChild(k); k.layoutSizingHorizontal = 'FILL'; }
    if (plat === 'Web') for (const k of kids) { if (/^Player · /.test(k.name)) { k.setBoundVariable('paddingTop', v8); k.setBoundVariable('paddingBottom', v8); } else if (/^Person row · /.test(k.name) && v12) { k.setBoundVariable('paddingTop', v12); k.setBoundVariable('paddingBottom', v12); } }
    log.push(plat[0] + ' ' + f.name.replace('Clubs / Club card', 'CC') + ': ' + kids.length + ' oge, satir ' + h0.join('/') + ' -> ' + kids.filter(k => /^(Player|Person row) · /.test(k.name)).map(k => R(k.height)).join('/') + ', Teams ' + R(teams.height));
  }
  report.info.lists = log;
});

// 5: View facility
await step('5 View facility', async () => {
  const log = []; const v16 = SP(16), v4 = SP(4);
  for (const { plat, f } of screens) for (const b of f.findAll(n => n.type === 'INSTANCE' && n.name === 'Button · View facility')) {
    const p = b.parent; if (p.name === 'View facility row') continue;
    if (p.layoutMode === 'NONE') { log.push(f.name + ': ust auto layout degil (' + p.name + ')'); continue; }
    const wrap = figma.createFrame(); wrap.name = 'View facility row'; wrap.fills = []; wrap.layoutMode = 'HORIZONTAL'; wrap.clipsContent = false;
    wrap.setBoundVariable('paddingTop', v16); wrap.setBoundVariable('paddingBottom', v4);
    p.insertChild(p.children.indexOf(b), wrap); wrap.layoutSizingHorizontal = 'FILL'; wrap.layoutSizingVertical = 'HUG'; wrap.appendChild(b);
    log.push(plat[0] + ' ' + f.name.replace('Clubs / Club card', 'CC') + ' / ' + p.name + ': dugme ust bosluk 16');
  }
  report.info.viewFacility = log;
});

// Section'lar kisalir
await step('Section kisalt', async () => {
  const log = [];
  for (const plat of ['Web', 'Mobile']) { const s = secs[plat]; let bottom = 0; for (const c of s.children) bottom = Math.max(bottom, c.y + c.height); const nh = Math.ceil(bottom + 80); log.push(plat + ' Section ' + R(s.height) + ' -> ' + nh); if (nh < s.height) s.resizeWithoutConstraints(s.width, nh); }
  report.info.sections = log;
});
report.info.heights = screens.map(s => s.plat[0] + ':' + s.f.name.replace('Clubs / Club card', 'CC') + ' ' + before[s.f.id] + ' -> ' + R(s.f.height)).join('\n');
// kontrol
let gray = 0, unstyled = 0; for (const { f } of screens) { for (const n of f.findAll(x => x.type === 'TEXT' && x.textStyleId === '' )) unstyled++; }
report.info.unstyledText = unstyled;
const ids = new Set(); const dead = []; for (const { f } of screens) for (const n of f.findAll(x => 'reactions' in x && x.reactions.length)) for (const r of x_acts(n)) { if (r && r.destinationId && !(await figma.getNodeByIdAsync(r.destinationId))) dead.push(n.name); }
function x_acts(n) { const out = []; for (const r of n.reactions) for (const a of (r.actions || (r.action ? [r.action] : []))) out.push(a); return out; }
report.info.brokenLinks = dead.length;
return JSON.stringify(report, null, 1);
