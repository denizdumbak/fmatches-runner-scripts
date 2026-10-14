// step 87 · Header arama kutusu 400 -> 320, blok aralari nefes aliyor

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const pageOf = re => figma.root.children.find(p => re.test(p.name));
const page0 = pageOf(/^01/), pageHome = pageOf(/^02/), pageProfile = pageOf(/^03/);
for (const p of [page0, pageHome, pageProfile]) { if (p) await p.loadAsync(); }

const NEW_W = 320;

await step('Arama kutusu daraltildi', async () => {
  const set = page0.findOne(n => n.name === 'Header' && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
  if (!set) throw new Error('Header bulunamadi');
  const variants = set.type === 'COMPONENT_SET' ? set.children : [set];
  const log = [];
  for (const v of variants) {
    if (!/Device=Desktop/.test(v.name)) continue;
    const s = v.findOne(n => n.name === 'Search' && n.type === 'FRAME');
    if (!s) { report.errors.push('Search yok: ' + v.name); continue; }
    s.resize(NEW_W, s.height);
    s.layoutSizingHorizontal = 'FIXED';

    const blocks = v.children.filter(c => c.absoluteBoundingBox);
    const total = blocks.reduce((a, c) => a + c.absoluteBoundingBox.width, 0);
    const inner = v.width - v.paddingLeft - v.paddingRight;
    const gap = blocks.length > 1 ? Math.round((inner - total) / (blocks.length - 1)) : 0;
    log.push(v.name + ' -> arama ' + NEW_W + ', kalan aralik ' + gap + ' px');
  }
  report.info['varyantlar'] = log;
});

await step('Sayfalardaki header instance kontrolu', async () => {
  const out = [];
  for (const p of [page0, pageHome, pageProfile]) {
    if (!p) continue;
    for (const i of p.findAll(n => n.type === 'INSTANCE' && n.name === 'Header')) {
      const s = i.findOne(n => n.name === 'Search' && n.type === 'FRAME');
      const b = s ? s.absoluteBoundingBox : null;
      out.push(p.name + ' / ' + (i.parent ? i.parent.name : '?') + ' -> arama ' + (b ? Math.round(b.width) : 'yok'));
    }
  }
  report.info['instancelar'] = out;
});

return report;
