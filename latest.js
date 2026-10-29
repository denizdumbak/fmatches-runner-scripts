// step 264 · Prototype links for the mobile Messenger (11 screens): header Messages icon and Manager Message -> Chat list/Thread, list -> thread, back, +, thread menu, message menu, delete, block, unblock; new flow start "Mobile · Messenger"; no arrows
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p02 = pageOf(/^02/); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const web = p02.children.find(n => n.name === 'Web'), mob = p02.children.find(n => n.name === 'Mobile');
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
const nav = (dest, fade) => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: fade ? { type: 'DISSOLVE', easing: { type: 'EASE_OUT' }, duration: 0.2 } : { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
const frameIn = (root, name) => root.findOne(n => n.type === 'FRAME' && n.name === name);
const log = [];
const any = (...names) => n => names.indexOf(n.name) >= 0;
const short = s => s.replace(/^Profiles \/ /, '').replace(/^Messenger \//, 'M /');

async function link(from, selector, to, fade, label) {
  if (!from) { report.errors.push('source screen missing for ' + label); return; }
  if (!to) { report.errors.push('target screen missing for ' + label); return; }
  const el = from.findOne(selector);
  if (!el) { report.errors.push('click target not found: ' + label + ' on ' + from.name); return; }
  const keep = (el.reactions || []).filter(r => !(r.actions || []).some(isNavAct));
  await el.setReactionsAsync(keep.concat([nav(to, fade)]));
  log.push(label + '  [' + short(from.name) + ' -> ' + short(to.name) + ']');
}

const S = {};
for (const [k, nm] of [
  ['list', 'Messenger / Chat list · Mobile'], ['noChats', 'Messenger / No chats · Mobile'], ['thread', 'Messenger / Thread · Mobile'], ['newMsg', 'Messenger / New message · Mobile'],
  ['msgMenu', 'Messenger / Message menu · Mobile'], ['del', 'Messenger / Delete message · Mobile'], ['thrMenu', 'Messenger / Thread menu · Mobile'],
  ['block', 'Messenger / Block person · Mobile'], ['blocked', 'Messenger / Blocked · Mobile'],
  ['leo', 'Profiles / Player · Mobile'], ['mgr', 'Profiles / Manager · Mobile'], ['own', 'Profiles / Player / Own profile · Mobile']
]) S[k] = frameIn(p02, nm);
report.info.screensFound = Object.entries(S).filter(([k, v]) => !v).map(([k]) => k).join(',') || 'all 12 found';

await step('entry: header Messages icon and Manager Message', async () => {
  for (const [pg, nm] of [[S.leo, 'Leo profile'], [S.own, 'Own profile'], [S.mgr, 'Manager profile']]) await link(pg, any('Icon button · Messages'), S.list, false, 'header Messages icon on ' + nm + ' (mobile)');
  await link(S.mgr, any('Button · Message'), S.thread, false, 'Manager profile Message -> thread (mobile)');
});
await step('Chat list and empty state', async () => {
  await link(S.list, any('New message'), S.newMsg, false, '+ New message');
  await link(S.list, n => /^Chat · /.test(n.name) && /Tom Reilly/.test(n.name), S.thread, false, 'open Tom Reilly chat');
  await link(S.noChats, any('Button · New message'), S.newMsg, false, 'No chats: New message button');
});
await step('Thread', async () => {
  await link(S.thread, any('Back', 'Icon button · Back'), S.list, false, 'thread Back -> list');
  await link(S.thread, any('More', 'Icon button · More'), S.thrMenu, true, 'thread ⋯ opens Thread menu');
  const msgs = S.thread && S.thread.findOne(n => n.name === 'Messages');
  const bubble = msgs && msgs.children.find(c => c.name === 'Message · Mine · Text');
  if (!bubble) report.errors.push('own message bubble not found on Thread · Mobile');
  else { const keep = (bubble.reactions || []).filter(r => !(r.actions || []).some(isNavAct)); await bubble.setReactionsAsync(keep.concat([nav(S.msgMenu, true)])); log.push('own message opens Message menu  [M / Thread · Mobile -> M / Message menu · Mobile]'); }
});
await step('New message', async () => {
  await link(S.newMsg, n => /^Person · Tom Reilly/.test(n.name), S.thread, false, 'New message: pick Tom Reilly');
  await link(S.newMsg, any('Button · Cancel', 'Back', 'Icon button · Back'), S.list, false, 'New message: Cancel/Back');
});
await step('menus and dialogs', async () => {
  await link(S.msgMenu, any('Row · Delete message'), S.del, true, 'Message menu: Delete');
  await link(S.del, any('Button · Cancel'), S.thread, true, 'Delete dialog: Cancel');
  await link(S.del, any('Button · Delete'), S.thread, false, 'Delete dialog: Delete');
  await link(S.thrMenu, any('Row · Block'), S.block, true, 'Thread menu: Block');
  await link(S.thrMenu, any('Row · View profile'), S.mgr, false, 'Thread menu: View profile -> Manager profile');
  await link(S.block, any('Button · Cancel'), S.thread, true, 'Block dialog: Cancel');
  await link(S.block, any('Button · Block'), S.blocked, false, 'Block dialog: Block');
  await link(S.blocked, any('Button · Unblock'), S.thread, false, 'Blocked: Unblock');
});

await step('flow start', async () => {
  if (!S.list) throw new Error('Chat list · Mobile missing');
  const now = p02.flowStartingPoints;
  report.info.flowStartsBefore = now.length + ': ' + now.map(f => f.name).join(' | ');
  const keep = now.filter(f => f.name !== 'Mobile · Messenger' && f.nodeId !== S.list.id);
  keep.push({ nodeId: S.list.id, name: 'Mobile · Messenger' });
  const seen = new Set(), dedup = [];
  for (const f of keep) { if (seen.has(f.nodeId)) continue; seen.add(f.nodeId); dedup.push(f); }
  p02.flowStartingPoints = dedup;
  report.info.flowStartsAfter = p02.flowStartingPoints.length + ': ' + p02.flowStartingPoints.map(f => f.name).join(' | ');
});

await step('verify: all page links resolve', async () => {
  let links = 0, broken = 0; const bad = [];
  for (const root of [web, mob]) for (const n of root.findAll(x => 'reactions' in x && x.reactions && x.reactions.length)) for (const r of n.reactions) for (const a of (r.actions || [])) if (isNavAct(a)) { links++; const d = a.destinationId ? await figma.getNodeByIdAsync(a.destinationId) : null; if (!d) { broken++; bad.push(n.name); } }
  report.info.linksAll = links + ' links, ' + broken + ' broken' + (bad.length ? ' (' + bad.slice(0, 5).join(', ') + ')' : '');
});

report.info.linksThisStep = log.length;
report.info.links = log;
return report;
