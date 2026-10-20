// step 167 · Edit positions duzeltmesi: profildeki AM kodu formda CAM (DB listesi), ana mevki CAM, yan mevkiler RW + CM · 166'nin geri kalani tekrar calisir, degisiklik yapmaz

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
const ICON = { plus: 'M12 5v14M5 12h14' };
function icon(name, key, size, color) {
  const f = figma.createNodeFromSvg('<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="' + ICON[key] + '" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  f.name = name; f.fills = []; f.clipsContent = false;
  for (const v of f.findAll(n => n.type === 'VECTOR')) { v.strokes = [P(V(color))]; v.fills = []; v.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; }
  f.rescale(size / 24); return f;
}


const box = (f, desk) => {
  f.fills = [P(V('color/bg/subtle'))];
  for (const c of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) f.setBoundVariable(c, V('radius/md'));
  const p = desk ? 'spacing/lg' : 'spacing/md'; PAD(f, p, p, p, p);
};
async function actions(parent) {
  let acts = parent.children.find(c => c.name === 'Edit actions');
  if (!acts) { acts = frame('Edit actions', 'HORIZONTAL'); parent.appendChild(acts); GAP(acts, 'spacing/sm'); acts.appendChild(await button('Subtle', 'Cancel')); acts.appendChild(await button('Primary', 'Save')); }
  acts.layoutSizingHorizontal = 'FILL'; acts.primaryAxisAlignItems = 'MAX'; acts.counterAxisAlignItems = 'CENTER';
  const cancel = acts.children.find(c => c.name === 'Button · Cancel'); if (cancel && acts.children.indexOf(cancel) !== 0) acts.insertChild(0, cancel);
  return acts;
}

// ---------- A: Edit details formu gri kutuda ----------
const outA = [];
for (const D of ['Desktop', 'Mobile']) {
  await step('details box · ' + D, async () => {
    const desk = D === 'Desktop';
    const f = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player / Own profile / Edit details · ' + D);
    if (!f) throw new Error('Edit details page missing');
    const form = f.findOne(n => n.name === 'Details form');
    box(form, desk);
    await actions(form);
    const hero = f.findOne(n => n.name === 'Hero · player identity');
    if (desk) {
      const pad = 24, colW = Math.floor((form.width - 2 * pad - 16) / 2);
      for (const ff of form.findAll(n => n.type === 'INSTANCE' && /^Field · /.test(n.name))) ff.resize(colW, ff.height);
      const photo = hero.children.find(c => /^Player photo/.test(c.name)); if (photo) photo.y = hero.height - photo.height;
      outA.push(D + ' · form ' + r(form.width) + 'x' + r(form.height) + ' · field ' + colW + ' · hero ' + r(hero.height) + ' · photo base ' + (photo ? r(photo.y + photo.height) : '-'));
    } else outA.push(D + ' · form ' + r(form.width) + 'x' + r(form.height) + ' · hero ' + r(hero.height));
  });
}
report.info.details = outA;

// ---------- B: Edit positions ----------
const NAMES = { GK: 'Goalkeeper', RB: 'Right-Back', LB: 'Left-Back', CB: 'Centre-Back', FB: 'Full-back', CDM: 'Defensive Midfield', CM: 'Central Midfield', CAM: 'Attacking Midfield', RM: 'Right Midfield', LM: 'Left Midfield', RW: 'Right Winger', LW: 'Left Winger', W: 'Winger', ST: 'Centre-Forward', SS: 'Second Forward' };
const out = [];
for (const D of ['Desktop', 'Mobile']) {
  await step('edit positions · ' + D, async () => {
    const desk = D === 'Desktop';
    const own = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player / Own profile · ' + D);
    const sub = own.parent;
    const NAME = 'Profiles / Player / Own profile / Edit positions · ' + D;
    for (const n of sub.children.filter(c => c.name === NAME || c.name === 'Flow · Edit positions · ' + D)) n.remove();
    let right = 0; for (const k of sub.children) if (k.y < own.y + own.height && k.y + k.height > own.y) right = Math.max(right, k.x + k.width);
    const f = own.clone(); sub.appendChild(f);
    f.name = NAME; f.x = right + (desk ? 480 : 360); f.y = own.y;
    for (const n of f.findAll(n => n.reactions && n.reactions.length)) await n.setReactionsAsync([]);

    const card = f.findOne(n => n.type === 'FRAME' && n.name === 'Positions');
    if (!card) throw new Error('Positions card not found');
    const hdr = card.findOne(n => n.name === 'Card header');
    const hEdit = hdr && hdr.children.find(c => c.name === 'Edit'); if (hEdit) hEdit.visible = false;
    const labels = card.findOne(n => n.name === 'Position labels');
    const found = labels ? labels.findAll(n => n.type === 'TEXT').map(t => t.characters.trim()) : [];
    report.info['labels_' + D] = found;
    if (labels) labels.visible = false;
    const ALIAS = { AM: 'CAM' }; const codes = found.map(t => ALIAS[t] || t).filter(t => NAMES[t]);
    const main = codes[0] || 'CAM', sec = codes.length > 1 ? codes.slice(1) : ['CM', 'RW'];

    const form = frame('Positions form', 'VERTICAL'); card.appendChild(form);
    GAP(form, 'spacing/md'); box(form, false); form.layoutSizingHorizontal = 'FILL';
    const fm = await field('Select', 'Filled', 'Main position', main + ' · ' + NAMES[main]); form.appendChild(fm); fm.layoutSizingHorizontal = 'FILL';
    const fs = await field('Multi-chip', 'Filled', 'Secondary positions', undefined, sec); form.appendChild(fs); fs.layoutSizingHorizontal = 'FILL';
    const hint = await txt('Hint', `The pitch above shows your choice.`, 'Label/Small', 'color/text/secondary');
    form.appendChild(hint); hint.layoutSizingHorizontal = 'FILL'; hint.textAutoResize = 'HEIGHT';
    await actions(form);

    // prototip
    const ownCard = own.findOne(n => n.type === 'FRAME' && n.name === 'Positions');
    const ownEdit = ownCard.findOne(n => n.name === 'Card header').children.find(c => c.name === 'Edit');
    await ownEdit.setReactionsAsync([nav(f)]);
    for (const b of form.findAll(n => /^Button · (Save|Cancel)$/.test(n.name))) await b.setReactionsAsync([nav(own)]);

    // ok: masaustu soldan (sol sutun), mobil sagdan
    const sb = sub.absoluteBoundingBox, bb = ownEdit.absoluteBoundingBox;
    const bx = figma.createRectangle(); sub.appendChild(bx);
    bx.name = 'Clicked'; bx.x = bb.x - sb.x - 4; bx.y = bb.y - sb.y - 4; bx.resize(bb.width + 8, bb.height + 8);
    bx.fills = []; bx.strokes = [{ type: 'SOLID', color: BLUE }]; bx.strokeWeight = 3; bx.cornerRadius = 26;
    const by = bx.y + bx.height / 2, topY = own.y - 320, tx = f.x + f.width / 2;
    const sx = desk ? bx.x : bx.x + bx.width, vx = desk ? own.x - 96 : own.x + own.width + 100;
    const pts = [[sx, by], [vx, by], [vx, topY], [tx, topY], [tx, f.y]];
    const { lab } = await elbow(sub, pts, 'Click Edit on Positions · the card turns into its form', 'Flow · Edit positions · ' + D, [bx]);
    lab.x = f.x - lab.width - 24; lab.y = topY - lab.height - 8;

    let rr = 0, bb2 = 0; for (const k of sub.children) { rr = Math.max(rr, k.x + k.width); bb2 = Math.max(bb2, k.y + k.height); }
    sub.resizeWithoutConstraints(Math.max(sub.width, Math.ceil(rr + 80)), Math.max(sub.height, Math.ceil(bb2 + 80)));
    const shown = fs.findAll(n => n.name === 'Chip' && n.visible).length;
    out.push(D + ' · at ' + r(f.x) + ' · card ' + r(card.width) + 'x' + r(card.height) + ' · main ' + main + ' · chips ' + shown + '/' + sec.length + ' · field ' + r(fm.width));
  });
}
report.info.pages = out;

// ---------- akis baslangiclari: kopyalardan gelenler silinir ----------
await step('flow starts', async () => {
  const keep = [];
  for (const s of (p02.flowStartingPoints || [])) {
    const n = await figma.getNodeByIdAsync(s.nodeId);
    if (!n || /\/ Edit (details|career|positions) ·/.test(n.name)) continue;
    if (keep.some(k => k.name === s.name)) continue;
    keep.push({ nodeId: s.nodeId, name: s.name });
  }
  p02.flowStartingPoints = keep;
  report.info.flowStarts = keep.length;
});

await step('check', async () => {
  const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web'), mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
  for (const s of [web, mob]) { let right = 0, bottom = 0; for (const k of s.children) { right = Math.max(right, k.x + k.width); bottom = Math.max(bottom, k.y + k.height); }
    if (bottom + 80 > s.height) s.resizeWithoutConstraints(s.width, Math.ceil(bottom + 80));
    if (right + 80 > s.width) report.info['wide_' + s.name] = 'content reaches ' + r(right) + ' of ' + r(s.width); }
  const ov = [];
  const top = p02.children.filter(c => c.type === 'SECTION');
  for (const s of [web, mob]) { const k = s.children.filter(c => c.type === 'SECTION');
    for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) { const a = k[i], z = k[j];
      if (a.x < z.x + z.width && z.x < a.x + a.width && a.y < z.y + z.height && z.y < a.y + a.height) ov.push(a.name + ' / ' + z.name); } }
  for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) { const a = top[i], z = top[j];
    if (a.x < z.x + z.width && z.x < a.x + a.width && a.y < z.y + z.height && z.y < a.y + a.height) ov.push(a.name + ' / ' + z.name); }
  report.info.sectionOverlaps = ov.length ? ov : 'none';
  let total = 0, broken = 0;
  for (const n of p02.findAll(n => n.reactions && n.reactions.length)) for (const rr of n.reactions) for (const a of (rr.actions || [])) {
    if (!a.destinationId) continue; total++; if (!(await figma.getNodeByIdAsync(a.destinationId))) broken++;
  }
  report.info.prototype = total + ' links, ' + broken + ' broken';
});

return report;
