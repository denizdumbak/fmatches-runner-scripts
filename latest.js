// step 263 · Messenger: top-align the Messages area on desktop pages (and any Messages frame in 01 › 8 · Messenger), then measure gaps
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n * 10) / 10;
const BB = n => n.absoluteBoundingBox;
const p01 = figma.root.children.find(p => /^01/.test(p.name)), p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();

await step('01 components', async () => {
  await figma.setCurrentPageAsync(p01);
  const sec8 = p01.children.find(n => n.type === 'SECTION' && /^8 · Messenger/.test(n.name));
  const rows = [];
  for (const m of sec8.findAll(n => n.name === 'Messages' && 'primaryAxisAlignItems' in n && n.layoutMode === 'VERTICAL')) {
    const before = m.primaryAxisAlignItems; if (before !== 'MIN') { m.primaryAxisAlignItems = 'MIN'; rows.push(m.parent.name + ' > Messages: ' + before + ' -> MIN'); }
  }
  report.info.components = rows.length ? rows : 'none needed';
});

await step('02 desktop pages', async () => {
  await figma.setCurrentPageAsync(p02);
  const web = p02.children.find(n => n.name === 'Web'); const sec = web.children.find(n => n.name === 'Messenger');
  const rows = [];
  for (const f of sec.children.filter(c => c.type === 'FRAME' && /^Messenger \//.test(c.name))) {
    const msgs = f.findOne(n => n.name === 'Messages' && n.layoutMode === 'VERTICAL'); if (!msgs) { rows.push(f.name + ': no Messages'); continue; }
    const before = msgs.primaryAxisAlignItems; msgs.primaryAxisAlignItems = 'MIN';
    const kids = msgs.children.filter(c => c.visible !== false);
    if (!kids.length) { rows.push(f.name + ': ' + before + ' -> MIN (empty)'); continue; }
    const mb = BB(msgs), first = BB(kids[0]), last = BB(kids[kids.length - 1]);
    rows.push(f.name.replace('Messenger / ', '') + ': ' + before + ' -> MIN | above first ' + R(first.y - mb.y) + ' | gap below last ' + R((mb.y + mb.height) - (last.y + last.height)));
  }
  report.info.pages = rows;
});
return report;
