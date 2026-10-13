// step 74 · Inspect (salt okunur): Header varyantlari, Upcoming events blogu, takvim icin gerekli componentler

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const page = re => figma.root.children.find(p => re.test(p.name));
const page0 = page(/^01/), pageHome = page(/^02/), pageProfile = page(/^03/);
for (const p of [page0, pageHome, pageProfile]) { if (p) await p.loadAsync(); }

const box = n => { const b = n.absoluteBoundingBox; return b ? { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } : null; };

function tree(n, depth, maxDepth) {
  const b = box(n);
  const row = { name: n.name, type: n.type, size: b ? b.w + 'x' + b.h : '-' };
  if (n.type === 'TEXT') row.text = n.characters.length > 50 ? n.characters.slice(0, 50) + '...' : n.characters;
  if (n.type === 'INSTANCE') { try { row.props = Object.keys(n.componentProperties).join(' | '); } catch (e) { row.props = '?'; } }
  if ('children' in n && depth < maxDepth) row.children = n.children.map(c => tree(c, depth + 1, maxDepth));
  else if ('children' in n) row.childCount = n.children.length;
  return row;
}

function comp(name) {
  let c = page0.children.find(n => n.name === name && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
  if (!c) c = page0.findOne(n => n.name === name && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
  return c;
}

// 1 · Header: tum varyantlar, Logged in masaustu ve mobil agaci
await step('Header', async () => {
  const h = comp('Header');
  if (!h) throw new Error('Header bulunamadi');
  report.info['Header id'] = h.id;
  report.info['Header varyantlari'] = h.type === 'COMPONENT_SET' ? h.children.map(v => v.name + ' · ' + Math.round(v.width) + 'x' + Math.round(v.height)) : '(tek component)';
  report.info['Header ozellikleri'] = h.type === 'COMPONENT_SET' ? Object.keys(h.componentPropertyDefinitions || {}) : [];
  const li = h.children.find(v => /Device=Desktop/.test(v.name) && /Logged in/.test(v.name));
  const lim = h.children.find(v => /Device=Mobile/.test(v.name) && /Logged in/.test(v.name));
  const lo = h.children.find(v => /Device=Desktop/.test(v.name) && /Logged out/.test(v.name));
  if (li) report.info['Header · Logged in · Desktop'] = tree(li, 0, 4);
  if (lim) report.info['Header · Logged in · Mobile'] = tree(lim, 0, 4);
  if (lo) report.info['Header · Logged out · Desktop'] = tree(lo, 0, 3);
});

// 2 · Upcoming events blogu: takvim ekraninda ayni dili kullanacagiz
await step('Upcoming events blogu', async () => {
  const home = pageHome.children.find(n => n.name === 'Home · Desktop');
  const ev = home.children.find(n => /upcoming events/i.test(n.name));
  if (!ev) throw new Error('Upcoming events bulunamadi');
  report.info['Upcoming events agaci'] = tree(ev, 0, 4);
});

// 3 · Takvimde kullanilacak componentler
await step('Componentler', async () => {
  const out = {};
  for (const name of ['Event row', 'Filter chip', 'Button', 'Icon button', 'Tag', 'Section header', 'Footer', 'Avatar', 'Verification badge']) {
    const c = comp(name);
    if (!c) { out[name] = 'bulunamadi'; continue; }
    out[name] = {
      id: c.id,
      type: c.type,
      props: c.type === 'COMPONENT_SET' ? Object.keys(c.componentPropertyDefinitions || {}) : [],
      variants: c.type === 'COMPONENT_SET' ? c.children.map(v => v.name) : null,
      size: Math.round(c.width) + 'x' + Math.round(c.height)
    };
  }
  report.info['componentler'] = out;
  const er = comp('Event row');
  if (er) report.info['Event row agaci'] = tree(er.type === 'COMPONENT_SET' ? er.children[0] : er, 0, 4);
});

// 4 · Profil sayfasinda ticker var mi, navigation nasil duruyor
await step('Profil sayfasi ust yapi', async () => {
  const pp = pageProfile.children.find(n => /^Player profile · Desktop/.test(n.name));
  if (!pp) throw new Error('Player profile · Desktop bulunamadi');
  report.info['Profil ust seviye'] = pp.children.map(n => {
    const b = box(n);
    return { name: n.name, type: n.type, size: b ? b.w + 'x' + b.h : '-' };
  });
});

// 5 · Sayfalarda bos alan: yeni ekranlari nereye koyacagiz
await step('Bos alan', async () => {
  for (const [label, pg] of [['02', pageHome], ['03', pageProfile]]) {
    let maxX = -Infinity, maxY = -Infinity, minY = Infinity;
    for (const n of pg.children) {
      const b = box(n);
      if (!b) continue;
      if (b.x + b.w > maxX) maxX = b.x + b.w;
      if (b.y + b.h > maxY) maxY = b.y + b.h;
      if (b.y < minY) minY = b.y;
    }
    report.info[label + ' sayfasi sinirlar'] = { enSag: Math.round(maxX), enAlt: Math.round(maxY), enUst: Math.round(minY) };
  }
});

// 6 · Metin stilleri ve koyu yuzey degiskenleri (takvim icin lazim)
await step('Stil ve degisken adlari', async () => {
  report.info['text styles'] = (await figma.getLocalTextStylesAsync()).map(s => s.name);
  const vars = await figma.variables.getLocalVariablesAsync();
  report.info['renk degiskenleri'] = vars.filter(v => v.resolvedType === 'COLOR').map(v => v.name);
});

return report;
