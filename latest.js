// step 359 · INSPECT (salt okunur): Shortlists mevki çipi satırı + kütüphanede Select / Option list / Team select
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const r = n => Math.round(n);
const box = n => n.absoluteBoundingBox ? r(n.absoluteBoundingBox.width) + 'x' + r(n.absoluteBoundingBox.height) : '-';
const lay = n => ('layoutMode' in n && n.layoutMode !== 'NONE') ? n.layoutMode + (n.layoutWrap === 'WRAP' ? '/WRAP' : '') + ' gap' + n.itemSpacing : '';
function dump(n, depth, max, out, ind) {
  if (!n || depth > max) return;
  out.push(ind + n.type + ' · ' + n.name + ' [' + box(n) + '] ' + lay(n) + (n.type === 'TEXT' ? ' "' + String(n.characters).slice(0, 40) + '"' : ''));
  if ('children' in n && n.type !== 'INSTANCE') for (const c of n.children.slice(0, 18)) dump(c, depth + 1, max, out, ind + '  ');
}
await step('shortlists screens', async () => {
  for (const plat of ['Web', 'Mobile']) {
    const P = p02.children.find(n => n.type === 'SECTION' && n.name === plat);
    const sec = P && P.children.find(n => n.type === 'SECTION' && n.name === 'Shortlists');
    if (!sec) { report.errors.push(plat + ': Shortlists Section yok'); continue; }
    report.info[plat + ' screens'] = sec.children.map(c => c.name + ' [' + box(c) + ']');
    const f = sec.children.find(c => c.type === 'FRAME' && /Shortlists \/ Shortlists/.test(c.name) && !/No players/.test(c.name));
    if (!f) { report.errors.push(plat + ': ana Shortlists ekranı yok'); continue; }
    const out = [];
    const body = f.findAll(n => /chip|filter|position|heading|header/i.test(n.name) && n.type !== 'TEXT' && n.type !== 'INSTANCE').slice(0, 12);
    report.info[plat + ' candidate rows'] = body.map(n => n.name + ' [' + box(n) + '] ' + lay(n) + ' <' + (n.parent ? n.parent.name : '') + '>');
    const chip = f.findOne(n => n.type === 'INSTANCE' && /Filter chip/.test(n.name));
    if (chip) {
      let up = chip.parent; const chain = [];
      while (up && up !== f) { chain.push(up.name + ' [' + box(up) + '] ' + lay(up)); up = up.parent; }
      report.info[plat + ' chip chain'] = chain;
      const row = chip.parent;
      report.info[plat + ' chip row children'] = row.children.map(c => c.name + ' ' + box(c)).slice(0, 20);
      const kids = row.parent.children.map(c => c.name + ' [' + box(c) + ']');
      report.info[plat + ' row siblings'] = kids;
    } else report.errors.push(plat + ': Filter chip instance yok');
  }
});
await step('library: select parts', async () => {
  const hits = p01.findAll(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && /Form field|Option list|Option row|Team select|Select|Multi/i.test(n.name) && !(n.parent && n.parent.type === 'COMPONENT_SET'));
  report.info.library = hits.map(n => {
    const kids = n.type === 'COMPONENT_SET' ? n.children : [n];
    return n.type + ' · ' + n.name + ' · ' + kids.length + ' varyant · örnek: ' + kids.slice(0, 4).map(k => k.name + ' ' + box(k)).join(' | ');
  });
  const ol = hits.find(n => /Option list/.test(n.name));
  if (ol) {
    const v = (ol.type === 'COMPONENT_SET' ? ol.children : [ol]).find(k => /Positions/.test(k.name));
    if (v) { const out = []; dump(v, 0, 2, out, ''); report.info.optionListPositions = out.slice(0, 24); }
  }
  const ts = hits.find(n => /Team select/.test(n.name));
  if (ts) { const v = ts.type === 'COMPONENT_SET' ? ts.children[0] : ts; const out = []; dump(v, 0, 3, out, ''); report.info.teamSelectClosed = [v.name].concat(out.slice(0, 20)); }
  const ff = hits.find(n => /Form field/.test(n.name));
  if (ff && ff.type === 'COMPONENT_SET') report.info.formFieldSelect = ff.children.filter(k => /Type=Select/.test(k.name)).map(k => k.name + ' ' + box(k));
});
return report;
