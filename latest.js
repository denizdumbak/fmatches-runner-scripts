// step 121 · Linkler: Link row component, profil govdesi 1/3 + 2/3 (solda Links + Positions, sagda Career), mobilde Links en ustte

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const pick = (...pats) => { for (const p of pats) { const h = allVars.find(v => new RegExp(p, 'i').test(v.name)); if (h) return h; } return null; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const R = (n, v) => { for (const c of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius']) n.setBoundVariable(c, v); };
const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }
const r = n => Math.round(n);

const C = {
  bgSubtle: V('color/bg/subtle'), bgBrandSubtle: V('color/bg/brand-subtle'),
  iconDefault: V('color/icon/default'), iconBrand: V('color/icon/brand'),
  textPrimary: V('color/text/primary'), textSecondary: V('color/text/secondary'), textBrand: V('color/text/brand'),
  border: V('color/border/default')
};
const radiusMd = pick('^radius/md$', 'radius/md');
const sOver = TS['Label/Overline'], sDomain = TS['Label/Default Strong'];
if (!sOver || !sDomain) throw new Error('text style missing');
await figma.loadFontAsync(sOver.fontName);
await figma.loadFontAsync(sDomain.fontName);

// ---------- icons ----------
const ICONS = {
  Video: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l5.5-3.5z"/>',
  Profile: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6.5 16c.6-1.4 1.5-2 2.5-2s1.9.6 2.5 2"/><path d="M14 10h4M14 13h3"/>',
  Social: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
  Website: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3z"/>',
  Open: '<path d="M8 16L16 8M10 8h6v6"/>'
};
function icon(key, size, colorVar) {
  const n = figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + ICONS[key] + '</svg>');
  n.fills = [];
  for (const v of n.findAll(() => true)) {
    if ('strokes' in v && v.strokes.length) v.strokes = [P(colorVar)];
    if ('fills' in v && v.fills.length) v.fills = [];
    if ('constraints' in v) v.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
  }
  n.rescale(size / 24);
  n.name = key === 'Open' ? 'Open icon' : 'Icon';
  return n;
}
async function txt(name, style, colorVar, chars) {
  const t = figma.createText();
  await t.setTextStyleIdAsync(style.id);
  t.characters = chars;
  t.fills = [P(colorVar)];
  t.name = name;
  return t;
}

// ---------- 1. Link row component (sekme 01, 3 · Player profile) ----------
const p1 = pageOf(/^01/);
await p1.loadAsync();
let linkSet = p1.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Link row');

await step('Link row component', async () => {
  if (linkSet) { report.info.linkRow = 'exists, reused ' + linkSet.id; return; }
  const sec = p1.findOne(n => n.type === 'SECTION' && /Player profile/.test(n.name));
  if (!sec) throw new Error('section 3 · Player profile not found');
  const comps = [];
  for (const T of ['Video', 'Profile', 'Social', 'Website']) {
    for (const S of ['Default', 'Hover']) {
      const c = figma.createComponent();
      c.name = 'Type=' + T + ', State=' + S;
      c.layoutMode = 'HORIZONTAL';
      c.counterAxisAlignItems = 'CENTER';
      c.itemSpacing = 16;
      c.paddingTop = 12; c.paddingBottom = 12; c.paddingLeft = 0; c.paddingRight = 0;
      c.fills = [];
      c.strokes = [P(C.border)];
      c.strokeTopWeight = 0; c.strokeLeftWeight = 0; c.strokeRightWeight = 0; c.strokeBottomWeight = 1;
      c.strokeAlign = 'INSIDE';

      const box = figma.createFrame();
      box.name = 'Icon box';
      box.layoutMode = 'HORIZONTAL';
      box.primaryAxisAlignItems = 'CENTER';
      box.counterAxisAlignItems = 'CENTER';
      box.resize(40, 40);
      box.layoutSizingHorizontal = 'FIXED'; box.layoutSizingVertical = 'FIXED';
      box.fills = [P(T === 'Video' ? C.bgBrandSubtle : C.bgSubtle)];
      if (radiusMd) R(box, radiusMd);
      box.appendChild(icon(T, 20, T === 'Video' ? C.iconBrand : C.iconDefault));
      c.appendChild(box);

      const text = figma.createFrame();
      text.name = 'Text';
      text.layoutMode = 'VERTICAL';
      text.itemSpacing = 2;
      text.fills = [];
      c.appendChild(text);
      const tType = await txt('Type', sOver, C.textSecondary, T);
      text.appendChild(tType);
      const tDom = await txt('Domain', sDomain, S === 'Hover' ? C.textBrand : C.textPrimary, T === 'Video' ? 'youtube.com' : T === 'Profile' ? 'transfermarkt.com' : T === 'Social' ? 'instagram.com' : 'example.com');
      text.appendChild(tDom);
      tDom.layoutSizingHorizontal = 'FILL';
      tDom.textTruncation = 'ENDING';
      tDom.maxLines = 1;

      c.appendChild(icon('Open', 16, S === 'Hover' ? C.iconBrand : C.iconDefault));

      c.resize(352, 64);
      c.layoutSizingHorizontal = 'FIXED';
      c.layoutSizingVertical = 'HUG';
      text.layoutSizingHorizontal = 'FILL';
      sec.appendChild(c);
      comps.push(c);
    }
  }
  linkSet = figma.combineAsVariants(comps, sec);
  linkSet.name = 'Link row';
  linkSet.layoutMode = 'VERTICAL';
  linkSet.itemSpacing = 16;
  linkSet.paddingTop = 24; linkSet.paddingBottom = 24; linkSet.paddingLeft = 24; linkSet.paddingRight = 24;
  linkSet.layoutSizingHorizontal = 'HUG'; linkSet.layoutSizingVertical = 'HUG';
  linkSet.description = 'Row in the Links card of a profile. Type is set from the URL domain: youtube, vimeo, hudl, veo = Video; transfermarkt, sofascore, besoccer = Profile; instagram, x, twitter, tiktok, facebook = Social; anything else = Website. Video links come first, the rest in the order they were added. Show the domain only (no www, no path), one line, cut with an ellipsis. Opens in a new tab. No links: the whole card is hidden (directory profiles never show it). More than 4 links: show the first 4 and a "Show all (n)" text button. Last row has no divider.';

  // hover
  for (const c of linkSet.children) {
    if (c.variantProperties.State !== 'Default') continue;
    const hov = linkSet.children.find(h => h.variantProperties.Type === c.variantProperties.Type && h.variantProperties.State === 'Hover');
    await c.setReactionsAsync([{ trigger: { type: 'ON_HOVER' }, actions: [{ type: 'NODE', destinationId: hov.id, navigation: 'CHANGE_TO', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.15 }, preserveScrollPosition: false, resetVideoPosition: false }] }]);
  }
  report.info.linkRow = 'created ' + linkSet.id;
});

function variant(T) { return linkSet.children.find(c => c.variantProperties.Type === T && c.variantProperties.State === 'Default'); }

// ---------- 2. Profil sayfalari ----------
const web = pageOf(/^02/);
await web.loadAsync();
const frames = web.findAll(n => n.type === 'FRAME' && /^Profiles \/ Player/.test(n.name) && n.parent && n.parent.type === 'SECTION');
const oldH = new Map();
for (const s of web.children.filter(n => n.type === 'SECTION')) for (const k of s.children) oldH.set(k.id, k.height);

const DATA = {
  main: [['Video', 'youtube.com'], ['Profile', 'transfermarkt.com'], ['Social', 'instagram.com']],
  n914: [['Profile', 'transfermarkt.com']],
  n15: [['Video', 'youtube.com'], ['Profile', 'transfermarkt.com'], ['Social', 'instagram.com'], ['Website', 'vanderwesthuizen-moreau-football.com']]
};
const dataFor = name => /Directory/.test(name) ? null : /9–14/.test(name) ? DATA.n914 : /15\+/.test(name) ? DATA.n15 : DATA.main;

async function makeLinksCard(template, rows) {
  const card = template.clone();
  card.name = 'Links';
  for (const k of card.children.slice(1)) k.remove();
  const head = card.children[0];
  await loadFonts(head);
  head.characters = 'Links';
  const list = figma.createFrame();
  list.name = 'Link list';
  list.layoutMode = 'VERTICAL';
  list.itemSpacing = 0;
  list.fills = [];
  card.appendChild(list);
  list.layoutSizingHorizontal = 'FILL';
  list.layoutSizingVertical = 'HUG';
  for (let i = 0; i < rows.length; i++) {
    const inst = variant(rows[i][0]).createInstance();
    list.appendChild(inst);
    inst.layoutSizingHorizontal = 'FILL';
    const dom = inst.findOne(n => n.name === 'Domain');
    await figma.loadFontAsync(dom.fontName);
    dom.characters = rows[i][1];
    if (i === rows.length - 1) inst.strokes = [];
  }
  return card;
}

const fixed = [];
for (const f of frames) {
  await step('profile · ' + f.name, async () => {
    const body = f.findOne(n => n.name === 'Profile body');
    if (!body) throw new Error('Profile body not found');
    const bodyOldH = body.height, bodyOldBottom = body.y + body.height;
    const rows = dataFor(f.name);
    const old = body.findOne(n => n.type === 'FRAME' && n.name === 'Links');
    if (old) old.remove();

    if (f.width > 800) {
      const cols = body.findOne(n => n.name === 'Profile columns');
      let left = cols.findOne(n => n.name === 'Left column');
      const positions = cols.findOne(n => n.type === 'FRAME' && n.name === 'Positions');
      const career = cols.findOne(n => n.type === 'FRAME' && n.name === 'Career');
      if (!left) {
        left = figma.createFrame();
        left.name = 'Left column';
        cols.insertChild(0, left);
        left.layoutMode = 'VERTICAL';
        left.itemSpacing = 24;
        left.fills = [];
        left.clipsContent = false;
        left.resize(416, 100);
        left.layoutSizingHorizontal = 'FIXED';
        left.layoutSizingVertical = 'HUG';
        left.appendChild(positions);
        positions.layoutSizingHorizontal = 'FILL';
        positions.layoutSizingVertical = 'HUG';
        const content = positions.findOne(n => n.name === 'Positions content');
        content.layoutMode = 'VERTICAL';
        content.itemSpacing = 24;
        const pitch = content.findOne(n => n.name === 'Pitch');
        if (pitch.width > 360) pitch.rescale(352 / pitch.width);
        career.layoutSizingHorizontal = 'FILL';
        career.layoutSizingVertical = 'HUG';
        cols.counterAxisAlignItems = 'MIN';
      }
      if (rows) { const card = await makeLinksCard(positions, rows); left.insertChild(0, card); card.layoutSizingHorizontal = 'FILL'; card.layoutSizingVertical = 'HUG'; }
    } else if (rows) {
      const positions = body.findOne(n => n.type === 'FRAME' && n.name === 'Positions');
      const card = await makeLinksCard(positions, rows);
      body.insertChild(0, card);
      card.layoutSizingHorizontal = 'FILL';
      card.layoutSizingVertical = 'HUG';
    }

    if (f.layoutMode === 'NONE') {
      const d = body.height - bodyOldH;
      for (const c of f.children) if (c !== body && c.y >= bodyOldBottom - 1) c.y += d;
      f.resizeWithoutConstraints(f.width, f.height + d);
    }
    fixed.push(f.name + ': ' + r(oldH.get(f.id)) + ' -> ' + r(f.height));
  });
}
report.info.frames = fixed;

// ---------- 3. Section icinde alttakileri it ----------
await step('push rows below grown frames', async () => {
  const moved = [];
  for (const s of web.children.filter(n => n.type === 'SECTION')) {
    const items = s.children.map(k => {
      const oh = oldH.has(k.id) ? oldH.get(k.id) : k.height;
      return { k, x: k.x, y: k.y, w: k.width, oh, d: k.height - oh, shift: 0 };
    }).sort((a, b) => a.y - b.y);
    for (let i = 0; i < items.length; i++) {
      const a = items[i];
      for (let j = 0; j < i; j++) {
        const b = items[j];
        if (b.y + b.oh > a.y + 2) continue;
        const ov = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        if (ov <= 1) continue;
        a.shift = Math.max(a.shift, b.shift + Math.max(0, b.d));
      }
    }
    for (const it of items) if (it.shift > 0) { it.k.y += it.shift; moved.push(s.name + ' · ' + it.k.name + ' +' + r(it.shift)); }
    let bottom = 0;
    for (const k of s.children) bottom = Math.max(bottom, k.y + k.height);
    if (bottom + 80 > s.height) s.resizeWithoutConstraints(s.width, Math.ceil(bottom + 80));
  }
  report.info.moved = moved;
});

// ---------- 4. Sekme 01 duzen onarimi ----------
function relayout(s) {
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
}
await step('relayout 01 sections', async () => {
  const sec = p1.findOne(n => n.type === 'SECTION' && /Player profile/.test(n.name));
  relayout(sec);
  const secs = p1.children.filter(n => n.type === 'SECTION').sort((a, b) => a.x - b.x);
  let x = 1640;
  for (const s of secs) { s.x = x; x += s.width + 160; }
});

return report;
