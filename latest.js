// step 157 · Gallery: 01'de Gallery photo component (Default / Hover, More "+N") · Leo profiline Gallery karti (masaustu sol sutunda Positions alti, mobilde Career sonrasi, 3 sutun) · alttakiler itilir

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
const r = n => Math.round(n);

const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const R = (n, v) => { for (const c of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) n.setBoundVariable(c, v); };
const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
const MORE_STYLE = TS['Label/Large Strong'] ? 'Label/Large Strong' : 'Label/Default Strong';
await figma.loadFontAsync(TS[MORE_STYLE].fontName);
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }
function rx(trigger, dest) {
  return { trigger: { type: trigger }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'CHANGE_TO', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.15 }, preserveScrollPosition: false, resetVideoPosition: false }] };
}

const BASE = 'https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/img/gallery/';
const PHOTOS = ['a', 'b', 'c', 'd', 'e', 'f'];
const IMG = {};
await step('images', async () => {
  for (const k of PHOTOS) IMG[k] = (await figma.createImageAsync(BASE + 'gallery-' + k + '.jpg')).hash;
  report.info.images = Object.keys(IMG).length;
});
const imgFill = k => [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: IMG[k] }];

const sec3 = p01.children.find(n => n.type === 'SECTION' && /^3 · /.test(n.name));
const targets = p02.findAll(n => n.type === 'FRAME' && /^Profiles \/ Player · (Desktop|Mobile)$/.test(n.name));
report.info.targets = targets.map(f => f.name);

// eski boylar (alttakileri itmek icin, butun Section seviyelerinde)
const oldH = new Map();
for (const s of p02.findAll(n => n.type === 'SECTION')) { oldH.set(s.id, s.height); for (const k of s.children) oldH.set(k.id, k.height); }

// ---------- 1. temizlik (tekrar calisma) ----------
await step('cleanup', async () => {
  let cards = 0;
  for (const f of targets) for (const c of f.findAll(n => n.name === 'Gallery' && n.type === 'FRAME')) { c.remove(); cards++; }
  for (const s of sec3.children.filter(n => n.name === 'Gallery photo')) s.remove();
  report.info.cleanup = cards + ' old cards';
});

// ---------- 2. Gallery photo component ----------
let set, moreKey;
await step('gallery photo component', async () => {
  const comps = [];
  for (const state of ['Default', 'Hover']) {
    const c = figma.createComponent(); p01.appendChild(c);
    c.name = 'State=' + state;
    c.resize(112, 112);
    R(c, V('radius/md'));
    c.clipsContent = true;
    c.fills = imgFill('a');
    const shade = figma.createRectangle(); c.appendChild(shade);
    shade.name = 'Shade'; shade.resize(112, 112); shade.fills = [P(V('color/bg/inverse'))];
    shade.opacity = 0.24; shade.visible = state === 'Hover';
    shade.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
    const more = figma.createFrame(); c.appendChild(more);
    more.name = 'More'; more.resize(112, 112); more.fills = [];
    more.layoutMode = 'HORIZONTAL'; more.primaryAxisSizingMode = 'FIXED'; more.counterAxisSizingMode = 'FIXED';
    more.primaryAxisAlignItems = 'CENTER'; more.counterAxisAlignItems = 'CENTER';
    more.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
    const veil = figma.createRectangle(); more.appendChild(veil);
    veil.name = 'Veil'; veil.fills = [P(V('color/bg/inverse'))]; veil.opacity = state === 'Hover' ? 0.64 : 0.56;
    veil.layoutPositioning = 'ABSOLUTE'; veil.x = 0; veil.y = 0; veil.resize(112, 112);
    veil.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
    const t = figma.createText(); more.appendChild(t);
    t.name = 'Count'; await t.setTextStyleIdAsync(TS[MORE_STYLE].id); t.characters = '+4'; t.fills = [P(V('color/text/inverse'))];
    comps.push(c);
  }
  set = figma.combineAsVariants(comps, sec3);
  set.name = 'Gallery photo';
  moreKey = set.addComponentProperty('More', 'BOOLEAN', true);
  for (const v of set.children) v.findOne(n => n.name === 'More').componentPropertyReferences = { visible: moreKey };
  let x = 24; for (const v of set.children) { v.x = x; v.y = 24; x += v.width + 40; }
  set.resizeWithoutConstraints(x - 40 + 24, 112 + 48);
  await set.children.find(v => v.name === 'State=Default').setReactionsAsync([rx('ON_HOVER', set.children.find(v => v.name === 'State=Hover'))]);
  set.description = `One photo in the Gallery card of a profile (images, object_type 1, sorted by "order"). Square, radius 12, photo cropped to fill from the centre. Hover: the photo darkens slightly. Click opens the photo in the lightbox. The card shows up to 6 photos in a 3-column grid; with more than 6, the 6th photo gets the dark veil with "+N" (More = on), N = photos not shown, and it opens the lightbox there. No photos: the Gallery card is hidden. Desktop: left column under Positions. Mobile: after Career.`;
  report.info.set = set.id + ' · ' + set.children.length + ' variants';
});

const variant = name => set.children.find(v => v.name === name);

// ---------- 3. Gallery karti profillere ----------
const pageOut = [];
for (const f of targets) {
  await step('card · ' + f.name, async () => {
    const desk = f.width > 800;
    const list = f.findOne(n => n.name === 'Link list');
    if (!list) throw new Error('Link list not found');
    const src = list.parent;
    const card = src.clone();
    card.name = 'Gallery';
    for (const k of card.children.slice(1)) k.remove();
    const head = card.children[0];
    const ht = head.type === 'TEXT' ? head : head.findOne(n => n.type === 'TEXT');
    await loadFonts(ht); ht.characters = 'Gallery';
    if (head.type !== 'TEXT') for (const t of head.findAll(n => n.type === 'TEXT' && n !== ht)) t.remove();

    if (desk) {
      const left = f.findOne(n => n.name === 'Left column');
      const pos = left.children.find(n => n.name === 'Positions');
      left.insertChild(pos ? left.children.indexOf(pos) + 1 : left.children.length, card);
    } else {
      const body = f.findOne(n => n.name === 'Profile body');
      body.appendChild(card);
    }
    card.layoutSizingHorizontal = 'FILL';
    card.layoutSizingVertical = 'HUG';

    const grid = figma.createFrame(); card.appendChild(grid);
    grid.name = 'Gallery grid'; grid.fills = []; grid.clipsContent = false;
    grid.layoutMode = 'HORIZONTAL'; grid.layoutWrap = 'WRAP';
    grid.setBoundVariable('itemSpacing', V('spacing/xs'));
    grid.setBoundVariable('counterAxisSpacing', V('spacing/xs'));
    grid.layoutSizingHorizontal = 'FILL'; grid.layoutSizingVertical = 'HUG';
    const size = Math.floor((grid.width - 16) / 3);
    for (const k of PHOTOS) {
      const i = variant('State=Default').createInstance();
      grid.appendChild(i);
      i.name = 'Photo ' + k.toUpperCase();
      i.setProperties({ [moreKey]: false });
      i.resize(size, size);
      i.fills = imgFill(k);
    }
    if (!desk) {
      const bar = f.children.find(n => /^Sticky action bar/.test(n.name));
      if (bar) bar.y = f.height - bar.height;
    }
    pageOut.push(f.name + ' · thumb ' + size + ' · grid ' + r(grid.width) + 'x' + r(grid.height) + ' · card ' + r(card.width) + 'x' + r(card.height) + ' · frame ' + r(oldH.get(f.id)) + ' → ' + r(f.height));
  });
}
report.info.pages = pageOut;

// ---------- 4. alttakileri it (en ic Section'dan disa) ----------
await step('push below', async () => {
  const moved = [];
  const depth = n => { let d = 0, x = n.parent; while (x && x.type !== 'PAGE') { d++; x = x.parent; } return d; };
  const secs = p02.findAll(n => n.type === 'SECTION').sort((a, b) => depth(b) - depth(a));
  for (const s of secs) {
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
  report.info.moved = moved.length ? moved : 'nothing to move';
});

// ---------- 5. 01 duzeni ----------
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
await step('sections 01', async () => {
  relayout(sec3);
  const order = [/^1 · /, /^2 · /, /^3 · /, /^4 · /, /^5 · /, /^Archive/];
  const secs = order.map(re => p01.children.find(n => n.type === 'SECTION' && re.test(n.name))).filter(Boolean);
  let x = 1640;
  for (const s of secs) { s.x = x; s.y = 0; x += s.width + 160; }
  report.info.sections01 = secs.map(s => s.name + ' x' + r(s.x));
});

// ---------- 6. kontrol ----------
await step('check', async () => {
  const unbound = [];
  const scope = [set].concat(targets.map(f => f.findOne(n => n.name === 'Gallery')).filter(Boolean));
  for (const root of scope) for (const n of [root].concat(root.findAll(() => true))) {
    for (const key of ['fills', 'strokes']) {
      if (!(key in n)) continue; const ps = n[key]; if (!ps || ps === figma.mixed) continue;
      for (const p of ps) if (p.type === 'SOLID' && !(p.boundVariables && p.boundVariables.color)) unbound.push(n.name + ' ' + key);
    }
  }
  report.info.unboundPaints = unbound.length ? unbound.slice(0, 20) : 'none';
  const ts = []; for (const root of scope) for (const t of root.findAll(x => x.type === 'TEXT' && !x.textStyleId)) ts.push(t.name);
  report.info.textsWithoutStyle = ts.length ? ts : 'none';
  const subs = []; for (const sec of p02.children.filter(c => c.type === 'SECTION')) {
    const k = sec.children.filter(c => c.type === 'SECTION');
    for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) { const a = k[i], z = k[j];
      if (a.x < z.x + z.width && z.x < a.x + a.width && a.y < z.y + z.height && z.y < a.y + a.height) subs.push(a.name + ' / ' + z.name); }
  }
  report.info.subSectionOverlaps = subs.length ? subs : 'none';
});

return report;
