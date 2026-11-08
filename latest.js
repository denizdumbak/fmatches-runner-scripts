// step 334 · INSPECT (salt okunur, değişiklik yok): Faz 5 düzeltmeleri için My contacts sekmeleri, Notifications başlığı, Shortlists ve Player result yapısı + Select/Multi-chip/Flag component'leri
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const sub = (plat, re) => plat.children.find(n => n.type === 'SECTION' && re.test(n.name));
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const sz = n => Math.round(n.width) + 'x' + Math.round(n.height);
async function dump(n, depth, maxDepth, out, pre) {
  let extra = '';
  if (n.type === 'TEXT') extra = ' "' + String(n.characters).slice(0, 40) + '"';
  if (n.type === 'INSTANCE') { const m = await n.getMainComponentAsync(); extra = ' <' + (m ? (m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent.name : m.name) : '?') + '>'; }
  const lay = ('layoutMode' in n && n.layoutMode !== 'NONE') ? ' ' + n.layoutMode[0] + (n.layoutSizingHorizontal ? '/' + n.layoutSizingHorizontal[0] + n.layoutSizingVertical[0] : '') : '';
  out.push(pre + n.name + ' [' + n.type + ' ' + sz(n) + lay + ']' + extra);
  if (depth < maxDepth && 'children' in n && n.type !== 'INSTANCE' || (n.type === 'INSTANCE' && depth < maxDepth && depth < 3)) for (const c of n.children) await dump(c, depth + 1, maxDepth, out, pre + '  ');
}
const pageSecs = [['My contacts', /^My contacts$/], ['Notifications', /^Notifications$/], ['Shortlists', /^Shortlists$/]];
for (const [label, re] of pageSecs) {
  for (const [pn, plat] of [['Web', web], ['Mobile', mob]]) {
    await step(label + ' ' + pn, async () => {
      const sec = sub(plat, re); if (!sec) throw new Error('section yok');
      report.info[label + ' ' + pn + ' frames'] = sec.children.filter(n => n.type === 'FRAME').map(f => f.name + ' ' + sz(f));
      const f = sec.children.find(n => n.type === 'FRAME'); const out = [];
      // gövde: Header/Ticker/Footer'ı atla; yalnız ana içerik
      const body = f.children.filter(c => !/^(Ticker|Navigation|Header|Footer|Page header|Site footer)/i.test(c.name));
      for (const c of body) await dump(c, 0, 4, out, '');
      report.info[label + ' ' + pn + ' tree'] = out;
    });
  }
}
// component'ler: Shortlist row, Player result, Select, Multi-chip, Filter chip, Flag, Tabs
for (const nm of [/^Shortlist row$/, /^Player result$/, /^Select$/, /^Multi-chip$/, /^Filter chip$/, /^Flag$/, /^Tabs$/, /^Heading row$/, /^Table header/i, /^Dropdown/i]) {
  await step('set ' + nm, async () => {
    const sets = p01.findAll(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && nm.test(n.name));
    const defs = s => { const d = s.componentPropertyDefinitions, o = []; for (const k of Object.keys(d)) o.push(k + ':' + d[k].type + (d[k].variantOptions ? '(' + d[k].variantOptions.join('|') + ')' : '')); return o; };
    report.info['comp ' + nm] = sets.length ? sets.map(s => s.name + ' ' + s.type + ' ' + sz(s) + (s.type === 'COMPONENT_SET' ? ' variants=' + s.children.length + ' props=' + JSON.stringify(defs(s)) : '')) : 'YOK';
  });
}
await step('Shortlist row varyant ağacı', async () => {
  const s = p01.findOne(n => n.type === 'COMPONENT_SET' && /^Shortlist row$/.test(n.name)); if (!s) throw new Error('yok');
  for (const v of s.children.filter(c => /Device=(Desktop|Mobile)/.test(c.name) && /State=Default/.test(c.name))) { const out = []; await dump(v, 0, 5, out, ''); report.info['Shortlist row ' + v.name] = out; }
});
await step('Player result varyant ağacı', async () => {
  const s = p01.findOne(n => n.type === 'COMPONENT_SET' && /^Player result$/.test(n.name)); if (!s) throw new Error('yok');
  const v = s.children.find(c => /Device=Desktop/.test(c.name) && /Message/.test(c.name) && /State=Default/.test(c.name)) || s.children[0]; const out = []; await dump(v, 0, 5, out, ''); report.info['Player result ' + v.name] = out;
});
return report;
