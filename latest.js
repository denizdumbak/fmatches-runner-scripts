// step 84 · M2 parca 3: cikis onayi dialogu, durum panosu ve menu prototip baglantisi

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const pageOf = re => figma.root.children.find(p => re.test(p.name));
const page0 = pageOf(/^01/);
if (page0) await page0.loadAsync();

const V = {};
for (const [k, id] of Object.entries({
  canvas: '1:28', surface: '1:29', subtle: '1:30', inverse: '1:31',
  textPrimary: '1:38', textSecondary: '1:39', textInverse: '1:41', textWarning: '1:43',
  border: '1:48', rMd: '1:62', rLg: '1:63'
})) V[k] = await figma.variables.getVariableByIdAsync('VariableID:' + id);

const paint = k => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', V[k]);
const radius = (n, k) => { for (const c of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius']) n.setBoundVariable(c, V[k]); };

const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s.id;
const ES = {}; for (const s of await figma.getLocalEffectStylesAsync()) ES[s.name] = s.id;

const fonts = await figma.listAvailableFontsAsync();
const findFont = (fam, sty) => { for (const s of sty) if (fonts.some(f => f.fontName.family === fam && f.fontName.style === s)) return { family: fam, style: s }; return null; };
const INTER_R = findFont('Inter', ['Regular']);
const BARLOW_SB = findFont('Barlow Condensed', ['SemiBold', 'Semi Bold']) || INTER_R;
for (const f of [INTER_R, BARLOW_SB]) if (f) await figma.loadFontAsync(f);

async function T(chars, style, colorKey, font) {
  const t = figma.createText();
  t.fontName = font || INTER_R;
  t.characters = chars;
  if (TS[style]) await t.setTextStyleIdAsync(TS[style]);
  t.fills = [paint(colorKey)];
  t.name = chars.slice(0, 40);
  t.textAutoResize = 'WIDTH_AND_HEIGHT';
  return t;
}

function frame(name, dir) {
  const f = figma.createFrame();
  f.name = name; f.fills = []; f.clipsContent = false;
  if (dir) { f.layoutMode = dir; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; }
  return f;
}

const findComp = name => page0.findOne(n => n.name === name && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
const variantOf = (set, re) => {
  if (!set) return null;
  if (set.type === 'COMPONENT') return set;
  return set.children.find(c => re.test(c.name)) || set.children[0];
};

const buttonSet = findComp('Button');
const headerSet = findComp('Header');
const menuSet = findComp('Account menu');

async function makeButton(label, kind, width) {
  if (!buttonSet) return await T(label, 'Label/Default Strong', 'textPrimary');
  const re = kind === 'primary' ? /Style=Primary.*State=Default/ : /Style=Secondary.*State=Default/;
  let base = variantOf(buttonSet, re);
  if (!base) base = variantOf(buttonSet, /State=Default/);
  const inst = base.createInstance();
  inst.name = 'Button · ' + label;
  try {
    const props = inst.componentProperties || {};
    const labelKey = Object.keys(props).find(k => /^Label/.test(k));
    if (labelKey) inst.setProperties({ [labelKey]: label });
    else { const t = inst.findOne(n => n.type === 'TEXT'); if (t) { await figma.loadFontAsync(t.fontName); t.characters = label; } }
  } catch (e) {
    const t = inst.findOne(n => n.type === 'TEXT'); if (t) { await figma.loadFontAsync(t.fontName); t.characters = label; }
  }
  if (width) { inst.resize(width, 48); }
  return inst;
}

let dialogSet = null;

// --- 1) Log out dialog component set (Device)
async function buildDialog(device) {
  const w = device === 'Desktop' ? 400 : 358;
  const pad = device === 'Desktop' ? 32 : 24;
  const c = figma.createComponent();
  c.name = 'Device=' + device;
  c.layoutMode = 'VERTICAL';
  c.counterAxisSizingMode = 'FIXED';
  c.primaryAxisSizingMode = 'AUTO';
  c.resize(w, 100);
  c.itemSpacing = 24;
  c.paddingLeft = pad; c.paddingRight = pad; c.paddingTop = pad; c.paddingBottom = pad;
  c.fills = [paint('surface')];
  radius(c, 'rLg');
  if (ES['Shadow/Raised']) await c.setEffectStyleIdAsync(ES['Shadow/Raised']);

  const copy = frame('Copy', 'VERTICAL');
  copy.itemSpacing = 8;
  c.appendChild(copy); copy.layoutSizingHorizontal = 'FILL';

  const h = await T('Log out?', 'Heading/H3', 'textPrimary', BARLOW_SB);
  copy.appendChild(h); h.layoutSizingHorizontal = 'FILL';
  const b = await T('You will need to sign in again to message clubs and manage your events.', 'Body/Default', 'textSecondary');
  copy.appendChild(b); b.layoutSizingHorizontal = 'FILL';

  const actions = frame('Actions', device === 'Desktop' ? 'HORIZONTAL' : 'VERTICAL');
  actions.itemSpacing = 12;
  if (device === 'Desktop') { actions.primaryAxisAlignItems = 'MAX'; actions.counterAxisAlignItems = 'CENTER'; }
  c.appendChild(actions); actions.layoutSizingHorizontal = 'FILL';

  const cancel = await makeButton('Cancel', 'secondary');
  const out = await makeButton('Log out', 'primary');
  if (device === 'Desktop') {
    actions.appendChild(cancel);
    actions.appendChild(out);
  } else {
    actions.appendChild(out);
    actions.appendChild(cancel);
    for (const n of [out, cancel]) { n.layoutSizingHorizontal = 'FILL'; try { n.resize(w - pad * 2, 48); } catch (e) {} }
  }
  return c;
}

await step('Log out dialog component', async () => {
  const old = findComp('Log out dialog');
  if (old) { old.remove(); report.info['eski dialog silindi'] = true; }
  const comps = [];
  for (const d of ['Desktop', 'Mobile']) {
    const c = await buildDialog(d);
    page0.appendChild(c);
    comps.push(c);
  }
  dialogSet = figma.combineAsVariants(comps, page0);
  dialogSet.name = 'Log out dialog';
  dialogSet.layoutMode = 'HORIZONTAL';
  dialogSet.primaryAxisSizingMode = 'AUTO';
  dialogSet.counterAxisSizingMode = 'AUTO';
  dialogSet.counterAxisAlignItems = 'MIN';
  dialogSet.itemSpacing = 40;
  dialogSet.paddingLeft = 24; dialogSet.paddingRight = 24; dialogSet.paddingTop = 24; dialogSet.paddingBottom = 24;
  dialogSet.description = 'Confirmation before logging out, required by the spec. Opens from Log out in the account menu, over a 40 percent dark scrim. Log out stays the primary green action because logging out is reversible; red is reserved for Delete account.';
  report.info['Log out dialog'] = dialogSet.children.map(c => c.name);
});

// --- 2) durum panosu
const CAPTION = [];
function scrimFrame(name, w, h) {
  const f = figma.createFrame();
  f.name = name;
  f.resize(w, h);
  f.clipsContent = true;
  f.fills = [paint('subtle')];
  return f;
}

let board = null, rowMenuOpen = null, rowLoggedIn = null;

async function captionRow(parent, title, who) {
  const cap = frame('Caption', 'VERTICAL');
  cap.itemSpacing = 4;
  parent.appendChild(cap);
  const t = await T(title, 'Label/Default Strong', 'textPrimary');
  cap.appendChild(t);
  const w = await T(who, 'Label/Small', 'textWarning');
  cap.appendChild(w);
  return cap;
}

async function headerRow(name, headerRe, title, who, withMenu, menuRe) {
  const row = frame(name, 'VERTICAL');
  row.itemSpacing = 16;
  board.appendChild(row);
  await captionRow(row, title, who);

  const stage = scrimFrame('Stage', 1440, withMenu ? 560 : 160);
  row.appendChild(stage);

  if (headerSet) {
    const hv = variantOf(headerSet, headerRe);
    if (hv) {
      const hi = hv.createInstance();
      hi.name = 'Header';
      stage.appendChild(hi);
      hi.x = 0; hi.y = 0;
    }
  }
  if (withMenu && menuSet) {
    const mv = variantOf(menuSet, menuRe);
    if (mv) {
      const mi = mv.createInstance();
      mi.name = 'Account menu';
      stage.appendChild(mi);
      mi.x = 1440 - 80 - mi.width;
      mi.y = 97 + 8;
    }
  }
  return row;
}

await step('Durum panosu', async () => {
  const old = page0.findOne(n => n.name === 'Header · account states' && n.type === 'FRAME');
  if (old) { old.remove(); report.info['eski pano silindi'] = true; }

  board = frame('Header · account states', 'VERTICAL');
  board.itemSpacing = 56;
  board.paddingLeft = 64; board.paddingRight = 64; board.paddingTop = 64; board.paddingBottom = 64;
  board.fills = [paint('surface')];
  page0.appendChild(board);

  const t = await T('Header · account states', 'Heading/H2', 'textPrimary', BARLOW_SB);
  board.appendChild(t);
  const s = await T('Who sees what in the header, and what the account menu does. Yellow lines are notes for the developer.', 'Body/Default', 'textSecondary');
  board.appendChild(s);

  await headerRow('Row · logged out', /State=Logged out/, 'Logged out', 'Anyone who has not signed in. Sign up is the only account action.', false);
  rowLoggedIn = await headerRow('Row · logged in', /Device=Desktop.*State=Logged in/, 'Logged in', 'Any signed in user. Avatar and chevron open the account menu.', false);
  rowMenuOpen = await headerRow('Row · menu open', /Device=Desktop.*State=Logged in/, 'Account menu open', 'Manager, official, intermediary, referee or fan. No Scouts near you row.', true, /Device=Desktop.*Role=Other/);
  await headerRow('Row · menu open, player', /Device=Desktop.*State=Logged in/, 'Account menu open, player', 'Players only. Scouts near you appears as the third row.', true, /Device=Desktop.*Role=Player/);

  // dialog satiri
  const row = frame('Row · log out dialog', 'VERTICAL');
  row.itemSpacing = 16;
  board.appendChild(row);
  await captionRow(row, 'Log out confirmation', 'Opens when Log out is clicked in the account menu. Cancel returns to the page.');
  const stage = scrimFrame('Stage', 1440, 420);
  row.appendChild(stage);
  const scrim = figma.createRectangle();
  scrim.name = 'Scrim';
  scrim.resize(1440, 420);
  scrim.fills = [paint('inverse')];
  scrim.opacity = 0.4;
  stage.appendChild(scrim);
  scrim.x = 0; scrim.y = 0;
  if (dialogSet) {
    const dv = variantOf(dialogSet, /Device=Desktop/);
    const di = dv.createInstance();
    di.name = 'Log out dialog';
    stage.appendChild(di);
    di.x = (1440 - di.width) / 2;
    di.y = (420 - di.height) / 2;
  }

  report.info['pano'] = board.id;
});

// --- 3) prototip: logged in header -> menu acik
await step('Prototip baglantisi', async () => {
  if (!rowLoggedIn || !rowMenuOpen) throw new Error('satirlar kurulamadi');
  const src = rowLoggedIn.findOne(n => n.type === 'INSTANCE' && n.name === 'Header');
  if (!src) throw new Error('kaynak header instance bulunamadi');
  await src.setReactionsAsync([{
    trigger: { type: 'ON_CLICK' },
    actions: [{
      type: 'NODE',
      destinationId: rowMenuOpen.id,
      navigation: 'NAVIGATE',
      transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 },
      preserveScrollPosition: false
    }]
  }]);
  report.info['prototip'] = 'logged in header -> menu acik satiri';
});

// --- 4) Section'a tasi, duzen
function relayout(s) {
  const kids = s.children.slice().sort((a, b) => {
    const ba = a.absoluteBoundingBox, bb = b.absoluteBoundingBox;
    if (!ba || !bb) return 0;
    if (Math.abs(ba.y - bb.y) > 4) return ba.y - bb.y;
    return ba.x - bb.x;
  });
  const left = s.x + 80; let y = s.y + 80, prevText = false, first = true;
  for (const k of kids) {
    const b = k.absoluteBoundingBox; if (!b) continue;
    const isText = k.type === 'TEXT';
    if (!first) y += (isText && prevText) ? 16 : 120;
    k.x += left - b.x; k.y += y - b.y; y += b.height; prevText = isText; first = false;
  }
  let right = -Infinity, bottom = -Infinity;
  for (const k of s.children) {
    const b = k.absoluteBoundingBox; if (!b) continue;
    if (b.x + b.width > right) right = b.x + b.width;
    if (b.y + b.height > bottom) bottom = b.y + b.height;
  }
  s.resizeWithoutConstraints(Math.ceil(right - s.x + 80), Math.ceil(bottom - s.y + 80));
}

await step('Section duzeni', async () => {
  const section = page0.findOne(n => n.type === 'SECTION' && /Navigation/.test(n.name));
  if (!section) throw new Error('Navigation Section bulunamadi');
  if (dialogSet) section.appendChild(dialogSet);
  if (board) section.appendChild(board);
  relayout(section);
  report.info['Section'] = Math.round(section.width) + 'x' + Math.round(section.height);

  const secs = page0.children.filter(n => n.type === 'SECTION');
  const hits = [];
  for (let i = 0; i < secs.length; i++) for (let j = i + 1; j < secs.length; j++) {
    const a = secs[i].absoluteBoundingBox, b = secs[j].absoluteBoundingBox;
    if (!a || !b) continue;
    if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height)
      hits.push(secs[i].name + ' <-> ' + secs[j].name);
  }
  report.info['Section cakismasi'] = hits.length ? hits : 'yok';
});

return report;
