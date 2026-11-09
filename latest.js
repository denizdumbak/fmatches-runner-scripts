// step 339 · INSPECT (salt okunur, değişiklik yok): kulüp kartı için hazırlık (stadyum hero ağacı, ilgili component'ler, Section yerleri)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const sz = n => Math.round(n.width) + 'x' + Math.round(n.height);
const lay = n => ('layoutMode' in n && n.layoutMode !== 'NONE') ? n.layoutMode[0] + '/' + n.layoutSizingHorizontal[0] + n.layoutSizingVertical[0] : '-';
const safe = v => (typeof v === 'string' || typeof v === 'number') ? v : '?';

await step('Section yerleri', async () => {
  for (const [plat, pn] of [[web, 'Web'], [mob, 'Mobile']]) {
    const secs = plat.children.filter(n => n.type === 'SECTION');
    report.info[pn + ' son 6 Section'] = secs.slice(-6).map(n => n.name + ' x=' + Math.round(n.x) + ' y=' + Math.round(n.y) + ' ' + sz(n));
    report.info[pn + ' Section sayısı'] = secs.length + ' · Stadium card + Search results + Club card var mı: ' + secs.filter(n => /^(Stadium card|Search results|Club card)$/.test(n.name)).map(n => n.name).join(',');
  }
});

await step('Component adları (01)', async () => {
  const sets = p01.findAll(n => n.type === 'COMPONENT_SET' || (n.type === 'COMPONENT' && n.parent && n.parent.type !== 'COMPONENT_SET'));
  const re = /crest|club|strip|chip|event row|person|contact|player result|facility result|empty|tag|select|dropdown|tab|table header|heading|notice|key fact|breadcrumb|badge|button|avatar|stat/i;
  report.info.componentCount = sets.length;
  report.info.ilgili = sets.filter(n => re.test(n.name)).map(n => n.name + (n.type === 'COMPONENT_SET' ? ' {' + Object.entries(n.variantGroupProperties || {}).map(([k, v]) => k + ':' + v.values.join('|')).join('; ') + '}' : ''));
});

await step('Stadium hero ağacı (masaüstü)', async () => {
  const sec = web.children.find(n => n.type === 'SECTION' && n.name === 'Stadium card'); if (!sec) throw new Error('Stadium card Section yok');
  const f = sec.children.find(n => n.type === 'FRAME' && /Stadium card · Desktop$/.test(n.name)); if (!f) throw new Error('frame yok');
  const out = [];
  async function walk(n, d, pre) { if (d > 5) return; let extra = ''; if (n.type === 'TEXT') extra = ' "' + n.characters.slice(0, 40) + '"'; if (n.type === 'INSTANCE') { const m = await n.getMainComponentAsync(); extra = ' <' + (m ? (m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent.name : m.name) : '?') + '>'; } out.push(pre + n.name + ' [' + n.type + ' ' + sz(n) + ' ' + lay(n) + ']' + extra); if ('children' in n && n.type !== 'INSTANCE') for (const c of n.children) await walk(c, d + 1, pre + ' '); }
  await walk(f, 0, '');
  report.info.stadiumDesktop = out.slice(0, 90);
});

await step('Stadium hero ağacı (mobil)', async () => {
  const sec = mob.children.find(n => n.type === 'SECTION' && n.name === 'Stadium card'); if (!sec) throw new Error('Mobile Stadium card yok');
  const f = sec.children.find(n => n.type === 'FRAME' && /Stadium card · Mobile$/.test(n.name)); if (!f) throw new Error('frame yok');
  const out = [];
  (function walk(n, d, pre) { if (d > 4) return; out.push(pre + n.name + ' [' + n.type + ' ' + sz(n) + ' ' + lay(n) + ']'); if ('children' in n && n.type !== 'INSTANCE') for (const c of n.children) walk(c, d + 1, pre + ' '); })(f, 0, '');
  report.info.stadiumMobile = out.slice(0, 50);
});

await step('Clubs sekmesi satırı', async () => {
  const sec = web.children.find(n => n.type === 'SECTION' && n.name === 'Search results'); if (!sec) throw new Error('Search results yok');
  const f = sec.children.find(n => n.type === 'FRAME' && /Clubs · Desktop$/.test(n.name)); if (!f) throw new Error('Clubs frame yok');
  let row = null; for (const n of f.findAll(x => x.type === 'INSTANCE')) { const m = await n.getMainComponentAsync(); if (m && m.parent && m.parent.name === 'Club result') { row = n; break; } }
  if (!row) throw new Error('Club result yok');
  const out = [];
  (function walk(n, d, pre) { if (d > 3) return; let extra = ''; if (n.type === 'TEXT') extra = ' "' + n.characters.slice(0, 40) + '"'; out.push(pre + n.name + ' [' + n.type + ' ' + sz(n) + ' ' + lay(n) + ']' + extra); if ('children' in n) for (const c of n.children) walk(c, d + 1, pre + ' '); })(row, 0, '');
  report.info.clubResult = out.slice(0, 30);
});

return report;
