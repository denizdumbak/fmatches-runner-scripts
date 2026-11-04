// step 292 · inspect: 02 · Website üst üste binme taraması (salt okunur, hiçbir şey değiştirmez)
const report = { info: {}, screenOverlaps: [], sectionOverlaps: [], siblingOverlaps: [], outside: [], errors: [] };
const page = figma.root.children.find(p => /^02/.test(p.name));
await page.loadAsync();
const BB = n => n.absoluteBoundingBox;
const inter = (a, b) => {
  const x = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const y = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return x > 0 && y > 0 ? { w: Math.round(x), h: Math.round(y) } : null;
};
// bilerek binen katmanlar: oklar, notlar, perde, menüler, kartlar, sabit bar, silüet, arka plan arması
const INTENT = /^(Flow ·|Note ·|Scrim|Lightbox|Sticky action bar|Silhouette|Club crest|Map tint|Map area|Map panel|Map controls|Map card|Profile menu|Message menu|Thread menu|Account menu|Confirm dialog|Book dialog|Option list|Date picker|Bottom sheet|Shade|Veil|Badge|Hero|Player photo|Back|Cursor)/;
const name = n => (n.name || '').slice(0, 60);
const path = n => { const a = []; let x = n; while (x && x.type !== 'PAGE') { a.unshift(name(x)); x = x.parent; } return a.slice(-4).join(' › '); };
let scanned = 0;

function scanSiblings(parent, depth) {
  if (depth > 6 || !('children' in parent)) return;
  const kids = parent.children.filter(k => k.visible !== false && BB(k));
  const laidOut = parent.layoutMode && parent.layoutMode !== 'NONE';
  // auto layout içinde yalnız ABSOLUTE çocuklar binebilir; onları ve bilerek bineni atla
  const cand = kids.filter(k => !(laidOut && k.layoutPositioning !== 'ABSOLUTE') ? !INTENT.test(k.name) && k.layoutPositioning !== 'ABSOLUTE' : false);
  if (!laidOut) {
    for (let i = 0; i < cand.length; i++) for (let j = i + 1; j < cand.length; j++) {
      const o = inter(BB(cand[i]), BB(cand[j]));
      if (o && o.w > 4 && o.h > 4) report.siblingOverlaps.push(`${path(parent)} :: "${name(cand[i])}" x "${name(cand[j])}" ${o.w}x${o.h}`);
    }
  }
  // ebeveynin dışına taşan (auto layout içinde ABS olmayan çocuklar dahil)
  const pb = BB(parent);
  if (pb && parent.type !== 'SECTION') for (const k of kids) {
    if (INTENT.test(k.name) || (parent.clipsContent === false && false)) continue;
    const b = BB(k), out = Math.max(pb.x - b.x, b.x + b.width - (pb.x + pb.width), pb.y - b.y, b.y + b.height - (pb.y + pb.height));
    if (out > 4) report.outside.push(`${path(parent)} :: "${name(k)}" ${Math.round(out)}px dışarıda`);
  }
  scanned++;
  for (const k of kids) if (k.type === 'FRAME' || k.type === 'GROUP' || k.type === 'INSTANCE') scanSiblings(k, depth + 1);
}

for (const platform of page.children.filter(n => n.type === 'SECTION')) {
  const subs = platform.children.filter(n => n.type === 'SECTION');
  // alt Section'lar birbirine biniyor mu
  for (let i = 0; i < subs.length; i++) for (let j = i + 1; j < subs.length; j++) {
    const o = inter(BB(subs[i]), BB(subs[j]));
    if (o) report.sectionOverlaps.push(`${platform.name}: "${subs[i].name}" x "${subs[j].name}" ${o.w}x${o.h}`);
  }
  for (const sub of subs) {
    const screens = sub.children.filter(n => n.type === 'FRAME' && !/^Flow ·/.test(n.name));
    // ekranlar birbirine biniyor mu
    for (let i = 0; i < screens.length; i++) for (let j = i + 1; j < screens.length; j++) {
      const o = inter(BB(screens[i]), BB(screens[j]));
      if (o) report.screenOverlaps.push(`${platform.name} › ${sub.name}: "${name(screens[i])}" x "${name(screens[j])}" ${o.w}x${o.h}`);
    }
    // ekranlar Section dışına taşıyor mu
    const sb = BB(sub);
    for (const s of sub.children) { const b = BB(s); if (b && (b.x < sb.x || b.y < sb.y || b.x + b.width > sb.x + sb.width || b.y + b.height > sb.y + sb.height)) report.outside.push(`Section ${sub.name} dışına taşan: "${name(s)}"`); }
    // ekran içi kardeş binmeleri
    for (const s of screens) { try { scanSiblings(s, 0); } catch (e) { report.errors.push(name(s) + ': ' + e.message); } }
  }
  report.info[platform.name] = { sections: subs.length, screens: subs.reduce((a, s) => a + s.children.filter(n => n.type === 'FRAME').length, 0) };
}
report.info.framesScanned = scanned;
const cap = a => a.length > 40 ? a.slice(0, 40).concat([`... +${a.length - 40} daha`]) : a;
return {
  info: report.info,
  counts: { screenOverlaps: report.screenOverlaps.length, sectionOverlaps: report.sectionOverlaps.length, siblingOverlaps: report.siblingOverlaps.length, outside: report.outside.length, errors: report.errors.length },
  screenOverlaps: cap(report.screenOverlaps),
  sectionOverlaps: cap(report.sectionOverlaps),
  siblingOverlaps: cap(report.siblingOverlaps),
  outside: cap(report.outside),
  errors: cap(report.errors)
};
