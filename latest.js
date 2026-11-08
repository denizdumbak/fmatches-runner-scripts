// step 337 · INSPECT (salt okunur, değişiklik yok): arama sonuçlarında Player result satırlarının yeri (başlık satırı + ikinci uyruk için)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const sub = (plat, re) => plat.children.find(n => n.type === 'SECTION' && re.test(n.name));
const sz = n => Math.round(n.width) + 'x' + Math.round(n.height);
const lay = n => ('layoutMode' in n && n.layoutMode !== 'NONE') ? n.layoutMode[0] + '/' + n.layoutSizingHorizontal[0] + n.layoutSizingVertical[0] : '-';
async function isPlayerResult(n) { if (n.type !== 'INSTANCE') return false; const m = await n.getMainComponentAsync(); return !!(m && m.parent && m.parent.type === 'COMPONENT_SET' && m.parent.name === 'Player result'); }
for (const [plat, pn] of [[web, 'Web'], [mob, 'Mobile']]) {
  await step('Search ' + pn, async () => {
    const sec = sub(plat, /^Search results$/); if (!sec) throw new Error('section yok');
    report.info[pn + ' section'] = sec.name + ' ' + sz(sec) + ' y=' + Math.round(sec.y);
    report.info[pn + ' sections below'] = plat.children.filter(n => n.type === 'SECTION' && n.y > sec.y).map(n => n.name + ' y=' + Math.round(n.y) + ' x=' + Math.round(n.x) + ' ' + sz(n));
    const out = [];
    for (const f of sec.children.filter(n => n.type === 'FRAME')) {
      const rows = []; for (const n of f.findAll(x => x.type === 'INSTANCE')) if (await isPlayerResult(n)) rows.push(n);
      if (!rows.length) { out.push(f.name + ' ' + sz(f) + ' rows=0'); continue; }
      const r0 = rows[0], par = r0.parent; const idx = par.children.indexOf(r0);
      const chain = []; for (let p = par; p && p !== f.parent; p = p.parent) chain.push(p.name + '[' + p.type + ' ' + sz(p) + ' ' + lay(p) + ']');
      out.push(f.name + ' ' + sz(f) + ' rows=' + rows.length + ' names=' + rows.map(r => r.name).join(',') + ' | first row idx ' + idx + ' in ' + chain.join(' < ') + ' | siblings: ' + par.children.slice(0, 8).map(c => c.name + (c.type === 'RECTANGLE' ? '(rect)' : '')).join(' ; '));
    }
    report.info[pn + ' frames'] = out;
  });
}
await step('Players tab masaüstü ağaç', async () => {
  const sec = sub(web, /^Search results$/); const f = sec.children.find(n => n.type === 'FRAME' && /Players · Desktop$/.test(n.name)); if (!f) throw new Error('Players · Desktop yok');
  const out = [];
  (function walk(n, d, pre) { if (d > 4) return; out.push(pre + n.name + ' [' + n.type + ' ' + sz(n) + ' ' + lay(n) + ']'); if ('children' in n && n.type !== 'INSTANCE') for (const c of n.children) walk(c, d + 1, pre + '  '); })(f, 0, '');
  report.info.playersTree = out.filter(l => !/^\s{10,}/.test(l)).slice(0, 60);
});
return report;
