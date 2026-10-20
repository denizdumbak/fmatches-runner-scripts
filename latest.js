// step 158 · Gallery lightbox: 01'de Lightbox component (Desktop / Mobile) · 02'de Profiles / Player / Gallery lightbox · Desktop/Mobile (profilin sagina, Directory saga kayar) · tiklama oku + prototip (foto → lightbox, kapat → profil)

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
for (const k of ['Label/Default', 'Label/Default Strong']) { if (!TS[k]) throw new Error('text style missing: ' + k); await figma.loadFontAsync(TS[k].fontName); }
async function txt(name, chars, style, color) {
  const t = figma.createText(); t.name = name;
  await t.setTextStyleIdAsync(TS[style].id); t.characters = chars; t.fills = [P(V(color))];
  return t;
}
const ICON = { x: 'M17 7L7 17M7 7l10 10', left: 'M15 18l-6-6 6-6', right: 'M9 18l6-6-6-6' };
function icon(name, key, size, color) {
  const f = figma.createNodeFromSvg('<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="' + ICON[key] + '" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  f.name = name; f.fills = []; f.clipsContent = false;
  for (const v of f.findAll(n => n.type === 'VECTOR')) { v.strokes = [P(V(color))]; v.fills = []; v.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; }
  f.rescale(size / 24);
  return f;
}
function frame(name, mode) { const f = figma.createFrame(); f.name = name; f.fills = []; f.clipsContent = false; if (mode) { f.layoutMode = mode; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; f.itemSpacing = 0; } return f; }
function circleButton(name, key) {
  const b = frame(name, 'HORIZONTAL');
  b.primaryAxisSizingMode = 'FIXED'; b.counterAxisSizingMode = 'FIXED'; b.resize(48, 48);
  b.primaryAxisAlignItems = 'CENTER'; b.counterAxisAlignItems = 'CENTER';
  R(b, V('radius/full'));
  b.strokes = [P(V('color/border/inverse'))]; b.strokeWeight = 1; b.strokeAlign = 'INSIDE';
  b.appendChild(icon('Icon', key, 24, 'color/icon/inverse'));
  return b;
}
const nav = (dest, type, dur) => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: type, easing: { type: 'EASE_OUT' }, duration: dur }, preserveScrollPosition: false, resetVideoPosition: false }] });

const BASE = 'https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/img/gallery/';
const PHOTOS = ['a', 'b', 'c', 'd', 'e', 'f'];
const IMG = {};
await step('images', async () => { for (const k of PHOTOS) IMG[k] = (await figma.createImageAsync(BASE + 'gallery-' + k + '.jpg')).hash; });
const imgFill = (k, mode) => [{ type: 'IMAGE', scaleMode: mode || 'FILL', imageHash: IMG[k] }];

const sec3 = p01.children.find(n => n.type === 'SECTION' && /^3 · /.test(n.name));
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const SUB = 'Profiles · player';
const subOf = s => s.children.find(n => n.type === 'SECTION' && n.name === SUB);

// ---------- 1. Lightbox component ----------
let set;
await step('lightbox component', async () => {
  for (const s of sec3.children.filter(n => n.name === 'Lightbox')) s.remove();
  const comps = [];
  for (const D of ['Desktop', 'Mobile']) {
    const desk = D === 'Desktop';
    const W = desk ? 1440 : 390, H = desk ? 900 : 844, side = desk ? 80 : 16;
    const c = figma.createComponent(); p01.appendChild(c);
    c.name = 'Device=' + D; c.resize(W, H); c.clipsContent = true; c.fills = [];
    const scrim = figma.createRectangle(); c.appendChild(scrim);
    scrim.name = 'Scrim'; scrim.resize(W, H); scrim.fills = [P(V('color/bg/inverse'))]; scrim.opacity = 0.94;
    scrim.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };

    const top = frame('Top bar', 'HORIZONTAL'); c.appendChild(top);
    top.primaryAxisSizingMode = 'FIXED'; top.resize(W - side * 2, 48); top.x = side; top.y = desk ? 24 : 16;
    top.primaryAxisAlignItems = 'SPACE_BETWEEN'; top.counterAxisAlignItems = 'CENTER';
    top.constraints = { horizontal: 'STRETCH', vertical: 'MIN' };
    const title = frame('Title', 'HORIZONTAL'); top.appendChild(title);
    title.itemSpacing = 12; title.counterAxisAlignItems = 'CENTER';
    title.appendChild(await txt('Name', `Leo Marsh`, 'Label/Default Strong', 'color/text/inverse'));
    title.appendChild(await txt('Counter', `1 / 6`, 'Label/Default', 'color/text/inverse-secondary'));
    top.appendChild(circleButton('Close', 'x'));

    const pw = desk ? 930 : 390, ph = desk ? 620 : 260;
    const photo = figma.createRectangle(); c.appendChild(photo);
    photo.name = 'Photo'; photo.resize(pw, ph); photo.x = (W - pw) / 2;
    photo.y = desk ? 132 : Math.round((H - ph) / 2) - 24;
    photo.fills = imgFill('a', 'FIT');
    if (desk) R(photo, V('radius/md'));
    photo.constraints = { horizontal: 'CENTER', vertical: 'CENTER' };

    if (desk) {
      const prev = circleButton('Previous', 'left'); c.appendChild(prev);
      prev.x = side; prev.y = photo.y + ph / 2 - 24; prev.constraints = { horizontal: 'MIN', vertical: 'CENTER' };
      const next = circleButton('Next', 'right'); c.appendChild(next);
      next.x = W - side - 48; next.y = prev.y; next.constraints = { horizontal: 'MAX', vertical: 'CENTER' };
    }

    const ts = desk ? 64 : 48, tg = desk ? 8 : 6;
    const strip = frame('Thumbnails', 'HORIZONTAL'); c.appendChild(strip);
    strip.itemSpacing = tg;
    for (const k of PHOTOS) {
      const t = figma.createRectangle(); strip.appendChild(t);
      const sel = k === 'a';
      t.name = sel ? 'Thumb · Selected' : 'Thumb';
      t.resize(ts, ts); R(t, V('radius/sm')); t.fills = imgFill(k);
      if (sel) { t.strokes = [P(V('color/text/inverse'))]; t.strokeWeight = 2; t.strokeAlign = 'INSIDE'; } else t.opacity = 0.48;
    }
    strip.x = Math.round((W - strip.width) / 2); strip.y = H - (desk ? 24 : 32) - ts;
    strip.constraints = { horizontal: 'CENTER', vertical: 'MAX' };
    comps.push(c);
  }
  set = figma.combineAsVariants(comps, sec3);
  set.name = 'Lightbox';
  let x = 24; for (const v of set.children) { v.x = x; v.y = 24; x += v.width + 80; }
  set.resizeWithoutConstraints(x - 80 + 24, Math.max(...set.children.map(v => v.height)) + 48);
  set.description = `Full-screen photo viewer, opened from a photo in the Gallery card. Dark scrim over the page (bg/inverse, 94%), photo shown whole (fit, never cropped), counter "n / total", thumbnails of all photos with the current one outlined. Close: × button, Esc, or a click on the scrim; returns to the profile at the same scroll position. Desktop: arrow buttons and the keyboard arrows move between photos. Mobile: swipe left or right, no arrows; thumbnails scroll sideways if they do not fit.`;
  report.info.set = set.id + ' · ' + set.children.map(v => v.name + ' ' + r(v.width) + 'x' + r(v.height)).join(' · ');
});

// ---------- 2. Lightbox sayfalari ----------
// bir Section genisleyince sagindakileri kaydir, ust seviyelere tasi
function growRight(node, oldRight) {
  const parent = node.parent;
  const d = node.x + node.width - oldRight;
  if (d <= 0 || !parent) return [];
  const out = [];
  const top = node.y, bottom = node.y + node.height;
  for (const k of parent.children) {
    if (k === node) continue;
    if (k.x >= oldRight - 1 && k.y < bottom && k.y + k.height > top) { k.x += d; out.push(k.name + ' +' + r(d)); }
  }
  if (parent.type === 'SECTION') {
    const pOld = parent.x + parent.width;
    let right = 0; for (const k of parent.children) right = Math.max(right, k.x + k.width);
    if (right + 80 > parent.width) { parent.resizeWithoutConstraints(Math.ceil(right + 80), parent.height); return out.concat(growRight(parent, pOld)); }
  }
  return out;
}

const pages = {};
for (const [platform, sec] of [['Desktop', web], ['Mobile', mob]]) {
  await step('lightbox page · ' + platform, async () => {
    const sub = subOf(sec);
    if (!sub) throw new Error(SUB + ' not found in ' + sec.name);
    const prof = sub.children.find(n => n.type === 'FRAME' && n.name === 'Profiles / Player · ' + platform);
    if (!prof) throw new Error('profile frame not found');
    const NAME = 'Profiles / Player / Gallery lightbox · ' + platform;
    const gap = platform === 'Desktop' ? 480 : 360;
    const old = sub.children.find(n => n.name === NAME);
    for (const g of sub.children.filter(n => n.name === 'Flow · Open photo · ' + platform)) g.remove();
    let x, y, shifted = [];
    if (old) { x = old.x; y = old.y; old.remove(); }
    else {
      x = prof.x + prof.width + gap; y = prof.y;
      const W = platform === 'Desktop' ? 1440 : 390;
      const d = W + gap;
      const edge = prof.x + prof.width;
      const subOldRight = sub.x + sub.width;
      for (const k of sub.children) if (k !== prof && k.x >= edge - 1) { k.x += d; shifted.push(k.name); }
      let right = 0; for (const k of sub.children) right = Math.max(right, k.x + k.width);
      if (right + 80 > sub.width) sub.resizeWithoutConstraints(Math.ceil(right + 80), sub.height);
      shifted = shifted.concat(growRight(sub, subOldRight));
    }
    const f = prof.clone();
    sub.appendChild(f);
    f.name = NAME; f.x = x; f.y = y;
    const H = platform === 'Desktop' ? 900 : 844;
    if (f.layoutMode !== 'NONE') f.primaryAxisSizingMode = 'FIXED';
    f.resize(f.width, H); f.clipsContent = true;
    for (const n of f.findAll(n => n.reactions && n.reactions.length)) await n.setReactionsAsync([]);
    const lb = set.children.find(v => v.name === 'Device=' + platform).createInstance();
    f.appendChild(lb);
    lb.layoutPositioning = 'ABSOLUTE'; lb.x = 0; lb.y = 0; lb.name = 'Lightbox';
    lb.findOne(n => n.name === 'Photo').fills = imgFill('c', 'FIT');
    const cnt = lb.findOne(n => n.name === 'Counter'); cnt.characters = '3 / 6';
    const thumbs = lb.findOne(n => n.name === 'Thumbnails').children;
    thumbs.forEach((t, i) => { if (i === 2) { t.strokes = [P(V('color/text/inverse'))]; t.strokeWeight = 2; t.opacity = 1; } else { t.strokes = []; t.opacity = 0.48; } });
    pages[platform] = { f, prof, sub, lb };
    report.info['page' + platform] = r(f.width) + 'x' + r(f.height) + ' at ' + r(f.x) + ',' + r(f.y) + (old ? ' (same place)' : ' · shifted: ' + (shifted.length ? shifted.join(', ') : 'none'));
  });
}

// ---------- 3. prototip ----------
await step('prototype', async () => {
  let links = 0;
  for (const k of Object.keys(pages)) {
    const { f, prof, lb } = pages[k];
    for (const ph of prof.findAll(n => n.type === 'INSTANCE' && /^Photo [A-F]$/.test(n.name))) { await ph.setReactionsAsync([nav(f, 'DISSOLVE', 0.2)]); links++; }
    const close = lb.findOne(n => n.name === 'Close');
    await close.setReactionsAsync([nav(prof, 'DISSOLVE', 0.2)]); links++;
  }
  report.info.links = links;
});

// ---------- 4. tiklama oku ----------
await step('flow arrows', async () => {
  const out = [];
  for (const k of Object.keys(pages)) {
    const { f, prof, sub } = pages[k];
    const ph = prof.findOne(n => n.name === 'Photo C');
    const pb = ph.absoluteBoundingBox, sb = sub.absoluteBoundingBox, fb = f.absoluteBoundingBox;
    const BLUE = { r: 13 / 255, g: 153 / 255, b: 1 };
    const box = figma.createRectangle(); sub.appendChild(box);
    box.name = 'Clicked'; box.x = pb.x - sb.x - 4; box.y = pb.y - sb.y - 4; box.resize(pb.width + 8, pb.height + 8);
    box.fills = []; box.strokes = [{ type: 'SOLID', color: BLUE }]; box.strokeWeight = 3; box.cornerRadius = 16;
    // ok: fotodan saga, profil ile lightbox arasindaki bosluga, yukari, lightbox'un ortasina
    const sx = box.x + box.width, sy = box.y + box.height / 2;
    const tx = fb.x - sb.x, ty = fb.y - sb.y + fb.height / 2;
    const mx = (prof.x + prof.width + tx) / 2;
    const pts = [[sx, sy], [mx, sy], [mx, ty], [tx, ty]];
    const minX = Math.min(...pts.map(q => q[0])), minY = Math.min(...pts.map(q => q[1]));
    const v = figma.createVector(); sub.appendChild(v);
    v.name = 'Arrow';
    await v.setVectorNetworkAsync({
      vertices: pts.map((q, i) => ({ x: q[0] - minX, y: q[1] - minY, strokeCap: i === pts.length - 1 ? 'ARROW_LINES' : 'NONE' })),
      segments: [{ start: 0, end: 1 }, { start: 1, end: 2 }, { start: 2, end: 3 }], regions: []
    });
    v.x = minX; v.y = minY; v.strokes = [{ type: 'SOLID', color: BLUE }]; v.strokeWeight = 4; v.strokeJoin = 'ROUND';
    const lab = frame('Label', 'HORIZONTAL'); sub.appendChild(lab);
    lab.paddingTop = 6; lab.paddingBottom = 6; lab.paddingLeft = 10; lab.paddingRight = 10;
    lab.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]; lab.cornerRadius = 6;
    lab.strokes = [{ type: 'SOLID', color: BLUE }]; lab.strokeWeight = 1;
    lab.appendChild(await txt('Text', `Click a photo · opens the gallery lightbox`, 'Label/Default Strong', 'color/text/primary'));
    lab.x = mx + 24; lab.y = ty - lab.height - 12;
    const g = figma.group([box, v, lab], sub);
    g.name = 'Flow · Open photo · ' + k;
    out.push(g.name + ' ' + r(g.width) + 'x' + r(g.height));
  }
  report.info.arrows = out;
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
});

// ---------- 6. kontrol ----------
await step('check', async () => {
  const unbound = [];
  for (const n of [set].concat(set.findAll(() => true))) for (const key of ['fills', 'strokes']) {
    if (!(key in n)) continue; const ps = n[key]; if (!ps || ps === figma.mixed) continue;
    for (const p of ps) if (p.type === 'SOLID' && !(p.boundVariables && p.boundVariables.color)) unbound.push(n.name + ' ' + key);
  }
  report.info.unboundPaints = unbound.length ? unbound : 'none';
  const ts = set.findAll(x => x.type === 'TEXT' && !x.textStyleId).map(x => x.name);
  report.info.textsWithoutStyle = ts.length ? ts : 'none';
  let total = 0, broken = 0;
  for (const n of p02.findAll(n => n.reactions && n.reactions.length)) for (const rr of n.reactions) for (const a of (rr.actions || [])) {
    if (!a.destinationId) continue; total++; if (!(await figma.getNodeByIdAsync(a.destinationId))) broken++;
  }
  report.info.prototype = total + ' links, ' + broken + ' broken';
  const ov = [];
  for (const s of [web, mob]) { const k = s.children.filter(c => c.type === 'SECTION');
    for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) { const a = k[i], z = k[j];
      if (a.x < z.x + z.width && z.x < a.x + a.width && a.y < z.y + z.height && z.y < a.y + a.height) ov.push(a.name + ' / ' + z.name); } }
  const top = p02.children.filter(c => c.type === 'SECTION');
  for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) { const a = top[i], z = top[j];
    if (a.x < z.x + z.width && z.x < a.x + a.width && a.y < z.y + z.height && z.y < a.y + a.height) ov.push(a.name + ' / ' + z.name); }
  report.info.sectionOverlaps = ov.length ? ov : 'none';
});

return report;
