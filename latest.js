// step 88 · Header bloklari arasinda en az 40 px bosluk kalacak sekilde arama kutusu hesaplandi

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const pageOf = re => figma.root.children.find(p => re.test(p.name));
const page0 = pageOf(/^01/);
if (page0) await page0.loadAsync();

const GAP = 40;
const MIN_SEARCH = 240;

await step('Arama kutusu bosluga gore hesaplandi', async () => {
  const set = page0.findOne(n => n.name === 'Header' && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
  if (!set) throw new Error('Header bulunamadi');
  const variants = set.type === 'COMPONENT_SET' ? set.children : [set];
  const log = [];

  for (const v of variants) {
    if (!/Device=Desktop/.test(v.name)) continue;

    const search = v.findOne(n => n.name === 'Search' && n.type === 'FRAME');
    if (!search) { report.errors.push('Search yok: ' + v.name); continue; }

    const kids = v.children.filter(c => c.absoluteBoundingBox);
    const n = kids.length;
    const inner = v.width - v.paddingLeft - v.paddingRight;

    let others = 0;
    for (const k of kids) {
      if (k === search || k.findOne === undefined) { }
      const isSearch = (k === search) || (k.findOne && k.findOne(x => x === search));
      if (!isSearch) others += k.absoluteBoundingBox.width;
    }

    let target = inner - others - GAP * (n - 1);
    if (target < MIN_SEARCH) target = MIN_SEARCH;
    target = Math.floor(target);

    search.resize(target, search.height);
    search.layoutSizingHorizontal = 'FIXED';

    const total = v.children.reduce((a, c) => a + (c.absoluteBoundingBox ? c.absoluteBoundingBox.width : 0), 0);
    const gerceklesen = n > 1 ? Math.round((inner - total) / (n - 1)) : 0;

    log.push({
      varyant: v.name,
      blok_sayisi: n,
      ic_genislik: inner,
      diger_bloklar: Math.round(others),
      arama: target,
      gerceklesen_aralik: gerceklesen
    });
  }
  report.info['sonuc'] = log;
});

await step('Blok genislikleri (teshis)', async () => {
  const set = page0.findOne(n => n.name === 'Header' && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
  const v = set.children.find(c => /Device=Desktop.*State=Logged out/.test(c.name));
  if (!v) return;
  report.info['logged out bloklari'] = v.children.map(c => c.name + ' = ' + (c.absoluteBoundingBox ? Math.round(c.absoluteBoundingBox.width) : '?'));
});

return report;
