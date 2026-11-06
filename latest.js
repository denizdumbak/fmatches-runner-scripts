// step 332 · Player result: masaüstü sütunlar Age 48 / Nationality 136 / Contract until 104 + Meta tek satır (kısaltma), mobil sütunlar Age 56 / Nationality 128 / Contract until kalanı; Event row mobil Meta taşması ölçülüp düzeltilir
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = Math.round;
const p01 = figma.root.children.find(p => /^01/.test(p.name));
const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
const pick = re => { let r = null; (function w(n) { if (r) return; if ((n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name)) { r = n; return; } if ('children' in n) for (const k of n.children) w(k); })(p01); return r; };
const set = pick(/^Player result$/), evSet = pick(/^Event row$/);
function fixFacts(v, widths, fillLast) {
  const kf = v.findOne(n => n.name === 'Key facts'); kf.counterAxisAlignItems = 'MIN';
  const facts = kf.children.filter(n => n.type === 'FRAME');
  facts.forEach((f, i) => {
    if (fillLast && i === facts.length - 1) f.layoutSizingHorizontal = 'FILL';
    else { f.layoutSizingHorizontal = 'FIXED'; f.resize(widths[i], f.height); }
    f.layoutSizingVertical = 'HUG';
    for (const k of f.children) {
      if (k.type === 'TEXT') { k.textAutoResize = 'HEIGHT'; k.layoutSizingHorizontal = 'FILL'; }
      else { try { k.layoutSizingHorizontal = 'FILL'; } catch (e) { /* yok say */ } }
    }
  });
  return kf.children.filter(n => n.type === 'FRAME').map(f => R(f.width)).join('/');
}
await step('desktop', async () => {
  const out = [];
  for (const v of set.children.filter(c => /Device=Desktop/.test(c.name))) {
    const w = fixFacts(v, [48, 136, 104], false);
    const kf = v.findOne(n => n.name === 'Key facts'); kf.layoutSizingHorizontal = 'HUG';
    const m = v.findOne(n => n.type === 'TEXT' && n.name === 'Meta'); m.textAutoResize = 'HEIGHT'; m.textTruncation = 'ENDING'; m.maxLines = 1; m.layoutSizingHorizontal = 'FILL';
    out.push(`${v.name}: facts ${w} keyfacts ${R(kf.width)} meta ${R(m.width)}`);
  }
  report.info.desktop = out;
});
await step('mobile', async () => {
  const out = [];
  for (const v of set.children.filter(c => /Device=Mobile/.test(c.name))) {
    const w = fixFacts(v, [56, 128, 0], true);
    out.push(`${v.name}: facts ${w}`);
  }
  report.info.mobile = out;
});
await step('event row mobile meta', async () => {
  const out = [];
  for (const v of evSet.children.filter(c => /Device=Mobile/.test(c.name))) {
    const d = v.findOne(n => n.name === 'Details'), m = v.findOne(n => n.name === 'Meta'), loc = v.findOne(n => n.type === 'TEXT' && n.name === 'Location');
    const before = `details ${R(d.width)} meta ${R(m.width)} loc ${R(loc.width)} h ${R(v.height)}`;
    m.layoutSizingHorizontal = 'FILL';
    loc.textAutoResize = 'HEIGHT'; loc.layoutSizingHorizontal = 'FILL'; loc.textTruncation = 'ENDING'; loc.maxLines = 1;
    out.push(`${v.name}: ${before} -> details ${R(d.width)} meta ${R(m.width)} loc ${R(loc.width)} h ${R(v.height)}`);
  }
  report.info.eventRow = out;
});
await step('check', async () => {
  const out = [];
  for (const fr of p02.findAll(n => n.type === 'FRAME' && /^Search \/ (Players|All results|Events) · (Desktop|Mobile)$/.test(n.name))) {
    const rows = fr.findAll(n => n.type === 'INSTANCE' && /^(Player|Event) ·/.test(n.name));
    const over = [];
    for (const n of fr.findAll(x => x.visible !== false && x.type !== 'VECTOR')) { const p = n.parent; if (!p || p === fr || p.type === 'INSTANCE' || n.layoutPositioning === 'ABSOLUTE' || p.type !== 'FRAME' || p.name === 'Tabs') continue; const a = n.absoluteBoundingBox, b = p.absoluteBoundingBox; if (a && b && a.x + a.width > b.x + b.width + 0.5) over.push(`${p.name} :: ${n.name}`); }
    let xs = '';
    if (/Players/.test(fr.name)) xs = [0, 1, 2].map(i => { const s = {}; for (const r of rows) { const kf = r.findOne(n => n.name === 'Key facts'); const f = kf && kf.children.filter(n => n.type === 'FRAME')[i]; if (f) s[R(f.absoluteBoundingBox.x - r.absoluteBoundingBox.x)] = 1; } return Object.keys(s).join('/'); }).join(' | ');
    out.push(`${fr.name}: row heights ${rows.map(r => R(r.height)).join(',')} fact x ${xs || '-'} overflow ${over.length ? over.slice(0, 3).join('; ') : 'none'}`);
  }
  report.info.check = out;
});
return report;
