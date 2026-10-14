// step 97 · Koyu yuzey renkleri: degiskenler adla aranip Foundations'a eklendi

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const page0 = figma.root.children.find(p => /^01/.test(p.name));
await page0.loadAsync();

const allVars = await figma.variables.getLocalVariablesAsync('COLOR');
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);

await step('Inverse renkler eklendi', async () => {
  const invVars = allVars.filter(v => /inverse/i.test(v.name));
  report.info['inverse gecen degiskenler'] = invVars.map(v => v.name);

  const bgInv = invVars.find(v => /bg.*inverse$/i.test(v.name));
  const sw = page0.findOne(n => n.name === 'Swatch · Surface');
  if (!sw) throw new Error('ornek swatch yok');
  const container = sw.parent;

  const existing = container.findAll(n => n.type === 'TEXT').map(t => t.characters);
  const todo = invVars.filter(v => v !== bgInv && !existing.includes(v.name));
  const nice = n => n.split('/').slice(-2).join(' ').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const out = [];
  for (const v of todo) {
    const label = nice(v.name);
    const old = container.children.find(c => c.name === 'Swatch · ' + label);
    if (old) old.remove();
    const c = sw.clone();
    c.name = 'Swatch · ' + label;
    container.appendChild(c);
    const chip = c.findOne(n => n.type !== 'TEXT' && 'fills' in n && n.fills !== figma.mixed && n.fills.length > 0);
    if (chip) chip.fills = bgInv ? [P(bgInv), P(v)] : [P(v)];
    const texts = c.findAll(n => n.type === 'TEXT');
    for (const t of texts) {
      await figma.loadFontAsync(t.fontName);
      if (/\//.test(t.characters)) t.characters = v.name;
      else if (t === texts[0]) t.characters = label;
    }
    out.push(label + ' (' + v.name + ')');
  }
  if (container.layoutMode === 'HORIZONTAL') container.layoutWrap = 'WRAP';
  report.info['eklenen'] = out.length ? out : 'eklenecek yeni renk yok';
  report.info['Swatches'] = Math.round(container.width) + 'x' + Math.round(container.height);
});

return report;
