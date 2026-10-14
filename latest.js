// step 85 · M2 prototipi: menu acilisi icin ust seviye iki frame ve baglanti

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const pageOf = re => figma.root.children.find(p => re.test(p.name));
const page0 = pageOf(/^01/);
if (page0) await page0.loadAsync();

const V = {};
for (const [k, id] of Object.entries({ subtle: '1:30', textPrimary: '1:38', textWarning: '1:43' })) {
  V[k] = await figma.variables.getVariableByIdAsync('VariableID:' + id);
}
const paint = k => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', V[k]);

const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s.id;
const fonts = await figma.listAvailableFontsAsync();
const findFont = (fam, sty) => { for (const s of sty) if (fonts.some(f => f.fontName.family === fam && f.fontName.style === s)) return { family: fam, style: s }; return null; };
const INTER_R = findFont('Inter', ['Regular']);
if (INTER_R) await figma.loadFontAsync(INTER_R);

async function T(chars, style, colorKey) {
  const t = figma.createText();
  t.fontName = INTER_R;
  t.characters = chars;
  if (TS[style]) await t.setTextStyleIdAsync(TS[style]);
  t.fills = [paint(colorKey)];
  t.name = chars.slice(0, 40);
  t.textAutoResize = 'WIDTH_AND_HEIGHT';
  return t;
}

const findComp = name => page0.findOne(n => n.name === name && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
const variantOf = (set, re) => {
  if (!set) return null;
  if (set.type === 'COMPONENT') return set;
  return set.children.find(c => re.test(c.name)) || set.children[0];
};

const headerSet = findComp('Header');
const menuSet = findComp('Account menu');
const section = page0.findOne(n => n.type === 'SECTION' && /Navigation/.test(n.name));

let closed = null, open = null;

function stage(name) {
  const f = figma.createFrame();
  f.name = name;
  f.resize(1440, 560);
  f.clipsContent = true;
  f.fills = [paint('subtle')];
  return f;
}

await step('Prototip frameleri kuruldu', async () => {
  if (!section) throw new Error('Navigation Section bulunamadi');
  for (const nm of ['Try it · account menu closed', 'Try it · account menu open']) {
    const old = section.children.find(n => n.name === nm);
    if (old) old.remove();
  }

  closed = stage('Try it · account menu closed');
  open = stage('Try it · account menu open');
  section.appendChild(closed);
  section.appendChild(open);

  const hv = headerSet ? variantOf(headerSet, /Device=Desktop.*State=Logged in/) : null;
  for (const f of [closed, open]) {
    if (!hv) continue;
    const hi = hv.createInstance();
    hi.name = 'Header';
    f.appendChild(hi);
    hi.x = 0; hi.y = 0;
  }

  if (menuSet) {
    const mv = variantOf(menuSet, /Device=Desktop.*Role=Other/);
    if (mv) {
      const mi = mv.createInstance();
      mi.name = 'Account menu';
      open.appendChild(mi);
      mi.x = 1440 - 80 - mi.width;
      mi.y = 97 + 8;
    }
  }

  const c1 = await T('Click the header to open the account menu.', 'Label/Small', 'textWarning');
  closed.appendChild(c1); c1.x = 80; c1.y = 160;
  const c2 = await T('Account menu open. This is the state the developer builds.', 'Label/Small', 'textWarning');
  open.appendChild(c2); c2.x = 80; c2.y = 420;

  report.info['frameler'] = { kapali: closed.id, acik: open.id };
});

await step('Prototip baglantisi', async () => {
  if (!closed || !open) throw new Error('frameler kurulamadi');
  const src = closed.findOne(n => n.type === 'INSTANCE' && n.name === 'Header');
  if (!src) throw new Error('kaynak header bulunamadi');
  await src.setReactionsAsync([{
    trigger: { type: 'ON_CLICK' },
    actions: [{
      type: 'NODE',
      destinationId: open.id,
      navigation: 'NAVIGATE',
      transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 },
      preserveScrollPosition: false
    }]
  }]);

  const back = open.findOne(n => n.type === 'INSTANCE' && n.name === 'Header');
  if (back) {
    await back.setReactionsAsync([{
      trigger: { type: 'ON_CLICK' },
      actions: [{
        type: 'NODE',
        destinationId: closed.id,
        navigation: 'NAVIGATE',
        transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 },
        preserveScrollPosition: false
      }]
    }]);
  }

  const pts = page0.flowStartingPoints.slice();
  if (!pts.some(p => p.nodeId === closed.id)) {
    pts.push({ nodeId: closed.id, name: 'Account menu' });
    page0.flowStartingPoints = pts;
  }
  report.info['prototip'] = 'kapali <-> acik, akis baslangici kuruldu';
});

function relayout(s) {
  const kids = s.children.slice().sort((a, b) => {
    const ba = a.absoluteBoundingBox, bb = b.absoluteBoundingBox;
    if (!ba || !bb) return 0;
    if (Math.abs(ba.y - bb.y) > 4) return ba.y - bb.y;
    return ba.x - bb.x;
  });
  const left = s.x + 80; let y = s.y + 80, prevText = false, first = true;
  for (const k of kids) {
    const b = k.absoluteBoundingBox; if (!b) continue;
    const isText = k.type === 'TEXT';
    if (!first) y += (isText && prevText) ? 16 : 120;
    k.x += left - b.x; k.y += y - b.y; y += b.height; prevText = isText; first = false;
  }
  let right = -Infinity, bottom = -Infinity;
  for (const k of s.children) {
    const b = k.absoluteBoundingBox; if (!b) continue;
    if (b.x + b.width > right) right = b.x + b.width;
    if (b.y + b.height > bottom) bottom = b.y + b.height;
  }
  s.resizeWithoutConstraints(Math.ceil(right - s.x + 80), Math.ceil(bottom - s.y + 80));
}

await step('Section duzeni', async () => {
  relayout(section);
  report.info['Section'] = Math.round(section.width) + 'x' + Math.round(section.height);
  const secs = page0.children.filter(n => n.type === 'SECTION');
  const hits = [];
  for (let i = 0; i < secs.length; i++) for (let j = i + 1; j < secs.length; j++) {
    const a = secs[i].absoluteBoundingBox, b = secs[j].absoluteBoundingBox;
    if (!a || !b) continue;
    if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height)
      hits.push(secs[i].name + ' <-> ' + secs[j].name);
  }
  report.info['Section cakismasi'] = hits.length ? hits : 'yok';
});

return report;
