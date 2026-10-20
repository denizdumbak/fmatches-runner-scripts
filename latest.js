// step 175 · Own profile oklari: hedefler tiklanan ogenin tarafina (sol kartlar solda, sag kartlar sagda), oklar en yakin kenardan ic ice, kesismesiz · form acikken obur kartlarin Edit'i gizli · galeri x notu · kesisme sayimi · Section duzeni

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
const r = n => Math.round(n);
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const PAD = (n, t, rr, b, l) => { n.setBoundVariable('paddingTop', V(t)); n.setBoundVariable('paddingRight', V(rr)); n.setBoundVariable('paddingBottom', V(b)); n.setBoundVariable('paddingLeft', V(l)); };
const GAP = (n, v) => n.setBoundVariable('itemSpacing', V(v));
const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
for (const k of ['Label/Default', 'Label/Default Strong', 'Label/Small', 'Label/Overline', 'Body/Default', 'Heading/H4']) { if (!TS[k]) throw new Error('text style missing: ' + k); await figma.loadFontAsync(TS[k].fontName); }
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }
async function txt(name, chars, style, color) {
  const t = figma.createText(); t.name = name;
  await t.setTextStyleIdAsync(TS[style].id); t.characters = chars; t.fills = [P(V(color))];
  return t;
}
function frame(name, mode) { const f = figma.createFrame(); f.name = name; f.fills = []; f.clipsContent = false; if (mode) { f.layoutMode = mode; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; f.itemSpacing = 0; } return f; }
const nav = (dest) => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });

const setOf = name => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === name);
const btnSet = setOf('Button'), fieldSet = setOf('Form field');
const keyOf = (set, re) => Object.keys(set.componentPropertyDefinitions).find(k => re.test(k));
const BTN_LABEL = keyOf(btnSet, /^Label#/), BTN_ICON = keyOf(btnSet, /^Icon#/);
async function button(style, label) {
  const v = btnSet.children.find(c => c.variantProperties.Style === style && c.variantProperties.State === 'Default');
  const i = v.createInstance(); const props = {}; props[BTN_LABEL] = label; if (BTN_ICON) props[BTN_ICON] = false; i.setProperties(props);
  const t = i.findOne(n => n.type === 'TEXT'); if (t && t.characters !== label) { await loadFonts(t); t.characters = label; }
  i.name = 'Button · ' + label; return i;
}
async function field(type, state, label, value, chips) {
  const v = fieldSet.children.find(c => c.variantProperties.Type === type && c.variantProperties.State === state);
  if (!v) throw new Error('Form field variant missing: ' + type + ' ' + state);
  const i = v.createInstance();
  const lt = i.findOne(n => n.type === 'TEXT' && n.name === 'Label'); await loadFonts(lt); lt.characters = label;
  if (value !== undefined) { const vt = i.findOne(n => n.type === 'TEXT' && n.name === 'Value' && n.parent && n.parent.name === 'Field'); if (vt) { await loadFonts(vt); vt.characters = value; } }
  if (chips) {
    const cs = i.findAll(n => n.name === 'Chip');
    cs.forEach((c, k) => { if (k < chips.length) { const t = c.findOne(n => n.type === 'TEXT'); t.characters = chips[k]; } else c.visible = false; });
  }
  i.name = 'Field · ' + label;
  return i;
}

const BLUE = { r: 13 / 255, g: 153 / 255, b: 1 };
async function elbow(sub, pts, labelText, name, group) {
  const minX = Math.min(...pts.map(q => q[0])), minY = Math.min(...pts.map(q => q[1]));
  const v = figma.createVector(); sub.appendChild(v); v.name = 'Arrow';
  await v.setVectorNetworkAsync({ vertices: pts.map((q, i) => ({ x: q[0] - minX, y: q[1] - minY, strokeCap: i === pts.length - 1 ? 'ARROW_LINES' : 'NONE' })), segments: pts.slice(1).map((q, i) => ({ start: i, end: i + 1 })), regions: [] });
  v.x = minX; v.y = minY; v.strokes = [{ type: 'SOLID', color: BLUE }]; v.strokeWeight = 4; v.strokeJoin = 'ROUND';
  const lab = frame('Label', 'HORIZONTAL'); sub.appendChild(lab);
  lab.paddingTop = 6; lab.paddingBottom = 6; lab.paddingLeft = 10; lab.paddingRight = 10;
  lab.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]; lab.cornerRadius = 6;
  lab.strokes = [{ type: 'SOLID', color: BLUE }]; lab.strokeWeight = 1;
  lab.appendChild(await txt('Text', labelText, 'Label/Default Strong', 'color/text/primary'));
  const g = figma.group([v, lab].concat(group || []), sub); g.name = name;
  return { g, lab };
}


const ckSet = setOf('Checkbox');
async function checkbox(on, label) {
  const v = ckSet.children.find(c => c.variantProperties.Checked === (on ? 'On' : 'Off') && c.variantProperties.State === 'Default');
  const i = v.createInstance(); const t = i.findOne(n => n.type === 'TEXT'); await loadFonts(t); t.characters = label; i.name = 'Checkbox · ' + label; return i;
}
const editSet = setOf('Edit button');
const editBtn = () => { const i = editSet.children.find(v => v.name === 'State=Default').createInstance(); i.name = 'Edit'; return i; };
const ICON = { plus: 'M12 5v14M5 12h14', x: 'M17 7L7 17M7 7l10 10' };
function icon(name, key, size, color) {
  const f = figma.createNodeFromSvg('<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="' + ICON[key] + '" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  f.name = name; f.fills = []; f.clipsContent = false;
  for (const v of f.findAll(n => n.type === 'VECTOR')) { v.strokes = [P(V(color))]; v.fills = []; v.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; }
  f.rescale(size / 24); return f;
}



// zemin: bagli boya yeni dugumde yer tutucu griyle (#808080) kalabiliyor; Career satir formunun dolgusu kopyalanir (168)
const REF = p02.findOne(n => n.name === 'Career row form');
if (!REF) throw new Error('Career row form missing');
const box = (f, desk) => {
  f.fills = REF.fills;
  for (const c of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) f.setBoundVariable(c, V('radius/md'));
  const p = desk ? 'spacing/lg' : 'spacing/md'; PAD(f, p, p, p, p);
};
async function actions(parent) {
  const acts = frame('Edit actions', 'HORIZONTAL'); parent.appendChild(acts); GAP(acts, 'spacing/sm');
  acts.appendChild(await button('Subtle', 'Cancel')); acts.appendChild(await button('Primary', 'Save'));
  acts.layoutSizingHorizontal = 'FILL'; acts.primaryAxisAlignItems = 'MAX'; acts.counterAxisAlignItems = 'CENTER';
  return acts;
}
const hex = p => p && p.color ? '#' + [p.color.r, p.color.g, p.color.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('') : '-';


const KINDS = ['details', 'career', 'positions', 'about', 'links', 'gallery'];
async function aboutInst(page) {
  for (const i of page.findAll(n => n.type === 'INSTANCE')) { const m = await i.getMainComponentAsync(); if (m && m.parent && m.parent.type === 'COMPONENT_SET' && m.parent.name === 'About') return i; }
  return null;
}
async function source(own, k) {
  // tiklanan buton ve karti
  if (k === 'details') { const b = own.findOne(n => n.name === 'Edit details'); return { btn: b, card: null }; }
  let card = null;
  if (k === 'career') card = own.findOne(n => n.name === 'Club entries').parent;
  if (k === 'positions') card = own.findOne(n => n.type === 'FRAME' && n.name === 'Positions');
  if (k === 'links') card = own.findOne(n => n.name === 'Link list').parent;
  if (k === 'gallery') card = own.findOne(n => n.name === 'Gallery grid').parent;
  if (k === 'about') { card = await aboutInst(own); return { btn: card.findOne(n => n.type === 'INSTANCE' && /^Edit/.test(n.name) && n.visible), card }; }
  return { btn: card.findOne(n => n.name === 'Card header').children.find(c => c.name === 'Edit'), card };
}
const TITLE = { details: 'Edit details', career: 'Edit on Career', positions: 'Edit on Positions', about: 'Edit on About', links: 'Edit on Links', gallery: 'Edit on Gallery' };
const PATHS = {};
const out = [];
for (const D of ['Desktop', 'Mobile']) {
  await step('layout and arrows · ' + D, async () => {
    const desk = D === 'Desktop', G = desk ? 480 : 360;
    const own = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player / Own profile · ' + D);
    const sub = own.parent;
    for (const n of sub.children.filter(c => /^Flow · Edit (details|career|positions|about|links|gallery) · /.test(c.name) || /^Note · Gallery remove · /.test(c.name))) n.remove();
    const T = {}; for (const k of KINDS) { T[k] = sub.children.find(c => c.name === 'Profiles / Player / Own profile / Edit ' + k + ' · ' + D); if (!T[k]) throw new Error('missing page ' + k); }
    const sb = sub.absoluteBoundingBox, ob = own.absoluteBoundingBox;
    const S = [];
    for (const k of KINDS) { const s = await source(own, k); if (!s.btn) throw new Error('no button ' + k); const b = s.btn.absoluteBoundingBox; S.push({ k, btn: s.btn, card: s.card, b, side: (b.x + b.width / 2 - ob.x) < own.width / 2 ? 'L' : 'R' }); }
    const L = S.filter(s => s.side === 'L').sort((a, z) => a.b.y - z.b.y), R = S.filter(s => s.side === 'R').sort((a, z) => a.b.y - z.b.y);
    // yerlesim: own ortada, en alttaki tiklama en yakin hedef
    const W = own.width, step_ = W + G;
    const left0 = Math.min(own.x, ...KINDS.map(k => T[k].x));
    const newOwnX = left0 + L.length * step_;
    const dx = newOwnX - own.x;
    for (const c of sub.children) if (!KINDS.some(k => c === T[k])) c.x += dx;
    L.slice().reverse().forEach((s, i) => { T[s.k].x = own.x - (i + 1) * step_; T[s.k].y = own.y; });
    R.slice().reverse().forEach((s, i) => { T[s.k].x = own.x + W + G + i * step_; T[s.k].y = own.y; });
    // oklar: en ustteki tiklama en icteki dikey, en yuksek serit, en uzak hedef
    const sbb = sub.absoluteBoundingBox;
    const loc = r_ => ({ x: r_.x - sbb.x, y: r_.y - sbb.y, w: r_.width, h: r_.height });
    PATHS[D] = [];
    for (const [side, list] of [['L', L], ['R', R]]) {
      const n = list.length;
      for (let i = 0; i < n; i++) {
        const s = list[i], f = T[s.k];
        const b = loc(s.btn.absoluteBoundingBox);
        const bx = figma.createRectangle(); sub.appendChild(bx);
        bx.name = 'Clicked'; bx.x = b.x - 4; bx.y = b.y - 4; bx.resize(b.w + 8, b.h + 8);
        bx.fills = []; bx.strokes = [{ type: 'SOLID', color: BLUE }]; bx.strokeWeight = 3; bx.cornerRadius = 26;
        const d = 48 + 40 * i, vx = side === 'L' ? own.x - d : own.x + W + d;
        const lane = own.y - 160 - 72 * (n - 1 - i);
        const tx = f.x + f.width / 2, by = bx.y + bx.height / 2;
        const pts = [];
        const nearEdge = side === 'L' ? (bx.x - own.x < 200) : (own.x + W - (bx.x + bx.width) < 200);
        if (nearEdge || !s.card) pts.push([side === 'L' ? bx.x : bx.x + bx.width, by], [vx, by]);
        else { const cb = loc(s.card.absoluteBoundingBox); const gy = cb.y - 12, cx = bx.x + bx.width / 2; pts.push([cx, bx.y], [cx, gy], [vx, gy]); }
        pts.push([vx, lane], [tx, lane], [tx, f.y]);
        const { lab } = await elbow(sub, pts, 'From Own profile · ' + TITLE[s.k], 'Flow · Edit ' + s.k + ' · ' + D, [bx]);
        lab.x = side === 'L' ? tx + 16 : tx - lab.width - 16; lab.y = lane - lab.height - 8;
        PATHS[D].push({ k: s.k, pts });
      }
    }
    // galeri: x notu
    const g = T.gallery;
    const note = await txt('Note · Gallery remove · ' + D, `Developer note: the remove button (×) is 32 px on screen; give it a 44 px tap area.`, 'Label/Small', 'color/text/warning');
    sub.appendChild(note); note.x = g.x; note.y = g.y + g.height + 80; note.textAutoResize = 'HEIGHT'; note.resize(Math.min(g.width, 400), note.height);
    out.push(D + ' · left ' + L.map(s => s.k).join(', ') + ' · right ' + R.map(s => s.k).join(', ') + ' · own moved ' + r(dx));
  });
}
report.info.layout = out;

// ---------- form acikken obur duzenleme tetikleyicileri gizli ----------
await step('hide other edits', async () => {
  const cnt = [];
  for (const D of ['Desktop', 'Mobile']) for (const k of KINDS) {
    const f = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player / Own profile / Edit ' + k + ' · ' + D);
    let c = 0;
    for (const n of f.findAll(n => (n.type === 'INSTANCE' && (n.name === 'Edit' || n.name === 'Edit details' || n.name === 'Button · Change photo')) && n.visible)) { n.visible = false; c++; }
    const ab = await aboutInst(f);
    if (ab) for (const n of ab.findAll(n => n.type === 'INSTANCE' && /^Edit/.test(n.name) && n.visible)) { n.visible = false; c++; }
    cnt.push(k[0] + (D === 'Desktop' ? 'D' : 'M') + c);
  }
  report.info.hiddenEdits = cnt.join(' ');
});

// ---------- kesisme sayimi ----------
await step('crossings', async () => {
  const res = [];
  for (const D of ['Desktop', 'Mobile']) {
    const segs = []; for (const p of PATHS[D]) for (let i = 1; i < p.pts.length; i++) segs.push({ k: p.k, a: p.pts[i - 1], b: p.pts[i] });
    let x = 0; const hit = [];
    for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
      const s = segs[i], t = segs[j]; if (s.k === t.k) continue;
      const sh = s.a[1] === s.b[1], th = t.a[1] === t.b[1]; if (sh === th) continue;
      const H = sh ? s : t, V = sh ? t : s;
      const hx0 = Math.min(H.a[0], H.b[0]), hx1 = Math.max(H.a[0], H.b[0]), vy0 = Math.min(V.a[1], V.b[1]), vy1 = Math.max(V.a[1], V.b[1]);
      if (V.a[0] > hx0 && V.a[0] < hx1 && H.a[1] > vy0 && H.a[1] < vy1) { x++; hit.push(H.k + '×' + V.k); }
    }
    res.push(D + ' ' + x + (hit.length ? ' (' + hit.join(', ') + ')' : ''));
  }
  report.info.crossings = res;
});

await step('flow starts', async () => {
  const keep = [];
  for (const s of (p02.flowStartingPoints || [])) {
    const n = await figma.getNodeByIdAsync(s.nodeId);
    if (!n || /\/ Edit (details|career|positions|about|links|gallery) ·/.test(n.name)) continue;
    if (keep.some(k => k.name === s.name)) continue;
    keep.push({ nodeId: s.nodeId, name: s.name });
  }
  p02.flowStartingPoints = keep;
  report.info.flowStarts = keep.length;
});

const BB = n => n.absoluteBoundingBox;
function moveKeep(node, parent) { const b = BB(node), pb = BB(parent); parent.appendChild(node); node.x = b.x - pb.x; node.y = b.y - pb.y; }
function fit(sec, pad) { let right = 0, bottom = 0; for (const k of sec.children) { right = Math.max(right, k.x + k.width); bottom = Math.max(bottom, k.y + k.height); } sec.resizeWithoutConstraints(Math.ceil(right + pad), Math.ceil(bottom + pad)); }
const plat = name => p02.children.find(n => n.type === 'SECTION' && n.name === name);

await step('contain children', async () => {
  const log = [];
  function contain(sec) {
    for (const c of sec.children.filter(k => k.type === 'SECTION')) contain(c);
    if (sec.type !== 'SECTION' || sec.parent.type === 'PAGE') return;
    let minX = Infinity, minY = Infinity; for (const k of sec.children) { minX = Math.min(minX, k.x); minY = Math.min(minY, k.y); }
    const dx = minX < 80 ? Math.ceil(80 - minX) : 0, dy = minY < 80 ? Math.ceil(80 - minY) : 0;
    if (dx || dy) { for (const k of sec.children) { k.x += dx; k.y += dy; } sec.x -= dx; sec.y -= dy; }
    let right = 0, bottom = 0; for (const k of sec.children) { right = Math.max(right, k.x + k.width); bottom = Math.max(bottom, k.y + k.height); }
    const w = Math.max(sec.width, Math.ceil(right + 80)), h = Math.max(sec.height, Math.ceil(bottom + 80));
    if (dx || dy || w !== sec.width || h !== sec.height) { sec.resizeWithoutConstraints(w, h); log.push(sec.parent.name + ' › ' + sec.name + (dx || dy ? ' · grew left/up ' + dx + '/' + dy : '') + ' · ' + r(w) + 'x' + r(h)); }
  }
  for (const P_ of ['Web', 'Mobile']) contain(plat(P_));
  report.info.contain = log.length ? log : 'nothing to fix';
});

await step('own profile below', async () => {
  for (const P_ of ['Web', 'Mobile']) {
    const ps = plat(P_);
    const own = ps.children.find(n => n.type === 'SECTION' && n.name === 'Own profile');
    let maxBottom = 0; for (const k of ps.children) if (k !== own && k.type === 'SECTION') maxBottom = Math.max(maxBottom, k.y + k.height);
    if (own.y < maxBottom + 160) own.y = maxBottom + 160;
  }
});

await step('widen platforms', async () => {
  const log = [];
  for (const P_ of ['Web', 'Mobile']) {
    const ps = plat(P_);
    let right = 0, bottom = 0; for (const k of ps.children) { right = Math.max(right, k.x + k.width); bottom = Math.max(bottom, k.y + k.height); }
    const needW = Math.ceil(right + 160), needH = Math.ceil(bottom + 160);
    const oldRight = ps.x + ps.width, dx = Math.max(0, needW - ps.width);
    if (dx > 0 || needH > ps.height) ps.resizeWithoutConstraints(Math.max(ps.width, needW), Math.max(ps.height, needH));
    if (dx > 0) for (const n of p02.children) if (n !== ps && n.x >= oldRight - 1) n.x += dx;
    log.push(P_ + ' · ' + r(ps.width) + 'x' + r(ps.height) + (dx ? ' · grew ' + dx : ''));
  }
  report.info.platforms = log;
});

await step('check', async () => {
  const ov = [], out = [];
  function walk(sec) {
    const kids = sec.children;
    const secs = kids.filter(c => c.type === 'SECTION');
    for (let i = 0; i < secs.length; i++) for (let j = i + 1; j < secs.length; j++) { const a = secs[i], z = secs[j];
      if (a.x < z.x + z.width && z.x < a.x + a.width && a.y < z.y + z.height && z.y < a.y + a.height) ov.push(a.name + ' / ' + z.name + ' in ' + sec.name); }
    if (sec.type === 'SECTION') for (const k of kids) if (k.x < 0 || k.y < 0 || k.x + k.width > sec.width + 1 || k.y + k.height > sec.height + 1) out.push(k.name + ' outside ' + sec.name);
    for (const c of secs) walk(c);
  }
  const top = p02.children.filter(c => c.type === 'SECTION');
  for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) { const a = top[i], z = top[j];
    if (a.x < z.x + z.width && z.x < a.x + a.width && a.y < z.y + z.height && z.y < a.y + a.height) ov.push(a.name + ' / ' + z.name); }
  for (const t of top) walk(t);
  report.info.sectionOverlaps = ov.length ? ov : 'none';
  report.info.outsideParent = out.length ? out.slice(0, 20) : 'none';
  let total = 0, broken = 0;
  for (const n of p02.findAll(n => n.reactions && n.reactions.length)) for (const rr of n.reactions) for (const a of (rr.actions || [])) {
    if (!a.destinationId) continue; total++; if (!(await figma.getNodeByIdAsync(a.destinationId))) broken++;
  }
  report.info.prototype = total + ' links, ' + broken + ' broken';
});

return report;
