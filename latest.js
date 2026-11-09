// step 371 · inspect (salt okunur): Shortlists Filters hazırlığı: Search results Players filtre paneli (masaüstü), mobil Filters ekranı, Shortlists "Position list open", Button/Filter chip özellikleri
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const R = n => Math.round(n);
const BB = n => n.absoluteBoundingBox;
const secOf = (plat, name) => { const root = p02.children.find(n => n.type === 'SECTION' && n.name === plat); return root ? root.children.find(n => n.type === 'SECTION' && n.name === name) : null; };
const SKIP = /^(Ticker|Navigation|Footer)/;
function dump(n, base, max, depth, out) {
  const b = BB(n); const pad = '  '.repeat(depth);
  let s = pad + n.name + ' [' + n.type + (n.layoutMode && n.layoutMode !== 'NONE' ? ' ' + n.layoutMode : '') + (n.layoutWrap === 'WRAP' ? ' WRAP' : '') + '] ' + R(n.width) + 'x' + R(n.height);
  if (b && base) s += ' @' + R(b.x - base.x) + ',' + R(b.y - base.y);
  if (n.layoutSizingHorizontal) s += ' h:' + n.layoutSizingHorizontal;
  if (n.layoutSizingVertical) s += ' v:' + n.layoutSizingVertical;
  if (n.layoutPositioning === 'ABSOLUTE') s += ' ABS';
  if (n.visible === false) s += ' hidden';
  if (n.type === 'TEXT') s += ' "' + String(n.characters).slice(0, 40) + '"';
  out.push(s);
  if (depth < max && 'children' in n && n.type !== 'INSTANCE' && !SKIP.test(n.name)) for (const c of n.children) dump(c, base, max, depth + 1, out);
  return out;
}

await step('Search results ekran adlari', async () => {
  for (const plat of ['Web', 'Mobile']) { const sec = secOf(plat, 'Search results'); report.info['search ' + plat] = sec.children.filter(c => c.type === 'FRAME').map(f => f.name + ' ' + R(f.width) + 'x' + R(f.height)); }
});

await step('Players filtre paneli (masaustu)', async () => {
  const sec = secOf('Web', 'Search results'); const f = sec.children.find(c => c.type === 'FRAME' && /Players/.test(c.name) && /Desktop/.test(c.name));
  if (!f) throw new Error('Players Desktop yok');
  const panel = f.findOne(n => /filter/i.test(n.name) && n.type === 'FRAME' && n.width >= 290 && n.width <= 320);
  const out = []; if (panel) dump(panel, BB(f), 5, 0, out); else out.push('panel bulunamadi; frame ust duzey: ' + dump(f, BB(f), 4, 0, []).join(' | ').slice(0, 1500));
  report.info.playersPanel = out;
});

await step('Mobil Filters ekrani', async () => {
  const sec = secOf('Mobile', 'Search results'); const f = sec.children.find(c => c.type === 'FRAME' && /Filters/.test(c.name));
  if (!f) throw new Error('Filters Mobile yok');
  report.info.mobileFilters = dump(f, BB(f), 4, 0, []);
});

await step('Shortlists Position list open (masaustu)', async () => {
  const sec = secOf('Web', 'Shortlists'); const f = sec.children.find(c => c.type === 'FRAME' && /Position list open/.test(c.name));
  report.info.positionListOpen = dump(f, BB(f), 3, 0, []);
});

await step('component ozellikleri', async () => {
  const out = {};
  for (const nm of ['Button', 'Filter chip', 'Form field', 'Position menu', 'Option list']) {
    const c = p01.findOne(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && n.name === nm);
    if (!c) { out[nm] = 'yok'; continue; }
    const defs = c.componentPropertyDefinitions || {};
    out[nm] = Object.keys(defs).map(k => k + ':' + defs[k].type + (defs[k].variantOptions ? '[' + defs[k].variantOptions.join('|') + ']' : '')).join(' ; ');
  }
  report.info.props = out;
  const icons = p01.findAll(n => n.type === 'COMPONENT' && /^Icon=/.test(n.name) || (n.type === 'COMPONENT' && n.parent && /Menu icon|Icon button/.test(n.parent.name) && /filter|sliders/i.test(n.name)));
  report.info.filterIcons = icons.slice(0, 8).map(n => n.parent.name + ' / ' + n.name);
});
return report;
