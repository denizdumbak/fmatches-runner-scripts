// step 214 · Map key gizlenebilir (Collapse dugmesi + Map key button) + Events sayfasi: kart Map key'in ustunde, cakisma yok, Map key gizli

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
const S_H4 = tstyle('Heading/H4'), S_LABEL = tstyle('Label/Default'), S_SMALL = tstyle('Label/Small');
for (const s of [S_H4, S_LABEL, S_SMALL]) await figma.loadFontAsync(s.fontName);
async function txt(str, style, colorVar) { const t = figma.createText(); await t.setTextStyleIdAsync(style.id); t.characters = str; t.fills = [P(V(colorVar))]; return t; }
async function setText(node, str) { const f = node.fontName === figma.mixed ? node.getRangeFontName(0, 1) : node.fontName; await figma.loadFontAsync(f); node.characters = str; }
const set01 = nm => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === nm);
const sec7 = p01.children.find(n => n.type === 'SECTION' && /^7 /.test(n.name));
const markerSet = set01('Map marker'), clusterSet = set01('Map cluster');
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web'); const mapSec = web.children.find(n => n.type === 'SECTION' && n.name === 'Map');
const created = {};
const mv = (kind, state) => markerSet.children.find(c => c.name === 'Kind=' + kind + ', State=' + state);
const setIn = async (root, nm, str) => { const t = root.findOne(n => n.type === 'TEXT' && n.name === nm); if (t) await setText(t, str); return !!t; };


const ICON_UP = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>';
const ICON_LIST = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h.01M3 18h.01M3 6h.01M8 12h13M8 18h13M8 6h13"/></svg>';
function mkIcon(svg, colorVar, size) {
  const ic = figma.createNodeFromSvg(svg); ic.name = 'Icon'; ic.fills = []; ic.resize(size, size); ic.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
  const walk = x => { if ('children' in x) x.children.forEach(walk); if (x.type !== 'FRAME' && x.type !== 'GROUP') { if (x.strokes && x.strokes.length) x.strokes = [P(V(colorVar))]; x.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; } };
  walk(ic); return ic;
}

// 1. Legend: gizleme dugmesi
await step('Legend collapse control', async () => {
  await figma.setCurrentPageAsync(p01);
  const lg = sec7.children.find(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && n.name === 'Legend'); if (!lg) throw new Error('Legend missing');
  const comps = lg.type === 'COMPONENT_SET' ? lg.children : [lg];
  for (const comp of comps) {
    for (const k of comp.findAll(n => n.name === 'Legend header' || n.name === 'Collapse')) { if (k.name === 'Collapse' && k.parent && k.parent.name === 'Legend header') continue; if (k.name === 'Collapse') k.remove(); }
    const oldH = comp.findOne(n => n.name === 'Legend header');
    if (oldH) { const t0 = oldH.findOne(n => n.type === 'TEXT'); const p0 = oldH.parent; const i0 = p0.children.indexOf(oldH); p0.insertChild(i0, t0); oldH.remove(); }
    const title = comp.findOne(n => n.type === 'TEXT' && n.characters === 'Map key'); if (!title) throw new Error('Map key title not found in ' + comp.name);
    const par = title.parent;
    const btn = figma.createFrame(); btn.name = 'Collapse'; btn.layoutMode = 'NONE'; btn.resize(32, 32); RAD(btn, 'radius/full'); btn.fills = [P(V('color/bg/subtle'))];
    const ic = mkIcon(ICON_UP, 'color/icon/default', 16); btn.appendChild(ic); ic.x = 8; ic.y = 8;
    const H = figma.createFrame(); H.name = 'Legend header'; H.layoutMode = 'HORIZONTAL'; H.primaryAxisSizingMode = 'FIXED'; H.counterAxisSizingMode = 'AUTO'; H.counterAxisAlignItems = 'CENTER'; H.fills = []; GAP(H, 'spacing/sm');
    const idx = par.children.indexOf(title); par.insertChild(idx, H); H.layoutAlign = 'STRETCH';
    H.appendChild(title); title.layoutGrow = 1; H.appendChild(btn);
    report.info['legendHeader ' + comp.name] = 'parent ' + par.name + ' ' + par.layoutMode + ' · size ' + Math.round(comp.width) + 'x' + Math.round(comp.height);
  }
  await figma.setCurrentPageAsync(p02);
});
await figma.setCurrentPageAsync(p02);

// 2. Map key button (gizlenmis hal)
await step('Map key button component', async () => {
  await figma.setCurrentPageAsync(p01);
  for (const k of sec7.children.filter(n => n.name === 'Map key button')) k.remove();
  const c = figma.createComponent(); c.name = 'Map key button'; c.layoutMode = 'HORIZONTAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO'; c.counterAxisAlignItems = 'CENTER';
  GAP(c, 'spacing/xs'); PAD(c, 'spacing/sm', 'spacing/md', 'spacing/sm', 'spacing/md'); RAD(c, 'radius/full'); c.fills = [P(V('color/bg/surface'))];
  const e = effect('Shadow/Raised'); if (e) await c.setEffectStyleIdAsync(e.id);
  c.appendChild(mkIcon(ICON_LIST, 'color/icon/default', 20));
  const t = await txt('Map key', S_LABEL, 'color/text/primary'); t.name = 'Label'; c.appendChild(t);
  const lg = sec7.children.find(n => n.name === 'Legend'); c.x = lg ? lg.x + lg.width + 80 : 80; c.y = lg ? lg.y : 80;
  c.description = 'Map key, hidden. The Map key box has a collapse button; once collapsed it is replaced by this button in the same corner. Click to open the key again. The choice is remembered per user.';
  created.keyBtn = c; report.info.keyButton = Math.round(c.width) + 'x' + Math.round(c.height);
  await figma.setCurrentPageAsync(p02);
});
await figma.setCurrentPageAsync(p02);

// 3. Events sayfasi: kart ustte, cakisma yok, Map key gizli
await step('Events page: card above key, key collapsed', async () => {
  const pg = mapSec.children.find(n => n.name === 'Map / Events · Desktop'); if (!pg) throw new Error('events page missing');
  const area = pg.findOne(n => n.name === 'Map area'); const lg = area.findOne(n => n.name === 'Legend');
  const card = area.findOne(n => /^Map card/.test(n.name)); const sel = area.findOne(n => n.name === 'Marker · Event · selected');
  const sx = 760, sy = 420;
  sel.x = Math.round(sx - sel.width / 2); sel.y = Math.round(sy - sel.height / 2); card.x = sx + 40; card.y = sy - 50;
  const cx0 = card.x - 24, cx1 = card.x + card.width + 24, cy0 = card.y - 24, cy1 = card.y + card.height + 24; const moved = [];
  for (const m of area.children.filter(n => /^(Marker|Cluster) ·/.test(n.name) && n !== sel)) { const mx = m.x + m.width / 2, my = m.y + m.height / 2; if (mx > cx0 && mx < cx1 && my > cy0 && my < cy1) { m.y = Math.round(cy1 + 40 - m.height / 2); moved.push(m.name); } }
  report.info.movedMarkers = moved.length ? moved.join(', ') : 'none';
  area.appendChild(card);
  lg.visible = false;
  for (const k of area.children.filter(n => n.name === 'Map key button · collapsed')) k.remove();
  const kb = created.keyBtn.createInstance(); kb.name = 'Map key button · collapsed'; area.appendChild(kb); kb.x = Math.round(area.width - 16 - kb.width); kb.y = 16;
  const A = card.absoluteBoundingBox; const hits = [];
  for (const o of area.children) { if (o === card || !o.visible || /^Map (base|tint)/.test(o.name)) continue; const B = o.absoluteBoundingBox; if (B && A.x < B.x + B.width && B.x < A.x + A.width && A.y < B.y + B.height && B.y < A.y + A.height) hits.push(o.name); }
  report.info.cardOverlaps = hits.length ? hits : 'none';
  report.info.cardRect = Math.round(card.x) + ',' + Math.round(card.y) + ' ' + Math.round(card.width) + 'x' + Math.round(card.height) + ' (area ' + Math.round(area.width) + 'x' + Math.round(area.height) + ')';
  created.page = pg;
});

// 4. Kontrol
await step('check', async () => {
  const gray = [], unst = []; const walk = n => { if ('fills' in n && n.fills !== figma.mixed) n.fills.forEach(f => { if (f.type === 'SOLID' && hex(f) === '#808080') gray.push(n.name); }); if (n.type === 'TEXT' && !n.textStyleId) unst.push(n.name); if ('children' in n) n.children.forEach(walk); };
  walk(created.page); const lgc = sec7.children.find(n => n.name === 'Legend'); if (lgc) walk(lgc); walk(created.keyBtn);
  report.info.grayFills = gray.length ? gray.slice(0, 8) : 'none'; report.info.unstyledText = unst.length ? unst.slice(0, 8) : 'none';
  let r7 = 0, b7 = 0; for (const ch of sec7.children) { r7 = Math.max(r7, ch.x + ch.width); b7 = Math.max(b7, ch.y + ch.height); } sec7.resizeWithoutConstraints(Math.max(1200, Math.ceil(r7 + 80)), Math.ceil(b7 + 80));
  const ovl = []; const top = p02.children.filter(n => n.type === 'SECTION'); for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) { const a = top[i], b = top[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ovl.push(a.name + ' x ' + b.name); }
  report.info.overlap02 = ovl.length ? ovl : 'none';
});
return report;
