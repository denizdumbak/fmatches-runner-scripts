// step 354 · Kulüp kartı Staff sekmesi (masaüstü + mobil, Full ekranın kopyasından) + Team select Open varyantının salt okunur dökümü
const report = { done: [], errors: [], info: { dimsMissing: [] } };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const sz = n => Math.round(n.width) + 'x' + Math.round(n.height);
const sets = p01.findAll(n => n.type === 'COMPONENT_SET' || (n.type === 'COMPONENT' && n.parent && n.parent.type !== 'COMPONENT_SET'));
const variantOf = (nm, re) => { const s = sets.find(n => n.name === nm); if (!s) throw new Error('component yok: ' + nm); const v = s.type === 'COMPONENT_SET' ? s.children.find(c => re.test(c.name)) : s; if (!v) throw new Error('varyant yok: ' + nm + ' ' + re); return v; };
const sWeb = web.children.find(n => n.type === 'SECTION' && n.name === 'Club card'), sMob = mob.children.find(n => n.type === 'SECTION' && n.name === 'Club card'); if (!sWeb || !sMob) throw new Error('Club card Section yok');
const fdFull = sWeb.children.find(n => n.type === 'FRAME' && /Club card · Desktop$/.test(n.name)), fmFull = sMob.children.find(n => n.type === 'FRAME' && /Club card · Mobile$/.test(n.name));
if (!fdFull || !fmFull) throw new Error('Full frame yok');
async function loadFor(t) { const fs = t.getRangeAllFontNames(0, Math.max(1, t.characters.length)); for (const f of fs) await figma.loadFontAsync(f); }
async function setT(root, name, str, nth) { const t = root.findAll(n => n.type === 'TEXT' && n.name === name)[nth || 0]; if (!t) throw new Error('metin yok: ' + name + ' in ' + root.name + ' (var: ' + root.findAll(n => n.type === 'TEXT').slice(0, 8).map(n => n.name).join(',') + ')'); await loadFor(t); t.characters = str; return t; }
const fill = n => { n.layoutSizingHorizontal = 'FILL'; };
for (const [s, re] of [[sWeb, /Staff tab · Desktop$/], [sMob, /Staff tab · Mobile$/]]) for (const f of s.children.filter(n => re.test(n.name))) f.remove();
const STAFF = [['Jonas Richter', 'Head coach', 'Male'], ['Tim Becker', 'Assistant coach', 'Male'], ['Sven Hoffmann', 'Goalkeeping coach', 'Male'], ['Katrin Lehmann', 'Fitness coach', 'Female'], ['Paul Neumann', 'Video analyst', 'Male'], ['Lena Fischer', 'Team doctor', 'Female']];
async function cleanReactions(root) { let n = 0; for (const x of [root].concat(root.findAll(() => true))) { try { if ('reactions' in x && x.reactions && x.reactions.length) { const keep = x.reactions.filter(r => !(r.actions || []).some(a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO')); if (keep.length !== x.reactions.length) { await x.setReactionsAsync(keep); n++; } } } catch (e) {} } return n; }
const made = {};
async function staffFrame(src, dev, slotX) {
  const mobile = dev === 'Mobile'; const f = src.clone(); f.name = 'Clubs / Club card / Staff tab · ' + dev; (mobile ? sMob : sWeb).appendChild(f); f.x = slotX; f.y = 100;
  const teams = f.findOne(n => n.name === 'Teams'); if (!teams) throw new Error('Teams kartı yok');
  const tabs = teams.findOne(n => n.name === 'Squad tabs'); if (!tabs) throw new Error('Squad tabs yok (var: ' + teams.children.map(c => c.name).join(',') + ')');
  const chipDefault = variantOf('Filter chip', /State=Default/), chipSel = variantOf('Filter chip', /State=Selected/);
  const chips = tabs.children.filter(c => c.type === 'INSTANCE');
  if (chips.length !== 2) throw new Error('çip sayısı ' + chips.length);
  chips[0].swapComponent(chipDefault); chips[1].swapComponent(chipSel);
  await setT(chips[0], 'Label', 'Players · 23'); await setT(chips[1], 'Label', 'Staff · 6');
  chips[0].name = 'Filter chip · Players · 23'; chips[1].name = 'Filter chip · Staff · 6';
  // oyuncu tablosu başlığı ve oyuncu satırları kalkar, yerine Person row'lar
  const removed = [];
  for (const c of teams.children.slice()) { if (c === tabs) continue; if (c.name === 'Table header' || /Player result|Player row/.test(c.name) || (c.type === 'INSTANCE' && c.findOne(n => n.name === 'Actions'))) { removed.push(c.name); c.remove(); } }
  const pv = variantOf('Person row', /State=Default/);
  const genders = [];
  for (const [n, r, g] of STAFF) {
    const p = pv.createInstance(); p.name = 'Person row · ' + n; teams.appendChild(p); fill(p); await setT(p, 'Name', n); await setT(p, 'Meta', r);
    for (const s of p.findAll(x => x.type === 'INSTANCE' && x.componentProperties && Object.keys(x.componentProperties).some(k => /^Gender/.test(k)))) { const key = Object.keys(s.componentProperties).find(k => /^Gender/.test(k)); try { s.setProperties({ [key]: g }); genders.push(n + ':' + g); } catch (e) { report.errors.push('gender ' + n + ': ' + e.message); } }
  }
  const head = teams.children[0]; if (head && head.type !== 'TEXT') { const sm = head.findAll(n => n.type === 'TEXT' && /teams?$/.test(n.characters))[0]; if (sm) { await loadFor(sm); sm.characters = '4 teams'; } }
  report.info['removed ' + dev] = removed; report.info['genders ' + dev] = genders.length + ' / ' + STAFF.length;
  made[dev] = f; return f;
}
await step('Masaüstü Staff tab', async () => { await staffFrame(fdFull, 'Desktop', 80 + 3 * 1920); });
await step('Mobil Staff tab', async () => { await staffFrame(fmFull, 'Mobile', 80 + 3 * 470); });

await step('Temizlik ve boyutlar', async () => {
  const c = []; for (const k in made) c.push(k + ':' + await cleanReactions(made[k])); report.info.reactionsCleared = c;
  const flows = p02.flowStartingPoints; const ids = Object.values(made).map(f => f.id); const keep = flows.filter(s => !ids.includes(s.nodeId)); if (keep.length !== flows.length) p02.flowStartingPoints = keep;
  const hD = Math.max(...sWeb.children.filter(n => n.type === 'FRAME').map(n => n.height)), hM = Math.max(...sMob.children.filter(n => n.type === 'FRAME').map(n => n.height));
  sWeb.resizeWithoutConstraints(80 + 4 * 1920 + 1440 + 80, Math.ceil(100 + hD + 80)); sMob.resizeWithoutConstraints(80 + 4 * 470 + 390 + 80, Math.ceil(100 + hM + 80));
  for (const [plat, s] of [[web, sWeb], [mob, sMob]]) plat.resizeWithoutConstraints(Math.max(plat.width, Math.ceil(s.x + s.width + 120)), Math.max(plat.height, Math.ceil(s.y + s.height + 120)));
  report.info.sizes = ['Web section ' + sz(sWeb), 'Mobile section ' + sz(sMob), 'platform Web ' + sz(web) + ' Mobile ' + sz(mob)];
});

await step('Kontrol', async () => {
  const out = {};
  for (const k in made) { const f = made[k]; let gray = 0, unstyled = 0, over = 0; const teams = f.findOne(n => n.name === 'Teams'); for (const n of f.findAll(() => true)) { if (n.type === 'TEXT' && !(typeof n.textStyleId === 'string' && n.textStyleId)) unstyled++; if ('fills' in n && Array.isArray(n.fills)) for (const p of n.fills) if (p.type === 'SOLID' && Math.abs(p.color.r - .5) < .01 && Math.abs(p.color.g - .5) < .01 && Math.abs(p.color.b - .5) < .01) gray++; }
    for (const c of teams.children) { if (c.width > teams.width + 1) over++; }
    out[f.name] = sz(f) + ' gray ' + gray + ' unstyled ' + unstyled + ' teamsOver ' + over + ' | teams: ' + teams.children.map(c => c.name).join(' > ') + ' | body: ' + f.findOne(n => n.name === 'Profile body').children.map(c => c.name).join(' > '); }
  report.info.check = out;
});

// Team select Open: salt okunur döküm (355 için)
await step('Team select Open dökümü', async () => {
  const s = sets.find(n => n.name === 'Team select'); const info = [];
  for (const v of s.children.filter(c => /State=Open/.test(c.name))) {
    const lines = [v.name + ' ' + sz(v)];
    const walk = (n, d) => { if (d > 6) return; const t = n.type === 'TEXT' ? ' "' + n.characters + '" style=' + (typeof n.textStyleId === 'string' && n.textStyleId ? 'ok' : 'none') : ''; lines.push('  '.repeat(d) + n.type + ' ' + n.name + ' ' + sz(n) + (n.layoutPositioning === 'ABSOLUTE' ? ' ABS@' + Math.round(n.x) + ',' + Math.round(n.y) : '') + t); if ('children' in n && n.type !== 'INSTANCE' || (n.type === 'INSTANCE' && d < 4)) for (const c of n.children || []) walk(c, d + 1); };
    walk(v, 0); info.push(lines.join('\n'));
  }
  report.info.teamSelectOpen = info;
});
return report;
