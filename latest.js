// step 160 · profil duzenleme parcalari (01 › 3 · Player profile): Edit button (Default / Hover) · Empty card (Desktop / Mobile, davet) · Edit bar (Desktop / Mobile, koyu) · "Profile card · edit states" panosu (Links karti: Default, Editing, Empty)

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
const PAD = (n, t, rr, b, l) => { n.setBoundVariable('paddingTop', V(t)); n.setBoundVariable('paddingRight', V(rr)); n.setBoundVariable('paddingBottom', V(b)); n.setBoundVariable('paddingLeft', V(l)); };
const GAP = (n, v) => n.setBoundVariable('itemSpacing', V(v));
const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
for (const k of ['Label/Default', 'Label/Default Strong', 'Label/Small', 'Body/Small', 'Body/Default', 'Heading/H3']) { if (!TS[k]) throw new Error('text style missing: ' + k); await figma.loadFontAsync(TS[k].fontName); }
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }
async function txt(name, chars, style, color) {
  const t = figma.createText(); t.name = name;
  await t.setTextStyleIdAsync(TS[style].id); t.characters = chars; t.fills = [P(V(color))];
  return t;
}
const ICON = {
  pen: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  link: 'M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5',
  x: 'M17 7L7 17M7 7l10 10',
  plus: 'M12 5v14M5 12h14'
};
function icon(name, key, size, color) {
  const f = figma.createNodeFromSvg('<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="' + ICON[key] + '" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  f.name = name; f.fills = []; f.clipsContent = false;
  for (const v of f.findAll(n => n.type === 'VECTOR')) { v.strokes = [P(V(color))]; v.fills = []; v.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; }
  f.rescale(size / 24);
  return f;
}
function frame(name, mode) { const f = figma.createFrame(); f.name = name; f.fills = []; f.clipsContent = false; if (mode) { f.layoutMode = mode; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; f.itemSpacing = 0; } return f; }
function rx(trigger, dest) {
  return { trigger: { type: trigger }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'CHANGE_TO', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.15 }, preserveScrollPosition: false, resetVideoPosition: false }] };
}
const effects = {}; for (const s of await figma.getLocalEffectStylesAsync()) effects[s.name] = s;

const sec3 = p01.children.find(n => n.type === 'SECTION' && /^3 · /.test(n.name));
const setOf = name => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === name);
const btnSet = setOf('Button');
const fieldSet = setOf('Form field');
if (!btnSet || !fieldSet) throw new Error('Button or Form field set missing');
const keyOf = (set, re) => Object.keys(set.componentPropertyDefinitions).find(k => re.test(k));
const BTN_LABEL = keyOf(btnSet, /^Label#/), BTN_ICON = keyOf(btnSet, /^Icon#/);
function button(style, label) {
  const v = btnSet.children.find(c => c.variantProperties.Style === style && c.variantProperties.State === 'Default');
  if (!v) throw new Error('Button variant missing: ' + style);
  const i = v.createInstance();
  const props = {}; props[BTN_LABEL] = label; if (BTN_ICON) props[BTN_ICON] = false;
  i.setProperties(props);
  i.name = 'Button · ' + label;
  return i;
}
function field(type, state, label, value) {
  const v = fieldSet.children.find(c => c.variantProperties.Type === type && c.variantProperties.State === state);
  const i = v.createInstance();
  i.findOne(n => n.type === 'TEXT' && n.name === 'Label').characters = label;
  if (value !== undefined) i.findOne(n => n.type === 'TEXT' && n.name === 'Value').characters = value;
  i.name = 'Field · ' + label;
  return i;
}

// ---------- 0. temizlik ----------
await step('cleanup', async () => {
  for (const name of ['Edit button', 'Empty card', 'Edit bar', 'Profile card · edit states']) for (const n of sec3.children.filter(c => c.name === name)) n.remove();
});

// ---------- 1. Edit button ----------
let editSet;
await step('edit button', async () => {
  const comps = [];
  for (const state of ['Default', 'Hover']) {
    const c = figma.createComponent(); p01.appendChild(c);
    c.name = 'State=' + state;
    c.layoutMode = 'HORIZONTAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED';
    c.resize(80, 44); c.primaryAxisSizingMode = 'AUTO';
    c.counterAxisAlignItems = 'CENTER'; GAP(c, 'spacing/2xs');
    PAD(c, 'spacing/2xs', 'spacing/sm', 'spacing/2xs', 'spacing/sm');
    R(c, V('radius/full'));
    c.fills = state === 'Hover' ? [P(V('color/bg/brand-subtle'))] : [];
    c.appendChild(icon('Icon · Edit', 'pen', 16, 'color/icon/brand'));
    c.appendChild(await txt('Label', `Edit`, 'Label/Default Strong', 'color/text/brand'));
    comps.push(c);
  }
  editSet = figma.combineAsVariants(comps, sec3);
  editSet.name = 'Edit button';
  let x = 24; for (const v of editSet.children) { v.x = x; v.y = 24; x += v.width + 40; }
  editSet.resizeWithoutConstraints(x - 40 + 24, 44 + 48);
  await editSet.children.find(v => v.name === 'State=Default').setReactionsAsync([rx('ON_HOVER', editSet.children.find(v => v.name === 'State=Hover'))]);
  editSet.description = `Top right of every card in edit mode (hero blocks too), on the same line as the card heading. Always visible, also on mobile: the current site shows the pencil only on hover, which touch screens never get. Click: the card turns into its form in place; while a card is being edited its Edit button is hidden and Save / Cancel sit at the bottom of the card. One card is edited at a time. 44 px high for touch.`;
});

// ---------- 2. Empty card ----------
let emptySet;
await step('empty card', async () => {
  const comps = [];
  for (const D of ['Desktop', 'Mobile']) {
    const desk = D === 'Desktop';
    const c = figma.createComponent(); p01.appendChild(c);
    c.name = 'Device=' + D;
    c.layoutMode = 'VERTICAL'; c.counterAxisSizingMode = 'FIXED'; c.resize(desk ? 416 : 358, 100); c.primaryAxisSizingMode = 'AUTO';
    const pad = desk ? 'spacing/xl' : 'spacing/lg';
    PAD(c, pad, pad, pad, pad); GAP(c, 'spacing/md');
    R(c, V('radius/lg'));
    c.fills = [];
    c.strokes = [P(V('color/border/strong'))]; c.strokeWeight = 1.5; c.strokeAlign = 'INSIDE'; c.dashPattern = [6, 6];
    const head = await txt('Section heading', `Links`, 'Heading/H3', 'color/text/primary');
    c.appendChild(head);
    const inv = frame('Invite', 'HORIZONTAL'); c.appendChild(inv);
    GAP(inv, 'spacing/md'); inv.counterAxisAlignItems = 'MIN';
    inv.layoutSizingHorizontal = 'FILL';
    const box = frame('Icon box', 'HORIZONTAL'); inv.appendChild(box);
    box.primaryAxisSizingMode = 'FIXED'; box.counterAxisSizingMode = 'FIXED'; box.resize(40, 40);
    box.primaryAxisAlignItems = 'CENTER'; box.counterAxisAlignItems = 'CENTER';
    R(box, V('radius/md')); box.fills = [P(V('color/bg/subtle'))];
    box.appendChild(icon('Icon', 'link', 20, 'color/icon/default'));
    const t = frame('Text', 'VERTICAL'); inv.appendChild(t);
    GAP(t, 'spacing/2xs'); t.layoutSizingHorizontal = 'FILL';
    t.appendChild(await txt('Title', `Add your links`, 'Label/Default Strong', 'color/text/primary'));
    const body = await txt('Body', `Highlight videos, a Transfermarkt page or your social profiles. Scouts open these first.`, 'Body/Small', 'color/text/secondary');
    t.appendChild(body); body.layoutSizingHorizontal = 'FILL'; body.textAutoResize = 'HEIGHT';
    const b = button('Secondary', 'Add link'); c.appendChild(b);
    comps.push(c);
  }
  emptySet = figma.combineAsVariants(comps, sec3);
  emptySet.name = 'Empty card';
  let x = 24; for (const v of emptySet.children) { v.x = x; v.y = 24; x += v.width + 40; }
  emptySet.resizeWithoutConstraints(x - 40 + 24, Math.max(...emptySet.children.map(v => v.height)) + 48);
  emptySet.description = `Edit mode only: a card with no data is not hidden (as it is on the public profile) but shows this invitation, so the owner sees what is missing. Dashed border, no shadow, so it never looks like real content. Per card: heading, title, one line on why it matters, one button that opens the card's form. Texts: Links "Add your links" / Add link · About "Tell scouts about yourself" / Write about you · Gallery "Add photos" / Add photos · Career "Add your first club" / Add club · Positions "Add your positions" / Add positions. Desktop width follows the column (FILL), mobile 358.`;
});

// ---------- 3. Edit bar ----------
let barSet;
await step('edit bar', async () => {
  const comps = [];
  for (const D of ['Desktop', 'Mobile']) {
    const desk = D === 'Desktop';
    const c = figma.createComponent(); p01.appendChild(c);
    c.name = 'Device=' + D;
    c.layoutMode = 'HORIZONTAL'; c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'FIXED';
    c.resize(desk ? 1440 : 390, 64);
    c.primaryAxisAlignItems = 'SPACE_BETWEEN'; c.counterAxisAlignItems = 'CENTER';
    if (desk) { c.paddingLeft = 80; c.paddingRight = 80; } else PAD(c, 'spacing/xs', 'spacing/md', 'spacing/xs', 'spacing/md');
    c.fills = [P(V('color/bg/inverse'))];
    const st = frame('Status', 'HORIZONTAL'); c.appendChild(st);
    GAP(st, 'spacing/sm'); st.counterAxisAlignItems = 'CENTER';
    st.appendChild(icon('Icon · Edit', 'pen', 20, 'color/icon/inverse'));
    st.appendChild(await txt('Title', `Editing your profile`, 'Label/Default Strong', 'color/text/inverse'));
    if (desk) st.appendChild(await txt('Hint', `Changes are saved card by card.`, 'Label/Default', 'color/text/inverse-secondary'));
    const ac = frame('Actions', 'HORIZONTAL'); c.appendChild(ac);
    GAP(ac, 'spacing/sm'); ac.counterAxisAlignItems = 'CENTER';
    const view = frame('View as others', 'HORIZONTAL'); ac.appendChild(view);
    view.counterAxisSizingMode = 'FIXED'; view.resize(desk ? 160 : 44, 44); view.counterAxisSizingMode = 'FIXED';
    view.primaryAxisSizingMode = desk ? 'AUTO' : 'FIXED';
    view.primaryAxisAlignItems = 'CENTER'; view.counterAxisAlignItems = 'CENTER';
    GAP(view, 'spacing/xs');
    if (desk) { view.paddingLeft = 16; view.paddingRight = 20; }
    R(view, V('radius/full'));
    view.strokes = [P(V('color/border/inverse'))]; view.strokeWeight = 1; view.strokeAlign = 'INSIDE';
    view.appendChild(icon('Icon · View', 'eye', 20, 'color/icon/inverse'));
    if (desk) view.appendChild(await txt('Label', `View as others`, 'Label/Default Strong', 'color/text/inverse'));
    ac.appendChild(button('Primary', 'Done'));
    comps.push(c);
  }
  barSet = figma.combineAsVariants(comps, sec3);
  barSet.name = 'Edit bar';
  let y = 24; for (const v of barSet.children) { v.x = 24; v.y = y; y += v.height + 40; }
  barSet.resizeWithoutConstraints(1440 + 48, y - 40 + 24);
  barSet.description = `Edit mode only, directly under the header, sticks to the top while the page scrolls. Dark (system layer, like the ticker and footer) so edit mode is obvious at a glance: the rest of the page looks like the public profile. View as others: the public profile as visitors see it (empty cards hidden), with the bar still on top to come back. Done: leaves edit mode; blocked while a card has unsaved changes (that card asks to save or discard). Mobile: View as others is the eye icon only.`;
});

// ---------- 4. Pano: Links karti Default / Editing / Empty ----------
await step('edit states board', async () => {
  const leo = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player · Desktop');
  const list = leo && leo.findOne(n => n.name === 'Link list');
  if (!list) throw new Error('Leo Links card not found');
  const src = list.parent;

  const board = frame('Profile card · edit states', 'VERTICAL'); sec3.appendChild(board);
  board.fills = [P(V('color/bg/subtle'))]; R(board, V('radius/lg'));
  PAD(board, 'spacing/xl', 'spacing/xl', 'spacing/xl', 'spacing/xl'); GAP(board, 'spacing/2xl');
  board.appendChild(await txt('Board title', `Profile card · edit states`, 'Heading/H3', 'color/text/primary'));

  async function row(cond, who) {
    const rw = frame('Row · ' + cond, 'HORIZONTAL'); board.appendChild(rw);
    GAP(rw, 'spacing/xl'); rw.counterAxisAlignItems = 'MIN';
    const lab = frame('Condition', 'VERTICAL'); rw.appendChild(lab);
    lab.counterAxisSizingMode = 'FIXED'; lab.resize(240, 40); lab.primaryAxisSizingMode = 'AUTO';
    GAP(lab, 'spacing/2xs');
    lab.appendChild(await txt('Rule', cond, 'Label/Default Strong', 'color/text/primary'));
    const w = await txt('Who', who, 'Label/Small', 'color/text/secondary'); lab.appendChild(w);
    w.layoutSizingHorizontal = 'FILL'; w.textAutoResize = 'HEIGHT';
    return rw;
  }
  function headerRow(card) {
    const head = card.children[0];
    const hr = frame('Card header', 'HORIZONTAL');
    card.insertChild(0, hr);
    hr.primaryAxisAlignItems = 'SPACE_BETWEEN'; hr.counterAxisAlignItems = 'CENTER';
    hr.layoutSizingHorizontal = 'FILL';
    hr.appendChild(head);
    return hr;
  }

  // Default
  const r1 = await row(`Default`, `Edit mode, card has data. Edit opens the form in place.`);
  const c1 = src.clone(); r1.appendChild(c1); c1.name = 'Links · Default';
  headerRow(c1).appendChild(editSet.children.find(v => v.name === 'State=Default').createInstance());

  // Editing
  const r2 = await row(`Editing`, `After Edit. Each link is a URL field, × removes it, Add link appends one. Save keeps, Cancel discards.`);
  const c2 = src.clone(); r2.appendChild(c2); c2.name = 'Links · Editing';
  headerRow(c2);
  const oldList = c2.findOne(n => n.name === 'Link list');
  const fl = frame('Link fields', 'VERTICAL'); c2.insertChild(c2.children.indexOf(oldList), fl);
  GAP(fl, 'spacing/md'); fl.layoutSizingHorizontal = 'FILL';
  oldList.remove();
  const urls = [`youtube.com/watch?v=leo-marsh-highlights`, `transfermarkt.com/leo-marsh/profil`, `instagram.com/leomarsh10`];
  for (let i = 0; i < urls.length; i++) {
    const lineF = frame('Link ' + (i + 1), 'HORIZONTAL'); fl.appendChild(lineF);
    GAP(lineF, 'spacing/xs'); lineF.counterAxisAlignItems = 'MAX'; lineF.layoutSizingHorizontal = 'FILL';
    const f = field('Text', i === 0 ? 'Focus' : 'Filled', 'Link ' + (i + 1), urls[i]); lineF.appendChild(f);
    f.layoutSizingHorizontal = 'FILL';
    const rm = frame('Remove', 'HORIZONTAL'); lineF.appendChild(rm);
    rm.primaryAxisSizingMode = 'FIXED'; rm.counterAxisSizingMode = 'FIXED'; rm.resize(48, 48);
    rm.primaryAxisAlignItems = 'CENTER'; rm.counterAxisAlignItems = 'CENTER'; R(rm, V('radius/full'));
    rm.appendChild(icon('Icon · Remove', 'x', 20, 'color/icon/default'));
  }
  const add = frame('Add link', 'HORIZONTAL'); fl.appendChild(add);
  GAP(add, 'spacing/xs'); add.counterAxisAlignItems = 'CENTER';
  add.appendChild(icon('Icon · Add', 'plus', 16, 'color/icon/brand'));
  add.appendChild(await txt('Label', `Add link`, 'Label/Default Strong', 'color/text/brand'));
  const acts = frame('Edit actions', 'HORIZONTAL'); c2.appendChild(acts);
  GAP(acts, 'spacing/sm'); acts.layoutSizingHorizontal = 'FILL'; acts.primaryAxisAlignItems = 'MAX';
  acts.appendChild(button('Subtle', 'Cancel'));
  acts.appendChild(button('Primary', 'Save'));

  // Empty
  const r3 = await row(`Empty`, `Edit mode, no data yet. Hidden on the public profile.`);
  const e = emptySet.children.find(v => v.name === 'Device=Desktop').createInstance(); r3.appendChild(e);
  e.name = 'Links · Empty';

  for (const c of [c1, c2]) { c.layoutSizingHorizontal = 'FIXED'; }
  report.info.board = r(board.width) + 'x' + r(board.height) + ' · cards ' + [c1, c2, e].map(c => r(c.width) + 'x' + r(c.height)).join(' / ');
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
  const roots = [editSet, emptySet, barSet, sec3.children.find(c => c.name === 'Profile card · edit states')].filter(Boolean);
  const unbound = [];
  for (const root of roots) for (const n of [root].concat(root.findAll(() => true))) {
    if (n.type === 'INSTANCE' || (n.parent && n.parent.type === 'INSTANCE')) continue;
    for (const key of ['fills', 'strokes']) {
      if (!(key in n)) continue; const ps = n[key]; if (!ps || ps === figma.mixed) continue;
      for (const p of ps) if (p.type === 'SOLID' && !(p.boundVariables && p.boundVariables.color)) unbound.push(n.name + ' ' + key);
    }
  }
  report.info.unboundPaints = unbound.length ? unbound.slice(0, 20) : 'none';
  const ts = []; for (const root of roots) for (const t of root.findAll(x => x.type === 'TEXT' && !x.textStyleId)) ts.push(t.name);
  report.info.textsWithoutStyle = ts.length ? ts.slice(0, 20) : 'none';
  report.info.sets = [editSet, emptySet, barSet].map(s => s.name + ' ' + s.children.map(v => v.name + ' ' + r(v.width) + 'x' + r(v.height)).join(', '));
});

return report;
