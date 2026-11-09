// step 344 · Kulüp kartı düzeltmeleri (Deniz, Chrome'da bakıldı): masaüstü arma kutusu kalkar, Management 2x2 + Events/Facilities alt satırda yan yana (ortadaki boşluk), mobil League tam satır (Teams'e yapışmasın)
const report = { done: [], errors: [], info: { dimsMissing: [] } };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const allVars = await figma.variables.getLocalVariablesAsync();
const D = key => { const v = allVars.find(x => x.name === key) || allVars.find(x => x.name.endsWith('/' + key)); if (!v) report.info.dimsMissing.push(key); return v || null; };
const sz = n => Math.round(n.width) + 'x' + Math.round(n.height);
const sec = plat => { const s = plat.children.find(n => n.type === 'SECTION' && n.name === 'Club card'); if (!s) throw new Error('Club card Section yok'); return s; };
const frame = (s, re) => { const f = s.children.find(n => n.type === 'FRAME' && re.test(n.name)); if (!f) throw new Error('frame yok ' + re); return f; };
const sWeb = sec(web), sMob = sec(mob);
const fd = frame(sWeb, /Club card · Desktop$/), fm = frame(sMob, /Club card · Mobile$/);

await step('Masaüstü: arma kutusu kalkar', async () => {
  const tile = fd.findOne(n => n.name === 'Crest tile'); if (!tile) throw new Error('Crest tile yok');
  tile.visible = false; report.info.tile = 'gizlendi (' + sz(tile) + ')';
});

await step('Masaüstü: Management 2x2', async () => {
  const mg = fd.findOne(n => n.name === 'Management'); const rows = mg.children.filter(n => /^Person row/.test(n.name)); if (rows.length !== 4) throw new Error('person row sayısı ' + rows.length);
  for (const old of mg.children.filter(n => n.name === 'Management grid')) old.remove();
  const grid = figma.createFrame(); grid.name = 'Management grid'; grid.layoutMode = 'HORIZONTAL'; grid.fills = []; grid.clipsContent = false; grid.layoutWrap = 'WRAP'; grid.primaryAxisSizingMode = 'FIXED'; grid.counterAxisSizingMode = 'AUTO';
  mg.appendChild(grid); grid.layoutSizingHorizontal = 'FILL';
  const g = D('spacing/md'); if (g) { grid.setBoundVariable('itemSpacing', g); grid.setBoundVariable('counterAxisSpacing', g); }
  const w = Math.floor((mg.width - 64 - 16) / 2);
  for (const r of rows) { grid.appendChild(r); r.layoutSizingHorizontal = 'FIXED'; r.resize(w, r.height); }
  report.info.mgmt = sz(mg) + ' grid ' + sz(grid) + ' rowW ' + w;
});

await step('Masaüstü: Events + Facilities alt satır', async () => {
  const body = fd.findOne(n => n.name === 'Profile body'); const ev = body.findOne(n => n.name === "Events on club's facilities"); const fac = body.findOne(n => n.name === 'Facilities');
  if (!ev || !fac) throw new Error('events/facilities yok');
  for (const old of body.children.filter(n => n.name === 'Profile columns 2')) old.remove();
  const row = figma.createFrame(); row.name = 'Profile columns 2'; row.layoutMode = 'HORIZONTAL'; row.fills = []; row.clipsContent = false; row.primaryAxisSizingMode = 'FIXED'; row.counterAxisSizingMode = 'AUTO';
  const g = D('spacing/lg'); if (g) row.setBoundVariable('itemSpacing', g);
  body.appendChild(row); row.layoutSizingHorizontal = 'FILL';
  row.appendChild(ev); ev.layoutSizingHorizontal = 'FILL'; ev.layoutAlign = 'STRETCH';
  row.appendChild(fac); fac.layoutSizingHorizontal = 'FIXED'; fac.resize(416, fac.height); fac.layoutAlign = 'STRETCH';
});

await step('Mobil: League tam satır', async () => {
  const hero = fm.findOne(n => n.name === 'Hero · stadium identity'); const lg = hero.findOne(n => n.name === 'Fact · League'); if (!lg) throw new Error('Fact · League yok');
  lg.layoutSizingHorizontal = 'FILL';
  const kf = lg.parent; report.info.keyFacts = kf.name + ' wrap=' + kf.layoutWrap + ' ' + sz(kf);
});

await step('Boyutlar ve kontrol', async () => {
  sWeb.resizeWithoutConstraints(1600, Math.ceil(100 + fd.height + 80)); sMob.resizeWithoutConstraints(560, Math.ceil(100 + fm.height + 80));
  const b = fd.findOne(n => n.name === 'Profile body');
  report.info.desktop = sz(fd) + ' | body: ' + b.children.map(c => c.name + ' ' + sz(c)).join(' | ');
  const cols = b.findOne(n => n.name === 'Profile columns'); report.info.row1 = cols.children.map(c => c.name + ' ' + sz(c) + ' [' + c.children.map(x => x.name + ' ' + Math.round(x.height)).join(', ') + ']');
  const r2 = b.findOne(n => n.name === 'Profile columns 2'); report.info.row2 = r2 ? r2.children.map(c => c.name + ' ' + sz(c)) : 'yok';
  const hero = fm.findOne(n => n.name === 'Hero · stadium identity'); const f = hero.findAll(n => /^Fact · /.test(n.name));
  const pb = hero.absoluteBoundingBox; report.info.mobileFacts = f.map(x => { const a = x.absoluteBoundingBox; return x.name + ' x=' + Math.round(a.x - pb.x) + ' y=' + Math.round(a.y - pb.y) + ' ' + sz(x); });
  report.info.mobile = sz(fm);
});
return report;
