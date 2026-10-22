// step 181 · Silhouette: Role=Player varyantlari yeni erkek silueti (gorsel dolgu) ile degisir, Referee Player varyantina gecer; Role=Other'a dokunulmaz
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
const r1 = n => Math.round(n * 10) / 10;
const URL_M = 'https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/img/silhouettes/male-v1.png';
let img = null, ratio = 1, set = null;

await step('load image and set', async () => {
  img = await figma.createImageAsync(URL_M);
  const s = await img.getSizeAsync(); ratio = s.height / s.width;
  report.info.image = s.width + 'x' + s.height + ' ratio ' + r1(ratio);
  set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Silhouette');
  if (!set) throw new Error('Silhouette set missing');
});

await step('replace Role=Player variants', async () => {
  if (!img || !set) throw new Error('skipped: image or set missing');
  const placed = [];
  for (const v of set.children) {
    if (!/Role=Player/.test(v.name)) continue;
    const W = v.width, H = v.height; const hero = /Hero/.test(v.name);
    let w, h, x, y;
    if (hero) { w = W; h = W * ratio; x = 0; y = H - h; }          // tam genislik, tabana basar
    else { h = H * 0.9; w = h / ratio; x = (W - w) / 2; y = H - h; } // avatar boyutlari: kucuk bosluk, tabana basar
    for (const c of v.children.slice()) c.remove();
    const rect = figma.createRectangle();
    rect.name = 'Silhouette image';
    rect.resize(w, h);
    rect.fills = [{ type: 'IMAGE', imageHash: img.hash, scaleMode: 'FILL' }];
    v.appendChild(rect);
    rect.x = x; rect.y = y;
    rect.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
    placed.push(v.name + ' > ' + r1(w) + 'x' + r1(h) + ' at ' + r1(x) + ',' + r1(y));
  }
  report.info.placed = placed;
});

function topFrameName(i) {
  let x = i;
  while (x.parent && x.parent.type !== 'SECTION' && x.parent.type !== 'PAGE') x = x.parent;
  return x.name;
}
async function variantOf(i) { const m = await i.getMainComponentAsync(); return m && m.parent === set ? m.name : null; }

await step('Referee instances to Player variant', async () => {
  const changed = [];
  for (const i of p02.findAll(n => n.type === 'INSTANCE')) {
    const vn = await variantOf(i); if (!vn) continue;
    const top = topFrameName(i);
    if (!/^Profiles \/ Referee/.test(top) || !/Role=Other/.test(vn)) continue;
    const w = i.width, h = i.height;
    const key = Object.keys(i.componentProperties).find(k => /^Role/.test(k));
    const o = {}; o[key] = 'Player'; i.setProperties(o);
    if (Math.round(i.width) !== Math.round(w) || Math.round(i.height) !== Math.round(h)) i.resize(w, h);
    changed.push(top + ' : ' + vn + ' > ' + (await variantOf(i)));
  }
  report.info.refereeChanged = changed;
});

await step('verify usage', async () => {
  const rows = {};
  for (const pg of [p01, p02]) {
    for (const i of pg.findAll(n => n.type === 'INSTANCE')) {
      const vn = await variantOf(i); if (!vn) continue;
      const k = pg.name.slice(0, 2) + ' | ' + vn + ' | ' + topFrameName(i);
      rows[k] = (rows[k] || 0) + 1;
    }
  }
  report.info.usageAfter = rows;
  const imgs = set.findAll(n => n.name === 'Silhouette image').map(n => n.parent.name + ' fill=' + (n.fills[0] ? n.fills[0].type : '-'));
  report.info.imageLayers = imgs;
});

return report;
