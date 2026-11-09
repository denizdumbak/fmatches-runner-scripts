// step 377 · Club card MOBİL: Women's notu silinir · Women's 8 yönetici (kapalı 4 + "Show all 8", yeni ekran açık) · "Events on club's facilities" kalkar, etkinlikler tesis satırlarında açılır (sayı satır içinde) · sıra Management, Teams, Location, Facilities
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const R = n => Math.round(n);
const BB = n => n.absoluteBoundingBox;
const allVars = await figma.variables.getLocalVariablesAsync();
const tryV = (...names) => { for (const n of names) { const v = allVars.find(x => x.name === n || x.name.endsWith('/' + n)); if (v) return v; } return null; };
const V = name => { const v = tryV(name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
function mkIcon(svg, colorVar, size) {
  const ic = figma.createNodeFromSvg(svg); ic.name = 'Icon'; ic.fills = []; ic.resize(size, size); ic.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
  const walk = x => { if ('children' in x) x.children.forEach(walk); if (x.type !== 'FRAME' && x.type !== 'GROUP') { if (x.strokes && x.strokes.length) x.strokes = [P(V(colorVar))]; x.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; } };
  walk(ic); return ic;
}
const SV = body => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
const CHEV_DOWN = SV('<path d="m6 9 6 6 6-6"/>'), CHEV_UP = SV('<path d="m18 15-6-6-6 6"/>');
const nav = dest => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const sec = web.children.find(n => n.type === 'SECTION' && n.name === 'Club card');
const frameOf = nm => sec.children.find(c => c.type === 'FRAME' && c.name === nm);
const NAMES = { full: 'Clubs / Club card · Mobile', women: `Clubs / Club card / Women's club · Mobile`, staff: 'Clubs / Club card / Staff tab · Mobile', team: 'Clubs / Club card / Team list open · Mobile', womenOpen: `Clubs / Club card / Women's club / Management expanded · Mobile` };
const btnSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Button');
const subtle = () => { const v = btnSet.children.find(c => c.name.indexOf('Style=Subtle') >= 0 && c.name.indexOf('State=Default') >= 0); if (!v) throw new Error('Subtle Button yok'); return v; };
async function setLabel(btn, str) {
  const key = Object.keys(btn.componentProperties).find(k => /^Label/.test(k)); if (key) btn.setProperties({ [key]: str });
  const t = btn.findOne(n => n.type === 'TEXT'); if (t) { await figma.loadFontAsync(t.fontName); if (t.characters !== str) t.characters = str; }
}
async function setTxt(t, str) { await figma.loadFontAsync(t.fontName); t.characters = str; }
const bodyOf = f => f.findOne(n => n.type === 'FRAME' && n.name === 'Profile body');


async function restructure(f) {
  const log = []; const body = bodyOf(f); if (!body) throw new Error('Profile body yok: ' + f.name);
  const note = body.children.find(c => /^Note · Women/.test(c.name)); if (note) { note.remove(); log.push('Women notu silindi'); }
  const evFrame = body.children.find(c => /^Events on club/.test(c.name)); const fac = body.children.find(c => c.name === 'Facilities');
  if (!fac) throw new Error('Facilities yok: ' + f.name);
  if (evFrame) {
    const evRows = evFrame.findAll(n => n.type === 'INSTANCE' && /^Event row/.test(n.name));
    const rowsOf = fr => /Academy/.test(fr.name) ? evRows.filter(r => /Youth/.test(r.name)) : (/Training/.test(fr.name) ? [] : evRows.filter(r => !/Youth/.test(r.name)));
    const facRows = fac.children.filter(c => c.type === 'FRAME' && /^Facility ·/.test(c.name));
    let moved = 0;
    for (const fr of facRows) {
      const evs = rowsOf(fr); const idx = fac.children.indexOf(fr);
      const group = figma.createFrame(); group.name = 'Facility group · ' + fr.name.replace('Facility · ', ''); group.fills = []; group.layoutMode = 'VERTICAL'; group.itemSpacing = 0; group.primaryAxisSizingMode = 'AUTO'; group.counterAxisSizingMode = 'FIXED';
      fac.insertChild(idx, group); group.layoutSizingHorizontal = 'FILL';
      group.appendChild(fr); fr.layoutSizingHorizontal = 'FILL';
      const textFrame = fr.findOne(n => n.type === 'FRAME' && n.name === 'Text'); const metas = textFrame.children.filter(c => c.type === 'TEXT'); const meta = metas[metas.length - 1];
      const chev = fr.children.find(c => c.name === 'Icon · chevron');
      const old = chev.findOne(n => n.type === 'VECTOR'); let colorName = 'color/icon/default';
      const sb = old && old.strokes && old.strokes[0] && old.strokes[0].boundVariables && old.strokes[0].boundVariables.color; if (sb) { const vv = await figma.variables.getVariableByIdAsync(sb.id); if (vv) colorName = vv.name; }
      const cnt = meta.clone(); cnt.name = 'Events count'; textFrame.appendChild(cnt); await setTxt(cnt, evs.length ? evs.length + ' upcoming' : 'No upcoming events');
      const expanded = evs.length && !/Academy/.test(fr.name);
      if (evs.length) {
        for (const k of chev.children.slice()) k.remove(); const g = mkIcon(expanded ? CHEV_UP : CHEV_DOWN, colorName, 20); chev.appendChild(g); g.x = 0; g.y = 0;
        const box = figma.createFrame(); box.name = 'Facility events'; box.fills = []; box.layoutMode = 'VERTICAL'; box.itemSpacing = 0; box.primaryAxisSizingMode = 'AUTO'; box.counterAxisSizingMode = 'FIXED'; box.paddingBottom = 12;
        group.appendChild(box); box.layoutSizingHorizontal = 'FILL';
        for (const r of evs) { box.appendChild(r); r.layoutSizingHorizontal = 'FILL'; moved++; }
        const vb = subtle().createInstance(); vb.name = 'Button · View facility'; box.appendChild(vb); await setLabel(vb, 'View facility'); vb.layoutSizingHorizontal = 'HUG';
        if (!expanded) box.visible = false;
      } else { chev.visible = false; }
    }
    evFrame.remove(); log.push('Events bolumu kalkti, ' + moved + ' etkinlik tesis satirlarina tasindi');
  }
  return log;
}

for (const key of ['full', 'women', 'staff', 'team']) {
  await step('restructure ' + key, async () => { const f = frameOf(NAMES[key]); if (!f) throw new Error('ekran yok: ' + NAMES[key]); report.info['restructure ' + key] = await restructure(f); });
}

await step("Women's 8 yonetici + acik ekran", async () => {
  const f = frameOf(NAMES.women); if (!f) throw new Error('Women ekran yok');
  for (const o of sec.children.filter(c => c.type === 'FRAME' && c.name === NAMES.womenOpen)) o.remove();
  const mgmt = f.findOne(n => n.type === 'FRAME' && n.name === 'Management');
  let rows = mgmt.children.filter(c => /^Person row/.test(c.name));
  if (rows.length === 4) {
    const defs = [['Sabine Krüger', `Head of Women's Football`, 'Female'], ['Thomas Wolff', 'Managing Director', 'Male'], ['Nina Albrecht', 'Director of Finance', 'Female'], ['Markus Engel', 'Head of Marketing', 'Male']];
    for (let i = 0; i < 4; i++) {
      const c = rows[i].clone(); mgmt.appendChild(c); c.name = 'Person row · ' + defs[i][0];
      await setTxt(c.findOne(n => n.type === 'TEXT' && n.name === 'Name'), defs[i][0]); await setTxt(c.findOne(n => n.type === 'TEXT' && n.name === 'Meta'), defs[i][1]);
      const sil = c.findOne(n => n.type === 'INSTANCE' && n.componentProperties && 'Gender' in n.componentProperties); if (!sil) throw new Error('silüet yok: ' + c.name); sil.setProperties({ Gender: defs[i][2] });
      c.layoutSizingHorizontal = 'FILL';
    }
    rows = mgmt.children.filter(c => /^Person row/.test(c.name));
  }
  const sum = mgmt.findOne(n => n.type === 'TEXT' && n.name === 'Career summary'); await setTxt(sum, rows.length + ' people');
  let tg = mgmt.findOne(n => n.name === 'Button · Show all');
  if (!tg) { tg = subtle().createInstance(); tg.name = 'Button · Show all'; mgmt.appendChild(tg); tg.layoutSizingHorizontal = 'FILL'; }
  await setLabel(tg, 'Show fewer');
  const open = f.clone(); open.name = NAMES.womenOpen; sec.appendChild(open);
  const xs = sec.children.filter(c => c.type === 'FRAME' && c !== open).map(c => c.x).sort((a, b) => a - b); open.x = xs[xs.length - 1] + 470; open.y = f.y;
  for (const r of rows.slice(4)) r.remove();
  await setLabel(tg, 'Show all ' + rows.length);
  const need = open.x + open.width + 80; if (need > sec.width) sec.resizeWithoutConstraints(R(need), R(sec.height));
  report.info.women = { people: rows.length, collapsedRows: mgmt.children.filter(c => /^Person row/.test(c.name)).length, expandedRows: open.findOne(n => n.name === 'Management').children.filter(c => /^Person row/.test(c.name)).length, openFrame: open.name + ' ' + R(open.width) + 'x' + R(open.height) + ' @' + R(open.x) + ',' + R(open.y) };
});

await step('prototip (Show all / Show fewer)', async () => {
  const a = frameOf(NAMES.women), b = frameOf(NAMES.womenOpen); if (!a || !b) throw new Error('ekran yok');
  for (const [from, to] of [[a, b], [b, a]]) { const btn = from.findOne(n => n.name === 'Button · Show all'); await btn.setReactionsAsync((btn.reactions || []).filter(r => !(r.actions || []).some(isNavAct)).concat([nav(to)])); }
  const before = p02.flowStartingPoints.length; p02.flowStartingPoints = p02.flowStartingPoints.filter(fp => fp.nodeId !== b.id);
  report.info.flowStarts = before + ' -> ' + p02.flowStartingPoints.length;
});

await step('kontrol', async () => {
  const out = {}; const frames = sec.children.filter(c => c.type === 'FRAME');
  for (const f of frames.filter(x => !/Minimal/.test(x.name))) {
    const body = bodyOf(f); const fac = f.findOne(n => n.name === 'Facilities' && n.type === 'FRAME'); const mg = f.findOne(n => n.type === 'FRAME' && n.name === 'Management');
    const bad = []; for (const t of f.findAll(n => n.type === 'TEXT' && n.visible !== false)) if (!t.textStyleId) bad.push(String(t.characters).slice(0, 18));
    const over = []; for (const c of body.children) { const b = BB(c), bb = BB(body); if (b.x + b.width > bb.x + bb.width + 0.5) over.push(c.name); }
    const facOver = []; if (fac) for (const n of fac.findAll(x => x.visible !== false && x.type !== 'VECTOR')) { const b = BB(n), fb = BB(fac); if (b && fb && b.x + b.width > fb.x + fb.width + 0.5) facOver.push(n.name); }
    out[f.name.replace('Clubs / Club card', '').trim() || 'Full'] = { size: R(f.width) + 'x' + R(f.height), body: body.children.map(c => c.name + ' ' + R(c.height)), people: mg.children.filter(c => /^Person row/.test(c.name)).length, eventRowsInFacilities: fac.findAll(n => n.type === 'INSTANCE' && /^Event row/.test(n.name)).length, facilityRowHeights: fac.findAll(n => n.type === 'FRAME' && /^Facility ·/.test(n.name)).map(n => R(n.height)).join(','), unstyled: bad.length ? bad : 0, bodyOverflow: over.length ? over : 'none', facilitiesOverflow: facOver.length ? facOver.slice(0, 4) : 'none', womenNoteLeft: !!f.findOne(n => /^Note · Women/.test(n.name)) };
  }
  let ov = 0; for (let i = 0; i < frames.length; i++) for (let j = i + 1; j < frames.length; j++) { const A = frames[i], B = frames[j]; if (A.x < B.x + B.width && B.x < A.x + A.width && A.y < B.y + B.height && B.y < A.y + A.height) ov++; }
  out.sectionFrameOverlaps = ov; out.section = R(sec.width) + 'x' + R(sec.height) + ' insidePlatform ' + (sec.x + sec.width <= web.width);
  report.info.check = out;
});
return report;
