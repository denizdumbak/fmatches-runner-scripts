// step 248 · READ-ONLY inspect: Header component set, Icon button set, Navigation instances on Home / Own profile / Map / Messenger (Web + Mobile), Account menu, Sticky action bar, Profile actions (no changes)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const R = n => Math.round(n * 10) / 10;
const dims = n => R(n.width) + 'x' + R(n.height);
const kids = n => ('children' in n) ? n.children : [];
function tree(n, depth, max, out, indent) {
  if (out.length > 400) return;
  const extra = n.type === 'TEXT' ? ' "' + String(n.characters).slice(0, 30) + '"' : '';
  const vis = n.visible === false ? ' (hidden)' : '';
  const lay = ('layoutMode' in n && n.layoutMode !== 'NONE') ? ' ' + n.layoutMode[0] + ' gap' + (n.itemSpacing || 0) : '';
  out.push(indent + n.type[0] + ':' + n.name + ' ' + dims(n) + ' @' + R(n.x) + ',' + R(n.y) + lay + extra + vis);
  if (depth < max && n.type !== 'TEXT') for (const c of kids(n)) tree(c, depth + 1, max, out, indent + '  ');
}
function findAllComp(page, re) {
  return page.findAll(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name) && !(n.parent && n.parent.type === 'COMPONENT_SET'));
}
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();

await step('header set', async () => {
  const sets = findAllComp(p01, /^Header$/i);
  report.info.headerSets = sets.map(s => s.type + ':' + s.name + ' ' + dims(s) + ' parent=' + (s.parent ? s.parent.name : '-'));
  for (const s of sets) {
    const vs = s.type === 'COMPONENT_SET' ? s.children : [s];
    report.info.headerVariants = vs.map(v => v.name + ' ' + dims(v));
    const out = []; tree(vs[0], 0, 4, out, ''); report.info.headerTreeFirst = out;
    const mob = vs.find(v => /mobile/i.test(v.name));
    if (mob && mob !== vs[0]) { const o2 = []; tree(mob, 0, 4, o2, ''); report.info.headerTreeMobile = o2; }
    if (s.type === 'COMPONENT_SET') report.info.headerProps = Object.keys(s.componentPropertyDefinitions).map(k => k + ':' + s.componentPropertyDefinitions[k].type);
  }
});

await step('icon button set', async () => {
  const sets = findAllComp(p01, /^Icon button$/i);
  report.info.iconButtonSets = sets.map(s => s.type + ':' + s.name + ' ' + dims(s) + ' parent=' + (s.parent ? s.parent.name : '-'));
  for (const s of sets) {
    const vs = s.type === 'COMPONENT_SET' ? s.children : [s];
    report.info.iconButtonVariants = vs.map(v => v.name + ' ' + dims(v) + ' @' + R(v.x) + ',' + R(v.y));
    if (s.type === 'COMPONENT_SET') report.info.iconButtonProps = Object.keys(s.componentPropertyDefinitions).map(k => k + ':' + s.componentPropertyDefinitions[k].type);
    const out = []; tree(vs[0], 0, 3, out, ''); report.info.iconButtonTreeFirst = out;
    const more = vs.find(v => /More/.test(v.name)); if (more) { const o2 = []; tree(more, 0, 3, o2, ''); report.info.iconButtonTreeMore = o2; }
  }
});

await step('menu icon names', async () => {
  const sets = findAllComp(p01, /^Menu icon$/i);
  for (const s of sets) report.info.menuIconVariants = (s.type === 'COMPONENT_SET' ? s.children : [s]).map(v => v.name);
});

await step('navigation instances', async () => {
  const rows = [];
  for (const [label, re] of [['Web', /^Web$/], ['Mobile', /^Mobile$/]]) {
    const plat = p02.children.find(n => re.test(n.name)); if (!plat) { rows.push(label + ': missing'); continue; }
    const navs = plat.findAll(n => n.type === 'INSTANCE' && /^Navigation/.test(n.name));
    const byParent = {};
    for (const n of navs) { let p = n.parent; while (p && p.parent && p.parent.type !== 'SECTION') p = p.parent; const sec = (p && p.parent) ? p.parent.name : '?'; byParent[sec] = (byParent[sec] || 0) + 1; }
    rows.push(label + ' Navigation instances: ' + navs.length + ' | per sub-section: ' + JSON.stringify(byParent));
    const first = navs[0];
    if (first) {
      const out = []; tree(first, 0, 5, out, ''); report.info['navTree' + label] = out;
      const m = await first.getMainComponentAsync();
      report.info['navMain' + label] = m ? (m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent.name + ' / ' : '') + m.name : 'none';
      report.info['navProps' + label] = JSON.stringify(first.componentProperties);
    }
  }
  report.info.navRows = rows;
});

await step('account menu + states board', async () => {
  const boards = p01.findAll(n => /Header . account states|Account menu/i.test(n.name) && (n.type === 'FRAME' || n.type === 'SECTION' || n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
  report.info.accountBoards = boards.map(b => b.type + ':' + b.name + ' ' + dims(b));
  const b = boards.find(x => /account states/i.test(x.name));
  if (b) { const out = []; tree(b, 0, 2, out, ''); report.info.accountStatesTree = out; }
});

await step('profile actions + sticky bar', async () => {
  const web = p02.children.find(n => /^Web$/.test(n.name)), mob = p02.children.find(n => /^Mobile$/.test(n.name));
  const pa = web.findAll(n => /^Profile actions$/.test(n.name)).slice(0, 4);
  report.info.profileActionsCount = web.findAll(n => /^Profile actions$/.test(n.name)).length;
  report.info.profileActionsSamples = pa.map(n => { const owner = (() => { let p = n; while (p && p.parent && p.parent.type !== 'SECTION') p = p.parent; return p ? p.name : '?'; })(); return owner + ' :: ' + kids(n).map(c => c.name + '(' + dims(c) + ')').join(' | '); });
  const own = web.findAll(n => /^Profile actions$/.test(n.name))[0];
  if (own) { const out = []; tree(own, 0, 3, out, ''); report.info.profileActionsTree = out; }
  const sb = mob.findAll(n => n.type === 'INSTANCE' && /Sticky action bar/.test(n.name));
  report.info.stickyBarCount = sb.length;
  if (sb[0]) { const out = []; tree(sb[0], 0, 3, out, ''); report.info.stickyBarTree = out; report.info.stickyBarProps = JSON.stringify(sb[0].componentProperties); }
});

await step('messages icon already present?', async () => {
  const hits = [];
  for (const p of [p01, p02]) for (const n of p.findAll(x => /message|mail|chat|bell|notif/i.test(x.name) && /Icon button|Icon ·|Menu icon/i.test(x.name))) hits.push(p.name.slice(0, 2) + ':' + n.type[0] + ':' + n.name);
  report.info.messageLikeIcons = hits.slice(0, 25);
});

return report;
