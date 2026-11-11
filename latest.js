// step 381 · (1) Website row ust cizgisi (etkinlik satirinin cizgisinden kopya) (2) Section + platform boyutu (buyutme dahil) (3) INSPECT: hero ata zinciri (Key facts'ten yukari) masaustu + mobil Full/Minimal
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync(); await figma.setCurrentPageAsync(p02);
const R = n => Math.round(n);
const plats = {}; const secs = {};
for (const plat of ['Web', 'Mobile']) { plats[plat] = p02.children.find(n => n.type === 'SECTION' && n.name === plat); secs[plat] = plats[plat].children.find(n => n.type === 'SECTION' && n.name === 'Club card'); }
const allVars = await figma.variables.getLocalVariablesAsync();
report.info.borderVars = allVars.filter(v => v.resolvedType === 'COLOR' && /border/i.test(v.name)).map(v => v.name).join(', ');
await step('1 Website row cizgisi', async () => {
  const log = []; let src = null;
  for (const plat of ['Web', 'Mobile']) for (const f of secs[plat].children.filter(c => c.type === 'FRAME')) {
    const rows = f.findAll(n => n.name === 'Website row'); if (!rows.length) continue;
    if (!src) { const cands = f.findAll(n => /^(Event row|Person row|Player) · /.test(n.name) && n.strokes && n.strokes.length); if (cands.length) src = cands[0]; }
    for (const r of rows) {
      if (!src) throw new Error('cizgi kaynagi yok');
      r.strokes = src.strokes; r.strokeTopWeight = 1; r.strokeBottomWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0;
    }
    log.push(plat[0] + ' ' + f.name.replace('Clubs / Club card', 'CC') + ': ' + rows.length);
  }
  report.info.dividerSource = src ? src.name + ' | topWeight ' + src.strokeTopWeight + ' bottomWeight ' + src.strokeBottomWeight + ' | bound ' + JSON.stringify(src.strokes[0] && src.strokes[0].boundVariables ? Object.keys(src.strokes[0].boundVariables) : []) : 'yok';
  report.info.dividerRows = log;
});
await step('2 Section + platform', async () => {
  const log = [];
  for (const plat of ['Web', 'Mobile']) {
    const s = secs[plat]; let bottom = 0, right = 0; for (const c of s.children) { bottom = Math.max(bottom, c.y + c.height); right = Math.max(right, c.x + c.width); }
    const nh = Math.ceil(bottom + 80), nw = Math.ceil(right + 80); log.push(plat + ' Club card ' + R(s.width) + 'x' + R(s.height) + ' -> ' + nw + 'x' + nh); s.resizeWithoutConstraints(Math.max(nw, s.width > nw ? nw : nw), nh);
    const P = plats[plat]; const pb = Math.max.apply(null, P.children.map(c => c.y + c.height)); const pr = Math.max.apply(null, P.children.map(c => c.x + c.width));
    log.push(plat + ' platform ' + R(P.width) + 'x' + R(P.height) + ', icerik alt/sag ' + R(pb) + '/' + R(pr));
    const sibs = P.children.filter(c => c !== s && c.type === 'SECTION' && c.x < s.x + s.width && c.x + c.width > s.x && c.y > s.y).map(c => c.name + '@' + R(c.y)); log.push(plat + ' Club card altindaki Section: ' + (sibs.join(', ') || 'yok'));
  }
  report.info.sizes = log;
});
await step('3 Inspect hero', async () => {
  const log = [];
  for (const plat of ['Web', 'Mobile']) for (const nm of ['Clubs / Club card · ' + (plat === 'Web' ? 'Desktop' : 'Mobile'), 'Clubs / Club card / Minimal data · ' + (plat === 'Web' ? 'Desktop' : 'Mobile')]) {
    const f = secs[plat].children.find(c => c.type === 'FRAME' && c.name === nm); if (!f) { log.push(nm + ': yok'); continue; }
    log.push('== ' + plat[0] + ' ' + nm.replace('Clubs / Club card', 'CC') + ' ' + R(f.width) + 'x' + R(f.height) + ' ' + f.layoutMode);
    const kf = f.findOne(n => n.name === 'Key facts'); let n = kf; const fb = f.absoluteBoundingBox;
    while (n && n !== f) { const b = n.absoluteBoundingBox; log.push('  ' + n.name + ' [' + n.type + '] ' + R(b.width) + 'x' + R(b.height) + ' @' + R(b.x - fb.x) + ',' + R(b.y - fb.y) + ' ' + (n.layoutMode || '-') + ' v:' + (n.layoutSizingVertical || '-') + (n.layoutPositioning === 'ABSOLUTE' ? ' ABS' : '')); n = n.parent; }
    const hero = kf ? (function () { let x = kf; while (x.parent && x.parent !== f) x = x.parent; return x; })() : null;
    if (hero) { log.push('  hero kok: ' + hero.name + ' ' + R(hero.height) + ' v:' + hero.layoutSizingVertical + ' | cocuklar:'); for (const c of hero.children) { const b = c.absoluteBoundingBox; log.push('    ' + c.name + ' ' + R(b.width) + 'x' + R(b.height) + ' @' + R(b.x - fb.x) + ',' + R(b.y - fb.y) + (c.layoutPositioning === 'ABSOLUTE' ? ' ABS' : '') + ' v:' + (c.layoutSizingVertical || '-')); } const nxt = f.children[f.children.indexOf(hero) + 1]; if (nxt) log.push('  hero sonrasi: ' + nxt.name + ' @' + R(nxt.absoluteBoundingBox.y - fb.y)); }
  }
  report.info.hero = log;
});
return JSON.stringify(report, null, 1);
