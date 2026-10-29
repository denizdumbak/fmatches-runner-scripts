// step 245 · Messenger pages (desktop): Blocked, Add to contacts, Unverified member; widens Web platform if needed

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
for (const k of ['Label/Default', 'Label/Default Strong', 'Label/Large Strong', 'Label/Small', 'Body/Small', 'Body/Default']) { if (!TS[k]) throw new Error('text style missing: ' + k); await figma.loadFontAsync(TS[k].fontName); }
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
const compSet = findSet(/^Composer$/), noticeSet = findSet(/^Page notice$/);
for (const [n, v] of [['Composer', compSet], ['Page notice', noticeSet]]) if (!v) throw new Error('component missing: ' + n);
async function setText(node, str) { for (const seg of node.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); node.characters = str; }
const setIn = async (root, nm, str) => { const t = root.findOne(n => n.type === 'TEXT' && n.name === nm); if (!t) throw new Error('text "' + nm + '" not found in ' + root.name); await setText(t, str); };
const web = p02.children.find(n => n.type === 'SECTION' && /^Web/.test(n.name));
const msgSec = web.children.find(n => n.type === 'SECTION' && n.name === 'Messenger');
if (!msgSec) throw new Error('Messenger section missing in Web');
const srcPage = msgSec.children.find(n => n.type === 'FRAME' && n.name === 'Messenger / Default · Desktop');
if (!srcPage) throw new Error('Default page missing');
const slotX = i => 80 + i * 1920;
const NAMES = ['Messenger / Blocked · Desktop', 'Messenger / Add to contacts · Desktop', 'Messenger / Unverified · Desktop'];
for (const o of msgSec.children.slice()) { if (NAMES.indexOf(o.name) >= 0) o.remove(); }
function derive(name, i) {
  const c = srcPage.clone(); c.name = name; msgSec.appendChild(c); c.x = slotX(i); c.y = srcPage.y;
  return { c, lp: c.findOne(n => n.name === 'Chat list panel'), th: c.findOne(n => n.name === 'Thread'), ms: c.findOne(n => n.name === 'Messages'), chats: c.findOne(n => n.name === 'Chats') };
}
function swapComposer(c, kind) {
  const cmp = c.findOne(n => n.type === 'INSTANCE' && n.name === 'Composer'); if (!cmp) throw new Error('Composer instance missing in ' + c.name);
  const v = compSet.children.find(x => x.name === 'Kind=' + kind); if (!v) throw new Error('Composer variant missing: ' + kind);
  cmp.swapComponent(v); return cmp;
}

await step('Messenger / Blocked · Desktop', async () => {
  await figma.setCurrentPageAsync(p02);
  const d = derive(NAMES[0], 9); const cmp = swapComposer(d.c, 'Blocked');
  report.info.blocked = 'composer ' + Math.round(cmp.width) + 'x' + Math.round(cmp.height) + ' · title: ' + cmp.findOne(n => n.name === 'Title').characters;
});
await step('Messenger / Add to contacts · Desktop', async () => {
  const d = derive(NAMES[1], 10);
  const tom = d.chats.findOne(n => n.name === 'Chat · Tom Reilly'); if (tom) tom.remove();
  for (const k of d.ms.children.slice()) k.remove();
  d.ms.primaryAxisAlignItems = 'CENTER'; d.ms.counterAxisAlignItems = 'CENTER';
  const eb = frame('Empty thread', 'VERTICAL'); GAP(eb, 'spacing/2xs'); eb.counterAxisAlignItems = 'CENTER'; d.ms.appendChild(eb);
  eb.appendChild(await txt('Title', 'No messages yet', 'Label/Default Strong', 'color/text/primary'));
  eb.appendChild(await txt('Body', 'Your messages with Tom will appear here.', 'Body/Small', 'color/text/secondary'));
  const cmp = swapComposer(d.c, 'Add to contacts');
  report.info.addToContacts = 'chats ' + d.chats.children.length + ' · composer ' + Math.round(cmp.width) + 'x' + Math.round(cmp.height);
});
await step('Messenger / Unverified · Desktop', async () => {
  const d = derive(NAMES[2], 11);
  const nav = d.c.findOne(n => n.name === 'Navigation'); const TOP = Math.round(nav.y + nav.height);
  const nt = noticeSet.children.find(v => v.name === 'Device=Desktop').createInstance(); nt.name = 'Page notice'; d.c.appendChild(nt); nt.x = 0; nt.y = TOP;
  const NH = Math.round(nt.height);
  d.lp.y += NH; d.lp.resize(d.lp.width, d.lp.height - NH); d.th.y += NH; d.th.resize(d.th.width, d.th.height - NH);
  const kids = d.ms.children.slice(); for (const k of kids) if (/Mine/.test(k.name)) k.remove();
  const theirs = d.ms.children.filter(k => /Theirs/.test(k.name));
  if (theirs[1]) await setIn(theirs[1], 'Message text', 'Could you also send a short video of each player?');
  swapComposer(d.c, 'Disabled');
  report.info.unverified = 'notice ' + Math.round(nt.width) + 'x' + NH + ' at y ' + TOP + ' · text: ' + nt.findOne(n => n.name === 'Text').characters + ' · list ' + Math.round(d.lp.height) + ' thread ' + Math.round(d.th.height) + ' · messages ' + d.ms.children.map(k => k.name).join(', ');
});
await step('fit, widen Web, checks', async () => {
  let right = 0, bottom = 0; for (const ch of msgSec.children) { right = Math.max(right, ch.x + ch.width); bottom = Math.max(bottom, ch.y + ch.height); }
  msgSec.resizeWithoutConstraints(Math.ceil(right + 80), Math.ceil(bottom + 80)); web.appendChild(msgSec);
  const need = Math.ceil(msgSec.x + msgSec.width + 80 - web.width);
  report.info.webBefore = Math.round(web.width) + 'x' + Math.round(web.height);
  if (need > 0) {
    const oldRight = web.x + web.width; web.resizeWithoutConstraints(web.width + need, web.height);
    const moved = []; for (const o of p02.children) { if (o !== web && o.x >= oldRight - 1) { o.x += need; moved.push(o.name); } }
    report.info.webWidened = need + ' px, moved: ' + moved.join(', ');
  } else report.info.webWidened = 'no';
  report.info.webAfter = Math.round(web.width) + 'x' + Math.round(web.height);
  const pages = msgSec.children.filter(n => n.type === 'FRAME');
  report.info.pages = pages.map(p => p.name.replace('Messenger / ', '').replace(' · Desktop', '') + ' @' + Math.round(p.x)).join(' | ');
  const gray = [], unst = []; const walk = n => { if ('fills' in n && n.fills !== figma.mixed) n.fills.forEach(f => { if (f.type === 'SOLID' && Math.abs(f.color.r - .5) < .01 && Math.abs(f.color.g - .5) < .01 && Math.abs(f.color.b - .5) < .01 && !(f.boundVariables && f.boundVariables.color)) gray.push(n.name); }); if (n.type === 'TEXT' && !n.textStyleId) unst.push(n.name); if ('children' in n) n.children.forEach(walk); };
  pages.forEach(walk); report.info.pageGrayFills = gray.length ? gray.slice(0, 8) : 'none'; report.info.pageUnstyledText = unst.length ? unst.slice(0, 8) : 'none';
  const A = msgSec.absoluteBoundingBox, hits = []; for (const s of p02.children) { if (s === web || !s.absoluteBoundingBox) continue; const B = s.absoluteBoundingBox; if (A.x < B.x + B.width && B.x < A.x + A.width && A.y < B.y + B.height && B.y < A.y + A.height) hits.push(s.name); }
  report.info.platformOverlaps = hits.length ? hits : 'none';
  const sibs = []; for (const s of web.children) { if (s === msgSec || !s.absoluteBoundingBox) continue; const B = s.absoluteBoundingBox; if (A.x < B.x + B.width && B.x < A.x + A.width && A.y < B.y + B.height && B.y < A.y + A.height) sibs.push(s.name); }
  report.info.sectionOverlaps = sibs.length ? sibs : 'none';
  report.info.topLevel = p02.children.map(s => s.name + ' @' + Math.round(s.x) + ',' + Math.round(s.y) + ' ' + Math.round(s.width) + 'x' + Math.round(s.height)).join(' | ');
});
await figma.setCurrentPageAsync(startPage);
return report;
