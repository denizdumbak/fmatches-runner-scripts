// step 276 · Create event / Edit event form: 4 pages per platform (Create empty, Create errors, Create date picker open, Edit event filled), Web + Mobile; plus repack of 01 sections (Map/Messenger overlap)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name));
const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const PAD = (n, t, rr, b, l) => { n.setBoundVariable('paddingTop', V(t)); n.setBoundVariable('paddingRight', V(rr)); n.setBoundVariable('paddingBottom', V(b)); n.setBoundVariable('paddingLeft', V(l)); };
const GAP = (n, v) => n.setBoundVariable('itemSpacing', V(v));
const RAD = (n, v) => { for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) n.setBoundVariable(k, V(v)); };
const fillV = (n, v) => { n.fills = [P(V(v))]; };
const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;
for (const s of Object.values(TS)) { try { await figma.loadFontAsync(s.fontName); } catch (e) {} }
async function txt(name, chars, style, color) {
  const t = figma.createText(); t.name = name;
  await t.setTextStyleIdAsync(TS[style].id); t.characters = chars; t.fills = [P(V(color))];
  return t;
}
function frame(name, mode) { const f = figma.createFrame(); f.name = name; f.fills = []; f.clipsContent = false; if (mode) { f.layoutMode = mode; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; f.itemSpacing = 0; } return f; }
function vfixed(name, w) { const f = frame(name, 'VERTICAL'); f.resize(w, 10); f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'FIXED'; return f; }
async function setT(root, pred, str) {
  const t = root.findOne(n => n.type === 'TEXT' && pred(n)); if (!t) throw new Error('text not found for "' + str + '" in ' + root.name);
  await figma.loadFontAsync(t.fontName); t.characters = str; return t;
}
const findSet = re => p01.findAll(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name) && !(n.parent && n.parent.type === 'COMPONENT_SET'))[0];
const variant = (set, re) => { if (!set) throw new Error('set missing for ' + re); const v = set.type === 'COMPONENT_SET' ? set.children.find(x => re.test(x.name)) : set; if (!v) throw new Error('variant missing: ' + re); return v; };
const S = { button: findSet(/^Button$/), field: findSet(/^Form field$/), checkbox: findSet(/^Checkbox$/), option: findSet(/^Event type option$/), poster: findSet(/^Poster upload$/), picker: findSet(/^Date picker$/) };
for (const k of Object.keys(S)) if (!S[k]) throw new Error('component missing: ' + k);

const webSec = p02.findOne(n => n.type === 'SECTION' && n.name === 'Web'), mobSec = p02.findOne(n => n.type === 'SECTION' && n.name === 'Mobile');
const home = p02.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · Mobile');
const homeD = p02.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · Desktop');
const mMgr = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Manager · Mobile');
const dMgr = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Manager · Desktop');
const dBody = dMgr.children.find(c => c.name === 'Profile body');
const byName = (fr, nm) => { const c = fr.children.find(x => x.name === nm); if (!c) throw new Error(nm + ' not found in ' + fr.name); return c; };

const FILLED = {
  name: 'Berlin Autumn Cup', start: '14.11.2026', end: '22.11.2026', country: 'Germany', city: 'Berlin',
  participants: 'U15 boys, 14 – 15 Nov\nU17 boys, 16 – 17 Nov\nU19 boys, 19 – 20 Nov\nWomen seniors, 21 – 22 Nov',
  description: 'Four age groups, one weekend each, played on the pitches of the Spree riverside. Scouts are welcome on all match days.',
  link: 'https://berlinautumncup.example'
};
const EMPTY = { name: 'Name of the event', start: 'DD.MM.YYYY', end: 'DD.MM.YYYY', country: 'Select country', city: 'Search city', participants: 'Age groups and dates, one per line', description: 'What should scouts and clubs know?', link: 'https://' };
const TYPES = ['Match', 'Tournament', 'Seminar', 'Workshop', 'Camp', 'Other'];

async function build(dev, kind, name) {
  const desk = dev === 'Desktop', edit = kind === 'edit', err = kind === 'errors', pick = kind === 'picker';
  const D = edit ? FILLED : EMPTY, st = edit ? 'Filled' : 'Default';
  const innerW = desk ? 736 : 326, cell = desk ? 360 : null;
  const pg = frame(name, 'VERTICAL'); pg.resize(desk ? 1440 : 390, 100); pg.primaryAxisSizingMode = 'AUTO'; pg.counterAxisSizingMode = 'FIXED'; pg.fills = dMgr.fills;
  const srcPg = desk ? dMgr : mMgr;
  pg.appendChild(byName(srcPg, 'Ticker').clone());
  const nv = byName(srcPg, 'Navigation').clone(); pg.appendChild(nv);
  const a = nv.findOne(n => n.type === 'TEXT' && n.name === 'Football database'), b = nv.findOne(n => n.type === 'TEXT' && n.name === 'Events calendar');
  if (a && b) { const sa = a.textStyleId, sb = b.textStyleId, fa = a.fills, fb = b.fills; await a.setTextStyleIdAsync(sb); a.fills = fb; await b.setTextStyleIdAsync(sa); b.fills = fa; }

  const body = frame('Event form body', 'VERTICAL'); body.resize(pg.width, 100); body.primaryAxisSizingMode = 'AUTO'; body.counterAxisSizingMode = 'FIXED'; body.fills = dBody.fills;
  if (desk) PAD(body, 'layout/section-padding-y', 'layout/page-gutter', 'spacing/3xl', 'layout/page-gutter'); else PAD(body, 'spacing/lg', 'spacing/md', 'spacing/2xl', 'spacing/md');
  body.counterAxisAlignItems = 'CENTER';
  pg.appendChild(body); body.layoutSizingHorizontal = 'FILL';
  const col = vfixed('Column', desk ? 800 : 358); GAP(col, 'spacing/lg'); body.appendChild(col); if (!desk) col.layoutSizingHorizontal = 'FILL';
  const head = frame('Heading', 'VERTICAL'); GAP(head, 'spacing/xs'); col.appendChild(head); head.layoutSizingHorizontal = 'FILL';
  head.appendChild(await txt('Title', edit ? 'Edit event' : 'Create event', desk ? 'Heading/H1 Desktop' : 'Heading/H1 Mobile', 'color/text/primary'));
  const sub = await txt('Subtitle', edit ? 'Changes are visible to everyone as soon as you save.' : 'Add a match, tournament, seminar, workshop, camp or other event. It appears in the football database and on the interactive map.', 'Body/Default', 'color/text/secondary');
  head.appendChild(sub); sub.layoutSizingHorizontal = 'FILL'; sub.textAutoResize = 'HEIGHT';
  const card = frame('Card', 'VERTICAL'); card.resize(col.width, 100); card.primaryAxisSizingMode = 'AUTO'; card.counterAxisSizingMode = 'FIXED';
  fillV(card, 'color/bg/surface'); RAD(card, 'radius/lg'); const cp = desk ? 'spacing/xl' : 'spacing/md'; PAD(card, cp, cp, cp, cp); GAP(card, 'spacing/xl');
  col.appendChild(card); card.layoutSizingHorizontal = 'FILL';
  const named = {};

  function group(title) { const g = frame('Group · ' + title, 'VERTICAL'); GAP(g, 'spacing/md'); card.appendChild(g); g.layoutSizingHorizontal = 'FILL'; return g; }
  async function groupTitle(g, t) { g.appendChild(await txt('Group title', t, 'Heading/H4', 'color/text/primary')); }
  function row(g) {
    const f = frame('Fields', desk ? 'HORIZONTAL' : 'VERTICAL');
    if (desk) { f.layoutWrap = 'WRAP'; f.resize(innerW, 10); f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'AUTO'; f.counterAxisSpacing = 16; }
    GAP(f, 'spacing/md'); g.appendChild(f); f.layoutSizingHorizontal = 'FILL'; return f;
  }
  function put(parent, inst, w) {
    parent.appendChild(inst);
    if (w && desk) { inst.resize(w, inst.height); inst.primaryAxisSizingMode = 'AUTO'; } else { inst.layoutSizingHorizontal = 'FILL'; }
  }
  async function field(parent, key, type, state, label, value, errText, w) {
    const f = variant(S.field, new RegExp('Type=' + type + ', State=' + state + '$')).createInstance(); f.name = 'Field · ' + label.replace(' *', '');
    await setT(f, n => n.name === 'Label', label); await setT(f, n => n.name === 'Value', value);
    if (state === 'Error' && errText) await setT(f, n => n.name === 'Error message', errText);
    put(parent, f, w); named[key] = f; return f;
  }
  async function check(parent, label, on, key) {
    const c = variant(S.checkbox, new RegExp('Checked=' + (on ? 'On' : 'Off') + ', State=Default')).createInstance(); c.name = 'Checkbox · ' + label;
    const lt = await setT(c, n => n.name === 'Label', label); parent.appendChild(c); try { c.layoutSizingHorizontal = 'FILL'; lt.layoutSizingHorizontal = 'FILL'; lt.textAutoResize = 'HEIGHT'; } catch (e) { report.info.checkboxFill = 'could not fill: ' + e.message; } named[key] = c; return c;
  }
  async function errLine(parent, t) { const e = await txt('Error message', t, 'Label/Small', 'color/text/danger'); parent.appendChild(e); return e; }

  // Basics
  const g1 = group('Basics'); await groupTitle(g1, 'Basics');
  g1.appendChild(await txt('Poster label', 'Poster', 'Label/Default Strong', 'color/text/primary'));
  const po = variant(S.poster, new RegExp('State=' + (edit ? 'Filled' : 'Empty'))).createInstance(); po.name = 'Poster upload'; g1.appendChild(po);
  po.resize(innerW, po.height); po.primaryAxisSizingMode = 'AUTO'; named.poster = po;
  await field(g1, 'name', 'Text', err ? 'Error' : st, 'Event name *', D.name, 'Enter a name for the event.');
  named.name.layoutSizingHorizontal = 'FILL';
  const tl = frame('Event type', 'VERTICAL'); GAP(tl, 'spacing/xs'); g1.appendChild(tl); tl.layoutSizingHorizontal = 'FILL';
  tl.appendChild(await txt('Label', 'Event type *', 'Label/Default Strong', 'color/text/primary'));
  const ow = frame('Options', 'HORIZONTAL'); ow.layoutWrap = 'WRAP'; ow.resize(innerW, 10); ow.primaryAxisSizingMode = 'FIXED'; ow.counterAxisSizingMode = 'AUTO'; ow.counterAxisSpacing = 8; GAP(ow, 'spacing/xs');
  tl.appendChild(ow); ow.layoutSizingHorizontal = 'FILL';
  const cols = desk ? 3 : 2, optW = Math.floor((innerW - 8 * (cols - 1)) / cols);
  for (const t of TYPES) {
    const o = variant(S.option, new RegExp('Type=' + t + ', State=' + ((edit && t === 'Tournament') ? 'Selected' : 'Default'))).createInstance(); o.name = 'Option · ' + t;
    ow.appendChild(o); o.resize(optW, o.height); o.primaryAxisSizingMode = 'AUTO';
  }
  if (err) await errLine(tl, 'Choose an event type.');

  // When and where
  const g2 = group('When and where'); await groupTitle(g2, 'When and where');
  const r1 = row(g2);
  await field(r1, 'start', 'Date', err ? 'Error' : pick ? 'Focus' : st, 'Start date *', D.start, 'Enter a start date.', cell);
  await field(r1, 'end', 'Date', st, 'End date', D.end, null, cell);
  await check(g2, 'One day only', false, 'oneday');
  const r2 = row(g2);
  await field(r2, 'country', 'Select', err ? 'Error' : st, 'Country *', D.country, 'Choose a country.', cell);
  await field(r2, 'city', 'Select', st, 'City', D.city, null, cell);

  // Details
  const g3 = group('Details'); await groupTitle(g3, 'Details');
  for (const [k, lbl, val] of [['participants', 'Participants', D.participants], ['description', 'Description', D.description]]) {
    const f = variant(S.field, new RegExp('Type=Textarea, State=' + st + '$')).createInstance(); f.name = 'Field · ' + lbl;
    await setT(f, n => n.name === 'Label', lbl); await setT(f, n => n.name === 'Value', val); put(g3, f); named[k] = f;
  }
  await field(g3, 'link', 'Text', st, 'Link', D.link, null);
  const cg = frame('Consent', 'VERTICAL'); GAP(cg, 'spacing/xs'); g3.appendChild(cg); cg.layoutSizingHorizontal = 'FILL';
  await check(cg, 'I consent to processing my personal data *', edit, 'consent');
  if (err) await errLine(cg, 'Please confirm to continue.');

  const acts = frame('Actions', 'HORIZONTAL'); GAP(acts, 'spacing/sm'); acts.primaryAxisAlignItems = 'MAX'; card.appendChild(acts); acts.layoutSizingHorizontal = 'FILL';
  const cancel = variant(S.button, /Style=Secondary, State=Default/).createInstance(); cancel.name = 'Button · Cancel'; try { cancel.setProperties({ 'Label#8:0': 'Cancel' }); } catch (e) {} await setT(cancel, n => n.name === 'Label', 'Cancel');
  const lab = edit ? 'Save changes' : 'Create event';
  const prim = variant(S.button, /Style=Primary, State=Default/).createInstance(); prim.name = 'Button · ' + lab; try { prim.setProperties({ 'Label#8:0': lab }); } catch (e) {} await setT(prim, n => n.name === 'Label', lab);
  acts.appendChild(cancel); acts.appendChild(prim);

  pg.appendChild(byName(desk ? homeD : home, 'Footer').clone());
  return { pg, named };
}

const kinds = [['create', ''], ['errors', ' / Errors'], ['picker', ' / Date picker'], ['edit', '']];
const built = { Web: [], Mobile: [] };
for (const dev of ['Desktop', 'Mobile']) {
  const plat = dev === 'Desktop' ? 'Web' : 'Mobile'; const platSec = plat === 'Web' ? webSec : mobSec;
  const ev = platSec.findOne(n => n.type === 'SECTION' && n.name === 'Events'); if (!ev) throw new Error('Events section missing in ' + plat);
  for (const k of kinds) {
    const nm = k[0] === 'edit' ? 'Events / Edit event · ' + dev : 'Events / Create event' + k[1] + ' · ' + dev;
    await step('build ' + nm, async () => {
      for (const o of ev.children.filter(c => c.name === nm)) o.remove();
      const r = await build(dev, k[0], nm); ev.appendChild(r.pg); built[plat].push({ pg: r.pg, kind: k[0], named: r.named });
    });
  }
}

await step('date picker popup', async () => {
  for (const plat of ['Web', 'Mobile']) {
    const it = built[plat].find(x => x.kind === 'picker'); if (!it) continue;
    const dp = (S.picker.type === 'COMPONENT' ? S.picker : S.picker.children[0]).createInstance(); dp.name = 'Date picker'; it.pg.appendChild(dp); dp.layoutPositioning = 'ABSOLUTE';
    const f = it.named.start, fb = f.absoluteBoundingBox, pb = it.pg.absoluteBoundingBox;
    dp.x = plat === 'Web' ? Math.round(fb.x - pb.x) : Math.round((pb.width - dp.width) / 2); dp.y = Math.round(fb.y - pb.y + fb.height + 8);
    report.info['picker' + plat] = dp.width + 'x' + dp.height + ' @' + dp.x + ',' + dp.y + ' field @' + Math.round(fb.x - pb.x) + ',' + Math.round(fb.y - pb.y) + ' ' + Math.round(fb.width) + 'x' + Math.round(fb.height);
  }
});

await step('place pages and size sections', async () => {
  for (const plat of ['Web', 'Mobile']) {
    const platSec = plat === 'Web' ? webSec : mobSec; const ev = platSec.findOne(n => n.type === 'SECTION' && n.name === 'Events');
    const others = ev.children.filter(c => c.type === 'FRAME' && !built[plat].some(b => b.pg === c));
    const rowY = Math.max.apply(null, others.map(f => f.y + f.height)) + 160;
    const stepX = plat === 'Web' ? 1920 : 470;
    built[plat].forEach((b, i) => { b.pg.x = 80 + i * stepX; b.pg.y = rowY; });
    const maxH = Math.max.apply(null, built[plat].map(b => b.pg.height));
    ev.resizeWithoutConstraints(ev.width, Math.ceil(rowY + maxH + (plat === 'Web' ? 100 : 80)));
    const need = Math.ceil(ev.y + ev.height + 120); if (need > platSec.height) platSec.resizeWithoutConstraints(platSec.width, need);
    report.info['events' + plat] = Math.round(ev.width) + 'x' + Math.round(ev.height) + ', ' + plat + ' ' + Math.round(platSec.width) + 'x' + Math.round(platSec.height) + '; pages ' + built[plat].map(b => b.pg.name.replace('Events / ', '') + ' ' + Math.round(b.pg.width) + 'x' + Math.round(b.pg.height)).join(' | ');
  }
});

await step('repack 01 sections', async () => {
  await figma.setCurrentPageAsync(p01);
  const secs = p01.children.filter(n => n.type === 'SECTION').sort((a, b) => a.x - b.x);
  report.info.sections01Before = secs.map(s => s.name + '@' + Math.round(s.x) + '+' + Math.round(s.width)).join(' | ');
  for (let i = 1; i < secs.length; i++) { const need = secs[i - 1].x + secs[i - 1].width + 160; if (secs[i].x < need) secs[i].x = need; }
  const after = p01.children.filter(n => n.type === 'SECTION').sort((a, b) => a.x - b.x);
  report.info.sections01After = after.map(s => s.name + '@' + Math.round(s.x)).join(' | ');
  const ov = []; for (let i = 0; i < after.length - 1; i++) if (after[i].x + after[i].width > after[i + 1].x) ov.push(after[i].name + ' x ' + after[i + 1].name);
  report.info.sections01Overlaps = ov.length ? ov : 'none';
  await figma.setCurrentPageAsync(p02);
});

await step('checks', async () => {
  let gray = 0, unstyled = 0;
  const walk = n => {
    if ('fills' in n && n.fills !== figma.mixed) for (const f of n.fills) if (f.type === 'SOLID' && Math.abs(f.color.r - .5) < .01 && Math.abs(f.color.g - .5) < .01 && Math.abs(f.color.b - .5) < .01 && !(f.boundVariables && f.boundVariables.color)) gray++;
    if (n.type === 'TEXT' && !n.textStyleId) unstyled++;
    if ('children' in n) n.children.forEach(walk);
  };
  const all = built.Web.concat(built.Mobile); all.forEach(b => walk(b.pg));
  report.info.grayFills = gray; report.info.unstyledText = unstyled;
  const hiddenAnc = (n, root) => { let x = n; while (x && x !== root) { if (x.visible === false) return true; x = x.parent; } return false; };
  const over = [];
  for (const b of all) { const pb = b.pg.absoluteBoundingBox; b.pg.findAll(n => n.absoluteBoundingBox && n.absoluteBoundingBox.width > 0).forEach(n => { if (hiddenAnc(n, b.pg)) return; const r = n.absoluteBoundingBox; if (r.x + r.width > pb.x + pb.width + 1 || r.x < pb.x - 1) over.push(b.pg.name.replace('Events / ', '') + ' > ' + n.name + ' ' + Math.round(r.x - pb.x) + '+' + Math.round(r.width)); }); }
  report.info.horizontalOverflow = over.length ? over.slice(0, 12) : 'none';
  report.info.widths = all.map(b => b.pg.name.replace('Events / ', '') + ': poster ' + Math.round(b.named.poster.width) + ' name ' + Math.round(b.named.name.width) + ' start ' + Math.round(b.named.start.width) + ' participants ' + Math.round(b.named.participants.width) + ' consent ' + b.named.consent.name.slice(0, 20));
  const ov = [];
  for (const sec of [webSec, mobSec]) { const ev = sec.findOne(n => n.type === 'SECTION' && n.name === 'Events'); const fr = ev.children.filter(c => c.type === 'FRAME'); for (let i = 0; i < fr.length; i++) for (let j = i + 1; j < fr.length; j++) { const a = fr[i], b2 = fr[j]; if (a.x < b2.x + b2.width && b2.x < a.x + a.width && a.y < b2.y + b2.height && b2.y < a.y + a.height) ov.push(sec.name + ': ' + a.name + ' x ' + b2.name); } }
  report.info.pageOverlaps = ov.length ? ov : 'none';
  report.info.mobileGap = Math.round(mobSec.x - (webSec.x + webSec.width));
});

await figma.setCurrentPageAsync(p02);
return report;
