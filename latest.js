// step 232 · rename auto flow "Flow 1" to "Mobile · Interactive map"; hide Filters pill on Scouts near you (mobile) so the summary row fits

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync(); await figma.setCurrentPageAsync(p02);
const mob = p02.children.find(n => n.type === 'SECTION' && /^Mobile/.test(n.name)); const mMap = mob.children.find(n => n.type === 'SECTION' && n.name === 'Map');
const MD = mMap.children.find(n => n.name === 'Map / Default · Mobile'), MS = mMap.children.find(n => n.name === 'Map / Scouts near you · Mobile');
await step('rename flow start', async () => {
  const fs = (p02.flowStartingPoints || []).map(f => ({ nodeId: f.nodeId, name: f.name }));
  const hit = fs.find(f => f.nodeId === MD.id); if (!hit) throw new Error('no flow start on Map / Default · Mobile');
  report.info.renamedFrom = hit.name; hit.name = 'Mobile · Interactive map';
  const seen = new Set(); const clean = []; for (const f of fs) { if (seen.has(f.nodeId)) continue; seen.add(f.nodeId); clean.push(f); }
  p02.flowStartingPoints = clean; report.info.flowStarts = clean.length; report.info.names = clean.map(f => f.name).join(' | ');
});
await step('hide Filters pill on Scouts', async () => {
  const sheet = MS.findOne(n => n.type === 'INSTANCE' && /^Bottom sheet/.test(n.name)); const pill = sheet && sheet.findOne(n => n.name === 'Filters' && n.type === 'FRAME');
  if (!pill) throw new Error('pill not found'); pill.visible = false;
  const sum = sheet.findOne(n => n.name === 'Summary'); const w = sum.children.filter(c => c.visible).reduce((a, c) => a + c.width, 0);
  report.info.scoutSummary = Math.round(w) + ' of ' + Math.round(sum.width);
});
const over = []; for (const pg of mMap.children.filter(n => / · Mobile$/.test(n.name))) for (const s of pg.findAll(n => n.type === 'FRAME' && n.name === 'Summary')) { const w = s.children.filter(c => c.visible).reduce((a, c) => a + c.width, 0); if (w > s.width) over.push(pg.name + ': ' + Math.round(w) + '>' + Math.round(s.width)); }
report.info.summaryOverflow = over.length ? over : 'none';
return report;
