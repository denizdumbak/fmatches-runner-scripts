// step 419 · ideal giris turu: Own profile / Account menu (Role=Player) sayfasi + Scouts near you, My events, My contacts, Settings, Change password baglantilari; Log in -> Own profile; erisilebilirlik ve tur yollari
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const plats = { Web: p02.children.find(n => n.type === 'SECTION' && n.name === 'Web'), Mobile: p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile') };
const dev = { Web: 'Desktop', Mobile: 'Mobile' };
const actsOf = r => (r.actions || (r.action ? [r.action] : [])).filter(a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO' && a.destinationId);
const hasNav = n => { try { return !!(n.reactions && n.reactions.some(r => actsOf(r).length)); } catch (e) { return false; } };
const nav = dest => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
const topOf = n => { let c = n; while (c && c.parent && c.parent.type !== 'SECTION' && c.parent.type !== 'PAGE') c = c.parent; return c; };
const tapTarget = (t, frame) => { const p = t.parent; return (p && p.id !== frame.id && (p.type === 'FRAME' || p.type === 'INSTANCE' || p.type === 'COMPONENT') && p.children.length <= 3) ? p : t; };
const short = s => s.replace(/ · (Desktop|Mobile)$/, '');
const screens = {};
for (const key of ['Web', 'Mobile']) { screens[key] = {}; plats[key].findAll(n => n.type === 'FRAME' && n.parent && n.parent.type === 'SECTION' && n.parent !== plats[key]).forEach(f => { screens[key][f.name] = f; }); }
const scr = (key, name) => screens[key][name + ' · ' + dev[key]] || null;
const under = (n, re) => { let c = n.parent; while (c) { if (re.test(c.name)) return true; c = c.parent; } return false; };
const NEWNAME = 'Profiles / Player / Own profile / Account menu';

await step('Player Account menu sayfasi', async () => {
  const info = [];
  for (const key of ['Web', 'Mobile']) {
    const own = scr(key, 'Profiles / Player / Own profile'), evAcc = scr(key, 'Events / Account menu');
    if (!own || !evAcc) { report.errors.push(key + ': Own profile ya da Events / Account menu yok'); continue; }
    const ex = evAcc.findOne(n => n.type === 'INSTANCE' && /account menu/i.test(n.name));
    if (!ex) { report.errors.push(key + ': Events / Account menu icinde menu instance yok'); continue; }
    const newName = NEWNAME + ' · ' + dev[key];
    const old = plats[key].findOne(n => n.type === 'FRAME' && n.name === newName); if (old) old.remove();
    const sec = own.parent; const bottom = Math.max.apply(null, sec.children.map(c => c.y + c.height));
    const clone = own.clone(); sec.appendChild(clone); clone.name = newName; clone.x = own.x; clone.y = Math.ceil(bottom + 120);
    const navHolders = clone.findAll(n => hasNav(n)); if (hasNav(clone)) navHolders.push(clone);
    for (const n of navHolders) await n.setReactionsAsync(n.reactions.filter(r => !actsOf(r).length));
    const inst = ex.clone(); clone.appendChild(inst);
    if (clone.layoutMode && clone.layoutMode !== 'NONE') inst.layoutPositioning = 'ABSOLUTE';
    inst.x = ex.x; inst.y = ex.y; inst.setProperties({ Role: 'Player' });
    screens[key][newName] = clone;
    const rows = [['Scouts near you', /^Scouts near you$/, key === 'Web' ? 'Map / Scouts near you · ask' : 'Map / Scouts near you'], ['My events', /^My events$/, 'Events / My events'], ['My contacts', /^My contacts$/, 'Contacts / My contacts'], ['Settings', /^Settings$/, 'Settings / My settings'], ['Change password', /^Change password$/, 'Settings / Change password']];
    for (const rw of rows) {
      const dest = scr(key, rw[2]); if (!dest) { report.errors.push(key + ' menu satiri ' + rw[0] + ': hedef yok (' + rw[2] + ')'); continue; }
      const texts = inst.findAll(n => n.type === 'TEXT' && rw[1].test(n.characters));
      if (texts.length !== 1) { report.errors.push(key + ' menu satiri ' + rw[0] + ': ' + texts.length + ' aday metin, baglanmadi'); continue; }
      const el = tapTarget(texts[0], inst); await el.setReactionsAsync((el.reactions || []).filter(r => !actsOf(r).length).concat([nav(dest)]));
      info.push(key + ' menu: ' + rw[0] + ' -> ' + short(dest.name));
    }
    const hdr = own.findOne(n => n.name === 'Account actions') || own.findOne(n => n.name === 'Header actions');
    const btn = hdr && hdr.children[hdr.children.length - 1];
    if (!btn) { report.errors.push(key + ': Own profile header hesap dugmesi bulunamadi'); }
    else {
      const cur = btn.reactions || []; const dests = [];
      for (const r of cur) for (const a of actsOf(r)) { const d = await figma.getNodeByIdAsync(a.destinationId); dests.push(d ? d.name : 'silinmis'); }
      if (dests.length && !dests.every(d => d === 'silinmis' || d.indexOf(NEWNAME) === 0)) report.errors.push(key + ': hesap dugmesi baska ekrana bagli (' + dests.join(', ') + '), degistirilmedi');
      else { await btn.setReactionsAsync(cur.filter(r => !actsOf(r).length).concat([nav(clone)])); info.push(key + ' Own profile hesap dugmesi (' + btn.name + ') -> ' + short(clone.name)); }
    }
    const r = Math.max.apply(null, sec.children.map(c => c.x + c.width)), b = Math.max.apply(null, sec.children.map(c => c.y + c.height));
    sec.resizeWithoutConstraints(Math.max(sec.width, Math.ceil(r + 80)), Math.ceil(b + 80));
    info.push(key + ' yeni sayfa ' + R(clone.width) + 'x' + R(clone.height) + ' @' + R(clone.x) + ',' + R(clone.y) + ', temizlenen eski baglanti ' + navHolders.length);
  }
  report.info.accountMenuPage = info;
});

await step('Log in -> Own profile', async () => {
  const out = [];
  for (const key of ['Web', 'Mobile']) {
    const lg = scr(key, 'Log in'), own = scr(key, 'Profiles / Player / Own profile'); if (!lg || !own) { report.errors.push(key + ': Log in ya da Own profile yok'); continue; }
    const texts = lg.findAll(n => n.type === 'TEXT' && /^Log in$/.test(n.characters) && !under(n, /^(Navigation|Header|Footer|Ticker)/i));
    if (texts.length !== 1) { report.errors.push(key + ' Log in gonder dugmesi: ' + texts.length + ' aday, baglanmadi; metinler: ' + lg.findAll(n => n.type === 'TEXT' && n.visible && n.characters.length <= 24).map(t => t.characters).slice(0, 30).join(' | ')); continue; }
    const el = tapTarget(texts[0], lg);
    if (hasNav(el)) { const d = []; for (const r of el.reactions) for (const a of actsOf(r)) { const x = await figma.getNodeByIdAsync(a.destinationId); d.push(x ? x.name : 'silinmis'); } report.errors.push(key + ' Log in dugmesi zaten bagli: ' + d.join(', ') + ', degistirilmedi'); continue; }
    await el.setReactionsAsync((el.reactions || []).concat([nav(own)])); out.push(key + ': Log in "' + texts[0].characters + '" (' + el.name + ') -> ' + short(own.name));
  }
  report.info.loginLinks = out;
});

function settle(plat) {
  const secs = plat.children.filter(n => n.type === 'SECTION').sort((a, b) => a.y - b.y); const moved = [];
  for (let i = 1; i < secs.length; i++) { const s = secs[i]; let need = -Infinity; for (let j = 0; j < i; j++) { const a = secs[j]; if (a.x < s.x + s.width && s.x < a.x + a.width) need = Math.max(need, a.y + a.height + 160); } if (need > s.y) { moved.push(s.name + ' ' + R(s.y) + ' -> ' + R(need)); s.y = need; } }
  const bottom = Math.max.apply(null, plat.children.map(n => n.y + n.height)), right = Math.max.apply(null, plat.children.map(n => n.x + n.width));
  plat.resizeWithoutConstraints(Math.max(plat.width, right + 120), Math.ceil(bottom + 120)); return moved;
}
await step('Section oturtma', async () => {
  report.info.moved = { Web: settle(plats.Web), Mobile: settle(plats.Mobile) };
  plats.Mobile.x = Math.max(plats.Mobile.x, plats.Web.x + plats.Web.width + 400);
  const ov = []; for (const plat of [plats.Web, plats.Mobile]) { const ss = plat.children.filter(n => n.type === 'SECTION'); for (let i = 0; i < ss.length; i++) for (let j = i + 1; j < ss.length; j++) { const a = ss[i], b = ss[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov.push(plat.name + ': ' + a.name + ' x ' + b.name); } }
  report.info.sectionOverlaps = ov.length ? ov : 'none';
});

const tour = ['Search / All results', 'Profiles / Player', 'Messenger / Default', 'Messenger / Chat list', 'Log in', 'Profiles / Player / Own profile', 'Profiles / Player / Own profile / Account menu', 'Map / Default', 'Map / Scouts near you · ask', 'Map / Scouts near you', 'Events / My events', 'Contacts / My contacts', 'Settings / My settings', 'Settings / Change password', 'Notifications / Notifications', 'Shortlists / Shortlists', 'Clubs / Club card', 'Facilities / Stadium card', 'System / Privacy policy'];
await step('Erisilebilirlik ve tur yollari', async () => {
  for (const key of ['Web', 'Mobile']) {
    const byId = {}, adj = {}; const list = Object.keys(screens[key]).map(k => screens[key][k]); list.forEach(s => { byId[s.id] = s; });
    for (const s of list) {
      adj[s.id] = {}; const holders = s.findAll(n => hasNav(n)); if (hasNav(s)) holders.push(s);
      for (const h of holders) for (const r of h.reactions) for (const a of actsOf(r)) { let d = null; try { d = await figma.getNodeByIdAsync(a.destinationId); } catch (e) {} if (!d) continue; const t = topOf(d); if (t && byId[t.id]) adj[s.id][t.id] = 1; }
    }
    const home = scr(key, 'Home / Main'); const prev = {}; prev[home.id] = null; const q = [home.id];
    while (q.length) { const id = q.shift(); Object.keys(adj[id]).forEach(t => { if (!(t in prev)) { prev[t] = id; q.push(t); } }); }
    const paths = {};
    for (const f of tour) { const s = scr(key, f); if (!s) continue; if (!(s.id in prev)) { paths[f] = 'ULASILAMIYOR'; continue; } const chain = []; let c = s.id; while (prev[c] !== null) { chain.unshift(short(byId[c].name)); c = prev[c]; } paths[f] = chain.length + ' tik' + (chain.length > 3 ? ' (...' + chain.slice(-3).join(' > ') + ')' : ': ' + chain.join(' > ')); }
    const un = list.filter(s => !(s.id in prev) && !/^Note · /.test(s.name)).length;
    report.info['tour' + key] = { reachable: Object.keys(prev).length, total: list.length, unreachable: un, paths: paths };
  }
});
return report;
