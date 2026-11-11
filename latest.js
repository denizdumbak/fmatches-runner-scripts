// step 379 · INSPECT (salt okunur): Club card (Full, Staff tab) · hero key facts, Visit website, Location, Facility group, Player result, Person row ölçümü
const out = [];
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const R = n => Math.round(n);
const sec = plat => p02.children.find(n => n.type === 'SECTION' && n.name === plat).children.find(n => n.type === 'SECTION' && n.name === 'Club card');
const lay = n => ('layoutMode' in n && n.layoutMode !== 'NONE') ? (n.layoutMode === 'VERTICAL' ? 'V' : 'H') + ' pad ' + [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].map(R).join('/') + ' gap ' + R(n.itemSpacing) : '';
function dump(n, root, depth, max, ind) {
  const b = n.absoluteBoundingBox; const rb = root.absoluteBoundingBox;
  out.push(ind + n.name + ' [' + n.type + '] ' + (b ? R(b.width) + 'x' + R(b.height) + ' @' + R(b.x - rb.x) + ',' + R(b.y - rb.y) : '') + ' ' + lay(n) + (n.visible === false ? ' HIDDEN' : ''));
  if (depth < max && 'children' in n) { const ks = n.children.slice(0, 14); for (const k of ks) dump(k, root, depth + 1, max, ind + '  '); if (n.children.length > 14) out.push(ind + '  ... +' + (n.children.length - 14)); }
}
for (const plat of ['Web', 'Mobile']) {
  const s = sec(plat); const dev = plat === 'Web' ? 'Desktop' : 'Mobile';
  const full = s.children.find(c => c.type === 'FRAME' && c.name === 'Clubs / Club card · ' + dev);
  out.push('=== ' + plat + ' Full: ' + (full ? full.name + ' ' + R(full.width) + 'x' + R(full.height) : 'YOK'));
  if (!full) continue;
  const kf = full.findOne(n => /Key facts/i.test(n.name)); out.push('-- Key facts'); if (kf) dump(kf, full, 0, 3, '');
  out.push('-- Visit website'); full.findAll(n => /Visit website/i.test(n.name)).forEach(n => dump(n, full, 0, 1, ''));
  const loc = full.findAll(n => /^Location/i.test(n.name)); out.push('-- Location nodes: ' + loc.map(n => n.name + ' ' + n.type).join(' | '));
  if (loc[0]) dump(loc[0], full, 0, 3, '');
  const fg = full.findAll(n => /^Facility group/i.test(n.name)); out.push('-- Facility groups: ' + fg.map(n => n.name).join(' | '));
  if (fg[0]) dump(fg[0], full, 0, 4, '');
  const pr = full.findOne(n => /^Player result/i.test(n.name)); out.push('-- Player result'); if (pr) dump(pr, full, 0, 3, '');
  const tm = full.findOne(n => /^Team select/i.test(n.name)); out.push('-- Team select / Teams card'); if (tm) { dump(tm.parent, full, 0, 1, ''); }
}
const sd = sec('Web').children.find(c => c.type === 'FRAME' && c.name === 'Clubs / Club card / Staff tab · Desktop');
out.push('=== Staff tab desktop: ' + (sd ? 'var' : 'YOK'));
if (sd) { const pe = sd.findOne(n => /^Person row/i.test(n.name) && n.parent && /Staff|Team/i.test(n.parent.name + (n.parent.parent ? n.parent.parent.name : ''))) || sd.findAll(n => /^Person row/i.test(n.name))[0]; if (pe) { dump(pe.parent, sd, 0, 1, ''); dump(pe, sd, 0, 3, ''); } }
// ayni component aramada kullaniliyor mu
const search = p02.findAll(n => /^Player result/i.test(n.name) && n.type === 'INSTANCE').length;
out.push('Player result instance sayisi (02 genel): ' + search);
const mainPR = (() => { const pr = sec('Web').findOne(n => /^Player result/i.test(n.name) && n.type === 'INSTANCE'); return pr; })();
if (mainPR) { const m = await mainPR.getMainComponentAsync(); out.push('Player result main: ' + (m ? m.name + ' / parent ' + (m.parent ? m.parent.name : '-') : '-')); }
return out.join('\n');
