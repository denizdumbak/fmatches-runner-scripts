// step 115 · Uzun isim: soyadi stilleri (L/M/S), mobilde isim tam genislikte ustte, 9-14 ve 15+ test durumlari, developer notu

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const allVars = await figma.variables.getLocalVariablesAsync();
const pick = (...pats) => { for (const p of pats) { const h = allVars.find(v => new RegExp(p, 'i').test(v.name)); if (h) return h; } return null; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }

const page = pageOf(/^02/);
await page.loadAsync();

const FONT = { family: 'Barlow Condensed', style: 'SemiBold' };
await figma.loadFontAsync(FONT);

// Kademe kurali: karakter sayisi (bosluk ve tire dahil)
const TIERS = {
  L: { Desktop: [160, 136], Mobile: [72, 64] },
  M: { Desktop: [104, 88], Mobile: [48, 48] },
  S: { Desktop: [72, 64], Mobile: [36, 40] }
};
const MAXW = { Desktop: 696, Mobile: 358 };
const tierOf = s => s.length <= 8 ? 'L' : (s.length <= 14 ? 'M' : 'S');
const STYLE = {};

await step('soyadi stilleri (Display/Surname L, M, S)', async () => {
  for (const t of ['L', 'M', 'S']) for (const d of ['Desktop', 'Mobile']) {
    const name = 'Display/Surname ' + t + ' · ' + d;
    let s = TS[name];
    if (!s) { s = figma.createTextStyle(); s.name = name; }
    s.fontName = FONT;
    s.fontSize = TIERS[t][d][0];
    s.lineHeight = { unit: 'PIXELS', value: TIERS[t][d][1] };
    s.letterSpacing = { unit: 'PERCENT', value: -1 };
    s.textCase = 'UPPER';
    s.description = 'Player surname. Size by character count incl. spaces and hyphens: up to 8 = L, 9 to 14 = M, 15 or more = S. Max 2 lines, break only at a space or after a hyphen. Max width ' + MAXW[d] + ' px.';
    STYLE[t + d] = s;
  }
});

const sections = page.children.filter(n => n.type === 'SECTION');
const secWeb = sections.find(s => /^Web/.test(s.name));
const secMob = sections.find(s => /^Mobile/.test(s.name));
report.info.sections = sections.map(s => s.name);

const frameIn = (sec, name) => sec.children.find(n => n.type === 'FRAME' && n.name === name);
const surnameOf = f => f.findOne(n => n.type === 'TEXT' && n.name === 'Surname');
const firstOf = f => f.findOne(n => n.type === 'TEXT' && n.name === 'First name') || f.findOne(n => n.type === 'TEXT' && n.parent && n.parent.name === 'Player name' && n.name !== 'Surname');

async function applySurname(f, device) {
  const sn = surnameOf(f);
  if (!sn) throw new Error('Surname yok: ' + f.name);
  const tier = tierOf(sn.characters);
  await loadFonts(sn);
  await sn.setTextStyleIdAsync(STYLE[tier + device].id);
  sn.textAutoResize = 'WIDTH_AND_HEIGHT';
  try { sn.maxWidth = MAXW[device]; } catch (e) { report.info.maxWidthError = String(e); }
  if (sn.width > MAXW[device] + 1) {
    sn.textAutoResize = 'HEIGHT';
    sn.layoutSizingHorizontal = 'FIXED';
    sn.resize(MAXW[device], sn.height);
  }
  const lh = TIERS[tier][device][1];
  return { frame: f.name, chars: sn.characters.length, tier, w: Math.round(sn.width), h: Math.round(sn.height), lines: Math.round(sn.height / lh) };
}

await step('mobil: isim tam genislikte, fotografin ustunde', async () => {
  const out = [];
  for (const f of secMob.children.filter(n => n.type === 'FRAME' && /^Profiles \/ Player( \/ Directory, no photo)? · Mobile$/.test(n.name))) {
    const hero = f.findOne(n => n.name === 'Hero · player identity');
    const row = hero.findOne(n => n.name === 'Name and photo');
    const nameRole = row.findOne(n => n.name === 'Name and role');
    const pn = f.findOne(n => n.name === 'Player name');
    if (pn.parent === hero) { out.push(f.name + ': zaten tasinmis'); continue; }
    const idx = hero.children.indexOf(row);
    hero.insertChild(idx, pn);
    pn.layoutSizingHorizontal = 'HUG';
    const before = row.counterAxisAlignItems;
    row.counterAxisAlignItems = 'MAX';
    if (nameRole.layoutSizingVertical === 'FILL') nameRole.primaryAxisAlignItems = 'MAX';
    out.push(f.name + ': tasindi, satir hizasi ' + before + ' -> MAX, hero bosluk ' + hero.itemSpacing);
  }
  report.info.mobileMove = out;
});

await step('mevcut profillerde soyadi stile baglandi', async () => {
  const out = [];
  for (const [sec, d] of [[secWeb, 'Desktop'], [secMob, 'Mobile']])
    for (const f of sec.children.filter(n => n.type === 'FRAME' && /^Profiles \/ Player( \/ Directory, no photo)? · /.test(n.name)))
      out.push(await applySurname(f, d));
  report.info.base = out;
});

const TESTS = [
  { label: 'Name length 9–14', first: 'Mateus', surname: 'Kowalczyk-Brun', home: 'Mateus Henrique Kowalczyk-Brun' },
  { label: 'Name length 15+', first: 'Pieter', surname: 'van der Westhuizen-Moreau', home: 'Pieter Johannes van der Westhuizen-Moreau' }
];

async function replaceIn(n, oldS, newS) {
  const i = n.characters.indexOf(oldS);
  if (i < 0) return false;
  await loadFonts(n);
  n.insertCharacters(i + oldS.length, newS, 'BEFORE');
  n.deleteCharacters(i, i + oldS.length);
  return true;
}

function overlaps(sec, x, y, w, h, skip) {
  return sec.children.filter(n => !skip.includes(n) && n.x < x + w && n.x + n.width > x && n.y < y + h && n.y + n.height > y);
}

async function buildRow(sec, device, gap) {
  const base = frameIn(sec, 'Profiles / Player · ' + device);
  if (!base) throw new Error('taban profil yok: ' + device);
  for (const n of sec.children.slice()) if (/^(Profiles \/ Player \/ Name length|Flow · Name length|Note · Surname size)/.test(n.name)) n.remove();

  const noteW = device === 'Desktop' ? 360 : 300;
  const rowW = base.width * 2 + gap + 80 + noteW;
  let y = base.y + base.height + gap;
  for (let k = 0; k < 20; k++) {
    const hit = overlaps(sec, base.x, y, rowW, base.height + 200, [base]);
    if (!hit.length) break;
    y = Math.max(...hit.map(n => n.y + n.height)) + gap;
  }

  const made = [];
  for (let i = 0; i < TESTS.length; i++) {
    const t = TESTS[i];
    const c = base.clone();
    sec.appendChild(c);
    c.name = 'Profiles / Player / ' + t.label + ' · ' + device;
    c.x = base.x + i * (base.width + gap); c.y = y;
    for (const n of c.findAll(n => n.type === 'TEXT')) {
      if (await replaceIn(n, 'Leo James Marsh', t.home)) continue;
      await replaceIn(n, 'Leo Marsh', t.first + ' ' + t.surname);
    }
    const sn = surnameOf(c); await loadFonts(sn); sn.characters = t.surname;
    const fn = firstOf(c); if (fn) { await loadFonts(fn); fn.characters = t.first; }
    made.push({ node: c, res: await applySurname(c, device) });
  }

  // kesik ok: ayni sayfa, veri durumu
  const proto = sec.findOne(n => n.type === 'VECTOR' && n.dashPattern && n.dashPattern.length && n.parent && /^Flow ·/.test(n.parent.name));
  const x0 = base.x + base.width / 2, y0 = base.y + base.height + 16, y1 = y - 16;
  let arrow;
  if (proto) { arrow = proto.clone(); sec.appendChild(arrow); }
  else { arrow = figma.createVector(); sec.appendChild(arrow); arrow.strokes = [{ type: 'SOLID', color: { r: 13 / 255, g: 153 / 255, b: 1 } }]; arrow.strokeWeight = 4; arrow.dashPattern = [16, 12]; }
  arrow.vectorPaths = [{ windingRule: 'NONE', data: 'M 0 0 L 0 ' + Math.round(y1 - y0) }];
  arrow.strokeCap = 'ARROW_LINES';
  arrow.x = x0; arrow.y = y0;
  const parts = [arrow];
  const protoLabel = proto ? proto.parent.children.find(n => n !== proto && n.type !== 'VECTOR') : null;
  if (protoLabel) {
    const lab = protoLabel.clone(); sec.appendChild(lab);
    const txt = lab.type === 'TEXT' ? lab : lab.findOne(n => n.type === 'TEXT');
    if (txt) { await loadFonts(txt); txt.characters = 'Same page, longer surnames'; }
    lab.x = x0 + 24; lab.y = (y0 + y1) / 2 - lab.height / 2;
    parts.push(lab);
  }
  const g = figma.group(parts, sec); g.name = 'Flow · Name length · ' + device;

  // developer notu
  const note = figma.createText();
  sec.appendChild(note);
  await figma.loadFontAsync(TS['Label/Small'].fontName);
  await note.setTextStyleIdAsync(TS['Label/Small'].id);
  note.characters = 'Surname size by character count, spaces and hyphens included: up to 8 = L (desktop 160, mobile 72), 9 to 14 = M (104 / 48), 15 or more = S (72 / 36). Max 2 lines. Break only at a space or after a hyphen, never inside a word. Max width 696 px on desktop, full width on mobile, where the name sits above the photo.';
  const warn = pick('^color/text/warning$', 'text/warning');
  if (warn) note.fills = [P(warn)];
  note.textAutoResize = 'HEIGHT';
  note.resize(noteW, note.height);
  note.name = 'Note · Surname size';
  const last = made[made.length - 1].node;
  note.x = last.x + last.width + 80; note.y = y;

  let r = 0, b = 0;
  for (const n of sec.children) { r = Math.max(r, n.x + n.width); b = Math.max(b, n.y + n.height); }
  sec.resizeWithoutConstraints(Math.max(sec.width, Math.ceil(r + 80)), Math.max(sec.height, Math.ceil(b + 80)));
  return { rowY: Math.round(y), arrowStyleCopied: !!proto, results: made.map(m => m.res) };
}

await step('masaustu test durumlari', async () => { report.info.web = await buildRow(secWeb, 'Desktop', 480); });
await step('mobil test durumlari', async () => { report.info.mobile = await buildRow(secMob, 'Mobile', 360); });

await step('Section cakismasi', async () => {
  if (secWeb.x + secWeb.width + 400 > secMob.x) { const dx = secWeb.x + secWeb.width + 400 - secMob.x; secMob.x += dx; report.info.mobileShift = dx; }
});

await step('eski Display/Hero stillerinin kullanimi', async () => {
  const cnt = {};
  for (const name of ['Display/Hero Desktop', 'Display/Hero Mobile']) {
    const s = TS[name]; if (!s) continue;
    cnt[name] = page.findAll(n => n.type === 'TEXT' && n.textStyleId === s.id).length;
  }
  report.info.oldStyleUse = cnt;
});

return JSON.stringify(report, null, 1);
