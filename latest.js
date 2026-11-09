// step 373 · inspect (salt okunur): ikonlu "Filters" düğmesi nerede ve nasıl kurulu? (Search mobil, Map mobil), Button Icon yuvası, Shortlists Filters düğmesi
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const R = n => Math.round(n);
async function line(n, depth) {
  let s = '  '.repeat(depth) + n.name + ' [' + n.type + ']' + ' ' + R(n.width) + 'x' + R(n.height);
  if (n.type === 'INSTANCE') { const m = await n.getMainComponentAsync(); s += ' main=' + (m ? (m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent.name + ' / ' : '') + m.name : '?') + ' props{' + Object.keys(n.componentProperties).map(k => k + '=' + n.componentProperties[k].value).join(', ') + '}'; }
  if (n.type === 'TEXT') s += ' "' + String(n.characters).slice(0, 30) + '"';
  if (n.visible === false) s += ' hidden';
  return s;
}
async function dump(n, max, depth, out) { out.push(await line(n, depth)); if (depth < max && 'children' in n) for (const c of n.children) await dump(c, max, depth + 1, out); return out; }

await step('Filters dugmeleri (Search, Map, Shortlists)', async () => {
  const hits = p02.findAll(n => /Filters/.test(n.name) && (n.type === 'INSTANCE' || n.type === 'FRAME') && n.width < 500 && n.height < 80);
  const rows = [];
  for (const h of hits.slice(0, 14)) {
    let top = h; while (top.parent && top.parent.type !== 'PAGE' && top.parent.type !== 'SECTION') top = top.parent;
    rows.push((top.name || '?') + ' :: ' + (await line(h, 0)));
  }
  report.info.filtersButtons = rows;
});

await step('Search Players Mobile: Filters dugmesi agaci', async () => {
  const sec = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile').children.find(n => n.type === 'SECTION' && n.name === 'Search results');
  const f = sec.children.find(c => c.type === 'FRAME' && c.name === 'Search / Players · Mobile');
  const b = f.findOne(n => /Filters/.test(n.name) && (n.type === 'INSTANCE' || n.type === 'FRAME') && n.height < 80 && n.name !== 'Filters title');
  report.info.searchMobileFilters = b ? await dump(b, 3, 0, []) : 'bulunamadi';
  report.info.searchMobileFiltersParent = b && b.parent ? (await dump(b.parent, 1, 0, [])) : '';
});

await step('Button Icon yuvasi', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Button');
  const v = set.children.find(c => /Style=Secondary/.test(c.name) && /State=Default/.test(c.name));
  report.info.buttonSecondaryDefault = await dump(v, 3, 0, []);
  const refs = []; v.findAll(n => n.componentPropertyReferences).forEach(n => refs.push(n.name + ' -> ' + JSON.stringify(n.componentPropertyReferences)));
  report.info.buttonRefs = refs;
  const withIcon = p02.findAll(n => n.type === 'INSTANCE' && /^Button/.test(n.name) && n.componentProperties && Object.keys(n.componentProperties).some(k => /^Icon/.test(k) && n.componentProperties[k].value === true));
  report.info.buttonsWithIconOn = withIcon.slice(0, 8).map(n => n.name);
});

await step('Shortlists Filters dugmesi', async () => {
  const sec = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web').children.find(n => n.type === 'SECTION' && n.name === 'Shortlists');
  report.info.shortlistsFrames = sec.children.filter(c => c.type === 'FRAME').map(f => f.name + ' ' + R(f.width) + 'x' + R(f.height));
  const f = sec.children.find(c => c.type === 'FRAME' && c.name === 'Shortlists / Shortlists · Desktop');
  const b = f.findOne(n => n.name === 'Button · Filters');
  report.info.shortlistsButton = b ? await dump(b, 2, 0, []) : 'yok';
});
return report;
