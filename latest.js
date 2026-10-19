// step 147 · 146 duzeltmesi: Home page grubu profil alanini kapliyordu. Gruplar sokulur ve yeniden kurulur: "Home page" (Main, Slide 2, Slide 3) · "Home page · calendar view" · "Profiles · player". Ok ve notlar merkezine gore gruplarina girer. Tekrarlanan akis baslangiclari temizlenir.

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p02 = pageOf(/^02/);
await p02.loadAsync();
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const abs = n => n.absoluteBoundingBox;
const hit = (a, b) => a.x < b.r && a.x + a.width > b.x && a.y < b.b && a.y + a.height > b.y;
function moveKeep(n, parent) {
  const a = abs(n);
  parent.appendChild(n);
  const b = abs(n);
  n.x += a.x - b.x; n.y += a.y - b.y;
}

const GROUPS = [
  { name: 'Home page', test: n => /^Home \/ Main( \/ Slide [23])? · /.test(n.name) },
  { name: 'Home page · calendar view', test: n => /^Home \/ Main \/ Calendar view · /.test(n.name) },
  { name: 'Profiles · player', test: n => /^Profiles \/ Player/.test(n.name) }
];
const OLD = ['Home page', 'Profiles · player', 'Home page · calendar view'];
const PAD = 80, TOP = 160, REACH = 480;

// ---------- 1. take the 146 groups apart ----------
await step('ungroup', async () => {
  const out = [];
  for (const sec of [web, mob]) {
    for (const sub of sec.children.filter(n => n.type === 'SECTION' && OLD.includes(n.name))) {
      const kids = sub.children.slice();
      for (const k of kids) moveKeep(k, sec);
      out.push(sec.name + ' · ' + sub.name + ' (' + kids.length + ')');
      sub.remove();
    }
  }
  report.info.ungrouped = out;
});

// ---------- 2. group again ----------
async function group(sec, g) {
  const frames = sec.children.filter(n => n.type === 'FRAME' && g.test(n));
  if (!frames.length) return 'no frames';
  const box = { x: Infinity, y: Infinity, r: -Infinity, b: -Infinity };
  const grow = a => { box.x = Math.min(box.x, a.x - PAD); box.y = Math.min(box.y, a.y - TOP); box.r = Math.max(box.r, a.x + a.width + PAD); box.b = Math.max(box.b, a.y + a.height + PAD); };
  for (const f of frames) grow(abs(f));
  const core = { x: box.x - REACH, y: box.y - REACH, r: box.r + REACH, b: box.b + REACH };
  const members = frames.slice();
  for (const n of sec.children) {
    if (n.type === 'SECTION' || members.includes(n) || !/^(Flow|Note) · /.test(n.name)) continue;
    const a = abs(n), cx = a.x + a.width / 2, cy = a.y + a.height / 2;
    // the arrow or note belongs to the group its centre falls in
    const inCore = cx > core.x && cx < core.r && cy > core.y && cy < core.b;
    const nearFrame = frames.some(f => { const b = abs(f); return cx > b.x - REACH && cx < b.x + b.width + REACH && cy > b.y - REACH && cy < b.y + b.height + REACH; });
    if (inCore && nearFrame) { members.push(n); grow(a); }
  }
  // keep clear of whatever sits just above (Start here cards)
  const minY = Math.min(...frames.map(f => abs(f).y));
  for (const n of sec.children) {
    if (members.includes(n)) continue;
    const a = abs(n);
    if (hit(a, box) && a.y + a.height <= minY) box.y = Math.max(box.y, a.y + a.height + 40);
  }
  const blockers = sec.children.filter(n => !members.includes(n) && hit(abs(n), box)).map(n => n.name);
  const S = abs(sec);
  const sub = figma.createSection();
  sub.name = g.name;
  sec.appendChild(sub);
  sub.x = box.x - S.x; sub.y = box.y - S.y;
  sub.resizeWithoutConstraints(box.r - box.x, box.b - box.y);
  for (const n of members) moveKeep(n, sub);
  return '@' + Math.round(sub.x) + ',' + Math.round(sub.y) + ' ' + Math.round(sub.width) + 'x' + Math.round(sub.height) + ' · ' + members.map(n => n.name).join(' | ') + (blockers.length ? ' · OVERLAPS: ' + blockers.join(' | ') : '');
}

for (const sec of [web, mob]) for (const g of GROUPS) {
  await step(sec.name + ' ' + g.name, async () => { report.info[sec.name + ' · ' + g.name] = await group(sec, g); });
}

await step('left over', async () => {
  report.info.webTop = web.children.map(n => n.type + ' ' + n.name);
  report.info.mobTop = mob.children.map(n => n.type + ' ' + n.name);
});

// ---------- 3. flow starting points: one per name ----------
// cloned frames carry a copy of the start point; keep the one on the original frame
const PREFER = { 'Web · Player profile': 'Profiles / Player · Desktop', 'Mobile · Player profile': 'Profiles / Player · Mobile' };
await step('flow starts', async () => {
  const byName = new Map();
  for (const f of p02.flowStartingPoints) {
    const node = await figma.getNodeByIdAsync(f.nodeId);
    if (!node) continue;
    if (!byName.has(f.name)) byName.set(f.name, []);
    byName.get(f.name).push({ f, target: node.name });
  }
  const keep = [], dropped = [];
  for (const [name, list] of byName) {
    const pick = list.find(x => x.target === PREFER[name]) || list[0];
    keep.push(pick.f);
    report.info['start · ' + name] = pick.target;
    for (const x of list) if (x !== pick) dropped.push(name + ' -> ' + x.target);
  }
  p02.flowStartingPoints = keep;
  report.info.startsDropped = dropped;
});

await step('prototype check', async () => {
  let broken = 0, total = 0;
  for (const n of p02.findAll(n => 'reactions' in n && n.reactions && n.reactions.length)) {
    for (const r of n.reactions) for (const a of (r.actions || [])) {
      if (a && a.destinationId) { total++; if (!(await figma.getNodeByIdAsync(a.destinationId))) broken++; }
    }
  }
  report.info.reactions = total + ' links, ' + broken + ' broken';
});

return report;
