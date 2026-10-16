// step 128 · Achievements A: kapaliyken ilk basari + "+N" acici, tiklayinca kariyer satiri yerinde acilir (State=Expanded), basarilar alt alta

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }
const r = n => Math.round(n);

const C = { textBrand: V('color/text/brand'), iconBrand: V('color/icon/brand') };
const sLabel = TS['Label/Default Strong'];
await figma.loadFontAsync(sLabel.fontName);

function chevron(dir) {
  const d = dir === 'down' ? 'M6 9l6 6 6-6' : 'M6 15l6-6 6 6';
  const n = figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>');
  n.fills = [];
  for (const v of n.findAll(() => true)) {
    if ('strokes' in v && v.strokes.length) v.strokes = [P(C.iconBrand)];
    if ('fills' in v && v.fills.length) v.fills = [];
    if ('constraints' in v) v.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
  }
  n.rescale(16 / 24);
  n.name = 'Chevron';
  return n;
}
const clickTo = dest => [{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'CHANGE_TO', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.15 }, preserveScrollPosition: false, resetVideoPosition: false }] }];

const p1 = pageOf(/^01/);
await p1.loadAsync();
const set = p1.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Club entry');
const keyOf = re => Object.keys(set.componentPropertyDefinitions).find(k => re.test(k));
const achKey = keyOf(/^Achievements#/);
if (!achKey) throw new Error('Achievements property missing, run 127 first');
let moreKey = keyOf(/^Achievements more#/);
const V_ = (D, S) => set.children.find(c => c.variantProperties.Device === D && c.variantProperties.State === S);

// ---------- 1. acici (toggle) Default ve Hover varyantlarina ----------
await step('toggle in Default / Hover', async () => {
  if (!moreKey) moreKey = set.addComponentProperty('Achievements more', 'BOOLEAN', false);
  const out = [];
  for (const c of set.children) {
    if (c.variantProperties.State === 'Expanded') continue;
    const row = c.findOne(n => n.name === 'Achievements');
    const t = row.findOne(n => n.name === 'Achievements text');
    t.maxLines = 1;
    if (row.findOne(n => n.name === 'More')) { out.push(c.name + ': exists'); continue; }
    const lh = t.lineHeight && t.lineHeight.unit === 'PIXELS' ? t.lineHeight.value : 20;
    const more = figma.createFrame();
    more.name = 'More';
    more.layoutMode = 'HORIZONTAL';
    more.counterAxisAlignItems = 'CENTER';
    more.itemSpacing = 2;
    more.fills = [];
    row.appendChild(more);
    const lt = figma.createText();
    await lt.setTextStyleIdAsync(sLabel.id);
    lt.characters = '+1';
    lt.fills = [P(C.textBrand)];
    lt.name = 'Count';
    more.appendChild(lt);
    more.appendChild(chevron('down'));
    more.layoutSizingHorizontal = 'HUG';
    more.resize(more.width, lh);
    more.layoutSizingVertical = 'FIXED';
    more.componentPropertyReferences = { visible: moreKey };
    out.push(c.name + ': toggle added');
  }
  report.info.toggle = out;
});

// ---------- 2. Expanded varyantlari ----------
await step('Expanded variants', async () => {
  const out = [];
  for (const D of ['Desktop', 'Mobile']) {
    let ex = V_(D, 'Expanded');
    if (!ex) {
      ex = V_(D, 'Default').clone();
      set.appendChild(ex);
      ex.name = 'Device=' + D + ', State=Expanded';
      await ex.setReactionsAsync([]);
      const t = ex.findOne(n => n.name === 'Achievements text');
      t.textTruncation = 'DISABLED';
      t.maxLines = null;
      const more = ex.findOne(n => n.name === 'More');
      const lt = more.findOne(n => n.name === 'Count');
      await loadFonts(lt);
      lt.characters = 'Less';
      more.findOne(n => n.name === 'Chevron').remove();
      more.appendChild(chevron('up'));
      out.push(D + ': created');
    } else out.push(D + ': exists');
    // tiklama baglantilari
    await ex.findOne(n => n.name === 'More').setReactionsAsync(clickTo(V_(D, 'Default')));
    for (const S of ['Default', 'Hover']) await V_(D, S).findOne(n => n.name === 'More').setReactionsAsync(clickTo(ex));
  }
  set.description = 'One club in the career list, with hover state. Achievements row: from careers.achievements, one achievement per line, shown only when the field has text (turn on Achievements). Collapsed: the first achievement on one line, cut with an ellipsis; if there are more, a "+N" toggle (turn on Achievements more, N = the number of further lines). Clicking it opens the entry in place (State=Expanded) with every achievement on its own line and a "Less" toggle. One achievement that fits: no toggle. Empty field: no row, normal height.';
  report.info.expanded = out;
});

// ---------- 3. profillerdeki veriler ----------
const web = pageOf(/^02/);
await web.loadAsync();
const oldH = new Map();
for (const s of web.children.filter(n => n.type === 'SECTION')) for (const k of s.children) oldH.set(k.id, k.height);

const ACH = {
  leo: { 1: ['U19 league champions 2022/23', 'Club young player of the year 2023'] },
  n15: { 0: ['Promoted to Second Division 2024/25', 'Club player of the season 2024/25', 'Captain since January 2025', 'Most assists in the squad 2023/24'] },
  n914: {}
};
const achFor = name => /9–14/.test(name) ? ACH.n914 : /15\+/.test(name) ? ACH.n15 : ACH.leo;

const pages = [];
for (const f of web.findAll(n => n.type === 'FRAME' && /^Profiles \/ Player/.test(n.name) && n.parent && n.parent.type === 'SECTION')) {
  await step('profile · ' + f.name, async () => {
    const list = f.findOne(n => n.name === 'Club entries');
    const map = achFor(f.name);
    const out = [];
    const entries = list.children.filter(k => k.type === 'INSTANCE');
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i], items = map[i];
      e.setProperties({ [achKey]: !!items, [moreKey]: !!(items && items.length > 1) });
      if (!items) continue;
      const t = e.findOne(n => n.name === 'Achievements text');
      await loadFonts(t);
      t.characters = items.join('\n');
      if (items.length > 1) {
        const c = e.findOne(n => n.name === 'Count');
        await loadFonts(c);
        c.characters = '+' + (items.length - 1);
      }
      out.push(i + ': ' + items.length + ' items');
    }
    pages.push(f.name + ': ' + (out.join(', ') || 'none') + ' (' + r(oldH.get(f.id)) + ' -> ' + r(f.height) + ')');
  });
}
report.info.pages = pages;

// ---------- 4. alttakileri it ----------
await step('push rows below grown frames', async () => {
  const moved = [];
  for (const s of web.children.filter(n => n.type === 'SECTION')) {
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
  report.info.moved = moved;
});

// ---------- 5. sekme 01 duzen ----------
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
await step('relayout 01 sections', async () => {
  const sec = p1.findOne(n => n.type === 'SECTION' && /Player profile/.test(n.name));
  relayout(sec);
  const secs = p1.children.filter(n => n.type === 'SECTION').sort((a, b) => a.x - b.x);
  let x = 1640;
  for (const s of secs) { s.x = x; x += s.width + 160; }
});

return report;
