// step 183 · Silhouette konumu: her profil sayfasinda hero icindeki yer ve taban hizasi olculur; hero tabanindan sapan masaustu silueti tabana oturtulur (yalniz y)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
const r1 = n => Math.round(n * 10) / 10;
let set = null;
function topFrameName(i) { let x = i; while (x.parent && x.parent.type !== 'SECTION' && x.parent.type !== 'PAGE') x = x.parent; return x.name; }
async function rowsOf() {
  const out = [];
  for (const i of p02.findAll(n => n.type === 'INSTANCE')) {
    const m = await i.getMainComponentAsync(); if (!m || m.parent !== set) continue;
    const hero = i.parent;
    out.push({
      page: topFrameName(i), parent: hero.name, parentType: hero.type, parentSize: r1(hero.width) + 'x' + r1(hero.height),
      parentClips: 'clipsContent' in hero ? hero.clipsContent : '-', abs: i.layoutPositioning === 'ABSOLUTE',
      inst: r1(i.width) + 'x' + r1(i.height), x: r1(i.x), y: r1(i.y), bottomGap: r1(hero.height - (i.y + i.height)),
      variant: m.name.replace('Size=', '')
    });
  }
  return out;
}
await step('find set', async () => { set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Silhouette'); if (!set) throw new Error('Silhouette set missing'); });
await step('measure before', async () => { report.info.before = (await rowsOf()).map(r => r.page + ' | ' + r.variant + ' | parent ' + r.parent + ' ' + r.parentSize + ' clips=' + r.parentClips + ' abs=' + r.abs + ' | inst ' + r.inst + ' at ' + r.x + ',' + r.y + ' | bottomGap ' + r.bottomGap); });
await step('seat desktop silhouettes on the hero floor', async () => {
  const fixed = [];
  for (const i of p02.findAll(n => n.type === 'INSTANCE')) {
    const m = await i.getMainComponentAsync(); if (!m || m.parent !== set || !/Hero desktop/.test(m.name)) continue;
    const hero = i.parent; if (i.layoutPositioning !== 'ABSOLUTE') continue;
    const gap = hero.height - (i.y + i.height);
    if (Math.abs(gap) > 0.5) { const old = i.y; i.y = hero.height - i.height; fixed.push(topFrameName(i) + ' : y ' + r1(old) + ' > ' + r1(i.y) + ' (gap was ' + r1(gap) + ')'); }
  }
  report.info.fixed = fixed;
});
await step('measure after', async () => { report.info.after = (await rowsOf()).map(r => r.page + ' | ' + r.variant + ' | bottomGap ' + r.bottomGap + ' | x ' + r.x); });
return report;
