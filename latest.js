// step 201 · (200'un duzeltmesi: legend'da kayma ve tasma) 01 › 7 · Map: Map marker (Kind x State), Map cluster (Size), Legend; ikonlar hazir setten (Phosphor shield, Tabler building-stadium, Lucide calendar-days ve swords; MIT / ISC)

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name));
await p01.loadAsync(); await figma.setCurrentPageAsync(p01);
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const PAD = (n, t, r, b, l) => { n.setBoundVariable('paddingTop', V(t)); n.setBoundVariable('paddingRight', V(r)); n.setBoundVariable('paddingBottom', V(b)); n.setBoundVariable('paddingLeft', V(l)); };
const GAP = (n, v) => n.setBoundVariable('itemSpacing', V(v));
const RAD = (n, v) => { for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) n.setBoundVariable(k, V(v)); };
const hex = p => p && p.color ? '#' + [p.color.r, p.color.g, p.color.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('') : '-';
const effects = await figma.getLocalEffectStylesAsync();
const effect = nm => effects.find(s => s.name === nm);
const texts = await figma.getLocalTextStylesAsync();
const tstyle = (...names) => { for (const n of names) { const s = texts.find(t => t.name === n) || texts.find(t => t.name.indexOf(n) === 0); if (s) return s; } return null; };
const S_COUNT = tstyle('Heading/H4', 'Data/Value'); const S_LABEL = tstyle('Label/Default', 'Body/Small'); const S_SMALL = tstyle('Label/Small'); const S_TITLE = tstyle('Label/Default Strong', 'Label/Strong', 'Label/Default');
report.info.styles = [S_COUNT, S_LABEL, S_SMALL, S_TITLE].map(s => s ? s.name : 'MISSING');
for (const s of [S_COUNT, S_LABEL, S_SMALL, S_TITLE]) if (s) await figma.loadFontAsync(s.fontName);
async function txt(str, style, colorVar) {
  const t = figma.createText(); await t.setTextStyleIdAsync(style.id); t.characters = str; t.fills = [P(V(colorVar))]; return t;
}
const ICONS = {"Club": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\" fill=\"#ffffff\"><path d=\"M208,40H48A16,16,0,0,0,32,56v56c0,52.72,25.52,84.67,46.93,102.19,23.06,18.86,46,25.27,47,25.53a8,8,0,0,0,4.2,0c1-.26,23.91-6.67,47-25.53C198.48,196.67,224,164.72,224,112V56A16,16,0,0,0,208,40Zm0,72c0,37.07-13.66,67.16-40.6,89.42A129.3,129.3,0,0,1,128,223.62a128.25,128.25,0,0,1-38.92-21.81C61.82,179.51,48,149.3,48,112l0-56,160,0Z\"/></svg>", "Stadium": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"icon icon-tabler icons-tabler-outline icon-tabler-building-stadium\" > <path stroke=\"none\" d=\"M0 0h24v24H0z\" fill=\"none\" /> <path d=\"M4 12a8 2 0 1 0 16 0a8 2 0 1 0 -16 0\" /> <path d=\"M4 12v7c0 .94 2.51 1.785 6 2v-3h4v3c3.435 -.225 6 -1.07 6 -2v-7\" /> <path d=\"M15 6h4v-3h-4v7\" /> <path d=\"M7 6h4v-3h-4v7\" /> </svg>", "Event": "<svg class=\"lucide lucide-calendar-days\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" > <path d=\"M8 2v3\" /> <path d=\"M16 2v3\" /> <rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\" /> <path d=\"M3 9h18\" /> <path d=\"M8 13h.01\" /> <path d=\"M12 13h.01\" /> <path d=\"M16 13h.01\" /> <path d=\"M8 17h.01\" /> <path d=\"M12 17h.01\" /> <path d=\"M16 17h.01\" /> </svg>", "Match request": "<svg class=\"lucide lucide-swords\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" > <path d=\"m13 19 6-6\" /> <path d=\"M14.5 17.5 3.586 6.586A2 2 0 013 5.172V3h2.172a2 2 0 011.414.586L17.5 14.5\" /> <path d=\"m14.828 6.172 2.586-2.586A2 2 0 0118.828 3H21v2.172a2 2 0 01-.586 1.414l-2.586 2.586\" /> <path d=\"m16 16 4 4\" /> <path d=\"m19 21 2-2\" /> <path d=\"m5 14 4 4\" /> <path d=\"m5 21-2-2\" /> <path d=\"M7.5 16.5 4 20\" /> </svg>"};
const KINDS = ['Club', 'Stadium', 'Event', 'Match request'];
const KVAR = { 'Club': 'color/map/club', 'Stadium': 'color/map/facility', 'Event': 'color/map/event', 'Match request': 'color/map/request' };
function icon(kind, size) {
  const n = figma.createNodeFromSvg(ICONS[kind]); n.name = 'Icon'; n.fills = []; n.clipsContent = false; n.resize(size, size); n.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
  const iv = V('color/icon/inverse');
  const walk = x => { if ('children' in x) x.children.forEach(walk); if (x.type !== 'FRAME' && x.type !== 'GROUP') {
    if (x.fills && x.fills !== figma.mixed && x.fills.length) x.fills = [P(iv)];
    if (x.strokes && x.strokes.length) x.strokes = [P(iv)];
    x.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; } };
  walk(n); return n;
}
const sec = p01.children.find(n => n.type === 'SECTION' && /^7 /.test(n.name));
if (!sec) throw new Error('section 7 missing');
for (const old of sec.children.slice()) old.remove();
const created = {};

// 1. Map marker: Kind x State
await step('Map marker', async () => {
  const comps = [];
  for (const kind of KINDS) for (const state of ['Default', 'Selected']) {
    const sel = state === 'Selected'; const size = sel ? 48 : 36;
    const c = figma.createComponent(); c.name = 'Kind=' + kind + ', State=' + state;
    c.layoutMode = 'NONE'; c.resize(size, size); RAD(c, 'radius/full'); c.clipsContent = false;
    c.fills = [P(V(KVAR[kind]))];
    c.strokes = [P(V('color/bg/surface'))]; c.strokeWeight = sel ? 3 : 2; c.strokeAlign = 'INSIDE';
    const eff = effect(sel ? 'Shadow/Raised' : 'Shadow/Card'); if (eff) await c.setEffectStyleIdAsync(eff.id);
    const ic = icon(kind, sel ? 26 : 20); c.appendChild(ic); ic.x = (size - ic.width) / 2; ic.y = (size - ic.height) / 2;
    comps.push(c); sec.appendChild(c);
  }
  const set = figma.combineAsVariants(comps, sec); set.name = 'Map marker';
  set.description = 'Map marker. One per object type on the map; colour and icon together carry the type (colour-blind safe). Selected is the marker whose card is open. Variables: color/map/club, facility, event, request. Icons: Phosphor, Tabler, Lucide (MIT / ISC).';
  const col = { 'Default': 0, 'Selected': 1 };
  set.children.forEach(ch => { const m = /Kind=(.+), State=(.+)/.exec(ch.name); ch.x = 40 + KINDS.indexOf(m[1]) * 96; ch.y = 40 + col[m[2]] * 88; });
  set.resizeWithoutConstraints(40 * 2 + 96 * 3 + 48, 40 * 2 + 88 + 48);
  set.x = 80; set.y = 80; created.marker = set;
  report.info.markerFills = set.children.slice(0, 4).map(ch => ch.name + ' ' + hex(ch.fills[0]));
});

// 2. Map cluster: Size S / M / L
await step('Map cluster', async () => {
  const defs = [['S', 36, '12'], ['M', 48, '128'], ['L', 60, '1.2k']];
  const comps = [];
  for (const [nm, size, count] of defs) {
    const c = figma.createComponent(); c.name = 'Size=' + nm; c.layoutMode = 'NONE'; c.resize(size, size); RAD(c, 'radius/full'); c.clipsContent = false;
    c.fills = [P(V('color/bg/surface'))]; c.strokes = [P(V('color/border/strong'))]; c.strokeWeight = 2; c.strokeAlign = 'INSIDE';
    const eff = effect('Shadow/Card'); if (eff) await c.setEffectStyleIdAsync(eff.id);
    const t = await txt(count, S_COUNT, 'color/text/primary'); t.name = 'Count'; t.textAutoResize = 'WIDTH_AND_HEIGHT';
    c.appendChild(t); t.x = (size - t.width) / 2; t.y = (size - t.height) / 2;
    comps.push(c); sec.appendChild(c);
  }
  const set = figma.combineAsVariants(comps, sec); set.name = 'Map cluster';
  set.description = 'Map cluster. Number of objects in one area; grows in three steps with the count. Click zooms in. Counts are placeholders.';
  set.children.forEach((ch, i) => { ch.x = 40 + i * 104; ch.y = 40; });
  set.resizeWithoutConstraints(40 * 2 + 104 * 2 + 60, 40 * 2 + 60);
  set.x = 80; set.y = created.marker.y + created.marker.height + 80; created.cluster = set;
});

// 3. Legend
await step('Legend', async () => {
  const lg = figma.createComponent(); lg.name = 'Legend'; lg.layoutMode = 'VERTICAL'; lg.primaryAxisSizingMode = 'AUTO'; lg.counterAxisSizingMode = 'FIXED'; lg.resize(352, 100);
  GAP(lg, 'spacing/md'); PAD(lg, 'spacing/lg', 'spacing/lg', 'spacing/lg', 'spacing/lg'); RAD(lg, 'radius/lg');
  lg.fills = [P(V('color/bg/surface'))]; const eff = effect('Shadow/Card'); if (eff) await lg.setEffectStyleIdAsync(eff.id);
  const title = await txt('Map key', S_TITLE, 'color/text/primary'); title.name = 'Title'; lg.appendChild(title);
  const rows = [['Club', 'Clubs'], ['Stadium', 'Stadiums'], ['Event', 'Events'], ['Match request', 'Teams looking for an opponent']];
  const marker = created.marker;
  for (const [kind, label] of rows) {
    const row = figma.createFrame(); row.name = 'Row · ' + label; row.layoutMode = 'HORIZONTAL'; row.counterAxisAlignItems = 'CENTER'; row.primaryAxisSizingMode = 'AUTO'; row.counterAxisSizingMode = 'AUTO'; row.fills = []; GAP(row, 'spacing/sm');
    const v = marker.children.find(ch => ch.name === 'Kind=' + kind + ', State=Default'); const inst = v.createInstance(); inst.name = 'Marker';
    row.appendChild(inst); const t = await txt(label, S_LABEL, 'color/text/primary'); t.name = 'Label'; row.appendChild(t); lg.appendChild(row); row.layoutAlign = 'STRETCH'; t.layoutGrow = 1; t.textAutoResize = 'HEIGHT';
  }
  const row = figma.createFrame(); row.name = 'Row · Cluster'; row.layoutMode = 'HORIZONTAL'; row.counterAxisAlignItems = 'CENTER'; row.primaryAxisSizingMode = 'AUTO'; row.counterAxisSizingMode = 'AUTO'; row.fills = []; GAP(row, 'spacing/sm');
  const ci = created.cluster.children.find(ch => ch.name === 'Size=S').createInstance(); ci.name = 'Cluster';
  row.appendChild(ci); const t2 = await txt('Several in one area, click to zoom in', S_LABEL, 'color/text/primary'); t2.name = 'Label'; row.appendChild(t2); lg.appendChild(row); row.layoutAlign = 'STRETCH'; t2.layoutGrow = 1; t2.textAutoResize = 'HEIGHT';
  lg.description = 'Legend. Lives in the left panel of the map; one row per type plus the cluster. Rows follow the Show chips (hidden types are removed).';
  sec.appendChild(lg); lg.x = 80; lg.y = created.cluster.y + created.cluster.height + 80; created.legend = lg;
  report.info.legendSize = Math.round(lg.width) + 'x' + Math.round(lg.height);
});

// 4. Section buyusun, kontrol
await step('fit section + check', async () => {
  let right = 0, bottom = 0;
  for (const ch of sec.children) { right = Math.max(right, ch.x + ch.width); bottom = Math.max(bottom, ch.y + ch.height); }
  sec.resizeWithoutConstraints(Math.max(1200, Math.ceil(right + 80)), Math.ceil(bottom + 80));
  report.info.section7 = Math.round(sec.width) + 'x' + Math.round(sec.height) + ' · children: ' + sec.children.map(c => c.name).join(', ');
  const unbound = []; const walk = n => { if ('fills' in n && n.fills !== figma.mixed) n.fills.forEach(f => { if (f.type === 'SOLID' && hex(f) === '#808080') unbound.push(n.name); }); if ('children' in n) n.children.forEach(walk); };
  sec.children.forEach(walk); report.info.grayFills = unbound.length ? unbound : 'none';
  const unstyled = []; const walk2 = n => { if (n.type === 'TEXT' && !n.textStyleId) unstyled.push(n.name); if ('children' in n) n.children.forEach(walk2); };
  sec.children.forEach(walk2); report.info.unstyledText = unstyled.length ? unstyled : 'none';
});
return report;
