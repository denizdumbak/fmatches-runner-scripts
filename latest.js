// step 114 · Uzun isim olcumu (salt okunur): soyadi katmani, metin sutunu genisligi, test isimlerinin kademe kademe genislikleri

const report = { done: [], errors: [], info: { frames: [], styles: [], widths: {} } };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));

const page = pageOf(/^02/);
await page.loadAsync();

const rel = (n, f) => { const b = n.absoluteBoundingBox, fb = f.absoluteBoundingBox; return b ? { x: Math.round(b.x - fb.x), y: Math.round(b.y - fb.y), w: Math.round(b.width), h: Math.round(b.height) } : null; };

let surnameSample = null;

await step('profil frameleri ve soyadi katmani', async () => {
  const frames = page.findAll(n => n.type === 'FRAME' && /^Profiles \/ Player/.test(n.name) && n.parent && n.parent.type === 'SECTION');
  for (const f of frames) {
    const entry = { name: f.name, w: Math.round(f.width), h: Math.round(f.height) };
    const surname = f.findOne(n => n.type === 'TEXT' && n.characters.trim().toUpperCase() === 'MARSH');
    const first = f.findOne(n => n.type === 'TEXT' && n.characters.trim() === 'Leo');
    if (surname) {
      if (!surnameSample) surnameSample = surname;
      const st = surname.textStyleId && surname.textStyleId !== figma.mixed ? await figma.getStyleByIdAsync(surname.textStyleId) : null;
      entry.surname = {
        id: surname.id, name: surname.name, chars: surname.characters,
        font: surname.getRangeFontName(0, 1), size: surname.getRangeFontSize(0, 1),
        lineHeight: surname.getRangeLineHeight(0, 1), letterSpacing: surname.getRangeLetterSpacing(0, 1),
        textCase: surname.getRangeTextCase(0, 1), style: st ? st.name : null,
        autoResize: surname.textAutoResize, layoutSizing: surname.layoutSizingHorizontal, box: rel(surname, f)
      };
      const chain = []; let p = surname.parent;
      while (p && p.type !== 'SECTION' && p.type !== 'PAGE' && p !== f.parent) {
        chain.push({ name: p.name, type: p.type, box: rel(p, f), layout: p.layoutMode || null,
          padL: p.paddingLeft, padR: p.paddingRight, sizing: p.layoutSizingHorizontal || null });
        if (p === f) break; p = p.parent;
      }
      entry.chain = chain;
    }
    if (first) entry.firstName = { id: first.id, size: first.getRangeFontSize(0, 1), box: rel(first, f) };
    const imgs = f.findAll(n => 'fills' in n && Array.isArray(n.fills) && n.fills.some(x => x.type === 'IMAGE'));
    entry.images = imgs.map(n => ({ name: n.name, box: rel(n, f) })).filter(o => o.box && o.box.y < 1000);
    report.info.frames.push(entry);
  }
});

await step('Display ve Heading stilleri', async () => {
  for (const s of await figma.getLocalTextStylesAsync()) {
    if (/^(Display|Heading)/.test(s.name)) report.info.styles.push({ name: s.name, size: s.fontSize, lh: s.lineHeight, font: s.fontName.family + ' ' + s.fontName.style });
  }
});

await step('test isimlerini kademe kademe olc (gecici katmanlar silinir)', async () => {
  if (!surnameSample) throw new Error('soyadi katmani bulunamadi');
  const font = surnameSample.getRangeFontName(0, 1);
  const ls = surnameSample.getRangeLetterSpacing(0, 1);
  await figma.loadFontAsync(font);
  const strings = ['MARSH', 'WESTHUIZEN', 'MMMMMMMMMM', 'KOWALCZYK-BRANDT', 'MMMMMMMMMMMMMMMM', 'VAN DER WESTHUIZEN', 'MOREAU-VASCONCELOS', 'VAN DER WESTHUIZEN-MOREAU'];
  const sizes = [136, 120, 104, 96, 88, 72, 64, 60, 56, 52, 48, 44, 40, 36, 32];
  const temps = [];
  try {
    for (const s of strings) {
      report.info.widths[s] = { chars: s.length };
      for (const z of sizes) {
        const t = figma.createText();
        page.appendChild(t);
        t.x = -20000; t.y = -20000;
        t.fontName = font; t.fontSize = z; t.letterSpacing = ls;
        t.textAutoResize = 'WIDTH_AND_HEIGHT';
        t.characters = s;
        temps.push(t);
        report.info.widths[s][z] = Math.round(t.width);
      }
    }
  } finally {
    for (const t of temps) t.remove();
  }
  report.info.tempLeft = page.findAll(n => n.type === 'TEXT' && n.x === -20000).length;
});

return JSON.stringify(report, null, 1);
