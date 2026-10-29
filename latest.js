// step 252 · READ-ONLY inspect for the profile ⋯ menu: Thread menu, Message menu, Confirm dialog (Block person), Thread menu page layout in Messenger, Profile actions pages, Sticky action bar set (no changes)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const R = n => Math.round(n * 10) / 10;
const dims = n => R(n.width) + 'x' + R(n.height);
const kids = n => ('children' in n) ? n.children : [];
function tree(n, depth, max, out, indent) {
  if (out.length > 220) return;
  const extra = n.type === 'TEXT' ? ' "' + String(n.characters).slice(0, 28) + '"' : '';
  const vis = n.visible === false ? ' (hidden)' : '';
  const lay = ('layoutMode' in n && n.layoutMode !== 'NONE') ? ' ' + n.layoutMode[0] + ' gap' + (n.itemSpacing || 0) : '';
  const abs = n.layoutPositioning === 'ABSOLUTE' ? ' ABS' : '';
  out.push(indent + n.type[0] + ':' + n.name + ' ' + dims(n) + ' @' + R(n.x) + ',' + R(n.y) + lay + abs + extra + vis);
  if (depth < max && n.type !== 'TEXT') for (const c of kids(n)) tree(c, depth + 1, max, out, indent + '  ');
}
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
const topComp = (page, re) => page.findAll(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name) && !(n.parent && n.parent.type === 'COMPONENT_SET'));
const web = p02.children.find(n => n.name === 'Web');
const sub = (root, name) => root.children.find(n => n.name === name);

await step('menus + dialog components', async () => {
  for (const [key, re] of [['threadMenu', /^Thread menu$/], ['messageMenu', /^Message menu$/], ['confirmDialog', /^Confirm dialog$/]]) {
    const sets = topComp(p01, re);
    if (!sets.length) { report.info[key] = 'not found'; continue; }
    const s = sets[0];
    const vs = s.type === 'COMPONENT_SET' ? s.children : [s];
    report.info[key + 'Variants'] = vs.map(v => v.name + ' ' + dims(v));
    const pick = key === 'confirmDialog' ? (vs.find(v => /Block/.test(v.name) && /Desktop/.test(v.name)) || vs[0]) : vs[0];
    const out = []; tree(pick, 0, 4, out, ''); report.info[key + 'Tree'] = out;
  }
});

await step('Messenger thread menu page placement', async () => {
  const m = sub(web, 'Messenger'); if (!m) throw new Error('Messenger section missing');
  const pg = m.children.find(n => /Thread menu/.test(n.name));
  if (!pg) throw new Error('Thread menu page missing');
  const menu = pg.findOne(n => n.type === 'INSTANCE' && /^Thread menu/.test(n.name));
  const scrim = pg.findOne(n => /scrim/i.test(n.name));
  const btn = pg.findOne(n => n.type === 'INSTANCE' && /Icon button · More/.test(n.name));
  const pb = pg.absoluteBoundingBox;
  const rel = n => n ? R(n.absoluteBoundingBox.x - pb.x) + ',' + R(n.absoluteBoundingBox.y - pb.y) + ' ' + dims(n) : 'none';
  report.info.threadMenuPage = { page: pg.name + ' ' + dims(pg), menu: rel(menu), moreButton: rel(btn), scrim: rel(scrim), topChildren: pg.children.map(c => c.name + (c.layoutPositioning === 'ABSOLUTE' ? '(ABS)' : '')).join(' | ') };
});

await step('Profile actions on other people profiles', async () => {
  const rows = [];
  for (const s of web.children) {
    if (s.type !== 'SECTION') continue;
    for (const pg of s.children) {
      if (pg.type !== 'FRAME') continue;
      const pa = pg.findOne(n => n.name === 'Profile actions');
      if (!pa) continue;
      rows.push(s.name + ' › ' + pg.name + ' | ' + pa.children.map(c => c.name + '(' + dims(c) + ')').join(', ') + ' | width ' + dims(pa));
    }
  }
  report.info.profileActionsPages = rows;
});

await step('Leo profile hero actions tree', async () => {
  const s = sub(web, 'Profiles · player'); const pg = s.children.find(n => /^Profiles \/ Player \/ Leo Marsh|^Profiles \/ Player · Desktop$/.test(n.name)) || s.children.find(n => n.type === 'FRAME');
  report.info.leoPage = pg.name + ' ' + dims(pg);
  const pa = pg.findOne(n => n.name === 'Profile actions');
  const out = []; if (pa) tree(pa, 0, 2, out, ''); report.info.leoProfileActions = out;
  const idn = pg.findOne(n => n.name === 'Identity');
  report.info.leoIdentity = idn ? dims(idn) + ' children: ' + idn.children.map(c => c.name).join(' | ') : 'no Identity';
});

await step('Sticky action bar set', async () => {
  const sets = topComp(p01, /^Sticky action bar/);
  report.info.stickySets = sets.map(s => s.type + ':' + s.name + ' ' + dims(s));
  const s = sets[0];
  const vs = s.type === 'COMPONENT_SET' ? s.children : [s];
  report.info.stickyVariants = vs.map(v => v.name + ' ' + dims(v));
  const other = vs.find(v => /Role=Other/.test(v.name)) || vs[0];
  const out = []; tree(other, 0, 3, out, ''); report.info.stickyOtherTree = out;
  const player = vs.find(v => /Role=Player/.test(v.name));
  if (player) { const o2 = []; tree(player, 0, 3, o2, ''); report.info.stickyPlayerTree = o2; }
  const mob = p02.children.find(n => n.name === 'Mobile');
  const inst = mob.findAll(n => n.type === 'INSTANCE' && /Sticky action bar/.test(n.name));
  report.info.stickyInstances = inst.length;
  report.info.stickyTextOverrides = inst.map(i => (function () { let p = i; while (p && p.parent && p.parent.type !== 'SECTION') p = p.parent; return p ? p.name : '?'; })() + ' | ' + i.componentProperties.Role.value + ' | ' + i.findAll(t => t.type === 'TEXT').map(t => '"' + t.characters + '"').join(',')).slice(0, 12);
});

return report;
