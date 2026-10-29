// step 249 · Header messages icon: Icon button set gets Icon=Messages (clone of Notifications, Lucide message-square, badge "2"); Header Logged in (Desktop + Mobile) gets the instance left of the bell
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const R = n => Math.round(n * 10) / 10;
const BB = n => n.absoluteBoundingBox;
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
await figma.setCurrentPageAsync(p01);

const iconSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Icon button');
const headerSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Header');
if (!iconSet || !headerSet) throw new Error('Icon button or Header set not found');

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
const MSG_NAME = 'Icon button · Messages';

let msgVariant = null;

await step('clean previous run', async () => {
  const old = iconSet.children.find(c => c.name === 'Icon=Messages');
  let removed = 0;
  for (const v of headerSet.children) for (const i of v.findAll(n => n.type === 'INSTANCE' && n.name === MSG_NAME)) { i.remove(); removed++; }
  if (old) { old.remove(); }
  report.info.cleaned = { instancesRemoved: removed, variantRemoved: !!old };
});

await step('build Icon=Messages variant', async () => {
  const notif = iconSet.children.find(c => c.name === 'Icon=Notifications');
  if (!notif) throw new Error('Icon=Notifications variant missing');
  const last = iconSet.children.reduce((a, c) => (c.y + c.height > a ? c.y + c.height : a), 0);
  const clone = notif.clone();
  iconSet.appendChild(clone);
  clone.name = 'Icon=Messages';
  clone.x = notif.x; clone.y = last + 40;
  const bell = clone.findOne(n => /^Icon · Bell$/.test(n.name));
  if (!bell) throw new Error('Bell frame not found in clone');
  const oldVec = bell.findOne(n => n.type === 'VECTOR');
  const oldStrokes = oldVec.strokes, oldW = oldVec.strokeWeight;
  const idx = clone.children.indexOf(bell);
  const svg = figma.createNodeFromSvg(SVG);
  svg.name = 'Icon · Messages';
  svg.fills = [];
  clone.insertChild(idx, svg);
  svg.resize(20, 20);
  for (const v of svg.findAll(n => n.type === 'VECTOR')) {
    v.fills = []; v.strokes = oldStrokes; v.strokeWeight = oldW; v.strokeCap = 'ROUND'; v.strokeJoin = 'ROUND';
    v.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
  }
  bell.remove();
  const badgeCount = clone.findOne(n => n.type === 'TEXT' && n.name === 'Count');
  if (badgeCount) { await figma.loadFontAsync(badgeCount.fontName); badgeCount.characters = '2'; }
  iconSet.resizeWithoutConstraints(iconSet.width, clone.y + clone.height + 32);
  msgVariant = clone;
  report.info.msgVariant = clone.name + ' ' + R(clone.width) + 'x' + R(clone.height) + ' @' + R(clone.x) + ',' + R(clone.y);
  report.info.msgStrokeBound = JSON.stringify(oldStrokes[0] && oldStrokes[0].boundVariables ? Object.keys(oldStrokes[0].boundVariables) : 'none');
  report.info.iconSetVariants = iconSet.children.map(c => c.name).join(' | ');
  report.info.iconSetSize = R(iconSet.width) + 'x' + R(iconSet.height);
});

await step('add to Header Logged in (Desktop + Mobile)', async () => {
  if (!msgVariant) throw new Error('variant not built');
  const rows = [];
  for (const v of headerSet.children) {
    if (!/State=Logged in/.test(v.name)) continue;
    const isMobile = /Device=Mobile/.test(v.name);
    const holder = v.findOne(n => n.name === (isMobile ? 'Header actions' : 'Account actions'));
    if (!holder) { report.errors.push('holder missing in ' + v.name); continue; }
    const bellBtn = holder.children.find(c => c.name === 'Icon button · Notifications');
    if (!bellBtn) { report.errors.push('bell button missing in ' + v.name); continue; }
    const inst = msgVariant.createInstance();
    inst.name = MSG_NAME;
    holder.insertChild(holder.children.indexOf(bellBtn), inst);
    const cnt = inst.findOne(n => n.type === 'TEXT' && n.name === 'Count');
    if (cnt) { await figma.loadFontAsync(cnt.fontName); cnt.characters = '2'; }
    rows.push(v.name + ' -> holder children: ' + holder.children.map(c => c.name + '(' + R(c.width) + ')').join(', ') + ' | holder ' + R(holder.width) + 'x' + R(holder.height));
  }
  report.info.headerRows = rows;
});

await step('verify header layout (no overlaps)', async () => {
  const out = [];
  for (const v of headerSet.children) {
    if (!/State=Logged in/.test(v.name)) continue;
    const parts = v.children.map(c => ({ n: c.name, b: BB(c) }));
    const ov = [];
    for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
      const a = parts[i].b, b = parts[j].b;
      if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov.push(parts[i].n + ' x ' + parts[j].n);
    }
    const vb = BB(v);
    const outside = parts.filter(p => p.b.x < vb.x - 1 || p.b.x + p.b.width > vb.x + vb.width + 1).map(p => p.n);
    out.push(v.name + ' | ' + parts.map(p => p.n + '@' + R(p.b.x - vb.x) + '+' + R(p.b.width)).join(' ; ') + ' | overlaps: ' + (ov.length ? ov.join(', ') : 'none') + ' | outside: ' + (outside.length ? outside.join(', ') : 'none'));
  }
  report.info.headerLayout = out;
});

await step('set vs section containment', async () => {
  const sec = iconSet.parent;
  const sb = BB(sec), ib = BB(iconSet);
  const hits = [];
  for (const s of sec.children) { if (s === iconSet) continue; const b = BB(s); if (!b) continue; if (ib.x < b.x + b.width && b.x < ib.x + ib.width && ib.y < b.y + b.height && b.y < ib.y + ib.height) hits.push(s.name); }
  report.info.iconSetSection = { section: sec.name, sectionSize: R(sb.width) + 'x' + R(sb.height), setBottomInsideSection: R((sb.y + sb.height) - (ib.y + ib.height)), overlapsWithSiblings: hits.length ? hits : 'none' };
});

await step('propagation count in pages', async () => {
  const res = {};
  for (const label of ['Web', 'Mobile']) {
    const plat = p02.children.find(n => n.name === label);
    const navs = plat.findAll(n => n.type === 'INSTANCE' && /^Navigation/.test(n.name));
    let withMsg = 0, loggedIn = 0;
    for (const n of navs) {
      const has = n.findOne(x => x.name === MSG_NAME);
      const bell = n.findOne(x => x.name === 'Icon button · Notifications');
      if (bell) loggedIn++;
      if (has) withMsg++;
    }
    res[label] = { navigation: navs.length, loggedInNav: loggedIn, withMessagesIcon: withMsg };
  }
  report.info.propagation = res;
});

await step('grayFills check on new nodes', async () => {
  let gray = 0;
  for (const n of msgVariant.findAll(x => 'fills' in x && Array.isArray(x.fills))) for (const f of n.fills) if (f.type === 'SOLID' && Math.abs(f.color.r - 0.5) < 0.01 && Math.abs(f.color.g - 0.5) < 0.01 && Math.abs(f.color.b - 0.5) < 0.01 && !(f.boundVariables && f.boundVariables.color)) gray++;
  report.info.grayFills = gray;
});

return report;
