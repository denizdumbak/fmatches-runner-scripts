// step 151 · 150 duzeltmeleri: Organization kariyer satirina hover ve +N / Less etkilesimleri (Club varyantlarindan), Manager directory yeniden (aciklama metni Profile actions icindeyse kutu silinmez, yalniz butonlar), Start here karti ile Home page arasina bosluk

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
const contains = (a, b) => { let x = b; while (x) { if (x === a) return true; x = x.parent; } return false; };

// ---------- 1. Organization satirlarina etkilesimler ----------
function remap(reactions, map) {
  return JSON.parse(JSON.stringify(reactions)).map(r => {
    if (r.actions) r.actions = r.actions.map(a => (a.destinationId && map[a.destinationId]) ? Object.assign(a, { destinationId: map[a.destinationId] }) : a);
    if (r.action && r.action.destinationId && map[r.action.destinationId]) r.action.destinationId = map[r.action.destinationId];
    return r;
  });
}
await step('org reactions copy', async () => {
  const set = setOf('Club entry');
  const clubs = set.children.filter(v => /Kind=Club/.test(v.name));
  const byName = {}; for (const v of set.children) byName[v.name] = v;
  const map = {}, pairs = [];
  for (const v of clubs) { const o = byName[v.name.replace('Kind=Club', 'Kind=Organization')]; if (o) { map[v.id] = o.id; pairs.push([v, o]); } }
  let n = 0;
  for (const [v, o] of pairs) {
    const src = [v].concat(v.findAll(x => x.name === 'More'));
    const dst = [o].concat(o.findAll(x => x.name === 'More'));
    if (src.length !== dst.length) throw new Error('More count differs in ' + o.name);
    for (let i = 0; i < src.length; i++) if (src[i].reactions && src[i].reactions.length) { await dst[i].setReactionsAsync(remap(src[i].reactions, map)); n++; }
  }
  const ids = {}; for (const c of set.children) ids[c.id] = c.name;
  const out = [];
  for (const [, o] of pairs) for (const x of [o].concat(o.findAll(y => y.name === 'More'))) for (const r of x.reactions) for (const a of (r.actions || [r.action])) if (a && a.destinationId) out.push(o.name.replace('Kind=Organization, ', '') + ' › ' + x.name + ' → ' + (ids[a.destinationId] || 'OUTSIDE SET'));
  report.info.orgReactions = { set: n, list: out };
});

// ---------- 2. Manager directory ----------
await step('manager directory', async () => {
  const built = [];
  for (const [sec, dev] of [[web, 'Desktop'], [mob, 'Mobile']]) {
    const sub = subOf(sec, SUB);
    const name = 'Profiles / Manager / Directory, no photo · ' + dev;
    const arrowName = 'Flow · Not joined yet · Manager · ' + dev;
    for (const old of sub.children.filter(c => c.name === name || c.name === arrowName)) old.remove();
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
    const tIdx = t.parent.children.indexOf(t);
    const prev = tIdx > 0 ? t.parent.children[tIdx - 1] : null;
    const hostName = t.parent.name;
    const host = f.findOne(n => n.name === hostName && 'children' in n);
    const after = prev ? host.children.find(c => c.name === prev.name) : null;
    const nt = t.clone();
    host.insertChild(after ? host.children.indexOf(after) + 1 : 0, nt);
    await setText(nt, 'Photo and messaging appear once the manager claims this profile.');
    nt.name = nt.characters;
    if (t.layoutSizingHorizontal === 'FILL') nt.layoutSizingHorizontal = 'FILL';
    // aksiyonlar yok; metin Profile actions icindeyse kutu kalir, yalniz butonlar gider
    const acts = f.findOne(n => n.name === 'Profile actions');
    let actsNote = 'none';
    if (acts) {
      if (contains(acts, nt)) {
        const kill = acts.children.filter(c => c !== nt && c.type === 'INSTANCE');
        for (const k of kill) k.remove();
        actsNote = 'kept, ' + kill.length + ' buttons removed';
      } else { acts.remove(); actsNote = 'removed'; }
    }
    const bar = f.children.find(c => c.type === 'INSTANCE' && /Sticky action bar/.test(c.name));
    if (bar) bar.remove();
    // Links ve About yok
    const body = f.findOne(n => n.name === 'Profile body');
    const drop = body.findAll(x => (x.name === 'Links' && x.type === 'FRAME') || (x.name === 'About' && x.type === 'INSTANCE'));
    for (const n of drop) if (!n.removed) n.remove();
    // konum: Manager'in altinda, kesik okla
    const pSub = subOf(sec, 'Profiles · player');
    const arrowSrc = pSub.children.find(c => c.name === 'Flow · Name length · ' + dev);
    const srcFrame = pSub.children.find(c => c.name === 'Profiles / Player · ' + dev);
    const dx = arrowSrc.x - srcFrame.x;
    const ar = arrowSrc.clone();
    sub.appendChild(ar);
    ar.name = arrowName;
    for (const tx of ar.findAll(n => n.type === 'TEXT')) { await setText(tx, 'Not joined yet'); tx.name = 'Not joined yet'; }
    ar.x = src.x + dx; ar.y = src.y + src.height + 16;
    f.x = src.x; f.y = ar.y + ar.height + 16;
    const texts = f.findAll(n => n.type === 'TEXT' && n.visible && /Directory|claims|Message|Add to/.test(n.characters)).map(n => n.parent.name + '›' + n.characters.slice(0, 40));
    built.push(dev + ' @' + R(f.x) + ',' + R(f.y) + ' h' + R(f.height) + ' · note in ' + hostName + (after ? ' after ' + after.name : ' first') + ' · actions ' + actsNote + ' · dropped ' + drop.length + ' · bar ' + (bar ? 'removed' : 'none') + ' · texts: ' + texts.join(' | '));
  }
  report.info.directory = built;
});

// ---------- 3. Start here karti ile Home page arasi ----------
await step('start here gap', async () => {
  const cards = web.children.filter(c => c.type === 'FRAME' && c.name === 'Start here');
  const home = subOf(web, 'Home page');
  const bottom = Math.max(...cards.map(c => c.y + c.height));
  const gap = home.y - bottom;
  const want = 48;
  if (gap >= want) { report.info.startHere = 'already ok, gap ' + R(gap); return; }
  const up = want - gap;
  const top = Math.min(...cards.map(c => c.y));
  if (top - up < 80) throw new Error('not enough room above cards: top ' + R(top) + ', need ' + R(up));
  for (const c of cards) c.y -= up;
  report.info.startHere = cards.length + ' cards up ' + R(up) + ' · top ' + R(top - up) + ' · gap ' + want;
});

// ---------- 4. Alt Section ve Section boyu ----------
await step('resize sections', async () => {
  const out = [];
  for (const sec of [web, mob]) {
    const sub = subOf(sec, SUB);
    let r = 0, b = 0;
    for (const c of sub.children) { r = Math.max(r, c.x + c.width); b = Math.max(b, c.y + c.height); }
    sub.resizeWithoutConstraints(Math.max(sub.width, Math.ceil(r + 80)), Math.ceil(b + 80));
    if (sub.y + sub.height + 80 > sec.height) sec.resizeWithoutConstraints(sec.width, Math.ceil(sub.y + sub.height + 80));
    out.push(sec.name + ' sub ' + R(sub.width) + 'x' + R(sub.height) + ' · section ' + R(sec.width) + 'x' + R(sec.height));
    const subs = sec.children.filter(c => c.type === 'SECTION');
    for (let i = 0; i < subs.length; i++) for (let j = i + 1; j < subs.length; j++) {
      const a = subs[i], z = subs[j];
      if (a.x < z.x + z.width && z.x < a.x + a.width && a.y < z.y + z.height && z.y < a.y + a.height) out.push('OVERLAP ' + a.name + ' / ' + z.name);
    }
    // alt Section icinde frame cakismasi
    const fr = sub.children.filter(c => c.type === 'FRAME');
    for (let i = 0; i < fr.length; i++) for (let j = i + 1; j < fr.length; j++) {
      const a = fr[i], z = fr[j];
      if (a.x < z.x + z.width && z.x < a.x + a.width && a.y < z.y + z.height && z.y < a.y + a.height) out.push('FRAME OVERLAP ' + a.name + ' / ' + z.name);
    }
  }
  if (!out.some(s => /OVERLAP/.test(s))) out.push('overlaps: none');
  report.info.sizes = out;
});

// ---------- 5. Prototip kontrolu ----------
await step('prototype check', async () => {
  let links = 0, broken = 0;
  for (const n of p02.findAll(x => 'reactions' in x && x.reactions && x.reactions.length)) for (const r of n.reactions) for (const a of (r.actions || [r.action])) {
    if (a && a.destinationId) { links++; if (!(await figma.getNodeByIdAsync(a.destinationId))) broken++; }
  }
  report.info.prototype = links + ' links, ' + broken + ' broken · flow starts ' + p02.flowStartingPoints.length;
});

return report;
