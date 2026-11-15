// step 413 · Faz 8 (4/4): dogrulama e-postasi (600 px, Desktop + Mobile) + Email verified ekranlari (Sign up Section'inda), Check your email -> e-posta -> Email verified prototipi. Mobil Delete account dialog'unda Checkbox genisligi FILL. 01 kokundeki yetim ogeler: yalniz envanter (tasima yok)
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
const findSet = nm => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === nm);
const btnSet = findSet('Button');
async function setBtn(b, label) { b.setProperties({ 'Label#8:0': label }); const t = b.findOne(n => n.type === 'TEXT'); if (t) await setText(t, label); b.name = 'Button · ' + label; }
async function button(label, style) { const b = btnSet.children.find(v => v.name === 'Style=' + style + ', State=Default').createInstance(); await setBtn(b, label); return b; }

// ---------- 0. 01: mobil Delete account dialog'unda checkbox genisligi
await step('Checkbox FILL', async () => {
  const set = findSet('Delete account dialog'); const out = [];
  for (const c of set.children) {
    const cb = c.findOne(n => n.name === 'Checkbox · Confirm'); if (!cb) { out.push(c.name + ': checkbox yok'); continue; }
    const before = sz(cb); fillW(cb);
    const lbl = cb.findOne(n => n.type === 'TEXT'); if (lbl) { try { lbl.layoutSizingHorizontal = 'FILL'; lbl.textAutoResize = 'HEIGHT'; } catch (e) {} }
    out.push(c.name + ' dialog ' + sz(c) + ' checkbox ' + before + ' -> ' + sz(cb) + ' label ' + (lbl ? sz(lbl) : '-'));
  }
  report.info.checkboxFit = out;
});

// ---------- 1. 01 kokundeki yetim ogeler: salt okunur envanter
await step('Yetim envanter 01', async () => {
  const known = /^(Foundations|Start here)/;
  const list = p01.children.filter(n => n.type !== 'SECTION' && !known.test(n.name));
  report.info.orphans01 = { count: list.length, items: list.slice(0, 40).map(n => n.type + ' · ' + n.name + ' · ' + sz(n) + ' @' + R(n.x) + ',' + R(n.y)) };
});

// ---------- 2. 02: yerlesim
await figma.setCurrentPageAsync(p02);
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const signSec = { Web: web.children.find(n => n.type === 'SECTION' && /^Sign up/.test(n.name)), Mobile: mob.children.find(n => n.type === 'SECTION' && /^Sign up/.test(n.name)) };
const setSec = { Web: web.children.find(n => n.type === 'SECTION' && n.name === 'My settings'), Mobile: mob.children.find(n => n.type === 'SECTION' && n.name === 'My settings') };
const mainSet = { Web: setSec.Web.children.find(n => n.name === 'Settings / My settings · Desktop'), Mobile: setSec.Mobile.children.find(n => n.name === 'Settings / My settings · Mobile') };
const statusSet = findSet('Status message');
const logoNode = p01.findOne(n => n.name === 'Logo' && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
const S = { Web: {}, Mobile: {} };

async function buildEmail(dev) {
  const D = dev === 'Desktop', W = D ? 680 : 390;
  const outer = frame('Email / Verify email · ' + dev, 'VERTICAL'); outer.fills = [P(V('color/bg/subtle'))];
  outer.resize(W, 100); outer.primaryAxisSizingMode = 'AUTO'; outer.counterAxisSizingMode = 'FIXED';
  PAD(outer, D ? 'spacing/2xl' : 'spacing/md', D ? 'spacing/2xl' : 'spacing/md', D ? 'spacing/2xl' : 'spacing/md', D ? 'spacing/2xl' : 'spacing/md');
  const card = frame('Email card', 'VERTICAL'); card.fills = [P(V('color/bg/surface'))]; RAD(card, 'radius/lg');
  card.strokes = [P(V('color/border/default'))]; card.strokeWeight = 1; card.strokeAlign = 'INSIDE'; card.clipsContent = true;
  outer.appendChild(card); fillW(card);
  const padX = D ? 'spacing/xl' : 'spacing/lg';
  // header
  const head = frame('Email header', 'HORIZONTAL'); head.counterAxisAlignItems = 'CENTER';
  card.appendChild(head); fillW(head); PAD(head, 'spacing/lg', padX, 'spacing/lg', padX);
  head.strokes = [P(V('color/border/default'))]; head.strokeTopWeight = 0; head.strokeLeftWeight = 0; head.strokeRightWeight = 0; head.strokeBottomWeight = 1; head.strokeAlign = 'INSIDE';
  if (logoNode) { const lc = logoNode.type === 'COMPONENT_SET' ? logoNode.children[0] : logoNode; const li = lc.createInstance(); li.name = 'Logo'; head.appendChild(li); report.info['logo' + dev] = lc.name + ' ' + sz(li); }
  else { const t = await txt('Logo', 'fmatches', D ? 'Heading/H3' : 'Heading/H4', 'color/text/brand'); head.appendChild(t); report.errors.push('Logo component yok, metin yazildi'); }
  // body
  const body = frame('Email body', 'VERTICAL'); card.appendChild(body); fillW(body); GAP(body, 'spacing/md');
  PAD(body, D ? 'spacing/xl' : 'spacing/lg', padX, D ? 'spacing/xl' : 'spacing/lg', padX);
  const h = await txt('Title', 'Confirm your email', D ? 'Heading/H2' : 'Heading/H3', 'color/text/primary'); body.appendChild(h); fillW(h); h.textAutoResize = 'HEIGHT';
  const p1 = await txt('Body', 'Hi Leo,\n\nWelcome to fmatches. Confirm your email address to finish setting up your account.', 'Body/Default', 'color/text/primary'); body.appendChild(p1); fillW(p1); p1.textAutoResize = 'HEIGHT';
  const b = await button('Verify email', 'Primary'); body.appendChild(b);
  const p2 = await txt('Restrictions', 'Until your email is verified you can browse the directory, but you cannot message members, send contact requests or book events.', 'Body/Small', 'color/text/secondary'); body.appendChild(p2); fillW(p2); p2.textAutoResize = 'HEIGHT';
  const p3 = await txt('Fallback', 'Button not working? Paste this link into your browser:', 'Body/Small', 'color/text/secondary'); body.appendChild(p3); fillW(p3); p3.textAutoResize = 'HEIGHT';
  const lk = await txt('Fallback link', 'https://fmatches.com/verify/xxxxxxxx', 'Body/Small', 'color/text/brand'); body.appendChild(lk); fillW(lk); lk.textAutoResize = 'HEIGHT';
  // footer
  const foot = frame('Email footer', 'VERTICAL'); card.appendChild(foot); fillW(foot); GAP(foot, 'spacing/xs'); PAD(foot, 'spacing/lg', padX, 'spacing/lg', padX);
  foot.fills = [P(V('color/bg/subtle'))];
  const f1 = await txt('Footer note', 'You received this email because someone signed up at fmatches.com with this address. If that was not you, you can ignore this message.', 'Label/Small', 'color/text/secondary'); foot.appendChild(f1); fillW(f1); f1.textAutoResize = 'HEIGHT';
  const f2 = await txt('Footer brand', 'FriendlyMatches International · fmatches.com', 'Label/Small', 'color/text/secondary'); foot.appendChild(f2); fillW(f2); f2.textAutoResize = 'HEIGHT';
  return outer;
}

for (const key of ['Web', 'Mobile']) {
  const D = key === 'Web', dev = D ? 'Desktop' : 'Mobile', sec = signSec[key];
  await step(key + ' e-posta ve Email verified', async () => {
    for (const n of sec.children.slice()) if (/^(Email \/ Verify email|Sign up \/ Email verified|Signup \/ Email verified) · /.test(n.name) || (n.type === 'TEXT' && /^(Verification email|Email verified)/.test(n.characters))) n.remove();
    const em = await buildEmail(dev); sec.appendChild(em);
    // Email verified ekrani: Settings ekraninin klonu, yalniz Navigation + Status message
    const v = mainSet[key].clone(); sec.appendChild(v); v.name = 'Signup / Email verified · ' + dev;
    await clearNav(v);
    for (const c of v.children.slice()) if (c.name !== 'Navigation') c.remove();
    const bodyF = frame('Status body', 'VERTICAL'); bodyF.fills = [P(V('color/bg/canvas'))];
    bodyF.primaryAxisAlignItems = 'CENTER'; bodyF.counterAxisAlignItems = 'CENTER';
    v.appendChild(bodyF); fillW(bodyF);
    PAD(bodyF, 'spacing/2xl', D ? 'layout/page-gutter' : 'spacing/md', 'spacing/2xl', D ? 'layout/page-gutter' : 'spacing/md');
    const si = statusSet.children.find(x => x.name === 'Kind=Email verified, Device=' + dev).createInstance(); si.name = 'Status message'; bodyF.appendChild(si);
    const H = D ? 900 : 844;
    v.primaryAxisSizingMode = 'FIXED'; v.resize(D ? 1440 : 390, H); v.clipsContent = true; bodyF.layoutSizingVertical = 'FILL';
    // yerlesim: mevcut ekranlarin sagina
    const others = sec.children.filter(n => n.type === 'FRAME' && n !== em && n !== v);
    const right = Math.max.apply(null, others.map(n => n.x + n.width)), top = Math.min.apply(null, others.map(n => n.y));
    em.x = right + 160; em.y = top + 60; v.x = em.x + em.width + 160; v.y = top;
    const mk = async (str, x, y) => { const t = await txt('Note', str, 'Label/Small', 'color/text/secondary'); sec.appendChild(t); t.x = x; t.y = y; };
    await mk(D ? 'Verification email: 600 px card, link verifies the user (email_check 0 to 1). Developer: build as table-based HTML with a system font fallback (Arial), Barlow and Inter are not available in most mail clients; use a bulletproof button; set the link expiry in the backend.' : 'Verification email on a phone: the card shrinks to the device width, same content.', em.x, em.y - 44);
    S[key] = { em, v };
    report.info['emailFrames' + key] = [em.name + ' ' + sz(em), v.name + ' ' + sz(v)];
  });
}

// ---------- 3. prototip
await step('Prototip', async () => {
  const links = [];
  async function link(root, pred, dest, label) {
    const el = root.findOne(pred);
    if (!el) { report.errors.push('link yok: ' + label + ' / ' + root.name); return; }
    const keep = (el.reactions || []).filter(r => !(r.actions || []).some(isNavAct));
    await el.setReactionsAsync(keep.concat([nav(dest)])); links.push(root.name + ' :: ' + el.name + ' -> ' + dest.name);
  }
  report.info.checkCandidates = {};
  for (const key of ['Web', 'Mobile']) {
    const D = key === 'Web', dev = D ? 'Desktop' : 'Mobile', s = S[key]; if (!s.em) continue;
    await link(s.em, n => n.name === 'Button · Verify email', s.v, 'Verify email');
    const prof = (D ? web : mob).findOne(n => n.type === 'FRAME' && /^Own profile( \/ (Main|Default))? · /.test(n.name) && new RegExp('· ' + dev + '$').test(n.name));
    if (prof) await link(s.v, n => n.name === 'Button · Go to my profile', prof, 'Go to my profile'); else report.errors.push('Own profile ekrani bulunamadi (' + key + ')');
    const chk = signSec[key].children.find(n => n.type === 'FRAME' && /check your email/i.test(n.name) && new RegExp('· ' + dev + '$').test(n.name));
    if (!chk) { report.errors.push('Check your email ekrani yok (' + key + ')'); continue; }
    const cands = chk.findAll(n => (n.type === 'INSTANCE' && /^(Button|Link)/.test(n.name)) || (n.type === 'TEXT' && /open|inbox|resend|mail/i.test(n.characters)));
    report.info.checkCandidates[chk.name] = cands.slice(0, 12).map(n => n.type + ' · ' + n.name + (n.type === 'TEXT' ? ' "' + n.characters.slice(0, 40) + '"' : ''));
    const target = chk.findOne(n => n.type === 'INSTANCE' && /^(Button|Link) · (Open|Go to|Check)/i.test(n.name));
    if (target) { const keep = (target.reactions || []).filter(r => !(r.actions || []).some(isNavAct)); await target.setReactionsAsync(keep.concat([nav(s.em)])); links.push(chk.name + ' :: ' + target.name + ' -> ' + s.em.name); }
    else report.errors.push('Check your email: "open email" dugmesi yok, link kurulmadi (' + key + '), adaylar report.info.checkCandidates');
  }
  const mine = new Set([].concat.apply([], ['Web', 'Mobile'].map(k => S[k].em ? [S[k].em.id, S[k].v.id] : [])));
  p02.flowStartingPoints = p02.flowStartingPoints.filter(f => !mine.has(f.nodeId));
  report.info.links = links; report.info.flowStarts = p02.flowStartingPoints.length;
});

// ---------- 4. Section ve platform oturtma + kontrol
function settle(plat) {
  const secs = plat.children.filter(n => n.type === 'SECTION').sort((a, b) => a.y - b.y);
  const moved = [];
  for (let i = 1; i < secs.length; i++) {
    const s = secs[i]; let need = -Infinity;
    for (let j = 0; j < i; j++) { const a = secs[j]; if (a.x < s.x + s.width && s.x < a.x + a.width) need = Math.max(need, a.y + a.height + 160); }
    if (need > s.y) { moved.push(s.name + ' ' + R(s.y) + ' -> ' + R(need)); s.y = need; }
  }
  const bottom = Math.max.apply(null, plat.children.map(n => n.y + n.height)), right = Math.max.apply(null, plat.children.map(n => n.x + n.width));
  plat.resizeWithoutConstraints(Math.max(plat.width, right + 120), Math.ceil(bottom + 120));
  return moved;
}
await step('Oturtma ve kontrol', async () => {
  for (const key of ['Web', 'Mobile']) {
    const sec = signSec[key];
    const right = Math.max.apply(null, sec.children.map(n => n.x + n.width)), bottom = Math.max.apply(null, sec.children.map(n => n.y + n.height));
    sec.resizeWithoutConstraints(right + 80, bottom + 80);
  }
  report.info.moved = { Web: settle(web), Mobile: settle(mob) };
  mob.x = Math.max(mob.x, web.x + web.width + 400);
  const ov = [];
  for (const plat of [web, mob]) { const ss = plat.children.filter(n => n.type === 'SECTION');
    for (let i = 0; i < ss.length; i++) for (let j = i + 1; j < ss.length; j++) { const a = ss[i], b = ss[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov.push(plat.name + ': ' + a.name + ' x ' + b.name); } }
  const scrOv = [];
  for (const key of ['Web', 'Mobile']) { const fr = signSec[key].children.filter(n => n.type === 'FRAME');
    for (let i = 0; i < fr.length; i++) for (let j = i + 1; j < fr.length; j++) { const a = fr[i], b = fr[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) scrOv.push(a.name + ' x ' + b.name); } }
  let unbound = 0, unstyled = 0;
  for (const key of ['Web', 'Mobile']) { const s = S[key]; if (!s.em) continue;
    for (const root of [s.em, s.v]) for (const n of root.findAll(() => true)) {
      let p = n.parent, inst = false; while (p && p !== root) { if (p.type === 'INSTANCE') { inst = true; break; } p = p.parent; } if (inst || n.type === 'INSTANCE') continue;
      try { for (const f of (n.fills || [])) if (f.type === 'SOLID' && !(f.boundVariables && f.boundVariables.color)) unbound++; } catch (e) {}
      try { for (const f of (n.strokes || [])) if (f.type === 'SOLID' && !(f.boundVariables && f.boundVariables.color)) unbound++; } catch (e) {}
      if (n.type === 'TEXT' && !n.textStyleId) unstyled++;
    } }
  const over = [];
  for (const key of ['Web', 'Mobile']) { const s = S[key]; if (!s.em) continue; const card = s.em.findOne(n => n.name === 'Email card'); const bad = card.findAll(n => n.type !== 'INSTANCE' && n.parent && n.parent !== card && n.absoluteBoundingBox && n.parent.absoluteBoundingBox && (n.absoluteBoundingBox.x + n.absoluteBoundingBox.width > n.parent.absoluteBoundingBox.x + n.parent.absoluteBoundingBox.width + 1)).map(n => n.name); over.push(key + ' card ' + sz(card) + ' overflow: ' + (bad.length ? bad.join(', ') : 'none')); }
  report.info.emailFit = over;
  report.info.check = { sectionOverlaps: ov.length ? ov : 'none', screenOverlapsSignUp: scrOv.length ? scrOv : 'none', unboundPaints: unbound, unstyledText: unstyled };
});
return report;
