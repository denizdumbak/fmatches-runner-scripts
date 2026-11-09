// step 355 · Kulüp kartı Team list open ekranı (masaüstü + mobil): Team select Open varyantı, Full ekranın kopyasında; menü en üstte (ABS), yerine boşluk tutucu
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
for (const [s, re] of [[sWeb, /Team list open · Desktop$/], [sMob, /Team list open · Mobile$/]]) for (const f of s.children.filter(n => re.test(n.name))) f.remove();
async function cleanReactions(root) { let n = 0; for (const x of [root].concat(root.findAll(() => true))) { try { if ('reactions' in x && x.reactions && x.reactions.length) { const keep = x.reactions.filter(r => !(r.actions || []).some(a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO')); if (keep.length !== x.reactions.length) { await x.setReactionsAsync(keep); n++; } } } catch (e) {} } return n; }
const made = {};
async function replAll(root, from, to) { const ts = root.findAll(n => n.type === 'TEXT' && n.characters === from); for (const t of ts) { await loadFor(t); t.characters = to; } return ts.length; }
async function openFrame(src, dev, slotX) {
  const mobile = dev === 'Mobile'; const f = src.clone(); f.name = 'Clubs / Club card / Team list open · ' + dev; (mobile ? sMob : sWeb).appendChild(f); f.x = slotX; f.y = 100;
  const teams = f.findOne(n => n.name === 'Teams'); if (!teams) throw new Error('Teams kartı yok');
  const old = teams.children.find(c => c.type === 'INSTANCE' && c.name === 'Team select') || teams.children.find(c => c.type === 'INSTANCE' && /Team select/.test(c.name)); if (!old) throw new Error('Team select yok (var: ' + teams.children.map(c => c.name).join(',') + ')');
  const idx = teams.children.indexOf(old), ow = old.width, oh = old.height, ox = old.x, oy = old.y;
  old.swapComponent(variantOf('Team select', new RegExp('Device=' + dev + ', State=Open')));
  const ts = old; ts.name = 'Team select · Open';
  const n1 = await replAll(ts, 'Riverside FC', 'Spreeufer FC');
  await replAll(ts, 'Riverside FC B', 'Spreeufer FC B'); await replAll(ts, 'Riverside FC U19', 'Spreeufer FC U19'); await replAll(ts, 'Riverside FC Women', 'Spreeufer FC Women');
  await replAll(ts, 'Third Division · Tier 3', 'Regionalliga Nordost · Tier 4'); await replAll(ts, 'Third Division', 'Regionalliga Nordost'); await replAll(ts, 'Tier 3', 'Tier 4');
  await replAll(ts, 'Fifth Division · Tier 5', 'Oberliga NOFV-Nord · Tier 5'); await replAll(ts, "Women's Premier · Tier 1", 'Frauen Regionalliga · Tier 3');
  for (const r of ts.findAll(x => /^Row · /.test(x.name))) r.name = r.name.replace('Riverside', 'Spreeufer');
  // menü diğer öğelerin üstünde dursun: Team select ABS + son çocuk, yerine aynı yükseklikte boşluk tutucu
  const sp = figma.createFrame(); sp.name = 'Team select spacer'; sp.fills = []; sp.clipsContent = false; teams.insertChild(idx, sp); sp.layoutSizingHorizontal = 'FILL'; sp.resize(sp.width, ts.height); sp.layoutSizingVertical = 'FIXED';
  teams.appendChild(ts); ts.layoutPositioning = 'ABSOLUTE'; ts.x = ox; ts.y = oy; ts.resize(ow, ts.height);
  const clipped = []; let a = teams; while (a && a !== f.parent) { if ('clipsContent' in a && a.clipsContent && a !== f) { clipped.push(a.name); a.clipsContent = false; } a = a.parent; }
  const menu = ts.findOne(n => n.name === 'Menu'); const mb = menu.absoluteBoundingBox, tb = teams.absoluteBoundingBox, fb = f.absoluteBoundingBox;
  report.info['open ' + dev] = { replacedField: n1, spacerH: Math.round(sp.height), tsSize: sz(ts), menu: Math.round(mb.x - fb.x) + ',' + Math.round(mb.y - fb.y) + ' ' + Math.round(mb.width) + 'x' + Math.round(mb.height), menuInsideTeams: mb.y + mb.height <= tb.y + tb.height + 1 && mb.x >= tb.x - 1 && mb.x + mb.width <= tb.x + tb.width + 1, menuInsideFrame: mb.y + mb.height <= fb.y + fb.height, unclipped: clipped };
  made[dev] = f; return f;
}
await step('Masaüstü Team list open', async () => { await openFrame(fdFull, 'Desktop', 80 + 4 * 1920); });
await step('Mobil Team list open', async () => { await openFrame(fmFull, 'Mobile', 80 + 4 * 470); });

await step('Temizlik ve boyutlar', async () => {
  const c = []; for (const k in made) c.push(k + ':' + await cleanReactions(made[k])); report.info.reactionsCleared = c;
  const flows = p02.flowStartingPoints; const ids = Object.values(made).map(f => f.id); const keep = flows.filter(s => !ids.includes(s.nodeId)); if (keep.length !== flows.length) p02.flowStartingPoints = keep;
  const hD = Math.max(...sWeb.children.filter(n => n.type === 'FRAME').map(n => n.height)), hM = Math.max(...sMob.children.filter(n => n.type === 'FRAME').map(n => n.height));
  sWeb.resizeWithoutConstraints(80 + 4 * 1920 + 1440 + 80, Math.ceil(100 + hD + 80)); sMob.resizeWithoutConstraints(80 + 4 * 470 + 390 + 80, Math.ceil(100 + hM + 80));
  for (const [plat, s] of [[web, sWeb], [mob, sMob]]) plat.resizeWithoutConstraints(Math.max(plat.width, Math.ceil(s.x + s.width + 120)), Math.max(plat.height, Math.ceil(s.y + s.height + 120)));
  report.info.sizes = ['Web section ' + sz(sWeb), 'Mobile section ' + sz(sMob)];
});
await step('Kontrol', async () => {
  const out = {};
  for (const k in made) { const f = made[k]; let gray = 0, unstyled = 0, riverside = 0; for (const n of f.findAll(() => true)) { if (n.type === 'TEXT') { if (!(typeof n.textStyleId === 'string' && n.textStyleId)) unstyled++; if (/Riverside|Third Division|Fifth Division/.test(n.characters)) riverside++; } if ('fills' in n && Array.isArray(n.fills)) for (const p of n.fills) if (p.type === 'SOLID' && Math.abs(p.color.r - .5) < .01 && Math.abs(p.color.g - .5) < .01 && Math.abs(p.color.b - .5) < .01) gray++; }
    out[f.name] = sz(f) + ' gray ' + gray + ' unstyled ' + unstyled + ' kalanRiversideMetni ' + riverside; }
  report.info.check = out;
});
return report;
