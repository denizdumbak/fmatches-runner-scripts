// step 203 · (202'nin duzeltmesi: resize() sonrasi AUTO yukseklik; cip satirlari, ozet, sonuc satiri kesiliyordu) 02 › Web › Map: "Map / Default · Desktop" (tam ekran harita, Avrupa, sayili cluster'lar, 400 px panel, Legend, zoom kontrolleri); yeni component'ler Map result row ve Map controls (01 › 7 · Map); cluster sayisi ortalama duzeltmesi

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync(); await figma.setCurrentPageAsync(p02);
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const PAD = (n, t, r, b, l) => { n.setBoundVariable('paddingTop', V(t)); n.setBoundVariable('paddingRight', V(r)); n.setBoundVariable('paddingBottom', V(b)); n.setBoundVariable('paddingLeft', V(l)); };
const GAP = (n, v) => n.setBoundVariable('itemSpacing', V(v));
const RAD = (n, v) => { for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) n.setBoundVariable(k, V(v)); };
const hex = p => p && p.color ? '#' + [p.color.r, p.color.g, p.color.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('') : '-';
const effects = await figma.getLocalEffectStylesAsync(); const effect = nm => effects.find(s => s.name === nm);
const texts = await figma.getLocalTextStylesAsync();
const tstyle = (...names) => { for (const n of names) { const s = texts.find(t => t.name === n) || texts.find(t => t.name.indexOf(n) === 0); if (s) return s; } return null; };
const S_COUNT = tstyle('Heading/H4'), S_LABEL = tstyle('Label/Default'), S_SMALL = tstyle('Label/Small'), S_STRONG = tstyle('Label/Default Strong', 'Label/Default');
for (const s of [S_COUNT, S_LABEL, S_SMALL, S_STRONG]) await figma.loadFontAsync(s.fontName);
async function txt(str, style, colorVar) { const t = figma.createText(); await t.setTextStyleIdAsync(style.id); t.characters = str; t.fills = [P(V(colorVar))]; return t; }
async function setText(node, str) { const f = node.fontName === figma.mixed ? node.getRangeFontName(0, 1) : node.fontName; await figma.loadFontAsync(f); node.characters = str; }
const set01 = nm => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === nm);
const sec7 = p01.children.find(n => n.type === 'SECTION' && /^7 /.test(n.name));
const clusterSet = set01('Map cluster'), legendComp = sec7.children.find(n => n.name === 'Legend');
const created = {};

// 1. Cluster sayisi metni: sabit genislik, ortali (instance'ta sayi degisince kaymasin)
await step('cluster count centering', async () => {
  for (const c of clusterSet.children) {
    const t = c.findOne(n => n.type === 'TEXT' && n.name === 'Count'); if (!t) continue;
    t.textAutoResize = 'NONE'; t.textAlignHorizontal = 'CENTER'; t.resize(c.width, t.height); t.x = 0; t.y = (c.height - t.height) / 2;
  }
});

// 2. Yeni component'ler (01 › 7 · Map)
const ICO = { plus: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>', minus: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg>' };
await step('Map controls component', async () => {
  const old = sec7.children.find(n => n.name === 'Map controls'); if (old) old.remove();
  const c = figma.createComponent(); c.name = 'Map controls'; c.layoutMode = 'VERTICAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO'; c.fills = []; GAP(c, 'spacing/xs');
  for (const k of ['plus', 'minus']) {
    const b = figma.createFrame(); b.name = k === 'plus' ? 'Zoom in' : 'Zoom out'; b.layoutMode = 'NONE'; b.resize(44, 44); RAD(b, 'radius/md'); b.fills = [P(V('color/bg/surface'))];
    const e = effect('Shadow/Card'); if (e) await b.setEffectStyleIdAsync(e.id);
    const ic = figma.createNodeFromSvg(ICO[k]); ic.name = 'Icon'; ic.fills = []; ic.resize(20, 20); ic.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
    const walk = x => { if ('children' in x) x.children.forEach(walk); if (x.type !== 'FRAME' && x.type !== 'GROUP') { if (x.strokes && x.strokes.length) x.strokes = [P(V('color/icon/default'))]; x.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; } };
    walk(ic); b.appendChild(ic); ic.x = 12; ic.y = 12; c.appendChild(b);
  }
  c.description = 'Map controls. Zoom in and out, bottom right of the map.';
  sec7.appendChild(c); const legend = sec7.children.find(n => n.name === 'Legend'); c.x = 80; c.y = legend.y + legend.height + 80; created.controls = c;
});
await step('Map result row component', async () => {
  const old = sec7.children.find(n => n.name === 'Map result row'); if (old) old.remove();
  const crestSet = set01('Club crest'); const crestV = crestSet.children.filter(v => !/No crest/.test(v.name));
  report.info.crestVariants = crestV.map(v => v.name).slice(0, 8);
  const r = figma.createComponent(); r.name = 'Map result row'; r.layoutMode = 'HORIZONTAL'; r.primaryAxisSizingMode = 'FIXED'; r.counterAxisSizingMode = 'AUTO'; r.counterAxisAlignItems = 'CENTER'; r.resize(360, 64); r.counterAxisSizingMode = 'AUTO';
  GAP(r, 'spacing/md'); PAD(r, 'spacing/sm', 'spacing/xs', 'spacing/sm', 'spacing/xs'); r.fills = [];
  r.strokes = [P(V('color/border/default'))]; r.strokeTopWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.strokeBottomWeight = 1;
  const crest = crestV[0].createInstance(); crest.name = 'Club crest'; r.appendChild(crest); report.info.crestSize = Math.round(crest.width) + 'x' + Math.round(crest.height);
  const col = figma.createFrame(); col.name = 'Text'; col.layoutMode = 'VERTICAL'; col.primaryAxisSizingMode = 'AUTO'; col.counterAxisSizingMode = 'AUTO'; col.fills = []; GAP(col, 'spacing/2xs');
  const n = await txt('Riverside FC', S_STRONG, 'color/text/primary'); n.name = 'Name'; col.appendChild(n);
  const m = await txt('Third Division · Tier 3 · Riverside', S_SMALL, 'color/text/secondary'); m.name = 'Meta'; col.appendChild(m);
  r.appendChild(col); col.layoutGrow = 1;
  r.description = 'Map result row. One object in view, in the left panel; hover highlights its marker on the map.';
  sec7.appendChild(r); r.x = 80 + 140; r.y = created.controls.y; created.row = r;
});

// 3. Sayfa
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web'); const mapSec = web.children.find(n => n.type === 'SECTION' && n.name === 'Map');
await step('Map / Default · Desktop', async () => {
  const oldP = mapSec.children.find(n => n.name === 'Map / Default · Desktop'); if (oldP) oldP.remove();
  let src = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player · Desktop');
  if (!src) src = p02.findOne(n => n.type === 'FRAME' && /^Profiles \/ Player/.test(n.name) && Math.round(n.width) === 1440);
  if (!src) throw new Error('profile source page missing');
  report.info.srcChildren = src.children.slice(0, 3).map(c => c.name + ' [' + c.type + '] ' + Math.round(c.height));
  const page = figma.createFrame(); page.name = 'Map / Default · Desktop'; page.layoutMode = 'VERTICAL'; page.primaryAxisSizingMode = 'FIXED'; page.counterAxisSizingMode = 'FIXED'; page.resize(1440, 900); page.fills = [P(V('color/bg/canvas'))]; page.clipsContent = true; GAP(page, 'spacing/2xs'); page.itemSpacing = 0;
  mapSec.appendChild(page); page.x = 80; page.y = 80;
  const tk = src.children[0].clone(), hd = src.children[1].clone(); page.appendChild(tk); page.appendChild(hd); tk.layoutAlign = 'STRETCH'; hd.layoutAlign = 'STRETCH';
  const W = 1440, H = Math.round(900 - tk.height - hd.height); report.info.mapAreaH = H;
  const area = figma.createFrame(); area.name = 'Map area'; area.layoutMode = 'NONE'; area.resize(W, H); area.clipsContent = true; area.fills = [];
  page.appendChild(area); area.layoutAlign = 'STRETCH'; area.resize(W, H);
  const img = await figma.createImageAsync('https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/img/map/europe-z5.png');
  const base = figma.createRectangle(); base.name = 'Map base · Europe'; base.resize(W, H); base.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: img.hash }]; area.appendChild(base); base.x = 0; base.y = 0;
  const tint = figma.createRectangle(); tint.name = 'Map tint'; tint.resize(W, H); tint.fills = [P(V('color/bg/surface'))]; tint.opacity = 0.22; area.appendChild(tint); tint.x = 0; tint.y = 0;
  // cluster'lar
  const sc = Math.max(W / 1830, H / 1000), ox = (W - 1830 * sc) / 2, oy = (H - 1000 * sc) / 2;
  const CL = [[730, 350, 214], [560, 290, 31], [830, 490, 276], [665, 830, 251], [1040, 430, 389], [905, 400, 143], [1100, 740, 241], [1300, 350, 98], [1160, 520, 64], [1160, 170, 72], [1300, 660, 56], [1530, 640, 33], [1640, 470, 40], [1700, 850, 120], [1440, 900, 41], [1090, 70, 45]];
  const vOf = nm => clusterSet.children.find(c => c.name === 'Size=' + nm);
  for (const [x, y, n] of CL) {
    const sz = n >= 200 ? 'L' : n >= 50 ? 'M' : 'S'; const inst = vOf(sz).createInstance(); inst.name = 'Cluster · ' + n; area.appendChild(inst);
    const t = inst.findOne(k => k.type === 'TEXT'); if (t) await setText(t, String(n));
    inst.x = Math.round(ox + x * sc - inst.width / 2); inst.y = Math.round(oy + y * sc - inst.height / 2);
  }
  // legend + zoom
  const lg = legendComp.createInstance(); lg.name = 'Legend'; area.appendChild(lg); lg.x = W - 16 - lg.width; lg.y = 16;
  const zc = created.controls.createInstance(); zc.name = 'Map controls'; area.appendChild(zc); zc.x = W - 16 - zc.width; zc.y = H - 16 - zc.height;
  // panel
  const panel = figma.createFrame(); panel.name = 'Map panel'; panel.layoutMode = 'VERTICAL'; panel.primaryAxisSizingMode = 'FIXED'; panel.counterAxisSizingMode = 'FIXED'; panel.resize(400, H - 32); panel.clipsContent = true;
  PAD(panel, 'spacing/lg', 'spacing/lg', 'spacing/lg', 'spacing/lg'); GAP(panel, 'spacing/md'); RAD(panel, 'radius/lg'); panel.fills = [P(V('color/bg/surface'))];
  const pe = effect('Shadow/Raised'); if (pe) await panel.setEffectStyleIdAsync(pe.id);
  area.appendChild(panel); panel.x = 16; panel.y = 16;
  const ffSet = set01('Form field'), chipSet = set01('Filter chip');
  report.info.chipVariants = chipSet.children.map(c => c.name);
  const chipOn = chipSet.children.find(c => /Selected|Active|On/i.test(c.name)) || chipSet.children[0], chipOff = chipSet.children.find(c => /Default/i.test(c.name)) || chipSet.children[0];
  const ffV = nm => ffSet.children.find(c => c.name.indexOf('Type=' + nm) === 0 && /State=Default/.test(c.name));
  async function field(type, label, value, w) {
    const f = ffV(type).createInstance(); f.name = 'Field · ' + (label || 'Search');
    const l = f.findOne(n => n.type === 'TEXT' && n.name === 'Label'), v = f.findOne(n => n.type === 'TEXT' && n.name === 'Value');
    if (label && l) await setText(l, label); else if (l) l.visible = false;
    if (v) await setText(v, value);
    const h = f.findOne(n => n.name === 'Helper'); if (h) h.visible = false; const er = f.findOne(n => n.name === 'Error message'); if (er) er.visible = false;
    if (w) f.resize(w, f.height); return f;
  }
  async function chipRow(name, label, items, onSet) {
    const g = figma.createFrame(); g.name = name; g.layoutMode = 'VERTICAL'; g.primaryAxisSizingMode = 'AUTO'; g.counterAxisSizingMode = 'AUTO'; g.fills = []; GAP(g, 'spacing/xs');
    const lb = await txt(label, S_SMALL, 'color/text/secondary'); lb.name = 'Group label'; g.appendChild(lb);
    const row = figma.createFrame(); row.name = 'Chips'; row.layoutMode = 'HORIZONTAL'; row.layoutWrap = 'WRAP'; row.primaryAxisSizingMode = 'FIXED'; row.counterAxisSizingMode = 'AUTO'; row.resize(352, 32); row.counterAxisSizingMode = 'AUTO'; row.fills = []; GAP(row, 'spacing/xs'); row.counterAxisSpacing = 8;
    g.appendChild(row);
    for (const it of items) { const c = (onSet.indexOf(it) >= 0 ? chipOn : chipOff).createInstance(); c.name = 'Chip · ' + it; const t = c.findOne(n => n.type === 'TEXT'); if (t) await setText(t, it); row.appendChild(c); }
    return g;
  }
  const search = await field('Text', '', 'Search city, club or facility', 0); panel.appendChild(search); search.layoutAlign = 'STRETCH';
  const filters = figma.createFrame(); filters.name = 'Filters'; filters.layoutMode = 'VERTICAL'; filters.primaryAxisSizingMode = 'AUTO'; filters.counterAxisSizingMode = 'AUTO'; filters.fills = []; GAP(filters, 'spacing/md');
  panel.appendChild(filters); filters.layoutAlign = 'STRETCH';
  filters.appendChild(await chipRow('Show', 'Show', ['Clubs', 'Stadiums', 'Events', 'Match requests'], ['Clubs', 'Stadiums', 'Events', 'Match requests']));
  const sel = figma.createFrame(); sel.name = 'Selects'; sel.layoutMode = 'HORIZONTAL'; sel.primaryAxisSizingMode = 'AUTO'; sel.counterAxisSizingMode = 'AUTO'; sel.fills = []; GAP(sel, 'spacing/sm');
  sel.appendChild(await field('Select', 'Country', 'All countries', 170)); sel.appendChild(await field('Select', 'League', 'All leagues', 170)); filters.appendChild(sel);
  filters.appendChild(await chipRow('Event type', 'Event type', ['Match', 'Tournament', 'Trial'], []));
  filters.appendChild(await chipRow('Tier', 'Tier', ['1', '2', '3', '4', '5'], []));
  const sum = figma.createFrame(); sum.name = 'Summary'; sum.layoutMode = 'HORIZONTAL'; sum.primaryAxisSizingMode = 'FIXED'; sum.counterAxisSizingMode = 'AUTO'; sum.counterAxisAlignItems = 'CENTER'; sum.resize(352, 24); sum.counterAxisSizingMode = 'AUTO'; sum.fills = [];
  const sL = figma.createFrame(); sL.name = 'Counts'; sL.layoutMode = 'VERTICAL'; sL.primaryAxisSizingMode = 'AUTO'; sL.counterAxisSizingMode = 'AUTO'; sL.fills = []; GAP(sL, 'spacing/2xs');
  const s1 = await txt('1,543 in view', S_STRONG, 'color/text/primary'); s1.name = 'Total'; sL.appendChild(s1);
  const s2 = await txt('1,284 clubs · 212 stadiums · 38 events · 9 requests', S_SMALL, 'color/text/secondary'); s2.name = 'Breakdown'; sL.appendChild(s2);
  sum.appendChild(sL); sL.layoutGrow = 1; const clr = await txt('Clear all', S_LABEL, 'color/text/brand'); clr.name = 'Clear all'; sum.appendChild(clr);
  panel.appendChild(sum); sum.layoutAlign = 'STRETCH';
  const list = figma.createFrame(); list.name = 'Results'; list.layoutMode = 'VERTICAL'; list.primaryAxisSizingMode = 'AUTO'; list.counterAxisSizingMode = 'AUTO'; list.fills = [];
  panel.appendChild(list); list.layoutAlign = 'STRETCH';
  const crestV = set01('Club crest').children.filter(v => !/No crest/.test(v.name));
  const ROWS = [['Riverside FC', 'Third Division · Tier 3 · Riverside'], ['Northgate Athletic', 'Second Division · Tier 2 · Northgate'], ['Coastal United', 'Third Division · Tier 3 · Port Bay'], ['Harbour City', 'First Division · Tier 1 · Harbour City'], ['Westfield Rovers', 'Fourth Division · Tier 4 · Westfield'], ['Hillside Town', 'Third Division · Tier 3 · Hillside']];
  for (let i = 0; i < ROWS.length; i++) {
    const r = created.row.createInstance(); r.name = 'Result · ' + ROWS[i][0]; list.appendChild(r); r.layoutAlign = 'STRETCH';
    const nm = r.findOne(n => n.type === 'TEXT' && n.name === 'Name'), mt = r.findOne(n => n.type === 'TEXT' && n.name === 'Meta');
    if (nm) await setText(nm, ROWS[i][0]); if (mt) await setText(mt, ROWS[i][1]);
    const cr = r.findOne(n => n.type === 'INSTANCE' && n.name === 'Club crest'); if (cr && crestV[i % crestV.length]) cr.swapComponent(crestV[i % crestV.length]);
  }
  const all = await txt('Show all 1,543 results', S_LABEL, 'color/text/brand'); all.name = 'Show all'; panel.appendChild(all);
  // tasma: sigmayan satirlari sil
  const content = () => panel.children.reduce((a, c) => a + c.height, 0) + (panel.children.length - 1) * panel.itemSpacing + panel.paddingTop + panel.paddingBottom;
  let guard = 0; while (content() > panel.height && list.children.length > 1 && guard++ < 10) list.children[list.children.length - 1].remove();
  report.info.panel = Math.round(content()) + ' / ' + Math.round(panel.height) + ' · rows ' + list.children.length;
  report.info.childBottoms = panel.children.map(c => c.name + ' ' + Math.round(c.y + c.height)).join(' | '); report.info.fixedPartsH = Math.round(search.height + filters.height + sum.height + all.height);
  created.page = page;
});

// 4. Kontrol
await step('check', async () => {
  const page = created.page; const gray = [], unst = []; const walk = n => { if ('fills' in n && n.fills !== figma.mixed) n.fills.forEach(f => { if (f.type === 'SOLID' && hex(f) === '#808080') gray.push(n.name); }); if (n.type === 'TEXT' && !n.textStyleId) unst.push(n.name); if ('children' in n) n.children.forEach(walk); };
  walk(page); report.info.grayFills = gray.length ? gray.slice(0, 8) : 'none'; report.info.unstyledText = unst.length ? unst.slice(0, 8) : 'none';
  const need = Math.ceil(page.y + page.height + 80); if (need > mapSec.height) mapSec.resizeWithoutConstraints(mapSec.width, need);
  let right = 0, bottom = 0; for (const ch of sec7.children) { right = Math.max(right, ch.x + ch.width); bottom = Math.max(bottom, ch.y + ch.height); }
  sec7.resizeWithoutConstraints(Math.max(1200, Math.ceil(right + 80)), Math.ceil(bottom + 80));
  report.info.page = Math.round(page.width) + 'x' + Math.round(page.height);
});
return report;
