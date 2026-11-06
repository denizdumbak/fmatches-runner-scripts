// step 320 · SALT OKUNUR + görünüm: "Stadium card" Section'ının ve sayfasının nerede olduğunu raporlar, 02 · Website sekmesine geçer, sayfayı seçer ve ona yakınlaşır
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = Math.round;
report.info.file = figma.root.name;
report.info.currentPage = figma.currentPage.name;
const hits = [];
for (const p of figma.root.children) {
  await p.loadAsync();
  (function w(n, path) {
    if (/Stadium card|Facilities \//.test(n.name)) hits.push(`${p.name} › ${path} › ${n.name} [${n.type}] ${R(n.width)}x${R(n.height)} @${R(n.absoluteBoundingBox ? n.absoluteBoundingBox.x : 0)},${R(n.absoluteBoundingBox ? n.absoluteBoundingBox.y : 0)}`);
    if ('children' in n && n.type !== 'INSTANCE' && n.type !== 'FRAME') for (const k of n.children) w(k, path + (path ? ' › ' : '') + n.name);
    else if (n.type === 'FRAME' && n.parent && n.parent.type !== 'FRAME') return;
  })(p, '');
}
report.info.hits = hits;
await step('go to frame', async () => {
  const p02 = figma.root.children.find(p => /^02/.test(p.name));
  await figma.setCurrentPageAsync(p02);
  const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
  const sec = web.children.find(n => n.type === 'SECTION' && n.name === 'Stadium card');
  report.info.sectionFound = !!sec;
  if (!sec) return;
  const fr = sec.children.find(n => n.type === 'FRAME');
  report.info.frame = fr ? `${fr.name} ${R(fr.width)}x${R(fr.height)}` : 'yok';
  p02.selection = [fr || sec];
  figma.viewport.scrollAndZoomIntoView([fr || sec]);
  report.info.viewport = `zoom ${figma.viewport.zoom.toFixed(2)} center ${R(figma.viewport.center.x)},${R(figma.viewport.center.y)}`;
});
return report;
