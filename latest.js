// step 362 · Shortlists mevki filtresi (361'in düzeltmesi: overflowDirection = VERTICAL): Select alanı + yeni Position menu + Position list open ekranları + prototip
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const BB = n => n.absoluteBoundingBox;
const R = n => Math.round(n);
const nav = dest => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
async function addNav(el, dest) { const keep = (el.reactions || []).filter(x => !(x.actions || []).some(isNavAct)); await el.setReactionsAsync(keep.concat([nav(dest)])); }
async function setText(root, name, str) { const t = root.findOne(n => n.type === 'TEXT' && n.name === name); if (!t) throw new Error('metin yok: ' + name); await figma.loadFontAsync(t.fontName); t.characters = str; return t; }
function tidy(inst) { for (const nm of ['Helper', 'Error message']) { const t = inst.findOne(n => n.type === 'TEXT' && n.name === nm); if (t) t.visible = false; } }
function sizeField(inst, plat) { if (plat === 'Web') { inst.resize(320, inst.height); inst.layoutSizingVertical = 'HUG'; } else { inst.layoutSizingHorizontal = 'FILL'; } }
const POS = ['Goalkeeper', 'Right-Back', 'Full-back', 'Centre-Back', 'Left-Back', 'Defensive Midfield', 'Central Midfield', 'Attacking Midfield', 'Right Midfield', 'Left Midfield', 'Right Winger', 'Left Winger', 'Winger', 'Centre-Forward', 'Second Forward'];
const MENU_H = 390;

const ff = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Form field');
const ffFilled = ff.children.find(k => k.name === 'Type=Select, State=Filled');
const ffFocus = ff.children.find(k => k.name === 'Type=Select, State=Focus');
let menuComp = null;

await step('Position menu component', async () => {
  const ol = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Option list');
  const orow = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Option row');
  const rowDef = orow.children.find(k => k.name === 'State=Default');
  const rowSel = orow.children.find(k => k.name === 'State=Selected');
  const sec = ol.parent;
  for (const old of p01.findAll(n => n.type === 'COMPONENT' && n.name === 'Position menu')) old.remove();
  const src = ol.children.find(k => /Positions/.test(k.name));
  const c = src.clone();
  sec.appendChild(c);
  const sb = BB(sec); let bottom = 0;
  for (const k of sec.children) { if (k === c) continue; const b = BB(k); if (b) bottom = Math.max(bottom, b.y + b.height - sb.y); }
  c.x = ol.x; c.y = R(bottom + 120);
  const rows = c.children.slice();
  for (let i = 1; i < rows.length; i++) rows[i].remove();
  const names = ['All positions'].concat(POS);
  const list = [rows[0]];
  for (let i = 1; i < names.length; i++) { const cl = rows[0].clone(); c.appendChild(cl); list.push(cl); }
  for (let i = 0; i < list.length; i++) {
    const row = list[i];
    await row.swapComponent(i === 0 ? rowSel : rowDef);
    row.layoutSizingHorizontal = 'FILL';
    row.name = 'Row · ' + names[i];
    await setText(row, 'Label', names[i]);
    const code = row.findOne(n => n.name === 'Code'); if (code) code.visible = false;
    const sub = row.findOne(n => n.name === 'Sub'); if (sub) sub.visible = false;
    const chk = row.findOne(n => n.name === 'Icon · Check'); if (chk) chk.visible = (i === 0);
  }
  c.name = 'Position menu';
  c.description = 'Scrollable list of all 15 database positions plus All positions. Used by the Shortlists position filter. Prototype scrolls vertically.';
  c.resize(400, MENU_H);
  c.clipsContent = true;
  c.overflowDirection = 'VERTICAL';
  menuComp = c;
  const need = R(c.y + c.height + 80);
  if (need > sec.height) sec.resizeWithoutConstraints(sec.width, need);
  report.info.menu = { rows: list.length, naturalHeight: R(list.reduce((s, r) => s + r.height, 0) + (list.length - 1) * 2 + 16), height: R(c.height), section: sec.name + ' ' + R(sec.width) + 'x' + R(sec.height), at: R(c.x) + ',' + R(c.y) };
});

const plats = { Web: { dev: 'Desktop', slot: i => 80 + i * 1920 }, Mobile: { dev: 'Mobile', slot: i => 80 + i * 470 } };
const openFrames = {}; const mainFrames = {};
for (const plat of ['Web', 'Mobile']) {
  await step('select + open screen · ' + plat, async () => {
    const cfg = plats[plat];
    const P = p02.children.find(n => n.type === 'SECTION' && n.name === plat);
    const sec = P.children.find(n => n.type === 'SECTION' && n.name === 'Shortlists');
    for (const o of sec.children.filter(c => /Position list open/.test(c.name))) o.remove();
    const mains = sec.children.filter(c => c.type === 'FRAME' && /^Shortlists \/ /.test(c.name));
    const info = [];
    for (const f of mains) {
      const pf = f.findOne(n => n.name === 'Position filters'); if (!pf) { info.push(f.name + ': Position filters yok, atlandı'); continue; }
      const before = R(f.height); const nChips = pf.children.length;
      for (const c of pf.children.slice()) c.remove();
      pf.layoutWrap = 'NO_WRAP';
      const inst = ffFilled.createInstance(); pf.appendChild(inst);
      inst.name = 'Position select';
      await setText(inst, 'Label', 'Position'); await setText(inst, 'Value', 'All positions'); tidy(inst);
      sizeField(inst, plat);
      info.push(f.name + ': ' + nChips + ' çip -> Select · yükseklik ' + before + ' -> ' + R(f.height) + ' · pf ' + R(pf.width) + 'x' + R(pf.height) + ' · alan ' + R(inst.width) + 'x' + R(inst.height));
      if (!/No players/.test(f.name)) mainFrames[plat] = f;
    }
    report.info[plat + ' select'] = info;
    const main = mainFrames[plat]; if (!main) throw new Error('ana Shortlists ekranı yok');
    const o = main.clone(); sec.appendChild(o);
    o.name = 'Shortlists / Position list open · ' + cfg.dev; o.x = cfg.slot(2); o.y = main.y;
    const inst = o.findOne(n => n.name === 'Position select');
    await inst.swapComponent(ffFocus);
    await setText(inst, 'Label', 'Position'); await setText(inst, 'Value', 'All positions'); tidy(inst); sizeField(inst, plat);
    const pf = o.findOne(n => n.name === 'Position filters'); const col = pf.parent;
    if ('clipsContent' in col) col.clipsContent = false;
    const menu = menuComp.createInstance(); col.appendChild(menu);
    menu.layoutPositioning = 'ABSOLUTE'; menu.name = 'Position menu';
    menu.resize(R(inst.width), MENU_H); menu.x = pf.x; menu.y = pf.y + pf.height + 4;
    openFrames[plat] = o;
    // prototip
    await addNav(mainFrames[plat].findOne(n => n.name === 'Position select'), o);
    await addNav(inst, main);
    for (const row of menu.findAll(n => /^Row · /.test(n.name))) await addNav(row, main);
    // kopyayla gelen akış başlangıcını sil
    p02.flowStartingPoints = p02.flowStartingPoints.filter(fp => fp.nodeId !== o.id);
    const mb = BB(menu), ob = BB(o);
    report.info[plat + ' open'] = { frame: o.name + ' ' + R(o.width) + 'x' + R(o.height), menu: R(mb.width) + 'x' + R(mb.height), menuTopBelowField: R(mb.y - (BB(inst).y + BB(inst).height)), menuInsideFrame: mb.x >= ob.x && mb.x + mb.width <= ob.x + ob.width && mb.y + mb.height <= ob.y + ob.height, overflowDirection: menu.overflowDirection };
  });
}

await step('section settle', async () => {
  const inter = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
  for (const plat of ['Web', 'Mobile']) {
    const P = p02.children.find(n => n.type === 'SECTION' && n.name === plat);
    const sec = P.children.find(n => n.type === 'SECTION' && n.name === 'Shortlists');
    const before = R(sec.width) + 'x' + R(sec.height);
    let right = 0, bottom = 0;
    for (const k of sec.children) { right = Math.max(right, k.x + k.width); bottom = Math.max(bottom, k.y + k.height); }
    sec.resizeWithoutConstraints(Math.max(R(sec.width), R(right + 80)), Math.max(R(sec.height), R(bottom + 80)));
    const moves = [];
    for (let it = 0; it < 6; it++) {
      let moved = false;
      for (const s of P.children.filter(n => n.type === 'SECTION' && n !== sec)) {
        const a = { x: sec.x, y: sec.y, width: sec.width, height: sec.height }, b = { x: s.x, y: s.y, width: s.width, height: s.height };
        if (!inter(a, b)) continue;
        if (s.y >= sec.y) { const d = R(sec.y + sec.height + 160 - s.y); s.y += d; moves.push(s.name + ' ↓' + d); moved = true; }
      }
      if (!moved) break;
    }
    let pr = 0, pb = 0; for (const k of P.children) { pr = Math.max(pr, k.x + k.width); pb = Math.max(pb, k.y + k.height); }
    P.resizeWithoutConstraints(Math.max(R(P.width), R(pr + 120)), Math.max(R(P.height), R(pb + 120)));
    report.info[plat + ' section'] = { before, after: R(sec.width) + 'x' + R(sec.height), moves, platform: R(P.width) + 'x' + R(P.height) };
  }
});

await step('check', async () => {
  let links = 0, broken = 0, gray = 0;
  for (const plat of ['Web', 'Mobile']) {
    const sec = p02.children.find(n => n.type === 'SECTION' && n.name === plat).children.find(n => n.type === 'SECTION' && n.name === 'Shortlists');
    for (const f of sec.children.filter(c => c.type === 'FRAME')) {
      for (const n of [f].concat(f.findAll(x => 'reactions' in x && x.reactions && x.reactions.length))) {
        for (const r of (n.reactions || [])) for (const a of (r.actions || [])) { if (a && a.type === 'NODE' && a.destinationId && a.navigation !== 'CHANGE_TO') { links++; const d = await figma.getNodeByIdAsync(a.destinationId); if (!d) broken++; } }
      }
    }
  }
  const scan = [menuComp].concat(Object.values(openFrames));
  for (const root of scan) for (const n of root.findAll(x => 'fills' in x && Array.isArray(x.fills))) for (const f of n.fills) if (f.type === 'SOLID' && f.visible !== false && Math.round(f.color.r * 255) === 128 && Math.round(f.color.g * 255) === 128 && Math.round(f.color.b * 255) === 128) gray++;
  report.info.check = { navLinks: links, broken, grayFills: gray, flowStarts: p02.flowStartingPoints.length };
});
return report;
