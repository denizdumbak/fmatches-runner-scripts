// step 173 · Own profile / Edit links (Desktop + Mobile): Links karti yerinde form, gri kutuda URL alanlari, x ile sil, Add link, Cancel · Save · 01 panosundaki Links · Editing de gri kutuya · ok, prototip · Section duzeni ve kontrol

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


async function linkBox(desk, urls) {
  const form = frame('Links form', 'VERTICAL'); GAP(form, 'spacing/md'); box(form, false);
  const fl = frame('Link fields', 'VERTICAL'); form.appendChild(fl); GAP(fl, 'spacing/md'); fl.layoutSizingHorizontal = 'FILL';
  for (let i = 0; i < urls.length; i++) {
    const line = frame('Link ' + (i + 1), 'HORIZONTAL'); fl.appendChild(line);
    GAP(line, 'spacing/xs'); line.counterAxisAlignItems = 'MAX'; line.layoutSizingHorizontal = 'FILL';
    const f = await field('Text', 'Filled', 'Link ' + (i + 1), urls[i]); line.appendChild(f); f.layoutSizingHorizontal = 'FILL';
    const rm = frame('Remove', 'HORIZONTAL'); line.appendChild(rm);
    rm.primaryAxisSizingMode = 'FIXED'; rm.counterAxisSizingMode = 'FIXED'; rm.resize(48, 48);
    rm.primaryAxisAlignItems = 'CENTER'; rm.counterAxisAlignItems = 'CENTER'; rm.cornerRadius = 999;
    rm.appendChild(icon('Icon · Remove', 'x', 20, 'color/icon/default'));
  }
  const add = frame('Add link', 'HORIZONTAL'); fl.appendChild(add);
  GAP(add, 'spacing/xs'); add.counterAxisAlignItems = 'CENTER'; add.paddingTop = 8; add.paddingBottom = 8;
  add.appendChild(icon('Icon · Add', 'plus', 16, 'color/icon/brand'));
  add.appendChild(await txt('Label', `Add link`, 'Label/Default Strong', 'color/text/brand'));
  const hint = await txt('Hint', `Paste the full address. The type (video, profile, social, website) is read from it, and videos are listed first.`, 'Label/Small', 'color/text/secondary');
  form.appendChild(hint); hint.layoutSizingHorizontal = 'FILL'; hint.textAutoResize = 'HEIGHT';
  await actions(form);
  return form;
}
const BASE = { 'youtube.com': 'youtube.com/watch?v=leo-marsh-highlights', 'transfermarkt.com': 'transfermarkt.com/leo-marsh/profil', 'instagram.com': 'instagram.com/leomarsh10' };

// ---------- A: Edit links ----------
const out = [];
for (const D of ['Desktop', 'Mobile']) {
  await step('edit links · ' + D, async () => {
    const desk = D === 'Desktop';
    const own = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player / Own profile · ' + D);
    const sub = own.parent;
    const NAME = 'Profiles / Player / Own profile / Edit links · ' + D;
    for (const n of sub.children.filter(c => c.name === NAME || c.name === 'Flow · Edit links · ' + D)) n.remove();
    let right = 0; for (const k of sub.children) if (k.y < own.y + own.height && k.y + k.height > own.y) right = Math.max(right, k.x + k.width);
    const f = own.clone(); sub.appendChild(f);
    f.name = NAME; f.x = right + (desk ? 480 : 360); f.y = own.y;
    for (const n of f.findAll(n => n.reactions && n.reactions.length)) await n.setReactionsAsync([]);

    const list = f.findOne(n => n.name === 'Link list');
    if (!list) throw new Error('Link list not found');
    const card = list.parent;
    const domains = list.findAll(n => n.type === 'TEXT' && n.name === 'Domain').map(t => t.characters.trim());
    report.info['domains_' + D] = domains;
    const urls = domains.length ? domains.map(d => BASE[d] || (d + '/leo-marsh')) : Object.values(BASE);
    const hdr = card.findOne(n => n.name === 'Card header');
    const he = hdr && hdr.children.find(c => c.name === 'Edit'); if (he) he.visible = false;
    const form = await linkBox(desk, urls);
    card.insertChild(card.children.indexOf(list), form); form.layoutSizingHorizontal = 'FILL';
    list.remove();

    // prototip
    const ownList = own.findOne(n => n.name === 'Link list');
    const ownEdit = ownList.parent.findOne(n => n.name === 'Card header').children.find(c => c.name === 'Edit');
    await ownEdit.setReactionsAsync([nav(f)]);
    for (const b of form.findAll(n => /^Button · (Save|Cancel)$/.test(n.name))) await b.setReactionsAsync([nav(own)]);

    // ok: masaustu soldan, mobil sagdan
    const sb = sub.absoluteBoundingBox, bb = ownEdit.absoluteBoundingBox;
    const bx = figma.createRectangle(); sub.appendChild(bx);
    bx.name = 'Clicked'; bx.x = bb.x - sb.x - 4; bx.y = bb.y - sb.y - 4; bx.resize(bb.width + 8, bb.height + 8);
    bx.fills = []; bx.strokes = [{ type: 'SOLID', color: BLUE }]; bx.strokeWeight = 3; bx.cornerRadius = 26;
    const by = bx.y + bx.height / 2, topY = own.y - 440, tx = f.x + f.width / 2;
    const sx = desk ? bx.x : bx.x + bx.width, vx = desk ? own.x - 72 : own.x + own.width + 60;
    const pts = [[sx, by], [vx, by], [vx, topY], [tx, topY], [tx, f.y]];
    const { lab } = await elbow(sub, pts, 'Click Edit on Links · the card turns into its form', 'Flow · Edit links · ' + D, [bx]);
    lab.x = f.x - lab.width - 24; lab.y = topY - lab.height - 8;

    let rr = 0, bb2 = 0; for (const k of sub.children) { rr = Math.max(rr, k.x + k.width); bb2 = Math.max(bb2, k.y + k.height); }
    sub.resizeWithoutConstraints(Math.max(sub.width, Math.ceil(rr + 80)), Math.max(sub.height, Math.ceil(bb2 + 80)));
    const fw = form.findOne(n => n.type === 'INSTANCE' && /^Field · /.test(n.name));
    out.push(D + ' · at ' + r(f.x) + ' · card ' + r(card.width) + 'x' + r(card.height) + ' · links ' + urls.length + ' · field ' + (fw ? r(fw.width) : '-') + ' · fill ' + hex(form.fills[0]));
  });
}
report.info.pages = out;

// ---------- B: 01 panosundaki Links · Editing gri kutuya ----------
await step('board editing box', async () => {
  const c2 = p01.findOne(n => n.name === 'Links · Editing');
  if (!c2) throw new Error('Links · Editing not found');
  const fl = c2.findOne(n => n.name === 'Link fields');
  if (fl.parent.name === 'Links form') { report.info.board = 'already boxed'; return; }
  const acts = c2.children.find(c => c.name === 'Edit actions');
  const form = frame('Links form', 'VERTICAL'); GAP(form, 'spacing/md'); box(form, false);
  c2.insertChild(c2.children.indexOf(fl), form); form.layoutSizingHorizontal = 'FILL';
  form.appendChild(fl); fl.layoutSizingHorizontal = 'FILL';
  if (acts) { form.appendChild(acts); acts.layoutSizingHorizontal = 'FILL'; }
  report.info.board = 'boxed · ' + r(c2.width) + 'x' + r(c2.height) + ' · fill ' + hex(form.fills[0]);
});

await step('flow starts', async () => {
  const keep = [];
  for (const s of (p02.flowStartingPoints || [])) {
    const n = await figma.getNodeByIdAsync(s.nodeId);
    if (!n || /\/ Edit (details|career|positions|about|links) ·/.test(n.name)) continue;
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
