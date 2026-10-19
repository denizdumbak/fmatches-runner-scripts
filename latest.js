// step 136 · Duzeltmeler: mobil hero butonlari 48 px ve sekmeler 3 slaytta ayni yerde · achievements kapali halde ilk basari ayri katman, +N metnin yaninda · mobil profil fotografi Key facts cizgisine basar · mobil kulup seridi iki satir

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }

const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();

// ---------- 1. Mobile hero: buttons 48 px, Actions box same height on all 3 slides ----------
await step('mobile hero actions', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Hero slide');
  const mob = set.children.filter(c => c.variantProperties && c.variantProperties.Device === 'Mobile');
  report.info.heroActions = [];
  for (const v of mob) {
    const actions = v.findOne(n => n.name === 'Actions' && n.type === 'FRAME');
    if (!actions) { report.info.heroActions.push(v.name + ': no Actions'); continue; }
    const buttons = actions.children.filter(n => n.type === 'INSTANCE');
    for (const b of buttons) {
      b.layoutSizingVertical = 'FIXED';
      b.resize(b.width, 48);
    }
    actions.counterAxisAlignItems = 'MIN';
    actions.primaryAxisAlignItems = 'MIN';
    actions.layoutSizingVertical = 'FIXED';
    actions.resize(actions.width, 108); // 2 x 48 + 12: tabs sit at the same height on every slide
    const tabs = v.findOne(n => n.name === 'Hero tabs');
    const copy = v.findOne(n => n.name === 'Copy');
    report.info.heroActions.push(v.name + ': buttons ' + buttons.map(b => Math.round(b.height)).join('/') + ', actions ' + Math.round(actions.height) + ', copy bottom ' + Math.round(copy.y + copy.height) + ' of ' + Math.round(v.height) + ', tabs y ' + Math.round(tabs.absoluteBoundingBox.y - v.absoluteBoundingBox.y));
  }
});

// ---------- 2. Achievements: first line on its own layer, +N right after it ----------
let setCE = null;
await step('club entry component', async () => {
  setCE = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Club entry');
  if (!setCE) throw new Error('Club entry set missing');
  report.info.clubEntry = [];
  for (const v of setCE.children) {
    const ach = v.findOne(n => n.name === 'Achievements');
    const txt = ach && ach.findOne(n => n.name === 'Achievements text' && n.type === 'TEXT');
    const more = ach && ach.findOne(n => n.name === 'More');
    if (!ach || !txt) { report.info.clubEntry.push(v.name + ': skipped'); continue; }
    await loadFonts(txt);
    const expanded = v.variantProperties.State === 'Expanded';
    let first = ach.findOne(n => n.name === 'Achievements first');
    if (!first) {
      first = txt.clone();
      ach.insertChild(ach.children.indexOf(txt), first);
      first.name = 'Achievements first';
    }
    first.characters = txt.characters.split('\n')[0];
    if (expanded) {
      first.visible = false; // kept only so the instance text survives Expanded -> Default
      txt.visible = true;
    } else {
      txt.visible = false;
      first.visible = true;
      // hug the text so "+N" follows it; long first lines still cut with "…"
      const room = ach.width - 16 - (more ? more.width : 0) - ach.itemSpacing * 2;
      first.layoutSizingHorizontal = 'HUG';
      first.textAutoResize = 'WIDTH_AND_HEIGHT';
      first.maxWidth = Math.floor(room);
      first.textTruncation = 'ENDING';
      first.maxLines = 1;
    }
    report.info.clubEntry.push(v.name + ': first w ' + Math.round(first.width) + ', max ' + first.maxWidth);
  }
});

await step('club entry instances', async () => {
  let set = 0, skipped = 0;
  for (const page of [p01, p02]) {
    const inst = page.findAll(n => n.type === 'INSTANCE' && !!n.findOne(c => c.name === 'Achievements first'));
    for (const i of inst) {
      const txt = i.findOne(c => c.name === 'Achievements text' && c.type === 'TEXT');
      const first = i.findOne(c => c.name === 'Achievements first' && c.type === 'TEXT');
      if (!txt || !first) { skipped++; continue; }
      await loadFonts(first);
      const line = txt.characters.split('\n')[0];
      if (first.characters !== line) first.characters = line;
      set++;
    }
  }
  report.info.instancesSet = set; report.info.instancesSkipped = skipped;
});

// ---------- 3. Mobile profile: photo sits on the Key facts line ----------
await step('mobile photo base', async () => {
  const frames = p02.findAll(n => n.type === 'FRAME' && /^Profiles \/ Player.* · Mobile$/.test(n.name));
  report.info.mobileHeroes = [];
  for (const f of frames) {
    const hero = f.findOne(n => n.name === 'Hero · player identity');
    if (!hero) continue;
    if (hero.findOne(n => n.name === 'Identity block')) { report.info.mobileHeroes.push(f.name + ': already done'); continue; }
    const np = hero.children.find(n => n.name === 'Name and photo');
    const kf = hero.children.find(n => n.name === 'Key facts');
    if (!np || !kf) { report.info.mobileHeroes.push(f.name + ': parts missing'); continue; }
    const before = Math.round(f.height);
    const block = figma.createFrame();
    block.name = 'Identity block';
    block.fills = [];
    block.clipsContent = false;
    hero.insertChild(hero.children.indexOf(np), block);
    block.layoutMode = 'VERTICAL';
    block.itemSpacing = 0;
    block.counterAxisSizingMode = 'FIXED';
    block.primaryAxisSizingMode = 'AUTO';
    block.layoutSizingHorizontal = 'FILL';
    block.appendChild(np); block.appendChild(kf);
    np.layoutSizingHorizontal = 'FILL'; kf.layoutSizingHorizontal = 'FILL';
    const nr = np.findOne(n => n.name === 'Name and role');
    if (nr && 'paddingBottom' in nr) nr.paddingBottom = 16;
    report.info.mobileHeroes.push(f.name + ': ' + before + ' -> ' + Math.round(f.height));
  }
});

// ---------- 4. Mobile club strip: crest + two lines ----------
await step('mobile club strip', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Club strip');
  const mob = set.children.find(c => c.variantProperties && c.variantProperties.Device === 'Mobile');
  if (mob.findOne(n => n.name === 'Club info')) { report.info.strip = 'already done'; return; }
  const kids = mob.children.slice();
  const crest = kids.find(n => n.name === 'Club crest');
  const name = kids.find(n => n.type === 'TEXT' && n.name !== 'Third Division');
  const dividers = kids.filter(n => n.name === 'Divider');
  const league = kids.find(n => n.name === 'League country');
  const division = kids[kids.length - 1];
  if (!crest || !name || dividers.length !== 2 || !league || division.type !== 'TEXT') throw new Error('unexpected strip structure');

  mob.layoutWrap = 'NO_WRAP';
  mob.counterAxisAlignItems = 'CENTER';
  const info = figma.createFrame();
  info.name = 'Club info'; info.fills = []; info.clipsContent = false;
  mob.insertChild(mob.children.indexOf(name), info);
  info.layoutMode = 'VERTICAL'; info.itemSpacing = 2;
  info.primaryAxisSizingMode = 'AUTO';
  info.layoutSizingHorizontal = 'FILL';
  const row = figma.createFrame();
  row.name = 'League row'; row.fills = []; row.clipsContent = false;
  row.layoutMode = 'HORIZONTAL'; row.itemSpacing = 8; row.counterAxisAlignItems = 'CENTER';
  row.primaryAxisSizingMode = 'AUTO'; row.counterAxisSizingMode = 'AUTO';
  info.appendChild(name); info.appendChild(row);
  row.appendChild(league); row.appendChild(dividers[1]); row.appendChild(division);
  dividers[0].remove();
  name.layoutSizingHorizontal = 'FILL';
  report.info.strip = 'component ' + Math.round(mob.width) + 'x' + Math.round(mob.height);

  const inst = p02.findAll(n => n.type === 'INSTANCE' && n.name === 'Club strip' && n.variantProperties && n.variantProperties.Device === 'Mobile');
  report.info.stripInstances = inst.map(i => {
    const t = i.findAll(c => c.type === 'TEXT').map(c => c.characters).join(' | ');
    return Math.round(i.width) + 'x' + Math.round(i.height) + ' · ' + t;
  });
});

return report;
