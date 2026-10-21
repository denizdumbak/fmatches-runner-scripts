// step 178 · Signup ekranlari (02 › Web ve Mobile › Sign up): Account, Personal, Catalogue match, Football, Review, Check your email, Work, diger roller (3 adim) · oklar, prototip, giris oku, Home Sign up dugmesi

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

const stepSet = setOf('Stepper'), roleSet = setOf('Role option'), gSet = setOf('Google button'), rrSet = setOf('Review row'), trSet = setOf('Terms row');
for (const [n, s] of [['Stepper', stepSet], ['Role option', roleSet], ['Google button', gSet], ['Review row', rrSet], ['Terms row', trSet]]) if (!s) throw new Error('component set missing: ' + n + ' (run step 176 first)');
const inst = (set, vname) => { const v = set.children.find(c => c.name === vname); if (!v) throw new Error('variant missing: ' + set.name + ' ' + vname); return v.createInstance(); };
async function setTexts(i, map) { for (const k of Object.keys(map)) { const t = i.findOne(n => n.type === 'TEXT' && n.name === k); if (!t) throw new Error('text ' + k + ' missing in ' + i.name); await loadFonts(t); t.characters = map[k]; } }
const FILLW = n => { n.layoutSizingHorizontal = 'FILL'; return n; };
const add = (p, n) => { p.appendChild(n); n.layoutSizingHorizontal = 'FILL'; return n; };
function fr(name, mode, fillVar) { const f = frame(name, mode); if (fillVar) f.fills = [P(V(fillVar))]; return f; }

const ROLES = [['Player', 'Build a verified profile and be found by clubs and scouts.'], ['Manager/Official', 'Coaches, scouts and club officials. Search and shortlist players.'], ['Intermediary', 'Agents and agencies representing players.'], ['Referee', 'Referees and match officials.'], ['Football fan', 'Follow clubs, players and events.']];
const WHO = { Player: { first: 'Leo', last: 'Marsh', email: 'leo.marsh@example.com', gender: 'Male', dob: '18.04.2005', nat: 'England' }, Referee: { first: 'Ana', last: 'Ferreira', email: 'ana.ferreira@example.com', gender: 'Female', dob: '12.09.1988', nat: 'Portugal' } };

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

// ---------- sayfa govdeleri ----------
async function pAccount(c, role, total) {
  const w = WHO[role]; const { D, desk, col } = c;
  await head(col, desk, 'Create your account', 'Join the verified football network. It is free.');
  const card = await cardOf(col, desk); stepperOf(card, D, total, 1);
  const rs = await stack(card, 'Role'); GAP(rs, 'spacing/sm');
  rs.appendChild(await txt('Label', 'I am a', 'Label/Default Strong', 'color/text/primary'));
  for (const [n, d] of ROLES) { const o = inst(roleSet, 'State=' + (n === role ? 'Selected' : 'Default')); await setTexts(o, { Title: n, Sub: d }); o.name = 'Role · ' + n; add(rs, o); }
  const g = inst(gSet, 'State=Default'); add(card, g); await orDivider(card);
  const f = await stack(card, 'Fields');
  await pair(f, desk, r => fld(r, 'Text', 'Filled', 'First name', w.first), r => fld(r, 'Text', 'Filled', 'Last name', w.last));
  await fld(f, 'Text', 'Filled', 'Email address', w.email);
  await fld(f, 'Text', 'Filled', 'Password', '••••••••••');
  await fld(f, 'Text', 'Filled', 'Confirm password', '••••••••••');
  c.btn = await actionsRow(card, false, 'Continue');
}
async function pPersonal(c, role, total) {
  const w = WHO[role]; const { D, desk, col } = c;
  await head(col, desk, 'Tell us about you', 'A few personal details.');
  const card = await cardOf(col, desk); stepperOf(card, D, total, 2);
  const f = await stack(card, 'Fields');
  await fld(f, 'Select', 'Filled', 'Gender', w.gender);
  await fld(f, 'Date', 'Filled', 'Date of birth', w.dob);
  await fld(f, 'Select', 'Filled', 'Nationality', w.nat);
  await check(f, false, 'I have more than one nationality');
  c.btn = await actionsRow(card, true, 'Continue');
}
async function pFootball(c) {
  const { D, desk, col } = c;
  await head(col, desk, 'Your football profile', 'This fills your profile. You can change it later.');
  const card = await cardOf(col, desk); const st = stepperOf(card, D, 4, 3);
  const f = await stack(card, 'Fields');
  await fld(f, 'Select', 'Filled', 'Current/last club', 'Riverside FC');
  await check(f, false, 'I am on loan');
  await fld(f, 'Date', 'Filled', 'Joined club', '01.07.2023');
  await check(f, true, 'I still play here');
  await fld(f, 'Select', 'Filled', 'Main position', 'Attacking Midfield');
  await check(f, true, 'I play in more than one position');
  await fld(f, 'Multi-chip', 'Filled', 'Other positions', undefined, ['Central Midfield', 'Left Winger']);
  await fld(f, 'Select', 'Filled', 'Strongest foot', 'Right');
  await pair(f, true, r => fld(r, 'Text', 'Filled', 'Height (cm)', '178'), r => fld(r, 'Text', 'Filled', 'Weight (kg)', '74'));
  c.btn = await actionsRow(card, true, 'Continue');
}
async function pWork(c) {
  const { D, desk, col } = c;
  await head(col, desk, 'Where do you work?', 'Your current or last club or organization.');
  const card = await cardOf(col, desk); const st = stepperOf(card, D, 4, 3);
  const t = st.findOne(n => n.type === 'TEXT' && n.name === 'Label' && n.parent && n.parent.name === 'Step 3'); if (t) { await loadFonts(t); t.characters = 'Work'; }
  const f = await stack(card, 'Fields');
  await fld(f, 'Select', 'Filled', 'Current/last club/organization', 'Northgate Athletic');
  await fld(f, 'Date', 'Filled', 'Joined club', '15.08.2022');
  await check(f, true, 'I still work here');
  c.btn = await actionsRow(card, true, 'Continue');
}
async function reviewSection(parent, title, rows) {
  const s = fr(title, 'VERTICAL'); add(parent, s);
  const h = fr('Section header', 'HORIZONTAL'); h.counterAxisAlignItems = 'CENTER'; h.primaryAxisAlignItems = 'SPACE_BETWEEN'; add(s, h);
  h.appendChild(await txt('Title', title, 'Heading/H4', 'color/text/primary')); h.appendChild(editBtn());
  for (let k = 0; k < rows.length; k++) { const i = inst(rrSet, 'Last=' + (k === rows.length - 1 ? 'True' : 'False')); await setTexts(i, { Label: rows[k][0], Value: rows[k][1] }); i.name = 'Review · ' + rows[k][0]; add(s, i); }
}
async function pReview(c, role, total) {
  const w = WHO[role]; const { D, desk, col } = c;
  await head(col, desk, 'Review your information', 'Please review your information before submitting.');
  const card = await cardOf(col, desk); stepperOf(card, D, total, total);
  const body = await stack(card, 'Summary'); GAP(body, 'spacing/lg');
  await reviewSection(body, 'Account', [['I am a', role], ['Name', w.first + ' ' + w.last], ['Email address', w.email]]);
  await reviewSection(body, 'Personal', [['Gender', w.gender], ['Date of birth', w.dob], ['Nationality', w.nat]]);
  if (total === 4) await reviewSection(body, 'Football', [['Current club', 'Riverside FC'], ['Joined club', '01.07.2023'], ['Still plays here', 'Yes'], ['Main position', 'Attacking Midfield'], ['Other positions', 'Central Midfield, Left Winger'], ['Strongest foot', 'Right'], ['Height', '178 cm'], ['Weight', '74 kg']]);
  const tr = inst(trSet, 'State=Default'); add(card, tr);
  c.btn = await actionsRow(card, true, 'Create account');
}
async function pCheck(c) {
  const { D, desk, col } = c; const w = WHO.Player;
  const card = await cardOf(col, desk); card.counterAxisAlignItems = 'CENTER';
  const circ = fr('Mail', 'HORIZONTAL', 'color/bg/brand-subtle'); circ.resize(64, 64); circ.primaryAxisSizingMode = 'FIXED'; circ.counterAxisSizingMode = 'FIXED'; circ.primaryAxisAlignItems = 'CENTER'; circ.counterAxisAlignItems = 'CENTER'; RAD(circ, 'radius/full');
  circ.appendChild(icon('Mail icon', 'mail', 28, 'color/icon/brand')); card.appendChild(circ);
  const t = await txt('Title', 'Check your email', desk ? 'Heading/H2' : 'Heading/H3', 'color/text/primary'); add(card, t); t.textAutoResize = 'HEIGHT'; t.textAlignHorizontal = 'CENTER';
  const b = await txt('Body', 'We sent a verification link to ' + w.email + '. Until you verify, you can browse the network but not message members or send contact requests.', 'Body/Default', 'color/text/secondary'); add(card, b); b.textAutoResize = 'HEIGHT'; b.textAlignHorizontal = 'CENTER';
  card.appendChild(await button('Secondary', 'Resend email'));
  const l = await txt('Link', 'Wrong address? Change email', 'Label/Default Strong', 'color/text/brand'); card.appendChild(l); l.textDecoration = 'UNDERLINE';
}
async function addOverlay(pg, c) {
  const { D, desk } = c; const W = pg.width;
  const sc = figma.createRectangle(); sc.name = 'Scrim'; sc.fills = [P(V('color/bg/inverse'))]; sc.opacity = 0.5; pg.appendChild(sc); sc.layoutPositioning = 'ABSOLUTE'; sc.x = 0; sc.y = 0; sc.resize(pg.width, pg.height);
  const dw = desk ? 480 : 358;
  const d = fr('Catalogue dialog', 'VERTICAL', 'color/bg/surface'); d.resize(dw, 100); d.primaryAxisSizingMode = 'AUTO'; d.counterAxisSizingMode = 'FIXED'; GAP(d, 'spacing/md'); PAD(d, 'spacing/lg', 'spacing/lg', 'spacing/lg', 'spacing/lg'); RAD(d, 'radius/lg');
  await d.setEffectStyleIdAsync(ES['Shadow/Raised'].id);
  const t = await txt('Title', 'Is this you?', 'Heading/H4', 'color/text/primary'); d.appendChild(t);
  const b = await txt('Body', 'We have Leo Marsh in our catalogue. Is that you?', 'Body/Default', 'color/text/primary'); add(d, b); b.textAutoResize = 'HEIGHT';
  const nm = b.characters.indexOf('Leo Marsh'); b.setRangeFills(nm, nm + 9, [P(V('color/text/brand'))]); b.setRangeTextDecoration(nm, nm + 9, 'UNDERLINE');
  const s = await txt('Details', 'Born 18.04.2005 · England · Riverside FC', 'Label/Small', 'color/text/secondary'); d.appendChild(s);
  const yes = await button('Primary', `Yes, that's me`); add(d, yes);
  const no = await button('Secondary', 'No, create a new profile'); add(d, no);
  pg.appendChild(d); d.layoutPositioning = 'ABSOLUTE'; d.x = Math.round((W - dw) / 2); d.y = desk ? 240 : 160;
  c.yes = yes; c.no = no;
}

// ---------- sayfa iskeleti ----------
async function buildPage(D, def) {
  const desk = D === 'Desktop', W = desk ? 1440 : 390;
  const home = p02.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · ' + D); if (!home) throw new Error('Home / Main · ' + D + ' missing');
  const pg = fr(def.name + ' · ' + D, 'VERTICAL', 'color/bg/canvas'); pg.resize(W, 100); pg.primaryAxisSizingMode = 'AUTO'; pg.counterAxisSizingMode = 'FIXED';
  const mk = nm => { const src = home.findOne(n => n.type === 'INSTANCE' && n.name === nm); if (!src) throw new Error('home instance missing: ' + nm); const c = src.clone(); pg.appendChild(c); c.layoutSizingHorizontal = 'FILL'; return c; };
  mk('Ticker'); mk('Navigation');
  const main = fr('Sign-up body', 'VERTICAL', 'color/bg/canvas'); main.counterAxisAlignItems = 'CENTER'; GAP(main, 'spacing/lg');
  if (desk) PAD(main, 'layout/section-padding-y', 'layout/page-gutter', 'spacing/4xl', 'layout/page-gutter'); else PAD(main, 'spacing/lg', 'spacing/md', 'spacing/xl', 'spacing/md');
  add(pg, main);
  const col = fr('Column', 'VERTICAL'); GAP(col, 'spacing/lg'); main.appendChild(col);
  if (desk) { col.resize(560, 100); col.primaryAxisSizingMode = 'AUTO'; col.counterAxisSizingMode = 'FIXED'; } else FILLW(col);
  mk('Footer');
  const c = { D, desk, col };
  await def.fn(c);
  if (def.overlay) await addOverlay(pg, c);
  c.pg = pg; return c;
}
const DEFS = [
  { key: 'account', name: 'Sign up / Account', row: 0, col: 0, fn: c => pAccount(c, 'Player', 4), next: 'personal', label: 'From Account · Continue' },
  { key: 'personal', name: 'Sign up / Personal', row: 0, col: 1, fn: c => pPersonal(c, 'Player', 4), next: 'catalogue', label: 'From Personal · Continue' },
  { key: 'catalogue', name: 'Sign up / Personal / Catalogue match', row: 0, col: 2, fn: c => pPersonal(c, 'Player', 4), overlay: true, next: 'football', via: 'yes', label: `From Catalogue match · Yes, that's me` },
  { key: 'football', name: 'Sign up / Football', row: 0, col: 3, fn: pFootball, next: 'review', label: 'From Football · Continue' },
  { key: 'review', name: 'Sign up / Review', row: 0, col: 4, fn: c => pReview(c, 'Player', 4), next: 'check', label: 'From Review · Create account' },
  { key: 'check', name: 'Sign up / Check your email', row: 0, col: 5, fn: pCheck },
  { key: 'work', name: 'Sign up / Work', row: 1, col: 0, fn: pWork },
  { key: 'account_o', name: 'Sign up / Account / Other role', row: 1, col: 1, fn: c => pAccount(c, 'Referee', 3), next: 'personal_o', label: 'From Account · Continue' },
  { key: 'personal_o', name: 'Sign up / Personal / Other role', row: 1, col: 2, fn: c => pPersonal(c, 'Referee', 3), next: 'review_o', label: 'From Personal · Continue' },
  { key: 'review_o', name: 'Sign up / Review / Other role', row: 1, col: 3, fn: c => pReview(c, 'Referee', 3) },
];
const NOTES = {
  account: 'Developer note: with Google, name and email arrive filled and the password fields are removed. The role and the other steps stay.',
  catalogue: 'Developer note: shown after Personal when name, date of birth and nationality match a directory profile (Player only). Yes claims that profile and prefills the next steps, No creates a new one. The name opens a profile preview.',
  work: 'Developer note: Manager/Official sees this step instead of Football. The review then lists Account, Personal and Work.',
  account_o: 'Developer note: Intermediary, Referee and Football fan skip the football step, so the stepper has 3 steps instead of 4.',
  check: 'Developer note: the account exists but is unverified until the link is used. Unverified members cannot message, send contact requests or book events.',
};
const prevSec = {};
const PAGES = {};
const arrowLog = [];
const REACT = [];
for (const D of ['Desktop', 'Mobile']) {
  await step('sign-up · ' + D, async () => {
    const desk = D === 'Desktop', W = desk ? 1440 : 390, G = desk ? 480 : 360;
    const ps = p02.children.find(n => n.type === 'SECTION' && n.name === (desk ? 'Web' : 'Mobile'));
    for (const o of ps.children.filter(n => n.type === 'SECTION' && n.name === 'Sign up')) o.remove();
    const homeSec = ps.children.find(n => n.type === 'SECTION' && n.name === 'Home page');
    let maxBottom = 0; for (const k of ps.children) if (k.type === 'SECTION' && k.name !== 'Own profile') maxBottom = Math.max(maxBottom, k.y + k.height);
    const sec = figma.createSection(); sec.name = 'Sign up'; ps.appendChild(sec); sec.resizeWithoutConstraints(800, 600); sec.x = homeSec.x; sec.y = maxBottom + 160;
    const built = {};
    for (const def of DEFS) { const c = await buildPage(D, def); sec.appendChild(c.pg); built[def.key] = c; }
    PAGES[D] = built;
    // yerlesim
    const TOP = 240; const rowH = [0, 0]; for (const def of DEFS) rowH[def.row] = Math.max(rowH[def.row], built[def.key].pg.height);
    for (const def of DEFS) { const p = built[def.key].pg; p.x = 80 + def.col * (W + G); p.y = def.row === 0 ? TOP : TOP + rowH[0] + 320; }
    const sbb = sec.absoluteBoundingBox; const loc = b => ({ x: b.x - sbb.x, y: b.y - sbb.y, w: b.width, h: b.height });
    // notlar
    for (const k of Object.keys(NOTES)) {
      const p = built[k].pg; const n = await txt('Note · ' + k + ' · ' + D, NOTES[k], 'Label/Small', 'color/text/warning');
      sec.appendChild(n); n.textAutoResize = 'HEIGHT'; n.resize(Math.min(W, 440), n.height); n.x = p.x; n.y = p.y + p.height + 40;
    }
    // oklar ve prototip
    for (const def of DEFS) {
      if (!def.next) continue;
      const c = built[def.key], nx = built[def.next];
      const btn = def.via === 'yes' ? c.yes : c.btn; const b = loc(btn.absoluteBoundingBox);
      const bx = figma.createRectangle(); sec.appendChild(bx); bx.name = 'Clicked'; bx.x = b.x - 4; bx.y = b.y - 4; bx.resize(b.w + 8, b.h + 8);
      bx.fills = []; bx.strokes = [{ type: 'SOLID', color: BLUE }]; bx.strokeWeight = 3; bx.cornerRadius = 26;
      const by = b.y + b.h / 2, curRight = c.pg.x + W, gx = curRight + G / 2;
      const ty = Math.max(nx.pg.y + 140, Math.min(by, nx.pg.y + nx.pg.height - 140));
      const pts = [[b.x + b.w + 4, by], [gx, by], [gx, ty], [nx.pg.x, ty]];
      const { lab } = await elbow(sec, pts, def.label, 'Flow · ' + def.key + ' to ' + def.next + ' · ' + D, [bx]);
      lab.x = curRight + 16; lab.y = by - lab.height - 8; arrowLog.push(D + ' ' + def.key + '>' + def.next);
      await btn.setReactionsAsync([nav(nx.pg)]);
      if (def.via === 'yes') await c.no.setReactionsAsync([nav(nx.pg)]);
    }
    // giris oku (Home / Sign up)
    const a = built.account.pg;
    const ex = a.x + W / 2; const { lab } = await elbow(sec, [[ex, 100], [ex, a.y]], 'From Home page · Sign up', 'Flow · Entry · Sign up · ' + D, []);
    lab.x = ex + 16; lab.y = 110;
    // Home / Sign up dugmesi
    if (desk) {
      const home = p02.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · Desktop'); const sb = home.findOne(n => n.name === 'Button · Sign up');
      try { await sb.setReactionsAsync([nav(a)]); REACT.push('Home Sign up -> Account'); } catch (e) { report.errors.push('Home Sign up reaction: ' + e.message); }
    }
    // bolum boyu
    let right = 0, bottom = 0; for (const k of sec.children) { right = Math.max(right, k.x + k.width); bottom = Math.max(bottom, k.y + k.height); }
    sec.resizeWithoutConstraints(Math.ceil(right + 80), Math.ceil(bottom + 80));
  });
}
report.info.arrows = arrowLog; report.info.reactions = REACT;
report.info.pageHeights = ['Desktop', 'Mobile'].map(D => PAGES[D] ? D + ': ' + DEFS.map(d => d.key + ' ' + r(PAGES[D][d.key].pg.height)).join(', ') : D + ': none');

await step('flow starts', async () => {
  const keep = [];
  for (const s of (p02.flowStartingPoints || [])) { const n = await figma.getNodeByIdAsync(s.nodeId); if (!n || /^(Web|Mobile) · Sign up$/.test(s.name)) continue; if (keep.some(k => k.name === s.name)) continue; keep.push({ nodeId: s.nodeId, name: s.name }); }
  for (const D of ['Desktop', 'Mobile']) if (PAGES[D]) keep.push({ nodeId: PAGES[D].account.pg.id, name: (D === 'Desktop' ? 'Web' : 'Mobile') + ' · Sign up' });
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
