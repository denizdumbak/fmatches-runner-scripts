// step 335 · Faz 5 geri bildirimi: My contacts "Connected (N)", Notifications "N unread", Shortlists: 15 mevki çipi, masaüstü sütun başlığı satırı, çoklu uyruk (Shortlist row component'inde Value 2)
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
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const fonts = async t => { for (const f of t.getRangeAllFontNames(0, Math.max(1, t.characters.length))) await figma.loadFontAsync(f); };
async function setLabel(node, str) { const t = node.type === 'TEXT' ? node : node.findOne(n => n.type === 'TEXT'); await fonts(t); t.characters = str; return t; }
// 12 ve 8 px için boşluk değişkeni (yoksa ham değer, raporlanır)
const floatVars = allVars.filter(v => v.resolvedType === 'FLOAT' && /space|spacing|gap/i.test(v.name));
const gapVar = px => floatVars.find(v => { const m = v.valuesByMode[Object.keys(v.valuesByMode)[0]]; return m === px; });
report.info.gapVars = { g12: gapVar(12) ? gapVar(12).name : 'YOK', g8: gapVar(8) ? gapVar(8).name : 'YOK' };
function setGap(n, key, px) { const v = gapVar(px); if (v) n.setBoundVariable(key, v); else n[key] = px; }
async function copySpacing(src, dst, keys) { for (const k of keys) { const a = src.boundVariables && src.boundVariables[k]; if (a) { const v = await figma.variables.getVariableByIdAsync(a.id); dst.setBoundVariable(k, v); } else dst[k] = src[k]; } }

// ---------- 1. My contacts: Connected (N)
await step('1 My contacts sayısı', async () => {
  const wsec = sub(web, /^My contacts$/), msec = sub(mob, /^My contacts$/);
  const mainW = fr(wsec, 'Contacts / My contacts · Desktop');
  const count = mainW.findAll(n => n.type === 'INSTANCE' && /^Contact · /.test(n.name)).length;
  report.info.connectedCount = count;
  const out = [];
  for (const sec of [wsec, msec]) for (const f of sec.children.filter(n => n.type === 'FRAME')) {
    const tab = f.findOne(n => /^Tab · Connected/.test(n.name)); if (!tab) { out.push(f.name + ': Connected sekmesi yok'); continue; }
    const n = /No contacts/.test(f.name) ? 0 : count;
    const t = await setLabel(tab, 'Connected (' + n + ')'); out.push(f.name + ' -> ' + t.characters + ' tab ' + Math.round(tab.width));
  }
  report.info.contactsTabs = out;
});

// ---------- 2. Notifications: N unread
let labelSrc = null;
await step('kaynak etiket stili (Shortlist row > Label)', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Shortlist row');
  labelSrc = set.findOne(n => n.type === 'TEXT' && n.name === 'Label'); if (!labelSrc) throw new Error('Label yok');
});
async function mkText(str, brand) {
  const t = figma.createText(); await fonts(labelSrc); t.fontName = labelSrc.getRangeFontName(0, 1);
  if (typeof labelSrc.textStyleId === 'string' && labelSrc.textStyleId) await t.setTextStyleIdAsync(labelSrc.textStyleId);
  t.characters = str; if (Array.isArray(labelSrc.fills)) t.fills = labelSrc.fills;
  if (brand) t.fills = [P(V('text/brand'))];
  return t;
}
await step('2 Notifications unread', async () => {
  const out = [];
  for (const [plat, dv] of [[web, 'Desktop'], [mob, 'Mobile']]) {
    const sec = sub(plat, /^Notifications$/); const f = fr(sec, 'Notifications / Notifications · ' + dv);
    const rows = f.findAll(n => n.type === 'INSTANCE' && /^Notification · /.test(n.name));
    let unread = 0;
    for (const r of rows) { const k = Object.keys(r.componentProperties).find(x => /^Unread/i.test(x)); if (k && String(r.componentProperties[k].value).toLowerCase() === 'true') unread++; }
    report.info['unread ' + dv] = unread + ' of ' + rows.length;
    const heading = f.findOne(n => n.name === 'Heading row'); const title = heading.findOne(n => n.type === 'TEXT' && n.name === 'Title');
    let grp = heading.children.find(n => n.name === 'Title group');
    if (!grp) { grp = figma.createFrame(); grp.name = 'Title group'; grp.fills = []; grp.layoutMode = 'HORIZONTAL'; grp.counterAxisAlignItems = 'CENTER'; heading.insertChild(0, grp); grp.layoutSizingHorizontal = 'HUG'; grp.layoutSizingVertical = 'HUG'; setGap(grp, 'itemSpacing', 12); grp.appendChild(title); }
    const old = grp.children.find(n => n.name === 'Unread count'); if (old) old.remove();
    if (unread > 0) { const t = await mkText(unread + ' unread', true); t.name = 'Unread count'; grp.appendChild(t); }
    out.push(dv + ': group ' + sz(grp) + ' heading ' + sz(heading));
  }
  report.info.notifHeading = out;
});
function sz(n) { return Math.round(n.width) + 'x' + Math.round(n.height); }

// ---------- 3a. Shortlist row component: etiketleri gizle (masaüstü), sabit sütun, Value 2 (ikinci uyruk)
const COL = { 'Age': 48, 'Nationality': 136, 'Contract until': 104 };
let rowDesk = null;
await step('3a Shortlist row component', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Shortlist row');
  const log = [];
  for (const v of set.children) {
    const desk = /Device=Desktop/.test(v.name);
    const kf = v.findOne(n => n.type === 'FRAME' && n.name === 'Key facts');
    for (const f of kf.children.filter(c => c.name === 'Fact')) {
      const label = f.findOne(n => n.type === 'TEXT' && n.name === 'Label'); const kind = label.characters;
      if (desk) { label.visible = false; f.layoutSizingHorizontal = 'FIXED'; f.resize(COL[kind], f.height); f.layoutSizingVertical = 'HUG'; }
      if (kind === 'Nationality' && !f.children.find(n => n.name === 'Value 2')) {
        const val = f.children.find(n => n.type === 'FRAME' && n.name === 'Value'); const v2 = val.clone(); v2.name = 'Value 2'; f.appendChild(v2); v2.visible = false;
      }
    }
    if (desk && /State=Default/.test(v.name)) rowDesk = v;
    log.push(v.name + ' ' + sz(v) + ' kf ' + sz(kf));
  }
  report.info.rowVariants = log;
});

// ---------- 3b. Shortlists sayfaları: mevki çipleri, Mateus iki uyruk, masaüstü başlık satırı
const POS = ['GK', 'RB', 'FB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'W', 'ST', 'SS'];
await step('3b Shortlists sayfaları', async () => {
  const out = [];
  for (const [plat, dv] of [[web, 'Desktop'], [mob, 'Mobile']]) {
    const sec = sub(plat, /^Shortlists$/); const f = fr(sec, 'Shortlists / Shortlists · ' + dv);
    const pf = f.findOne(n => n.type === 'FRAME' && n.name === 'Position filters');
    const chips = pf.children.filter(c => c.type === 'INSTANCE');
    const all = chips.find(c => /All$/.test(c.name)); const tpl = chips.find(c => c !== all && !/^Chip · (GK|RB|FB|CB|LB|CDM|CM|CAM|RM|LM|RW|LW|W|ST|SS)$/.test(c.name)) || chips.find(c => c !== all);
    const made = [];
    for (const code of POS) { const c = tpl.clone(); pf.appendChild(c); c.name = 'Chip · ' + code; await setLabel(c, code); made.push(c); }
    for (const c of chips) if (c !== all) c.remove();
    pf.layoutWrap = 'WRAP'; pf.counterAxisSpacing = pf.itemSpacing;
    out.push(dv + ' chips ' + pf.children.length + ' pf ' + sz(pf));
    // Mateus: iki uyruk
    const m = f.findOne(n => n.type === 'INSTANCE' && /Mateus/.test(n.name));
    const v2 = m.findOne(n => n.name === 'Value 2'); const v1 = v2.parent.children.find(n => n.name === 'Value');
    const first = v1.findOne(n => n.type === 'TEXT' && n.name === 'Nation').characters;
    const second = first === 'France' ? 'Poland' : 'France';
    v2.visible = true; v2.findOne(n => n.type === 'INSTANCE' && n.name === 'Flag').setProperties({ Country: second });
    await setLabel(v2.findOne(n => n.type === 'TEXT' && n.name === 'Nation'), second);
    out.push(dv + ' Mateus: ' + first + ' + ' + second + ' row ' + sz(m));
    // masaüstü: başlık satırı
    if (dv === 'Desktop') {
      const list = f.findOne(n => n.type === 'FRAME' && n.name === 'List card');
      for (const n of list.children.filter(c => c.name === 'Table header' || c.name === 'Divider · Header')) n.remove();
      const kfD = rowDesk.findOne(n => n.name === 'Key facts'), act = rowDesk.findOne(n => n.name === 'Actions');
      const hdr = figma.createFrame(); hdr.name = 'Table header'; hdr.fills = []; hdr.layoutMode = 'HORIZONTAL'; hdr.counterAxisAlignItems = 'CENTER';
      list.insertChild(0, hdr); hdr.layoutSizingHorizontal = 'FILL'; hdr.layoutSizingVertical = 'HUG';
      await copySpacing(rowDesk, hdr, ['paddingLeft', 'paddingRight', 'itemSpacing']); setGap(hdr, 'paddingTop', 8); setGap(hdr, 'paddingBottom', 8);
      const c1 = figma.createFrame(); c1.name = 'Cell · Player'; c1.fills = []; c1.layoutMode = 'HORIZONTAL'; hdr.appendChild(c1); c1.layoutSizingHorizontal = 'FILL'; c1.layoutSizingVertical = 'HUG';
      c1.paddingLeft = 40 + rowDesk.itemSpacing; c1.appendChild(await mkText('Player'));
      const kfh = figma.createFrame(); kfh.name = 'Cell · Key facts'; kfh.fills = []; kfh.layoutMode = 'HORIZONTAL'; hdr.appendChild(kfh); kfh.layoutSizingHorizontal = 'HUG'; kfh.layoutSizingVertical = 'HUG';
      await copySpacing(kfD, kfh, ['itemSpacing']);
      for (const k of Object.keys(COL)) { const t = await mkText(k); t.name = 'Hdr · ' + k; kfh.appendChild(t); t.textAutoResize = 'HEIGHT'; t.resize(COL[k], t.height); t.layoutSizingHorizontal = 'FIXED'; }
      const sp = figma.createFrame(); sp.name = 'Cell · Actions'; sp.fills = []; hdr.appendChild(sp); sp.resize(act.width, 1); sp.layoutSizingHorizontal = 'FIXED'; sp.layoutSizingVertical = 'FIXED';
      const d = list.findOne(n => n.name === 'Divider' && n.type === 'RECTANGLE'); const d2 = d.clone(); d2.name = 'Divider · Header'; list.insertChild(1, d2); d2.layoutSizingHorizontal = 'FILL';
      // hiza kontrolü
      const r1 = list.children.find(n => n.type === 'INSTANCE' && /^Player · /.test(n.name)); const rk = r1.findOne(n => n.name === 'Key facts');
      const diffs = [];
      for (const k of Object.keys(COL)) { const fact = rk.children.find(c => c.name === 'Fact' && c.findOne(n => n.type === 'TEXT' && n.name === 'Label').characters === k); const h = kfh.children.find(c => c.name === 'Hdr · ' + k); diffs.push(k + ' dx=' + Math.round(fact.absoluteBoundingBox.x - h.absoluteBoundingBox.x)); }
      out.push('hiza (0 beklenir): ' + diffs.join(', ') + ' | header ' + sz(hdr) + ' | list ' + sz(list));
    }
  }
  report.info.shortlists = out;
});

// ---------- Section / platform boyutları
await step('Section ve platform boyutu', async () => {
  const out = [];
  for (const plat of [web, mob]) {
    const sec = sub(plat, /^Shortlists$/); let b = 0, r = 0; for (const c of sec.children) { b = Math.max(b, c.y + c.height); r = Math.max(r, c.x + c.width); }
    const before = sz(sec); sec.resizeWithoutConstraints(Math.max(sec.width, r + 80), Math.max(sec.height, b + 80));
    let pb = 0; for (const c of plat.children) pb = Math.max(pb, c.y + c.height); plat.resizeWithoutConstraints(plat.width, Math.max(plat.height, pb + 120));
    out.push(plat.name + ' Shortlists ' + before + ' -> ' + sz(sec) + ' | platform ' + sz(plat));
  }
  report.info.sections = out;
});
await step('Prototip kontrolü', async () => {
  let total = 0, broken = 0;
  for (const n of p02.findAll(x => 'reactions' in x && x.reactions && x.reactions.length)) for (const r of n.reactions) for (const a of (r.actions || [])) if (a && a.type === 'NODE' && a.destinationId) { total++; const d = await figma.getNodeByIdAsync(a.destinationId); if (!d) broken++; }
  report.info.verify = 'links ' + total + ' broken ' + broken;
});
return report;
