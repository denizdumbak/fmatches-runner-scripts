// step 294 · (1) Events: Account menu ekranlarını Date picker'ın altındaki yeni satıra taşı (Web+Mobile), Section/komşu Section/platform boyutlarını uydur · (2) 9 şüpheli taşma için salt okunur ölçüm dökümü
const report = { done: [], errors: [], moved: [], overlapsAfter: [], dump: [] };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const page = figma.root.children.find(p => /^02/.test(p.name));
await page.loadAsync();
const BB = n => n.absoluteBoundingBox;
const inter = (a, b) => { const x = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x), y = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y); return x > 0 && y > 0 ? [Math.round(x), Math.round(y)] : null; };

// ---------- (1) taşıma ----------
for (const dev of ['Desktop', 'Mobile']) await step('move Account menu · ' + dev, async () => {
  const plat = page.children.find(n => n.type === 'SECTION' && n.name === (dev === 'Desktop' ? 'Web' : 'Mobile'));
  const menu = plat.findOne(n => n.type === 'FRAME' && n.name === 'Events / Account menu · ' + dev);
  if (!menu) throw new Error('menu ekranı yok');
  const sec = menu.parent;
  const others = sec.children.filter(c => c !== menu && BB(c));
  const bottom = Math.max(...others.map(c => c.y + c.height));
  const before = { x: menu.x, y: menu.y, secH: sec.height };
  menu.y = Math.round(bottom + 160);
  const needH = Math.round(menu.y + menu.height + 80);
  if (needH > sec.height) sec.resizeWithoutConstraints(sec.width, needH);
  report.moved.push(`${dev}: Account menu y ${before.y} -> ${menu.y}, Events Section yükseklik ${before.secH} -> ${sec.height}`);
  // komşu alt Section'lar: üst üste binen varsa (yalnız x aralığı kesişenlerde) aşağı it
  const subs = plat.children.filter(n => n.type === 'SECTION').sort((a, b) => a.y - b.y);
  for (let i = 1; i < subs.length; i++) for (let j = 0; j < i; j++) {
    const a = subs[j], b = subs[i];
    const xo = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
    if (xo > 0 && b.y < a.y + a.height + 160) { const d = a.y + a.height + 160 - b.y; b.y += d; report.moved.push(`${dev}: Section "${b.name}" ${d}px aşağı`); }
  }
  const bot = Math.max(...plat.children.map(c => c.y + c.height));
  if (dev === 'Desktop' && plat.height < bot + 120) plat.resizeWithoutConstraints(plat.width, bot + 120);
  if (dev === 'Mobile' && plat.height < bot + 120) plat.resizeWithoutConstraints(plat.width, bot + 120);
});
await step('check overlaps after', async () => {
  for (const plat of page.children.filter(n => n.type === 'SECTION')) {
    const subs = plat.children.filter(n => n.type === 'SECTION');
    for (let i = 0; i < subs.length; i++) for (let j = i + 1; j < subs.length; j++) { const o = inter(BB(subs[i]), BB(subs[j])); if (o) report.overlapsAfter.push(`${plat.name} Section ${subs[i].name} x ${subs[j].name} ${o}`); }
    for (const sub of subs) {
      const sc = sub.children.filter(n => n.type === 'FRAME' && !/^Flow ·/.test(n.name));
      for (let i = 0; i < sc.length; i++) for (let j = i + 1; j < sc.length; j++) { const o = inter(BB(sc[i]), BB(sc[j])); if (o) report.overlapsAfter.push(`${plat.name} ${sub.name}: ${sc[i].name} x ${sc[j].name} ${o}`); }
    }
  }
  if (!report.overlapsAfter.length) report.overlapsAfter.push('none');
});

// ---------- (2) ölçüm dökümü ----------
const CASES = [
  ['Profiles / Player / Own profile · Mobile', 'Hero · player identity', 'Profile actions'],
  ['Profiles / Player / Own profile / Edit about · Desktop', 'Field', 'Value'],
  ['Profiles / Player / Own profile / Edit about · Mobile', 'Field', 'Value'],
  ['Profiles / Player / Own profile / Edit career · Mobile', 'Edit actions', 'Buttons'],
  ['Messenger / Add to contacts · Mobile', 'Text', 'Title'],
  ['Shortlists / Shortlists · Mobile', 'Fact', 'Value'],
  ['Events / My events / Applied · Mobile', 'Details', 'Meta'],
  ['Home / Main / Calendar view · Desktop', 'Calendar', 'Month grid'],
  ['Log in / Wrong email · Desktop', null, 'Footer'],
  ['Profiles / Player · Desktop', 'Identity', 'Key facts'],
  ['Profiles / Player / Name length 15+ · Desktop', 'Identity', 'Key facts']
];
const chain = n => { const a = []; let x = n.parent; while (x && x.type !== 'PAGE' && x.type !== 'SECTION') { a.push(`${(x.name || '').slice(0, 22)}${x.clipsContent ? '[clip]' : ''}`); x = x.parent; } return a.slice(0, 5).join(' < '); };
for (const [scr, par, ch] of CASES) await step('dump ' + scr + ' :: ' + ch, async () => {
  const s = page.findOne(n => n.type === 'FRAME' && n.name === scr);
  if (!s) { report.dump.push(scr + ': ekran bulunamadı'); return; }
  const sb = BB(s);
  const nodes = s.findAll(n => n.name === ch && n.visible !== false && (par === null || (n.parent && n.parent.name === par)));
  for (const n of nodes.slice(0, 3)) {
    const b = BB(n), p = n.parent, pb = BB(p);
    const txt = n.type === 'TEXT' ? ` · "${n.characters.slice(0, 50)}" autoResize=${n.textAutoResize}` : '';
    const kids = 'children' in n ? ` · çocuk genişlikleri [${n.children.slice(0, 6).map(c => Math.round(c.width)).join(',')}]` : '';
    report.dump.push(`${scr} :: ${par}>${ch}: node ${Math.round(b.width)}x${Math.round(b.height)} @${Math.round(b.x - sb.x)},${Math.round(b.y - sb.y)} (ekran ${Math.round(sb.width)}x${Math.round(sb.height)}) · ebeveyn ${Math.round(pb.width)}x${Math.round(pb.height)} layout=${p.layoutMode || '-'} · node sizing H=${n.layoutSizingHorizontal || '-'} V=${n.layoutSizingVertical || '-'} · taşıyor: sağ ${Math.round(b.x + b.width - (sb.x + sb.width))} alt ${Math.round(b.y + b.height - (sb.y + sb.height))} (ekrana göre) ${Math.round(b.x + b.width - (pb.x + pb.width))} (ebeveyne göre)${txt}${kids} · zincir: ${chain(n)}`);
  }
  if (!nodes.length) report.dump.push(`${scr}: ${par}>${ch} bulunamadı`);
});
return report;
