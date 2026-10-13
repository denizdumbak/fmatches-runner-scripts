// step 73 · Visual direction A / B / C panosu (M3 secenekleri)

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const page = re => figma.root.children.find(p => re.test(p.name));
const page0 = page(/^01/), pageHome = page(/^02/);
for (const p of [page0, pageHome]) { if (p) await p.loadAsync(); }

// --- fontlar
const fonts = await figma.listAvailableFontsAsync();
function findFont(family, styles) {
  for (const s of styles) {
    if (fonts.some(f => f.fontName.family === family && f.fontName.style === s)) return { family: family, style: s };
  }
  return null;
}
const BARLOW = findFont('Barlow Condensed', ['SemiBold', 'Semi Bold', 'Medium']);
const INTER_R = findFont('Inter', ['Regular']);
const INTER_M = findFont('Inter', ['Medium']);
const INTER_SB = findFont('Inter', ['Semi Bold', 'SemiBold']);
for (const f of [BARLOW, INTER_R, INTER_M, INTER_SB]) { if (f) await figma.loadFontAsync(f); }
report.info['fontlar'] = { barlow: BARLOW, interR: INTER_R, interSB: INTER_SB };

// --- renkler (pano gecici oldugu icin ham deger)
const INK = { r: 0.067, g: 0.086, b: 0.075 };      // #111613
const GREEN = { r: 0.043, g: 0.498, b: 0.243 };    // #0B7F3E
const WHITE = { r: 1, g: 1, b: 1 };
const solid = (c, o) => ({ type: 'SOLID', color: c, opacity: o === undefined ? 1 : o });

function text(chars, font, size, color, opacity) {
  const t = figma.createText();
  t.fontName = font || INTER_R;
  t.characters = chars;
  t.fontSize = size;
  t.fills = [solid(color || INK, opacity)];
  t.textAutoResize = 'WIDTH_AND_HEIGHT';
  t.name = chars.length > 30 ? chars.slice(0, 30) : chars;
  return t;
}

// --- kaynaklar
const home = pageHome.children.find(n => n.name === 'Home · Desktop');
if (!home) { return { errors: ['Home · Desktop bulunamadi'] }; }
const heroSrc = home.children.find(n => /^Hero carousel/.test(n.name));
const rolesSrc = home.children.find(n => n.name === 'Roles');
if (!heroSrc || !rolesSrc) { return { errors: ['hero ya da Roles bulunamadi'] }; }
const roleCardsSrc = rolesSrc.children.find(n => n.name === 'Role cards');

function imageHashOf(re) {
  const rect = pageHome.children.find(n => re.test(n.name) && 'fills' in n && Array.isArray(n.fills) && n.fills.some(f => f.type === 'IMAGE'));
  if (!rect) return null;
  const f = rect.fills.find(x => x.type === 'IMAGE');
  return f.imageHash;
}
const IMG = {
  cutout: imageHashOf(/^photo-hero-1-player-cutout/),
  player: imageHashOf(/^photo-role-player/),
  club: imageHashOf(/^photo-role-club/),
  agent: imageHashOf(/^photo-role-agent/)
};
report.info['gorsel hash bulundu'] = { cutout: !!IMG.cutout, player: !!IMG.player, club: !!IMG.club, agent: !!IMG.agent };

const imgPaint = (hash, mode) => ({ type: 'IMAGE', scaleMode: mode, imageHash: hash });

// --- eski panoyu temizle (script tekrar calistirilabilir olsun)
await step('Eski panoyu sil', async () => {
  const old = pageHome.children.filter(n => n.name === 'Visual direction · A / B / C');
  for (const o of old) o.remove();
  report.info['silinen eski pano'] = old.length;
});

// --- pano
const BOARD_X = 9800, BOARD_Y = -586;
const COL = 1560, HERO_Y = 250, ROLES_Y = 990;
const board = figma.createFrame();
board.name = 'Visual direction · A / B / C';
board.resize(4600, 1460);
board.x = BOARD_X; board.y = BOARD_Y;
board.fills = [solid({ r: 0.969, g: 0.973, b: 0.969 })];
board.clipsContent = false;
pageHome.appendChild(board);

await step('Pano basligi', async () => {
  const h = text('Visual direction, three options', BARLOW, 48, INK);
  h.x = 80; h.y = 48; board.appendChild(h);
  const s = text('Same page, same type, same layout. Only the visual language changes. Tell me which one feels right and I will apply it to the hero and the role cards.', INTER_R, 16, INK, 0.65);
  s.x = 80; s.y = 112; s.textAutoResize = 'HEIGHT'; s.resize(900, 24); board.appendChild(s);
  const note = text('Placeholder imagery, licensed stock, no real clubs or players.', INTER_R, 13, INK, 0.5);
  note.x = 80; note.y = 1396; board.appendChild(note);
});

const DIRS = [
  { key: 'A', title: 'A · Matchday documentary', desc: 'Real lower league and training photography, slightly desaturated, one green accent. No product interface on top.' },
  { key: 'B', title: 'B · Pitch geometry', desc: 'No photography. Pitch lines, dark green surfaces and product cards, all built from the design system.' },
  { key: 'C', title: 'C · Photography and data layer', desc: 'The same photography with the product layer on top: profile card, facts, green accent. Recommended.' }
];

const made = {};

for (let i = 0; i < DIRS.length; i++) {
  const d = DIRS[i];
  const X = 80 + i * COL;

  await step(d.key + ' · etiket', async () => {
    const t = text(d.title, BARLOW, 32, INK);
    t.x = X; t.y = 168; board.appendChild(t);
    const s = text(d.desc, INTER_R, 14, INK, 0.65);
    s.x = X; s.y = 208; s.textAutoResize = 'HEIGHT'; s.resize(1440, 20); board.appendChild(s);
  });

  await step(d.key + ' · hero', async () => {
    const hero = heroSrc.clone();
    board.appendChild(hero);
    hero.x = X; hero.y = HERO_Y;
    hero.name = 'Hero · direction ' + d.key;
    made[d.key] = { hero: hero };

    const cut = hero.findOne(n => n.name === 'Player cut-out');
    const cutFrame = hero.findOne(n => /^Player cut-out ·/.test(n.name));
    const card = hero.findOne(n => n.name === 'Preview · Player card');
    const crest = hero.findOne(n => /^Club crest · watermark/.test(n.name));

    if (d.key === 'B') {
      if (cutFrame) cutFrame.visible = false;
      if (crest) crest.visible = false;
      if (card) card.visible = false;
    } else {
      if (cut && IMG.cutout) cut.fills = [imgPaint(IMG.cutout, 'FIT')];
      if (card) card.visible = (d.key === 'C');
    }
  });

  await step(d.key + ' · role kartlari', async () => {
    const cards = roleCardsSrc.clone();
    board.appendChild(cards);
    cards.x = X + 80; cards.y = ROLES_Y;
    cards.name = 'Role cards · direction ' + d.key;
    made[d.key].cards = cards;

    const map = [
      { re: /Players/, hash: IMG.player },
      { re: /Clubs/, hash: IMG.club },
      { re: /Agents/, hash: IMG.agent }
    ];
    for (const m of map) {
      const card = cards.children.find(n => m.re.test(n.name));
      if (!card) { report.errors.push(d.key + ': role karti bulunamadi ' + m.re); continue; }
      const stage = card.findOne(n => n.name === 'Stage');
      const preview = card.findOne(n => n.name === 'Preview');
      if (!stage) continue;
      if (d.key === 'B') {
        stage.fills = [{
          type: 'GRADIENT_LINEAR',
          gradientTransform: [[0, 1, 0], [-1, 0, 1]],
          gradientStops: [
            { position: 0, color: { r: GREEN.r, g: GREEN.g, b: GREEN.b, a: 1 } },
            { position: 1, color: { r: INK.r, g: INK.g, b: INK.b, a: 1 } }
          ]
        }];
        if (preview) preview.visible = true;
      } else {
        if (m.hash) stage.fills = [imgPaint(m.hash, 'FILL')];
        if (preview) preview.visible = (d.key === 'C');
      }
    }
  });
}

// --- B yonunun saha grafigi: instance icine node eklenemez, bu yuzden hero'nun ustune pano seviyesinde ciziliyor
await step('B · saha grafigi', async () => {
  const X = 80 + 1 * COL;
  const PX = X + 700, PY = HERO_Y, PW = 740, PH = 680;

  const panel = figma.createRectangle();
  panel.name = 'B · pitch panel';
  panel.resize(PW, PH);
  panel.x = PX; panel.y = PY;
  panel.fills = [{
    type: 'GRADIENT_LINEAR',
    gradientTransform: [[1, 0, 0], [0, 1, 0]],
    gradientStops: [
      { position: 0, color: { r: GREEN.r, g: GREEN.g, b: GREEN.b, a: 1 } },
      { position: 1, color: { r: INK.r, g: INK.g, b: INK.b, a: 1 } }
    ]
  }];
  board.appendChild(panel);

  const line = (x, y, w, h) => {
    const r = figma.createRectangle();
    r.name = 'B · pitch line';
    r.resize(w, h); r.x = x; r.y = y;
    r.fills = [solid(WHITE, 0.22)];
    board.appendChild(r);
    return r;
  };
  // orta cizgi + ceza sahasi + kale sahasi
  line(PX + PW / 2 - 1, PY, 2, PH);
  const boxOuter = figma.createRectangle();
  boxOuter.name = 'B · penalty area';
  boxOuter.resize(260, 420); boxOuter.x = PX + 80; boxOuter.y = PY + 130;
  boxOuter.fills = []; boxOuter.strokes = [solid(WHITE, 0.22)]; boxOuter.strokeWeight = 2;
  board.appendChild(boxOuter);
  const boxInner = figma.createRectangle();
  boxInner.name = 'B · six yard box';
  boxInner.resize(110, 200); boxInner.x = PX + 80; boxInner.y = PY + 240;
  boxInner.fills = []; boxInner.strokes = [solid(WHITE, 0.22)]; boxInner.strokeWeight = 2;
  board.appendChild(boxInner);
  const circle = figma.createEllipse();
  circle.name = 'B · centre circle';
  circle.resize(200, 200); circle.x = PX + PW / 2 - 100; circle.y = PY + PH / 2 - 100;
  circle.fills = []; circle.strokes = [solid(WHITE, 0.22)]; circle.strokeWeight = 2;
  board.appendChild(circle);

  // Player card kopyasi panelin ustune
  const heroB = made['B'] ? made['B'].hero : null;
  if (heroB) {
    const src = heroB.findOne(n => n.name === 'Preview · Player card');
    if (src) {
      const copy = src.clone();
      board.appendChild(copy);
      copy.visible = true;
      copy.x = X + 760; copy.y = PY + 427;
      copy.name = 'B · Preview · Player card';
    }
  }
});

// --- panoyu icerige gore sigdir
await step('Pano olcusu', async () => {
  let maxX = 0, maxY = 0;
  for (const n of board.children) {
    const b = n.absoluteBoundingBox;
    if (!b) continue;
    const rx = b.x - board.x + b.width, ry = b.y - board.y + b.height;
    if (rx > maxX) maxX = rx;
    if (ry > maxY) maxY = ry;
  }
  board.resizeWithoutConstraints(Math.ceil(maxX + 80), Math.ceil(maxY + 80));
  report.info['pano'] = { x: board.x, y: board.y, w: Math.round(board.width), h: Math.round(board.height), id: board.id };
});

return report;
