// step 80 · Social icon yon panosu: A yuvarlak / B markali kare / C orijinal app ikonlari

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const page = re => figma.root.children.find(p => re.test(p.name));
const page0 = page(/^01/);
if (page0) await page0.loadAsync();

const V = {};
for (const [k, id] of Object.entries({
  surface: '1:29', inverse: '1:31', textPrimary: '1:38', textSecondary: '1:39',
  textInverse: '1:41', border: '1:48', rMd: '1:62', rFull: '1:64'
})) V[k] = await figma.variables.getVariableByIdAsync('VariableID:' + id);

const paint = k => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', V[k]);

function hex(h) {
  const n = h.replace('#', '');
  return { r: parseInt(n.slice(0, 2), 16) / 255, g: parseInt(n.slice(2, 4), 16) / 255, b: parseInt(n.slice(4, 6), 16) / 255 };
}
const solid = h => ({ type: 'SOLID', color: hex(h) });

const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s.id;

const fonts = await figma.listAvailableFontsAsync();
const findFont = (family, styles) => {
  for (const s of styles) if (fonts.some(f => f.fontName.family === family && f.fontName.style === s)) return { family, style: s };
  return null;
};
const INTER_R = findFont('Inter', ['Regular']);
const BARLOW_SB = findFont('Barlow Condensed', ['SemiBold', 'Semi Bold']) || INTER_R;
for (const f of [INTER_R, BARLOW_SB]) if (f) await figma.loadFontAsync(f);

async function T(chars, styleName, colorKey, font) {
  const t = figma.createText();
  t.fontName = font || INTER_R;
  t.characters = chars;
  if (TS[styleName]) await t.setTextStyleIdAsync(TS[styleName]);
  t.fills = [paint(colorKey)];
  t.name = chars.slice(0, 40);
  t.textAutoResize = 'WIDTH_AND_HEIGHT';
  return t;
}

function frame(name, dir) {
  const f = figma.createFrame();
  f.name = name; f.fills = []; f.clipsContent = false;
  if (dir) { f.layoutMode = dir; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; }
  return f;
}

function recolor(node, rgbPaint) {
  for (const v of node.findAll(x => x.type === 'VECTOR' || x.type === 'ELLIPSE' || x.type === 'RECTANGLE' || x.type === 'BOOLEAN_OPERATION')) {
    if (v.fills && v.fills !== figma.mixed && v.fills.length) v.fills = [rgbPaint];
    if (v.strokes && v.strokes.length) v.strokes = [rgbPaint];
  }
  if (node.fills && node.fills !== figma.mixed && node.fills.length) node.fills = [rgbPaint];
}

const BRANDS = [
  { key: 'LinkedIn', node: 'selfhst:linkedin', color: '#0A66C2', invertOnDark: false },
  { key: 'Instagram', node: 'selfhst:instagram', color: '#E4405F', invertOnDark: false },
  { key: 'Facebook', node: 'selfhst:facebook', color: '#0866FF', invertOnDark: false },
  { key: 'X', node: 'selfhst:x', color: '#111613', invertOnDark: true }
];

// mevcut Social icon setinden tek renkli glyph'leri al
const socialSet = page0.findOne(n => n.name === 'Social icon' && n.type === 'COMPONENT_SET');

function glyphFor(brandKey) {
  if (!socialSet) return null;
  const v = socialSet.children.find(c => c.name.indexOf('Brand=' + brandKey) === 0 && /State=Default/.test(c.name));
  if (!v) return null;
  const g = v.findOne(n => n.name === 'Glyph');
  if (!g) return null;
  const c = g.clone();
  return c;
}

function originalFor(nodeName) {
  const n = page0.children.find(x => x.name === nodeName);
  if (!n) return null;
  return n.clone();
}

function fitTo(node, size) {
  const h = node.height || size;
  if (h && h !== size && typeof node.rescale === 'function') node.rescale(size / h);
}

let board = null;

await step('Pano kuruldu', async () => {
  const old = page0.children.find(n => n.name === 'Social icon · A / B / C');
  if (old) { old.remove(); report.info['eski pano silindi'] = true; }

  board = frame('Social icon · A / B / C', 'VERTICAL');
  board.itemSpacing = 56;
  board.paddingLeft = 64; board.paddingRight = 64; board.paddingTop = 64; board.paddingBottom = 64;
  board.fills = [paint('surface')];
  page0.appendChild(board);

  const title = await T('Social icon · three directions', 'Heading/H2', 'textPrimary', BARLOW_SB);
  board.appendChild(title);
  const sub = await T('All three shown on the dark footer surface, which is where they live. Containers are 32 px in every option.', 'Body/Default', 'textSecondary');
  board.appendChild(sub);
  report.info['pano id'] = board.id;
});

// bir secenek bloğu: baslik + aciklama + koyu serit icinde 4 ikon
async function optionBlock(label, note, builder) {
  const block = frame(label, 'VERTICAL');
  block.itemSpacing = 16;
  board.appendChild(block);

  const h = await T(label, 'Heading/H3', 'textPrimary', BARLOW_SB);
  block.appendChild(h);
  const n = await T(note, 'Body/Small', 'textSecondary');
  block.appendChild(n);

  const strip = frame('Footer surface', 'HORIZONTAL');
  strip.counterAxisAlignItems = 'CENTER';
  strip.itemSpacing = 12;
  strip.paddingLeft = 32; strip.paddingRight = 32; strip.paddingTop = 24; strip.paddingBottom = 24;
  strip.fills = [paint('inverse')];
  block.appendChild(strip);

  for (const b of BRANDS) {
    const box = await builder(b);
    if (box) strip.appendChild(box);
  }
  return block;
}

// A · bizim yuvarlak konteyner, tek renkli isaret
await step('A · yuvarlak konteyner', async () => {
  await optionBlock(
    'A · House container, official single colour mark',
    'Our container: a true 32 px circle, transparent by default. The mark is the brand official single path, white on the dark footer. On hover the circle fills with the brand colour. This is what Stripe and Revolut footers do.',
    async (b) => {
      const box = frame('Social · ' + b.key, 'HORIZONTAL');
      box.counterAxisAlignItems = 'CENTER';
      box.primaryAxisAlignItems = 'CENTER';
      box.primaryAxisSizingMode = 'FIXED';
      box.counterAxisSizingMode = 'FIXED';
      box.resize(32, 32);
      box.fills = [];
      box.strokes = [];
      for (const c of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) box.setBoundVariable(c, V.rFull);
      const g = glyphFor(b.key);
      if (g) { box.appendChild(g); fitTo(g, 18); recolor(g, paint('textInverse')); }
      return box;
    }
  );
});

// B · yuvarlak koseli kare, markanin rengi dolu, beyaz isaret
await step('B · markali kare', async () => {
  await optionBlock(
    'B · House square, brand colour fill, white mark',
    'One shape for all four: a 32 px rounded square, radius 8. The fill is the brand own colour, the mark sits on it in white. The square and the radius are ours, the colour and the mark are theirs, so no app icon is copied. X inverts, because its colour is the footer colour.',
    async (b) => {
      const box = frame('Social · ' + b.key, 'HORIZONTAL');
      box.counterAxisAlignItems = 'CENTER';
      box.primaryAxisAlignItems = 'CENTER';
      box.primaryAxisSizingMode = 'FIXED';
      box.counterAxisSizingMode = 'FIXED';
      box.resize(32, 32);
      box.fills = [solid(b.invertOnDark ? '#FFFFFF' : b.color)];
      for (const c of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) box.setBoundVariable(c, V.rMd);
      const g = glyphFor(b.key);
      if (g) { box.appendChild(g); fitTo(g, 17); recolor(g, b.invertOnDark ? solid('#111613') : solid('#FFFFFF')); }
      return box;
    }
  );
});

// C · markalarin gercek app ikonlari, oldugu gibi
await step('C · orijinal app ikonlari', async () => {
  await optionBlock(
    'C · The brands own icons, untouched',
    'The files as dropped in, scaled to 32 px and nothing else changed. Instagram brings its gradient square, LinkedIn a blue square, Facebook a circle, X only a bare mark with no container at all. Four different shapes sitting next to each other.',
    async (b) => {
      const box = frame('Social · ' + b.key, 'HORIZONTAL');
      box.counterAxisAlignItems = 'CENTER';
      box.primaryAxisAlignItems = 'CENTER';
      box.primaryAxisSizingMode = 'FIXED';
      box.counterAxisSizingMode = 'FIXED';
      box.resize(32, 32);
      box.fills = [];
      const o = originalFor(b.node);
      if (o) { box.appendChild(o); fitTo(o, 32); }
      else report.errors.push('bulunamadi: ' + b.node);
      return box;
    }
  );
});

// panoyu sagda bos alana koy
await step('Pano yerlesimi', async () => {
  if (!board) throw new Error('pano yok');
  let right = 0;
  for (const n of page0.children) {
    if (n === board) continue;
    const b = n.absoluteBoundingBox;
    if (b && b.x + b.width > right) right = b.x + b.width;
  }
  board.x = right + 200;
  board.y = 0;
  report.info['pano konumu'] = Math.round(board.x) + ',' + Math.round(board.y);
  report.info['pano boyutu'] = Math.round(board.width) + 'x' + Math.round(board.height);
});

await step('Mevcut Social icon olcusu', async () => {
  if (!socialSet) { report.info['Social icon'] = 'bulunamadi'; return; }
  const f = socialSet.children[0];
  report.info['mevcut Social icon kutusu'] = Math.round(f.width) + 'x' + Math.round(f.height) + ' (kare olmadigi icin radius 999 daire degil hap uretiyor)';
});

return report;
