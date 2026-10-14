// step 91 · M5 Calendar view: gun hucresi component'i + masaustu ve mobil ekran

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const pageOf = re => figma.root.children.find(p => re.test(p.name));
const page0 = pageOf(/^01/), pageHome = pageOf(/^02/);
for (const p of [page0, pageHome]) { if (p) await p.loadAsync(); }

// --- degiskenler isimle
const allVars = await figma.variables.getLocalVariablesAsync();
const pick = (...pats) => { for (const p of pats) { const h = allVars.find(v => new RegExp(p, 'i').test(v.name)); if (h) return h; } return null; };
const V = {
  canvas: pick('bg/canvas$'), surface: pick('bg/surface$'), subtle: pick('bg/subtle$'),
  brand: pick('bg/brand$'), brandSubtle: pick('bg/brand-subtle$'), inverse: pick('bg/inverse$'),
  tPrimary: pick('text/primary$'), tSecondary: pick('text/secondary$'), tInverse: pick('text/inverse$'),
  border: pick('border/default$', 'border$'),
  rMd: pick('radius/md$'), rLg: pick('radius/lg$'), rFull: pick('radius/full$')
};
const missing = Object.keys(V).filter(k => !V[k]);
if (missing.length) report.info['bulunamayan degiskenler'] = missing;

const P = k => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', V[k]);
const R = (n, k) => { if (!V[k]) return; for (const c of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius']) n.setBoundVariable(c, V[k]); };

const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s.id;
const fonts = await figma.listAvailableFontsAsync();
const ff = (fam, sty) => { for (const s of sty) if (fonts.some(f => f.fontName.family === fam && f.fontName.style === s)) return { family: fam, style: s }; return null; };
const INTER_R = ff('Inter', ['Regular']);
const INTER_SB = ff('Inter', ['Semi Bold', 'SemiBold']) || INTER_R;
const BARLOW = ff('Barlow Condensed', ['SemiBold', 'Semi Bold']) || INTER_SB;
for (const f of [INTER_R, INTER_SB, BARLOW]) if (f) await figma.loadFontAsync(f);

async function T(chars, style, colorKey, font) {
  const t = figma.createText();
  t.fontName = font || INTER_R;
  t.characters = chars;
  if (TS[style]) await t.setTextStyleIdAsync(TS[style]);
  if (V[colorKey]) t.fills = [P(colorKey)];
  t.name = chars.slice(0, 32);
  t.textAutoResize = 'WIDTH_AND_HEIGHT';
  return t;
}
function F(name, dir) {
  const f = figma.createFrame();
  f.name = name; f.fills = []; f.clipsContent = false;
  if (dir) { f.layoutMode = dir; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; }
  return f;
}
const findComp = nm => page0.findOne(n => n.name === nm && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
const vOf = (set, re) => { if (!set) return null; if (set.type === 'COMPONENT') return set; return set.children.find(c => re.test(c.name)) || set.children[0]; };

// ============ 1) Calendar day component ============
let daySet = null;
const CELL = { Desktop: { w: 176, h: 112, pad: 12, num: 'Label/Default Strong', dot: 6 },
               Mobile:  { w: 46,  h: 56,  pad: 6,  num: 'Label/Small', dot: 5 } };

async function buildDay(device, state) {
  const d = CELL[device];
  const c = figma.createComponent();
  c.name = 'Device=' + device + ', State=' + state;
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'FIXED';
  c.counterAxisSizingMode = 'FIXED';
  c.resize(d.w, d.h);
  c.itemSpacing = 6;
  c.paddingLeft = d.pad; c.paddingRight = d.pad; c.paddingTop = d.pad; c.paddingBottom = d.pad;
  c.primaryAxisAlignItems = 'MIN';
  c.counterAxisAlignItems = 'MIN';
  c.clipsContent = true;
  R(c, 'rMd');

  if (state === 'Selected') c.fills = [P('brand')];
  else if (state === 'Today') { c.fills = []; c.strokes = [P('brand')]; c.strokeWeight = 1.5; }
  else c.fills = [];

  const numColor = state === 'Selected' ? 'tInverse' : (state === 'Muted' ? 'tSecondary' : 'tPrimary');
  const num = await T('1', d.num, numColor, state === 'Muted' ? INTER_R : INTER_SB);
  num.name = 'Day';
  c.appendChild(num);

  const ev = F('Events', 'HORIZONTAL');
  ev.counterAxisAlignItems = 'CENTER';
  ev.itemSpacing = 6;
  c.appendChild(ev);

  const dot = figma.createEllipse();
  dot.name = 'Dot';
  dot.resize(d.dot, d.dot);
  dot.fills = [P(state === 'Selected' ? 'tInverse' : 'brand')];
  ev.appendChild(dot);

  if (device === 'Desktop') {
    const cnt = await T('2 events', 'Label/Small', state === 'Selected' ? 'tInverse' : 'tSecondary');
    cnt.name = 'Count';
    ev.appendChild(cnt);
  }
  ev.visible = state !== 'Muted';
  return c;
}

await step('Calendar day component', async () => {
  const old = findComp('Calendar day');
  if (old) old.remove();
  const comps = [];
  for (const dev of ['Desktop', 'Mobile'])
    for (const st of ['Default', 'Today', 'Selected', 'Muted'])
      { const c = await buildDay(dev, st); page0.appendChild(c); comps.push(c); }
  daySet = figma.combineAsVariants(comps, page0);
  daySet.name = 'Calendar day';
  daySet.layoutMode = 'HORIZONTAL';
  daySet.primaryAxisSizingMode = 'AUTO';
  daySet.counterAxisSizingMode = 'AUTO';
  daySet.counterAxisAlignItems = 'CENTER';
  daySet.itemSpacing = 24;
  daySet.paddingLeft = 24; daySet.paddingRight = 24; daySet.paddingTop = 24; daySet.paddingBottom = 24;
  daySet.fills = [P('surface')];
  daySet.description = 'One day in the month grid. Today is outlined, the selected day is filled with the brand colour. A green dot means the day has events; the type is handled by the filter chips, not by colour.';
  report.info['Calendar day'] = daySet.children.map(c => c.name);
});

// ============ 2) sayfa ============
let pageCal = pageOf(/^04/);
await step('Sayfa 04 hazir', async () => {
  if (!pageCal) { pageCal = figma.createPage(); pageCal.name = '04 · Events calendar'; }
  await pageCal.loadAsync();
  for (const ch of pageCal.children.slice()) ch.remove();
  report.info['sayfa'] = pageCal.name;
});

// ============ 3) yardimcilar ============
const MONTH = [
  { d: 28, mut: true }, { d: 29, mut: true }, { d: 30, mut: true },
  { d: 1 }, { d: 2 }, { d: 3, ev: 1 }, { d: 4 },
  { d: 5 }, { d: 6 }, { d: 7 }, { d: 8, ev: 2 }, { d: 9 }, { d: 10 }, { d: 11, ev: 1 },
  { d: 12 }, { d: 13 }, { d: 14, ev: 2, today: true }, { d: 15 }, { d: 16 }, { d: 17, ev: 3, sel: true }, { d: 18 },
  { d: 19 }, { d: 20 }, { d: 21, ev: 1 }, { d: 22 }, { d: 23 }, { d: 24, ev: 2 }, { d: 25 },
  { d: 26 }, { d: 27 }, { d: 28 }, { d: 29, ev: 1 }, { d: 30 }, { d: 31 }, { d: 1, mut: true }
];
const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

async function dayInstance(device, info) {
  const st = info.mut ? 'Muted' : (info.sel ? 'Selected' : (info.today ? 'Today' : 'Default'));
  const base = vOf(daySet, new RegExp('Device=' + device + ', State=' + st));
  const inst = base.createInstance();
  inst.name = 'Day ' + info.d;
  const num = inst.findOne(n => n.type === 'TEXT' && n.name === 'Day');
  if (num) { await figma.loadFontAsync(num.fontName); num.characters = String(info.d); }
  const ev = inst.findOne(n => n.name === 'Events');
  if (ev) {
    ev.visible = !!info.ev && !info.mut;
    const cnt = inst.findOne(n => n.type === 'TEXT' && n.name === 'Count');
    if (cnt && info.ev) { await figma.loadFontAsync(cnt.fontName); cnt.characters = info.ev === 1 ? '1 event' : info.ev + ' events'; }
  }
  return inst;
}

function cloneFromHome(nameRe, deviceRe) {
  if (!pageHome) return null;
  const root = pageHome.children.find(n => deviceRe.test(n.name));
  if (!root) return null;
  const hit = root.findOne(n => nameRe.test(n.name));
  return hit ? hit.clone() : null;
}

async function monthNav(device) {
  const row = F('Month nav', 'HORIZONTAL');
  row.counterAxisAlignItems = 'CENTER';
  row.itemSpacing = device === 'Desktop' ? 16 : 12;
  const prev = F('Prev', 'HORIZONTAL');
  prev.resize(40, 40); prev.primaryAxisSizingMode = 'FIXED'; prev.counterAxisSizingMode = 'FIXED';
  prev.primaryAxisAlignItems = 'CENTER'; prev.counterAxisAlignItems = 'CENTER';
  prev.fills = [P('subtle')]; R(prev, 'rFull');
  const pt = await T('‹', 'Label/Default Strong', 'tPrimary', INTER_SB); prev.appendChild(pt);
  row.appendChild(prev);
  const title = await T('October 2026', device === 'Desktop' ? 'Heading/H3' : 'Heading/H4', 'tPrimary', BARLOW);
  title.name = 'Month';
  row.appendChild(title);
  const next = F('Next', 'HORIZONTAL');
  next.resize(40, 40); next.primaryAxisSizingMode = 'FIXED'; next.counterAxisSizingMode = 'FIXED';
  next.primaryAxisAlignItems = 'CENTER'; next.counterAxisAlignItems = 'CENTER';
  next.fills = [P('subtle')]; R(next, 'rFull');
  const nt = await T('›', 'Label/Default Strong', 'tPrimary', INTER_SB); next.appendChild(nt);
  row.appendChild(next);
  return row;
}

async function buildGrid(device) {
  const d = CELL[device];
  const gap = device === 'Desktop' ? 8 : 4;
  const wrap = F('Month grid', 'VERTICAL');
  wrap.itemSpacing = gap;

  const head = F('Weekdays', 'HORIZONTAL');
  head.itemSpacing = gap;
  wrap.appendChild(head);
  for (const w of WEEK) {
    const cell = F('Weekday', 'HORIZONTAL');
    cell.resize(d.w, 32);
    cell.primaryAxisSizingMode = 'FIXED'; cell.counterAxisSizingMode = 'FIXED';
    cell.primaryAxisAlignItems = device === 'Desktop' ? 'MIN' : 'CENTER';
    cell.counterAxisAlignItems = 'CENTER';
    cell.paddingLeft = device === 'Desktop' ? 12 : 0;
    const t = await T(device === 'Desktop' ? w : w[0], 'Label/Small', 'tSecondary');
    cell.appendChild(t);
    head.appendChild(cell);
  }

  for (let r = 0; r < 5; r++) {
    const row = F('Week ' + (r + 1), 'HORIZONTAL');
    row.itemSpacing = gap;
    wrap.appendChild(row);
    for (let c = 0; c < 7; c++) {
      const info = MONTH[r * 7 + c];
      if (!info) continue;
      row.appendChild(await dayInstance(device, info));
    }
  }
  return wrap;
}

async function buildScreen(device) {
  const W = device === 'Desktop' ? 1440 : 390;
  const PAD = device === 'Desktop' ? 80 : 16;
  const devRe = device === 'Desktop' ? /Desktop/ : /Mobile/;

  const screen = figma.createFrame();
  screen.name = 'Calendar · ' + device;
  screen.layoutMode = 'VERTICAL';
  screen.primaryAxisSizingMode = 'AUTO';
  screen.counterAxisSizingMode = 'FIXED';
  screen.resize(W, 100);
  screen.itemSpacing = 0;
  screen.fills = [P('canvas')];
  screen.clipsContent = true;
  pageCal.appendChild(screen);

  // ticker + header
  const tickerSet = findComp('Ticker');
  if (tickerSet) {
    const t = vOf(tickerSet, new RegExp('Device=' + device + '.*Role=Visitor 1')) || vOf(tickerSet, devRe);
    if (t) { const i = t.createInstance(); i.name = 'Ticker'; screen.appendChild(i); i.layoutSizingHorizontal = 'FILL'; }
  }
  const headerSet = findComp('Header');
  if (headerSet) {
    const h = vOf(headerSet, new RegExp('Device=' + device + '.*State=Logged in'));
    if (h) { const i = h.createInstance(); i.name = 'Header'; screen.appendChild(i); i.layoutSizingHorizontal = 'FILL'; }
  }

  // body
  const body = F('Body', 'VERTICAL');
  body.itemSpacing = device === 'Desktop' ? 32 : 24;
  body.paddingLeft = PAD; body.paddingRight = PAD;
  body.paddingTop = device === 'Desktop' ? 48 : 32;
  body.paddingBottom = device === 'Desktop' ? 64 : 40;
  screen.appendChild(body);
  body.layoutSizingHorizontal = 'FILL';

  // baslik satiri + view toggle
  const headRow = F('Heading row', device === 'Desktop' ? 'HORIZONTAL' : 'VERTICAL');
  headRow.itemSpacing = device === 'Desktop' ? 24 : 16;
  if (device === 'Desktop') { headRow.primaryAxisAlignItems = 'SPACE_BETWEEN'; headRow.counterAxisAlignItems = 'CENTER'; }
  body.appendChild(headRow); headRow.layoutSizingHorizontal = 'FILL';

  const titleWrap = F('Title', 'VERTICAL');
  titleWrap.itemSpacing = 8;
  headRow.appendChild(titleWrap);
  const h1 = await T('Events calendar', device === 'Desktop' ? 'Heading/H2' : 'Heading/H3', 'tPrimary', BARLOW);
  titleWrap.appendChild(h1);
  const sub = await T('Every match, tournament, trial and camp on the network, month by month.', 'Body/Default', 'tSecondary');
  titleWrap.appendChild(sub);
  if (device === 'Mobile') { titleWrap.layoutSizingHorizontal = 'FILL'; sub.layoutSizingHorizontal = 'FILL'; }

  const toggle = cloneFromHome(/View toggle/i, devRe);
  if (toggle) { toggle.name = 'View toggle'; headRow.appendChild(toggle); }
  else report.errors.push(device + ': View toggle kopyalanamadi');

  // filtre cipleri
  const filters = cloneFromHome(/Event filters/i, devRe);
  if (filters) { filters.name = 'Event filters'; body.appendChild(filters); filters.layoutSizingHorizontal = 'FILL'; }
  else report.errors.push(device + ': Event filters kopyalanamadi');

  // takvim karti
  const card = F('Calendar', 'VERTICAL');
  card.itemSpacing = device === 'Desktop' ? 24 : 16;
  card.paddingLeft = device === 'Desktop' ? 24 : 12;
  card.paddingRight = device === 'Desktop' ? 24 : 12;
  card.paddingTop = device === 'Desktop' ? 24 : 16;
  card.paddingBottom = device === 'Desktop' ? 24 : 16;
  card.fills = [P('surface')];
  card.strokes = [P('border')];
  card.strokeWeight = 1;
  R(card, 'rLg');
  body.appendChild(card); card.layoutSizingHorizontal = 'FILL';

  const nav = await monthNav(device);
  card.appendChild(nav);
  card.appendChild(await buildGrid(device));

  // secili gun
  const dayBlock = F('Selected day', 'VERTICAL');
  dayBlock.itemSpacing = device === 'Desktop' ? 16 : 12;
  body.appendChild(dayBlock); dayBlock.layoutSizingHorizontal = 'FILL';

  const dayTitle = await T('Saturday 17 October', device === 'Desktop' ? 'Heading/H3' : 'Heading/H4', 'tPrimary', BARLOW);
  dayBlock.appendChild(dayTitle);
  const dayNote = await T('3 events', 'Label/Small', 'tSecondary');
  dayBlock.appendChild(dayNote);

  const list = F('Event list', 'VERTICAL');
  list.itemSpacing = device === 'Desktop' ? 0 : 12;
  dayBlock.appendChild(list); list.layoutSizingHorizontal = 'FILL';

  const rowSet = findComp('Event row');
  if (rowSet) {
    const base = vOf(rowSet, new RegExp('Device=' + device + '.*State=Default')) || vOf(rowSet, devRe);
    for (let i = 0; i < 3; i++) {
      const inst = base.createInstance();
      inst.name = 'Event row ' + (i + 1);
      list.appendChild(inst);
      inst.layoutSizingHorizontal = 'FILL';
    }
  } else report.errors.push(device + ': Event row bulunamadi');

  // footer
  const footSet = findComp('Footer');
  if (footSet) {
    const f = vOf(footSet, devRe);
    if (f) { const i = f.createInstance(); i.name = 'Footer'; screen.appendChild(i); i.layoutSizingHorizontal = 'FILL'; }
  }
  return screen;
}

let dsk = null, mob = null;
await step('Masaustu ekran', async () => { dsk = await buildScreen('Desktop'); dsk.x = 0; dsk.y = 0;
  report.info['masaustu'] = Math.round(dsk.width) + 'x' + Math.round(dsk.height); });
await step('Mobil ekran', async () => { mob = await buildScreen('Mobile'); mob.x = 1600; mob.y = 0;
  report.info['mobil'] = Math.round(mob.width) + 'x' + Math.round(mob.height); });

await step('Start here karti', async () => {
  const card = F('Start here', 'VERTICAL');
  card.itemSpacing = 12;
  card.paddingLeft = 32; card.paddingRight = 32; card.paddingTop = 32; card.paddingBottom = 32;
  card.fills = [P('surface')];
  card.strokes = [P('border')]; card.strokeWeight = 1;
  R(card, 'rLg');
  card.resize(760, 100);
  pageCal.appendChild(card);
  card.x = 0; card.y = -300;
  const a = await T('START HERE', 'Label/Small', 'tSecondary');
  card.appendChild(a);
  const b = await T('Events calendar', 'Heading/H3', 'tPrimary', BARLOW);
  card.appendChild(b);
  const c = await T('The calendar view behind View calendar and the Events calendar menu item. Month on top, the selected day underneath, using the same filters and event rows as the home page.', 'Body/Default', 'tSecondary');
  card.appendChild(c); c.layoutSizingHorizontal = 'FILL';
});

await step('Section duzeni (01)', async () => {
  const section = page0.findOne(n => n.type === 'SECTION' && /Home page/.test(n.name)) ||
                  page0.findOne(n => n.type === 'SECTION' && /Navigation/.test(n.name));
  if (!section || !daySet) return;
  section.appendChild(daySet);
  const kids = section.children.slice();
  const texts = kids.filter(n => n.type === 'TEXT'), rest = kids.filter(n => n.type !== 'TEXT');
  const left = section.x + 80; let y = section.y + 80, prevText = false, first = true;
  for (const k of texts.concat(rest)) {
    const b = k.absoluteBoundingBox; if (!b) continue;
    const isT = k.type === 'TEXT';
    if (!first) y += (isT && prevText) ? 16 : 120;
    k.x += left - b.x; k.y += y - b.y; y += b.height; prevText = isT; first = false;
  }
  let right = -Infinity, bottom = -Infinity;
  for (const k of section.children) {
    const b = k.absoluteBoundingBox; if (!b) continue;
    if (b.x + b.width > right) right = b.x + b.width;
    if (b.y + b.height > bottom) bottom = b.y + b.height;
  }
  section.resizeWithoutConstraints(Math.ceil(right - section.x + 80), Math.ceil(bottom - section.y + 80));
  report.info['Section'] = section.name + ' ' + Math.round(section.width) + 'x' + Math.round(section.height);
});

return report;
