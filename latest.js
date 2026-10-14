// step 89 · Header masaustu varyantlari sabit 1440, arama kutusu 400'e geri

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const pageOf = re => figma.root.children.find(p => re.test(p.name));
const page0 = pageOf(/^01/);
if (page0) await page0.loadAsync();

const W = 1440, SEARCH = 400;

function gaps(v) {
  const kids = v.children.filter(c => c.absoluteBoundingBox);
  const out = [];
  for (let i = 0; i < kids.length - 1; i++) {
    const a = kids[i].absoluteBoundingBox, b = kids[i + 1].absoluteBoundingBox;
    out.push(Math.round(b.x - (a.x + a.width)));
  }
  return out;
}

await step('Masaustu varyantlari 1440', async () => {
  const set = page0.findOne(n => n.name === 'Header' && n.type === 'COMPONENT_SET');
  if (!set) throw new Error('Header set bulunamadi');
  const log = [];
  for (const v of set.children) {
    if (!/Device=Desktop/.test(v.name)) continue;
    const s = v.findOne(n => n.name === 'Search' && n.type === 'FRAME');
    if (s) { s.resize(SEARCH, s.height); s.layoutSizingHorizontal = 'FIXED'; }
    v.layoutSizingHorizontal = 'FIXED';
    v.primaryAxisSizingMode = 'FIXED';
    v.resize(W, v.height);
    v.primaryAxisAlignItems = 'SPACE_BETWEEN';
    log.push(v.name + ' -> ' + Math.round(v.width) + ' genislik, bosluklar: ' + gaps(v).join(' / ') + ' px');
  }
  report.info['varyantlar'] = log;
});

await step('Panodaki header instancelari 1440', async () => {
  const out = [];
  for (const i of page0.findAll(n => n.type === 'INSTANCE' && n.name === 'Header')) {
    const main = await i.getMainComponentAsync();
    if (!main || !/Device=Desktop/.test(main.name)) continue;
    i.resize(W, i.height);
    out.push((i.parent ? i.parent.name : '?') + ' -> ' + Math.round(i.width));
  }
  report.info['instancelar'] = out;
});

return report;
