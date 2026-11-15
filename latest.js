// step 414 · Faz 8 kapanis: e-posta karti 600 px, Resend email -> e-posta, Go to my profile -> Own profile, 01 kokundeki 25 yetim oge 01 Archive Section'ina, Map key button -> 7 · Map, System / No connection ekranlari 03 · Archive'a, Offline state aciklamasi
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const sz = n => R(n.width) + 'x' + R(n.height);
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const p03 = figma.root.children.find(p => /^03/.test(p.name)); await p03.loadAsync();
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
const nav = dest => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
const findSet = nm => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === nm);
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const secOf = (plat, re) => plat.children.find(n => n.type === 'SECTION' && re.test(n.name));
const signSec = { Web: secOf(web, /^Sign up/), Mobile: secOf(mob, /^Sign up/) };
const ownSec = { Web: secOf(web, /^Own profile/), Mobile: secOf(mob, /^Own profile/) };
const offSec = { Web: secOf(web, /^Offline/), Mobile: secOf(mob, /^Offline/) };
async function addLink(el, dest) { const keep = (el.reactions || []).filter(r => !(r.actions || []).some(isNavAct)); await el.setReactionsAsync(keep.concat([nav(dest)])); }

// ---------- 1. e-posta karti 600 px (Desktop), Email verified'i saga it
await step('Email karti 600', async () => {
  const sec = signSec.Web;
  const em = sec.children.find(n => n.name === 'Email / Verify email · Desktop');
  const v = sec.children.find(n => n.name === 'Signup / Email verified · Desktop');
  const card = em.findOne(n => n.name === 'Email card'); const before = sz(card);
  em.resize(696, em.height); em.primaryAxisSizingMode = 'AUTO';
  v.x = em.x + em.width + 160;
  report.info.emailCard = before + ' -> ' + sz(card) + ' (outer ' + sz(em) + ')';
});

// ---------- 2. prototip
const S = {};
for (const key of ['Web', 'Mobile']) {
  const dev = key === 'Web' ? 'Desktop' : 'Mobile', sec = signSec[key];
  S[key] = { em: sec.children.find(n => n.name === 'Email / Verify email · ' + dev), v: sec.children.find(n => n.name === 'Signup / Email verified · ' + dev), chk: sec.children.find(n => n.type === 'FRAME' && /check your email/i.test(n.name) && new RegExp('· ' + dev + '$').test(n.name)) };
}
await step('Prototip', async () => {
  const links = []; report.info.ownCandidates = {};
  for (const key of ['Web', 'Mobile']) {
    const dev = key === 'Web' ? 'Desktop' : 'Mobile', s = S[key], os = ownSec[key];
    if (s.chk && s.em) { const rb = s.chk.findOne(n => n.type === 'INSTANCE' && n.name === 'Button · Resend email'); if (rb) { await addLink(rb, s.em); links.push(s.chk.name + ' :: Resend email -> ' + s.em.name); } else report.errors.push('Resend email yok (' + key + ')'); }
    const frames = os ? os.children.filter(n => n.type === 'FRAME' && new RegExp('· ' + dev + '$').test(n.name)) : [];
    report.info.ownCandidates[key] = frames.map(n => n.name + ' ' + sz(n));
    const prof = frames.filter(n => !/edit|new member|empty|view as|change|cancel|menu|dialog|block|report/i.test(n.name)).sort((a, b) => a.x - b.x || a.y - b.y)[0];
    const btn = s.v && s.v.findOne(n => n.name === 'Button · Go to my profile');
    if (prof && btn) { await addLink(btn, prof); links.push(s.v.name + ' :: Go to my profile -> ' + prof.name); } else report.errors.push('Own profile baglantisi kurulamadi (' + key + '): prof=' + (prof ? prof.name : 'yok') + ' btn=' + (btn ? 'var' : 'yok'));
  }
  report.info.links = links;
});

// ---------- 3. 01 kokundeki yetimler
await step('01 yetimler', async () => {
  const arch = p01.findOne(n => n.type === 'SECTION' && /^Archive/.test(n.name));
  const mapSec = p01.findOne(n => n.type === 'SECTION' && /^7 · Map/.test(n.name));
  if (!arch) throw new Error('01 Archive Section yok');
  const known = /^(Foundations|Start here)/;
  const list = p01.children.filter(n => n.type !== 'SECTION' && !known.test(n.name));
  const mk = list.find(n => n.type === 'COMPONENT' && n.name === 'Map key button');
  const strays = list.filter(n => n !== mk);
  const names = strays.map(n => n.name);
  const bot = s => Math.max.apply(null, s.children.map(c => c.y + c.height));
  let y = (arch.children.length ? bot(arch) : 0) + 120, moved = 0;
  for (const n of strays) { arch.appendChild(n); n.x = 80; n.y = y; y += n.height + 40; moved++; }
  const right = Math.max.apply(null, arch.children.map(c => c.x + c.width)), bottom = Math.max.apply(null, arch.children.map(c => c.y + c.height));
  arch.resizeWithoutConstraints(Math.max(arch.width, Math.ceil(right + 80)), Math.ceil(bottom + 80));
  report.info.archived01 = moved + ' oge, Archive Section ' + sz(arch);
  if (mk) {
    let inst = -1; try { inst = (await mk.getInstancesAsync()).length; } catch (e) {}
    if (mapSec) { mapSec.appendChild(mk); mk.x = 80; mk.y = bot(mapSec) + 120; const r = Math.max.apply(null, mapSec.children.map(c => c.x + c.width)), b = Math.max.apply(null, mapSec.children.map(c => c.y + c.height)); mapSec.resizeWithoutConstraints(Math.max(mapSec.width, Math.ceil(r + 80)), Math.ceil(b + 80)); report.info.mapKeyButton = 'instance ' + inst + ', 7 · Map Section\'ina tasindi @' + R(mk.x) + ',' + R(mk.y); }
    else report.errors.push('7 · Map Section yok, Map key button yerinde (instance ' + inst + ')');
  }
  const left = p01.children.filter(n => n.type !== 'SECTION' && !known.test(n.name));
  report.info.orphansLeft01 = left.length;
});

// ---------- 4. No connection ekranlari 03 · Archive'a
await step('No connection -> Archive', async () => {
  const frames = [];
  for (const key of ['Web', 'Mobile']) { const f = offSec[key] && offSec[key].children.find(n => n.type === 'FRAME' && /^System \/ No connection · /.test(n.name)); if (f) frames.push(f); else report.errors.push('No connection yok (' + key + ')'); }
  const ids = new Set(frames.map(f => f.id)); const into = [];
  for (const key of ['Web', 'Mobile']) for (const n of offSec[key].findAll(() => true)) { try { for (const r of (n.reactions || [])) for (const a of (r.actions || (r.action ? [r.action] : []))) if (a && ids.has(a.destinationId)) into.push(n.name); } catch (e) {} }
  report.info.linksIntoNoConnection = into.length ? into : 'none';
  let x = Math.max.apply(null, [0].concat(p03.children.map(n => n.x + n.width))) + 400;
  for (const f of frames) { const nm = f.name; p03.appendChild(f); f.x = x; f.y = 0; x += f.width + 160; }
  const mine = new Set(frames.map(f => f.id));
  p02.flowStartingPoints = p02.flowStartingPoints.filter(f => !mine.has(f.nodeId));
  report.info.archived02 = frames.map(f => f.name + ' ' + sz(f));
  for (const key of ['Web', 'Mobile']) { const s = offSec[key]; const kids = s.children; report.info['offline' + key] = kids.map(n => n.type + ' · ' + n.name + (n.type === 'TEXT' ? ' "' + n.characters.slice(0, 60) + '"' : '')); const r = Math.max.apply(null, kids.map(c => c.x + c.width)), b = Math.max.apply(null, kids.map(c => c.y + c.height)); s.resizeWithoutConstraints(Math.ceil(r + 80), Math.ceil(b + 80)); }
});
await step('Offline state aciklamasi', async () => {
  const set = findSet('Offline state'); const add = ' Optional: the full-page "No connection" screens are archived (03 · Archive), not in the flow. Only needed if the site gets a service worker that lets it open offline.';
  if (set.description.indexOf('Optional: the full-page') < 0) set.description = set.description + add;
  report.info.offlineStateDescription = set.description.length + ' karakter';
});

// ---------- 5. oturtma ve kontrol
function settle(plat) {
  const secs = plat.children.filter(n => n.type === 'SECTION').sort((a, b) => a.y - b.y);
  const moved = [];
  for (let i = 1; i < secs.length; i++) {
    const s = secs[i]; let need = -Infinity;
    for (let j = 0; j < i; j++) { const a = secs[j]; if (a.x < s.x + s.width && s.x < a.x + a.width) need = Math.max(need, a.y + a.height + 160); }
    if (need > s.y) { moved.push(s.name + ' ' + R(s.y) + ' -> ' + R(need)); s.y = need; }
  }
  const bottom = Math.max.apply(null, plat.children.map(n => n.y + n.height)), right = Math.max.apply(null, plat.children.map(n => n.x + n.width));
  plat.resizeWithoutConstraints(Math.max(plat.width, right + 120), Math.ceil(bottom + 120));
  return moved;
}
await step('Oturtma ve kontrol', async () => {
  for (const key of ['Web', 'Mobile']) { const sec = signSec[key]; const r = Math.max.apply(null, sec.children.map(n => n.x + n.width)), b = Math.max.apply(null, sec.children.map(n => n.y + n.height)); sec.resizeWithoutConstraints(Math.ceil(r + 80), Math.ceil(b + 80)); }
  report.info.moved = { Web: settle(web), Mobile: settle(mob) };
  mob.x = Math.max(mob.x, web.x + web.width + 400);
  const ov = [];
  for (const plat of [web, mob]) { const ss = plat.children.filter(n => n.type === 'SECTION');
    for (let i = 0; i < ss.length; i++) for (let j = i + 1; j < ss.length; j++) { const a = ss[i], b = ss[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov.push(plat.name + ': ' + a.name + ' x ' + b.name); } }
  const scrOv = [];
  for (const key of ['Web', 'Mobile']) { const fr = signSec[key].children.filter(n => n.type === 'FRAME');
    for (let i = 0; i < fr.length; i++) for (let j = i + 1; j < fr.length; j++) { const a = fr[i], b = fr[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) scrOv.push(a.name + ' x ' + b.name); } }
  const secs01 = p01.children.filter(n => n.type === 'SECTION'), ov01 = [];
  for (let i = 0; i < secs01.length; i++) for (let j = i + 1; j < secs01.length; j++) { const a = secs01[i], b = secs01[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov01.push(a.name + ' x ' + b.name); }
  report.info.flowStarts = p02.flowStartingPoints.length;
  report.info.check = { sectionOverlaps02: ov.length ? ov : 'none', screenOverlapsSignUp: scrOv.length ? scrOv : 'none', sectionOverlaps01: ov01.length ? ov01 : 'none' };
});
return report;
