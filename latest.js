// step 164 · Own profile / Edit details (hero formu, Desktop + Mobile): Personal + Football, Cancel · Save · Edit details → form oku ve prototip · kural notu profilin altina · akis baslangiclari tekillesir, Own profile eklenir

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

const DATA = {
  personal: [['Date', 'Date of birth', '18.04.2005'], ['Multi-chip', 'Nationality', null, ['England', 'Ireland']], ['Select', 'Country of birth', 'England'], ['Select', 'City of birth', 'Reading'], ['Text', 'Name in home country', 'Leo James Marsh'], ['Select', 'Gender', 'Male']],
  football: [['Select', 'Current club', 'Riverside FC'], ['Select', 'Strong foot', 'Right'], ['Text', 'Height (cm)', '178'], ['Text', 'Weight (kg)', '74']]
};

async function buildForm(desk) {
  const form = frame('Details form', 'VERTICAL');
  GAP(form, 'spacing/xl');
  for (const [key, title] of [['personal', 'Personal'], ['football', 'Football']]) {
    const grp = frame('Group · ' + title, 'VERTICAL'); form.appendChild(grp);
    GAP(grp, 'spacing/md'); grp.layoutSizingHorizontal = 'FILL';
    grp.appendChild(await txt('Group title', title, 'Heading/H4', 'color/text/primary'));
    const grid = frame('Fields', 'HORIZONTAL'); grp.appendChild(grid);
    grid.layoutWrap = desk ? 'WRAP' : 'NO_WRAP';
    if (!desk) grid.layoutMode = 'VERTICAL';
    GAP(grid, 'spacing/md'); if (desk) grid.setBoundVariable('counterAxisSpacing', V('spacing/md'));
    grid.layoutSizingHorizontal = 'FILL';
    for (const d of DATA[key]) {
      const f = await field(d[0], 'Filled', d[1], d[2], d[3]); grid.appendChild(f);
      if (desk) { f.layoutSizingHorizontal = 'FIXED'; } else f.layoutSizingHorizontal = 'FILL';
    }
  }
  const note = await txt('Name note', `Your name comes from sign-up and is used to match you to scouting records. To change it, contact support.`, 'Label/Small', 'color/text/secondary');
  form.appendChild(note); note.layoutSizingHorizontal = 'FILL'; note.textAutoResize = 'HEIGHT';
  const acts = frame('Edit actions', 'HORIZONTAL'); form.appendChild(acts);
  GAP(acts, 'spacing/sm'); acts.counterAxisAlignItems = 'CENTER';
  if (desk) acts.primaryAxisAlignItems = 'MIN'; else { acts.layoutSizingHorizontal = 'FILL'; acts.primaryAxisAlignItems = 'MAX'; }
  acts.appendChild(await button('Primary', 'Save'));
  acts.appendChild(await button('Subtle', 'Cancel'));
  return form;
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

const out = [];
const PAGES = {};
for (const D of ['Desktop', 'Mobile']) {
  await step('edit details · ' + D, async () => {
    const desk = D === 'Desktop';
    const own = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player / Own profile · ' + D);
    if (!own) throw new Error('Own profile page missing');
    const sub = own.parent;
    const NAME = 'Profiles / Player / Own profile / Edit details · ' + D;
    for (const n of sub.children.filter(c => c.name === NAME || c.name === 'Flow · Edit details · ' + D)) n.remove();
    // kural notu profilin altina
    const note = sub.children.find(c => c.name === 'Note · Own profile · ' + D);
    if (note) { note.x = own.x; note.y = own.y + own.height + 80; }
    const f = own.clone(); sub.appendChild(f);
    f.name = NAME; f.x = own.x + own.width + (desk ? 480 : 360); f.y = own.y;
    for (const n of f.findAll(n => n.reactions && n.reactions.length)) await n.setReactionsAsync([]);

    const hero = f.findOne(n => n.name === 'Hero · player identity');
    const form = await buildForm(desk);
    if (desk) {
      const idt = hero.findOne(n => n.name === 'Identity');
      for (const nm of ['Key facts', 'Profile actions']) { const k = idt.children.find(c => c.name === nm); if (k) k.remove(); }
      for (const k of idt.children.filter(c => c.type === 'INSTANCE' && /Club strip/.test(c.name))) k.remove();
      idt.appendChild(form); form.layoutSizingHorizontal = 'FILL';
      if (hero.layoutMode === 'HORIZONTAL') hero.counterAxisSizingMode = 'AUTO';
      const colW = Math.floor((form.width - 16) / 2);
      for (const ff of form.findAll(n => n.type === 'INSTANCE' && /^Field · /.test(n.name))) ff.resize(colW, ff.height);
      const photo = hero.children.find(c => /^Player photo/.test(c.name));
      if (photo) photo.y = hero.height - photo.height;
    } else {
      const blk = hero.findOne(n => n.name === 'Identity block');
      const kf = blk && blk.children.find(c => c.name === 'Key facts'); if (kf) kf.remove();
      for (const k of hero.children.filter(c => (c.type === 'INSTANCE' && /Club strip/.test(c.name)) || c.name === 'Profile actions')) k.remove();
      hero.appendChild(form); form.layoutSizingHorizontal = 'FILL';
    }
    // prototip: Edit details → form, Save / Cancel → profil
    const ed = own.findOne(n => n.name === 'Edit details');
    if (ed) await ed.setReactionsAsync([nav(f)]);
    for (const b of form.findAll(n => /^Button · (Save|Cancel)$/.test(n.name))) await b.setReactionsAsync([nav(own)]);

    // ok: butonun solundan disari, yukari, hedefin ustune
    const sb = sub.absoluteBoundingBox, bb = ed.absoluteBoundingBox;
    const box = figma.createRectangle(); sub.appendChild(box);
    box.name = 'Clicked'; box.x = bb.x - sb.x - 4; box.y = bb.y - sb.y - 4; box.resize(bb.width + 8, bb.height + 8);
    box.fills = []; box.strokes = [{ type: 'SOLID', color: BLUE }]; box.strokeWeight = 3; box.cornerRadius = 26;
    const by = box.y + box.height / 2, lx = own.x - 48, topY = own.y - 200, tx = f.x + f.width / 2;
    const pts = [[box.x, by], [lx, by], [lx, topY], [tx, topY], [tx, f.y]];
    const { g, lab } = await elbow(sub, pts, 'Click Edit details · the hero turns into its form', 'Flow · Edit details · ' + D, [box]);
    lab.x = own.x + own.width + 24; lab.y = topY - lab.height - 8;

    let right = 0, bottom = 0; for (const k of sub.children) { right = Math.max(right, k.x + k.width); bottom = Math.max(bottom, k.y + k.height); }
    sub.resizeWithoutConstraints(Math.max(sub.width, Math.ceil(right + 80)), Math.max(sub.height, Math.ceil(bottom + 80)));
    PAGES[D] = { own, f };
    out.push(D + ' · ' + r(f.width) + 'x' + r(f.height) + ' · fields ' + form.findAll(n => n.type === 'INSTANCE' && /^Field · /.test(n.name)).length + ' · hero ' + r(hero.height));
  });
}
report.info.pages = out;

// ---------- akis baslangiclari ----------
await step('flow starts', async () => {
  const want = [];
  const add = (frameName, label) => { const n = p02.findOne(x => x.type === 'FRAME' && x.name === frameName); if (n) want.push({ nodeId: n.id, name: label }); };
  const keep = [];
  for (const s of (p02.flowStartingPoints || [])) {
    const n = await figma.getNodeByIdAsync(s.nodeId);
    if (!n) continue;
    if (/Player profile/.test(s.name) && !/^Profiles \/ Player · (Desktop|Mobile)$/.test(n.name)) continue;
    if (/Own profile|Profile edit/.test(s.name)) continue;
    if (keep.some(k => k.name === s.name)) continue;
    keep.push({ nodeId: s.nodeId, name: s.name });
  }
  add('Profiles / Player / Own profile · Desktop', 'Web · Own profile');
  add('Profiles / Player / Own profile · Mobile', 'Mobile · Own profile');
  p02.flowStartingPoints = keep.concat(want);
  report.info.flowStarts = p02.flowStartingPoints.map(s => s.name);
});

// ---------- kontrol ----------
await step('check', async () => {
  const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web'), mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
  for (const s of [web, mob]) { let right = 0, bottom = 0; for (const k of s.children) { right = Math.max(right, k.x + k.width); bottom = Math.max(bottom, k.y + k.height); }
    if (bottom + 80 > s.height) s.resizeWithoutConstraints(s.width, Math.ceil(bottom + 80));
    if (right + 80 > s.width) report.info['wide_' + s.name] = 'content reaches ' + r(right) + ' of ' + r(s.width); }
  const ov = [];
  for (const s of [web, mob]) { const k = s.children.filter(c => c.type === 'SECTION');
    for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) { const a = k[i], z = k[j];
      if (a.x < z.x + z.width && z.x < a.x + a.width && a.y < z.y + z.height && z.y < a.y + a.height) ov.push(a.name + ' / ' + z.name); } }
  const top = p02.children.filter(c => c.type === 'SECTION');
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
