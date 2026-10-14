// step 78 · M2 parca 2: menu satiri ve ikonlari component'e cevrildi, hover durumu eklendi

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const page = re => figma.root.children.find(p => re.test(p.name));
const page0 = page(/^01/);
if (page0) await page0.loadAsync();

const V = {};
for (const [k, id] of Object.entries({
  surface: '1:29', subtle: '1:30', dangerSubtle: '1:37',
  textPrimary: '1:38', textSecondary: '1:39', textDanger: '1:44',
  iconDefault: '1:45', iconBrand: '1:46', border: '1:48',
  rMd: '1:62'
})) V[k] = await figma.variables.getVariableByIdAsync('VariableID:' + id);

const paint = k => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', V[k]);
const radius = (n, k) => { for (const c of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) n.setBoundVariable(c, V[k]); };

const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s.id;
const ES = {}; for (const s of await figma.getLocalEffectStylesAsync()) ES[s.name] = s.id;

const fonts = await figma.listAvailableFontsAsync();
const findFont = (family, styles) => {
  for (const s of styles) if (fonts.some(f => f.fontName.family === family && f.fontName.style === s)) return { family, style: s };
  return null;
};
const INTER_R = findFont('Inter', ['Regular']);
const INTER_SB = findFont('Inter', ['Semi Bold', 'SemiBold']);
for (const f of [INTER_R, INTER_SB]) if (f) await figma.loadFontAsync(f);

async function T(chars, styleName, colorKey, fallbackFont) {
  const t = figma.createText();
  t.fontName = fallbackFont || INTER_R;
  t.characters = chars;
  if (TS[styleName]) await t.setTextStyleIdAsync(TS[styleName]);
  t.fills = [paint(colorKey)];
  t.name = chars;
  t.textAutoResize = 'WIDTH_AND_HEIGHT';
  return t;
}

function frame(name, dir) {
  const f = figma.createFrame();
  f.name = name; f.fills = []; f.clipsContent = false;
  if (dir) { f.layoutMode = dir; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; }
  return f;
}

// --- ikonlar (20px, stroke)
const ICON = {
  user: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="6.5" r="3.2" stroke="#000" stroke-width="1.6"/><path d="M3.8 17c0-3.2 2.8-5.2 6.2-5.2s6.2 2 6.2 5.2" stroke="#000" stroke-width="1.6" stroke-linecap="round"/></svg>',
  lock: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3.8" y="8.6" width="12.4" height="8.2" rx="2" stroke="#000" stroke-width="1.6"/><path d="M6.8 8.6V6.4a3.2 3.2 0 0 1 6.4 0v2.2" stroke="#000" stroke-width="1.6" stroke-linecap="round"/></svg>',
  pin: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 17.5s5.4-5 5.4-9a5.4 5.4 0 1 0-10.8 0c0 4 5.4 9 5.4 9Z" stroke="#000" stroke-width="1.6" stroke-linejoin="round"/><circle cx="10" cy="8.3" r="2" stroke="#000" stroke-width="1.6"/></svg>',
  calendar: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3.2" y="4.6" width="13.6" height="12.2" rx="2" stroke="#000" stroke-width="1.6"/><path d="M3.2 8.4h13.6M7 3.2v2.6M13 3.2v2.6" stroke="#000" stroke-width="1.6" stroke-linecap="round"/></svg>',
  users: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="7.8" cy="7" r="2.8" stroke="#000" stroke-width="1.6"/><path d="M2.6 16.4c0-2.8 2.3-4.5 5.2-4.5s5.2 1.7 5.2 4.5" stroke="#000" stroke-width="1.6" stroke-linecap="round"/><path d="M13.6 5.2a2.6 2.6 0 0 1 0 5M15.2 12.4c1.5.5 2.4 1.7 2.4 3.4" stroke="#000" stroke-width="1.6" stroke-linecap="round"/></svg>',
  settings: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="2.6" stroke="#000" stroke-width="1.6"/><path d="M10 2.6v2M10 15.4v2M17.4 10h-2M4.6 10h-2M15.2 4.8l-1.4 1.4M6.2 13.8l-1.4 1.4M15.2 15.2l-1.4-1.4M6.2 6.2 4.8 4.8" stroke="#000" stroke-width="1.6" stroke-linecap="round"/></svg>',
  help: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="7.2" stroke="#000" stroke-width="1.6"/><path d="M8 8a2 2 0 1 1 2.6 1.9c-.5.2-.6.6-.6 1.1v.4" stroke="#000" stroke-width="1.6" stroke-linecap="round"/><circle cx="10" cy="14" r="0.9" fill="#000"/></svg>',
  logout: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.4 14.4v1.4a1.8 1.8 0 0 1-1.8 1.8H5.2a1.8 1.8 0 0 1-1.8-1.8V4.2a1.8 1.8 0 0 1 1.8-1.8h5.4a1.8 1.8 0 0 1 1.8 1.8v1.4" stroke="#000" stroke-width="1.6" stroke-linecap="round"/><path d="M8.6 10h8M14 7.4 16.6 10 14 12.6" stroke="#000" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  trash: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.6 5.6h12.8M8.2 5.6V4.2a1.4 1.4 0 0 1 1.4-1.4h.8a1.4 1.4 0 0 1 1.4 1.4v1.4" stroke="#000" stroke-width="1.6" stroke-linecap="round"/><path d="M5.4 5.6l.8 10a1.6 1.6 0 0 0 1.6 1.5h4.4a1.6 1.6 0 0 0 1.6-1.5l.8-10" stroke="#000" stroke-width="1.6" stroke-linejoin="round"/></svg>'
};

const ICON_ORDER = ['user', 'lock', 'pin', 'calendar', 'users', 'settings', 'help', 'logout', 'trash'];

function svgNode(svg, colorKey) {
  const n = figma.createNodeFromSvg(svg);
  n.name = 'Glyph';
  n.fills = [];
  for (const v of n.findAll(x => x.type === 'VECTOR' || x.type === 'ELLIPSE' || x.type === 'RECTANGLE')) {
    if (v.strokes && v.strokes.length) v.strokes = [paint(colorKey)];
    if (v.fills && v.fills.length) v.fills = [paint(colorKey)];
  }
  return n;
}

function recolor(node, colorKey) {
  for (const v of node.findAll(x => x.type === 'VECTOR' || x.type === 'ELLIPSE' || x.type === 'RECTANGLE')) {
    if (v.strokes && v.strokes.length) v.strokes = [paint(colorKey)];
    if (v.fills && v.fills.length) v.fills = [paint(colorKey)];
  }
}

let iconSet = null, rowSet = null, menuSet = null;

// --- 1) Menu icon component set (9 varyant)
await step('Menu icon set', async () => {
  const old = page0.findOne(n => n.name === 'Menu icon' && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
  if (old) { old.remove(); report.info['eski Menu icon silindi'] = true; }

  const comps = [];
  for (const key of ICON_ORDER) {
    const c = figma.createComponent();
    c.name = 'Icon=' + key;
    c.resize(20, 20);
    c.fills = [];
    c.clipsContent = false;
    const g = svgNode(ICON[key], 'iconDefault');
    c.appendChild(g);
    g.x = 0; g.y = 0;
    page0.appendChild(c);
    comps.push(c);
  }
  iconSet = figma.combineAsVariants(comps, page0);
  iconSet.name = 'Menu icon';
  iconSet.layoutMode = 'HORIZONTAL';
  iconSet.primaryAxisSizingMode = 'AUTO';
  iconSet.counterAxisSizingMode = 'AUTO';
  iconSet.counterAxisAlignItems = 'CENTER';
  iconSet.itemSpacing = 24;
  iconSet.paddingLeft = 24; iconSet.paddingRight = 24; iconSet.paddingTop = 24; iconSet.paddingBottom = 24;
  iconSet.description = 'Line icons used in the account menu. 20 px, 1.6 stroke, bound to icon/default. The row component recolours them for the danger state.';
  report.info['Menu icon'] = iconSet.children.map(c => c.name);
});

// --- 2) Menu row component set (State x Tone)
const ROW_W = 264;

async function buildRow(state, tone) {
  const danger = tone === 'Danger';
  const hover = state === 'Hover';
  const c = figma.createComponent();
  c.name = 'State=' + state + ', Tone=' + tone;
  c.layoutMode = 'HORIZONTAL';
  c.counterAxisAlignItems = 'CENTER';
  c.primaryAxisSizingMode = 'FIXED';
  c.counterAxisSizingMode = 'FIXED';
  c.resize(ROW_W, 44);
  c.itemSpacing = 12;
  c.paddingLeft = 12; c.paddingRight = 12; c.paddingTop = 10; c.paddingBottom = 10;
  c.clipsContent = false;
  radius(c, 'rMd');
  if (hover) c.fills = [paint(danger ? 'dangerSubtle' : 'subtle')];
  else c.fills = [];

  const ic = iconSet.children[0].createInstance();
  ic.name = 'Menu icon';
  c.appendChild(ic);
  if (danger) recolor(ic, 'textDanger');
  else if (hover) recolor(ic, 'iconBrand');

  const t = await T('Label', 'Body/Default', danger ? 'textDanger' : 'textPrimary');
  t.name = 'Label';
  c.appendChild(t);
  t.layoutSizingHorizontal = 'FILL';
  return c;
}

await step('Menu row set', async () => {
  const old = page0.findOne(n => n.name === 'Menu row' && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
  if (old) { old.remove(); report.info['eski Menu row silindi'] = true; }

  const comps = [];
  for (const state of ['Default', 'Hover']) {
    for (const tone of ['Default', 'Danger']) {
      const c = await buildRow(state, tone);
      page0.appendChild(c);
      comps.push(c);
    }
  }
  rowSet = figma.combineAsVariants(comps, page0);
  rowSet.name = 'Menu row';
  rowSet.layoutMode = 'VERTICAL';
  rowSet.primaryAxisSizingMode = 'AUTO';
  rowSet.counterAxisSizingMode = 'AUTO';
  rowSet.itemSpacing = 24;
  rowSet.paddingLeft = 24; rowSet.paddingRight = 24; rowSet.paddingTop = 24; rowSet.paddingBottom = 24;
  rowSet.description = 'One row of the account menu. Hover fills the row with bg/subtle and turns the icon green, no movement. Tone=Danger is the delete account row: red label and icon, bg/danger-subtle on hover.';
  report.info['Menu row'] = rowSet.children.map(c => c.name);
});

// --- 3) Account menu'yu satir instance'lariyla yeniden kur
const ROWS_BASE = [
  ['Edit account', 'user'],
  ['Change password', 'lock'],
  ['My events', 'calendar'],
  ['My contacts', 'users'],
  ['Settings', 'settings'],
  ['Support', 'help']
];

const variantOf = (set, re) => set.children.find(c => re.test(c.name));

async function rowInstance(label, iconKey, danger) {
  const base = variantOf(rowSet, danger ? /State=Default, Tone=Danger/ : /State=Default, Tone=Default/);
  const inst = base.createInstance();
  inst.name = 'Row · ' + label;
  const ic = inst.findOne(n => n.type === 'INSTANCE' && n.name === 'Menu icon');
  if (ic) await ic.setProperties({ Icon: iconKey });
  const t = inst.findOne(n => n.type === 'TEXT');
  if (t) { await figma.loadFontAsync(t.fontName); t.characters = label; }
  return inst;
}

function divider() {
  const d = figma.createRectangle();
  d.name = 'Divider';
  d.resize(ROW_W, 1);
  d.fills = [paint('border')];
  return d;
}

async function buildMenu(device, role) {
  const width = device === 'Desktop' ? 280 : 358;
  const c = figma.createComponent();
  c.name = 'Device=' + device + ', Role=' + role;
  c.layoutMode = 'VERTICAL';
  c.counterAxisSizingMode = 'FIXED';
  c.primaryAxisSizingMode = 'AUTO';
  c.resize(width, 100);
  c.itemSpacing = 2;
  c.paddingLeft = 8; c.paddingRight = 8; c.paddingTop = 8; c.paddingBottom = 8;
  c.fills = [paint('surface')];
  radius(c, 'rMd');
  if (ES['Shadow/Raised']) await c.setEffectStyleIdAsync(ES['Shadow/Raised']);

  const who = frame('Signed in as', 'HORIZONTAL');
  who.counterAxisAlignItems = 'CENTER';
  who.itemSpacing = 12;
  who.paddingLeft = 12; who.paddingRight = 12; who.paddingTop = 8; who.paddingBottom = 12;
  c.appendChild(who);
  who.layoutSizingHorizontal = 'FILL';

  const avatarSet = page0.findOne(n => n.name === 'Avatar' && (n.type === 'COMPONENT' || n.type === 'COMPONENT_SET'));
  if (avatarSet) {
    const av = (avatarSet.type === 'COMPONENT_SET' ? avatarSet.children[0] : avatarSet).createInstance();
    who.appendChild(av);
  }
  const whoText = frame('Name and role', 'VERTICAL');
  whoText.itemSpacing = 2;
  who.appendChild(whoText);
  whoText.layoutSizingHorizontal = 'FILL';
  const nm = await T('Mark Sullivan', 'Label/Large Strong', 'textPrimary', INTER_SB);
  whoText.appendChild(nm); nm.layoutSizingHorizontal = 'FILL';
  const rl = await T(role === 'Player' ? 'Player, Riverside FC' : 'Manager, Northgate Athletic', 'Body/Small', 'textSecondary');
  whoText.appendChild(rl); rl.layoutSizingHorizontal = 'FILL';

  const d1 = divider(); c.appendChild(d1); d1.layoutSizingHorizontal = 'FILL';

  const rows = ROWS_BASE.slice();
  if (role === 'Player') rows.splice(2, 0, ['Scouts near you', 'pin']);
  for (const [label, ik] of rows) {
    const r = await rowInstance(label, ik, false);
    c.appendChild(r);
    r.layoutSizingHorizontal = 'FILL';
  }

  const d2 = divider(); c.appendChild(d2); d2.layoutSizingHorizontal = 'FILL';

  const out = await rowInstance('Log out', 'logout', false);
  c.appendChild(out); out.layoutSizingHorizontal = 'FILL';
  const del = await rowInstance('Delete account', 'trash', true);
  c.appendChild(del); del.layoutSizingHorizontal = 'FILL';

  return c;
}

await step('Account menu yeniden kuruldu', async () => {
  const old = page0.findOne(n => n.name === 'Account menu' && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
  if (old) { old.remove(); report.info['eski Account menu silindi'] = true; }

  const comps = [];
  for (const device of ['Desktop', 'Mobile']) {
    for (const role of ['Other', 'Player']) {
      const c = await buildMenu(device, role);
      page0.appendChild(c);
      comps.push(c);
    }
  }
  menuSet = figma.combineAsVariants(comps, page0);
  menuSet.name = 'Account menu';
  menuSet.layoutMode = 'HORIZONTAL';
  menuSet.primaryAxisSizingMode = 'AUTO';
  menuSet.counterAxisSizingMode = 'AUTO';
  menuSet.counterAxisAlignItems = 'MIN';
  menuSet.itemSpacing = 40;
  menuSet.paddingLeft = 24; menuSet.paddingRight = 24; menuSet.paddingTop = 24; menuSet.paddingBottom = 24;
  menuSet.description = 'Account menu that opens from the avatar in the logged in header. Rows are instances of Menu row, so hover is a component state, not a copy. Structure follows the spec: account, events, contacts, settings, support, then log out and delete account. Scouts near you only shows for players.';
  report.info['Account menu'] = menuSet.children.map(c => c.name);
});

// --- 4) Section'a tasi ve duzeni onar
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

await step('Section yerlesimi', async () => {
  const section = page0.findOne(n => n.type === 'SECTION' && /Navigation/.test(n.name));
  if (!section) { throw new Error('Navigation Section bulunamadi'); }
  for (const n of [iconSet, rowSet, menuSet]) if (n) section.appendChild(n);
  relayout(section);
  report.info['Section'] = { ad: section.name, w: Math.round(section.width), h: Math.round(section.height) };
});

// --- 5) cakisma taramasi
await step('Cakisma kontrolu', async () => {
  const secs = page0.children.filter(n => n.type === 'SECTION');
  const boxes = secs.map(s => ({ ad: s.name, b: s.absoluteBoundingBox }));
  const hits = [];
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i].b, b = boxes[j].b;
    if (!a || !b) continue;
    if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height)
      hits.push(boxes[i].ad + ' <-> ' + boxes[j].ad);
  }
  report.info['Section cakismasi'] = hits.length ? hits : 'yok';
});

return report;
