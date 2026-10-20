// step 163 · (162 dahil) "Button" yazisi kalan Button instance'lari duzelir · kendi profil kurali (LinkedIn gibi): duzenleme seridi kalkar, Edit bar Archive'a, View as others hero'ya · sayfalar "Profiles / Player / Own profile" · sari kural notu · aciklamalar guncellenir

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
const r = n => Math.round(n);
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
for (const k of ['Label/Small', 'Label/Default Strong']) await figma.loadFontAsync(TS[k].fontName);
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }
const nav = (dest) => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });

const setOf = name => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === name);
const btnSet = setOf('Button'), barSet = setOf('Edit bar'), editSet = setOf('Edit button'), emptySet = setOf('Empty card');
const keyOf = (set, re) => Object.keys(set.componentPropertyDefinitions).find(k => re.test(k));
const BTN_LABEL = keyOf(btnSet, /^Label#/), BTN_ICON = keyOf(btnSet, /^Icon#/);
async function button(style, label) {
  const v = btnSet.children.find(c => c.variantProperties.Style === style && c.variantProperties.State === 'Default');
  const i = v.createInstance(); const props = {}; if (BTN_LABEL) props[BTN_LABEL] = label; if (BTN_ICON) props[BTN_ICON] = false; i.setProperties(props);
  const t = i.findOne(n => n.type === 'TEXT'); if (t && t.characters !== label) { await loadFonts(t); t.characters = label; }
  i.name = 'Button · ' + label; return i;
}

// ---------- 1. Button metinleri (162) ----------
await step('inspect Button', async () => {
  const defs = btnSet.componentPropertyDefinitions;
  report.info.buttonProps = Object.keys(defs).map(k => k + ' (' + defs[k].type + ')');
  report.info.buttonTexts = btnSet.children[0].findAll(n => n.type === 'TEXT').map(t => t.name + ' "' + t.characters + '" refs ' + JSON.stringify(t.componentPropertyReferences || {}));
});
await step('fix labels', async () => {
  const fixed = [];
  for (const page of [p01, p02]) for (const i of page.findAll(n => n.type === 'INSTANCE' && /^Button · /.test(n.name))) {
    const t = i.findOne(n => n.type === 'TEXT');
    const want = i.name.replace(/^Button · /, '');
    if (t && t.characters === 'Button' && want !== 'Button') { await loadFonts(t); t.characters = want; fixed.push(page.name.slice(0, 2) + ' · ' + want); }
  }
  report.info.fixed = fixed.length ? fixed : 'none';
});

// ---------- 2. Own profile sayfalari ----------
const pagesOut = [];
for (const D of ['Desktop', 'Mobile']) {
  await step('own profile · ' + D, async () => {
    const f = p02.findOne(n => n.type === 'FRAME' && (n.name === 'Profiles / Player / Edit · ' + D || n.name === 'Profiles / Player / Own profile · ' + D));
    if (!f) throw new Error('edit page not found, run 161 first');
    f.name = 'Profiles / Player / Own profile · ' + D;
    const prof = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player · ' + D);
    const info = [];
    for (const b of f.findAll(n => n.type === 'INSTANCE' && /^Edit bar/.test(n.name))) { b.remove(); info.push('bar removed'); }
    const bc = f.findOne(n => n.type === 'TEXT' && n.name === 'Breadcrumb');
    if (bc) { await loadFonts(bc); bc.characters = 'My profile'; }
    const actions = f.findOne(n => n.name === 'Profile actions');
    if (actions && !actions.findOne(n => n.name === 'Button · View as others')) {
      const vb = await button('Subtle', 'View as others'); actions.appendChild(vb);
      await vb.setReactionsAsync([nav(prof)]);
      info.push('View as others in hero');
    }
    // kural notu
    const sub = f.parent;
    for (const n of sub.children.filter(c => c.name === 'Note · Own profile · ' + D)) n.remove();
    const note = figma.createText(); sub.appendChild(note);
    note.name = 'Note · Own profile · ' + D;
    await note.setTextStyleIdAsync(TS['Label/Small'].id);
    note.characters = `Own profile (like LinkedIn). The profile address opens differently for its owner: the owner always sees this version, with Edit on every card and on the hero, and empty cards shown as invitations. Everyone else sees the public profile, where empty cards are hidden. There is no separate edit mode and no Done button. View as others opens the public version for the owner to check.`;
    note.fills = [P(V('color/text/warning'))];
    note.textAutoResize = 'HEIGHT'; note.resize(D === 'Desktop' ? 760 : 390, note.height);
    note.x = f.x + f.width + 80; note.y = f.y;
    let right = 0, bottom = 0; for (const k of sub.children) { right = Math.max(right, k.x + k.width); bottom = Math.max(bottom, k.y + k.height); }
    if (right + 80 > sub.width || bottom + 80 > sub.height) sub.resizeWithoutConstraints(Math.max(sub.width, Math.ceil(right + 80)), Math.max(sub.height, Math.ceil(bottom + 80)));
    pagesOut.push(f.name + ' · ' + r(f.width) + 'x' + r(f.height) + ' · ' + info.join(' · '));
  });
}
report.info.pages = pagesOut;

// ---------- 3. etiket, akis baslangici ----------
await step('labels and flow starts', async () => {
  for (const t of p02.findAll(n => n.type === 'TEXT' && /^From the account menu · Edit account/.test(n.characters))) { await loadFonts(t); t.characters = 'From the account menu · My profile · not drawn yet'; }
  for (const g of p02.findAll(n => /^Flow · Entry · Profile edit/.test(n.name))) g.name = g.name.replace('Profile edit', 'Own profile');
  p02.flowStartingPoints = (p02.flowStartingPoints || []).map(s => ({ nodeId: s.nodeId, name: s.name.replace('Profile edit', 'Own profile') }));
  for (const s of p02.findAll(n => n.type === 'SECTION' && n.name === 'Profile edit')) s.name = 'Own profile';
  report.info.flowStarts = p02.flowStartingPoints.map(s => s.name);
});

// ---------- 4. 01: Edit bar Archive'a, aciklamalar ----------
await step('archive edit bar + descriptions', async () => {
  const arch = p01.children.find(n => n.type === 'SECTION' && /^Archive/.test(n.name));
  if (barSet && arch && barSet.parent !== arch) {
    const used = p02.findAll(n => n.type === 'INSTANCE' && /^Edit bar/.test(n.name)).length;
    if (used) throw new Error('Edit bar still used on ' + used + ' instances');
    let bottom = 0; for (const k of arch.children) bottom = Math.max(bottom, k.y + k.height);
    arch.appendChild(barSet); barSet.x = 80; barSet.y = bottom + 120;
    arch.resizeWithoutConstraints(Math.max(arch.width, barSet.width + 160), barSet.y + barSet.height + 80);
    barSet.description = 'Not used (21 Oct): own profile follows the LinkedIn pattern, no separate edit mode. ' + barSet.description;
  }
  if (editSet) editSet.description = `Top right of every card on the owner's own profile (hero too: "Edit details"), on the same line as the card heading. Always visible, also on mobile: the current site shows the pencil only on hover, which touch screens never get. Click: the card turns into its form in place; while a card is being edited its Edit button is hidden and Save / Cancel sit at the bottom of the card. One card is edited at a time. 44 px high for touch. Visitors never see it.`;
  if (emptySet) emptySet.description = emptySet.description.replace('Edit mode only: a card with no data', "Owner's own profile only: a card with no data");
  const sec3 = p01.children.find(n => n.type === 'SECTION' && /^3 · /.test(n.name));
  const board = sec3 && sec3.findOne(n => n.name === 'Profile card · edit states');
  if (board) for (const t of board.findAll(n => n.type === 'TEXT' && /^Edit mode/.test(n.characters))) { await loadFonts(t); t.characters = t.characters.replace(/^Edit mode, /, 'Own profile, '); }
});

// ---------- 5. 01 duzeni + kontrol ----------
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
await step('sections 01 + check', async () => {
  for (const re of [/^3 · /]) { const s = p01.children.find(n => n.type === 'SECTION' && re.test(n.name)); if (s) relayout(s); }
  const order = [/^1 · /, /^2 · /, /^3 · /, /^4 · /, /^5 · /, /^Archive/];
  const secs = order.map(re => p01.children.find(n => n.type === 'SECTION' && re.test(n.name))).filter(Boolean);
  let x = 1640; for (const s of secs) { s.x = x; s.y = 0; x += s.width + 160; }
  let left = 0;
  for (const page of [p01, p02]) for (const i of page.findAll(n => n.type === 'INSTANCE' && /^Button · /.test(n.name))) { const t = i.findOne(n => n.type === 'TEXT'); if (t && t.characters === 'Button') left++; }
  report.info.buttonTextLeft = left;
  let total = 0, broken = 0;
  for (const n of p02.findAll(n => n.reactions && n.reactions.length)) for (const rr of n.reactions) for (const a of (rr.actions || [])) {
    if (!a.destinationId) continue; total++; if (!(await figma.getNodeByIdAsync(a.destinationId))) broken++;
  }
  report.info.prototype = total + ' links, ' + broken + ' broken';
});

return report;
