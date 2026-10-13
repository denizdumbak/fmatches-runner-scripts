// step 63 · Ticker: ust uste binme + metin kirilmasi + tasan ogeyi duzelt
const out = { steps: [], errors: [], info: [] };

const VAR = { textPrimary: '1:38', textSecondary: '1:39' };
const STYLE = {
  labelSmall: 'S:6643355740b2629409d37698be89121d16c2ec96,',
  eyebrow:    'S:ab352e24d4e998a5e455b3aa8dbbc007bd9fbf28,'
};
const EVENTS = {
  Manager: { label: 'UPCOMING TOURNAMENTS', items: [
    ['Riverside Invitational', '17–25 Oct'],
    ['Northgate Youth Cup', '23–25 Oct'],
    ['Coastal Spring Trophy', '2–6 Nov']
  ]},
  Player: { label: 'UPCOMING TRIALS', items: [
    ['Riverside FC U21 trial', '18 Oct'],
    ['Northgate Athletic trial', '24 Oct'],
    ['Coastal United keeper trial', '1 Nov']
  ]}
};
const COUNT = { Desktop: 3, Mobile: 1 };
const GAP = 120;

async function step(name, fn) {
  try { const r = await fn(); out.steps.push({ name, done: true, result: r }); return r; }
  catch (e) { out.errors.push({ name, error: String(e && e.message ? e.message : e) }); return null; }
}

const varCache = {};
async function getVar(id) {
  if (!varCache[id]) varCache[id] = await figma.variables.getVariableByIdAsync('VariableID:' + id);
  return varCache[id];
}
async function paint(node, varId) {
  const v = await getVar(varId);
  node.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v)];
}
async function loadFontsOf(node) {
  const len = node.characters.length;
  const fonts = len > 0 ? node.getRangeAllFontNames(0, len) : [node.fontName];
  for (const f of fonts) if (f && f.family) await figma.loadFontAsync(f);
}

let TEMPLATE = null;
async function makeText(parent, name, chars, styleId, colorVar) {
  const t = TEMPLATE.clone();
  await loadFontsOf(t);
  t.name = name;
  t.characters = chars;
  await t.setTextStyleIdAsync(styleId);
  await paint(t, colorVar);
  parent.appendChild(t);
  // auto layout icindeyken kirilmayi onlemek icin once HUG, sonra autoresize
  t.layoutSizingHorizontal = 'HUG';
  t.layoutSizingVertical = 'HUG';
  t.textAutoResize = 'WIDTH_AND_HEIGHT';
  return t;
}

const tickerInfo = await step('Ticker set bul', async () => {
  const p = figma.root.children.find(n => /^01/.test(n.name));
  await p.loadAsync();
  const set = p.children.find(n => n.name === 'Ticker' && n.type === 'COMPONENT_SET')
           || p.findOne(n => n.name === 'Ticker' && n.type === 'COMPONENT_SET');
  if (!set) throw new Error('Ticker set yok');
  const anyText = set.findOne(n => n.type === 'TEXT');
  TEMPLATE = anyText.clone();
  figma.currentPage.appendChild(TEMPLATE);
  return { id: set.id, variants: set.children.length };
});

await step('etkinlik varyantlarini yeniden kur', async () => {
  const set = await figma.getNodeByIdAsync(tickerInfo.id);
  const fixed = [];
  for (const comp of set.children) {
    const m = /Device=(\w+), Role=(\w+)/.exec(comp.name);
    if (!m) continue;
    const dev = m[1], role = m[2];
    if (!EVENTS[role]) continue;

    for (const c of [...comp.children]) if (c.name !== 'Live dot') c.remove();

    await makeText(comp, 'Ticker label', EVENTS[role].label, STYLE.eyebrow, VAR.textPrimary);

    const row = figma.createFrame();
    row.name = 'Ticker items';
    row.layoutMode = 'HORIZONTAL';
    row.itemSpacing = dev === 'Desktop' ? 32 : 16;
    row.counterAxisAlignItems = 'CENTER';
    row.fills = [];
    row.clipsContent = true;
    comp.appendChild(row);
    row.layoutSizingHorizontal = 'FILL';
    row.layoutSizingVertical = 'HUG';

    for (const [name, date] of EVENTS[role].items.slice(0, COUNT[dev])) {
      const item = figma.createFrame();
      item.name = 'Ticker item';
      item.layoutMode = 'HORIZONTAL';
      item.itemSpacing = 6;
      item.counterAxisAlignItems = 'CENTER';
      item.fills = [];
      item.clipsContent = false;
      row.appendChild(item);
      item.layoutSizingHorizontal = 'HUG';
      item.layoutSizingVertical = 'HUG';
      await makeText(item, 'Event name', name, STYLE.labelSmall, VAR.textPrimary);
      await makeText(item, 'Event date', date, STYLE.labelSmall, VAR.textSecondary);
    }
    fixed.push(comp.name + ' (' + COUNT[dev] + ' oge)');
  }
  return fixed;
});

await step('Section icinde yeniden dizme', async () => {
  const set = await figma.getNodeByIdAsync(tickerInfo.id);
  const section = set.parent;
  const bottom = set.y + set.height;
  const below = section.children.filter(n => n.id !== set.id && n.y > set.y).sort((a, b) => a.y - b.y);
  if (!below.length) return { note: 'Ticker sonuncu, kaydirma gerekmedi', section: section.name };
  const delta = (bottom + GAP) - below[0].y;
  if (delta <= 0) return { note: 'binme yok', section: section.name, bosluk: Math.round(below[0].y - bottom) };
  for (const n of below) n.y = n.y + delta;
  return { section: section.name, tickerYuksekligi: Math.round(set.height), kaydirilan: below.map(n => n.name), delta: Math.round(delta) };
});

await step('binme kontrolu', async () => {
  const p = figma.root.children.find(n => /^01/.test(n.name));
  const problems = [];
  const containers = [p, ...p.children.filter(n => 'children' in n)];
  for (const c of containers) {
    const kids = [...c.children].filter(n => 'y' in n && 'height' in n).sort((a, b) => a.y - b.y);
    for (let i = 0; i < kids.length - 1; i++) {
      const a = kids[i], b = kids[i + 1];
      if ((a.y + a.height) > b.y + 1 && a.x < b.x + b.width && b.x < a.x + a.width) {
        problems.push({ kapsayici: c.name, ust: a.name, alt: b.name, binme: Math.round(a.y + a.height - b.y) });
      }
    }
  }
  return problems.length ? problems : 'binme yok';
});

await step('tasma kontrolu', async () => {
  const set = await figma.getNodeByIdAsync(tickerInfo.id);
  const report = [];
  for (const comp of set.children) {
    const row = comp.children.find(c => c.name === 'Ticker items');
    if (!row) continue;
    let used = 0;
    row.children.forEach((it, i) => { used += it.width + (i ? row.itemSpacing : 0); });
    report.push({ variant: comp.name, satirGenisligi: Math.round(row.width), icerik: Math.round(used), sigdi: used <= row.width + 0.5 });
  }
  return report;
});

if (TEMPLATE) TEMPLATE.remove();
return out;
