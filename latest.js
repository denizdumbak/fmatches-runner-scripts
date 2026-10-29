// step 241 · Messenger components 4 (Thread empty state, Person row) + pages: No chats, No chat selected, New message (desktop, derived from Default)

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const startPage = figma.currentPage;
const p01 = figma.root.children.find(p => /^01/.test(p.name));
await p01.loadAsync();
await figma.setCurrentPageAsync(p01);
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const PAD = (n, t, rr, b, l) => { n.setBoundVariable('paddingTop', V(t)); n.setBoundVariable('paddingRight', V(rr)); n.setBoundVariable('paddingBottom', V(b)); n.setBoundVariable('paddingLeft', V(l)); };
const GAP = (n, v) => n.setBoundVariable('itemSpacing', V(v));
const RAD = (n, v) => { for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) n.setBoundVariable(k, V(v)); };
const fillV = (n, v) => { n.fills = [P(V(v))]; };
const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
for (const k of ['Label/Default', 'Label/Default Strong', 'Label/Large Strong', 'Heading/H4', 'Label/Small', 'Body/Small', 'Body/Default']) { if (!TS[k]) throw new Error('text style missing: ' + k); await figma.loadFontAsync(TS[k].fontName); }
async function txt(name, chars, style, color) {
  const t = figma.createText(); t.name = name;
  await t.setTextStyleIdAsync(TS[style].id); t.characters = chars; t.fills = [P(V(color))];
  return t;
}
function frame(name, mode) { const f = figma.createFrame(); f.name = name; f.fills = []; f.clipsContent = false; if (mode) { f.layoutMode = mode; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; f.itemSpacing = 0; } return f; }
function mkIcon(svg, colorVar, size) {
  const ic = figma.createNodeFromSvg(svg); ic.name = 'Icon'; ic.fills = []; ic.resize(size, size); ic.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
  const walk = x => { if ('children' in x) x.children.forEach(walk); if (x.type !== 'FRAME' && x.type !== 'GROUP') { if (x.strokes && x.strokes.length) x.strokes = [P(V(colorVar))]; x.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; } };
  walk(ic); return ic;
}
const SV = body => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
const SVG = {
  file: SV('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>'),
  download: SV('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>'),
  more: SV('<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>'),
  back: SV('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>'),
  attach: SV('<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>'),
  send: SV('<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>'),
  check: SV('<path d="M20 6 9 17l-5-5"/>'),
  checks: SV('<path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>')
};
const findSet = re => p01.findAll(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name) && !(n.parent && n.parent.type === 'COMPONENT_SET'))[0];
const silSet = findSet(/^Silhouette$/);
if (!silSet) throw new Error('Silhouette set not found');
const sec8 = p01.children.find(n => n.type === 'SECTION' && /^8 /.test(n.name));
if (!sec8) throw new Error('Section 8 not found');
const oldRight = sec8.x + sec8.width;

const IMG = f => 'https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/img/gallery/' + f;

const btnSet = findSet(/^Button$/);
if (!btnSet) throw new Error('Button set not found');
async function setText(node, str) { for (const seg of node.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); node.characters = str; }
const setIn = async (root, nm, str) => { const t = root.findOne(n => n.type === 'TEXT' && n.name === nm); if (!t) throw new Error('text "' + nm + '" not found in ' + root.name); await setText(t, str); };
async function mkBtn(label, style) {
  const bv = btnSet.children.find(v => new RegExp('Style=' + style).test(v.name) && /State=Default/.test(v.name)) || btnSet.children[0];
  const b = bv.createInstance(); b.name = 'Button · ' + label; const cp = b.componentProperties || {};
  const lk = Object.keys(cp).find(k => /^Label/.test(k)); const ik = Object.keys(cp).find(k => /^Icon/.test(k));
  if (lk) b.setProperties({ [lk]: label }); if (ik) b.setProperties({ [ik]: false });
  const bt = b.findOne(n => n.type === 'TEXT'); if (bt) await setText(bt, label); return b;
}
const MSG_SVG = SV('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>');
const photo40 = () => {
  const photo = frame('Photo'); photo.resize(40, 40); photo.clipsContent = true; RAD(photo, 'radius/full');
  const sv = silSet.children.find(v => v.name === 'Role=Other, Gender=Male, Size=40') || silSet.children[0];
  const i0 = sv.createInstance(); i0.name = 'Silhouette'; photo.appendChild(i0); i0.x = 0; i0.y = 0; return photo;
};
for (const n of sec8.children.slice()) { if (['Thread empty state', 'Person row'].indexOf(n.name) >= 0) n.remove(); }

// ---------- Thread empty state ----------
await step('Thread empty state', async () => {
  const kinds = [['Not selected', 'Select a conversation', 'Choose a chat from the list or start a new message.'], ['No chats', 'Start your first conversation', 'Find a player, club or scout in the database and send your first message.']];
  const comps = [];
  for (const [k, t, b] of kinds) {
    const c = figma.createComponent(); c.name = 'Kind=' + k; sec8.appendChild(c);
    c.resize(400, 200); c.layoutMode = 'VERTICAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED'; c.counterAxisAlignItems = 'CENTER'; GAP(c, 'spacing/md'); c.fills = [];
    const circ = frame('Icon circle'); circ.resize(48, 48); circ.layoutMode = 'HORIZONTAL'; circ.primaryAxisSizingMode = 'FIXED'; circ.counterAxisSizingMode = 'FIXED'; circ.primaryAxisAlignItems = 'CENTER'; circ.counterAxisAlignItems = 'CENTER'; fillV(circ, 'color/bg/subtle'); RAD(circ, 'radius/full');
    const ic = mkIcon(MSG_SVG, 'color/icon/default', 24); ic.name = 'Icon'; circ.appendChild(ic); c.appendChild(circ);
    const tt = await txt('Title', t, 'Heading/H4', 'color/text/primary'); c.appendChild(tt); tt.layoutSizingHorizontal = 'FILL'; tt.textAutoResize = 'HEIGHT'; tt.textAlignHorizontal = 'CENTER';
    const bd = await txt('Body', b, 'Body/Default', 'color/text/secondary'); c.appendChild(bd); bd.layoutSizingHorizontal = 'FILL'; bd.textAutoResize = 'HEIGHT'; bd.textAlignHorizontal = 'CENTER';
    c.appendChild(await mkBtn('New message', 'Primary'));
    comps.push(c);
  }
  comps[0].x = 32; comps[0].y = 32; comps[1].x = 32 + 440; comps[1].y = 32;
  const set = figma.combineAsVariants(comps, sec8); set.name = 'Thread empty state';
  for (const ch of set.children) { ch.x += 32; ch.y += 32; }
  set.resizeWithoutConstraints(set.width + 64, set.height + 64);
  report.info.threadEmpty = set.children.map(v => v.name + ' ' + Math.round(v.width) + 'x' + Math.round(v.height)).join(' | ');
});

// ---------- Person row ----------
await step('Person row', async () => {
  const comps = [];
  for (const st of ['Default', 'Hover']) {
    const c = figma.createComponent(); c.name = 'State=' + st; sec8.appendChild(c);
    c.resize(1040, 72); c.layoutMode = 'HORIZONTAL'; c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO'; c.counterAxisAlignItems = 'CENTER';
    PAD(c, 'spacing/md', 'spacing/lg', 'spacing/md', 'spacing/lg'); GAP(c, 'spacing/md'); fillV(c, st === 'Default' ? 'color/bg/surface' : 'color/bg/subtle');
    c.strokes = [P(V('color/border/default'))]; c.strokeAlign = 'INSIDE'; c.strokeTopWeight = 0; c.strokeLeftWeight = 0; c.strokeRightWeight = 0; c.strokeBottomWeight = 1;
    c.appendChild(photo40());
    const col = frame('Text', 'VERTICAL'); c.appendChild(col); col.layoutGrow = 1; col.layoutAlign = 'STRETCH';
    col.appendChild(await txt('Name', 'Tom Reilly', 'Label/Default Strong', 'color/text/primary'));
    const mt = await txt('Meta', 'Manager · Riverside FC', 'Label/Small', 'color/text/secondary'); col.appendChild(mt); mt.layoutSizingHorizontal = 'FILL'; mt.textAutoResize = 'HEIGHT'; mt.textTruncation = 'ENDING'; mt.maxLines = 1;
    comps.push(c);
  }
  comps[0].x = 32; comps[0].y = 32; comps[1].x = 32; comps[1].y = 32 + Math.ceil(comps[0].height) + 40;
  const set = figma.combineAsVariants(comps, sec8); set.name = 'Person row';
  for (const ch of set.children) { ch.x += 32; ch.y += 32; }
  set.resizeWithoutConstraints(set.width + 64, set.height + 64);
  report.info.personRow = set.children.map(v => v.name + ' ' + Math.round(v.width) + 'x' + Math.round(v.height)).join(' | ');
});

// ---------- section layout ----------
await step('relayout section 8', async () => {
  const s = sec8;
  const kids = s.children.slice();
  const left = s.x + 80; let y = s.y + 80, first = true;
  for (const k of kids) { const b = k.absoluteBoundingBox; if (!b) continue; if (!first) y += 120; k.x += left - b.x; k.y += y - b.y; y += b.height; first = false; }
  let right = -Infinity, bottom = -Infinity;
  for (const k of s.children) { const b = k.absoluteBoundingBox; if (!b) continue; if (b.x + b.width > right) right = b.x + b.width; if (b.y + b.height > bottom) bottom = b.y + b.height; }
  s.resizeWithoutConstraints(Math.ceil(right - s.x + 80), Math.ceil(bottom - s.y + 80));
  const delta = Math.round(s.x + s.width - oldRight);
  const moved = [];
  if (delta !== 0) for (const o of p01.children) { if (o.type === 'SECTION' && o !== s && o.x > s.x) { o.x += delta; moved.push(o.name); } }
  report.info.section8 = Math.round(s.width) + 'x' + Math.round(s.height) + ' delta ' + delta + ' moved: ' + moved.join(', ');
});

// ---------- checks ----------
await step('checks', async () => {
  let gray = 0, unstyled = 0;
  const walk = n => {
    if ('fills' in n && n.fills !== figma.mixed) for (const f of n.fills) if (f.type === 'SOLID' && Math.abs(f.color.r - .5) < .01 && Math.abs(f.color.g - .5) < .01 && Math.abs(f.color.b - .5) < .01 && !(f.boundVariables && f.boundVariables.color)) gray++;
    if (n.type === 'TEXT' && !n.textStyleId) unstyled++;
    if ('children' in n) n.children.forEach(walk);
  };
  sec8.children.forEach(walk);
  report.info.grayFills = gray; report.info.unstyledText = unstyled;
  const bs = sec8.children.map(n => ({ n: n.name, b: n.absoluteBoundingBox })); const ov = [];
  for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) { const a = bs[i].b, b = bs[j].b; if (a && b && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov.push(bs[i].n + ' x ' + bs[j].n); }
  report.info.overlaps = ov.length ? ov : 'none';
  report.info.sec8kids = sec8.children.map(n => n.type + ':' + n.name + ' ' + Math.round(n.width) + 'x' + Math.round(n.height)).join(' | ');
});


// ---------- pages (derived from Messenger / Default · Desktop) ----------
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const web = p02.children.find(n => n.type === 'SECTION' && /^Web/.test(n.name));
const msgSec = web.children.find(n => n.type === 'SECTION' && n.name === 'Messenger');
if (!msgSec) throw new Error('Messenger section missing in Web');
const srcPage = msgSec.children.find(n => n.type === 'FRAME' && n.name === 'Messenger / Default · Desktop');
if (!srcPage) throw new Error('Default page missing: run step 240 first');
const slotX = i => 80 + i * 1920;
const emptySet = findSet(/^Thread empty state$/), personSet = findSet(/^Person row$/);
const NAMES = ['Messenger / No chats · Desktop', 'Messenger / No chat selected · Desktop', 'Messenger / New message · Desktop'];
for (const o of msgSec.children.slice()) { if (NAMES.indexOf(o.name) >= 0) o.remove(); }
function derive(name, i) {
  const c = srcPage.clone(); c.name = name; msgSec.appendChild(c); c.x = slotX(i); c.y = srcPage.y;
  const lp = c.findOne(n => n.name === 'Chat list panel'), th = c.findOne(n => n.name === 'Thread'), chats = lp.findOne(n => n.name === 'Chats');
  return { c, lp, th, chats };
}
function clearThread(th) { for (const k of th.children.slice()) k.remove(); th.primaryAxisAlignItems = 'CENTER'; th.counterAxisAlignItems = 'CENTER'; }
async function addEmpty(th, kind) { const e = emptySet.children.find(v => v.name === 'Kind=' + kind).createInstance(); e.name = 'Thread empty state'; th.appendChild(e); return e; }
function deselectAll(chats) { for (const r of chats.children) { const cp = r.componentProperties || {}; const key = Object.keys(cp).find(k => /^State/.test(k)); if (key && cp[key].value === 'Selected') r.setProperties({ [key]: 'Default' }); } }

await step('Messenger / No chats · Desktop', async () => {
  await figma.setCurrentPageAsync(p02);
  const d = derive(NAMES[0], 1);
  for (const k of d.chats.children.slice()) k.remove();
  d.chats.primaryAxisAlignItems = 'CENTER'; d.chats.counterAxisAlignItems = 'CENTER';
  const eb = frame('Empty list', 'VERTICAL'); GAP(eb, 'spacing/xs'); eb.counterAxisAlignItems = 'CENTER'; PAD(eb, 'spacing/2xl', 'spacing/lg', 'spacing/2xl', 'spacing/lg');
  d.chats.appendChild(eb); eb.layoutSizingHorizontal = 'FILL';
  const t1 = await txt('Title', 'No conversations yet', 'Label/Default Strong', 'color/text/primary'); eb.appendChild(t1);
  const t2 = await txt('Body', 'Messages you send and receive will appear here.', 'Body/Small', 'color/text/secondary'); eb.appendChild(t2); t2.layoutSizingHorizontal = 'FILL'; t2.textAutoResize = 'HEIGHT'; t2.textAlignHorizontal = 'CENTER';
  d.chats.primaryAxisAlignItems = 'MIN';
  clearThread(d.th); await addEmpty(d.th, 'No chats');
});
await step('Messenger / No chat selected · Desktop', async () => {
  const d = derive(NAMES[1], 2);
  deselectAll(d.chats);
  clearThread(d.th); await addEmpty(d.th, 'Not selected');
});
await step('Messenger / New message · Desktop', async () => {
  const d = derive(NAMES[2], 3);
  deselectAll(d.chats);
  for (const k of d.th.children.slice()) k.remove(); d.th.primaryAxisAlignItems = 'MIN'; d.th.counterAxisAlignItems = 'MIN';
  const hd = frame('New message header', 'HORIZONTAL'); hd.primaryAxisAlignItems = 'SPACE_BETWEEN'; hd.counterAxisAlignItems = 'CENTER'; PAD(hd, 'spacing/md', 'spacing/lg', 'spacing/md', 'spacing/lg'); fillV(hd, 'color/bg/surface');
  hd.strokes = [P(V('color/border/default'))]; hd.strokeAlign = 'INSIDE'; hd.strokeTopWeight = 0; hd.strokeLeftWeight = 0; hd.strokeRightWeight = 0; hd.strokeBottomWeight = 1;
  d.th.appendChild(hd); hd.layoutSizingHorizontal = 'FILL';
  hd.appendChild(await txt('Title', 'New message', 'Label/Large Strong', 'color/text/primary'));
  hd.appendChild(await mkBtn('Cancel', 'Subtle'));
  const to = frame('To row', 'HORIZONTAL'); to.counterAxisAlignItems = 'CENTER'; GAP(to, 'spacing/md'); PAD(to, 'spacing/md', 'spacing/lg', 'spacing/md', 'spacing/lg'); fillV(to, 'color/bg/surface');
  d.th.appendChild(to); to.layoutSizingHorizontal = 'FILL';
  to.appendChild(await txt('To', 'To', 'Label/Default Strong', 'color/text/secondary'));
  const inp = frame('Recipient field', 'HORIZONTAL'); inp.counterAxisAlignItems = 'CENTER'; GAP(inp, 'spacing/xs'); fillV(inp, 'color/bg/surface'); RAD(inp, 'radius/md'); PAD(inp, 'spacing/sm', 'spacing/md', 'spacing/sm', 'spacing/md');
  inp.strokes = [P(V('color/border/focus'))]; inp.strokeWeight = 2; inp.strokeAlign = 'INSIDE';
  to.appendChild(inp); inp.layoutGrow = 1; inp.layoutAlign = 'STRETCH';
  const ty = await txt('Typed', 'Tom', 'Body/Default', 'color/text/primary'); inp.appendChild(ty);
  const res = frame('Results', 'VERTICAL'); d.th.appendChild(res); res.layoutSizingHorizontal = 'FILL';
  const people = [['Tom Reilly', 'Manager · Riverside FC', 'Other', 'Male'], ['Tomas Weber', 'Player · Nordpark SC', 'Player', 'Male'], ['Tommaso Rossi', 'Scout · Havelblick United', 'Other', 'Male']];
  for (let i = 0; i < people.length; i++) {
    const r = personSet.children.find(v => v.name === 'State=' + (i === 0 ? 'Hover' : 'Default')).createInstance(); r.name = 'Person · ' + people[i][0];
    await setIn(r, 'Name', people[i][0]); await setIn(r, 'Meta', people[i][1]);
    const si = r.findOne(n => n.type === 'INSTANCE' && n.name === 'Silhouette'); const sv = silSet.children.find(v => v.name === 'Role=' + people[i][2] + ', Gender=' + people[i][3] + ', Size=40'); if (si && sv) si.swapComponent(sv);
    res.appendChild(r); r.layoutSizingHorizontal = 'FILL';
  }
});
await step('fit + checks', async () => {
  let right = 0, bottom = 0; for (const ch of msgSec.children) { right = Math.max(right, ch.x + ch.width); bottom = Math.max(bottom, ch.y + ch.height); }
  msgSec.resizeWithoutConstraints(Math.ceil(right + 80), Math.ceil(bottom + 80)); web.appendChild(msgSec);
  const pages = msgSec.children.filter(n => n.type === 'FRAME');
  report.info.pages = pages.map(p => p.name + ' @' + Math.round(p.x) + ',' + Math.round(p.y) + ' ' + Math.round(p.width) + 'x' + Math.round(p.height)).join(' | ');
  const gray = [], unst = []; const walk = n => { if ('fills' in n && n.fills !== figma.mixed) n.fills.forEach(f => { if (f.type === 'SOLID' && Math.abs(f.color.r - .5) < .01 && Math.abs(f.color.g - .5) < .01 && Math.abs(f.color.b - .5) < .01 && !(f.boundVariables && f.boundVariables.color)) gray.push(n.name); }); if (n.type === 'TEXT' && !n.textStyleId) unst.push(n.name); if ('children' in n) n.children.forEach(walk); };
  pages.forEach(walk); report.info.pageGrayFills = gray.length ? gray.slice(0, 8) : 'none'; report.info.pageUnstyledText = unst.length ? unst.slice(0, 8) : 'none';
  const A = msgSec.absoluteBoundingBox, hits = []; for (const s of web.children) { if (s === msgSec || !s.absoluteBoundingBox) continue; const B = s.absoluteBoundingBox; if (A.x < B.x + B.width && B.x < A.x + A.width && A.y < B.y + B.height && B.y < A.y + A.height) hits.push(s.name); }
  report.info.sectionOverlaps = hits.length ? hits : 'none';
  report.info.msgSection = Math.round(msgSec.width) + 'x' + Math.round(msgSec.height) + ' at ' + Math.round(msgSec.x) + ',' + Math.round(msgSec.y) + ' · web ' + Math.round(web.width) + 'x' + Math.round(web.height);
  const nm = msgSec.findOne(n => n.name === 'Messenger / New message · Desktop');
  if (nm) { const th = nm.findOne(n => n.name === 'Thread'); report.info.newMessageThread = th.children.map(k => k.name + ' ' + Math.round(k.width) + 'x' + Math.round(k.height)).join(' | '); }
  const nc = msgSec.findOne(n => n.name === 'Messenger / No chats · Desktop'); if (nc) { const ch = nc.findOne(n => n.name === 'Chats'); report.info.noChatsList = ch.children.map(k => k.name + ' ' + Math.round(k.width) + 'x' + Math.round(k.height)).join(' | '); }
});
await figma.setCurrentPageAsync(startPage);
return report;
