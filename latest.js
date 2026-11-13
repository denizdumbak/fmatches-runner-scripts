// step 390 · Faz 7 arama (4/4): prototip bag lantilari. Sekmeler (7), All results Show all dugmeleri, mobil Filters <-> liste, satir -> profil. Ok cizilmez (Faz 3-6 kurali)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
const acts = r => r.actions || (r.action ? [r.action] : []);
const nav = (dest, fade) => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: fade ? { type: 'DISSOLVE', easing: { type: 'EASE_OUT' }, duration: 0.2 } : { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const sWeb = web.children.find(n => n.type === 'SECTION' && n.name === 'Search results');
const sMob = mob.children.find(n => n.type === 'SECTION' && n.name === 'Search results');
const stateKey = n => Object.keys(n.componentProperties || {}).find(k => /^State/.test(k));
const stateOf = n => { const k = stateKey(n); return k ? n.componentProperties[k].value : null; };
let made = 0;
async function link(node, dest, label, fade) {
  if (!node || !dest) { report.errors.push('baglanti yok: ' + label + (node ? '' : ' (oge yok)') + (dest ? '' : ' (hedef yok)')); return false; }
  const keep = (node.reactions || []).filter(r => !acts(r).some(isNavAct));
  await node.setReactionsAsync(keep.concat([nav(dest, fade)])); made++; return true;
}
const NAMES = { 'All': 'All results', 'Players': 'Players', 'Managers & officials': 'Managers & officials', 'Intermediaries': 'Intermediaries', 'Clubs': 'Clubs', 'Facilities': 'Facilities', 'Events': 'Events' };
const screenOf = (sec, label, device) => sec.children.find(c => c.type === 'FRAME' && c.name === 'Search / ' + NAMES[label] + ' · ' + device);
const log = { tabs: 0, showAll: 0, filters: 0, rows: 0 };

// ---------- 1. sekmeler (7), tum liste ekranlari
await step('Sekmeler', async () => {
  for (const [sec, device] of [[sWeb, 'Desktop'], [sMob, 'Mobile']]) {
    for (const f of sec.children) {
      if (f.type !== 'FRAME' || !/^Search \//.test(f.name) || /No results|Filters/.test(f.name)) continue;
      const tabs = f.findOne(n => n.name === 'Tabs' && n.type === 'FRAME'); if (!tabs) { report.errors.push('Tabs yok: ' + f.name); continue; }
      for (const t of tabs.children) {
        if (t.type !== 'INSTANCE') continue;
        const label = t.name.replace(/^Tab · /, ''); const dest = screenOf(sec, label, device);
        if (stateOf(t) === 'Selected') { await t.setReactionsAsync((t.reactions || []).filter(r => !acts(r).some(isNavAct))); continue; }
        if (await link(t, dest, f.name + ' / ' + t.name)) log.tabs++;
      }
    }
  }
});

// ---------- 2. All results: Show all dugmeleri
await step('Show all dugmeleri', async () => {
  for (const [sec, device] of [[sWeb, 'Desktop'], [sMob, 'Mobile']]) {
    const f = sec.children.find(c => c.name === 'Search / All results · ' + device); if (!f) { report.errors.push('All results yok ' + device); continue; }
    for (const g of f.findAll(n => n.type === 'FRAME' && /^Group · /.test(n.name))) {
      const title = g.name.replace('Group · ', ''); const dest = screenOf(sec, title, device);
      const head = g.findOne(n => n.name === 'Group heading'); const btn = head && head.findOne(n => n.type === 'INSTANCE');
      if (!btn) { report.errors.push('Show all dugmesi yok: ' + device + ' ' + title); continue; }
      if (await link(btn, dest, 'Show all ' + title + ' ' + device)) log.showAll++;
    }
  }
});

// ---------- 3. mobil Filters <-> liste (yeni iki kategori)
await step('Mobil Filters', async () => {
  for (const title of ['Managers & officials', 'Intermediaries']) {
    const list = sMob.children.find(c => c.name === 'Search / ' + title + ' · Mobile');
    const fil = sMob.children.find(c => c.name === 'Search / Filters · ' + title + ' · Mobile');
    if (!list || !fil) { report.errors.push('ekran yok: ' + title); continue; }
    const fb = list.findOne(n => n.type === 'INSTANCE' && /Filters/.test(n.name));
    const sb = fil.findOne(n => n.name === 'Button · Show results');
    if (await link(fb, fil, 'Filters ' + title)) log.filters++;
    if (await link(sb, list, 'Show results ' + title)) log.filters++;
  }
});

// ---------- 4. satir -> rol profili
const cand = {};
await step('Satir > profil', async () => {
  const frames = [];
  for (const plat of [web, mob]) for (const s of plat.children) if (s.type === 'SECTION') for (const c of s.children) if (c.type === 'FRAME') frames.push({ plat: plat.name, sec: s.name, f: c });
  const pick = (re, device) => frames.filter(x => /Profile/i.test(x.sec) && re.test(x.f.name) && x.f.name.indexOf(device) >= 0 && !/Edit|Block|Directory|Minimal|Own|Lightbox|Gallery|Search/i.test(x.f.name));
  const MAP = [['Tom Reilly', /Manager/i], ['Ana Ferreira', /Referee/i], ['Sofia Lindqvist', /Intermediary/i]];
  for (const [sec, device] of [[sWeb, 'Desktop'], [sMob, 'Mobile']]) {
    for (const [person, re] of MAP) {
      const c = pick(re, device); cand[person + ' ' + device] = c.map(x => x.sec + ' / ' + x.f.name);
      if (!c.length) continue;
      const dest = c[0].f;
      for (const f of sec.children) {
        if (f.type !== 'FRAME' || !/^Search \//.test(f.name)) continue;
        for (const r of f.findAll(n => n.type === 'INSTANCE' && n.name === 'Person · ' + person)) { if (await link(r, dest, 'Person ' + person)) log.rows++; }
      }
    }
  }
  report.info.profileCandidates = cand;
});

// ---------- kontrol
await step('Kontrol', async () => {
  let total = 0, broken = 0, click = 0;
  for (const sec of [sWeb, sMob]) for (const f of sec.children) { if (f.type !== 'FRAME') continue; for (const n of [f].concat(f.findAll(() => true))) { let rs; try { rs = n.reactions; } catch (e) { continue; } if (!rs) continue; for (const r of rs) for (const a of acts(r)) { if (a && a.type === 'NODE' && a.destinationId) { total++; if (a.navigation !== 'CHANGE_TO') click++; const d = await figma.getNodeByIdAsync(a.destinationId); if (!d) broken++; } } } }
  report.info.links = { made, perKind: log, searchTotalWithHover: total, clickLinks: click, broken };
  report.info.flowStarts = p02.flowStartingPoints.length;
});
return JSON.stringify(report, null, 1);
