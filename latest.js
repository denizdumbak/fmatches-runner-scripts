// step 81 · A yonu uygulandi: Social icon 32x32 gercek daire, hover markanin renginde

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const page = re => figma.root.children.find(p => re.test(p.name));
const page0 = page(/^01/), pageHome = page(/^02/);
for (const p of [page0, pageHome]) { if (p) await p.loadAsync(); }

const V = {};
for (const [k, id] of Object.entries({
  textInverse: '1:41', rFull: '1:64'
})) V[k] = await figma.variables.getVariableByIdAsync('VariableID:' + id);

const paint = k => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', V[k]);

function hex(h) {
  const n = h.replace('#', '');
  return { r: parseInt(n.slice(0, 2), 16) / 255, g: parseInt(n.slice(2, 4), 16) / 255, b: parseInt(n.slice(4, 6), 16) / 255 };
}
const solid = h => ({ type: 'SOLID', color: hex(h) });

const BRAND = {
  LinkedIn:  { color: '#0A66C2', invert: false },
  Instagram: { color: '#E4405F', invert: false },
  Facebook:  { color: '#0866FF', invert: false },
  X:         { color: '#FFFFFF', invert: true }
};

const BOX = 32, GLYPH = 18;

function recolor(node, p) {
  for (const v of node.findAll(x => x.type === 'VECTOR' || x.type === 'ELLIPSE' || x.type === 'RECTANGLE' || x.type === 'BOOLEAN_OPERATION')) {
    if (v.fills && v.fills !== figma.mixed && v.fills.length) v.fills = [p];
    if (v.strokes && v.strokes.length) v.strokes = [p];
  }
}

function fitTo(node, size) {
  const h = node.height;
  if (h && Math.abs(h - size) > 0.5 && typeof node.rescale === 'function') node.rescale(size / h);
}

const socialSet = page0.findOne(n => n.name === 'Social icon' && n.type === 'COMPONENT_SET');

await step('Social icon varyantlari 32x32 daire', async () => {
  if (!socialSet) throw new Error('Social icon set bulunamadi');
  const log = [];
  for (const v of socialSet.children) {
    const m = /Brand=([^,]+),\s*State=(\w+)/.exec(v.name);
    if (!m) { report.errors.push('ad okunamadi: ' + v.name); continue; }
    const brandKey = m[1].trim(), state = m[2].trim();
    const info = BRAND[brandKey];
    if (!info) { report.errors.push('bilinmeyen marka: ' + brandKey); continue; }
    const hover = state === 'Hover';

    // kutu: kare 32x32, ortalanmis auto layout
    v.layoutMode = 'HORIZONTAL';
    v.primaryAxisAlignItems = 'CENTER';
    v.counterAxisAlignItems = 'CENTER';
    v.primaryAxisSizingMode = 'FIXED';
    v.counterAxisSizingMode = 'FIXED';
    v.paddingLeft = 0; v.paddingRight = 0; v.paddingTop = 0; v.paddingBottom = 0;
    v.itemSpacing = 0;
    v.clipsContent = false;
    v.resize(BOX, BOX);
    for (const c of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) v.setBoundVariable(c, V.rFull);

    // zemin: default seffaf, hover markanin rengi
    v.fills = hover ? [solid(info.color)] : [];
    v.strokes = [];

    // isaret: default beyaz; hover'da X ters, digerleri beyaz kalir
    const g = v.findOne(n => n.name === 'Glyph');
    if (!g) { report.errors.push('Glyph yok: ' + v.name); continue; }
    g.layoutPositioning = 'AUTO';
    fitTo(g, GLYPH);
    if (hover && info.invert) recolor(g, solid('#111613'));
    else recolor(g, paint('textInverse'));

    log.push(v.name + ' -> ' + Math.round(v.width) + 'x' + Math.round(v.height));
  }
  report.info['varyantlar'] = log;

  socialSet.description = 'Social link in the footer. Our container is a 32 px circle, transparent by default with the brand official single colour mark in white. On hover the circle fills with the brand own colour; X inverts because its colour is the footer colour. The container is ours, the mark and the colour are the brand own, never redrawn or retinted.';
});

// Footer'daki Social links siralarini yeni olcuye gore kontrol et
await step('Footer Social links', async () => {
  const out = [];
  for (const p of [page0, pageHome]) {
    if (!p) continue;
    for (const f of p.findAll(n => n.name === 'Social links' && n.type === 'FRAME')) {
      if (f.layoutMode === 'NONE') { f.layoutMode = 'HORIZONTAL'; }
      f.counterAxisAlignItems = 'CENTER';
      f.itemSpacing = 8;
      f.primaryAxisSizingMode = 'AUTO';
      f.counterAxisSizingMode = 'AUTO';
      const b = f.absoluteBoundingBox;
      out.push(p.name + ' / ' + (f.parent ? f.parent.name : '?') + ' -> ' + (b ? Math.round(b.width) + 'x' + Math.round(b.height) : '?') + ' (' + f.children.length + ' ikon)');
    }
  }
  report.info['Social links satirlari'] = out;
});

// karar verildi: A/B/C panosu silinir
await step('Yon panosu silindi', async () => {
  const b = page0.children.find(n => n.name === 'Social icon · A / B / C');
  if (b) { b.remove(); report.info['pano'] = 'silindi'; }
  else report.info['pano'] = 'zaten yok';
});

// Section duzenini onar
function relayout(s) {
  const kids = s.children.slice().sort((a, b) => {
    const ba = a.absoluteBoundingBox, bb = b.absoluteBoundingBox;
    if (!ba || !bb) return 0;
    if (Math.abs(ba.y - bb.y) > 4) return ba.y - bb.y;
    return ba.x - bb.x;
  });
  const left = s.x + 80; let y = s.y + 80, prevText = false, first = true;
  for (const k of kids) {
    const b = k.absoluteBoundingBox; if (!b) continue;
    const isText = k.type === 'TEXT';
    if (!first) y += (isText && prevText) ? 16 : 120;
    k.x += left - b.x; k.y += y - b.y; y += b.height; prevText = isText; first = false;
  }
  let right = -Infinity, bottom = -Infinity;
  for (const k of s.children) {
    const b = k.absoluteBoundingBox; if (!b) continue;
    if (b.x + b.width > right) right = b.x + b.width;
    if (b.y + b.height > bottom) bottom = b.y + b.height;
  }
  s.resizeWithoutConstraints(Math.ceil(right - s.x + 80), Math.ceil(bottom - s.y + 80));
}

await step('Section duzeni', async () => {
  const section = page0.findOne(n => n.type === 'SECTION' && /Navigation/.test(n.name));
  if (!section) throw new Error('Navigation Section bulunamadi');
  relayout(section);
  report.info['Section'] = Math.round(section.width) + 'x' + Math.round(section.height);

  const secs = page0.children.filter(n => n.type === 'SECTION');
  const hits = [];
  for (let i = 0; i < secs.length; i++) for (let j = i + 1; j < secs.length; j++) {
    const a = secs[i].absoluteBoundingBox, b = secs[j].absoluteBoundingBox;
    if (!a || !b) continue;
    if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height)
      hits.push(secs[i].name + ' <-> ' + secs[j].name);
  }
  report.info['Section cakismasi'] = hits.length ? hits : 'yok';
});

return report;
