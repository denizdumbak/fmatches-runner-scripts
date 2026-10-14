// step 98 · Iki degisken color/ grubuna alindi (text/inverse-secondary, border/inverse)

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const page0 = figma.root.children.find(p => /^01/.test(p.name));
await page0.loadAsync();

const vars = await figma.variables.getLocalVariablesAsync('COLOR');
const MAP = { 'text/inverse-secondary': 'color/text/inverse-secondary', 'border/inverse': 'color/border/inverse' };

await step('Yeniden adlandirma', async () => {
  const out = [];
  for (const [from, to] of Object.entries(MAP)) {
    const v = vars.find(x => x.name === from);
    if (!v) { out.push(from + ': bulunamadi (zaten degismis olabilir)'); continue; }
    if (vars.some(x => x.name === to)) { out.push(to + ': bu ad zaten var, atlandi'); continue; }
    v.name = to;
    out.push(from + ' -> ' + to);
  }
  report.info['degisken'] = out;
});

await step('Panodaki etiketler', async () => {
  const sw = page0.findOne(n => n.name === 'Swatch · Surface');
  const texts = sw ? sw.parent.findAll(n => n.type === 'TEXT') : [];
  let n = 0;
  for (const t of texts) {
    if (MAP[t.characters]) { await figma.loadFontAsync(t.fontName); t.characters = MAP[t.characters]; n++; }
  }
  report.info['guncellenen etiket'] = n;
});

return report;
