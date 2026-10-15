// step 104 · M3 inspect (salt okunur): Hero slide component, hero carousel ve Role card yapisi. Hicbir sey degismez.

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const page0 = pageOf(/^01/), pageHome = pageOf(/^02/);
for (const p of [page0, pageHome]) if (p) await p.loadAsync();

function fillInfo(n) {
  if (!('fills' in n) || n.fills === figma.mixed || !n.fills.length) return '';
  return n.fills.map(f => f.type === 'IMAGE' ? 'IMG(' + f.scaleMode + ')' : f.type === 'SOLID' ? 'S' : f.type.slice(0, 4)).join('+');
}
function tree(n, depth, max) {
  const r = Math.round;
  let s = '  '.repeat(depth) + n.type.slice(0, 4) + ' "' + n.name + '" ' + r(n.width) + 'x' + r(n.height) + ' @' + r(n.x) + ',' + r(n.y);
  const fi = fillInfo(n); if (fi) s += ' [' + fi + ']';
  if ('layoutMode' in n && n.layoutMode !== 'NONE') s += ' AL:' + n.layoutMode[0] + ' gap' + n.itemSpacing + ' pad' + n.paddingLeft + '/' + n.paddingTop;
  if (n.type === 'TEXT') s += ' "' + n.characters.slice(0, 40) + '"';
  if ('clipsContent' in n && n.clipsContent) s += ' clip';
  if ('cornerRadius' in n && n.cornerRadius) s += ' r' + String(n.cornerRadius);
  const out = [s];
  if (depth < max && 'children' in n && n.type !== 'INSTANCE') for (const c of n.children) out.push(...tree(c, depth + 1, max));
  if (depth < max && n.type === 'INSTANCE') for (const c of n.children) out.push(...tree(c, depth + 1, max));
  return out;
}

await step('hero slide component', async () => {
  const c = page0.findOne(n => /^Hero slide/.test(n.name) && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
  report.info.heroComp = c ? tree(c, 0, 5) : 'not found';
});
await step('role card component', async () => {
  const c = page0.findOne(n => /^Role card/.test(n.name) && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
  report.info.roleComp = c ? tree(c, 0, 4) : 'not found';
});
await step('home frames', async () => {
  report.info.homeTop = pageHome.children.map(n => n.type.slice(0, 4) + ' "' + n.name + '" ' + Math.round(n.width) + 'x' + Math.round(n.height));
  const frames = pageHome.children.filter(n => /^Home ·/.test(n.name) && !/calendar/.test(n.name));
  report.info.home = {};
  for (const f of frames) {
    const hero = f.findOne(n => /Hero/i.test(n.name));
    const roles = f.findOne(n => /^Roles/i.test(n.name));
    report.info.home[f.name] = { hero: hero ? tree(hero, 0, 3) : 'none', roles: roles ? tree(roles, 0, 3) : 'none' };
  }
});
await step('image fills', async () => {
  const imgs = [];
  for (const root of [page0, pageHome]) root.findAll(n => 'fills' in n && n.fills !== figma.mixed && n.fills.some(f => f.type === 'IMAGE')).forEach(n => imgs.push(root.name.slice(0, 2) + ' ' + n.name + ' ' + Math.round(n.width) + 'x' + Math.round(n.height) + ' < ' + (n.parent ? n.parent.name : '')));
  report.info.images = imgs;
});
return report;
