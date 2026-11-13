// step 402 · INSPECT: Player Edit career (masaustu + mobil) yapisi, career satir formu alanlari
const report = { errors: [], info: {} };
try {
  const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
  await figma.setCurrentPageAsync(p02);
  const R = n => Math.round(n);
  const line = (c, d) => '  '.repeat(d) + c.name + ' [' + c.type + (c.layoutMode && c.layoutMode !== 'NONE' ? ' ' + c.layoutMode : '') + '] ' + R(c.width) + 'x' + R(c.height) + (c.visible === false ? ' hidden' : '');
  const tree = (n, d, max, out) => { if (!n.children || d >= max) return out; for (const c of n.children) { out.push(line(c, d)); if (c.type !== 'INSTANCE' || d < 2) tree(c, d + 1, max, out); } return out; };
  for (const plat of ['Web', 'Mobile']) {
    const root = p02.children.find(n => n.type === 'SECTION' && n.name === plat);
    const f = root.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player / Own profile / Edit career · ' + (plat === 'Web' ? 'Desktop' : 'Mobile'));
    if (!f) { report.errors.push(plat + ' Edit career yok'); continue; }
    const car = f.findOne(n => /^Career/.test(n.name) && n.type !== 'TEXT');
    report.info[plat] = { frame: R(f.width) + 'x' + R(f.height), section: f.parent.name, careerNode: car ? car.name + ' ' + R(car.width) + 'x' + R(car.height) : 'yok', careerTree: car ? tree(car, 0, 5, []).slice(0, 80) : [] };
    const roleCareer = root.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Manager · ' + (plat === 'Web' ? 'Desktop' : 'Mobile'));
    const rc = roleCareer && roleCareer.findOne(n => /^Career/.test(n.name) && n.type !== 'TEXT');
    report.info[plat].managerCareer = rc ? tree(rc, 0, 3, []).slice(0, 25) : 'yok';
  }
} catch (e) { report.errors.push(String(e && e.message ? e.message : e)); }
return JSON.stringify(report, null, 1);
