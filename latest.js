// step 285 · Account menu "Shortlists" row (Role=Other, Desktop + Mobile; Menu icon star) + Phase 5 row components in Section 10: Contact row, Notification row, Shortlist row (Desktop/Mobile); nothing placed on 02 yet
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/); await p01.loadAsync();
await figma.setCurrentPageAsync(p01);
const allVars = await figma.variables.getLocalVariablesAsync();
const tryV = (...names) => { for (const n of names) { const v = allVars.find(x => x.name === n || x.name.endsWith('/' + n)); if (v) return v; } return null; };
const V = name => { const v = tryV(name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const PAD = (n, t, r, b, l) => { n.setBoundVariable('paddingTop', V(t)); n.setBoundVariable('paddingRight', V(r)); n.setBoundVariable('paddingBottom', V(b)); n.setBoundVariable('paddingLeft', V(l)); };
const GAP = (n, v) => n.setBoundVariable('itemSpacing', V(v));
const RAD = (n, v) => { for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) n.setBoundVariable(k, V(v)); };
const sz = n => Math.round(n.width) + 'x' + Math.round(n.height);
const setText = async (node, str) => { for (const seg of node.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); node.characters = str; };
function mkIcon(svg, colorVar, size) {
  const ic = figma.createNodeFromSvg(svg); ic.name = 'Icon'; ic.fills = []; ic.resize(size, size); ic.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
  const walk = x => { if ('children' in x) x.children.forEach(walk); if (x.type !== 'FRAME' && x.type !== 'GROUP') { if (x.strokes && x.strokes.length) x.strokes = [P(V(colorVar))]; x.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; } };
  walk(ic); return ic;
}
const SV = body => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
const findSet = nm => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === nm);

// ---------- A. Menu icon star + Account menu Shortlists row ----------
await step('Account menu: Shortlists row', async () => {
  const iconSet = findSet('Menu icon'), menuSet = findSet('Account menu');
  if (!iconSet || !menuSet) throw new Error('Menu icon / Account menu set missing');
  const old = iconSet.children.find(v => v.name === 'Icon=star'); if (old) old.remove();
  const base = iconSet.children.find(v => v.name === 'Icon=user'); if (!base) throw new Error('Icon=user missing');
  let last = 0; for (const v of iconSet.children) if (v.y + v.height > last) last = v.y + v.height;
  const c = base.clone(); iconSet.appendChild(c); c.name = 'Icon=star';
  for (const k of c.children.slice()) k.remove();
  const g = mkIcon(SV('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'), 'color/icon/default', 20); g.name = 'Glyph'; c.appendChild(g); g.x = 0; g.y = 0;
  c.x = base.x; c.y = last + 16; iconSet.resizeWithoutConstraints(iconSet.width, c.y + c.height + 24);

  const parent = menuSet.parent;
  const oldBottom = menuSet.y + menuSet.height;
  const oldPad = menuSet.height - Math.max.apply(null, menuSet.children.map(v => v.y + v.height));
  const heightsBefore = menuSet.children.map(v => v.name.replace('Device=', '').replace(', Role=', '/') + ' ' + Math.round(v.height));
  for (const v of menuSet.children.filter(x => /Role=Other/.test(x.name))) {
    const ex = v.findOne(n => n.name === 'Row · Shortlists'); if (ex) ex.remove();
    const mc = v.findOne(n => n.name === 'Row · My contacts'); if (!mc) throw new Error('Row · My contacts missing in ' + v.name);
    const idx = v.children.indexOf(mc);
    const r = mc.clone(); v.insertChild(idx + 1, r); r.name = 'Row · Shortlists';
    r.layoutSizingHorizontal = 'FILL';
    const lt = r.findOne(n => n.type === 'TEXT' && n.name === 'Label'); await setText(lt, 'Shortlists');
    const ic = r.findOne(n => n.type === 'INSTANCE' && n.name === 'Menu icon'); ic.swapComponent(c);
  }
  const newBottomInner = Math.max.apply(null, menuSet.children.map(v => v.y + v.height));
  menuSet.resizeWithoutConstraints(menuSet.width, newBottomInner + oldPad);
  const delta = Math.round(menuSet.y + menuSet.height - oldBottom);
  let moved = 0;
  if (delta > 0) {
    for (const s of parent.children) if (s !== menuSet && s.y >= oldBottom - 1) { s.y += delta; moved++; }
    if (parent.type === 'SECTION') parent.resizeWithoutConstraints(parent.width, parent.height + delta);
  }
  const rowsNow = {}; for (const v of menuSet.children) rowsNow[v.name] = Math.round(v.height) + ' · ' + v.findAll(n => /^Row ·/.test(n.name)).map(r => r.name.replace('Row · ', '')).join(', ');
  // overlap check in parent
  const ov = []; const sib = parent.children.filter(n => 'width' in n);
  for (let i = 0; i < sib.length; i++) for (let j = i + 1; j < sib.length; j++) { const a = sib[i], b = sib[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov.push(a.name + ' x ' + b.name); }
  report.info.accountMenu = { heightsBefore, rowsNow, setSize: sz(menuSet), shiftedSiblings: moved, delta, parent: parent.name + ' ' + sz(parent), parentOverlaps: ov.length ? ov.slice(0, 6) : 'none', iconCount: iconSet.children.length };
});

// ---------- B. Row components in Section 10 ----------
const SEC = '10 · Contacts & settings';
await step('Row components (Contact row, Notification row, Shortlist row)', async () => {
  const sec = p01.findOne(n => n.type === 'SECTION' && n.name === SEC); if (!sec) throw new Error('Section 10 missing: run step 284');
  for (const nm of ['Contact row', 'Notification row', 'Shortlist row']) for (const o of sec.children.filter(n => n.name === nm || n.name === nm + ' note').slice()) o.remove();

  const personSet = findSet('Person row'), eventSet = findSet('Event row'), btnSet = findSet('Button'), ibSet = findSet('Icon button'), stSet = findSet('Application status'), flagSet = findSet('Flag');
  if (!personSet || !eventSet || !btnSet || !ibSet || !stSet || !flagSet) throw new Error('a source set is missing');
  const pv = personSet.children.find(v => /State=Default/.test(v.name));
  const srcPhoto = pv.findOne(n => n.name === 'Photo'), srcName = pv.findOne(n => n.type === 'TEXT' && n.name === 'Name'), srcMeta = pv.findOne(n => n.type === 'TEXT' && n.name === 'Meta');
  const ev = eventSet.children.find(v => v.name === 'Device=Desktop, State=Default');
  const srcBody = ev.findOne(n => n.type === 'TEXT' && n.name === 'Dates');
  if (!srcPhoto || !srcName || !srcMeta || !srcBody) throw new Error('source nodes missing');

  async function T(src, chars, name, colorVar) { const t = src.clone(); t.name = name; await setText(t, chars); t.textAutoResize = 'WIDTH_AND_HEIGHT'; if (colorVar) t.fills = [P(V(colorVar))]; return t; }
  function fr(name, mode, gap) { const f = figma.createFrame(); f.name = name; f.fills = []; f.clipsContent = false; f.layoutMode = mode; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; if (gap) GAP(f, gap); return f; }
  function btn(style, label) {
    const v = btnSet.children.find(x => x.name === 'Style=' + style + ', State=Default'); if (!v) throw new Error('Button variant ' + style);
    const i = v.createInstance(); const props = i.componentProperties; const props2 = {};
    for (const k of Object.keys(props)) { if (/^Label#/.test(k)) props2[k] = label; if (/^Icon#/.test(k)) props2[k] = false; }
    i.setProperties(props2); i.name = 'Button · ' + label;
    const lt = i.findOne(n => n.type === 'TEXT'); if (lt && lt.characters !== label) throw new Error('button label did not apply: ' + lt.characters);
    return i;
  }
  function ibtn(icon) { const v = ibSet.children.find(x => x.name === 'Icon=' + icon); if (!v) throw new Error('Icon button ' + icon); const i = v.createInstance(); i.name = 'Icon button · ' + icon; return i; }
  function status(s) { const v = stSet.children.find(x => x.name === 'Status=' + s); if (!v) throw new Error('status ' + s); const i = v.createInstance(); i.name = 'Application status'; return i; }
  function flag(c) { const v = flagSet.children.find(x => x.name.indexOf('Country=' + c) >= 0); if (!v) throw new Error('flag ' + c); const i = v.createInstance(); i.name = 'Flag'; return i; }
  function root(name, w, vertical, hover) {
    const c = figma.createComponent(); c.name = name; c.layoutMode = vertical ? 'VERTICAL' : 'HORIZONTAL'; c.resize(w, 20);
    if (vertical) { c.counterAxisSizingMode = 'FIXED'; c.primaryAxisSizingMode = 'AUTO'; } else { c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO'; c.counterAxisAlignItems = 'CENTER'; }
    RAD(c, 'radius/md'); c.fills = hover ? [P(V('color/bg/subtle'))] : []; c.clipsContent = false;
    return c;
  }
  const place = (comps, host) => {
    const cols = { Desktop: 32, Mobile: 32 + 1040 + 48 }, ys = { Desktop: 32, Mobile: 32 };
    for (const c of comps) { const d = /Device=Mobile/.test(c.name) ? 'Mobile' : 'Desktop'; host.appendChild(c); c.x = cols[d]; c.y = ys[d]; ys[d] += c.height + 24; }
    return Math.max(ys.Desktop, ys.Mobile);
  };
  const combined = [];

  // ----- Contact row -----
  const contacts = [];
  const kinds = [['Connected', 'Tom Reilly', 'Manager · Riverside FC'], ['Received', 'Sofia Lindqvist', 'Intermediary · Northgate Athletic'], ['Sent', 'Ana Ferreira', 'Referee · Berlin FA']];
  for (const dev of ['Desktop', 'Mobile']) for (const [kind, nm, meta] of kinds) for (const st of ['Default', 'Hover']) {
    const mob = dev === 'Mobile', w = mob ? 358 : 1040;
    const c = root('Device=' + dev + ', Kind=' + kind + ', State=' + st, w, mob, st === 'Hover');
    PAD(c, 'spacing/sm', 'spacing/md', 'spacing/sm', 'spacing/md'); GAP(c, mob ? 'spacing/sm' : 'spacing/md');
    const head = mob ? fr('Head', 'HORIZONTAL', 'spacing/md') : c; if (mob) head.counterAxisAlignItems = 'CENTER';
    const photo = srcPhoto.clone(); photo.name = 'Photo'; head.appendChild(photo);
    const text = fr('Text', 'VERTICAL', 'spacing/2xs'); head.appendChild(text);
    text.appendChild(await T(srcName, nm, 'Name')); text.appendChild(await T(srcMeta, meta, 'Meta'));
    if (mob) { c.appendChild(head); head.layoutSizingHorizontal = 'FILL'; } 
    text.layoutSizingHorizontal = 'FILL';
    const acts = fr('Actions', 'HORIZONTAL', 'spacing/xs'); acts.counterAxisAlignItems = 'CENTER';
    if (kind === 'Connected') { acts.appendChild(btn('Secondary', 'Message')); acts.appendChild(ibtn('More')); }
    else if (kind === 'Received') { acts.appendChild(btn('Primary', 'Accept')); acts.appendChild(btn('Secondary', 'Decline')); }
    else { acts.appendChild(status('Pending')); acts.appendChild(btn('Subtle', 'Cancel request')); }
    c.appendChild(acts);
    if (mob) { acts.layoutSizingHorizontal = 'FILL'; if (kind !== 'Sent') for (const k of acts.children) if (k.name !== 'Icon button · More') k.layoutSizingHorizontal = 'FILL'; }
    contacts.push(c);
  }
  // ----- Notification row -----
  const notifs = [];
  const nk = [['Request', 'Join request', 'Daniel Brandt wants to join Berlin Autumn Cup.'], ['Update', 'Request accepted', 'Your request for Berlin Autumn Cup was accepted.']];
  for (const dev of ['Desktop', 'Mobile']) for (const [kind, title, body] of nk) for (const un of ['False', 'True']) {
    const mob = dev === 'Mobile', w = mob ? 358 : 1040;
    const c = root('Device=' + dev + ', Kind=' + kind + ', Unread=' + un, w, false, false);
    c.counterAxisAlignItems = 'MIN'; PAD(c, 'spacing/md', 'spacing/md', 'spacing/md', 'spacing/md'); GAP(c, 'spacing/md');
    const photo = srcPhoto.clone(); photo.name = 'Photo'; c.appendChild(photo);
    const text = fr('Text', 'VERTICAL', 'spacing/2xs'); c.appendChild(text); text.layoutSizingHorizontal = 'FILL';
    text.appendChild(await T(srcName, title, 'Title'));
    const b = await T(srcBody, body, 'Body'); text.appendChild(b); b.layoutSizingHorizontal = 'FILL';
    text.appendChild(await T(srcMeta, '2 hours ago', 'Time'));
    const acts = fr('Actions', 'HORIZONTAL', 'spacing/xs'); acts.counterAxisAlignItems = 'CENTER';
    if (kind === 'Request') { acts.appendChild(btn('Primary', 'Accept')); acts.appendChild(btn('Secondary', 'Decline')); } else acts.appendChild(status('Accepted'));
    text.appendChild(acts);
    text.itemSpacing = 0; GAP(text, 'spacing/2xs'); acts.layoutPositioning = 'AUTO';
    if (un === 'True') { const d = figma.createEllipse(); d.name = 'Unread dot'; d.resize(8, 8); d.fills = [P(V('color/bg/brand'))]; c.appendChild(d); }
    notifs.push(c);
  }
  // ----- Shortlist row -----
  const shorts = [];
  for (const dev of ['Desktop', 'Mobile']) for (const st of ['Default', 'Hover']) {
    const mob = dev === 'Mobile', w = mob ? 358 : 1040;
    const c = root('Device=' + dev + ', State=' + st, w, mob, st === 'Hover');
    PAD(c, 'spacing/sm', 'spacing/md', 'spacing/sm', 'spacing/md'); GAP(c, mob ? 'spacing/sm' : 'spacing/md');
    const head = mob ? fr('Head', 'HORIZONTAL', 'spacing/md') : c; if (mob) head.counterAxisAlignItems = 'CENTER';
    const photo = srcPhoto.clone(); photo.name = 'Photo'; head.appendChild(photo);
    const text = fr('Text', 'VERTICAL', 'spacing/2xs'); head.appendChild(text);
    text.appendChild(await T(srcName, 'Jonas Weber', 'Name')); text.appendChild(await T(srcMeta, 'Attacking Midfield · Riverside FC', 'Meta'));
    if (mob) { c.appendChild(head); head.layoutSizingHorizontal = 'FILL'; }
    text.layoutSizingHorizontal = 'FILL';
    const facts = fr('Key facts', 'HORIZONTAL', mob ? 'spacing/md' : 'spacing/lg'); 
    const cell = async (label, valueNode, width) => { const f = fr('Fact', 'VERTICAL', 'spacing/2xs'); f.appendChild(await T(srcMeta, label, 'Label')); f.appendChild(valueNode); facts.appendChild(f); if (mob) f.layoutSizingHorizontal = 'FILL'; else { f.resize(width, f.height); f.counterAxisSizingMode = 'AUTO'; f.primaryAxisSizingMode = 'FIXED'; } return f; };
    await cell('Age', await T(srcBody, '19', 'Value'), 56);
    const nat = fr('Value', 'HORIZONTAL', 'spacing/xs'); nat.counterAxisAlignItems = 'CENTER'; nat.appendChild(flag('Poland')); nat.appendChild(await T(srcBody, 'Poland', 'Nation'));
    await cell('Nationality', nat, 128);
    await cell('Contract until', await T(srcBody, 'Jun 2027', 'Value'), 112);
    c.appendChild(facts);
    const acts = fr('Actions', 'HORIZONTAL', 'spacing/xs'); acts.counterAxisAlignItems = 'CENTER';
    acts.appendChild(btn('Secondary', 'Message')); acts.appendChild(btn('Subtle', 'Remove'));
    c.appendChild(acts);
    if (mob) { facts.layoutSizingHorizontal = 'FILL'; acts.layoutSizingHorizontal = 'FILL'; for (const k of acts.children) k.layoutSizingHorizontal = 'FILL'; }
    shorts.push(c);
  }

  // ----- put them in the Section -----
  const styles = await figma.getLocalTextStylesAsync(); const st = styles.find(s => s.name === 'Label/Small'); if (!st) throw new Error('Label/Small missing'); await figma.loadFontAsync(st.fontName);
  const note = async (name, str, colorVar, x, y) => { const t = figma.createText(); t.name = name; await t.setTextStyleIdAsync(st.id); t.characters = str; t.fills = [P(V(colorVar))]; sec.appendChild(t); t.x = x; t.y = y; return t; };
  let y = 140 + 2 * 48 + 120;
  const defs = [
    ['Contact row', contacts, 'Contact row: one person in My contacts. Kind = Connected (Message, more), Received (Accept, Decline), Sent (Pending, Cancel request). Hover only shows a subtle fill; the row opens the profile.', 'color/text/secondary'],
    ['Notification row', notifs, 'Notification row: Request (Accept, Decline) or Update (status). Unread = dot on the right. Used for event join requests and connection requests.', 'color/text/secondary'],
    ['Shortlist row', shorts, 'Shortlist row: decision data first (age, nationality, contract). Message and Remove stay on the row.', 'color/text/secondary']
  ];
  let maxRight = 990;
  for (const [nm, comps, desc, col] of defs) {
    const n1 = await note(nm + ' note', desc, col, 80, y);
    const set0 = comps; const bottom = place(set0, sec);
    const set = figma.combineAsVariants(comps, sec); set.name = nm;
    set.resizeWithoutConstraints(32 + 1040 + 48 + 358 + 32, bottom + 8);
    set.x = 80; set.y = y + 40;
    y = set.y + set.height + 120;
    maxRight = Math.max(maxRight, set.x + set.width + 80);
    combined.push(set);
  }
  const dn = await note('Shortlist row note · developer', 'For the developer: the Shortlists menu row and this page are only for users with shortlists = 1 (manager/official and intermediary).', 'color/text/warning', 80, y - 80);
  sec.resizeWithoutConstraints(Math.max(maxRight, Math.ceil(dn.width) + 160), y + 40);

  // Archive to the right of everything
  const arch = p01.findOne(n => n.type === 'SECTION' && /^Archive/.test(n.name));
  const others = p01.children.filter(n => n.type === 'SECTION' && n !== arch);
  if (arch) arch.x = Math.max.apply(null, others.map(s => s.x + s.width)) + 160;

  // checks
  const gray = [], unstyled = [], clip = [];
  for (const set of combined) for (const v of set.children) {
    for (const n of v.findAll(() => true)) {
      if (n.type === 'TEXT' && !n.textStyleId) unstyled.push(set.name + '/' + n.name);
      if (n.type !== 'INSTANCE' && n.fills && n.fills !== figma.mixed) for (const f of n.fills) if (f.type === 'SOLID' && Math.abs(f.color.r - .5) < .01 && Math.abs(f.color.g - .5) < .01 && Math.abs(f.color.b - .5) < .01 && !(f.boundVariables && f.boundVariables.color)) gray.push(set.name + '/' + n.name);
    }
    // overflow: any child wider than the row (visible)
    for (const k of v.findAll(n => n.type !== 'TEXT' && 'width' in n)) { const a = k.absoluteBoundingBox, b = v.absoluteBoundingBox; if (a && b && a.x + a.width > b.x + b.width + 0.5) clip.push(set.name + '/' + v.name.replace('Device=', '') + ' › ' + k.name); }
  }
  const secs = p01.children.filter(n => n.type === 'SECTION'); const ovs = [];
  for (let i = 0; i < secs.length; i++) for (let j = i + 1; j < secs.length; j++) { const a = secs[i], b = secs[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ovs.push(a.name + ' x ' + b.name); }
  report.info.rows = {
    sets: combined.map(s => s.name + ': ' + s.children.length + ' var, set ' + sz(s)),
    heights: combined.map(s => s.name + ' → ' + s.children.map(v => v.name.replace('Device=', '').replace(', Kind=', '/').replace(', State=', '/').replace(', Unread=', '/u') + ' ' + sz(v)).join(' | ')),
    sectionSize: sz(sec), archiveX: arch ? Math.round(arch.x) : '-', sectionOverlaps: ovs.length ? ovs : 'none',
    unstyledText: unstyled.length ? unstyled.slice(0, 8) : 'none', unboundGrayFills: gray.length ? gray.slice(0, 8) : 'none', overflowRight: clip.length ? clip.slice(0, 12) : 'none'
  };
});
return report;
