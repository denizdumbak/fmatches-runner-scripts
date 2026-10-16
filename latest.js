// step 127 · Achievements: Club entry'ye gizli Achievements satiri (kupa ikonu + ikincil metin, boolean ozellik), profillerde test verisi

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }
const r = n => Math.round(n);

const C = { textSecondary: V('color/text/secondary'), iconDefault: V('color/icon/default') };
const sSmall = TS['Body/Small'];
if (!sSmall) throw new Error('Body/Small missing');
await figma.loadFontAsync(sSmall.fontName);

function trophy() {
  const n = figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3"/><path d="M12 13v4M9 20h6M10 17h4"/></svg>');
  n.fills = [];
  for (const v of n.findAll(() => true)) {
    if ('strokes' in v && v.strokes.length) v.strokes = [P(C.iconDefault)];
    if ('fills' in v && v.fills.length) v.fills = [];
    if ('constraints' in v) v.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
  }
  n.rescale(16 / 24);
  n.name = 'Trophy icon';
  return n;
}

// ---------- 1. Club entry component ----------
const p1 = pageOf(/^01/);
await p1.loadAsync();
const set = p1.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Club entry');
if (!set) throw new Error('Club entry not found');
let key = Object.keys(set.componentPropertyDefinitions).find(k => /^Achievements#/.test(k));

await step('Club entry · Achievements row', async () => {
  if (!key) key = set.addComponentProperty('Achievements', 'BOOLEAN', false);
  const out = [];
  for (const c of set.children) {
    const details = c.findOne(n => n.name === 'Club details');
    if (details.findOne(n => n.name === 'Achievements')) { out.push(c.name + ': exists'); continue; }
    const row = figma.createFrame();
    row.name = 'Achievements';
    row.layoutMode = 'HORIZONTAL';
    row.itemSpacing = 6;
    row.counterAxisAlignItems = 'MIN';
    row.paddingTop = 4;
    row.fills = [];
    details.appendChild(row);
    row.layoutSizingHorizontal = 'FILL';
    row.layoutSizingVertical = 'HUG';
    const ic = trophy();
    row.appendChild(ic);
    const t = figma.createText();
    await t.setTextStyleIdAsync(sSmall.id);
    t.characters = 'Youth league champions 2022/23';
    t.fills = [P(C.textSecondary)];
    t.name = 'Achievements text';
    row.appendChild(t);
    t.layoutSizingHorizontal = 'FILL';
    t.textAutoResize = 'HEIGHT';
    t.textTruncation = 'ENDING';
    t.maxLines = c.variantProperties.Device === 'Mobile' ? 2 : 1;
    // ikon metnin ilk satirinin ortasina
    const lh = t.lineHeight && t.lineHeight.unit === 'PIXELS' ? t.lineHeight.value : 20;
    ic.y = 0;
    row.paddingTop = 4;
    const icWrap = figma.createFrame();
    icWrap.name = 'Icon';
    icWrap.fills = [];
    icWrap.resize(16, lh);
    icWrap.layoutMode = 'HORIZONTAL';
    icWrap.counterAxisAlignItems = 'CENTER';
    row.insertChild(0, icWrap);
    icWrap.appendChild(ic);
    icWrap.layoutSizingHorizontal = 'FIXED'; icWrap.layoutSizingVertical = 'FIXED';
    row.componentPropertyReferences = { visible: key };
    out.push(c.name + ': added, line height ' + lh);
  }
  set.description = 'One club in the career list, with hover state. Achievements row: from careers.achievements, shown only when the field has text (turn on the Achievements property). Several achievements are joined with " · ". Desktop: one line, mobile: up to two lines, then an ellipsis. Empty field: the row is not shown and the entry keeps its normal height.';
  report.info.component = out;
  report.info.key = key;
});

// ---------- 2. Profil sayfalari ----------
const web = pageOf(/^02/);
await web.loadAsync();
const oldH = new Map();
for (const s of web.children.filter(n => n.type === 'SECTION')) for (const k of s.children) oldH.set(k.id, k.height);

const ACH = {
  leo: { 1: 'U19 league champions 2022/23 · Club young player of the year 2023' },
  n15: { 0: 'Promoted to Second Division 2024/25 · Club player of the season 2024/25 · Captain since January 2025 · Most assists in the squad 2023/24' },
  n914: {}
};
const achFor = name => /9–14/.test(name) ? ACH.n914 : /15\+/.test(name) ? ACH.n15 : ACH.leo;

const pages = [];
for (const f of web.findAll(n => n.type === 'FRAME' && /^Profiles \/ Player/.test(n.name) && n.parent && n.parent.type === 'SECTION')) {
  await step('profile · ' + f.name, async () => {
    const list = f.findOne(n => n.name === 'Club entries');
    const map = achFor(f.name);
    const entries = list.children.filter(k => k.type === 'INSTANCE');
    const desc = [];
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      const txt = map[i];
      e.setProperties({ [key]: !!txt });
      if (txt) {
        const t = e.findOne(n => n.name === 'Achievements text');
        await loadFonts(t);
        t.characters = txt;
      }
      const nm = e.findOne(n => n.name === 'Club name'), dt = e.findOne(n => n.name === 'Dates');
      desc.push(i + ' ' + (nm ? nm.characters : '?') + ' ' + (dt ? dt.characters : '') + (txt ? ' + achievements' : ''));
    }
    pages.push(f.name + ' (' + r(oldH.get(f.id)) + ' -> ' + r(f.height) + '): ' + desc.join(' | '));
  });
}
report.info.pages = pages;

// ---------- 3. alttakileri it ----------
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

// ---------- 4. sekme 01 duzen ----------
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
