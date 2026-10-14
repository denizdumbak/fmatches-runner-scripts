// step 96 · Kucuk isler: sekme 02 duzeni, Data/Ticker stili, koyu yuzey renkleri, profilde ticker

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const pageOf = re => figma.root.children.find(p => re.test(p.name));
const page0 = pageOf(/^01/), pageHome = pageOf(/^02/), pageProf = pageOf(/^03/);
for (const p of [page0, pageHome, pageProf]) { if (p) await p.loadAsync(); }

const allVars = await figma.variables.getLocalVariablesAsync();
const byName = n => allVars.find(v => v.name === n) || allVars.find(v => new RegExp(n.replace(/\//g, '\\/') + '$').test(v.name));
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const box = n => n.absoluteBoundingBox;
const findComp = nm => page0.findOne(n => n.name === nm && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));

// ===== 1) sekme 02 duzeni
await step('Sekme 02 duzeni', async () => {
  const order = ['Home · Desktop', 'Home · Desktop · calendar view', 'Home · Mobile', 'Home · Mobile · calendar view', 'Home · Hero slides 2–3'];
  const frames = order.map(nm => pageHome.children.find(n => n.name === nm)).filter(Boolean);
  if (frames.length < 4) throw new Error('Home frameleri eksik: ' + frames.map(f => f.name).join(', '));
  const startX = box(frames[0]).x, y = box(frames[0]).y, GAP = 240;
  let x = startX;
  for (const f of frames) { f.x += x - box(f).x; f.y += y - box(f).y; x += box(f).width + GAP; }

  const label = pageHome.children.find(n => /Row label/i.test(n.name));
  if (label) { label.x += startX - box(label).x; label.y += (y - 120) - box(label).y; }

  // geri kalanlar cakisiyorsa saga it
  const placed = frames.concat(label ? [label] : []);
  const hit = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
  let right = Math.max(...placed.map(n => box(n).x + box(n).width)) + GAP;
  const moved = [];
  for (const n of pageHome.children) {
    if (placed.includes(n) || !box(n)) continue;
    if (placed.some(p => hit(box(n), box(p)))) { n.x += right - box(n).x; right += box(n).width + GAP; moved.push(n.name); }
  }
  const all = pageHome.children.filter(n => box(n)), over = [];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (hit(box(all[i]), box(all[j]))) over.push(all[i].name + ' <-> ' + all[j].name);
  report.info['02 kaydirilan'] = moved.length ? moved : 'yok';
  report.info['02 cakisma'] = over.length ? over : 'yok';
});

// ===== 2) Data/Ticker stili
await step('Data/Ticker stili', async () => {
  const ticker = findComp('Ticker');
  if (!ticker) throw new Error('Ticker yok');
  const dateRe = /\d{1,2}\s?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i;
  const texts = ticker.findAll(n => n.type === 'TEXT' && dateRe.test(n.characters));
  if (!texts.length) throw new Error('tarih metni bulunamadi');
  const s0 = texts[0];
  if (s0.fontName === figma.mixed) throw new Error('karisik font');
  await figma.loadFontAsync(s0.fontName);

  let style = (await figma.getLocalTextStylesAsync()).find(s => s.name === 'Data/Ticker');
  if (!style) { style = figma.createTextStyle(); style.name = 'Data/Ticker'; }
  style.fontName = s0.fontName;
  style.fontSize = s0.fontSize;
  if (s0.lineHeight !== figma.mixed) style.lineHeight = s0.lineHeight;
  if (s0.letterSpacing !== figma.mixed) style.letterSpacing = s0.letterSpacing;
  if (s0.textCase !== figma.mixed) style.textCase = s0.textCase;
  style.description = 'Event dates in the ticker. Tabular, quieter than the event name.';
  for (const t of texts) await t.setTextStyleIdAsync(style.id);
  report.info['Data/Ticker'] = s0.fontName.family + ' ' + s0.fontName.style + ' ' + s0.fontSize + ' px, ' + texts.length + ' metne baglandi';
});

// ===== 3) koyu yuzey renkleri
await step('Koyu yuzey renkleri Foundations', async () => {
  const sw = page0.findOne(n => n.name === 'Swatch · Surface');
  if (!sw) throw new Error('ornek swatch yok');
  const container = sw.parent;
  const list = [
    { label: 'Inverse secondary text', v: byName('color/text/inverse-secondary') },
    { label: 'Inverse border', v: byName('color/border/inverse') }
  ];
  const inv = byName('color/bg/inverse');
  const out = [];
  for (const it of list) {
    if (!it.v) { out.push(it.label + ': degisken yok'); continue; }
    const old = container.children.find(c => c.name === 'Swatch · ' + it.label);
    if (old) old.remove();
    const c = sw.clone();
    c.name = 'Swatch · ' + it.label;
    container.appendChild(c);
    const chip = c.findOne(n => n.type !== 'TEXT' && 'fills' in n && n.fills !== figma.mixed && n.fills.length > 0);
    if (chip) chip.fills = inv ? [P(inv), P(it.v)] : [P(it.v)];
    const texts = c.findAll(n => n.type === 'TEXT');
    for (const t of texts) {
      await figma.loadFontAsync(t.fontName);
      if (/^color\//.test(t.characters)) t.characters = it.v.name;
      else if (t === texts[0]) t.characters = it.label;
    }
    out.push(it.label + ' eklendi (' + it.v.name + ')');
  }
  if (container.layoutMode === 'HORIZONTAL') container.layoutWrap = 'WRAP';
  report.info['renkler'] = out;
  report.info['Swatches'] = Math.round(container.width) + 'x' + Math.round(container.height);
});

// ===== 4) profilde ticker
await step('Profilde ticker', async () => {
  const ticker = findComp('Ticker');
  const frames = pageProf.children.filter(n => n.type === 'FRAME' && n.layoutMode === 'VERTICAL' && /Desktop|Mobile/.test(n.name));
  if (!frames.length) throw new Error('profil frame bulunamadi: ' + pageProf.children.map(n => n.name).join(' | '));
  const out = [];
  for (const f of frames) {
    if (f.findChild(n => n.name === 'Ticker')) { out.push(f.name + ': zaten var'); continue; }
    const dev = /Mobile/.test(f.name) ? 'Mobile' : 'Desktop';
    const v = ticker.children.find(c => new RegExp('Device=' + dev).test(c.name) && /Visitor 1/.test(c.name)) ||
              ticker.children.find(c => new RegExp('Device=' + dev).test(c.name));
    const i = v.createInstance();
    i.name = 'Ticker';
    const fixed = f.primaryAxisSizingMode === 'FIXED';
    const h0 = f.height;
    f.insertChild(0, i);
    i.layoutSizingHorizontal = 'FILL';
    if (fixed) f.resize(f.width, h0 + i.height);
    out.push(f.name + ': eklendi, ' + Math.round(f.width) + 'x' + Math.round(f.height));
  }
  report.info['profil'] = out;
});

return report;
