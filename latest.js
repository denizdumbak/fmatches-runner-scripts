// step 405 · Faz 7 edit formlari (4/4): rol profillerinde Key facts'e rol alani: Manager License, Referee Category, Intermediary Agency (profil, Directory varyanti ve Edit career sayfalari)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
async function setText(t, s) { const f = t.fontName; if (f === figma.mixed) { await figma.loadFontAsync(t.getRangeFontName(0, 1)); } else { await figma.loadFontAsync(f); } t.characters = s; }
function settle(plat, sec) {
  const secs = plat.children.filter(n => n.type === 'SECTION').sort((a, b) => a.y - b.y); let prev = null; const moved = [];
  for (const s of secs) { if (s === sec) { prev = s.y + s.height; continue; } if (prev === null) continue; if (s.y < prev + 160) { moved.push(s.name + ' ' + R(s.y) + ' -> ' + R(prev + 160)); s.y = prev + 160; } prev = s.y + s.height; }
  plat.resizeWithoutConstraints(plat.width, Math.ceil(Math.max.apply(null, plat.children.map(n => n.y + n.height)) + 120));
  return moved;
}
const ADD = { Manager: { label: 'License', value: 'PRO' }, Referee: { label: 'Category', value: 'FIFA 1st' }, Intermediary: { label: 'Agency', value: 'Northline Sports Agency' } };
const re = /^Profiles \/ (Manager|Referee|Intermediary)( \/ Directory.*| \/ Own profile \/ Edit career)? · (Desktop|Mobile)$/;
for (const plat of ['Web', 'Mobile']) {
  const root = p02.children.find(n => n.type === 'SECTION' && n.name === plat); const isWeb = plat === 'Web';
  const secs = ['Profiles · other roles', 'Own profile · other roles'].map(nm => root.children.find(n => n.type === 'SECTION' && n.name === nm)).filter(Boolean);
  for (const sec of secs) {
    for (const f of sec.children.filter(c => c.type === 'FRAME' && re.test(c.name))) {
      await step(plat + ' ' + f.name, async () => {
        const role = re.exec(f.name)[1]; const cfg = ADD[role];
        const kf = f.findOne(n => n.name === 'Key facts'); if (!kf) { report.info[plat + ' ' + f.name] = 'Key facts yok'; return; }
        if (kf.children.some(c => c.name === 'Fact · ' + cfg.label)) { report.info[plat + ' ' + f.name] = 'zaten var'; return; }
        const roleFact = kf.children.find(c => c.name === 'Fact · Role'); if (!roleFact) throw new Error('Fact · Role yok');
        const nat = kf.children.find(c => c.name === 'Fact · Nationality');
        const clone = roleFact.clone(); clone.name = 'Fact · ' + cfg.label;
        const after = (!isWeb && role === 'Intermediary') ? nat : roleFact;
        kf.insertChild(kf.children.indexOf(after) + 1, clone);
        const texts = clone.findAll(t => t.type === 'TEXT'); const lab = texts.find(t => t.name === 'Label'), val = texts.find(t => t.name === 'Value'), sub = texts.find(t => t.name === 'Sub');
        await setText(lab, cfg.label); await setText(val, cfg.value); if (sub) sub.visible = false;
        if (!isWeb && role === 'Intermediary') { try { clone.layoutSizingHorizontal = 'FILL'; } catch (e) { report.errors.push('FILL: ' + e.message); } }
        report.info[plat + ' ' + f.name] = { kf: R(kf.width) + 'x' + R(kf.height), facts: kf.children.map(c => c.name.replace('Fact · ', '') + ' ' + R(c.width) + 'x' + R(c.height)), frameH: R(f.height), parentW: R(kf.parent.width) };
      });
    }
    await step(plat + ' ' + sec.name + ' Section', async () => {
      const right = Math.max.apply(null, sec.children.map(c => c.x + c.width)), bottom = Math.max.apply(null, sec.children.map(c => c.y + c.height));
      sec.resizeWithoutConstraints(Math.max(sec.width, Math.ceil(right + 80)), Math.max(sec.height, Math.ceil(bottom + 80)));
      const fr = sec.children.filter(c => c.type === 'FRAME'); const ov = [];
      for (let i = 0; i < fr.length; i++) for (let j = i + 1; j < fr.length; j++) { const a = fr[i], b = fr[j]; if (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y) ov.push(a.name + ' x ' + b.name); }
      report.info[plat + ' ' + sec.name + ' overlaps'] = ov.length ? ov : 'none';
    });
  }
  await step(plat + ' settle', async () => { const last = secs[secs.length - 1]; let mv = []; for (const s of secs) mv = mv.concat(settle(root, s)); report.info[plat + ' moved'] = mv; });
}
await step('Kontrol', async () => {
  let uns = 0, dash = 0; for (const f of p02.findAll(n => n.type === 'FRAME' && re.test(n.name))) for (const t of f.findAll(n => n.type === 'TEXT')) { if (typeof t.textStyleId === 'string' && t.textStyleId === '') uns++; if (t.characters.indexOf(String.fromCharCode(8212)) >= 0) dash++; }
  report.info.unstyledText = uns; report.info.longDash = dash;
});
return JSON.stringify(report, null, 1);
