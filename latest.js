// step 293 · inspect v2: 02 · Website üst üste binme (salt okunur) · vektör iç yapısı atlanır, bulgular gruplanır
const page = figma.root.children.find(p => /^02/.test(p.name));
await page.loadAsync();
const BB = n => n.absoluteBoundingBox;
const inter = (a, b) => {
  const x = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const y = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return x > 0 && y > 0 ? { w: Math.round(x), h: Math.round(y) } : null;
};
const INTENT = /^(Flow ·|Note ·|Scrim|Lightbox|Sticky action bar|Silhouette|Club crest|Map tint|Map area|Map panel|Map controls|Map card|Profile menu|Message menu|Thread menu|Account menu|Confirm dialog|Book dialog|Option list|Date picker|Bottom sheet|Shade|Veil|Badge|Hero visual|Player photo|Preview ·)/;
const LEAF = /^(Flag|Club crest|Pitch|Silhouette|Icon|Menu icon|Social icon|Logo|Avatar|Map marker|Map cluster|Verification badge)/;
const GFX = new Set(['VECTOR', 'BOOLEAN_OPERATION', 'LINE', 'ELLIPSE', 'RECTANGLE', 'STAR', 'POLYGON']);
const nm = n => (n.name || '').slice(0, 50);
const screenOf = n => { let x = n, last = n; while (x && x.type !== 'SECTION' && x.type !== 'PAGE') { last = x; x = x.parent; } return last; };
const sib = new Map(), out = new Map();
const add = (m, key, ex, extra) => { const e = m.get(key) || { n: 0, screens: new Set(), ex, max: 0, clip: 0 }; e.n++; e.screens.add(ex); if (extra) { e.max = Math.max(e.max, extra.px); e.clip += extra.clip ? 1 : 0; } m.set(key, e); };

function walk(parent, depth, scr) {
  if (depth > 7 || !('children' in parent) || LEAF.test(parent.name)) return;
  const kids = parent.children.filter(k => k.visible !== false && BB(k));
  const laid = parent.layoutMode && parent.layoutMode !== 'NONE';
  if (!laid) {
    const c = kids.filter(k => !GFX.has(k.type) && k.type !== 'GROUP' && !INTENT.test(k.name) && !LEAF.test(k.name) && k.layoutPositioning !== 'ABSOLUTE');
    for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) {
      const o = inter(BB(c[i]), BB(c[j]));
      if (o && o.w > 8 && o.h > 8) add(sib, `${nm(parent)} :: ${nm(c[i])} x ${nm(c[j])}`, scr);
    }
  }
  const pb = BB(parent);
  if (pb && parent.type !== 'SECTION') for (const k of kids) {
    if (INTENT.test(k.name) || GFX.has(k.type)) continue;
    const b = BB(k), px = Math.round(Math.max(pb.x - b.x, b.x + b.width - (pb.x + pb.width), pb.y - b.y, b.y + b.height - (pb.y + pb.height)));
    if (px > 4) add(out, `${nm(parent)} :: ${nm(k)}`, scr, { px, clip: parent.clipsContent });
  }
  for (const k of kids) if (k.type === 'FRAME' || k.type === 'GROUP' || k.type === 'INSTANCE' || k.type === 'COMPONENT') walk(k, depth + 1, scr);
}

const screenOverlaps = [], sectionTop = [];
for (const platform of page.children.filter(n => n.type === 'SECTION')) {
  for (const sub of platform.children.filter(n => n.type === 'SECTION')) {
    const screens = sub.children.filter(n => n.type === 'FRAME' && !/^Flow ·/.test(n.name));
    for (let i = 0; i < screens.length; i++) for (let j = i + 1; j < screens.length; j++) {
      const a = BB(screens[i]), b = BB(screens[j]), o = inter(a, b);
      if (o) screenOverlaps.push(`${platform.name} › ${sub.name}: "${screens[i].name}" [${Math.round(a.x - BB(sub).x)},${Math.round(a.y - BB(sub).y)} ${Math.round(a.width)}x${Math.round(a.height)}] x "${screens[j].name}" [${Math.round(b.x - BB(sub).x)},${Math.round(b.y - BB(sub).y)} ${Math.round(b.width)}x${Math.round(b.height)}] = ${o.w}x${o.h}`);
    }
    for (const s of screens) walk(s, 0, `${platform.name} › ${sub.name} › ${nm(s)}`);
  }
}
const fmt = (m, isOut) => [...m.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 35).map(([k, e]) => `${e.n}x ${e.screens.size} ekran · ${k}${isOut ? ` · en çok ${e.max}px · kırpılan ${e.clip}/${e.n}` : ''} · örnek: ${e.ex}`);
return { counts: { screenOverlaps: screenOverlaps.length, siblingGroups: sib.size, outsideGroups: out.size }, screenOverlaps, siblingOverlaps: fmt(sib, false), outside: fmt(out, true) };
