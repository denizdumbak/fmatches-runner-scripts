// step 187 · Yeni uye profili (Signup sonrasi): Page notice component (01 › 6), Verification badge Status=Unverified, 02 › Own profile › New member (masaustu + mobil): ust serit, siluet + Add photo, bos kartlar (Links, About, Gallery), tek kariyer satiri, giris oku

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

// ---------- step 187: parcalar ----------
const created = [];
const fillV = (n, v) => { n.fills = [P(V(v))]; created.push(n); };
function comp(name, mode) {
  const c = figma.createComponent(); c.name = name; c.fills = []; c.clipsContent = false;
  if (mode) { c.layoutMode = mode; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO'; c.itemSpacing = 0; }
  return c;
}
const NOTICE_TEXT = 'Verify your email to message members and send contact requests.';
await figma.setCurrentPageAsync(p01);
const sec6 = p01.children.find(n => n.type === 'SECTION' && /Sign-up/.test(n.name));

await step('Page notice component', async () => {
  if (!sec6) throw new Error('section 6 missing');
  for (const o of p01.findAll(n => n.type === 'COMPONENT_SET' && n.name === 'Page notice')) o.remove();
  const cs = [];
  for (const D of ['Desktop', 'Mobile']) {
    const desk = D === 'Desktop';
    const c = comp('Device=' + D, desk ? 'HORIZONTAL' : 'VERTICAL');
    c.resize(desk ? 1440 : 390, 44);
    if (desk) { c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO'; c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER'; PAD(c, 'spacing/sm', 'layout/page-gutter', 'spacing/sm', 'layout/page-gutter'); GAP(c, 'spacing/sm'); }
    else { c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED'; PAD(c, 'spacing/sm', 'spacing/md', 'spacing/sm', 'spacing/md'); GAP(c, 'spacing/xs'); }
    fillV(c, 'color/bg/warning-subtle');
    const ic = icon('Icon', 'mail', 20, 'color/icon/default');
    const tx = await txt('Text', NOTICE_TEXT, 'Label/Default', 'color/text/primary');
    const lk = await txt('Link', 'Resend email', 'Label/Default Strong', 'color/text/brand'); lk.textDecoration = 'UNDERLINE';
    if (desk) { c.appendChild(ic); c.appendChild(tx); c.appendChild(lk); }
    else {
      const row = frame('Row', 'HORIZONTAL'); row.counterAxisAlignItems = 'MIN'; GAP(row, 'spacing/sm'); c.appendChild(row); row.layoutSizingHorizontal = 'FILL';
      row.appendChild(ic); row.appendChild(tx); tx.layoutSizingHorizontal = 'FILL'; tx.textAutoResize = 'HEIGHT';
      c.appendChild(lk);
    }
    sec6.appendChild(c); cs.push(c);
  }
  cs[0].x = 0; cs[0].y = 0; cs[1].x = 1440 + 48; cs[1].y = 0;
  const set = figma.combineAsVariants(cs, sec6); set.name = 'Page notice';
  set.description = 'Page notice: a strip under the header for a state that needs the user’s attention, e.g. an email that is not verified yet. Device: Desktop, Mobile. Warning colours (bg/warning-subtle), mail icon, one sentence and an action link.\nDeveloper: shows until the email link is used. Unverified members cannot message members, send contact requests or book events.';
  report.info.noticeSize = cs.map(c => r(c.width) + 'x' + r(c.height)).join(' | ');
  const src = sec6.findOne(n => n.type === 'TEXT' && n.name === 'Note · Review');
  if (src) { const t = src.clone(); sec6.appendChild(t); await loadFonts(t); t.characters = 'Page notice: a strip under the header for a state that needs attention, such as an email that is not verified yet. Desktop and Mobile.'; t.name = 'Note · Page notice'; }
});

await step('Unverified badge variant', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Verification badge'); if (!set) throw new Error('Verification badge missing');
  if (set.children.some(v => v.name === 'Status=Unverified')) { report.info.badge = 'already there'; return; }
  const d = set.children.find(v => v.name === 'Status=Directory'); if (!d) throw new Error('Directory variant missing');
  const oldRight = Math.max(...set.children.map(v => v.x + v.width)), pad = set.width - oldRight;
  const u = d.clone(); u.name = 'Status=Unverified';
  const ts = u.findAll(n => n.type === 'TEXT'); if (!ts.length) throw new Error('no text in badge');
  await loadFonts(ts[0]); ts[0].characters = 'Email not verified'; ts[0].fills = [P(V('color/text/warning'))];
  fillV(u, 'color/bg/warning-subtle'); created.push(ts[0]);
  u.x = oldRight + 16; u.y = d.y;
  set.resizeWithoutConstraints(Math.ceil(u.x + u.width + pad), set.height);
  report.info.badge = { children: u.children.map(c => c.type + ':' + c.name), size: r(u.width) + 'x' + r(u.height), strokes: u.strokes.length };
});

// section 6 yerlesim
function relayout(s) {
  const kids = s.children.slice();
  const ordered = kids.filter(n => n.type === 'TEXT').concat(kids.filter(n => n.type !== 'TEXT'));
  const left = s.x + 80; let y = s.y + 80, prevText = false, first = true;
  for (const k of ordered) {
    const b = k.absoluteBoundingBox; if (!b) continue; const isText = k.type === 'TEXT';
    if (!first) y += (isText && prevText) ? 16 : 120;
    k.x += left - b.x; k.y += y - b.y; y += b.height; prevText = isText; first = false;
  }
  let right = -Infinity, bottom = -Infinity;
  for (const k of s.children) { const b = k.absoluteBoundingBox; if (!b) continue; if (b.x + b.width > right) right = b.x + b.width; if (b.y + b.height > bottom) bottom = b.y + b.height; }
  s.resizeWithoutConstraints(Math.ceil(right - s.x + 80), Math.ceil(bottom - s.y + 80));
}
await step('section 6 layout', async () => {
  relayout(sec6);
  const secs = p01.children.filter(n => n.type === 'SECTION').sort((a, b) => a.x - b.x);
  let x = secs[0].x; for (const s of secs) { s.x = x; x += s.width + 160; }
  report.info.sec6 = sec6.name + ' ' + r(sec6.width) + 'x' + r(sec6.height);
});
await figma.setCurrentPageAsync(p02);

// ---------- yeni uye profili ----------
const emptySet = setOf('Empty card'), noticeSet = setOf('Page notice');
const emptyInst = D => { const v = emptySet.children.find(x => x.name === 'Device=' + D); if (!v) throw new Error('Empty card variant missing: ' + D); return v.createInstance(); };
async function setT(i, name, chars) { const t = i.findOne(n => n.type === 'TEXT' && n.name === name); if (!t) throw new Error('text ' + name + ' missing in ' + i.name); await loadFonts(t); t.characters = chars; }
function swapIn(oldN, newN) { const p = oldN.parent, idx = p.children.indexOf(oldN); p.insertChild(idx, newN); oldN.remove(); newN.layoutSizingHorizontal = 'FILL'; return newN; }
const NAME_OF = { Desktop: 'Web', Mobile: 'Mobile' };
const PAGES = {};
for (const D of ['Desktop', 'Mobile']) {
  await step('new member · ' + D, async () => {
    const desk = D === 'Desktop', W = desk ? 1440 : 390;
    const ps = p02.children.find(n => n.type === 'SECTION' && n.name === NAME_OF[D]);
    const sub = ps.children.find(n => n.type === 'SECTION' && n.name === 'Own profile'); if (!sub) throw new Error('Own profile sub-section missing');
    const newName = 'Profiles / Player / Own profile / New member · ' + D;
    for (const o of sub.children.filter(n => n.name === newName || n.name === 'Note · New member · ' + D || n.name === 'Flow · Entry · New member · ' + D)) o.remove();
    const own = sub.children.find(n => n.type === 'FRAME' && n.name === 'Profiles / Player / Own profile · ' + D); if (!own) throw new Error('Own profile page missing');
    let bottom = 0; for (const k of sub.children) bottom = Math.max(bottom, k.y + k.height);
    const pg = own.clone(); pg.name = newName; if (pg.parent !== sub) sub.appendChild(pg);
    for (const n of [pg].concat(pg.findAll(x => x.reactions && x.reactions.length))) { try { await n.setReactionsAsync([]); } catch (e) {} }
    pg.x = own.x; pg.y = bottom + 320;
    // sayfa ustu serit
    const nt = noticeSet.children.find(v => v.name === 'Device=' + D).createInstance(); pg.insertChild(2, nt); nt.layoutSizingHorizontal = 'FILL';
    const hero = pg.findOne(n => n.name === 'Hero · player identity'); if (!hero) throw new Error('hero missing');
    // key facts: sozlesme bitisi Signup'ta sorulmuyor
    const cf = hero.findOne(n => n.name === 'Fact · Contract until'); if (cf) cf.visible = false; else report.errors.push('no Contract fact in ' + D);
    // Change photo -> Add photo
    const cb = hero.findOne(n => n.name === 'Button · Change photo');
    if (cb) { const k = Object.keys(cb.componentProperties).find(x => /^Label#/.test(x)); const pp = {}; pp[k] = 'Add photo'; cb.setProperties(pp); cb.name = 'Button · Add photo'; } else report.errors.push('no Change photo button in ' + D);
    // siluet
    const dir = p02.findOne(n => n.type === 'FRAME' && n.name.indexOf('Player / Directory') >= 0 && n.name.endsWith(D)); if (!dir) throw new Error('Directory page missing for ' + D);
    const dirHero = dir.findOne(n => /^Hero/.test(n.name));
    if (desk) {
      const old = hero.findOne(n => n.name === 'Player photo · cut-out'); const ref = dirHero.findOne(n => n.type === 'INSTANCE' && /silhouette/i.test(n.name));
      if (!old || !ref) throw new Error('desktop photo/silhouette missing: ' + !!old + '/' + !!ref);
      const s = ref.clone(); hero.appendChild(s); s.layoutPositioning = 'ABSOLUTE'; s.x = ref.x; s.y = ref.y; old.remove();
      const hb = hero.absoluteBoundingBox, sb = s.absoluteBoundingBox; report.info['silhouetteBottomGap ' + D] = r(hb.y + hb.height - (sb.y + sb.height));
    } else {
      const old = hero.findOne(n => /^Player photo/.test(n.name)); const ref = dirHero.findOne(n => /silhouette/i.test(n.name) && n.type !== 'INSTANCE') || dirHero.findOne(n => /silhouette/i.test(n.name));
      if (!old || !ref) throw new Error('mobile photo/silhouette missing: ' + (old ? old.name : '-') + '/' + (ref ? ref.name : '-'));
      const s = ref.clone(); const p = old.parent, idx = p.children.indexOf(old); p.insertChild(idx, s);
      if (old.layoutPositioning === 'ABSOLUTE') { s.layoutPositioning = 'ABSOLUTE'; s.x = old.x; s.y = old.y; }
      report.info.mobilePhoto = old.name + ' -> ' + s.name + ' ' + r(s.width) + 'x' + r(s.height); old.remove();
    }
    // rozet
    const badges = []; for (const i of pg.findAll(n => n.type === 'INSTANCE')) { const m = await i.getMainComponentAsync(); if (m && m.parent && m.parent.type === 'COMPONENT_SET' && m.parent.name === 'Verification badge') badges.push(i); }
    if (!badges.length) {
      const rb = []; for (const i of dirHero.findAll(n => n.type === 'INSTANCE')) { const m = await i.getMainComponentAsync(); if (m && m.parent && m.parent.name === 'Verification badge') rb.push(i); }
      if (rb.length) { const src = rb[0], pn = src.parent.name; const target = hero.findOne(n => n.name === pn && n.type === 'FRAME'); if (target) { const b2 = src.clone(); target.insertChild(Math.min(src.parent.children.indexOf(src), target.children.length), b2); badges.push(b2); } }
    }
    for (const b of badges) b.setProperties({ Status: 'Unverified' });
    report.info['badges ' + D] = badges.length + (badges.length ? ' in ' + badges[0].parent.name : ' (none found)');
    // kartlar
    const body = pg.findOne(n => n.name === 'Profile body');
    const links = body.findOne(n => n.type === 'FRAME' && n.name === 'Links'), gal = body.findOne(n => n.type === 'FRAME' && n.name === 'Gallery'), about = body.findOne(n => n.type === 'INSTANCE' && n.name === 'About');
    if (!links || !gal || !about) throw new Error('cards missing: ' + !!links + !!gal + !!about);
    const eL = swapIn(links, emptyInst(D));
    const eA = emptyInst(D); await setT(eA, 'Section heading', 'About'); await setT(eA, 'Title', 'Tell scouts about yourself'); await setT(eA, 'Body', 'A few lines on your style, strengths and what you are looking for.'); await setT(eA, 'Label', 'Add about'); swapIn(about, eA);
    const eG = emptyInst(D); await setT(eG, 'Section heading', 'Gallery'); await setT(eG, 'Title', 'Add photos'); await setT(eG, 'Body', 'Photos help scouts and clubs recognise you. The first six show on your profile.'); await setT(eG, 'Label', 'Add photos'); swapIn(gal, eG);
    report.info['emptyCards ' + D] = [eL, eA, eG].map(e => r(e.width) + 'x' + r(e.height)).join(' | ');
    // kariyer: tek satir
    const career = body.findOne(n => n.type === 'FRAME' && n.name === 'Career'); if (!career) throw new Error('career missing');
    const rows = []; for (const i of career.findAll(n => n.type === 'INSTANCE')) { const m = await i.getMainComponentAsync(); if (m && m.parent && m.parent.type === 'COMPONENT_SET' && m.parent.name === 'Club entry') rows.push(i); }
    report.info['careerRows ' + D] = rows.length + ' found';
    if (rows.length) {
      const before = rows[0].findAll(n => n.type === 'TEXT').map(t => t.characters);
      for (let k = 1; k < rows.length; k++) rows[k].remove();
      const ap = {}; for (const k of Object.keys(rows[0].componentProperties)) if (/^Achievements/.test(k)) ap[k] = false; if (Object.keys(ap).length) rows[0].setProperties(ap);
      for (const t of rows[0].findAll(n => n.type === 'TEXT')) { const c0 = t.characters; const c1 = c0.replace(/[A-Z][a-z]{2}\s+(19|20)\d{2}/, 'Jul 2023'); if (c1 !== c0) { await loadFonts(t); t.characters = c1; } }
      report.info['careerRow1 ' + D] = before.join(' | ') + '  =>  ' + rows[0].findAll(n => n.type === 'TEXT').map(t => t.characters).join(' | ');
    }
    for (const t of career.findAll(n => n.type === 'TEXT')) { if (/^\d+ clubs?\b/.test(t.characters)) { const was = t.characters; await loadFonts(t); t.characters = t.characters.replace(/^\d+ clubs?/, '1 club').replace(/(19|20)\d{2}/, '2023'); report.info['careerHeader ' + D] = was + ' => ' + t.characters; } }
    // not + giris oku
    const note = await txt('Note · New member · ' + D, 'Developer note: shown right after sign-up. The strip stays until the email link is used. Empty cards invite the owner to fill them and stay hidden on the public profile; each one opens the form of that card. Fields come from the sign-up steps, so Contract until is not shown.', 'Label/Small', 'color/text/warning');
    sub.appendChild(note); note.textAutoResize = 'HEIGHT'; note.resize(Math.min(W, 440), note.height); note.x = pg.x; note.y = pg.y + pg.height + 40;
    const cx = pg.x + W / 2; const { g, lab } = await elbow(sub, [[cx, pg.y - 120], [cx, pg.y]], 'From Sign up · after Create account', 'Flow · Entry · New member · ' + D, []);
    const av = g.findOne(n => n.name === 'Arrow'); if (av) av.dashPattern = [12, 8]; lab.x = cx + 16; lab.y = pg.y - 110;
    let right = 0, bot = 0; for (const k of sub.children) { right = Math.max(right, k.x + k.width); bot = Math.max(bot, k.y + k.height); }
    sub.resizeWithoutConstraints(Math.max(sub.width, Math.ceil(right + 80)), Math.ceil(bot + 80));
    PAGES[D] = pg; report.info['pageHeight ' + D] = r(pg.height);
  });
}

await step('flow starts', async () => {
  const keep = [];
  for (const s of (p02.flowStartingPoints || [])) { const n = await figma.getNodeByIdAsync(s.nodeId); if (!n || /New member/.test(n.name)) continue; if (keep.some(k => k.name === s.name)) continue; keep.push({ nodeId: s.nodeId, name: s.name }); }
  p02.flowStartingPoints = keep; report.info.flowStarts = keep.length;
});
const plat = name => p02.children.find(n => n.type === 'SECTION' && n.name === name);
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
  for (const n of created) { try { for (const p of [].concat(n.fills, n.strokes)) if (p && p.type === 'SOLID' && hex(p) === '#808080') { grey.push(n.name); break; } } catch (e) {} }
  report.info.placeholderGrey = grey.length ? grey : 'none';
  let total = 0, broken = 0;
  for (const n of p02.findAll(n => n.reactions && n.reactions.length)) for (const rr of n.reactions) for (const a of (rr.actions || [])) { if (!a.destinationId) continue; total++; if (!(await figma.getNodeByIdAsync(a.destinationId))) broken++; }
  report.info.prototype = total + ' links, ' + broken + ' broken';
});

return report;
