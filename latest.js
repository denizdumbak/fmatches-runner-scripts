// step 375 · inspect (salt okunur): Club card iç yapısı: Management grid + Person row, Location + Map, Facilities satırı, Event row, mobil Management/Facilities
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const R = n => Math.round(n);
const BB = n => n.absoluteBoundingBox;
const secOf = (plat, name) => { const root = p02.children.find(n => n.type === 'SECTION' && n.name === plat); return root ? root.children.find(n => n.type === 'SECTION' && n.name === name) : null; };
async function dump(n, base, max, depth, out, intoInstances) {
  const b = BB(n); const pad = '  '.repeat(depth);
  let s = pad + n.name + ' [' + n.type + (n.layoutMode && n.layoutMode !== 'NONE' ? ' ' + n.layoutMode : '') + (n.layoutWrap === 'WRAP' ? ' WRAP' : '') + '] ' + R(n.width) + 'x' + R(n.height);
  if (b && base) s += ' @' + R(b.x - base.x) + ',' + R(b.y - base.y);
  if (n.layoutSizingHorizontal) s += ' h:' + n.layoutSizingHorizontal;
  if (n.layoutSizingVertical) s += ' v:' + n.layoutSizingVertical;
  if ('itemSpacing' in n && n.layoutMode && n.layoutMode !== 'NONE') s += ' gap' + n.itemSpacing + (n.layoutWrap === 'WRAP' && n.counterAxisSpacing != null ? '/' + n.counterAxisSpacing : '');
  if ('paddingLeft' in n && n.layoutMode && n.layoutMode !== 'NONE') s += ' pad' + n.paddingTop + ',' + n.paddingRight + ',' + n.paddingBottom + ',' + n.paddingLeft;
  if (n.layoutPositioning === 'ABSOLUTE') s += ' ABS';
  if (n.visible === false) s += ' hidden';
  if (n.constraints && (n.constraints.horizontal !== 'MIN' || n.constraints.vertical !== 'MIN')) s += ' cons' + n.constraints.horizontal + '/' + n.constraints.vertical;
  if (n.type === 'TEXT') s += ' "' + String(n.characters).slice(0, 40) + '"';
  if (n.type === 'INSTANCE') { const m = await n.getMainComponentAsync(); s += ' main=' + (m ? (m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent.name + '/' : '') + m.name : '?') + ' {' + Object.keys(n.componentProperties).map(k => k + '=' + n.componentProperties[k].value).join(', ') + '}'; }
  if (n.type === 'RECTANGLE' && n.fills && n.fills[0] && n.fills[0].type === 'IMAGE') s += ' IMAGE:' + n.fills[0].scaleMode;
  out.push(s);
  if (depth < max && 'children' in n && (n.type !== 'INSTANCE' || intoInstances)) for (const c of n.children) await dump(c, base, max, depth + 1, out, intoInstances);
  return out;
}
const frameOf = (plat, nm) => { const sec = secOf(plat, 'Club card'); return sec.children.find(c => c.type === 'FRAME' && c.name === nm); };

await step('Desktop Management', async () => {
  const f = frameOf('Web', 'Clubs / Club card · Desktop');
  const m = f.findOne(n => n.name === 'Management' && n.type === 'FRAME');
  const out = await dump(m, BB(f), 2, 0, [], false);
  const firstRow = m.findOne(n => n.type === 'INSTANCE' && /^Person row/.test(n.name));
  out.push('--- Person row (ilk) ic yapisi:'); await dump(firstRow, BB(f), 5, 0, out, true);
  report.info.desktopManagement = out;
});
await step('Desktop Location + Map', async () => {
  const f = frameOf('Web', 'Clubs / Club card · Desktop');
  const l = f.findOne(n => /^Location ·/.test(n.name));
  report.info.desktopLocation = await dump(l, BB(f), 4, 0, [], false);
});
await step('Desktop Facilities + Event row', async () => {
  const f = frameOf('Web', 'Clubs / Club card · Desktop');
  const fac = f.findOne(n => n.name === 'Facilities' && n.type === 'FRAME');
  const out = await dump(fac, BB(f), 3, 0, [], false);
  const ev = f.findOne(n => n.type === 'INSTANCE' && /^Event row/.test(n.name));
  out.push('--- Event row ic yapisi:'); await dump(ev, BB(f), 4, 0, out, true);
  const ch = fac.findOne(n => n.name === 'Icon · chevron'); out.push('--- chevron:'); await dump(ch, BB(f), 3, 0, out, false);
  report.info.desktopFacilities = out;
});
await step('Women s ve diger ekranlarda Management', async () => {
  const res = {};
  for (const nm of ["Clubs / Club card / Women's club · Desktop", 'Clubs / Club card / Staff tab · Desktop', 'Clubs / Club card / Team list open · Desktop', 'Clubs / Club card / Minimal data · Desktop']) {
    const f = frameOf('Web', nm); if (!f) { res[nm] = 'yok'; continue; }
    const m = f.findOne(n => n.name === 'Management' && n.type === 'FRAME');
    res[nm] = { height: R(f.height), managementPeople: m ? m.findAll(n => n.type === 'INSTANCE' && /^Person row/.test(n.name)).map(p => p.name) : 'Management yok', bodyChildren: (f.findOne(n => n.name === 'Profile body') || { children: [] }).children.map(c => c.name + ' ' + R(c.height)) };
  }
  report.info.otherDesktop = res;
});
await step('Mobil Management + Facilities', async () => {
  const f = frameOf('Mobile', 'Clubs / Club card · Mobile');
  const m = f.findOne(n => n.name === 'Management' && n.type === 'FRAME');
  const fac = f.findOne(n => n.name === 'Facilities' && n.type === 'FRAME');
  report.info.mobileManagement = await dump(m, BB(f), 2, 0, [], false);
  report.info.mobileFacilities = await dump(fac, BB(f), 1, 0, [], false);
  const res = {};
  for (const nm of ["Clubs / Club card / Women's club · Mobile", 'Clubs / Club card / Staff tab · Mobile', 'Clubs / Club card / Team list open · Mobile', 'Clubs / Club card / Minimal data · Mobile']) {
    const g = frameOf('Mobile', nm); res[nm] = g ? (g.findOne(n => n.name === 'Profile body') || { children: [] }).children.map(c => c.name + ' ' + R(c.height)) : 'yok';
  }
  report.info.otherMobile = res;
});
await step('Section yerleşimi', async () => {
  for (const plat of ['Web', 'Mobile']) { const sec = secOf(plat, 'Club card'); report.info['section ' + plat] = R(sec.width) + 'x' + R(sec.height) + ' | ' + sec.children.filter(c => c.type === 'FRAME').map(c => c.name.replace('Clubs / Club card', '').trim() + ' @' + R(c.x) + ',' + R(c.y) + ' ' + R(c.width) + 'x' + R(c.height)).join(' ; '); }
});
return report;
