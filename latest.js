// step 374 · yeni component "Filters button" (01 › 2 · Buttons & tags; Lucide list-filter ikonu, Default/Hover/Focus) + Shortlists ve Search "Button · Filters" instance'ları ona geçer
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
await figma.setCurrentPageAsync(p01);
const R = n => Math.round(n);
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
const FILTER_SVG = SV('<path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/>');
const btnSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Button'); if (!btnSet) throw new Error('Button seti yok');
const STATES = ['Default', 'Hover', 'Focus'];
let newSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Filters button');

await step('Filters button component', async () => {
  if (newSet) { report.info.component = 'zaten var, yeniden kurulmadi'; return; }
  const sec = btnSet.parent; if (!sec || sec.type !== 'SECTION') throw new Error('Button seti Section icinde degil: ' + (sec ? sec.type : 'yok'));
  let bottom = 0, left = Infinity; for (const k of sec.children) { bottom = Math.max(bottom, k.y + k.height); left = Math.min(left, k.x); }
  const origs = STATES.map(s => btnSet.children.find(v => v.name.indexOf('Style=Secondary') >= 0 && v.name.indexOf('State=' + s) >= 0));
  if (origs.some(o => !o)) throw new Error('Secondary varyantlari eksik');
  const clones = []; const notes = [];
  for (let i = 0; i < STATES.length; i++) {
    const c = origs[i].clone(); sec.appendChild(c); c.name = 'State=' + STATES[i];
    c.x = left + i * (R(origs[i].width) + 80 + 40); c.y = bottom + 120;
    const iconFrame = c.findOne(n => n.type === 'FRAME' && n.name === 'Icon'); if (!iconFrame) throw new Error('Icon yuvasi yok: ' + c.name);
    const label = c.findOne(n => n.type === 'TEXT' && n.name === 'Label');
    let colorName = 'color/text/primary';
    const fb = label.fills && label.fills[0] && label.fills[0].boundVariables && label.fills[0].boundVariables.color;
    if (fb) { const vv = await figma.variables.getVariableByIdAsync(fb.id); if (vv) colorName = vv.name; }
    iconFrame.visible = true;
    for (const k of iconFrame.children.slice()) k.remove();
    const g = mkIcon(FILTER_SVG, colorName, 16); iconFrame.appendChild(g);
    if (iconFrame.layoutMode === 'NONE') { g.x = 1; g.y = 1; }
    await figma.loadFontAsync(label.fontName); label.characters = 'Filters';
    notes.push(STATES[i] + ': ikon rengi ' + colorName + ' | icon frame layout ' + iconFrame.layoutMode + ' ' + R(iconFrame.width) + 'x' + R(iconFrame.height));
    clones.push(c);
  }
  newSet = figma.combineAsVariants(clones, sec); newSet.name = 'Filters button';
  // Label ozelligi
  const key = newSet.addComponentProperty('Label', 'TEXT', 'Filters');
  for (const v of newSet.children) { const lbl = v.findOne(n => n.type === 'TEXT' && n.name === 'Label'); lbl.componentPropertyReferences = { characters: key }; }
  // hover gecisi: orijinal Default'un tepkisini kopyala, hedefi yeni Hover'a cevir
  const defNew = newSet.children.find(v => /State=Default/.test(v.name)), hovNew = newSet.children.find(v => /State=Hover/.test(v.name));
  const origReact = origs[0].reactions || [];
  const mapped = origReact.length ? JSON.parse(JSON.stringify(origReact)).map(r => { (r.actions || []).forEach(a => { if (a.destinationId) a.destinationId = hovNew.id; }); return r; })
    : [{ trigger: { type: 'ON_HOVER' }, actions: [{ type: 'NODE', destinationId: hovNew.id, navigation: 'CHANGE_TO', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.15 }, preserveScrollPosition: false, resetVideoPosition: false }] }];
  await defNew.setReactionsAsync(mapped);
  // section kapsasin
  let r = 0, b = 0; for (const k of sec.children) { r = Math.max(r, k.x + k.width); b = Math.max(b, k.y + k.height); }
  sec.resizeWithoutConstraints(Math.max(R(sec.width), R(r + 80)), Math.max(R(sec.height), R(b + 80)));
  report.info.component = { notes, origReactions: origReact.length, set: R(newSet.width) + 'x' + R(newSet.height) + ' @' + R(newSet.x) + ',' + R(newSet.y), variants: newSet.children.map(v => v.name + ' ' + R(v.width) + 'x' + R(v.height)), labelProp: key };
});
await figma.setCurrentPageAsync(p02);

await step('instance gecisi', async () => {
  if (!newSet) throw new Error('Filters button seti yok');
  const def = newSet.children.find(v => /State=Default/.test(v.name));
  const insts = p02.findAll(n => n.type === 'INSTANCE' && n.name === 'Button · Filters');
  const rows = [];
  for (const inst of insts) {
    let top = inst; while (top.parent && top.parent.type !== 'PAGE' && top.parent.type !== 'SECTION') top = top.parent;
    const w0 = R(inst.width), h0 = R(inst.height), hs = inst.layoutSizingHorizontal;
    inst.swapComponent(def);
    rows.push(top.name + ': ' + w0 + 'x' + h0 + '(' + hs + ') -> ' + R(inst.width) + 'x' + R(inst.height) + '(' + inst.layoutSizingHorizontal + ') | etiket "' + (inst.findOne(n => n.type === 'TEXT') || { characters: '?' }).characters + '" | tepki ' + (inst.reactions ? inst.reactions.length : 0));
  }
  report.info.swapped = { count: insts.length, rows };
});

await step('kontrol', async () => {
  const s = newSet || p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Filters button'); const bad = { gray: [], unbound: [], unstyled: [] };
  for (const v of s.children) {
    for (const n of v.findAll(() => true)) {
      if ('fills' in n && Array.isArray(n.fills)) for (const p of n.fills) if (p.type === 'SOLID' && p.visible !== false && Math.abs(p.color.r - .5) < .003 && Math.abs(p.color.g - .5) < .003 && Math.abs(p.color.b - .5) < .003 && !(p.boundVariables && p.boundVariables.color)) bad.gray.push(v.name + ': ' + n.name);
      if (n.type === 'VECTOR' && n.strokes && n.strokes.length && !(n.strokes[0].boundVariables && n.strokes[0].boundVariables.color)) bad.unbound.push(v.name + ': ' + n.name);
      if (n.type === 'TEXT' && !n.textStyleId) bad.unstyled.push(v.name + ': ' + n.characters);
    }
  }
  const sec = s.parent; const overlaps = []; const sb = { x: s.x, y: s.y, w: s.width, h: s.height };
  for (const k of sec.children) if (k !== s && sb.x < k.x + k.width && k.x < sb.x + sb.w && sb.y < k.y + k.height && k.y < sb.y + sb.h) overlaps.push(k.name);
  report.info.check = { grayFills: bad.gray.length ? bad.gray : 0, unboundIconStroke: bad.unbound.length ? bad.unbound : 0, unstyledText: bad.unstyled.length ? bad.unstyled : 0, overlapsInSection: overlaps.length ? overlaps : 'none', section: s.parent.name + ' ' + R(s.parent.width) + 'x' + R(s.parent.height) };
});
return report;
