// step 272 · Event card, Mobile: 02 › Mobile › Events with 4 screens (same states as Web), sticky action bar; location card map scales with width
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
const FX = (await figma.getLocalEffectStylesAsync()).find(s => s.name === 'Shadow/Card');
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
const sets = { button: findSet(/^Button$/), tag: findSet(/^Tag$/), keyFact: findSet(/^Key fact$/), linkRow: findSet(/^Link row$/), status: findSet(/^Event status$/), organizer: findSet(/^Organizer row$/), location: findSet(/^Event location card$/) };
for (const k of Object.keys(sets)) if (!sets[k]) throw new Error('component missing: ' + k);

// 1. location card: map image stretches, marker stays centred when the card is narrower
await step('location card constraints', async () => {
  const c = sets.location;
  const map = c.findOne(n => n.name === 'Map'), img = c.findOne(n => n.name === 'Map image'), mk = c.findOne(n => n.name === 'Map marker');
  if (!map || !img || !mk) throw new Error('map parts missing: ' + [!!map, !!img, !!mk].join(','));
  img.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
  mk.constraints = { horizontal: 'CENTER', vertical: 'CENTER' };
  report.info.locationConstraints = 'img ' + JSON.stringify(img.constraints) + ' marker ' + JSON.stringify(mk.constraints);
});

const mobile = p02.findOne(n => n.type === 'SECTION' && n.name === 'Mobile');
const home = p02.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · Mobile');
const mgr = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Manager · Mobile');
const dMgr = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Manager · Desktop');
const dHero = dMgr.children.find(c => /^Hero/.test(c.name)), dBody = dMgr.children.find(c => c.name === 'Profile body');
const byName = (fr, nm) => { const c = fr.children.find(x => x.name === nm); if (!c) throw new Error(nm + ' not found in ' + fr.name + ' (children: ' + fr.children.map(x => x.name).join(', ') + ')'); return c; };
const IMG = (dir, f) => 'https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/img/' + dir + '/' + f;
const poster = await figma.createImageAsync(IMG('gallery', 'gallery-e.jpg'));

const pages = [
  { name: 'Events / Event card · Mobile', who: 'visitor', status: 'Upcoming', statusText: 'Starts in 15 days', dates: '14 – 22 Nov 2026', org: ['Daniel Brandt', 'Head scout · Spreeufer FC'], button: 'Log in to book' },
  { name: 'Events / Event card / Manager · Mobile', who: 'manager', status: 'Upcoming', statusText: 'Starts in 15 days', dates: '14 – 22 Nov 2026', org: ['Daniel Brandt', 'Head scout · Spreeufer FC'], button: 'Book tournament' },
  { name: 'Events / Event card / Own event · Mobile', who: 'manager', status: 'Upcoming', statusText: 'Starts in 15 days', dates: '14 – 22 Nov 2026', org: ['Mark Sullivan', 'Manager · Northgate Athletic'], button: 'Edit event' },
  { name: 'Events / Event card / Finished · Mobile', who: 'manager', status: 'Finished', statusText: 'Finished', dates: '3 – 11 Oct 2026', org: ['Daniel Brandt', 'Head scout · Spreeufer FC'], button: null }
];

async function card(parent, heading) {
  const c = vfixed(heading, 358);
  fillV(c, 'color/bg/surface'); RAD(c, 'radius/lg'); PAD(c, 'spacing/lg', 'spacing/lg', 'spacing/lg', 'spacing/lg'); GAP(c, 'spacing/md');
  if (FX) await c.setEffectStyleIdAsync(FX.id);
  parent.appendChild(c); c.layoutSizingHorizontal = 'FILL';
  c.appendChild(await txt('Section heading', heading, 'Heading/H4', 'color/text/primary'));
  return c;
}
function primaryButton(label) {
  const bt = variant(sets.button, /Style=Primary, State=Default/).createInstance(); bt.name = 'Button · ' + label;
  try { bt.setProperties({ 'Label#8:0': label }); } catch (e) {}
  return bt;
}

async function build(o) {
  const pg = frame(o.name, 'VERTICAL'); pg.resize(390, 100); pg.primaryAxisSizingMode = 'AUTO'; pg.counterAxisSizingMode = 'FIXED'; pg.fills = dMgr.fills;
  const src = o.who === 'visitor' ? home : mgr;
  pg.appendChild(byName(src, 'Ticker').clone()); pg.appendChild(byName(src, 'Navigation').clone());

  const hd = frame('Event header', 'VERTICAL'); hd.resize(390, 100); hd.primaryAxisSizingMode = 'AUTO'; hd.counterAxisSizingMode = 'FIXED'; hd.fills = dHero.fills;
  PAD(hd, 'spacing/lg', 'spacing/md', 'spacing/xl', 'spacing/md'); GAP(hd, 'spacing/md');
  pg.appendChild(hd); hd.layoutSizingHorizontal = 'FILL';
  hd.appendChild(await txt('Breadcrumb', 'Events  /  Tournaments  /  Berlin Autumn Cup', 'Label/Small', 'color/text/primary'));
  const trow = frame('Type and status', 'HORIZONTAL'); GAP(trow, 'spacing/sm'); trow.counterAxisAlignItems = 'CENTER'; hd.appendChild(trow);
  const tag = variant(sets.tag, /Brand subtle/).createInstance(); tag.name = 'Type tag'; await setT(tag, n => n.name === 'Label', 'Tournament'); trow.appendChild(tag);
  const st = variant(sets.status, new RegExp('Status=' + o.status)).createInstance(); st.name = 'Event status'; await setT(st, n => n.name === 'Label', o.statusText); trow.appendChild(st);
  const nm = await txt('Event name', 'Berlin Autumn Cup', 'Heading/H1 Mobile', 'color/text/primary'); hd.appendChild(nm); nm.layoutSizingHorizontal = 'FILL'; nm.textAutoResize = 'HEIGHT';
  const kf = frame('Key facts', 'HORIZONTAL'); kf.layoutWrap = 'WRAP'; kf.resize(358, 10); kf.primaryAxisSizingMode = 'FIXED'; kf.counterAxisSizingMode = 'AUTO'; kf.counterAxisSpacing = 16;
  hd.appendChild(kf); kf.layoutSizingHorizontal = 'FILL';
  const facts = [['Dates', o.dates], ['Location', 'Berlin, Germany']];
  for (let i = 0; i < facts.length; i++) {
    const k = variant(sets.keyFact, /Mobile/).createInstance(); k.name = 'Fact · ' + facts[i][0];
    await setT(k, n => n.name === 'Label', facts[i][0]); await setT(k, n => n.name === 'Value' && n.parent && n.parent.name === 'Value row', facts[i][1]);
    kf.appendChild(k);
    if (i === 0) { try { k.setBoundVariable('paddingLeft', null); k.paddingLeft = 0; } catch (e) { report.info.factPadding = 'could not zero left padding: ' + e.message; } }
  }

  const body = frame('Event body', 'VERTICAL'); body.resize(390, 100); body.primaryAxisSizingMode = 'AUTO'; body.counterAxisSizingMode = 'FIXED'; body.fills = dBody.fills;
  PAD(body, 'spacing/lg', 'spacing/md', 'spacing/2xl', 'spacing/md'); GAP(body, 'spacing/md');
  pg.appendChild(body); body.layoutSizingHorizontal = 'FILL';
  const pr = figma.createRectangle(); pr.name = 'Poster'; pr.resize(358, 240); RAD(pr, 'radius/lg'); pr.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: poster.hash }];
  body.appendChild(pr); pr.layoutSizingHorizontal = 'FILL';
  const org = variant(sets.organizer, /State=Default/).createInstance(); org.name = 'Organizer row';
  await setT(org, n => n.name === 'Name', o.org[0]); await setT(org, n => n.name === 'Role', o.org[1]);
  body.appendChild(org); org.layoutSizingHorizontal = 'FILL';
  const loc = (sets.location.type === 'COMPONENT' ? sets.location : sets.location.children[0]).createInstance(); loc.name = 'Event location card';
  body.appendChild(loc); loc.layoutSizingHorizontal = 'FILL';
  const part = await card(body, 'Participants');
  const rows = [['U15 boys', '14 – 15 Nov'], ['U17 boys', '16 – 17 Nov'], ['U19 boys', '19 – 20 Nov'], ['Women seniors', '21 – 22 Nov']];
  const list = frame('Participant list', 'VERTICAL'); part.appendChild(list); list.layoutSizingHorizontal = 'FILL';
  for (let i = 0; i < rows.length; i++) {
    const r = frame('Participant row', 'HORIZONTAL'); r.counterAxisAlignItems = 'CENTER'; r.primaryAxisAlignItems = 'SPACE_BETWEEN';
    r.setBoundVariable('paddingTop', V('spacing/sm')); r.setBoundVariable('paddingBottom', V('spacing/sm')); r.paddingLeft = 0; r.paddingRight = 0;
    list.appendChild(r); r.layoutSizingHorizontal = 'FILL';
    r.appendChild(await txt('Group', rows[i][0], 'Label/Default Strong', 'color/text/primary'));
    r.appendChild(await txt('Dates', rows[i][1], 'Label/Default', 'color/text/secondary'));
    if (i < rows.length - 1) { r.strokes = [P(V('color/border/default'))]; r.strokeAlign = 'INSIDE'; r.strokeTopWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.strokeBottomWeight = 1; }
  }
  const desc = await card(body, 'Description');
  const dt = await txt('Description text', 'Four age groups, one weekend each, played on the pitches of the Spree riverside. Teams from Berlin and the surrounding clubs take part, with a separate women seniors competition on the final weekend. Scouts are welcome on all match days.', 'Body/Default', 'color/text/primary');
  desc.appendChild(dt); dt.layoutSizingHorizontal = 'FILL'; dt.textAutoResize = 'HEIGHT';
  const lk = await card(body, 'Link');
  const lr = variant(sets.linkRow, /Type=Website, State=Default/).createInstance(); lk.appendChild(lr); lr.layoutSizingHorizontal = 'FILL';
  await setT(lr, n => n.name === 'Type', 'Website'); await setT(lr, n => n.name === 'Domain', 'berlinautumncup.example');

  pg.appendChild(byName(home, 'Footer').clone());
  if (o.button) {
    const bar = frame('Sticky action bar', 'HORIZONTAL'); bar.resize(390, 81); bar.primaryAxisSizingMode = 'FIXED'; bar.counterAxisSizingMode = 'FIXED'; bar.counterAxisAlignItems = 'CENTER';
    fillV(bar, 'color/bg/surface'); PAD(bar, 'spacing/md', 'spacing/md', 'spacing/md', 'spacing/md');
    bar.strokes = [P(V('color/border/default'))]; bar.strokeAlign = 'INSIDE'; bar.strokeTopWeight = 1; bar.strokeLeftWeight = 0; bar.strokeRightWeight = 0; bar.strokeBottomWeight = 0;
    const bt = primaryButton(o.button); await setT(bt, n => n.name === 'Label', o.button);
    bar.appendChild(bt); bt.layoutSizingHorizontal = 'FILL';
    pg.appendChild(bar); bar.layoutPositioning = 'ABSOLUTE'; bar.x = 0; bar.y = pg.height - 81;
  }
  return pg;
}

let sec = mobile.findOne(n => n.type === 'SECTION' && n.name === 'Events');
const msg = mobile.children.find(n => n.type === 'SECTION' && n.name === 'Messenger');
if (!msg) throw new Error('Messenger section not found in Mobile');
if (sec) { for (const c of sec.children.slice()) c.remove(); }
else { sec = figma.createSection(); sec.name = 'Events'; mobile.appendChild(sec); sec.x = msg.x; sec.y = msg.y + msg.height + 160; sec.resizeWithoutConstraints(1960, 2800); }
const built = [];
for (let i = 0; i < pages.length; i++) {
  await step('build ' + pages[i].name, async () => { const pg = await build(pages[i]); sec.appendChild(pg); pg.x = 80 + i * 470; pg.y = 80; built.push(pg); });
}

await step('section size and Mobile height', async () => {
  const maxH = Math.max.apply(null, built.map(p => p.height));
  sec.resizeWithoutConstraints(80 + 470 * (built.length - 1) + 390 + 80, Math.ceil(80 + maxH + 80));
  const need = Math.ceil(sec.y + sec.height + 120);
  if (need > mobile.height) mobile.resizeWithoutConstraints(mobile.width, need);
  report.info.events = Math.round(sec.x) + ',' + Math.round(sec.y) + ' ' + Math.round(sec.width) + 'x' + Math.round(sec.height);
  report.info.mobile = Math.round(mobile.width) + 'x' + Math.round(mobile.height);
  report.info.pages = built.map(p => p.name + ' ' + Math.round(p.width) + 'x' + Math.round(p.height)).join(' | ');
});

await step('checks', async () => {
  let gray = 0, unstyled = 0;
  const walk = n => {
    if ('fills' in n && n.fills !== figma.mixed) for (const f of n.fills) if (f.type === 'SOLID' && Math.abs(f.color.r - .5) < .01 && Math.abs(f.color.g - .5) < .01 && Math.abs(f.color.b - .5) < .01 && !(f.boundVariables && f.boundVariables.color)) gray++;
    if (n.type === 'TEXT' && !n.textStyleId) unstyled++;
    if ('children' in n) n.children.forEach(walk);
  };
  sec.children.forEach(walk);
  report.info.grayFills = gray; report.info.unstyledText = unstyled;
  const sibs = mobile.children.filter(n => n.type === 'SECTION'); const ov = [];
  for (let i = 0; i < sibs.length; i++) for (let j = i + 1; j < sibs.length; j++) { const a = sibs[i], b = sibs[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov.push(a.name + ' x ' + b.name); }
  report.info.mobileSectionOverlaps = ov.length ? ov : 'none';
  const web = p02.findOne(n => n.type === 'SECTION' && n.name === 'Web');
  report.info.mobileGap = Math.round(mobile.x - (web.x + web.width));
  const over = [];
  for (const p of built) { const pb = p.absoluteBoundingBox; p.findAll(n => n.visible !== false && n.absoluteBoundingBox && n.absoluteBoundingBox.width > 0).forEach(n => { const b = n.absoluteBoundingBox; if (b.x + b.width > pb.x + pb.width + 1 || b.x < pb.x - 1) over.push(p.name.replace('Events / Event card', 'EC') + ' > ' + n.name + ' ' + Math.round(b.x - pb.x) + '+' + Math.round(b.width)); }); }
  report.info.horizontalOverflow = over.length ? over.slice(0, 10) : 'none';
  report.info.perPage = built.map(p => {
    const bar = p.children.find(c => c.name === 'Sticky action bar'); const bt = bar && bar.findOne(n => /^Button · /.test(n.name));
    const kfs = p.findAll(n => /^Fact · /.test(n.name)).map(n => (n.findOne(t => t.type === 'TEXT' && t.name === 'Value' && t.parent.name === 'Value row') || {}).characters).join(',');
    const loc = p.findOne(n => n.name === 'Event location card'); const mk = loc && loc.findOne(n => n.name === 'Map marker'); const mp = loc && loc.findOne(n => n.name === 'Map');
    const mc = mk && mp ? Math.round(mk.absoluteBoundingBox.x + mk.absoluteBoundingBox.width / 2 - mp.absoluteBoundingBox.x) + '/' + Math.round(mp.absoluteBoundingBox.width / 2) : 'n/a';
    return p.name + ': facts=' + kfs + ' bar=' + (bar ? bt ? bt.name + ' y' + Math.round(bar.y) + ' of ' + Math.round(p.height) : 'no button' : 'none') + ' markerCentre/mapHalf=' + mc + ' ticker=' + (((p.children[0] || {}).componentProperties || {}).Role || {}).value;
  });
});

await figma.setCurrentPageAsync(p02);
return report;
