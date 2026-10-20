// step 156 · 5 · Forms: Multi-chip'te + solda · Option row (Default/Hover/Selected, Code ve Sub) · Option list (Clubs, Positions, Empty) · Date picker (Nisan 2005, 18 secili)

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/);
await p01.loadAsync();

let allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const R = (n, v) => { for (const c of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) n.setBoundVariable(c, v); };
const PAD = (n, t, r, b, l) => { n.setBoundVariable('paddingTop', V(t)); n.setBoundVariable('paddingRight', V(r)); n.setBoundVariable('paddingBottom', V(b)); n.setBoundVariable('paddingLeft', V(l)); };
const GAP = (n, v) => n.setBoundVariable('itemSpacing', V(v));
const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
for (const k of ['Label/Default', 'Label/Default Strong', 'Label/Small', 'Body/Default']) { if (!TS[k]) throw new Error('text style missing: ' + k); await figma.loadFontAsync(TS[k].fontName); }
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }

async function txt(name, chars, style, color) {
  const t = figma.createText();
  t.name = name;
  await t.setTextStyleIdAsync(TS[style].id);
  t.characters = chars;
  t.fills = [P(V(color))];
  return t;
}
const ICON = {
  chevron: 'M6 9l6 6 6-6',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  lock: 'M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z',
  x: 'M17 7L7 17M7 7l10 10',
  plus: 'M12 5v14M5 12h14',
  check: 'M20 6L9 17l-5-5'
};
function icon(name, key, size, color) {
  const svg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="' + ICON[key] + '" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const f = figma.createNodeFromSvg(svg);
  f.name = name; f.fills = []; f.clipsContent = false;
  for (const v of f.findAll(n => n.type === 'VECTOR')) { v.strokes = [P(V(color))]; v.fills = []; v.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; }
  f.rescale(size / 24);
  return f;
}


ICON.left = 'M15 18l-6-6 6-6';
ICON.right = 'M9 18l6-6-6-6';
for (const k of ['Label/Default Strong', 'Label/Small']) await figma.loadFontAsync(TS[k].fontName);
const effects = {}; for (const s of await figma.getLocalEffectStylesAsync()) effects[s.name] = s;
const sec = p01.children.find(n => n.type === 'SECTION' && n.name === '5 · Forms');
if (!sec) throw new Error('5 · Forms missing, run 155 first');
const fieldSet = sec.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Form field');
function rx(trigger, dest) {
  return { trigger: { type: trigger }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'CHANGE_TO', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.15 }, preserveScrollPosition: false, resetVideoPosition: false }] };
}
function frame(name, mode) { const f = figma.createFrame(); f.name = name; f.fills = []; f.clipsContent = false; if (mode) { f.layoutMode = mode; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; f.itemSpacing = 0; } return f; }

// ---------- 1. Multi-chip: + solda ----------
await step('plus first', async () => {
  let moved = 0;
  for (const v of fieldSet.children.filter(c => /Type=Multi-chip/.test(c.name))) {
    const f = v.findOne(n => n.name === 'Field');
    const add = f.children.find(n => n.name === 'Add');
    if (add && f.children.indexOf(add) !== 0) { f.insertChild(0, add); moved++; }
  }
  report.info.plusMoved = moved;
});

// ---------- 2. temizlik (tekrar calisma) ----------
await step('cleanup', async () => {
  for (const name of ['Option row', 'Option list', 'Date picker']) for (const n of sec.children.filter(c => c.name === name)) n.remove();
});

// ---------- 3. Option row ----------
let rowSet, codeKey, subKey;
await step('option row', async () => {
  const comps = [];
  for (const state of ['Default', 'Hover', 'Selected']) {
    const c = figma.createComponent(); p01.appendChild(c);
    c.name = 'State=' + state;
    c.layoutMode = 'HORIZONTAL'; GAP(c, 'spacing/sm'); PAD(c, 'spacing/sm', 'spacing/sm', 'spacing/sm', 'spacing/sm');
    c.counterAxisSizingMode = 'AUTO'; c.resize(384, 48); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO';
    c.counterAxisAlignItems = 'CENTER';
    R(c, V('radius/md'));
    c.fills = state === 'Default' ? [] : [P(V(state === 'Hover' ? 'color/bg/subtle' : 'color/bg/brand-subtle'))];
    const code = await txt('Code', `CM`, 'Label/Default Strong', 'color/text/primary');
    c.appendChild(code);
    const t = frame('Text', 'VERTICAL'); c.appendChild(t);
    t.itemSpacing = 0; t.layoutSizingHorizontal = 'FILL'; t.layoutSizingVertical = 'HUG';
    const lab = await txt('Label', `Riverside FC`, 'Body/Default', 'color/text/primary');
    t.appendChild(lab); lab.layoutSizingHorizontal = 'FILL'; lab.textAutoResize = 'HEIGHT'; lab.textTruncation = 'ENDING'; lab.maxLines = 1;
    const sub = await txt('Sub', `England · Third Division`, 'Label/Small', 'color/text/secondary');
    t.appendChild(sub); sub.layoutSizingHorizontal = 'FILL'; sub.textAutoResize = 'HEIGHT';
    const chk = icon('Icon · Check', 'check', 20, 'color/icon/brand'); c.appendChild(chk);
    chk.visible = state === 'Selected';
    comps.push(c);
  }
  rowSet = figma.combineAsVariants(comps, sec);
  rowSet.name = 'Option row';
  codeKey = rowSet.addComponentProperty('Code', 'BOOLEAN', false);
  subKey = rowSet.addComponentProperty('Sub', 'BOOLEAN', true);
  for (const v of rowSet.children) {
    v.findOne(n => n.name === 'Code').componentPropertyReferences = { visible: codeKey };
    v.findOne(n => n.name === 'Sub').componentPropertyReferences = { visible: subKey };
  }
  let x = 24; for (const v of rowSet.children) { v.x = x; v.y = 24; x += v.width + 40; }
  rowSet.resizeWithoutConstraints(x - 40 + 24, Math.max(...rowSet.children.map(v => v.height)) + 48);
  await rowSet.children.find(v => v.name === 'State=Default').setReactionsAsync([rx('ON_HOVER', rowSet.children.find(v => v.name === 'State=Hover'))]);
  rowSet.description = `One row in a searchable list (Select field). 48 px high, radius 12, same as menu rows. State: Default, Hover, Selected (green tint and check). Code (boolean): position code before the name, e.g. "CM  Central Midfield". Sub (boolean): second line for context, e.g. a club's country and league, so two clubs with the same name can be told apart.`;
  report.info.rowVariants = rowSet.children.length;
});

// ---------- 4. Option list (acilan panel) ----------
let listSet;
async function row(state, label, sub, code) {
  const inst = rowSet.children.find(v => v.name === 'State=' + state).createInstance();
  const props = {}; props[subKey] = !!sub; props[codeKey] = !!code;
  inst.setProperties(props);
  inst.findOne(n => n.name === 'Label').characters = label;
  if (sub) inst.findOne(n => n.name === 'Sub').characters = sub;
  if (code) inst.findOne(n => n.name === 'Code').characters = code;
  inst.name = 'Row · ' + label;
  return inst;
}
await step('option list', async () => {
  const kinds = {
    Clubs: [['Default', `Without a club`, null, null], 'divider', ['Selected', `Riverside FC`, `England · Third Division`], ['Hover', `Riverside Athletic`, `Ireland · Premier Division`], ['Default', `Riverhead Town`, `England · Tier 6`]],
    Positions: [['Default', `Goalkeeper`, null, `GK`], ['Default', `Centre-Back`, null, `CB`], ['Default', `Defensive Midfield`, null, `CDM`], ['Selected', `Central Midfield`, null, `CM`], ['Hover', `Attacking Midfield`, null, `CAM`], ['Default', `Right Winger`, null, `RW`]],
    Empty: []
  };
  const comps = [];
  for (const kind of Object.keys(kinds)) {
    const c = figma.createComponent(); p01.appendChild(c);
    c.name = 'Kind=' + kind;
    c.layoutMode = 'VERTICAL'; c.itemSpacing = 2; PAD(c, 'spacing/xs', 'spacing/xs', 'spacing/xs', 'spacing/xs');
    c.counterAxisSizingMode = 'FIXED'; c.resize(400, 100); c.primaryAxisSizingMode = 'AUTO';
    R(c, V('radius/md'));
    c.fills = [P(V('color/bg/surface'))];
    await c.setEffectStyleIdAsync(effects['Shadow/Raised'].id);
    for (const r of kinds[kind]) {
      if (r === 'divider') {
        const d = figma.createRectangle(); d.name = 'Divider'; c.appendChild(d);
        d.resize(384, 1); d.layoutSizingHorizontal = 'FILL'; d.fills = [P(V('color/border/default'))];
        continue;
      }
      const inst = await row(r[0], r[1], r[2], r[3]);
      c.appendChild(inst); inst.layoutSizingHorizontal = 'FILL';
    }
    if (kind === 'Empty') {
      const box = frame('Empty state', 'VERTICAL'); c.appendChild(box);
      PAD(box, 'spacing/sm', 'spacing/sm', 'spacing/sm', 'spacing/sm'); box.layoutSizingHorizontal = 'FILL'; box.layoutSizingVertical = 'HUG';
      const t = await txt('Message', `No clubs match “Riversde”. Check the spelling, or choose “Without a club”.`, 'Body/Default', 'color/text/secondary');
      box.appendChild(t); t.layoutSizingHorizontal = 'FILL'; t.textAutoResize = 'HEIGHT';
      const d = figma.createRectangle(); d.name = 'Divider'; c.appendChild(d);
      d.resize(384, 1); d.layoutSizingHorizontal = 'FILL'; d.fills = [P(V('color/border/default'))];
      const inst = await row('Default', `Without a club`, null, null);
      c.appendChild(inst); inst.layoutSizingHorizontal = 'FILL';
    }
    comps.push(c);
  }
  listSet = figma.combineAsVariants(comps, sec);
  listSet.name = 'Option list';
  let x = 40; for (const v of listSet.children) { v.x = x; v.y = 40; x += v.width + 40; }
  listSet.resizeWithoutConstraints(x, Math.max(...listSet.children.map(v => v.height)) + 80);
  listSet.description = `Panel that opens under a Select field while the user types (8 px below the field, same width). Kind: Clubs (first row "Without a club", then matches with country and league), Positions (code + full name, 15 positions from the database), Empty (no match, still offers "Without a club"). Shows up to 6 rows, then scrolls. Keyboard: arrows move, Enter picks, Esc closes. On mobile the panel is full width (358).`;
  report.info.listVariants = listSet.children.length;
});

// ---------- 5. Date picker ----------
await step('date picker', async () => {
  const c = figma.createComponent(); sec.appendChild(c);
  c.name = 'Date picker';
  c.layoutMode = 'VERTICAL'; GAP(c, 'spacing/sm'); PAD(c, 'spacing/md', 'spacing/md', 'spacing/md', 'spacing/md');
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  R(c, V('radius/md')); c.fills = [P(V('color/bg/surface'))];
  await c.setEffectStyleIdAsync(effects['Shadow/Raised'].id);
  // baslik: ay ve yil secimi + oklar
  const head = frame('Month and year', 'HORIZONTAL'); c.appendChild(head);
  head.layoutSizingHorizontal = 'FILL'; head.counterAxisAlignItems = 'CENTER'; GAP(head, 'spacing/xs');
  const prev = frame('Previous month', 'HORIZONTAL'); head.appendChild(prev);
  prev.resize(40, 40); prev.primaryAxisAlignItems = 'CENTER'; prev.counterAxisAlignItems = 'CENTER'; R(prev, V('radius/full'));
  prev.appendChild(icon('Icon · Left', 'left', 20, 'color/icon/default'));
  const mid = frame('Pickers', 'HORIZONTAL'); head.appendChild(mid);
  mid.layoutSizingHorizontal = 'FILL'; mid.primaryAxisAlignItems = 'CENTER'; mid.counterAxisAlignItems = 'CENTER'; GAP(mid, 'spacing/2xs');
  for (const [nm, val] of [['Month', `April`], ['Year', `2005`]]) {
    const p = frame(nm, 'HORIZONTAL'); mid.appendChild(p);
    p.counterAxisAlignItems = 'CENTER'; GAP(p, 'spacing/2xs'); PAD(p, 'spacing/2xs', 'spacing/xs', 'spacing/2xs', 'spacing/sm');
    R(p, V('radius/sm'));
    p.appendChild(await txt('Value', val, 'Label/Default Strong', 'color/text/primary'));
    p.appendChild(icon('Icon · Chevron', 'chevron', 16, 'color/icon/default'));
  }
  const next = prev.clone(); head.appendChild(next); next.name = 'Next month';
  next.children[0].remove(); next.appendChild(icon('Icon · Right', 'right', 20, 'color/icon/default'));
  // gun basliklari + izgara
  const grid = frame('Days', 'VERTICAL'); c.appendChild(grid); GAP(grid, 'spacing/2xs'); grid.layoutSizingHorizontal = 'HUG';
  const mkRow = () => { const r = frame('Week', 'HORIZONTAL'); grid.appendChild(r); GAP(r, 'spacing/2xs'); return r; };
  const wd = mkRow(); wd.name = 'Weekdays';
  for (const d of ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']) {
    const cell = frame('Weekday', 'HORIZONTAL'); wd.appendChild(cell); cell.resize(40, 32);
    cell.primaryAxisAlignItems = 'CENTER'; cell.counterAxisAlignItems = 'CENTER';
    cell.appendChild(await txt('Label', d, 'Label/Small', 'color/text/secondary'));
  }
  // Nisan 2005: 1 Nisan cuma; pazartesi baslangicli 5 hafta (28 Mart - 1 Mayis)
  const days = [];
  for (let d = 28; d <= 31; d++) days.push([d, true]);
  for (let d = 1; d <= 30; d++) days.push([d, false]);
  days.push([1, true]);
  for (let w = 0; w < 5; w++) {
    const r = mkRow();
    for (let i = 0; i < 7; i++) {
      const [d, other] = days[w * 7 + i];
      const sel = !other && d === 18;
      const cell = frame(sel ? 'Day · Selected' : other ? 'Day · Other month' : 'Day', 'HORIZONTAL'); r.appendChild(cell);
      cell.resize(40, 40); cell.primaryAxisAlignItems = 'CENTER'; cell.counterAxisAlignItems = 'CENTER';
      R(cell, V('radius/full'));
      if (sel) cell.fills = [P(V('color/bg/brand'))];
      cell.appendChild(await txt('Label', String(d), sel ? 'Label/Default Strong' : 'Label/Default', sel ? 'color/text/inverse' : other ? 'color/text/tertiary' : 'color/text/primary'));
    }
  }
  c.description = `Calendar that opens under a Date field. Month and year are pickers, not only arrows: a date of birth is usually 15 to 40 years back, so the user jumps to the year first. Week starts on Monday. Selected day is green, days of other months are faded (text/tertiary, passive only). Typing the date in the field (DD.MM.YYYY) also works; the calendar follows.`;
  report.info.datePicker = Math.round(c.width) + 'x' + Math.round(c.height);
});

// ---------- 6. Section duzeni ----------
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
await step('sections', async () => {
  relayout(sec);
  const order = [/^1 · /, /^2 · /, /^3 · /, /^4 · /, /^5 · /, /^Archive/];
  const secs = order.map(re => p01.children.find(n => n.type === 'SECTION' && re.test(n.name))).filter(Boolean);
  let x = 1640;
  for (const s of secs) { s.x = x; s.y = 0; x += s.width + 160; }
  report.info.sections01 = secs.map(s => s.name + ' x' + Math.round(s.x) + ' ' + Math.round(s.width) + 'x' + Math.round(s.height));
  report.info.formsOrder = sec.children.map(n => n.name);
});

// ---------- 7. Kontrol ----------
await step('check', async () => {
  const unbound = [];
  for (const n of sec.findAll(x => x.type !== 'COMPONENT_SET' && ('fills' in x || 'strokes' in x))) {
    for (const key of ['fills', 'strokes']) {
      const ps = n[key]; if (!ps || ps === figma.mixed) continue;
      for (const p of ps) if (p.type === 'SOLID' && !(p.boundVariables && p.boundVariables.color)) unbound.push(n.name + ' ' + key);
    }
  }
  report.info.unboundPaints = unbound.length ? unbound.slice(0, 20) : 'none';
  report.info.textsWithoutStyle = sec.findAll(x => x.type === 'TEXT' && !x.textStyleId).map(x => x.name).slice(0, 20);
  if (!report.info.textsWithoutStyle.length) report.info.textsWithoutStyle = 'none';
});

return report;
