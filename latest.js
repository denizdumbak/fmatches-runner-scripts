// step 404 · INSPECT: rol profillerinde Key facts (masaustu + mobil) fact sayisi, etiket ve degerler
const report = { errors: [], info: {} };
try {
  const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
  await figma.setCurrentPageAsync(p02);
  const R = n => Math.round(n);
  for (const plat of ['Web', 'Mobile']) {
    const root = p02.children.find(n => n.type === 'SECTION' && n.name === plat);
    const rolesSec = root.children.find(n => n.type === 'SECTION' && n.name === 'Profiles · other roles');
    const suf = plat === 'Web' ? 'Desktop' : 'Mobile';
    for (const role of ['Manager', 'Referee', 'Intermediary']) {
      const f = rolesSec.children.find(c => c.type === 'FRAME' && c.name === 'Profiles / ' + role + ' · ' + suf);
      const kf = f && f.findOne(n => n.name === 'Key facts');
      if (!kf) { report.errors.push(plat + ' ' + role + ' Key facts yok'); continue; }
      report.info[plat + ' ' + role] = { kf: kf.layoutMode + ' ' + R(kf.width) + 'x' + R(kf.height) + ' wrap=' + kf.layoutWrap, facts: kf.children.map(c => c.name + ' [' + c.type + '] ' + R(c.width) + 'x' + R(c.height) + (c.visible === false ? ' hidden' : '') + ' | ' + c.findAll(t => t.type === 'TEXT').map(t => t.name + '=' + t.characters).join(' ; ')) };
    }
  }
} catch (e) { report.errors.push(String(e && e.message ? e.message : e)); }
return JSON.stringify(report, null, 1);
