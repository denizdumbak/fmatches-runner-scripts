// step 224 · Bottom sheet: move set below all other 7 · Map components, fix overlaps, report

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync(); await figma.setCurrentPageAsync(p01);
const sec7 = p01.children.find(n => n.type === 'SECTION' && /^7 /.test(n.name));
const set = sec7.children.find(n => n.type === 'COMPONENT_SET' && n.name === 'Bottom sheet');
const inter = (a, b) => { const A = a.absoluteBoundingBox, B = b.absoluteBoundingBox; return A && B && A.x < B.x + B.width && B.x < A.x + A.width && A.y < B.y + B.height && B.y < A.y + A.height; };
await step('move Bottom sheet below the rest', async () => {
  if (!set) throw new Error('Bottom sheet set missing');
  const others = sec7.children.filter(n => n !== set);
  report.info.before = others.filter(n => inter(set, n)).map(n => n.name);
  let bottom = 0, left = Infinity; for (const n of others) { bottom = Math.max(bottom, n.y + n.height); left = Math.min(left, n.x); }
  set.x = isFinite(left) ? left : 80; set.y = Math.ceil(bottom + 120);
  let r7 = 0, b7 = 0; for (const ch of sec7.children) { r7 = Math.max(r7, ch.x + ch.width); b7 = Math.max(b7, ch.y + ch.height); }
  sec7.resizeWithoutConstraints(Math.max(sec7.width, Math.ceil(r7 + 80)), Math.ceil(b7 + 80));
  report.info.after = others.filter(n => inter(set, n)).map(n => n.name);
  report.info.set = Math.round(set.x) + ',' + Math.round(set.y) + ' ' + Math.round(set.width) + 'x' + Math.round(set.height);
  report.info.section = Math.round(sec7.width) + 'x' + Math.round(sec7.height);
  report.info.children7 = sec7.children.map(n => n.name + ' @' + Math.round(n.x) + ',' + Math.round(n.y)).join(' | ');
});
await figma.setCurrentPageAsync(p02);
return report;
