// step 161 · Profil duzenleme ana hali: About component'ine Edit boolean · yeni alt Section "Profile edit" (Web + Mobile) · Profiles / Player / Edit · Desktop/Mobile (Leo, Edit bar, her kartta Edit, hero'da Edit details + Change photo, ticker Player) · giris oku + prototip (Done, View as others → profil)

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
for (const k of ['Label/Default Strong', 'Label/Small']) await figma.loadFontAsync(TS[k].fontName);
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }
async function txt(name, chars, style, color) {
  const t = figma.createText(); t.name = name;
  await t.setTextStyleIdAsync(TS[style].id); t.characters = chars; t.fills = [P(V(color))];
  return t;
}
function frame(name, mode) { const f = figma.createFrame(); f.name = name; f.fills = []; f.clipsContent = false; if (mode) { f.layoutMode = mode; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; f.itemSpacing = 0; } return f; }
const nav = (dest) => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });

const setOf = name => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === name);
const editSet = setOf('Edit button'), barSet = setOf('Edit bar'), aboutSet = setOf('About'), btnSet = setOf('Button');
if (!editSet || !barSet || !aboutSet || !btnSet) throw new Error('run 160 first (Edit button, Edit bar) / About / Button missing');
const editBtn = label => { const i = editSet.children.find(v => v.name === 'State=Default').createInstance(); i.name = 'Edit'; if (label) { const t = i.findOne(n => n.type === 'TEXT'); t.characters = label; i.name = label; } return i; };
const keyOf = (set, re) => Object.keys(set.componentPropertyDefinitions).find(k => re.test(k));
const BTN_LABEL = keyOf(btnSet, /^Label#/), BTN_ICON = keyOf(btnSet, /^Icon#/);
function button(style, label) {
  const v = btnSet.children.find(c => c.variantProperties.Style === style && c.variantProperties.State === 'Default');
  const i = v.createInstance(); const props = {}; props[BTN_LABEL] = label; if (BTN_ICON) props[BTN_ICON] = false; i.setProperties(props);
  i.name = 'Button · ' + label; return i;
}

// ---------- 1. About'a Edit boolean ----------
let aboutEditKey;
await step('about edit property', async () => {
  aboutEditKey = keyOf(aboutSet, /^Edit#/);
  if (aboutEditKey) { report.info.about = 'already done'; return; }
  aboutEditKey = aboutSet.addComponentProperty('Edit', 'BOOLEAN', false);
  for (const v of aboutSet.children) {
    const head = v.findOne(n => n.name === 'Heading');
    const hr = frame('Card header', 'HORIZONTAL');
    v.insertChild(v.children.indexOf(head), hr);
    hr.primaryAxisAlignItems = 'SPACE_BETWEEN'; hr.counterAxisAlignItems = 'CENTER';
    hr.layoutSizingHorizontal = 'FILL';
    hr.appendChild(head);
    const e = editBtn(); hr.appendChild(e);
    e.componentPropertyReferences = { visible: aboutEditKey };
  }
  aboutSet.description += ` Edit (boolean): the Edit button next to the heading, on in edit mode.`;
  report.info.about = 'Edit property added to ' + aboutSet.children.length + ' variants';
});

// ---------- 2. Alt Section ----------
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const SUB = 'Profile edit';
function ensureSub(sec) {
  let sub = sec.children.find(n => n.type === 'SECTION' && n.name === SUB);
  if (sub) return sub;
  const ref = sec.children.find(n => n.type === 'SECTION' && n.name === 'Profiles · player');
  let bottom = 0; for (const k of sec.children) bottom = Math.max(bottom, k.y + k.height);
  sub = figma.createSection(); sec.appendChild(sub);
  sub.name = SUB; sub.x = ref ? ref.x : 80; sub.y = bottom + 160;
  sub.resizeWithoutConstraints(2000, 2000);
  if (ref) sub.fills = JSON.parse(JSON.stringify(ref.fills));
  return sub;
}

const pages = {};
for (const [D, sec] of [['Desktop', web], ['Mobile', mob]]) {
  await step('edit page · ' + D, async () => {
    const desk = D === 'Desktop';
    const sub = ensureSub(sec);
    const NAME = 'Profiles / Player / Edit · ' + D;
    for (const n of sub.children.filter(c => c.name === NAME || /^Flow · Entry · Profile edit/.test(c.name))) n.remove();
    const prof = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player · ' + D);
    const f = prof.clone(); sub.appendChild(f);
    f.name = NAME; f.x = 80; f.y = 280;
    const info = [];

    // etkilesimler: profil sayfasina ait olanlar (foto → lightbox) silinir
    for (const n of f.findAll(n => n.type === 'INSTANCE' && /^Photo [A-F]$/.test(n.name))) await n.setReactionsAsync([]);

    // ticker Player rolunde (sayfayi gezen Leo)
    const tick = f.findOne(n => n.type === 'INSTANCE' && /Ticker/i.test(n.name));
    if (tick && tick.componentProperties.Role) { try { tick.setProperties({ Role: 'Player' }); info.push('ticker Player'); } catch (e) { info.push('ticker: ' + e.message); } }

    // header avatari bas harfleri
    const header = f.findOne(n => n.type === 'INSTANCE' && /Navigation|Header/.test(n.name));
    if (header) {
      const ini = header.findAll(n => n.type === 'TEXT' && /^[A-Z]{2}$/.test(n.characters));
      for (const t of ini) { await loadFonts(t); t.characters = 'LM'; }
      info.push('avatar initials ' + ini.length);
    }

    // Edit bar header'in altina
    const bar = barSet.children.find(v => v.name === 'Device=' + D).createInstance();
    bar.name = 'Edit bar · sticky under header';
    f.insertChild(header ? f.children.indexOf(header) + 1 : 2, bar);
    bar.layoutSizingHorizontal = 'FILL';

    // breadcrumb
    const bc = f.findOne(n => n.type === 'TEXT' && n.name === 'Breadcrumb');
    if (bc) { await loadFonts(bc); bc.characters = 'My profile / Edit'; info.push('breadcrumb'); }

    // hero aksiyonlari: Edit details + Change photo
    const hero = f.findOne(n => n.name === 'Hero · player identity');
    let actions = hero.findOne(n => n.name === 'Profile actions');
    if (actions) { for (const k of actions.children.slice()) k.remove(); }
    else {
      actions = frame('Profile actions', 'HORIZONTAL');
      const strip = hero.findAll(n => n.type === 'INSTANCE' && /Club strip/.test(n.name)).pop();
      const host = strip ? strip.parent : hero;
      host.insertChild(strip ? host.children.indexOf(strip) + 1 : host.children.length, actions);
    }
    actions.itemSpacing = 12; actions.counterAxisAlignItems = 'CENTER';
    actions.appendChild(editBtn('Edit details'));
    actions.appendChild(button('Subtle', 'Change photo'));

    // mobil sabit bar yok (kendi profili)
    for (const s of f.children.filter(n => /^Sticky action bar/.test(n.name))) { s.remove(); info.push('sticky bar removed'); }

    // kartlara Edit
    let cards = 0;
    const body = f.findOne(n => n.name === 'Profile body');
    const hosts = desk ? ['Left column', 'Right column'].map(nm => body.findOne(n => n.name === nm)).filter(Boolean) : [body];
    for (const h of hosts) for (const c of h.children.slice()) {
      if (c.type === 'INSTANCE') { if (aboutEditKey && c.componentProperties[aboutEditKey] !== undefined) { c.setProperties({ [aboutEditKey]: true }); cards++; } continue; }
      if (c.type !== 'FRAME' || !c.children.length) continue;
      if (c.findOne(n => n.name === 'Card header')) continue;
      const head = c.children[0];
      const hr = frame('Card header', 'HORIZONTAL');
      c.insertChild(0, hr);
      hr.primaryAxisAlignItems = 'SPACE_BETWEEN'; hr.counterAxisAlignItems = 'CENTER';
      hr.layoutSizingHorizontal = 'FILL';
      hr.appendChild(head);
      if (head.type === 'FRAME') head.layoutSizingHorizontal = 'FILL';
      hr.appendChild(editBtn());
      cards++;
    }
    info.push('cards with Edit ' + cards);

    // prototip: Done ve View as others → profil
    const done = bar.findOne(n => n.name === 'Button · Done'), view = bar.findOne(n => n.name === 'View as others');
    if (done) await done.setReactionsAsync([nav(prof)]);
    if (view) await view.setReactionsAsync([nav(prof)]);

    // alt Section boyu
    let right = 0, bottom = 0; for (const k of sub.children) { right = Math.max(right, k.x + k.width); bottom = Math.max(bottom, k.y + k.height); }
    sub.resizeWithoutConstraints(Math.ceil(right + 80), Math.ceil(bottom + 80));
    pages[D] = { f, sub, prof };
    report.info['page' + D] = r(f.width) + 'x' + r(f.height) + ' · ' + info.join(' · ');
  });
}

// ---------- 3. giris oku ----------
await step('entry arrows', async () => {
  const BLUE = { r: 13 / 255, g: 153 / 255, b: 1 };
  for (const D of Object.keys(pages)) {
    const { f, sub } = pages[D];
    const v = figma.createVector(); sub.appendChild(v);
    v.name = 'Arrow';
    v.vectorPaths = [{ windingRule: 'NONE', data: 'M 0 0 L 0 120' }];
    v.strokes = [{ type: 'SOLID', color: BLUE }]; v.strokeWeight = 4;
    await v.setVectorNetworkAsync({ vertices: [{ x: 0, y: 0, strokeCap: 'NONE' }, { x: 0, y: 120, strokeCap: 'ARROW_LINES' }], segments: [{ start: 0, end: 1 }], regions: [] });
    v.x = f.x + 120; v.y = f.y - 140;
    const lab = frame('Label', 'HORIZONTAL'); sub.appendChild(lab);
    lab.paddingTop = 6; lab.paddingBottom = 6; lab.paddingLeft = 10; lab.paddingRight = 10;
    lab.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]; lab.cornerRadius = 6;
    lab.strokes = [{ type: 'SOLID', color: BLUE }]; lab.strokeWeight = 1;
    lab.appendChild(await txt('Text', `From the account menu · Edit account · not drawn yet`, 'Label/Default Strong', 'color/text/primary'));
    lab.x = f.x + 144; lab.y = f.y - 140;
    const g = figma.group([v, lab], sub); g.name = 'Flow · Entry · Profile edit · ' + D;
  }
});

// ---------- 4. akis baslangici, Web boyu, kontrol ----------
await step('flow start + sections', async () => {
  const starts = (p02.flowStartingPoints || []).filter(s => !/Profile edit/.test(s.name));
  for (const D of Object.keys(pages)) starts.push({ nodeId: pages[D].f.id, name: (D === 'Desktop' ? 'Web' : 'Mobile') + ' · Profile edit' });
  p02.flowStartingPoints = starts;
  for (const s of [web, mob]) {
    let right = 0, bottom = 0; for (const k of s.children) { right = Math.max(right, k.x + k.width); bottom = Math.max(bottom, k.y + k.height); }
    if (bottom + 80 > s.height) s.resizeWithoutConstraints(s.width, Math.ceil(bottom + 80));
  }
  const ov = [];
  for (const s of [web, mob]) { const k = s.children.filter(c => c.type === 'SECTION');
    for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) { const a = k[i], z = k[j];
      if (a.x < z.x + z.width && z.x < a.x + a.width && a.y < z.y + z.height && z.y < a.y + a.height) ov.push(a.name + ' / ' + z.name); } }
  report.info.sectionOverlaps = ov.length ? ov : 'none';
  let total = 0, broken = 0;
  for (const n of p02.findAll(n => n.reactions && n.reactions.length)) for (const rr of n.reactions) for (const a of (rr.actions || [])) {
    if (!a.destinationId) continue; total++; if (!(await figma.getNodeByIdAsync(a.destinationId))) broken++;
  }
  report.info.prototype = total + ' links, ' + broken + ' broken';
  report.info.flowStarts = p02.flowStartingPoints.map(s => s.name);
});

return report;
