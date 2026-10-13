// step 66 · Section tasmasini duzelt + Ticker yon A/B karsilastirma panosu
const out = { steps: [], errors: [] };

const V = { subtle:'1:30', inverse:'1:31', brand:'1:32', brandSubtle:'1:34', accent:'1:35',
            textPrimary:'1:38', textSecondary:'1:39', textTertiary:'1:40', textInverse:'1:41',
            textBrand:'1:42', border:'1:48', canvas:'1:28' };
const S = { labelSmall:'S:6643355740b2629409d37698be89121d16c2ec96,',
            eyebrow:'S:ab352e24d4e998a5e455b3aa8dbbc007bd9fbf28,',
            bodySmall:'S:ea9dd88a660a659c42b2b3dc3e84dfe226fc2179,',
            labelStrong:'S:3db4fc217cc3dc57a2419c10fa077eb3f744478e,' };

async function step(name, fn) {
  try { const r = await fn(); out.steps.push({ name, done: true, result: r }); return r; }
  catch (e) { out.errors.push({ name, error: String(e && e.message ? e.message : e) }); return null; }
}

const vc = {};
async function getVar(id) { if (!vc[id]) vc[id] = await figma.variables.getVariableByIdAsync('VariableID:' + id); return vc[id]; }
async function paint(node, id) {
  const v = await getVar(id);
  node.fills = [figma.variables.setBoundVariableForPaint({ type:'SOLID', color:{r:0,g:0,b:0} }, 'color', v)];
}
async function loadFontsOf(n) {
  const len = n.characters.length;
  const fonts = len > 0 ? n.getRangeAllFontNames(0, len) : [n.fontName];
  for (const f of fonts) if (f && f.family) await figma.loadFontAsync(f);
}

let TPL = null;
async function txt(parent, name, chars, styleId, colorVar) {
  const t = TPL.clone();
  await loadFontsOf(t);
  t.name = name; t.characters = chars;
  await t.setTextStyleIdAsync(styleId);
  await paint(t, colorVar);
  parent.appendChild(t);
  t.layoutSizingHorizontal = 'HUG'; t.layoutSizingVertical = 'HUG';
  t.textAutoResize = 'WIDTH_AND_HEIGHT';
  return t;
}
const BARLOW = { family: 'Barlow Condensed', style: 'Medium' };
async function barlow(parent, name, chars, colorVar, size) {
  const t = TPL.clone();
  await loadFontsOf(t);
  await figma.loadFontAsync(BARLOW);
  t.name = name; t.characters = chars;
  await t.setTextStyleIdAsync('');
  t.fontName = BARLOW; t.fontSize = size || 15; t.lineHeight = { value: 16, unit: 'PIXELS' };
  t.letterSpacing = { value: 0, unit: 'PIXELS' };
  await paint(t, colorVar);
  parent.appendChild(t);
  t.layoutSizingHorizontal = 'HUG'; t.layoutSizingVertical = 'HUG';
  t.textAutoResize = 'WIDTH_AND_HEIGHT';
  return t;
}
function row(parent, name, gap, align) {
  const f = figma.createFrame();
  f.name = name; f.layoutMode = 'HORIZONTAL'; f.itemSpacing = gap;
  f.counterAxisAlignItems = align || 'CENTER'; f.fills = [];
  parent.appendChild(f);
  f.layoutSizingHorizontal = 'HUG'; f.layoutSizingVertical = 'HUG';
  return f;
}

// ---------- 1. Section tasmasi ----------
await step('Section tasmasini duzelt', async () => {
  const p = figma.root.children.find(n => /^01/.test(n.name));
  await p.loadAsync();
  const fixed = [];
  for (const sec of p.children) {
    if (sec.type !== 'SECTION' || !sec.children.length) continue;
    const bottom = Math.max(...sec.children.map(n => n.y + n.height));
    const right = Math.max(...sec.children.map(n => n.x + n.width));
    const wantH = bottom + 80, wantW = Math.max(sec.width, right + 80);
    if (wantH > sec.height || wantW > sec.width) {
      sec.resizeWithoutConstraints(wantW, wantH);
      fixed.push({ section: sec.name, yeniYukseklik: Math.round(wantH), yeniGenislik: Math.round(wantW) });
    }
  }
  return fixed.length ? fixed : 'tasma yok';
});

// ---------- 2. A/B panosu ----------
await step('Ticker yon A/B panosu', async () => {
  const p1 = figma.root.children.find(n => /^01/.test(n.name));
  const tset = p1.findOne(n => n.name === 'Ticker' && n.type === 'COMPONENT_SET');
  TPL = tset.findOne(n => n.type === 'TEXT').clone();
  figma.currentPage.appendChild(TPL);

  const p2 = figma.root.children.find(n => /^02/.test(n.name));
  await p2.loadAsync();
  const old = p2.children.find(n => n.name === 'Ticker · direction A and B');
  if (old) old.remove();

  let maxX = 0, minY = 0;
  for (const c of p2.children) { maxX = Math.max(maxX, c.x + c.width); minY = Math.min(minY, c.y); }

  const board = figma.createFrame();
  board.name = 'Ticker · direction A and B';
  board.layoutMode = 'VERTICAL'; board.itemSpacing = 48;
  board.paddingTop = board.paddingBottom = board.paddingLeft = board.paddingRight = 64;
  board.primaryAxisSizingMode = 'AUTO'; board.counterAxisSizingMode = 'AUTO';
  await paint(board, V.canvas);
  p2.appendChild(board);
  board.x = maxX + 400; board.y = minY;

  await txt(board, 'Board title', 'Ticker · two directions', S.labelStrong, V.textPrimary);
  await txt(board, 'Board note', 'Same content, two visual treatments. Pick one and it becomes the Ticker component. The strip scrolls as a marquee in the build.', S.bodySmall, V.textSecondary);

  const DATA = {
    visitor: { kind: 'message', text: 'FriendlyMatches International, the global football platform: create a verified profile, find players and clubs, book friendly matches and tournaments, chat directly with scouts and agents. Join for free!' },
    manager: { kind: 'events', tag: 'TOURNAMENTS', items: [
      ['Riverside Invitational', '17–25 Oct', 'England'],
      ['Northgate Youth Cup', '23–25 Oct', 'England'],
      ['Coastal Spring Trophy', '2–6 Nov', 'Portugal'] ] },
    player: { kind: 'events', tag: 'TRIALS', items: [
      ['Riverside FC U21 trial', '18 Oct', 'England'],
      ['Northgate Athletic trial', '24 Oct', 'England'],
      ['Coastal United keeper trial', '1 Nov', 'Portugal'] ] }
  };

  // dark: true -> A
  async function strip(parent, conf, dark, width, itemCount) {
    const s = figma.createFrame();
    s.name = 'Ticker · ' + (dark ? 'A' : 'B');
    s.layoutMode = 'HORIZONTAL'; s.itemSpacing = 12;
    s.counterAxisAlignItems = 'CENTER';
    s.paddingTop = 8; s.paddingBottom = 8;
    s.paddingLeft = width > 600 ? 80 : 16; s.paddingRight = s.paddingLeft;
    s.clipsContent = true;
    parent.appendChild(s);
    s.resize(width, 36);
    s.layoutSizingVertical = 'FIXED';
    await paint(s, dark ? V.inverse : V.subtle);

    const dot = figma.createEllipse();
    dot.name = 'Live dot'; dot.resize(8, 8);
    s.appendChild(dot);
    dot.layoutSizingHorizontal = 'FIXED'; dot.layoutSizingVertical = 'FIXED';
    await paint(dot, V.accent);

    if (conf.kind === 'message') {
      const t = await txt(s, 'Ticker text', conf.text, S.labelSmall, dark ? V.textInverse : V.textSecondary);
      t.layoutSizingHorizontal = 'FILL'; t.textAutoResize = 'HEIGHT';
      return s;
    }

    const pill = row(s, 'Type tag', 0);
    pill.paddingLeft = pill.paddingRight = 8;
    pill.paddingTop = pill.paddingBottom = 3;
    pill.cornerRadius = 999;
    await paint(pill, dark ? V.brand : V.brandSubtle);
    await txt(pill, 'Tag label', conf.tag, S.eyebrow, dark ? V.textInverse : V.textBrand);

    const items = row(s, 'Ticker items', 0);
    items.layoutSizingHorizontal = 'FILL';
    items.clipsContent = true;

    conf.items.slice(0, itemCount).forEach(() => {});
    for (let i = 0; i < itemCount; i++) {
      if (i > 0) {
        const sepWrap = row(items, 'Separator', 0);
        sepWrap.paddingLeft = sepWrap.paddingRight = 16;
        const sep = figma.createRectangle();
        sep.name = 'Rule'; sep.resize(1, 12);
        sepWrap.appendChild(sep);
        sep.layoutSizingHorizontal = 'FIXED'; sep.layoutSizingVertical = 'FIXED';
        await paint(sep, dark ? V.textTertiary : V.border);
      }
      const [name, date, country] = conf.items[i];
      const it = row(items, 'Ticker item', 8);
      await txt(it, 'Flag', country === 'Portugal' ? '🇵🇹' : '🇬🇧', S.labelSmall, dark ? V.textInverse : V.textPrimary);
      await txt(it, 'Event name', name, S.labelSmall, dark ? V.textInverse : V.textPrimary);
      await barlow(it, 'Event date', date, dark ? V.textTertiary : V.textSecondary, 15);
    }
    return s;
  }

  const plan = [
    ['Signed out · desktop', DATA.visitor, 1440, 0],
    ['Manager · desktop', DATA.manager, 1440, 3],
    ['Player · desktop', DATA.player, 1440, 3],
    ['Manager · mobile', DATA.manager, 390, 1]
  ];

  for (const dark of [true, false]) {
    const group = figma.createFrame();
    group.name = dark ? 'Direction A · dark strip' : 'Direction B · light strip';
    group.layoutMode = 'VERTICAL'; group.itemSpacing = 24; group.fills = [];
    board.appendChild(group);
    group.layoutSizingHorizontal = 'HUG'; group.layoutSizingVertical = 'HUG';

    await txt(group, 'Direction title', dark ? 'Direction A · dark strip' : 'Direction B · light strip', S.labelStrong, V.textPrimary);
    await txt(group, 'Direction note', dark
      ? 'Near black strip, white text, green type tag. Reads like a broadcast lower third and ties the site to the dark mobile app.'
      : 'Light strip kept, enriched with a green type tag, condensed dates, flags and rules. Calmer, less character.',
      S.bodySmall, V.textSecondary);

    for (const [label, conf, width, count] of plan) {
      const wrap = figma.createFrame();
      wrap.name = label; wrap.layoutMode = 'VERTICAL'; wrap.itemSpacing = 6; wrap.fills = [];
      group.appendChild(wrap);
      wrap.layoutSizingHorizontal = 'HUG'; wrap.layoutSizingVertical = 'HUG';
      await txt(wrap, 'Caption', label, S.bodySmall, V.textSecondary);
      await strip(wrap, conf, dark, width, count);
    }
  }

  return { x: Math.round(board.x), y: Math.round(board.y), w: Math.round(board.width), h: Math.round(board.height) };
});

if (TPL) TPL.remove();
return out;
