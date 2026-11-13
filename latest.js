// step 398 · Intermediary Edit details: Clients alanini sona tasi (alani formda adla ara, hata mesajini raporla)
const report = { done: [], errors: [], info: {} };
try {
  const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
  await figma.setCurrentPageAsync(p02);
  const f = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Intermediary / Own profile / Edit details · Desktop');
  if (!f) throw new Error('frame yok');
  const form = f.findOne(n => n.name === 'Details form');
  report.info.groups = form.children.map(c => c.name);
  const cl = form.findOne(n => n.name === 'Field · Clients');
  if (!cl) throw new Error('Clients alani yok');
  const parent = cl.parent;
  report.info.parent = parent.name + ' / ' + parent.parent.name + ' · ' + parent.type + ' · ' + parent.layoutMode;
  report.info.before = parent.children.map(c => c.name);
  try { parent.appendChild(cl); } catch (e) { report.errors.push('appendChild: ' + e.message); try { parent.insertChild(parent.children.length - 1, cl); } catch (e2) { report.errors.push('insertChild: ' + e2.message); } }
  report.info.after = parent.children.map(c => c.name + ' ' + Math.round(c.width) + 'x' + Math.round(c.height));
  report.info.frame = Math.round(f.width) + 'x' + Math.round(f.height);
} catch (e) { report.errors.push(String(e && e.message ? e.message : e)); }
return JSON.stringify(report, null, 1);
