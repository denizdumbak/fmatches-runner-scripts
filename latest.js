// step 132 · Kucuk isler: profil ticker rolu manager/official (header ile tutarli), gizli eski stage silindi, eski Display/Hero stilleri arsive + silindi, kulup seridi bayragi Flag component

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/), p02 = pageOf(/^02/), p03 = pageOf(/^03/);
for (const p of [p01, p02, p03]) await p.loadAsync();

// A · Profil sayfalarinda ticker rolu
await step('A ticker role', async () => {
  const frames = p02.findAll(n => n.type === 'FRAME' && /^Profiles \/ Player/.test(n.name) && n.parent && n.parent.type === 'SECTION');
  const out = [];
  let options = null, target = null;
  for (const f of frames) {
    const t = f.children.find(c => c.type === 'INSTANCE' && c.name === 'Ticker');
    if (!t) { out.push(f.name + ': ticker yok'); continue; }
    if (!options) {
      const main = await t.getMainComponentAsync();
      const set = main.parent;
      options = set.componentPropertyDefinitions.Role.variantOptions;
      target = options.find(o => /manager|official/i.test(o)) || options.find(o => /tournament/i.test(o));
      report.info.roleOptions = options;
      if (!target) throw new Error('manager/official rolu bulunamadi: ' + options.join(', '));
    }
    const before = t.variantProperties.Role;
    t.setProperties({ Role: target });
    out.push(f.name + ': ' + before + ' -> ' + target);
  }
  report.info.ticker = out;
});

// B · Gizli eski stage
await step('B old stage', async () => {
  const n = await figma.getNodeByIdAsync('90:4267');
  if (!n) { report.info.oldStage = 'zaten yok'; return; }
  if (!/No photo · Stage \(old, hidden\)/.test(n.name)) throw new Error('beklenmeyen node: ' + n.name);
  n.remove();
  report.info.oldStage = 'silindi';
});

// C · Eski Display/Hero stilleri
await step('C old hero styles', async () => {
  const styles = (await figma.getLocalTextStylesAsync()).filter(s => /^Display\/Hero (Desktop|Mobile)$/.test(s.name));
  const ids = styles.map(s => s.id);
  const texts = p01.findAll(n => n.type === 'TEXT' && ids.indexOf(n.textStyleId) >= 0);
  // 03 sayfasinda bos yer: mevcut icerigin sagi
  let right = 0, top = Infinity;
  for (const c of p03.children) { right = Math.max(right, c.x + c.width); top = Math.min(top, c.y); }
  if (top === Infinity) top = 0;
  let y = top;
  const moved = [];
  for (const t of texts) {
    const holder = (t.parent && /^Display\/Hero/.test(t.parent.name)) ? t.parent : t;
    const from = holder.parent ? holder.parent.name : '?';
    p03.appendChild(holder);
    holder.x = right + 200; holder.y = y; y += holder.height + 80;
    moved.push(holder.name + ' (' + holder.type + ') from ' + from);
  }
  for (const s of styles) s.remove();
  report.info.heroStyles = { moved: moved, removed: styles.map(s => s.name) };
});

// D · Kulup seridi bayragi -> Flag component
await step('D club strip flag', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Club strip');
  const flagSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Flag');
  if (!set || !flagSet) throw new Error('Club strip ya da Flag yok');
  const england = flagSet.children.find(c => c.name === 'Country=England');
  const out = [];
  for (const v of set.children) {
    const lc = v.findOne(n => n.name === 'League country' && n.type === 'FRAME');
    if (!lc) { out.push(v.name + ': League country yok'); continue; }
    const old = lc.children.find(c => c.name === 'Flag');
    if (!old || old.type === 'INSTANCE') { out.push(v.name + ': zaten instance ya da yok'); continue; }
    const w = old.width, h = old.height, idx = lc.children.indexOf(old);
    const inst = england.createInstance();
    inst.name = 'Flag';
    lc.insertChild(idx, inst);
    inst.resize(w, h);
    old.remove();
    out.push(v.name + ': Flag instance ' + Math.round(inst.width) + 'x' + Math.round(inst.height));
  }
  report.info.clubStrip = out;
  // Sayfadaki seritlerin ulke metni (kontrol)
  const insts = p02.findAll(n => n.type === 'INSTANCE' && n.name === 'Club strip');
  report.info.stripCountries = insts.map(i => {
    const lc = i.findOne(n => n.name === 'League country');
    const tx = lc ? lc.findOne(n => n.type === 'TEXT') : null;
    let top = i; while (top.parent && top.parent.type !== 'SECTION') top = top.parent;
    return top.name + ': ' + (tx ? tx.characters : '?');
  });
});

return report;
