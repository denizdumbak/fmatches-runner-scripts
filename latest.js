// step 238 · Messenger components 2 (01 › 8 · Messenger): Icon button variants (More, Back, Attach, Send), Composer (Kind x 5), Thread header (Device) + read-only inspect of Menu icon / Menu row / Header logged in (carried over from 237)

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
for (const n of sec8.children.slice()) { if (['Composer', 'Thread header'].indexOf(n.name) >= 0) n.remove(); }
const IMG = f => 'https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/img/gallery/' + f;

const btnSet = findSet(/^Button$/), badgeSet = findSet(/^Verification badge/);
if (!btnSet || !badgeSet) throw new Error('Button or Verification badge set not found');
async function setText(node, str) { const f = node.fontName === figma.mixed ? node.getRangeFontName(0, 1) : node.fontName; await figma.loadFontAsync(f); node.characters = str; }
async function mkBtn(label, style) {
  const bv = btnSet.children.find(v => new RegExp('Style=' + style).test(v.name) && /State=Default/.test(v.name)) || btnSet.children[0];
  const b = bv.createInstance(); b.name = 'Button · ' + label; const cp = b.componentProperties || {};
  const lk = Object.keys(cp).find(k => /^Label/.test(k)); const ik = Object.keys(cp).find(k => /^Icon/.test(k));
  if (lk) b.setProperties({ [lk]: label }); if (ik) b.setProperties({ [ik]: false });
  const bt = b.findOne(n => n.type === 'TEXT'); if (bt) await setText(bt, label); return b;
}
const ib = findSet(/^Icon button$/);
if (!ib || ib.type !== 'COMPONENT_SET') throw new Error('Icon button set not found');
const ibVar = n => { const v = ib.children.find(x => x.name === 'Icon=' + n); if (!v) throw new Error('Icon button variant missing: ' + n); return v.createInstance(); };
const photo40 = () => {
  const photo = frame('Photo'); photo.resize(40, 40); photo.clipsContent = true; RAD(photo, 'radius/full');
  const sv = silSet.children.find(v => v.name === 'Role=Other, Gender=Male, Size=40') || silSet.children[0];
  const i0 = sv.createInstance(); i0.name = 'Silhouette'; photo.appendChild(i0); i0.x = 0; i0.y = 0; return photo;
};
const topLine = c => { c.strokes = [P(V('color/border/default'))]; c.strokeAlign = 'INSIDE'; c.strokeTopWeight = 1; c.strokeLeftWeight = 0; c.strokeRightWeight = 0; c.strokeBottomWeight = 0; };
const bottomLine = c => { c.strokes = [P(V('color/border/default'))]; c.strokeAlign = 'INSIDE'; c.strokeTopWeight = 0; c.strokeLeftWeight = 0; c.strokeRightWeight = 0; c.strokeBottomWeight = 1; };

// ---------- Icon button variants ----------
await step('Icon button variants', async () => {
  const base = ib.children.find(v => v.name === 'Icon=Search');
  if (!base) throw new Error('Icon=Search not found');
  const defs = [['More', SVG.more], ['Back', SVG.back], ['Attach', SVG.attach], ['Send', SVG.send]];
  for (const [nm] of defs) { const old = ib.children.find(v => v.name === 'Icon=' + nm); if (old) old.remove(); }
  const sorted = ib.children.slice().sort((a, b) => a.y - b.y);
  const gap = sorted.length > 1 ? Math.max(16, Math.round(sorted[1].y - (sorted[0].y + sorted[0].height))) : 32;
  let last = 0; for (const v of ib.children) if (v.y + v.height > last) last = v.y + v.height;
  for (const [nm, svg] of defs) {
    const c = base.clone(); ib.appendChild(c); c.name = 'Icon=' + nm;
    for (const k of c.children.slice()) k.remove();
    const send = nm === 'Send';
    if (send) fillV(c, 'color/bg/brand');
    const ic = mkIcon(svg, send ? 'color/icon/inverse' : 'color/icon/default', 22); ic.name = 'Icon · ' + nm; c.appendChild(ic); if (c.layoutMode === 'NONE') { ic.x = 9; ic.y = 9; }
    c.x = base.x; c.y = last + gap; last = c.y + c.height;
  }
  ib.resizeWithoutConstraints(ib.width, last + 32);
  report.info.iconButton = { variants: ib.children.map(v => v.name).join(' | '), size: Math.round(ib.width) + 'x' + Math.round(ib.height), moreLayout: ib.children.find(v => v.name === 'Icon=More').layoutMode };
});

// ---------- Composer ----------
await step('Composer', async () => {
  const kinds = ['Default', 'Disabled', 'Add to contacts', 'Request pending', 'Blocked'];
  const comps = [];
  for (const kind of kinds) {
    const c = figma.createComponent(); c.name = 'Kind=' + kind; sec8.appendChild(c);
    c.resize(1040, 80); c.layoutMode = 'HORIZONTAL'; c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO'; c.counterAxisAlignItems = 'CENTER';
    PAD(c, 'spacing/md', 'spacing/lg', 'spacing/md', 'spacing/lg'); GAP(c, 'spacing/sm'); fillV(c, 'color/bg/surface'); topLine(c);
    if (kind === 'Default' || kind === 'Disabled') {
      const att = ibVar('Attach'); att.name = 'Attach'; c.appendChild(att);
      const inp = frame('Input', 'HORIZONTAL'); inp.counterAxisAlignItems = 'CENTER'; fillV(inp, 'color/bg/subtle'); RAD(inp, 'radius/lg'); PAD(inp, 'spacing/sm', 'spacing/md', 'spacing/sm', 'spacing/md');
      c.appendChild(inp); inp.layoutGrow = 1; inp.layoutAlign = 'STRETCH';
      const ph = await txt('Placeholder', kind === 'Default' ? 'Write a message' : 'Messaging is available after you verify your email', 'Body/Default', 'color/text/secondary'); inp.appendChild(ph); ph.layoutSizingHorizontal = 'FILL'; ph.textAutoResize = 'HEIGHT'; ph.textTruncation = 'ENDING'; ph.maxLines = 1;
      const snd = ibVar('Send'); snd.name = 'Send'; c.appendChild(snd);
      if (kind === 'Disabled') { att.opacity = 0.5; inp.opacity = 0.5; snd.opacity = 0.5; }
    } else {
      const col = frame('Text', 'VERTICAL'); GAP(col, 'spacing/2xs'); c.appendChild(col); col.layoutGrow = 1; col.layoutAlign = 'STRETCH';
      const title = kind === 'Add to contacts' ? 'Connect with Tom to message him' : kind === 'Request pending' ? 'Request pending' : 'You blocked this person';
      const body = kind === 'Add to contacts' ? 'Tom only accepts messages from contacts. Send a request and write once he accepts.' : kind === 'Request pending' ? 'You can message Tom once he accepts your contact request.' : 'They cannot message you or send contact requests. Unblock to chat again.';
      col.appendChild(await txt('Title', title, 'Label/Default Strong', 'color/text/primary'));
      const bd = await txt('Body', body, 'Body/Small', 'color/text/secondary'); col.appendChild(bd); bd.layoutSizingHorizontal = 'FILL'; bd.textAutoResize = 'HEIGHT';
      if (kind === 'Add to contacts') c.appendChild(await mkBtn('Add to contacts', 'Primary'));
      if (kind === 'Blocked') c.appendChild(await mkBtn('Unblock', 'Secondary'));
    }
    comps.push(c);
  }
  let yy = 32; comps.forEach(v => { v.x = 32; v.y = yy; yy += Math.ceil(v.height) + 40; });
  const set = figma.combineAsVariants(comps, sec8); set.name = 'Composer';
  for (const ch of set.children) { ch.x += 32; ch.y += 32; }
  set.resizeWithoutConstraints(set.width + 64, set.height + 64);
  report.info.composer = set.children.map(v => v.name + ' ' + Math.round(v.width) + 'x' + Math.round(v.height)).join(' | ');
});

// ---------- Thread header ----------
await step('Thread header', async () => {
  const comps = [];
  for (const device of ['Desktop', 'Mobile']) {
    const mob = device === 'Mobile';
    const c = figma.createComponent(); c.name = 'Device=' + device; sec8.appendChild(c);
    c.resize(mob ? 390 : 1040, 72); c.layoutMode = 'HORIZONTAL'; c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO'; c.counterAxisAlignItems = 'CENTER';
    PAD(c, 'spacing/md', mob ? 'spacing/sm' : 'spacing/lg', 'spacing/md', mob ? 'spacing/sm' : 'spacing/lg'); GAP(c, mob ? 'spacing/sm' : 'spacing/md'); fillV(c, 'color/bg/surface'); bottomLine(c);
    if (mob) { const bk = ibVar('Back'); bk.name = 'Back'; c.appendChild(bk); }
    c.appendChild(photo40());
    const info = frame('Info', 'VERTICAL'); GAP(info, 'spacing/2xs'); c.appendChild(info); info.layoutGrow = 1; info.layoutAlign = 'STRETCH'; info.primaryAxisAlignItems = 'CENTER';
    const nr = frame('Name row', 'HORIZONTAL'); GAP(nr, 'spacing/xs'); nr.counterAxisAlignItems = 'CENTER'; info.appendChild(nr);
    nr.appendChild(await txt('Name', 'Tom Reilly', 'Label/Large Strong', 'color/text/primary'));
    const bd = badgeSet.children.find(v => v.name === 'Status=Verified').createInstance(); bd.name = 'Verification badge'; nr.appendChild(bd); if (mob) bd.visible = false;
    const meta = await txt('Meta', 'Manager · Northgate Athletic', 'Label/Small', 'color/text/secondary'); info.appendChild(meta); meta.layoutSizingHorizontal = 'FILL'; meta.textAutoResize = 'HEIGHT'; meta.textTruncation = 'ENDING'; meta.maxLines = 1;
    const more = ibVar('More'); more.name = 'More'; c.appendChild(more);
    comps.push(c);
  }
  comps[0].x = 32; comps[0].y = 32; comps[1].x = 32; comps[1].y = 32 + Math.ceil(comps[0].height) + 40;
  const set = figma.combineAsVariants(comps, sec8); set.name = 'Thread header';
  for (const ch of set.children) { ch.x += 32; ch.y += 32; }
  set.resizeWithoutConstraints(set.width + 64, set.height + 64);
  report.info.threadHeader = set.children.map(v => v.name + ' ' + Math.round(v.width) + 'x' + Math.round(v.height)).join(' | ');
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
