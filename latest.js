// step 120 · Linkler icin inspect (salt okunur): profil govdesinin yapisi, kartlar, ikon componentleri

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));

const r = n => Math.round(n);
function brief(n) {
  const o = { name: n.name, type: n.type, w: r(n.width), h: r(n.height) };
  if (n.visible === false) o.hidden = true;
  if ('layoutMode' in n && n.layoutMode !== 'NONE') {
    o.layout = n.layoutMode;
    o.gap = n.itemSpacing;
    o.pad = [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].join('/');
    if (n.layoutWrap === 'WRAP') o.wrap = true;
  }
  if ('layoutSizingHorizontal' in n) o.size = n.layoutSizingHorizontal + 'x' + n.layoutSizingVertical;
  if (n.layoutPositioning === 'ABSOLUTE') o.abs = true;
  return o;
}
function tree(n, depth) {
  const o = brief(n);
  if (depth > 0 && 'children' in n && n.type !== 'INSTANCE') o.kids = n.children.map(c => tree(c, depth - 1));
  if (n.type === 'TEXT') o.text = n.characters.slice(0, 40);
  return o;
}

const web = pageOf(/^02/);
await web.loadAsync();

await step('profile frames', async () => {
  const frames = web.findAll(n => n.type === 'FRAME' && /^Profiles \/ Player/.test(n.name) && n.parent && n.parent.type === 'SECTION');
  report.info.frames = frames.map(f => ({ name: f.name, w: r(f.width), h: r(f.height), top: f.children.map(c => c.name) }));
});

await step('body structure (main desktop + mobile)', async () => {
  const mains = web.findAll(n => n.type === 'FRAME' && /^Profiles \/ Player( · (Desktop|Mobile))?$/.test(n.name) && n.parent && n.parent.type === 'SECTION');
  report.info.body = mains.map(f => {
    const body = f.findOne(n => /Profile body/i.test(n.name));
    return { frame: f.name, body: body ? tree(body, 4) : 'NOT FOUND' };
  });
});

await step('cards: styles and effects', async () => {
  const main = web.findOne(n => n.type === 'FRAME' && /^Profiles \/ Player/.test(n.name) && n.width > 800);
  const body = main && main.findOne(n => /Profile body/i.test(n.name));
  if (!body) return;
  const cards = body.findAll(n => n.type === 'FRAME' && n.effects && n.effects.length);
  const out = [];
  for (const c of cards) {
    const eff = c.effectStyleId ? await figma.getStyleByIdAsync(c.effectStyleId) : null;
    out.push({ name: c.name, effectStyle: eff ? eff.name : null, radiusVar: !!(c.boundVariables && c.boundVariables.topLeftRadius), fillVar: !!(c.boundVariables && c.boundVariables.fills) });
  }
  report.info.cards = out;
});

await step('icon-like components', async () => {
  const p1 = pageOf(/^01/);
  await p1.loadAsync();
  const comps = p1.findAll(n => (n.type === 'COMPONENT_SET' || (n.type === 'COMPONENT' && n.parent.type !== 'COMPONENT_SET')) && /icon|chip|tag|button/i.test(n.name));
  report.info.components = comps.map(c => ({ name: c.name, id: c.id, variants: c.type === 'COMPONENT_SET' ? Object.keys(c.componentPropertyDefinitions).join(', ') : '' }));
});

await step('text styles in use', async () => {
  report.info.textStyles = (await figma.getLocalTextStylesAsync()).map(s => s.name).filter(n => /Heading|Label|Body/.test(n));
});

return report;
