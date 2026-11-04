// step 286 · READ-ONLY inspect: structure of Events / My events (+ Applied, No events created) Desktop and Mobile, to derive My contacts / Notifications / Shortlists / Settings pages from them. Changes nothing.
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p02 = pageOf(/^02/); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const sz = n => Math.round(n.width) + 'x' + Math.round(n.height);
const frameIn = name => p02.findOne(n => n.type === 'FRAME' && n.name === name);
function tree(n, depth, maxDepth, out, indent) {
  let extra = '';
  if (n.type === 'TEXT') extra = ' "' + n.characters.slice(0, 36) + '"';
  if ('layoutMode' in n && n.layoutMode !== 'NONE') extra += ' ' + n.layoutMode[0] + (n.itemSpacing ? ' g' + n.itemSpacing : '') + (n.paddingLeft ? ' p' + n.paddingTop + '/' + n.paddingLeft : '');
  if ('layoutPositioning' in n && n.layoutPositioning === 'ABSOLUTE') extra += ' ABS';
  out.push(indent + n.name + ' (' + n.type.toLowerCase() + ' ' + sz(n) + extra + ')');
  if (depth < maxDepth && 'children' in n && n.type !== 'INSTANCE') for (const c of n.children) tree(c, depth + 1, maxDepth, out, indent + '  ');
}
for (const dev of ['Desktop', 'Mobile']) {
  await step('My events ' + dev, async () => {
    const f = frameIn('Events / My events · ' + dev); if (!f) throw new Error('page missing');
    const out = []; tree(f, 0, dev === 'Desktop' ? 4 : 4, out, '');
    report.info['myEvents' + dev] = out.slice(0, 60);
    report.info['myEvents' + dev + 'Flow'] = p02.flowStartingPoints.filter(x => x.nodeId === f.id).map(x => x.name);
  });
}
await step('placement: Events section children (last row) + section bounds', async () => {
  for (const root of p02.children.filter(n => n.name === 'Web' || n.name === 'Mobile')) {
    const ev = root.children.find(c => c.type === 'SECTION' && /Events/.test(c.name));
    const fr = ev.children.filter(c => c.type === 'FRAME');
    const rows = {}; for (const f of fr) { const k = Math.round(f.y); rows[k] = (rows[k] || 0) + 1; }
    report.info['events' + root.name + 'Section'] = 'SECTION ' + ev.name + ' @' + Math.round(ev.x) + ',' + Math.round(ev.y) + ' ' + sz(ev) + ' rows(y:count) ' + JSON.stringify(rows);
    report.info[root.name + 'Bounds'] = root.name + ' @' + Math.round(root.x) + ',' + Math.round(root.y) + ' ' + sz(root);
  }
});
await step('Account menu instance on Events / Account menu pages + Settings change-password page tree', async () => {
  const f = frameIn('Settings / Change password · Desktop'); if (!f) throw new Error('Change password page missing');
  const out = []; tree(f, 0, 3, out, ''); report.info.changePasswordDesktop = out.slice(0, 30);
  report.info.changePasswordSection = f.parent.type + ' ' + f.parent.name;
});
await step('Header bell instances on the My events pages', async () => {
  for (const dev of ['Desktop', 'Mobile']) {
    const f = frameIn('Events / My events · ' + dev);
    const bell = f.findOne(n => /Icon button · Notifications/.test(n.name));
    report.info['bell' + dev] = bell ? bell.name + ' ' + sz(bell) + ' parent ' + bell.parent.name + ' reactions ' + (bell.reactions ? bell.reactions.length : 0) : 'not found';
    const row = f.findOne(n => n.name === 'Event row · Berlin Autumn Cup' || /^Event row/.test(n.name));
    report.info['firstEventRow' + dev] = row ? row.name + ' ' + sz(row) + ' parent ' + row.parent.name : 'none';
  }
});
return report;
