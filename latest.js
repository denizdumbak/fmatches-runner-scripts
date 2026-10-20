// step 165 · Own profile / Edit career (Desktop + Mobile): Career karti yerinde form · ilk satir (Riverside FC) acik form: kulup, takim, katilis, sozlesme bitisi, Still at this club, On loan, Remove · diger satirlarda Edit · Add club · ok ve prototip

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

async function rowForm(desk, width) {
  const form = frame('Career row form', 'VERTICAL');
  GAP(form, 'spacing/md');
  form.fills = [P(V('color/bg/subtle'))]; for (const c of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) form.setBoundVariable(c, V('radius/md'));
  PAD(form, desk ? 'spacing/lg' : 'spacing/md', desk ? 'spacing/lg' : 'spacing/md', desk ? 'spacing/lg' : 'spacing/md', desk ? 'spacing/lg' : 'spacing/md');
  const grid = frame('Fields', desk ? 'HORIZONTAL' : 'VERTICAL'); form.appendChild(grid);
  if (desk) { grid.layoutWrap = 'WRAP'; grid.setBoundVariable('counterAxisSpacing', V('spacing/md')); }
  GAP(grid, 'spacing/md'); grid.layoutSizingHorizontal = 'FILL';
  const F = [['Select', 'Club', 'Riverside FC'], ['Select', 'Team', 'Senior'], ['Date', 'Joined', '01.07.2024'], ['Date', 'Contract until', '30.06.2027']];
  for (const d of F) { const f = await field(d[0], 'Filled', d[1], d[2]); grid.appendChild(f); f.layoutSizingHorizontal = desk ? 'FIXED' : 'FILL'; }
  const ck = frame('Checks', desk ? 'HORIZONTAL' : 'VERTICAL'); form.appendChild(ck);
  GAP(ck, 'spacing/lg');
  ck.appendChild(await checkbox(true, 'Still at this club'));
  ck.appendChild(await checkbox(false, 'On loan'));
  const hint = await txt('Hint', `While you are still at the club, the second date is your contract end and shows as "Contract until" on your profile. Untick it to enter the date you left.`, 'Label/Small', 'color/text/secondary');
  form.appendChild(hint); hint.layoutSizingHorizontal = 'FILL'; hint.textAutoResize = 'HEIGHT';
  const acts = frame('Edit actions', 'HORIZONTAL'); form.appendChild(acts);
  acts.layoutSizingHorizontal = 'FILL'; acts.primaryAxisAlignItems = 'SPACE_BETWEEN'; acts.counterAxisAlignItems = 'CENTER';
  acts.appendChild(await txt('Remove', `Remove this club`, 'Label/Default Strong', 'color/text/danger'));
  const bs = frame('Buttons', 'HORIZONTAL'); acts.appendChild(bs); GAP(bs, 'spacing/sm');
  bs.appendChild(await button('Subtle', 'Cancel'));
  bs.appendChild(await button('Primary', 'Save'));
  return form;
}

const out = [];
for (const D of ['Desktop', 'Mobile']) {
  await step('edit career · ' + D, async () => {
    const desk = D === 'Desktop';
    const own = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player / Own profile · ' + D);
    const sub = own.parent;
    const NAME = 'Profiles / Player / Own profile / Edit career · ' + D;
    for (const n of sub.children.filter(c => c.name === NAME || c.name === 'Flow · Edit career · ' + D)) n.remove();
    let right = 0; for (const k of sub.children) if (k.y < own.y + own.height && k.y + k.height > own.y) right = Math.max(right, k.x + k.width);
    const f = own.clone(); sub.appendChild(f);
    f.name = NAME; f.x = right + (desk ? 480 : 360); f.y = own.y;
    for (const n of f.findAll(n => n.reactions && n.reactions.length)) await n.setReactionsAsync([]);

    const entries = f.findOne(n => n.name === 'Club entries');
    if (!entries) throw new Error('Club entries not found');
    const card = entries.parent;
    const hdr = card.findOne(n => n.name === 'Card header');
    const hEdit = hdr && hdr.children.find(c => c.name === 'Edit'); if (hEdit) hEdit.visible = false;
    const list = entries.children.slice();
    const form = await rowForm(desk);
    entries.insertChild(0, form); form.layoutSizingHorizontal = 'FILL';
    if (desk) { const colW = Math.floor((form.width - 48 - 16) / 2); for (const ff of form.findAll(n => n.type === 'INSTANCE' && /^Field · /.test(n.name))) ff.resize(colW, ff.height); }
    list[0].remove();
    for (const e of list.slice(1)) {
      const w = frame('Row · ' + e.name, 'HORIZONTAL');
      entries.insertChild(entries.children.indexOf(e), w);
      w.counterAxisAlignItems = 'MIN'; GAP(w, 'spacing/sm'); w.layoutSizingHorizontal = 'FILL';
      w.appendChild(e); e.layoutSizingHorizontal = 'FILL';
      const eb = editBtn(); w.appendChild(eb);
    }
    entries.itemSpacing = 16;
    const add = frame('Add club', 'HORIZONTAL'); card.appendChild(add);
    GAP(add, 'spacing/xs'); add.counterAxisAlignItems = 'CENTER'; add.paddingTop = 8; add.paddingBottom = 8;
    add.appendChild(icon('Icon · Add', 'plus', 16, 'color/icon/brand'));
    add.appendChild(await txt('Label', `Add club`, 'Label/Default Strong', 'color/text/brand'));

    // prototip
    const ownCareer = own.findOne(n => n.name === 'Club entries').parent;
    const ownEdit = ownCareer.findOne(n => n.name === 'Card header').children.find(c => c.name === 'Edit');
    await ownEdit.setReactionsAsync([nav(f)]);
    for (const b of form.findAll(n => /^Button · (Save|Cancel)$/.test(n.name))) await b.setReactionsAsync([nav(own)]);

    // ok: Edit butonunun sagindan, iki sayfa arasindaki bosluga, yukari, hedefin ustune
    const sb = sub.absoluteBoundingBox, bb = ownEdit.absoluteBoundingBox;
    const box = figma.createRectangle(); sub.appendChild(box);
    box.name = 'Clicked'; box.x = bb.x - sb.x - 4; box.y = bb.y - sb.y - 4; box.resize(bb.width + 8, bb.height + 8);
    box.fills = []; box.strokes = [{ type: 'SOLID', color: BLUE }]; box.strokeWeight = 3; box.cornerRadius = 26;
    const by = box.y + box.height / 2, gx = own.x + own.width + (desk ? 240 : 180), topY = own.y - 260, tx = f.x + f.width / 2;
    const pts = [[box.x + box.width, by], [gx, by], [gx, topY], [tx, topY], [tx, f.y]];
    const { lab } = await elbow(sub, pts, 'Click Edit on Career · the card turns into its form', 'Flow · Edit career · ' + D, [box]);
    lab.x = f.x - lab.width - 24 > gx ? f.x - lab.width - 24 : gx + 24; lab.y = topY - lab.height - 8;

    let rr = 0, bb2 = 0; for (const k of sub.children) { rr = Math.max(rr, k.x + k.width); bb2 = Math.max(bb2, k.y + k.height); }
    sub.resizeWithoutConstraints(Math.max(sub.width, Math.ceil(rr + 80)), Math.max(sub.height, Math.ceil(bb2 + 80)));
    out.push(D + ' · at ' + r(f.x) + ' · ' + r(f.width) + 'x' + r(f.height) + ' · card ' + r(card.width) + 'x' + r(card.height) + ' · rows with Edit ' + (list.length - 1));
  });
}
report.info.pages = out;

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
