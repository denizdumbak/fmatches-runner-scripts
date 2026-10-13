// step 67 · Ticker yon A uygulanir + koyu zemin icin iki yeni renk degiskeni
const out = { steps: [], errors: [] };

const V = { inverse:'1:31', brand:'1:32', accent:'1:35', textInverse:'1:41' };
const S = { labelSmall:'S:6643355740b2629409d37698be89121d16c2ec96,',
            eyebrow:'S:ab352e24d4e998a5e455b3aa8dbbc007bd9fbf28,' };
const BARLOW = { family:'Barlow Condensed', style:'Medium' };

const TEXTS = {
  'Visitor 1': 'FriendlyMatches International, the global football platform: create a verified profile, find players and clubs, book friendly matches and tournaments, chat directly with scouts and agents. Join for free!',
  'Visitor 2': 'FriendlyMatches International connects the football world: search players, clubs, tournaments and scouts in one database. Send match and trial requests, use built-in messenger. For pros and amateurs alike.',
  'Visitor 3': 'FriendlyMatches International, your key to global football: profiles, search, match bookings and direct messaging. Sign up for free today!',
  'Member':    'FriendlyMatches International connects the football world: search players, clubs, tournaments and scouts in one database. Send match and trial requests, use built-in messenger. For pros and amateurs alike.'
};
const EVENTS = {
  Manager: { tag:'TOURNAMENTS', tagMobile:'TOURNAMENTS', items:[
    ['Riverside Invitational','17–25 Oct','GB'],
    ['Northgate Youth Cup','23–25 Oct','GB'],
    ['Coastal Spring Trophy','2–6 Nov','PT'] ] },
  Player: { tag:'TRIALS', tagMobile:'TRIALS', items:[
    ['Riverside FC U21 trial','18 Oct','GB'],
    ['Northgate Athletic trial','24 Oct','GB'],
    ['Coastal United keeper trial','1 Nov','PT'] ] }
};
const COUNT = { Desktop: 3, Mobile: 1 };
const FLAG = { GB: '🇬🇧', PT: '🇵🇹' };

async function step(name, fn) {
  try { const r = await fn(); out.steps.push({ name, done:true, result:r }); return r; }
  catch (e) { out.errors.push({ name, error:String(e && e.message ? e.message : e) }); return null; }
}
function hexRgb(h) {
  return { r: parseInt(h.slice(1,3),16)/255, g: parseInt(h.slice(3,5),16)/255, b: parseInt(h.slice(5,7),16)/255 };
}
const vc = {};
async function getVar(id) { if (!vc[id]) vc[id] = await figma.variables.getVariableByIdAsync('VariableID:' + id); return vc[id]; }
async function paintVar(node, id) {
  const v = await getVar(id);
  node.fills = [figma.variables.setBoundVariableForPaint({ type:'SOLID', color:{r:0,g:0,b:0} }, 'color', v)];
}
async function loadFontsOf(n) {
  const len = n.characters.length;
  const fonts = len > 0 ? n.getRangeAllFontNames(0, len) : [n.fontName];
  for (const f of fonts) if (f && f.family) await figma.loadFontAsync(f);
}

// ---------- 1. yeni renk degiskenleri ----------
const NEWVARS = await step('koyu zemin renkleri', async () => {
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const color = cols.find(c => c.id === '1:27') || cols.find(c => /color/i.test(c.name));
  if (!color) throw new Error('Color koleksiyonu yok');
  const mode = color.modes[0].modeId;
  const all = await figma.variables.getLocalVariablesAsync('COLOR');
  const want = [
    ['text/inverse-secondary', '#9AA39C'],
    ['border/inverse', '#2A312C']
  ];
  const ids = {};
  for (const [name, hex] of want) {
    let v = all.find(x => x.name === name && x.variableCollectionId === color.id);
    if (!v) v = figma.variables.createVariable(name, color, 'COLOR');
    v.setValueForMode(mode, hexRgb(hex));
    v.description = 'For dark surfaces (ticker, footer).';
    ids[name] = v.id;
  }
  return ids;
});

const V_TEXT2 = NEWVARS['text/inverse-secondary'].replace('VariableID:', '');
const V_BORDER2 = NEWVARS['border/inverse'].replace('VariableID:', '');

// ---------- 2. Ticker yon A ----------
let TPL = null;
async function txt(parent, name, chars, styleId, colorVar, barlowSize) {
  const t = TPL.clone();
  await loadFontsOf(t);
  t.name = name; t.characters = chars;
  if (barlowSize) {
    await t.setTextStyleIdAsync('');
    await figma.loadFontAsync(BARLOW);
    t.fontName = BARLOW; t.fontSize = barlowSize;
    t.lineHeight = { value: 16, unit:'PIXELS' };
    t.letterSpacing = { value: 0, unit:'PIXELS' };
  } else {
    await t.setTextStyleIdAsync(styleId);
  }
  await paintVar(t, colorVar);
  parent.appendChild(t);
  t.layoutSizingHorizontal = 'HUG'; t.layoutSizingVertical = 'HUG';
  t.textAutoResize = 'WIDTH_AND_HEIGHT';
  return t;
}
function frame(parent, name, gap) {
  const f = figma.createFrame();
  f.name = name; f.layoutMode = 'HORIZONTAL'; f.itemSpacing = gap;
  f.counterAxisAlignItems = 'CENTER'; f.fills = [];
  parent.appendChild(f);
  f.layoutSizingHorizontal = 'HUG'; f.layoutSizingVertical = 'HUG';
  return f;
}

await step('Ticker yon A', async () => {
  const p = figma.root.children.find(n => /^01/.test(n.name));
  await p.loadAsync();
  const set = p.findOne(n => n.name === 'Ticker' && n.type === 'COMPONENT_SET');
  if (!set) throw new Error('Ticker yok');
  TPL = set.findOne(n => n.type === 'TEXT').clone();
  figma.currentPage.appendChild(TPL);

  const done = [];
  for (const comp of set.children) {
    const m = /Device=(\w+), Role=(.+)$/.exec(comp.name);
    if (!m) continue;
    const dev = m[1], role = m[2].trim();

    await paintVar(comp, V.inverse);
    comp.resize(comp.width, 36);
    comp.paddingTop = 8; comp.paddingBottom = 8;

    for (const c of [...comp.children]) if (c.name !== 'Live dot') c.remove();
    const dot = comp.children.find(c => c.name === 'Live dot');
    if (dot) await paintVar(dot, V.accent);

    if (EVENTS[role]) {
      const conf = EVENTS[role];
      const pill = frame(comp, 'Type tag', 0);
      pill.paddingLeft = pill.paddingRight = 8;
      pill.paddingTop = pill.paddingBottom = 3;
      pill.cornerRadius = 999;
      await paintVar(pill, V.brand);
      await txt(pill, 'Tag label', dev === 'Mobile' ? conf.tagMobile : conf.tag, S.eyebrow, V.textInverse);

      const items = frame(comp, 'Ticker items', 0);
      items.clipsContent = true;
      items.layoutSizingHorizontal = 'FILL';

      for (let i = 0; i < COUNT[dev]; i++) {
        if (i > 0) {
          const sw = frame(items, 'Separator', 0);
          sw.paddingLeft = sw.paddingRight = 16;
          const r = figma.createRectangle();
          r.name = 'Rule'; r.resize(1, 12);
          sw.appendChild(r);
          r.layoutSizingHorizontal = 'FIXED'; r.layoutSizingVertical = 'FIXED';
          await paintVar(r, V_BORDER2);
        }
        const [nm, date, cc] = conf.items[i];
        const it = frame(items, 'Ticker item', 8);
        await txt(it, 'Flag', FLAG[cc], S.labelSmall, V.textInverse);
        await txt(it, 'Event name', nm, S.labelSmall, V.textInverse);
        await txt(it, 'Event date', date, null, V_TEXT2, 15);
      }
    } else {
      const t = await txt(comp, 'Ticker text', TEXTS[role], S.labelSmall, V_TEXT2);
      t.layoutSizingHorizontal = 'FILL';
      t.textAutoResize = 'HEIGHT';
    }
    done.push(comp.name);
  }
  return done;
});

await step('tasma kontrolu', async () => {
  const p = figma.root.children.find(n => /^01/.test(n.name));
  const set = p.findOne(n => n.name === 'Ticker' && n.type === 'COMPONENT_SET');
  return set.children.map(c => {
    const row = c.children.find(x => x.name === 'Ticker items');
    if (!row) return { variant: c.name, tip: 'metin', h: Math.round(c.height) };
    let used = 0;
    row.children.forEach((x, i) => { used += x.width; });
    return { variant: c.name, satir: Math.round(row.width), icerik: Math.round(used), sigdi: used <= row.width + 0.5 };
  });
});

await step('Section tasmasi', async () => {
  const p = figma.root.children.find(n => /^01/.test(n.name));
  const fixed = [];
  for (const sec of p.children) {
    if (sec.type !== 'SECTION' || !sec.children.length) continue;
    const bottom = Math.max(...sec.children.map(n => n.y + n.height));
    const right = Math.max(...sec.children.map(n => n.x + n.width));
    if (bottom + 80 > sec.height || right + 80 > sec.width) {
      sec.resizeWithoutConstraints(Math.max(sec.width, right + 80), bottom + 80);
      fixed.push(sec.name);
    }
  }
  return fixed.length ? fixed : 'tasma yok';
});

if (TPL) TPL.remove();
return out;
