// step 370 · (368 düzeltmesi: klon Section'a alınır, silinen satırın ebeveyni önceden toplanır, sayfa kökündeki Unread only kalıntısı silinir) Notifications: "2 unread" Filter chip olur (Default) + yeni ekran "Unread only" (chip Selected, yalnız okunmamış satırlar), masaüstü + mobil, prototip ileri geri
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const R = n => Math.round(n);
const BB = n => n.absoluteBoundingBox;
const secOf = (plat, name) => { const root = p02.children.find(n => n.type === 'SECTION' && n.name === plat); return root ? root.children.find(n => n.type === 'SECTION' && n.name === name) : null; };
const nav = dest => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
const DEV = { Web: 'Desktop', Mobile: 'Mobile' };
const baseName = d => 'Notifications / Notifications · ' + d;
const newName = d => 'Notifications / Unread only · ' + d;
const frameOf = (sec, nm) => sec.children.find(c => c.type === 'FRAME' && c.name === nm);

async function rowInfo(f) {
  const out = [];
  for (const inst of f.findAll(n => n.type === 'INSTANCE')) {
    const m = await inst.getMainComponentAsync(); if (!m) continue;
    const setName = m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent.name : m.name;
    if (!/^Notification row/.test(setName)) continue;
    const props = inst.componentProperties || {};
    const key = Object.keys(props).find(k => /^Unread/i.test(k));
    if (!key) throw new Error('Unread özelliği yok: ' + inst.name + ' | ' + Object.keys(props).join(','));
    out.push({ inst, unread: String(props[key].value).toLowerCase() === 'true' || String(props[key].value).toLowerCase() === 'yes' });
  }
  return out;
}

// 1) "2 unread" metni -> Filter chip (Default), iki cihazda
await step('Unread count -> Filter chip', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Filter chip'); if (!set) throw new Error('Filter chip seti yok');
  const def = set.children.find(v => /State=Default/.test(v.name)); if (!def) throw new Error('State=Default yok: ' + set.children.map(v => v.name).join(' ; '));
  const rows = [];
  for (const plat of ['Web', 'Mobile']) {
    const sec = secOf(plat, 'Notifications'); const f = frameOf(sec, baseName(DEV[plat])); if (!f) throw new Error('ekran yok: ' + plat);
    if (f.findOne(n => n.name === 'Filter chip · Unread')) { rows.push(plat + ': chip zaten var'); continue; }
    const un = f.findOne(n => n.type === 'TEXT' && n.name === 'Unread count'); if (!un) throw new Error('Unread count yok: ' + plat);
    const rinfo = await rowInfo(f); const nUnread = rinfo.filter(r => r.unread).length;
    const chip = def.createInstance(); chip.name = 'Filter chip · Unread';
    const t = chip.findOne(n => n.type === 'TEXT'); if (!t) throw new Error('chip metni yok');
    await figma.loadFontAsync(t.fontName); t.characters = nUnread + ' unread';
    const parent = un.parent; const idx = parent.children.indexOf(un);
    parent.insertChild(idx, chip); un.remove();
    chip.layoutSizingHorizontal = 'HUG';
    const b = BB(chip), pb = BB(parent), fb = BB(f);
    rows.push(plat + ': chip "' + t.characters + '" ' + R(chip.width) + 'x' + R(chip.height) + ' @' + R(b.x - fb.x) + ',' + R(b.y - fb.y) + ' | okunmamış satır ' + nUnread + '/' + rinfo.length + ' | ebeveyn ' + parent.name + ' ' + R(parent.width) + 'x' + R(parent.height) + ' | props ' + Object.keys(chip.componentProperties).join(','));
  }
  report.info.chips = rows;
});

// 2) Unread only ekranları
await step('Unread only ekranlari', async () => {
  const res = [];
  for (const plat of ['Web', 'Mobile']) {
    const d = DEV[plat]; const sec = secOf(plat, 'Notifications'); const base = frameOf(sec, baseName(d));
    for (const o of p02.findAll(n => n.type === 'FRAME' && n.name === newName(d))) o.remove();
    const siblings = sec.children.filter(c => c.type === 'FRAME');
    const xs = siblings.map(f => f.x).sort((a, b) => a - b); const step_ = xs[1] - xs[0];
    const clone = base.clone(); clone.name = newName(d); sec.appendChild(clone);
    clone.x = xs[0] + step_ * siblings.length; clone.y = base.y;
    // okunmuş satırları sil (yanındaki ayırıcıyla)
    const rinfo = await rowInfo(clone); let removed = 0; const parents = new Set(rinfo.map(r => r.inst.parent).filter(Boolean));
    for (const r of rinfo.filter(x => !x.unread)) {
      const par = r.inst.parent; const i = par.children.indexOf(r.inst);
      const next = par.children[i + 1]; const prev = par.children[i - 1];
      if (next && /Divider/.test(next.name)) next.remove(); else if (prev && /Divider/.test(prev.name)) prev.remove();
      r.inst.remove(); removed++;
    }
    // sondaki ayırıcı kalmasın
    for (const par of parents) { const last = par.children[par.children.length - 1]; if (last && /Divider/.test(last.name)) last.remove(); }
    // chip Selected
    const chip = clone.findOne(n => n.name === 'Filter chip · Unread'); if (!chip) throw new Error('klonda chip yok');
    const key = Object.keys(chip.componentProperties).find(k => /^State/.test(k)); if (!key) throw new Error('chip State yok: ' + Object.keys(chip.componentProperties).join(','));
    chip.setProperties({ [key]: 'Selected' });
    const left = await rowInfo(clone);
    // section kapsasin
    const need = clone.x + clone.width + 80;
    if (need > sec.width) sec.resizeWithoutConstraints(R(need), R(sec.height));
    res.push(plat + ': ' + clone.name + ' ' + R(clone.width) + 'x' + R(clone.height) + ' @' + R(clone.x) + ',' + R(clone.y) + ' | silinen okunmuş ' + removed + ' | kalan satır ' + left.length + ' (hepsi okunmamış: ' + left.every(r => r.unread) + ') | chip ' + key + '=' + chip.componentProperties[key].value + ' | section ' + R(sec.width) + 'x' + R(sec.height));
  }
  report.info.screens = res;
});

// 3) prototip: chip Default -> Unread only, Selected -> Default
await step('prototip', async () => {
  const links = [];
  for (const plat of ['Web', 'Mobile']) {
    const d = DEV[plat]; const sec = secOf(plat, 'Notifications');
    const a = frameOf(sec, baseName(d)), b = frameOf(sec, newName(d));
    for (const [from, to] of [[a, b], [b, a]]) {
      const chip = from.findOne(n => n.name === 'Filter chip · Unread'); if (!chip) throw new Error('chip yok: ' + from.name);
      await chip.setReactionsAsync((chip.reactions || []).filter(r => !(r.actions || []).some(isNavAct)).concat([nav(to)]));
      links.push(from.name.replace('Notifications / ', '') + ' -> ' + to.name.replace('Notifications / ', ''));
    }
  }
  // klonlarla gelen akis baslangiclarini sil
  const ids = new Set(); for (const plat of ['Web', 'Mobile']) { const f = frameOf(secOf(plat, 'Notifications'), newName(DEV[plat])); if (f) ids.add(f.id); }
  const before = p02.flowStartingPoints.length;
  p02.flowStartingPoints = p02.flowStartingPoints.filter(fp => !ids.has(fp.nodeId));
  report.info.prototype = { links, flowStarts: before + ' -> ' + p02.flowStartingPoints.length };
});

// 4) kontrol
await step('kontrol', async () => {
  const out = {};
  for (const plat of ['Web', 'Mobile']) {
    const sec = secOf(plat, 'Notifications'); const frames = sec.children.filter(c => c.type === 'FRAME');
    const bad = []; for (const f of frames) for (const t of f.findAll(n => n.type === 'TEXT' && n.visible !== false)) { if (!t.textStyleId) bad.push(f.name.replace('Notifications / ', '') + ': stilsiz "' + String(t.characters).slice(0, 20) + '"'); }
    let overlaps = 0; for (let i = 0; i < frames.length; i++) for (let j = i + 1; j < frames.length; j++) { const A = frames[i], B = frames[j]; if (A.x < B.x + B.width && B.x < A.x + A.width && A.y < B.y + B.height && B.y < A.y + A.height) overlaps++; }
    const secs = p02.children.find(n => n.name === plat).children.filter(n => n.type === 'SECTION' && n !== sec); let secOver = 0;
    for (const s of secs) if (sec.x < s.x + s.width && s.x < sec.x + sec.width && sec.y < s.y + s.height && s.y < sec.y + sec.height) secOver++;
    const plt = p02.children.find(n => n.name === plat);
    out[plat] = { frames: frames.map(f => f.name.replace('Notifications / ', '') + ' ' + R(f.width) + 'x' + R(f.height)), unstyledText: bad.length ? bad : 0, frameOverlaps: overlaps, sectionOverlaps: secOver, insidePlatform: (sec.x + sec.width <= plt.width) };
  }
  report.info.check = out;
});
return report;
