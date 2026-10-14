// step 101 · Logo yuksekligi 56 -> 48 (component ve masaustu instance'lar), mobil 32 ayni

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const page0 = pageOf(/^01/), pageHome = pageOf(/^02/), pageProf = pageOf(/^03/);
for (const p of [page0, pageHome, pageProf]) if (p) await p.loadAsync();
const RATIO = 53.43 / 34.21;
const H = 48, W = Math.round(H * RATIO * 100) / 100;
const comp = page0.findOne(n => n.name === 'Logo' && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
const targets = comp ? (comp.type === 'COMPONENT_SET' ? comp.children.slice() : [comp]) : [];
const ids = targets.map(t => t.id);

await step('1 component size', async () => {
  if (!comp) throw new Error('Logo not found');
  for (const t of targets) { t.resize(W, H); const v = t.children[0]; if (v) { v.resize(W, H); v.x = 0; v.y = 0; } }
});

await step('2 instances 56 -> 48', async () => {
  const log = []; let changed = 0, kept = 0;
  for (const p of [page0, pageHome, pageProf]) {
    for (const n of p.findAllWithCriteria({ types: ['INSTANCE'] })) {
      const m = await n.getMainComponentAsync();
      if (!m || ids.indexOf(m.id) < 0) continue;
      if (Math.round(n.height) === 56) { n.resize(W, H); changed++; } else { kept++; }
    }
  }
  report.info.changed = changed; report.info.keptMobile = kept;
});

await step('3 relayout Navigation section', async () => {
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
