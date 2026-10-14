// step 92 · M5 yeniden: takvim gorunumu ana sayfanin icinde, toggle ile gecis

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const pageOf = re => figma.root.children.find(p => re.test(p.name));
const page0 = pageOf(/^01/), pageHome = pageOf(/^02/);
for (const p of [page0, pageHome]) { if (p) await p.loadAsync(); }

const allVars = await figma.variables.getLocalVariablesAsync();
const pick = (...pats) => { for (const p of pats) { const h = allVars.find(v => new RegExp(p, 'i').test(v.name)); if (h) return h; } return null; };
const V = {
  surface: pick('bg/surface$'), subtle: pick('bg/subtle$'), brand: pick('bg/brand$'),
  tPrimary: pick('text/primary$'), tSecondary: pick('text/secondary$'), tInverse: pick('text/inverse$'),
  border: pick('border/default$', 'border$'),
  rMd: pick('radius/md$'), rLg: pick('radius/lg$'), rFull: pick('radius/full$')
};
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

// --- 04 sekmesini sil
await step('04 sekmesi silindi', async () => {
  const p4 = pageOf(/^04/);
  if (!p4) { report.info['04'] = 'zaten yok'; return; }
  await p4.loadAsync();
  if (figma.currentPage === p4) await figma.setCurrentPageAsync(pageHome);
  p4.remove();
  report.info['04'] = 'silindi';
});

const daySet = findComp('Calendar day');
const CELL = { Desktop: { w: 176, h: 112 }, Mobile: { w: 46, h: 56 } };
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

async function monthNav(device) {
  const row = F('Month nav', 'HORIZONTAL');
  row.counterAxisAlignItems = 'CENTER';
  row.itemSpacing = device === 'Desktop' ? 16 : 12;
  for (const [nm, ch] of [['Prev', '‹'], ['Month', null], ['Next', '›']]) {
    if (nm === 'Month') {
      const t = await T('October 2026', device === 'Desktop' ? 'Heading/H3' : 'Heading/H4', 'tPrimary', BARLOW);
      t.name = 'Month'; row.appendChild(t); continue;
    }
    const b = F(nm, 'HORIZONTAL');
    b.resize(40, 40); b.primaryAxisSizingMode = 'FIXED'; b.counterAxisSizingMode = 'FIXED';
    b.primaryAxisAlignItems = 'CENTER'; b.counterAxisAlignItems = 'CENTER';
    b.fills = [P('subtle')]; R(b, 'rFull');
    b.appendChild(await T(ch, 'Label/Default Strong', 'tPrimary', INTER_SB));
    row.appendChild(b);
  }
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
    cell.appendChild(await T(device === 'Desktop' ? w : w[0], 'Label/Small', 'tSecondary'));
    head.appendChild(cell);
  }
  for (let r = 0; r < 5; r++) {
    const row = F('Week ' + (r + 1), 'HORIZONTAL');
    row.itemSpacing = gap;
    wrap.appendChild(row);
    for (let c = 0; c < 7; c++) {
      const info = MONTH[r * 7 + c];
      if (info) row.appendChild(await dayInstance(device, info));
    }
  }
  return wrap;
}

// --- toggle aktif segmentini degistir (gercek degerleri takas ederek)
function swapToggle(toggle) {
  if (!toggle) return 'toggle yok';
  const segs = toggle.children.filter(c => c.type === 'FRAME' || c.type === 'INSTANCE' || c.type === 'COMPONENT');
  if (segs.length < 2) return 'segment sayisi ' + segs.length;
  const a = segs[0], b = segs[1];
  const aFills = a.fills === figma.mixed ? null : JSON.parse(JSON.stringify(a.fills));
  const bFills = b.fills === figma.mixed ? null : JSON.parse(JSON.stringify(b.fills));
  if (aFills && bFills) { a.fills = bFills; b.fills = aFills; }
  const at = a.findOne(n => n.type === 'TEXT'), bt = b.findOne(n => n.type === 'TEXT');
  if (at && bt && at.fills !== figma.mixed && bt.fills !== figma.mixed) {
    const af = JSON.parse(JSON.stringify(at.fills)), bf = JSON.parse(JSON.stringify(bt.fills));
    at.fills = bf; bt.fills = af;
  }
  return 'takas edildi: ' + a.name + ' <-> ' + b.name;
}

async function makeCalendarVersion(device) {
  const src = pageHome.children.find(n => n.type === 'FRAME' && new RegExp('^Home . ' + device + '$').test(n.name))
           || pageHome.children.find(n => n.type === 'FRAME' && new RegExp(device).test(n.name) && /Home/.test(n.name));
  if (!src) throw new Error(device + ': kaynak Home frame bulunamadi');

  const old = pageHome.children.find(n => n.name === 'Home · ' + device + ' · calendar view');
  if (old) old.remove();

  const copy = src.clone();
  copy.name = 'Home · ' + device + ' · calendar view';
  pageHome.appendChild(copy);
  const sb = src.absoluteBoundingBox;
  copy.x = sb.x + sb.width + 240;
  copy.y = sb.y;

  const block = copy.findOne(n => /Upcoming events/i.test(n.name) && (n.type === 'FRAME' || n.type === 'INSTANCE'));
  if (!block) throw new Error(device + ': Upcoming events blogu bulunamadi');

  const toggle = block.findOne(n => /View toggle/i.test(n.name));
  report.info[device + ' toggle'] = swapToggle(toggle);

  const list = block.findOne(n => /Event list/i.test(n.name));
  if (!list) throw new Error(device + ': Event list bulunamadi');
  const idx = list.parent.children.indexOf(list);
  const parent = list.parent;

  // takvim karti
  const card = F('Calendar', 'VERTICAL');
  card.itemSpacing = device === 'Desktop' ? 24 : 16;
  const cp = device === 'Desktop' ? 24 : 12;
  card.paddingLeft = cp; card.paddingRight = cp; card.paddingTop = cp; card.paddingBottom = cp;
  card.fills = [P('surface')];
  card.strokes = [P('border')]; card.strokeWeight = 1;
  R(card, 'rLg');
  parent.insertChild(idx, card);
  card.layoutSizingHorizontal = 'FILL';
  card.appendChild(await monthNav(device));
  card.appendChild(await buildGrid(device));

  // secili gun
  const dayBlock = F('Selected day', 'VERTICAL');
  dayBlock.itemSpacing = device === 'Desktop' ? 16 : 12;
  parent.insertChild(idx + 1, dayBlock);
  dayBlock.layoutSizingHorizontal = 'FILL';
  dayBlock.appendChild(await T('Saturday 17 October', device === 'Desktop' ? 'Heading/H3' : 'Heading/H4', 'tPrimary', BARLOW));
  dayBlock.appendChild(await T('3 events', 'Label/Small', 'tSecondary'));

  const newList = F('Event list', 'VERTICAL');
  newList.itemSpacing = device === 'Desktop' ? 0 : 12;
  dayBlock.appendChild(newList);
  newList.layoutSizingHorizontal = 'FILL';

  const rowSet = findComp('Event row');
  if (rowSet) {
    const base = vOf(rowSet, new RegExp('Device=' + device + '.*State=Default')) || vOf(rowSet, new RegExp(device));
    for (let i = 0; i < 3; i++) {
      const inst = base.createInstance();
      inst.name = 'Event row ' + (i + 1);
      newList.appendChild(inst);
      inst.layoutSizingHorizontal = 'FILL';
    }
  }
  list.remove();
  return { src: src, copy: copy, srcToggle: src.findOne(n => /View toggle/i.test(n.name)), copyToggle: toggle };
}

const pairs = {};
await step('Masaustu takvim surumu', async () => { pairs.Desktop = await makeCalendarVersion('Desktop');
  report.info['masaustu'] = Math.round(pairs.Desktop.copy.width) + 'x' + Math.round(pairs.Desktop.copy.height); });
await step('Mobil takvim surumu', async () => { pairs.Mobile = await makeCalendarVersion('Mobile');
  report.info['mobil'] = Math.round(pairs.Mobile.copy.width) + 'x' + Math.round(pairs.Mobile.copy.height); });

await step('Prototip baglantilari', async () => {
  const out = [];
  for (const dev of ['Desktop', 'Mobile']) {
    const p = pairs[dev];
    if (!p) continue;
    const link = async (node, destId, note) => {
      if (!node) { out.push(dev + ': ' + note + ' yok'); return; }
      await node.setReactionsAsync([{
        trigger: { type: 'ON_CLICK' },
        actions: [{ type: 'NODE', destinationId: destId, navigation: 'NAVIGATE',
          transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 },
          preserveScrollPosition: true }]
      }]);
      out.push(dev + ': ' + note + ' baglandi');
    };
    await link(p.srcToggle, p.copy.id, 'liste -> takvim');
    await link(p.copyToggle, p.src.id, 'takvim -> liste');
  }
  report.info['prototip'] = out;
});

return report;
