// step 296 · 4 taşma düzeltmesi: Calendar Month grid karta sığdır, Mobile Edit career "Remove this club" -> "Remove", Mobile Add to contacts başlığı sar, Mobile Shortlists kolon genişlikleri (Age/Contract sabit, Nationality esnek)
const report = { done: [], errors: [], fixes: [], moved: [], overlapsAfter: [] };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const page = figma.root.children.find(p => /^02/.test(p.name));
await page.loadAsync();
const BB = n => n.absoluteBoundingBox;
const R = n => Math.round(n);
const inter = (a, b) => { const x = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x), y = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y); return x > 0 && y > 0 ? [R(x), R(y)] : null; };
const plat = n => page.children.find(x => x.type === 'SECTION' && x.name === n);
const sub = (p, s) => { const sec = plat(p).children.find(x => x.type === 'SECTION' && x.name === s); if (!sec) throw new Error('Section yok: ' + p + ' › ' + s); return sec; };
const screensOf = sec => sec.children.filter(c => c.type === 'FRAME' && !/^Flow ·/.test(c.name));
const scr = (p, s, name) => { const x = screensOf(sub(p, s)).find(c => c.name === name); if (!x) throw new Error('ekran yok: ' + name); return x; };
const rightOver = (n, p) => R(BB(n).x + BB(n).width - (BB(p).x + BB(p).width));

await step('G1 Calendar · Month grid karta sığdır', async () => {
  const s = scr('Web', 'Home page · calendar view', 'Home / Main / Calendar view · Desktop');
  const cal = s.findOne(n => n.name === 'Calendar' && n.parent && n.parent.name === 'Upcoming events');
  const grid = cal.findOne(n => n.name === 'Month grid');
  const w = n => R(n.width);
  const before = `grid ${w(grid)}, satırlar [${grid.children.map(w).join(',')}], ilk satır hücreleri [${('children' in grid.children[1] ? grid.children[1].children.map(w) : []).join(',')}], Calendar yükseklik ${R(cal.height)}, sağ taşma ${rightOver(grid, cal)}`;
  grid.layoutSizingHorizontal = 'FILL';
  for (const row of grid.children) {
    row.layoutSizingHorizontal = 'FILL';
    if ('children' in row && row.layoutMode === 'HORIZONTAL') for (const c of row.children) c.layoutSizingHorizontal = 'FILL';
  }
  report.fixes.push(`G1 ${before} -> grid ${w(grid)}, satırlar [${grid.children.map(w).join(',')}], ilk satır hücreleri [${('children' in grid.children[1] ? grid.children[1].children.map(w) : []).join(',')}], Calendar yükseklik ${R(cal.height)}, sağ taşma ${rightOver(grid, cal)}`);
});

await step('G2 Mobile Edit career · Remove metnini kısalt', async () => {
  for (const s of screensOf(sub('Mobile', 'Own profile'))) {
    for (const e of s.findAll(n => n.name === 'Edit actions' && n.visible !== false)) {
      const b = e.children.find(c => c.name === 'Buttons'), t = e.children.find(c => c.type === 'TEXT');
      if (!b || !t || rightOver(b, e) <= 4) continue;
      const before = `"${t.characters}" ${R(t.width)}, taşma ${rightOver(b, e)}`;
      await figma.loadFontAsync(t.fontName);
      t.characters = 'Remove';
      report.fixes.push(`G2 ${s.name}: ${before} -> "${t.characters}" ${R(t.width)}, taşma ${rightOver(b, e)}`);
    }
  }
});

await step('G3 Mobile Add to contacts · başlığı sar', async () => {
  for (const s of screensOf(sub('Mobile', 'Messenger'))) {
    for (const t of s.findAll(n => n.name === 'Title' && n.type === 'TEXT' && n.parent && n.parent.name === 'Text' && n.parent.parent && n.parent.parent.name === 'Composer')) {
      if (rightOver(t, t.parent) <= 4) continue;
      const comp = t.parent.parent, before = `başlık ${R(t.width)}x${R(t.height)}, Composer ${R(comp.height)}`;
      t.textAutoResize = 'HEIGHT'; t.layoutSizingHorizontal = 'FILL';
      const btn = comp.children.find(c => /^Button/.test(c.name));
      const ov = btn ? inter(BB(t), BB(btn)) : null;
      report.fixes.push(`G3 ${s.name}: ${before} -> başlık ${R(t.width)}x${R(t.height)}, Composer ${R(comp.height)}, düğmeyle kesişim ${ov ? ov : 'yok'}`);
    }
  }
});

await step('G4 Mobile Shortlists · kolon genişlikleri', async () => {
  const s = scr('Mobile', 'Shortlists', 'Shortlists / Shortlists · Mobile');
  let fixed = 0, still = 0;
  for (const kf of s.findAll(n => n.name === 'Key facts' && n.visible !== false)) {
    const facts = kf.children.filter(c => c.name === 'Fact');
    if (facts.length !== 3) { report.errors.push('G4 Key facts 3 Fact değil: ' + facts.length); continue; }
    for (const f of facts) {
      const lab = f.findOne(n => n.type === 'TEXT' && n.name === 'Label'); const txt = lab ? lab.characters : '';
      const fw = /contract/i.test(txt) ? 84 : /age/i.test(txt) ? 56 : 0;
      if (fw) { f.resize(fw, f.height); f.layoutSizingHorizontal = 'FIXED'; f.layoutSizingVertical = 'HUG'; }
    }
    for (const f of facts) {
      const v = f.findOne(n => n.name === 'Value'); if (!v) continue;
      if (rightOver(v, f) > 4) {
        // yedek: kalan taşmayı kısalt
        v.layoutSizingHorizontal = 'FILL';
        const t = v.type === 'TEXT' ? v : v.findOne(x => x.type === 'TEXT');
        t.textAutoResize = 'HEIGHT'; t.layoutSizingHorizontal = 'FILL'; t.textTruncation = 'ENDING'; t.maxLines = 1;
        still++;
      }
    }
    fixed++;
  }
  const left = s.findAll(n => n.name === 'Value' && n.parent && n.parent.name === 'Fact' && n.visible !== false && rightOver(n, n.parent) > 4).length;
  const sizes = s.findAll(n => n.name === 'Key facts' && n.visible !== false).slice(0, 2).map(kf => kf.children.filter(c => c.name === 'Fact').map(f => R(f.width)).join('/')).join(' ; ');
  report.fixes.push(`G4 Key facts ${fixed}, yedek kısaltma gereken ${still}, kalan taşma ${left}, Fact genişlikleri (ilk 2 satır) ${sizes}`);
});

await step('settle Sections', async () => {
  for (const pn of ['Web', 'Mobile']) {
    const p = plat(pn), subs = p.children.filter(n => n.type === 'SECTION');
    for (const sec of subs) {
      const needH = R(Math.max(...sec.children.map(c => c.y + c.height)) + 80);
      if (needH > sec.height) { report.moved.push(`${pn} Section "${sec.name}" yükseklik ${R(sec.height)} -> ${needH}`); sec.resizeWithoutConstraints(sec.width, needH); }
    }
    subs.sort((a, b) => a.y - b.y);
    for (let i = 1; i < subs.length; i++) for (let j = 0; j < i; j++) {
      const a = subs[j], b = subs[i], xo = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      if (xo > 0 && b.y < a.y + a.height + 160) { const d = R(a.y + a.height + 160 - b.y); b.y += d; report.moved.push(`${pn} Section "${b.name}" ${d}px aşağı`); }
    }
    const bot = Math.max(...p.children.map(c => c.y + c.height));
    if (p.height < bot + 120) p.resizeWithoutConstraints(p.width, bot + 120);
  }
});
await step('check overlaps after', async () => {
  for (const p of page.children.filter(n => n.type === 'SECTION')) {
    const subs = p.children.filter(n => n.type === 'SECTION');
    for (let i = 0; i < subs.length; i++) for (let j = i + 1; j < subs.length; j++) { const o = inter(BB(subs[i]), BB(subs[j])); if (o) report.overlapsAfter.push(`${p.name} Section ${subs[i].name} x ${subs[j].name} ${o}`); }
    for (const sec of subs) { const sc = screensOf(sec); for (let i = 0; i < sc.length; i++) for (let j = i + 1; j < sc.length; j++) { const o = inter(BB(sc[i]), BB(sc[j])); if (o) report.overlapsAfter.push(`${p.name} ${sec.name}: ${sc[i].name} x ${sc[j].name} ${o}`); } }
  }
  if (!report.overlapsAfter.length) report.overlapsAfter.push('none');
});
return report;
