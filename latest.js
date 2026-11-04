// step 299 · inspect (salt okunur, G4 minWidth sınaması hariç): ekran içi yetim/mutlak konumlu öğeler + "My events / No events created · Desktop" ağacı
const report = { errors: [], mine: [], absGroups: [], topLeft: [], g4: [] };
const page = figma.root.children.find(p => /^02/.test(p.name));
await page.loadAsync();
const BB = n => n.absoluteBoundingBox;
const R = n => Math.round(n);
const nm = n => (n.name || '').slice(0, 36);
const SKIP = /^(Flow ·|Note ·)/;
const rel = (n, s) => `${R(BB(n).x - BB(s).x)},${R(BB(n).y - BB(s).y)} ${R(BB(n).width)}x${R(BB(n).height)}`;

// A) Kullanıcının gösterdiği ekran: 3 seviye ağaç
const mine = page.findAll(n => n.type === 'FRAME' && /^Events \/ My events \/ No events created · Desktop$/.test(n.name))[0];
if (mine) {
  const tree = (n, d) => { if (d > 3 || !('children' in n)) return; for (const c of n.children) { mine_push(c, d); tree(c, d + 1); } };
  const mine_push = (c, d) => report.mine.push(`${'  '.repeat(d)}${c.type} "${nm(c)}" ${rel(c, mine)}${c.layoutPositioning === 'ABSOLUTE' ? ' ABS' : ''}${c.visible === false ? ' hidden' : ''}`);
  tree(mine, 0);
} else report.errors.push('My events / No events created · Desktop bulunamadı');

// B) tüm ekranlarda: mutlak konumlu çocuklar (derinlik <= 4) ve sol üst köşede (0..8, 0..8) duranlar
const groups = new Map(), tl = new Map();
for (const plat of page.children.filter(n => n.type === 'SECTION')) for (const sec of plat.children.filter(n => n.type === 'SECTION')) {
  for (const s of sec.children.filter(c => c.type === 'FRAME' && !SKIP.test(c.name))) {
    const walk = (p, d) => {
      if (d > 4 || !('children' in p)) return;
      for (const c of p.children) {
        if (c.visible === false || !BB(c)) continue;
        const abs = c.layoutPositioning === 'ABSOLUTE';
        const x = BB(c).x - BB(s).x, y = BB(c).y - BB(s).y;
        const stray = x >= -2 && x <= 8 && y >= -2 && y <= 8 && c.type !== 'RECTANGLE' && p !== s && !SKIP.test(c.name);
        const stray0 = p === s && (!s.layoutMode || s.layoutMode === 'NONE') && x >= -2 && x <= 8 && y >= -2 && y <= 8;
        if (abs) { const k = `${plat.name} › ${sec.name} :: ${nm(p)} > ${nm(c)}`; const g = groups.get(k) || { n: 0, ex: `${s.name} @ ${rel(c, s)}` }; g.n++; groups.set(k, g); }
        if (stray || stray0) { const k = `${plat.name} › ${sec.name} :: ${nm(p)} > ${nm(c)} (${c.type})`; const g = tl.get(k) || { n: 0, ex: `${s.name} @ ${rel(c, s)}` }; g.n++; tl.set(k, g); }
        if (c.type === 'FRAME' || c.type === 'GROUP' || c.type === 'INSTANCE') walk(c, d + 1);
      }
    };
    walk(s, 0);
  }
}
report.absGroups = [...groups.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 40).map(([k, g]) => `${g.n}x ${k} · örnek ${g.ex}`);
report.topLeft = [...tl.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 40).map(([k, g]) => `${g.n}x ${k} · örnek ${g.ex}`);

// C) Shortlists Fact asgari genişlik sınaması (ilk Key facts)
try {
  const sec = page.children.find(n => n.type === 'SECTION' && n.name === 'Mobile').children.find(n => n.type === 'SECTION' && n.name === 'Shortlists');
  const s = sec.children.find(c => c.type === 'FRAME' && c.name === 'Shortlists / Shortlists · Mobile');
  const kf = s.findOne(n => n.name === 'Key facts');
  const inInst = n => { let x = n.parent; while (x) { if (x.type === 'INSTANCE') return x.name; x = x.parent; } return 'no'; };
  report.g4.push(`Key facts ${kf.type} instanceİçinde=${inInst(kf)} gap=${kf.itemSpacing}`);
  for (const f of kf.children) report.g4.push(`${f.type} "${nm(f)}" w=${R(f.width)} min=${f.minWidth} max=${f.maxWidth} grow=${f.layoutGrow} sH=${f.layoutSizingHorizontal} cA=${f.counterAxisAlignItems} pad[L${f.paddingLeft} R${f.paddingRight}]`);
  const age = kf.children[0], before = R(age.width);
  try { age.minWidth = null; age.maxWidth = null; age.layoutSizingHorizontal = 'FIXED'; age.resize(23, age.height); report.g4.push(`deneme: Age Fact ${before} -> ${R(age.width)} (min=${age.minWidth})`); }
  catch (e) { report.g4.push('deneme hata: ' + e.message); }
} catch (e) { report.errors.push('G4 probe: ' + e.message); }
return report;
