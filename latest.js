// step 64 · Mobil ticker etiketini kisalt (UPCOMING TOURNAMENTS tasiyordu)
const out = { steps: [], errors: [] };

const SHORT = { Manager: 'TOURNAMENTS', Player: 'TRIALS' };

async function step(name, fn) {
  try { const r = await fn(); out.steps.push({ name, done: true, result: r }); return r; }
  catch (e) { out.errors.push({ name, error: String(e && e.message ? e.message : e) }); return null; }
}
async function loadFontsOf(node) {
  const len = node.characters.length;
  const fonts = len > 0 ? node.getRangeAllFontNames(0, len) : [node.fontName];
  for (const f of fonts) if (f && f.family) await figma.loadFontAsync(f);
}

const setId = await step('Ticker set bul', async () => {
  const p = figma.root.children.find(n => /^01/.test(n.name));
  await p.loadAsync();
  const set = p.children.find(n => n.name === 'Ticker' && n.type === 'COMPONENT_SET')
           || p.findOne(n => n.name === 'Ticker' && n.type === 'COMPONENT_SET');
  if (!set) throw new Error('Ticker set yok');
  return set.id;
});

await step('mobil etiketleri kisalt', async () => {
  const set = await figma.getNodeByIdAsync(setId);
  const done = [];
  for (const comp of set.children) {
    const m = /Device=Mobile, Role=(\w+)/.exec(comp.name);
    if (!m || !SHORT[m[1]]) continue;
    const label = comp.children.find(c => c.name === 'Ticker label');
    if (!label) continue;
    await loadFontsOf(label);
    label.characters = SHORT[m[1]];
    done.push(comp.name + ' -> ' + SHORT[m[1]]);
  }
  return done;
});

await step('tasma kontrolu', async () => {
  const set = await figma.getNodeByIdAsync(setId);
  return set.children.map(comp => {
    const row = comp.children.find(c => c.name === 'Ticker items');
    if (!row) return null;
    let used = 0;
    row.children.forEach((it, i) => { used += it.width + (i ? row.itemSpacing : 0); });
    return { variant: comp.name, satir: Math.round(row.width), icerik: Math.round(used), sigdi: used <= row.width + 0.5 };
  }).filter(Boolean);
});

return out;
