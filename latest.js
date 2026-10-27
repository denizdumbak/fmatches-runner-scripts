// step 221 · INSPECT (salt okunur): Clubs ekranlarindaki Filters, Filter chip ve Form field setleri
const report = { info: {} };
const p01 = figma.root.children.find(p => /^01/.test(p.name)); const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
const hexc = c => '#' + [c.r, c.g, c.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
function line(n) {
  let s = n.type + ' "' + n.name + '" ' + Math.round(n.width) + 'x' + Math.round(n.height) + ' @' + Math.round(n.x) + ',' + Math.round(n.y);
  if ('layoutMode' in n && n.layoutMode !== 'NONE') s += ' ' + n.layoutMode;
  if (n.type === 'TEXT') s += ' "' + n.characters.slice(0, 28) + '"';
  if (n.visible === false) s += ' HIDDEN';
  return s;
}
function dump(n, d, max, out) { out.push('  '.repeat(d) + line(n)); if (d < max && 'children' in n) for (const c of n.children) dump(c, d + 1, max, out); return out; }
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web'); const mapSec = web.children.find(n => n.type === 'SECTION' && n.name === 'Map');
for (const nm of ['Map / Default · Desktop', 'Map / Club card · Desktop', 'Map / No results · Desktop']) {
  const pg = mapSec.children.find(n => n.name === nm); const f = pg && pg.findOne(n => n.name === 'Filters');
  report.info[nm] = f ? dump(f, 0, nm === 'Map / Default · Desktop' ? 3 : 1, []) : 'no Filters';
}
const sec1 = p01.findAll(n => n.type === 'COMPONENT_SET' && /^(Filter chip|Form field|Chip)/.test(n.name));
report.info.sets = sec1.map(s => s.name + ' · ' + s.children.length + ' variants · ' + s.children.slice(0, 4).map(v => v.name).join(' ; '));
const chip = sec1.find(s => /^Filter chip/.test(s.name)); if (chip) report.info.chip = dump(chip.children[0], 0, 2, []);
const ff = sec1.find(s => /^Form field/.test(s.name)); if (ff) report.info.formFieldVariants = ff.children.map(v => v.name).join(' | ');
return report;
