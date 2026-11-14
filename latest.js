// step 411 · Faz 8 (3): Offline. 01 › 11 · System: Offline notice (Page notice klonu, koyu, Lucide wifi-off) + Offline state (tam ekran mesaj). 02: yeni "Offline" Section'i (Web + Mobile): Offline (sayfa acikken serit) + No connection (tam ekran)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const sz = n => R(n.width) + 'x' + R(n.height);
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name) || allVars.find(x => x.name.endsWith('/' + name)); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const PAD = (n, t, r, b, l) => { n.setBoundVariable('paddingTop', V(t)); n.setBoundVariable('paddingRight', V(r)); n.setBoundVariable('paddingBottom', V(b)); n.setBoundVariable('paddingLeft', V(l)); };
const GAP = (n, v) => n.setBoundVariable('itemSpacing', V(v));
const RAD = (n, v) => { for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) n.setBoundVariable(k, V(v)); };
const styles = await figma.getLocalTextStylesAsync();
const TS = nm => { const s = styles.find(x => x.name === nm); if (!s) throw new Error('text style yok: ' + nm); return s; };
for (const s of styles) { try { await figma.loadFontAsync(s.fontName); } catch (e) {} }
async function setText(t, s) { const f = t.fontName; await figma.loadFontAsync(f === figma.mixed ? t.getRangeFontName(0, 1) : f); t.characters = s; }
async function txt(name, str, style, color) { const t = figma.createText(); t.name = name; await t.setTextStyleIdAsync(TS(style).id); t.characters = str; t.fills = [P(V(color))]; return t; }
function frame(name, dir) { const f = figma.createFrame(); f.name = name; f.layoutMode = dir; f.fills = []; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; f.clipsContent = false; return f; }
const fillW = n => { try { n.layoutSizingHorizontal = 'FILL'; } catch (e) {} };
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
const nav = dest => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
async function clearNav(root) {
  for (const n of [root].concat(root.findAll(() => true))) {
    try { const rs = n.reactions; if (!rs || !rs.length) continue;
      const keep = rs.filter(r => !(r.actions || (r.action ? [r.action] : [])).some(isNavAct));
      if (keep.length !== rs.length) await n.setReactionsAsync(keep); } catch (e) {}
  }
}
// Lucide wifi-off (ISC)
const WIFI_OFF = '<path d="M12 20h.01"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/><path d="M5 12.859a10 10 0 0 1 5.17-2.69"/><path d="M19 12.859a10 10 0 0 0-2.007-1.523"/><path d="M2 8.82a15 15 0 0 1 4.177-2.643"/><path d="M22 8.82a15 15 0 0 0-11.288-3.764"/><path d="m2 2 20 20"/>';
function mkIcon(body, colorVar, size) {
  const n = figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>');
  n.name = 'Icon'; n.fills = [];
  for (const v of n.findAll(x => x.type === 'VECTOR')) { v.strokes = [P(V(colorVar))]; v.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; }
  n.resize(size, size);
  return n;
}
const SYS = '11 · System';
const sec01 = p01.findOne(n => n.type === 'SECTION' && n.name === SYS);
if (!sec01) throw new Error(SYS + ' yok (409)');
const findSet = nm => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === nm);
const btnSet = findSet('Button');
async function button(label, style) {
  const b = btnSet.children.find(v => v.name === 'Style=' + style + ', State=Default').createInstance(); b.name = 'Button · ' + label;
  b.setProperties({ 'Label#8:0': label }); const t = b.findOne(n => n.type === 'TEXT'); if (t) await setText(t, label); return b;
}
let noticeSet = null, stateSet = null;

// ---------- 1. 01 component'leri
await figma.setCurrentPageAsync(p01);
await step('Temizlik 01', async () => {
  for (const n of sec01.children.slice()) if (/^(Offline notice|Offline state)$/.test(n.name) || (n.type === 'TEXT' && /^Offline/.test(n.characters))) n.remove();
  for (const n of p01.children.slice()) if (n.type === 'COMPONENT' && /^Device=/.test(n.name)) n.remove();
});
await step('Offline notice', async () => {
  const pn = findSet('Page notice'); if (!pn) throw new Error('Page notice yok');
  const comps = [];
  for (const dev of ['Desktop', 'Mobile']) {
    const c = pn.children.find(v => v.name === 'Device=' + dev).clone(); sec01.appendChild(c); c.name = 'Device=' + dev;
    c.fills = [P(V('color/bg/inverse'))];
    const oldIcon = c.findOne(n => n.name === 'Icon'); const idx = c.children.indexOf(oldIcon);
    const ic = mkIcon(WIFI_OFF, 'color/icon/inverse', 20); c.insertChild(Math.max(0, idx), ic); if (oldIcon) oldIcon.remove();
    const t = c.findOne(n => n.type === 'TEXT' && n.name === 'Text'); await setText(t, "You're offline. Showing what was loaded last.");
    t.fills = [P(V('color/text/inverse'))];
    const l = c.findOne(n => n.type === 'TEXT' && n.name === 'Link'); await setText(l, 'Try again'); l.name = 'Link · Try again';
    l.fills = [P(V('color/text/inverse'))]; l.textDecoration = 'UNDERLINE';
    comps.push(c);
  }
  const set = figma.combineAsVariants(comps, sec01); set.name = 'Offline notice';
  set.description = 'Offline notice: appears under Navigation when the connection drops while a page is open, pushes the page down, disappears by itself when the connection is back. Dark system layer, same shape as Page notice. "Try again" reloads the current page.';
  comps[0].x = 0; comps[0].y = 0; comps[1].x = 0; comps[1].y = comps[0].height + 40;
  set.resizeWithoutConstraints(1440, comps[1].y + comps[1].height);
  noticeSet = set;
});
await step('Offline state', async () => {
  const comps = [];
  for (const dev of ['Desktop', 'Mobile']) {
    const D = dev === 'Desktop';
    const c = figma.createComponent(); c.name = 'Device=' + dev; c.fills = [];
    c.layoutMode = 'VERTICAL'; c.counterAxisAlignItems = 'CENTER'; GAP(c, 'spacing/md');
    c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED'; c.resize(D ? 480 : 358, 100); c.primaryAxisSizingMode = 'AUTO';
    const box = frame('Icon box', 'HORIZONTAL'); box.primaryAxisAlignItems = 'CENTER'; box.counterAxisAlignItems = 'CENTER';
    box.primaryAxisSizingMode = 'FIXED'; box.counterAxisSizingMode = 'FIXED'; box.resize(64, 64);
    box.fills = [P(V('color/bg/subtle'))]; RAD(box, 'radius/full');
    box.appendChild(mkIcon(WIFI_OFF, 'color/icon/default', 28));
    c.appendChild(box);
    const title = await txt('Title', 'No internet connection', D ? 'Heading/H2' : 'Heading/H3', 'color/text/primary');
    const body = await txt('Body', 'Check your Wi-Fi or mobile data, then try again.', 'Body/Default', 'color/text/secondary');
    title.textAlignHorizontal = 'CENTER'; body.textAlignHorizontal = 'CENTER';
    c.appendChild(title); c.appendChild(body); fillW(body); body.textAutoResize = 'HEIGHT';
    const sp = frame('Spacer', 'VERTICAL'); sp.resize(1, 8); sp.primaryAxisSizingMode = 'FIXED'; c.appendChild(sp);
    const b = await button('Try again', 'Primary'); c.appendChild(b);
    sec01.appendChild(c); comps.push(c);
  }
  const set = figma.combineAsVariants(comps, sec01); set.name = 'Offline state';
  set.description = 'Offline state: full-screen message when a page cannot load at all. Shown on a bare page with Navigation only (no Ticker or Footer, they need live data). "Try again" reloads the page.';
  comps[0].x = 0; comps[0].y = 0; comps[1].x = comps[0].width + 80; comps[1].y = 0;
  set.resizeWithoutConstraints(comps[1].x + comps[1].width, Math.max(comps[0].height, comps[1].height));
  stateSet = set;
});
await step('01 yerlesim', async () => {
  const dlg = findSet('Cookie dialog');
  const note = async (str, y) => { const t = await txt('Note', str, 'Label/Small', 'color/text/secondary'); sec01.appendChild(t); t.x = 80; t.y = y; };
  let y = dlg.y + dlg.height + 120;
  await note('Offline notice: shows under Navigation when the connection drops; hides itself when back online.', y - 50);
  noticeSet.x = 80; noticeSet.y = y; y += noticeSet.height + 120;
  await note('Offline state: full-screen message when a page cannot load.', y - 50);
  stateSet.x = 80; stateSet.y = y;
  const right = Math.max.apply(null, sec01.children.map(n => n.x + n.width)), bottom = Math.max.apply(null, sec01.children.map(n => n.y + n.height));
  sec01.resizeWithoutConstraints(right + 80, bottom + 80);
  const arch = p01.findOne(n => n.type === 'SECTION' && /^Archive/.test(n.name)); if (arch) arch.x = sec01.x + sec01.width + 160;
  report.info.components = { notice: noticeSet.children.map(v => v.name + ' ' + sz(v)), state: stateSet.children.map(v => v.name + ' ' + sz(v)), section: sz(sec01) };
});

// ---------- 2. 02 ekranlari
await figma.setCurrentPageAsync(p02);
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const home = { Web: web.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · Desktop'), Mobile: mob.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · Mobile') };
const SEC = 'Offline', S = { Web: {}, Mobile: {} }, secs = {};
await step('Section hazirla', async () => {
  for (const [key, plat] of [['Web', web], ['Mobile', mob]]) {
    let s = plat.children.find(n => n.type === 'SECTION' && n.name === SEC);
    if (s) { for (const c of s.children.slice()) c.remove(); }
    else {
      const ck = plat.children.find(n => n.type === 'SECTION' && n.name === 'Cookies & privacy');
      s = figma.createSection(); s.name = SEC; plat.appendChild(s); s.x = ck.x; s.y = ck.y + ck.height + 160;
    }
    secs[key] = s;
  }
});
for (const key of ['Web', 'Mobile']) {
  const D = key === 'Web', dev = D ? 'Desktop' : 'Mobile', sec = secs[key];
  await step(key + ' ekranlar', async () => {
    const a = home[key].clone(); sec.appendChild(a); a.name = 'System / Offline · ' + dev;
    a.primaryAxisSizingMode = 'FIXED'; a.resize(D ? 1440 : 390, D ? 900 : 844); a.clipsContent = true;
    await clearNav(a);
    const ni = noticeSet.children.find(v => v.name === 'Device=' + dev).createInstance(); ni.name = 'Offline notice';
    a.insertChild(a.children.findIndex(c => c.name === 'Navigation') + 1, ni); fillW(ni);
    const b = home[key].clone(); sec.appendChild(b); b.name = 'System / No connection · ' + dev;
    await clearNav(b);
    for (const c of b.children.slice()) if (c.name !== 'Navigation') c.remove();
    const body = frame('Offline body', 'VERTICAL'); body.fills = [P(V('color/bg/canvas'))];
    body.primaryAxisAlignItems = 'CENTER'; body.counterAxisAlignItems = 'CENTER';
    b.appendChild(body); fillW(body); body.layoutSizingVertical = 'FILL';
    PAD(body, 'spacing/2xl', D ? 'layout/page-gutter' : 'spacing/md', 'spacing/2xl', D ? 'layout/page-gutter' : 'spacing/md');
    const si = stateSet.children.find(v => v.name === 'Device=' + dev).createInstance(); si.name = 'Offline state'; body.appendChild(si);
    b.primaryAxisSizingMode = 'FIXED'; b.resize(D ? 1440 : 390, D ? 900 : 844); b.clipsContent = true;
    body.layoutSizingVertical = 'FILL';
    a.x = D ? 80 : 80; a.y = D ? 100 : 80; b.x = D ? 2000 : 550; b.y = a.y;
    S[key] = { a, b };
    const right = Math.max.apply(null, sec.children.map(n => n.x + n.width)), bottom = Math.max.apply(null, sec.children.map(n => n.y + n.height));
    sec.resizeWithoutConstraints(right + 80, bottom + 80);
  });
}
await step('Prototip + kontrol', async () => {
  const links = [];
  for (const key of ['Web', 'Mobile']) {
    const s = S[key]; if (!s.a) continue;
    for (const [scr, nm] of [[s.a, 'Link · Try again'], [s.b, 'Button · Try again']]) {
      const el = scr.findOne(n => n.name === nm); if (!el) { report.errors.push(scr.name + ': ' + nm + ' yok'); continue; }
      await el.setReactionsAsync([nav(home[key])]); links.push(scr.name + ' :: ' + nm + ' -> ' + home[key].name);
    }
  }
  const mine = new Set([].concat.apply([], ['Web', 'Mobile'].map(k => S[k].a ? [S[k].a.id, S[k].b.id] : [])));
  p02.flowStartingPoints = p02.flowStartingPoints.filter(f => !mine.has(f.nodeId));
  for (const plat of [web, mob]) {
    const bottom = Math.max.apply(null, plat.children.map(n => n.y + n.height)), right = Math.max.apply(null, plat.children.map(n => n.x + n.width));
    plat.resizeWithoutConstraints(Math.max(plat.width, right + 120), Math.ceil(bottom + 120));
  }
  mob.x = Math.max(mob.x, web.x + web.width + 400);
  const ov = [];
  for (const plat of [web, mob]) { const ss = plat.children.filter(n => n.type === 'SECTION');
    for (let i = 0; i < ss.length; i++) for (let j = i + 1; j < ss.length; j++) { const a = ss[i], b = ss[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov.push(plat.name + ': ' + a.name + ' x ' + b.name); } }
  const centre = [];
  for (const k of ['Web', 'Mobile']) { const s = S[k]; if (!s.b) continue; const st = s.b.findOne(n => n.name === 'Offline state'); const fb = s.b.absoluteBoundingBox, b = st.absoluteBoundingBox;
    centre.push(k + ' dx ' + R((b.x - fb.x) - (fb.x + fb.width - b.x - b.width)) + ' stateTop ' + R(b.y - fb.y) + ' stateBottomGap ' + R(fb.y + fb.height - b.y - b.height)); }
  let unbound = 0, unstyled = 0;
  for (const set of [noticeSet, stateSet]) for (const n of set.findAll(() => true)) {
    let p = n.parent, inst = false; while (p && p !== set) { if (p.type === 'INSTANCE') { inst = true; break; } p = p.parent; } if (inst || n.type === 'INSTANCE') continue;
    try { for (const f of (n.fills || [])) if (f.type === 'SOLID' && !(f.boundVariables && f.boundVariables.color)) unbound++; } catch (e) {}
    try { for (const f of (n.strokes || [])) if (f.type === 'SOLID' && !(f.boundVariables && f.boundVariables.color)) unbound++; } catch (e) {}
    if (n.type === 'TEXT' && !n.textStyleId) unstyled++;
  }
  report.info.links = links;
  report.info.flowStarts = p02.flowStartingPoints.length;
  report.info.screens = [].concat.apply([], ['Web', 'Mobile'].map(k => S[k].a ? [S[k].a.name + ' ' + sz(S[k].a), S[k].b.name + ' ' + sz(S[k].b)] : []));
  report.info.sections = Object.keys(secs).map(k => k + ' ' + R(secs[k].x) + ',' + R(secs[k].y) + ' ' + sz(secs[k]));
  report.info.check = { sectionOverlaps: ov.length ? ov : 'none', centre, unboundPaints: unbound, unstyledText: unstyled };
});
return report;
