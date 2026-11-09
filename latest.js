// step 360 · INSPECT (salt okunur): Position filters çocukları, Form field Select, Option list/row iç yapısı
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const r = n => Math.round(n);
const box = n => n.absoluteBoundingBox ? r(n.absoluteBoundingBox.width) + 'x' + r(n.absoluteBoundingBox.height) : '-';
const lay = n => ('layoutMode' in n && n.layoutMode !== 'NONE') ? n.layoutMode + (n.layoutWrap === 'WRAP' ? '/WRAP' : '') + ' g' + n.itemSpacing + ' p' + [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].join('/') : '';
const sz = n => 'layoutSizingHorizontal' in n ? ' H:' + n.layoutSizingHorizontal + ' V:' + n.layoutSizingVertical : '';
function dump(n, depth, max, out, ind) {
  if (!n || depth > max) return;
  out.push(ind + n.type + ' · ' + n.name + ' [' + box(n) + '] ' + lay(n) + sz(n) + (n.type === 'TEXT' ? ' "' + String(n.characters).slice(0, 30) + '"' : ''));
  if ('children' in n && (n.type !== 'INSTANCE' || depth === 0)) for (const c of n.children.slice(0, 8)) dump(c, depth + 1, max, out, ind + '  ');
}
await step('position filters', async () => {
  for (const plat of ['Web', 'Mobile']) {
    const P = p02.children.find(n => n.type === 'SECTION' && n.name === plat);
    const sec = P.children.find(n => n.type === 'SECTION' && n.name === 'Shortlists');
    const f = sec.children.find(c => c.type === 'FRAME' && /Shortlists \/ Shortlists/.test(c.name) && !/No players/.test(c.name));
    const pf = f.findOne(n => n.name === 'Position filters');
    const out = [];
    report.info[plat + ' column order'] = pf.parent.children.map(c => c.name + ' [' + box(c) + ']');
    report.info[plat + ' pf children'] = pf.children.map(c => c.type + ' ' + c.name + ' ' + box(c)).slice(0, 4).concat(['... toplam ' + pf.children.length]);
    dump(pf.children[1], 0, 2, out, '');
    report.info[plat + ' chip sample'] = out;
    report.info[plat + ' pf sizing'] = lay(pf) + sz(pf) + ' | column: ' + lay(pf.parent) + sz(pf.parent);
    report.info[plat + ' pf reactions'] = pf.children.slice(0, 3).map(c => (c.reactions || []).length);
  }
});
await step('library detail', async () => {
  const find = re => p01.findOne(n => n.type === 'COMPONENT_SET' && re.test(n.name));
  const ff = find(/^Form field$/); const v = ff.children.find(k => k.name === 'Type=Select, State=Default');
  let out = []; dump(v, 0, 3, out, ''); report.info.formFieldSelectTree = out;
  out = []; dump(ff.children.find(k => k.name === 'Type=Select, State=Focus'), 0, 1, out, ''); report.info.formFieldFocus = out;
  const ol = find(/^Option list$/); const kp = ol.children.find(k => /Positions/.test(k.name));
  out = []; dump(kp, 0, 1, out, ''); report.info.optionListShell = out.concat(['fills ' + JSON.stringify(kp.fills).slice(0, 120), 'effectStyle ' + kp.effectStyleId, 'radius ' + kp.cornerRadius, 'clips ' + kp.clipsContent]);
  out = []; dump(kp.children[0], 0, 3, out, ''); report.info.optionListRow = out;
  const orow = find(/^Option row$/); out = []; dump(orow.children[0], 0, 3, out, ''); report.info.optionRowDefault = out;
  out = []; dump(orow.children[2], 0, 1, out, ''); report.info.optionRowSelected = out;
  const where = ol.parent; report.info.optionListParent = where.type + ' ' + where.name + ' ' + box(where);
  const used = p02.findAll(n => n.type === 'INSTANCE' && /^Option list/.test(n.name)).length; report.info.optionListInstancesOn02 = used;
});
return report;
