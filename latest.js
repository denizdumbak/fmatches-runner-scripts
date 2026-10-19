// step 135 · Yedek font Roboto Condensed yerine Sofia Sans Condensed (olcum: Kiril Roboto %34, Sofia %9 genis) + inspect: mobil slayt 1 butonlari, mobil profil hero fotograf tabani, mobil kulup seridi, directory notu

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;

const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
for (const st of ['Regular', 'Medium', 'Semi Bold']) await figma.loadFontAsync({ family: 'Inter', style: st });

// ---------- tree helper (instances optional) ----------
async function tree(n, d, maxD, intoInstances) {
  const o = { name: n.name, type: n.type, x: Math.round(n.x), y: Math.round(n.y), w: Math.round(n.width), h: Math.round(n.height) };
  if (n.visible === false) o.hidden = true;
  if ('layoutMode' in n && n.layoutMode !== 'NONE') {
    o.layout = n.layoutMode + (n.layoutWrap === 'WRAP' ? ' WRAP' : '');
    o.gap = n.itemSpacing;
    o.pad = [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].join('/');
    o.align = n.primaryAxisAlignItems + '/' + n.counterAxisAlignItems;
  }
  if ('layoutSizingHorizontal' in n && n.parent && 'layoutMode' in n.parent && n.parent.layoutMode !== 'NONE') {
    o.sizing = n.layoutSizingHorizontal + '/' + n.layoutSizingVertical;
  }
  if (n.layoutPositioning === 'ABSOLUTE') o.abs = true;
  if ('minHeight' in n && n.minHeight) o.minH = n.minHeight;
  if ('maxHeight' in n && n.maxHeight) o.maxH = n.maxHeight;
  if ('clipsContent' in n && n.clipsContent) o.clip = true;
  if (n.type === 'TEXT') { o.text = n.characters.slice(0, 40); return o; }
  if (n.type === 'INSTANCE') {
    o.variant = n.variantProperties;
    if (!intoInstances) return o;
  }
  if ('children' in n && d < maxD) {
    o.kids = [];
    for (const c of n.children) o.kids.push(await tree(c, d + 1, maxD, intoInstances));
  }
  return o;
}

// ---------- 1. Fallback font: Sofia Sans Condensed ----------
let widerPct = null;
await step('measure sofia', async () => {
  async function w(family, style, str) {
    await figma.loadFontAsync({ family, style });
    const t = figma.createText();
    try { t.fontName = { family, style }; t.fontSize = 100; t.characters = str; t.textAutoResize = 'WIDTH_AND_HEIGHT'; return t.width; }
    finally { t.remove(); }
  }
  const lat = ['KOWALCZYK-BRUN', 'MARSH', 'VAN DER WESTHUIZEN'];
  const cyr = ['КОВАЛЬЧИК-БРУН', 'МАРШ', 'АРХАНГЕЛЬСКИЙ'];
  let b = 0, s = 0;
  for (const x of lat) b += (await w('Barlow Condensed', 'SemiBold', x)) / x.length;
  for (const x of cyr) s += (await w('Sofia Sans Condensed', 'SemiBold', x)) / x.length;
  widerPct = Math.round((s / b - 1) * 100);
  report.info.sofiaCyrVsBarlowPct = widerPct;
});

await step('typography note', async () => {
  const note = p01.findOne(n => n.name === 'Note · Cyrillic fallback' && n.type === 'TEXT');
  if (!note) throw new Error('note missing');
  note.characters = `For the developer · Russian site: Barlow Condensed has no Cyrillic letters. Switch every Barlow Condensed style (display, headings, names, data) to Sofia Sans Condensed at the same size and weight, for the whole text rather than letter by letter, so names and figures stay in one font. Inter covers Cyrillic and stays. Sofia Sans Condensed was picked for width: Cyrillic in it runs about ${widerPct}% wider than Latin in Barlow, so the surname size steps still hold.`;
});

await step('style descriptions', async () => {
  let changed = 0;
  for (const s of Object.values(TS)) {
    if (s.fontName.family !== 'Barlow Condensed' || !s.description) continue;
    if (s.description.indexOf('Roboto Condensed') === -1) continue;
    s.description = s.description.replace('Roboto Condensed', 'Sofia Sans Condensed');
    changed++;
  }
  report.info.descriptionsChanged = changed;
});

await step('start here 01 line 5', async () => {
  const card = p01.findOne(n => n.name === 'Start here' && n.type === 'FRAME');
  const t = card.findOne(n => n.type === 'TEXT' && n.characters.indexOf('Roboto Condensed') !== -1);
  if (!t) { report.info.startHere01 = 'already updated'; return; }
  t.characters = t.characters.replace('Roboto Condensed', 'Sofia Sans Condensed');
  t.name = t.characters.slice(0, 40);
});

// ---------- 2. Inspect: mobile slide 1 hero buttons ----------
await step('inspect hero slide component', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && /hero slide/i.test(n.name));
  if (!set) throw new Error('Hero slide set missing');
  report.info.heroSetName = set.name;
  report.info.heroVariants = set.children.map(c => c.name + ' ' + Math.round(c.width) + 'x' + Math.round(c.height));
  const mob1 = set.children.find(c => /slide=1/i.test(c.name.replace(/\s/g, '')) && /mobile/i.test(c.name));
  const mob2 = set.children.find(c => /slide=2/i.test(c.name.replace(/\s/g, '')) && /mobile/i.test(c.name));
  if (mob1) report.info.heroMobile1 = await tree(mob1, 0, 6, false);
  if (mob2) report.info.heroMobile2 = await tree(mob2, 0, 6, false);
});

await step('inspect hero instance mobile slide 1', async () => {
  const frame = p02.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · Mobile');
  if (!frame) throw new Error('Home / Main · Mobile missing');
  const inst = frame.findOne(n => n.type === 'INSTANCE' && /hero carousel/i.test(n.name));
  report.info.heroInstance1 = inst ? await tree(inst, 0, 7, true) : 'not found';
});

// ---------- 3. Inspect: mobile profile hero ----------
await step('inspect mobile profile hero', async () => {
  const frame = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player · Mobile');
  if (!frame) throw new Error('Profiles / Player · Mobile missing');
  const hero = frame.findOne(n => n.name === 'Hero · player identity');
  report.info.mobileHero = await tree(hero, 0, 3, false);
  const strip = hero.findOne(n => n.type === 'INSTANCE' && /club strip/i.test(n.name));
  report.info.mobileStrip = strip ? await tree(strip, 0, 4, true) : 'not found';
  const kf = hero.findOne(n => n.name === 'Key facts');
  if (kf) {
    const first = kf.children[0];
    report.info.keyFactsFirst = first ? { name: first.name, type: first.type, strokes: first.strokes ? first.strokes.length : 0, topWeight: first.strokeTopWeight } : null;
  }
});

await step('inspect mobile club strip component', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && /club strip/i.test(n.name));
  if (!set) { report.info.stripSet = 'not found'; return; }
  report.info.stripVariants = set.children.map(c => c.name + ' ' + Math.round(c.width) + 'x' + Math.round(c.height));
  const mob = set.children.find(c => /mobile/i.test(c.name));
  if (mob) report.info.stripMobileComponent = await tree(mob, 0, 4, false);
});

// ---------- 4. Inspect: directory note position ----------
await step('inspect directory note', async () => {
  const out = [];
  for (const sec of p02.children.filter(n => n.type === 'SECTION')) {
    const note = sec.children.find(n => /directory profile/i.test(n.name) && /^note/i.test(n.name));
    const dir = sec.children.find(n => /directory, no photo/i.test(n.name) && n.type === 'FRAME');
    const kids = sec.children.filter(n => n.type === 'FRAME' && n !== note).map(n => ({ name: n.name, x: Math.round(n.x), y: Math.round(n.y), w: Math.round(n.width), h: Math.round(n.height) }));
    out.push({
      section: sec.name,
      note: note ? { name: note.name, x: Math.round(note.x), y: Math.round(note.y), w: Math.round(note.width), h: Math.round(note.height) } : null,
      directory: dir ? { name: dir.name, x: Math.round(dir.x), y: Math.round(dir.y), w: Math.round(dir.width), h: Math.round(dir.height), bottom: Math.round(dir.y + dir.height) } : null,
      frames: kids
    });
  }
  report.info.directoryNote = out;
});

return report;
