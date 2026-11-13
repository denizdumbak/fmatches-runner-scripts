// step 406 · Mobil Intermediary: Agency fact'ini tam genislige al (profil + Edit career)
const report = { errors: [], info: {} };
try {
  const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
  await figma.setCurrentPageAsync(p02);
  const R = n => Math.round(n);
  const frames = p02.findAll(n => n.type === 'FRAME' && /^Profiles \/ Intermediary( \/ Own profile \/ Edit career)? · Mobile$/.test(n.name));
  for (const f of frames) {
    const kf = f.findOne(n => n.name === 'Key facts'); const ag = kf && kf.children.find(c => c.name === 'Fact · Agency');
    if (!ag) { report.errors.push(f.name + ': Agency yok'); continue; }
    const before = R(ag.width);
    try { ag.layoutSizingHorizontal = 'FILL'; } catch (e) { report.errors.push(f.name + ' FILL: ' + e.message); }
    if (R(ag.width) < 300) { try { ag.layoutSizingHorizontal = 'FIXED'; ag.resize(kf.width, ag.height); } catch (e) { report.errors.push(f.name + ' resize: ' + e.message); } }
    report.info[f.name] = { before, after: R(ag.width) + 'x' + R(ag.height), kf: R(kf.width) + 'x' + R(kf.height), facts: kf.children.map(c => c.name.replace('Fact · ', '') + ' ' + R(c.width) + 'x' + R(c.height)), frameH: R(f.height) };
  }
} catch (e) { report.errors.push(String(e && e.message ? e.message : e)); }
return JSON.stringify(report, null, 1);
