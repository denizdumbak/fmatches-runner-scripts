// step 346 · Kulüp kartı masaüstü: Location kartı bu sayfada örnekten ayrılır (detach), harita alanı uzar; alt kenarı Management ile aynı hizaya gelir
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const sWeb = web.children.find(n => n.type === 'SECTION' && n.name === 'Club card'); if (!sWeb) throw new Error('Club card Section yok');
const fd = sWeb.children.find(n => n.type === 'FRAME' && /Club card · Desktop$/.test(n.name)); if (!fd) throw new Error('masaüstü frame yok');
const sz = n => Math.round(n.width) + 'x' + Math.round(n.height);
const bottom = n => { const a = n.absoluteBoundingBox; return Math.round(a.y + a.height); };
const top = n => Math.round(n.absoluteBoundingBox.y);

await step('Location detach + harita uzat', async () => {
  const cols = fd.findOne(n => n.name === 'Profile columns'); const side = cols.findOne(n => n.name === 'Side column'), main = cols.findOne(n => n.name === 'Main column');
  const mg = main.findOne(n => n.name === 'Management'); let loc = side.children.find(n => /^Location/.test(n.name)); if (!loc || !mg) throw new Error('loc/mg yok');
  report.info.before = { management: bottom(mg), location: bottom(loc), type: loc.type };
  if (loc.type === 'INSTANCE') loc = loc.detachInstance();
  loc.name = 'Location · Spreeufer Stadium';
  const map = loc.findOne(n => n.name === 'Map'), img = loc.findOne(n => n.name === 'Map image'), mk = loc.findOne(n => n.name === 'Map marker'), body = loc.findOne(n => n.name === 'Body');
  if (!map || !img || !body) throw new Error('map/img/body yok: ' + loc.children.map(c => c.name).join(','));
  const need = bottom(mg) - top(loc); const mapH = need - Math.round(body.height);
  map.resize(map.width, mapH); img.resize(map.width, mapH); img.x = 0; img.y = 0;
  if (mk) { mk.x = (map.width - mk.width) / 2; mk.y = (mapH - mk.height) / 2; }
  report.info.after = { management: bottom(mg), location: bottom(loc), locSize: sz(loc), map: sz(map), mapImage: sz(img), body: sz(body) };
  report.info.equal = bottom(mg) === bottom(loc);
});

await step('Boyutlar', async () => {
  sWeb.resizeWithoutConstraints(1600, Math.ceil(100 + fd.height + 80)); report.info.desktop = sz(fd) + ' section ' + sz(sWeb);
});
return report;
