// step 420 · ideal giris: Log in gonder dugmesi Wrong password yerine Own profile'a (hata ekrani dosyada kalir); tur yollari yeniden olculur
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const plats = { Web: p02.children.find(n => n.type === 'SECTION' && n.name === 'Web'), Mobile: p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile') };
const dev = { Web: 'Desktop', Mobile: 'Mobile' };
const actsOf = r => (r.actions || (r.action ? [r.action] : [])).filter(a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO' && a.destinationId);
const hasNav = n => { try { return !!(n.reactions && n.reactions.some(r => actsOf(r).length)); } catch (e) { return false; } };
const nav = dest => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
const topOf = n => { let c = n; while (c && c.parent && c.parent.type !== 'SECTION' && c.parent.type !== 'PAGE') c = c.parent; return c; };
const tapTarget = (t, frame) => { const p = t.parent; return (p && p.id !== frame.id && (p.type === 'FRAME' || p.type === 'INSTANCE' || p.type === 'COMPONENT') && p.children.length <= 3) ? p : t; };
const short = s => s.replace(/ · (Desktop|Mobile)$/, '');
const under = (n, re) => { let c = n.parent; while (c) { if (re.test(c.name)) return true; c = c.parent; } return false; };
const screens = {};
for (const key of ['Web', 'Mobile']) { screens[key] = {}; plats[key].findAll(n => n.type === 'FRAME' && n.parent && n.parent.type === 'SECTION' && n.parent !== plats[key]).forEach(f => { screens[key][f.name] = f; }); }
const scr = (key, name) => screens[key][name + ' · ' + dev[key]] || null;

await step('Log in -> Own profile', async () => {
  const out = [];
  for (const key of ['Web', 'Mobile']) {
    const lg = scr(key, 'Log in'), own = scr(key, 'Profiles / Player / Own profile'); if (!lg || !own) { report.errors.push(key + ': Log in ya da Own profile yok'); continue; }
    const texts = lg.findAll(n => n.type === 'TEXT' && /^Log in$/.test(n.characters) && !under(n, /^(Navigation|Header|Footer|Ticker)/i));
    if (texts.length !== 1) { report.errors.push(key + ' Log in gonder dugmesi: ' + texts.length + ' aday, degistirilmedi'); continue; }
    const el = tapTarget(texts[0], lg); const dests = [];
    for (const r of (el.reactions || [])) for (const a of actsOf(r)) { const d = await figma.getNodeByIdAsync(a.destinationId); dests.push(d ? d.name : 'silinmis'); }
    if (dests.length && !dests.every(d => d.indexOf('Log in / Wrong password') === 0 || d === 'silinmis' || d.indexOf('Profiles / Player / Own profile') === 0)) { report.errors.push(key + ' Log in dugmesi baska ekrana bagli (' + dests.join(', ') + '), degistirilmedi'); continue; }
    await el.setReactionsAsync((el.reactions || []).filter(r => !actsOf(r).length).concat([nav(own)]));
    out.push(key + ': Log in (' + el.name + ') ' + (dests.length ? dests.map(short).join(', ') : 'baglantisiz') + ' -> ' + short(own.name));
  }
  report.info.loginLinks = out;
});

const tour = ['Log in', 'Profiles / Player / Own profile', 'Profiles / Player / Own profile / Account menu', 'Map / Scouts near you · ask', 'Map / Scouts near you', 'Events / My events', 'Contacts / My contacts', 'Settings / My settings', 'Settings / Change password', 'Notifications / Notifications', 'Shortlists / Shortlists', 'Messenger / Default', 'Messenger / Chat list', 'Clubs / Club card', 'Facilities / Stadium card'];
await step('Tur yollari', async () => {
  for (const key of ['Web', 'Mobile']) {
    const byId = {}, adj = {}; const list = Object.keys(screens[key]).map(k => screens[key][k]); list.forEach(s => { byId[s.id] = s; });
    for (const s of list) {
      adj[s.id] = {}; const holders = s.findAll(n => hasNav(n)); if (hasNav(s)) holders.push(s);
      for (const h of holders) for (const r of h.reactions) for (const a of actsOf(r)) { let d = null; try { d = await figma.getNodeByIdAsync(a.destinationId); } catch (e) {} if (!d) continue; const t = topOf(d); if (t && byId[t.id]) adj[s.id][t.id] = 1; }
    }
    const home = scr(key, 'Home / Main'); const prev = {}; prev[home.id] = null; const q = [home.id];
    while (q.length) { const id = q.shift(); Object.keys(adj[id]).forEach(t => { if (!(t in prev)) { prev[t] = id; q.push(t); } }); }
    const paths = {};
    for (const f of tour) { const s = scr(key, f); if (!s) continue; if (!(s.id in prev)) { paths[f] = 'ULASILAMIYOR'; continue; } const chain = []; let c = s.id; while (prev[c] !== null) { chain.unshift(short(byId[c].name)); c = prev[c]; } paths[f] = chain.length + ' tik: ' + chain.join(' > '); }
    const un = list.filter(s => !(s.id in prev) && !/^Note · /.test(s.name)).length;
    report.info['tour' + key] = { reachable: Object.keys(prev).length, total: list.length, unreachable: un, paths: paths };
  }
});
return report;
