// step 61 · M1 Ticker rol varyantlari (6 rol x 2 cihaz) + M6 footer sosyal medya
const out = { steps: [], errors: [], info: [] };

const VAR = { bgSubtle:'1:30', accent:'1:35', textPrimary:'1:38', textSecondary:'1:39' };
const STYLE = {
  labelSmall: 'S:6643355740b2629409d37698be89121d16c2ec96,',
  eyebrow:    'S:ab352e24d4e998a5e455b3aa8dbbc007bd9fbf28,',
  bodySmall:  'S:ea9dd88a660a659c42b2b3dc3e84dfe226fc2179,',
  labelStrong:'S:3db4fc217cc3dc57a2419c10fa077eb3f744478e,'
};

const TEXTS = {
  'Visitor 1': 'FriendlyMatches International, the global football platform: create a verified profile, find players and clubs, book friendly matches and tournaments, chat directly with scouts and agents. Join for free!',
  'Visitor 2': 'FriendlyMatches International connects the football world: search players, clubs, tournaments and scouts in one database. Send match and trial requests, use built-in messenger. For pros and amateurs alike.',
  'Visitor 3': 'FriendlyMatches International, your key to global football: profiles, search, match bookings and direct messaging. Sign up for free today!',
  'Member':    'FriendlyMatches International connects the football world: search players, clubs, tournaments and scouts in one database. Send match and trial requests, use built-in messenger. For pros and amateurs alike.'
};

const EVENTS = {
  Manager: { label: 'UPCOMING TOURNAMENTS', items: [
    ['Riverside Invitational', '17–25 Oct'],
    ['Northgate Youth Cup', '23–25 Oct'],
    ['Coastal Spring Trophy', '2–6 Nov'],
    ['Harbour City Masters', '9–12 Nov']
  ]},
  Player: { label: 'UPCOMING TRIALS', items: [
    ['Riverside FC U21 trial', '18 Oct'],
    ['Northgate Athletic open trial', '24 Oct'],
    ['Coastal United keeper trial', '1 Nov'],
    ['Harbour City U19 trial', '7 Nov']
  ]}
};

const ROLES = ['Visitor 1','Visitor 2','Visitor 3','Manager','Player','Member'];
const DEVICES = ['Desktop','Mobile'];

const CAPTIONS = {
  'Visitor 1':'Signed out · message 1 of 3 (cycles)',
  'Visitor 2':'Signed out · message 2 of 3 (cycles)',
  'Visitor 3':'Signed out · message 3 of 3 (cycles)',
  'Manager':'Manager / club official · upcoming tournaments, each item links to the event',
  'Player':'Player · upcoming trials, each item links to the event',
  'Member':'Intermediary, referee, football fan · also the fallback when a member has no upcoming events'
};

async function step(name, fn) {
  try { const r = await fn(); out.steps.push({ name, done: true, result: r }); return r; }
  catch (e) { out.errors.push({ name, error: String(e && e.message ? e.message : e) }); return null; }
}

function findSet(page, name) {
  return page.children.find(n => n.name === name && n.type === 'COMPONENT_SET')
      || page.findOne(n => n.name === name && n.type === 'COMPONENT_SET');
}

const varCache = {};
async function getVar(id) {
  if (!varCache[id]) varCache[id] = await figma.variables.getVariableByIdAsync('VariableID:' + id);
  return varCache[id];
}
async function paint(node, varId) {
  const v = await getVar(varId);
  const base = { type: 'SOLID', color: { r: 0, g: 0, b: 0 } };
  node.fills = [figma.variables.setBoundVariableForPaint(base, 'color', v)];
}
async function loadFontsOf(node) {
  const len = node.characters.length;
  const fonts = len > 0 ? node.getRangeAllFontNames(0, len) : [node.fontName];
  for (const f of fonts) if (f && f.family) await figma.loadFontAsync(f);
}

let TEMPLATE_TEXT = null;

async function makeText(name, chars, styleId, colorVar) {
  const t = TEMPLATE_TEXT.clone();
  await loadFontsOf(t);
  t.name = name;
  t.characters = chars;
  await t.setTextStyleIdAsync(styleId);
  await paint(t, colorVar);
  t.textAutoResize = 'WIDTH_AND_HEIGHT';
  return t;
}

function clearExtras(comp) {
  for (const c of [...comp.children]) if (c.name !== 'Live dot') c.remove();
}

async function buildMessage(comp, chars, device) {
  clearExtras(comp);
  const t = await makeText('Ticker text', chars, STYLE.labelSmall, VAR.textSecondary);
  comp.appendChild(t);
  t.layoutSizingHorizontal = 'FILL';
  t.textAutoResize = 'HEIGHT';
}

async function buildEvents(comp, conf, device) {
  clearExtras(comp);
  const label = await makeText('Ticker label', conf.label, STYLE.eyebrow, VAR.textPrimary);
  comp.appendChild(label);

  const row = figma.createFrame();
  row.name = 'Ticker items';
  row.layoutMode = 'HORIZONTAL';
  row.itemSpacing = device === 'Desktop' ? 24 : 16;
  row.counterAxisAlignItems = 'CENTER';
  row.fills = [];
  row.clipsContent = true;
  comp.appendChild(row);
  row.layoutSizingHorizontal = 'FILL';
  row.layoutSizingVertical = 'HUG';

  const count = device === 'Desktop' ? 4 : 2;
  for (const [name, date] of conf.items.slice(0, count)) {
    const item = figma.createFrame();
    item.name = 'Ticker item';
    item.layoutMode = 'HORIZONTAL';
    item.itemSpacing = 6;
    item.counterAxisAlignItems = 'CENTER';
    item.fills = [];
    row.appendChild(item);
    item.layoutSizingHorizontal = 'HUG';
    item.layoutSizingVertical = 'HUG';

    const n = await makeText('Event name', name, STYLE.labelSmall, VAR.textPrimary);
    item.appendChild(n);
    const d = await makeText('Event date', date, STYLE.labelSmall, VAR.textSecondary);
    item.appendChild(d);
  }
}

// ---------- 1. Ticker ----------
const tickerSet = await step('Ticker set bul', async () => {
  const p = figma.root.children.find(n => /^01/.test(n.name));
  await p.loadAsync();
  const set = findSet(p, 'Ticker');
  if (!set) throw new Error('Ticker component set bulunamadi');
  const base = set.children.find(c => /Device=Desktop/.test(c.name));
  const tt = base.children.find(c => c.name === 'Ticker text');
  TEMPLATE_TEXT = tt.clone();
  TEMPLATE_TEXT.remove && figma.currentPage.appendChild(TEMPLATE_TEXT);
  return { id: set.id, variants: set.children.map(c => c.name) };
});

await step('rol varyantlarini kur', async () => {
  const set = await figma.getNodeByIdAsync(tickerSet.id);
  const byName = {};
  for (const c of set.children) byName[c.name] = c;

  // temel iki varyanti Visitor 1 yap (ilk calistirmada)
  for (const dev of DEVICES) {
    const old = byName['Device=' + dev];
    if (old) { old.name = 'Device=' + dev + ', Role=Visitor 1'; byName[old.name] = old; delete byName['Device=' + dev]; }
  }

  const created = [];
  for (const dev of DEVICES) {
    const baseName = 'Device=' + dev + ', Role=Visitor 1';
    const base = set.children.find(c => c.name === baseName);
    if (!base) throw new Error(baseName + ' yok');
    for (const role of ROLES) {
      const target = 'Device=' + dev + ', Role=' + role;
      let comp = set.children.find(c => c.name === target);
      if (!comp) { comp = base.clone(); comp.name = target; set.appendChild(comp); created.push(target); }
      if (EVENTS[role]) await buildEvents(comp, EVENTS[role], dev);
      else await buildMessage(comp, TEXTS[role], dev);
      comp.description = CAPTIONS[role];
    }
  }
  return { created, total: set.children.length };
});

await step('ana sayfa instance Role=Visitor 1', async () => {
  const p2 = figma.root.children.find(n => /^02/.test(n.name));
  await p2.loadAsync();
  const touched = [];
  for (const frame of p2.children) {
    if (!/^Home · (Desktop|Mobile)$/.test(frame.name)) continue;
    const inst = frame.children.find(c => /^ticker$/i.test(c.name) && c.type === 'INSTANCE');
    if (!inst) continue;
    inst.setProperties({ Role: 'Visitor 1' });
    touched.push(frame.name);
  }
  return touched;
});

// ---------- 2. Rol durumlari panosu ----------
await step('Ticker rol durumlari panosu', async () => {
  const p2 = figma.root.children.find(n => /^02/.test(n.name));
  await p2.loadAsync();
  const set = await figma.getNodeByIdAsync(tickerSet.id);

  const existing = p2.children.find(n => n.name === 'Ticker · role states');
  if (existing) existing.remove();

  let maxX = 0, minY = 0;
  for (const c of p2.children) { maxX = Math.max(maxX, c.x + c.width); minY = Math.min(minY, c.y); }

  const board = figma.createFrame();
  board.name = 'Ticker · role states';
  board.layoutMode = 'VERTICAL';
  board.itemSpacing = 40;
  board.paddingTop = board.paddingBottom = board.paddingLeft = board.paddingRight = 64;
  board.counterAxisSizingMode = 'AUTO';
  board.primaryAxisSizingMode = 'AUTO';
  await paint(board, VAR.bgSubtle);
  p2.appendChild(board);
  board.x = maxX + 400;
  board.y = minY;

  const title = await makeText('Board title', 'Ticker · role states', STYLE.labelStrong, VAR.textPrimary);
  board.appendChild(title);
  const note = await makeText('Board note', 'The strip scrolls as a marquee in the build. Shown static here. Signed out users see messages 1 to 3 in a loop.', STYLE.bodySmall, VAR.textSecondary);
  board.appendChild(note);

  for (const role of ROLES) {
    const group = figma.createFrame();
    group.name = 'Role · ' + role;
    group.layoutMode = 'VERTICAL';
    group.itemSpacing = 12;
    group.fills = [];
    board.appendChild(group);
    group.layoutSizingHorizontal = 'HUG';
    group.layoutSizingVertical = 'HUG';

    const cap = await makeText('Caption', role + ' · ' + CAPTIONS[role], STYLE.bodySmall, VAR.textSecondary);
    group.appendChild(cap);

    const row = figma.createFrame();
    row.name = 'Devices';
    row.layoutMode = 'HORIZONTAL';
    row.itemSpacing = 24;
    row.counterAxisAlignItems = 'MIN';
    row.fills = [];
    group.appendChild(row);
    row.layoutSizingHorizontal = 'HUG';
    row.layoutSizingVertical = 'HUG';

    for (const dev of DEVICES) {
      const comp = set.children.find(c => c.name === 'Device=' + dev + ', Role=' + role);
      const inst = comp.createInstance();
      row.appendChild(inst);
    }
  }
  return { x: Math.round(board.x), y: Math.round(board.y), w: Math.round(board.width), h: Math.round(board.height) };
});

// ---------- 3. M6 footer sosyal medya ----------
await step('M6 footer sosyal medya', async () => {
  const p = figma.root.children.find(n => /^01/.test(n.name));
  await p.loadAsync();
  const footer = findSet(p, 'Footer');
  if (!footer) throw new Error('Footer set yok');
  const want = ['LinkedIn', 'Instagram', 'Facebook', 'X'];
  const touched = [];

  for (const variant of footer.children) {
    const wrap = variant.findOne(n => n.name === 'Social links' && n.type === 'FRAME');
    if (!wrap) continue;
    const texts = wrap.children.filter(c => c.type === 'TEXT');
    const tmpl = texts[0];
    while (wrap.children.length < want.length) {
      const c = tmpl.clone();
      wrap.appendChild(c);
    }
    const nodes = wrap.children.filter(c => c.type === 'TEXT');
    for (let i = 0; i < want.length; i++) {
      const n = nodes[i];
      await loadFontsOf(n);
      n.name = 'Social link';
      n.characters = want[i];
    }
    for (let i = want.length; i < nodes.length; i++) nodes[i].remove();
    if (wrap.itemSpacing > 20) wrap.itemSpacing = 20;
    touched.push(variant.name);
  }
  return { variants: touched, labels: want };
});

if (TEMPLATE_TEXT) TEMPLATE_TEXT.remove();

out.info.push('M6 linkleri (developer notu): facebook.com/FriendlyMatches.International · instagram.com/friendlymatches.international · x.com/f_matches · linkedin.com/company/fmatches');
return out;
