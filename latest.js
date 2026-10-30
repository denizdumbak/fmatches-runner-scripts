// step 269 · read-only inspect before Event card: Web sub-sections and page names, page shell (Ticker/Navigation/Footer), Manager profile layout, Event row styling, Button/Tag/Section header/Link row/Key fact props, text styles
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const hexc = c => '#' + [c.r, c.g, c.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
function line(n) {
  let s = n.type + ' "' + n.name + '" ' + Math.round(n.width) + 'x' + Math.round(n.height) + ' @' + Math.round(n.x) + ',' + Math.round(n.y);
  if ('layoutMode' in n && n.layoutMode !== 'NONE') s += ' ' + n.layoutMode + ' gap' + n.itemSpacing + ' pad' + [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].join('/') + ' ' + (n.primaryAxisSizingMode || '') + '/' + (n.counterAxisSizingMode || '');
  if (n.type === 'TEXT') s += ' "' + n.characters.slice(0, 30) + '" style:' + (n.textStyleId ? (figma.getStyleById(n.textStyleId) || {}).name : 'none');
  if ('fills' in n && n.fills !== figma.mixed && n.fills.length) { const f = n.fills[0]; s += ' fill:' + (f.type === 'SOLID' ? hexc(f.color) + (f.boundVariables && f.boundVariables.color ? '(var)' : '') : f.type); }
  if ('cornerRadius' in n && n.cornerRadius && n.cornerRadius !== figma.mixed) s += ' r' + n.cornerRadius;
  if (n.type === 'INSTANCE') { try { const m = n.mainComponent; } catch (e) {} }
  if (n.visible === false) s += ' HIDDEN';
  return s;
}
function dump(n, d, max, out) { out.push('  '.repeat(d) + line(n)); if (d < max && 'children' in n) for (const c of n.children) dump(c, d + 1, max, out); return out; }
const findSet = (p, re) => p.findAll(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name) && !(n.parent && n.parent.type === 'COMPONENT_SET'))[0];
const props = n => { try { return Object.entries(n.componentPropertyDefinitions).map(([k, v]) => k + ':' + v.type + (v.variantOptions ? '[' + v.variantOptions.join('/') + ']' : '') + (v.type !== 'VARIANT' ? '=' + String(v.defaultValue).slice(0, 20) : '')).join(', '); } catch (e) { return 'n/a'; } };

await step('web sub-sections and pages', async () => {
  const p = pageOf(/^02/); await p.loadAsync();
  const web = p.findOne(n => n.type === 'SECTION' && n.name === 'Web');
  const mob = p.findOne(n => n.type === 'SECTION' && n.name === 'Mobile');
  const out = [];
  for (const plat of [web, mob]) for (const s of plat.children) {
    if (s.type !== 'SECTION') { out.push(plat.name + ' > ' + s.type + ' ' + s.name + ' ' + Math.round(s.x) + ',' + Math.round(s.y) + ' ' + Math.round(s.width) + 'x' + Math.round(s.height)); continue; }
    const frames = s.children.filter(c => c.type === 'FRAME');
    out.push(plat.name + ' > SECTION ' + s.name + ' @' + Math.round(s.x) + ',' + Math.round(s.y) + ' ' + Math.round(s.width) + 'x' + Math.round(s.height) + ' frames=' + frames.length + (['Home page', 'Profiles · other roles', 'Profiles · player', 'Own profile'].indexOf(s.name) >= 0 ? ' [' + frames.slice(0, 14).map(f => f.name + ' ' + Math.round(f.width) + 'x' + Math.round(f.height)).join(' ; ') + ']' : ''));
  }
  report.info.sections = out;
});

await step('page shell (Home desktop)', async () => {
  const p = pageOf(/^02/);
  const home = p.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · Desktop');
  report.info.homeShell = [line(home)].concat(home.children.map(c => '  ' + line(c)));
  const tk = home.findOne(n => /^Ticker/.test(n.name)); const nv = home.findOne(n => /^Navigation/.test(n.name)); const ft = home.findOne(n => /^Footer/.test(n.name));
  report.info.homeParts = [tk, nv, ft].map(n => n ? n.name + ' ' + n.type + ' ' + Math.round(n.width) + 'x' + Math.round(n.height) + (n.type === 'INSTANCE' ? ' props=' + JSON.stringify(n.componentProperties).slice(0, 160) : '') : 'none');
});

await step('manager profile shell', async () => {
  const p = pageOf(/^02/);
  const web = p.findOne(n => n.type === 'SECTION' && n.name === 'Web');
  const roles = web.findOne(n => n.type === 'SECTION' && n.name === 'Profiles · other roles');
  const mgr = roles.children.find(c => c.type === 'FRAME' && /Manager/.test(c.name) && !/director/i.test(c.name)) || roles.children.find(c => c.type === 'FRAME');
  report.info.managerPage = mgr.name;
  report.info.managerTree = dump(mgr, 0, 2, []);
  const hero = mgr.children.find(c => /Hero/.test(c.name)); if (hero) report.info.managerHero = dump(hero, 0, 3, []).slice(0, 40);
  const tk = mgr.findOne(n => /^Ticker/.test(n.name)); const nv = mgr.findOne(n => /^Navigation/.test(n.name));
  report.info.managerParts = [tk, nv].map(n => n ? n.name + ' ' + (n.type === 'INSTANCE' ? JSON.stringify(n.componentProperties).slice(0, 200) : n.type) : 'none');
  if (nv) report.info.managerNav = dump(nv, 0, 3, []).slice(0, 30);
});

await step('visitor profile ticker and header names', async () => {
  const p = pageOf(/^02/);
  const pl = p.findAll(n => n.type === 'FRAME' && /^Profiles \/ Player/.test(n.name)).slice(0, 12).map(n => n.name + ' ' + Math.round(n.width) + 'x' + Math.round(n.height));
  report.info.playerPages = pl;
  const hdr = findSet(pageOf(/^01/), /^Header$/); if (hdr) report.info.headerVariants = hdr.children.map(v => v.name).join(' | ');
  const tk = findSet(pageOf(/^01/), /^Ticker$/); if (tk) report.info.tickerVariants = tk.children.map(v => v.name + ' ' + Math.round(v.width) + 'x' + Math.round(v.height)).join(' | ');
  const ft = findSet(pageOf(/^01/), /^Footer$/); if (ft) report.info.footerVariants = ft.children ? ft.children.map(v => v.name + ' ' + Math.round(v.width) + 'x' + Math.round(v.height)).join(' | ') : ft.name;
});

await step('component props', async () => {
  const p1 = pageOf(/^01/); await p1.loadAsync();
  const out = {};
  for (const nm of ['Event row', 'Button', 'Tag', 'Section header', 'Link row', 'Key fact', 'Calendar day', 'Page notice', 'Confirm dialog', 'Filter chip', 'Form field']) {
    const s = findSet(p1, new RegExp('^' + nm + '$'));
    out[nm] = s ? (s.type === 'COMPONENT_SET' ? s.children.length + ' variants; ' : 'single; ') + props(s) : 'NOT FOUND';
  }
  report.info.props = out;
  const tag = findSet(p1, /^Tag$/); if (tag) report.info.tagVariants = tag.children.map(v => v.name + ' ' + Math.round(v.width) + 'x' + Math.round(v.height)).join(' | ');
  const btn = findSet(p1, /^Button$/); if (btn) report.info.buttonSample = btn.children.slice(0, 3).map(v => v.name + ' ' + Math.round(v.width) + 'x' + Math.round(v.height)).join(' | ');
  const sh = findSet(p1, /^Section header$/); if (sh) report.info.sectionHeader = dump(sh.type === 'COMPONENT_SET' ? sh.children[0] : sh, 0, 3, []);
  const lr = findSet(p1, /^Link row$/); if (lr) report.info.linkRow = dump(lr.type === 'COMPONENT_SET' ? lr.children[0] : lr, 0, 3, []);
});

await step('event row styling', async () => {
  const p1 = pageOf(/^01/);
  const er = findSet(p1, /^Event row$/);
  const v = er.type === 'COMPONENT_SET' ? er.children.find(x => /Desktop/.test(x.name)) || er.children[0] : er;
  report.info.eventRowVariant = v.name;
  report.info.eventRowTree = dump(v, 0, 4, []);
});

await step('profile body cards and breadcrumb', async () => {
  const p = pageOf(/^02/);
  const web = p.findOne(n => n.type === 'SECTION' && n.name === 'Web');
  const pp = web.findOne(n => n.type === 'SECTION' && n.name === 'Profiles · player');
  const leo = pp.children.find(c => c.type === 'FRAME');
  report.info.leoPage = leo.name;
  const body = leo.findOne(n => n.name === 'Profile body');
  if (body) { report.info.profileBody = dump(body, 0, 2, []).slice(0, 14); const card = body.findOne(n => n.name === 'Link list') || body.findOne(n => n.name === 'Positions'); if (card) report.info.sampleCard = dump(card, 0, 2, []).slice(0, 12); }
  const bc = leo.findOne(n => /^Breadcrumb/.test(n.name)); if (bc) report.info.breadcrumb = dump(bc, 0, 2, []);
});

await step('text styles', async () => {
  report.info.textStyles = (await figma.getLocalTextStylesAsync()).map(s => s.name).join(' | ');
});

return report;
