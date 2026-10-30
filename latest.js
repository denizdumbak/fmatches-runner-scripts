// step 277 · My events: 4 pages per platform (Organising, Applied, Organising empty, Applied empty), Web + Mobile
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
const variant = (set, re) => { if (!set) throw new Error('set missing for ' + re); const v = set.type === 'COMPONENT_SET' ? set.children.find(x => re.test(x.name)) : set; if (!v) throw new Error('variant missing: ' + re + ' in ' + (set.children || []).map(c => c.name).join(', ')); return v; };
const S = { button: findSet(/^Button$/), row: findSet(/^Event row$/), chip: findSet(/^Filter chip$/), appStatus: findSet(/^Application status$/), evStatus: findSet(/^Event status$/), empty: findSet(/^Empty card$/) };
for (const k of Object.keys(S)) if (!S[k]) throw new Error('component missing: ' + k);

const webSec = p02.findOne(n => n.type === 'SECTION' && n.name === 'Web'), mobSec = p02.findOne(n => n.type === 'SECTION' && n.name === 'Mobile');
const home = p02.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · Mobile');
const homeD = p02.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · Desktop');
const mMgr = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Manager · Mobile');
const dMgr = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Manager · Desktop');
const dBody = dMgr.children.find(c => c.name === 'Profile body');
const byName = (fr, nm) => { const c = fr.children.find(x => x.name === nm); if (!c) throw new Error(nm + ' not found in ' + fr.name); return c; };

const ORG = [
  { m: 'NOV', d: '14', name: 'Berlin Autumn Cup', type: 'Tournament', loc: 'Berlin, Germany', dates: '14 – 22 Nov', ev: ['Upcoming', 'Starts in 15 days'] },
  { m: 'DEC', d: '06', name: 'Nordpark Friendly', type: 'Match', loc: 'Berlin, Germany', dates: '6 Dec', ev: ['Upcoming', 'Starts in 37 days'] },
  { m: 'JAN', d: '10', name: 'Scouting Basics Seminar', type: 'Seminar', loc: 'Berlin, Germany', dates: '10 Jan', ev: ['Upcoming', 'Starts in 72 days'] },
  { m: 'AUG', d: '04', name: 'Spreeufer Summer Camp', type: 'Camp', loc: 'Berlin, Germany', dates: '4 – 8 Aug', ev: ['Finished', 'Finished'] }
];
const APP = [
  { m: 'NOV', d: '28', name: 'Harbour City Cup', type: 'Tournament', loc: 'Harbour City, England', dates: '28 – 29 Nov', st: 'Accepted' },
  { m: 'DEC', d: '02', name: 'Riverside Spring Match', type: 'Match', loc: 'Riverside, England', dates: '2 Dec', st: 'Pending' },
  { m: 'NOV', d: '09', name: 'Coastal United Friendly', type: 'Match', loc: 'Coastal City, England', dates: '9 Nov', st: 'Declined' },
  { m: 'DEC', d: '05', name: 'Havelblick Youth Cup', type: 'Tournament', loc: 'Potsdam, Germany', dates: '5 – 7 Dec', st: 'Accepted' }
];
const bad = [];

async function listRow(dev, r, chipInst, innerW) {
  const desk = dev === 'Desktop';
  const row = variant(S.row, new RegExp('Device=' + dev + ', State=Default')).createInstance(); row.name = 'Event row · ' + r.name;
  const sets = [['Month', r.m], ['Day', r.d], ['Event name', r.name], ['Location', r.loc], ['Dates', r.dates]];
  for (const [k, v] of sets) await setT(row, n => n.name === k, v);
  const tt = row.findOne(n => n.name === 'Type tag'); await setT(tt, n => n.name === 'Label', r.type);
  row.resize(innerW, row.height); row.counterAxisSizingMode = 'AUTO';
  const wrap = figma.createFrame(); wrap.name = 'Row · ' + r.name; wrap.fills = []; wrap.clipsContent = false; wrap.resize(innerW, row.height);
  wrap.appendChild(row); row.x = 0; row.y = 0; wrap.appendChild(chipInst);
  const rb = row.absoluteBoundingBox;
  if (desk) {
    const right = row.findOne(n => n.name === 'Right'); const rr = right.absoluteBoundingBox;
    chipInst.x = Math.round(rr.x - rb.x - 24 - chipInst.width); chipInst.y = Math.round((row.height - chipInst.height) / 2);
  } else {
    chipInst.x = Math.round(innerW - chipInst.width); chipInst.y = 70;
  }
  const dt = row.findOne(n => n.name === 'Dates').absoluteBoundingBox, cb = chipInst.absoluteBoundingBox;
  if (cb.x < dt.x + dt.width + 4 && cb.x + cb.width > dt.x && cb.y < dt.y + dt.height && cb.y + cb.height > dt.y) bad.push(dev + ' chip overlaps dates in ' + r.name);
  const nm = row.findOne(n => n.name === 'Event name').absoluteBoundingBox;
  if (cb.x < nm.x + nm.width && cb.x + cb.width > nm.x && cb.y < nm.y + nm.height && cb.y + cb.height > nm.y) bad.push(dev + ' chip overlaps name in ' + r.name);
  return wrap;
}

async function build(dev, kind, name) {
  const desk = dev === 'Desktop', applied = /applied/.test(kind), empty = /empty/.test(kind);
  const pg = frame(name, 'VERTICAL'); pg.resize(desk ? 1440 : 390, 100); pg.primaryAxisSizingMode = 'AUTO'; pg.counterAxisSizingMode = 'FIXED'; pg.fills = dMgr.fills;
  const srcPg = desk ? dMgr : mMgr;
  pg.appendChild(byName(srcPg, 'Ticker').clone());
  const nv = byName(srcPg, 'Navigation').clone(); pg.appendChild(nv);
  const a = nv.findOne(n => n.type === 'TEXT' && n.name === 'Football database'), b = nv.findOne(n => n.type === 'TEXT' && n.name === 'Events calendar');
  if (a && b) { const sa = a.textStyleId, sb = b.textStyleId, fa = a.fills, fb = b.fills; await a.setTextStyleIdAsync(sb); a.fills = fb; await b.setTextStyleIdAsync(sa); b.fills = fa; }

  const body = frame('My events body', 'VERTICAL'); body.resize(pg.width, 100); body.primaryAxisSizingMode = 'AUTO'; body.counterAxisSizingMode = 'FIXED'; body.fills = dBody.fills;
  if (desk) PAD(body, 'layout/section-padding-y', 'layout/page-gutter', 'spacing/3xl', 'layout/page-gutter'); else PAD(body, 'spacing/lg', 'spacing/md', 'spacing/2xl', 'spacing/md');
  pg.appendChild(body); body.layoutSizingHorizontal = 'FILL';
  const col = vfixed('Column', desk ? 1280 : 358); GAP(col, 'spacing/lg'); body.appendChild(col); if (!desk) col.layoutSizingHorizontal = 'FILL';

  const head = frame('Heading row', desk ? 'HORIZONTAL' : 'VERTICAL'); col.appendChild(head); head.layoutSizingHorizontal = 'FILL';
  if (desk) { head.primaryAxisAlignItems = 'SPACE_BETWEEN'; head.counterAxisAlignItems = 'CENTER'; } else GAP(head, 'spacing/md');
  head.appendChild(await txt('Title', 'My events', desk ? 'Heading/H1 Desktop' : 'Heading/H1 Mobile', 'color/text/primary'));
  const cb = variant(S.button, /Style=Primary, State=Default/).createInstance(); cb.name = 'Button · Create event'; try { cb.setProperties({ 'Label#8:0': 'Create event' }); } catch (e) {} await setT(cb, n => n.name === 'Label', 'Create event');
  head.appendChild(cb); if (!desk) cb.layoutSizingHorizontal = 'FILL';

  const tabs = frame('Tabs', 'HORIZONTAL'); GAP(tabs, 'spacing/xs'); col.appendChild(tabs);
  for (const [lbl, sel] of [['Organising', !applied], ['Applied', applied]]) {
    const ch = variant(S.chip, new RegExp('State=' + (sel ? 'Selected' : 'Default'))).createInstance(); ch.name = 'Tab · ' + lbl;
    const t0 = ch.findOne(n => n.type === 'TEXT'); if (!t0) throw new Error('no text in Filter chip'); await figma.loadFontAsync(t0.fontName); t0.characters = lbl + ' ' + (lbl === 'Organising' ? (empty && !applied ? '0' : '4') : (empty && applied ? '0' : '4'));
    tabs.appendChild(ch);
  }

  const card = frame('List card', 'VERTICAL'); card.resize(col.width, 100); card.primaryAxisSizingMode = 'AUTO'; card.counterAxisSizingMode = 'FIXED';
  fillV(card, 'color/bg/surface'); RAD(card, 'radius/lg'); if (FX) await card.setEffectStyleIdAsync(FX.id);
  if (desk) PAD(card, 'spacing/md', 'spacing/xl', 'spacing/md', 'spacing/xl'); else PAD(card, 'spacing/xs', 'spacing/md', 'spacing/xs', 'spacing/md');
  col.appendChild(card); card.layoutSizingHorizontal = 'FILL';
  const innerW = desk ? 1216 : 326;
  if (!empty) {
    const data = applied ? APP : ORG;
    for (const r of data) {
      let chip;
      if (applied) { chip = variant(S.appStatus, new RegExp('Status=' + r.st)).createInstance(); chip.name = 'Application status'; }
      else { chip = variant(S.evStatus, new RegExp('Status=' + r.ev[0])).createInstance(); chip.name = 'Event status'; await setT(chip, n => n.name === 'Label', r.ev[1]); }
      const w = await listRow(dev, r, chip, innerW); card.appendChild(w); w.layoutSizingHorizontal = 'FILL';
    }
  } else {
    const ec = variant(S.empty, new RegExp(desk ? '416' : '358')).createInstance(); ec.name = 'Empty card'; card.appendChild(ec); ec.layoutSizingHorizontal = 'FILL';
    const texts = ec.findAll(n => n.type === 'TEXT');
    report.info['emptyTexts' + dev] = texts.map(t => t.name + '="' + t.characters.slice(0, 30) + '"').join(' | ');
    const hasBtn = ec.findAll(n => n.type === 'INSTANCE' && /Button/.test(n.name)).length > 0;
    const title = applied ? 'No applications yet' : 'No events yet', desc = applied ? 'Events you apply to appear here with their status.' : 'Events you create appear here. Create one to reach scouts, clubs and players.';
    if (texts.length < 2) throw new Error('Empty card has fewer than 2 texts');
    await figma.loadFontAsync(texts[0].fontName); texts[0].characters = title; await figma.loadFontAsync(texts[1].fontName); texts[1].characters = desc;
    if (hasBtn) { const bt = ec.findAll(n => n.type === 'TEXT' && n.name === 'Label')[0]; if (bt) { await figma.loadFontAsync(bt.fontName); bt.characters = applied ? 'Browse events' : 'Create event'; } }
    else {
      const lab = applied ? 'Browse events' : 'Create event';
      const bt = variant(S.button, new RegExp('Style=' + (applied ? 'Secondary' : 'Primary') + ', State=Default')).createInstance(); bt.name = 'Button · ' + lab; try { bt.setProperties({ 'Label#8:0': lab }); } catch (e) {} await setT(bt, n => n.name === 'Label', lab);
      card.appendChild(bt); bt.layoutPositioning = 'AUTO';
      card.counterAxisAlignItems = 'CENTER'; GAP(card, 'spacing/md');
    }
    report.info['emptyHasButton' + dev] = hasBtn;
  }
  pg.appendChild(byName(desk ? homeD : home, 'Footer').clone());
  return pg;
}

const kinds = [['org', ''], ['applied', ' / Applied'], ['org-empty', ' / No events created'], ['applied-empty', ' / No applications']];
const built = { Web: [], Mobile: [] };
for (const dev of ['Desktop', 'Mobile']) {
  const plat = dev === 'Desktop' ? 'Web' : 'Mobile'; const platSec = plat === 'Web' ? webSec : mobSec;
  const ev = platSec.findOne(n => n.type === 'SECTION' && n.name === 'Events'); if (!ev) throw new Error('Events section missing in ' + plat);
  for (const k of kinds) {
    const nm = 'Events / My events' + k[1] + ' · ' + dev;
    await step('build ' + nm, async () => { for (const o of ev.children.filter(c => c.name === nm)) o.remove(); const pg = await build(dev, k[0], nm); ev.appendChild(pg); built[plat].push(pg); });
  }
}

await step('place pages and size sections', async () => {
  for (const plat of ['Web', 'Mobile']) {
    const platSec = plat === 'Web' ? webSec : mobSec; const ev = platSec.findOne(n => n.type === 'SECTION' && n.name === 'Events');
    const others = ev.children.filter(c => c.type === 'FRAME' && built[plat].indexOf(c) < 0);
    const rowY = Math.max.apply(null, others.map(f => f.y + f.height)) + 160; const stepX = plat === 'Web' ? 1920 : 470;
    built[plat].forEach((pg, i) => { pg.x = 80 + i * stepX; pg.y = rowY; });
    const maxH = Math.max.apply(null, built[plat].map(p => p.height));
    ev.resizeWithoutConstraints(ev.width, Math.ceil(rowY + maxH + (plat === 'Web' ? 100 : 80)));
    const need = Math.ceil(ev.y + ev.height + 120); if (need > platSec.height) platSec.resizeWithoutConstraints(platSec.width, need);
    report.info['events' + plat] = Math.round(ev.width) + 'x' + Math.round(ev.height) + ', ' + plat + ' ' + Math.round(platSec.width) + 'x' + Math.round(platSec.height) + '; pages ' + built[plat].map(p => p.name.replace('Events / ', '') + ' ' + Math.round(p.width) + 'x' + Math.round(p.height)).join(' | ');
  }
});

await step('checks', async () => {
  let gray = 0, unstyled = 0;
  const walk = n => {
    if ('fills' in n && n.fills !== figma.mixed) for (const f of n.fills) if (f.type === 'SOLID' && Math.abs(f.color.r - .5) < .01 && Math.abs(f.color.g - .5) < .01 && Math.abs(f.color.b - .5) < .01 && !(f.boundVariables && f.boundVariables.color)) gray++;
    if (n.type === 'TEXT' && !n.textStyleId) unstyled++;
    if ('children' in n) n.children.forEach(walk);
  };
  const all = built.Web.concat(built.Mobile); all.forEach(walk);
  report.info.grayFills = gray; report.info.unstyledText = unstyled; report.info.chipOverlaps = bad.length ? bad : 'none';
  const hiddenAnc = (n, root) => { let x = n; while (x && x !== root) { if (x.visible === false) return true; x = x.parent; } return false; };
  const over = [];
  for (const pg of all) { const pb = pg.absoluteBoundingBox; pg.findAll(n => n.absoluteBoundingBox && n.absoluteBoundingBox.width > 0).forEach(n => { if (hiddenAnc(n, pg)) return; const r = n.absoluteBoundingBox; if (r.x + r.width > pb.x + pb.width + 1 || r.x < pb.x - 1) over.push(pg.name.replace('Events / ', '') + ' > ' + n.name + ' ' + Math.round(r.x - pb.x) + '+' + Math.round(r.width)); }); }
  report.info.horizontalOverflow = over.length ? over.slice(0, 12) : 'none';
  const ov = [];
  for (const sec of [webSec, mobSec]) { const ev = sec.findOne(n => n.type === 'SECTION' && n.name === 'Events'); const fr = ev.children.filter(c => c.type === 'FRAME'); for (let i = 0; i < fr.length; i++) for (let j = i + 1; j < fr.length; j++) { const a = fr[i], b2 = fr[j]; if (a.x < b2.x + b2.width && b2.x < a.x + a.width && a.y < b2.y + b2.height && b2.y < a.y + a.height) ov.push(sec.name + ': ' + a.name + ' x ' + b2.name); } }
  report.info.pageOverlaps = ov.length ? ov : 'none';
  report.info.mobileGap = Math.round(mobSec.x - (webSec.x + webSec.width));
  const sample = built.Web[0].findAll(n => n.type === 'INSTANCE' && /^Event row/.test(n.name))[0]; report.info.sampleRowWidth = sample ? Math.round(sample.width) : 'n/a';
});

await figma.setCurrentPageAsync(p02);
return report;
