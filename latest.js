// step 236 · INSPECT (salt okunur): messenger oncesi yeniden kullanilacak parcalar (Avatar, Silhouette, Verification badge, Page notice, Icon button, Tag, Filter chip, Form field, Log out dialog, Account menu, Header mesaj ikonu, Profile actions) + Messenger Section'lari + stiller
const report = { info: {} };
const p01 = figma.root.children.find(p => /^01/.test(p.name)); const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
const hexc = c => '#' + [c.r, c.g, c.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
function line(n) {
  let s = n.type + ' "' + n.name + '" ' + Math.round(n.width) + 'x' + Math.round(n.height) + ' @' + Math.round(n.x) + ',' + Math.round(n.y);
  if ('layoutMode' in n && n.layoutMode !== 'NONE') s += ' ' + n.layoutMode;
  if (n.type === 'TEXT') s += ' "' + n.characters.slice(0, 24) + '"';
  if ('fills' in n && n.fills !== figma.mixed && n.fills.length) { const f = n.fills[0]; s += ' fill:' + (f.type === 'SOLID' ? hexc(f.color) + (f.boundVariables && f.boundVariables.color ? '(var)' : '') : f.type); }
  if (n.visible === false) s += ' HIDDEN';
  return s;
}
function dump(n, d, max, out) { out.push('  '.repeat(d) + line(n)); if (d < max && 'children' in n) for (const c of n.children) dump(c, d + 1, max, out); return out; }
const findComp = re => p01.findAll(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name) && !(n.parent && n.parent.type === 'COMPONENT_SET'));
const names = {};

// 1) Section'lar
const sec8 = p01.children.find(n => n.type === 'SECTION' && /^8 /.test(n.name));
report.info.sec8 = sec8 ? Math.round(sec8.x) + ',' + Math.round(sec8.y) + ' ' + Math.round(sec8.width) + 'x' + Math.round(sec8.height) + ' children=' + sec8.children.map(c => c.type + ':' + c.name).join(' | ') : 'MISSING';
const sec7 = p01.children.find(n => n.type === 'SECTION' && /^7 /.test(n.name));
report.info.sec7bottom = sec7 ? Math.round(sec7.y + sec7.height) : 'n/a';
for (const plat of ['Web', 'Mobile']) {
  const s = p02.children.find(n => n.type === 'SECTION' && new RegExp('^' + plat).test(n.name));
  const m = s && s.children.find(n => n.type === 'SECTION' && n.name === 'Messenger');
  report.info['msgSection' + plat] = m ? Math.round(m.x) + ',' + Math.round(m.y) + ' ' + Math.round(m.width) + 'x' + Math.round(m.height) + ' kids=' + m.children.length : 'MISSING';
  report.info['sectionsOf' + plat] = s ? s.children.filter(n => n.type === 'SECTION').map(n => n.name + '@' + Math.round(n.x) + ',' + Math.round(n.y) + ' ' + Math.round(n.width) + 'x' + Math.round(n.height)).join(' | ') : 'none';
}

// 2) Yeniden kullanilacak component'ler: set/variant adlari + yapi
const want = [
  ['Avatar', /^Avatar/], ['Silhouette', /^Silhouette/], ['Verification badge', /^Verification badge/], ['Page notice', /^Page notice/],
  ['Icon button', /^Icon button/], ['Tag', /^Tag/], ['Filter chip', /^Filter chip/], ['Log out dialog', /^Log out dialog/], ['Account menu', /^Account menu/],
  ['Menu row', /^Menu row/], ['Empty card', /^Empty card/], ['Map empty state', /^Map empty state/], ['Button', /^Button/], ['Form field', /^Form field/]
];
report.info.comps = {};
for (const [label, re] of want) {
  const f = findComp(re);
  if (!f.length) { report.info.comps[label] = 'NOT FOUND'; continue; }
  const c = f[0];
  const variants = c.type === 'COMPONENT_SET' ? c.children : [c];
  const entry = { type: c.type, found: f.length, size: Math.round(c.width) + 'x' + Math.round(c.height), variants: variants.length, names: variants.slice(0, 12).map(v => v.name).join(' | ') };
  if (c.type === 'COMPONENT_SET') entry.props = Object.keys(c.componentPropertyDefinitions).map(k => k + ':' + c.componentPropertyDefinitions[k].type).join(', ');
  else entry.props = Object.keys(c.componentPropertyDefinitions || {}).map(k => k + ':' + c.componentPropertyDefinitions[k].type).join(', ');
  const deep = ['Avatar', 'Verification badge', 'Page notice', 'Icon button', 'Log out dialog', 'Account menu', 'Map empty state', 'Tag'].indexOf(label) >= 0 ? 3 : 0;
  if (deep) entry.tree = dump(variants[0], 0, deep, []);
  report.info.comps[label] = entry;
}

// 3) Header: mesaj ikonu ve rozet; hesap durumlari
const hdrSet = findComp(/^Header/)[0];
if (hdrSet) {
  const v = hdrSet.type === 'COMPONENT_SET' ? hdrSet.children : [hdrSet];
  report.info.headerVariants = v.map(x => x.name).join(' | ');
  const loggedIn = v.find(x => /Player|Logged|Manager|account/i.test(x.name)) || v[v.length - 1];
  report.info.headerTree = dump(loggedIn, 0, 4, []).filter(l => /message|mail|envelope|badge|bell|unread|Icon button|Avatar/i.test(l) || /^ {0,4}\S/.test(l));
}

// 4) Baska kisinin profilinde Profile actions
const web = p02.children.find(n => n.type === 'SECTION' && /^Web/.test(n.name));
const prof = web.findOne(n => n.type === 'FRAME' && /^Profiles \/ Manager/.test(n.name)) || web.findOne(n => n.type === 'FRAME' && /^Profiles \/ Player/.test(n.name));
if (prof) {
  report.info.profileFrame = prof.name + ' ' + Math.round(prof.width) + 'x' + Math.round(prof.height);
  const pa = prof.findOne(n => n.name === 'Profile actions');
  report.info.profileActions = pa ? dump(pa, 0, 3, []) : 'Profile actions not found';
}
const profM = p02.findOne(n => n.type === 'FRAME' && /^Profiles \/ Player.*Mobile$/.test(n.name));
if (profM) { const sb = profM.findOne(n => /Sticky action bar/.test(n.name)); report.info.stickyBarMobile = sb ? dump(sb, 0, 3, []) : 'none'; }

// 5) Ornek satir deseni: Map result row (liste satiri modeli) ve Option row
const rr = findComp(/^Map result row/)[0]; if (rr) report.info.resultRow = dump(rr.type === 'COMPONENT_SET' ? rr.children[0] : rr, 0, 3, []);

// 6) Stiller ve degiskenler
const ts = await figma.getLocalTextStylesAsync(); report.info.textStyles = ts.map(s => s.name).join(' | ');
const es = await figma.getLocalEffectStylesAsync(); report.info.effectStyles = es.map(s => s.name).join(' | ');
const vars = await figma.variables.getLocalVariablesAsync();
report.info.varCount = vars.length;
report.info.hasVars = ['color/bg/subtle', 'color/brand-subtle', 'color/bg/brand', 'color/text/inverse', 'color/danger-subtle', 'color/text/danger', 'color/border/default', 'color/icon/default', 'color/icon/inverse', 'spacing/2xs', 'radius/lg', 'radius/full'].map(n => n + ':' + (vars.some(v => v.name === n) ? 'y' : 'N')).join(' ');
report.info.colorNames = vars.filter(v => /^color\//.test(v.name) && !/^color\/map/.test(v.name)).map(v => v.name).join(' | ');
return report;
