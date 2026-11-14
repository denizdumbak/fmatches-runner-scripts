// step 412 · Faz 8 (4): Delete account. 01: Delete account dialog (Log out dialog klonu + Checkbox) + Status message (Kind Account deleted / Email verified). Settings ekranlarina Account karti. My settings Section'ina Delete account (dialog) + Account deleted ekranlari, prototip. Cookie aciklamalarinda footer cumlesi kalkar
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
function mkIcon(body, colorVar, size) {
  const n = figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>');
  n.name = 'Icon'; n.fills = [];
  for (const v of n.findAll(x => x.type !== 'FRAME' && x.type !== 'GROUP')) { v.strokes = [P(V(colorVar))]; try { v.fills = []; } catch (e) {} v.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; }
  n.resize(size, size); return n;
}
// Lucide (ISC): user-x, mail-check
const USER_X = '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" x2="22" y1="8" y2="13"/><line x1="22" x2="17" y1="8" y2="13"/>';
const MAIL_CHECK = '<path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><path d="m16 19 2 2 4-4"/>';
const findSet = nm => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === nm);
const btnSet = findSet('Button');
async function button(label, style) {
  const b = btnSet.children.find(v => v.name === 'Style=' + style + ', State=Default').createInstance(); b.name = 'Button · ' + label;
  b.setProperties({ 'Label#8:0': label }); const t = b.findOne(n => n.type === 'TEXT'); if (t) await setText(t, label); return b;
}
async function relabel(b, label) { b.setProperties({ 'Label#8:0': label }); const t = b.findOne(n => n.type === 'TEXT'); if (t) await setText(t, label); b.name = 'Button · ' + label; }
const sec01 = p01.findOne(n => n.type === 'SECTION' && n.name === '11 · System');
let delSet = null, statusSet = null;

// ---------- 0. Cookie aciklamalari (footer cumlesi kalkar)
await step('Cookie metinleri', async () => {
  const b = findSet('Cookie banner'), d = findSet('Cookie dialog');
  b.description = 'Cookie banner: fixed to the bottom of the viewport on the first visit, above the page content, no scrim. Reject all and Accept all have equal weight (same style, side by side) so declining is as easy as accepting. Manage opens Cookie dialog. The banner hides after any choice; "Cookie settings" on the Privacy policy page reopens Cookie dialog.';
  d.description = 'Cookie dialog: opened from Manage on Cookie banner and from "Cookie settings" on the Privacy policy page. Centered over a scrim. Necessary is always on (locked Switch); Analytics and Marketing are off until the user turns them on. Developer: match the categories to the cookies the site really sets.';
  for (const v of d.children) { const t = v.findOne(n => n.type === 'TEXT' && n.name === 'Body'); if (t) await setText(t, 'Choose which cookies fmatches can use. You can change this any time on the Privacy policy page.'); }
  for (const t of sec01.children.filter(n => n.type === 'TEXT' && /footer link/.test(n.characters))) await setText(t, 'Cookie dialog: opens from Manage and from Cookie settings on the Privacy policy page. Necessary is locked on.');
});

// ---------- 1. 01 component'leri
await figma.setCurrentPageAsync(p01);
await step('Temizlik 01', async () => {
  for (const n of sec01.children.slice()) if (/^(Delete account dialog|Status message)$/.test(n.name) || (n.type === 'TEXT' && /^(Delete account dialog|Status message)/.test(n.characters))) n.remove();
  for (const n of p01.children.slice()) if (n.type === 'COMPONENT' && /^(Device|Kind)=/.test(n.name)) n.remove();
});
await step('Delete account dialog', async () => {
  const lo = findSet('Log out dialog'), cb = findSet('Checkbox');
  const comps = [];
  for (const dev of ['Desktop', 'Mobile']) {
    const c = lo.children.find(v => v.name === 'Device=' + dev).clone(); sec01.appendChild(c); c.name = 'Device=' + dev;
    const copy = c.findOne(n => n.name === 'Copy'); const tx = copy.findAll(n => n.type === 'TEXT');
    tx[0].name = 'Title'; await setText(tx[0], 'Delete your account?');
    tx[1].name = 'Body'; await setText(tx[1], 'Your profile will be hidden from search, the map and club pages, and your personal details will be removed. Messages you sent stay in other chats without your name. This cannot be undone.');
    for (const t of tx) { try { t.layoutSizingHorizontal = 'FILL'; t.textAutoResize = 'HEIGHT'; } catch (e) {} }
    const box = cb.children.find(v => v.name === 'Checked=On, State=Default').createInstance(); box.name = 'Checkbox · Confirm';
    c.insertChild(c.children.indexOf(copy) + 1, box);
    const lt = box.findOne(n => n.type === 'TEXT'); if (lt) await setText(lt, 'I understand this cannot be undone');
    const acts = c.findOne(n => n.name === 'Actions');
    const pr = acts.findAll(n => n.type === 'INSTANCE' && /^Button/.test(n.name)).find(b => !/Cancel/.test(b.name));
    await relabel(pr, 'Delete account');
    comps.push(c);
  }
  const set = figma.combineAsVariants(comps, sec01); set.name = 'Delete account dialog';
  set.description = 'Delete account dialog: opened from Settings › Account. "Delete account" stays disabled until the checkbox is ticked (shown ticked here). Developer: soft delete (deleted = 1, deleted_at), anonymise personal data, hide the profile, keep logs and message history.';
  comps[0].x = 0; comps[0].y = 0; comps[1].x = comps[0].width + 80; comps[1].y = 0;
  set.resizeWithoutConstraints(comps[1].x + comps[1].width, Math.max(comps[0].height, comps[1].height));
  delSet = set;
});
await step('Status message', async () => {
  const off = findSet('Offline state');
  const KINDS = [
    { kind: 'Account deleted', icon: USER_X, box: 'color/bg/subtle', ic: 'color/icon/default', title: 'Your account has been deleted', body: 'Your profile is hidden and your personal details have been removed.', btn: 'Back to home' },
    { kind: 'Email verified', icon: MAIL_CHECK, box: 'color/bg/brand-subtle', ic: 'color/icon/brand', title: 'Your email is verified', body: 'You can now message members, send contact requests and book events.', btn: 'Go to my profile' }
  ];
  const comps = [];
  for (const k of KINDS) for (const dev of ['Desktop', 'Mobile']) {
    const c = off.children.find(v => v.name === 'Device=' + dev).clone(); sec01.appendChild(c); c.name = 'Kind=' + k.kind + ', Device=' + dev;
    const bx = c.findOne(n => n.name === 'Icon box'); bx.fills = [P(V(k.box))];
    const old = bx.findOne(n => n.name === 'Icon'); if (old) old.remove(); bx.appendChild(mkIcon(k.icon, k.ic, 28));
    await setText(c.findOne(n => n.type === 'TEXT' && n.name === 'Title'), k.title);
    await setText(c.findOne(n => n.type === 'TEXT' && n.name === 'Body'), k.body);
    await relabel(c.findOne(n => n.type === 'INSTANCE' && /^Button/.test(n.name)), k.btn);
    comps.push(c);
  }
  const set = figma.combineAsVariants(comps, sec01); set.name = 'Status message';
  set.description = 'Status message: full-page result after an account action, same layout as Offline state. Account deleted: shown logged out after Delete account. Email verified: page the verification link opens.';
  comps.forEach((c, i) => { c.x = (i % 2) * 560; c.y = Math.floor(i / 2) * 320; });
  set.resizeWithoutConstraints(560 + comps[1].width, 320 + Math.max(comps[2].height, comps[3].height));
  statusSet = set;
});
await step('01 yerlesim', async () => {
  const st = findSet('Offline state');
  const note = async (str, y) => { const t = await txt('Note', str, 'Label/Small', 'color/text/secondary'); sec01.appendChild(t); t.x = 80; t.y = y; };
  let y = st.y + st.height + 120;
  await note('Delete account dialog: Settings › Account. Soft delete, see the component description.', y - 50);
  delSet.x = 80; delSet.y = y; y += delSet.height + 120;
  await note('Status message: result pages for Account deleted and Email verified.', y - 50);
  statusSet.x = 80; statusSet.y = y;
  const right = Math.max.apply(null, sec01.children.map(n => n.x + n.width)), bottom = Math.max.apply(null, sec01.children.map(n => n.y + n.height));
  sec01.resizeWithoutConstraints(right + 80, bottom + 80);
  const arch = p01.findOne(n => n.type === 'SECTION' && /^Archive/.test(n.name)); if (arch) arch.x = sec01.x + sec01.width + 160;
  report.info.components = { del: delSet.children.map(v => v.name + ' ' + sz(v)), status: statusSet.children.map(v => v.name + ' ' + sz(v)) };
});

// ---------- 2. Settings Account karti
await figma.setCurrentPageAsync(p02);
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const sset = { Web: web.children.find(n => n.type === 'SECTION' && n.name === 'My settings'), Mobile: mob.children.find(n => n.type === 'SECTION' && n.name === 'My settings') };
const home = { Web: web.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · Desktop'), Mobile: mob.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · Mobile') };
const mainSet = { Web: sset.Web.children.find(n => n.name === 'Settings / My settings · Desktop'), Mobile: sset.Mobile.children.find(n => n.name === 'Settings / My settings · Mobile') };
const cardLog = [];
await step('Account karti', async () => {
  for (const key of ['Web', 'Mobile']) for (const f of sset[key].children.filter(n => n.type === 'FRAME' && /^Settings \/ My settings( \/ No blocked people)? · /.test(n.name))) {
    const col = f.findOne(n => n.name === 'Column');
    const old = col.findOne(n => n.name === 'Account card'); if (old) old.remove();
    const src = col.children.find(n => n.name === 'Blocked people card');
    if (!src) { cardLog.push(f.name + ': Blocked people card yok'); continue; }
    const card = src.clone(); col.appendChild(card); card.name = 'Account card';
    for (const c of card.children.slice()) if (c.name !== 'Card head') c.remove();
    await setText(card.findOne(n => n.name === 'Card heading'), 'Account');
    await setText(card.findOne(n => n.name === 'Card help'), 'Delete your account. Your profile will be hidden and your personal details removed.');
    try { card.itemSpacing = 8; } catch (e) {}
    const b = await button('Delete account', 'Secondary'); card.appendChild(b);
    const bt = b.findOne(n => n.type === 'TEXT'); if (bt) bt.fills = [P(V('color/text/danger'))];
    cardLog.push(f.name + ' -> ' + sz(f));
  }
});

// ---------- 3. ekranlar
const S = { Web: {}, Mobile: {} };
for (const key of ['Web', 'Mobile']) {
  const D = key === 'Web', dev = D ? 'Desktop' : 'Mobile', sec = sset[key];
  await step(key + ' ekranlar', async () => {
    for (const n of sec.children.slice()) if (/^Settings \/ (Delete account|Account deleted) · /.test(n.name)) n.remove();
    const scrimSrc = (D ? web : mob).findOne(n => n.type === 'RECTANGLE' && n.name === 'Scrim' && R(n.width) === (D ? 1440 : 390));
    const a = mainSet[key].clone(); sec.appendChild(a); a.name = 'Settings / Delete account · ' + dev;
    await clearNav(a);
    // ekran: sayfa sonuna kaydirilmis gorunum, Account karti gorunsun
    a.primaryAxisSizingMode = 'FIXED'; const H = D ? 900 : 844; const full = mainSet[key].height;
    a.clipsContent = true;
    const shift = full - H;
    for (const c of a.children) { }
    a.resize(D ? 1440 : 390, H);
    // icerigi yukari kaydirmak icin ilk iki cocuk (Ticker, Navigation) hariç govdeyi sabit tutamayiz; bunun yerine bir sarici yok, ust kisim gorunur kalir
    const sc = scrimSrc.clone(); a.appendChild(sc); sc.layoutPositioning = 'ABSOLUTE'; sc.x = 0; sc.y = 0; sc.resize(a.width, a.height);
    const d = delSet.children.find(v => v.name === 'Device=' + dev).createInstance(); d.name = 'Delete account dialog';
    a.appendChild(d); d.layoutPositioning = 'ABSOLUTE'; d.x = R((a.width - d.width) / 2); d.y = R((a.height - d.height) / 2);
    const b = home[key].clone(); sec.appendChild(b); b.name = 'Settings / Account deleted · ' + dev;
    await clearNav(b);
    for (const c of b.children.slice()) if (c.name !== 'Navigation') c.remove();
    const body = frame('Status body', 'VERTICAL'); body.fills = [P(V('color/bg/canvas'))];
    body.primaryAxisAlignItems = 'CENTER'; body.counterAxisAlignItems = 'CENTER';
    b.appendChild(body); fillW(body);
    PAD(body, 'spacing/2xl', D ? 'layout/page-gutter' : 'spacing/md', 'spacing/2xl', D ? 'layout/page-gutter' : 'spacing/md');
    const si = statusSet.children.find(v => v.name === 'Kind=Account deleted, Device=' + dev).createInstance(); si.name = 'Status message'; body.appendChild(si);
    b.primaryAxisSizingMode = 'FIXED'; b.resize(D ? 1440 : 390, H); b.clipsContent = true; body.layoutSizingVertical = 'FILL';
    const xs = sec.children.filter(n => n.type === 'FRAME' && n !== a && n !== b).map(n => n.x + n.width);
    const startX = Math.max.apply(null, xs) + (D ? 480 : 160);
    a.x = startX; a.y = D ? 100 : 80; b.x = startX + (D ? 1920 : 470); b.y = a.y;
    S[key] = { a, b };
  });
}
await step('Prototip', async () => {
  const links = [];
  async function link(root, name, dest) {
    const el = root.findOne(n => n.name === name);
    if (!el) { report.errors.push('link: ' + name + ' yok / ' + root.name); return; }
    const keep = (el.reactions || []).filter(r => !(r.actions || []).some(isNavAct));
    await el.setReactionsAsync(keep.concat([nav(dest)])); links.push(root.name + ' :: ' + name + ' -> ' + dest.name);
  }
  for (const key of ['Web', 'Mobile']) {
    const s = S[key]; if (!s.a) continue;
    await link(mainSet[key], 'Button · Delete account', s.a);
    await link(s.a, 'Button · Cancel', mainSet[key]);
    await link(s.a, 'Button · Delete account', s.b);
    await link(s.b, 'Button · Back to home', home[key]);
  }
  const mine = new Set([].concat.apply([], ['Web', 'Mobile'].map(k => S[k].a ? [S[k].a.id, S[k].b.id] : [])));
  p02.flowStartingPoints = p02.flowStartingPoints.filter(f => !mine.has(f.nodeId));
  report.info.links = links; report.info.flowStarts = p02.flowStartingPoints.length;
});

// ---------- 4. Section ve platform oturtma + kontrol
function settle(plat) {
  const secs = plat.children.filter(n => n.type === 'SECTION').sort((a, b) => a.y - b.y);
  const moved = [];
  for (let i = 1; i < secs.length; i++) {
    const s = secs[i];
    let need = -Infinity;
    for (let j = 0; j < i; j++) { const a = secs[j]; if (a.x < s.x + s.width && s.x < a.x + a.width) need = Math.max(need, a.y + a.height + 160); }
    if (need > s.y) { moved.push(s.name + ' ' + R(s.y) + ' -> ' + R(need)); s.y = need; }
  }
  const bottom = Math.max.apply(null, plat.children.map(n => n.y + n.height)), right = Math.max.apply(null, plat.children.map(n => n.x + n.width));
  plat.resizeWithoutConstraints(Math.max(plat.width, right + 120), Math.ceil(bottom + 120));
  return moved;
}
await step('Oturtma ve kontrol', async () => {
  for (const key of ['Web', 'Mobile']) {
    const sec = sset[key];
    const right = Math.max.apply(null, sec.children.map(n => n.x + n.width)), bottom = Math.max.apply(null, sec.children.map(n => n.y + n.height));
    sec.resizeWithoutConstraints(right + 80, bottom + 80);
  }
  report.info.moved = { Web: settle(web), Mobile: settle(mob) };
  mob.x = Math.max(mob.x, web.x + web.width + 400);
  const ov = [];
  for (const plat of [web, mob]) { const ss = plat.children.filter(n => n.type === 'SECTION');
    for (let i = 0; i < ss.length; i++) for (let j = i + 1; j < ss.length; j++) { const a = ss[i], b = ss[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov.push(plat.name + ': ' + a.name + ' x ' + b.name); } }
  const scrOv = [];
  for (const key of ['Web', 'Mobile']) { const fr = sset[key].children.filter(n => n.type === 'FRAME');
    for (let i = 0; i < fr.length; i++) for (let j = i + 1; j < fr.length; j++) { const a = fr[i], b = fr[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) scrOv.push(a.name + ' x ' + b.name); } }
  let unbound = 0, unstyled = 0;
  for (const set of [delSet, statusSet]) if (set) for (const n of set.findAll(() => true)) {
    let p = n.parent, inst = false; while (p && p !== set) { if (p.type === 'INSTANCE') { inst = true; break; } p = p.parent; } if (inst || n.type === 'INSTANCE') continue;
    try { for (const f of (n.fills || [])) if (f.type === 'SOLID' && !(f.boundVariables && f.boundVariables.color)) unbound++; } catch (e) {}
    try { for (const f of (n.strokes || [])) if (f.type === 'SOLID' && !(f.boundVariables && f.boundVariables.color)) unbound++; } catch (e) {}
    if (n.type === 'TEXT' && !n.textStyleId) unstyled++;
  }
  const dlgFit = [];
  for (const key of ['Web', 'Mobile']) { const s = S[key]; if (!s.a) continue; const d = s.a.findOne(n => n.name === 'Delete account dialog'); const cb = d.findOne(n => n.name === 'Checkbox · Confirm'); dlgFit.push(key + ' dialog ' + sz(d) + ' y ' + R(d.y) + ' checkbox ' + (cb ? sz(cb) : '-')); }
  report.info.cards = cardLog;
  report.info.dialogFit = dlgFit;
  report.info.screens = [].concat.apply([], ['Web', 'Mobile'].map(k => S[k].a ? [S[k].a.name + ' ' + sz(S[k].a), S[k].b.name + ' ' + sz(S[k].b)] : []));
  report.info.check = { sectionOverlaps: ov.length ? ov : 'none', screenOverlaps: scrOv.length ? scrOv : 'none', unboundPaints: unbound, unstyledText: unstyled };
});
return report;
