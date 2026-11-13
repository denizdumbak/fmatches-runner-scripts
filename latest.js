// step 397 · Intermediary Edit details: Clients alanini Agency ve Specialization'in altina tasi
const report = { done: [], errors: [], info: {} };
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const f = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Intermediary / Own profile / Edit details · Desktop');
if (!f) throw new Error('frame yok');
const form = f.findOne(n => n.name === 'Details form');
const fb = form.children.find(c => c.name === 'Group · Agency');
const ff = fb.findOne(n => n.name === 'Fields');
const cl = ff.children.find(c => c.name === 'Field · Clients');
ff.appendChild(cl);
report.info.order = ff.children.map(c => c.name + ' ' + Math.round(c.width) + 'x' + Math.round(c.height));
report.info.frame = Math.round(f.width) + 'x' + Math.round(f.height);
return JSON.stringify(report, null, 1);
