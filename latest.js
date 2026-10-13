// step 71 · Network and figures: ilk butonu "Join our professional network"a geri al (script 70 düzeltmesi)

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const page = re => figma.root.children.find(p => re.test(p.name));
const pageHome = page(/^02/);
if (!pageHome) { return { errors: ['02 sayfasi bulunamadi'] }; }
await pageHome.loadAsync();

// Butonun etiketi Inter ile yazili; metin ozelligini degistirmeden once fontlari yukle
for (const style of ['Regular', 'Medium', 'Semi Bold']) {
  try { await figma.loadFontAsync({ family: 'Inter', style: style }); } catch (e) { report.errors.push('font ' + style + ': ' + e.message); }
}

const PRIMARY_LABEL = 'Join our professional network';
const SECONDARY_LABEL = 'Find clubs near you';

// Bir instance'in TEXT tipindeki Label ozelliginin anahtarini bul (Label#8:0 gibi)
function labelKeyOf(inst) {
  const props = inst.componentProperties;
  for (const k of Object.keys(props)) {
    if (/^Label(#|$)/.test(k) && props[k].type === 'TEXT') return k;
  }
  for (const k of Object.keys(props)) {
    if (props[k].type === 'TEXT') return k;
  }
  return null;
}

function hasVariant(inst, name) {
  const props = inst.componentProperties;
  return Object.prototype.hasOwnProperty.call(props, name) && props[name].type === 'VARIANT';
}

function boxOf(n) {
  const b = n.absoluteBoundingBox;
  return b ? b : { x: 0, y: 0 };
}

// Blok icindeki butonlari konuma gore sirala: once satir (y), sonra soldan saga (x)
function orderedButtons(block) {
  const all = block.findAll(n => n.type === 'INSTANCE');
  const buttons = [];
  for (const n of all) {
    if (labelKeyOf(n)) buttons.push(n);
  }
  buttons.sort((a, b) => {
    const ba = boxOf(a), bb = boxOf(b);
    if (Math.abs(ba.y - bb.y) > 8) return ba.y - bb.y;
    return ba.x - bb.x;
  });
  return buttons;
}

async function fixFrame(frameName) {
  let frame = pageHome.children.find(n => n.name === frameName);
  if (!frame) frame = pageHome.findOne(n => n.name === frameName);
  if (!frame) throw new Error('frame bulunamadi: ' + frameName);

  const block = frame.findOne(n => /^Network and figures/i.test(n.name));
  if (!block) throw new Error('Network and figures blogu bulunamadi: ' + frameName);

  const buttons = orderedButtons(block);
  const before = [];
  for (const b of buttons) {
    const k = labelKeyOf(b);
    before.push({
      layer: b.name,
      label: b.componentProperties[k].value,
      style: hasVariant(b, 'Style') ? b.componentProperties.Style.value : '(yok)',
      x: Math.round(boxOf(b).x),
      y: Math.round(boxOf(b).y)
    });
  }
  report.info[frameName + ' · once'] = before;

  if (buttons.length < 2) throw new Error(frameName + ': blokta ' + buttons.length + ' buton var, 2 bekleniyordu. Degisiklik yapilmadi.');
  if (buttons.length > 2) report.errors.push(frameName + ': blokta ' + buttons.length + ' buton bulundu, ilk ikisi kullanildi.');

  const targets = [
    { inst: buttons[0], label: PRIMARY_LABEL, style: 'Primary' },
    { inst: buttons[1], label: SECONDARY_LABEL, style: 'Secondary' }
  ];

  for (const t of targets) {
    // Once varyant, sonra metin: varyant degisimi override sirasini bozmasin
    if (hasVariant(t.inst, 'Style') && t.inst.componentProperties.Style.value !== t.style) {
      try { t.inst.setProperties({ Style: t.style }); } catch (e) { report.errors.push(frameName + ' varyant (' + t.label + '): ' + e.message); }
    }
    const k = labelKeyOf(t.inst);
    if (!k) { report.errors.push(frameName + ': Label ozelligi bulunamadi (' + t.inst.name + ')'); continue; }
    if (t.inst.componentProperties[k].value !== t.label) {
      const set = {}; set[k] = t.label;
      t.inst.setProperties(set);
    }
    t.inst.name = t.label;
  }

  const after = [];
  for (const b of buttons.slice(0, 2)) {
    const k = labelKeyOf(b);
    after.push({
      label: b.componentProperties[k].value,
      style: hasVariant(b, 'Style') ? b.componentProperties.Style.value : '(yok)'
    });
  }
  report.info[frameName + ' · sonra'] = after;
}

await step('Home · Desktop · Network and figures', () => fixFrame('Home · Desktop'));
await step('Home · Mobile · Network and figures', () => fixFrame('Home · Mobile'));

// Taşma kontrolü: masaüstünde butonların bulunduğu satır bloktan taşıyor mu
await step('Taşma kontrolü', async () => {
  const out = {};
  for (const frameName of ['Home · Desktop', 'Home · Mobile']) {
    let frame = pageHome.children.find(n => n.name === frameName);
    if (!frame) continue;
    const block = frame.findOne(n => /^Network and figures/i.test(n.name));
    if (!block) continue;
    const bb = boxOf(block);
    const bw = block.absoluteBoundingBox ? block.absoluteBoundingBox.width : 0;
    const rows = [];
    for (const b of orderedButtons(block).slice(0, 2)) {
      const r = b.absoluteBoundingBox;
      if (!r) continue;
      rows.push({ label: b.name, w: Math.round(r.width), right: Math.round(r.x + r.width - bb.x), blokGenislik: Math.round(bw) });
    }
    out[frameName] = rows;
  }
  report.info['buton genislikleri'] = out;
});

return report;
