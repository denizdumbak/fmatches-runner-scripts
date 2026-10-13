// step 62 · Ticker buyudugu icin Section'da ust uste binen componentleri asagi kaydir
const out = { steps: [], errors: [], info: [] };

async function step(name, fn) {
  try { const r = await fn(); out.steps.push({ name, done: true, result: r }); return r; }
  catch (e) { out.errors.push({ name, error: String(e && e.message ? e.message : e) }); return null; }
}

const GAP = 120;

await step('Section icinde yeniden dizme', async () => {
  const p = figma.root.children.find(n => /^01/.test(n.name));
  await p.loadAsync();

  const ticker = p.children.find(n => n.name === 'Ticker' && n.type === 'COMPONENT_SET')
              || p.findOne(n => n.name === 'Ticker' && n.type === 'COMPONENT_SET');
  if (!ticker) throw new Error('Ticker set yok');

  const section = ticker.parent;
  if (!section || !('children' in section)) throw new Error('Ticker bir kapsayicida degil');

  const bottom = ticker.y + ticker.height;

  // Ticker'in altinda kalan kardesler, y sirasina gore
  const below = section.children
    .filter(n => n.id !== ticker.id && n.y > ticker.y)
    .sort((a, b) => a.y - b.y);

  if (!below.length) return { note: 'Ticker bu kapsayicinin sonuncusu, kaydirma gerekmedi', section: section.name };

  const first = below[0];
  const wanted = bottom + GAP;
  const delta = wanted - first.y;

  if (delta <= 0) {
    return { note: 'Binme yok, kaydirma gerekmedi', section: section.name, bosluk: Math.round(first.y - bottom) };
  }

  for (const n of below) n.y = n.y + delta;

  return {
    section: section.name,
    tickerYuksekligi: Math.round(ticker.height),
    kaydirilan: below.map(n => n.name),
    delta: Math.round(delta)
  };
});

await step('diger Sectionlarda binme kontrolu', async () => {
  const p = figma.root.children.find(n => /^01/.test(n.name));
  const problems = [];
  const containers = [p, ...p.children.filter(n => 'children' in n)];
  for (const c of containers) {
    const kids = [...c.children].filter(n => 'y' in n && 'height' in n).sort((a, b) => a.y - b.y);
    for (let i = 0; i < kids.length - 1; i++) {
      const a = kids[i], b = kids[i + 1];
      const overlapY = (a.y + a.height) > b.y + 1;
      const overlapX = (a.x < b.x + b.width) && (b.x < a.x + a.width);
      if (overlapY && overlapX) problems.push({ kapsayici: c.name, ust: a.name, alt: b.name, binme: Math.round(a.y + a.height - b.y) });
    }
  }
  return problems.length ? problems : 'binme yok';
});

return out;
