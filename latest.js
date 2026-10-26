// step 218 · Scouts near you (konum sorma + sonuclar), Kind=Scout marker ve kart, Map Section icerige daraltildi ve en uste alindi

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




async function applySwitcher(pg, active) {
  const sset = set01('Map type switcher'); const filters = pg.findOne(n => n.name === 'Filters'); if (!filters) return 'no Filters';
  for (const k of filters.children.slice()) if (k.name === 'Type switcher') k.remove();
  const inst = sset.children.find(v => v.name === 'Active=' + active).createInstance(); inst.name = 'Type switcher';
  filters.insertChild(0, inst); inst.layoutAlign = 'STRETCH'; return 'ok';
}


const cardSet = set01('Map card'); const silSet = set01('Silhouette'); const btnSet = set01('Button');
const S_H3 = tstyle('Heading/H3', 'Heading/H4'), S_BODY = tstyle('Body/Default', 'Body/Small');
for (const s of [S_H3, S_BODY]) await figma.loadFontAsync(s.fontName);
function mkIcon(svg, colorVar, size) {
  const ic = figma.createNodeFromSvg(svg); ic.name = 'Icon'; ic.fills = []; ic.resize(size, size); ic.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
  const walk = x => { if ('children' in x) x.children.forEach(walk); if (x.type !== 'FRAME' && x.type !== 'GROUP') { if (x.strokes && x.strokes.length) x.strokes = [P(V(colorVar))]; x.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; } };
  walk(ic); return ic;
}
const USER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>';
async function mkBtn(label, style) {
  const bv = btnSet.children.find(v => new RegExp('Style=' + style).test(v.name) && /State=Default/.test(v.name)) || btnSet.children[0];
  const b = bv.createInstance(); b.name = 'Button · ' + label; const cp = b.componentProperties || {};
  const lk = Object.keys(cp).find(k => /^Label/.test(k)); const ik = Object.keys(cp).find(k => /^Icon/.test(k));
  if (lk) b.setProperties({ [lk]: label }); if (ik) b.setProperties({ [ik]: false });
  const bt = b.findOne(n => n.type === 'TEXT'); if (bt) await setText(bt, label); return b;
}

// 1. Scout rengi ve marker varyantlari
await step('Scout marker', async () => {
  await figma.setCurrentPageAsync(p01);
  const cols = await figma.variables.getLocalVariableCollectionsAsync(); const cc = cols.find(c => c.name === 'Color');
  let sv = allVars.find(x => x.name === 'color/map/scout');
  if (!sv) { sv = figma.variables.createVariable('color/map/scout', cc, 'COLOR'); allVars.push(sv); }
  sv.setValueForMode(cc.modes[0].modeId, { r: 0.055, g: 0.455, b: 0.565, a: 1 });
  for (const v of markerSet.children.filter(x => /Kind=Scout/.test(x.name))) v.remove();
  let bottom = 0; for (const v of markerSet.children) bottom = Math.max(bottom, v.y + v.height);
  let y = bottom + 40;
  for (const st of ['Default', 'Selected']) {
    const base = markerSet.children.find(v => v.name === 'Kind=Club, State=' + st);
    const v = base.clone(); markerSet.appendChild(v); v.name = 'Kind=Scout, State=' + st; v.fills = [P(V('color/map/scout'))];
    const fr = v.findOne(n => n.type === 'FRAME' && n.name === 'Icon'); for (const k of fr.children.slice()) k.remove();
    const ic = mkIcon(USER_SVG, 'color/icon/inverse', fr.width); fr.appendChild(ic); ic.x = 0; ic.y = 0;
    v.x = base.x; v.y = y; y += v.height + 40;
  }
  let r = 0, b = 0; for (const v of markerSet.children) { r = Math.max(r, v.x + v.width); b = Math.max(b, v.y + v.height); } markerSet.resizeWithoutConstraints(Math.ceil(r + 40), Math.ceil(b + 40));
  report.info.markerVariants = markerSet.children.length;
  await figma.setCurrentPageAsync(p02);
});
await figma.setCurrentPageAsync(p02);

// 2. Scout karti
await step('Scout card variant', async () => {
  await figma.setCurrentPageAsync(p01);
  for (const v of cardSet.children.slice()) if (v.name === 'Kind=Scout') v.remove();
  const base = cardSet.children.find(v => v.name === 'Kind=Club');
  const v = base.clone(); cardSet.appendChild(v); v.name = 'Kind=Scout';
  const head = v.findOne(n => n.name === 'Head'); const crest = head.findOne(n => n.type === 'INSTANCE' && n.name === 'Club crest');
  const m = mv('Scout', 'Default').createInstance(); m.name = 'Map marker'; head.insertChild(0, m); if (crest) crest.remove();
  await setIn(v, 'Name', 'Daniel Brandt'); await setIn(v, 'Meta', 'Head scout · Spreeufer FC'); await setIn(v, 'Location', '3 km away · Mitte, Berlin');
  const b = v.children.find(n => n.type === 'INSTANCE' && /^Button/.test(n.name));
  if (b) { b.name = 'Button · Book trial'; const cp = b.componentProperties || {}; const lk = Object.keys(cp).find(k => /^Label/.test(k)); if (lk) b.setProperties({ [lk]: 'Book trial' }); const bt = b.findOne(n => n.type === 'TEXT'); if (bt) await setText(bt, 'Book trial'); }
  const sec = v.findOne(n => n.name === 'Secondary action'); if (sec) sec.remove();
  let right = 0; for (const k of cardSet.children) if (k !== v) right = Math.max(right, k.x + k.width); v.x = right + 40; v.y = base.y;
  let r = 0, bt2 = 0; for (const k of cardSet.children) { r = Math.max(r, k.x + k.width); bt2 = Math.max(bt2, k.y + k.height); } cardSet.resizeWithoutConstraints(Math.ceil(r), Math.ceil(bt2));
  cardSet.description = cardSet.description.replace('Kind: Club, Stadium, Event, Match request.', 'Kind: Club, Stadium, Event, Match request, Scout (Scouts near you, ends in Book trial).');
  report.info.cardVariants = cardSet.children.map(k => k.name).join(' | ');
  await figma.setCurrentPageAsync(p02);
});
await figma.setCurrentPageAsync(p02);

// 3. Scouts near you sayfalari
async function scoutPage(pageName, mode) {
  const ev = mapSec.children.find(n => n.name === 'Map / Events · Desktop'); if (!ev) throw new Error('events page missing');
  const old = mapSec.children.find(n => n.name === pageName); if (old) old.remove();
  const prev = mapSec.children.filter(n => /^Map \//.test(n.name) && n.name !== pageName).sort((a, b) => b.x - a.x)[0];
  const cp = ev.clone(); cp.name = pageName; mapSec.appendChild(cp); cp.x = prev.x + prev.width + 480; cp.y = ev.y;
  const area = cp.findOne(n => n.name === 'Map area'), panel = cp.findOne(n => n.name === 'Map panel'), filters = cp.findOne(n => n.name === 'Filters');
  for (const k of area.children.slice()) if (/^(Marker|Cluster) ·/.test(k.name) || /^Map card/.test(k.name)) k.remove();
  for (const k of filters.children.slice()) if (k.name === 'Type switcher' || k.name === 'Field · Dates' || k.name === 'Field · Country') k.remove();
  const rad = filters.findOne(n => n.name === 'Field · Event type'); rad.name = 'Field · Radius'; await setIn(rad, 'Label', 'Radius'); await setIn(rad, 'Value', '50 km');
  const search = panel.findOne(n => n.name === 'Field · Search');
  if (mode === 'ask') {
    for (const nm of ['Summary', 'Results', 'Show all']) { const k = panel.findOne(n => n.name === nm); if (k) k.remove(); }
    await setIn(search, 'Value', 'Enter a city');
    const title = await txt('Find scouts near you', S_H3, 'color/text/primary'); title.name = 'Title';
    const body = await txt('See managers and officials close to you who shortlist players like you.', S_BODY, 'color/text/secondary'); body.name = 'Intro';
    const b1 = await mkBtn('Use my location', 'Primary'); const or = await txt('or', S_SMALL, 'color/text/secondary'); or.name = 'Or'; const b2 = await mkBtn('Show scouts', 'Secondary');
    panel.insertChild(0, title); panel.insertChild(1, body); panel.insertChild(2, b1); panel.insertChild(3, or); panel.appendChild(b2);
    for (const k of [title, body, b1, or, b2]) k.layoutAlign = 'STRETCH';
    for (const k of [title, body]) k.textAutoResize = 'HEIGHT'; or.textAlignHorizontal = 'CENTER'; or.textAutoResize = 'HEIGHT';
    panel.primaryAxisSizingMode = 'AUTO';
    report.info.askPanel = Math.round(panel.width) + 'x' + Math.round(panel.height);
  } else {
    await setIn(search, 'Value', 'Berlin, Germany');
    const t1 = panel.findOne(n => n.type === 'TEXT' && n.name === 'Total'), t2 = panel.findOne(n => n.type === 'TEXT' && n.name === 'Breakdown'), t3 = panel.findOne(n => n.type === 'TEXT' && n.name === 'Show all');
    if (t1) await setText(t1, '7 scouts within 50 km'); if (t2) await setText(t2, 'Managers and officials who shortlist players'); if (t3) await setText(t3, 'Show all 7 scouts');
    const cx = 700, cy = 450, R = 250;
    const ctrlIdx = () => area.children.findIndex(n => n.name === 'Map controls');
    let at = 2;
    const fillE = figma.createEllipse(); fillE.name = 'Search radius'; fillE.resize(2 * R, 2 * R); fillE.x = cx - R; fillE.y = cy - R; fillE.fills = [P(V('color/bg/brand'))]; fillE.opacity = 0.1; area.insertChild(at++, fillE);
    const ring = figma.createEllipse(); ring.name = 'Search radius · edge'; ring.resize(2 * R, 2 * R); ring.x = cx - R; ring.y = cy - R; ring.fills = []; ring.strokes = [P(V('color/bg/brand'))]; ring.strokeWeight = 2; ring.dashPattern = [8, 6]; ring.opacity = 0.6; area.insertChild(at++, ring);
    const dot = figma.createEllipse(); dot.name = 'You are here'; dot.resize(18, 18); dot.x = cx - 9; dot.y = cy - 9; dot.fills = [P(V('color/bg/brand'))]; dot.strokes = [P(V('color/bg/surface'))]; dot.strokeWeight = 3; area.insertChild(at++, dot);
    const chip = figma.createFrame(); chip.name = 'You are here · label'; chip.layoutMode = 'HORIZONTAL'; chip.primaryAxisSizingMode = 'AUTO'; chip.counterAxisSizingMode = 'AUTO'; PAD(chip, 'spacing/2xs', 'spacing/xs', 'spacing/2xs', 'spacing/xs'); RAD(chip, 'radius/full'); chip.fills = [P(V('color/bg/surface'))];
    const ce = effect('Shadow/Card'); if (ce) await chip.setEffectStyleIdAsync(ce.id);
    const ct = await txt('You are here', S_SMALL, 'color/text/primary'); ct.name = 'Label'; chip.appendChild(ct); area.insertChild(at++, chip); chip.x = cx + 18; chip.y = cy - Math.round(chip.height / 2);
    const SG = [[560, 330], [600, 590], [760, 640], [880, 590], [540, 500], [690, 260]];
    for (const [x, y] of SG) { const i = mv('Scout', 'Default').createInstance(); i.name = 'Marker · Scout'; area.insertChild(ctrlIdx(), i); i.x = Math.round(x - i.width / 2); i.y = Math.round(y - i.height / 2); }
    const sx = 800, sy = 350; const sel = mv('Scout', 'Selected').createInstance(); sel.name = 'Marker · Scout · selected'; area.insertChild(ctrlIdx(), sel); sel.x = Math.round(sx - sel.width / 2); sel.y = Math.round(sy - sel.height / 2);
    const card = cardSet.children.find(v => v.name === 'Kind=Scout').createInstance(); card.name = 'Map card · Daniel Brandt'; area.appendChild(card); card.x = sx + 40; card.y = sy - 50;
    const rows = [['Daniel Brandt', 'Head scout · Spreeufer FC · 3 km', 'Male'], ['Elena Vogt', 'Chief scout · Nordpark SC · 8 km', 'Female'], ['Marcus Hoffmann', 'Head coach · Havelblick United · 14 km', 'Male']];
    const res = panel.findOne(n => n.name === 'Results');
    for (let i = 0; i < res.children.length && i < rows.length; i++) {
      const row = res.children[i]; await setIn(row, 'Name', rows[i][0]); await setIn(row, 'Meta', rows[i][1]);
      const ic = row.findOne(n => n.type === 'INSTANCE' && n.name === 'Map marker'); const sv = silSet.children.find(v => /Role=Other/.test(v.name) && new RegExp('Gender=' + rows[i][2]).test(v.name) && /Size=40/.test(v.name));
      if (ic && sv) ic.swapComponent(sv); else report.info.silhouetteMissing = (report.info.silhouetteMissing || '') + i + ' ';
    }
    const A = card.absoluteBoundingBox; const hits = [];
    for (const o of area.children) { if (o === card || !o.visible || /^Map (base|tint)|^Search radius/.test(o.name)) continue; const B = o.absoluteBoundingBox; if (B && A.x < B.x + B.width && B.x < A.x + A.width && A.y < B.y + B.height && B.y < A.y + A.height) hits.push(o.name); }
    report.info.cardOverlaps = hits.length ? hits : 'none';
    report.info.silhouetteVariants = silSet.children.slice(0, 3).map(v => v.name).join(' | ');
  }
  return cp;
}
await step('Map / Scouts near you · ask · Desktop', async () => { created.ask = await scoutPage('Map / Scouts near you · ask · Desktop', 'ask'); });
await step('Map / Scouts near you · Desktop', async () => { created.res = await scoutPage('Map / Scouts near you · Desktop', 'results'); });

// 4. Map Section: icerige daralt, en uste al, komsu cakismalari
await step('Fit Map section', async () => {
  let right = 0, bottom = 0; for (const ch of mapSec.children) { right = Math.max(right, ch.x + ch.width); bottom = Math.max(bottom, ch.y + ch.height); }
  mapSec.resizeWithoutConstraints(Math.ceil(right + 80), Math.ceil(bottom + 80)); web.appendChild(mapSec);
  const A = mapSec.absoluteBoundingBox; const hits = [];
  for (const s of web.children) { if (s === mapSec || !s.absoluteBoundingBox) continue; const B = s.absoluteBoundingBox; if (A.x < B.x + B.width && B.x < A.x + A.width && A.y < B.y + B.height && B.y < A.y + A.height) hits.push(s.name); }
  report.info.mapSectionNow = Math.round(mapSec.width) + 'x' + Math.round(mapSec.height) + ' at ' + Math.round(mapSec.x) + ',' + Math.round(mapSec.y) + ' · web ' + Math.round(web.width) + 'x' + Math.round(web.height);
  report.info.mapSectionOverlaps = hits.length ? hits : 'none';
  report.info.webChildren = web.children.map(s => s.name + ' ' + Math.round(s.x) + ',' + Math.round(s.y) + ' ' + Math.round(s.width) + 'x' + Math.round(s.height)).join(' | ');
});

await step('check', async () => {
  const gray = [], unst = []; const walk = n => { if ('fills' in n && n.fills !== figma.mixed) n.fills.forEach(f => { if (f.type === 'SOLID' && hex(f) === '#808080') gray.push(n.name); }); if (n.type === 'TEXT' && !n.textStyleId) unst.push(n.name); if ('children' in n) n.children.forEach(walk); };
  for (const p of [created.ask, created.res]) if (p) walk(p);
  report.info.grayFills = gray.length ? gray.slice(0, 8) : 'none'; report.info.unstyledText = unst.length ? unst.slice(0, 8) : 'none';
  report.info.mapPages = mapSec.children.map(c => c.name).join(' | ');
});
return report;
