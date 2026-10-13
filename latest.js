// step 65 · inspect: eklenen sosyal ikonlar + Section tasmasi (salt okunur)
const out = { steps: [], errors: [] };

async function step(name, fn) {
  try { out.steps.push({ name, result: await fn() }); }
  catch (e) { out.errors.push({ name, error: String(e && e.message ? e.message : e) }); }
}

function box(n) {
  return { name: n.name, type: n.type, id: n.id,
    x: Math.round(n.x), y: Math.round(n.y),
    w: Math.round(n.width), h: Math.round(n.height) };
}

await step('sekme 01 ust seviye', async () => {
  const p = figma.root.children.find(n => /^01/.test(n.name));
  await p.loadAsync();
  return p.children.map(box);
});

await step('4 · Home page section tasmasi', async () => {
  const p = figma.root.children.find(n => /^01/.test(n.name));
  const sec = p.children.find(n => /Home page/i.test(n.name));
  if (!sec) throw new Error('Home page section yok');
  const kids = sec.children.map(box);
  const maxBottom = Math.max(...sec.children.map(n => n.y + n.height));
  const maxRight = Math.max(...sec.children.map(n => n.x + n.width));
  return {
    section: box(sec),
    sectionType: sec.type,
    icerikAltSinir: Math.round(maxBottom),
    icerikSagSinir: Math.round(maxRight),
    altTasma: Math.round(maxBottom - sec.height),
    sagTasma: Math.round(maxRight - sec.width),
    children: kids
  };
});

await step('tum sectionlarda tasma', async () => {
  const p = figma.root.children.find(n => /^01/.test(n.name));
  const r = [];
  for (const sec of p.children) {
    if (!('children' in sec) || !sec.children.length) continue;
    const b = Math.max(...sec.children.map(n => n.y + n.height));
    const right = Math.max(...sec.children.map(n => n.x + n.width));
    r.push({ section: sec.name, type: sec.type, h: Math.round(sec.height), w: Math.round(sec.width),
             altTasma: Math.round(b - sec.height), sagTasma: Math.round(right - sec.width) });
  }
  return r;
});

await step('sosyal ikon adaylari', async () => {
  const p = figma.root.children.find(n => /^01/.test(n.name));
  const re = /linkedin|instagram|facebook|twitter|simple-?icons|^x$|logo/i;
  const found = p.findAll(n => re.test(n.name) && n.type !== 'TEXT');
  return found.slice(0, 40).map(n => ({
    ...box(n),
    parent: n.parent ? n.parent.name : null,
    cocuklar: 'children' in n ? n.children.map(c => c.name + ' (' + c.type + ')') : null
  }));
});

await step('son eklenen kok dugumler', async () => {
  const p = figma.root.children.find(n => /^01/.test(n.name));
  return p.children.slice(-6).map(box);
});

return out;
