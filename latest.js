// step 184 · Silhouette: kadin forma gorseli female-kit-v2 ile degisir (yaka mavi-gri yerine yesil-gri); yalniz Gender=Female, Role=Player varyantlarindaki gorsel dolgusu
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/);
const RAW = 'https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/img/silhouettes/';
let set = null, oldHash = null, newHash = null;

await step('load images and set', async () => {
  const o = await figma.createImageAsync(RAW + 'female-kit-v1.png'); oldHash = o.hash;
  const n = await figma.createImageAsync(RAW + 'female-kit-v2.png'); newHash = n.hash;
  const s = await n.getSizeAsync(); report.info.newImage = s.width + 'x' + s.height;
  if (oldHash === newHash) throw new Error('v2 same as v1 (fetch cache?), nothing changed');
  set = p01.findOne(x => x.type === 'COMPONENT_SET' && x.name === 'Silhouette');
  if (!set) throw new Error('Silhouette set missing');
});

await step('swap image fill', async () => {
  if (!set || !newHash) throw new Error('skipped');
  const vars = set.children.filter(v => /Role=Player/.test(v.name) && /Gender=Female/.test(v.name));
  report.info.variants = vars.map(v => v.name);
  let swapped = 0, already = 0, other = 0;
  for (const v of vars) {
    for (const r of v.findAll(x => x.name === 'Silhouette image' && Array.isArray(x.fills))) {
      const fills = r.fills.map(f => {
        if (f.type !== 'IMAGE') return f;
        if (f.imageHash === newHash) { already++; return f; }
        if (f.imageHash !== oldHash) other++;
        swapped++; return Object.assign({}, f, { imageHash: newHash });
      });
      r.fills = fills;
    }
  }
  report.info.swapped = swapped; report.info.alreadyV2 = already; report.info.unexpectedHash = other;
});

await step('verify', async () => {
  if (!set) throw new Error('skipped');
  let v1 = 0, v2 = 0;
  for (const r of set.findAll(x => x.name === 'Silhouette image' && Array.isArray(x.fills)))
    for (const f of r.fills) if (f.type === 'IMAGE') { if (f.imageHash === oldHash) v1++; if (f.imageHash === newHash) v2++; }
  report.info.layersWithV1 = v1; report.info.layersWithV2 = v2;
});

return report;
