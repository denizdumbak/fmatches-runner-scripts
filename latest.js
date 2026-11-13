// step 394 · giris yapmamis (visitor) arama hali: Player result ve Person result'a Action=Log in varyantlari (yildiz yok, "Log in to message"), Search / Players · Logged out · Desktop + Mobile (Header Logged out, Ticker Visitor 1)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
async function setText(t, s) { const f = t.fontName; if (f === figma.mixed) { await figma.loadFontAsync(t.getRangeFontName(0, 1)); } else { await figma.loadFontAsync(f); } t.characters = s; }
const stateKey = n => Object.keys(n.componentProperties || {}).find(k => /^State/.test(k));
const stateOf = n => { const k = stateKey(n); return k ? n.componentProperties[k].value : null; };
async function clearNav(root) { for (const n of [root].concat(root.findAll(() => true))) { try { const rs = n.reactions; if (!rs || !rs.length) continue; const keep = rs.filter(r => !(r.actions || (r.action ? [r.action] : [])).some(isNavAct)); if (keep.length !== rs.length) await n.setReactionsAsync(keep); } catch (e) {} } }
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const sWeb = web.children.find(n => n.type === 'SECTION' && n.name === 'Search results');
const sMob = mob.children.find(n => n.type === 'SECTION' && n.name === 'Search results');
const VIS = /Logged out/;

// ---------- 0. temizlik
await step('Temizlik', async () => {
  let n = 0;
  for (const sec of [sWeb, sMob]) for (const c of sec.children.slice()) if (/^Search \/ Players · Logged out/.test(c.name)) { c.remove(); n++; }
  for (const nm of ['Player result', 'Person result']) { const set = p01.findOne(x => x.type === 'COMPONENT_SET' && x.name === nm); if (!set) continue; for (const v of set.children.slice()) if (/Action=Log in/.test(v.name)) { v.remove(); n++; } }
  report.info.removed = n;
});

// ---------- 1. Action=Log in varyantlari
async function addLogin(setName) {
  await figma.setCurrentPageAsync(p01);
  const set = p01.findOne(x => x.type === 'COMPONENT_SET' && x.name === setName); if (!set) throw new Error(setName + ' yok');
  const sec = set.parent; const srcs = set.children.filter(v => /Action=Add to contacts/.test(v.name));
  const left = Math.min.apply(null, set.children.map(v => v.x)), right = Math.max.apply(null, set.children.map(v => v.x + v.width));
  const off = right - left + 24; const oldW = set.width; const made = [];
  for (const v of srcs) {
    const c = v.clone(); set.appendChild(c); c.name = v.name.replace('Action=Add to contacts', 'Action=Log in'); c.x = v.x + off; c.y = v.y;
    const star = c.findOne(n => n.name === 'Icon button · Shortlist'); if (star) star.visible = false;
    const btn = c.findOne(n => n.type === 'INSTANCE' && /^Button/.test(n.name));
    if (!btn) throw new Error('Button yok: ' + c.name);
    const lk = Object.keys(btn.componentProperties).find(k => /^Label/.test(k)); const sk = Object.keys(btn.componentProperties).find(k => /^Style/.test(k));
    const props = {}; if (lk) props[lk] = 'Log in to message'; if (sk) props[sk] = 'Secondary'; btn.setProperties(props);
    const lab = btn.findOne(n => n.type === 'TEXT' && n.name === 'Label'); if (lab) await setText(lab, 'Log in to message');
    btn.name = 'Button · Log in'; made.push(c.name + ' ' + R(c.width) + 'x' + R(c.height));
  }
  // set boyutu ve hover
  const nr = Math.max.apply(null, set.children.map(v => v.x + v.width)); const nb = Math.max.apply(null, set.children.map(v => v.y + v.height));
  const right16 = nr - left + 32; set.resizeWithoutConstraints(Math.max(set.width, right16 + (left < 0 ? 0 : left)), Math.max(set.height, nb + 16));
  for (const v of set.children) { if (!/Action=Log in/.test(v.name) || stateOf(v) !== 'Default') continue; const hov = set.children.find(h => h.name === v.name.replace('State=Default', 'State=Hover')); if (!hov) { report.errors.push('hover yok: ' + v.name); continue; } await v.setReactionsAsync([{ trigger: { type: 'ON_HOVER' }, actions: [{ type: 'NODE', destinationId: hov.id, navigation: 'CHANGE_TO', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.15 }, preserveScrollPosition: false, resetVideoPosition: false }] }]); }
  // Section genisligi, sagdaki Section'lar kayar
  const grow = set.width - oldW; const need = set.x + set.width + 80; const moved = [];
  if (sec.width < need) { const d = need - sec.width; const oldRight = sec.x + sec.width; sec.resizeWithoutConstraints(Math.ceil(need), sec.height); for (const o of p01.children) if (o !== sec && o.type === 'SECTION' && o.x >= oldRight - 1) { o.x += d; moved.push(o.name); } }
  report.info[setName] = { made, set: R(set.width) + 'x' + R(set.height), sectionWidth: R(sec.width), grew: R(grow), shifted: moved };
  await figma.setCurrentPageAsync(p02);
}
await step('Player result · Action=Log in', async () => { await addLogin('Player result'); });
await step('Person result · Action=Log in', async () => { await addLogin('Person result'); });
await figma.setCurrentPageAsync(p02);

// ---------- 2. ziyaretci ekranlari
const playerSet = p01.findOne(x => x.type === 'COMPONENT_SET' && x.name === 'Player result');
async function visitor(sec, device) {
  const src = sec.children.find(c => c.name === 'Search / Players · ' + device); if (!src) throw new Error('Players ' + device + ' yok');
  const f = src.clone(); sec.appendChild(f); f.name = 'Search / Players · Logged out · ' + device; await clearNav(f);
  const nav = f.children.find(c => c.type === 'INSTANCE' && /^Navigation/.test(c.name)); const tk = f.children.find(c => c.type === 'INSTANCE' && /^Ticker/.test(c.name));
  const sk = nav && stateKey(nav); if (!nav || !sk) throw new Error('Navigation State yok'); nav.setProperties({ [sk]: 'Logged out' });
  const rk = tk && Object.keys(tk.componentProperties).find(k => /^Role/.test(k)); if (!tk || !rk) throw new Error('Ticker Role yok'); tk.setProperties({ [rk]: 'Visitor 1' });
  const st = nav.findOne(n => n.type === 'TEXT' && /^Search players/.test(n.name)); if (st) await setText(st, 'riverside');
  const rows = f.findAll(n => n.type === 'INSTANCE' && /^Player ·/.test(n.name)); let swapped = 0;
  const v = playerSet.children.find(x => x.name === 'Device=' + device + ', Action=Log in, State=Default'); if (!v) throw new Error('Log in varyanti yok ' + device);
  for (const r of rows) { r.swapComponent(v); swapped++; }
  return { f, info: { frame: R(f.width) + 'x' + R(f.height), nav: nav.name + ' ' + R(nav.height) + ' ' + stateOf(nav), ticker: Object.keys(tk.componentProperties).map(k => k.replace(/#.*/, '') + '=' + tk.componentProperties[k].value).join(','), rows: swapped, search: st ? st.characters : 'yok' } };
}
const frames = [];
await step('Players · Logged out · Desktop', async () => {
  const r = await visitor(sWeb, 'Desktop'); const mgr = sWeb.children.find(c => c.name === 'Search / Managers & officials · Desktop');
  r.f.x = 3920; r.f.y = mgr ? mgr.y : 3000; frames.push(r.f); report.info.visitorDesktop = r.info;
});
await step('Players · Logged out · Mobile', async () => {
  const r = await visitor(sMob, 'Mobile'); r.f.x = 80 + 11 * 470; r.f.y = 100; frames.push(r.f); report.info.visitorMobile = r.info;
});

// ---------- 3. Section boyutlari
await step('Section boyutlari', async () => {
  const settle = (plat, sec) => { const secs = plat.children.filter(n => n.type === 'SECTION').sort((a, b) => a.y - b.y); let prev = null; const moved = []; for (const s of secs) { if (s === sec) { prev = s.y + s.height; continue; } if (prev === null) continue; if (s.y < prev + 160) { moved.push(s.name + ' ' + R(s.y) + ' -> ' + R(prev + 160)); s.y = prev + 160; } prev = s.y + s.height; } plat.resizeWithoutConstraints(plat.width, Math.ceil(Math.max.apply(null, plat.children.map(n => n.y + n.height)) + 120)); return moved; };
  const wr = Math.max.apply(null, sWeb.children.map(c => c.x + c.width)), wb = Math.max.apply(null, sWeb.children.map(c => c.y + c.height));
  sWeb.resizeWithoutConstraints(Math.ceil(Math.max(sWeb.width, wr + 80)), Math.ceil(wb + 80));
  const mr = Math.max.apply(null, sMob.children.map(c => c.x + c.width)), mb = Math.max.apply(null, sMob.children.map(c => c.y + c.height));
  sMob.resizeWithoutConstraints(Math.ceil(mr + 80), Math.ceil(mb + 80));
  if (mob.width < sMob.x + sMob.width + 120) mob.resizeWithoutConstraints(Math.ceil(sMob.x + sMob.width + 120), mob.height);
  report.info.movedWeb = settle(web, sWeb); report.info.movedMob = settle(mob, sMob);
  report.info.sections = 'Web ' + R(sWeb.width) + 'x' + R(sWeb.height) + ' · Mobile ' + R(sMob.width) + 'x' + R(sMob.height);
});
await step('Kontrol', async () => {
  const bb = n => n.absoluteBoundingBox; const out = {};
  for (const [nm, sec] of [['web', sWeb], ['mobile', sMob]]) { const ov = []; const k = sec.children.filter(c => c.type === 'FRAME'); for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) { const a = bb(k[i]), b = bb(k[j]); if (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y) ov.push(k[i].name + ' x ' + k[j].name); } out[nm] = ov.length ? ov : 'none'; }
  report.info.screenOverlaps = out;
  const set = p01.findOne(x => x.type === 'COMPONENT_SET' && x.name === 'Player result'); const ov2 = []; const sec = set.parent;
  for (const o of sec.children) if (o !== set) { const a = bb(set), b = bb(o); if (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y) ov2.push(o.name); }
  report.info.playerResultOverlaps = ov2.length ? ov2 : 'none';
  const pset = p01.findOne(x => x.type === 'COMPONENT_SET' && x.name === 'Person result'); const ov3 = []; for (const o of pset.parent.children) if (o !== pset) { const a = bb(pset), b = bb(o); if (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y) ov3.push(o.name); } report.info.personResultOverlaps = ov3.length ? ov3 : 'none';
  let uns = 0, dash = 0; for (const f of frames) for (const t of f.findAll(n => n.type === 'TEXT')) { if (typeof t.textStyleId === 'string' && t.textStyleId === '') uns++; if (t.characters.indexOf(String.fromCharCode(8212)) >= 0) dash++; }
  report.info.unstyledText = uns; report.info.longDash = dash; report.info.flowStarts = p02.flowStartingPoints.length;
  report.info.variantNames = { player: set.children.length, person: pset.children.length };
});
return JSON.stringify(report, null, 1);
