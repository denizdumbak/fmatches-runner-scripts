// step 257 · Prototype links: profile ⋯ menu + Block (Web + Mobile), Manager Message -> Messenger, header Messages icon (Leo, Own profile, Manager), full Messenger flow (+, ⋯, attach, bubble menu, delete, block, unblock, person rows); new flow start "Web · Messenger"; no arrows
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

async function link(from, selector, to, fade, label) {
  if (!from) { report.errors.push('source page missing for ' + label); return; }
  if (!to) { report.errors.push('target page missing for ' + label); return; }
  const el = from.findOne(selector);
  if (!el) { report.errors.push('click target not found: ' + label + ' on ' + from.name); return; }
  const keep = (el.reactions || []).filter(r => !(r.actions || []).some(isNavAct));
  await el.setReactionsAsync(keep.concat([nav(to, fade)]));
  log.push(label + '  [' + from.name.replace(/^Profiles \/ /, '').replace(/^Messenger \/ /, 'M / ') + ' -> ' + to.name.replace(/^Profiles \/ /, '').replace(/^Messenger \/ /, 'M / ') + ']');
}
const byName = nm => n => n.name === nm;

const P = {};
for (const [k, nm] of [
  ['leoD', 'Profiles / Player · Desktop'], ['menuD', 'Profiles / Player / Profile menu · Desktop'], ['blockD', 'Profiles / Player / Block person · Desktop'],
  ['leoM', 'Profiles / Player · Mobile'], ['menuM', 'Profiles / Player / Profile menu · Mobile'], ['blockM', 'Profiles / Player / Block person · Mobile'],
  ['mgrD', 'Profiles / Manager · Desktop'], ['ownD', 'Profiles / Player / Own profile · Desktop'],
  ['mDef', 'Messenger / Default · Desktop'], ['mNoChats', 'Messenger / No chats · Desktop'], ['mNoSel', 'Messenger / No chat selected · Desktop'], ['mNew', 'Messenger / New message · Desktop'],
  ['mAtt', 'Messenger / Attachments · Desktop'], ['mMsgMenu', 'Messenger / Message menu · Desktop'], ['mDel', 'Messenger / Delete message · Desktop'],
  ['mThrMenu', 'Messenger / Thread menu · Desktop'], ['mBlock', 'Messenger / Block person · Desktop'], ['mBlocked', 'Messenger / Blocked · Desktop']
]) P[k] = frameIn(p02, nm);
report.info.pagesFound = Object.entries(P).filter(([k, v]) => !v).map(([k]) => k).join(',') || 'all 18 found';

await step('profile ⋯ menu, Web', async () => {
  await link(P.leoD, byName('Icon button · More'), P.menuD, true, '⋯ opens menu');
  await link(P.menuD, byName('Row · Block'), P.blockD, true, 'Block row opens dialog');
  await link(P.menuD, byName('Icon button · More'), P.leoD, true, '⋯ closes menu');
  await link(P.blockD, byName('Button · Cancel'), P.leoD, true, 'Cancel closes dialog');
});
await step('profile ⋯ menu, Mobile', async () => {
  await link(P.leoM, byName('Icon button · More'), P.menuM, true, '⋯ opens menu (mobile)');
  await link(P.menuM, byName('Row · Block'), P.blockM, true, 'Block row opens dialog (mobile)');
  await link(P.menuM, byName('Icon button · More'), P.leoM, true, '⋯ closes menu (mobile)');
  await link(P.blockM, byName('Button · Cancel'), P.leoM, true, 'Cancel closes dialog (mobile)');
});
await step('Manager Message and header Messages icon', async () => {
  await link(P.mgrD, byName('Button · Message'), P.mDef, false, 'Manager profile Message -> Messenger');
  for (const [pg, nm] of [[P.leoD, 'Leo profile'], [P.ownD, 'Own profile'], [P.mgrD, 'Manager profile']]) await link(pg, byName('Icon button · Messages'), P.mDef, false, 'header Messages icon on ' + nm);
});
await step('Messenger: Default', async () => {
  await link(P.mDef, byName('New message'), P.mNew, false, '+ New message');
  await link(P.mDef, byName('More'), P.mThrMenu, true, 'thread ⋯ opens Thread menu');
  await link(P.mDef, byName('Attach'), P.mAtt, false, 'Attach');
  const bubble = P.mDef.findOne(n => n.name === 'Messages') && P.mDef.findOne(n => n.name === 'Messages').children.find(c => c.name === 'Message · Mine · Text');
  if (!bubble) report.errors.push('own message bubble not found'); else { const keep = (bubble.reactions || []).filter(r => !(r.actions || []).some(isNavAct)); await bubble.setReactionsAsync(keep.concat([nav(P.mMsgMenu, true)])); log.push('own message opens Message menu  [M / Default -> M / Message menu]'); }
});
await step('Messenger: empty states, new message', async () => {
  await link(P.mNoChats, byName('Button · New message'), P.mNew, false, 'No chats: New message button');
  await link(P.mNoSel, byName('Button · New message'), P.mNew, false, 'No chat selected: New message button');
  await link(P.mNoSel, byName('New message'), P.mNew, false, 'No chat selected: +');
  await link(P.mNoSel, byName('Chat · Tom Reilly'), P.mDef, false, 'No chat selected: open Tom Reilly chat');
  await link(P.mNew, byName('Person · Tom Reilly'), P.mDef, false, 'New message: pick Tom Reilly');
  await link(P.mNew, byName('Button · Cancel'), P.mDef, false, 'New message: Cancel');
});
await step('Messenger: menus and dialogs', async () => {
  await link(P.mMsgMenu, byName('Row · Delete message'), P.mDel, true, 'Message menu: Delete');
  await link(P.mDel, byName('Button · Cancel'), P.mDef, true, 'Delete dialog: Cancel');
  await link(P.mDel, byName('Button · Delete'), P.mDef, false, 'Delete dialog: Delete');
  await link(P.mThrMenu, byName('Row · Block'), P.mBlock, true, 'Thread menu: Block');
  await link(P.mThrMenu, byName('Row · View profile'), P.mgrD, false, 'Thread menu: View profile -> Manager profile');
  await link(P.mBlock, byName('Button · Cancel'), P.mDef, true, 'Block dialog: Cancel');
  await link(P.mBlock, byName('Button · Block'), P.mBlocked, false, 'Block dialog: Block');
  await link(P.mBlocked, byName('Button · Unblock'), P.mDef, false, 'Blocked: Unblock');
});

await step('flow starts', async () => {
  const known = new Set(['Web · Home', 'Web · Player profile', 'Web · Not joined yet', 'Mobile · Home', 'Mobile · Player profile', 'Mobile · Not joined yet', 'Web · Own profile', 'Mobile · Own profile', 'Web · Sign up', 'Mobile · Sign up', 'Web · Log in', 'Mobile · Log in', 'Mobile · Interactive map', 'Web · Interactive map', 'Web · Scouts near you', 'Mobile · Scouts near you']);
  const now = p02.flowStartingPoints;
  report.info.flowStartsBefore = now.length + ' (' + now.filter(f => !known.has(f.name)).map(f => f.name + '->' + f.nodeId).join(', ') + ')';
  const keep = now.filter(f => known.has(f.name));
  if (!P.mDef) throw new Error('Messenger Default missing');
  keep.push({ nodeId: P.mDef.id, name: 'Web · Messenger' });
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
