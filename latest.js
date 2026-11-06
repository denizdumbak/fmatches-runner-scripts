// step 330 · Player result: Actions sabit genişlik 212 (düğme FILL, yıldız 48), böylece Message ve Add to contacts satırlarında Key facts sütunları aynı x'te başlar
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = Math.round;
const p01 = figma.root.children.find(p => /^01/.test(p.name));
const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
const pick = re => { let r = null; (function w(n) { if (r) return; if ((n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name)) { r = n; return; } if ('children' in n) for (const k of n.children) w(k); })(p01); return r; };
const set = pick(/^Player result$/);

await step('fix actions width', async () => {
  const out = [];
  for (const v of set.children.filter(c => /Device=Desktop/.test(c.name))) {
    const a = v.findOne(n => n.name === 'Actions'); const before = R(a.width);
    a.layoutSizingHorizontal = 'FIXED'; a.resize(212, a.height); a.primaryAxisAlignItems = 'MIN';
    for (const k of a.children) { if (/^Button/.test(k.name)) k.layoutSizingHorizontal = 'FILL'; }
    out.push(`${v.name}: actions ${before} -> ${R(a.width)}; ` + a.children.map(k => k.name + ' ' + R(k.width)).join(' | '));
  }
  report.info.variants = out;
});
await step('check rows', async () => {
  const out = [];
  for (const fr of p02.findAll(n => n.type === 'FRAME' && /^Search \/ (Players|All results) · Desktop$/.test(n.name))) {
    const rows = fr.findAll(n => n.type === 'INSTANCE' && /^Player ·/.test(n.name));
    const xs = [0, 1, 2].map(i => { const s2 = {}; for (const r of rows) { const kf = r.findOne(n => n.name === 'Key facts'); const f = kf && kf.children.filter(n => n.type === 'FRAME')[i]; if (f) s2[R(f.absoluteBoundingBox.x - r.absoluteBoundingBox.x)] = 1; } return Object.keys(s2).join('/'); });
    out.push(`${fr.name}: rows ${rows.length} age x ${xs[0]} nat x ${xs[1]} contract x ${xs[2]} · row heights ${rows.map(r => R(r.height)).join(',')}`);
  }
  report.info.rows = out;
});
return report;
