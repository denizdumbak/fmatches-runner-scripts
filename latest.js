// step 259 · READ-ONLY inspect: sizing behaviour (FILL/FIXED/HUG, max width, padding, text resize) of Message bubble, Chat list item, Composer, Person row, Thread empty state and the Web Messenger page frames, to fit them to 390 (no changes)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const R = n => Math.round(n * 10) / 10;
const kids = n => ('children' in n) ? n.children : [];
const g = (n, k) => { try { const v = n[k]; return v === undefined ? '-' : v; } catch (e) { return '-'; } };
function sz(n) {
  let s = 'H:' + g(n, 'layoutSizingHorizontal') + ' V:' + g(n, 'layoutSizingVertical');
  if (g(n, 'layoutGrow') === 1) s += ' grow';
  const mw = g(n, 'maxWidth'); if (mw !== '-' && mw !== null) s += ' maxW=' + R(mw);
  if (n.type === 'FRAME' || n.type === 'COMPONENT' || n.type === 'INSTANCE') { if (n.layoutMode && n.layoutMode !== 'NONE') s += ' pad=' + g(n, 'paddingLeft') + '/' + g(n, 'paddingRight') + ' ' + n.layoutMode[0] + ' align=' + g(n, 'primaryAxisAlignItems') + '/' + g(n, 'counterAxisAlignItems'); }
  if (n.type === 'TEXT') s += ' t:' + n.textAutoResize + (g(n, 'maxLines') !== '-' && n.maxLines ? ' maxLines=' + n.maxLines : '');
  return s;
}
function tree(n, depth, max, out, indent) {
  if (out.length > 70) return;
  const extra = n.type === 'TEXT' ? ' "' + String(n.characters).slice(0, 18) + '"' : '';
  out.push(indent + n.type[0] + ':' + n.name + ' ' + R(n.width) + 'x' + R(n.height) + ' | ' + sz(n) + extra);
  if (depth < max && n.type !== 'TEXT') for (const c of kids(n)) tree(c, depth + 1, max, out, indent + '  ');
}
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
const sec8 = p01.children.find(n => n.type === 'SECTION' && /^8 · Messenger/.test(n.name));
const variant = (setName, vname) => { const s = sec8.children.find(c => c.name === setName); return s ? (s.type === 'COMPONENT_SET' ? s.children : [s]).find(v => v.name === vname) : null; };

await step('bubbles', async () => {
  for (const vn of ['Side=Theirs, Type=Text, Status=None', 'Side=Mine, Type=Text, Status=Read', 'Side=Mine, Type=Photo, Status=Sent', 'Side=Mine, Type=File, Status=Sent']) {
    const v = variant('Message bubble', vn); if (!v) { report.info['bubble ' + vn] = 'not found'; continue; }
    const out = []; tree(v, 0, 4, out, ''); report.info['bubble ' + vn] = out;
  }
});
await step('chat list item, composer, person row, empty state', async () => {
  for (const [sn, vn] of [['Chat list item', 'State=Default, Unread=True'], ['Composer', 'Kind=Default'], ['Composer', 'Kind=Blocked'], ['Composer', 'Kind=Add to contacts'], ['Person row', 'State=Default'], ['Thread empty state', 'Kind=No chats'], ['Date divider', 'Date divider']]) {
    const v = variant(sn, vn); if (!v) { report.info[sn + ' ' + vn] = 'not found'; continue; }
    const out = []; tree(v, 0, 4, out, ''); report.info[sn + ' ' + vn] = out;
  }
});
const web = p02.children.find(n => n.name === 'Web'), msg = web.children.find(n => n.name === 'Messenger');
const pg = nm => msg.children.find(c => c.name === nm);
await step('Web page frames', async () => {
  const d = pg('Messenger / Default · Desktop');
  const out = []; out.push('page: ' + sz(d));
  for (const nm of ['Chat list panel', 'Panel header', 'Search wrap', 'Search chats', 'Chats', 'Thread', 'Messages']) { const n = d.findOne(x => x.name === nm); out.push(nm + ' ' + (n ? R(n.width) + 'x' + R(n.height) + ' | ' + sz(n) : 'not found')); }
  const first = d.findOne(x => x.type === 'INSTANCE' && /^Chat · /.test(x.name)); if (first) { const o = []; tree(first, 0, 3, o, '  '); out.push('first chat row:'); for (const l of o) out.push(l); }
  report.info.defaultFrames = out;
  const nw = pg('Messenger / New message · Desktop'); const o2 = [];
  for (const nm of ['New message header', 'To row', 'Recipient field', 'Results']) { const n = nw.findOne(x => x.name === nm); o2.push(nm + ' ' + (n ? R(n.width) + 'x' + R(n.height) + ' | ' + sz(n) : 'not found')); }
  report.info.newMessageFrames = o2;
  const un = pg('Messenger / Unverified · Desktop'); const o3 = [];
  for (const c of un.children) o3.push(c.type[0] + ':' + c.name + ' ' + R(c.width) + 'x' + R(c.height) + ' @' + R(c.x) + ',' + R(c.y));
  const pn = un.findOne(x => /Page notice/.test(x.name)); if (pn) { const o = []; tree(pn, 0, 2, o, '  '); o3.push('page notice:'); for (const l of o) o3.push(l); }
  report.info.unverifiedTop = o3;
});
await step('Mobile Own profile Ticker + Navigation to clone for header', async () => {
  const mob = p02.children.find(n => n.name === 'Mobile');
  const own = mob.findOne(n => n.type === 'FRAME' && /Own profile · Mobile$/.test(n.name));
  report.info.mobileOwnTop = own.children.slice(0, 3).map(c => c.name + ' ' + R(c.width) + 'x' + R(c.height) + ' @' + R(c.x) + ',' + R(c.y)).join(' | ');
  const t = own.findOne(n => n.type === 'INSTANCE' && /^Ticker/.test(n.name)); const m = t ? t.getMainComponentAsync && await t.getMainComponentAsync() : null;
  report.info.mobileTickerMain = m ? m.name : 'n/a';
});

return report;
