// step 321 · stadyum kartı hero: ad tek parça ("Spreeufer Stadium", tek stil, sığmazsa alt satıra iner; "ad küçük SOYADI büyük" ayrımı kalktı) · hero fotoğrafı stadyum sahnesi (img/facility/stadium-aerial-v1.jpg: Deniz'in verdiği havadan stadyum, 500x281 kaynak 2x büyütüldü, geçici)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = Math.round;
const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p02.loadAsync();
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const sec = web.children.find(n => n.type === 'SECTION' && n.name === 'Stadium card');
const fr = sec.children.find(n => n.type === 'FRAME' && n.name === 'Facilities / Stadium card · Desktop');
const styles = await figma.getLocalTextStylesAsync();
async function setText(t, str) { for (const f of t.getRangeAllFontNames(0, Math.max(t.characters.length, 1))) await figma.loadFontAsync(f); t.characters = str; }

await step('A name', async () => {
  const ds = styles.filter(s => /^Display\/Surname/.test(s.name) && /Desktop/.test(s.name));
  report.info.surnameStyles = ds.map(s => `${s.name} ${s.fontSize}`);
  const pick = ds.slice().sort((a, b) => Math.abs(a.fontSize - 96) - Math.abs(b.fontSize - 96))[0];
  report.info.chosenStyle = pick ? `${pick.name} ${pick.fontSize}` : 'yok';
  const nr = fr.findOne(n => n.name === 'Name and role'), pn = nr.findOne(n => n.name === 'Player name');
  const first = pn.findAll(n => n.type === 'TEXT').find(t => t.characters === 'Spreeufer');
  const big = pn.findAll(n => n.type === 'TEXT').find(t => t.characters === 'Stadium');
  if (!first || !big) throw new Error('ad metinleri bulunamadı: ' + pn.findAll(n => n.type === 'TEXT').map(t => t.characters).join('|'));
  // first-name satırı (rozet dahil) tümüyle gizlenir
  let row = first; while (row.parent && row.parent !== pn) row = row.parent; row.visible = false; report.info.hidRow = row.name;
  await big.setTextStyleIdAsync(pick.id);
  await setText(big, 'Spreeufer Stadium');
  nr.layoutSizingHorizontal = 'FILL'; pn.layoutSizingHorizontal = 'FILL'; big.layoutSizingHorizontal = 'FILL'; big.textAutoResize = 'HEIGHT';
  report.info.name = `${R(big.width)}x${R(big.height)} lines≈${R(big.height / pick.fontSize)}`;
});

await step('B photo', async () => {
  const hero = fr.findOne(n => n.name === 'Hero · stadium identity'), photo = hero.findOne(n => n.name === 'Facility photo');
  const img = await figma.createImageAsync('https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/img/facility/stadium-aerial-v1.jpg');
  photo.fills = [{ type: 'IMAGE', imageHash: img.hash, scaleMode: 'FILL' }];
  photo.resize(488, hero.height - 80); photo.y = 40;
  report.info.hero = `${R(hero.width)}x${R(hero.height)} photo ${R(photo.width)}x${R(photo.height)}`;
  const idn = hero.findOne(n => n.name === 'Identity');
  report.info.identityRight = R(idn.absoluteBoundingBox.x + idn.width - fr.absoluteBoundingBox.x);
});

await step('C section size', async () => {
  sec.resizeWithoutConstraints(fr.width + 160, fr.y + fr.height + 100);
  web.resizeWithoutConstraints(web.width, Math.max(web.height, sec.y + sec.height + 120));
  report.info.frame = `${R(fr.width)}x${R(fr.height)}`;
  const un = fr.findAll(n => n.type === 'TEXT' && !n.textStyleId).length; report.info.unstyledText = un;
});

return report;
