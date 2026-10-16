// step 122 · About karti: About component (Device x State, Collapsed / Expanded, Show more), masaustu sag sutunda Career ustu, mobilde Positions ile Career arasi

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }
const r = n => Math.round(n);

const C = { textPrimary: V('color/text/primary'), textBrand: V('color/text/brand'), iconBrand: V('color/icon/brand') };
const sBody = TS['Body/Default'], sLink = TS['Label/Default Strong'];
if (!sBody || !sLink) throw new Error('text style missing');
await figma.loadFontAsync(sBody.fontName);
await figma.loadFontAsync(sLink.fontName);

const TEXT = {
  main: 'Attacking midfielder who likes to receive between the lines and play the final pass. Comfortable as a 10 or drifting in from the right, and happy to press from the front. Captained Riverside FC U19 in the 2023/24 season.\nStudying sports science part-time. Open to trials in England and the Netherlands for next season.',
  n914: 'Box-to-box midfielder, strong in the air and on second balls. Looking for a club in Poland or Germany.'
};
const textFor = name => /Directory/.test(name) ? null : /9–14/.test(name) ? TEXT.n914 : /15\+/.test(name) ? null : TEXT.main;
const showMoreFor = name => !/9–14/.test(name);

function chevron(dir) {
  const d = dir === 'down' ? 'M6 9l6 6 6-6' : 'M6 15l6-6 6 6';
  const n = figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>');
  n.fills = [];
  for (const v of n.findAll(() => true)) {
    if ('strokes' in v && v.strokes.length) v.strokes = [P(C.iconBrand)];
    if ('fills' in v && v.fills.length) v.fills = [];
    if ('constraints' in v) v.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
  }
  n.rescale(16 / 24);
  n.name = 'Chevron';
  return n;
}

// ---------- sayfalar ----------
const p1 = pageOf(/^01/);
await p1.loadAsync();
const web = pageOf(/^02/);
await web.loadAsync();
const frames = web.findAll(n => n.type === 'FRAME' && /^Profiles \/ Player/.test(n.name) && n.parent && n.parent.type === 'SECTION');
const mainOf = desk => frames.find(f => (desk ? f.width > 800 : f.width <= 800) && !/Directory|Name length/.test(f.name));
const oldH = new Map();
for (const s of web.children.filter(n => n.type === 'SECTION')) for (const k of s.children) oldH.set(k.id, k.height);

// ---------- 1. About component (sekme 01, 3 · Player profile) ----------
let aboutSet = p1.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'About');

await step('About component', async () => {
  if (aboutSet) { report.info.about = 'exists, reused ' + aboutSet.id; return; }
  const sec = p1.findOne(n => n.type === 'SECTION' && /Player profile/.test(n.name));
  if (!sec) throw new Error('section 3 · Player profile not found');
  const comps = [];
  for (const D of ['Desktop', 'Mobile']) {
    const f = mainOf(D === 'Desktop');
    if (!f) throw new Error('main profile frame not found: ' + D);
    const positions = f.findOne(n => n.type === 'FRAME' && n.name === 'Positions');
    const career = f.findOne(n => n.type === 'FRAME' && n.name === 'Career');
    const w = D === 'Desktop' ? r(career.width) : r(positions.width);
    for (const S of ['Collapsed', 'Expanded']) {
      const card = positions.clone();
      sec.appendChild(card);
      for (const k of card.children.slice(1)) k.remove();
      const head = card.children[0];
      await loadFonts(head);
      head.characters = 'About';
      head.name = 'Heading';

      const content = figma.createFrame();
      content.name = 'About content';
      content.layoutMode = 'VERTICAL';
      content.itemSpacing = 12;
      content.fills = [];
      content.clipsContent = false;
      card.appendChild(content);

      const t = figma.createText();
      await t.setTextStyleIdAsync(sBody.id);
      t.characters = TEXT.main;
      t.fills = [P(C.textPrimary)];
      t.name = 'About text';
      content.appendChild(t);
      t.paragraphSpacing = 12;
      if (t.textStyleId !== sBody.id) { await t.setTextStyleIdAsync(sBody.id); report.info.paragraphSpacing = 'detached the style, reverted'; }
      t.layoutSizingHorizontal = 'FILL';
      t.textAutoResize = 'HEIGHT';
      if (D === 'Desktop') t.maxWidth = 640;
      if (S === 'Collapsed') { t.textTruncation = 'ENDING'; t.maxLines = 4; }

      const more = figma.createFrame();
      more.name = 'Show more';
      more.layoutMode = 'HORIZONTAL';
      more.counterAxisAlignItems = 'CENTER';
      more.itemSpacing = 4;
      more.paddingTop = 4; more.paddingBottom = 4;
      more.fills = [];
      content.appendChild(more);
      const lt = figma.createText();
      await lt.setTextStyleIdAsync(sLink.id);
      lt.characters = S === 'Collapsed' ? 'Show more' : 'Show less';
      lt.fills = [P(C.textBrand)];
      lt.name = 'Label';
      more.appendChild(lt);
      more.appendChild(chevron(S === 'Collapsed' ? 'down' : 'up'));
      more.layoutSizingHorizontal = 'HUG'; more.layoutSizingVertical = 'HUG';

      card.resize(w, card.height);
      const c = figma.createComponentFromNode(card);
      c.name = 'Device=' + D + ', State=' + S;
      c.counterAxisSizingMode = 'FIXED';
      c.primaryAxisSizingMode = 'AUTO';
      content.layoutSizingHorizontal = 'FILL';
      content.layoutSizingVertical = 'HUG';
      comps.push(c);
    }
  }
  aboutSet = figma.combineAsVariants(comps, sec);
  aboutSet.name = 'About';
  aboutSet.layoutMode = 'VERTICAL';
  aboutSet.itemSpacing = 24;
  aboutSet.paddingTop = 24; aboutSet.paddingBottom = 24; aboutSet.paddingLeft = 24; aboutSet.paddingRight = 24;
  aboutSet.layoutSizingHorizontal = 'HUG'; aboutSet.layoutSizingVertical = 'HUG';
  aboutSet.description = 'About card on a profile, from the "Additional information" field. Text as the user wrote it, in their own language, line breaks kept. Line length max 640 px on desktop. Longer than 4 lines: show 4 lines with an ellipsis and a "Show more" text button; it expands the card in place ("Show less" collapses it). 4 lines or fewer: no button. Empty field: the whole card is hidden (directory profiles never show it). Desktop: right column, above Career. Mobile: between Positions and Career.';

  for (const c of aboutSet.children) {
    const other = aboutSet.children.find(o => o.variantProperties.Device === c.variantProperties.Device && o.variantProperties.State !== c.variantProperties.State);
    const btn = c.findOne(n => n.name === 'Show more');
    await btn.setReactionsAsync([{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: other.id, navigation: 'CHANGE_TO', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.15 }, preserveScrollPosition: false, resetVideoPosition: false }] }]);
  }
  report.info.about = 'created ' + aboutSet.id;
});

const variant = D => aboutSet.children.find(c => c.variantProperties.Device === D && c.variantProperties.State === 'Collapsed');

async function makeAbout(D, name) {
  const inst = variant(D).createInstance();
  inst.name = 'About';
  const t = inst.findOne(n => n.name === 'About text');
  await loadFonts(t);
  t.characters = textFor(name);
  if (!showMoreFor(name)) inst.findOne(n => n.name === 'Show more').visible = false;
  return inst;
}

// ---------- 2. Profil sayfalari ----------
const fixed = [];
for (const f of frames) {
  await step('profile · ' + f.name, async () => {
    const body = f.findOne(n => n.name === 'Profile body');
    if (!body) throw new Error('Profile body not found');
    const bodyOldH = body.height, bodyOldBottom = body.y + body.height;
    for (const old of body.findAll(n => n.name === 'About')) old.remove();
    const txt = textFor(f.name);

    if (f.width > 800) {
      const cols = body.findOne(n => n.name === 'Profile columns');
      const career = cols.findOne(n => n.type === 'FRAME' && n.name === 'Career');
      let right = cols.findOne(n => n.name === 'Right column');
      if (!right) {
        right = figma.createFrame();
        right.name = 'Right column';
        cols.insertChild(cols.children.indexOf(career), right);
        right.layoutMode = 'VERTICAL';
        right.itemSpacing = 24;
        right.fills = [];
        right.clipsContent = false;
        right.appendChild(career);
        right.layoutSizingHorizontal = 'FILL';
        right.layoutSizingVertical = 'HUG';
        career.layoutSizingHorizontal = 'FILL';
        career.layoutSizingVertical = 'HUG';
      }
      if (txt) { const a = await makeAbout('Desktop', f.name); right.insertChild(0, a); a.layoutSizingHorizontal = 'FILL'; }
    } else if (txt) {
      const career = body.findOne(n => n.type === 'FRAME' && n.name === 'Career');
      const a = await makeAbout('Mobile', f.name);
      body.insertChild(body.children.indexOf(career), a);
      a.layoutSizingHorizontal = 'FILL';
    }

    if (f.layoutMode === 'NONE') {
      const d = body.height - bodyOldH;
      for (const c of f.children) if (c !== body && c.y >= bodyOldBottom - 1) c.y += d;
      f.resizeWithoutConstraints(f.width, f.height + d);
    }
    fixed.push(f.name + ': ' + (txt ? 'About' : 'no About') + ', ' + r(oldH.get(f.id)) + ' -> ' + r(f.height));
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
