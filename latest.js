// step 126 · inspect (salt okunur): Club entry component'i ve profillerdeki Career kartlari

const report = { info: {} };
const r = n => Math.round(n);
function line(n, depth) {
  let s = '  '.repeat(depth) + n.name + ' <' + n.type + '> ' + r(n.x) + ',' + r(n.y) + ' ' + r(n.width) + 'x' + r(n.height);
  if (n.visible === false) s += ' HIDDEN';
  if ('layoutMode' in n && n.layoutMode && n.layoutMode !== 'NONE') s += ' ' + n.layoutMode + ' gap' + n.itemSpacing + ' pad' + [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].join('/') + ' align' + n.counterAxisAlignItems;
  if ('layoutSizingHorizontal' in n) s += ' ' + n.layoutSizingHorizontal + '/' + n.layoutSizingVertical;
  if (n.type === 'TEXT') s += ' "' + n.characters.slice(0, 40) + '"' + (n.textStyleId ? ' style' : ' NOSTYLE');
  if (n.type === 'INSTANCE' && n.variantProperties) s += ' ' + JSON.stringify(n.variantProperties);
  return s;
}
function tree(n, depth, max, out, intoInst) {
  out.push(line(n, depth));
  if (depth >= max || !('children' in n)) return;
  if (n.type === 'INSTANCE' && !intoInst) return;
  for (const k of n.children) tree(k, depth + 1, max, out, intoInst);
}

const p1 = figma.root.children.find(p => /^01/.test(p.name));
await p1.loadAsync();
const ce = p1.findOne(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && /Club entry/.test(n.name));
if (ce) {
  const out = [];
  tree(ce, 0, 6, out, false);
  report.info.clubEntry = out;
  report.info.clubEntryDesc = ce.description || '';
  if (ce.type === 'COMPONENT_SET') report.info.clubEntryProps = JSON.stringify(ce.componentPropertyDefinitions);
} else report.info.clubEntry = 'not found';

const textStyles = (await figma.getLocalTextStylesAsync()).map(s => s.name + ' ' + s.fontName.family + ' ' + s.fontName.style + ' ' + s.fontSize);
report.info.textStyles = textStyles;

const web = figma.root.children.find(p => /^02/.test(p.name));
await web.loadAsync();
for (const f of web.findAll(n => n.type === 'FRAME' && /^Profiles \/ Player/.test(n.name) && n.parent && n.parent.type === 'SECTION')) {
  const career = f.findOne(n => n.type === 'FRAME' && n.name === 'Career');
  if (!career) { report.info[f.name] = 'no Career'; continue; }
  const out = [];
  tree(career, 0, 3, out, false);
  report.info[f.name] = out;
}
return report;
