// step 159 · galeri fotograflari orijinal haline doner (A, C, D, F): bulanik surumun hash'i 01 ve 02'deki butun IMAGE dolgularinda orijinalle degisir

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();

const BASE = 'https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/img/gallery/';
const MAP = {};
await step('images', async () => {
  for (const k of ['a', 'c', 'd', 'f']) {
    const oldH = (await figma.createImageAsync(BASE + 'gallery-' + k + '.jpg')).hash;
    const newH = (await figma.createImageAsync(BASE + 'gallery-' + k + '-orig.jpg')).hash;
    MAP[oldH] = { k, newH };
  }
});

await step('swap fills', async () => {
  const count = { a: 0, c: 0, d: 0, f: 0 };
  for (const page of [p01, p02]) {
    for (const n of page.findAll(x => 'fills' in x && x.fills !== figma.mixed && x.fills.some(p => p.type === 'IMAGE' && MAP[p.imageHash]))) {
      n.fills = n.fills.map(p => {
        if (p.type !== 'IMAGE' || !MAP[p.imageHash]) return p;
        count[MAP[p.imageHash].k]++;
        return Object.assign({}, p, { imageHash: MAP[p.imageHash].newH });
      });
    }
  }
  report.info.swapped = count;
  let left = 0;
  for (const page of [p01, p02]) left += page.findAll(x => 'fills' in x && x.fills !== figma.mixed && x.fills.some(p => p.type === 'IMAGE' && MAP[p.imageHash])).length;
  report.info.blurredLeft = left;
});

return report;
