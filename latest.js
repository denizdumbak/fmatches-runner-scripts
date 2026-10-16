// step 117 · Uyruklar: Flag component (6 ulke), Key fact icinde Nation 2 ve ikinci satir (Nation 3), EU alt satiri kalkti, mobilde Nationality tam satir

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const allVars = await figma.variables.getLocalVariablesAsync();
const pick = (...pats) => { for (const p of pats) { const h = allVars.find(v => new RegExp(p, 'i').test(v.name)); if (h) return h; } return null; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }
const hex = h => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });

const p1 = pageOf(/^01/); await p1.loadAsync();
const p2 = pageOf(/^02/); await p2.loadAsync();

// 27x18 bayraklar, duz seritler (grafik: elle hex serbest)
const W = 27, H = 18;
const FLAGS = {
  England: [['#FFFFFF', 0, 0, W, H], ['#CE1124', 11, 0, 5, H], ['#CE1124', 0, 6.5, W, 5]],
  Ireland: [['#169B62', 0, 0, 9, H], ['#FFFFFF', 9, 0, 9, H], ['#FF883E', 18, 0, 9, H]],
  Poland: [['#FFFFFF', 0, 0, W, 9], ['#DC143C', 0, 9, W, 9]],
  Netherlands: [['#AE1C28', 0, 0, W, 6], ['#FFFFFF', 0, 6, W, 6], ['#21468B', 0, 12, W, 6]],
  Belgium: [['#000000', 0, 0, 9, H], ['#FDDA24', 9, 0, 9, H], ['#EF3340', 18, 0, 9, H]],
  France: [['#0055A4', 0, 0, 9, H], ['#FFFFFF', 9, 0, 9, H], ['#EF4135', 18, 0, 9, H]]
};
let flagSet = null;
const flagComp = {};

await step('Flag component (Country varyantlari)', async () => {
  const border = pick('^color/border/default$', 'border/default');
  flagSet = p1.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Flag');
  if (flagSet) for (const c of flagSet.children) flagComp[c.variantProperties.Country] = c;
  const made = [];
  for (const country of Object.keys(FLAGS)) {
    if (flagComp[country]) continue;
    const c = figma.createComponent();
    c.name = 'Country=' + country;
    c.resize(W, H); c.clipsContent = true; c.cornerRadius = 2; c.fills = [];
    for (const [col, x, y, w, h] of FLAGS[country]) {
      const r = figma.createRectangle(); c.appendChild(r);
      r.x = x; r.y = y; r.resize(w, h); r.fills = [{ type: 'SOLID', color: hex(col) }];
      r.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
    }
    if (border) { c.strokes = [P(border)]; c.strokeWeight = 1; c.strokeAlign = 'INSIDE'; }
    flagComp[country] = c; made.push(c);
  }
  if (!flagSet) {
    const sec = p1.children.find(n => n.type === 'SECTION' && /Player profile/.test(n.name));
    for (const c of made) sec.appendChild(c);
    flagSet = figma.combineAsVariants(made, sec);
    flagSet.name = 'Flag';
    flagSet.layoutMode = 'HORIZONTAL'; flagSet.itemSpacing = 12;
    flagSet.paddingTop = flagSet.paddingBottom = flagSet.paddingLeft = flagSet.paddingRight = 16;
    flagSet.primaryAxisSizingMode = 'AUTO'; flagSet.counterAxisSizingMode = 'AUTO';
    flagSet.description = 'Nationality flag. One per citizenship (user_citizenship). 27x18 desktop, 21x14 mobile, 1 px inner border so white flags stay visible on white.';
  } else for (const c of made) flagSet.appendChild(c);
  report.info.flagsAdded = made.map(c => c.name);
});

let flagKey = null;
await step('Key fact: Flag instance, Nation 2, Value row 2 (Nation 3)', async () => {
  const set = p1.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Key fact');
  flagKey = Object.keys(set.componentPropertyDefinitions).find(k => /^Flag#/.test(k));
  const out = [];
  for (const v of set.children) {
    const row = v.findOne(n => n.name === 'Value row');
    const value = row.findOne(n => n.type === 'TEXT' && n.name === 'Value');
    let flag = row.findOne(n => n.name === 'Flag');
    const fw = Math.round(flag.width), fh = Math.round(flag.height);
    if (flag.type !== 'INSTANCE') {
      const inst = flagComp.England.createInstance();
      row.insertChild(row.children.indexOf(flag), inst);
      inst.name = 'Flag'; inst.resize(fw, fh);
      if (flagKey) inst.componentPropertyReferences = { visible: flagKey };
      flag.remove(); flag = inst;
    }
    const mkNation = (name, padL) => {
      const f = figma.createFrame(); f.name = name; f.fills = [];
      f.layoutMode = 'HORIZONTAL'; f.itemSpacing = row.itemSpacing; f.paddingLeft = padL;
      f.counterAxisAlignItems = row.counterAxisAlignItems;
      f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO';
      const fl = flagComp.England.createInstance(); f.appendChild(fl); fl.name = 'Flag'; fl.resize(fw, fh);
      const t = value.clone(); f.appendChild(t); t.name = 'Value';
      return f;
    };
    if (!row.findOne(n => n.name === 'Nation 2')) {
      const n2 = mkNation('Nation 2', 8); row.appendChild(n2); n2.visible = false;
    }
    if (!v.findOne(n => n.name === 'Value row 2')) {
      const r2 = figma.createFrame(); r2.name = 'Value row 2'; r2.fills = [];
      r2.layoutMode = 'HORIZONTAL'; r2.itemSpacing = 16; r2.counterAxisAlignItems = row.counterAxisAlignItems;
      r2.primaryAxisSizingMode = 'AUTO'; r2.counterAxisSizingMode = 'AUTO';
      r2.appendChild(mkNation('Nation 3', 0));
      v.insertChild(v.children.indexOf(row) + 1, r2); r2.visible = false;
    }
    out.push(v.name + ': flag ' + fw + 'x' + fh);
  }
  set.description = 'Key fact: label, value, optional flag and sub line. Nationality: one flag + country name per citizenship (user_citizenship), in stored order, two per line; the third starts a second line (Value row 2). No sub line for nationality.';
  report.info.keyFact = out;
});

const PEOPLE = {
  leo: ['England', 'Ireland'],
  mateus: ['Poland'],
  pieter: ['Netherlands', 'Belgium', 'France']
};
const who = name => /Name length 9/.test(name) ? 'mateus' : (/Name length 15/.test(name) ? 'pieter' : 'leo');

async function setNation(container, country) {
  const fl = container.findOne(n => n.type === 'INSTANCE' && n.name === 'Flag');
  fl.setProperties({ Country: country });
  const t = container.findOne(n => n.type === 'TEXT' && n.name === 'Value');
  await loadFonts(t); t.characters = country;
}

await step('profillerde uyruklar', async () => {
  const out = [];
  const frames = p2.findAll(n => n.type === 'FRAME' && /^Profiles \/ Player/.test(n.name) && n.parent && n.parent.type === 'SECTION');
  for (const f of frames) {
    const fact = f.findOne(n => n.type === 'INSTANCE' && n.name === 'Fact · Nationality');
    if (!fact) { out.push(f.name + ': Nationality yok'); continue; }
    const list = PEOPLE[who(f.name)];
    const subKey = Object.keys(fact.componentProperties).find(k => /^Sub#/.test(k));
    const props = {}; if (subKey) props[subKey] = false; if (flagKey) props[flagKey] = true;
    fact.setProperties(props);
    const row = fact.findOne(n => n.name === 'Value row');
    await setNation(row, list[0]);
    const n2 = fact.findOne(n => n.name === 'Nation 2');
    n2.visible = list.length > 1; if (list[1]) await setNation(n2, list[1]);
    const r2 = fact.findOne(n => n.name === 'Value row 2');
    r2.visible = list.length > 2; if (list[2]) await setNation(r2.findOne(n => n.name === 'Nation 3'), list[2]);

    const kf = fact.parent;
    if (/· Mobile$/.test(f.name)) {
      if (kf.children.indexOf(fact) !== 0) kf.insertChild(0, fact);
      fact.resize(kf.width, fact.height); fact.layoutSizingVertical = 'HUG';
    }
    out.push(f.name + ': ' + list.join(' + ') + ' · fact ' + Math.round(fact.width) + 'x' + Math.round(fact.height));
  }
  report.info.profiles = out;
});

await step('masaustu: key facts fotografa degiyor mu', async () => {
  const out = [];
  const frames = p2.findAll(n => n.type === 'FRAME' && /^Profiles \/ Player.* · Desktop$/.test(n.name) && n.parent && n.parent.type === 'SECTION');
  for (const f of frames) {
    const kf = f.findOne(n => n.type === 'FRAME' && n.name === 'Key facts');
    const fb = f.absoluteBoundingBox;
    const photo = f.findOne(n => n.name === 'Player cut-out');
    const limit = (photo ? photo.absoluteBoundingBox.x - fb.x : 798) - 24;
    const before = Math.round(kf.absoluteBoundingBox.x + kf.width - fb.x);
    let after = before;
    if (before > limit) {
      for (const c of kf.children) if (c.type === 'INSTANCE') {
        if (c.paddingLeft === 32) c.paddingLeft = 24;
        if (c.paddingRight === 32) c.paddingRight = 24;
      }
      after = Math.round(kf.absoluteBoundingBox.x + kf.width - fb.x);
    }
    out.push(f.name + ': sag kenar ' + before + (after !== before ? ' -> ' + after + ' (bosluk 32 -> 24)' : '') + ' · sinir ' + Math.round(limit) + (after > limit ? ' · TASIYOR' : ' · ok'));
  }
  report.info.desktopFit = out;
});

await step('sekme 01 Section duzeni', async () => {
  const s = p1.children.find(n => n.type === 'SECTION' && /Player profile/.test(n.name));
  const kids = s.children.slice();
  const ordered = kids.filter(n => n.type === 'TEXT').concat(kids.filter(n => n.type !== 'TEXT'));
  const left = s.x + 80; let y = s.y + 80, prevText = false, first = true;
  for (const k of ordered) {
    const b = k.absoluteBoundingBox; if (!b) continue; const isText = k.type === 'TEXT';
    if (!first) y += (isText && prevText) ? 16 : 120;
    k.x += left - b.x; k.y += y - b.y; y += b.height; prevText = isText; first = false;
  }
  let right = -Infinity, bottom = -Infinity;
  for (const k of s.children) { const b = k.absoluteBoundingBox; if (!b) continue;
    if (b.x + b.width > right) right = b.x + b.width;
    if (b.y + b.height > bottom) bottom = b.y + b.height; }
  s.resizeWithoutConstraints(Math.ceil(right - s.x + 80), Math.ceil(bottom - s.y + 80));
  const secs = p1.children.filter(n => n.type === 'SECTION').sort((a, b) => a.x - b.x);
  let x = 1640; for (const sc of secs) { if (sc.x < 1000) continue; sc.x = x; x += sc.width + 160; }
});

return JSON.stringify(report, null, 1);
