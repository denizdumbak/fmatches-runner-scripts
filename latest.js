// step 258 · READ-ONLY inspect for mobile messenger: Messenger component sets (Device variants, properties), Mobile Messenger sub-sections, a mobile Map screen frame as the screen pattern, Mobile menu screen (no changes)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const R = n => Math.round(n * 10) / 10;
const dims = n => R(n.width) + 'x' + R(n.height);
const kids = n => ('children' in n) ? n.children : [];
function tree(n, depth, max, out, indent) {
  if (out.length > 90) return;
  const extra = n.type === 'TEXT' ? ' "' + String(n.characters).slice(0, 26) + '"' : '';
  const vis = n.visible === false ? ' (hidden)' : '';
  const lay = ('layoutMode' in n && n.layoutMode !== 'NONE') ? ' ' + n.layoutMode[0] + ' gap' + (n.itemSpacing || 0) : '';
  const abs = n.layoutPositioning === 'ABSOLUTE' ? ' ABS' : '';
  out.push(indent + n.type[0] + ':' + n.name + ' ' + dims(n) + ' @' + R(n.x) + ',' + R(n.y) + lay + abs + extra + vis);
  if (depth < max && n.type !== 'TEXT') for (const c of kids(n)) tree(c, depth + 1, max, out, indent + '  ');
}
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();

await step('Messenger component sets', async () => {
  const sec = p01.children.find(n => n.type === 'SECTION' && /^8 · Messenger/.test(n.name));
  if (!sec) throw new Error('Section 8 · Messenger missing');
  const out = [];
  for (const c of sec.children) {
    if (c.type === 'COMPONENT_SET') out.push('SET ' + c.name + ' ' + dims(c) + ' | ' + c.children.map(v => v.name + ' ' + dims(v)).join(' ; ') + ' | props: ' + Object.keys(c.componentPropertyDefinitions).map(k => k.replace(/#.*/, '') + ':' + c.componentPropertyDefinitions[k].type).join(', '));
    else if (c.type === 'COMPONENT') out.push('COMP ' + c.name + ' ' + dims(c));
    else out.push(c.type + ' ' + c.name);
  }
  report.info.messengerComponents = out;
});

await step('mobile variants: tree of Thread header, Composer, Chat list item (Mobile or first)', async () => {
  const sec = p01.children.find(n => n.type === 'SECTION' && /^8 · Messenger/.test(n.name));
  for (const nm of ['Thread header', 'Composer', 'Chat list item', 'Message bubble', 'Person row', 'Thread empty state', 'Date divider']) {
    const s = sec.children.find(c => c.name === nm); if (!s) { report.info['tree ' + nm] = 'not found'; continue; }
    const vs = s.type === 'COMPONENT_SET' ? s.children : [s];
    const pick = vs.find(v => /Mobile/.test(v.name)) || vs[0];
    const out = []; tree(pick, 0, 2, out, ''); report.info['tree ' + nm + ' (' + pick.name + ')'] = out;
  }
});

await step('Mobile Messenger sub-sections', async () => {
  const mob = p02.children.find(n => n.name === 'Mobile');
  const subs = mob.children.filter(n => /Messenger/.test(n.name));
  report.info.mobileMessengerSections = subs.map(s => s.type + ':' + s.name + ' ' + dims(s) + ' @' + R(s.x) + ',' + R(s.y) + ' children=' + s.children.length);
  report.info.mobileSections = mob.children.map(s => s.name + ' @' + R(s.x) + ',' + R(s.y) + ' ' + dims(s)).join(' | ');
});

await step('mobile Map screen pattern + sheet', async () => {
  const mob = p02.children.find(n => n.name === 'Mobile');
  const map = mob.children.find(n => n.name === 'Map');
  const scr = map.children.find(n => n.type === 'FRAME');
  report.info.mapScreens = map.children.filter(n => n.type === 'FRAME').map(n => n.name + ' @' + R(n.x) + ',' + R(n.y));
  const out = []; tree(scr, 0, 1, out, ''); report.info.mapScreenTree = out;
});

await step('Mobile menu screen and header (logged in) on a mobile page', async () => {
  const mob = p02.children.find(n => n.name === 'Mobile');
  const own = mob.findOne(n => n.type === 'FRAME' && /Own profile · Mobile$/.test(n.name));
  if (own) { const nav = own.findOne(n => n.type === 'INSTANCE' && /^Navigation/.test(n.name)); const out = []; tree(nav, 0, 3, out, ''); report.info.mobileLoggedInHeader = out; }
  const menu = mob.findOne(n => n.type === 'FRAME' && /Menu/.test(n.name) && /Mobile/.test(n.name));
  report.info.mobileMenuScreen = menu ? menu.name + ' ' + dims(menu) : 'not found';
});

await step('Web Messenger pages: where the mobile ones should mirror', async () => {
  const web = p02.children.find(n => n.name === 'Web');
  const m = web.children.find(n => n.name === 'Messenger');
  const blocked = m.children.find(n => /Blocked/.test(n.name)); const add = m.children.find(n => /Add to contacts/.test(n.name)); const unv = m.children.find(n => /Unverified/.test(n.name));
  const out = [];
  for (const pg of [blocked, add, unv]) { const th = pg.findOne(n => n.name === 'Thread'); const o = []; if (th) tree(th, 0, 1, o, '  '); out.push(pg.name); for (const l of o) out.push(l); }
  report.info.webStatePages = out;
});

return report;
