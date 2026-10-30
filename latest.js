// step 268 · Events components (01 › 9 · Events): Poster upload, Event type option, Organizer row, Event status, Application status, Event location card
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
for (const k of ['Label/Default', 'Label/Default Strong', 'Label/Small', 'Body/Small', 'Body/Default']) { if (!TS[k]) throw new Error('text style missing: ' + k); await figma.loadFontAsync(TS[k].fontName); }
const FX = (await figma.getLocalEffectStylesAsync()).find(s => s.name === 'Shadow/Card');
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
  upload: SV('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>'),
  check: SV('<path d="M20 6 9 17l-5-5"/>'),
  clock: SV('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
  x: SV('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
  ban: SV('<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>'),
  pin: SV('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'),
  chevron: SV('<path d="m9 18 6-6-6-6"/>')
};
const findSet = re => p01.findAll(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name) && !(n.parent && n.parent.type === 'COMPONENT_SET'))[0];
const silSet = findSet(/^Silhouette$/);
if (!silSet) throw new Error('Silhouette set not found');
const markerSet = findSet(/^Map marker$/);
const IMG = (dir, f) => 'https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/img/' + dir + '/' + f;

// ---------- section 9 ----------
let sec9 = p01.children.find(n => n.type === 'SECTION' && /^9 /.test(n.name));
const archive = p01.children.find(n => n.type === 'SECTION' && /^Archive/.test(n.name));
if (!archive) throw new Error('Archive section not found on 01');
if (sec9) { for (const n of sec9.children.slice()) n.remove(); }
else {
  sec9 = figma.createSection(); sec9.name = '9 · Events'; p01.appendChild(sec9);
  sec9.x = archive.x; sec9.y = archive.y; sec9.resizeWithoutConstraints(1400, 1400);
}
const parts = []; // [description, node]
function makeSet(name, comps, cols) {
  const colW = [], rowH = [];
  comps.forEach((c, i) => { const ci = i % cols, ri = Math.floor(i / cols); colW[ci] = Math.max(colW[ci] || 0, Math.ceil(c.width)); rowH[ri] = Math.max(rowH[ri] || 0, Math.ceil(c.height)); });
  comps.forEach((c, i) => { const ci = i % cols, ri = Math.floor(i / cols); let x = 32, y = 32; for (let k = 0; k < ci; k++) x += colW[k] + 40; for (let k = 0; k < ri; k++) y += rowH[k] + 40; c.x = x; c.y = y; });
  const set = figma.combineAsVariants(comps, sec9); set.name = name;
  set.resizeWithoutConstraints(colW.reduce((a, b) => a + b, 0) + 40 * (cols - 1) + 64, rowH.reduce((a, b) => a + b, 0) + 40 * (rowH.length - 1) + 64);
  return set;
}
function comp(name) { const c = figma.createComponent(); c.name = name; sec9.appendChild(c); return c; }

// ---------- Poster upload ----------
await step('Poster upload', async () => {
  const img = await figma.createImageAsync(IMG('gallery', 'gallery-b.jpg'));
  const comps = [];
  for (const state of ['Empty', 'Hover', 'Filled', 'Error']) {
    const c = comp('State=' + state);
    c.layoutMode = 'VERTICAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED'; c.resize(400, 100); c.primaryAxisSizingMode = 'AUTO';
    c.fills = []; GAP(c, 'spacing/sm');
    if (state === 'Filled') {
      const r = figma.createRectangle(); r.name = 'Poster preview'; r.resize(400, 240); RAD(r, 'radius/lg');
      r.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: img.hash }]; c.appendChild(r); r.layoutSizingHorizontal = 'FILL';
      const row = frame('File row', 'HORIZONTAL'); GAP(row, 'spacing/md'); row.counterAxisAlignItems = 'CENTER'; c.appendChild(row); row.layoutSizingHorizontal = 'FILL';
      const fn = await txt('File name', 'riga-cup-poster.jpg', 'Label/Default', 'color/text/primary'); row.appendChild(fn); fn.layoutGrow = 1; fn.textAutoResize = 'HEIGHT'; fn.textTruncation = 'ENDING'; fn.maxLines = 1;
      row.appendChild(await txt('Replace', 'Replace', 'Label/Default Strong', 'color/text/brand'));
      row.appendChild(await txt('Remove', 'Remove', 'Label/Default Strong', 'color/text/danger'));
    } else {
      const drop = frame('Drop area', 'VERTICAL'); drop.counterAxisSizingMode = 'FIXED'; drop.resize(400, 180); drop.primaryAxisSizingMode = 'FIXED';
      drop.primaryAxisAlignItems = 'CENTER'; drop.counterAxisAlignItems = 'CENTER'; GAP(drop, 'spacing/xs'); RAD(drop, 'radius/lg');
      fillV(drop, state === 'Hover' ? 'color/bg/brand-subtle' : 'color/bg/subtle');
      drop.strokes = [P(V(state === 'Hover' ? 'color/bg/brand' : state === 'Error' ? 'color/text/danger' : 'color/border/strong'))]; drop.strokeWeight = 1; drop.strokeAlign = 'INSIDE'; drop.dashPattern = [6, 6];
      c.appendChild(drop); drop.layoutSizingHorizontal = 'FILL';
      const circ = frame('Icon circle', 'HORIZONTAL'); circ.resize(48, 48); circ.layoutMode = 'HORIZONTAL'; circ.primaryAxisSizingMode = 'FIXED'; circ.counterAxisSizingMode = 'FIXED'; circ.primaryAxisAlignItems = 'CENTER'; circ.counterAxisAlignItems = 'CENTER'; fillV(circ, 'color/bg/surface'); RAD(circ, 'radius/full');
      circ.appendChild(mkIcon(SVG.upload, state === 'Error' ? 'color/text/danger' : 'color/icon/brand', 24)); drop.appendChild(circ);
      const line = frame('Prompt', 'HORIZONTAL'); GAP(line, 'spacing/2xs'); drop.appendChild(line);
      line.appendChild(await txt('Prompt text', state === 'Hover' ? 'Drop the file to upload' : 'Drag a poster here or', 'Label/Default', 'color/text/primary'));
      if (state !== 'Hover') line.appendChild(await txt('Browse', 'Browse', 'Label/Default Strong', 'color/text/brand'));
      drop.appendChild(await txt('Hint', 'JPG or PNG, up to 5 MB', 'Label/Small', 'color/text/secondary'));
      if (state === 'Error') {
        const er = await txt('Error message', 'This file is too large. Choose an image under 5 MB.', 'Label/Small', 'color/text/danger'); c.appendChild(er); er.layoutSizingHorizontal = 'FILL'; er.textAutoResize = 'HEIGHT';
      }
    }
    comps.push(c);
  }
  const set = makeSet('Poster upload', comps, 4);
  parts.push(['Poster upload for the event form. States: empty, hover (file dragged over), filled with preview, error.', set]);
  report.info.poster = set.children.map(v => v.name + ' ' + Math.round(v.width) + 'x' + Math.round(v.height)).join(' | ');
});

// ---------- Event type option ----------
await step('Event type option', async () => {
  const types = [['Match', 'Friendly or league game'], ['Tournament', 'Several teams, one cup'], ['Seminar', 'Talk or lecture'], ['Workshop', 'Hands-on session'], ['Camp', 'Training over several days'], ['Other', 'Anything else']];
  const comps = [];
  for (const state of ['Default', 'Hover', 'Selected']) {
    for (const [t, d] of types) {
      const c = comp('Type=' + t + ', State=' + state);
      c.layoutMode = 'VERTICAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED'; c.resize(196, 60); c.primaryAxisSizingMode = 'AUTO';
      PAD(c, 'spacing/sm', 'spacing/md', 'spacing/sm', 'spacing/md'); GAP(c, 'spacing/2xs'); RAD(c, 'radius/md');
      fillV(c, state === 'Selected' ? 'color/bg/brand-subtle' : state === 'Hover' ? 'color/bg/subtle' : 'color/bg/surface');
      c.strokes = [P(V(state === 'Selected' ? 'color/bg/brand' : state === 'Hover' ? 'color/border/strong' : 'color/border/default'))]; c.strokeWeight = state === 'Selected' ? 2 : 1; c.strokeAlign = 'INSIDE';
      const top = frame('Top row', 'HORIZONTAL'); top.counterAxisAlignItems = 'CENTER'; GAP(top, 'spacing/xs'); c.appendChild(top); top.layoutSizingHorizontal = 'FILL';
      const l = await txt('Label', t, 'Label/Default Strong', state === 'Selected' ? 'color/text/brand' : 'color/text/primary'); top.appendChild(l); l.layoutGrow = 1; l.textAutoResize = 'HEIGHT';
      if (state === 'Selected') top.appendChild(mkIcon(SVG.check, 'color/icon/brand', 16));
      const ds = await txt('Description', d, 'Label/Small', 'color/text/secondary'); c.appendChild(ds); ds.layoutSizingHorizontal = 'FILL'; ds.textAutoResize = 'HEIGHT';
      comps.push(c);
    }
  }
  const set = makeSet('Event type option', comps, 6);
  parts.push(['Event type choice for the event form, one option selected at a time. Replaces the dropdown. Types follow the current form.', set]);
  report.info.typeOption = { count: set.children.length, sizes: Array.from(new Set(set.children.map(v => Math.round(v.width) + 'x' + Math.round(v.height)))).join(' | ') };
});

// ---------- Organizer row ----------
await step('Organizer row', async () => {
  const comps = [];
  for (const state of ['Default', 'Hover']) {
    const c = comp('State=' + state);
    c.layoutMode = 'HORIZONTAL'; c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO'; c.resize(416, 72); c.counterAxisSizingMode = 'AUTO';
    c.counterAxisAlignItems = 'CENTER'; PAD(c, 'spacing/md', 'spacing/md', 'spacing/md', 'spacing/md'); GAP(c, 'spacing/sm'); RAD(c, 'radius/md');
    fillV(c, state === 'Hover' ? 'color/bg/subtle' : 'color/bg/surface'); c.strokes = [P(V('color/border/default'))]; c.strokeWeight = 1; c.strokeAlign = 'INSIDE';
    const photo = frame('Photo'); photo.resize(40, 40); photo.clipsContent = true; RAD(photo, 'radius/full');
    const sv = silSet.children.find(v => v.name === 'Role=Other, Gender=Male, Size=40') || silSet.children[0];
    const si = sv.createInstance(); si.name = 'Silhouette'; photo.appendChild(si); si.x = 0; si.y = 0; c.appendChild(photo);
    const col = frame('Text', 'VERTICAL'); GAP(col, 'spacing/2xs'); c.appendChild(col); col.layoutGrow = 1;
    col.appendChild(await txt('Eyebrow', 'Organised by', 'Label/Small', 'color/text/secondary'));
    col.appendChild(await txt('Name', 'Tom Reilly', 'Label/Default Strong', 'color/text/primary'));
    col.appendChild(await txt('Role', 'Manager · Riverside FC', 'Label/Small', 'color/text/secondary'));
    c.appendChild(mkIcon(SVG.chevron, 'color/icon/default', 20));
    comps.push(c);
  }
  const set = makeSet('Organizer row', comps, 2);
  parts.push(['Who organises the event. Opens the organizer profile. Photo falls back to the silhouette.', set]);
  report.info.organizer = set.children.map(v => v.name + ' ' + Math.round(v.width) + 'x' + Math.round(v.height)).join(' | ');
});

// ---------- pills ----------
async function pill(c, label, fg, bg, iconSvg, dot) {
  c.layoutMode = 'HORIZONTAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO'; c.counterAxisAlignItems = 'CENTER';
  PAD(c, 'spacing/2xs', 'spacing/sm', 'spacing/2xs', 'spacing/sm'); GAP(c, 'spacing/xs'); RAD(c, 'radius/full'); fillV(c, bg);
  if (dot) { const d = figma.createEllipse(); d.name = 'Dot'; d.resize(8, 8); d.fills = [P(V(fg))]; c.appendChild(d); }
  if (iconSvg) { const ic = mkIcon(iconSvg, fg, 14); c.appendChild(ic); }
  c.appendChild(await txt('Label', label, 'Label/Small', fg));
}
await step('Event status', async () => {
  const comps = [];
  const defs = [['Upcoming', 'Starts in 12 days', 'color/text/brand', 'color/bg/brand-subtle', true], ['Ongoing', 'Ongoing', 'color/text/warning', 'color/bg/warning-subtle', true], ['Finished', 'Finished', 'color/text/secondary', 'color/bg/subtle', false]];
  for (const [s, l, fg, bg, dot] of defs) { const c = comp('Status=' + s); await pill(c, l, fg, bg, null, dot); comps.push(c); }
  const set = makeSet('Event status', comps, 3);
  parts.push(['Time status, worked out from the event dates and never entered by hand. Finished events have no Book button.', set]);
  report.info.eventStatus = set.children.map(v => v.name + ' ' + Math.round(v.width) + 'x' + Math.round(v.height)).join(' | ');
});
await step('Application status', async () => {
  const comps = [];
  const defs = [['Accepted', 'Accepted', 'color/text/brand', 'color/bg/brand-subtle', SVG.check], ['Pending', 'Pending', 'color/text/warning', 'color/bg/warning-subtle', SVG.clock], ['Declined', 'Declined', 'color/text/danger', 'color/bg/danger-subtle', SVG.x], ['Cancelled', 'Cancelled', 'color/text/secondary', 'color/bg/subtle', SVG.ban]];
  for (const [s, l, fg, bg, ic] of defs) { const c = comp('Status=' + s); await pill(c, l, fg, bg, ic, false); comps.push(c); }
  const set = makeSet('Application status', comps, 4);
  parts.push(['Result of an application, shown next to each event under Applied on My events.', set]);
  report.info.appStatus = set.children.map(v => v.name + ' ' + Math.round(v.width) + 'x' + Math.round(v.height)).join(' | ');
});

// ---------- Event location card ----------
await step('Event location card', async () => {
  const mapImg = await figma.createImageAsync(IMG('map', 'city-z12-v2.png'));
  const c = comp('Event location card');
  c.layoutMode = 'VERTICAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED'; c.resize(416, 100); c.primaryAxisSizingMode = 'AUTO';
  c.clipsContent = true; RAD(c, 'radius/lg'); fillV(c, 'color/bg/surface'); if (FX) await c.setEffectStyleIdAsync(FX.id);
  const map = frame('Map'); map.resize(416, 160); map.clipsContent = true;
  const r = figma.createRectangle(); r.name = 'Map image'; r.resize(416, 160); r.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: mapImg.hash }]; map.appendChild(r);
  const mk = markerSet ? (markerSet.type === 'COMPONENT_SET' ? (markerSet.children.find(v => /Kind=Event/.test(v.name) && /State=Default/.test(v.name)) || markerSet.children[0]) : markerSet) : null;
  if (mk) { const mi = mk.createInstance(); mi.name = 'Map marker'; map.appendChild(mi); mi.x = 208 - mi.width / 2; mi.y = 80 - mi.height / 2; report.info.markerVariant = mk.name; }
  c.appendChild(map); map.layoutSizingHorizontal = 'FILL';
  const body = frame('Body', 'HORIZONTAL'); body.counterAxisAlignItems = 'CENTER'; PAD(body, 'spacing/md', 'spacing/md', 'spacing/md', 'spacing/md'); GAP(body, 'spacing/sm'); c.appendChild(body); body.layoutSizingHorizontal = 'FILL';
  body.appendChild(mkIcon(SVG.pin, 'color/icon/brand', 20));
  const col = frame('Text', 'VERTICAL'); GAP(col, 'spacing/2xs'); body.appendChild(col); col.layoutGrow = 1;
  col.appendChild(await txt('Place', 'Berlin, Germany', 'Label/Default Strong', 'color/text/primary'));
  col.appendChild(await txt('Hint', 'Shown on the interactive map', 'Label/Small', 'color/text/secondary'));
  body.appendChild(await txt('Action', 'Open on map', 'Label/Default Strong', 'color/text/brand'));
  parts.push(['Where the event takes place, from the city coordinates. Opens the event on the interactive map.', c]);
  report.info.locationCard = Math.round(c.width) + 'x' + Math.round(c.height);
});

// ---------- layout of section 9 ----------
await step('layout section 9', async () => {
  let y = 80; const left = sec9.x + 80;
  for (const [desc, node] of parts) {
    const t = await txt('Description', desc, 'Body/Small', 'color/text/secondary');
    sec9.appendChild(t); t.x = 80; t.y = y; y += Math.ceil(t.height) + 16;
    node.x = 80; node.y = y; y += Math.ceil(node.height) + 120;
  }
  let right = -Infinity, bottom = -Infinity;
  for (const k of sec9.children) { right = Math.max(right, k.x + k.width); bottom = Math.max(bottom, k.y + k.height); }
  sec9.resizeWithoutConstraints(Math.ceil(right + 80), Math.ceil(bottom + 80));
  archive.x = sec9.x + sec9.width + 160;
  report.info.section9 = Math.round(sec9.x) + ',' + Math.round(sec9.y) + ' ' + Math.round(sec9.width) + 'x' + Math.round(sec9.height) + ' archive.x ' + Math.round(archive.x);
});

// ---------- checks ----------
await step('checks', async () => {
  let gray = 0, unstyled = 0;
  const walk = n => {
    if ('fills' in n && n.fills !== figma.mixed) for (const f of n.fills) if (f.type === 'SOLID' && Math.abs(f.color.r - .5) < .01 && Math.abs(f.color.g - .5) < .01 && Math.abs(f.color.b - .5) < .01 && !(f.boundVariables && f.boundVariables.color)) gray++;
    if (n.type === 'TEXT' && !n.textStyleId) unstyled++;
    if ('children' in n) n.children.forEach(walk);
  };
  sec9.children.forEach(walk);
  report.info.grayFills = gray; report.info.unstyledText = unstyled;
  const bs = sec9.children.map(n => ({ n: n.name, b: n.absoluteBoundingBox })); const ov = [];
  for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) { const a = bs[i].b, b = bs[j].b; if (a && b && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov.push(bs[i].n + ' x ' + bs[j].n); }
  report.info.overlaps = ov.length ? ov : 'none';
  const secs = p01.children.filter(n => n.type === 'SECTION').sort((a, b) => a.x - b.x);
  const so = []; for (let i = 0; i < secs.length - 1; i++) if (secs[i].x + secs[i].width > secs[i + 1].x) so.push(secs[i].name + ' x ' + secs[i + 1].name);
  report.info.sectionOverlaps = so.length ? so : 'none';
  report.info.sections01 = secs.map(s => s.name + ' @' + Math.round(s.x)).join(' | ');
  report.info.sec9kids = sec9.children.map(n => n.type + ':' + n.name + ' ' + Math.round(n.width) + 'x' + Math.round(n.height)).join(' | ');
});

await figma.setCurrentPageAsync(startPage);
return report;
