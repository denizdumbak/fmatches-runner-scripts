// step 407 · Player Edit career (masaustu + mobil): Career row form'a Achievements alani (rol sayfalariyla tutarli)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
async function setText(t, s) { const f = t.fontName; if (f === figma.mixed) { await figma.loadFontAsync(t.getRangeFontName(0, 1)); } else { await figma.loadFontAsync(f); } t.characters = s; }
async function setIn(root, name, s) { const t = root.findOne(n => n.type === 'TEXT' && n.name === name); if (!t) throw new Error('metin yok: ' + name); await setText(t, s); }
function settle(plat, sec) {
  const secs = plat.children.filter(n => n.type === 'SECTION').sort((a, b) => a.y - b.y); let prev = null; const moved = [];
  for (const s of secs) { if (s === sec) { prev = s.y + s.height; continue; } if (prev === null) continue; if (s.y < prev + 160) { moved.push(s.name + ' ' + R(s.y) + ' -> ' + R(prev + 160)); s.y = prev + 160; } prev = s.y + s.height; }
  plat.resizeWithoutConstraints(plat.width, Math.ceil(Math.max.apply(null, plat.children.map(n => n.y + n.height)) + 120));
  return moved;
}
for (const plat of ['Web', 'Mobile']) {
  await step(plat + ' Achievements', async () => {
    const suf = plat === 'Web' ? 'Desktop' : 'Mobile';
    const root = p02.children.find(n => n.type === 'SECTION' && n.name === plat);
    const sec = root.children.find(n => n.type === 'SECTION' && n.name === 'Own profile');
    const f = sec.children.find(c => c.type === 'FRAME' && c.name === 'Profiles / Player / Own profile / Edit career · ' + suf);
    const det = sec.children.find(c => c.type === 'FRAME' && c.name === 'Profiles / Player / Own profile / Edit details · ' + suf);
    if (!f || !det) throw new Error('sayfa yok');
    const fields = f.findOne(n => n.name === 'Career row form').findOne(n => n.name === 'Fields');
    if (fields.children.some(c => c.name === 'Field · Achievements')) { report.info[plat] = 'zaten var'; return; }
    const src = det.findOne(n => n.name === 'Field · Height (cm)'); if (!src) throw new Error('text alan yok');
    const a = src.clone(); fields.appendChild(a); await setIn(a, 'Label', 'Achievements'); await setIn(a, 'Value', 'Youth League runner-up 2023'); a.name = 'Field · Achievements';
    try { a.layoutSizingHorizontal = 'FILL'; } catch (e) { report.errors.push(plat + ' FILL: ' + e.message); }
    const before = R(sec.height);
    const right = Math.max.apply(null, sec.children.map(c => c.x + c.width)), bottom = Math.max.apply(null, sec.children.map(c => c.y + c.height));
    sec.resizeWithoutConstraints(Math.max(sec.width, Math.ceil(right + 80)), Math.max(sec.height, Math.ceil(bottom + 80)));
    const ov = []; const fr = sec.children.filter(c => c.type === 'FRAME');
    for (let i = 0; i < fr.length; i++) for (let j = i + 1; j < fr.length; j++) { const p = fr[i], q = fr[j]; if (p.x < q.x + q.width && p.x + p.width > q.x && p.y < q.y + q.height && p.y + p.height > q.y) ov.push(p.name + ' x ' + q.name); }
    report.info[plat] = { fields: fields.children.map(c => c.name + ' ' + R(c.width) + 'x' + R(c.height)), frameH: R(f.height), sectionH: before + ' -> ' + R(sec.height), screenOverlaps: ov.length ? ov : 'none', moved: settle(root, sec) };
  });
}
return JSON.stringify(report, null, 1);
