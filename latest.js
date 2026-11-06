// step 313 · Faz 6 stadyum kartı için SALT OKUNUR inspect: 02 bölüm listesi, 01 component envanteri, profil sayfası iskeleti, stadyum/facility geçen ekran ve katmanlar, Map card Stadium, Club strip, Key fact, galeri
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = Math.round;
const pages = figma.root.children;
report.info.pages = pages.map(p => p.name);
const p01 = pages.find(p => /^01/.test(p.name));
const p02 = pages.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
const sz = n => `${R(n.width)}x${R(n.height)}`;

await step('A 02 sections', async () => {
  const out = [];
  for (const plat of p02.children.filter(n => n.type === 'SECTION')) {
    const secs = plat.children.filter(n => n.type === 'SECTION');
    out.push(`${plat.name}: ` + secs.map(s => `${s.name} (${s.children.filter(c => c.type === 'FRAME' && !/^Flow ·/.test(c.name)).length})`).join(' | '));
  }
  report.info.sections02 = out;
});

await step('B 01 components', async () => {
  const sets = [], comps = [];
  (function w(n) {
    if (n.type === 'COMPONENT_SET') { sets.push(`${n.name} [${n.children.length}] ${sz(n)}`); return; }
    if (n.type === 'COMPONENT' && n.parent && n.parent.type !== 'COMPONENT_SET') comps.push(`${n.name} ${sz(n)}`);
    if ('children' in n) for (const k of n.children) w(k);
  })(p01);
  report.info.componentSets = sets;
  report.info.components = comps;
});

await step('C stadium/facility mentions', async () => {
  const hits = [];
  const re = /stadium|facilit|capacity|pitch type|surface/i;
  (function w(n, path) {
    const p = path + ' › ' + n.name;
    if (re.test(n.name) && hits.length < 80) hits.push(`${n.type} ${p.slice(-140)}`);
    else if (n.type === 'TEXT' && re.test(n.characters) && hits.length < 80) hits.push(`TEXT "${n.characters.slice(0, 50)}" in ${p.slice(-110)}`);
    if ('children' in n && n.type !== 'INSTANCE') for (const k of n.children) w(k, p);
  })(p02, '02');
  report.info.stadiumHits = hits;
});

await step('D profile page skeleton', async () => {
  const find = (plat, secRe, frRe) => {
    const P = p02.children.find(n => n.type === 'SECTION' && n.name === plat);
    const S = P && P.children.find(n => n.type === 'SECTION' && secRe.test(n.name));
    return S && S.children.find(n => n.type === 'FRAME' && frRe.test(n.name));
  };
  const dump = (n, depth, max) => {
    const out = [];
    (function w(x, d) {
      const lay = 'layoutMode' in x && x.layoutMode !== 'NONE' ? `${x.layoutMode[0]} gap${x.itemSpacing} pad${x.paddingTop}/${x.paddingRight}/${x.paddingBottom}/${x.paddingLeft}` : '';
      out.push(`${'  '.repeat(d)}${x.type === 'INSTANCE' ? '◇' : ''}${x.name} ${sz(x)} ${lay}`.trimEnd());
      if ('children' in x && d < max && x.type !== 'INSTANCE') for (const k of x.children) w(k, d + 1);
    })(n, 0);
    return out;
  };
  const web = find('Web', /^Profiles · player/, /Desktop/);
  const mob = find('Mobile', /^Profiles · player/, /Mobile/);
  report.info.profileWebFrame = web ? web.name : 'yok';
  if (web) report.info.profileWeb = dump(web, 0, 3).slice(0, 60);
  if (mob) report.info.profileMobTop = dump(mob, 0, 2).slice(0, 30);
});

await step('E Map card stadium + Club strip + Key fact + Gallery', async () => {
  const pick = re => { const r = []; (function w(n) { if ((n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name)) r.push(n); if ('children' in n) for (const k of n.children) w(k); })(p01); return r; };
  const dump = (n, max) => { const out = []; (function w(x, d) {
    const lay = 'layoutMode' in x && x.layoutMode !== 'NONE' ? `${x.layoutMode[0]} gap${x.itemSpacing}` : '';
    out.push(`${'  '.repeat(d)}${x.name} ${sz(x)} ${lay}${x.type === 'TEXT' ? ' "' + x.characters.slice(0, 30) + '"' : ''}`.trimEnd());
    if ('children' in x && d < max) for (const k of x.children) w(k, d + 1); })(n, 0); return out; };
  for (const [key, re, max] of [['mapCard', /^Map card$/, 2], ['clubStrip', /^Club strip$/, 2], ['keyFact', /^Key fact$/, 2], ['gallery', /gallery/i, 2], ['hero', /^(Profile )?hero/i, 1]]) {
    const hits = pick(re);
    report.info[key] = hits.length ? hits.slice(0, 2).map(h => ({ name: h.name, type: h.type, variants: h.type === 'COMPONENT_SET' ? h.children.map(c => c.name).slice(0, 12) : undefined, tree: dump(h.type === 'COMPONENT_SET' ? h.children[0] : h, max).slice(0, 25) })) : 'yok';
  }
});

await step('F map stadium facilities screen', async () => {
  const P = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
  const S = P && P.children.filter(n => n.type === 'SECTION' && /map/i.test(n.name));
  report.info.mapSections = S ? S.map(s => `${s.name}: ` + s.children.filter(c => c.type === 'FRAME' && !/^Flow ·/.test(c.name)).map(c => c.name).join(' | ')) : 'yok';
});

return report;
