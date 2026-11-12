// step 384 · INSPECT (salt okunur): Search results ekranlari, sekme/filtre yapisi, Player/Club/Facility result component'leri. Faz 7 arama sekmeleri (Managers & officials, Intermediaries) hazirligi
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const skip = /^(Ticker|Navigation|Footer)/;
function dump(n, depth, max, out, ind) {
  if (depth > max) return;
  let extra = '';
  if (n.type === 'TEXT') extra = ' "' + String(n.characters).slice(0, 40).replace(/\n/g, ' ') + '"';
  if (n.type === 'INSTANCE') { try { const cp = n.componentProperties; const ks = Object.keys(cp).filter(k => cp[k].type === 'VARIANT').map(k => k.replace(/#.*/, '') + '=' + cp[k].value); if (ks.length) extra = ' {' + ks.join(',') + '}'; } catch (e) {} }
  const lm = n.layoutMode && n.layoutMode !== 'NONE' ? ' ' + n.layoutMode[0] + (n.layoutWrap === 'WRAP' ? 'W' : '') : '';
  out.push(ind + n.name + ' [' + n.type[0] + n.type.slice(1, 4).toLowerCase() + '] ' + R(n.width) + 'x' + R(n.height) + lm + extra + (n.visible === false ? ' (hidden)' : ''));
  if (n.children && !(n.type === 'INSTANCE' && depth >= 3)) for (const c of n.children) { if (depth === 0 && skip.test(c.name)) { out.push(ind + '  ' + c.name + ' (atlandi)'); continue; } dump(c, depth + 1, max, out, ind + '  '); }
}
const plats = {}, secs = {};
for (const plat of ['Web', 'Mobile']) { plats[plat] = p02.children.find(n => n.type === 'SECTION' && n.name === plat); secs[plat] = plats[plat] && plats[plat].children.find(n => n.type === 'SECTION' && n.name === 'Search results'); }
await step('Section', async () => {
  const log = [];
  for (const plat of ['Web', 'Mobile']) { const s = secs[plat]; if (!s) { log.push(plat + ': Search results Section yok'); continue; } log.push(plat + ' Section ' + R(s.x) + ',' + R(s.y) + ' ' + R(s.width) + 'x' + R(s.height)); for (const c of s.children) log.push('  ' + c.name + ' @' + R(c.x) + ',' + R(c.y) + ' ' + R(c.width) + 'x' + R(c.height)); }
  report.info.sections = log;
});
await step('Web Players dokumu', async () => {
  const f = secs.Web.children.find(c => /Players/.test(c.name)); const out = []; dump(f, 0, 6, out, ''); report.info.webPlayers = out;
});
await step('Web All results dokumu', async () => {
  const f = secs.Web.children.find(c => /All results/.test(c.name)); const out = []; dump(f, 0, 4, out, ''); report.info.webAll = out;
});
await step('Mobile Players ve Filters dokumu', async () => {
  const a = secs.Mobile.children.find(c => /Players/.test(c.name)); const b = secs.Mobile.children.find(c => /Filters/.test(c.name));
  const o1 = [], o2 = []; dump(a, 0, 5, o1, ''); dump(b, 0, 5, o2, ''); report.info.mobPlayers = o1; report.info.mobFilters = o2;
});
await step('Sekme satiri ve Clubs/Facilities/Events filtre ozeti', async () => {
  const log = [];
  for (const nm of ['Clubs', 'Facilities', 'Events']) { const f = secs.Web.children.find(c => new RegExp('/ ' + nm).test(c.name)); if (!f) { log.push(nm + ': yok'); continue; } const panel = f.findOne(n => /Filter/.test(n.name) && n.type !== 'TEXT' && n.width >= 300 && n.width <= 310); const labs = panel ? panel.findAll(n => n.type === 'TEXT').map(t => t.characters).slice(0, 30) : []; log.push(nm + ' panel: ' + (panel ? panel.name + ' ' + R(panel.width) + 'x' + R(panel.height) : 'yok') + ' | ' + labs.join(' | ')); }
  report.info.otherPanels = log;
});
await step('Component envanteri (01)', async () => {
  const log = [];
  const all = p01.findAll(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && /result|Filter|Tab|Segment|Chip|Table header|Person row|Empty card|Select|Checkbox|Radio/i.test(n.name) && !(n.parent && n.parent.type === 'COMPONENT_SET'));
  for (const c of all) { const props = c.type === 'COMPONENT_SET' ? Object.keys(c.componentPropertyDefinitions).map(k => k.replace(/#.*/, '') + '(' + (c.componentPropertyDefinitions[k].variantOptions ? c.componentPropertyDefinitions[k].variantOptions.join('|') : c.componentPropertyDefinitions[k].type) + ')').join(', ') : ''; log.push(c.name + ' [' + c.type + '] ' + (c.type === 'COMPONENT_SET' ? c.children.length + ' var' : R(c.width) + 'x' + R(c.height)) + ' · ' + props + ' · parent ' + (c.parent && c.parent.name)); }
  report.info.components = log;
});
await step('Player result ic yapisi (1 varyant)', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Player result'); if (!set) { report.info.playerResult = ['Player result set bulunamadi']; return; }
  const v = set.children[0]; const out = []; dump(v, 0, 5, out, ''); report.info.playerResult = [v.name].concat(out);
});
report.info.pageChildren = p02.children.length;
return JSON.stringify(report, null, 1);
