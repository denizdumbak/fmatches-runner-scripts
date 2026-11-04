// step 302 · salt okunur tasarım denetimi (design review rubriği): token listesi, metin stilleri, component durumları, 02'de kontrast / 12 px altı / stilsiz metin / satır uzunluğu / boşluk ve köşe değerleri / bağlanmamış renk / mobil dokunma alanı / prototip geçişleri. Hiçbir şey değiştirmez.
const report = { done: [], errors: [] };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const r2 = n => Math.round(n * 100) / 100;
const hex = c => '#' + [c.r, c.g, c.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
const p01 = figma.root.children.find(p => /^01/.test(p.name));
const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();

// ---------- renk yardımcıları ----------
const lin = v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
const lum = c => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const blend = (fg, a, bg) => ({ r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a) });

// ---------- A. tokenlar ----------
const vars = await figma.variables.getLocalVariablesAsync();
const byId = new Map(vars.map(v => [v.id, v]));
function resolve(v, depth) {
  const val = v.valuesByMode[Object.keys(v.valuesByMode)[0]];
  if (val && val.type === 'VARIABLE_ALIAS' && (depth || 0) < 6) { const t = byId.get(val.id); return t ? resolve(t, (depth || 0) + 1) : null; }
  return val;
}
await step('A tokens', async () => {
  report.colors = vars.filter(v => v.resolvedType === 'COLOR' && /^color\//.test(v.name)).map(v => { const c = resolve(v); return `${v.name} ${c ? hex(c) + (c.a !== undefined && c.a < 1 ? ' a' + r2(c.a) : '') : '?'}`; });
  report.dims = vars.filter(v => v.resolvedType === 'FLOAT').map(v => `${v.name} ${resolve(v)}`).join(' · ');
});
const styles = await figma.getLocalTextStylesAsync();
const styleById = new Map(styles.map(s => [s.id, s]));
await step('A text styles', async () => {
  report.textStyles = styles.map(s => {
    const lh = s.lineHeight.unit === 'PIXELS' ? s.lineHeight.value : s.lineHeight.unit === 'PERCENT' ? R(s.fontSize * s.lineHeight.value / 100) : 'auto';
    const ls = s.letterSpacing.unit === 'PERCENT' ? s.letterSpacing.value + '%' : s.letterSpacing.value + 'px';
    return `${s.name} · ${s.fontName.family} ${s.fontName.style} ${s.fontSize}/${lh} ls ${ls}${typeof lh === 'number' ? ' (x' + r2(lh / s.fontSize) + ')' : ''}`;
  });
});

// ---------- B. component durumları (01) ----------
await step('B component states', async () => {
  const sets = p01.findAll(n => n.type === 'COMPONENT_SET');
  report.componentSets = sets.length;
  const INTER = /^(Button|Icon button|Filter chip|Tag|Form field|Checkbox|Option row|Role option|Link row|Social icon|Menu row|Edit button|Chat list item|Event row|Calendar day|Club entry|Google button|Switch|Person row|Gallery photo|Preview|Role card|Map marker|Menu link)/i;
  report.interactiveStates = sets.filter(s => INTER.test(s.name)).map(s => {
    const g = s.variantGroupProperties || {};
    const st = Object.keys(g).find(k => /state/i.test(k));
    const vals = st ? g[st].values : [];
    const miss = ['Hover', 'Focus', 'Disabled'].filter(x => !vals.some(v => new RegExp(x, 'i').test(v)));
    return `${s.name}: ${st ? vals.join('/') : 'State yok'}${miss.length ? '  -> eksik: ' + miss.join(', ') : ''}`;
  });
});

// ---------- C. 02 ekran taraması ----------
const SKIPN = /^(Flag|Club crest|Pitch|Silhouette|Flow ·|Note ·|Map area|Map tint|Hero visual|Player photo|Person photo|Photo|Lightbox|Scrim)/;
const ICONISH = n => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || n.type === 'STAR' || n.type === 'LINE' || n.type === 'POLYGON';
const screens = [];
for (const plat of p02.children.filter(n => n.type === 'SECTION')) for (const sec of plat.children.filter(n => n.type === 'SECTION'))
  for (const s of sec.children) if (s.type === 'FRAME' && !/^Flow ·/.test(s.name)) screens.push({ plat: plat.name, sec: sec.name, s });
report.screens = `${screens.length} (Web ${screens.filter(x => x.plat === 'Web').length}, Mobile ${screens.filter(x => x.plat === 'Mobile').length})`;

const contrastFails = new Map(), small = new Map(), unstyled = new Map(), longLines = new Map(), sizes = new Map();
const spacingOff = new Map(), radiusOff = new Map(), unboundFill = new Map(), taps = new Map(), trans = new Map();
let textCount = 0, onImage = 0, nodeCount = 0;
const add = (m, k, ex) => { const g = m.get(k) || { n: 0, ex }; g.n++; m.set(k, g); };
const top = (m, n) => [...m.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, n || 25).map(([k, g]) => `${g.n}x ${k} · ${g.ex}`);
const solidOf = n => { if (!('fills' in n) || n.fills === figma.mixed) return null; const f = n.fills.filter(p => p.visible !== false); if (!f.length) return null; const p = f[f.length - 1]; return p; };

function bgFor(node) {
  let x = node.parent, layers = [];
  while (x && x.type !== 'SECTION' && x.type !== 'PAGE') {
    const p = solidOf(x);
    if (p) {
      if (p.type !== 'SOLID') return 'image';
      const a = (p.opacity === undefined ? 1 : p.opacity) * (x.opacity === undefined ? 1 : x.opacity);
      layers.push({ c: p.color, a });
      if (a >= 0.99) break;
    }
    x = x.parent;
  }
  let bg = { r: 1, g: 1, b: 1 };
  for (let i = layers.length - 1; i >= 0; i--) bg = blend(layers[i].c, layers[i].a, bg);
  return bg;
}
const isOnToken = (v, set) => set.indexOf(v) >= 0;
const SPACE = [0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96];
const RADII = [0, 2, 4, 8, 12, 20, 999];

async function scan(n, ctx) {
  if (n.visible === false) return;
  nodeCount++;
  if (n !== ctx.s && SKIPN.test(n.name)) return;
  if (ICONISH(n)) return;
  // prototip geçişleri
  if (n.reactions && n.reactions.length) for (const r of n.reactions) for (const a of (r.actions || [])) {
    if (!a || a.type !== 'NODE') continue;
    const t = a.transition; const k = `${r.trigger ? r.trigger.type : '?'} ${a.navigation} ${t ? t.type + ' ' + t.duration + 's ' + (t.easing ? t.easing.type : '') : 'instant'}`;
    add(trans, k, `${ctx.s.name} › ${n.name}`);
  }
  // mobil dokunma alanı
  if (ctx.plat === 'Mobile' && n.type === 'INSTANCE') {
    let m = null; try { m = await n.getMainComponentAsync(); } catch (e) {}
    const setName = m ? (m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent.name : m.name) : '';
    if (/^(Button|Icon button|Filter chip|Checkbox|Social icon|Edit button|Switch|Menu row|Link row|Option row|Role option)/.test(setName) && n.reactions && n.reactions.length) {
      if (n.width < 44 || n.height < 44) add(taps, `${setName} ${R(n.width)}x${R(n.height)}`, `${ctx.sec} › ${ctx.s.name} › ${n.name}`);
    }
  }
  // metin
  if (n.type === 'TEXT') {
    textCount++;
    const fs = n.fontSize === figma.mixed ? null : n.fontSize;
    const st = n.textStyleId && n.textStyleId !== figma.mixed ? styleById.get(n.textStyleId) : null;
    const fam = n.fontName === figma.mixed ? 'mixed' : n.fontName.family;
    if (!st) add(unstyled, `${fam} ${fs}`, `${ctx.sec} › ${ctx.s.name} › "${n.characters.slice(0, 24)}"`);
    if (fs) add(sizes, `${fam} ${fs}`, st ? st.name : 'stilsiz');
    if (fs && fs < 12) add(small, `${fam} ${fs}`, `${ctx.sec} › ${ctx.s.name} › "${n.characters.slice(0, 24)}"`);
    if (fs && fs <= 18 && n.characters.length > 120 && n.textAutoResize !== 'WIDTH_AND_HEIGHT') {
      const cpl = R(n.width / (fs * 0.5));
      if (cpl > 85 || cpl < 35) add(longLines, `~${cpl} karakter/satır (${fs}px, ${R(n.width)}w)`, `${ctx.sec} › ${ctx.s.name} › "${n.characters.slice(0, 24)}"`);
    }
    const p = solidOf(n);
    if (p && p.type === 'SOLID' && fs) {
      const bg = bgFor(n);
      if (bg === 'image') onImage++;
      else {
        const a = (p.opacity === undefined ? 1 : p.opacity) * (n.opacity === undefined ? 1 : n.opacity);
        const fg = blend(p.color, a, bg);
        const cr = ratio(fg, bg);
        const w = n.fontWeight === figma.mixed ? 400 : n.fontWeight;
        const large = fs >= 24 || (fs >= 18.66 && w >= 700);
        const need = large ? 3 : 4.5;
        if (cr < need) {
          let vn = ''; try { const bv = p.boundVariables && p.boundVariables.color; if (bv) { const v = byId.get(bv.id); vn = v ? v.name.replace('color/', '') : ''; } } catch (e) {}
          add(contrastFails, `${hex(fg)}${vn ? ' (' + vn + ')' : ''} on ${hex(bg)} = ${r2(cr)}:1 (gerekli ${need}, ${fs}px)`, `${ctx.sec} › ${ctx.s.name} › "${n.characters.slice(0, 24)}"`);
        }
      }
    }
    return;
  }
  // boşluk / köşe / renk
  if ('layoutMode' in n && n.layoutMode !== 'NONE' && n.type !== 'INSTANCE') {
    const bv = n.boundVariables || {};
    const props = ['itemSpacing', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'];
    for (const k of props) {
      const v = n[k]; if (typeof v !== 'number' || bv[k]) continue;
      if (!isOnToken(v, SPACE) && !(k === 'itemSpacing' && n.primaryAxisAlignItems === 'SPACE_BETWEEN')) add(spacingOff, `${k.replace('padding', 'pad ')} ${r2(v)}`, `${ctx.sec} › ${ctx.s.name} › ${n.name}`);
    }
  }
  if ('cornerRadius' in n && n.type !== 'INSTANCE' && n !== ctx.s) {
    const cr = n.cornerRadius; const bv = n.boundVariables || {};
    if (typeof cr === 'number' && cr > 0 && !bv.topLeftRadius && !isOnToken(cr, RADII) && cr < Math.min(n.width, n.height) / 2 - 0.5) add(radiusOff, `radius ${r2(cr)}`, `${ctx.sec} › ${ctx.s.name} › ${n.name}`);
  }
  if ('fills' in n && n.fills !== figma.mixed && n.type !== 'INSTANCE') {
    for (const p of n.fills) if (p.visible !== false && p.type === 'SOLID' && !(p.boundVariables && p.boundVariables.color)) add(unboundFill, hex(p.color), `${ctx.sec} › ${ctx.s.name} › ${n.name}`);
  }
  if ('children' in n) for (const k of n.children) await scan(k, ctx);
}

await step('C scan 02', async () => {
  for (const x of screens) await scan(x.s, x);
  report.scanned = `${nodeCount} node, ${textCount} metin, ${onImage} metin fotoğraf/gradyan üstünde (kontrast ölçülmedi)`;
  report.contrastFails = top(contrastFails, 30);
  report.under12px = top(small, 15);
  report.unstyledText = top(unstyled, 15);
  report.lineLength = top(longLines, 15);
  report.fontSizesUsed = [...sizes.entries()].sort((a, b) => b[1].n - a[1].n).map(([k, g]) => `${k} ${g.n}x`).join(' · ');
  report.spacingOffScale = top(spacingOff, 25);
  report.radiusOffToken = top(radiusOff, 15);
  report.unboundFills = top(unboundFill, 20);
  report.mobileTapUnder44 = top(taps, 25);
  report.prototypeTransitions = top(trans, 20);
});
return report;
