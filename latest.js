// step 409 · Faz 8 (1): 01'de yeni Section "11 · System" + Cookie banner (Desktop/Mobile) + Cookie dialog (Log out dialog klonu, Setting row + Switch ile 3 kategori). Archive saga kayar
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const sz = n => R(n.width) + 'x' + R(n.height);
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
await figma.setCurrentPageAsync(p01);
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name) || allVars.find(x => x.name.endsWith('/' + name)); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const PAD = (n, t, r, b, l) => { n.setBoundVariable('paddingTop', V(t)); n.setBoundVariable('paddingRight', V(r)); n.setBoundVariable('paddingBottom', V(b)); n.setBoundVariable('paddingLeft', V(l)); };
const GAP = (n, v) => n.setBoundVariable('itemSpacing', V(v));
const styles = await figma.getLocalTextStylesAsync();
const effects = await figma.getLocalEffectStylesAsync();
const TS = nm => { const s = styles.find(x => x.name === nm); if (!s) throw new Error('text style yok: ' + nm); return s; };
for (const s of styles) { try { await figma.loadFontAsync(s.fontName); } catch (e) {} }
async function setText(t, s) { const f = t.fontName; await figma.loadFontAsync(f === figma.mixed ? t.getRangeFontName(0, 1) : f); t.characters = s; }
async function txt(name, str, style, color) {
  const t = figma.createText(); t.name = name; await t.setTextStyleIdAsync(TS(style).id); t.characters = str; t.fills = [P(V(color))]; return t;
}
function frame(name, dir) { const f = figma.createFrame(); f.name = name; f.layoutMode = dir; f.fills = []; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; f.clipsContent = false; return f; }
const findSet = nm => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === nm);
const btnSet = findSet('Button');
const btnVar = style => btnSet.children.find(v => v.name === 'Style=' + style + ', State=Default');
async function button(label, style) {
  const b = btnVar(style).createInstance(); b.name = 'Button · ' + label;
  b.setProperties({ 'Label#8:0': label });
  const t = b.findOne(n => n.type === 'TEXT'); if (t) await setText(t, label);
  return b;
}
async function restyle(b, label, style) {
  const k = Object.keys(b.componentProperties).find(x => /^Style/.test(x));
  if (k) b.setProperties({ [k]: style });
  b.setProperties({ 'Label#8:0': label });
  const t = b.findOne(n => n.type === 'TEXT'); if (t) await setText(t, label);
  b.name = 'Button · ' + label;
}
const fillW = n => { try { n.layoutSizingHorizontal = 'FILL'; } catch (e) {} };
const SEC = '11 · System';

// ---------- 0. temizlik
let sec = p01.findOne(n => n.type === 'SECTION' && n.name === SEC);
await step('Section hazirla', async () => {
  for (const n of p01.children.slice()) if (n.type === 'COMPONENT' && /^Device=/.test(n.name)) n.remove();
  if (sec) { for (const c of sec.children.slice()) c.remove(); }
  else {
    const prev = p01.findOne(n => n.type === 'SECTION' && n.name === '10 · Contacts & settings');
    sec = figma.createSection(); sec.name = SEC; sec.x = prev.x + prev.width + 160; sec.y = 0;
  }
});

// ---------- 1. Cookie banner
let bannerSet = null;
const BODY = 'We use necessary cookies to run fmatches. With your consent we also use analytics and marketing cookies. You can change your choice any time.';
await step('Cookie banner', async () => {
  const comps = [];
  for (const dev of ['Desktop', 'Mobile']) {
    const D = dev === 'Desktop';
    const c = figma.createComponent(); c.name = 'Device=' + dev;
    c.fills = [P(V('color/bg/surface'))];
    c.strokes = [P(V('color/border/default'))]; c.strokeAlign = 'INSIDE';
    c.strokeTopWeight = 1; c.strokeBottomWeight = 0; c.strokeLeftWeight = 0; c.strokeRightWeight = 0;
    const sh = effects.find(e => e.name === 'Shadow/Raised'); if (sh) await c.setEffectStyleIdAsync(sh.id);
    c.layoutMode = D ? 'HORIZONTAL' : 'VERTICAL';
    c.primaryAxisSizingMode = D ? 'FIXED' : 'AUTO'; c.counterAxisSizingMode = D ? 'AUTO' : 'FIXED';
    c.counterAxisAlignItems = D ? 'CENTER' : 'MIN';
    if (D) { PAD(c, 'spacing/lg', 'layout/page-gutter', 'spacing/lg', 'layout/page-gutter'); GAP(c, 'spacing/xl'); }
    else { PAD(c, 'spacing/md', 'spacing/md', 'spacing/lg', 'spacing/md'); GAP(c, 'spacing/md'); }
    c.resize(D ? 1440 : 390, 100);
    if (D) c.primaryAxisSizingMode = 'FIXED'; else c.primaryAxisSizingMode = 'AUTO';
    const copy = frame('Copy', 'VERTICAL'); GAP(copy, 'spacing/2xs');
    c.appendChild(copy); fillW(copy);
    const title = await txt('Title', 'We use cookies', 'Label/Large Strong', 'color/text/primary');
    const body = await txt('Body', BODY, 'Body/Small', 'color/text/secondary');
    const link = await txt('Link · Privacy policy', 'Read our privacy policy', 'Label/Default Strong', 'color/text/brand');
    for (const t of [title, body, link]) copy.appendChild(t);
    body.layoutSizingHorizontal = 'FILL'; body.textAutoResize = 'HEIGHT';
    const acts = frame('Actions', D ? 'HORIZONTAL' : 'VERTICAL'); GAP(acts, D ? 'spacing/sm' : 'spacing/xs');
    c.appendChild(acts);
    const manage = await button('Manage', 'Subtle');
    const reject = await button('Reject all', 'Secondary');
    const accept = await button('Accept all', 'Secondary');
    if (D) { for (const b of [manage, reject, accept]) acts.appendChild(b); acts.counterAxisAlignItems = 'CENTER'; }
    else {
      fillW(acts);
      const row = frame('Choice row', 'HORIZONTAL'); GAP(row, 'spacing/xs');
      acts.appendChild(row); fillW(row);
      for (const b of [reject, accept]) { row.appendChild(b); fillW(b); try { b.primaryAxisAlignItems = 'CENTER'; } catch (e) {} }
      acts.appendChild(manage); fillW(manage); try { manage.primaryAxisAlignItems = 'CENTER'; } catch (e) {}
    }
    sec.appendChild(c);
    comps.push(c);
  }
  const set = figma.combineAsVariants(comps, sec); set.name = 'Cookie banner';
  set.description = 'Cookie banner: fixed to the bottom of the viewport on the first visit, above the page content, no scrim. Reject all and Accept all have equal weight (same style, side by side) so declining is as easy as accepting. Manage opens Cookie dialog. The banner hides after any choice; the footer link "Cookie settings" reopens Cookie dialog.';
  comps[0].x = 0; comps[0].y = 0; comps[1].x = 0; comps[1].y = comps[0].height + 40;
  set.resizeWithoutConstraints(1440, comps[1].y + comps[1].height);
  bannerSet = set;
  report.info.banner = set.children.map(v => v.name + ' ' + sz(v));
});

// ---------- 2. Cookie dialog (Log out dialog klonu)
let dialogSet = null;
const CATS = [
  { key: 'Necessary', sub: 'Keep you signed in and the site secure. Always on.', on: true, locked: true },
  { key: 'Analytics', sub: 'Show us which pages people use so we can improve them.', on: false },
  { key: 'Marketing', sub: 'Let partners show you relevant offers on other sites.', on: false }
];
await step('Cookie dialog', async () => {
  const lo = findSet('Log out dialog'); if (!lo) throw new Error('Log out dialog yok');
  const rowSet = findSet('Setting row'); if (!rowSet) throw new Error('Setting row yok');
  const comps = []; const log = [];
  for (const dev of ['Desktop', 'Mobile']) {
    const D = dev === 'Desktop';
    const src = lo.children.find(v => v.name === 'Device=' + dev);
    const c = src.clone(); sec.appendChild(c); c.name = 'Device=' + dev;
    c.resize(D ? 560 : 358, c.height); c.primaryAxisSizingMode = 'AUTO';
    const copy = c.findOne(n => n.name === 'Copy'); fillW(copy);
    const texts = copy.findAll(n => n.type === 'TEXT');
    texts[0].name = 'Title'; await setText(texts[0], 'Cookie settings');
    texts[1].name = 'Body'; await setText(texts[1], 'Choose which cookies fmatches can use. You can change this any time from Cookie settings in the footer.');
    for (const t of texts) { try { t.layoutSizingHorizontal = 'FILL'; t.textAutoResize = 'HEIGHT'; } catch (e) {} }
    const cats = frame('Categories', 'VERTICAL'); cats.itemSpacing = 0;
    c.insertChild(c.children.indexOf(copy) + 1, cats); fillW(cats);
    for (let i = 0; i < CATS.length; i++) {
      const d = CATS[i], last = i === CATS.length - 1;
      const v = rowSet.children.find(x => x.name === 'Device=' + dev + ', Divider=' + (last ? 'Off' : 'On'));
      const r = v.createInstance(); r.name = 'Setting · ' + d.key; cats.appendChild(r); fillW(r);
      const tt = r.findOne(n => n.type === 'TEXT' && n.name === 'Title'); if (tt) await setText(tt, d.key);
      const st = r.findOne(n => n.type === 'TEXT' && n.name === 'Sub'); if (st) await setText(st, d.sub);
      const sw = r.findOne(n => n.type === 'INSTANCE' && n.name === 'Switch');
      if (sw) {
        const ck = Object.keys(sw.componentProperties).find(k => /^Checked/.test(k));
        const sk = Object.keys(sw.componentProperties).find(k => /^State/.test(k));
        const props = {}; if (ck) props[ck] = d.on ? 'On' : 'Off'; if (sk) props[sk] = d.locked ? 'Disabled' : 'Default';
        sw.setProperties(props);
      } else log.push(dev + ' ' + d.key + ': Switch yok');
    }
    const acts = c.findOne(n => n.name === 'Actions'); fillW(acts);
    const bs = acts.findAll(n => n.type === 'INSTANCE' && /^Button/.test(n.name));
    const cancel = bs.find(b => /Cancel/.test(b.name)), primary = bs.find(b => !/Cancel/.test(b.name));
    log.push(dev + ' actions ' + acts.layoutMode + ' order ' + acts.children.map(n => n.name).join(','));
    await restyle(cancel, 'Reject all', 'Secondary');
    await restyle(primary, 'Save choices', 'Primary');
    const accept = cancel.clone(); await restyle(accept, 'Accept all', 'Secondary');
    acts.insertChild(acts.children.indexOf(cancel) + (acts.children.indexOf(primary) < acts.children.indexOf(cancel) ? 0 : 1), accept);
    if (!D) {
      acts.layoutMode = 'VERTICAL';
      // mobilde birincil ustte
      acts.insertChild(0, primary);
      for (const b of [primary, accept, cancel]) { fillW(b); try { b.primaryAxisAlignItems = 'CENTER'; } catch (e) {} }
    }
    comps.push(c);
  }
  const set = figma.combineAsVariants(comps, sec); set.name = 'Cookie dialog';
  set.description = 'Cookie dialog: opened from Manage on Cookie banner and from the footer link "Cookie settings". Centered over a scrim. Necessary is always on (locked Switch); Analytics and Marketing are off until the user turns them on. Developer: match the categories to the cookies the site really sets.';
  comps[0].x = 0; comps[0].y = 0; comps[1].x = comps[0].width + 80; comps[1].y = 0;
  set.resizeWithoutConstraints(comps[1].x + comps[1].width, Math.max(comps[0].height, comps[1].height));
  dialogSet = set;
  report.info.dialog = { variants: set.children.map(v => v.name + ' ' + sz(v)), log, actions: set.children.map(v => { const a = v.findOne(n => n.name === 'Actions'); return v.name + ': ' + a.children.map(b => b.name.replace('Button · ', '') + ' ' + R(b.width)).join(' | ') + ' (' + R(a.width) + ')'; }) };
});

// ---------- 3. yerlesim, notlar, Archive
await step('Yerlesim', async () => {
  const note = async (str, y) => { const t = await txt('Note', str, 'Label/Small', 'color/text/secondary'); sec.appendChild(t); t.x = 80; t.y = y; return t; };
  const n1 = await note('Cookie banner: first visit only, fixed to the bottom of the viewport. Reject all and Accept all carry equal weight.', 90);
  bannerSet.x = 80; bannerSet.y = 140;
  const y2 = bannerSet.y + bannerSet.height + 120;
  const n2 = await note('Cookie dialog: opens from Manage and from the footer link Cookie settings. Necessary is locked on.', y2 - 50);
  dialogSet.x = 80; dialogSet.y = y2;
  sec.resizeWithoutConstraints(Math.max(bannerSet.width, dialogSet.width) + 160, dialogSet.y + dialogSet.height + 80);
  const arch = p01.findOne(n => n.type === 'SECTION' && /^Archive/.test(n.name));
  if (arch) arch.x = sec.x + sec.width + 160;
  const secs = p01.children.filter(n => n.type === 'SECTION');
  const ov = [];
  for (let i = 0; i < secs.length; i++) for (let j = i + 1; j < secs.length; j++) { const a = secs[i], b = secs[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov.push(a.name + ' x ' + b.name); }
  report.info.section = R(sec.x) + ',' + R(sec.y) + ' ' + sz(sec) + ' · Archive x ' + (arch ? R(arch.x) : '-');
  report.info.sectionOverlaps = ov.length ? ov : 'none';
  report.info.rootOrphans = p01.children.filter(n => n.type !== 'SECTION' && n.type !== 'FRAME').map(n => n.name);
});

// ---------- 4. kontrol
await step('Kontrol', async () => {
  let unbound = 0, unstyled = 0, gray = 0, overflow = [];
  for (const set of [bannerSet, dialogSet]) {
    if (!set) continue;
    for (const n of set.findAll(() => true)) {
      if (n.type === 'INSTANCE') continue;
      let inInst = false; let p = n.parent; while (p && p !== set) { if (p.type === 'INSTANCE') { inInst = true; break; } p = p.parent; } if (inInst) continue;
      try { for (const f of (n.fills || [])) if (f.type === 'SOLID') { if (!(f.boundVariables && f.boundVariables.color)) unbound++; else if (Math.abs(f.color.r - .5) < .01 && Math.abs(f.color.g - .5) < .01 && Math.abs(f.color.b - .5) < .01) gray++; } } catch (e) {}
      if (n.type === 'TEXT' && !n.textStyleId) unstyled++;
    }
    for (const v of set.children) for (const ch of v.findAll(n => n.type !== 'VECTOR')) {
      const a = ch.absoluteBoundingBox, b = v.absoluteBoundingBox; if (!a || !b) continue;
      if (a.x + a.width > b.x + b.width + 0.5 || a.y + a.height > b.y + b.height + 0.5) overflow.push(v.parent.name + '/' + v.name + ' :: ' + ch.name);
    }
  }
  report.info.check = { unboundFills: unbound, grayFills: gray, unstyledText: unstyled, overflow: overflow.length ? overflow.slice(0, 10) : 'none' };
});
await figma.setCurrentPageAsync(figma.root.children.find(p => /^02/.test(p.name)));
return report;
