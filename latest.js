// step 239 · Messenger components 3 (01 › 8 · Messenger): Menu icon ban + flag, Thread menu (View profile, Block, Report), Message menu (Delete message), Confirm dialog (Delete message / Block person x Desktop / Mobile)

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
for (const n of sec8.children.slice()) { if (['Thread menu', 'Message menu', 'Confirm dialog'].indexOf(n.name) >= 0) n.remove(); }
const IMG = f => 'https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/img/gallery/' + f;

const menuIconSet = findSet(/^Menu icon/), menuRowSet = findSet(/^Menu row/), dlgSet = findSet(/^Log out dialog/);
if (!menuIconSet || !menuRowSet || !dlgSet) throw new Error('Menu icon / Menu row / Log out dialog not found');
async function setText(node, str) { for (const seg of node.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); node.characters = str; }
const effRaised = (await figma.getLocalEffectStylesAsync()).find(s => s.name === 'Shadow/Raised');
if (!effRaised) throw new Error('Shadow/Raised missing');

// ---------- Menu icon: ban, flag ----------
await step('Menu icon variants', async () => {
  const base = menuIconSet.children.find(v => v.name === 'Icon=user');
  if (!base) throw new Error('Icon=user missing');
  const defs = [['ban', '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>'], ['flag', '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>']];
  for (const [nm] of defs) { const old = menuIconSet.children.find(v => v.name === 'Icon=' + nm); if (old) old.remove(); }
  let last = 0; for (const v of menuIconSet.children) if (v.y + v.height > last) last = v.y + v.height;
  for (const [nm, body] of defs) {
    const c = base.clone(); menuIconSet.appendChild(c); c.name = 'Icon=' + nm;
    for (const k of c.children.slice()) k.remove();
    const g = mkIcon(SV(body), 'color/icon/default', 20); g.name = 'Glyph'; c.appendChild(g); g.x = 0; g.y = 0;
    c.x = base.x; c.y = last + 16; last = c.y + c.height;
  }
  menuIconSet.resizeWithoutConstraints(menuIconSet.width, last + 24);
  report.info.menuIcons = menuIconSet.children.map(v => v.name).join(' | ');
});

// ---------- menus ----------
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
function shell(name, w) {
  const c = figma.createComponent(); c.name = name; sec8.appendChild(c);
  c.resize(w, 100); c.layoutMode = 'VERTICAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED';
  PAD(c, 'spacing/xs', 'spacing/xs', 'spacing/xs', 'spacing/xs'); c.itemSpacing = 0; fillV(c, 'color/bg/surface'); RAD(c, 'radius/lg');
  c.strokes = [P(V('color/border/default'))]; c.strokeWeight = 1; c.strokeAlign = 'INSIDE';
  return c;
}
function divider() { const r = figma.createRectangle(); r.name = 'Divider'; r.resize(264, 1); fillV(r, 'color/border/default'); return r; }
await step('Thread menu', async () => {
  const c = shell('Thread menu', 280); await c.setEffectStyleIdAsync(effRaised.id);
  for (const [lb, ic, d] of [['View profile', 'user', false], ['__div', '', false], ['Block', 'ban', true], ['Report', 'flag', false]]) {
    if (lb === '__div') { const dv = divider(); c.appendChild(dv); dv.layoutSizingHorizontal = 'FILL'; continue; }
    const r = await row(lb, ic, d); c.appendChild(r); r.layoutSizingHorizontal = 'FILL';
  }
  report.info.threadMenu = Math.round(c.width) + 'x' + Math.round(c.height);
});
await step('Message menu', async () => {
  const c = shell('Message menu', 280); await c.setEffectStyleIdAsync(effRaised.id);
  const r = await row('Delete message', 'trash', true); c.appendChild(r); r.layoutSizingHorizontal = 'FILL';
  report.info.messageMenu = Math.round(c.width) + 'x' + Math.round(c.height);
});

// ---------- Confirm dialog (from Log out dialog) ----------
await step('Confirm dialog', async () => {
  const kinds = [['Delete message', 'Delete message?', 'This removes the message from your view only. Tom will still see it.', 'Delete'], ['Block person', 'Block Tom Reilly?', 'They can no longer message you or send contact requests. Unblock anytime in Settings.', 'Block']];
  const comps = [];
  for (const [kind, title, body, ok] of kinds) {
    for (const device of ['Desktop', 'Mobile']) {
      const src = dlgSet.children.find(v => v.name === 'Device=' + device); if (!src) throw new Error('Log out dialog variant missing: ' + device);
      const c = src.clone(); sec8.appendChild(c); c.name = 'Kind=' + kind + ', Device=' + device;
      const copy = c.findOne(n => n.name === 'Copy'); const ts = copy.children.filter(n => n.type === 'TEXT');
      await setText(ts[0], title); await setText(ts[1], body); ts[0].name = 'Title'; ts[1].name = 'Body';
      ts[1].textAutoResize = 'HEIGHT'; copy.primaryAxisSizingMode = 'AUTO'; c.primaryAxisSizingMode = 'AUTO';
      const btns = c.findAll(n => n.type === 'INSTANCE' && /^Button/.test(n.name));
      const okBtn = btns.find(b => { const t = b.findOne(n => n.type === 'TEXT'); return t && t.characters === 'Log out'; });
      if (!okBtn) throw new Error('Log out button not found in ' + c.name + ' (buttons: ' + btns.map(b => b.name).join(', ') + ')');
      const lt = okBtn.findOne(n => n.type === 'TEXT'); await setText(lt, ok); okBtn.name = 'Button · ' + ok;
      comps.push(c);
    }
  }
  let yy = 32; comps.forEach((v, i) => { v.x = 32 + (i % 2) * (Math.ceil(comps[0].width) + 40); if (i % 2 === 0 && i > 0) yy += Math.ceil(Math.max(comps[i - 1].height, comps[i - 2].height)) + 40; v.y = yy; });
  const set = figma.combineAsVariants(comps, sec8); set.name = 'Confirm dialog';
  for (const ch of set.children) { ch.x += 32; ch.y += 32; }
  set.resizeWithoutConstraints(set.width + 64, set.height + 64);
  report.info.confirmDialog = set.children.map(v => v.name + ' ' + Math.round(v.width) + 'x' + Math.round(v.height)).join(' | ');
  report.info.confirmButtons = set.children.map(v => v.name + ': ' + v.findAll(n => n.type === 'INSTANCE' && /^Button/.test(n.name)).map(b => b.name + ' [' + (b.findOne(n => n.type === 'TEXT') || {}).characters + ']').join(' , ')).join(' | ');
  const sample = set.children.find(v => /Block person, Device=Desktop/.test(v.name));
  report.info.confirmBlockTree = (function dd(n, d, out) { out.push('  '.repeat(d) + n.type + ' "' + n.name + '" ' + Math.round(n.width) + 'x' + Math.round(n.height) + (n.type === 'TEXT' ? ' "' + n.characters.slice(0, 40) + '"' : '')); if (d < 2 && 'children' in n) for (const k of n.children) dd(k, d + 1, out); return out; })(sample, 0, []);
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

await figma.setCurrentPageAsync(startPage);
return report;
