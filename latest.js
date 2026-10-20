// step 154 · 01'e yeni Section "5 · Forms": Form field (Type x State, 30 varyant) + Checkbox (6 varyant), radius/xs 4 degiskeni, header arama ikonu degiskene baglanir

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

// ---------- 1. radius/xs 4 (checkbox kutusu icin) ----------
await step('radius/xs', async () => {
  if (allVars.find(v => v.name === 'radius/xs')) { report.info.radiusXs = 'already exists'; return; }
  const sm = V('radius/sm');
  const col = await figma.variables.getVariableCollectionByIdAsync(sm.variableCollectionId);
  const v = figma.variables.createVariable('radius/xs', col, 'FLOAT');
  v.setValueForMode(col.modes[0].modeId, 4);
  v.scopes = ['CORNER_RADIUS'];
  allVars = await figma.variables.getLocalVariablesAsync();
  report.info.radiusXs = 'created in ' + col.name;
});

// ---------- 2. header arama ikonu: elle hex yerine degisken ----------
await step('search icon var', async () => {
  const h = await figma.getNodeByIdAsync('63:333');
  const want = V('color/icon/default');
  const col = await figma.variables.getVariableCollectionByIdAsync(want.variableCollectionId);
  const val = want.valuesByMode[col.modes[0].modeId];
  report.info.iconDefault = val && val.r !== undefined ? '#' + [val.r, val.g, val.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('') : 'alias';
  let n = 0;
  for (const fr of h.findAll(x => x.name === 'Icon · Search')) {
    for (const v of fr.findAll(x => x.type === 'VECTOR')) {
      const s = v.strokes;
      if (s.length && !(s[0].boundVariables && s[0].boundVariables.color)) { v.strokes = [P(want)]; n++; }
    }
  }
  report.info.searchVectorsBound = n;
});

// ---------- 3. Section "5 · Forms" ----------
let sec;
await step('section', async () => {
  const old = p01.children.find(n => n.type === 'SECTION' && n.name === '5 · Forms');
  if (old) old.remove();
  const archive = p01.children.find(n => n.type === 'SECTION' && /^Archive/.test(n.name));
  const sec2 = p01.children.find(n => n.type === 'SECTION' && /^2 · Buttons/.test(n.name));
  sec = figma.createSection();
  p01.appendChild(sec);
  sec.name = '5 · Forms';
  sec.x = archive.x; sec.y = 0;
  sec.resizeWithoutConstraints(3000, 2000);
  const texts = sec2.children.filter(n => n.type === 'TEXT').sort((a, b) => a.y - b.y);
  const words = [
    `5 · Forms`,
    `Form fields for profile edit and signup. Label above, 48 px field, radius 12, same height as buttons. Placeholder uses text/secondary (text/tertiary is too faint to read). Hover darkens the border, focus is a 2 px green ring, error is a red border with a message under the field. Disabled is a grey field with a lock, used for fields the user cannot change, such as the name.`
  ];
  for (let i = 0; i < Math.min(2, texts.length); i++) {
    const t = texts[i].clone();
    sec.appendChild(t);
    await loadFonts(t);
    t.characters = words[i];
  }
  report.info.sectionTexts = Math.min(2, texts.length);
});

// ---------- 4. Form field ----------
const TYPES = ['Text', 'Select', 'Date', 'Textarea', 'Multi-chip'];
const STATES = ['Default', 'Hover', 'Focus', 'Filled', 'Error', 'Disabled'];
const C = {
  'Text':       { label: `Name in home country`, ph: `Add the name used at home`, val: `Leo James Marsh`, errVal: '', err: `This field is required.`, help: `Shown under your name on your profile.`, trail: null },
  'Select':     { label: `Current club`, ph: `Search clubs`, val: `Riverside FC`, errVal: `Riversde`, err: `Choose a club from the list.`, help: `Choose “Without a club” if you are a free agent.`, trail: 'chevron' },
  'Date':       { label: `Date of birth`, ph: `DD.MM.YYYY`, val: `18.04.2005`, errVal: `31.02.2005`, err: `Enter a real date.`, help: `Used to show your age.`, trail: 'calendar' },
  'Textarea':   { label: `About you`, ph: `Tell scouts how you play, what you are good at and what you are looking for.`, val: `Box-to-box midfielder who likes to receive between the lines and play forward early. Comfortable on both feet, strong in the press.`, errVal: '', err: `This field is required.`, help: `Shown as About on your profile.`, trail: null },
  'Multi-chip': { label: `Other positions`, ph: `Add position`, val: [`Central midfield`, `Right winger`], errVal: '', err: `Add at least one position.`, help: `Your main position is set separately.`, trail: null }
};
function chip(label, disabled) {
  const c = figma.createFrame();
  c.name = 'Chip'; c.layoutMode = 'HORIZONTAL'; GAP(c, 'spacing/2xs');
  PAD(c, 'spacing/2xs', disabled ? 'spacing/sm' : 'spacing/xs', 'spacing/2xs', 'spacing/sm');
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED'; c.resize(40, 32);
  c.counterAxisAlignItems = 'CENTER';
  R(c, V('radius/full'));
  c.fills = [P(V(disabled ? 'color/bg/surface' : 'color/bg/brand-subtle'))];
  return c;
}
let fieldSet;
await step('form field', async () => {
  const comps = [];
  for (const type of TYPES) for (const state of STATES) {
    const d = C[type];
    const filled = state === 'Focus' || state === 'Filled' || state === 'Disabled';
    const isErr = state === 'Error';
    const dis = state === 'Disabled';
    const c = figma.createComponent();
    p01.appendChild(c);
    c.name = 'Type=' + type + ', State=' + state;
    c.layoutMode = 'VERTICAL'; GAP(c, 'spacing/xs');
    c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED'; c.resize(400, 100);
    c.fills = []; c.clipsContent = false;

    const lab = await txt('Label', d.label, 'Label/Default Strong', dis ? 'color/text/secondary' : 'color/text/primary');
    c.appendChild(lab); lab.layoutSizingHorizontal = 'FILL'; lab.textAutoResize = 'HEIGHT';

    const f = figma.createFrame();
    f.name = 'Field'; c.appendChild(f);
    f.layoutMode = 'HORIZONTAL'; GAP(f, 'spacing/xs');
    f.layoutSizingHorizontal = 'FILL';
    R(f, V('radius/md'));
    f.fills = [P(V(dis ? 'color/bg/subtle' : 'color/bg/surface'))];
    const stroke = isErr ? 'color/text/danger' : state === 'Focus' ? 'color/border/focus' : state === 'Hover' ? 'color/border/strong' : 'color/border/default';
    f.strokes = [P(V(stroke))]; f.strokeAlign = 'INSIDE'; f.strokeWeight = state === 'Focus' ? 2 : 1;
    f.clipsContent = true;

    if (type === 'Multi-chip') {
      f.layoutWrap = 'WRAP'; f.counterAxisSpacing = 8; f.setBoundVariable('counterAxisSpacing', V('spacing/xs'));
      PAD(f, 'spacing/xs', 'spacing/sm', 'spacing/xs', 'spacing/xs');
      f.counterAxisAlignItems = 'CENTER';
      f.layoutSizingVertical = 'HUG'; f.minHeight = 48;
      if (filled) {
        for (const v of d.val) {
          const ch = chip(v, dis); f.appendChild(ch);
          const t = await txt('Value', v, 'Label/Default', dis ? 'color/text/secondary' : 'color/text/brand');
          ch.appendChild(t);
          if (!dis) ch.appendChild(icon('Remove', 'x', 16, 'color/icon/brand'));
        }
      }
      if (!dis) {
        const add = figma.createFrame();
        add.name = 'Add'; add.layoutMode = 'HORIZONTAL'; GAP(add, 'spacing/2xs');
        PAD(add, 'spacing/2xs', 'spacing/xs', 'spacing/2xs', 'spacing/2xs');
        add.primaryAxisSizingMode = 'AUTO'; add.counterAxisSizingMode = 'FIXED'; add.resize(40, 32);
        add.counterAxisAlignItems = 'CENTER'; add.fills = [];
        f.appendChild(add);
        add.appendChild(icon('Icon · Add', 'plus', 16, 'color/icon/brand'));
        add.appendChild(await txt('Add label', filled ? `Add` : d.ph, 'Label/Default Strong', 'color/text/brand'));
      }
    } else {
      const area = type === 'Textarea';
      if (area) PAD(f, 'spacing/sm', 'spacing/md', 'spacing/sm', 'spacing/md');
      else { f.paddingTop = 0; f.paddingBottom = 0; f.setBoundVariable('paddingRight', V('spacing/md')); f.setBoundVariable('paddingLeft', V('spacing/md')); }
      f.counterAxisAlignItems = area ? 'MIN' : 'CENTER';
      f.layoutSizingVertical = 'FIXED'; f.resize(f.width, area ? 120 : 48);
      let shown = filled ? d.val : d.ph, col = filled ? 'color/text/primary' : 'color/text/secondary';
      if (isErr && d.errVal) { shown = d.errVal; col = 'color/text/primary'; }
      if (dis) col = 'color/text/secondary';
      const v = await txt('Value', shown, 'Body/Default', col);
      f.appendChild(v);
      v.layoutSizingHorizontal = 'FILL'; v.textAutoResize = 'HEIGHT';
      if (!area) { v.textTruncation = 'ENDING'; v.maxLines = 1; }
      if (dis && !area) f.appendChild(icon('Icon · Lock', 'lock', 20, 'color/icon/default'));
      else if (d.trail) f.appendChild(icon(d.trail === 'chevron' ? 'Icon · Chevron' : 'Icon · Calendar', d.trail, 20, 'color/icon/default'));
    }

    const help = await txt('Helper', d.help, 'Label/Small', 'color/text/secondary');
    c.appendChild(help); help.layoutSizingHorizontal = 'FILL'; help.textAutoResize = 'HEIGHT';
    const em = await txt('Error message', d.err, 'Label/Small', 'color/text/danger');
    c.appendChild(em); em.layoutSizingHorizontal = 'FILL'; em.textAutoResize = 'HEIGHT';
    em.visible = isErr;
    comps.push(c);
  }
  fieldSet = figma.combineAsVariants(comps, sec);
  fieldSet.name = 'Form field';
  const key = fieldSet.addComponentProperty('Helper', 'BOOLEAN', false);
  for (const v of fieldSet.children) { const h = v.findOne(n => n.name === 'Helper'); h.componentPropertyReferences = { visible: key }; }
  fieldSet.description = `Form field for profile edit and signup. Type: Text, Select (searchable list, e.g. clubs, countries, cities), Date, Textarea, Multi-chip (several values, e.g. other positions, nationalities). State: Default, Hover, Focus, Filled, Error, Disabled.
Developer: label above the field, always visible (no floating label). Field 48 px high, Textarea 120 px, Multi-chip grows with its chips. Placeholder in text/secondary. Error replaces the border with text/danger and shows the message under the field; the message text depends on the rule. Helper is optional (boolean). Disabled means the user cannot change the value (lock icon), e.g. the name on profile edit.`;
  report.info.fieldVariants = fieldSet.children.length;
});

// ---------- 5. Checkbox ----------
let boxSet;
await step('checkbox', async () => {
  const comps = [];
  for (const checked of ['Off', 'On']) for (const state of ['Default', 'Hover', 'Disabled']) {
    const dis = state === 'Disabled', on = checked === 'On';
    const c = figma.createComponent();
    p01.appendChild(c);
    c.name = 'Checked=' + checked + ', State=' + state;
    c.layoutMode = 'HORIZONTAL'; GAP(c, 'spacing/sm');
    PAD(c, 'spacing/sm', 'spacing/2xs', 'spacing/sm', 'spacing/2xs');
    c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
    c.counterAxisAlignItems = 'CENTER'; c.fills = [];
    const box = figma.createFrame();
    box.name = 'Box'; c.appendChild(box);
    box.resize(20, 20); box.layoutMode = 'HORIZONTAL'; box.primaryAxisAlignItems = 'CENTER'; box.counterAxisAlignItems = 'CENTER';
    box.primaryAxisSizingMode = 'FIXED'; box.counterAxisSizingMode = 'FIXED';
    R(box, V('radius/xs'));
    box.fills = [P(V(dis ? 'color/bg/subtle' : on ? 'color/bg/brand' : 'color/bg/surface'))];
    if (!on || dis) { box.strokes = [P(V(dis ? 'color/border/default' : state === 'Hover' ? 'color/icon/brand' : 'color/border/strong'))]; box.strokeWeight = 1.5; box.strokeAlign = 'INSIDE'; }
    if (state === 'Hover' && on) box.fills = [P(V('color/bg/brand-hover'))];
    if (on) box.appendChild(icon('Icon · Check', 'check', 16, dis ? 'color/text/secondary' : 'color/icon/inverse'));
    const t = await txt('Label', `Still at this club`, 'Body/Default', dis ? 'color/text/secondary' : 'color/text/primary');
    c.appendChild(t);
    comps.push(c);
  }
  boxSet = figma.combineAsVariants(comps, sec);
  boxSet.name = 'Checkbox';
  boxSet.description = `Checkbox, e.g. "Still at this club" and "On loan" in a career entry. Checked: Off, On. State: Default, Hover, Disabled. Box 20 px, radius/xs 4. The whole row is clickable and at least 44 px high (12 px padding above and below).`;
  report.info.checkboxVariants = boxSet.children.length;
});

// ---------- 6. Prototip: hover ve tiklama ----------
function rx(trigger, dest) {
  return { trigger: { type: trigger }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'CHANGE_TO', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.15 }, preserveScrollPosition: false, resetVideoPosition: false }] };
}
await step('interactions', async () => {
  let n = 0;
  const fv = name => fieldSet.children.find(c => c.name === name);
  for (const t of TYPES) {
    const d = fv('Type=' + t + ', State=Default'), h = fv('Type=' + t + ', State=Hover'), fo = fv('Type=' + t + ', State=Focus');
    await d.setReactionsAsync([rx('ON_HOVER', h)]);
    await h.setReactionsAsync([rx('ON_CLICK', fo)]);
    n += 2;
  }
  const bv = name => boxSet.children.find(c => c.name === name);
  await bv('Checked=Off, State=Default').setReactionsAsync([rx('ON_HOVER', bv('Checked=Off, State=Hover'))]);
  await bv('Checked=Off, State=Hover').setReactionsAsync([rx('ON_CLICK', bv('Checked=On, State=Default'))]);
  await bv('Checked=On, State=Default').setReactionsAsync([rx('ON_HOVER', bv('Checked=On, State=Hover'))]);
  await bv('Checked=On, State=Hover').setReactionsAsync([rx('ON_CLICK', bv('Checked=Off, State=Default'))]);
  report.info.reactions = n + 4;
});

// ---------- 7. Izgara: satir Type, sutun State ----------
await step('grid', async () => {
  const PADG = 40, GAPX = 40, GAPY = 48, W = 400;
  let y = PADG;
  for (const t of TYPES) {
    const row = STATES.map(s => fieldSet.children.find(c => c.name === 'Type=' + t + ', State=' + s));
    const h = Math.max(...row.map(r => r.height));
    row.forEach((r, i) => { r.x = PADG + i * (W + GAPX); r.y = y; });
    y += h + GAPY;
  }
  fieldSet.resizeWithoutConstraints(PADG * 2 + STATES.length * W + (STATES.length - 1) * GAPX, y - GAPY + PADG);
  let x = 24; let maxH = 0;
  for (const c of boxSet.children) { c.x = x; c.y = 24; x += c.width + 40; maxH = Math.max(maxH, c.height); }
  boxSet.resizeWithoutConstraints(x - 40 + 24, maxH + 48);
  report.info.fieldSetSize = Math.round(fieldSet.width) + 'x' + Math.round(fieldSet.height);
});

// ---------- 8. Section duzeni ve 01 Section sirasi ----------
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
});

// ---------- 9. Kontrol ----------
await step('check', async () => {
  const unbound = [];
  for (const n of sec.findAll(x => x.type !== 'COMPONENT_SET' && ('fills' in x || 'strokes' in x))) {
    for (const key of ['fills', 'strokes']) {
      const ps = n[key]; if (!ps || ps === figma.mixed) continue;
      for (const p of ps) if (p.type === 'SOLID' && !(p.boundVariables && p.boundVariables.color)) unbound.push(n.name + ' ' + key);
    }
  }
  const noStyle = sec.findAll(x => x.type === 'TEXT' && !x.textStyleId).map(x => x.name);
  report.info.unboundPaints = unbound.length ? unbound.slice(0, 20) : 'none';
  report.info.textsWithoutStyle = noStyle.length ? noStyle : 'none';
});

return report;
