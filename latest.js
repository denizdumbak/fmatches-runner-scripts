// step 113 · Hero slayt 3: yeni fotograf (el sikisma sirasi, Pexels + Gemini genisletme) · masaustu hero-c-3, mobil hero-mc-3

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const page1 = pageOf(/^01/), page2 = pageOf(/^02/);
await page1.loadAsync(); await page2.loadAsync();

const RAW = 'https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/img/m3/';
const IMG = {};
await step('load images', async () => {
  IMG.d = (await figma.createImageAsync(RAW + 'hero-c-3.jpg')).hash;
  IMG.m = (await figma.createImageAsync(RAW + 'hero-mc-3.jpg')).hash;
});

const setPhoto = n => {
  const desk = n.width > 800;
  n.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: desk ? IMG.d : IMG.m }];
  return desk ? 'Desktop' : 'Mobile';
};

// 1) Ana component: Slide=3 olan her varyant (Hero slide ve varsa Hero carousel)
await step('components slide 3', async () => {
  const comps = page1.findAll(n => n.type === 'COMPONENT' && n.variantProperties && n.variantProperties.Slide === '3');
  report.info.components = [];
  for (const c of comps) {
    const photos = c.findAll(n => n.name === 'Scene photo');
    for (const p of photos) report.info.components.push((c.parent ? c.parent.name : '') + ' / ' + c.name + ' -> ' + setPhoto(p));
  }
  if (!report.info.components.length) throw new Error('Slide=3 icinde Scene photo bulunamadi');
});

// 2) Sekme 02: Slayt 3 tam sayfalari (override varsa diye)
await step('pages slide 3', async () => {
  const frames = page2.findAll(n => n.type === 'FRAME' && /^Home \/ Main \/ Slide 3 · /.test(n.name));
  report.info.pages = [];
  for (const f of frames) for (const p of f.findAll(n => n.name === 'Scene photo' && n.visible)) report.info.pages.push(f.name + ' -> ' + setPhoto(p));
});

return report;
