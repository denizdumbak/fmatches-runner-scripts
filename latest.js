// step 142 · Madde 8 parcalari: Club strip Kind (Club / Organization, kurum ikonu) · Sticky action bar Role (Player / Other, kisi ekleme ikonu) · Profile actions panosuna oyuncu disi profil satiri · yeni pano "Profile · key facts by role"

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }
async function setText(t, s) { await loadFonts(t); t.characters = s; }
const p01 = pageOf(/^01/);
await p01.loadAsync();
const setOf = name => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === name);

// thin-line icon from a 24 viewBox, stroke bound to a variable
function lineIcon(paths, size, colorVar) {
  const svg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    paths.map(d => '<path d="' + d + '" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>').join('') + '</svg>';
  const node = figma.createNodeFromSvg(svg);
  node.fills = [];
  for (const v of node.findAll(n => n.type === 'VECTOR')) { v.strokes = [P(colorVar)]; v.fills = []; v.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; }
  node.rescale(size / 24);
  return node;
}
const BUILDING = ['M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16', 'M15 9h4a1 1 0 0 1 1 1v11', 'M3 21h18', 'M8 8h3', 'M8 12h3', 'M8 16h3'];
const PERSON_PLUS = ['M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1', 'M19 8v6', 'M16 11h6'];

// ---------- 1. Club strip: Kind = Club / Organization ----------
await step('club strip kind', async () => {
  const set = setOf('Club strip');
  if (set.children.some(c => /Kind=Organization/.test(c.name))) { report.info.strip = 'already done'; return; }
  for (const v of set.children) if (!/Kind=/.test(v.name)) v.name = 'Kind=Club, ' + v.name;
  const made = [];
  for (const src of set.children.slice()) {
    const dev = /Mobile/.test(src.name) ? 'Mobile' : 'Desktop';
    const c = src.clone();
    set.appendChild(c);
    c.name = 'Kind=Organization, Device=' + dev;
    const crest = c.findOne(n => n.type === 'INSTANCE' && n.name === 'Club crest');
    const boxSize = dev === 'Desktop' ? 32 : 28;
    const box = figma.createFrame();
    box.name = 'Organization icon';
    box.resize(boxSize, boxSize);
    box.fills = [P(V('color/bg/surface'))];
    for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) box.setBoundVariable(k, V('radius/sm'));
    box.layoutMode = 'HORIZONTAL'; box.primaryAxisAlignItems = 'CENTER'; box.counterAxisAlignItems = 'CENTER';
    box.primaryAxisSizingMode = 'FIXED'; box.counterAxisSizingMode = 'FIXED';
    const icon = lineIcon(BUILDING, boxSize - 12, V('color/icon/default'));
    icon.name = 'Icon';
    box.appendChild(icon);
    const parent = crest.parent;
    parent.insertChild(parent.children.indexOf(crest), box);
    crest.remove();
    const texts = c.findAll(n => n.type === 'TEXT');
    const name = texts.find(t => t.characters === 'Riverside FC');
    const tier = texts.find(t => t.characters === 'Third Division');
    if (name) await setText(name, 'Northern Counties League');
    if (tier) await setText(tier, 'Tier 4');
    made.push(c.name + ' ' + Math.round(c.width) + 'x' + Math.round(c.height));
  }
  set.description = 'Current club or organization row in the profile. Kind: Club (crest) for clubs; Organization (icon) for agencies, leagues and federations, which have no logo in the database. The last part shows the league level for clubs and the tier (organizations.tier) for leagues; hide it with its divider when there is none, e.g. agencies.';
  report.info.strip = made;
});

// ---------- 2. Sticky action bar: Role = Player / Other ----------
await step('sticky bar role', async () => {
  const set = setOf('Sticky action bar');
  if (set.children.some(c => /Role=Other/.test(c.name))) { report.info.bar = 'already done'; return; }
  const src = set.children[0];
  const iconInst = src.findOne(n => n.type === 'INSTANCE' && /icon button/i.test(n.name));
  const mc = await iconInst.getMainComponentAsync();
  const ibSet = mc.parent;
  report.info.iconButtonOptions = ibSet.componentPropertyDefinitions.Icon ? ibSet.componentPropertyDefinitions.Icon.variantOptions : 'no Icon prop';
  let addVar = ibSet.children.find(c => /Icon=Add contact/.test(c.name));
  if (!addVar) {
    const star = ibSet.children.find(c => /Icon=Star/.test(c.name)) || ibSet.children[0];
    addVar = star.clone();
    ibSet.appendChild(addVar);
    addVar.name = star.name.replace(/Icon=[^,]+/, 'Icon=Add contact');
    const vecs = addVar.findAll(n => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION');
    if (!vecs.length) throw new Error('no vector in icon button');
    const holder = vecs[0].parent;
    const strokes = vecs[0].strokes;
    const size = Math.round(holder === addVar ? Math.max(vecs[0].width, vecs[0].height) : holder.width);
    for (const v of vecs) v.remove();
    const icon = lineIcon(PERSON_PLUS, size, V('color/icon/default'));
    if (strokes && strokes.length) for (const v of icon.findAll(n => n.type === 'VECTOR')) v.strokes = strokes;
    icon.name = 'Icon';
    holder.appendChild(icon);
    if (holder !== addVar && holder.layoutMode === 'NONE') { icon.x = (holder.width - icon.width) / 2; icon.y = (holder.height - icon.height) / 2; }
    report.info.iconHolder = holder.name + ' ' + holder.type + ' size ' + size;
  }
  src.name = 'Role=Player, Device=Mobile';
  const c = src.clone();
  set.appendChild(c);
  c.name = 'Role=Other, Device=Mobile';
  const ib = c.findOne(n => n.type === 'INSTANCE' && /icon button/i.test(n.name));
  ib.setProperties({ Icon: 'Add contact' });
  ib.name = 'Icon button · Add to contacts';
  set.description = 'Mobile only, fixed at the bottom of the screen. Role=Player: Message and Add to shortlist (star). Role=Other (manager/official, intermediary, referee, fan): Message and Add to contacts (person icon); shortlists hold players only.';
  report.info.bar = set.children.map(v => v.name);
});

// ---------- 3. Profile actions board: non-player row ----------
let actionsBoard = null;
await step('actions board row', async () => {
  actionsBoard = p01.findOne(n => n.type === 'FRAME' && n.name === 'Profile actions · states');
  if (actionsBoard.findOne(n => n.name === 'State · Non-player profile')) { report.info.actionsRow = 'already done'; return; }
  const first = actionsBoard.children.find(n => n.name === 'State · Signed-in scout · public profile or contact');
  const row = first.clone();
  actionsBoard.insertChild(actionsBoard.children.indexOf(first) + 1, row);
  row.name = 'State · Non-player profile';
  const cond = row.findOne(n => n.name === 'Condition');
  const ts = cond.findAll(n => n.type === 'TEXT');
  await setText(ts[0], 'Manager, intermediary, referee or fan profile');
  await setText(ts[1], 'No shortlist: shortlists hold players only. Add to contacts takes its place.');
  const btn = row.findOne(n => n.type === 'INSTANCE' && /shortlist/i.test(n.name));
  const label = btn.findOne(n => n.type === 'TEXT');
  await setText(label, 'Add to contacts');
  btn.name = 'Button · Add to contacts';
  report.info.actionsRow = 'added, board h ' + Math.round(actionsBoard.height);
});

// ---------- 4. New board: key facts by role ----------
await step('key facts board', async () => {
  if (p01.findOne(n => n.type === 'FRAME' && n.name === 'Profile · key facts by role')) { report.info.factsBoard = 'already done'; return; }
  const tagSet = setOf('Tag');
  const neutral = tagSet.children.find(c => /Style=Neutral/.test(c.name));
  const board = actionsBoard.clone();
  actionsBoard.parent.insertChild(actionsBoard.parent.children.indexOf(actionsBoard) + 1, board);
  board.name = 'Profile · key facts by role';
  board.x = actionsBoard.x; board.y = actionsBoard.y + actionsBoard.height + 120;
  const texts = board.children.filter(n => n.type === 'TEXT');
  await setText(texts[0], 'Profile · key facts by role');
  texts[0].name = 'Profile · key facts by role';
  await setText(texts[1], 'One profile template for every role. Key facts come from the user record and the current career entry: Role shows the position (employee_positions) with "since" from start_date; Contract until shows end_date when it is set. Empty values are hidden. The Positions card and shortlists are player-only. Agencies, leagues and federations show an icon instead of a crest: the database stores no logo for them.');
  texts[1].name = 'Intro';
  const rows = board.children.filter(n => n.type === 'FRAME');
  const tpl = rows[0];
  for (const r of rows.slice(1)) r.remove();
  const data = [
    ['Player', 'Role line: main position. Strip: current club.', ['Age', 'Nationality', 'Height / Weight', 'Foot', 'Contract until']],
    ['Manager / Official', 'Role line: position from the current career entry, e.g. Head coach. Strip: current club.', ['Age', 'Nationality', 'Role · since', 'Contract until']],
    ['Intermediary', 'Strip: the agency, as an organization.', ['Age', 'Nationality', 'Role · since']],
    ['Referee', 'Strip: league or federation, with its tier.', ['Age', 'Nationality', 'Role · since']],
    ['Football fan', 'No strip; career only if entered. Not listed in search, reached from messages and contacts.', ['Age', 'Nationality']]
  ];
  for (const [role, rule, facts] of data) {
    const r = tpl.clone();
    board.appendChild(r);
    r.name = 'Role · ' + role;
    const ts = r.findOne(n => n.name === 'Condition').findAll(n => n.type === 'TEXT');
    await setText(ts[0], role); ts[0].name = 'Role';
    await setText(ts[1], rule); ts[1].name = 'Rule';
    const box = r.findOne(n => n.name === 'Buttons');
    box.name = 'Facts';
    for (const k of box.children.slice()) k.remove();
    box.itemSpacing = 8;
    box.layoutSizingHorizontal = 'FILL';
    box.layoutWrap = 'WRAP';
    box.counterAxisSpacing = 8;
    for (const f of facts) {
      const t = neutral.createInstance();
      box.appendChild(t);
      const tt = t.findOne(n => n.type === 'TEXT');
      await setText(tt, f);
      t.name = 'Tag · ' + f;
    }
  }
  tpl.remove();
  report.info.factsBoard = 'board h ' + Math.round(board.height) + ', rows ' + board.children.filter(n => n.type === 'FRAME').length;
});

// ---------- 5. Section layout ----------
await step('section layout', async () => {
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
  const sec = actionsBoard.parent;
  if (sec.type !== 'SECTION') throw new Error('board not in a section: ' + sec.type);
  for (const name of ['Club strip', 'Sticky action bar']) {
    const s = setOf(name);
    if (s.layoutMode !== 'NONE') { s.primaryAxisSizingMode = 'AUTO'; s.counterAxisSizingMode = 'AUTO'; }
  }
  relayout(sec);
  const secs = p01.children.filter(n => n.type === 'SECTION').sort((a, b) => a.x - b.x);
  let x = 1640;
  for (const s of secs) { if (s.x < 1600) continue; s.x = x; x += s.width + 160; }
  report.info.sections = secs.map(s => s.name + ' @' + Math.round(s.x) + ' w' + Math.round(s.width));
});

return report;
