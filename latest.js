// step 270 · read-only inspect (retry of 269 failed parts, async style lookup): Manager profile hero/identity/body, Event row tree, Section header / Link row / Key fact trees, breadcrumb and card sample on Leo
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const hexc = c => '#' + [c.r, c.g, c.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
async function line(n) {
  let s = n.type + ' "' + n.name + '" ' + Math.round(n.width) + 'x' + Math.round(n.height) + ' @' + Math.round(n.x) + ',' + Math.round(n.y);
  if ('layoutMode' in n && n.layoutMode !== 'NONE') s += ' ' + n.layoutMode + ' gap' + n.itemSpacing + ' pad' + [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].join('/') + ' ' + (n.primaryAxisSizingMode || '') + '/' + (n.counterAxisSizingMode || '');
  if (n.type === 'TEXT') { let st = 'none'; if (n.textStyleId && n.textStyleId !== figma.mixed) { const x = await figma.getStyleByIdAsync(n.textStyleId); st = x ? x.name : 'none'; } s += ' "' + n.characters.slice(0, 30) + '" style:' + st; }
  if ('fills' in n && n.fills !== figma.mixed && n.fills.length) { const f = n.fills[0]; s += ' fill:' + (f.type === 'SOLID' ? hexc(f.color) + (f.boundVariables && f.boundVariables.color ? '(var)' : '') : f.type); }
  if ('cornerRadius' in n && n.cornerRadius && n.cornerRadius !== figma.mixed) s += ' r' + n.cornerRadius;
  if (n.visible === false) s += ' HIDDEN';
  return s;
}
async function dump(n, d, max, out) { out.push('  '.repeat(d) + await line(n)); if (d < max && 'children' in n) for (const c of n.children) await dump(c, d + 1, max, out); return out; }
const findSet = (p, re) => p.findAll(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name) && !(n.parent && n.parent.type === 'COMPONENT_SET'))[0];
const first = s => s.type === 'COMPONENT_SET' ? s.children[0] : s;

await step('manager profile', async () => {
  const p = pageOf(/^02/); await p.loadAsync();
  const mgr = p.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Manager · Desktop');
  const hero = mgr.children.find(c => /^Hero/.test(c.name));
  const ident = hero.findOne(n => n.name === 'Identity');
  report.info.managerIdentity = await dump(ident, 0, 2, []);
  const nav = mgr.children.find(c => c.name === 'Navigation');
  report.info.managerNav = await dump(nav, 0, 3, []);
  const acts = nav.findOne(n => n.name === 'Account actions');
  report.info.managerTickerProps = JSON.stringify(mgr.children[0].componentProperties).slice(0, 160);
  report.info.managerNavProps = JSON.stringify(nav.componentProperties).slice(0, 160);
  const body = mgr.findOne(n => n.name === 'Profile body');
  report.info.managerBody = await dump(body, 0, 3, []).then(a => a.slice(0, 20));
});

await step('event row tree', async () => {
  const p1 = pageOf(/^01/); await p1.loadAsync();
  const er = findSet(p1, /^Event row$/);
  const v = er.children.find(x => x.name === 'Device=Desktop, State=Default');
  const m = er.children.find(x => x.name === 'Device=Mobile, State=Default');
  report.info.eventRowDesktop = await dump(v, 0, 4, []);
  report.info.eventRowMobile = await dump(m, 0, 3, []);
});

await step('component trees', async () => {
  const p1 = pageOf(/^01/);
  const sh = findSet(p1, /^Section header$/); report.info.sectionHeader = await dump(sh.children.find(x => /Desktop/.test(x.name)), 0, 3, []);
  const kf = findSet(p1, /^Key fact$/); report.info.keyFact = await dump(kf.children.find(x => /Desktop/.test(x.name)), 0, 3, []);
  const lr = findSet(p1, /^Link row$/); report.info.linkRowVideo = await dump(lr.children.find(x => /Video/.test(x.name) && /Default/.test(x.name)), 0, 3, []);
  const tag = findSet(p1, /^Tag$/); report.info.tagTree = await dump(tag.children[0], 0, 2, []);
  const btn = findSet(p1, /^Button$/); report.info.buttonTree = await dump(btn.children[0], 0, 2, []);
  report.info.buttonVariants = btn.children.map(v => v.name).join(' | ');
  const pn = findSet(p1, /^Page notice$/); report.info.pageNotice = await dump(pn.children[0], 0, 2, []);
});

await step('leo page: hero identity, breadcrumb, card', async () => {
  const p = pageOf(/^02/);
  const leo = p.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player · Desktop');
  const hero = leo.children.find(c => /^Hero/.test(c.name));
  const ident = hero.findOne(n => n.name === 'Identity');
  report.info.leoIdentity = await dump(ident, 0, 2, []);
  const bc = leo.findOne(n => /Breadcrumb/i.test(n.name)); report.info.breadcrumb = bc ? await dump(bc, 0, 2, []) : 'none';
  const left = leo.findOne(n => n.name === 'Left column');
  const card = left.children[0];
  report.info.leoCard = await dump(card, 0, 2, []).then(a => a.slice(0, 10));
  const right = leo.findOne(n => n.name === 'Right column');
  report.info.rightFirstCard = await dump(right.children[0], 0, 2, []).then(a => a.slice(0, 10));
});

await step('home upcoming events block', async () => {
  const p = pageOf(/^02/);
  const home = p.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · Desktop');
  const up = home.findOne(n => n.name === 'Upcoming events');
  report.info.upcoming = await dump(up, 0, 2, []);
  const mh = p.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · Mobile');
  report.info.homeMobileShell = [await line(mh)].concat(await Promise.all(mh.children.map(async c => '  ' + await line(c))));
});

return report;
