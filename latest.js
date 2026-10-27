// step 231 · Bottom sheet: Filters pill in Summary (all variants) + wire Filters -> Map / Filters · Mobile; flow starts written without duplicate node ids

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync(); await figma.setCurrentPageAsync(p01);
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const tryV = (...names) => { for (const n of names) { const v = allVars.find(x => x.name === n); if (v) return v; } throw new Error('none of: ' + names.join(', ')); };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const texts = await figma.getLocalTextStylesAsync(); const S_LABEL = texts.find(t => t.name === 'Label/Default') || texts.find(t => t.name.indexOf('Label/Default') === 0);
await figma.loadFontAsync(S_LABEL.fontName);
const SLIDERS = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/></svg>';
const sheetSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Bottom sheet');
await step('Filters pill in Bottom sheet variants', async () => {
  if (!sheetSet) throw new Error('Bottom sheet set missing'); let done = 0;
  for (const v of sheetSet.children) {
    const sum = v.findOne(n => n.type === 'FRAME' && n.name === 'Summary'); if (!sum) { report.errors.push('no Summary in ' + v.name); continue; }
    if (sum.findOne(n => n.name === 'Filters')) continue;
    const clr = sum.findOne(n => n.type === 'TEXT' && n.name === 'Clear all'); if (!clr) { report.errors.push('no Clear all in ' + v.name); continue; }
    const act = figma.createFrame(); act.name = 'Actions'; act.layoutMode = 'HORIZONTAL'; act.primaryAxisSizingMode = 'AUTO'; act.counterAxisSizingMode = 'AUTO'; act.counterAxisAlignItems = 'CENTER'; act.itemSpacing = 12; act.fills = [];
    const pill = figma.createFrame(); pill.name = 'Filters'; pill.layoutMode = 'HORIZONTAL'; pill.primaryAxisSizingMode = 'AUTO'; pill.counterAxisSizingMode = 'AUTO'; pill.counterAxisAlignItems = 'CENTER'; pill.itemSpacing = 6;
    pill.paddingLeft = 12; pill.paddingRight = 12; pill.paddingTop = 6; pill.paddingBottom = 6; pill.fills = []; pill.strokes = [P(V('color/border/default'))]; pill.strokeWeight = 1;
    for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) pill.setBoundVariable(k, V('radius/full'));
    const ic = figma.createNodeFromSvg(SLIDERS); ic.name = 'Icon'; ic.fills = []; ic.resize(16, 16); const walk = x => { if ('children' in x) x.children.forEach(walk); if (x.type !== 'FRAME' && x.type !== 'GROUP' && x.strokes && x.strokes.length) x.strokes = [P(V('color/icon/default'))]; }; walk(ic); pill.appendChild(ic);
    const t = figma.createText(); await t.setTextStyleIdAsync(S_LABEL.id); t.characters = 'Filters'; t.name = 'Label'; t.fills = [P(V('color/text/primary'))]; pill.appendChild(t);
    act.appendChild(pill); sum.insertChild(sum.children.indexOf(clr), act); act.appendChild(clr); done++;
  }
  report.info.pillsAdded = done;
});
await figma.setCurrentPageAsync(p02);
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web'); const mob = p02.children.find(n => n.type === 'SECTION' && /^Mobile/.test(n.name));
const mMap = mob.children.find(n => n.type === 'SECTION' && n.name === 'Map'); const dMap = web.children.find(n => n.type === 'SECTION' && n.name === 'Map');
const M = {}; for (const n of mMap.children) if (/ · Mobile$/.test(n.name)) M[n.name.replace('Map / ', '').replace(' · Mobile', '')] = n;
const D = {}; for (const n of dMap.children) if (/ · Desktop$/.test(n.name)) D[n.name.replace('Map / ', '').replace(' · Desktop', '')] = n;
const nav = dest => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
await step('wire Filters pills', async () => {
  let c = 0; const miss = [];
  for (const k of ['Default', 'Club card', 'Stadium card', 'Events', 'Match requests', 'List']) {
    const sheet = M[k] && M[k].findOne(n => n.type === 'INSTANCE' && /^Bottom sheet/.test(n.name)); const pill = sheet && sheet.findOne(n => n.name === 'Filters' && n.type === 'FRAME');
    if (!pill) { miss.push(k); continue; }
    await pill.setReactionsAsync((pill.reactions || []).filter(rx => !(rx.actions || []).some(isNavAct)).concat([nav(M['Filters'])])); c++;
  }
  report.info.filtersWired = c; if (miss.length) report.errors.push('Filters pill not found on: ' + miss.join(', '));
});
await step('flow starts', async () => {
  const names = ['Web · Interactive map', 'Web · Scouts near you', 'Mobile · Interactive map', 'Mobile · Scouts near you'];
  const add = [[D['Default'], names[0]], [D['Scouts near you · ask'], names[1]], [M['Default'], names[2]], [M['Scouts near you'], names[3]]];
  const keep = [], seen = new Set();
  for (const s of (p02.flowStartingPoints || [])) { if (names.indexOf(s.name) >= 0 || seen.has(s.nodeId)) continue; seen.add(s.nodeId); keep.push({ nodeId: s.nodeId, name: s.name }); }
  for (const [n, nm] of add) { if (!n) { report.errors.push('flow start screen missing: ' + nm); continue; } if (seen.has(n.id)) { report.errors.push('flow start node already used: ' + nm); continue; } seen.add(n.id); keep.push({ nodeId: n.id, name: nm }); }
  p02.flowStartingPoints = keep; report.info.flowStarts = keep.length;
  report.info.flowStartList = keep.map(k => k.name).join(' | ');
});
// overflow check: Summary content fits 358 on every mobile map screen
const over = []; for (const k of Object.keys(M)) for (const s of M[k].findAll(n => n.type === 'FRAME' && n.name === 'Summary')) { const kids = s.children; const w = kids.reduce((a, c) => a + c.width, 0); if (w > s.width) over.push(k + ': ' + Math.round(w) + '>' + Math.round(s.width)); }
report.info.summaryOverflow = over.length ? over : 'none';
return report;
