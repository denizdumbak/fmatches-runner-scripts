// step 146 · Tekrar eden sayfa gruplari da etiketli alt Section'a: "Home page" (Main, Slide 2, Slide 3, Calendar view) ve "Profiles · player" (ana profil, Directory, Name length). Icindeki oklar ve notlar birlikte tasinir; konumlar degismez.

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p02 = pageOf(/^02/);
await p02.loadAsync();
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const abs = n => n.absoluteBoundingBox;
const hit = (a, b) => a.x < b.r && a.x + a.width > b.x && a.y < b.b && a.y + a.height > b.y;
const inside = (a, b) => a.x >= b.x && a.y >= b.y && a.x + a.width <= b.r && a.y + a.height <= b.b;

const GROUPS = [
  { name: 'Home page', test: n => n.type === 'FRAME' && /^Home \//.test(n.name) },
  { name: 'Profiles · player', test: n => n.type === 'FRAME' && /^Profiles \/ Player/.test(n.name) }
];
const PAD = 80, TOP = 160;

async function group(sec, g, key) {
  let sub = sec.children.find(n => n.type === 'SECTION' && n.name === g.name);
  const pool = sub ? sec.children.concat(sub.children) : sec.children.slice();
  const frames = pool.filter(g.test);
  if (!frames.length) { report.info[key] = 'no frames'; return; }
  // box around the frames, then pull in arrows and notes that touch it
  const box = { x: Infinity, y: Infinity, r: -Infinity, b: -Infinity };
  const grow = a => { box.x = Math.min(box.x, a.x - PAD); box.y = Math.min(box.y, a.y - TOP); box.r = Math.max(box.r, a.x + a.width + PAD); box.b = Math.max(box.b, a.y + a.height + PAD); };
  for (const f of frames) grow(abs(f));
  const members = new Set(frames);
  const extras = sec.children.filter(n => n !== sub && n.type !== 'SECTION' && !members.has(n) && /^(Flow|Note) · /.test(n.name));
  let changed = true;
  while (changed) {
    changed = false;
    for (const n of extras) {
      if (members.has(n)) continue;
      const a = abs(n);
      if (!hit(a, box)) continue;
      // an arrow that also points into another group stays outside (it links groups)
      const other = sec.children.filter(o => o.type === 'FRAME' && !g.test(o) && !/^(Flow|Note)/.test(o.name));
      const box2 = { x: a.x, y: a.y, r: a.x + a.width, b: a.y + a.height };
      if (/^Flow/.test(n.name) && other.some(o => hit(abs(o), box2))) continue;
      members.add(n); grow(a); changed = true;
    }
  }
  // a node sitting just above the frames (e.g. Start here cards) pushes the top edge down
  const minY = Math.min(...frames.map(f => abs(f).y));
  for (const n of sec.children) {
    if (n === sub || members.has(n)) continue;
    const a = abs(n);
    if (hit(a, box) && a.y + a.height <= minY) box.y = Math.max(box.y, a.y + a.height + 40);
  }
  // anything else overlapping the box is reported, not moved
  const blockers = sec.children.filter(n => n !== sub && !members.has(n) && hit(abs(n), box)).map(n => n.name);
  const S = abs(sec);
  if (!sub) { sub = figma.createSection(); sub.name = g.name; sec.appendChild(sub); }
  sub.x = box.x - S.x; sub.y = box.y - S.y;
  sub.resizeWithoutConstraints(box.r - box.x, box.b - box.y);
  const U = abs(sub);
  for (const n of members) {
    if (n.parent === sub) continue;
    const a = abs(n);
    sub.appendChild(n);
    n.x += a.x - abs(n).x; n.y += a.y - abs(n).y;
  }
  report.info[key] = g.name + ' @' + Math.round(sub.x) + ',' + Math.round(sub.y) + ' ' + Math.round(sub.width) + 'x' + Math.round(sub.height) + ' · ' + [...members].map(n => n.name).join(' | ') + (blockers.length ? ' · OVERLAPS (not moved): ' + blockers.join(' | ') : '');
}

for (const g of GROUPS) {
  await step('web ' + g.name, () => group(web, g, 'web · ' + g.name));
  await step('mobile ' + g.name, () => group(mob, g, 'mobile · ' + g.name));
}

await step('sections', async () => {
  const oldW = web.width, oldRight = web.x + oldW;
  let r = 0, b = 0;
  for (const k of web.children) { r = Math.max(r, k.x + k.width); b = Math.max(b, k.y + k.height); }
  web.resizeWithoutConstraints(Math.max(oldW, r + 80), Math.max(web.height, b + 80));
  const dx = web.width - oldW;
  if (dx > 0) for (const n of p02.children) if (n !== web && n.x >= oldRight) n.x += dx;
  let mr = 0, mb = 0;
  for (const k of mob.children) { mr = Math.max(mr, k.x + k.width); mb = Math.max(mb, k.y + k.height); }
  mob.resizeWithoutConstraints(Math.max(mob.width, mr + 80), Math.max(mob.height, mb + 80));
  report.info.sections = 'Web ' + Math.round(web.width) + 'x' + Math.round(web.height) + ' · Mobile @' + Math.round(mob.x) + ' (moved ' + Math.round(dx) + ')';
  report.info.webTop = web.children.map(n => n.type + ' ' + n.name);
  report.info.mobTop = mob.children.map(n => n.type + ' ' + n.name);
});

await step('prototype check', async () => {
  report.info.flowStarts = p02.flowStartingPoints.map(f => f.name);
  let broken = 0, total = 0;
  for (const n of p02.findAll(n => 'reactions' in n && n.reactions && n.reactions.length)) {
    for (const r of n.reactions) for (const a of (r.actions || (r.action ? [r.action] : []))) {
      if (a && a.destinationId) { total++; const d = await figma.getNodeByIdAsync(a.destinationId); if (!d) broken++; }
    }
  }
  report.info.reactions = total + ' links, ' + broken + ' broken';
});

return report;
