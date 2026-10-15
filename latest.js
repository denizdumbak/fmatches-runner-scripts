// step 106 · M3 (105 + slayt 1 yeni stadyum fotografi): hero A (cerceveli sahne + tek kart) component'e, rol kartlarina fotograf; B (tam ekran sahne) karsilastirma panosu sekme 02'de

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const page0 = pageOf(/^01/), pageHome = pageOf(/^02/);
for (const p of [page0, pageHome]) if (p) await p.loadAsync();
const allVars = await figma.variables.getLocalVariablesAsync();
const pick = (...pats) => { for (const p of pats) { const h = allVars.find(v => new RegExp(p, 'i').test(v.name)); if (h) return h; } return null; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const R = (n, v) => { for (const c of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius']) n.setBoundVariable(c, v); };
const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;
const ES = {}; for (const s of await figma.getLocalEffectStylesAsync()) ES[s.name] = s;
const V = {
  inverse: pick('color/bg/inverse$'), tInv: pick('color/text/inverse$'), tInv2: pick('color/text/inverse-secondary$'),
  bInv: pick('color/border/inverse$'), rLg: pick('radius/lg$'), rMd: pick('radius/md$')
};

const BASE = 'https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/img/m3/';
const H = {};
async function loadImg(n) { if (!H[n]) H[n] = (await figma.createImageAsync(BASE + n)).hash; return H[n]; }
const IMG = hash => ({ type: 'IMAGE', scaleMode: 'FILL', imageHash: hash });

async function resolveColor(v) {
  let val = v.valuesByMode[Object.keys(v.valuesByMode)[0]];
  let guard = 0;
  while (val && val.type === 'VARIABLE_ALIAS' && guard++ < 5) { const t = await figma.variables.getVariableByIdAsync(val.id); val = t.valuesByMode[Object.keys(t.valuesByMode)[0]]; }
  return val;
}
const inv = await resolveColor(V.inverse);

const heroSet = page0.findOne(n => n.name === 'Hero slide' && n.type === 'COMPONENT_SET');
const roleSet = page0.findOne(n => n.name === 'Role card' && n.type === 'COMPONENT_SET');
const variant = (set, re) => set.children.find(c => re.test(c.name));

// ---------- A: desktop hero variants ----------
const CARD_RE = /^Preview · (Player card|Booking)$/;
await step('hero A desktop', async () => {
  for (const k of [1, 2, 3]) {
    const comp = variant(heroSet, new RegExp('Slide=' + k + ', Device=Desktop'));
    const hv = comp.findOne(n => n.name === 'Hero visual');
    for (const c of hv.children) if (/watermark|cut-out|Pitch lines|Preview · Message/.test(c.name)) c.visible = false;
    let ph = hv.children.find(c => c.name === 'Scene photo');
    if (!ph) { ph = figma.createRectangle(); ph.name = 'Scene photo'; hv.insertChild(0, ph); }
    ph.resize(592, 552); ph.x = 768; ph.y = 64; R(ph, V.rLg);
    ph.fills = [IMG(await loadImg('hero-a-' + k + (k === 1 ? 's' : '') + '.jpg'))];
    const card = hv.children.find(c => CARD_RE.test(c.name));
    card.visible = true; card.x = 728; card.y = 64 + 552 - card.height - 40;
    if (ES['Shadow/Raised']) await card.setEffectStyleIdAsync(ES['Shadow/Raised'].id);
    report.info['slide' + k] = card.name + ' @' + card.x + ',' + Math.round(card.y);
  }
});

// ---------- mobile hero variants: photo in Stage ----------
await step('hero mobile stage', async () => {
  for (const k of [1, 2, 3]) {
    const comp = variant(heroSet, new RegExp('Slide=' + k + ', Device=Mobile'));
    const st = comp.findOne(n => n.name === 'Stage');
    for (const c of st.children) c.visible = false;
    st.fills = [IMG(await loadImg('hero-m-' + k + (k === 1 ? 's' : '') + '.jpg'))];
  }
});

// ---------- role cards ----------
const LABELS = { Player: 'Open trial · Fri 23 Oct', Club: 'Match request · Riverside FC', Agent: 'Shortlist · 8 players' };
const labelStyle = TS['Label/Small'] || TS['Label/Medium'] || TS['Label/Default'] || Object.values(TS).find(s => /^Label\//.test(s.name));
report.info.labelStyle = labelStyle ? labelStyle.name : 'none';
report.info.textStyles = Object.keys(TS).join(', ');
await step('role cards', async () => {
  if (labelStyle) await figma.loadFontAsync(labelStyle.fontName);
  for (const c of roleSet.children) {
    const role = (c.name.match(/Role=(\w+)/) || [])[1];
    const st = c.findOne(n => n.name === 'Stage');
    const file = { Player: 'role-player.jpg', Club: 'role-club.jpg', Agent: 'role-agent.jpg' }[role];
    st.fills = [IMG(await loadImg(file))];
    for (const ch of st.children) if (/^Preview/.test(ch.name)) ch.visible = false;
    let sh = st.children.find(n => n.name === 'Shade');
    if (!sh) { sh = figma.createRectangle(); sh.name = 'Shade'; st.appendChild(sh); sh.layoutPositioning = 'ABSOLUTE'; }
    sh.x = 0; sh.y = 0; sh.resize(st.width, st.height); sh.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
    sh.fills = [{ type: 'GRADIENT_LINEAR', gradientTransform: [[0, 1, 0], [-1, 0, 1]],
      gradientStops: [{ position: 0.35, color: { r: inv.r, g: inv.g, b: inv.b, a: 0 } }, { position: 1, color: { r: inv.r, g: inv.g, b: inv.b, a: 0.72 } }] }];
    let lb = st.children.find(n => n.name === 'Label');
    if (!lb) { lb = figma.createText(); lb.name = 'Label'; st.appendChild(lb); lb.layoutPositioning = 'ABSOLUTE'; }
    if (labelStyle) await lb.setTextStyleIdAsync(labelStyle.id);
    lb.characters = LABELS[role];
    lb.fills = [P(V.tInv)];
    lb.textAutoResize = 'WIDTH_AND_HEIGHT';
    const pad = st.width > 320 ? 16 : 12;
    lb.x = pad; lb.y = st.height - lb.height - pad + 2;
    lb.constraints = { horizontal: 'MIN', vertical: 'MAX' };
  }
});

// ---------- B: comparison board ----------
await step('board A vs B', async () => {
  const old = pageHome.children.find(n => n.name === 'M3 · Visual direction'); if (old) old.remove();
  let right = 0; for (const n of pageHome.children) right = Math.max(right, n.x + n.width);
  const board = figma.createFrame(); board.name = 'M3 · Visual direction';
  pageHome.appendChild(board); board.x = right + 400; board.y = 0;
  board.layoutMode = 'VERTICAL'; board.itemSpacing = 40; board.paddingLeft = board.paddingRight = board.paddingTop = board.paddingBottom = 80;
  board.primaryAxisSizingMode = 'AUTO'; board.counterAxisSizingMode = 'AUTO'; board.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  const hStyle = TS['Heading/H2'] || TS['Heading/H3'] || Object.values(TS).find(s => /^Heading/.test(s.name));
  const bStyle = TS['Body/Large'] || TS['Body/Default'];
  for (const s of [hStyle, bStyle]) if (s) await figma.loadFontAsync(s.fontName);
  const txt = async (s, st) => { const t = figma.createText(); if (st) await t.setTextStyleIdAsync(st.id); t.characters = s; board.appendChild(t); return t; };
  await txt('M3 · Visual direction', hStyle);
  await txt('Two ways to bring real football into the hero. Same photos, same cards; the difference is how much of the slide the scene takes. Mobile is the same for both: the photo sits in the Stage.', bStyle);
  const row = (name) => { const r = figma.createFrame(); r.name = name; r.layoutMode = 'HORIZONTAL'; r.itemSpacing = 40; r.primaryAxisSizingMode = 'AUTO'; r.counterAxisSizingMode = 'AUTO'; r.fills = []; board.appendChild(r); return r; };

  await txt('A · Framed scene', hStyle);
  const rA = row('Row A');
  for (const k of [1, 2, 3]) rA.appendChild(variant(heroSet, new RegExp('Slide=' + k + ', Device=Desktop')).createInstance());

  await txt('B · Full-bleed scene', hStyle);
  const rB = row('Row B');
  for (const k of [1, 2, 3]) {
    const inst = variant(heroSet, new RegExp('Slide=' + k + ', Device=Desktop')).createInstance();
    rB.appendChild(inst);
    const f = inst.detachInstance(); f.name = 'Slide ' + k + ' · B';
    const hv = f.findOne(n => n.name === 'Hero visual');
    const ph = hv.children.find(c => c.name === 'Scene photo');
    ph.x = 0; ph.y = 0; ph.resize(1440, 680);
    for (const c of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius']) { ph.setBoundVariable(c, null); ph[c] = 0; }
    ph.fills = [IMG(await loadImg('hero-b-' + k + (k === 1 ? 's' : '') + '.jpg'))];
    const sh = figma.createRectangle(); sh.name = 'Shade'; hv.insertChild(1, sh); sh.x = 0; sh.y = 0; sh.resize(1440, 680);
    sh.fills = [{ type: 'GRADIENT_LINEAR', gradientTransform: [[1, 0, 0], [0, 1, 0]],
      gradientStops: [{ position: 0, color: { r: inv.r, g: inv.g, b: inv.b, a: 0.9 } }, { position: 0.42, color: { r: inv.r, g: inv.g, b: inv.b, a: 0.7 } }, { position: 0.7, color: { r: inv.r, g: inv.g, b: inv.b, a: 0 } }] }];
    const card = hv.children.find(c => CARD_RE.test(c.name));
    card.x = 1440 - 80 - card.width; card.y = k === 1 ? 80 : 680 - 80 - card.height;
    // copy on dark
    const copy = f.findOne(n => n.name === 'Copy');
    for (const t of copy.children.filter(n => n.type === 'TEXT')) t.fills = [P(t.name === 'Eyebrow' ? V.tInv2 : V.tInv)];
    const tabs = f.findOne(n => n.name === 'Hero tabs');
    for (const tab of tabs.children) {
      const active = /active/.test(tab.name);
      const bar = tab.findOne(n => n.name === 'Bar'); if (!active) bar.fills = [P(V.bInv)];
      for (const t of tab.findAll(n => n.type === 'TEXT')) t.fills = [P(/^0\d$/.test(t.characters) ? V.tInv2 : V.tInv)];
    }
  }
  report.info.board = Math.round(board.x) + ',' + Math.round(board.y) + ' ' + Math.round(board.width) + 'x' + Math.round(board.height);
});

return report;
