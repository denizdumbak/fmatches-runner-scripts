// step 274 · Book dialog: component set in 01 › 9 · Events (Kind Request / Sent x Device), and 4 dialog pages (Web + Mobile) on top of the Manager Event card
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name));
const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
await figma.setCurrentPageAsync(p01);
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const PAD = (n, t, rr, b, l) => { n.setBoundVariable('paddingTop', V(t)); n.setBoundVariable('paddingRight', V(rr)); n.setBoundVariable('paddingBottom', V(b)); n.setBoundVariable('paddingLeft', V(l)); };
const GAP = (n, v) => n.setBoundVariable('itemSpacing', V(v));
const RAD = (n, v) => { for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) n.setBoundVariable(k, V(v)); };
const fillV = (n, v) => { n.fills = [P(V(v))]; };
const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;
for (const s of Object.values(TS)) { try { await figma.loadFontAsync(s.fontName); } catch (e) {} }
const FXR = (await figma.getLocalEffectStylesAsync()).find(s => s.name === 'Shadow/Raised');
async function txt(name, chars, style, color) {
  const t = figma.createText(); t.name = name;
  await t.setTextStyleIdAsync(TS[style].id); t.characters = chars; t.fills = [P(V(color))];
  return t;
}
function frame(name, mode) { const f = figma.createFrame(); f.name = name; f.fills = []; f.clipsContent = false; if (mode) { f.layoutMode = mode; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; f.itemSpacing = 0; } return f; }
function mkIcon(svg, colorVar, size) {
  const ic = figma.createNodeFromSvg(svg); ic.name = 'Icon'; ic.fills = []; ic.resize(size, size); ic.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
  const walk = x => { if ('children' in x) x.children.forEach(walk); if (x.type !== 'FRAME' && x.type !== 'GROUP') { if (x.strokes && x.strokes.length) x.strokes = [P(V(colorVar))]; x.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; } };
  walk(ic); return ic;
}
const CHECK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
async function setT(root, pred, str) {
  const t = root.findOne(n => n.type === 'TEXT' && pred(n)); if (!t) throw new Error('text not found for "' + str + '" in ' + root.name);
  await figma.loadFontAsync(t.fontName); t.characters = str; return t;
}
const findSet = re => p01.findAll(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name) && !(n.parent && n.parent.type === 'COMPONENT_SET'))[0];
const variant = (set, re) => { if (!set) throw new Error('set missing for ' + re); const v = set.type === 'COMPONENT_SET' ? set.children.find(x => re.test(x.name)) : set; if (!v) throw new Error('variant missing: ' + re); return v; };
const btnSet = findSet(/^Button$/), ffSet = findSet(/^Form field$/);
if (!btnSet || !ffSet) throw new Error('Button or Form field missing');
const sec9 = p01.children.find(n => n.type === 'SECTION' && /^9 /.test(n.name));
const archive = p01.children.find(n => n.type === 'SECTION' && /^Archive/.test(n.name));
if (!sec9 || !archive) throw new Error('section 9 or Archive missing');

function btn(style, label) {
  const b = variant(btnSet, new RegExp('Style=' + style + ', State=Default')).createInstance(); b.name = 'Button · ' + label;
  try { b.setProperties({ 'Label#8:0': label }); } catch (e) {}
  return b;
}
const EVENT = 'Berlin Autumn Cup', WHEN = '14 – 22 Nov 2026 · Berlin, Germany', ORG = 'Daniel Brandt';

// ---------- Book dialog component set ----------
await step('Book dialog set', async () => {
  for (const n of sec9.children.slice()) if (n.name === 'Book dialog' || n.name === 'Description · Book dialog') n.remove();
  const comps = [];
  for (const kind of ['Request', 'Sent']) for (const dev of ['Desktop', 'Mobile']) {
    const mob = dev === 'Mobile';
    const c = figma.createComponent(); c.name = 'Kind=' + kind + ', Device=' + dev; sec9.appendChild(c);
    c.layoutMode = 'VERTICAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED'; c.resize(mob ? 358 : 464, 100); c.primaryAxisSizingMode = 'AUTO';
    const padv = mob ? 'spacing/lg' : 'spacing/xl'; PAD(c, padv, padv, padv, padv); GAP(c, 'spacing/lg'); RAD(c, 'radius/lg'); fillV(c, 'color/bg/surface');
    if (FXR) await c.setEffectStyleIdAsync(FXR.id);
    if (kind === 'Sent') {
      const circ = frame('Icon circle', 'HORIZONTAL'); circ.resize(48, 48); circ.layoutMode = 'HORIZONTAL'; circ.primaryAxisSizingMode = 'FIXED'; circ.counterAxisSizingMode = 'FIXED'; circ.primaryAxisAlignItems = 'CENTER'; circ.counterAxisAlignItems = 'CENTER'; fillV(circ, 'color/bg/brand-subtle'); RAD(circ, 'radius/full');
      circ.appendChild(mkIcon(CHECK, 'color/icon/brand', 24)); c.appendChild(circ);
    }
    const copy = frame('Copy', 'VERTICAL'); GAP(copy, 'spacing/xs'); c.appendChild(copy); copy.layoutSizingHorizontal = 'FILL';
    copy.appendChild(await txt('Title', kind === 'Request' ? 'Book tournament' : 'Request sent', 'Heading/H3', 'color/text/primary'));
    const body = await txt('Body', kind === 'Request' ? 'Send a request to take part in ' + EVENT + '. ' + ORG + ' will accept or decline it.' : ORG + ' will see your request. You can follow its status under My events.', 'Body/Default', 'color/text/secondary');
    copy.appendChild(body); body.layoutSizingHorizontal = 'FILL'; body.textAutoResize = 'HEIGHT';
    if (kind === 'Request') {
      const sum = frame('Event summary', 'VERTICAL'); GAP(sum, 'spacing/2xs'); fillV(sum, 'color/bg/subtle'); RAD(sum, 'radius/md'); PAD(sum, 'spacing/sm', 'spacing/md', 'spacing/sm', 'spacing/md');
      c.appendChild(sum); sum.layoutSizingHorizontal = 'FILL';
      sum.appendChild(await txt('Event name', EVENT, 'Label/Default Strong', 'color/text/primary'));
      sum.appendChild(await txt('Event meta', WHEN, 'Label/Small', 'color/text/secondary'));
      const ta = variant(ffSet, /Type=Textarea, State=Default/).createInstance(); ta.name = 'Form field · Comment';
      await setT(ta, n => n.name === 'Label', 'Comment (optional)');
      await setT(ta, n => n.name === 'Value', 'Add a note for the organiser, for example the age group you are entering.');
      c.appendChild(ta); ta.layoutSizingHorizontal = 'FILL';
    }
    const acts = frame('Actions', mob ? 'VERTICAL' : 'HORIZONTAL'); GAP(acts, 'spacing/sm'); c.appendChild(acts); acts.layoutSizingHorizontal = 'FILL';
    if (!mob) acts.primaryAxisAlignItems = 'MAX';
    const prim = btn('Primary', kind === 'Request' ? 'Send request' : 'Done'); await setT(prim, n => n.name === 'Label', kind === 'Request' ? 'Send request' : 'Done');
    const cancel = kind === 'Request' ? btn('Secondary', 'Cancel') : null; if (cancel) await setT(cancel, n => n.name === 'Label', 'Cancel');
    if (mob) { acts.appendChild(prim); prim.layoutSizingHorizontal = 'FILL'; if (cancel) { acts.appendChild(cancel); cancel.layoutSizingHorizontal = 'FILL'; } }
    else { if (cancel) acts.appendChild(cancel); acts.appendChild(prim); }
    comps.push(c);
  }
  const colW = [], rowH = [];
  comps.forEach((c, i) => { const ci = i % 2, ri = Math.floor(i / 2); colW[ci] = Math.max(colW[ci] || 0, Math.ceil(c.width)); rowH[ri] = Math.max(rowH[ri] || 0, Math.ceil(c.height)); });
  comps.forEach((c, i) => { const ci = i % 2, ri = Math.floor(i / 2); c.x = 32 + (ci ? colW[0] + 40 : 0); c.y = 32 + (ri ? rowH[0] + 40 : 0); });
  const set = figma.combineAsVariants(comps, sec9); set.name = 'Book dialog';
  set.resizeWithoutConstraints(colW[0] + colW[1] + 40 + 64, rowH[0] + rowH[1] + 40 + 64);
  let bottom = 0; for (const k of sec9.children) if (k !== set) bottom = Math.max(bottom, k.y + k.height);
  const d = await txt('Description · Book dialog', 'Booking dialog on the event card. Request asks for an optional comment, Sent confirms. Desktop is centred over a dim page, mobile fills the width.', 'Body/Small', 'color/text/secondary');
  sec9.appendChild(d); d.x = 80; d.y = bottom + 120; set.x = 80; set.y = d.y + Math.ceil(d.height) + 16;
  let right = -Infinity, bot = -Infinity; for (const k of sec9.children) { right = Math.max(right, k.x + k.width); bot = Math.max(bot, k.y + k.height); }
  sec9.resizeWithoutConstraints(Math.ceil(Math.max(sec9.width, right + 80)), Math.ceil(bot + 80));
  archive.x = Math.max(archive.x, sec9.x + sec9.width + 160);
  report.info.bookDialog = set.children.map(v => v.name + ' ' + Math.round(v.width) + 'x' + Math.round(v.height)).join(' | ');
  report.info.section9 = Math.round(sec9.width) + 'x' + Math.round(sec9.height) + ' archive.x ' + Math.round(archive.x);
  const ta = set.children[0].findOne(n => n.name === 'Form field · Comment'); const fld = ta && ta.findOne(n => n.name === 'Field');
  report.info.desktopField = ta ? Math.round(ta.width) + ' field ' + (fld ? Math.round(fld.width) : '?') : 'none';
  const tam = set.children[2].findOne(n => n.name === 'Form field · Comment'); const fm = tam && tam.findOne(n => n.name === 'Field');
  report.info.mobileField = tam ? Math.round(tam.width) + ' field ' + (fm ? Math.round(fm.width) : '?') : 'none';
});

// ---------- dialog pages ----------
await figma.setCurrentPageAsync(p02);
const bookSet = findSet(/^Book dialog$/);
const webSec = p02.findOne(n => n.type === 'SECTION' && n.name === 'Web'), mobSec = p02.findOne(n => n.type === 'SECTION' && n.name === 'Mobile');
const specs = [
  { plat: 'Web', src: 'Events / Event card / Manager · Desktop', w: 1440, h: 900, kind: 'Request', dev: 'Desktop', name: 'Events / Event card / Book tournament · Desktop', slot: 0 },
  { plat: 'Web', src: 'Events / Event card / Manager · Desktop', w: 1440, h: 900, kind: 'Sent', dev: 'Desktop', name: 'Events / Event card / Request sent · Desktop', slot: 1 },
  { plat: 'Mobile', src: 'Events / Event card / Manager · Mobile', w: 390, h: 844, kind: 'Request', dev: 'Mobile', name: 'Events / Event card / Book tournament · Mobile', slot: 0 },
  { plat: 'Mobile', src: 'Events / Event card / Manager · Mobile', w: 390, h: 844, kind: 'Sent', dev: 'Mobile', name: 'Events / Event card / Request sent · Mobile', slot: 1 }
];
const made = [];
for (const s of specs) {
  await step('page ' + s.name, async () => {
    const platSec = s.plat === 'Web' ? webSec : mobSec;
    const ev = platSec.findOne(n => n.type === 'SECTION' && n.name === 'Events');
    if (!ev) throw new Error('Events section missing in ' + s.plat);
    for (const o of ev.children.filter(c => c.name === s.name)) o.remove();
    const src = ev.children.find(c => c.type === 'FRAME' && c.name === s.src); if (!src) throw new Error('source page missing: ' + s.src);
    const pg = figma.createFrame(); pg.name = s.name; pg.fills = src.fills; pg.clipsContent = true; pg.resize(s.w, s.h);
    ev.appendChild(pg);
    const base = src.clone(); base.name = 'Event card'; pg.appendChild(base); base.x = 0; base.y = 0;
    if (s.plat === 'Mobile') { const bar = base.findOne(n => n.name === 'Sticky action bar'); if (bar) bar.y = s.h - 81; }
    const scrim = figma.createRectangle(); scrim.name = 'Scrim'; scrim.resize(s.w, s.h); fillV(scrim, 'color/bg/inverse'); scrim.opacity = 0.4; pg.appendChild(scrim); scrim.x = 0; scrim.y = 0;
    const dlg = variant(bookSet, new RegExp('Kind=' + s.kind + ', Device=' + s.dev)).createInstance(); dlg.name = 'Book dialog · ' + s.kind; pg.appendChild(dlg);
    dlg.x = Math.round((s.w - dlg.width) / 2); dlg.y = Math.round((s.h - dlg.height) / 2);
    made.push({ s, pg, dlg, ev, platSec });
  });
}
await step('place dialog pages and size sections', async () => {
  for (const plat of ['Web', 'Mobile']) {
    const items = made.filter(m => m.s.plat === plat); if (!items.length) continue;
    const ev = items[0].ev, platSec = items[0].platSec;
    const base = ev.children.filter(c => c.type === 'FRAME' && /Event card/.test(c.name) && !/Book tournament|Request sent/.test(c.name));
    const rowY = Math.max.apply(null, base.map(f => f.y + f.height)) + 160;
    const step_ = plat === 'Web' ? 1920 : 470;
    items.forEach(m => { m.pg.x = 80 + m.s.slot * step_; m.pg.y = rowY; });
    ev.resizeWithoutConstraints(ev.width, Math.ceil(rowY + items[0].s.h + (plat === 'Web' ? 100 : 80)));
    const need = Math.ceil(ev.y + ev.height + 120); if (need > platSec.height) platSec.resizeWithoutConstraints(platSec.width, need);
    report.info['events' + plat] = Math.round(ev.width) + 'x' + Math.round(ev.height) + ', ' + plat + ' ' + Math.round(platSec.width) + 'x' + Math.round(platSec.height);
  }
});

await step('checks', async () => {
  let gray = 0, unstyled = 0;
  const walk = n => {
    if ('fills' in n && n.fills !== figma.mixed) for (const f of n.fills) if (f.type === 'SOLID' && Math.abs(f.color.r - .5) < .01 && Math.abs(f.color.g - .5) < .01 && Math.abs(f.color.b - .5) < .01 && !(f.boundVariables && f.boundVariables.color)) gray++;
    if (n.type === 'TEXT' && !n.textStyleId) unstyled++;
    if ('children' in n) n.children.forEach(walk);
  };
  made.forEach(m => walk(m.pg)); report.info.grayFills = gray; report.info.unstyledText = unstyled;
  report.info.dialogs = made.map(m => m.pg.name + ': dialog ' + Math.round(m.dlg.width) + 'x' + Math.round(m.dlg.height) + ' @' + Math.round(m.dlg.x) + ',' + Math.round(m.dlg.y) + ' page ' + Math.round(m.pg.width) + 'x' + Math.round(m.pg.height) + ' @' + Math.round(m.pg.x) + ',' + Math.round(m.pg.y));
  const ov = [];
  for (const sec of [webSec, mobSec]) { const ev = sec.findOne(n => n.type === 'SECTION' && n.name === 'Events'); const fr = ev.children.filter(c => c.type === 'FRAME'); for (let i = 0; i < fr.length; i++) for (let j = i + 1; j < fr.length; j++) { const a = fr[i], b = fr[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov.push(sec.name + ': ' + a.name + ' x ' + b.name); } }
  report.info.pageOverlaps = ov.length ? ov : 'none';
  for (const sec of [webSec, mobSec]) { const sibs = sec.children.filter(n => n.type === 'SECTION'); for (let i = 0; i < sibs.length; i++) for (let j = i + 1; j < sibs.length; j++) { const a = sibs[i], b = sibs[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov.push('SECTION ' + sec.name + ': ' + a.name + ' x ' + b.name); } }
  report.info.sectionOverlaps = ov.filter(x => /^SECTION/.test(x)).length ? ov.filter(x => /^SECTION/.test(x)) : 'none';
  const web = webSec; report.info.mobileGap = Math.round(mobSec.x - (web.x + web.width));
  const secs01 = p01.children.filter(n => n.type === 'SECTION').sort((a, b) => a.x - b.x); const so = [];
  for (let i = 0; i < secs01.length - 1; i++) if (secs01[i].x + secs01[i].width > secs01[i + 1].x) so.push(secs01[i].name + ' x ' + secs01[i + 1].name);
  report.info.sections01Overlaps = so.length ? so : 'none';
});

await figma.setCurrentPageAsync(p02);
return report;
