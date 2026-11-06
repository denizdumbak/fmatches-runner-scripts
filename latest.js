// step 333 · arama sonuçları prototip bağlantıları (yalnız ideal senaryo, ok çizilmez): Home arama -> All results, sekmeler, Show all, satırlar -> profil / stadyum / etkinlik, mobil Filters, No results -> harita
const report = { done: [], errors: [], info: { links: [], skipped: [] } };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const sub = (plat, re) => plat.children.find(n => n.type === 'SECTION' && re.test(n.name));
const frames = sec => (sec ? sec.children.filter(n => n.type === 'FRAME') : []);
const nav = dest => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
async function link(label, el, dest) {
  if (!el) { report.info.skipped.push(label + ': öğe yok'); return; }
  if (!dest) { report.info.skipped.push(label + ': hedef yok'); return; }
  const keep = (el.reactions || []).filter(r => !(r.actions || []).some(isNavAct));
  await el.setReactionsAsync(keep.concat([nav(dest)])); report.info.links.push(label);
}
const find = (root, re, types) => root.findOne(n => re.test(n.name) && (!types || types.indexOf(n.type) >= 0));

const searchW = sub(web, /^Search results$/), searchM = sub(mob, /^Search results$/);
const S = (sec, t, dev) => frames(sec).find(f => f.name === `Search / ${t} · ${dev}`);
const dev = { D: { sec: searchW, label: 'Desktop' }, M: { sec: searchM, label: 'Mobile' } };
const find1 = (sec, res) => { for (const re of res) { const f = frames(sec).find(x => re.test(x.name)); if (f) return f; } return null; };
const T = {
  D: {
    profile: find1(sub(web, /^Profiles · player$/), [/^Profiles \/ Player · Desktop$/, /^Profiles \/ Player.*· Desktop$/]),
    stadium: find1(sub(web, /^Stadium card$/), [/^Facilities \/ Stadium card · Desktop$/]),
    event: find1(sub(web, /^Events$/), [/^Events \/ Event card · Desktop$/, /Event card.*· Desktop$/]),
    map: find1(sub(web, /^Map$/), [/^Map \/ Default · Desktop$/]),
    home: find1(sub(web, /^Home page$/), [/^Home \/ Main · Desktop$/])
  },
  M: {
    profile: find1(sub(mob, /^Profiles · player$/), [/^Profiles \/ Player · Mobile$/, /^Profiles \/ Player.*· Mobile$/]),
    stadium: find1(sub(mob, /^Stadium card$/), [/^Facilities \/ Stadium card · Mobile$/]),
    event: find1(sub(mob, /^Events$/), [/^Events \/ Event card · Mobile$/, /Event card.*· Mobile$/]),
    map: find1(sub(mob, /^Map$/), [/^Map \/ Default · Mobile$/, /^Map \/ Clubs · Mobile$/]),
    home: find1(sub(mob, /^Home page$/), [/^Home \/ Main · Mobile$/])
  }
};
report.info.targets = { D: Object.keys(T.D).map(k => k + '=' + (T.D[k] ? T.D[k].name : 'YOK')), M: Object.keys(T.M).map(k => k + '=' + (T.M[k] ? T.M[k].name : 'YOK')) };

await step('home search -> all results', async () => {
  for (const k of ['D', 'M']) {
    const home = T[k].home; if (!home) { report.info.skipped.push('home ' + k + ': sayfa yok'); continue; }
    const navi = home.findOne(n => n.name === 'Navigation');
    const el = k === 'D' ? (navi && navi.findOne(n => n.name === 'Search' && n.type === 'FRAME')) : (navi && navi.findOne(n => /^Icon button · Search$/.test(n.name)));
    await link(`Home ${k} search -> All results`, el, S(dev[k].sec, 'All results', dev[k].label));
  }
});
await step('tabs and show-all', async () => {
  const names = ['All results', 'Players', 'Clubs', 'Facilities', 'Events'];
  const tabKey = { 'All results': 'All', Players: 'Players', Clubs: 'Clubs', Facilities: 'Facilities', Events: 'Events' };
  for (const k of ['D', 'M']) {
    for (const nm of names) {
      const fr = S(dev[k].sec, nm, dev[k].label); if (!fr) { report.info.skipped.push(`${k} ${nm}: ekran yok`); continue; }
      for (const t of names) { if (t === nm) continue; await link(`${k} ${nm} tab ${tabKey[t]}`, fr.findOne(n => n.name === 'Tab · ' + tabKey[t]), S(dev[k].sec, t, dev[k].label)); }
    }
    const all = S(dev[k].sec, 'All results', dev[k].label);
    if (all) for (const [word, t] of [['player', 'Players'], ['club', 'Clubs'], ['facilit', 'Facilities'], ['event', 'Events']]) await link(`${k} All show all ${t}`, all.findOne(n => n.type === 'INSTANCE' && /^Button · Show all/.test(n.name) && n.name.toLowerCase().indexOf(word) >= 0 || (k === 'M' && n.type === 'INSTANCE' && /^Button · Show all/.test(n.name) && n.parent && n.parent.parent && n.parent.parent.name === 'Group · ' + t)), S(dev[k].sec, t, dev[k].label));
  }
});
await step('rows', async () => {
  for (const k of ['D', 'M']) {
    for (const nm of ['All results', 'Players']) { const fr = S(dev[k].sec, nm, dev[k].label); if (fr) await link(`${k} ${nm} first player -> profile`, fr.findOne(n => n.type === 'INSTANCE' && /^Player ·/.test(n.name)), T[k].profile); }
    for (const nm of ['All results', 'Facilities']) { const fr = S(dev[k].sec, nm, dev[k].label); if (fr) await link(`${k} ${nm} first facility -> stadium`, fr.findOne(n => n.type === 'INSTANCE' && /^Button · View stadium$/.test(n.name)), T[k].stadium); }
    for (const nm of ['All results', 'Events']) { const fr = S(dev[k].sec, nm, dev[k].label); if (fr) await link(`${k} ${nm} first event -> event card`, fr.findOne(n => n.type === 'INSTANCE' && /^Event ·/.test(n.name)), T[k].event); }
    const none = S(dev[k].sec, 'No results', dev[k].label); if (none) await link(`${k} No results -> map`, none.findOne(n => n.type === 'INSTANCE' && /^Button · Open the map$/.test(n.name)), T[k].map);
  }
});
await step('mobile filters', async () => {
  const pl = S(searchM, 'Players', 'Mobile'), fl = S(searchM, 'Filters', 'Mobile');
  if (pl) await link('M Players Filters -> Filters', pl.findOne(n => n.type === 'INSTANCE' && n.name === 'Button · Filters'), fl);
  if (fl) await link('M Filters Show results -> Players', fl.findOne(n => n.type === 'INSTANCE' && n.name === 'Button · Show results'), pl);
});
await step('flow starts', async () => {
  const now = p02.flowStartingPoints.slice(); const add = [];
  for (const [nm, k] of [['Web · Search results', 'D'], ['Mobile · Search results', 'M']]) { const f = S(dev[k].sec, 'All results', dev[k].label); if (f && !now.some(x => x.nodeId === f.id)) add.push({ nodeId: f.id, name: nm }); }
  const keep = now.filter(f => !add.some(a => a.name === f.name));
  p02.flowStartingPoints = keep.concat(add); report.info.flows = p02.flowStartingPoints.length;
});
await step('verify', async () => {
  let total = 0, broken = 0;
  for (const n of p02.findAll(x => 'reactions' in x && x.reactions && x.reactions.length)) for (const r of n.reactions) for (const a of (r.actions || [])) if (a && a.type === 'NODE' && a.destinationId) { total++; const d = await figma.getNodeByIdAsync(a.destinationId); if (!d) broken++; }
  report.info.verify = `links ${total} broken ${broken}`;
});
report.info.linkCount = report.info.links.length;
return report;
