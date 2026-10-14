// step 90 · Button setine Subtle stili eklendi, logged out headerda Log in buton oldu

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const pageOf = re => figma.root.children.find(p => re.test(p.name));
const page0 = pageOf(/^01/);
if (page0) await page0.loadAsync();

// --- degiskenleri ISIMLE bul (id tahmini yok)
const allVars = await figma.variables.getLocalVariablesAsync();
const byName = {};
for (const v of allVars) byName[v.name] = v;
const pick = (...pats) => {
  for (const p of pats) {
    const hit = allVars.find(v => new RegExp(p, 'i').test(v.name));
    if (hit) return hit;
  }
  return null;
};
const V = {
  bgSubtle: pick('bg/subtle$', 'subtle$'),
  textBrand: pick('text/brand$', 'icon/brand$', 'brand$')
};
report.info['kullanilan degiskenler'] = {
  zemin: V.bgSubtle ? V.bgSubtle.name : 'bulunamadi',
  yazi: V.textBrand ? V.textBrand.name : 'bulunamadi'
};

const paintVar = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);

const buttonSet = page0.findOne(n => n.name === 'Button' && n.type === 'COMPONENT_SET');
let subtleDefault = null;

await step('Button seti okundu', async () => {
  if (!buttonSet) throw new Error('Button set bulunamadi');
  report.info['Button varyantlari'] = buttonSet.children.map(c => c.name);
  report.info['Button ozellikleri'] = buttonSet.variantGroupProperties;
});

await step('Subtle stili eklendi', async () => {
  if (!buttonSet) throw new Error('Button set yok');
  if (!V.bgSubtle || !V.textBrand) throw new Error('gerekli degiskenler bulunamadi');

  const props = buttonSet.variantGroupProperties || {};
  const styleKey = Object.keys(props).find(k => /style/i.test(k));
  const stateKey = Object.keys(props).find(k => /state/i.test(k));
  if (!styleKey) throw new Error('Style ozelligi yok, varyant adlari: ' + buttonSet.children.map(c => c.name).join(' | '));

  // eski Subtle varyantlari temizle (tekrar calistirilabilir olsun)
  for (const c of buttonSet.children.slice()) {
    if (new RegExp(styleKey + '=Subtle').test(c.name)) c.remove();
  }

  const states = stateKey ? props[stateKey].values : ['Default'];
  const made = [];

  for (const st of states) {
    const base = buttonSet.children.find(c =>
      new RegExp(styleKey + '=Secondary').test(c.name) &&
      (!stateKey || new RegExp(stateKey + '=' + st).test(c.name))
    ) || buttonSet.children.find(c => !stateKey || new RegExp(stateKey + '=' + st).test(c.name));
    if (!base) continue;

    const copy = base.clone();
    copy.name = (stateKey ? (styleKey + '=Subtle, ' + stateKey + '=' + st) : (styleKey + '=Subtle'));

    copy.fills = [paintVar(V.bgSubtle)];
    copy.strokes = [];
    for (const t of copy.findAll(n => n.type === 'TEXT')) t.fills = [paintVar(V.textBrand)];
    for (const g of copy.findAll(n => n.type === 'VECTOR' || n.type === 'ELLIPSE')) {
      if (g.strokes && g.strokes.length) g.strokes = [paintVar(V.textBrand)];
      if (g.fills && g.fills !== figma.mixed && g.fills.length) g.fills = [paintVar(V.textBrand)];
    }

    buttonSet.appendChild(copy);
    made.push(copy.name);
    if (!stateKey || /Default/i.test(st)) subtleDefault = copy;
  }

  if (!subtleDefault) subtleDefault = buttonSet.children.find(c => new RegExp(styleKey + '=Subtle').test(c.name));
  report.info['eklenen Subtle varyantlar'] = made;

  buttonSet.description = (buttonSet.description || '') +
    ' Subtle is the quiet counterpart of Primary: a grey surface with a green label, used for the secondary account action in the header.';
});

await step('Logged out headerda Log in butona cevrildi', async () => {
  if (!subtleDefault) throw new Error('Subtle varyanti kurulamadi');
  const headerSet = page0.findOne(n => n.name === 'Header' && n.type === 'COMPONENT_SET');
  if (!headerSet) throw new Error('Header set bulunamadi');

  const log = [];
  for (const v of headerSet.children) {
    if (!/State=Logged out/.test(v.name)) continue;
    const actions = v.findOne(n => n.type === 'FRAME' && /Account actions/.test(n.name));
    if (!actions) { log.push(v.name + ': Account actions yok, atlandi'); continue; }
    const txt = actions.children.find(c => c.type === 'TEXT' && /^Log in$/i.test(c.characters || c.name));
    if (!txt) { log.push(v.name + ': Log in metni yok, atlandi'); continue; }

    const idx = actions.children.indexOf(txt);
    const inst = subtleDefault.createInstance();
    inst.name = 'Button · Log in';
    actions.insertChild(idx, inst);
    txt.remove();

    try {
      const pr = inst.componentProperties || {};
      const labelKey = Object.keys(pr).find(k => /^label/i.test(k));
      if (labelKey) await inst.setProperties({ [labelKey]: 'Log in' });
      else {
        const t = inst.findOne(n => n.type === 'TEXT');
        if (t) { await figma.loadFontAsync(t.fontName); t.characters = 'Log in'; }
      }
    } catch (e) {
      const t = inst.findOne(n => n.type === 'TEXT');
      if (t) { await figma.loadFontAsync(t.fontName); t.characters = 'Log in'; }
    }

    // ikon varsa gizle, bu buton sade olsun
    const ic = inst.findOne(n => /^icon/i.test(n.name) && n.type === 'FRAME');
    if (ic) ic.visible = false;

    log.push(v.name + ': Log in butona cevrildi, buton ' + Math.round(inst.width) + 'x' + Math.round(inst.height));
  }
  report.info['header'] = log;
});

await step('Bosluk kontrolu', async () => {
  const headerSet = page0.findOne(n => n.name === 'Header' && n.type === 'COMPONENT_SET');
  const out = [];
  for (const v of headerSet.children) {
    if (!/Device=Desktop/.test(v.name)) continue;
    const kids = v.children.filter(c => c.absoluteBoundingBox);
    const g = [];
    for (let i = 0; i < kids.length - 1; i++) {
      const a = kids[i].absoluteBoundingBox, b = kids[i + 1].absoluteBoundingBox;
      g.push(Math.round(b.x - (a.x + a.width)));
    }
    out.push(v.name + ' -> ' + Math.round(v.width) + ', bosluklar: ' + g.join(' / '));
  }
  report.info['bosluklar'] = out;
});

return report;
