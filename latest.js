// step 382 · Mobil Minimal data ekrani: sabit yukseklik mi, altta bos alan var mi? Olc, FIXED ise HUG yap. Sonra Club card Section/platform yeniden oturur
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync(); await figma.setCurrentPageAsync(p02);
const R = n => Math.round(n);
const plats = {}, secs = {};
for (const plat of ['Web', 'Mobile']) { plats[plat] = p02.children.find(n => n.type === 'SECTION' && n.name === plat); secs[plat] = plats[plat].children.find(n => n.type === 'SECTION' && n.name === 'Club card'); }
await step('Minimal data yukseklik', async () => {
  const log = [];
  for (const plat of ['Web', 'Mobile']) {
    const f = secs[plat].children.find(c => c.type === 'FRAME' && c.name === 'Clubs / Club card / Minimal data · ' + (plat === 'Web' ? 'Desktop' : 'Mobile'));
    if (!f) { log.push(plat + ': ekran yok'); continue; }
    const fb = f.absoluteBoundingBox; const kids = f.children.filter(c => c.visible !== false);
    const last = kids[kids.length - 1]; const lb = last.absoluteBoundingBox;
    log.push(plat + ' Minimal: ' + R(f.height) + ' v:' + f.layoutSizingVertical + ' primary:' + f.primaryAxisSizingMode + ' | son oge ' + last.name + ' biter ' + R(lb.y + lb.height - fb.y) + ' | cocuklar: ' + kids.map(c => c.name + '@' + R(c.absoluteBoundingBox.y - fb.y) + '+' + R(c.height)).join(', '));
    if (f.primaryAxisSizingMode === 'FIXED') { const before = R(f.height); f.primaryAxisSizingMode = 'AUTO'; log.push(plat + ' Minimal: FIXED -> HUG, ' + before + ' -> ' + R(f.height)); }
  }
  report.info.minimal = log;
});
await step('Section + platform', async () => {
  const log = [];
  for (const plat of ['Web', 'Mobile']) { const s = secs[plat]; let bottom = 0; for (const c of s.children) bottom = Math.max(bottom, c.y + c.height); const nh = Math.ceil(bottom + 80); log.push(plat + ' Club card h ' + R(s.height) + ' -> ' + nh); s.resizeWithoutConstraints(s.width, nh);
    const P = plats[plat]; const pb = Math.max.apply(null, P.children.map(c => c.y + c.height)); log.push(plat + ' platform h ' + R(P.height) + ', icerik alt ' + R(pb)); }
  report.info.sizes = log;
});
await step('Yesil metin taramasi (salt okunur)', async () => {
  const log = []; const seen = {};
  for (const plat of ['Mobile', 'Web']) for (const f of secs[plat].children.filter(c => c.type === 'FRAME' && /Club card (·|\/ Minimal data ·) /.test(c.name))) {
    for (const t of f.findAll(n => n.type === 'TEXT' && n.visible !== false)) {
      const fl = t.fills && t.fills[0]; if (!fl || fl.type !== 'SOLID') continue;
      const bv = fl.boundVariables && fl.boundVariables.color; let vn = '-';
      if (bv) { const v = await figma.variables.getVariableByIdAsync(bv.id); vn = v ? v.name : '?'; }
      if (!/brand|green|link/i.test(vn)) continue;
      const key = plat[0] + ' ' + f.name.replace('Clubs / Club card', 'CC') + ' | ' + (t.parent ? t.parent.name : '-') + ' > ' + (t.parent && t.parent.parent ? t.parent.parent.name : '-') + ' > ' + t.name + ' "' + t.characters.slice(0, 30) + '" ' + vn + ' ' + t.fontSize + 'px';
      if (!seen[key]) { seen[key] = 1; log.push(key); }
    }
  }
  report.info.greenText = log;
});
return JSON.stringify(report, null, 1);
