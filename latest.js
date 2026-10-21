// step 176 · Sign-up parcalari (01 › 6 · Sign-up & log-in): Stepper (Device × Steps × Current), Role option, Google button, Review row, Terms row

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

const hex = p => p && p.color ? '#' + [p.color.r, p.color.g, p.color.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('') : '-';
const RAD = (n, v) => { for (const c of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) n.setBoundVariable(c, V(v)); };
ICON.check = 'M5 12.5l4.5 4.5L19 7.5';
await figma.setCurrentPageAsync(p01);

const created = [];
const fillV = (n, v) => { n.fills = [P(V(v))]; created.push(n); };
const strokeV = (n, v, w) => { n.strokes = [P(V(v))]; n.strokeWeight = w; n.strokeAlign = 'INSIDE'; created.push(n); };
function comp(name, mode) {
  const c = figma.createComponent(); c.name = name; c.fills = []; c.clipsContent = false;
  if (mode) { c.layoutMode = mode; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO'; c.itemSpacing = 0; }
  return c;
}
const hoverTo = (from, to) => from.setReactionsAsync([{ trigger: { type: 'ON_HOVER' }, actions: [{ type: 'NODE', destinationId: to.id, navigation: 'CHANGE_TO', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.15 }, preserveScrollPosition: false, resetVideoPosition: false }] }]);

// ---------- yeni Section (Forms'un hemen sagina) ----------
const F = p01.children.find(n => n.type === 'SECTION' && /^5 · Forms/.test(n.name));
if (!F) throw new Error('Section 5 · Forms missing');
const old = p01.children.find(n => n.type === 'SECTION' && /^6 · /.test(n.name));
if (old) old.remove();
const sec = figma.createSection(); sec.name = '6 · Sign-up & log-in'; p01.appendChild(sec);
const tx0 = F.children.filter(n => n.type === 'TEXT');
report.info.formsTexts = tx0.map(t => t.name + ' | ' + (typeof t.fontSize === 'number' ? t.fontSize : 'mixed') + ' | ' + t.characters.slice(0, 50));

// ---------- Stepper ----------
const STEPS = { 3: ['Account', 'Personal', 'Review'], 4: ['Account', 'Personal', 'Football', 'Review'] };
async function stepper(device, total, cur) {
  const desk = device === 'Desktop';
  const c = comp('Device=' + device + ', Steps=' + total + ', Current=' + cur, 'HORIZONTAL');
  c.resize(desk ? 560 : 358, 28); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO'; c.counterAxisAlignItems = 'CENTER'; GAP(c, 'spacing/sm');
  const names = STEPS[total];
  for (let i = 0; i < total; i++) {
    const n = i + 1, done = n < cur, now = n === cur;
    const it = frame('Step ' + n, 'HORIZONTAL'); c.appendChild(it); GAP(it, 'spacing/xs'); it.counterAxisAlignItems = 'CENTER';
    const dot = frame('Dot', 'HORIZONTAL'); it.appendChild(dot);
    dot.resize(28, 28); dot.primaryAxisSizingMode = 'FIXED'; dot.counterAxisSizingMode = 'FIXED'; dot.primaryAxisAlignItems = 'CENTER'; dot.counterAxisAlignItems = 'CENTER';
    RAD(dot, 'radius/full'); fillV(dot, now ? 'color/bg/brand' : done ? 'color/bg/brand-subtle' : 'color/bg/subtle');
    if (done) dot.appendChild(icon('Check', 'check', 16, 'color/icon/brand'));
    else dot.appendChild(await txt('Number', String(n), now ? 'Label/Default Strong' : 'Label/Default', now ? 'color/text/inverse' : 'color/text/secondary'));
    if (desk || now) it.appendChild(await txt('Label', names[i], now ? 'Label/Default Strong' : 'Label/Default', upcomingGrey(done, now)));
    if (i < total - 1) {
      const ln = frame('Line', 'HORIZONTAL'); c.appendChild(ln); ln.resize(24, 2); ln.layoutSizingHorizontal = 'FILL'; ln.layoutSizingVertical = 'FIXED';
      fillV(ln, n < cur ? 'color/bg/brand' : 'color/border/default');
    }
  }
  return c;
}
function upcomingGrey(done, now) { return (done || now) ? 'color/text/primary' : 'color/text/secondary'; }

let stepperSet = null;
await step('Stepper', async () => {
  const items = [];
  let row = 0;
  for (const device of ['Desktop', 'Mobile']) for (const total of [3, 4]) {
    for (let cur = 1; cur <= total; cur++) { const c = await stepper(device, total, cur); sec.appendChild(c); items.push({ c, col: cur - 1, row }); }
    row++;
  }
  const cw = Math.max(...items.map(i => i.c.width)) + 48, rh = Math.max(...items.map(i => i.c.height)) + 48;
  items.forEach(i => { i.c.x = i.col * cw; i.c.y = i.row * rh; });
  stepperSet = figma.combineAsVariants(items.map(i => i.c), sec); stepperSet.name = 'Stepper';
  stepperSet.description = 'Sign-up progress. Steps 4 for Player and Manager/Official (step 3 is Football or Work), 3 for the other roles. Mobile shows only the current label.';
});

// ---------- Role option ----------
async function roleOption(state) {
  const c = comp('State=' + state, 'HORIZONTAL');
  c.resize(480, 80); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO'; c.counterAxisAlignItems = 'CENTER'; GAP(c, 'spacing/md');
  PAD(c, 'spacing/md', 'spacing/md', 'spacing/md', 'spacing/md'); RAD(c, 'radius/md');
  const sel = state === 'Selected';
  fillV(c, sel ? 'color/bg/brand-subtle' : state === 'Hover' ? 'color/bg/subtle' : 'color/bg/surface');
  strokeV(c, sel ? 'color/bg/brand' : state === 'Hover' ? 'color/border/strong' : 'color/border/default', sel ? 2 : 1);
  const tx = frame('Text', 'VERTICAL'); c.appendChild(tx); GAP(tx, 'spacing/2xs'); tx.layoutSizingHorizontal = 'FILL';
  const title = await txt('Title', 'Player', 'Label/Default Strong', 'color/text/primary'); tx.appendChild(title);
  const sub = await txt('Sub', 'Build a verified profile and be found by clubs and scouts.', 'Label/Small', 'color/text/secondary'); tx.appendChild(sub);
  sub.layoutSizingHorizontal = 'FILL'; sub.textAutoResize = 'HEIGHT';
  const rd = frame('Radio', 'HORIZONTAL'); c.appendChild(rd);
  rd.resize(24, 24); rd.primaryAxisSizingMode = 'FIXED'; rd.counterAxisSizingMode = 'FIXED'; rd.primaryAxisAlignItems = 'CENTER'; rd.counterAxisAlignItems = 'CENTER';
  RAD(rd, 'radius/full'); strokeV(rd, sel ? 'color/bg/brand' : 'color/border/strong', 2);
  if (sel) { const d = frame('Dot', 'HORIZONTAL'); rd.appendChild(d); d.resize(12, 12); d.primaryAxisSizingMode = 'FIXED'; d.counterAxisSizingMode = 'FIXED'; RAD(d, 'radius/full'); fillV(d, 'color/bg/brand'); }
  return c;
}
await step('Role option', async () => {
  const cs = []; for (const s of ['Default', 'Hover', 'Selected']) { const c = await roleOption(s); sec.appendChild(c); cs.push(c); }
  cs.forEach((c, i) => { c.x = i * 528; c.y = 0; });
  const set = figma.combineAsVariants(cs, sec); set.name = 'Role option';
  set.description = 'One card per role on the first sign-up step. Title and Sub change per role. Hover and Selected states.';
  await hoverTo(cs[0], cs[1]);
});

// ---------- Google button ----------
let GSVG = null;
await step('fetch Google mark', async () => {
  if (typeof fetch !== 'function') throw new Error('fetch not available in this sandbox');
  const res = await fetch('https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/google.svg');
  if (!res.ok) throw new Error('HTTP ' + res.status);
  GSVG = (await res.text()).replace(/<title>[\s\S]*?<\/title>/, '');
});
report.info.googleMark = GSVG ? 'Simple Icons (jsDelivr)' : 'fallback letter G';
async function gMark() {
  if (GSVG) {
    const f = figma.createNodeFromSvg(GSVG); f.name = 'Google mark'; f.fills = []; f.clipsContent = false;
    for (const v of f.findAll(n => n.type === 'VECTOR')) { v.fills = [P(V('color/icon/default'))]; v.strokes = []; v.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; created.push(v); }
    f.rescale(20 / f.width); return f;
  }
  return await txt('Google mark', 'G', 'Label/Default Strong', 'color/text/primary');
}
async function googleBtn(state) {
  const c = comp('State=' + state, 'HORIZONTAL');
  c.resize(400, 48); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'FIXED'; c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER'; GAP(c, 'spacing/sm');
  RAD(c, 'radius/full'); fillV(c, state === 'Hover' ? 'color/bg/subtle' : 'color/bg/surface'); strokeV(c, 'color/border/strong', 1);
  c.appendChild(await gMark());
  c.appendChild(await txt('Label', 'Continue with Google', 'Label/Default Strong', 'color/text/primary'));
  return c;
}
await step('Google button', async () => {
  const cs = []; for (const s of ['Default', 'Hover']) { const c = await googleBtn(s); sec.appendChild(c); cs.push(c); }
  cs.forEach((c, i) => { c.x = i * 448; c.y = 0; });
  const set = figma.combineAsVariants(cs, sec); set.name = 'Google button';
  set.description = 'Sign in or sign up with Google. Name and email come from Google; role and required fields are still asked.';
  await hoverTo(cs[0], cs[1]);
});

// ---------- Review row ----------
async function reviewRow(last) {
  const c = comp('Last=' + (last ? 'True' : 'False'), 'HORIZONTAL');
  c.resize(480, 44); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO'; c.counterAxisAlignItems = 'MIN'; GAP(c, 'spacing/md');
  c.setBoundVariable('paddingTop', V('spacing/sm')); c.setBoundVariable('paddingBottom', V('spacing/sm')); c.paddingLeft = 0; c.paddingRight = 0;
  c.strokes = [P(V('color/border/default'))]; created.push(c); c.strokeAlign = 'INSIDE';
  c.strokeTopWeight = 0; c.strokeLeftWeight = 0; c.strokeRightWeight = 0; c.strokeBottomWeight = last ? 0 : 1;
  const l = await txt('Label', 'Date of birth', 'Label/Default', 'color/text/secondary'); c.appendChild(l);
  l.textAutoResize = 'HEIGHT'; l.layoutSizingHorizontal = 'FIXED'; l.resize(160, l.height);
  const v = await txt('Value', '18.04.2005', 'Label/Default Strong', 'color/text/primary'); c.appendChild(v);
  v.layoutSizingHorizontal = 'FILL'; v.textAutoResize = 'HEIGHT';
  return c;
}
await step('Review row', async () => {
  const cs = []; for (const last of [false, true]) { const c = await reviewRow(last); sec.appendChild(c); cs.push(c); }
  cs.forEach((c, i) => { c.x = i * 528; c.y = 0; });
  const set = figma.combineAsVariants(cs, sec); set.name = 'Review row';
  set.description = 'One line of the sign-up review: label and value. Last=True drops the divider under the final row of a group.';
});

// ---------- Terms row ----------
async function termsRow(err) {
  const c = comp('State=' + (err ? 'Error' : 'Default'), 'VERTICAL');
  c.resize(400, 24); c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED'; GAP(c, 'spacing/xs');
  const cb = await checkbox(false, 'I agree to the Terms of Service and Privacy Policy'); c.appendChild(cb);
  try { cb.layoutSizingHorizontal = 'FILL'; const t0 = cb.findOne(n => n.type === 'TEXT'); t0.layoutSizingHorizontal = 'FILL'; t0.textAutoResize = 'HEIGHT'; } catch (e) { report.errors.push('Terms row width: ' + e.message); }
  const tt = cb.findOne(n => n.type === 'TEXT'); const s = tt.characters;
  for (const w of ['Terms of Service', 'Privacy Policy']) { const a = s.indexOf(w); tt.setRangeFills(a, a + w.length, [P(V('color/text/brand'))]); tt.setRangeTextDecoration(a, a + w.length, 'UNDERLINE'); }
  const em = await txt('Error message', 'You must agree to the terms and conditions', 'Label/Small', 'color/text/danger'); c.appendChild(em); em.visible = err;
  return c;
}
await step('Terms row', async () => {
  const cs = []; for (const e of [false, true]) { const c = await termsRow(e); sec.appendChild(c); cs.push(c); }
  cs.forEach((c, i) => { c.x = i * 448; c.y = 0; });
  const set = figma.combineAsVariants(cs, sec); set.name = 'Terms row';
  set.description = 'Terms and Privacy Policy checkbox on the last sign-up step. Error shows under the box when it is left unchecked.';
});

// ---------- Section metni, yerlesim, yeni Section Forms'un sagina ----------
await step('section texts', async () => {
  let titleSrc = null, descSrc = tx0[0];
  if (tx0.length > 1 && typeof tx0[0].fontSize === 'number' && typeof tx0[1].fontSize === 'number' && tx0[0].fontSize > tx0[1].fontSize) { titleSrc = tx0[0]; descSrc = tx0[1]; }
  const mk = async (src, chars, name) => { const t = src.clone(); sec.appendChild(t); await loadFonts(t); t.characters = chars; t.name = name; return t; };
  if (!descSrc) throw new Error('no text in Forms section to copy');
  if (titleSrc) await mk(titleSrc, 'Sign-up & log-in', 'Section title');
  await mk(descSrc, 'Stepper: progress through sign-up. 4 steps for Player and Manager/Official, 3 for the other roles. On mobile only the current step shows its label.', 'Note · Stepper');
  await mk(descSrc, 'Role option: one card per role on the first step. Default, Hover, Selected.', 'Note · Role option');
  await mk(descSrc, 'Google button: continue with Google on sign-up and log-in. Role and required fields are still asked after it.', 'Note · Google button');
  await mk(descSrc, 'Review row and Terms row: the last step lists what was entered, with the terms checkbox below.', 'Note · Review');
});

await step('place section', async () => {
  const kids = sec.children.slice();
  const ordered = kids.filter(n => n.type === 'TEXT').concat(kids.filter(n => n.type !== 'TEXT'));
  sec.x = 0; sec.y = 0; sec.resizeWithoutConstraints(800, 600);
  const left = sec.x + 80; let y = sec.y + 80, prevText = false, first = true;
  for (const k of ordered) {
    const b = k.absoluteBoundingBox; if (!b) continue; const isText = k.type === 'TEXT';
    if (!first) y += (isText && prevText) ? 16 : 120;
    k.x += left - b.x; k.y += y - b.y; y += b.height; prevText = isText; first = false;
  }
  let right = -Infinity, bottom = -Infinity;
  for (const k of sec.children) { const b = k.absoluteBoundingBox; if (!b) continue; right = Math.max(right, b.x + b.width); bottom = Math.max(bottom, b.y + b.height); }
  sec.resizeWithoutConstraints(Math.ceil(right - sec.x + 80), Math.ceil(bottom - sec.y + 80));
  const gapX = 160, newX = F.x + F.width + gapX, shift = sec.width + gapX;
  const rightOf = p01.children.filter(n => n !== sec && n.x >= F.x + F.width - 1);
  for (const n of rightOf) n.x += shift;
  sec.x = newX; sec.y = F.y;
  report.info.placed = '6 · Sign-up & log-in at x ' + r(newX) + ', moved ' + rightOf.length + ' items right by ' + r(shift);
});

// ---------- kontrol ----------
await step('check', async () => {
  const bad = [];
  for (const n of created) { try { for (const p of [].concat(n.fills, n.strokes)) if (p && p.type === 'SOLID' && hex(p) === '#808080') { bad.push(n.name); break; } } catch (e) {} }
  report.info.placeholderGrey = bad.length ? bad.slice(0, 10) : 'none';
  const sets = sec.children.filter(n => n.type === 'COMPONENT_SET').map(n => n.name + ' ' + n.children.length);
  report.info.sets = sets;
  const ov = []; const top = p01.children.filter(c => c.type === 'SECTION');
  for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) { const a = top[i], z = top[j]; if (a.x < z.x + z.width && z.x < a.x + a.width && a.y < z.y + z.height && z.y < a.y + a.height) ov.push(a.name + ' / ' + z.name); }
  report.info.sectionOverlaps = ov.length ? ov : 'none';
});

return report;
