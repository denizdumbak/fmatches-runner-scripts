// step 185 · Log in ekranlari (02 › Web ve Mobile › Log in): giris, hatali giris, sifre kurtarma, yeni sifre, suresi dolmus baglanti, sifre degistirme (girisli) · oklar, prototip, giris oklari

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
const r = n => Math.round(n);
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const PAD = (n, t, rr, b, l) => { n.setBoundVariable('paddingTop', V(t)); n.setBoundVariable('paddingRight', V(rr)); n.setBoundVariable('paddingBottom', V(b)); n.setBoundVariable('paddingLeft', V(l)); };
const GAP = (n, v) => n.setBoundVariable('itemSpacing', V(v));
const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
for (const k of ['Label/Default', 'Label/Default Strong', 'Label/Small', 'Label/Overline', 'Body/Default', 'Heading/H4']) { if (!TS[k]) throw new Error('text style missing: ' + k); await figma.loadFontAsync(TS[k].fontName); }
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }
async function txt(name, chars, style, color) {
  const t = figma.createText(); t.name = name;
  await t.setTextStyleIdAsync(TS[style].id); t.characters = chars; t.fills = [P(V(color))];
  return t;
}
function frame(name, mode) { const f = figma.createFrame(); f.name = name; f.fills = []; f.clipsContent = false; if (mode) { f.layoutMode = mode; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; f.itemSpacing = 0; } return f; }
const nav = (dest) => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });

const setOf = name => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === name);
const btnSet = setOf('Button'), fieldSet = setOf('Form field');
const keyOf = (set, re) => Object.keys(set.componentPropertyDefinitions).find(k => re.test(k));
const BTN_LABEL = keyOf(btnSet, /^Label#/), BTN_ICON = keyOf(btnSet, /^Icon#/);
async function button(style, label) {
  const v = btnSet.children.find(c => c.variantProperties.Style === style && c.variantProperties.State === 'Default');
  const i = v.createInstance(); const props = {}; props[BTN_LABEL] = label; if (BTN_ICON) props[BTN_ICON] = false; i.setProperties(props);
  const t = i.findOne(n => n.type === 'TEXT'); if (t && t.characters !== label) { await loadFonts(t); t.characters = label; }
  i.name = 'Button · ' + label; return i;
}
async function field(type, state, label, value, chips) {
  const v = fieldSet.children.find(c => c.variantProperties.Type === type && c.variantProperties.State === state);
  if (!v) throw new Error('Form field variant missing: ' + type + ' ' + state);
  const i = v.createInstance();
  const lt = i.findOne(n => n.type === 'TEXT' && n.name === 'Label'); await loadFonts(lt); lt.characters = label;
  if (value !== undefined) { const vt = i.findOne(n => n.type === 'TEXT' && n.name === 'Value' && n.parent && n.parent.name === 'Field'); if (vt) { await loadFonts(vt); vt.characters = value; } }
  if (chips) {
    const cs = i.findAll(n => n.name === 'Chip');
    cs.forEach((c, k) => { if (k < chips.length) { const t = c.findOne(n => n.type === 'TEXT'); t.characters = chips[k]; } else c.visible = false; });
  }
  i.name = 'Field · ' + label;
  return i;
}

const BLUE = { r: 13 / 255, g: 153 / 255, b: 1 };
async function elbow(sub, pts, labelText, name, group) {
  const minX = Math.min(...pts.map(q => q[0])), minY = Math.min(...pts.map(q => q[1]));
  const v = figma.createVector(); sub.appendChild(v); v.name = 'Arrow';
  await v.setVectorNetworkAsync({ vertices: pts.map((q, i) => ({ x: q[0] - minX, y: q[1] - minY, strokeCap: i === pts.length - 1 ? 'ARROW_LINES' : 'NONE' })), segments: pts.slice(1).map((q, i) => ({ start: i, end: i + 1 })), regions: [] });
  v.x = minX; v.y = minY; v.strokes = [{ type: 'SOLID', color: BLUE }]; v.strokeWeight = 4; v.strokeJoin = 'ROUND';
  const lab = frame('Label', 'HORIZONTAL'); sub.appendChild(lab);
  lab.paddingTop = 6; lab.paddingBottom = 6; lab.paddingLeft = 10; lab.paddingRight = 10;
  lab.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]; lab.cornerRadius = 6;
  lab.strokes = [{ type: 'SOLID', color: BLUE }]; lab.strokeWeight = 1;
  lab.appendChild(await txt('Text', labelText, 'Label/Default Strong', 'color/text/primary'));
  const g = figma.group([v, lab].concat(group || []), sub); g.name = name;
  return { g, lab };
}


const ckSet = setOf('Checkbox');
async function checkbox(on, label) {
  const v = ckSet.children.find(c => c.variantProperties.Checked === (on ? 'On' : 'Off') && c.variantProperties.State === 'Default');
  const i = v.createInstance(); const t = i.findOne(n => n.type === 'TEXT'); await loadFonts(t); t.characters = label; i.name = 'Checkbox · ' + label; return i;
}
const editSet = setOf('Edit button');
const editBtn = () => { const i = editSet.children.find(v => v.name === 'State=Default').createInstance(); i.name = 'Edit'; return i; };
const ICON = { plus: 'M12 5v14M5 12h14', x: 'M17 7L7 17M7 7l10 10' };
function icon(name, key, size, color) {
  const f = figma.createNodeFromSvg('<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="' + ICON[key] + '" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  f.name = name; f.fills = []; f.clipsContent = false;
  for (const v of f.findAll(n => n.type === 'VECTOR')) { v.strokes = [P(V(color))]; v.fills = []; v.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; }
  f.rescale(size / 24); return f;
}

const hex = p => p && p.color ? '#' + [p.color.r, p.color.g, p.color.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('') : '-';
const RAD = (n, v) => { for (const c of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) n.setBoundVariable(c, V(v)); };
ICON.mail = 'M3 6h18v12H3zM3 7l9 7 9-7';
const ES = {}; for (const s of await figma.getLocalEffectStylesAsync()) ES[s.name] = s;
for (const k of ['Heading/H2', 'Heading/H3']) { if (!TS[k]) throw new Error('text style missing: ' + k); await figma.loadFontAsync(TS[k].fontName); }
await figma.setCurrentPageAsync(p02);

const inst = (set, vname) => { const v = set.children.find(c => c.name === vname); if (!v) throw new Error('variant missing: ' + set.name + ' ' + vname); return v.createInstance(); };
async function setTexts(i, map) { for (const k of Object.keys(map)) { const t = i.findOne(n => n.type === 'TEXT' && n.name === k); if (!t) throw new Error('text ' + k + ' missing in ' + i.name); await loadFonts(t); t.characters = map[k]; } }
const FILLW = n => { n.layoutSizingHorizontal = 'FILL'; return n; };
const add = (p, n) => { p.appendChild(n); n.layoutSizingHorizontal = 'FILL'; return n; };
function fr(name, mode, fillVar) { const f = frame(name, mode); if (fillVar) f.fills = [P(V(fillVar))]; return f; }

// ---------- parcalar ----------
async function head(col, desk, t, s) {
  const h = fr('Heading', 'VERTICAL'); h.counterAxisAlignItems = 'CENTER'; GAP(h, 'spacing/xs'); add(col, h);
  const a = await txt('Title', t, desk ? 'Heading/H2' : 'Heading/H3', 'color/text/primary'); h.appendChild(a); FILLW(a); a.textAutoResize = 'HEIGHT'; a.textAlignHorizontal = 'CENTER';
  const b = await txt('Subtitle', s, 'Body/Default', 'color/text/secondary'); h.appendChild(b); FILLW(b); b.textAutoResize = 'HEIGHT'; b.textAlignHorizontal = 'CENTER';
}
async function cardOf(col, desk) {
  const c = fr('Card', 'VERTICAL', 'color/bg/surface'); GAP(c, 'spacing/lg'); const p = desk ? 'spacing/xl' : 'spacing/md'; PAD(c, p, p, p, p); RAD(c, 'radius/lg');
  await c.setEffectStyleIdAsync(ES['Shadow/Card'].id); add(col, c); return c;
}
function stepperOf(card, D, total, cur) { const i = inst(stepSet, 'Device=' + D + ', Steps=' + total + ', Current=' + cur); add(card, i); return i; }
async function stack(card, name) { const s = fr(name, 'VERTICAL'); GAP(s, 'spacing/md'); add(card, s); return s; }
async function fld(parent, type, state, label, value, chips) { const i = await field(type, state, label, value, chips); add(parent, i); return i; }
async function pair(parent, desk, mk1, mk2) {
  const r = fr('Row', desk ? 'HORIZONTAL' : 'VERTICAL'); GAP(r, 'spacing/md'); add(parent, r); await mk1(r); await mk2(r); return r;
}
async function check(parent, on, label) { const c = await checkbox(on, label); parent.appendChild(c); return c; }
async function actionsRow(card, back, primaryLabel) {
  const row = fr('Actions', 'HORIZONTAL'); row.counterAxisAlignItems = 'CENTER'; row.primaryAxisAlignItems = back ? 'SPACE_BETWEEN' : 'MAX'; add(card, row);
  if (back) row.appendChild(await button('Subtle', 'Back'));
  const pr = await button('Primary', primaryLabel); row.appendChild(pr); return pr;
}
function orRow(card) {
  const r = fr('Divider · or', 'HORIZONTAL'); r.counterAxisAlignItems = 'CENTER'; GAP(r, 'spacing/sm');
  const l1 = fr('Line', 'HORIZONTAL', 'color/border/default'); l1.resize(24, 1); l1.primaryAxisSizingMode = 'FIXED'; l1.counterAxisSizingMode = 'FIXED';
  const l2 = fr('Line', 'HORIZONTAL', 'color/border/default'); l2.resize(24, 1); l2.primaryAxisSizingMode = 'FIXED'; l2.counterAxisSizingMode = 'FIXED';
  r.appendChild(l1); return { r, l1, l2 };
}
async function orDivider(card) {
  const { r, l1, l2 } = orRow(card); r.appendChild(await txt('Text', 'or', 'Label/Small', 'color/text/secondary')); r.appendChild(l2);
  add(card, r); FILLW(l1); FILLW(l2); l1.layoutSizingVertical = 'FIXED'; l2.layoutSizingVertical = 'FIXED';
}


// ---------- step 185: parcalar ----------
const gSet = setOf('Google button'); if (!gSet) throw new Error('Google button missing (run step 176 first)');
const HELPER = keyOf(fieldSet, /^Helper#/); if (!HELPER) throw new Error('Form field Helper property missing');
ICON.check = 'M5 12.5l4.5 4.5L19 7.5';
ICON.clock = 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0 -18zM12 7.5V12l3 2';
const EMAIL = 'leo.marsh@example.com';
const DOTS = '••••••••••';

async function withHelper(i, text) { const p = {}; p[HELPER] = true; i.setProperties(p); const h = i.findOne(n => n.type === 'TEXT' && n.name === 'Helper'); if (!h) throw new Error('Helper text missing'); await loadFonts(h); h.characters = text; }
async function setError(i, text) { const t = i.findOne(n => n.type === 'TEXT' && n.name === 'Error message'); if (!t) throw new Error('Error message text missing'); await loadFonts(t); t.characters = text; }
async function linkFrame(label) { const f = fr('Link · ' + label, 'HORIZONTAL'); const t = await txt('Text', label, 'Label/Default Strong', 'color/text/brand'); f.appendChild(t); return f; }
async function altLine(card, a, b) {
  const r = fr('Alternative', 'HORIZONTAL'); r.primaryAxisAlignItems = 'CENTER'; r.counterAxisAlignItems = 'CENTER'; GAP(r, 'spacing/xs'); add(card, r);
  r.appendChild(await txt('Text', a, 'Label/Default', 'color/text/secondary')); r.appendChild(await txt('Link', b, 'Label/Default Strong', 'color/text/brand'));
}
async function centerLink(card, label) {
  const r = fr('Back', 'HORIZONTAL'); r.primaryAxisAlignItems = 'CENTER'; add(card, r);
  r.appendChild(await txt('Link', label, 'Label/Default Strong', 'color/text/brand')); return r;
}
async function fullBtn(card, style, label) { const b = await button(style, label); add(card, b); return b; }

async function statusCard(c, o) {
  const { desk, col } = c;
  const card = await cardOf(col, desk); card.counterAxisAlignItems = 'CENTER';
  const circ = fr('Icon', 'HORIZONTAL', o.fill); circ.resize(64, 64); circ.primaryAxisSizingMode = 'FIXED'; circ.counterAxisSizingMode = 'FIXED'; circ.primaryAxisAlignItems = 'CENTER'; circ.counterAxisAlignItems = 'CENTER'; RAD(circ, 'radius/full');
  circ.appendChild(icon(o.iconName, o.icon, 28, o.iconColor)); card.appendChild(circ);
  const t = await txt('Title', o.title, desk ? 'Heading/H2' : 'Heading/H3', 'color/text/primary'); add(card, t); t.textAutoResize = 'HEIGHT'; t.textAlignHorizontal = 'CENTER';
  const b = await txt('Body', o.body, 'Body/Default', 'color/text/secondary'); add(card, b); b.textAutoResize = 'HEIGHT'; b.textAlignHorizontal = 'CENTER';
  if (o.btn) { if (o.fillBtn) c.btn = await fullBtn(card, o.btnStyle, o.btn); else { c.btn = await button(o.btnStyle, o.btn); card.appendChild(c.btn); } }
  if (o.link) c.back = await centerLink(card, o.link);
  c.circ = circ; return card;
}

// ---------- sayfa govdeleri ----------
async function pLogin(c, err) {
  const { desk, col } = c;
  await head(col, desk, 'Welcome back', 'Log in to your FriendlyMatches account.');
  const card = await cardOf(col, desk);
  add(card, inst(gSet, 'State=Default')); await orDivider(card);
  const f = await stack(card, 'Fields');
  await fld(f, 'Text', 'Filled', 'Email address', EMAIL);
  const pw = await fld(f, 'Text', err ? 'Error' : 'Filled', 'Password', DOTS);
  if (err) await setError(pw, 'Incorrect email or password.');
  const row = fr('Options', 'HORIZONTAL'); row.counterAxisAlignItems = 'CENTER'; row.primaryAxisAlignItems = 'SPACE_BETWEEN'; add(card, row);
  row.appendChild(await checkbox(false, 'Keep me logged in'));
  c.forgot = await linkFrame('Forgot password?'); row.appendChild(c.forgot);
  c.btn = await fullBtn(card, 'Primary', 'Log in');
  await altLine(card, 'No account yet?', 'Sign up');
}
async function pReset(c) {
  const { desk, col } = c;
  await head(col, desk, 'Reset your password', 'Enter the email you signed up with. We will send you a link to set a new password.');
  const card = await cardOf(col, desk);
  const f = await stack(card, 'Fields'); await fld(f, 'Text', 'Filled', 'Email address', EMAIL);
  c.btn = await fullBtn(card, 'Primary', 'Send reset link');
  await centerLink(card, 'Back to log in');
}
async function pSent(c) {
  await statusCard(c, { fill: 'color/bg/brand-subtle', icon: 'mail', iconName: 'Mail icon', iconColor: 'color/icon/brand', title: 'Check your email', body: 'If an account exists for ' + EMAIL + ', we sent a link to reset your password.', btnStyle: 'Secondary', btn: 'Resend email', link: 'Back to log in' });
}
async function pSetNew(c) {
  const { desk, col } = c;
  await head(col, desk, 'Set a new password', 'Choose a new password for your account.');
  const card = await cardOf(col, desk);
  const f = await stack(card, 'Fields');
  const np = await fld(f, 'Text', 'Filled', 'New password', DOTS); await withHelper(np, 'Use at least 8 characters.');
  await fld(f, 'Text', 'Filled', 'Confirm new password', DOTS);
  c.btn = await fullBtn(card, 'Primary', 'Save new password');
}
async function pUpdated(c) {
  await statusCard(c, { fill: 'color/bg/brand-subtle', icon: 'check', iconName: 'Check icon', iconColor: 'color/icon/brand', title: 'Password updated', body: 'You can now log in with your new password.', btnStyle: 'Primary', btn: 'Log in', fillBtn: true });
}
async function pExpired(c) {
  await statusCard(c, { fill: 'color/bg/warning-subtle', icon: 'clock', iconName: 'Clock icon', iconColor: 'color/icon/default', title: 'This link has expired', body: 'Reset links work once and only for a limited time. Request a new one to continue.', btnStyle: 'Primary', btn: 'Request a new link', fillBtn: true, link: 'Back to log in' });
}
async function pChange(c, done) {
  const { desk, col } = c;
  await head(col, desk, 'Change password', 'Use a password you do not use anywhere else.');
  const card = await cardOf(col, desk);
  if (done) {
    const bn = fr('Banner', 'HORIZONTAL', 'color/bg/brand-subtle'); bn.counterAxisAlignItems = 'CENTER'; GAP(bn, 'spacing/sm'); PAD(bn, 'spacing/md', 'spacing/md', 'spacing/md', 'spacing/md'); RAD(bn, 'radius/md');
    bn.appendChild(icon('Check icon', 'check', 20, 'color/icon/brand')); bn.appendChild(await txt('Text', 'Your password has been updated.', 'Label/Default Strong', 'color/text/primary'));
    add(card, bn);
  }
  const f = await stack(card, 'Fields'); const st = done ? 'Default' : 'Filled', v = done ? undefined : DOTS;
  await fld(f, 'Text', st, 'Current password', v);
  const np = await fld(f, 'Text', st, 'New password', v); await withHelper(np, 'Use at least 8 characters.');
  await fld(f, 'Text', st, 'Confirm new password', v);
  const row = fr('Actions', 'HORIZONTAL'); row.counterAxisAlignItems = 'CENTER'; row.primaryAxisAlignItems = 'MAX'; GAP(row, 'spacing/sm'); add(card, row);
  row.appendChild(await button('Subtle', 'Cancel')); c.btn = await button('Primary', 'Update password'); row.appendChild(c.btn);
}

// ---------- sayfa iskeleti ----------
async function buildPage(D, def) {
  const desk = D === 'Desktop', W = desk ? 1440 : 390;
  const srcName = def.auth ? 'Profiles / Player / Own profile · ' + D : 'Home / Main · ' + D;
  const home = p02.findOne(n => n.type === 'FRAME' && n.name === srcName); if (!home) throw new Error('source page missing: ' + srcName);
  const pg = fr(def.name + ' · ' + D, 'VERTICAL', 'color/bg/canvas'); pg.resize(W, 100); pg.primaryAxisSizingMode = 'AUTO'; pg.counterAxisSizingMode = 'FIXED';
  const mk = nm => { const src = home.findOne(n => n.type === 'INSTANCE' && n.name === nm); if (!src) throw new Error('instance missing in ' + srcName + ': ' + nm); const c = src.clone(); pg.appendChild(c); c.layoutSizingHorizontal = 'FILL'; return c; };
  mk('Ticker'); mk('Navigation');
  const main = fr('Log-in body', 'VERTICAL', 'color/bg/canvas'); main.counterAxisAlignItems = 'CENTER'; GAP(main, 'spacing/lg');
  if (desk) PAD(main, 'layout/section-padding-y', 'layout/page-gutter', 'spacing/4xl', 'layout/page-gutter'); else PAD(main, 'spacing/lg', 'spacing/md', 'spacing/xl', 'spacing/md');
  add(pg, main);
  const col = fr('Column', 'VERTICAL'); GAP(col, 'spacing/lg'); main.appendChild(col);
  if (desk) { col.resize(480, 100); col.primaryAxisSizingMode = 'AUTO'; col.counterAxisSizingMode = 'FIXED'; } else FILLW(col);
  mk('Footer');
  const c = { D, desk, col }; await def.fn(c); c.pg = pg; return c;
}
const DEFS = [
  { key: 'login', name: 'Log in', row: 0, col: 0, fn: c => pLogin(c, false) },
  { key: 'reset', name: 'Log in / Forgot password', row: 0, col: 1, fn: pReset },
  { key: 'sent', name: 'Log in / Forgot password / Check your email', row: 0, col: 2, fn: pSent },
  { key: 'setnew', name: 'Log in / Set new password', row: 0, col: 3, fn: pSetNew },
  { key: 'updated', name: 'Log in / Set new password / Updated', row: 0, col: 4, fn: pUpdated },
  { key: 'error', name: 'Log in / Wrong password', row: 1, col: 0, fn: c => pLogin(c, true) },
  { key: 'expired', name: 'Log in / Set new password / Link expired', row: 1, col: 1, fn: pExpired },
  { key: 'change', name: 'Settings / Change password', row: 2, col: 0, auth: true, fn: c => pChange(c, false) },
  { key: 'changed', name: 'Settings / Change password / Updated', row: 2, col: 1, auth: true, fn: c => pChange(c, true) },
];
const NOTES = {
  sent: 'Developer note: the message is the same whether or not the address has an account, so the form cannot be used to find out who is a member.',
  setnew: 'Developer note: opened from the link in the email. The link works once and expires; the backend sets how long. Password rules (length and so on) also come from the backend.',
  updated: 'Developer note: the Log in button opens the Log in page.',
  expired: 'Developer note: shown when the reset link has expired or was already used.',
  change: 'Developer note: lives in My settings (not drawn yet). Wrong current password shows the error under that field.',
};
const clamp = (v, a, b) => Math.max(a, Math.min(v, b));
const dedupe = pts => pts.filter((q, i) => i === 0 || q[0] !== pts[i - 1][0] || q[1] !== pts[i - 1][1]);
const PAGES = {}, arrowLog = [], REACT = [], jog = [];
const NAME_OF = { Desktop: 'Web', Mobile: 'Mobile' };
for (const D of ['Desktop', 'Mobile']) {
  await step('log-in · ' + D, async () => {
    const desk = D === 'Desktop', W = desk ? 1440 : 390, G = desk ? 480 : 360;
    const ps = p02.children.find(n => n.type === 'SECTION' && n.name === NAME_OF[D]);
    for (const o of ps.children.filter(n => n.type === 'SECTION' && n.name === 'Log in')) o.remove();
    const homeSec = ps.children.find(n => n.type === 'SECTION' && n.name === 'Home page');
    let maxBottom = 0; for (const k of ps.children) if (k.type === 'SECTION' && k.name !== 'Own profile') maxBottom = Math.max(maxBottom, k.y + k.height);
    const sec = figma.createSection(); sec.name = 'Log in'; ps.appendChild(sec); sec.resizeWithoutConstraints(800, 600); sec.x = homeSec.x; sec.y = maxBottom + 160;
    const built = {};
    for (const def of DEFS) { const c = await buildPage(D, def); sec.appendChild(c.pg); built[def.key] = c; }
    PAGES[D] = built;
    // yerlesim
    const TOP = 240, rowH = [0, 0, 0]; for (const def of DEFS) rowH[def.row] = Math.max(rowH[def.row], built[def.key].pg.height);
    const rowY = [TOP, TOP + rowH[0] + 320]; rowY[2] = rowY[1] + rowH[1] + 320;
    for (const def of DEFS) { const p = built[def.key].pg; p.x = 80 + def.col * (W + G); p.y = rowY[def.row]; }
    const sbb = sec.absoluteBoundingBox; const loc = b => ({ x: b.x - sbb.x, y: b.y - sbb.y, w: b.width, h: b.height });
    // notlar
    for (const k of Object.keys(NOTES)) {
      const p = built[k].pg; const n = await txt('Note · ' + k + ' · ' + D, NOTES[k], 'Label/Small', 'color/text/warning');
      sec.appendChild(n); n.textAutoResize = 'HEIGHT'; n.resize(Math.min(W, 440), n.height); n.x = p.x; n.y = p.y + p.height + 40;
    }
    // ok yardimcilari
    async function arrow(pts, labelText, name, group) { return await elbow(sec, dedupe(pts), labelText, name, group); }
    async function clickBox(el) {
      const b = loc(el.absoluteBoundingBox); const bx = figma.createRectangle(); sec.appendChild(bx); bx.name = 'Clicked'; bx.x = b.x - 4; bx.y = b.y - 4; bx.resize(b.w + 8, b.h + 8);
      bx.fills = []; bx.strokes = [{ type: 'SOLID', color: BLUE }]; bx.strokeWeight = 3; bx.cornerRadius = Math.min(26, (b.h + 8) / 2); return { bx, b };
    }
    const nvg = async (el, dest) => { try { await el.setReactionsAsync([nav(dest.pg)]); REACT.push(el.name + ' -> ' + dest.pg.name); } catch (e) { report.errors.push('reaction ' + el.name + ': ' + e.message); } };
    // 1 sag: iki sayfa arasi duz ok
    async function straight(from, el, to, label, name) {
      const c = built[from], nx = built[to]; const { bx, b } = await clickBox(el); const by = b.y + b.h / 2, gx = c.pg.x + W + G / 2;
      const ty = clamp(by, nx.pg.y + 140, nx.pg.y + nx.pg.height - 140); jog.push(name + ' jog ' + Math.round(ty - by));
      const { lab } = await arrow([[b.x + b.w + 4, by], [gx, by], [gx, ty], [nx.pg.x, ty]], label, name + ' · ' + D, [bx]);
      lab.x = c.pg.x + W + 16; lab.y = by - lab.height - 8; arrowLog.push(D + ' ' + from + '>' + to); await nvg(el, nx);
    }
    await straight('login', built.login.forgot, 'reset', 'From Log in · Forgot password?', 'Flow · forgot');
    await straight('reset', built.reset.btn, 'sent', 'From Forgot password · Send reset link', 'Flow · send link');
    await straight('setnew', built.setnew.btn, 'updated', 'From Set new password · Save new password', 'Flow · save password');
    await straight('change', built.change.btn, 'changed', 'From Change password · Update password', 'Flow · update password');
    // 2 asagi: Log in dugmesi -> hatali giris
    { const c = built.login, nx = built.error; const { bx, b } = await clickBox(c.btn); const by = b.y + b.h / 2, gx = c.pg.x + W + G / 2, lane = nx.pg.y - 160, ecx = nx.pg.x + W / 2;
      const { lab } = await arrow([[b.x + b.w + 4, by], [gx, by], [gx, lane], [ecx, lane], [ecx, nx.pg.y]], 'From Log in · Log in (wrong password)', 'Flow · wrong password · ' + D, [bx]);
      lab.x = c.pg.x + W + 16; lab.y = by - lab.height - 8; arrowLog.push(D + ' login>error'); await nvg(c.btn, nx); }
    // 3 yukari: suresi dolmus baglanti -> yeni baglanti iste
    { const c = built.expired, nx = built.reset; const { bx, b } = await clickBox(c.btn); const by = b.y + b.h / 2, gx = c.pg.x + W + G / 2, lane = c.pg.y - 120, rcx = nx.pg.x + W / 2, endY = nx.pg.y + nx.pg.height;
      const { lab } = await arrow([[b.x + b.w + 4, by], [gx, by], [gx, lane], [rcx, lane], [rcx, endY]], 'From Link expired · Request a new link', 'Flow · new link · ' + D, [bx]);
      lab.x = c.pg.x + W + 16; lab.y = by - lab.height - 8; arrowLog.push(D + ' expired>reset'); await nvg(c.btn, nx); }
    // 4 kesik ok: e-postadaki baglanti
    { const c = built.sent, nx = built.setnew; const cb = loc(c.circ.absoluteBoundingBox); const y0 = cb.y + cb.h / 2, gx = c.pg.x + W + G / 2, ty = clamp(y0, nx.pg.y + 140, nx.pg.y + nx.pg.height - 140);
      const { g, lab } = await arrow([[c.pg.x + W, y0], [gx, y0], [gx, ty], [nx.pg.x, ty]], 'From the link in the email', 'Flow · email link · ' + D, []);
      const av = g.findOne(n => n.name === 'Arrow'); if (av) av.dashPattern = [12, 8];
      lab.x = c.pg.x + W + 16; lab.y = y0 - lab.height - 8; arrowLog.push(D + ' sent>setnew (email)'); await nvg(c.circ, nx); }
    // 5 giris oklari
    { const a = built.login.pg; const ex = a.x + W / 2; const { lab } = await arrow([[ex, 100], [ex, a.y]], 'From Home page · Log in', 'Flow · Entry · Log in · ' + D, []); lab.x = ex + 16; lab.y = 110; }
    { const a = built.change.pg; const ex = a.x + W / 2; const { lab } = await arrow([[ex, a.y - 120], [ex, a.y]], 'From My settings · not drawn yet', 'Flow · Entry · Change password · ' + D, []); lab.x = ex + 16; lab.y = a.y - 110; }
    if (desk) {
      const home = p02.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · Desktop'); const lb = home.findOne(n => n.name === 'Button · Log in');
      if (lb) await nvg(lb, built.login); else report.errors.push('Home Log in button not found');
    }
    // bolum boyu
    let right = 0, bottom = 0; for (const k of sec.children) { right = Math.max(right, k.x + k.width); bottom = Math.max(bottom, k.y + k.height); }
    sec.resizeWithoutConstraints(Math.ceil(right + 80), Math.ceil(bottom + 80));
  });
}
report.info.arrows = arrowLog; report.info.reactions = REACT; report.info.jogs = jog;
report.info.pageHeights = ['Desktop', 'Mobile'].map(D => PAGES[D] ? D + ': ' + DEFS.map(d => d.key + ' ' + r(PAGES[D][d.key].pg.height)).join(', ') : D + ': none');

await step('flow starts', async () => {
  const keep = [];
  for (const s of (p02.flowStartingPoints || [])) { const n = await figma.getNodeByIdAsync(s.nodeId); if (!n || /^(Web|Mobile) · Log in$/.test(s.name)) continue; if (keep.some(k => k.name === s.name)) continue; keep.push({ nodeId: s.nodeId, name: s.name }); }
  for (const D of ['Desktop', 'Mobile']) if (PAGES[D]) keep.push({ nodeId: PAGES[D].login.pg.id, name: NAME_OF[D] + ' · Log in' });
  p02.flowStartingPoints = keep; report.info.flowStarts = keep.length;
});

const plat = name => p02.children.find(n => n.type === 'SECTION' && n.name === name);
await step('own profile below', async () => {
  for (const P_ of ['Web', 'Mobile']) {
    const ps = plat(P_); const own = ps.children.find(n => n.type === 'SECTION' && n.name === 'Own profile');
    let maxBottom = 0; for (const k of ps.children) if (k !== own && k.type === 'SECTION') maxBottom = Math.max(maxBottom, k.y + k.height);
    if (own.y < maxBottom + 160) own.y = maxBottom + 160;
  }
});
await step('widen platforms', async () => {
  const log = [];
  for (const P_ of ['Web', 'Mobile']) {
    const ps = plat(P_); let right = 0, bottom = 0; for (const k of ps.children) { right = Math.max(right, k.x + k.width); bottom = Math.max(bottom, k.y + k.height); }
    const needW = Math.ceil(right + 160), needH = Math.ceil(bottom + 160); const oldRight = ps.x + ps.width, dx = Math.max(0, needW - ps.width);
    if (dx > 0 || needH > ps.height) ps.resizeWithoutConstraints(Math.max(ps.width, needW), Math.max(ps.height, needH));
    if (dx > 0) for (const n of p02.children) if (n !== ps && n.x >= oldRight - 1) n.x += dx;
    log.push(P_ + ' · ' + r(ps.width) + 'x' + r(ps.height) + (dx ? ' · grew ' + dx : ''));
  }
  report.info.platforms = log;
});
await step('check', async () => {
  const ov = [], out = [], grey = [];
  function walk(sec) {
    const kids = sec.children; const secs = kids.filter(c => c.type === 'SECTION');
    for (let i = 0; i < secs.length; i++) for (let j = i + 1; j < secs.length; j++) { const a = secs[i], z = secs[j]; if (a.x < z.x + z.width && z.x < a.x + a.width && a.y < z.y + z.height && z.y < a.y + a.height) ov.push(a.name + ' / ' + z.name + ' in ' + sec.name); }
    if (sec.type === 'SECTION') for (const k of kids) if (k.x < 0 || k.y < 0 || k.x + k.width > sec.width + 1 || k.y + k.height > sec.height + 1) out.push(k.name + ' outside ' + sec.name);
    for (const c of secs) walk(c);
  }
  const top = p02.children.filter(c => c.type === 'SECTION');
  for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) { const a = top[i], z = top[j]; if (a.x < z.x + z.width && z.x < a.x + a.width && a.y < z.y + z.height && z.y < a.y + a.height) ov.push(a.name + ' / ' + z.name); }
  for (const t of top) walk(t);
  report.info.sectionOverlaps = ov.length ? ov : 'none'; report.info.outsideParent = out.length ? out.slice(0, 20) : 'none';
  for (const D of ['Desktop', 'Mobile']) if (PAGES[D]) for (const k of Object.keys(PAGES[D])) for (const n of PAGES[D][k].pg.findAll(n => n.type === 'FRAME' || n.type === 'RECTANGLE')) { try { if ((n.fills || []).some(f => f.type === 'SOLID' && hex(f) === '#808080')) grey.push(D + ' ' + k + ' ' + n.name); } catch (e) {} }
  report.info.placeholderGrey = grey.length ? grey.slice(0, 10) : 'none';
  let total = 0, broken = 0;
  for (const n of p02.findAll(n => n.reactions && n.reactions.length)) for (const rr of n.reactions) for (const a of (rr.actions || [])) { if (!a.destinationId) continue; total++; if (!(await figma.getNodeByIdAsync(a.destinationId))) broken++; }
  report.info.prototype = total + ' links, ' + broken + ' broken';
});

return report;
