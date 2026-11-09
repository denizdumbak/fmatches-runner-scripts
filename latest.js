// step 372 · Shortlists: "Position" alanı yerine "Filters" düğmesi (masaüstü + mobil) + yeni ekranlar "Filters open" (masaüstü: düğmenin altında panel, mobil: tam ekran Filters; Position, Nationality, Age, Contract until) + prototip
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const R = n => Math.round(n);
const BB = n => n.absoluteBoundingBox;
const allVars = await figma.variables.getLocalVariablesAsync();
const tryV = (...names) => { for (const nm of names) { const v = allVars.find(x => x.name === nm); if (v) return v; } return null; };
const secOf = (plat, name) => { const root = p02.children.find(n => n.type === 'SECTION' && n.name === plat); return root ? root.children.find(n => n.type === 'SECTION' && n.name === name) : null; };
const nav = dest => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
const DEV = { Web: 'Desktop', Mobile: 'Mobile' };
const defName = d => 'Shortlists / Shortlists · ' + d;
const openName = d => 'Shortlists / Filters open · ' + d;
const frameOf = (sec, nm) => sec.children.find(c => c.type === 'FRAME' && c.name === nm);
const btnSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Button');
const btnVar = style => { const v = btnSet.children.find(c => c.name.indexOf('Style=' + style) >= 0 && c.name.indexOf('State=Default') >= 0); if (!v) throw new Error('Button varyanti yok: ' + style); return v; };
async function setLabel(btn, str) {
  const key = Object.keys(btn.componentProperties).find(k => /^Label/.test(k));
  if (key) btn.setProperties({ [key]: str });
  const t = btn.findOne(n => n.type === 'TEXT'); if (t) { await figma.loadFontAsync(t.fontName); if (t.characters !== str) t.characters = str; }
}
async function setText(root, nodeName, str) {
  const t = root.findOne(n => n.type === 'TEXT' && n.name === nodeName); if (!t) throw new Error(nodeName + ' metni yok: ' + root.name);
  await figma.loadFontAsync(t.fontName); t.characters = str;
}
const playerRows = f => f.findAll(n => n.type === 'INSTANCE' && /^Player ·/.test(n.name)).length;

// 1) varsayilan ekran: Position alani -> Filters dugmesi
await step('Filters dugmesi', async () => {
  const rows = [];
  for (const plat of ['Web', 'Mobile']) {
    const f = frameOf(secOf(plat, 'Shortlists'), defName(DEV[plat])); if (!f) throw new Error('ekran yok: ' + plat);
    const bar = f.findOne(n => n.name === 'Position filters' || n.name === 'Filter bar');
    if (!bar) throw new Error('filtre satiri yok: ' + plat);
    if (bar.name === 'Filter bar') { rows.push(plat + ': zaten Filters dugmesi'); continue; }
    const sel = bar.findOne(n => n.name === 'Position select'); if (sel) sel.remove();
    const btn = btnVar('Secondary').createInstance(); btn.name = 'Button · Filters';
    bar.appendChild(btn); await setLabel(btn, 'Filters');
    btn.layoutSizingHorizontal = plat === 'Mobile' ? 'FILL' : 'HUG';
    bar.name = 'Filter bar';
    rows.push(plat + ': bar ' + R(bar.width) + 'x' + R(bar.height) + ' | dugme ' + R(btn.width) + 'x' + R(btn.height) + ' | frame ' + R(f.height));
  }
  report.info.bar = rows;
});

// 2) Masaustu: Filters open (panel dugmenin altinda)
await step('Filters open Desktop', async () => {
  const sec = secOf('Web', 'Shortlists'); const base = frameOf(sec, defName('Desktop'));
  for (const o of p02.findAll(n => n.type === 'FRAME' && n.name === openName('Desktop'))) o.remove();
  const siblings = sec.children.filter(c => c.type === 'FRAME'); const xs = siblings.map(f => f.x).sort((a, b) => a - b); const stepX = xs[1] - xs[0];
  const N = playerRows(base);
  const clone = base.clone(); clone.name = openName('Desktop'); sec.appendChild(clone); clone.x = xs[0] + stepX * siblings.length; clone.y = base.y;
  const search = secOf('Web', 'Search results').children.find(c => c.type === 'FRAME' && c.name === 'Search / Players · Desktop');
  const srcPanel = search.findOne(n => n.name === 'Filter panel'); if (!srcPanel) throw new Error('Search Filter panel yok');
  const panel = srcPanel.clone(); panel.name = 'Filter panel · Shortlists';
  const col = clone.findOne(n => n.name === 'Column'); col.clipsContent = false;
  col.appendChild(panel); panel.layoutPositioning = 'ABSOLUTE';
  panel.resize(400, panel.height); panel.layoutSizingVertical = 'HUG';
  const g = panel.findOne(n => n.name === 'Gender'); if (g) g.remove();
  const age = panel.findOne(n => n.name === 'Field · Age'), nat = panel.findOne(n => n.name === 'Field · Nationality'), pos = panel.findOne(n => n.name === 'Field · Position');
  if (!age || !nat || !pos) throw new Error('panel alanlari eksik');
  const ct = nat.clone(); ct.name = 'Field · Contract until'; panel.insertChild(panel.children.indexOf(age) + 1, ct); ct.layoutSizingHorizontal = 'FILL';
  const labels = ct.findAll(n => n.type === 'TEXT'); report.info.contractFieldTexts = labels.map(t => t.name + '="' + t.characters + '"');
  await setText(ct, 'Label', 'Contract until'); await setText(ct, 'Value', 'Any time');
  // footer: Clear all + Show N players
  const footer = figma.createFrame(); footer.name = 'Filter actions'; footer.fills = [];
  footer.layoutMode = 'HORIZONTAL'; footer.primaryAxisSizingMode = 'FIXED'; footer.counterAxisSizingMode = 'AUTO'; footer.counterAxisAlignItems = 'CENTER';
  const gv = tryV('spacing/sm', 'spacing/md'); if (gv) footer.setBoundVariable('itemSpacing', gv); else footer.itemSpacing = 12;
  panel.appendChild(footer); footer.layoutSizingHorizontal = 'FILL';
  const clear = btnVar('Subtle').createInstance(); clear.name = 'Button · Clear all'; footer.appendChild(clear); await setLabel(clear, 'Clear all'); clear.layoutSizingHorizontal = 'HUG';
  const show = btnVar('Primary').createInstance(); show.name = 'Button · Show players'; footer.appendChild(show); await setLabel(show, 'Show ' + N + ' players'); show.layoutSizingHorizontal = 'FILL';
  const fb = clone.findOne(n => n.name === 'Button · Filters'); const bar = clone.findOne(n => n.name === 'Filter bar');
  panel.x = 0; panel.y = (BB(bar).y - BB(col).y) + fb.height + 8;
  try { const st = (await figma.getLocalEffectStylesAsync()).find(s => s.name === 'Shadow/Raised'); if (st) await panel.setEffectStyleIdAsync(st.id); } catch (e) { report.errors.push('golge: ' + e.message); }
  const need = clone.x + clone.width + 80; if (need > sec.width) sec.resizeWithoutConstraints(R(need), R(sec.height));
  const pb = BB(panel), cb = BB(clone), bb = BB(fb);
  report.info.desktopOpen = clone.name + ' ' + R(clone.width) + 'x' + R(clone.height) + ' @' + R(clone.x) + ',' + R(clone.y) + ' | panel ' + R(panel.width) + 'x' + R(panel.height) + ' @' + R(pb.x - cb.x) + ',' + R(pb.y - cb.y) + ' | dugmeye binmiyor: ' + (pb.y >= bb.y + bb.height) + ' | panel frame icinde: ' + (pb.y + pb.height <= cb.y + cb.height) + ' | oyuncu ' + N + ' | alanlar ' + panel.children.map(c => c.name).join(' > ');
});

// 3) Mobil: Search "Filters" ekranindan Shortlists Filters open
await step('Filters open Mobile', async () => {
  const sec = secOf('Mobile', 'Shortlists'); const base = frameOf(sec, defName('Mobile'));
  for (const o of p02.findAll(n => n.type === 'FRAME' && n.name === openName('Mobile'))) o.remove();
  const siblings = sec.children.filter(c => c.type === 'FRAME'); const xs = siblings.map(f => f.x).sort((a, b) => a - b); const stepX = xs[1] - xs[0];
  const N = playerRows(base);
  const src = secOf('Mobile', 'Search results').children.find(c => c.type === 'FRAME' && c.name === 'Search / Filters · Mobile'); if (!src) throw new Error('Search Filters Mobile yok');
  const clone = src.clone(); clone.name = openName('Mobile'); sec.appendChild(clone); clone.x = xs[0] + stepX * siblings.length; clone.y = base.y;
  const panel = clone.findOne(n => n.name === 'Filter panel');
  const g = panel.findOne(n => n.name === 'Gender'); if (g) g.remove();
  const age = panel.findOne(n => n.name === 'Field · Age'), nat = panel.findOne(n => n.name === 'Field · Nationality');
  const ct = nat.clone(); ct.name = 'Field · Contract until'; panel.insertChild(panel.children.indexOf(age) + 1, ct); ct.layoutSizingHorizontal = 'FILL';
  await setText(ct, 'Label', 'Contract until'); await setText(ct, 'Value', 'Any time');
  const show = clone.findOne(n => /^Button · Show/.test(n.name)); if (!show) throw new Error('Show butonu yok');
  show.name = 'Button · Show players'; await setLabel(show, 'Show ' + N + ' players');
  const need = clone.x + clone.width + 80; if (need > sec.width) sec.resizeWithoutConstraints(R(need), R(sec.height));
  report.info.mobileOpen = clone.name + ' ' + R(clone.width) + 'x' + R(clone.height) + ' @' + R(clone.x) + ',' + R(clone.y) + ' | alanlar ' + panel.children.map(c => c.name).join(' > ') + ' | oyuncu ' + N;
});

// 4) prototip
await step('prototip', async () => {
  const links = [];
  const add = async (node, dest) => { await node.setReactionsAsync((node.reactions || []).filter(r => !(r.actions || []).some(isNavAct)).concat([nav(dest)])); };
  for (const plat of ['Web', 'Mobile']) {
    const d = DEV[plat]; const sec = secOf(plat, 'Shortlists'); const a = frameOf(sec, defName(d)), b = frameOf(sec, openName(d));
    if (!a || !b) throw new Error('ekran yok: ' + plat);
    await add(a.findOne(n => n.name === 'Button · Filters'), b); links.push(plat + ': Filters -> Filters open');
    const showBtn = b.findOne(n => n.name === 'Button · Show players'); await add(showBtn, a); links.push(plat + ': Show players -> Shortlists');
    if (plat === 'Web') { await add(b.findOne(n => n.name === 'Button · Filters'), a); links.push('Web: Filters (acik) -> Shortlists'); }
  }
  const ids = new Set(); for (const plat of ['Web', 'Mobile']) { const f = frameOf(secOf(plat, 'Shortlists'), openName(DEV[plat])); if (f) ids.add(f.id); }
  const before = p02.flowStartingPoints.length; p02.flowStartingPoints = p02.flowStartingPoints.filter(fp => !ids.has(fp.nodeId));
  report.info.prototype = { links, flowStarts: before + ' -> ' + p02.flowStartingPoints.length };
});

// 5) kontrol
await step('kontrol', async () => {
  const out = {};
  for (const plat of ['Web', 'Mobile']) {
    const sec = secOf(plat, 'Shortlists'); const frames = sec.children.filter(c => c.type === 'FRAME');
    const unstyled = [], gray = [];
    for (const f of frames.filter(x => /Filters open|Shortlists · /.test(x.name))) {
      for (const t of f.findAll(n => n.type === 'TEXT' && n.visible !== false)) if (!t.textStyleId) unstyled.push(f.name.replace('Shortlists / ', '') + ': "' + String(t.characters).slice(0, 18) + '"');
      for (const n of f.findAll(x => 'fills' in x && Array.isArray(x.fills))) for (const p of n.fills) if (p.type === 'SOLID' && p.visible !== false && Math.abs(p.color.r - .5) < .003 && Math.abs(p.color.g - .5) < .003 && Math.abs(p.color.b - .5) < .003 && !(p.boundVariables && p.boundVariables.color)) gray.push(f.name.replace('Shortlists / ', '') + ': ' + n.name);
    }
    let ov = 0; for (let i = 0; i < frames.length; i++) for (let j = i + 1; j < frames.length; j++) { const A = frames[i], B = frames[j]; if (A.x < B.x + B.width && B.x < A.x + A.width && A.y < B.y + B.height && B.y < A.y + A.height) ov++; }
    const plt = p02.children.find(n => n.type === 'SECTION' && n.name === plat); let so = 0;
    for (const s of plt.children.filter(n => n.type === 'SECTION' && n !== sec)) if (sec.x < s.x + s.width && s.x < sec.x + sec.width && sec.y < s.y + s.height && s.y < sec.y + sec.height) so++;
    out[plat] = { frames: frames.map(f => f.name.replace('Shortlists / ', '') + ' ' + R(f.width) + 'x' + R(f.height)), unstyledText: unstyled.length ? unstyled : 0, grayFills: gray.length ? gray : 0, frameOverlaps: ov, sectionOverlaps: so, section: R(sec.width) + 'x' + R(sec.height), insidePlatform: sec.x + sec.width <= plt.width };
  }
  report.info.check = out;
});
return report;
