// step 399 · INSPECT: mobil Edit details (Player) ve mobil rol profilleri yapisi, Mobile Section listesi
const report = { errors: [], info: {} };
try {
  const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
  await figma.setCurrentPageAsync(p02);
  const R = n => Math.round(n);
  const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
  report.info.mobileSections = mob.children.filter(n => n.type === 'SECTION').map(s => s.name + ' @' + R(s.x) + ',' + R(s.y) + ' ' + R(s.width) + 'x' + R(s.height));
  const all = mob.findAll(n => n.type === 'FRAME' && /Profiles \//.test(n.name) && /Mobile/.test(n.name) && n.parent.type === 'SECTION');
  report.info.profileFrames = all.map(f => f.name + ' | ' + f.parent.name + ' ' + R(f.width) + 'x' + R(f.height));
  const tree = (n, d, max) => n.children && d < max ? n.children.map(c => '  '.repeat(d) + c.name + ' [' + c.type + (c.layoutMode && c.layoutMode !== 'NONE' ? ' ' + c.layoutMode : '') + '] ' + R(c.width) + 'x' + R(c.height) + (c.visible === false ? ' hidden' : '')).concat(...n.children.map(c => tree(c, d + 1, max))) : [];
  const edit = all.find(f => /Player \/ Own profile \/ Edit details/.test(f.name));
  if (edit) {
    report.info.editTree = tree(edit, 0, 3).slice(0, 70);
    const form = edit.findOne(n => n.name === 'Details form');
    report.info.formTree = form ? tree(form, 0, 4).slice(0, 60) : 'yok';
  } else report.errors.push('Player mobil Edit details yok');
  for (const r of ['Manager', 'Referee', 'Intermediary']) {
    const f = all.find(x => x.name === 'Profiles / ' + r + ' · Mobile');
    report.info[r] = f ? tree(f, 0, 3).slice(0, 40) : 'profil yok';
  }
} catch (e) { report.errors.push(String(e && e.message ? e.message : e)); }
return JSON.stringify(report, null, 1);
