// step 77 · Social icon set'ini Navigation Section'ina tasi ve duzeni koru

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const page = re => figma.root.children.find(p => re.test(p.name));
const page0 = page(/^01/);
await page0.loadAsync();

const GAP_BIG = 120, GAP_TEXT = 16, PAD = 80;

function relayout(s) {
  const kids = s.children.slice();
  kids.sort((a, b) => {
    const ba = a.absoluteBoundingBox, bb = b.absoluteBoundingBox;
    if (!ba || !bb) return 0;
    if (Math.abs(ba.y - bb.y) > 4) return ba.y - bb.y;
    return ba.x - bb.x;
  });
  const left = s.x + PAD;
  let y = s.y + PAD, prevText = false, first = true;
  for (const k of kids) {
    const b = k.absoluteBoundingBox;
    if (!b) continue;
    const isText = k.type === 'TEXT';
    if (!first) y += (isText && prevText) ? GAP_TEXT : GAP_BIG;
    k.x = k.x + (left - b.x);
    k.y = k.y + (y - b.y);
    y += b.height;
    prevText = isText; first = false;
  }
  let right = -Infinity, bottom = -Infinity;
  for (const k of s.children) {
    const b = k.absoluteBoundingBox;
    if (!b) continue;
    if (b.x + b.width > right) right = b.x + b.width;
    if (b.y + b.height > bottom) bottom = b.y + b.height;
  }
  s.resizeWithoutConstraints(Math.ceil(right - s.x + PAD), Math.ceil(bottom - s.y + PAD));
}

await step('Social icon tasindi', async () => {
  const soc = page0.children.find(n => n.name === 'Social icon');
  if (!soc) { report.info['social icon'] = 'sayfa kokunde yok, zaten tasinmis olabilir'; return; }
  const nav = page0.children.find(n => n.type === 'SECTION' && /Navigation/.test(n.name));
  if (!nav) throw new Error('Navigation Section bulunamadi');
  nav.appendChild(soc);
  relayout(nav);
  report.info['Navigation'] = { w: Math.round(nav.width), h: Math.round(nav.height), bilesen: nav.children.length };
  report.info['Navigation icerik'] = nav.children.map(n => n.name + ' [' + n.type + '] y=' + Math.round(n.y));
});

await step('Sectionlari yeniden hizala', async () => {
  const sections = page0.children.filter(n => n.type === 'SECTION').sort((a, b) => a.x - b.x);
  const topY = Math.min.apply(null, sections.map(s => s.y));
  let x = sections.length ? sections[0].x : 0;
  const rows = [];
  for (const s of sections) {
    s.x = x; s.y = topY;
    x = s.x + s.width + 160;
    rows.push(s.name + ' x=' + Math.round(s.x) + ' w=' + Math.round(s.width) + ' h=' + Math.round(s.height));
  }
  report.info['section yerlesimi'] = rows;
});

await step('Cakisma kontrolu', async () => {
  const all = page0.children.slice();
  const cak = [];
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i].absoluteBoundingBox, b = all[j].absoluteBoundingBox;
      if (!a || !b) continue;
      if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) cak.push(all[i].name + ' <-> ' + all[j].name);
    }
  }
  report.info['sayfa kokunde cakisma'] = cak;

  const ic = [];
  for (const s of all.filter(n => n.type === 'SECTION')) {
    const kids = s.children;
    for (let i = 0; i < kids.length; i++) {
      for (let j = i + 1; j < kids.length; j++) {
        const a = kids[i].absoluteBoundingBox, b = kids[j].absoluteBoundingBox;
        if (!a || !b) continue;
        if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ic.push(s.name + ': ' + kids[i].name + ' <-> ' + kids[j].name);
      }
    }
  }
  report.info['section icinde cakisma'] = ic;
});

return report;
