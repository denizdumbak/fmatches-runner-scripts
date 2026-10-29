// step 243 · Message menu (Copy, Edit, Forward, Delete; Side Mine/Theirs), Delete dialog with options (for me / for everyone), Radio option; menu icons copy, pencil, forward

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

const menuIconSet = findSet(/^Menu icon/), menuRowSet = findSet(/^Menu row/);
if (!menuIconSet || !menuRowSet) throw new Error('Menu icon / Menu row not found');
async function setText(node, str) { for (const seg of node.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); node.characters = str; }
const setIn = async (root, nm, str) => { const t = root.findOne(n => n.type === 'TEXT' && n.name === nm); if (!t) throw new Error('text "' + nm + '" not found in ' + root.name); await setText(t, str); };
for (const n of sec8.children.slice()) { if (n.name === 'Radio option') n.remove(); }

// ---------- Menu icons: copy, pencil, forward ----------
await step('Menu icon variants', async () => {
  const base = menuIconSet.children.find(v => v.name === 'Icon=user'); if (!base) throw new Error('Icon=user missing');
  const defs = [['copy', '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'], ['pencil', '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>'], ['forward', '<path d="m15 17 5-5-5-5"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/>']];
  for (const [nm] of defs) { const old = menuIconSet.children.find(v => v.name === 'Icon=' + nm); if (old) old.remove(); }
  let last = 0; for (const v of menuIconSet.children) if (v.y + v.height > last) last = v.y + v.height;
  for (const [nm, body] of defs) {
    const c = base.clone(); menuIconSet.appendChild(c); c.name = 'Icon=' + nm;
    for (const k of c.children.slice()) k.remove();
    const g = mkIcon(SV(body), 'color/icon/default', 20); g.name = 'Glyph'; c.appendChild(g); g.x = 0; g.y = 0;
    c.x = base.x; c.y = last + 16; last = c.y + c.height;
  }
  menuIconSet.resizeWithoutConstraints(menuIconSet.width, last + 24);
  report.info.menuIcons = menuIconSet.children.map(v => v.name.replace('Icon=', '')).join(' | ');
});

// ---------- Radio option ----------
let radioSet = null;
await step('Radio option', async () => {
  const comps = [];
  for (const sel of [true, false]) {
    const c = figma.createComponent(); c.name = 'Selected=' + (sel ? 'True' : 'False'); sec8.appendChild(c);
    c.resize(336, 64); c.layoutMode = 'HORIZONTAL'; c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO'; c.counterAxisAlignItems = 'MIN';
    PAD(c, 'spacing/sm', 'spacing/sm', 'spacing/sm', 'spacing/sm'); GAP(c, 'spacing/sm'); RAD(c, 'radius/md');
    fillV(c, sel ? 'color/bg/brand-subtle' : 'color/bg/surface'); c.strokes = [P(V(sel ? 'color/bg/brand' : 'color/border/default'))]; c.strokeWeight = 1; c.strokeAlign = 'INSIDE';
    const rd = figma.createFrame(); rd.name = 'Radio'; rd.resize(20, 20); rd.layoutMode = 'HORIZONTAL'; rd.primaryAxisSizingMode = 'FIXED'; rd.counterAxisSizingMode = 'FIXED'; rd.primaryAxisAlignItems = 'CENTER'; rd.counterAxisAlignItems = 'CENTER';
    rd.clipsContent = false; fillV(rd, 'color/bg/surface'); RAD(rd, 'radius/full'); rd.strokes = [P(V(sel ? 'color/bg/brand' : 'color/border/strong'))]; rd.strokeWeight = 2; rd.strokeAlign = 'INSIDE';
    if (sel) { const dot = figma.createFrame(); dot.name = 'Dot'; dot.resize(10, 10); fillV(dot, 'color/bg/brand'); RAD(dot, 'radius/full'); rd.appendChild(dot); }
    c.appendChild(rd); rd.layoutGrow = 0;
    const col = frame('Text', 'VERTICAL'); c.appendChild(col); col.layoutGrow = 1; col.layoutAlign = 'STRETCH';
    col.appendChild(await txt('Label', 'Delete for me', 'Label/Default Strong', 'color/text/primary'));
    const sb = await txt('Sub', 'Removes the message from your view only.', 'Label/Small', 'color/text/secondary'); col.appendChild(sb); sb.layoutSizingHorizontal = 'FILL'; sb.textAutoResize = 'HEIGHT';
    comps.push(c);
  }
  comps[0].x = 32; comps[0].y = 32; comps[1].x = 32; comps[1].y = 32 + Math.ceil(comps[0].height) + 40;
  radioSet = figma.combineAsVariants(comps, sec8); radioSet.name = 'Radio option';
  for (const ch of radioSet.children) { ch.x += 32; ch.y += 32; }
  radioSet.resizeWithoutConstraints(radioSet.width + 64, radioSet.height + 64);
  report.info.radio = radioSet.children.map(v => v.name + ' ' + Math.round(v.width) + 'x' + Math.round(v.height)).join(' | ');
});

// ---------- Message menu: Side = Mine / Theirs ----------
async function row(label, icon, danger) {
  const v = menuRowSet.children.find(x => x.name === 'State=Default, Tone=' + (danger ? 'Danger' : 'Default'));
  if (!v) throw new Error('Menu row variant missing');
  const r = v.createInstance(); r.name = 'Row · ' + label;
  const lt = r.findOne(n => n.type === 'TEXT' && n.name === 'Label'); if (!lt) throw new Error('row Label missing'); await setText(lt, label);
  const ic = r.findOne(n => n.type === 'INSTANCE' && n.name === 'Menu icon'); const iv = menuIconSet.children.find(x => x.name === 'Icon=' + icon);
  if (!ic || !iv) throw new Error('menu icon swap failed for ' + icon);
  ic.swapComponent(iv);
  if (danger) for (const n of ic.findAll(x => x.type !== 'FRAME' && x.type !== 'GROUP' && x.strokes && x.strokes.length)) n.strokes = [P(V('color/text/danger'))];
  return r;
}
function divider() { const r = figma.createRectangle(); r.name = 'Divider'; r.resize(264, 1); fillV(r, 'color/border/default'); return r; }
await step('Message menu (Mine / Theirs)', async () => {
  let set = sec8.children.find(n => n.type === 'COMPONENT_SET' && n.name === 'Message menu');
  let mine = set ? set.children.find(v => v.name === 'Side=Mine') : sec8.children.find(n => n.type === 'COMPONENT' && n.name === 'Message menu');
  if (!mine) throw new Error('Message menu component not found: run step 239 first');
  if (set) { const old = set.children.find(v => v.name === 'Side=Theirs'); if (old) old.remove(); }
  mine.name = 'Side=Mine';
  for (const k of mine.children.slice()) k.remove();
  const add = async (lb, ic, d) => { const r = await row(lb, ic, d); mine.appendChild(r); r.layoutSizingHorizontal = 'FILL'; };
  await add('Copy text', 'copy', false); await add('Edit message', 'pencil', false); await add('Forward', 'forward', false);
  const dv = divider(); mine.appendChild(dv); dv.layoutSizingHorizontal = 'FILL';
  await add('Delete message', 'trash', true);
  const theirs = mine.clone(); theirs.name = 'Side=Theirs';
  const ed = theirs.findOne(n => n.name === 'Row · Edit message'); if (ed) ed.remove();
  if (set) { set.appendChild(theirs); theirs.x = mine.x + Math.ceil(mine.width) + 40; theirs.y = mine.y; set.resizeWithoutConstraints(theirs.x + theirs.width + 32, Math.max(mine.y + mine.height, theirs.y + theirs.height) + 32); }
  else { mine.x = 32; mine.y = 32; theirs.x = 32 + 320; theirs.y = 32; sec8.appendChild(theirs); set = figma.combineAsVariants([mine, theirs], sec8); set.name = 'Message menu'; for (const ch of set.children) { ch.x += 32; ch.y += 32; } set.resizeWithoutConstraints(set.width + 64, set.height + 64); }
  report.info.messageMenu = set.children.map(v => v.name + ' ' + Math.round(v.width) + 'x' + Math.round(v.height) + ' rows ' + v.children.filter(k => /^Row/.test(k.name)).map(k => k.name.replace('Row · ', '')).join('/')).join(' | ');
});

// ---------- Confirm dialog: Delete message with options, Delete received ----------
await step('Confirm dialog (Delete options)', async () => {
  const dset = sec8.children.find(n => n.type === 'COMPONENT_SET' && n.name === 'Confirm dialog'); if (!dset) throw new Error('Confirm dialog set not found: run step 239 first');
  const rA = radioSet.children.find(v => v.name === 'Selected=True'), rB = radioSet.children.find(v => v.name === 'Selected=False');
  for (const device of ['Desktop', 'Mobile']) {
    const v = dset.children.find(x => x.name === 'Kind=Delete message, Device=' + device); if (!v) throw new Error('variant missing: Delete message ' + device);
    const old = v.findOne(n => n.name === 'Delete options'); if (old) old.remove();
    const body = v.findOne(n => n.name === 'Body'); await setText(body, 'Choose who this message is removed for.');
    const opts = frame('Delete options', 'VERTICAL'); GAP(opts, 'spacing/xs');
    const a = rA.createInstance(); a.name = 'Option · Delete for me'; opts.appendChild(a); a.layoutSizingHorizontal = 'FILL';
    const b = rB.createInstance(); b.name = 'Option · Delete for everyone'; opts.appendChild(b); b.layoutSizingHorizontal = 'FILL';
    await setIn(b, 'Label', 'Delete for everyone'); await setIn(b, 'Sub', 'Removes the message for you and Tom.');
    const actions = v.findOne(n => n.name === 'Actions'); const idx = v.children.indexOf(actions);
    v.insertChild(idx, opts); opts.layoutSizingHorizontal = 'FILL';
    v.primaryAxisSizingMode = 'AUTO';
  }
  for (const device of ['Desktop', 'Mobile']) {
    const oldR = dset.children.find(x => x.name === 'Kind=Delete received, Device=' + device); if (oldR) oldR.remove();
  }
  let last = 0; for (const v of dset.children) if (v.y + v.height > last) last = v.y + v.height;
  for (const device of ['Desktop', 'Mobile']) {
    const src = dset.children.find(x => x.name === 'Kind=Block person, Device=' + device); if (!src) throw new Error('variant missing: Block person ' + device);
    const c = src.clone(); dset.appendChild(c); c.name = 'Kind=Delete received, Device=' + device;
    await setIn(c, 'Title', 'Delete message?'); await setIn(c, 'Body', 'This removes the message from your view only. Tom will still see it.');
    const okBtn = c.findAll(n => n.type === 'INSTANCE' && /^Button/.test(n.name)).find(b => { const t = b.findOne(n => n.type === 'TEXT'); return t && t.characters === 'Block'; });
    if (!okBtn) throw new Error('Block button not found in ' + c.name);
    await setText(okBtn.findOne(n => n.type === 'TEXT'), 'Delete'); okBtn.name = 'Button · Delete';
    c.x = src.x; c.y = last + 40;
  }
  let bottom = 0; for (const v of dset.children) if (v.y + v.height > bottom) bottom = v.y + v.height;
  dset.resizeWithoutConstraints(dset.width, bottom + 32);
  report.info.confirmDialog = dset.children.map(v => v.name.replace('Kind=', '').replace('Device=', '') + ' ' + Math.round(v.width) + 'x' + Math.round(v.height)).join(' | ');
  const dv = dset.children.find(x => x.name === 'Kind=Delete message, Device=Desktop');
  report.info.deleteTree = (function dd(n, d, out) { out.push('  '.repeat(d) + n.type + ' "' + n.name + '" ' + Math.round(n.width) + 'x' + Math.round(n.height)); if (d < 2 && 'children' in n) for (const k of n.children) dd(k, d + 1, out); return out; })(dv, 0, []);
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


// ---------- pages: reposition menu and dialog (taller now) ----------
await step('Messenger pages: menu and dialog positions', async () => {
  const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync(); await figma.setCurrentPageAsync(p02);
  const web = p02.children.find(n => n.type === 'SECTION' && /^Web/.test(n.name)); const msgSec = web.children.find(n => n.type === 'SECTION' && n.name === 'Messenger');
  const rel = (page, node) => { const a = node.absoluteBoundingBox, p = page.absoluteBoundingBox; return { x: Math.round(a.x - p.x), y: Math.round(a.y - p.y), w: Math.round(a.width), h: Math.round(a.height) }; };
  const pm = msgSec.children.find(n => n.name === 'Messenger / Message menu · Desktop');
  if (pm) {
    const m = pm.findOne(n => n.name === 'Message menu'); const ms = pm.findOne(n => n.name === 'Messages'); const last = ms.children[ms.children.length - 1]; const bb = rel(pm, last.findOne(n => n.name === 'Bubble'));
    m.y = Math.max(8, bb.y - m.height - 8); report.info.messageMenuPage = 'menu ' + Math.round(m.width) + 'x' + Math.round(m.height) + ' at ' + Math.round(m.x) + ',' + Math.round(m.y) + ' bubble top ' + bb.y;
  } else report.info.messageMenuPage = 'page not found';
  const pd = msgSec.children.find(n => n.name === 'Messenger / Delete message · Desktop');
  if (pd) {
    const d = pd.findOne(n => /^Confirm dialog/.test(n.name)); d.y = Math.round((pd.height - d.height) / 2); d.x = Math.round((pd.width - d.width) / 2);
    report.info.deletePage = 'dialog ' + Math.round(d.width) + 'x' + Math.round(d.height) + ' at ' + Math.round(d.x) + ',' + Math.round(d.y);
  } else report.info.deletePage = 'page not found';
});
await figma.setCurrentPageAsync(startPage);
return report;
