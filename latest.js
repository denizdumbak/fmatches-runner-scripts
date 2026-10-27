// step 226 · Mobile map group 1: Map / Default · Mobile (Half), Club card · Mobile (Handle + card), List · Mobile (Full); move Map empty state into 7 · Map

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync(); await figma.setCurrentPageAsync(p02);
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
async function setText(node, str) { const f = node.fontName === figma.mixed ? node.getRangeFontName(0, 1) : node.fontName; await figma.loadFontAsync(f); node.characters = str; }
const setIn = async (root, nm, str) => { const t = root.findOne(n => n.type === 'TEXT' && n.name === nm); if (t) { await setText(t, str); return true; } return false; };
const set01 = nm => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === nm);
const markerSet = set01('Map marker'), clusterSet = set01('Map cluster'), cardSet = set01('Map card'), sheetSet = set01('Bottom sheet');
const ctrl = p01.findOne(n => n.type === 'COMPONENT' && n.name === 'Map controls');
if (!markerSet || !clusterSet || !cardSet || !sheetSet || !ctrl) throw new Error('map components missing');
const mob = p02.children.find(n => n.type === 'SECTION' && /^Mobile/.test(n.name)); const mm = mob.children.find(n => n.type === 'SECTION' && n.name === 'Map');
const sample = mob.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Manager · Mobile');
if (!mm || !sample) throw new Error('Mobile Map section or sample screen missing');
const tickerSrc = sample.children.find(n => n.name === 'Ticker'), navSrc = sample.children.find(n => n.name === 'Navigation');
const IMG = f => 'https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/img/map/' + f;
const imgs = { europe: await figma.createImageAsync(IMG('europe-z5-v2.png')), city: await figma.createImageAsync(IMG('city-z12-v2.png')) };
const slotX = i => 80 + i * 470;
const W = 390, H = 844, TOP = 101, AH = H - TOP;
const place = (n, cx, cy) => { n.x = Math.round(cx - n.width / 2); n.y = Math.round(cy - n.height / 2); };

async function buildScreen(name, i, mapKind, sheetKind) {
  for (const k of mm.children.filter(n => n.name === name)) k.remove();
  const f = figma.createFrame(); f.name = name; f.resize(W, H); f.clipsContent = true; f.fills = [P(V('color/bg/surface'))]; mm.appendChild(f); f.x = slotX(i); f.y = 80;
  const area = figma.createFrame(); area.name = 'Map area'; area.resize(W, AH); area.clipsContent = true; area.fills = []; f.appendChild(area); area.x = 0; area.y = TOP;
  const base = figma.createRectangle(); base.name = 'Map base · ' + (mapKind === 'europe' ? 'Europe' : 'Berlin'); base.resize(W, AH); base.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: imgs[mapKind].hash }]; area.appendChild(base); base.x = 0; base.y = 0;
  const tint = figma.createRectangle(); tint.name = 'Map tint'; tint.resize(W, AH); tint.fills = [P(V('color/bg/surface'))]; tint.opacity = 0.22; area.appendChild(tint); tint.x = 0; tint.y = 0;
  return { f, area };
}
const cluster = async (area, cx, cy, n) => { const sz = n >= 200 ? 'L' : n >= 50 ? 'M' : 'S'; const i = clusterSet.children.find(c => c.name === 'Size=' + sz).createInstance(); i.name = 'Cluster · ' + n; area.appendChild(i); await setIn(i, 'Label', String(n)) || (i.findOne(k => k.type === 'TEXT') && await setText(i.findOne(k => k.type === 'TEXT'), String(n))); place(i, cx, cy); return i; };
const marker = (area, cx, cy, state) => { const m = markerSet.children.find(c => c.name === 'Kind=Club, State=' + state); const i = m.createInstance(); i.name = state === 'Selected' ? 'Marker · Club · selected' : 'Marker · Club'; area.appendChild(i); place(i, cx, cy); return i; };
async function addSheet(f, kind, total, brk) {
  const v = sheetSet.children.find(c => c.name === 'Height=' + kind); const s = v.createInstance(); s.name = 'Bottom sheet · ' + kind; f.appendChild(s); s.x = 0; s.y = H - s.height;
  if (total) await setIn(s, 'Total', total); if (brk) await setIn(s, 'Breakdown', brk); return s;
}
async function addHeader(f) { for (const [src, nm] of [[tickerSrc, 'Ticker'], [navSrc, 'Navigation']]) { const c = src.clone(); c.name = nm; f.appendChild(c); c.x = 0; c.y = src === tickerSrc ? 0 : 36; } }
function addControls(f, above) { const c = ctrl.createInstance(); c.name = 'Map controls'; f.appendChild(c); c.x = W - 44 - 16; c.y = above - 96 - 16; }

await step('Map / Default · Mobile', async () => {
  const { f, area } = await buildScreen('Map / Default · Mobile', 0, 'europe');
  for (const [x, y, n] of [[96, 120, 439], [262, 96, 127], [320, 250, 86], [84, 330, 212], [210, 210, 41], [160, 400, 27]]) await cluster(area, x, y, n);
  const s = await addSheet(f, 'Half', '1,496 clubs in view', 'Grouped while zoomed out'); addControls(f, s.y); await addHeader(f);
  report.info.defaultSheet = s.name + ' y' + Math.round(s.y);
});
await step('Map / Club card · Mobile', async () => {
  const { f, area } = await buildScreen('Map / Club card · Mobile', 1, 'city');
  for (const [x, y] of [[60, 60], [310, 70], [150, 120], [60, 210], [330, 230], [250, 40], [40, 320], [345, 350], [120, 560], [290, 560], [60, 600]]) marker(area, x, y, 'Default');
  await cluster(area, 200, 590, 4); await cluster(area, 330, 470, 2);
  marker(area, 195, 215, 'Selected');
  const card = cardSet.children.find(c => c.name === 'Kind=Club').createInstance(); card.name = 'Map card · Club'; f.appendChild(card); card.x = Math.round((W - card.width) / 2); card.y = TOP + 255;
  const s = await addSheet(f, 'Handle'); addControls(f, s.y); await addHeader(f);
  report.info.card = Math.round(card.x) + ',' + Math.round(card.y) + ' ' + Math.round(card.width) + 'x' + Math.round(card.height);
});
await step('Map / List · Mobile', async () => {
  const { f, area } = await buildScreen('Map / List · Mobile', 2, 'city');
  for (const [x, y] of [[60, 20], [310, 30], [150, 36]]) marker(area, x, y, 'Default');
  const s = await addSheet(f, 'Full'); await addHeader(f);
});
await step('Map empty state into 7 · Map', async () => {
  await figma.setCurrentPageAsync(p01);
  const sec7 = p01.children.find(n => n.type === 'SECTION' && /^7 /.test(n.name)); const emp = p01.children.find(n => n.type === 'COMPONENT' && n.name === 'Map empty state');
  if (!emp) { report.info.empty = 'already inside a section or missing'; return; }
  const sh = sec7.children.find(n => n.name === 'Bottom sheet'); const ex = emp.absoluteBoundingBox, sb = sec7.absoluteBoundingBox;
  sec7.appendChild(emp); emp.x = 80; emp.y = sh ? Math.ceil(sh.y + sh.height + 120) : 80;
  let r7 = 0, b7 = 0; for (const ch of sec7.children) { r7 = Math.max(r7, ch.x + ch.width); b7 = Math.max(b7, ch.y + ch.height); }
  sec7.resizeWithoutConstraints(Math.max(sec7.width, Math.ceil(r7 + 80)), Math.ceil(b7 + 80)); report.info.empty = 'moved to ' + Math.round(emp.x) + ',' + Math.round(emp.y);
  await figma.setCurrentPageAsync(p02);
});
await figma.setCurrentPageAsync(p02);
// fit mobile Map section and self-check
let r = 0, b = 0; for (const ch of mm.children) { r = Math.max(r, ch.x + ch.width); b = Math.max(b, ch.y + ch.height); }
mm.resizeWithoutConstraints(Math.max(1800, Math.ceil(r + 80)), Math.max(1400, Math.ceil(b + 80)));
const scr = mm.children.filter(n => /Mobile$/.test(n.name));
report.info.screens = scr.map(n => n.name + ' ' + Math.round(n.width) + 'x' + Math.round(n.height) + ' @' + Math.round(n.x) + ',' + Math.round(n.y) + ' kids ' + n.children.length).join(' | ');
report.info.section = Math.round(mm.width) + 'x' + Math.round(mm.height);
report.info.grayFills = scr.flatMap(s => s.findAll(n => 'fills' in n && Array.isArray(n.fills) && n.fills.some(f => f.type === 'SOLID' && Math.round(f.color.r * 255) === 128 && Math.round(f.color.g * 255) === 128 && Math.round(f.color.b * 255) === 128 && !(n.boundVariables && n.boundVariables.fills))).map(n => n.name));
report.info.unstyledText = scr.reduce((a, s) => a + s.findAll(n => n.type === 'TEXT' && !n.textStyleId && !n.getRangeTextStyleId(0, 1)).length, 0);
return report;
