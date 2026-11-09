// step 352 · Women's club notu: salt okunur ölçüm (Page notice ve Tag renk/altı çizgi/metin stili; kullanılabilir küçük metin stilleri ve nötr metin değişkenleri)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const hex = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
async function paint(n) {
  const f = n.fills; if (!f || f === figma.mixed || !f.length) return 'none';
  const p = f[0]; if (p.type !== 'SOLID') return p.type;
  const b = n.boundVariables && n.boundVariables.fills && n.boundVariables.fills[0];
  let v = ''; if (b) { const vr = await figma.variables.getVariableByIdAsync(b.id); v = vr ? ' [' + vr.name + ']' : ''; }
  return hex(p.color) + v;
}
async function describe(root) {
  const out = [];
  for (const n of [root].concat(root.findAll(() => true))) {
    if (n.type === 'TEXT') {
      const st = n.textStyleId && n.textStyleId !== figma.mixed ? await figma.getStyleByIdAsync(n.textStyleId) : null;
      out.push({ t: 'TEXT', name: n.name, text: n.characters.slice(0, 60), size: n.fontSize, deco: n.textDecoration, color: await paint(n), style: st ? st.name : null });
    } else if (n.type === 'FRAME' || n.type === 'INSTANCE' || n.type === 'RECTANGLE') {
      const sw = n.strokes && n.strokes.length ? n.strokeWeight : 0;
      out.push({ t: n.type, name: n.name, size: Math.round(n.width) + 'x' + Math.round(n.height), fill: await paint(n), stroke: sw });
    }
  }
  return out;
}
await step('Page notice ve Tag', async () => {
  report.info.card = {};
  for (const dev of ['Desktop', 'Mobile']) {
    const f = p02.findAll(n => n.type === 'FRAME' && n.name === "Clubs / Club card / Women's club · " + dev)[0];
    if (!f) { report.info.card[dev] = 'frame yok'; continue; }
    const pn = f.findOne(n => n.name === "Page notice · Women's club"), tag = f.findOne(n => n.name === "Tag · Women's club");
    report.info.card[dev] = { notice: pn ? await describe(pn) : 'yok', tag: tag ? await describe(tag) : 'yok' };
    if (dev === 'Desktop') report.info.card.noticeParent = pn ? pn.parent.name : null;
  }
});
await step('Metin stilleri ve nötr değişkenler', async () => {
  const ts = await figma.getLocalTextStylesAsync();
  report.info.smallStyles = ts.filter(s => s.fontSize <= 14).map(s => s.name + ' ' + s.fontSize);
  const vs = await figma.variables.getLocalVariablesAsync('COLOR');
  report.info.textColors = vs.filter(v => /^(color\/)?text\//.test(v.name)).map(v => v.name);
});
return report;
