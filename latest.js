// step 256 · READ-ONLY inspect: layer names of Chat list panel rows, "+" button, Thread header controls, message bubbles, Composer, and New message person rows on the Messenger pages (no changes)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const R = n => Math.round(n * 10) / 10;
const p02 = pageOf(/^02/); await p02.loadAsync();
const web = p02.children.find(n => n.name === 'Web');
const msg = web.children.find(n => n.name === 'Messenger');
const kids = n => ('children' in n) ? n.children : [];
const hasNav = n => 'reactions' in n && n.reactions && n.reactions.some(r => (r.actions || []).some(a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO'));
function tree(n, depth, max, out, indent, root) {
  if (out.length > 120) return;
  const a = n.absoluteBoundingBox, b = root.absoluteBoundingBox;
  const extra = n.type === 'TEXT' ? ' "' + String(n.characters).slice(0, 24) + '"' : '';
  const vis = n.visible === false ? ' (hidden)' : '';
  out.push(indent + n.type[0] + ':' + n.name + ' ' + R(a.width) + 'x' + R(a.height) + ' @' + R(a.x - b.x) + ',' + R(a.y - b.y) + extra + vis + (hasNav(n) ? ' [nav]' : ''));
  if (depth < max && n.type !== 'TEXT') for (const c of kids(n)) tree(c, depth + 1, max, out, indent + '  ', root);
}
const pg = name => msg.children.find(c => c.name === name);
const def = pg('Messenger / Default · Desktop');

await step('Default: top-level and panels', async () => {
  const out = []; for (const c of def.children) { const a = c.absoluteBoundingBox, b = def.absoluteBoundingBox; out.push(c.type[0] + ':' + c.name + ' ' + R(a.width) + 'x' + R(a.height) + ' @' + R(a.x - b.x) + ',' + R(a.y - b.y)); }
  report.info.defaultTop = out;
});
await step('Default: Chat list panel', async () => {
  const p = def.findOne(n => /Chat list panel/.test(n.name)); const out = []; tree(p, 0, 3, out, '', def); report.info.chatListPanel = out;
});
await step('Default: Thread header', async () => {
  const p = def.findOne(n => n.name === 'Thread header'); const out = []; tree(p, 0, 3, out, '', def); report.info.threadHeader = out;
});
await step('Default: Messages (first rows and bubbles)', async () => {
  const m = def.findOne(n => n.name === 'Messages'); const out = [];
  if (m) for (const c of m.children.slice(0, 8)) tree(c, 0, 1, out, '', def);
  report.info.messages = out; report.info.messagesCount = m ? m.children.length : 'none';
});
await step('Default: Composer', async () => {
  const p = def.findOne(n => n.name === 'Composer'); const out = []; tree(p, 0, 3, out, '', def); report.info.composer = out;
});
await step('New message page: panel and person rows', async () => {
  const p = pg('Messenger / New message · Desktop'); const out = []; tree(p, 0, 3, out, '', p);
  report.info.newMessageTree = out.filter(l => !/Ticker|Navigation|Footer/.test(l)).slice(0, 60);
});
await step('No chat selected: list rows', async () => {
  const p = pg('Messenger / No chat selected · Desktop'); const panel = p.findOne(n => /Chat list panel/.test(n.name)); const out = []; tree(panel, 0, 2, out, '', p); report.info.noChatSelectedPanel = out;
});
await step('Message menu page: anchor bubble', async () => {
  const p = pg('Messenger / Message menu · Desktop'); const m = p.findOne(n => n.name === 'Messages'); const out = [];
  if (m) for (const c of m.children) { const a = c.absoluteBoundingBox, b = p.absoluteBoundingBox; out.push(c.type[0] + ':' + c.name + ' ' + R(a.width) + 'x' + R(a.height) + ' @' + R(a.x - b.x) + ',' + R(a.y - b.y)); }
  report.info.messageMenuMessages = out.slice(0, 14);
});

return report;
