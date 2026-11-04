// step 308 · hover: Icon button, Filter chip, Role card (yeni State özelliği), Calendar day, Map marker için State=Hover varyantı + ON_HOVER CHANGE_TO 0.15 · 02'de kendi tıklama bağlantısı olan instance'lara da hover eklenir · yerleşim kontrolü
const report = { done: [], errors: [], sets: [], fixes: [], moved: [] };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const p01 = figma.root.children.find(p => /^01/.test(p.name));
const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
await figma.setCurrentPageAsync(p01);
const vars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = vars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
function resolve(v, d) { const val = v.valuesByMode[Object.keys(v.valuesByMode)[0]]; if (val && val.type === 'VARIABLE_ALIAS' && (d || 0) < 6) { const t = vars.find(x => x.id === val.id); return t ? resolve(t, (d || 0) + 1) : null; } return val; }
const BP = name => { const v = V(name); const c = resolve(v); return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: c.r, g: c.g, b: c.b } }, 'color', v); };
const boundName = p => { if (!p || !p.boundVariables || !p.boundVariables.color) return null; const v = vars.find(x => x.id === p.boundVariables.color.id); return v ? v.name : null; };
const BB = n => n.absoluteBoundingBox;
const getSet = nm => { const s = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === nm); if (!s) throw new Error('set yok: ' + nm); return s; };
const blockOf = s => { let x = s; while (x.parent && x.parent.type !== 'SECTION') x = x.parent; return x; };
const before = new Map();
function remember(s) { const b = blockOf(s); if (!before.has(b.id)) before.set(b.id, { node: b, box: Object.assign({}, BB(b)) }); }
const hoverReact = dest => ({ trigger: { type: 'ON_HOVER' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'CHANGE_TO', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.15 }, preserveScrollPosition: false, resetVideoPosition: false }] });
const pairs = []; // [default, hover]

async function makeHover(s, srcRe, nameFrom, styleFn) {
  remember(s);
  for (const c of s.children.filter(c => /State=Hover/.test(c.name))) c.remove();
  const srcs = s.children.filter(c => srcRe.test(c.name));
  for (const src of srcs) {
    const cl = src.clone(); s.appendChild(cl); cl.name = nameFrom(src.name);
    await cl.setReactionsAsync([]);
    const ring = cl.findOne(n => n.name === 'Focus ring'); if (ring) ring.remove();
    if (s.layoutMode === 'NONE') {
      const row = s.children.filter(c => c !== cl && c.y < src.y + src.height && c.y + c.height > src.y);
      cl.x = Math.max.apply(null, row.map(c => c.x + c.width)) + 40; cl.y = src.y;
    }
    await styleFn(cl, src);
    const keep = (src.reactions || []).filter(r => !(r.trigger && r.trigger.type === 'ON_HOVER'));
    await src.setReactionsAsync(keep.concat([hoverReact(cl)]));
    pairs.push([src, cl]);
  }
  if (s.layoutMode && s.layoutMode !== 'NONE') { s.primaryAxisSizingMode = 'AUTO'; s.counterAxisSizingMode = 'AUTO'; }
  else { let r = 0, b = 0; for (const c of s.children) { r = Math.max(r, c.x + c.width); b = Math.max(b, c.y + c.height); } s.resizeWithoutConstraints(R(r + 24), R(b + 24)); }
  report.sets.push(`${s.name}: +${srcs.length} Hover · toplam ${s.children.length} varyant`);
}
function recolorIcons(node, from, to) {
  let n = 0;
  for (const v of node.findAll(x => x.type === 'VECTOR' || x.type === 'BOOLEAN_OPERATION' || x.type === 'ELLIPSE' || x.type === 'RECTANGLE' || x.type === 'LINE')) {
    if (v.strokes && v.strokes.length && boundName(v.strokes[0]) === from) { v.strokes = [BP(to)]; n++; }
    if (v.fills && v.fills !== figma.mixed && v.fills.length && boundName(v.fills[0]) === from) { v.fills = [BP(to)]; n++; }
  }
  return n;
}

await step('1 Icon button', async () => {
  const s = getSet('Icon button'); const log = [];
  await makeHover(s, /State=Default/, n => n.replace('State=Default', 'State=Hover'), async (c) => {
    const f = c.fills.length ? boundName(c.fills[0]) : null;
    let to;
    if (f === 'color/bg/brand') to = 'color/bg/brand-hover';
    else if (f === 'color/bg/subtle') { to = 'color/bg/brand-subtle'; recolorIcons(c, 'color/icon/default', 'color/icon/brand'); }
    else { to = 'color/bg/subtle'; }
    c.fills = [BP(to)];
    log.push(`${c.name.replace(', State=Hover', '')}: ${f ? f.replace('color/', '') : 'yok'} -> ${to.replace('color/', '')}`);
  });
  report.iconButtonHover = log;
});
await step('2 Filter chip', async () => {
  await makeHover(getSet('Filter chip'), /^State=Default$/, () => 'State=Hover', async c => { c.strokes = [BP('color/border/strong')]; });
});
await step('3 Role card', async () => {
  const s = getSet('Role card');
  for (const c of s.children) if (!/State=/.test(c.name)) c.name = c.name + ', State=Default';
  await makeHover(s, /State=Default/, n => n.replace('State=Default', 'State=Hover'), async c => {
    const t = c.findOne(n => n.name === 'Title' && n.type === 'TEXT'); if (t) t.fills = [BP('color/text/brand')];
  });
});
await step('4 Calendar day', async () => {
  await makeHover(getSet('Calendar day'), /State=Default/, n => n.replace('State=Default', 'State=Hover'), async c => { c.fills = [BP('color/bg/subtle')]; });
});
await step('5 Map marker', async () => {
  const fx = (await figma.getLocalEffectStylesAsync()).find(e => e.name === 'Shadow/Raised'); if (!fx) throw new Error('Shadow/Raised yok');
  await makeHover(getSet('Map marker'), /State=Default/, n => n.replace('State=Default', 'State=Hover'), async c => { await c.setEffectStyleIdAsync(fx.id); });
});

// 02: kendi bağlantısı olan instance'lara hover ekle
await step('6 instance hover', async () => {
  const map = new Map(pairs.map(([d, h]) => [d.id, h]));
  let added = 0, inherited = 0, total = 0;
  for (const inst of p02.findAll(n => n.type === 'INSTANCE')) {
    const m = await inst.getMainComponentAsync(); if (!m || !map.has(m.id)) continue;
    total++;
    const rs = inst.reactions || [];
    if (rs.some(r => r.trigger && r.trigger.type === 'ON_HOVER')) { inherited++; continue; }
    await inst.setReactionsAsync(rs.concat([hoverReact(map.get(m.id))]));
    added++;
  }
  report.fixes.push(`6 02'de instance ${total}: hover zaten var ${inherited}, eklenen ${added}`);
});

// yerleşim
await step('7 yerleşim', async () => {
  for (const { node: b, box: o } of before.values()) {
    const nb = BB(b); const dy = (nb.y + nb.height) - (o.y + o.height); const dx = (nb.x + nb.width) - (o.x + o.width);
    const sec = b.parent;
    for (const k of sec.children) {
      if (k === b) continue; const kb = BB(k); if (!kb) continue;
      if (dy > 0 && kb.x < o.x + o.width + Math.max(dx, 0) && kb.x + kb.width > o.x && kb.y >= o.y + o.height - 1) { k.y += dy; report.moved.push(`${sec.name} › ${k.name} +${R(dy)}`); }
      else if (dx > 0 && kb.y < o.y + o.height && kb.y + kb.height > o.y && kb.x >= o.x + o.width - 1) { k.x += dx; report.moved.push(`${sec.name} › ${k.name} x+${R(dx)}`); }
    }
  }
  const secs = p01.children.filter(n => n.type === 'SECTION');
  for (const sec of secs) { let r = 0, bt = 0; for (const k of sec.children) { r = Math.max(r, k.x + k.width); bt = Math.max(bt, k.y + k.height); } if (r + 80 > sec.width || bt + 80 > sec.height) sec.resizeWithoutConstraints(Math.max(sec.width, R(r + 80)), Math.max(sec.height, R(bt + 80))); }
  secs.sort((a, b) => a.x - b.x);
  for (let i = 1; i < secs.length; i++) { const want = secs[i - 1].x + secs[i - 1].width + 160; if (secs[i].x < want) secs[i].x = want; }
  const inter = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
  const out = [];
  for (const sec of secs) { const k = sec.children; for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) { const a = BB(k[i]), c = BB(k[j]); if (a && c && inter(a, c)) out.push(`${sec.name}: ${k[i].name} x ${k[j].name}`); } }
  report.overlaps01 = out.length ? out.slice(0, 12) : 'none';
  const so = []; for (let i = 0; i < secs.length; i++) for (let j = i + 1; j < secs.length; j++) if (inter(BB(secs[i]), BB(secs[j]))) so.push(secs[i].name + ' x ' + secs[j].name);
  report.sectionOverlaps = so.length ? so : 'none';
});

// kontrol
await step('8 kontrol', async () => {
  let broken = 0, links = 0;
  for (const n of p02.findAll(n => n.reactions && n.reactions.length)) for (const r of n.reactions) for (const a of (r.actions || [])) if (a && a.type === 'NODE') { links++; if (!a.destinationId || !(await figma.getNodeByIdAsync(a.destinationId))) broken++; }
  report.prototype = `02 bağlantı ${links}, kırık ${broken}`;
  const ib = getSet('Icon button'); const g = ib.variantGroupProperties;
  report.iconButtonProps = Object.keys(g).map(k => `${k}: ${g[k].values.join('/')}`);
});
return report;
