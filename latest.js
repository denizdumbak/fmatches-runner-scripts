// step 93 · Sekme 02 yerlesimi: calendar view frameleri bos alana tasindi, cakisma tarandi

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const pageOf = re => figma.root.children.find(p => re.test(p.name));
const pageHome = pageOf(/^02/);
if (pageHome) await pageHome.loadAsync();

const GAP = 320;
const box = n => n.absoluteBoundingBox;

function overlaps() {
  const kids = pageHome.children.filter(n => box(n));
  const hits = [];
  for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) {
    const a = box(kids[i]), b = box(kids[j]);
    if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height)
      hits.push(kids[i].name + ' <-> ' + kids[j].name);
  }
  return hits;
}

await step('Once ki durum', async () => {
  report.info['oncesi cakisma'] = overlaps();
});

await step('Calendar view frameleri tasindi', async () => {
  const cal = pageHome.children.filter(n => /calendar view/i.test(n.name));
  if (!cal.length) throw new Error('calendar view frameleri bulunamadi');

  const others = pageHome.children.filter(n => !/calendar view/i.test(n.name) && box(n));
  let right = -Infinity, topY = 0;
  for (const n of others) {
    const b = box(n);
    if (b.x + b.width > right) right = b.x + b.width;
  }
  const home = others.find(n => /^Home . Desktop$/.test(n.name));
  topY = home ? box(home).y : 0;

  cal.sort((a, b) => (/Desktop/.test(a.name) ? 0 : 1) - (/Desktop/.test(b.name) ? 0 : 1));

  let x = right + GAP;
  const placed = [];
  for (const n of cal) {
    const b = box(n);
    n.x += x - b.x;
    n.y += topY - b.y;
    placed.push(n.name + ' @ ' + Math.round(n.x) + ',' + Math.round(n.y) + ' (' + Math.round(b.width) + 'x' + Math.round(b.height) + ')');
    x += b.width + GAP;
  }
  report.info['tasinanlar'] = placed;
});

await step('Sonraki durum', async () => {
  const h = overlaps();
  report.info['sonrasi cakisma'] = h.length ? h : 'yok';
  report.info['sayfadaki ust seviye'] = pageHome.children.filter(n => box(n))
    .sort((a, b) => box(a).x - box(b).x)
    .map(n => n.name + ' @ ' + Math.round(box(n).x));
});

return report;
