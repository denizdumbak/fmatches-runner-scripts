// step 123 · About duzeltme: 01'deki varyantlar dar kalmisti, sabit genislige al (Desktop sayfadaki kart genisligi, Mobile 358); Leo metninde paragraf arasi bos satir

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }
const r = n => Math.round(n);

const LEO = 'Attacking midfielder who likes to receive between the lines and play the final pass. Comfortable as a 10 or drifting in from the right, and happy to press from the front. Captained Riverside FC U19 in the 2023/24 season.\n\nStudying sports science part-time. Open to trials in England and the Netherlands for next season.';

const p1 = pageOf(/^01/);
await p1.loadAsync();
const web = pageOf(/^02/);
await web.loadAsync();
const aboutSet = p1.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'About');
if (!aboutSet) throw new Error('About component set not found');

// sayfadaki gercek kart genislikleri
const widths = { Desktop: 840, Mobile: 358 };
await step('measure page widths', async () => {
  for (const f of web.findAll(n => n.type === 'FRAME' && n.name === 'Profiles / Player · Desktop' || n.type === 'FRAME' && n.name === 'Profiles / Player · Mobile')) {
    const a = f.findOne(n => n.type === 'INSTANCE' && n.name === 'About');
    if (a) widths[f.width > 800 ? 'Desktop' : 'Mobile'] = r(a.width);
  }
  report.info.widths = widths;
});

// 1. varyantlari sabit genislige al
await step('fix variant widths', async () => {
  const out = [];
  for (const c of aboutSet.children) {
    const D = c.variantProperties.Device;
    c.layoutSizingHorizontal = 'FIXED';
    c.layoutSizingVertical = 'HUG';
    c.resize(widths[D], c.height);
    const content = c.findOne(n => n.name === 'About content');
    content.layoutSizingHorizontal = 'FILL';
    content.layoutSizingVertical = 'HUG';
    const t = c.findOne(n => n.name === 'About text');
    await loadFonts(t);
    t.characters = LEO;
    t.layoutSizingHorizontal = 'FILL';
    t.textAutoResize = 'HEIGHT';
    if (D === 'Desktop') t.maxWidth = 640;
    out.push(c.name + ': card ' + r(c.width) + 'x' + r(c.height) + ', text ' + r(t.width));
  }
  report.info.variants = out;
});

// 2. sayfadaki Leo kartlarinda paragraf arasi bos satir
const oldH = new Map();
for (const s of web.children.filter(n => n.type === 'SECTION')) for (const k of s.children) oldH.set(k.id, k.height);
await step('Leo text on pages', async () => {
  const out = [];
  for (const f of web.findAll(n => n.type === 'FRAME' && (n.name === 'Profiles / Player · Desktop' || n.name === 'Profiles / Player · Mobile'))) {
    const body = f.findOne(n => n.name === 'Profile body');
    const a = f.findOne(n => n.type === 'INSTANCE' && n.name === 'About');
    if (!a) continue;
    const bodyOldH = body.height, bodyOldBottom = body.y + body.height;
    const t = a.findOne(n => n.name === 'About text');
    await loadFonts(t);
    t.characters = LEO;
    if (f.layoutMode === 'NONE') {
      const d = body.height - bodyOldH;
      for (const c of f.children) if (c !== body && c.y >= bodyOldBottom - 1) c.y += d;
      f.resizeWithoutConstraints(f.width, f.height + d);
    }
    out.push(f.name + ': about ' + r(a.width) + 'x' + r(a.height) + ', frame ' + r(f.height));
  }
  report.info.pages = out;
});

// 3. alttakileri it
await step('push rows below grown frames', async () => {
  const moved = [];
  for (const s of web.children.filter(n => n.type === 'SECTION')) {
    const items = s.children.map(k => {
      const oh = oldH.has(k.id) ? oldH.get(k.id) : k.height;
      return { k, x: k.x, y: k.y, w: k.width, oh, d: k.height - oh, shift: 0 };
    }).sort((a, b) => a.y - b.y);
    for (let i = 0; i < items.length; i++) {
      const a = items[i];
      for (let j = 0; j < i; j++) {
        const b = items[j];
        if (b.y + b.oh > a.y + 2) continue;
        const ov = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        if (ov <= 1) continue;
        a.shift = Math.max(a.shift, b.shift + Math.max(0, b.d));
      }
    }
    for (const it of items) if (it.shift > 0) { it.k.y += it.shift; moved.push(s.name + ' · ' + it.k.name + ' +' + r(it.shift)); }
    let bottom = 0;
    for (const k of s.children) bottom = Math.max(bottom, k.y + k.height);
    if (bottom + 80 > s.height) s.resizeWithoutConstraints(s.width, Math.ceil(bottom + 80));
  }
  report.info.moved = moved;
});

// 4. sekme 01 duzen
function relayout(s) {
  const kids = s.children.slice();
  const ordered = kids.filter(n => n.type === 'TEXT').concat(kids.filter(n => n.type !== 'TEXT'));
  const left = s.x + 80; let y = s.y + 80, prevText = false, first = true;
  for (const k of ordered) {
    const b = k.absoluteBoundingBox; if (!b) continue; const isText = k.type === 'TEXT';
    if (!first) y += (isText && prevText) ? 16 : 120;
    k.x += left - b.x; k.y += y - b.y; y += b.height; prevText = isText; first = false;
  }
  let right = -Infinity, bottom = -Infinity;
  for (const k of s.children) { const b = k.absoluteBoundingBox; if (!b) continue;
    if (b.x + b.width > right) right = b.x + b.width;
    if (b.y + b.height > bottom) bottom = b.y + b.height; }
  s.resizeWithoutConstraints(Math.ceil(right - s.x + 80), Math.ceil(bottom - s.y + 80));
}
await step('relayout 01 sections', async () => {
  const sec = p1.findOne(n => n.type === 'SECTION' && /Player profile/.test(n.name));
  relayout(sec);
  const secs = p1.children.filter(n => n.type === 'SECTION').sort((a, b) => a.x - b.x);
  let x = 1640;
  for (const s of secs) { s.x = x; x += s.width + 160; }
});

return report;
