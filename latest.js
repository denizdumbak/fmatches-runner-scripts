// step 100 · Logo: PNG yerine Sergey'in resmi SVG isareti (Header koyu, Footer beyaz)

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const page0 = pageOf(/^01/), pageHome = pageOf(/^02/), pageProf = pageOf(/^03/);
for (const p of [page0, pageHome, pageProf]) if (p) await p.loadAsync();
const allVars = await figma.variables.getLocalVariablesAsync();
const pick = (...pats) => { for (const p of pats) { const h = allVars.find(v => new RegExp(p, 'i').test(v.name)); if (h) return h; } return null; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const findComp = nm => page0.findOne(n => n.name === nm && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
const V = { tPrimary: pick('text/primary$'), tInverse: pick('text/inverse$'), brand: pick('bg/brand$') };
const RATIO = 53.43 / 34.21;

async function resolveHex(v) {
  const modes = Object.keys(v.valuesByMode); let val = v.valuesByMode[modes[0]]; let g = 0;
  while (val && val.type === 'VARIABLE_ALIAS' && g++ < 6) { const n = await figma.variables.getVariableByIdAsync(val.id); val = n.valuesByMode[Object.keys(n.valuesByMode)[0]]; }
  if (!val || val.r === undefined) return null;
  const h = x => ('0' + Math.round(x * 255).toString(16)).slice(-2);
  return '#' + h(val.r) + h(val.g) + h(val.b);
}
function chain(n) { const a = []; let c = n.parent; while (c && c.type !== 'PAGE' && a.length < 4) { a.push(c.name); c = c.parent; } return a.join(' < '); }

const comp = findComp('Logo');
const targets = comp ? (comp.type === 'COMPONENT_SET' ? comp.children.slice() : [comp]) : [];
const targetIds = targets.map(t => t.id);
let instances = [];

await step('1 measure', async () => {
  if (!comp) throw new Error('Logo component not found');
  report.info.before = targets.map(t => ({ name: t.name, w: t.width, h: t.height, layout: t.layoutMode, kids: t.children.map(c => c.type + ':' + c.name + ' ' + Math.round(c.width) + 'x' + Math.round(c.height)) }));
  for (const p of [page0, pageHome, pageProf]) {
    for (const n of p.findAllWithCriteria({ types: ['INSTANCE'] })) {
      const m = await n.getMainComponentAsync();
      if (m && targetIds.indexOf(m.id) >= 0) instances.push(n);
    }
  }
  report.info.instances = instances.map(n => chain(n) + ' | ' + Math.round(n.width) + 'x' + Math.round(n.height));
  report.info.brandHex = V.brand ? await resolveHex(V.brand) : 'bg/brand not found';
  report.info.logoGreen = '#009933';
});

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="53.43" height="34.21" viewBox="0 0 53.43 34.21"><g transform="translate(-78.317 -127.79)"><path fill="#111613" fill-rule="evenodd" d="m111.08 142.53-1e-3 7e-4 -0.13931-0.0704-8.437-4.8728v-9.7982l8.5778 5.0682 8.5779-5.0682v9.7982l-8.437 4.8728-0.13931 0.0704zm20.669-4.9424h-9.6732v-9.6732h9.6732zm0 24.183h-9.6732v-21.765h9.6732zm-25.504 0c2.6711 0 4.8366-2.1654 4.8366-4.8365 0-2.6712-2.1655-4.8366-4.8366-4.8366-2.6712 0-4.8366 2.1654-4.8366 4.8366 0 2.6711 2.1654 4.8365 4.8366 4.8365zm-27.926-33.856h21.765v9.6732h-12.092v24.183h-9.6732v-33.856zm12.092 12.091h9.6732v9.6732h-9.6732z"/></g></svg>';

await step('2 replace png with svg mark', async () => {
  if (!V.tPrimary) throw new Error('text/primary not found');
  for (const t of targets) {
    const H = t.height;
    for (const k of t.children.slice()) k.remove();
    const frame = figma.createNodeFromSvg(SVG);
    const vec = figma.flatten(frame.children.slice());
    t.appendChild(vec);
    frame.remove();
    vec.name = 'FMI mark';
    vec.fills = [P(V.tPrimary)];
    vec.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
    const W = Math.round(H * RATIO * 100) / 100;
    if (t.layoutMode && t.layoutMode !== 'NONE') {
      vec.resize(W, H); t.resize(W, H);
    } else {
      t.resize(W, H); vec.resize(W, H); vec.x = 0; vec.y = 0;
    }
    t.fills = [];
  }
  comp.description = 'Official FMI mark (Sergey SVG, no tagline). Light surfaces: text/primary. Dark surfaces (footer): text/inverse. Ratio 53.43:34.21.';
});

await step('3 fix instance sizes to new ratio', async () => {
  const log = [];
  for (const n of instances) {
    const h = n.height; const w = Math.round(h * RATIO * 100) / 100;
    if (Math.abs(n.width - w) > 0.5) { n.resize(w, h); }
    log.push(chain(n) + ' -> ' + Math.round(n.width) + 'x' + Math.round(n.height));
  }
  report.info.instancesAfter = log;
});

await step('4 footer logo white (text/inverse)', async () => {
  if (!V.tInverse) throw new Error('text/inverse not found');
  const footer = page0.findOne(n => n.name === 'Footer' && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
  if (!footer) throw new Error('Footer component not found');
  let count = 0;
  for (const n of footer.findAll(x => x.type === 'INSTANCE')) {
    const m = await n.getMainComponentAsync();
    if (!m || targetIds.indexOf(m.id) < 0) continue;
    const vec = n.findOne(x => x.type === 'VECTOR' || x.type === 'BOOLEAN_OPERATION');
    if (vec) { vec.fills = [P(V.tInverse)]; count++; }
  }
  report.info.footerLogosRecolored = count;
});

await step('5 relayout Navigation section', async () => {
  const s = page0.findOne(n => n.type === 'SECTION' && /Navigation/.test(n.name));
  if (!s) throw new Error('Navigation section not found');
  const kids = s.children.slice();
  const ordered = kids.filter(n => n.type === 'TEXT').concat(kids.filter(n => n.type !== 'TEXT'));
  const left = s.x + 80; let y = s.y + 80, prevText = false, first = true;
  for (const k of ordered) {
    const b = k.absoluteBoundingBox; if (!b) continue; const isText = k.type === 'TEXT';
    if (!first) y += (isText && prevText) ? 16 : 120;
    k.x += left - b.x; k.y += y - b.y; y += b.height; prevText = isText; first = false;
  }
  let right = -Infinity, bottom = -Infinity;
  for (const k of s.children) { const b = k.absoluteBoundingBox; if (!b) continue;
    if (b.x + b.width > right) right = b.x + b.width;
    if (b.y + b.height > bottom) bottom = b.y + b.height; }
  s.resizeWithoutConstraints(Math.ceil(right - s.x + 80), Math.ceil(bottom - s.y + 80));
});

return report;
