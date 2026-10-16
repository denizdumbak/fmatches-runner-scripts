// step 124 · inspect (salt okunur): directory profilinde siluet neden gorunmuyor; ana profil ve directory hero yapisi

const report = { info: {} };
const r = n => Math.round(n);
const web = figma.root.children.find(p => /^02/.test(p.name));
await web.loadAsync();

function fillInfo(n) {
  if (!('fills' in n) || !Array.isArray(n.fills) || !n.fills.length) return '';
  return ' fills[' + n.fills.map(f => f.type + (f.visible === false ? '(off)' : '') + (f.opacity !== undefined && f.opacity < 1 ? '@' + Math.round(f.opacity * 100) : '')).join(',') + ']';
}
function line(n, depth) {
  let s = '  '.repeat(depth) + n.name + ' <' + n.type + '> ' + r(n.x) + ',' + r(n.y) + ' ' + r(n.width) + 'x' + r(n.height);
  if (n.visible === false) s += ' HIDDEN';
  if ('opacity' in n && n.opacity < 1) s += ' op' + Math.round(n.opacity * 100);
  if ('layoutMode' in n && n.layoutMode && n.layoutMode !== 'NONE') s += ' ' + n.layoutMode + ' gap' + n.itemSpacing + ' pad' + [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].join('/');
  if ('layoutPositioning' in n && n.layoutPositioning === 'ABSOLUTE') s += ' ABS';
  if ('clipsContent' in n && n.clipsContent) s += ' clip';
  if ('itemReverseZIndex' in n && n.itemReverseZIndex) s += ' reverseZ';
  s += fillInfo(n);
  return s;
}
function tree(n, depth, max, out) {
  out.push(line(n, depth));
  if (depth >= max || n.type === 'INSTANCE' || !('children' in n)) return;
  for (const k of n.children) tree(k, depth + 1, max, out);
}

for (const f of web.findAll(n => n.type === 'FRAME' && /^Profiles \/ Player( · | \/ Directory)/.test(n.name) && n.parent && n.parent.type === 'SECTION')) {
  const out = [];
  out.push(line(f, 0));
  for (const k of f.children) out.push(line(k, 1));
  const hero = f.findOne(n => /^Hero/.test(n.name));
  if (hero) {
    const id = hero.findOne(n => n.name === 'Identity');
    for (const k of hero.children) { if (k === id) out.push(line(k, 2) + ' (identity, skipped)'); else tree(k, 2, 5, out); }
  }
  report.info[f.name] = out;
}
return report;
