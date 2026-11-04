// step 301 · (1) 02 sayfa kökündeki 4 yetim "Events / My events / No ..." çerçevesini 03 · Archive'a taşı · (2) salt okunur: Mobile My events satırında durum etiketi / tarih binmesi
const report = { done: [], errors: [], moved: [], dump: [] };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const page = figma.root.children.find(p => /^02/.test(p.name));
await page.loadAsync();
const BB = n => n.absoluteBoundingBox;
const R = n => Math.round(n);

await step('O yetimleri Archive a taşı', async () => {
  const arch = figma.root.children.find(p => /^03/.test(p.name));
  if (!arch) throw new Error('03 sayfası yok');
  await arch.loadAsync();
  const orphans = page.children.filter(n => n.type === 'FRAME' && /^Events \/ My events/.test(n.name));
  report.moved.push(`kökte yetim: ${orphans.length}; akış başlangıcı önce: ${page.flowStartingPoints.length}`);
  let right = 0;
  for (const c of arch.children) { const b = BB(c); if (b) right = Math.max(right, b.x + b.width); }
  let x = right + 400;
  for (const o of orphans) {
    const info = `"${o.name}" ${R(o.width)}x${R(o.height)} @${R(o.x)},${R(o.y)}`;
    arch.appendChild(o); o.x = x; o.y = 0; x += o.width + 160;
    report.moved.push(`${info} -> 03 · Archive @${R(o.x)},${R(o.y)}`);
  }
  const left = page.children.filter(n => n.type === 'FRAME' && /^Events \/ My events/.test(n.name));
  report.moved.push(`kökte kalan: ${left.length}; akış başlangıcı sonra: ${page.flowStartingPoints.length}`);
});

await step('D Mobile My events satır yapısı', async () => {
  const sec = page.children.find(n => n.type === 'SECTION' && n.name === 'Mobile').children.find(n => n.type === 'SECTION' && n.name === 'Events');
  const s = sec.children.find(c => c.type === 'FRAME' && c.name === 'Events / My events · Mobile');
  const sb = BB(s);
  const rel = n => `${R(BB(n).x - sb.x)},${R(BB(n).y - sb.y)} ${R(BB(n).width)}x${R(BB(n).height)}`;
  const row = s.findOne(n => /^Row · /.test(n.name));
  const tree = (n, d, out) => { out.push(`${'  '.repeat(d)}${n.type} "${(n.name || '').slice(0, 32)}" ${rel(n)}${n.layoutPositioning === 'ABSOLUTE' ? ' ABS' : ''}${n.type === 'TEXT' ? ` "${n.characters.slice(0, 24)}"` : ''}`); if (d < 4 && 'children' in n && n.type !== 'TEXT') for (const c of n.children) if (c.visible !== false) tree(c, d + 1, out); };
  if (row) { tree(row, 0, report.dump); report.dump.push(`Row wrapper layout=${row.layoutMode} ${R(row.width)}x${R(row.height)}`); } else report.dump.push('Row · … bulunamadı');
  const st = s.findAll(n => /^(Event status|Application status)/.test(n.name)).slice(0, 2);
  for (const n of st) report.dump.push(`durum "${n.name}" ebeveyn "${n.parent.name}" ${rel(n)}${n.layoutPositioning === 'ABSOLUTE' ? ' ABS' : ''}`);
});
return report;
