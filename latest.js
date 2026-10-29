// step 237 · Messenger components 1 (01 › 8 · Messenger): Chat list item (State x Unread), Message bubble (Side x Type x Status), Date divider + read-only inspect of Menu icon / Menu row / Header logged in

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
  check: SV('<path d="M20 6 9 17l-5-5"/>'),
  checks: SV('<path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>')
};
const findSet = re => p01.findAll(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name) && !(n.parent && n.parent.type === 'COMPONENT_SET'))[0];
const silSet = findSet(/^Silhouette$/);
if (!silSet) throw new Error('Silhouette set not found');
const sec8 = p01.children.find(n => n.type === 'SECTION' && /^8 /.test(n.name));
if (!sec8) throw new Error('Section 8 not found');
const oldRight = sec8.x + sec8.width;
for (const n of sec8.children.slice()) { if (['Chat list item', 'Message bubble', 'Date divider'].indexOf(n.name) >= 0) n.remove(); }
const IMG = f => 'https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/img/gallery/' + f;

// ---------- Chat list item ----------
await step('Chat list item', async () => {
  const variants = [];
  const states = ['Default', 'Hover', 'Selected'];
  for (let si = 0; si < states.length; si++) {
    for (let ui = 0; ui < 2; ui++) {
      const state = states[si], unread = ui === 1;
      const c = figma.createComponent(); c.name = 'State=' + state + ', Unread=' + (unread ? 'True' : 'False');
      sec8.appendChild(c);
      c.resize(400, 80); c.layoutMode = 'HORIZONTAL'; c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO';
      c.counterAxisAlignItems = 'MIN'; PAD(c, 'spacing/md', 'spacing/md', 'spacing/md', 'spacing/md'); GAP(c, 'spacing/sm');
      fillV(c, state === 'Default' ? 'color/bg/surface' : state === 'Hover' ? 'color/bg/subtle' : 'color/bg/brand-subtle');
      c.strokes = [P(V('color/border/default'))]; c.strokeAlign = 'INSIDE';
      c.strokeTopWeight = 0; c.strokeLeftWeight = 0; c.strokeRightWeight = 0; c.strokeBottomWeight = 1;
      // photo (silhouette fallback)
      const photo = frame('Photo'); photo.resize(40, 40); photo.clipsContent = true; RAD(photo, 'radius/full');
      const sv = silSet.children.find(v => v.name === 'Role=Other, Gender=Male, Size=40') || silSet.children[0];
      const si0 = sv.createInstance(); si0.name = 'Silhouette'; photo.appendChild(si0); si0.x = 0; si0.y = 0;
      c.appendChild(photo); photo.layoutGrow = 0;
      // text column
      const col = frame('Text', 'VERTICAL'); GAP(col, 'spacing/2xs'); c.appendChild(col); col.layoutGrow = 1; col.layoutAlign = 'STRETCH';
      const top = frame('Top row', 'HORIZONTAL'); GAP(top, 'spacing/sm'); top.counterAxisAlignItems = 'CENTER'; col.appendChild(top); top.layoutSizingHorizontal = 'FILL';
      const nm = await txt('Name', 'Tom Reilly', 'Label/Default Strong', 'color/text/primary'); top.appendChild(nm); nm.layoutGrow = 1; nm.textAutoResize = 'HEIGHT'; nm.textTruncation = 'ENDING'; nm.maxLines = 1;
      const tm = await txt('Time', '14:32', 'Label/Small', unread ? 'color/text/brand' : 'color/text/secondary'); top.appendChild(tm);
      const meta = await txt('Meta', 'Manager · Northgate Athletic', 'Label/Small', 'color/text/secondary'); col.appendChild(meta); meta.layoutSizingHorizontal = 'FILL'; meta.textAutoResize = 'HEIGHT'; meta.textTruncation = 'ENDING'; meta.maxLines = 1;
      const prow = frame('Preview row', 'HORIZONTAL'); GAP(prow, 'spacing/sm'); prow.counterAxisAlignItems = 'CENTER'; col.appendChild(prow); prow.layoutSizingHorizontal = 'FILL';
      const pv = await txt('Preview', 'Thanks, I will send the shortlist tomorrow.', 'Body/Small', unread ? 'color/text/primary' : 'color/text/secondary'); prow.appendChild(pv); pv.layoutGrow = 1; pv.textAutoResize = 'HEIGHT'; pv.textTruncation = 'ENDING'; pv.maxLines = 1;
      if (unread) {
        const b = frame('Unread badge', 'HORIZONTAL'); b.primaryAxisAlignItems = 'CENTER'; b.counterAxisAlignItems = 'CENTER'; fillV(b, 'color/bg/brand'); RAD(b, 'radius/full'); PAD(b, 'spacing/2xs', 'spacing/xs', 'spacing/2xs', 'spacing/xs');
        const ct = await txt('Count', '2', 'Label/Small', 'color/text/inverse'); b.appendChild(ct); prow.appendChild(b);
      }
      variants.push(c);
    }
  }
  const cols = { Default: 0, Hover: 1, Selected: 2 };
  variants.forEach(v => { const st = /State=(\w+)/.exec(v.name)[1]; const un = /Unread=True/.test(v.name); v.x = 32 + cols[st] * 440; v.y = 32 + (un ? 1 : 0) * (Math.ceil(v.height) + 40); });
  const set = figma.combineAsVariants(variants, sec8); set.name = 'Chat list item';
  for (const ch of set.children) { ch.x += 32; ch.y += 32; }
  set.resizeWithoutConstraints(set.width + 64, set.height + 64);
  report.info.chatItem = { variants: set.children.map(v => v.name + ' ' + Math.round(v.width) + 'x' + Math.round(v.height)).join(' | '), set: Math.round(set.width) + 'x' + Math.round(set.height) };
});

// ---------- Message bubble ----------
const photoImg = await figma.createImageAsync(IMG('gallery-b.jpg'));
let maxWidthOk = true;
await step('Message bubble', async () => {
  const list = [];
  for (const type of ['Text', 'Photo', 'File']) list.push(['Theirs', type, 'None']);
  for (const status of ['Sent', 'Read', 'Failed']) for (const type of ['Text', 'Photo', 'File']) list.push(['Mine', type, status]);
  const comps = [];
  for (const [side, type, status] of list) {
    const mine = side === 'Mine', failed = status === 'Failed';
    const tone = failed ? 'danger' : mine ? 'brand' : 'neutral';
    const bubbleFill = tone === 'brand' ? 'color/bg/brand' : tone === 'danger' ? 'color/bg/danger-subtle' : 'color/bg/subtle';
    const tcol = tone === 'brand' ? 'color/text/inverse' : 'color/text/primary';
    const scol = tone === 'brand' ? 'color/text/inverse' : 'color/text/secondary';
    const boxFill = tone === 'brand' ? 'color/bg/brand-hover' : 'color/bg/surface';
    const icol = tone === 'brand' ? 'color/icon/inverse' : 'color/icon/brand';
    const row = figma.createComponent(); row.name = 'Side=' + side + ', Type=' + type + ', Status=' + status; sec8.appendChild(row);
    row.resize(976, 40); row.layoutMode = 'HORIZONTAL'; row.primaryAxisSizingMode = 'FIXED'; row.counterAxisSizingMode = 'AUTO';
    row.primaryAxisAlignItems = mine ? 'MAX' : 'MIN'; row.counterAxisAlignItems = 'MIN'; row.fills = [];
    const col = frame('Message', 'VERTICAL'); GAP(col, 'spacing/2xs'); col.counterAxisAlignItems = mine ? 'MAX' : 'MIN'; row.appendChild(col);
    const bub = frame('Bubble', 'VERTICAL'); bub.counterAxisAlignItems = 'MIN'; fillV(bub, bubbleFill); RAD(bub, 'radius/lg');
    bub.setBoundVariable(mine ? 'bottomRightRadius' : 'bottomLeftRadius', V('radius/xs'));
    if (failed) { bub.strokes = [P(V('color/text/danger'))]; bub.strokeWeight = 1; bub.strokeAlign = 'INSIDE'; }
    col.appendChild(bub);
    try { bub.maxWidth = 480; } catch (e) { maxWidthOk = false; }
    if (type === 'Text') {
      PAD(bub, 'spacing/sm', 'spacing/md', 'spacing/sm', 'spacing/md');
      const t = await txt('Message text', mine ? 'Sure, I will send it over tomorrow after the match.' : 'Hi Mark, we are looking for a left back for the winter window. Could you share your shortlist with me?', 'Body/Default', tcol);
      bub.appendChild(t); t.layoutSizingHorizontal = 'FILL'; t.textAutoResize = 'HEIGHT';
    } else if (type === 'Photo') {
      PAD(bub, 'spacing/2xs', 'spacing/2xs', 'spacing/2xs', 'spacing/2xs');
      const r = figma.createRectangle(); r.name = 'Photo'; r.resize(320, 214); RAD(r, 'radius/md');
      r.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: photoImg.hash }]; bub.appendChild(r);
    } else {
      PAD(bub, 'spacing/sm', 'spacing/md', 'spacing/sm', 'spacing/sm'); bub.layoutMode = 'HORIZONTAL'; GAP(bub, 'spacing/sm'); bub.counterAxisAlignItems = 'CENTER';
      const box = frame('File icon', 'HORIZONTAL'); box.resize(40, 40); box.layoutMode = 'HORIZONTAL'; box.primaryAxisSizingMode = 'FIXED'; box.counterAxisSizingMode = 'FIXED'; box.primaryAxisAlignItems = 'CENTER'; box.counterAxisAlignItems = 'CENTER'; fillV(box, boxFill); RAD(box, 'radius/md');
      box.appendChild(mkIcon(SVG.file, icol, 20)); bub.appendChild(box);
      const tx = frame('File text', 'VERTICAL'); bub.appendChild(tx);
      tx.appendChild(await txt('File name', 'Shortlist_left_backs.pdf', 'Label/Default Strong', tcol));
      const fs = await txt('File size', '1.2 MB · PDF', 'Label/Small', scol); if (tone === 'brand') fs.opacity = 0.8; tx.appendChild(fs);
      const dl = mkIcon(SVG.download, tone === 'brand' ? 'color/icon/inverse' : 'color/icon/default', 20); dl.name = 'Download'; bub.appendChild(dl);
    }
    const meta = frame('Meta', 'HORIZONTAL'); GAP(meta, 'spacing/2xs'); meta.counterAxisAlignItems = 'CENTER'; col.appendChild(meta);
    if (failed) {
      meta.appendChild(await txt('Status', 'Not sent', 'Label/Small', 'color/text/danger'));
      meta.appendChild(await txt('Retry', 'Retry', 'Label/Small', 'color/text/brand'));
    } else {
      meta.appendChild(await txt('Time', '14:35', 'Label/Small', 'color/text/secondary'));
      if (mine) { const ic = mkIcon(status === 'Read' ? SVG.checks : SVG.check, status === 'Read' ? 'color/icon/brand' : 'color/icon/default', 14); ic.name = 'Status icon'; meta.appendChild(ic); }
    }
    comps.push(row);
  }
  // grid: columns by Type, rows by Side/Status
  const typeCol = { Text: 0, Photo: 1, File: 2 }, rowKey = ['Theirs/None', 'Mine/Sent', 'Mine/Read', 'Mine/Failed'];
  const rowH = [0, 0, 0, 0];
  comps.forEach(v => { const m = /Side=(\w+), Type=(\w+), Status=(\w+)/.exec(v.name); const ri = rowKey.indexOf(m[1] + '/' + m[3]); if (v.height > rowH[ri]) rowH[ri] = Math.ceil(v.height); });
  const rowY = []; let yy = 32; for (let i = 0; i < 4; i++) { rowY.push(yy); yy += rowH[i] + 40; }
  comps.forEach(v => { const m = /Side=(\w+), Type=(\w+), Status=(\w+)/.exec(v.name); v.x = 32 + typeCol[m[2]] * (976 + 40); v.y = rowY[rowKey.indexOf(m[1] + '/' + m[3])]; });
  const set = figma.combineAsVariants(comps, sec8); set.name = 'Message bubble';
  for (const ch of set.children) { ch.x += 32; ch.y += 32; }
  set.resizeWithoutConstraints(set.width + 64, set.height + 64);
  report.info.bubble = { count: set.children.length, set: Math.round(set.width) + 'x' + Math.round(set.height), maxWidthSupported: maxWidthOk, sizes: set.children.map(v => v.name.replace(/Side=|Type=|Status=/g, '') + ' ' + Math.round(v.width) + 'x' + Math.round(v.height) + ' bubble ' + (function () { const b = v.findOne(n => n.name === 'Bubble'); return b ? Math.round(b.width) + 'x' + Math.round(b.height) : '?'; })()).join(' | ') };
});

// ---------- Date divider ----------
await step('Date divider', async () => {
  const c = figma.createComponent(); c.name = 'Date divider'; sec8.appendChild(c);
  c.resize(976, 40); c.layoutMode = 'HORIZONTAL'; c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO'; c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER'; c.fills = [];
  const chip = frame('Chip', 'HORIZONTAL'); fillV(chip, 'color/bg/subtle'); RAD(chip, 'radius/full'); PAD(chip, 'spacing/2xs', 'spacing/sm', 'spacing/2xs', 'spacing/sm'); c.appendChild(chip);
  chip.appendChild(await txt('Label', 'Today', 'Label/Small', 'color/text/secondary'));
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

// ---------- read-only inspect for step 238 (Thread menu, Header message icon) ----------
const hexc = c => '#' + [c.r, c.g, c.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
function line(n) {
  let s = n.type + ' "' + n.name + '" ' + Math.round(n.width) + 'x' + Math.round(n.height) + ' @' + Math.round(n.x) + ',' + Math.round(n.y);
  if ('layoutMode' in n && n.layoutMode !== 'NONE') s += ' ' + n.layoutMode;
  if (n.type === 'TEXT') s += ' "' + n.characters.slice(0, 24) + '"';
  if ('fills' in n && n.fills !== figma.mixed && n.fills.length) { const f = n.fills[0]; s += ' fill:' + (f.type === 'SOLID' ? hexc(f.color) : f.type); }
  if (n.visible === false) s += ' HIDDEN';
  return s;
}
function dump(n, d, max, out) { out.push('  '.repeat(d) + line(n)); if (d < max && 'children' in n) for (const c of n.children) dump(c, d + 1, max, out); return out; }
await step('inspect', async () => {
  const mi = findSet(/^Menu icon/);
  if (mi) { const vs = mi.type === 'COMPONENT_SET' ? mi.children : [mi]; let props = ''; try { props = Object.keys(mi.componentPropertyDefinitions).join(', '); } catch (e) { props = 'n/a'; } report.info.menuIcon = { type: mi.type, count: vs.length, names: vs.map(v => v.name).join(' | '), props: props, tree: dump(vs[0], 0, 3, []) }; } else report.info.menuIcon = 'NOT FOUND';
  const mr = findSet(/^Menu row/);
  if (mr) { const vs = mr.type === 'COMPONENT_SET' ? mr.children : [mr]; report.info.menuRow = dump(vs[0], 0, 3, []); }
  const hdr = findSet(/^Header/);
  if (hdr) { const v = hdr.children.find(x => /Desktop, State=Logged in/.test(x.name)); report.info.headerLoggedIn = v ? dump(v, 0, 4, []) : 'variant not found'; const vm = hdr.children.find(x => /Mobile, State=Logged in/.test(x.name)); report.info.headerLoggedInMobile = vm ? dump(vm, 0, 3, []) : 'variant not found'; }
  const sv = silSet.children.find(v => v.name === 'Role=Other, Gender=Male, Size=40'); if (sv) report.info.silhouette40 = dump(sv, 0, 1, []).concat(['cornerRadius ' + sv.cornerRadius]);
});

await figma.setCurrentPageAsync(startPage);
return report;
