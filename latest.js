// step 86 · Section sirasi duzeltildi (basliklar ustte, yeni gelen altta) + header logged out olculeri

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const pageOf = re => figma.root.children.find(p => re.test(p.name));
const page0 = pageOf(/^01/);
if (page0) await page0.loadAsync();

// --- yeni dizme kurali: TEXT basliklar once (mevcut sirasiyla), sonra digerleri cocuk sirasina gore
function relayout(s) {
  const kids = s.children.slice();
  const texts = kids.filter(n => n.type === 'TEXT');
  const rest = kids.filter(n => n.type !== 'TEXT');
  const ordered = texts.concat(rest);

  const left = s.x + 80;
  let y = s.y + 80, prevText = false, first = true;
  for (const k of ordered) {
    const b = k.absoluteBoundingBox; if (!b) continue;
    const isText = k.type === 'TEXT';
    if (!first) y += (isText && prevText) ? 16 : 120;
    k.x += left - b.x;
    k.y += y - b.y;
    y += b.height;
    prevText = isText; first = false;
  }
  let right = -Infinity, bottom = -Infinity;
  for (const k of s.children) {
    const b = k.absoluteBoundingBox; if (!b) continue;
    if (b.x + b.width > right) right = b.x + b.width;
    if (b.y + b.height > bottom) bottom = b.y + b.height;
  }
  s.resizeWithoutConstraints(Math.ceil(right - s.x + 80), Math.ceil(bottom - s.y + 80));
  return ordered.map(n => n.name);
}

await step('Tum Sectionlar yeniden dizildi', async () => {
  const out = {};
  for (const s of page0.children.filter(n => n.type === 'SECTION')) {
    out[s.name] = relayout(s);
  }
  report.info['Section sirasi'] = out;
});

await step('Sectionlar yan yana hizalandi', async () => {
  const secs = page0.children.filter(n => n.type === 'SECTION')
    .sort((a, b) => a.absoluteBoundingBox.x - b.absoluteBoundingBox.x);
  let x = 1640;
  for (const s of secs) {
    s.x = x;
    s.y = 0;
    x += s.width + 160;
  }
  const hits = [];
  for (let i = 0; i < secs.length; i++) for (let j = i + 1; j < secs.length; j++) {
    const a = secs[i].absoluteBoundingBox, b = secs[j].absoluteBoundingBox;
    if (!a || !b) continue;
    if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height)
      hits.push(secs[i].name + ' <-> ' + secs[j].name);
  }
  report.info['Section cakismasi'] = hits.length ? hits : 'yok';
  report.info['Section konumlari'] = secs.map(s => s.name + ' @ ' + Math.round(s.x) + ' (' + Math.round(s.width) + 'x' + Math.round(s.height) + ')');
});

// --- header logged out olculeri (salt okunur)
function describeLayout(n, depth) {
  const b = n.absoluteBoundingBox;
  const d = {
    ad: n.name,
    tip: n.type,
    boyut: b ? Math.round(b.width) + 'x' + Math.round(b.height) : null
  };
  if ('layoutMode' in n && n.layoutMode !== 'NONE') {
    d.yon = n.layoutMode;
    d.gap = n.itemSpacing;
    d.padding = [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].join('/');
    d.hizalama = n.primaryAxisAlignItems + ' / ' + n.counterAxisAlignItems;
    d.boyutlandirma = n.primaryAxisSizingMode + ' / ' + n.counterAxisSizingMode;
  } else if ('layoutMode' in n) {
    d.yon = 'auto layout yok';
  }
  if ('layoutSizingHorizontal' in n) d.yatay = n.layoutSizingHorizontal;
  if (depth > 0 && 'children' in n && n.children.length) {
    d.cocuklar = n.children.map(c => describeLayout(c, depth - 1));
  }
  return d;
}

await step('Header logged out olculeri', async () => {
  const set = page0.findOne(n => n.name === 'Header' && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
  if (!set) throw new Error('Header bulunamadi');
  const v = set.type === 'COMPONENT_SET'
    ? set.children.find(c => /Device=Desktop.*State=Logged out/.test(c.name))
    : set;
  if (!v) throw new Error('Desktop / Logged out varyanti bulunamadi');
  report.info['Header · Desktop · Logged out'] = describeLayout(v, 3);

  const vin = set.type === 'COMPONENT_SET'
    ? set.children.find(c => /Device=Desktop.*State=Logged in/.test(c.name))
    : null;
  if (vin) report.info['Header · Desktop · Logged in (kiyas)'] = describeLayout(vin, 2);
});

return report;
