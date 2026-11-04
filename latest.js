// step 303 · design review hızlı düzeltmeler: (1) değeri çözülmemiş bağlı renkleri yeniden bağla (My settings gri alt cümleleri) · (2) Message bubble'da yarı saydam beyaz meta metni (1.2 MB · PDF) opaklık 1 · (3) text/brand tonu #0a783a (yeni primitive, bg/brand ve icon/brand değişmez)
const report = { done: [], errors: [], fixes: [] };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const hex = c => '#' + [c.r, c.g, c.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
const p01 = figma.root.children.find(p => /^01/.test(p.name));
const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
let vars = await figma.variables.getLocalVariablesAsync();
let byId = new Map(vars.map(v => [v.id, v]));
function resolve(v, d) {
  const val = v.valuesByMode[Object.keys(v.valuesByMode)[0]];
  if (val && val.type === 'VARIABLE_ALIAS' && (d || 0) < 6) { const t = byId.get(val.id); return t ? resolve(t, (d || 0) + 1) : null; }
  return val;
}
const same = (a, b) => Math.abs(a.r - b.r) < 0.004 && Math.abs(a.g - b.g) < 0.004 && Math.abs(a.b - b.b) < 0.004;
const lin = v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
const lum = c => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
const ratio = (a, b) => { const x = lum(a), y = lum(b); return Math.round((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) * 100) / 100; };

// (3) önce token: sonraki adımlar doğru değeri görsün
await step('3 text/brand tonu', async () => {
  const tb = vars.find(v => v.name === 'color/text/brand');
  const raw = tb.valuesByMode[Object.keys(tb.valuesByMode)[0]];
  const before = resolve(tb);
  const target = { r: 10 / 255, g: 120 / 255, b: 58 / 255, a: 1 };
  if (same(before, target)) { report.fixes.push('3 zaten #0a783a'); return; }
  if (raw && raw.type === 'VARIABLE_ALIAS') {
    const prim = byId.get(raw.id);
    const col = await figma.variables.getVariableCollectionByIdAsync(prim.variableCollectionId);
    const nm = /\d+$/.test(prim.name) ? prim.name.replace(/\d+$/, m => String(+m + 50)) : prim.name + '-text';
    let nv = vars.find(v => v.name === nm && v.variableCollectionId === col.id);
    if (!nv) { nv = figma.variables.createVariable(nm, col, 'COLOR'); for (const m of col.modes) nv.setValueForMode(m.modeId, target); }
    for (const modeId of Object.keys(tb.valuesByMode)) tb.setValueForMode(modeId, figma.variables.createVariableAlias(nv));
    report.fixes.push(`3 text/brand: ${prim.name} ${hex(before)} -> ${nm} #0a783a (${prim.name} yerinde kaldı)`);
  } else {
    for (const modeId of Object.keys(tb.valuesByMode)) tb.setValueForMode(modeId, target);
    report.fixes.push(`3 text/brand: ${hex(before)} -> #0a783a (alias değildi, doğrudan değer)`);
  }
  vars = await figma.variables.getLocalVariablesAsync(); byId = new Map(vars.map(v => [v.id, v]));
  const sub = resolve(vars.find(v => v.name === 'color/bg/subtle')), surf = resolve(vars.find(v => v.name === 'color/bg/surface')), nb = resolve(vars.find(v => v.name === 'color/text/brand'));
  const bgb = resolve(vars.find(v => v.name === 'color/bg/brand'));
  report.fixes.push(`3 kontrol: text/brand ${hex(nb)} · bg/subtle üstünde ${ratio(nb, sub)}:1 · beyazda ${ratio(nb, surf)}:1 · bg/brand değişmedi ${hex(bgb)}`);
});

// (1) bağlı ama çözülmemiş renkler (01 ve 02)
await step('1 çözülmemiş bağlı renkler', async () => {
  let fixed = 0, checked = 0; const ex = new Map();
  for (const page of [p01, p02]) {
    const nodes = page.findAll(n => n.type === 'TEXT' || n.type === 'FRAME' || n.type === 'RECTANGLE' || n.type === 'COMPONENT' || n.type === 'INSTANCE' || n.type === 'ELLIPSE');
    for (const n of nodes) {
      if (!('fills' in n) || n.fills === figma.mixed || !n.fills.length) continue;
      let changed = false;
      const fills = n.fills.map(p => {
        if (p.type !== 'SOLID' || !p.boundVariables || !p.boundVariables.color) return p;
        checked++;
        const v = byId.get(p.boundVariables.color.id); if (!v) return p;
        const want = resolve(v); if (!want || same(p.color, want)) return p;
        changed = true;
        const k = `${v.name} ${hex(p.color)} -> ${hex(want)}`; ex.set(k, (ex.get(k) || 0) + 1);
        const np = figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: want.r, g: want.g, b: want.b }, opacity: p.opacity === undefined ? 1 : p.opacity, visible: p.visible !== false }, 'color', v);
        return np;
      });
      if (changed) { n.fills = fills; fixed++; }
    }
  }
  report.fixes.push(`1 bağlı boya tarandı ${checked}, düzeltilen node ${fixed}`);
  report.unresolvedByVar = [...ex.entries()].map(([k, c]) => `${c}x ${k}`);
});

// (2) Message bubble meta opaklığı
await step('2 bubble meta opaklık', async () => {
  const inv = vars.find(v => v.name === 'color/text/inverse');
  const isInv = n => n.fills !== figma.mixed && n.fills.length && n.fills[0].boundVariables && n.fills[0].boundVariables.color && n.fills[0].boundVariables.color.id === inv.id;
  const sets = p01.findAll(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && /^Message bubble/.test(n.name));
  let comp = 0; const seen = [];
  for (const s of sets) for (const t of s.findAll(n => n.type === 'TEXT' && n.opacity < 0.99 && n.opacity > 0.3 && isInv(n))) { seen.push(`${s.name} › "${t.characters.slice(0, 16)}" ${Math.round(t.opacity * 100)}%`); t.opacity = 1; comp++; }
  let inst = 0;
  for (const t of p02.findAll(n => n.type === 'TEXT' && n.opacity < 0.99 && n.opacity > 0.3 && isInv(n))) {
    let x = t.parent, inBubble = false; while (x && x.type !== 'SECTION') { if (x.name === 'Bubble' || /^Message bubble/.test(x.name)) { inBubble = true; break; } x = x.parent; }
    if (inBubble) { t.opacity = 1; inst++; }
  }
  const left = p02.findAll(n => n.type === 'TEXT' && /MB · PDF/.test(n.characters) && n.opacity < 0.99).length;
  report.fixes.push(`2 component metni ${comp}, sayfa override ${inst}, kalan yarı saydam "MB · PDF" ${left} (0 olmalı)`);
  report.bubbleMeta = seen.slice(0, 8);
});

// kontrol: My settings alt cümleleri
await step('kontrol', async () => {
  const s = p02.findAll(n => n.type === 'FRAME' && /^Settings \/ My settings · (Desktop|Mobile)$/.test(n.name));
  report.settingsGray = s.map(f => `${f.name}: ${f.findAll(n => n.type === 'TEXT' && n.fills !== figma.mixed && n.fills.length && n.fills[0].color && hex(n.fills[0].color) === '#808080').length} gri metin (0 olmalı)`);
});
return report;
