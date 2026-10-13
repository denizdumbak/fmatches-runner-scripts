// step 59 · inspect: Ticker + Footer social links (salt okunur, hicbir sey degismez)
const out = { steps: [], errors: [] };

function paintInfo(fills) {
  if (!fills || fills === figma.mixed || !fills.length) return null;
  return fills.map(f => {
    const bv = f.boundVariables && f.boundVariables.color;
    return {
      type: f.type,
      variable: bv ? bv.id : null,
      hex: f.type === 'SOLID' && f.color
        ? '#' + [f.color.r, f.color.g, f.color.b].map(c => Math.round(c * 255).toString(16).padStart(2, '0')).join('')
        : null,
      opacity: f.opacity === undefined ? 1 : f.opacity
    };
  });
}

function describe(node, depth, maxDepth) {
  const d = {
    name: node.name,
    type: node.type,
    id: node.id,
    w: 'width' in node ? Math.round(node.width) : null,
    h: 'height' in node ? Math.round(node.height) : null
  };
  if ('layoutMode' in node && node.layoutMode !== 'NONE') {
    d.layout = node.layoutMode;
    d.gap = node.itemSpacing;
    d.padding = [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft];
    d.align = node.primaryAxisAlignItems + '/' + node.counterAxisAlignItems;
  }
  if ('layoutSizingHorizontal' in node) d.sizing = node.layoutSizingHorizontal + '/' + node.layoutSizingVertical;
  if ('fills' in node) {
    const p = paintInfo(node.fills);
    if (p) d.fills = p;
  }
  if (node.type === 'TEXT') {
    d.characters = node.characters;
    d.textStyleId = node.textStyleId === figma.mixed ? 'MIXED' : node.textStyleId;
    d.textAutoResize = node.textAutoResize;
  }
  if (node.type === 'COMPONENT_SET') {
    d.properties = node.componentPropertyDefinitions;
    d.variants = node.children.map(c => c.name);
  }
  if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
    d.componentProperties = node.componentProperties || null;
  }
  if ('children' in node && depth < maxDepth) {
    d.children = node.children.map(c => describe(c, depth + 1, maxDepth));
  } else if ('children' in node) {
    d.childNames = node.children.map(c => c.name);
  }
  return d;
}

async function step(name, fn) {
  try { out.steps.push({ name, result: await fn() }); }
  catch (e) { out.errors.push({ name, error: String(e && e.message ? e.message : e) }); }
}

await step('page 01 bul', async () => {
  const p = figma.root.children.find(n => /^01/.test(n.name));
  if (!p) throw new Error('01 sayfasi bulunamadi');
  await p.loadAsync();
  out._p01 = p;
  return { name: p.name, id: p.id, childCount: p.children.length };
});

await step('Ticker component', async () => {
  const p = out._p01;
  const t = p.children.find(n => /^Ticker$/i.test(n.name)) ||
            p.findOne(n => /^Ticker$/i.test(n.name) && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
  if (!t) throw new Error('Ticker bulunamadi');
  return describe(t, 0, 6);
});

await step('Footer · social links', async () => {
  const p = out._p01;
  const f = p.children.find(n => /^Footer$/i.test(n.name)) ||
            p.findOne(n => /^Footer$/i.test(n.name) && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
  if (!f) throw new Error('Footer bulunamadi');
  const social = f.findAll(n => /social/i.test(n.name));
  return {
    footer: { name: f.name, id: f.id, variants: f.type === 'COMPONENT_SET' ? f.children.map(c => c.name) : null },
    socialNodes: social.map(n => describe(n, 0, 3))
  };
});

await step('Home · Desktop ticker instance', async () => {
  const p2 = figma.root.children.find(n => /^02/.test(n.name));
  if (!p2) throw new Error('02 sayfasi yok');
  await p2.loadAsync();
  const home = p2.children.find(n => /Home · Desktop/.test(n.name));
  if (!home) throw new Error('Home · Desktop yok');
  const tick = home.children.find(n => /ticker/i.test(n.name));
  return tick ? describe(tick, 0, 3) : { note: 'Home · Desktop icinde ticker adli katman yok', topLevel: home.children.map(c => c.name) };
});

await step('metin stilleri', async () => {
  const styles = await figma.getLocalTextStylesAsync();
  return styles.filter(s => /Label|Eyebrow|Body\/Small/.test(s.name)).map(s => ({ name: s.name, id: s.id }));
});

delete out._p01;
return out;
