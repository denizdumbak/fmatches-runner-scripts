// step 309 · 308 yerleşim düzeltmesi: fazladan itilenleri geri al (2 · Buttons & tags: Tag -1104, Focus notu -1020 · 4 · Home page: Event row ve Ticker · role states -2280) · 7 · Map: Map marker / Map cluster çakışmasını aşağı iterek çöz
const report = { done: [], errors: [], fixes: [] };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const p01 = figma.root.children.find(p => /^01/.test(p.name));
await p01.loadAsync();
const BB = n => n.absoluteBoundingBox;
const sec = nm => { const s = p01.children.find(n => n.type === 'SECTION' && n.name === nm); if (!s) throw new Error('Section yok: ' + nm); return s; };
const kid = (s, nm) => { const k = s.children.find(n => n.name === nm); if (!k) throw new Error(s.name + ' içinde yok: ' + nm + ' · var: ' + s.children.map(c => c.name).join(', ')); return k; };
const inter = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

await step('1 Buttons & tags', async () => {
  const s = sec('2 · Buttons & tags');
  const tag = kid(s, 'Tag'), note = kid(s, 'Note · Focus ring'), chip = kid(s, 'Filter chip');
  const b = `Tag ${R(tag.y)} · Filter chip ${R(chip.y)} · not ${R(note.y)}`;
  tag.y -= 1104; note.y -= 1020;
  report.fixes.push(`1 önce ${b} -> sonra Tag ${R(tag.y)} · Filter chip ${R(chip.y)} · not ${R(note.y)}`);
  const order = s.children.slice().sort((a, c) => a.y - c.y).map(n => `${n.name}@${R(n.y)}-${R(n.y + n.height)}`);
  report.order2 = order;
});
await step('2 Home page', async () => {
  const s = sec('4 · Home page');
  const out = [];
  for (const nm of ['Event row', 'Ticker · role states']) { const k = kid(s, nm); const y0 = k.y; k.y -= 2280; out.push(`${nm} ${R(y0)} -> ${R(k.y)}`); }
  report.fixes.push('2 ' + out.join(' · '));
  report.order4 = s.children.slice().sort((a, c) => a.y - c.y).map(n => `${n.name}@${R(n.x)},${R(n.y)}-${R(n.y + n.height)}`);
});
await step('3 Map', async () => {
  const s = sec('7 · Map');
  const m = kid(s, 'Map marker'), c = kid(s, 'Map cluster');
  const before = `marker ${R(m.x)},${R(m.y)} ${R(m.width)}x${R(m.height)} · cluster ${R(c.x)},${R(c.y)} ${R(c.width)}x${R(c.height)}`;
  if (inter(BB(m), BB(c))) {
    const first = m.y <= c.y ? m : c, second = first === m ? c : m;
    const dy = first.y + first.height + 120 - second.y;
    const line = second.y;
    for (const k of s.children) if (k !== first && k.y >= line - 1) k.y += dy;
    report.fixes.push(`3 ${second.name} ve altındakiler +${R(dy)} · önce ${before}`);
  } else report.fixes.push('3 çakışma yok · ' + before);
});
await step('4 Section boyları + kontrol', async () => {
  const secs = p01.children.filter(n => n.type === 'SECTION');
  for (const s of secs) { let r = 0, b = 0; for (const k of s.children) { r = Math.max(r, k.x + k.width); b = Math.max(b, k.y + k.height); } s.resizeWithoutConstraints(Math.max(R(r + 80), 400), R(b + 80)); }
  secs.sort((a, b) => a.x - b.x);
  for (let i = 1; i < secs.length; i++) { const want = secs[i - 1].x + secs[i - 1].width + 160; if (secs[i].x < want) secs[i].x = want; }
  const out = [];
  for (const s of secs) { const k = s.children; for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) { const a = BB(k[i]), b = BB(k[j]); if (a && b && inter(a, b)) out.push(`${s.name}: ${k[i].name} x ${k[j].name}`); } }
  report.overlaps01 = out.length ? out : 'none';
  const so = []; for (let i = 0; i < secs.length; i++) for (let j = i + 1; j < secs.length; j++) if (inter(BB(secs[i]), BB(secs[j]))) so.push(secs[i].name + ' x ' + secs[j].name);
  report.sectionOverlaps = so.length ? so : 'none';
  // büyük boşluk taraması: aynı sütunda ardışık iki parça arası > 400
  const gaps = [];
  for (const s of secs) { const k = s.children.slice().sort((a, b) => a.y - b.y); for (let i = 1; i < k.length; i++) { const prev = k.slice(0, i).filter(p => p.x < k[i].x + k[i].width && p.x + p.width > k[i].x); if (!prev.length) continue; const bot = Math.max.apply(null, prev.map(p => p.y + p.height)); if (k[i].y - bot > 400) gaps.push(`${s.name}: ${k[i].name} üstünde ${R(k[i].y - bot)} px boşluk`); } }
  report.bigGaps = gaps.length ? gaps : 'none';
});
return report;
