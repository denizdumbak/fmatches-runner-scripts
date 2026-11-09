// step 348 · Kulüp kartı: Minimal data (directory kaydı) ve Women's club hâlleri, masaüstü + mobil; Full ekranların kopyasından türetilir
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
async function replT(root, from, to) { const t = root.findAll(n => n.type === 'TEXT').find(n => n.characters === from); if (!t) throw new Error('metin yok: "' + from + '" in ' + root.name); await loadFor(t); t.characters = to; return t; }
const fill = n => { n.layoutSizingHorizontal = 'FILL'; };
// eski çalıştırmadan kalan kopyaları sil
for (const [s, re] of [[sWeb, /(Minimal data|Women's club) · Desktop$/], [sMob, /(Minimal data|Women's club) · Mobile$/]]) for (const f of s.children.filter(n => re.test(n.name))) f.remove();

async function womenTag() { const t = variantOf('Tag', /Brand subtle/).createInstance(); t.name = "Tag · Women's club"; const lab = t.findOne(n => n.type === 'TEXT'); await loadFor(lab); lab.characters = "Women's club"; return t; }
async function cleanReactions(root) { let n = 0; for (const x of [root].concat(root.findAll(() => true))) { try { if ('reactions' in x && x.reactions && x.reactions.length) { const keep = x.reactions.filter(r => !(r.actions || []).some(a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO')); if (keep.length !== x.reactions.length) { await x.setReactionsAsync(keep); n++; } } } catch (e) {} } return n; }
function hideFact(root, nm) { const f = root.findOne(n => n.name === 'Fact · ' + nm); if (!f) throw new Error('fact yok ' + nm); f.visible = false; }

const made = {};
await step('Masaüstü Minimal data', async () => {
  const f = fdFull.clone(); f.name = 'Clubs / Club card / Minimal data · Desktop'; sWeb.appendChild(f); f.x = 80 + 1920; f.y = 100; made.minD = f;
  const hero = f.findOne(n => n.name === 'Hero · stadium identity');
  await setT(hero, 'Breadcrumb', 'Clubs / Germany / Havelblick United'); await setT(hero, 'Surname', 'Havelblick United'); await setT(hero, 'Player category', 'Football club in Potsdam, Germany');
  hideFact(hero, 'League'); hideFact(hero, 'Teams');
  const city = hero.findOne(n => n.name === 'Fact · City'); await setT(city, 'Value', 'Potsdam');
  const btn = hero.findOne(n => /^Button · /.test(n.name)); if (btn) btn.visible = false;
  const tile = hero.findOne(n => n.name === 'Crest tile'), big = hero.findOne(n => n.name === 'Club crest · large'); if (big) big.remove();
  const nc = variantOf('Club crest', /No crest/).createInstance(); nc.name = 'Club crest · large'; hero.appendChild(nc); nc.rescale(6); nc.layoutPositioning = 'ABSOLUTE'; nc.x = tile.x + (tile.width - nc.width) / 2; nc.y = tile.y + (tile.height - nc.height) / 2;
  const body = f.findOne(n => n.name === 'Profile body'); for (const c of body.children.slice()) c.remove();
  const ec = variantOf('Empty card', /Desktop/).createInstance(); ec.name = 'Empty card · Teams'; body.appendChild(ec); fill(ec);
  const names = ec.findAll(n => n.type === 'TEXT').map(n => n.name + ':' + n.characters.slice(0, 24)); report.info.emptyDesktopTexts = names;
  for (const [k, v] of [['Section heading', 'Teams'], ['Title', 'No squad data yet'], ['Body', 'This club has no teams, players or staff listed. They appear here once they are added.']]) { try { await setT(ec, k, v); } catch (e) { report.errors.push('empty ' + k + ': ' + e.message); } }
  const lbl = ec.findAll(n => n.type === 'TEXT' && n.name === 'Label')[0]; if (lbl) { await loadFor(lbl); lbl.characters = 'Browse players'; }
  report.info.minD = sz(f);
});

await step('Mobil Minimal data', async () => {
  const f = fmFull.clone(); f.name = 'Clubs / Club card / Minimal data · Mobile'; sMob.appendChild(f); f.x = 80 + 470; f.y = 100; made.minM = f;
  const hero = f.findOne(n => n.name === 'Hero · stadium identity');
  await setT(hero, 'Surname', 'Havelblick United');
  const role = hero.findAll(n => n.type === 'TEXT' && /^Football club in/.test(n.characters))[0]; if (role) { await loadFor(role); role.characters = 'Football club in Potsdam, Germany'; }
  hideFact(hero, 'League'); hideFact(hero, 'Teams'); const city = hero.findOne(n => n.name === 'Fact · City'); await setT(city, 'Value', 'Potsdam');
  const btn = hero.findOne(n => /^Button · /.test(n.name)); if (btn) btn.visible = false;
  const cr = hero.findOne(n => n.name === 'Club crest' && n.type === 'INSTANCE'); if (cr) { const w = cr.width, h = cr.height; cr.swapComponent(variantOf('Club crest', /No crest/)); report.info.mobileCrest = sz(cr) + ' (önce ' + Math.round(w) + 'x' + Math.round(h) + ')'; }
  const body = f.findOne(n => n.name === 'Profile body'); for (const c of body.children.slice()) c.remove();
  const ec = variantOf('Empty card', /Mobile/).createInstance(); ec.name = 'Empty card · Teams'; body.appendChild(ec); fill(ec);
  for (const [k, v] of [['Section heading', 'Teams'], ['Title', 'No squad data yet'], ['Body', 'This club has no teams, players or staff listed. They appear here once they are added.']]) { try { await setT(ec, k, v); } catch (e) { report.errors.push('empty m ' + k + ': ' + e.message); } }
  const lbl = ec.findAll(n => n.type === 'TEXT' && n.name === 'Label')[0]; if (lbl) { await loadFor(lbl); lbl.characters = 'Browse players'; }
  report.info.minM = sz(f);
});

const PLAYERS = ['Lena Fischer', 'Maja Kowalczyk-Brun', 'Clara Weiss', 'Sofia Brandt'];
async function womenFrame(src, dev, slotX) {
  const mobile = dev === 'Mobile'; const f = src.clone(); f.name = "Clubs / Club card / Women's club · " + dev; (mobile ? sMob : sWeb).appendChild(f); f.x = slotX; f.y = 100;
  const hero = f.findOne(n => n.name === 'Hero · stadium identity');
  if (!mobile) await setT(hero, 'Breadcrumb', 'Clubs / Germany / Nordpark SC Women');
  await setT(hero, 'Surname', 'Nordpark SC Women');
  const tag = await womenTag();
  if (mobile) { const nr = hero.findOne(n => n.name === 'Name and role'); if (!nr) throw new Error('Name and role yok'); nr.insertChild(0, tag); }
  else { const role = hero.findOne(n => n.name === 'Role'); if (!role) throw new Error('Role yok'); role.insertChild(0, tag); }
  const body = f.findOne(n => n.name === 'Profile body');
  const pn = variantOf('Page notice', new RegExp(dev)).createInstance(); pn.name = "Page notice · Women's club"; body.insertChild(0, pn); fill(pn);
  report.info['notice ' + dev + ' texts'] = pn.findAll(n => n.type === 'TEXT').map(n => n.name + ':' + n.characters.slice(0, 30));
  const tx = pn.findAll(n => n.type === 'TEXT'); if (tx.length) { await loadFor(tx[0]); tx[0].characters = tx.length > 1 ? "Women's club" : "Women's club. All teams of this club are women's teams."; }
  if (tx.length > 1) { await loadFor(tx[1]); tx[1].characters = "All teams of this club are women's teams."; }
  const teams = body.findOne(n => n.name === 'Teams'); await replT(teams, 'Spreeufer FC', 'Nordpark SC Women');
  const rows = teams.findAll(n => n.type === 'INSTANCE' && /^Player · /.test(n.name));
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]; await setT(r, 'Name', PLAYERS[i % PLAYERS.length]); r.name = 'Player · ' + PLAYERS[i % PLAYERS.length];
    const sil = r.findAll(n => n.type === 'INSTANCE' && n.name === 'Silhouette')[0];
    if (sil) { const m = await sil.getMainComponentAsync(); const t = m && m.parent && m.parent.children.find(c => c.name === m.name.replace('Gender=Male', 'Gender=Female')); if (t && t !== m) sil.swapComponent(t); }
  }
  report.info['women ' + dev] = sz(f) + ' rows ' + rows.length;
  return f;
}
await step("Masaüstü Women's club", async () => { made.wD = await womenFrame(fdFull, 'Desktop', 80 + 3840); });
await step("Mobil Women's club", async () => { made.wM = await womenFrame(fmFull, 'Mobile', 80 + 940); });

await step('Temizlik ve boyutlar', async () => {
  const c = []; for (const k in made) c.push(k + ':' + await cleanReactions(made[k])); report.info.reactionsCleared = c;
  const flows = p02.flowStartingPoints; const ids = Object.values(made).map(f => f.id); const keep = flows.filter(s => !ids.includes(s.nodeId)); report.info.flows = flows.length + ' -> ' + keep.length; if (keep.length !== flows.length) p02.flowStartingPoints = keep;
  const hD = Math.max(...sWeb.children.filter(n => n.type === 'FRAME').map(n => n.height)), hM = Math.max(...sMob.children.filter(n => n.type === 'FRAME').map(n => n.height));
  sWeb.resizeWithoutConstraints(80 + 3840 + 1440 + 80, Math.ceil(100 + hD + 80)); sMob.resizeWithoutConstraints(80 + 940 + 390 + 80, Math.ceil(100 + hM + 80));
  for (const [plat, s] of [[web, sWeb], [mob, sMob]]) plat.resizeWithoutConstraints(Math.max(plat.width, Math.ceil(s.x + s.width + 120)), Math.max(plat.height, Math.ceil(s.y + s.height + 120)));
  report.info.sizes = ['Web section ' + sz(sWeb), 'Mobile section ' + sz(sMob), 'platform Web ' + sz(web) + ' Mobile ' + sz(mob)];
});

await step('Kontrol', async () => {
  const out = {};
  for (const k in made) { const f = made[k]; let gray = 0, unstyled = 0; for (const n of f.findAll(() => true)) { if (n.type === 'TEXT' && !(typeof n.textStyleId === 'string' && n.textStyleId)) unstyled++; if ('fills' in n && Array.isArray(n.fills)) for (const p of n.fills) if (p.type === 'SOLID' && Math.abs(p.color.r - .5) < .01 && Math.abs(p.color.g - .5) < .01 && Math.abs(p.color.b - .5) < .01) gray++; } out[f.name] = sz(f) + ' gray ' + gray + ' unstyled ' + unstyled + ' | body: ' + f.findOne(n => n.name === 'Profile body').children.map(c => c.name).join(' > '); }
  report.info.check = out;
});
return report;
