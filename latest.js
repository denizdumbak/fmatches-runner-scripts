// step 217 · INSPECT (salt okunur): Map marker, Map result row, Map panel, Map controls, color/map degiskenleri
const report = { info: {} };
const p01 = figma.root.children.find(p => /^01/.test(p.name)); const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
const hexc = c => '#' + [c.r, c.g, c.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
function line(n, d, max) {
  let s = n.type + ' "' + n.name + '" ' + Math.round(n.width) + 'x' + Math.round(n.height) + ' @' + Math.round(n.x) + ',' + Math.round(n.y);
  if ('layoutMode' in n && n.layoutMode !== 'NONE') s += ' ' + n.layoutMode;
  if (n.type === 'TEXT') s += ' "' + n.characters.slice(0, 24) + '"';
  if ('fills' in n && n.fills !== figma.mixed && n.fills.length) { const f = n.fills[0]; s += ' fill:' + (f.type === 'SOLID' ? hexc(f.color) + (n.fills[0].boundVariables && n.fills[0].boundVariables.color ? '(var)' : '') : f.type); }
  if (n.visible === false) s += ' HIDDEN';
  return s;
}
function dump(n, d, max, out) { out.push('  '.repeat(d) + line(n, d)); if (d < max && 'children' in n) for (const c of n.children) dump(c, d + 1, max, out); return out; }
const sec7 = p01.children.find(n => n.type === 'SECTION' && /^7 /.test(n.name));
const mk = sec7.children.find(n => n.name === 'Map marker');
report.info.markerVariants = mk.children.map(v => v.name).join(' | ');
report.info.markerClub = dump(mk.children.find(v => v.name === 'Kind=Club, State=Default'), 0, 3, []);
report.info.markerClubSel = dump(mk.children.find(v => v.name === 'Kind=Club, State=Selected'), 0, 3, []);
report.info.resultRow = dump(sec7.children.find(n => n.name === 'Map result row'), 0, 3, []);
report.info.controls = dump(sec7.children.find(n => n.name === 'Map controls'), 0, 1, []);
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web'); const mapSec = web.children.find(n => n.type === 'SECTION' && n.name === 'Map');
report.info.mapSecPos = Math.round(mapSec.x) + ',' + Math.round(mapSec.y) + ' ' + Math.round(mapSec.width) + 'x' + Math.round(mapSec.height) + ' · web ' + Math.round(web.width) + 'x' + Math.round(web.height);
const pg = mapSec.children.find(n => n.name === 'Map / Events · Desktop');
report.info.pageTop = dump(pg, 0, 1, []);
const area = pg.findOne(n => n.name === 'Map area'); report.info.areaKids = area.children.filter(n => !/^(Marker|Cluster) ·/.test(n.name)).map(n => line(n, 0));
const panel = pg.findOne(n => n.name === 'Map panel'); report.info.panel = dump(panel, 0, 3, []);
const vars = await figma.variables.getLocalVariablesAsync(); report.info.mapVars = vars.filter(v => /^color\/map\//.test(v.name)).map(v => v.name);
const cols = await figma.variables.getLocalVariableCollectionsAsync(); const cc = cols.find(c => c.name === 'Color'); const mv0 = vars.find(v => v.name === 'color/map/club'); report.info.clubVar = mv0 ? JSON.stringify(mv0.valuesByMode[cc.modes[0].modeId]) : 'none';
return report;
