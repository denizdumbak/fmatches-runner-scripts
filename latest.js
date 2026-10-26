// step 213 · Map card varyantlari (Event, Match request, Stadium) + Map / Events · Desktop (v3: satir ikonu swapComponent)

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync(); await figma.setCurrentPageAsync(p02);
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const PAD = (n, t, r, b, l) => { n.setBoundVariable('paddingTop', V(t)); n.setBoundVariable('paddingRight', V(r)); n.setBoundVariable('paddingBottom', V(b)); n.setBoundVariable('paddingLeft', V(l)); };
const GAP = (n, v) => n.setBoundVariable('itemSpacing', V(v));
const RAD = (n, v) => { for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) n.setBoundVariable(k, V(v)); };
const hex = p => p && p.color ? '#' + [p.color.r, p.color.g, p.color.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('') : '-';
const effects = await figma.getLocalEffectStylesAsync(); const effect = nm => effects.find(s => s.name === nm);
const texts = await figma.getLocalTextStylesAsync();
const tstyle = (...names) => { for (const n of names) { const s = texts.find(t => t.name === n) || texts.find(t => t.name.indexOf(n) === 0); if (s) return s; } return null; };
const S_H4 = tstyle('Heading/H4'), S_LABEL = tstyle('Label/Default'), S_SMALL = tstyle('Label/Small');
for (const s of [S_H4, S_LABEL, S_SMALL]) await figma.loadFontAsync(s.fontName);
async function txt(str, style, colorVar) { const t = figma.createText(); await t.setTextStyleIdAsync(style.id); t.characters = str; t.fills = [P(V(colorVar))]; return t; }
async function setText(node, str) { const f = node.fontName === figma.mixed ? node.getRangeFontName(0, 1) : node.fontName; await figma.loadFontAsync(f); node.characters = str; }
const set01 = nm => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === nm);
const sec7 = p01.children.find(n => n.type === 'SECTION' && /^7 /.test(n.name));
const markerSet = set01('Map marker'), clusterSet = set01('Map cluster');
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web'); const mapSec = web.children.find(n => n.type === 'SECTION' && n.name === 'Map');
const created = {};
const mv = (kind, state) => markerSet.children.find(c => c.name === 'Kind=' + kind + ', State=' + state);
const setIn = async (root, nm, str) => { const t = root.findOne(n => n.type === 'TEXT' && n.name === nm); if (t) await setText(t, str); return !!t; };

// Legend yardimcisi: satir gorunurlugu + aciklama metni (Label adli metin; cluster sayisi '12' kalir)
async function setLegend(lg, showClubs, clusterLabel) {
  for (const nm of ['Row · Clubs', 'Row · Stadiums', 'Row · Events', 'Row · Teams looking for an opponent']) { const lr = lg.findOne(n => n.name === nm); if (lr) lr.visible = true; }
  const cr = lg.findOne(n => n.name === 'Row · Cluster'); if (!cr) return 'no cluster row';
  cr.visible = false;
  const lab = cr.children.find(n => n.type === 'TEXT' && n.name === 'Label'); if (lab) await setText(lab, clusterLabel);
  const ci = cr.children.find(n => n.type === 'INSTANCE'); const cnt = ci && ci.findOne(n => n.type === 'TEXT'); if (cnt && cnt.characters !== '12') await setText(cnt, '12');
  return (lab ? lab.characters : '-') + ' / ' + (cnt ? cnt.characters : '-');
}


// 1. Map card varyantlari
await step('Map card variants', async () => {
  await figma.setCurrentPageAsync(p01);
  const set = set01('Map card'); if (!set) throw new Error('Map card set missing');
  for (const v of set.children.slice()) if (v.name !== 'Kind=Club') v.remove();
  const base = set.children.find(v => v.name === 'Kind=Club');
  const strayRe = /^Kind=(Event|Match request|Stadium)$/;
  for (const n of p01.findAll(k => k.type === 'COMPONENT' && k.parent !== set && strayRe.test(k.name))) n.remove();
  const calSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>';
  const cfgs = [
    { kind: 'Event', marker: 'Event', name: 'Autumn Friendly Cup', meta: 'Tournament · 8 teams', date: 'Sat 8 Nov · 10:00', loc: 'Mitte, Berlin', btn: 'View event', sec: null },
    { kind: 'Match request', marker: 'Match request', name: 'Northgate Athletic', meta: 'Fourth Division · Tier 4', date: 'Sat 8 – Sun 9 Nov', loc: 'Northgate, England', btn: 'Offer a match', sec: null },
    { kind: 'Stadium', marker: 'Stadium', name: 'Riverside Park', meta: 'Natural grass · 4,200 capacity', date: null, loc: 'Riverside, England', btn: 'View stadium', sec: 'View club' }
  ];
  let x = base.x + base.width + 40;
  for (const c of cfgs) {
    const v = base.clone(); set.appendChild(v); v.name = 'Kind=' + c.kind;
    const head = v.findOne(n => n.name === 'Head'); const crest = head.findOne(n => n.type === 'INSTANCE' && n.name === 'Club crest');
    const m = mv(c.marker, 'Default').createInstance(); m.name = 'Map marker'; head.insertChild(0, m); if (crest) crest.remove();
    await setIn(v, 'Name', c.name); await setIn(v, 'Meta', c.meta); await setIn(v, 'Location', c.loc);
    if (c.date) { const loc = v.children.find(n => n.name === 'Location'); const dt = await txt(c.date, S_LABEL, 'color/text/primary'); dt.name = 'Date'; v.insertChild(v.children.indexOf(loc), dt); }
    const b = v.children.find(n => n.type === 'INSTANCE' && /^Button/.test(n.name));
    if (b) { b.name = 'Button · ' + c.btn; const cp = b.componentProperties || {}; const lk = Object.keys(cp).find(k => /^Label/.test(k)); if (lk) b.setProperties({ [lk]: c.btn }); const bt = b.findOne(n => n.type === 'TEXT'); if (bt) await setText(bt, c.btn); }
    const sec = v.findOne(n => n.name === 'Secondary action');
    if (sec) {
      if (!c.sec) sec.remove();
      else {
        await setIn(sec, 'Label', c.sec);
        const oi = sec.children.find(n => n.name === 'Icon'); if (oi) oi.remove();
        const si = figma.createNodeFromSvg(calSvg); si.name = 'Icon'; si.fills = []; si.resize(16, 16);
        const wk = k => { if ('children' in k) k.children.forEach(wk); if (k.type !== 'FRAME' && k.type !== 'GROUP') { if (k.strokes && k.strokes.length) k.strokes = [P(V('color/text/brand'))]; k.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; } };
        wk(si); sec.insertChild(0, si);
      }
    }
    v.x = x; v.y = base.y; x += v.width + 40;
  }
  let r = 0, bt = 0; for (const v of set.children) { r = Math.max(r, v.x + v.width); bt = Math.max(bt, v.y + v.height); }
  set.resizeWithoutConstraints(Math.ceil(r), Math.ceil(bt));
  set.description = 'Map card. Opens when a marker is clicked, next to it; the page behind does not change. Kind: Club, Stadium, Event, Match request. Close (x) or Esc dismisses it. Club and Stadium link to each other (View stadium / View club): the map switches type and selects the matching one, since only one type is shown at a time. Event and Match request show their date; Match request ends in Offer a match.';
  created.card = set; created.switcher = set01('Map type switcher');
  report.info.cardVariants = set.children.map(v => v.name + ' ' + Math.round(v.width) + 'x' + Math.round(v.height)).join(' | ');
  await figma.setCurrentPageAsync(p02);
});
await figma.setCurrentPageAsync(p02);
if (!created.switcher) created.switcher = set01('Map type switcher');

async function applySwitcher(pg, active) {
  const filters = pg.findOne(n => n.name === 'Filters'); if (!filters) return 'no Filters';
  for (const k of filters.children.slice()) if (k.name === 'Type switcher') k.remove();
  const inst = created.switcher.children.find(v => v.name === 'Active=' + active).createInstance(); inst.name = 'Type switcher';
  filters.insertChild(0, inst); inst.layoutAlign = 'STRETCH';
  return 'ok';
}

// 2. Sayfa: Events (Default'un kopyasi, Berlin zemini)
await step('Map / Events · Desktop', async () => {
  const dflt = mapSec.children.find(n => n.name === 'Map / Default · Desktop'); if (!dflt) throw new Error('default map page missing');
  const club = mapSec.children.find(n => n.name === 'Map / Club card · Desktop'); if (!club) throw new Error('club card page missing');
  const old = mapSec.children.find(n => n.name === 'Map / Events · Desktop'); if (old) old.remove();
  const cp = dflt.clone(); cp.name = 'Map / Events · Desktop'; mapSec.appendChild(cp); cp.x = club.x + club.width + 480; cp.y = dflt.y;
  const area = cp.findOne(n => n.name === 'Map area'), panel = cp.findOne(n => n.name === 'Map panel'), legend = cp.findOne(n => n.name === 'Legend');
  for (const k of area.children.slice()) if (/^(Cluster|Marker) ·/.test(k.name)) k.remove();
  const bs = area.findOne(n => n.name === 'Map base · Europe'); bs.name = 'Map base · Berlin';
  const img = await figma.createImageAsync('https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/img/map/city-z12-v2.png'); bs.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: img.hash }];
  const at = area.children.indexOf(legend);
  const SG = [[520, 250], [590, 520], [640, 610], [700, 430], [930, 560], [1010, 690], [1120, 520], [1250, 610], [880, 720], [1300, 300], [660, 330]];
  for (const [x, y] of SG) { const i = mv('Event', 'Default').createInstance(); i.name = 'Marker · Event'; area.insertChild(at, i); i.x = Math.round(x - i.width / 2); i.y = Math.round(y - i.height / 2); }
  for (const [x, y, n] of [[560, 380, '3'], [1180, 700, '2']]) { const i = clusterSet.children.find(c => c.name === 'Size=S').createInstance(); i.name = 'Cluster · ' + n; area.insertChild(at, i); const t = i.findOne(k => k.type === 'TEXT'); if (t) await setText(t, n); i.x = Math.round(x - i.width / 2); i.y = Math.round(y - i.height / 2); }
  const sx = 800, sy = 320; const sel = mv('Event', 'Selected').createInstance(); sel.name = 'Marker · Event · selected'; area.insertChild(at, sel); sel.x = Math.round(sx - sel.width / 2); sel.y = Math.round(sy - sel.height / 2);
  const card = created.card.children.find(v => v.name === 'Kind=Event').createInstance(); card.name = 'Map card · Berlin Autumn Cup'; area.insertChild(at, card); card.x = sx + 40; card.y = sy - 50;
  await setIn(card, 'Name', 'Berlin Autumn Cup'); await setIn(card, 'Meta', 'Tournament · 8 teams');
  report.info.eventsSwitcher = await applySwitcher(cp, 'Events');
  // Filtreler: tur, tarih, ulke
  const filters = cp.findOne(n => n.name === 'Filters'); const removed = [];
  for (const k of filters.children.slice()) if (k.name !== 'Type switcher') { removed.push(k.name); k.remove(); }
  report.info.filtersRemoved = removed.join(' | ') || 'none'; report.info.filtersLayout = filters.layoutMode;
  const ff = set01('Form field');
  const pick = t => ff.children.find(v => new RegExp('Type=' + t).test(v.name) && /State=Default/.test(v.name));
  for (const [t, lab, val] of [['Select', 'Event type', 'All event types'], ['Date', 'Dates', 'From today'], ['Select', 'Country', 'All countries']]) {
    const inst = pick(t).createInstance(); inst.name = 'Field · ' + lab; filters.appendChild(inst); inst.layoutAlign = 'STRETCH';
    const cpn = inst.componentProperties || {}; const hk = Object.keys(cpn).find(k => /^Helper/.test(k)); if (hk) inst.setProperties({ [hk]: false });
    await setIn(inst, 'Label', lab); await setIn(inst, 'Value', val);
  }
  const t1 = panel.findOne(n => n.type === 'TEXT' && n.name === 'Total'), t2 = panel.findOne(n => n.type === 'TEXT' && n.name === 'Breakdown'), t3 = panel.findOne(n => n.type === 'TEXT' && n.name === 'Show all');
  if (t1) await setText(t1, '16 events in view'); if (t2) await setText(t2, 'Berlin and surroundings'); if (t3) await setText(t3, 'Show all 16 events');
  const RB = [['Berlin Autumn Cup', 'Tournament · Sat 8 Nov · Mitte'], ['Open trial day', 'Trial · Sun 9 Nov · Wedding'], ['Nordpark SC v Havelblick', 'Match · Sat 15 Nov · Spandau']];
  const res = panel.findOne(n => n.name === 'Results');
  if (res) for (let i = 0; i < res.children.length && i < RB.length; i++) {
    const row = res.children[i]; await setIn(row, 'Name', RB[i][0]); await setIn(row, 'Meta', RB[i][1]);
    const cr = row.findOne(n => n.type === 'INSTANCE' && /crest/i.test(n.name));
    if (cr) { cr.swapComponent(mv('Event', 'Default')); cr.name = 'Map marker'; }
  }
  const r0 = res && res.children[0]; if (r0) { r0.fills = [P(V('color/bg/subtle'))]; RAD(r0, 'radius/md'); r0.name = r0.name + ' · selected'; }
  const lg2 = cp.findOne(n => n.name === 'Legend'); if (lg2) { report.info.legend = await setLegend(lg2, true, 'Events close together. Zoom in to separate.'); lg2.x = area.width - 16 - lg2.width; lg2.y = 16; }
  report.info.card = Math.round(card.x) + ',' + Math.round(card.y) + ' ' + Math.round(card.width) + 'x' + Math.round(card.height) + ' (area ' + Math.round(area.width) + 'x' + Math.round(area.height) + ')';
  report.info.legendBox = lg2 ? Math.round(lg2.x) + ',' + Math.round(lg2.y) + ' ' + Math.round(lg2.width) + 'x' + Math.round(lg2.height) : '-';
  created.page = cp;
});

// 3. Kontrol
await step('check', async () => {
  const gray = [], unst = []; const walk = n => { if ('fills' in n && n.fills !== figma.mixed) n.fills.forEach(f => { if (f.type === 'SOLID' && hex(f) === '#808080') gray.push(n.name); }); if (n.type === 'TEXT' && !n.textStyleId) unst.push(n.name); if ('children' in n) n.children.forEach(walk); };
  walk(created.page); report.info.grayFills = gray.length ? gray.slice(0, 8) : 'none'; report.info.unstyledText = unst.length ? unst.slice(0, 8) : 'none';
  let right = 0, bottom = 0; for (const ch of mapSec.children) { right = Math.max(right, ch.x + ch.width); bottom = Math.max(bottom, ch.y + ch.height); }
  mapSec.resizeWithoutConstraints(Math.max(mapSec.width, Math.ceil(right + 80)), Math.max(mapSec.height, Math.ceil(bottom + 80)));
  let r7 = 0, b7 = 0; for (const ch of sec7.children) { r7 = Math.max(r7, ch.x + ch.width); b7 = Math.max(b7, ch.y + ch.height); } sec7.resizeWithoutConstraints(Math.max(1200, Math.ceil(r7 + 80)), Math.ceil(b7 + 80));
  const ovl = []; const top = p02.children.filter(n => n.type === 'SECTION'); for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) { const a = top[i], b = top[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ovl.push(a.name + ' x ' + b.name); }
  report.info.overlap02 = ovl.length ? ovl : 'none'; report.info.mapSection = Math.round(mapSec.width) + 'x' + Math.round(mapSec.height) + ' · web ' + Math.round(web.width) + 'x' + Math.round(web.height);
});
return report;
