// step 75 · M2 parca 1: Account menu component'i (Device x Role, 4 varyant)

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const page = re => figma.root.children.find(p => re.test(p.name));
const page0 = page(/^01/), pageHome = page(/^02/);
for (const p of [page0, pageHome]) { if (p) await p.loadAsync(); }

// --- degiskenler (ID ile)
const V = {};
for (const [k, id] of Object.entries({
  surface: '1:29', subtle: '1:30', brandSubtle: '1:34',
  textPrimary: '1:38', textSecondary: '1:39', textDanger: '1:44',
  iconDefault: '1:45', iconBrand: '1:46', border: '1:48',
  rMd: '1:62', rLg: '1:63',
  s2xs: '1:52', sXs: '1:53', sSm: '1:54', sMd: '1:55', sLg: '1:56'
})) V[k] = await figma.variables.getVariableByIdAsync('VariableID:' + id);

const paint = k => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', V[k]);
const radius = (n, k) => { for (const c of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) n.setBoundVariable(c, V[k]); };

// --- stiller
const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s.id;
const ES = {}; for (const s of await figma.getLocalEffectStylesAsync()) ES[s.name] = s.id;
report.info['effect styles'] = Object.keys(ES);

const fonts = await figma.listAvailableFontsAsync();
const findFont = (family, styles) => {
  for (const s of styles) if (fonts.some(f => f.fontName.family === family && f.fontName.style === s)) return { family, style: s };
  return null;
};
const INTER_R = findFont('Inter', ['Regular']);
const INTER_M = findFont('Inter', ['Medium']);
const INTER_SB = findFont('Inter', ['Semi Bold', 'SemiBold']);
for (const f of [INTER_R, INTER_M, INTER_SB]) if (f) await figma.loadFontAsync(f);

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

function icon(svg, colorKey) {
  const n = figma.createNodeFromSvg(svg);
  n.name = 'Icon';
  n.fills = [];
  for (const v of n.findAll(x => x.type === 'VECTOR' || x.type === 'ELLIPSE' || x.type === 'RECTANGLE')) {
    if (v.strokes && v.strokes.length) v.strokes = [paint(colorKey)];
    if (v.fills && v.fills.length) v.fills = [paint(colorKey)];
  }
  return n;
}

// --- menu satiri
async function menuRow(label, iconKey, width, danger) {
  const row = frame('Row · ' + label, 'HORIZONTAL');
  row.counterAxisAlignItems = 'CENTER';
  row.itemSpacing = 12;
  row.paddingLeft = 12; row.paddingRight = 12; row.paddingTop = 10; row.paddingBottom = 10;
  row.layoutSizingHorizontal = 'FIXED';
  row.resize(width, 44);
  radius(row, 'rMd');
  const ic = icon(ICON[iconKey], danger ? 'textDanger' : 'iconDefault');
  row.appendChild(ic);
  const t = await T(label, 'Body/Default', danger ? 'textDanger' : 'textPrimary');
  row.appendChild(t);
  t.layoutSizingHorizontal = 'FILL';
  return row;
}

function divider(width) {
  const d = figma.createRectangle();
  d.name = 'Divider';
  d.resize(width, 1);
  d.fills = [paint('border')];
  return d;
}

const ROWS_BASE = [
  ['Edit account', 'user'],
  ['Change password', 'lock'],
  ['My events', 'calendar'],
  ['My contacts', 'users'],
  ['Settings', 'settings'],
  ['Support', 'help']
];

async function buildMenu(device, role) {
  const width = device === 'Desktop' ? 280 : 358;
  const inner = width - 16;
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

  // kullanici satiri
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

  const d1 = divider(inner); c.appendChild(d1); d1.layoutSizingHorizontal = 'FILL';

  const rows = ROWS_BASE.slice();
  if (role === 'Player') rows.splice(2, 0, ['Scouts near you', 'pin']);
  for (const [label, ik] of rows) {
    const r = await menuRow(label, ik, inner, false);
    c.appendChild(r);
    r.layoutSizingHorizontal = 'FILL';
  }

  const d2 = divider(inner); c.appendChild(d2); d2.layoutSizingHorizontal = 'FILL';

  const out = await menuRow('Log out', 'logout', inner, false);
  c.appendChild(out); out.layoutSizingHorizontal = 'FILL';
  const del = await menuRow('Delete account', 'trash', inner, true);
  c.appendChild(del); del.layoutSizingHorizontal = 'FILL';

  return c;
}

let menuSet = null;

await step('Account menu component', async () => {
  // eski set varsa sil (script tekrar calistirilabilir olsun)
  const old = page0.findOne(n => n.name === 'Account menu' && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
  if (old) { report.info['eski set silindi'] = true; old.remove(); }

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
  menuSet.description = 'Account menu that opens from the avatar in the logged in header. Structure follows the spec: account, events, contacts, settings, support, then log out and delete account. Scouts near you only shows for players.';
  report.info['Account menu'] = { id: menuSet.id, varyant: menuSet.children.map(c => c.name) };
});

// --- Section 1 · Navigation icine tasi, Section'i sigdir
await step('Section yerlesimi', async () => {
  if (!menuSet) throw new Error('set kurulamadi');
  const section = page0.findOne(n => n.type === 'SECTION' && /Navigation/.test(n.name));
  if (!section) { report.errors.push('Navigation Section bulunamadi, set sayfa kokunde kaldi'); return; }

  // Section icindeki en alt noktayi bul
  let maxY = -Infinity, minX = Infinity;
  for (const ch of section.children) {
    const b = ch.absoluteBoundingBox;
    if (!b) continue;
    if (b.y + b.height > maxY) maxY = b.y + b.height;
    if (b.x < minX) minX = b.x;
  }
  const sb = section.absoluteBoundingBox;
  if (!isFinite(maxY)) { maxY = sb.y + 80; minX = sb.x + 40; }

  section.appendChild(menuSet);
  menuSet.x = minX;
  menuSet.y = maxY + 120;

  // Section'i icerige gore buyut
  let bottom = -Infinity, right = -Infinity;
  for (const ch of section.children) {
    const b = ch.absoluteBoundingBox;
    if (!b) continue;
    if (b.y + b.height > bottom) bottom = b.y + b.height;
    if (b.x + b.width > right) right = b.x + b.width;
  }
  section.resizeWithoutConstraints(
    Math.max(section.width, Math.ceil(right - sb.x + 80)),
    Math.ceil(bottom - sb.y + 80)
  );
  report.info['Section'] = { ad: section.name, w: Math.round(section.width), h: Math.round(section.height) };
});

return report;
