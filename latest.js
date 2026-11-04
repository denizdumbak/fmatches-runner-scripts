// step 295 · 4 net taşma düzeltmesi (Mobile Profile actions sarma, Edit about alan HUG, Wrong email ekran HUG, My events Meta kısalt) + 4 belirsiz yer için salt okunur döküm
const report = { done: [], errors: [], fixes: [], moved: [], overlapsAfter: [], dump: [] };
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
const desc = n => `${n.type} "${(n.name || '').slice(0, 30)}" ${R(n.width)}x${R(n.height)} @${R(n.x)},${R(n.y)}${n.layoutMode && n.layoutMode !== 'NONE' ? ` L=${n.layoutMode}` : ''} sH=${n.layoutSizingHorizontal || '-'} sV=${n.layoutSizingVertical || '-'}${'paddingLeft' in n ? ` pad[L${n.paddingLeft} R${n.paddingRight}]` : ''}${n.layoutPositioning === 'ABSOLUTE' ? ' ABS' : ''}${'counterAxisAlignItems' in n && n.layoutMode !== 'NONE' ? ` cA=${n.counterAxisAlignItems} pA=${n.primaryAxisAlignItems}` : ''}`;

// ---------- düzeltmeler ----------
await step('F1 Mobile Own profile · Profile actions sar', async () => {
  for (const s of screensOf(sub('Mobile', 'Own profile'))) {
    const nodes = s.findAll(n => n.name === 'Profile actions' && n.parent && n.parent.name === 'Hero · player identity' && n.visible !== false);
    for (const n of nodes) {
      const p = n.parent, o = rightOver(n, p); if (o <= 4) continue;
      const before = `${R(n.width)}x${R(n.height)}, hero ${R(p.height)}, ekran ${R(s.height)}`;
      n.layoutWrap = 'WRAP'; n.layoutSizingHorizontal = 'FILL'; n.counterAxisSpacing = n.itemSpacing;
      report.fixes.push(`F1 ${s.name}: ${before} -> ${R(n.width)}x${R(n.height)}, hero ${R(p.height)}, ekran ${R(s.height)}, sağ taşma ${rightOver(n, p)}`);
    }
  }
});
for (const [pn, dev] of [['Web', 'Desktop'], ['Mobile', 'Mobile']]) await step('F2 Edit about alanı HUG · ' + dev, async () => {
  const s = scr(pn, 'Own profile', `Profiles / Player / Own profile / Edit about · ${dev}`);
  const f = s.findOne(n => n.name === 'Field' && n.parent && /About you/.test(n.parent.name));
  if (!f) throw new Error('Field bulunamadı');
  const v = f.findOne(n => n.name === 'Value');
  const before = `Field ${R(f.height)}, Value ${R(v.height)}, ekran ${R(s.height)}`;
  f.layoutSizingVertical = 'HUG';
  report.fixes.push(`F2 ${dev}: ${before} -> Field ${R(f.height)}, Value ${R(v.height)}, ekran ${R(s.height)}`);
});
await step('F3 Wrong email ekranı HUG', async () => {
  const s = scr('Web', 'Log in', 'Log in / Wrong email · Desktop');
  const ft = s.findOne(n => n.name === 'Footer' && n.parent === s);
  const before = `ekran ${R(s.height)}, footer alt taşma ${R(BB(ft).y + BB(ft).height - (BB(s).y + BB(s).height))}`;
  s.primaryAxisSizingMode = 'AUTO';
  report.fixes.push(`F3 ${before} -> ekran ${R(s.height)}, footer alt taşma ${R(BB(ft).y + BB(ft).height - (BB(s).y + BB(s).height))}`);
});
await step('F4 My events · Meta kısalt (Mobile)', async () => {
  for (const s of screensOf(sub('Mobile', 'Events'))) {
    for (const m of s.findAll(n => n.name === 'Meta' && n.parent && n.parent.name === 'Details' && n.visible !== false)) {
      const o = rightOver(m, m.parent); if (o <= 4) continue;
      const before = `${R(m.width)} / Details ${R(m.parent.width)}`;
      m.layoutSizingHorizontal = 'FILL';
      const last = m.children[m.children.length - 1];
      let t = last.type === 'TEXT' ? last : last.findOne(x => x.type === 'TEXT');
      if (last.type !== 'TEXT') last.layoutSizingHorizontal = 'FILL';
      t.textAutoResize = 'HEIGHT'; t.layoutSizingHorizontal = 'FILL'; t.textTruncation = 'ENDING'; t.maxLines = 1;
      report.fixes.push(`F4 ${s.name} · "${t.characters.slice(0, 28)}": Meta ${before} -> ${R(m.width)}, sağ taşma ${rightOver(m, m.parent)}, Meta yükseklik ${R(m.height)}`);
    }
  }
});

// ---------- Section / platform uyumu ----------
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

// ---------- salt okunur döküm ----------
await step('D1 Calendar Month grid', async () => {
  const s = scr('Web', 'Home page · calendar view', 'Home / Main / Calendar view · Desktop');
  const c = s.findOne(n => n.name === 'Calendar'); const g = c.findOne(n => n.name === 'Month grid');
  report.dump.push('D1 Calendar: ' + desc(c) + ' | parent: ' + desc(c.parent) + ' | Month grid: ' + desc(g) + ' | Calendar çocukları: ' + c.children.map(desc).join(' ; '));
  report.dump.push('D1 ebeveyn çocukları: ' + c.parent.children.map(desc).join(' ; '));
});
await step('D2 Edit career · Edit actions', async () => {
  const s = scr('Mobile', 'Own profile', 'Profiles / Player / Own profile / Edit career · Mobile');
  const e = s.findOne(n => n.name === 'Edit actions');
  report.dump.push('D2 Edit actions: ' + desc(e) + ` gap=${e.itemSpacing} | parent: ` + desc(e.parent) + ' | çocuklar: ' + e.children.map(desc).join(' ; ') + ' | Buttons çocukları: ' + (e.children[e.children.length - 1].children || []).map(desc).join(' ; '));
});
await step('D3 Add to contacts · Composer', async () => {
  const s = scr('Mobile', 'Messenger', 'Messenger / Add to contacts · Mobile');
  const c = s.findOne(n => n.name === 'Composer');
  report.dump.push('D3 Composer: ' + desc(c) + ' | çocuklar: ' + c.children.map(desc).join(' ; '));
  for (const k of c.children) if ('children' in k) report.dump.push('D3 ' + k.name + ' altı: ' + k.children.map(x => desc(x) + (x.type === 'TEXT' ? ` "${x.characters.slice(0, 40)}"` : '')).join(' ; '));
});
await step('D4 Shortlists · taşan Fact değeri', async () => {
  const s = scr('Mobile', 'Shortlists', 'Shortlists / Shortlists · Mobile');
  const bad = s.findAll(n => n.name === 'Value' && n.parent && n.parent.name === 'Fact' && n.visible !== false && rightOver(n, n.parent) > 4);
  report.dump.push(`D4 taşan Fact değeri sayısı: ${bad.length}`);
  for (const n of bad.slice(0, 3)) report.dump.push('D4 ' + desc(n) + ` taşma ${rightOver(n, n.parent)} | Fact: ` + desc(n.parent) + ' | Key facts: ' + desc(n.parent.parent) + ' | Fact çocukları: ' + n.parent.children.map(desc).join(' ; ') + ' | ' + (n.type === 'TEXT' ? `"${n.characters}"` : ''));
});
return report;
