// step 383 · Club card: ulke yazisi (Fact · City > Sub "Germany") 12 px yesil -> 16 px, ana metin rengi (Value ile ayni boya). Tum Club card ekranlari, masaustu + mobil
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync(); await figma.setCurrentPageAsync(p02);
const R = n => Math.round(n);
const plats = {}, secs = {};
for (const plat of ['Web', 'Mobile']) { plats[plat] = p02.children.find(n => n.type === 'SECTION' && n.name === plat); secs[plat] = plats[plat].children.find(n => n.type === 'SECTION' && n.name === 'Club card'); }
const screens = []; for (const plat of ['Web', 'Mobile']) for (const f of secs[plat].children.filter(c => c.type === 'FRAME')) screens.push({ plat, f });
const before = {}; screens.forEach(s => before[s.f.id] = R(s.f.height));
await step('Ulke yazisi', async () => {
  const log = []; let styleName = '-';
  for (const { plat, f } of screens) {
    const cands = f.findAll(n => n.type === 'TEXT' && n.fontSize === 16 && n.textStyleId && n.fontName && n.fontName.family === 'Inter');
    let styleId = ''; let picked = null;
    for (const c of cands) { const st = await figma.getStyleByIdAsync(c.textStyleId); if (st && /body|text/i.test(st.name)) { picked = st; break; } if (!picked && st) picked = st; }
    if (!picked) { log.push(plat[0] + ' ' + f.name + ': 16 px Inter stili bulunamadi'); continue; }
    styleId = picked.id; styleName = picked.name;
    for (const fact of f.findAll(n => n.type === 'INSTANCE' && n.name === 'Fact · City')) {
      const sub = fact.findOne(n => n.type === 'TEXT' && n.name === 'Sub'), val = fact.findOne(n => n.type === 'TEXT' && n.name === 'Value');
      if (!sub || !val) { log.push(plat[0] + ' ' + f.name + ': Sub/Value yok'); continue; }
      const h0 = R(fact.height), s0 = sub.fontSize;
      await sub.setTextStyleIdAsync(styleId); sub.fills = val.fills;
      log.push(plat[0] + ' ' + f.name.replace('Clubs / Club card', 'CC') + ': "' + sub.characters + '" ' + s0 + ' -> ' + sub.fontSize + 'px, Fact ' + h0 + ' -> ' + R(fact.height) + ', sub genislik ' + R(sub.width) + ', fact genislik ' + R(fact.width));
    }
  }
  report.info.style = styleName; report.info.country = log;
});
await step('Section', async () => {
  const log = [];
  for (const plat of ['Web', 'Mobile']) { const s = secs[plat]; let bottom = 0; for (const c of s.children) bottom = Math.max(bottom, c.y + c.height); const nh = Math.ceil(bottom + 80); log.push(plat + ' Club card h ' + R(s.height) + ' -> ' + nh); s.resizeWithoutConstraints(s.width, nh); }
  report.info.sizes = log;
});
report.info.heights = screens.map(s => s.plat[0] + ':' + s.f.name.replace('Clubs / Club card', 'CC') + ' ' + before[s.f.id] + ' -> ' + R(s.f.height)).join('\n');
report.info.unstyledText = screens.reduce((a, s) => a + s.f.findAll(x => x.type === 'TEXT' && x.textStyleId === '').length, 0);
return JSON.stringify(report, null, 1);
