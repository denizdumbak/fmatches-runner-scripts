// step 108 · M3: hero B (tam ekran) component'e · slayt 1 Gemini genis stadyum (yalniz web) · mobil tam ekran dikey fotograf · A/B panosu silinir

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const page0 = pageOf(/^01/), pageHome = pageOf(/^02/);
for (const p of [page0, pageHome]) if (p) await p.loadAsync();
const allVars = await figma.variables.getLocalVariablesAsync();
const pick = (...pats) => { for (const p of pats) { const h = allVars.find(v => new RegExp(p, 'i').test(v.name)); if (h) return h; } return null; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const R = (n, v) => { for (const c of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius']) n.setBoundVariable(c, v); };
const R0 = n => { for (const c of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius']) { n.setBoundVariable(c, null); n[c] = 0; } };
const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;
const ES = {}; for (const s of await figma.getLocalEffectStylesAsync()) ES[s.name] = s;
const V = {
  inverse: pick('color/bg/inverse$'), tInv: pick('color/text/inverse$'), tInv2: pick('color/text/inverse-secondary$'),
  bInv: pick('color/border/inverse$'), rLg: pick('radius/lg$')
};
const BASE = 'https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/img/m3/';
const H = {};
async function loadImg(n) { if (!H[n]) H[n] = (await figma.createImageAsync(BASE + n)).hash; return H[n]; }
const IMG = hash => ({ type: 'IMAGE', scaleMode: 'FILL', imageHash: hash });
async function resolveColor(v) {
  let val = v.valuesByMode[Object.keys(v.valuesByMode)[0]]; let g = 0;
  while (val && val.type === 'VARIABLE_ALIAS' && g++ < 5) { const t = await figma.variables.getVariableByIdAsync(val.id); val = t.valuesByMode[Object.keys(t.valuesByMode)[0]]; }
  return val;
}
const inv = await resolveColor(V.inverse);
const C = a => ({ r: inv.r, g: inv.g, b: inv.b, a });
const heroSet = page0.findOne(n => n.name === 'Hero slide' && n.type === 'COMPONENT_SET');
const variant = re => heroSet.children.find(c => re.test(c.name));
const CARD_RE = /^Preview · (Player card|Booking)$/;

function ensureRect(parent, name, index) {
  let r = parent.children.find(c => c.name === name);
  if (!r) { r = figma.createRectangle(); r.name = name; parent.insertChild(index, r); }
  else if (parent.children.indexOf(r) !== index) parent.insertChild(index, r);
  return r;
}
function darkCopy(root) {
  const copy = root.findOne(n => n.name === 'Copy');
  for (const t of copy.children.filter(n => n.type === 'TEXT')) t.fills = [P(t.name === 'Eyebrow' ? V.tInv2 : V.tInv)];
  const tabs = root.findOne(n => n.name === 'Hero tabs');
  for (const tab of tabs.children) {
    const active = /active/.test(tab.name);
    const bar = tab.findOne(n => n.name === 'Bar'); if (bar && !active) bar.fills = [P(V.bInv)];
    for (const t of tab.findAll(n => n.type === 'TEXT')) t.fills = [P(/^0\d$/.test(t.characters) ? V.tInv2 : V.tInv)];
  }
}

// ---------- desktop: full-bleed ----------
await step('hero B desktop', async () => {
  for (const k of [1, 2, 3]) {
    const comp = variant(new RegExp('Slide=' + k + ', Device=Desktop'));
    const bg = comp.children.find(c => c.name === 'Background'); if (bg) bg.fills = [P(V.inverse)];
    const hv = comp.findOne(n => n.name === 'Hero visual');
    for (const c of hv.children) if (/watermark|cut-out|Pitch lines|Preview · Message/.test(c.name)) c.visible = false;
    const ph = ensureRect(hv, 'Scene photo', 0);
    ph.x = 0; ph.y = 0; ph.resize(1440, 680); R0(ph);
    ph.fills = [IMG(await loadImg(k === 1 ? 'hero-b-1g.jpg' : 'hero-b-' + k + '.jpg'))];
    const sh = ensureRect(hv, 'Shade', 1);
    sh.x = 0; sh.y = 0; sh.resize(1440, 680);
    sh.fills = [{ type: 'GRADIENT_LINEAR', gradientTransform: [[1, 0, 0], [0, 1, 0]],
      gradientStops: [{ position: 0, color: C(0.9) }, { position: 0.42, color: C(0.7) }, { position: 0.7, color: C(0) }] }];
    const panel = hv.children.find(c => c.name === 'Scene panel'); if (panel) panel.remove();
    const card = hv.children.find(c => CARD_RE.test(c.name));
    card.visible = true;
    card.x = 1440 - 80 - card.width; card.y = k === 1 ? 80 : 680 - 80 - card.height;
    hv.appendChild(card); // card on top
    if (ES['Shadow/Raised']) await card.setEffectStyleIdAsync(ES['Shadow/Raised'].id);
    darkCopy(comp);
    report.info['slide' + k] = card.name + ' @' + Math.round(card.x) + ',' + Math.round(card.y);
  }
});

// ---------- mobile: full-bleed vertical photo ----------
await step('hero mobile full-bleed', async () => {
  for (const k of [1, 2, 3]) {
    const comp = variant(new RegExp('Slide=' + k + ', Device=Mobile'));
    const bg = comp.children.find(c => c.name === 'Background'); if (bg) bg.fills = [P(V.inverse)];
    const hv = comp.findOne(n => n.name === 'Hero visual');
    const st = hv.findOne(n => n.name === 'Stage'); if (st) st.visible = false;
    const ph = ensureRect(hv, 'Scene photo', 0);
    ph.x = 0; ph.y = 0; ph.resize(hv.width, hv.height); R0(ph);
    ph.fills = [IMG(await loadImg('hero-mf-' + k + '.jpg'))];
    const sh = ensureRect(hv, 'Shade', 1);
    sh.x = 0; sh.y = 0; sh.resize(hv.width, hv.height);
    sh.fills = [{ type: 'GRADIENT_LINEAR', gradientTransform: [[0, 1, 0], [-1, 0, 1]],
      gradientStops: [{ position: 0, color: C(0.15) }, { position: 0.22, color: C(0.2) }, { position: 0.42, color: C(0.8) }, { position: 0.62, color: C(0.92) }, { position: 1, color: C(1) }] }];
    darkCopy(comp);
  }
});

// ---------- remove A/B board ----------
await step('remove board', async () => {
  const b = pageHome.children.find(n => n.name === 'M3 · Visual direction'); if (b) b.remove();
});

// ---------- check instances on home pages ----------
await step('instances', async () => {
  const out = [];
  for (const f of pageHome.children.filter(n => /^Home ·/.test(n.name))) {
    for (const i of f.findAll(n => n.type === 'INSTANCE' && /^Hero/.test(n.name))) {
      const m = await i.getMainComponentAsync();
      out.push(f.name + ' > ' + i.name + ' = ' + (m ? m.name : '?') + (i.overrides && i.overrides.length ? ' overrides:' + i.overrides.length : ''));
    }
  }
  report.info.instances = out;
});
return report;
