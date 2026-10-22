// step 180 · Salt okunur inspect: Silhouette component (Role x Size) ve sayfalardaki kullanimi (degisiklik yok)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
const r0 = n => Math.round(n);
const hex = p => p && p.color ? '#' + [p.color.r, p.color.g, p.color.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('') : '-';
function fillInfo(n) {
  if (!('fills' in n) || n.fills === figma.mixed) return n.fills === figma.mixed ? 'mixed' : '-';
  return n.fills.map(f => f.type === 'SOLID' ? hex(f) : f.type).join('+') || 'none';
}
function dump(n, depth, max) {
  const o = { t: n.type, n: n.name, w: r0(n.width), h: r0(n.height), x: r0(n.x), y: r0(n.y), fill: fillInfo(n), op: n.opacity };
  if ('layoutPositioning' in n && n.layoutPositioning === 'ABSOLUTE') o.abs = true;
  if ('constraints' in n) o.c = n.constraints.horizontal + '/' + n.constraints.vertical;
  if (depth < max && 'children' in n) o.kids = n.children.map(c => dump(c, depth + 1, max));
  return o;
}

let set = null;
await step('component set', async () => {
  set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Silhouette');
  if (!set) throw new Error('Silhouette set missing');
  report.info.set = { id: set.id, props: Object.keys(set.componentPropertyDefinitions), variants: set.children.length };
  report.info.variants = set.children.map(v => ({ name: v.name, id: v.id, w: r0(v.width), h: r0(v.height), clips: v.clipsContent, tree: dump(v, 0, 2) }));
});

await step('usage', async () => {
  const rows = {}; const hosts = {};
  const insts = p02.findAll(n => n.type === 'INSTANCE');
  let total = 0;
  for (const i of insts) {
    const m = await i.getMainComponentAsync(); if (!m || !m.parent || m.parent !== set) continue;
    total++;
    const chain = []; let x = i.parent; while (x && x.type !== 'PAGE' && chain.length < 6) { chain.push(x.name); x = x.parent; }
    const secs = chain.filter(c => /^(Web|Mobile)$/.test(c)).concat(chain.filter(c => /^(Home page|Profiles|Own profile|Sign up)/.test(c))).join(' > ');
    const frame = chain.find(c => /^(Profiles|Home|Sign)/.test(c) && c.indexOf('·') < 0) || chain[chain.length - 3] || '';
    const key = m.name + ' | ' + r0(i.width) + 'x' + r0(i.height) + ' | parent=' + (i.parent ? i.parent.name : '') + ' | abs=' + (i.layoutPositioning === 'ABSOLUTE') + ' | op=' + i.opacity;
    rows[key] = (rows[key] || 0) + 1;
    const hk = (i.parent ? i.parent.name : '') + ' / ' + (i.parent && i.parent.parent ? i.parent.parent.name : '');
    hosts[hk] = (hosts[hk] || 0) + 1;
  }
  report.info.instanceTotal = total; report.info.byVariantSizeParent = rows; report.info.hosts = hosts;
});

await step('photo layers', async () => {
  const names = {};
  for (const n of p02.findAll(x => /photo|portrait|silhouette/i.test(x.name) && x.type !== 'INSTANCE' || /^Player photo/i.test(x.name))) {
    const k = n.type + ' | ' + n.name + ' | ' + r0(n.width) + 'x' + r0(n.height) + ' | fill=' + fillInfo(n);
    names[k] = (names[k] || 0) + 1;
  }
  report.info.photoLayers = names;
});

await step('sample hero', async () => {
  const i = p02.findOne(n => n.type === 'INSTANCE' && n.name === 'Silhouette');
  if (!i) { report.info.sample = 'no instance named Silhouette'; return; }
  const m = await i.getMainComponentAsync();
  report.info.sample = { path: (function () { const a = []; let x = i; while (x && x.type !== 'PAGE') { a.push(x.name); x = x.parent; } return a.slice(0, 7).join(' < '); })(), variant: m.name, parentLayout: i.parent && 'layoutMode' in i.parent ? i.parent.layoutMode : '-', parentSize: i.parent ? r0(i.parent.width) + 'x' + r0(i.parent.height) : '-' };
});

return report;
