// step 349 · Club crest › Club=No crest: gri dolgulu, tepesi sivri kavisli kalkan, çerçeveyi boşluksuz doldurur; ayrıca Women's club etiketinin hero'daki yerini ölçer (salt okunur)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const sz = n => Math.round(n.width) + 'x' + Math.round(n.height);

await step('Club=No crest kalkanı', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Club crest');
  if (!set) throw new Error('Club crest seti yok');
  const targets = set.children.filter(v => /Club=No crest/.test(v.name));
  if (!targets.length) throw new Error('Club=No crest varyantı yok');
  const d = 'M50 3 C38 11 24 15 6 15 V58 C6 88 26 104 50 113 C74 104 94 88 94 58 V15 C76 15 62 11 50 3 Z';
  report.info.crest = [];
  for (const v of targets) {
    const before = v.children.map(c => c.name + ' ' + sz(c));
    let h = v.height, w = h * 100 / 116;
    if (w > v.width) { w = v.width; h = w * 116 / 100; }
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 100 116"><path d="' + d + '" fill="#E3E6E4" stroke="#B4BAB6" stroke-width="3" stroke-linejoin="round"/></svg>';
    const shield = figma.createNodeFromSvg(svg); shield.name = 'Shield';
    for (const c of [...v.children]) c.remove();
    v.appendChild(shield);
    if (v.layoutMode === 'NONE') { shield.x = (v.width - shield.width) / 2; shield.y = (v.height - shield.height) / 2; }
    report.info.crest.push({ variant: v.name, frame: sz(v), before, shield: sz(shield), layout: v.layoutMode });
  }
});

await step("Women's etiketi (ölçüm)", async () => {
  report.info.women = [];
  for (const dev of ['Desktop', 'Mobile']) {
    const f = p02.findAll(n => n.type === 'FRAME' && n.name === "Clubs / Club card / Women's club · " + dev)[0];
    if (!f) { report.info.women.push(dev + ': frame yok'); continue; }
    const hero = f.findOne(n => n.name === 'Hero · stadium identity');
    const tag = f.findOne(n => n.name === "Tag · Women's club");
    if (!tag) { report.info.women.push(dev + ': etiket yok'); continue; }
    const chain = []; let q = tag.parent; while (q && q !== f) { chain.push(q.name); q = q.parent; }
    const lab = tag.findOne(n => n.type === 'TEXT');
    report.info.women.push({ dev, hero: hero ? sz(hero) : null, tag: sz(tag), visible: tag.visible, chain: chain.join(' < '), tagY: Math.round(tag.absoluteBoundingBox.y - (hero ? hero.absoluteBoundingBox.y : 0)), font: lab ? lab.fontSize + ' ' + (lab.fontName.style || '') : null });
  }
});

figma.notify(report.errors.length ? 'step 349: ' + report.errors.length + ' hata' : 'step 349 tamam');
return report;
