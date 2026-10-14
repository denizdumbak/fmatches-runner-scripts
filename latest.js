// step 83 · Social icon setini bul, Section'a geri koy ve koyu zemine al

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const pageOf = re => figma.root.children.find(p => re.test(p.name));
const page0 = pageOf(/^01/), pageHome = pageOf(/^02/), pageProfile = pageOf(/^03/);
for (const p of [page0, pageHome, pageProfile]) { if (p) await p.loadAsync(); }

const V = {};
for (const [k, id] of Object.entries({ inverse: '1:31', rLg: '1:63' })) {
  V[k] = await figma.variables.getVariableByIdAsync('VariableID:' + id);
}
const paint = k => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', V[k]);

let socialSet = null;

// 1) isimle ara (tum sayfalar)
await step('Isimle arama', async () => {
  for (const p of [page0, pageHome, pageProfile]) {
    if (!p || socialSet) continue;
    const s = p.findOne(n => n.name === 'Social icon' && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
    if (s) { socialSet = s; report.info['isimle bulundu'] = p.name + ' / ' + s.id; }
  }
  if (!socialSet) report.info['isimle bulundu'] = 'hayir';
});

// 2) footer'daki instance uzerinden ana component'e git
await step('Instance uzerinden arama', async () => {
  if (socialSet) { report.info['instance aramasi'] = 'gerek yok'; return; }
  for (const p of [page0, pageHome, pageProfile]) {
    if (!p || socialSet) continue;
    const insts = p.findAll(n => n.type === 'INSTANCE' && /Social/.test(n.name));
    report.info['bulunan instance sayisi (' + p.name + ')'] = insts.length;
    for (const inst of insts) {
      const main = await inst.getMainComponentAsync();
      if (!main) continue;
      const parent = main.parent;
      if (parent && parent.type === 'COMPONENT_SET') socialSet = parent;
      else socialSet = main;
      const owner = socialSet.parent;
      report.info['instance uzerinden bulundu'] = {
        set: socialSet.name,
        id: socialSet.id,
        bulundugu_yer: owner ? (owner.name + ' (' + owner.type + ')') : 'ebeveyn yok'
      };
      break;
    }
  }
  if (!socialSet) report.info['instance aramasi'] = 'ana component bulunamadi, instance baglari da kopmus olabilir';
});

// 3) varyant adindan arama (son care)
await step('Varyant adindan arama', async () => {
  if (socialSet) { report.info['varyant aramasi'] = 'gerek yok'; return; }
  for (const p of [page0, pageHome, pageProfile]) {
    if (!p || socialSet) continue;
    const c = p.findOne(n => n.type === 'COMPONENT' && /Brand=(LinkedIn|Instagram|Facebook|X)/.test(n.name));
    if (c) {
      socialSet = (c.parent && c.parent.type === 'COMPONENT_SET') ? c.parent : c;
      report.info['varyanttan bulundu'] = socialSet.name + ' / ' + socialSet.id;
    }
  }
});

// 4) bulunduysa Section'a geri koy ve koyu zemine al
await step('Section\'a geri kondu ve koyu zemine alindi', async () => {
  if (!socialSet) throw new Error('Social icon hicbir yontemle bulunamadi, set gercekten silinmis');

  if (socialSet.type === 'COMPONENT_SET') {
    socialSet.layoutMode = 'HORIZONTAL';
    socialSet.primaryAxisSizingMode = 'AUTO';
    socialSet.counterAxisSizingMode = 'AUTO';
    socialSet.counterAxisAlignItems = 'CENTER';
    socialSet.itemSpacing = 24;
    socialSet.paddingLeft = 32; socialSet.paddingRight = 32; socialSet.paddingTop = 32; socialSet.paddingBottom = 32;
    socialSet.fills = [paint('inverse')];
    for (const c of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) socialSet.setBoundVariable(c, V.rLg);
  }

  const section = page0.findOne(n => n.type === 'SECTION' && /Navigation/.test(n.name));
  if (!section) throw new Error('Navigation Section bulunamadi');
  if (socialSet.parent !== section) {
    section.appendChild(socialSet);
    report.info['tasindi'] = 'Section 1 · Navigation icine';
  } else {
    report.info['tasindi'] = 'zaten Section icindeydi';
  }

  report.info['son durum'] = {
    ad: socialSet.name,
    tip: socialSet.type,
    boyut: Math.round(socialSet.width) + 'x' + Math.round(socialSet.height),
    varyant: 'children' in socialSet ? socialSet.children.length : 0
  };
});

function relayout(s) {
  const kids = s.children.slice().sort((a, b) => {
    const ba = a.absoluteBoundingBox, bb = b.absoluteBoundingBox;
    if (!ba || !bb) return 0;
    if (Math.abs(ba.y - bb.y) > 4) return ba.y - bb.y;
    return ba.x - bb.x;
  });
  const left = s.x + 80; let y = s.y + 80, prevText = false, first = true;
  for (const k of kids) {
    const b = k.absoluteBoundingBox; if (!b) continue;
    const isText = k.type === 'TEXT';
    if (!first) y += (isText && prevText) ? 16 : 120;
    k.x += left - b.x; k.y += y - b.y; y += b.height; prevText = isText; first = false;
  }
  let right = -Infinity, bottom = -Infinity;
  for (const k of s.children) {
    const b = k.absoluteBoundingBox; if (!b) continue;
    if (b.x + b.width > right) right = b.x + b.width;
    if (b.y + b.height > bottom) bottom = b.y + b.height;
  }
  s.resizeWithoutConstraints(Math.ceil(right - s.x + 80), Math.ceil(bottom - s.y + 80));
}

await step('Section duzeni', async () => {
  const section = page0.findOne(n => n.type === 'SECTION' && /Navigation/.test(n.name));
  if (!section) throw new Error('Navigation Section bulunamadi');
  relayout(section);
  report.info['Section'] = Math.round(section.width) + 'x' + Math.round(section.height);
});

// 5) footer instance'lari saglam mi
await step('Footer instance kontrolu', async () => {
  const out = [];
  for (const p of [page0, pageHome]) {
    if (!p) continue;
    for (const f of p.findAll(n => n.name === 'Social links' && n.type === 'FRAME')) {
      const kids = f.children.map(c => c.type);
      const b = f.absoluteBoundingBox;
      out.push(p.name + ' / ' + (f.parent ? f.parent.name : '?') + ' -> ' + (b ? Math.round(b.width) + 'x' + Math.round(b.height) : '?') + ' [' + kids.join(',') + ']');
    }
  }
  report.info['Social links satirlari'] = out;
});

return report;
