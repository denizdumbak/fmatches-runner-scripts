// step 150 · madde 8 kalanlari (giris oku etiketleri faz numarasiz): Club entry'ye Kind (Club / Organization) varyanti, Sofia ve Ana kariyer satiri kurum ikonuyla, Intermediary "Current" cipi 3. yuvaya, Manager directory sayfasi (masaustu + mobil), rol sayfalarina giris oklari, Start here'a satir

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
const R = v => Math.round(v);
const abs = n => n.absoluteBoundingBox;
const setOf = name => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === name);
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }
async function setText(t, s) { await loadFonts(t); t.characters = s; }
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const SUB = 'Profiles · other roles';
const subOf = (sec, name) => sec.children.find(n => n.type === 'SECTION' && n.name === name);
const ROLES = ['Manager', 'Intermediary', 'Referee', 'Football fan'];

// ---------- 1. Club entry: Kind (Club / Organization) ----------
function copyRefs(a, b) {
  if (a.componentPropertyReferences && Object.keys(a.componentPropertyReferences).length) b.componentPropertyReferences = Object.assign({}, a.componentPropertyReferences);
  if (a.type !== 'INSTANCE' && 'children' in a) for (let i = 0; i < a.children.length; i++) copyRefs(a.children[i], b.children[i]);
}
function remap(reactions, map) {
  return JSON.parse(JSON.stringify(reactions)).map(r => {
    if (r.actions) r.actions = r.actions.map(a => (a.destinationId && map[a.destinationId]) ? Object.assign(a, { destinationId: map[a.destinationId] }) : a);
    if (r.action && r.action.destinationId && map[r.action.destinationId]) r.action.destinationId = map[r.action.destinationId];
    return r;
  });
}

await step('club entry tag layer names', async () => {
  const set = setOf('Club entry');
  let n = 0;
  for (const v of set.children) {
    const level = v.findOne(x => x.name === 'Level');
    if (!level) continue;
    const tags = level.children.filter(c => c.type === 'INSTANCE');
    tags.forEach((t, i) => { const want = 'Tag ' + (i + 1); if (t.name !== want) { t.name = want; n++; } });
  }
  report.info.tagRenamed = n;
});

await step('club entry Kind variant', async () => {
  const set = setOf('Club entry');
  if (set.componentPropertyDefinitions.Kind) { report.info.clubEntryKind = 'already done'; return; }
  const strip = setOf('Club strip');
  const srcIcon = strip.children.find(c => /Kind=Organization/.test(c.name) && /Device=Desktop/.test(c.name)).findOne(n => n.name === 'Organization icon');
  const clubs = set.children.slice();
  for (const v of clubs) v.name = 'Kind=Club, ' + v.name;
  const map = {}, orgs = [];
  for (const v of clubs) {
    const c = v.clone();
    set.appendChild(c);
    c.name = v.name.replace('Kind=Club', 'Kind=Organization');
    copyRefs(v, c);
    map[v.id] = c.id;
    orgs.push(c);
  }
  for (const c of orgs) {
    const crest = c.findOne(n => n.name === 'Club crest');
    const box = srcIcon.clone();
    const parent = crest.parent, idx = parent.children.indexOf(crest);
    parent.insertChild(idx, box);
    box.name = 'Organization icon';
    if (/Device=Desktop/.test(c.name)) {
      box.resize(40, 40);
      const ic = box.findOne(n => n.name === 'Icon'); if (ic) ic.rescale(24 / ic.width);
    } else box.resize(32, 32);
    crest.remove();
  }
  for (const c of orgs) {
    const nodes = [c].concat(c.findAll(n => n.name === 'More'));
    for (const n of nodes) if (n.reactions && n.reactions.length) await n.setReactionsAsync(remap(n.reactions, map));
  }
  const add = ' Kind=Organization: agency, league or federation rows (careers.company_type 2). A building icon replaces the crest; no logo is drawn for organizations.';
  if (set.description.indexOf('Kind=Organization') < 0) set.description += add;
  report.info.clubEntryKind = set.children.map(c => c.name);
  report.info.clubEntryDefs = Object.keys(set.componentPropertyDefinitions);
});

await step('org reactions check', async () => {
  const set = setOf('Club entry');
  const ids = {}; for (const c of set.children) ids[c.id] = c.name;
  const out = [];
  for (const c of set.children.filter(v => /Kind=Organization/.test(v.name))) {
    for (const n of [c].concat(c.findAll(x => x.name === 'More'))) for (const r of n.reactions) for (const a of (r.actions || [r.action])) if (a && a.destinationId) out.push(c.name.replace('Kind=Organization, ', '') + ' › ' + n.name + ' → ' + (ids[a.destinationId] || 'OUTSIDE SET ' + a.destinationId));
  }
  report.info.orgReactions = out;
});

await step('relayout 01 sections', async () => {
  const s = setOf('Club entry').parent;
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
  const secs = p01.children.filter(n => n.type === 'SECTION').sort((a, b) => a.x - b.x);
  let x = 1640; for (const sec of secs) { sec.x = x; x += sec.width + 160; }
  report.info.sections01 = secs.map(sec => sec.name + ' ' + R(sec.x));
});

// ---------- 2. Sofia ve Ana kurum satiri, Intermediary Current cipi ----------
await step('role career rows', async () => {
  const out = [];
  for (const role of ['Intermediary', 'Referee']) for (const dev of ['Desktop', 'Mobile']) {
    const f = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / ' + role + ' · ' + dev);
    const list = f.findOne(n => n.name === 'Club entries');
    for (const e of list.children.filter(c => c.type === 'INSTANCE')) {
      e.setProperties({ Kind: 'Organization' });
      if (role === 'Intermediary') {
        const cp = e.componentProperties;
        const k2 = Object.keys(cp).find(k => /^Tag 2/.test(k)), k3 = Object.keys(cp).find(k => /^Tag 3/.test(k));
        e.setProperties({ [k2]: false, [k3]: true });
      }
      out.push(role + ' ' + dev + ': ' + e.findAll(c => c.type === 'TEXT' && c.visible !== false && !(c.parent && c.parent.visible === false)).map(c => c.name + '=' + c.characters.slice(0, 30)).join(' | ') + ' · icon ' + (e.findOne(n => n.name === 'Organization icon') ? 'yes' : 'no'));
    }
  }
  report.info.career = out;
});

await step('icon button box name', async () => {
  const s = setOf('Icon button');
  const v = s.children.find(c => /Icon=Add contact/.test(c.name));
  const box = v && v.findOne(n => n.name === 'Icon · Star');
  if (box) { box.name = 'Icon · Add contact'; report.info.iconBox = 'renamed'; } else report.info.iconBox = 'already done';
});

// ---------- 3. Rol sayfalari asagi kayar (giris oklarina yer) ----------
const SHIFT = 280;
await step('shift role frames', async () => {
  const out = [];
  for (const [sec, dev] of [[web, 'Desktop'], [mob, 'Mobile']]) {
    const sub = subOf(sec, SUB);
    const frames = sub.children.filter(c => c.type === 'FRAME' && ROLES.some(r => c.name === 'Profiles / ' + r + ' · ' + dev));
    if (frames.every(f => f.y >= 200 + SHIFT)) { out.push(dev + ' already shifted'); continue; }
    for (const f of frames) f.y += SHIFT;
    out.push(dev + ' ' + frames.length + ' frames → y ' + R(frames[0].y));
  }
  report.info.shift = out;
});

// ---------- 4. Manager directory ----------
await step('manager directory', async () => {
  const built = [];
  for (const [sec, dev] of [[web, 'Desktop'], [mob, 'Mobile']]) {
    const sub = subOf(sec, SUB);
    const name = 'Profiles / Manager / Directory, no photo · ' + dev;
    for (const old of sub.children.filter(c => c.name === name || c.name === 'Flow · Not joined yet · Manager · ' + dev)) old.remove();
    const src = sub.children.find(c => c.type === 'FRAME' && c.name === 'Profiles / Manager · ' + dev);
    const playerDir = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player / Directory, no photo · ' + dev);
    const f = src.clone();
    sub.appendChild(f);
    f.name = name;
    // rozet
    const hero = f.findOne(n => n.name === 'Hero · player identity');
    const badge = hero.findOne(n => n.type === 'INSTANCE' && n.name === 'Verification badge');
    badge.setProperties({ Status: 'Directory' });
    // aciklama metni, player directory'deki yerine gore
    const t = playerDir.findOne(n => n.type === 'TEXT' && /claims/.test(n.characters));
    const prev = t.parent.children[t.parent.children.indexOf(t) - 1];
    const host = f.findOne(n => n.name === t.parent.name && 'children' in n);
    const after = host.children.find(c => c.name === prev.name);
    const nt = t.clone();
    host.insertChild(host.children.indexOf(after) + 1, nt);
    await setText(nt, 'Photo and messaging appear once the manager claims this profile.');
    nt.name = nt.characters;
    if (nt.layoutSizingHorizontal !== undefined && t.layoutSizingHorizontal === 'FILL') nt.layoutSizingHorizontal = 'FILL';
    // aksiyonlar yok
    const acts = f.findOne(n => n.name === 'Profile actions');
    if (acts) acts.remove();
    const bar = f.children.find(c => c.type === 'INSTANCE' && /Sticky action bar/.test(c.name));
    if (bar) bar.remove();
    // Links ve About yok
    const body = f.findOne(n => n.name === 'Profile body');
    for (const n of body.findAll(x => (x.name === 'Links' && x.type === 'FRAME') || (x.name === 'About' && x.type === 'INSTANCE'))) n.remove();
    // konum: Manager'in altinda, kesik okla
    const arrowSrc = (dev === 'Desktop' ? subOf(web, 'Profiles · player') : subOf(mob, 'Profiles · player')).children.find(c => c.name === 'Flow · Name length · ' + dev);
    const srcFrame = subOf(dev === 'Desktop' ? web : mob, 'Profiles · player').children.find(c => c.name === 'Profiles / Player · ' + dev);
    const dx = arrowSrc.x - srcFrame.x;
    const ar = arrowSrc.clone();
    sub.appendChild(ar);
    ar.name = 'Flow · Not joined yet · Manager · ' + dev;
    for (const tx of ar.findAll(n => n.type === 'TEXT')) { await setText(tx, 'Not joined yet'); tx.name = 'Not joined yet'; }
    ar.x = src.x + dx; ar.y = src.y + src.height + 16;
    f.x = src.x; f.y = ar.y + ar.height + 16;
    built.push(f.name + ' @' + R(f.x) + ',' + R(f.y) + ' h' + R(f.height) + ' · arrow h' + R(ar.height) + ' · note in ' + host.name + ' after ' + after.name);
  }
  report.info.directory = built;
});

// ---------- 5. Giris oklari ----------
const ENTRY = { 'Manager': 'From search results or club staff · not drawn yet', 'Intermediary': 'From search results · not drawn yet', 'Referee': 'From search results · not drawn yet', 'Football fan': 'From My contacts · not drawn yet' };
const PLAYER_ENTRY = 'From player search · not drawn yet';
await step('entry arrows', async () => {
  const out = [];
  for (const [sec, dev] of [[web, 'Desktop'], [mob, 'Mobile']]) {
    const sub = subOf(sec, SUB);
    for (const old of sub.children.filter(c => /^Flow · Entry · /.test(c.name))) old.remove();
    const srcArrow = subOf(sec, 'Profiles · player').children.find(c => c.name === 'Flow · From player search');
    const srcFrame = subOf(sec, 'Profiles · player').children.find(c => c.name === 'Profiles / Player · ' + dev);
    for (const tx of srcArrow.findAll(n => n.type === 'TEXT')) { await setText(tx, PLAYER_ENTRY); tx.name = PLAYER_ENTRY; }
    const dx = srcArrow.x - srcFrame.x, gap = srcFrame.y - (srcArrow.y + srcArrow.height);
    for (const role of ROLES) {
      const f = sub.children.find(c => c.type === 'FRAME' && c.name === 'Profiles / ' + role + ' · ' + dev);
      const g = srcArrow.clone();
      sub.appendChild(g);
      g.name = 'Flow · Entry · ' + role;
      for (const tx of g.findAll(n => n.type === 'TEXT')) { await setText(tx, ENTRY[role]); tx.name = ENTRY[role]; }
      g.x = f.x + dx; g.y = f.y - gap - g.height;
      out.push(dev + ' ' + role + ' @' + R(g.x) + ',' + R(g.y) + ' ' + R(g.width) + 'x' + R(g.height));
    }
  }
  report.info.entry = out;
});

// ---------- 6. Alt Section ve Section boyu ----------
await step('resize sections', async () => {
  const out = [];
  for (const sec of [web, mob]) {
    const sub = subOf(sec, SUB);
    let r = 0, b = 0;
    for (const c of sub.children) { r = Math.max(r, c.x + c.width); b = Math.max(b, c.y + c.height); }
    sub.resizeWithoutConstraints(Math.max(sub.width, Math.ceil(r + 80)), Math.ceil(b + 80));
    if (sub.y + sub.height + 80 > sec.height) sec.resizeWithoutConstraints(sec.width, Math.ceil(sub.y + sub.height + 80));
    out.push(sec.name + ' sub ' + R(sub.width) + 'x' + R(sub.height) + ' · section ' + R(sec.width) + 'x' + R(sec.height));
    // alt Section cakisma kontrolu
    const subs = sec.children.filter(c => c.type === 'SECTION');
    for (let i = 0; i < subs.length; i++) for (let j = i + 1; j < subs.length; j++) {
      const a = subs[i], z = subs[j];
      if (a.x < z.x + z.width && z.x < a.x + a.width && a.y < z.y + z.height && z.y < a.y + a.height) out.push('OVERLAP ' + a.name + ' / ' + z.name);
    }
    // giris oku ust Section disina tasiyor mu
    for (const g of sub.children.filter(c => /^Flow · Entry/.test(c.name))) if (g.y < 0) out.push('ARROW ABOVE SUB ' + g.name + ' ' + R(g.y));
  }
  report.info.sizes = out;
});

// ---------- 7. Start here ----------
await step('start here line', async () => {
  const card = web.children.find(c => c.type === 'FRAME' && c.name === 'Start here' && c.children.some(k => k.type === 'TEXT' && k.characters === 'Player profile'));
  const lines = card.children.filter(k => k.type === 'TEXT' && /^\d\./.test(k.characters));
  if (lines.some(k => /^5\./.test(k.characters))) { report.info.startHere = 'already done'; return; }
  const nt = lines[lines.length - 1].clone();
  card.appendChild(nt);
  const s = '5.  Other roles (manager, intermediary, referee, fan) use the same template: see "Profiles · other roles" below.';
  await setText(nt, s); nt.name = s.slice(0, 40);
  const home = subOf(web, 'Home page');
  report.info.startHere = 'card bottom ' + R(abs(card).y + abs(card).height) + ' · Home page top ' + R(abs(home).y) + ' · line h ' + R(nt.height);
});

// ---------- 8. Prototip kontrolu ----------
await step('prototype check', async () => {
  let links = 0, broken = 0;
  for (const n of p02.findAll(x => 'reactions' in x && x.reactions && x.reactions.length)) for (const r of n.reactions) for (const a of (r.actions || [r.action])) {
    if (a && a.destinationId) { links++; if (!(await figma.getNodeByIdAsync(a.destinationId))) broken++; }
  }
  report.info.prototype = links + ' links, ' + broken + ' broken · flow starts ' + p02.flowStartingPoints.length;
});

return report;
