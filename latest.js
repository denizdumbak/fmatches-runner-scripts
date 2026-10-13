// step 72 · Inspect (salt okunur): surukenen gorseller, hero slayt 1 agaci, Role card yapisi, bos alan

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const page = re => figma.root.children.find(p => re.test(p.name));
const page0 = page(/^01/), pageHome = page(/^02/);
for (const p of [page0, pageHome]) { if (p) await p.loadAsync(); }

const box = n => { const b = n.absoluteBoundingBox; return b ? { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } : null; };

function tree(n, depth, maxDepth) {
  const b = box(n);
  const row = {
    name: n.name,
    type: n.type,
    size: b ? b.w + 'x' + b.h : '-',
    at: b ? b.x + ',' + b.y : '-'
  };
  if (n.type === 'TEXT') row.text = n.characters.length > 40 ? n.characters.slice(0, 40) + '...' : n.characters;
  if (n.type === 'INSTANCE') {
    try { row.props = Object.keys(n.componentProperties).join(' | '); } catch (e) { row.props = '?'; }
  }
  if ('fills' in n && Array.isArray(n.fills)) {
    const img = n.fills.filter(f => f.type === 'IMAGE');
    if (img.length) row.imageFill = img.map(f => f.scaleMode).join(',');
  }
  if ('children' in n && depth < maxDepth) {
    row.children = n.children.map(c => tree(c, depth + 1, maxDepth));
  } else if ('children' in n) {
    row.childCount = n.children.length;
  }
  return row;
}

// 1 · Suruklenen gorseller: 02 sayfasinin kokunde duran, adinda "photo" gecen ya da image fill tasiyan node'lar
await step('Suruklenen gorseller', async () => {
  const found = [];
  for (const n of pageHome.children) {
    let hasImage = false;
    if ('fills' in n && Array.isArray(n.fills)) hasImage = n.fills.some(f => f.type === 'IMAGE');
    if (/photo|cutout|hero|role/i.test(n.name) || hasImage) {
      const b = box(n);
      found.push({ name: n.name, type: n.type, size: b ? b.w + 'x' + b.h : '-', at: b ? b.x + ',' + b.y : '-', imageFill: hasImage });
    }
  }
  report.info['02 sayfasi kok node adlari'] = pageHome.children.map(n => n.name + ' [' + n.type + ']');
  report.info['gorsel adaylari'] = found;
});

// 2 · Sayfadaki her seyin sinirlari: yeni panoyu nereye koyacagiz
await step('Bos alan', async () => {
  let maxX = -Infinity, minY = Infinity;
  const rows = [];
  for (const n of pageHome.children) {
    const b = box(n);
    if (!b) continue;
    rows.push({ name: n.name, x: b.x, y: b.y, w: b.w, h: b.h });
    if (b.x + b.w > maxX) maxX = b.x + b.w;
    if (b.y < minY) minY = b.y;
  }
  report.info['02 sayfasi yerlesim'] = rows;
  report.info['en sag kenar'] = Math.round(maxX);
  report.info['en ust kenar'] = Math.round(minY);
});

// 3 · Home · Desktop ust seviye bolumler
await step('Home · Desktop bolumler', async () => {
  const home = pageHome.children.find(n => n.name === 'Home · Desktop');
  if (!home) throw new Error('Home · Desktop yok');
  report.info['Home · Desktop bolumler'] = home.children.map(n => {
    const b = box(n);
    return { name: n.name, type: n.type, size: b ? b.w + 'x' + b.h : '-' };
  });
});

// 4 · Hero slayt 1 agaci (4 seviye)
await step('Hero slayt 1 agaci', async () => {
  const home = pageHome.children.find(n => n.name === 'Home · Desktop');
  const hero = home.children.find(n => /hero/i.test(n.name));
  if (!hero) throw new Error('hero bolumu bulunamadi');
  report.info['hero agaci'] = tree(hero, 0, 4);
});

// 5 · Roles bolumu agaci (4 seviye)
await step('Roles bolumu agaci', async () => {
  const home = pageHome.children.find(n => n.name === 'Home · Desktop');
  const roles = home.children.find(n => /^roles|built for every role/i.test(n.name));
  if (!roles) throw new Error('Roles bolumu bulunamadi');
  report.info['roles agaci'] = tree(roles, 0, 4);
});

// 6 · Hero slide ve Role card component setleri
await step('Component setleri', async () => {
  const want = ['Hero slide', 'Role card', 'Player card', 'Booking', 'Message'];
  const out = {};
  for (const name of want) {
    let c = page0.children.find(n => n.name === name && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
    if (!c) c = page0.findOne(n => n.name === name && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
    if (!c) { out[name] = 'bulunamadi'; continue; }
    const b = box(c);
    out[name] = {
      id: c.id,
      type: c.type,
      size: b ? b.w + 'x' + b.h : '-',
      variants: c.type === 'COMPONENT_SET' ? c.children.map(v => v.name) : null,
      firstVariantTree: c.type === 'COMPONENT_SET' ? tree(c.children[0], 0, 3) : tree(c, 0, 3)
    };
  }
  report.info['componentler'] = out;
});

return report;
