// step 345 · Kulüp kartı: masaüstü Location kartının alt kenarı Management ile hizalı; mobil hero'da arma + ad yan yana, gri kutu ve büyük arma kalkar
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
await figma.setCurrentPageAsync(p02);
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const sz = n => Math.round(n.width) + 'x' + Math.round(n.height);
const sec = plat => { const s = plat.children.find(n => n.type === 'SECTION' && n.name === 'Club card'); if (!s) throw new Error('Club card Section yok'); return s; };
const frame = (s, re) => { const f = s.children.find(n => n.type === 'FRAME' && re.test(n.name)); if (!f) throw new Error('frame yok ' + re); return f; };
const sWeb = sec(web), sMob = sec(mob);
const fd = frame(sWeb, /Club card · Desktop$/), fm = frame(sMob, /Club card · Mobile$/);
const bottom = n => { const a = n.absoluteBoundingBox; return Math.round(a.y + a.height); };

await step('Masaüstü: Location alt kenarı Management ile hizalı', async () => {
  const body = fd.findOne(n => n.name === 'Profile body'); const cols = body.findOne(n => n.name === 'Profile columns');
  const side = cols.findOne(n => n.name === 'Side column'), main = cols.findOne(n => n.name === 'Main column'); const loc = side.children.find(n => /^Location/.test(n.name)); const mg = main.findOne(n => n.name === 'Management');
  if (!loc || !mg) throw new Error('loc/mg yok');
  report.info.before = { management: bottom(mg), location: bottom(loc), locSize: sz(loc) };
  side.layoutAlign = 'STRETCH'; loc.layoutGrow = 1;
  const map = loc.findOne(n => n.name === 'Map'); const img = loc.findOne(n => n.name === 'Map image'); const mk = loc.findOne(n => n.name === 'Map marker');
  if (map) { try { map.layoutGrow = 1; } catch (e) { report.errors.push('map grow: ' + e.message); } }
  if (map && img) { try { img.resize(map.width, map.height); } catch (e) { report.errors.push('img resize: ' + e.message); } }
  if (map && mk) { try { mk.x = (map.width - mk.width) / 2; mk.y = (map.height - mk.height) / 2; } catch (e) { report.errors.push('marker: ' + e.message); } }
  report.info.after = { management: bottom(mg), location: bottom(loc), locSize: sz(loc), map: map ? sz(map) : '-', mapImage: img ? sz(img) : '-', side: sz(side) };
});

await step('Mobil: arma + ad yan yana, gri kutu kalkar', async () => {
  const hero = fm.findOne(n => n.name === 'Hero · stadium identity'); if (!hero) throw new Error('hero yok');
  const tile = hero.findOne(n => n.name === 'Crest tile'); if (tile) tile.visible = false;
  for (const big of hero.findAll(n => n.name === 'Club crest · large')) big.remove();
  if (hero.findOne(n => n.name === 'Club header')) { report.info.mobileHeader = 'zaten var'; return; }
  const nameFrame = hero.findOne(n => n.name === 'Player name'); if (!nameFrame) throw new Error('Player name yok');
  const par = nameFrame.parent; const idx = par.children.indexOf(nameFrame);
  const crestSet = p01.findAll(n => n.type === 'COMPONENT_SET' && n.name === 'Club crest')[0]; if (!crestSet) throw new Error('Club crest seti yok');
  const header = figma.createFrame(); header.name = 'Club header'; header.layoutMode = 'HORIZONTAL'; header.fills = []; header.clipsContent = false; header.counterAxisAlignItems = 'CENTER'; header.primaryAxisSizingMode = 'FIXED'; header.counterAxisSizingMode = 'AUTO';
  const gv = (await figma.variables.getLocalVariablesAsync()).find(v => v.name === 'spacing/md' || v.name.endsWith('/spacing/md')); if (gv) header.setBoundVariable('itemSpacing', gv);
  par.insertChild(idx, header); header.layoutSizingHorizontal = 'FILL';
  const crest = crestSet.children.find(c => /Riverside FC/.test(c.name)).createInstance(); crest.name = 'Club crest'; header.appendChild(crest); crest.rescale(1.7);
  header.appendChild(nameFrame); nameFrame.layoutSizingHorizontal = 'FILL';
  report.info.mobileHeader = sz(header) + ' crest ' + sz(crest) + ' name ' + sz(nameFrame);
});

await step('Boyutlar', async () => {
  sWeb.resizeWithoutConstraints(1600, Math.ceil(100 + fd.height + 80)); sMob.resizeWithoutConstraints(560, Math.ceil(100 + fm.height + 80));
  report.info.sizes = 'desktop ' + sz(fd) + ' mobile ' + sz(fm);
  const hero = fm.findOne(n => n.name === 'Hero · stadium identity'); report.info.mobileHero = sz(hero) + ' | ' + hero.children.map(c => c.name + ' ' + sz(c)).join(' | ');
});
return report;
