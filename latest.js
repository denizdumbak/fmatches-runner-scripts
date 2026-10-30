// step 271 · Event card, Web: new 02 › Web › Events section with 4 pages (Visitor, Manager book, Own event, Finished)
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

const web = p02.findOne(n => n.type === 'SECTION' && n.name === 'Web');
const home = p02.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · Desktop');
const mgr = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Manager · Desktop');
const mgrHero = mgr.children.find(c => /^Hero/.test(c.name));
const mgrBody = mgr.children.find(c => c.name === 'Profile body');
const byName = (fr, nm) => fr.children.find(c => c.name === nm);
const IMG = (dir, f) => 'https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/img/' + dir + '/' + f;
const poster = await figma.createImageAsync(IMG('gallery', 'gallery-e.jpg'));

const pages = [
  { name: 'Events / Event card · Desktop', who: 'visitor', status: 'Upcoming', statusText: 'Starts in 15 days', dates: '14 – 22 Nov 2026', org: ['Daniel Brandt', 'Head scout · Spreeufer FC'], button: 'Log in to book' },
  { name: 'Events / Event card / Manager · Desktop', who: 'manager', status: 'Upcoming', statusText: 'Starts in 15 days', dates: '14 – 22 Nov 2026', org: ['Daniel Brandt', 'Head scout · Spreeufer FC'], button: 'Book tournament' },
  { name: 'Events / Event card / Own event · Desktop', who: 'manager', status: 'Upcoming', statusText: 'Starts in 15 days', dates: '14 – 22 Nov 2026', org: ['Mark Sullivan', 'Manager · Northgate Athletic'], button: 'Edit event' },
  { name: 'Events / Event card / Finished · Desktop', who: 'manager', status: 'Finished', statusText: 'Finished', dates: '3 – 11 Oct 2026', org: ['Daniel Brandt', 'Head scout · Spreeufer FC'], button: null }
];

async function card(parent, heading) {
  const c = vfixed('Card', 100); c.resize(840, 100); c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED';
  fillV(c, 'color/bg/surface'); RAD(c, 'radius/lg'); PAD(c, 'spacing/xl', 'spacing/xl', 'spacing/xl', 'spacing/xl'); GAP(c, 'spacing/lg');
  if (FX) await c.setEffectStyleIdAsync(FX.id);
  parent.appendChild(c); c.layoutSizingHorizontal = 'FILL';
  c.name = heading;
  c.appendChild(await txt('Section heading', heading, 'Heading/H3', 'color/text/primary'));
  return c;
}

async function build(o) {
  const pg = frame(o.name, 'VERTICAL'); pg.resize(1440, 100); pg.primaryAxisSizingMode = 'AUTO'; pg.counterAxisSizingMode = 'FIXED'; pg.fills = mgr.fills;
  const src = o.who === 'visitor' ? home : mgr;
  const tk = byName(src, 'Ticker').clone(), nv = byName(src, 'Navigation').clone();
  pg.appendChild(tk); pg.appendChild(nv);
  // active nav item: Events calendar
  const a = nv.findOne(n => n.type === 'TEXT' && n.name === 'Football database'), b = nv.findOne(n => n.type === 'TEXT' && n.name === 'Events calendar');
  if (a && b) { const sa = a.textStyleId, sb = b.textStyleId, fa = a.fills, fb = b.fills; await a.setTextStyleIdAsync(sb); a.fills = fb; await b.setTextStyleIdAsync(sa); b.fills = fa; }

  // header band
  const hd = frame('Event header', 'VERTICAL'); hd.resize(1440, 100); hd.primaryAxisSizingMode = 'AUTO'; hd.counterAxisSizingMode = 'FIXED'; hd.fills = mgrHero.fills;
  PAD(hd, 'spacing/xl', 'layout/page-gutter', 'spacing/2xl', 'layout/page-gutter'); GAP(hd, 'spacing/lg');
  pg.appendChild(hd); hd.layoutSizingHorizontal = 'FILL';
  hd.appendChild(await txt('Breadcrumb', 'Events  /  Tournaments  /  Berlin Autumn Cup', 'Label/Small', 'color/text/primary'));
  const trow = frame('Type and status', 'HORIZONTAL'); GAP(trow, 'spacing/sm'); trow.counterAxisAlignItems = 'CENTER'; hd.appendChild(trow);
  const tag = variant(sets.tag, /Brand subtle/).createInstance(); tag.name = 'Type tag'; await setT(tag, n => n.name === 'Label', 'Tournament'); trow.appendChild(tag);
  const st = variant(sets.status, new RegExp('Status=' + o.status)).createInstance(); st.name = 'Event status'; await setT(st, n => n.name === 'Label', o.statusText); trow.appendChild(st);
  hd.appendChild(await txt('Event name', 'Berlin Autumn Cup', 'Heading/H1 Desktop', 'color/text/primary'));
  const kf = frame('Key facts', 'HORIZONTAL'); hd.appendChild(kf);
  const facts = [['Dates', o.dates], ['Location', 'Berlin, Germany']];
  for (let i = 0; i < facts.length; i++) {
    const k = variant(sets.keyFact, /Desktop/).createInstance(); k.name = 'Fact · ' + facts[i][0];
    await setT(k, n => n.name === 'Label', facts[i][0]); await setT(k, n => n.name === 'Value' && n.parent && n.parent.name === 'Value row', facts[i][1]);
    kf.appendChild(k);
    if (i === 0) { try { k.setBoundVariable('paddingLeft', null); k.paddingLeft = 0; } catch (e) { report.info.factPadding = 'could not zero left padding: ' + e.message; } }
  }

  // body
  const body = frame('Event body', 'VERTICAL'); body.resize(1440, 100); body.primaryAxisSizingMode = 'AUTO'; body.counterAxisSizingMode = 'FIXED'; body.fills = mgrBody.fills;
  PAD(body, 'layout/section-padding-y', 'layout/page-gutter', 'layout/page-gutter', 'layout/page-gutter');
  pg.appendChild(body); body.layoutSizingHorizontal = 'FILL';
  const cols = frame('Event columns', 'HORIZONTAL'); cols.resize(1280, 100); cols.primaryAxisSizingMode = 'FIXED'; cols.counterAxisSizingMode = 'AUTO'; cols.counterAxisAlignItems = 'MIN'; GAP(cols, 'spacing/lg');
  body.appendChild(cols);
  const left = vfixed('Left column', 840); GAP(left, 'spacing/lg'); cols.appendChild(left);
  const right = vfixed('Right column', 416); GAP(right, 'spacing/lg'); cols.appendChild(right);

  const pr = figma.createRectangle(); pr.name = 'Poster'; pr.resize(840, 420); RAD(pr, 'radius/lg'); pr.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: poster.hash }];
  left.appendChild(pr); pr.layoutSizingHorizontal = 'FILL';
  const part = await card(left, 'Participants');
  const rows = [['U15 boys', '14 – 15 Nov'], ['U17 boys', '16 – 17 Nov'], ['U19 boys', '19 – 20 Nov'], ['Women seniors', '21 – 22 Nov']];
  const list = frame('Participant list', 'VERTICAL'); part.appendChild(list); list.layoutSizingHorizontal = 'FILL';
  for (let i = 0; i < rows.length; i++) {
    const r = frame('Participant row', 'HORIZONTAL'); r.counterAxisAlignItems = 'CENTER'; r.primaryAxisAlignItems = 'SPACE_BETWEEN'; r.setBoundVariable('paddingTop', V('spacing/sm')); r.setBoundVariable('paddingBottom', V('spacing/sm')); r.paddingLeft = 0; r.paddingRight = 0;
    list.appendChild(r); r.layoutSizingHorizontal = 'FILL';
    r.appendChild(await txt('Group', rows[i][0], 'Label/Default Strong', 'color/text/primary'));
    r.appendChild(await txt('Dates', rows[i][1], 'Label/Default', 'color/text/secondary'));
    if (i < rows.length - 1) { r.strokes = [P(V('color/border/default'))]; r.strokeAlign = 'INSIDE'; r.strokeTopWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.strokeBottomWeight = 1; }
  }
  const desc = await card(left, 'Description');
  const dt = await txt('Description text', 'Four age groups, one weekend each, played on the pitches of the Spree riverside. Teams from Berlin and the surrounding clubs take part, with a separate women seniors competition on the final weekend. Scouts are welcome on all match days.', 'Body/Default', 'color/text/primary');
  desc.appendChild(dt); dt.layoutSizingHorizontal = 'FILL'; dt.textAutoResize = 'HEIGHT';
  const lk = await card(left, 'Link');
  const lr = variant(sets.linkRow, /Type=Website, State=Default/).createInstance(); lk.appendChild(lr); lr.layoutSizingHorizontal = 'FILL';
  await setT(lr, n => n.name === 'Type', 'Website'); await setT(lr, n => n.name === 'Domain', 'berlinautumncup.example');

  if (o.button) {
    const bt = variant(sets.button, /Style=Primary, State=Default/).createInstance(); bt.name = 'Button · ' + o.button;
    try { bt.setProperties({ 'Label#8:0': o.button }); } catch (e) {}
    await setT(bt, n => n.name === 'Label', o.button); right.appendChild(bt); bt.layoutSizingHorizontal = 'FILL';
  }
  const org = variant(sets.organizer, /State=Default/).createInstance(); org.name = 'Organizer row';
  await setT(org, n => n.name === 'Name', o.org[0]); await setT(org, n => n.name === 'Role', o.org[1]);
  right.appendChild(org); org.layoutSizingHorizontal = 'FILL';
  const loc = sets.location.type === 'COMPONENT' ? sets.location.createInstance() : sets.location.children[0].createInstance(); loc.name = 'Event location card';
  right.appendChild(loc); loc.layoutSizingHorizontal = 'FILL';

  pg.appendChild(byName(home, 'Footer').clone());
  return pg;
}

let sec = web.findOne(n => n.type === 'SECTION' && n.name === 'Events');
const msg = web.children.find(n => n.type === 'SECTION' && n.name === 'Messenger');
if (!msg) throw new Error('Messenger section not found in Web');
if (sec) { for (const c of sec.children.slice()) c.remove(); }
else { sec = figma.createSection(); sec.name = 'Events'; web.appendChild(sec); sec.x = msg.x; sec.y = msg.y + msg.height + 160; sec.resizeWithoutConstraints(7360, 2400); }
const built = [];
for (let i = 0; i < pages.length; i++) {
  await step('build ' + pages[i].name, async () => { const pg = await build(pages[i]); sec.appendChild(pg); pg.x = 80 + i * 1920; pg.y = 100; built.push(pg); });
}

await step('section size and Web height', async () => {
  const maxH = Math.max.apply(null, built.map(p => p.height));
  sec.resizeWithoutConstraints(80 + 1920 * (built.length - 1) + 1440 + 80, Math.ceil(100 + maxH + 100));
  const need = Math.ceil(sec.y + sec.height + 120);
  if (need > web.height) web.resizeWithoutConstraints(web.width, need);
  report.info.events = Math.round(sec.x) + ',' + Math.round(sec.y) + ' ' + Math.round(sec.width) + 'x' + Math.round(sec.height);
  report.info.web = Math.round(web.width) + 'x' + Math.round(web.height);
  report.info.pages = built.map(p => p.name + ' ' + Math.round(p.width) + 'x' + Math.round(p.height)).join(' | ');
});

await step('checks', async () => {
  let gray = 0, unstyled = 0, hidden = 0;
  const walk = n => {
    if ('fills' in n && n.fills !== figma.mixed) for (const f of n.fills) if (f.type === 'SOLID' && Math.abs(f.color.r - .5) < .01 && Math.abs(f.color.g - .5) < .01 && Math.abs(f.color.b - .5) < .01 && !(f.boundVariables && f.boundVariables.color)) gray++;
    if (n.type === 'TEXT' && !n.textStyleId) unstyled++;
    if ('children' in n) n.children.forEach(walk);
  };
  sec.children.forEach(walk);
  report.info.grayFills = gray; report.info.unstyledText = unstyled;
  const sibs = web.children.filter(n => n.type === 'SECTION'); const ov = [];
  for (let i = 0; i < sibs.length; i++) for (let j = i + 1; j < sibs.length; j++) { const a = sibs[i], b = sibs[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov.push(a.name + ' x ' + b.name); }
  report.info.webSectionOverlaps = ov.length ? ov : 'none';
  report.info.outsideWeb = Math.round(sec.x + sec.width) <= Math.round(web.width) && Math.round(sec.y + sec.height) <= Math.round(web.height);
  const mobile = p02.findOne(n => n.type === 'SECTION' && n.name === 'Mobile');
  report.info.mobileGap = Math.round(mobile.x - (web.x + web.width));
  report.info.perPage = built.map(p => {
    const nv = p.children.find(c => c.name === 'Navigation'); const act = nv && nv.findOne(n => n.type === 'TEXT' && n.name === 'Events calendar');
    const kfs = p.findAll(n => /^Fact · /.test(n.name)).map(n => n.name + '=' + (n.findOne(t => t.type === 'TEXT' && t.name === 'Value' && t.parent.name === 'Value row') || {}).characters).join(',');
    const bt = p.findOne(n => /^Button · /.test(n.name));
    return p.name + ': eventsCalendar style=' + (act ? (act.textStyleId ? 'set' : 'none') : 'n/a') + ' facts=' + kfs + ' button=' + (bt ? bt.name : 'none') + ' ticker=' + JSON.stringify(((p.children[0] || {}).componentProperties || {}).Role || '');
  });
});

await figma.setCurrentPageAsync(p02);
return report;
