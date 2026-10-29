// step 260 · Mobile messenger: 11 screens (390x844) in 02 › Mobile › Messenger, built from the desktop Messenger frames (chat list, no chats, thread, new message, message menu, delete, thread menu, block person, blocked, add to contacts, unverified); links and flow start come next
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const R = n => Math.round(n * 10) / 10;
const BB = n => n.absoluteBoundingBox;
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => allVars.find(x => x.name === name);
const web = p02.children.find(n => n.name === 'Web'), mob = p02.children.find(n => n.name === 'Mobile');
const webMsg = web.children.find(n => n.name === 'Messenger'), mobSec = mob.children.find(n => n.name === 'Messenger');
if (!webMsg || !mobSec) throw new Error('Messenger sections missing');
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
const sec8 = p01.children.find(n => n.type === 'SECTION' && /^8 · Messenger/.test(n.name));
const comp = nm => sec8.children.find(c => c.name === nm);
const varIn = (setName, vname) => { const s = comp(setName); return s ? (s.type === 'COMPONENT_SET' ? s.children : [s]).find(v => v.name === vname) : null; };
const W = nm => webMsg.children.find(c => c.name === 'Messenger / ' + nm + ' · Desktop');
const own = mob.findOne(n => n.type === 'FRAME' && /Own profile · Mobile$/.test(n.name));
const ownTicker = own.findOne(n => n.type === 'INSTANCE' && /^Ticker/.test(n.name));
const ownNav = own.findOne(n => n.type === 'INSTANCE' && /^Navigation/.test(n.name));
const screens = {};
const order = ['list', 'noChats', 'thread', 'newMessage', 'messageMenu', 'deleteMessage', 'threadMenu', 'blockPerson', 'blocked', 'addToContacts', 'unverified'];
const NAME = { list: 'Chat list', noChats: 'No chats', thread: 'Thread', newMessage: 'New message', messageMenu: 'Message menu', deleteMessage: 'Delete message', threadMenu: 'Thread menu', blockPerson: 'Block person', blocked: 'Blocked', addToContacts: 'Add to contacts', unverified: 'Unverified' };
const slot = k => 80 + order.indexOf(k) * 470;

async function clearNav(root) {
  let n = 0;
  for (const x of [root].concat(root.findAll(() => true))) {
    if (!('reactions' in x) || !x.reactions || !x.reactions.length) continue;
    const keep = x.reactions.filter(r => !(r.actions || []).some(isNavAct));
    if (keep.length !== x.reactions.length) { try { await x.setReactionsAsync(keep); n++; } catch (e) { } }
  }
  return n;
}
function fillWidth(n) { try { n.layoutSizingHorizontal = 'FILL'; return true; } catch (e) { return false; } }
function rel(page, node) { const a = BB(page), b = BB(node); return { x: b.x - a.x, y: b.y - a.y, w: b.width, h: b.height }; }
function overflow(f) { const fb = BB(f), bad = []; for (const n of f.findAll(x => x.visible !== false && x.absoluteBoundingBox)) { const b = BB(n); if (b.x < fb.x - 1 || b.x + b.width > fb.x + fb.width + 1) bad.push(n.name + ' ' + R(b.x - fb.x) + '+' + R(b.width)); } return bad.slice(0, 8); }

await step('clean previous run', async () => {
  let removed = 0; for (const c of mobSec.children.slice()) if (/^Messenger \//.test(c.name)) { c.remove(); removed++; }
  report.info.cleaned = removed;
});

function newScreen(key) {
  const f = figma.createFrame(); f.name = 'Messenger / ' + NAME[key] + ' · Mobile';
  f.layoutMode = 'NONE'; f.resize(390, 844); f.clipsContent = true; f.fills = own.fills;
  mobSec.appendChild(f); f.x = slot(key); f.y = 80;
  const t = ownTicker.clone(); f.appendChild(t); t.x = 0; t.y = 0;
  const n = ownNav.clone(); f.appendChild(n); n.x = 0; n.y = 36;
  screens[key] = f; return f;
}
async function adaptThread(th) {
  const hdr = th.findOne(n => n.type === 'INSTANCE' && n.name === 'Thread header');
  const mh = varIn('Thread header', 'Device=Mobile');
  if (hdr && mh) { hdr.swapComponent(mh); fillWidth(hdr); }
  const msgs = th.findOne(n => n.name === 'Messages');
  if (msgs) {
    const sp = V('spacing/md');
    for (const k of ['paddingLeft', 'paddingRight']) { if (sp) { try { msgs.setBoundVariable(k, sp); } catch (e) { msgs[k] = 16; } } else msgs[k] = 16; }
    for (const c of msgs.children) if (c.type === 'INSTANCE') { fillWidth(c); const b = c.findOne(n => n.name === 'Bubble'); if (b && !c.findOne(n => n.name === 'Photo')) { try { b.maxWidth = 280; } catch (e) { } } }
  }
  const comp1 = th.findOne(n => n.type === 'INSTANCE' && n.name === 'Composer'); if (comp1) fillWidth(comp1);
}
async function threadScreen(key, webPageName, extraTop) {
  const f = newScreen(key);
  const src = W(webPageName).findOne(n => n.name === 'Thread'); if (!src) throw new Error('Thread frame missing on ' + webPageName);
  const th = src.clone(); f.appendChild(th); th.x = 0; th.y = 101 + (extraTop || 0); th.resize(390, 743 - (extraTop || 0));
  await clearNav(th); await adaptThread(th); th.name = 'Thread';
  return f;
}
function addMenu(f, inst, x, y) { f.appendChild(inst); inst.layoutPositioning = 'ABSOLUTE'; inst.x = Math.round(x); inst.y = Math.round(y); }
let scrimSource = null;
{ const b = W('Block person'); scrimSource = b ? b.findOne(n => /scrim/i.test(n.name)) : null; }
function addScrim(f) {
  let s;
  if (scrimSource) s = scrimSource.clone(); else { s = figma.createRectangle(); const v = V('color/bg/inverse'); if (v) s.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v)]; s.opacity = 0.5; }
  f.appendChild(s); s.name = 'Scrim'; s.x = 0; s.y = 0; s.resize(390, 844); return s;
}
function cloneScreen(srcKey, key) {
  const f = screens[srcKey].clone(); f.name = 'Messenger / ' + NAME[key] + ' · Mobile'; mobSec.appendChild(f); f.x = slot(key); f.y = 80; screens[key] = f; return f;
}

await step('chat list', async () => {
  const f = newScreen('list');
  const src = W('Default').findOne(n => n.name === 'Chat list panel');
  const p = src.clone(); f.appendChild(p); p.x = 0; p.y = 101; p.resize(390, 743); await clearNav(p);
  let reset = 0;
  for (const c of p.findAll(n => n.type === 'INSTANCE' && /^Chat · /.test(n.name))) { const k = Object.keys(c.componentProperties).find(x => /^State/.test(x)); if (k && c.componentProperties[k].value !== 'Default') { c.setProperties({ [k]: 'Default' }); reset++; } }
  report.info.listRowsReset = reset;
});
await step('no chats', async () => {
  const f = newScreen('noChats');
  const src = W('Default').findOne(n => n.name === 'Chat list panel');
  const p = src.clone(); f.appendChild(p); p.x = 0; p.y = 101; p.resize(390, 743); await clearNav(p);
  const chats = p.findOne(n => n.name === 'Chats');
  for (const c of chats.children.slice()) c.remove();
  const ev = varIn('Thread empty state', 'Kind=No chats'); if (!ev) throw new Error('empty state variant missing');
  const es = ev.createInstance(); chats.appendChild(es); fillWidth(es);
  chats.primaryAxisAlignItems = 'CENTER'; chats.counterAxisAlignItems = 'CENTER';
});
await step('thread', async () => { await threadScreen('thread', 'Default'); });
await step('new message', async () => {
  const f = await threadScreen('newMessage', 'New message');
  const th = f.findOne(n => n.name === 'Thread');
  for (const c of th.children) fillWidth(c);
  const res = th.findOne(n => n.name === 'Results'); if (res) for (const c of res.children) fillWidth(c);
});
await step('message menu', async () => {
  const f = cloneScreen('thread', 'messageMenu');
  const b = f.findAll(n => n.type === 'INSTANCE' && n.name === 'Message · Mine · Text')[0]; if (!b) throw new Error('own bubble not found');
  const mv = varIn('Message menu', 'Side=Mine'); const m = mv.createInstance(); m.name = 'Message menu';
  const r = rel(f, b); let y = r.y + r.h + 8; if (y + m.height > 763 - 8) y = r.y - 8 - m.height;
  addMenu(f, m, 390 - 16 - m.width, y);
  report.info.messageMenu = 'bubble ' + R(r.x) + ',' + R(r.y) + ' ' + R(r.w) + 'x' + R(r.h) + ' -> menu ' + R(m.x) + ',' + R(m.y);
});
await step('delete message', async () => {
  const f = cloneScreen('thread', 'deleteMessage'); addScrim(f);
  const v = varIn('Confirm dialog', 'Kind=Delete message, Device=Mobile'); const d = v.createInstance(); d.name = 'Confirm dialog · Delete message';
  addMenu(f, d, (390 - d.width) / 2, (844 - d.height) / 2);
});
await step('thread menu', async () => {
  const f = cloneScreen('thread', 'threadMenu');
  const mo = f.findOne(n => n.name === 'More'); if (!mo) throw new Error('thread More not found');
  const tm = comp('Thread menu'); const m = tm.createInstance(); m.name = 'Thread menu';
  const r = rel(f, mo); addMenu(f, m, 390 - 16 - m.width, r.y + r.h + 8);
});
await step('block person', async () => {
  const f = cloneScreen('thread', 'blockPerson'); addScrim(f);
  const v = varIn('Confirm dialog', 'Kind=Block person, Device=Mobile'); const d = v.createInstance(); d.name = 'Confirm dialog · Block person';
  addMenu(f, d, (390 - d.width) / 2, (844 - d.height) / 2);
});
await step('blocked', async () => { await threadScreen('blocked', 'Blocked'); });
await step('add to contacts', async () => { await threadScreen('addToContacts', 'Add to contacts'); });
await step('unverified', async () => {
  const f = await threadScreen('unverified', 'Unverified', 44);
  const src = W('Unverified').findOne(n => n.type === 'INSTANCE' && /Page notice/.test(n.name)); if (!src) throw new Error('Page notice missing');
  const pn = src.clone(); f.appendChild(pn); pn.x = 0; pn.y = 101; pn.resize(390, pn.height);
  for (const k of ['paddingLeft', 'paddingRight']) { try { pn[k] = 16; } catch (e) { } }
  const t = pn.findOne(n => n.type === 'TEXT' && n.name === 'Text'), l = pn.findOne(n => n.type === 'TEXT' && n.name === 'Link');
  if (t) { await figma.loadFontAsync(t.fontName); t.characters = 'Verify your email to send messages.'; }
  if (l) { await figma.loadFontAsync(l.fontName); l.characters = 'Resend'; }
  report.info.pageNotice = 'pad ' + pn.paddingLeft + '/' + pn.paddingRight + ' | children: ' + pn.children.map(c => c.name + ' ' + R(c.width)).join(', ');
});

await step('section size and platform', async () => {
  mobSec.resizeWithoutConstraints(Math.max(mobSec.width, 80 + 10 * 470 + 390 + 80), Math.max(mobSec.height, 80 + 844 + 80));
  const nw = Math.max(mob.width, mobSec.x + mobSec.width + 120), nh = Math.max(mob.height, mobSec.y + mobSec.height + 120);
  report.info.platform = R(mob.width) + 'x' + R(mob.height) + ' -> ' + R(nw) + 'x' + R(nh);
  mob.resizeWithoutConstraints(nw, nh);
});

await step('verify', async () => {
  const rows = [];
  for (const k of order) { const f = screens[k]; if (!f) { rows.push(k + ': missing'); continue; } rows.push(f.name + ' @' + R(f.x) + ',' + R(f.y) + ' ' + R(f.width) + 'x' + R(f.height) + ' | overflow: ' + (overflow(f).join('; ') || 'none')); }
  report.info.screens = rows;
  const bubbles = [];
  const th = screens.thread && screens.thread.findOne(n => n.name === 'Messages');
  if (th) for (const c of th.children) if (c.type === 'INSTANCE') { const b = c.findOne(n => n.name === 'Bubble'); bubbles.push(c.name + ' row ' + R(c.width) + (b ? ' | bubble ' + R(b.width) + ' maxW=' + b.maxWidth : '')); }
  report.info.threadBubbles = bubbles;
  const comp0 = screens.blocked && screens.blocked.findOne(n => n.type === 'INSTANCE' && n.name === 'Composer');
  const comp1 = screens.addToContacts && screens.addToContacts.findOne(n => n.type === 'INSTANCE' && n.name === 'Composer');
  report.info.composerHeights = 'blocked ' + (comp0 ? R(comp0.height) : '-') + ', addToContacts ' + (comp1 ? R(comp1.height) : '-');
  const inside = [];
  for (const s of mob.children.filter(n => n.type === 'SECTION')) for (const c of s.children) { if (c.x < -1 || c.y < -1 || c.x + c.width > s.width + 1 || c.y + c.height > s.height + 1) inside.push(s.name + ' > ' + c.name); }
  report.info.outsideParent = inside.length ? inside.slice(0, 8) : 'none';
  const ov = []; const ss = mob.children.filter(n => n.type === 'SECTION'); for (let i = 0; i < ss.length; i++) for (let j = i + 1; j < ss.length; j++) { const a = ss[i], b = ss[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov.push(a.name + ' x ' + b.name); }
  report.info.sectionOverlaps = ov.length ? ov : 'none';
  let gray = 0; for (const k of order) { const f = screens[k]; if (!f) continue; for (const n of f.findAll(x => 'fills' in x)) if (Array.isArray(n.fills)) for (const fl of n.fills) if (fl.type === 'SOLID' && Math.abs(fl.color.r - 0.5) < 0.01 && Math.abs(fl.color.g - 0.5) < 0.01 && Math.abs(fl.color.b - 0.5) < 0.01 && !(fl.boundVariables && fl.boundVariables.color)) gray++; }
  report.info.grayFills = gray;
  report.info.scrim = scrimSource ? 'cloned from Web Block person page' : 'fallback rectangle';
});

return report;
