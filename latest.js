// step 262 · Mobile messenger: drop the last message on the 6 thread screens that overflowed the Messages area (gap below last was -43 / -79), then re-measure
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n * 10) / 10;
const BB = n => n.absoluteBoundingBox;
const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p02.loadAsync(); await figma.setCurrentPageAsync(p02);
const mob = p02.children.find(n => n.name === 'Mobile'), mobSec = mob.children.find(n => n.name === 'Messenger');
const screensAll = () => mobSec.children.filter(c => c.type === 'FRAME' && /^Messenger \//.test(c.name));
const targets = ['Thread', 'Message menu', 'Delete message', 'Thread menu', 'Block person', 'Blocked'];

await step('remove last message where it overflows', async () => {
  const rows = [];
  for (const t of targets) {
    const f = mobSec.children.find(c => c.name === 'Messenger / ' + t + ' · Mobile');
    const msgs = f.findOne(n => n.name === 'Messages');
    const last = msgs.children[msgs.children.length - 1];
    if (last && last.type === 'INSTANCE' && /^Message · /.test(last.name)) { rows.push(t + ': removed ' + last.name); last.remove(); }
    else rows.push(t + ': last child is ' + (last ? last.name : 'none') + ', not removed');
  }
  report.info.removed = rows;
});

await step('re-measure', async () => {
  const rows = [];
  for (const f of screensAll()) {
    const msgs = f.findOne(n => n.name === 'Messages'); if (!msgs) continue;
    const kids = msgs.children.filter(c => c.visible !== false); if (!kids.length) continue;
    const mb = BB(msgs), first = BB(kids[0]), last = BB(kids[kids.length - 1]);
    const comp = f.findOne(n => n.name === 'Composer'); const cb = comp ? BB(comp) : null;
    rows.push(f.name.replace('Messenger / ', '') + ' | above first ' + R(first.y - mb.y) + ' | gap below last ' + R((mb.y + mb.height) - (last.y + last.height)) + (cb ? ' | last bottom vs composer top ' + R(cb.y - (last.y + last.height)) : ''));
  }
  report.info.messagesAlign = rows;
  const mm = mobSec.children.find(c => c.name === 'Messenger / Message menu · Mobile');
  const m = mm.findOne(n => n.type === 'INSTANCE' && n.name === 'Message menu'), b = mm.findAll(n => n.type === 'INSTANCE' && n.name === 'Message · Mine · Text')[0];
  report.info.messageMenuVsBubble = 'menu y ' + R(BB(m).y - BB(mm).y) + ', bubble bottom ' + R(BB(b).y + BB(b).height - BB(mm).y);
});
return report;
