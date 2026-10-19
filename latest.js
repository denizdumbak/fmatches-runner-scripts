// step 141 · inspect (salt okunur) madde 8 icin: Profile actions + Sticky action bar durumlari, Club strip, Silhouette, Club crest, Key fact, Tag, profil hero kimlik blogu, Web/Mobile satir alt kenarlari

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();

async function tree(n, d, maxD, intoInstances) {
  const o = { name: n.name, type: n.type, w: Math.round(n.width), h: Math.round(n.height) };
  if (n.visible === false) o.hidden = true;
  if ('layoutMode' in n && n.layoutMode !== 'NONE') { o.layout = n.layoutMode; o.gap = n.itemSpacing; o.pad = [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].join('/'); }
  if (n.layoutPositioning === 'ABSOLUTE') o.abs = Math.round(n.x) + ',' + Math.round(n.y);
  if (n.componentPropertyReferences && Object.keys(n.componentPropertyReferences).length) o.refs = n.componentPropertyReferences;
  if (n.type === 'TEXT') {
    o.text = n.characters.slice(0, 60);
    if (typeof n.textStyleId === 'string' && n.textStyleId) { const s = await figma.getStyleByIdAsync(n.textStyleId); o.style = s ? s.name : '?'; }
    return o;
  }
  if (n.type === 'INSTANCE') {
    o.variant = n.variantProperties;
    const mc = await n.getMainComponentAsync();
    o.component = mc ? (mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent.name : mc.name) : '?';
    if (!intoInstances) return o;
  }
  if ('children' in n && d < maxD) { o.kids = []; for (const c of n.children) o.kids.push(await tree(c, d + 1, maxD, intoInstances)); }
  return o;
}
const setOf = name => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === name);
function props(set) {
  const out = {};
  const defs = set.componentPropertyDefinitions;
  for (const k of Object.keys(defs)) out[k] = defs[k].type + (defs[k].variantOptions ? ' [' + defs[k].variantOptions.join(', ') + ']' : ' = ' + defs[k].defaultValue);
  return out;
}

for (const name of ['Profile actions', 'Sticky action bar', 'Club strip', 'Silhouette', 'Club crest', 'Key fact', 'Tag', 'Verification badge']) {
  await step('set ' + name, async () => {
    const s = setOf(name);
    if (!s) { report.info[name] = 'not found'; return; }
    const info = { id: s.id, props: props(s), variants: s.children.map(c => c.name + ' ' + Math.round(c.width) + 'x' + Math.round(c.height)), description: (s.description || '').slice(0, 200) };
    if (name === 'Profile actions' || name === 'Sticky action bar') {
      info.trees = [];
      for (const v of s.children) info.trees.push(await tree(v, 0, 3, false));
    }
    if (name === 'Club strip') info.desktop = await tree(s.children.find(c => /Desktop/.test(c.name)), 0, 3, false);
    report.info[name] = info;
  });
}

await step('actions board', async () => {
  const b = p01.findOne(n => n.type !== 'TEXT' && n.type !== 'INSTANCE' && /profile actions.*state/i.test(n.name));
  report.info.actionsBoard = b ? await tree(b, 0, 3, false) : 'not found';
});

await step('desktop identity', async () => {
  const f = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player · Desktop');
  const id = f.findOne(n => n.name === 'Identity');
  report.info.identity = await tree(id, 0, 3, false);
  const body = f.findOne(n => n.name === 'Profile columns');
  report.info.bodyColumns = await tree(body, 0, 2, false);
});

await step('mobile identity', async () => {
  const f = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player · Mobile');
  const nr = f.findOne(n => n.name === 'Name and role');
  report.info.mobileNameRole = await tree(nr, 0, 3, false);
  const bar = f.findOne(n => n.type === 'INSTANCE' && /sticky action bar/i.test(n.name));
  report.info.mobileBar = bar ? { name: bar.name, variant: bar.variantProperties, x: Math.round(bar.x), y: Math.round(bar.y) } : 'not found';
});

await step('row bottoms', async () => {
  const out = {};
  for (const sec of p02.children.filter(n => n.type === 'SECTION')) {
    let bottom = 0;
    for (const k of sec.children) bottom = Math.max(bottom, k.y + k.height);
    out[sec.name] = { sectionH: Math.round(sec.height), contentBottom: Math.round(bottom), frames: sec.children.filter(n => n.type === 'FRAME' && /^Profiles/.test(n.name)).map(n => n.name + ' @' + Math.round(n.x) + ',' + Math.round(n.y) + ' h' + Math.round(n.height)) };
  }
  report.info.rows = out;
});

return report;
