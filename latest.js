// step 228 · Mobile map filter full screen (Map / Filters · Mobile): desktop Filters block cloned, stacked for 358 px

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
const btnSet = set01('Button'); const texts = await figma.getLocalTextStylesAsync(); const tstyle = (...names) => { for (const n of names) { const t = texts.find(x => x.name === n) || texts.find(x => x.name.indexOf(n) === 0); if (t) return t; } return null; };
const S_H4 = tstyle('Heading/H4'), S_LABEL = tstyle('Label/Default'); for (const x of [S_H4, S_LABEL]) await figma.loadFontAsync(x.fontName);
async function txt(str, style, cv) { const t = figma.createText(); await t.setTextStyleIdAsync(style.id); t.characters = str; t.fills = [P(V(cv))]; return t; }
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
const marker = (area, cx, cy, state, kind) => { kind = kind || 'Club'; const m = markerSet.children.find(c => c.name === 'Kind=' + kind + ', State=' + state); if (!m) throw new Error('marker variant missing: ' + kind + ' ' + state); const i = m.createInstance(); i.name = state === 'Selected' ? 'Marker · ' + kind + ' · selected' : 'Marker · ' + kind; area.appendChild(i); place(i, cx, cy); return i; };
async function addSheet(f, kind, total, brk) {
  const v = sheetSet.children.find(c => c.name === 'Height=' + kind); const s = v.createInstance(); s.name = 'Bottom sheet · ' + kind; f.appendChild(s); s.x = 0; s.y = H - s.height;
  if (total) await setIn(s, 'Total', total); if (brk) await setIn(s, 'Breakdown', brk); return s;
}
async function addHeader(f) { for (const [src, nm] of [[tickerSrc, 'Ticker'], [navSrc, 'Navigation']]) { const c = src.clone(); c.name = nm; f.appendChild(c); c.x = 0; c.y = src === tickerSrc ? 0 : 36; } }
function addControls(f, above) { const c = ctrl.createInstance(); c.name = 'Map controls'; f.appendChild(c); c.x = W - 44 - 16; c.y = above - 96 - 16; }



const X_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web'); const dMap = web.children.find(n => n.type === 'SECTION' && n.name === 'Map');
const dDefault = dMap.children.find(n => n.name === 'Map / Default · Desktop'); const dFilters = dDefault && dDefault.findOne(n => n.type === 'FRAME' && n.name === 'Filters');
if (!dFilters) throw new Error('desktop Filters block not found');
const NAME = 'Map / Filters · Mobile';
await step(NAME, async () => {
  for (const k of mm.children.filter(n => n.name === NAME)) k.remove();
  const f = figma.createFrame(); f.name = NAME; f.resize(W, H); f.clipsContent = true; f.fills = [P(V('color/bg/surface'))]; mm.appendChild(f); f.x = slotX(7); f.y = 80;
  // header
  const hd = figma.createFrame(); hd.name = 'Header'; hd.resize(W, 64); hd.fills = []; f.appendChild(hd); hd.x = 0; hd.y = 0;
  const title = await txt('Filters', S_H4, 'color/text/primary'); title.name = 'Title'; hd.appendChild(title); title.x = 16; title.y = Math.round((64 - title.height) / 2);
  const cl = figma.createFrame(); cl.name = 'Close'; cl.layoutMode = 'NONE'; cl.resize(40, 40); cl.fills = [P(V('color/bg/subtle'))]; for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) cl.setBoundVariable(k, V('radius/full'));
  const xi = figma.createNodeFromSvg(X_SVG); xi.name = 'Icon'; xi.fills = []; xi.resize(20, 20); const walk = x => { if ('children' in x) x.children.forEach(walk); if (x.type !== 'FRAME' && x.type !== 'GROUP' && x.strokes && x.strokes.length) x.strokes = [P(V('color/icon/default'))]; }; walk(xi);
  cl.appendChild(xi); xi.x = 10; xi.y = 10; hd.appendChild(cl); cl.x = W - 16 - 40; cl.y = 12;
  const rule = figma.createRectangle(); rule.name = 'Divider'; rule.resize(W, 1); rule.fills = [P(V('color/border/default'))]; hd.appendChild(rule); rule.x = 0; rule.y = 63;
  // filters block cloned from desktop, stacked
  const fl = dFilters.clone(); fl.name = 'Filters'; f.appendChild(fl); fl.x = 16; fl.y = 88;
  const sw = fl.findOne(n => n.name === 'Type switcher'); const sel = fl.findOne(n => n.name === 'Selects');
  report.info.beforeFilters = fl.layoutMode + ' ' + Math.round(fl.width) + 'x' + Math.round(fl.height) + ' kids ' + fl.children.map(c => c.name).join(',');
  fl.resize(358, fl.height); fl.primaryAxisSizingMode = 'AUTO';
  if (sw) sw.layoutAlign = 'STRETCH';
  if (sel) { sel.layoutMode = 'VERTICAL'; sel.layoutAlign = 'STRETCH'; sel.primaryAxisSizingMode = 'AUTO'; sel.counterAxisSizingMode = 'FIXED'; sel.resize(358, sel.height); sel.primaryAxisSizingMode = 'AUTO'; for (const c of sel.children) { c.layoutAlign = 'STRETCH'; if ('layoutSizingHorizontal' in c) c.layoutSizingHorizontal = 'FILL'; } }
  // bottom bar
  const bar = figma.createFrame(); bar.name = 'Action bar'; bar.layoutMode = 'VERTICAL'; bar.counterAxisSizingMode = 'FIXED'; bar.primaryAxisSizingMode = 'AUTO'; bar.resize(W, 100); bar.primaryAxisSizingMode = 'AUTO'; bar.itemSpacing = 8; bar.paddingTop = 16; bar.paddingBottom = 24; bar.paddingLeft = 16; bar.paddingRight = 16; bar.counterAxisAlignItems = 'CENTER'; bar.fills = [P(V('color/bg/surface'))]; bar.strokes = [P(V('color/border/default'))]; bar.strokeWeight = 1; bar.strokeAlign = 'INSIDE'; bar.strokeTopWeight = 1; bar.strokeBottomWeight = 0; bar.strokeLeftWeight = 0; bar.strokeRightWeight = 0;
  f.appendChild(bar);
  const mk = async (label, style) => { const v = btnSet.children.find(c => new RegExp('Style=' + style).test(c.name) && /State=Default/.test(c.name)) || btnSet.children[0]; const b = v.createInstance(); b.name = 'Button · ' + label; const cp = b.componentProperties || {}; const lk = Object.keys(cp).find(k => /^Label/.test(k)); const ik = Object.keys(cp).find(k => /^Icon/.test(k)); if (lk) b.setProperties({ [lk]: label }); if (ik) b.setProperties({ [ik]: false }); const bt = b.findOne(n => n.type === 'TEXT'); if (bt) await setText(bt, label); return b; };
  const show = await mk('Show 20 clubs', 'Primary'); bar.appendChild(show); show.layoutAlign = 'STRETCH';
  const clr = await mk('Clear all', 'Secondary'); bar.appendChild(clr); clr.layoutAlign = 'STRETCH';
  bar.x = 0; bar.y = H - bar.height;
  report.info.filters = Math.round(fl.width) + 'x' + Math.round(fl.height) + ' ends y' + Math.round(fl.y + fl.height) + ', bar starts y' + Math.round(bar.y);
  report.info.bar = Math.round(bar.height);
  report.info.overlapsBar = (fl.y + fl.height) > bar.y;
});
await figma.setCurrentPageAsync(p02);
let r = 0, b = 0; for (const ch of mm.children) { r = Math.max(r, ch.x + ch.width); b = Math.max(b, ch.y + ch.height); }
mm.resizeWithoutConstraints(Math.max(1800, Math.ceil(r + 80)), Math.max(1400, Math.ceil(b + 80)));
const scr = mm.children.filter(n => n.name === NAME);
report.info.section = Math.round(mm.width) + 'x' + Math.round(mm.height);
report.info.grayFills = scr.flatMap(s => s.findAll(n => 'fills' in n && Array.isArray(n.fills) && n.fills.some(f => f.type === 'SOLID' && Math.round(f.color.r * 255) === 128 && Math.round(f.color.g * 255) === 128 && Math.round(f.color.b * 255) === 128 && !(n.boundVariables && n.boundVariables.fills))).map(n => n.name));
report.info.unstyledText = scr.reduce((a, s) => a + s.findAll(n => n.type === 'TEXT' && !n.textStyleId && !n.getRangeTextStyleId(0, 1)).length, 0);
return report;
