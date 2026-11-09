// step 357 · kulüp kartı prototip bağlantıları (yalnız ideal senaryo, ok çizilmez): Club result -> Club card, stadyum Tenants Club strip -> Club card, Players satırı -> profil, Players/Staff çipleri -> Staff tab, akış başlangıcı
const report = { done: [], errors: [], info: { links: [], skipped: [], candidates: {} } };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const sub = (plat, re) => plat.children.find(n => n.type === 'SECTION' && re.test(n.name));
const frames = sec => (sec ? sec.children.filter(n => n.type === 'FRAME') : []);
const nav = dest => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
async function link(label, el, dest) {
  if (!el) { report.info.skipped.push(label + ': öğe yok'); return false; }
  if (!dest) { report.info.skipped.push(label + ': hedef yok'); return false; }
  const keep = (el.reactions || []).filter(r => !(r.actions || []).some(isNavAct));
  await el.setReactionsAsync(keep.concat([nav(dest)])); report.info.links.push(label); return true;
}
const find1 = (sec, res) => { for (const re of res) { const f = frames(sec).find(x => re.test(x.name)); if (f) return f; } return null; };
const textOf = n => { const t = n.findOne(x => x.type === 'TEXT'); return t ? t.characters : ''; };
const miss = (key, root, re) => { if (!root) return; const seen = {}; root.findAll(n => n.type === 'INSTANCE' && re.test(n.name)).forEach(n => { seen[n.name] = (seen[n.name] || 0) + 1; }); report.info.candidates[key] = Object.keys(seen).slice(0, 25).map(k => k + ' x' + seen[k]); };

const clubW = sub(web, /^Club card$/), clubM = sub(mob, /^Club card$/);
const stadW = sub(web, /^Stadium card$/), stadM = sub(mob, /^Stadium card$/);
const searchW = sub(web, /^Search results$/), searchM = sub(mob, /^Search results$/);
const K = {
  D: {
    full: find1(clubW, [/^Clubs \/ Club card · Desktop$/]), staff: find1(clubW, [/Staff tab · Desktop$/]), women: find1(clubW, [/Women's club · Desktop$/]),
    stadium: find1(stadW, [/^Facilities \/ Stadium card · Desktop$/]), profile: find1(sub(web, /^Profiles · player$/), [/^Profiles \/ Player · Desktop$/, /^Profiles \/ Player.*· Desktop$/]),
    all: find1(searchW, [/^Search \/ All results · Desktop$/]), clubs: find1(searchW, [/^Search \/ Clubs · Desktop$/])
  },
  M: {
    full: find1(clubM, [/^Clubs \/ Club card · Mobile$/]), staff: find1(clubM, [/Staff tab · Mobile$/]), women: find1(clubM, [/Women's club · Mobile$/]),
    stadium: find1(stadM, [/^Facilities \/ Stadium card · Mobile$/]), profile: find1(sub(mob, /^Profiles · player$/), [/^Profiles \/ Player · Mobile$/, /^Profiles \/ Player.*· Mobile$/]),
    all: find1(searchM, [/^Search \/ All results · Mobile$/]), clubs: find1(searchM, [/^Search \/ Clubs · Mobile$/])
  }
};
report.info.targets = ['D', 'M'].map(k => k + ': ' + Object.keys(K[k]).map(x => x + '=' + (K[k][x] ? 'ok' : 'YOK')).join(' '));

await step('Club result -> Club card', async () => {
  for (const k of ['D', 'M']) for (const nm of ['all', 'clubs']) {
    const fr = K[k][nm]; if (!fr) continue;
    const btn = fr.findOne(n => n.type === 'INSTANCE' && /^Button · View club$/.test(n.name));
    if (!btn) miss(`${k} ${nm} Club result`, fr, /Club|View/i);
    await link(`${k} ${nm} first club -> Club card`, btn, K[k].full);
  }
});
await step('stadium tenants -> Club card', async () => {
  for (const k of ['D', 'M']) {
    const fr = K[k].stadium; if (!fr) continue;
    const strips = fr.findAll(n => n.type === 'INSTANCE' && /^Club strip/.test(n.name));
    if (!strips.length) miss(`${k} stadium strip`, fr, /Club|Tenant|strip/i);
    for (const s of strips) {
      const tx = s.findAll(n => n.type === 'TEXT').map(t => t.characters).join(' ');
      if (/Spreeufer/.test(tx)) await link(`${k} stadium strip Spreeufer FC -> Club card`, s, K[k].full);
      else if (/Nordpark/.test(tx)) await link(`${k} stadium strip Nordpark SC -> Women's club`, s, K[k].women);
      else report.info.skipped.push(`${k} stadium strip: ad tanınmadı (${tx.slice(0, 40)})`);
    }
  }
});
await step('Players row -> profile, chips', async () => {
  for (const k of ['D', 'M']) {
    const full = K[k].full, staff = K[k].staff;
    if (full) {
      const row = full.findOne(n => n.type === 'INSTANCE' && /^Player ·/.test(n.name));
      if (!row) miss(`${k} full Player row`, full, /Player|Result/i);
      await link(`${k} Club card first player -> profile`, row, K[k].profile);
      const chip = full.findOne(n => n.type === 'INSTANCE' && /chip/i.test(n.name) && /^Staff/.test(textOf(n)));
      if (!chip) miss(`${k} full chips`, full, /chip|tab/i);
      await link(`${k} Club card Staff chip -> Staff tab`, chip, staff);
    }
    if (staff) {
      const chip = staff.findOne(n => n.type === 'INSTANCE' && /chip/i.test(n.name) && /^Players/.test(textOf(n)));
      if (!chip) miss(`${k} staff chips`, staff, /chip|tab/i);
      await link(`${k} Staff tab Players chip -> Club card`, chip, full);
    }
  }
});
await step('flow starts', async () => {
  const now = p02.flowStartingPoints.slice(); const add = [];
  for (const [nm, k] of [['Web · Club card', 'D'], ['Mobile · Club card', 'M']]) { const f = K[k].full; if (f && !now.some(x => x.nodeId === f.id)) add.push({ nodeId: f.id, name: nm }); }
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
