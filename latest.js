// step 247 · 02 Web layout: sections in one left-aligned column (x 120, gap 160), Map and Messenger as 6-column grids, stray nodes to 03 Archive, Web narrowed, Mobile shifted
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const p02 = figma.root.children.find(p => /^02/.test(p.name)); const p03 = figma.root.children.find(p => /^03/.test(p.name));
await p02.loadAsync(); await p03.loadAsync();
const web = p02.children.find(n => n.type === 'SECTION' && /^Web/.test(n.name)); const mob = p02.children.find(n => n.type === 'SECTION' && /^Mobile/.test(n.name));
if (!web || !mob) throw new Error('Web or Mobile section missing');
const sec = name => { const s = web.children.find(n => n.type === 'SECTION' && n.name === name); if (!s) throw new Error('Web section missing: ' + name); return s; };
const oldWeb = { w: web.width, h: web.height, mobX: mob.x };
const mapSec = sec('Map'), msgSec = sec('Messenger'), home = sec('Home page'), cal = sec('Home page · calendar view');
report.info.before = 'web ' + R(web.width) + 'x' + R(web.height) + ' mobile x ' + R(mob.x);

// 1) strays -> Archive (nothing deleted)
let archY = 0; for (const c of p03.children) archY = Math.max(archY, c.y + c.height); archY += 200;
function toArchive(node) { p03.appendChild(node); node.x = 0; node.y = archY; archY += Math.ceil(node.height) + 120; }
await step('strays', async () => {
  const moved = [];
  const scoutsNone = web.children.find(n => n.type === 'FRAME' && n.name === 'Map / Scouts near you · none · Desktop');
  if (scoutsNone) { mapSec.appendChild(scoutsNone); moved.push('page "' + scoutsNone.name + '" -> Map section'); }
  for (const n of web.children.slice()) {
    if ((n.type === 'COMPONENT' && n.name === 'Kind=Club') || (n.type === 'INSTANCE' && n.name === 'Map marker')) { moved.push(n.type + ' "' + n.name + '" ' + R(n.width) + 'x' + R(n.height) + ' -> Archive'); toArchive(n); }
  }
  const own = sec('Own profile'); const ownNames = own.children.filter(n => n.type === 'GROUP').map(g => g.name);
  for (const n of p02.children.slice()) {
    if (n.type === 'GROUP' && /^Flow · Edit details/.test(n.name)) { const dup = ownNames.indexOf(n.name) >= 0; moved.push('GROUP "' + n.name + '" ' + R(n.width) + 'x' + R(n.height) + ' @' + R(n.x) + ' -> Archive (same name inside Own profile: ' + (dup ? 'yes, duplicate' : 'NO') + ')'); toArchive(n); }
  }
  report.info.strays = moved.length ? moved : 'none found';
  report.info.ownProfileGroups = ownNames.join(' | ');
});

// 2) grids for Map and Messenger
function grid(s, frames, cols) {
  frames.forEach((f, i) => { f.x = 80 + (i % cols) * 1920; f.y = 100 + Math.floor(i / cols) * 1250; });
  let right = 0, bottom = 0; for (const f of frames) { right = Math.max(right, f.x + f.width); bottom = Math.max(bottom, f.y + f.height); }
  s.resizeWithoutConstraints(Math.ceil(right + 80), Math.ceil(bottom + 80));
  return s.name + ' ' + frames.length + ' pages -> ' + R(s.width) + 'x' + R(s.height);
}
await step('Map grid', async () => {
  const frames = mapSec.children.filter(n => n.type === 'FRAME');
  const none = frames.find(f => f.name === 'Map / Scouts near you · none · Desktop');
  const rest = frames.filter(f => f !== none).sort((a, b) => (Math.round(a.y / 50) - Math.round(b.y / 50)) || (a.x - b.x));
  const ordered = none ? rest.concat([none]) : rest;
  report.info.mapGrid = grid(mapSec, ordered, 6); report.info.mapOrder = ordered.map(f => f.name.replace('Map / ', '').replace(' · Desktop', '')).join(' | ');
});
await step('Messenger grid', async () => {
  const frames = msgSec.children.filter(n => n.type === 'FRAME').sort((a, b) => (Math.round(a.y / 50) - Math.round(b.y / 50)) || (a.x - b.x));
  report.info.msgGrid = grid(msgSec, frames, 6); report.info.msgOrder = frames.map(f => f.name.replace('Messenger / ', '').replace(' · Desktop', '')).join(' | ');
});

// 3) calendar section: left edge to 120, page and arrow stay where they are
await step('calendar section left edge', async () => {
  const page = cal.children.find(n => n.type === 'FRAME'); const before = page.absoluteBoundingBox.x;
  const shift = cal.x - 120;
  if (shift !== 0) { const kids = cal.children.slice(); cal.x = 120; cal.resizeWithoutConstraints(cal.width + shift, cal.height); for (const k of kids) k.x += shift; }
  report.info.calendar = 'section x ' + R(cal.x) + ' w ' + R(cal.width) + ' · page abs x before ' + R(before) + ' after ' + R(page.absoluteBoundingBox.x);
});

// 4) one column
await step('stack sections', async () => {
  const order = ['Profiles · player', 'Profiles · other roles', 'Own profile', 'Sign up', 'Log in', 'Map', 'Messenger'];
  home.x = 120;
  let y = cal.y + cal.height + 160; const out = [];
  for (const nm of order) { const s = sec(nm); s.x = 120; s.y = y; out.push(nm + ' y ' + R(s.y) + ' h ' + R(s.height)); y += s.height + 160; }
  report.info.stack = out;
  report.info.homeAndCalendar = 'home y ' + R(home.y) + '..' + R(home.y + home.height) + ' · calendar y ' + R(cal.y) + '..' + R(cal.y + cal.height);
});

// 5) Web size, Mobile shift
await step('Web size and Mobile shift', async () => {
  let right = 0, bottom = 0; for (const c of web.children) { right = Math.max(right, c.x + c.width); bottom = Math.max(bottom, c.y + c.height); }
  web.resizeWithoutConstraints(Math.ceil(right + 120), Math.ceil(bottom + 120));
  mob.x = web.x + web.width + 400;
  report.info.after = 'web ' + R(web.width) + 'x' + R(web.height) + ' (was ' + R(oldWeb.w) + 'x' + R(oldWeb.h) + ') · mobile x ' + R(mob.x) + ' (was ' + R(oldWeb.mobX) + ')';
});

// 6) checks
await step('checks', async () => {
  const subs = web.children.filter(n => n.type === 'SECTION').sort((a, b) => a.y - b.y);
  report.info.order = subs.map((s, i) => s.name + ' x ' + R(s.x) + ' y ' + R(s.y) + ' ' + R(s.width) + 'x' + R(s.height) + (i ? ' gap ' + R(s.y - (subs[i - 1].y + subs[i - 1].height)) : '')).join(' | ');
  const hits = []; const kids = web.children.filter(n => n.type === 'SECTION' || n.type === 'FRAME');
  for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) { const a = kids[i].absoluteBoundingBox, b = kids[j].absoluteBoundingBox; if (a && b && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) hits.push(kids[i].name + ' x ' + kids[j].name); }
  report.info.overlaps = hits.length ? hits : 'none';
  const outside = []; for (const s of subs) for (const c of s.children) { if (c.x < -1 || c.y < -1 || c.x + c.width > s.width + 1 || c.y + c.height > s.height + 1) outside.push(s.name + ' > ' + c.name); }
  report.info.outsideParent = outside.length ? outside.slice(0, 10) : 'none';
  report.info.webChildrenNow = web.children.filter(n => n.type !== 'SECTION').map(n => n.type + ':' + n.name + ' @' + R(n.x) + ',' + R(n.y)).join(' | ');
  report.info.topLevel = p02.children.map(s => s.type + ':' + s.name + ' @' + R(s.x) + ',' + R(s.y) + ' ' + R(s.width) + 'x' + R(s.height)).join(' | ');
});
return report;
