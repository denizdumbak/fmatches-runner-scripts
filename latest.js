// step 76 · Foundations duzeni: Section icindeki bilesenleri ust uste binmeden yeniden diz

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const page = re => figma.root.children.find(p => re.test(p.name));
const page0 = page(/^01/);
await page0.loadAsync();

const GAP_BIG = 120;   // bilesenler arasi
const GAP_TEXT = 16;   // baslik ve aciklama metinleri arasi
const PAD = 80;        // Section ic bosluk

await step('Section duzeni', async () => {
  const sections = page0.children.filter(n => n.type === 'SECTION');
  const out = [];
  for (const s of sections) {
    const kids = s.children.slice();
    if (!kids.length) continue;

    // mevcut sirayi koru: once y, esitse x
    kids.sort((a, b) => {
      const ba = a.absoluteBoundingBox, bb = b.absoluteBoundingBox;
      if (!ba || !bb) return 0;
      if (Math.abs(ba.y - bb.y) > 4) return ba.y - bb.y;
      return ba.x - bb.x;
    });

    const left = s.x + PAD;
    let y = s.y + PAD;
    let prevWasText = false;
    const moved = [];

    for (const k of kids) {
      const b = k.absoluteBoundingBox;
      if (!b) continue;
      const isText = k.type === 'TEXT';
      if (moved.length) y += (isText && prevWasText) ? GAP_TEXT : GAP_BIG;
      const dx = left - b.x, dy = y - b.y;
      k.x = k.x + dx;
      k.y = k.y + dy;
      y += b.height;
      prevWasText = isText;
      moved.push({ ad: k.name, tur: k.type, y: Math.round(k.y), h: Math.round(b.height) });
    }

    // Section'i icerige sigdir
    let right = -Infinity, bottom = -Infinity;
    for (const k of s.children) {
      const b = k.absoluteBoundingBox;
      if (!b) continue;
      if (b.x + b.width > right) right = b.x + b.width;
      if (b.y + b.height > bottom) bottom = b.y + b.height;
    }
    s.resizeWithoutConstraints(
      Math.ceil(right - s.x + PAD),
      Math.ceil(bottom - s.y + PAD)
    );
    out.push({ section: s.name, bilesen: moved.length, w: Math.round(s.width), h: Math.round(s.height) });
  }
  report.info['sectionlar'] = out;
});

// Section'lar birbirinin ustune binmesin: yan yana, 160 px aralikla yeniden hizala
await step('Sectionlar arasi aralik', async () => {
  const sections = page0.children.filter(n => n.type === 'SECTION').sort((a, b) => a.x - b.x);
  if (!sections.length) return;
  let x = sections[0].x;
  const topY = Math.min.apply(null, sections.map(s => s.y));
  const rows = [];
  for (const s of sections) {
    s.x = x;
    s.y = topY;
    x = s.x + s.width + 160;
    rows.push({ section: s.name, x: Math.round(s.x), y: Math.round(s.y), w: Math.round(s.width), h: Math.round(s.height) });
  }
  report.info['section yerlesimi'] = rows;
});

// Sayfa kokunde kalan (Section disi) node'lar ust uste mi
await step('Sayfa kokundeki node kontrolu', async () => {
  const loose = page0.children.filter(n => n.type !== 'SECTION');
  report.info['section disi node'] = loose.map(n => {
    const b = n.absoluteBoundingBox;
    return { ad: n.name, tur: n.type, at: b ? Math.round(b.x) + ',' + Math.round(b.y) : '-', size: b ? Math.round(b.width) + 'x' + Math.round(b.height) : '-' };
  });
  const cakisan = [];
  for (let i = 0; i < loose.length; i++) {
    for (let j = i + 1; j < loose.length; j++) {
      const a = loose[i].absoluteBoundingBox, b = loose[j].absoluteBoundingBox;
      if (!a || !b) continue;
      if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) {
        cakisan.push(loose[i].name + ' <-> ' + loose[j].name);
      }
    }
  }
  report.info['cakisan section disi'] = cakisan;
});

return report;
