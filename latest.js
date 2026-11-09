// step 338 · Arama Player result: masaüstünde sütun başlığı satırı (Table header) + gizli etiketler, çoklu uyruk (Value 2), mobilde etiketler kalır
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const sub = (plat, re) => plat.children.find(n => n.type === 'SECTION' && re.test(n.name));
const fr = (sec, name) => sec.children.find(n => n.type === 'FRAME' && n.name === name);
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const fonts = async t => { for (const f of t.getRangeAllFontNames(0, Math.max(1, t.characters.length))) await figma.loadFontAsync(f); };
async function setLabel(node, str) { const t = node.type === 'TEXT' ? node : node.findOne(n => n.type === 'TEXT'); await fonts(t); t.characters = str; return t; }
const sz = n => Math.round(n.width) + 'x' + Math.round(n.height);
const floatVars = allVars.filter(v => v.resolvedType === 'FLOAT' && /space|spacing|gap/i.test(v.name));
const gapVar = px => floatVars.find(v => { const m = v.valuesByMode[Object.keys(v.valuesByMode)[0]]; return m === px; });
function setGap(n, key, px) { const v = gapVar(px); if (v) n.setBoundVariable(key, v); else n[key] = px; }
async function copySpacing(src, dst, keys) { for (const k of keys) { const a = src.boundVariables && src.boundVariables[k]; if (a) { const v = await figma.variables.getVariableByIdAsync(a.id); dst.setBoundVariable(k, v); } else dst[k] = src[k]; } }
const COL = { 'Age': 48, 'Nationality': 136, 'Contract until': 104 };

let labelSrc = null;
await step('kaynak etiket stili (Shortlist row > Label)', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Shortlist row');
  labelSrc = set.findOne(n => n.type === 'TEXT' && n.name === 'Label'); if (!labelSrc) throw new Error('Label yok');
});
async function mkText(str) {
  const t = figma.createText(); await fonts(labelSrc); t.fontName = labelSrc.getRangeFontName(0, 1);
  if (typeof labelSrc.textStyleId === 'string' && labelSrc.textStyleId) await t.setTextStyleIdAsync(labelSrc.textStyleId);
  t.characters = str; if (Array.isArray(labelSrc.fills)) t.fills = labelSrc.fills;
  return t;
}

// ---------- 1. Player result component: masaüstünde etiketler gizli, her iki cihazda gizli Value 2
let rowDesk = null;
await step('1 Player result component', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Player result');
  if (!set) throw new Error('Player result set yok');
  const log = [];
  for (const v of set.children) {
    const desk = /Device=Desktop/.test(v.name);
    const kf = v.findOne(n => n.type === 'FRAME' && n.name === 'Key facts');
    if (!kf) { log.push(v.name + ': Key facts yok; çocuklar ' + v.children.map(c => c.name).join(',')); continue; }
    const widths = [];
    for (const f of kf.children.filter(c => c.name === 'Fact')) {
      const label = f.findOne(n => n.type === 'TEXT' && n.name === 'Label'); if (!label) continue; const kind = label.characters;
      if (desk) label.visible = false;
      if (kind === 'Nationality' && !f.children.find(n => n.name === 'Value 2')) {
        const val = f.children.find(n => n.type === 'FRAME' && n.name === 'Value'); if (!val) throw new Error('Value yok: ' + v.name);
        const v2 = val.clone(); v2.name = 'Value 2'; f.appendChild(v2); v2.visible = false;
      }
      widths.push(kind + ' ' + Math.round(f.width));
    }
    if (desk && /Action=Message/.test(v.name) && /State=Default/.test(v.name)) rowDesk = v;
    log.push(v.name + ' ' + sz(v) + ' | ' + widths.join(', '));
  }
  if (!rowDesk) rowDesk = set.children.find(v => /Device=Desktop/.test(v.name));
  report.info.rowVariants = log;
});

// ---------- 2. Sayfalar
const listsOf = f => f.findAll(n => n.type === 'FRAME' && n.name === 'List card' && n.children.some(c => c.type === 'INSTANCE' && /^Player · /.test(c.name)));
await step('2 Masaüstü: başlık satırı (All + Players)', async () => {
  const sec = sub(web, /^Search results$/); const out = [];
  for (const nm of ['Search / All results · Desktop', 'Search / Players · Desktop']) {
    const f = fr(sec, nm); const lists = listsOf(f); out.push(nm + ' lists ' + lists.length);
    for (const list of lists) {
      for (const n of list.children.filter(c => c.name === 'Table header' || c.name === 'Divider · Header')) n.remove();
      const r1 = list.children.find(n => n.type === 'INSTANCE' && /^Player · /.test(n.name));
      const kfD = rowDesk.findOne(n => n.name === 'Key facts'), act = rowDesk.findOne(n => n.name === 'Actions');
      const hdr = figma.createFrame(); hdr.name = 'Table header'; hdr.fills = []; hdr.layoutMode = 'HORIZONTAL'; hdr.counterAxisAlignItems = 'CENTER';
      list.insertChild(0, hdr); hdr.layoutSizingHorizontal = 'FILL'; hdr.layoutSizingVertical = 'HUG';
      await copySpacing(rowDesk, hdr, ['paddingLeft', 'paddingRight', 'itemSpacing']); setGap(hdr, 'paddingTop', 8); setGap(hdr, 'paddingBottom', 8);
      const c1 = figma.createFrame(); c1.name = 'Cell · Player'; c1.fills = []; c1.layoutMode = 'HORIZONTAL'; hdr.appendChild(c1); c1.layoutSizingHorizontal = 'FILL'; c1.layoutSizingVertical = 'HUG';
      const pt = await mkText('Player'); pt.name = 'Hdr · Player'; c1.appendChild(pt);
      const kfh = figma.createFrame(); kfh.name = 'Cell · Key facts'; kfh.fills = []; kfh.layoutMode = 'HORIZONTAL'; hdr.appendChild(kfh); kfh.layoutSizingHorizontal = 'HUG'; kfh.layoutSizingVertical = 'HUG';
      await copySpacing(kfD, kfh, ['itemSpacing']);
      for (const k of Object.keys(COL)) { const t = await mkText(k); t.name = 'Hdr · ' + k; kfh.appendChild(t); t.textAutoResize = 'HEIGHT'; t.resize(COL[k], t.height); t.layoutSizingHorizontal = 'FIXED'; }
      const sp = figma.createFrame(); sp.name = 'Cell · Actions'; sp.fills = []; hdr.appendChild(sp); sp.resize(act.width, 1); sp.layoutSizingHorizontal = 'FIXED'; sp.layoutSizingVertical = 'FIXED';
      const d = list.findOne(n => n.name === 'Divider' && n.type === 'RECTANGLE'); if (d) { const d2 = d.clone(); d2.name = 'Divider · Header'; list.insertChild(1, d2); d2.layoutSizingHorizontal = 'FILL'; }
      // "Player" başlığını satırdaki ad metninin x'ine hizala (ölçerek)
      const rkf = r1.findOne(n => n.name === 'Key facts'), ract = r1.findOne(n => n.name === 'Actions');
      const names = r1.findAll(n => n.type === 'TEXT' && n.visible && !(rkf && contains(rkf, n)) && !(ract && contains(ract, n)));
      const nameT = names.sort((a, b) => b.fontSize - a.fontSize)[0];
      const want = nameT.absoluteBoundingBox.x - hdr.absoluteBoundingBox.x - hdr.paddingLeft;
      c1.paddingLeft = Math.max(0, Math.round(want));
      // hiza kontrolü
      const diffs = [];
      diffs.push('Player dx=' + Math.round(nameT.absoluteBoundingBox.x - pt.absoluteBoundingBox.x));
      for (const k of Object.keys(COL)) { const fact = rkf.children.find(c => c.name === 'Fact' && c.findOne(n => n.type === 'TEXT' && n.name === 'Label').characters === k); const h = kfh.children.find(c => c.name === 'Hdr · ' + k); diffs.push(k + ' dx=' + Math.round(fact.absoluteBoundingBox.x - h.absoluteBoundingBox.x)); }
      out.push('hiza (0 beklenir): ' + diffs.join(', ') + ' | header ' + sz(hdr) + ' | list ' + sz(list) + ' | row1 ' + sz(r1));
    }
  }
  report.info.desktop = out;
});
function contains(a, b) { let x = b; while (x) { if (x === a) return true; x = x.parent; } return false; }

// ---------- 3. Mateus: iki uyruk (masaüstü Players + All, mobil Players)
await step('3 Mateus iki uyruk', async () => {
  const out = [];
  for (const [plat, nm] of [[web, 'Search / All results · Desktop'], [web, 'Search / Players · Desktop'], [mob, 'Search / Players · Mobile'], [mob, 'Search / All results · Mobile']]) {
    const f = fr(sub(plat, /^Search results$/), nm);
    const m = f.findOne(n => n.type === 'INSTANCE' && /^Player · Mateus/.test(n.name)); if (!m) { out.push(nm + ': Mateus yok'); continue; }
    const v2 = m.findOne(n => n.name === 'Value 2'); if (!v2) throw new Error('Value 2 yok: ' + nm);
    const v1 = v2.parent.children.find(n => n.name === 'Value');
    const first = v1.findOne(n => n.type === 'TEXT' && n.name === 'Nation').characters;
    const second = first === 'France' ? 'Poland' : 'France';
    v2.visible = true; v2.findOne(n => n.type === 'INSTANCE' && n.name === 'Flag').setProperties({ Country: second });
    await setLabel(v2.findOne(n => n.type === 'TEXT' && n.name === 'Nation'), second);
    const fact = v2.parent;
    out.push(nm + ': ' + first + ' + ' + second + ' row ' + sz(m) + ' fact ' + Math.round(fact.width) + ' v2 ' + Math.round(v2.width) + ' v1 ' + Math.round(v1.width));
  }
  report.info.mateus = out;
});

// ---------- 4. Yükseklikler: Section ve ekran çakışması
await step('4 Section yeniden oturtma', async () => {
  const out = [];
  for (const plat of [web, mob]) {
    const sec = sub(plat, /^Search results$/); const kids = sec.children.filter(n => n.type === 'FRAME').sort((a, b) => a.y - b.y || a.x - b.x);
    let moved = 0;
    for (let i = 0; i < kids.length; i++) for (let j = 0; j < kids.length; j++) {
      const a = kids[i], b = kids[j]; if (a === b || b.y <= a.y) continue;
      const overlapX = a.x < b.x + b.width && b.x < a.x + a.width; if (!overlapX) continue;
      const gap = b.y - (a.y + a.height); if (gap < 80) { const dy = 160 - gap; for (const k of kids) if (k.y >= b.y && k.x < b.x + b.width && b.x < k.x + k.width) { k.y += dy; moved++; } }
    }
    let bt = 0, r = 0; for (const c of sec.children) { bt = Math.max(bt, c.y + c.height); r = Math.max(r, c.x + c.width); }
    const before = sz(sec); sec.resizeWithoutConstraints(Math.max(sec.width, r + 80), Math.max(sec.height, bt + 80));
    let pb = 0; for (const c of plat.children) pb = Math.max(pb, c.y + c.height); plat.resizeWithoutConstraints(plat.width, Math.max(plat.height, pb + 120));
    out.push(plat.name + ' moved ' + moved + ' | Search results ' + before + ' -> ' + sz(sec) + ' | platform ' + sz(plat));
    // çakışma taraması
    const bad = []; for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) { const a = kids[i], b = kids[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) bad.push(a.name + ' x ' + b.name); }
    out.push(plat.name + ' overlaps: ' + (bad.length ? bad.join(' | ') : 'none') + ' | heights ' + kids.map(k => k.name.replace('Search / ', '') + ' ' + Math.round(k.height)).join(', '));
  }
  report.info.sections = out;
});
await step('Prototip kontrolü', async () => {
  let total = 0, broken = 0;
  for (const n of p02.findAll(x => 'reactions' in x && x.reactions && x.reactions.length)) for (const r of n.reactions) for (const a of (r.actions || [])) if (a && a.type === 'NODE' && a.destinationId) { total++; const d = await figma.getNodeByIdAsync(a.destinationId); if (!d) broken++; }
  report.info.verify = 'links ' + total + ' broken ' + broken;
});
return report;
