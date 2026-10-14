// step 79 · inspect: sekme 01'e birakilan sosyal medya logolari (salt okunur)

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const page = re => figma.root.children.find(p => re.test(p.name));
const page0 = page(/^01/);
if (page0) await page0.loadAsync();

function imageInfo(n) {
  const out = [];
  if (!('fills' in n)) return out;
  const f = n.fills;
  if (!f || f === figma.mixed || !f.length) return out;
  for (const p of f) {
    if (p.type === 'IMAGE') out.push({ scaleMode: p.scaleMode, imageHash: p.imageHash });
    if (p.type === 'GRADIENT_LINEAR' || p.type === 'GRADIENT_RADIAL') out.push({ gradient: p.type, stops: p.gradientStops.length });
  }
  return out;
}

function describe(n, depth) {
  const b = n.absoluteBoundingBox;
  const d = {
    ad: n.name,
    tip: n.type,
    id: n.id,
    boyut: b ? Math.round(b.width) + 'x' + Math.round(b.height) : null,
    konum: b ? Math.round(b.x) + ',' + Math.round(b.y) : null
  };
  const img = imageInfo(n);
  if (img.length) d.gorsel = img;
  if (n.type === 'FRAME' || n.type === 'GROUP' || n.type === 'COMPONENT') {
    const vec = n.findAll(x => x.type === 'VECTOR' || x.type === 'ELLIPSE' || x.type === 'RECTANGLE' || x.type === 'BOOLEAN_OPERATION');
    d.icVektorSayisi = vec.length;
    let imgCount = 0;
    for (const v of n.findAll(x => true)) if (imageInfo(v).length) imgCount++;
    if (imgCount) d.icGorselSayisi = imgCount;
  }
  if (depth > 0 && 'children' in n && n.children.length && n.children.length <= 12) {
    d.cocuklar = n.children.map(c => describe(c, depth - 1));
  } else if ('children' in n) {
    d.cocukSayisi = n.children.length;
  }
  return d;
}

// 1) Sayfa kokundeki her sey (Section'lar haric icerik)
await step('Sayfa koku', async () => {
  report.info['sayfa adi'] = page0.name;
  report.info['kokteki dugumler'] = page0.children.map(n => ({
    ad: n.name, tip: n.type, id: n.id,
    boyut: n.absoluteBoundingBox ? Math.round(n.absoluteBoundingBox.width) + 'x' + Math.round(n.absoluteBoundingBox.height) : null,
    konum: n.absoluteBoundingBox ? Math.round(n.absoluteBoundingBox.x) + ',' + Math.round(n.absoluteBoundingBox.y) : null,
    cocuk: 'children' in n ? n.children.length : 0
  }));
});

// 2) Section disinda kalan, yani yeni birakilmis olabilecek dugumler
await step('Section disindakiler', async () => {
  const disi = page0.children.filter(n => n.type !== 'SECTION');
  report.info['Section disindaki dugumler'] = disi.map(n => describe(n, 2));
});

// 3) Adinda sosyal medya gecen her sey (tum agac)
await step('Isme gore sosyal arama', async () => {
  const re = /insta|face|linked|twitter|^x$|\bx\b|social|logo|brand/i;
  const hits = page0.findAll(n => re.test(n.name));
  report.info['isim eslesmeleri'] = hits.slice(0, 40).map(n => ({
    ad: n.name, tip: n.type, id: n.id,
    ebeveyn: n.parent ? n.parent.name : null,
    boyut: n.absoluteBoundingBox ? Math.round(n.absoluteBoundingBox.width) + 'x' + Math.round(n.absoluteBoundingBox.height) : null,
    gorsel: imageInfo(n)
  }));
  report.info['isim eslesme sayisi'] = hits.length;
});

// 4) Mevcut Social icon component'inin yapisi
await step('Mevcut Social icon', async () => {
  const s = page0.findOne(n => n.name === 'Social icon' && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
  if (!s) { report.info['Social icon'] = 'bulunamadi'; return; }
  const first = s.type === 'COMPONENT_SET' ? s.children[0] : s;
  report.info['Social icon'] = {
    id: s.id,
    varyantlar: s.type === 'COMPONENT_SET' ? s.children.map(c => c.name) : ['tek component'],
    ilkVaryant: describe(first, 3),
    koseler: 'topLeftRadius' in first ? {
      tl: first.topLeftRadius, tr: first.topRightRadius, bl: first.bottomLeftRadius, br: first.bottomRightRadius
    } : null,
    boyut: Math.round(first.width) + 'x' + Math.round(first.height)
  };
});

// 5) Gorsel tasiyan tum dugumler (hash'leriyle)
await step('Gorsel tasiyan dugumler', async () => {
  const withImg = page0.findAll(n => imageInfo(n).some(i => i.imageHash));
  report.info['gorselli dugumler'] = withImg.slice(0, 30).map(n => ({
    ad: n.name, tip: n.type, id: n.id,
    ebeveyn: n.parent ? n.parent.name : null,
    boyut: n.absoluteBoundingBox ? Math.round(n.absoluteBoundingBox.width) + 'x' + Math.round(n.absoluteBoundingBox.height) : null,
    gorsel: imageInfo(n)
  }));
  report.info['gorselli dugum sayisi'] = withImg.length;
});

return report;
