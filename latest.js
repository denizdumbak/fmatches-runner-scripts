// step 244 · Revert Delete for everyone: Delete message dialog back to view-only text, remove Delete received variants and Radio option, re-grid Confirm dialog (fixes overlap in 01)

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


async function setText(node, str) { for (const seg of node.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); node.characters = str; }
await step('Confirm dialog: revert options', async () => {
  const dset = sec8.children.find(n => n.type === 'COMPONENT_SET' && n.name === 'Confirm dialog'); if (!dset) throw new Error('Confirm dialog set not found');
  for (const v of dset.children.slice()) { if (/^Kind=Delete received/.test(v.name)) v.remove(); }
  for (const device of ['Desktop', 'Mobile']) {
    const v = dset.children.find(x => x.name === 'Kind=Delete message, Device=' + device); if (!v) throw new Error('variant missing: Delete message ' + device);
    const o = v.findOne(n => n.name === 'Delete options'); if (o) o.remove();
    const body = v.findOne(n => n.name === 'Body'); await setText(body, 'This removes the message from your view only. Tom will still see it.');
    body.textAutoResize = 'HEIGHT'; v.primaryAxisSizingMode = 'AUTO';
  }
  // re-grid: rows by Kind, columns by Device, y from real heights
  const kinds = ['Delete message', 'Block person'];
  const colX = {}; for (const d of ['Desktop', 'Mobile']) { const v = dset.children.find(x => x.name === 'Kind=Delete message, Device=' + d); colX[d] = v.x; }
  let y = Math.min.apply(null, dset.children.map(v => v.y));
  for (const k of kinds) {
    let h = 0;
    for (const d of ['Desktop', 'Mobile']) { const v = dset.children.find(x => x.name === 'Kind=' + k + ', Device=' + d); if (!v) throw new Error('variant missing ' + k + ' ' + d); v.x = colX[d]; v.y = y; h = Math.max(h, Math.ceil(v.height)); }
    y += h + 40;
  }
  let right = 0, bottom = 0; for (const v of dset.children) { right = Math.max(right, v.x + v.width); bottom = Math.max(bottom, v.y + v.height); }
  dset.resizeWithoutConstraints(Math.ceil(right + 32), Math.ceil(bottom + 32));
  report.info.confirmDialog = dset.children.map(v => v.name.replace('Kind=', '').replace('Device=', '') + ' ' + Math.round(v.width) + 'x' + Math.round(v.height) + ' @' + Math.round(v.x) + ',' + Math.round(v.y)).join(' | ');
  const ov = []; for (let i = 0; i < dset.children.length; i++) for (let j = i + 1; j < dset.children.length; j++) { const a = dset.children[i], b = dset.children[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov.push(a.name + ' x ' + b.name); }
  report.info.confirmDialogOverlaps = ov.length ? ov : 'none';
  report.info.deleteBodies = dset.children.filter(v => /Delete message/.test(v.name)).map(v => v.findOne(n => n.name === 'Body').characters.slice(0, 30) + ' (' + v.findOne(n => n.name === 'Body').parent.name + ')').join(' | ');
});
await step('Remove Radio option', async () => {
  const stillUsed = [];
  const rs = sec8.children.find(n => n.type === 'COMPONENT_SET' && n.name === 'Radio option');
  if (rs) { rs.remove(); report.info.radio = 'removed'; } else report.info.radio = 'not present';
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


await step('Messenger / Delete message page: recenter dialog', async () => {
  const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync(); await figma.setCurrentPageAsync(p02);
  const web = p02.children.find(n => n.type === 'SECTION' && /^Web/.test(n.name)); const msgSec = web.children.find(n => n.type === 'SECTION' && n.name === 'Messenger');
  const pd = msgSec.children.find(n => n.name === 'Messenger / Delete message · Desktop');
  if (pd) { const d = pd.findOne(n => /^Confirm dialog/.test(n.name)); d.y = Math.round((pd.height - d.height) / 2); d.x = Math.round((pd.width - d.width) / 2); report.info.deletePage = 'dialog ' + Math.round(d.width) + 'x' + Math.round(d.height) + ' at ' + Math.round(d.x) + ',' + Math.round(d.y); } else report.info.deletePage = 'page not found';
});
await figma.setCurrentPageAsync(startPage);
return report;
