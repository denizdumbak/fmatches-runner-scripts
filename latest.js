// step 240 · Messenger / Default · Desktop (02 › Web › Messenger): Ticker + Navigation, chat list panel (7 chats, Tom selected) + thread (header, messages, composer)

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

const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const btnSet = findSet(/^Button$/), chatSet = findSet(/^Chat list item$/), bubSet = findSet(/^Message bubble$/), divComp = findSet(/^Date divider$/), thSet = findSet(/^Thread header$/), compSet = findSet(/^Composer$/);
for (const [n, v] of [['Button', btnSet], ['Chat list item', chatSet], ['Message bubble', bubSet], ['Date divider', divComp], ['Thread header', thSet], ['Composer', compSet]]) if (!v) throw new Error('component missing: ' + n);
async function setText(node, str) { for (const seg of node.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); node.characters = str; }
const setIn = async (root, nm, str) => { const t = root.findOne(n => n.type === 'TEXT' && n.name === nm); if (!t) throw new Error('text "' + nm + '" not found in ' + root.name); await setText(t, str); };
async function mkBtn(label, style) {
  const bv = btnSet.children.find(v => new RegExp('Style=' + style).test(v.name) && /State=Default/.test(v.name)) || btnSet.children[0];
  const b = bv.createInstance(); b.name = 'Button · ' + label; const cp = b.componentProperties || {};
  const lk = Object.keys(cp).find(k => /^Label/.test(k)); const ik = Object.keys(cp).find(k => /^Icon/.test(k));
  if (lk) b.setProperties({ [lk]: label }); if (ik) b.setProperties({ [ik]: false });
  const bt = b.findOne(n => n.type === 'TEXT'); if (bt) await setText(bt, label); return b;
}
const web = p02.children.find(n => n.type === 'SECTION' && /^Web/.test(n.name));
const msgSec = web.children.find(n => n.type === 'SECTION' && n.name === 'Messenger');
const mapSec = web.children.find(n => n.type === 'SECTION' && n.name === 'Map');
if (!msgSec || !mapSec) throw new Error('Messenger or Map section missing in Web');
const srcPage = mapSec.children.find(n => n.type === 'FRAME' && /^Map \/ Default.*Desktop$/.test(n.name)) || mapSec.children.find(n => n.type === 'FRAME' && /Desktop$/.test(n.name));
if (!srcPage) throw new Error('map desktop page not found');
const tickSrc = srcPage.children.find(n => n.name === 'Ticker'), navSrc = srcPage.children.find(n => n.name === 'Navigation');
if (!tickSrc || !navSrc) throw new Error('Ticker or Navigation missing in ' + srcPage.name);
const slotX = i => 80 + i * 1920;
const W = 1440, H = 900, TOP = Math.round(navSrc.y + navSrc.height);
const SIL = (role, g) => silSet.children.find(v => v.name === 'Role=' + role + ', Gender=' + g + ', Size=40');
const SEARCH_SVG = SV('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>');
for (const o of msgSec.children.slice()) { if (o.name === 'Messenger / Default · Desktop') o.remove(); }

async function chatRow(d) {
  const v = chatSet.children.find(x => x.name === 'State=' + d.state + ', Unread=' + (d.count ? 'True' : 'False')); if (!v) throw new Error('chat variant missing');
  const r = v.createInstance(); r.name = 'Chat · ' + d.name;
  await setIn(r, 'Name', d.name); await setIn(r, 'Time', d.time); await setIn(r, 'Meta', d.meta); await setIn(r, 'Preview', d.preview); if (d.count) await setIn(r, 'Count', String(d.count));
  const si = r.findOne(n => n.type === 'INSTANCE' && n.name === 'Silhouette'); const sv = SIL(d.role, d.gender); if (si && sv) si.swapComponent(sv); else report.info.silhouetteMissing = (report.info.silhouetteMissing || '') + d.name + ' ';
  return r;
}
async function bubble(side, type, status, texts) {
  const v = bubSet.children.find(x => x.name === 'Side=' + side + ', Type=' + type + ', Status=' + status); if (!v) throw new Error('bubble variant missing: ' + side + type + status);
  const b = v.createInstance(); b.name = 'Message · ' + side + ' · ' + type;
  for (const k of Object.keys(texts)) await setIn(b, k, texts[k]);
  return b;
}

await step('Messenger / Default · Desktop', async () => {
  await figma.setCurrentPageAsync(p02);
  const page = figma.createFrame(); page.name = 'Messenger / Default · Desktop'; msgSec.appendChild(page);
  page.resize(W, H); page.x = slotX(0); page.y = 80; page.clipsContent = true; fillV(page, 'color/bg/canvas');
  for (const [src, nm] of [[tickSrc, 'Ticker'], [navSrc, 'Navigation']]) { const c = src.clone(); c.name = nm; page.appendChild(c); c.x = 0; c.y = src.y; }
  // list panel
  const lp = figma.createFrame(); lp.name = 'Chat list panel'; page.appendChild(lp); lp.resize(400, H - TOP); lp.x = 0; lp.y = TOP; lp.clipsContent = true;
  lp.layoutMode = 'VERTICAL'; lp.primaryAxisSizingMode = 'FIXED'; lp.counterAxisSizingMode = 'FIXED'; lp.itemSpacing = 0; fillV(lp, 'color/bg/surface');
  lp.strokes = [P(V('color/border/default'))]; lp.strokeAlign = 'INSIDE'; lp.strokeTopWeight = 0; lp.strokeLeftWeight = 0; lp.strokeBottomWeight = 0; lp.strokeRightWeight = 1;
  const ph = frame('Panel header', 'HORIZONTAL'); ph.primaryAxisAlignItems = 'SPACE_BETWEEN'; ph.counterAxisAlignItems = 'CENTER'; PAD(ph, 'spacing/md', 'spacing/md', 'spacing/sm', 'spacing/md');
  lp.appendChild(ph); ph.layoutSizingHorizontal = 'FILL';
  ph.appendChild(await txt('Title', 'Messages', 'Heading/H4', 'color/text/primary'));
  ph.appendChild(await mkBtn('New message', 'Secondary'));
  const sw = frame('Search wrap', 'HORIZONTAL'); PAD(sw, 'spacing/2xs', 'spacing/md', 'spacing/md', 'spacing/md'); lp.appendChild(sw); sw.layoutSizingHorizontal = 'FILL';
  const sf = frame('Search chats', 'HORIZONTAL'); sf.counterAxisAlignItems = 'CENTER'; GAP(sf, 'spacing/xs'); fillV(sf, 'color/bg/subtle'); RAD(sf, 'radius/full'); PAD(sf, 'spacing/sm', 'spacing/md', 'spacing/sm', 'spacing/md');
  sw.appendChild(sf); sf.layoutSizingHorizontal = 'FILL';
  const si = mkIcon(SEARCH_SVG, 'color/icon/default', 20); si.name = 'Icon · Search'; sf.appendChild(si);
  const sp = await txt('Placeholder', 'Search chats', 'Body/Default', 'color/text/secondary'); sf.appendChild(sp);
  const chats = frame('Chats', 'VERTICAL'); lp.appendChild(chats); chats.layoutSizingHorizontal = 'FILL'; chats.layoutGrow = 1; chats.clipsContent = true;
  const data = [
    { name: 'Tom Reilly', meta: 'Manager · Riverside FC', preview: 'Happy to arrange a trial next week.', time: '14:35', state: 'Selected', role: 'Other', gender: 'Male' },
    { name: 'Sofia Lindqvist', meta: 'Intermediary · Lindqvist Sports', preview: 'Can you send the medical report?', time: '12:10', count: 2, state: 'Default', role: 'Other', gender: 'Female' },
    { name: 'Ana Ferreira', meta: 'Referee · Lisbon FA', preview: 'Thanks for the update.', time: 'Yesterday', state: 'Default', role: 'Other', gender: 'Female' },
    { name: 'Jake Morris', meta: 'Football fan', preview: 'Is the Saturday match still on?', time: 'Yesterday', count: 1, state: 'Default', role: 'Other', gender: 'Male' },
    { name: 'Leo Marsh', meta: 'Player · Riverside FC', preview: 'I will be there on Monday.', time: 'Mon', state: 'Default', role: 'Player', gender: 'Male' },
    { name: 'Daniel Brandt', meta: 'Head scout · Spreeufer FC', preview: 'Let us talk after the weekend.', time: '24 Oct', state: 'Default', role: 'Other', gender: 'Male' },
    { name: 'Mateus Kowalczyk-Brun', meta: 'Player · Coastal United', preview: 'Looking forward to it, see you soon.', time: '22 Oct', state: 'Default', role: 'Player', gender: 'Male' }
  ];
  for (const d of data) { const r = await chatRow(d); chats.appendChild(r); r.layoutSizingHorizontal = 'FILL'; }
  // thread
  const th = figma.createFrame(); th.name = 'Thread'; page.appendChild(th); th.resize(W - 400, H - TOP); th.x = 400; th.y = TOP; th.clipsContent = true;
  th.layoutMode = 'VERTICAL'; th.primaryAxisSizingMode = 'FIXED'; th.counterAxisSizingMode = 'FIXED'; th.itemSpacing = 0; fillV(th, 'color/bg/canvas');
  const hd = thSet.children.find(v => v.name === 'Device=Desktop').createInstance(); hd.name = 'Thread header'; th.appendChild(hd); hd.layoutSizingHorizontal = 'FILL';
  await setIn(hd, 'Meta', 'Manager · Riverside FC');
  const ms = frame('Messages', 'VERTICAL'); th.appendChild(ms); ms.layoutSizingHorizontal = 'FILL'; ms.layoutGrow = 1; ms.clipsContent = true; ms.primaryAxisAlignItems = 'MAX'; ms.counterAxisAlignItems = 'MIN';
  PAD(ms, 'spacing/lg', 'spacing/xl', 'spacing/lg', 'spacing/xl'); GAP(ms, 'spacing/md');
  const dv = divComp.createInstance(); dv.name = 'Date divider'; ms.appendChild(dv); dv.layoutSizingHorizontal = 'FILL';
  const msgs = [
    ['Theirs', 'Text', 'None', { Time: '10:12' }],
    ['Mine', 'Text', 'Read', { Time: '10:20' }],
    ['Mine', 'File', 'Read', { 'File name': 'Shortlist_left_backs.pdf', Time: '14:32' }],
    ['Theirs', 'Text', 'None', { 'Message text': 'Thanks, got it. The second name looks interesting.', Time: '14:34' }],
    ['Mine', 'Text', 'Sent', { 'Message text': 'Happy to arrange a trial next week.', Time: '14:35' }]
  ];
  for (const [s, t, st, tx] of msgs) { const b = await bubble(s, t, st, tx); ms.appendChild(b); b.layoutSizingHorizontal = 'FILL'; }
  const cmp = compSet.children.find(v => v.name === 'Kind=Default').createInstance(); cmp.name = 'Composer'; th.appendChild(cmp); cmp.layoutSizingHorizontal = 'FILL';
  // section fit
  msgSec.resizeWithoutConstraints(Math.ceil(page.x + W + 80), Math.ceil(page.y + H + 80)); web.appendChild(msgSec);
  // checks
  let contentH = 0; for (const k of ms.children) contentH += k.height; contentH += ms.itemSpacing * (ms.children.length - 1) + ms.paddingTop + ms.paddingBottom;
  report.info.page = { size: Math.round(page.width) + 'x' + Math.round(page.height), top: TOP, list: Math.round(lp.width) + 'x' + Math.round(lp.height), thread: Math.round(th.width) + 'x' + Math.round(th.height) };
  report.info.messagesFit = 'content ' + Math.round(contentH) + ' of ' + Math.round(ms.height) + (contentH > ms.height + 1 ? ' OVERFLOW' : ' ok');
  report.info.chatsFit = 'rows ' + chats.children.length + ' height ' + Math.round(chats.height) + ' rows total ' + Math.round(chats.children.reduce((a, k) => a + k.height, 0));
  report.info.msgWidths = ms.children.map(k => k.name + ' ' + Math.round(k.width) + 'x' + Math.round(k.height)).join(' | ');
  report.info.bubbleWidths = ms.children.filter(k => /^Message/.test(k.name)).map(k => { const b = k.findOne(n => n.name === 'Bubble'); return k.name + ' bubble ' + (b ? Math.round(b.width) : '?'); }).join(' | ');
  const gray = [], unst = []; const walk = n => { if ('fills' in n && n.fills !== figma.mixed) n.fills.forEach(f => { if (f.type === 'SOLID' && Math.abs(f.color.r - .5) < .01 && Math.abs(f.color.g - .5) < .01 && Math.abs(f.color.b - .5) < .01 && !(f.boundVariables && f.boundVariables.color)) gray.push(n.name); }); if (n.type === 'TEXT' && !n.textStyleId) unst.push(n.name); if ('children' in n) n.children.forEach(walk); };
  walk(page); report.info.grayFills = gray.length ? gray.slice(0, 8) : 'none'; report.info.unstyledText = unst.length ? unst.slice(0, 8) : 'none';
  const A = msgSec.absoluteBoundingBox, hits = []; for (const s of web.children) { if (s === msgSec || !s.absoluteBoundingBox) continue; const B = s.absoluteBoundingBox; if (A.x < B.x + B.width && B.x < A.x + A.width && A.y < B.y + B.height && B.y < A.y + A.height) hits.push(s.name); }
  report.info.sectionOverlaps = hits.length ? hits : 'none';
  report.info.msgSection = Math.round(msgSec.width) + 'x' + Math.round(msgSec.height) + ' at ' + Math.round(msgSec.x) + ',' + Math.round(msgSec.y) + ' · web ' + Math.round(web.width) + 'x' + Math.round(web.height);
});

await figma.setCurrentPageAsync(startPage);
return report;
