// step 329 · Player result: Key facts sütunları sabit genişlik (Age 64, Nationality 144, Contract until 120), etiketler tek satır; satırlar arasında sütunlar hizalı. Mobil Key facts yapısı salt okunur raporlanır.
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = Math.round;
const p01 = figma.root.children.find(p => /^01/.test(p.name));
const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
const pick = re => { let r = null; (function w(n) { if (r) return; if ((n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name)) { r = n; return; } if ('children' in n) for (const k of n.children) w(k); })(p01); return r; };
const set = pick(/^Player result$/);
const W = [64, 144, 120];
const snap = v => { const kf = v.findOne(n => n.name === 'Key facts'); return kf.width + ': ' + kf.children.map(f => R(f.width) + 'x' + R(f.height)).join(' | '); };
await step('fix desktop variants', async () => {
  const out = [];
  for (const v of set.children.filter(c => /Device=Desktop/.test(c.name))) {
    const before = snap(v);
    const kf = v.findOne(n => n.name === 'Key facts'); kf.counterAxisAlignItems = 'MIN';
    const facts = kf.children.filter(n => n.type === 'FRAME');
    facts.forEach((f, i) => {
      f.layoutSizingHorizontal = 'FIXED'; f.resize(W[i] || 100, f.height); f.layoutSizingVertical = 'HUG';
      for (const k of f.children) {
        if (k.type === 'TEXT') { k.textAutoResize = 'HEIGHT'; k.layoutSizingHorizontal = 'FILL'; }
        else if ('layoutSizingHorizontal' in k) { try { k.layoutSizingHorizontal = 'FILL'; } catch (e) { /* yok say */ } }
      }
    });
    kf.layoutSizingHorizontal = 'HUG';
    out.push(`${v.name}: ${before} -> ${snap(v)}`);
  }
  report.info.variants = out;
});
await step('check rows', async () => {
  const out = [];
  for (const fr of p02.findAll(n => n.type === 'FRAME' && /^Search \/ (Players|All results) · Desktop$/.test(n.name))) {
    const rows = fr.findAll(n => n.type === 'INSTANCE' && /^Player ·/.test(n.name));
    const xs = [0, 1, 2].map(i => { const s = {}; for (const r of rows) { const kf = r.findOne(n => n.name === 'Key facts'); const f = kf && kf.children.filter(n => n.type === 'FRAME')[i]; if (f) s[R(f.absoluteBoundingBox.x - r.absoluteBoundingBox.x)] = 1; } return Object.keys(s).join('/'); });
    const labelH = rows.map(r => { const l = r.findAll(n => n.type === 'TEXT' && n.name === 'Label')[0]; return l ? R(l.height) : '?'; });
    const rh = rows.map(r => R(r.height));
    out.push(`${fr.name}: rows ${rows.length} fact x (rel. to row) age ${xs[0]} nat ${xs[1]} contract ${xs[2]} · label heights ${labelH.join(',')} · row heights ${rh.join(',')}`);
  }
  report.info.rows = out;
});
await step('mobile structure', async () => {
  const v = set.children.find(c => /Device=Mobile, Action=Message, State=Default/.test(c.name));
  const lines = [];
  (function d(n, depth) { if (depth > 4) return; let s = `${'  '.repeat(depth)}${n.type[0]}${n.type === 'INSTANCE' ? 'I' : ''} ${n.name} ${R(n.width)}x${R(n.height)}`; try { if (n.layoutMode && n.layoutMode !== 'NONE') s += ` ${n.layoutMode[0]} gap${R(n.itemSpacing)}${n.layoutWrap === 'WRAP' ? ' WRAP' : ''}`; } catch (e) {} try { if (n.type === 'TEXT') s += ` "${String(n.characters).slice(0, 24)}"`; } catch (e) {} lines.push(s); if ('children' in n && n.type !== 'INSTANCE') for (const k of n.children) d(k, depth + 1); })(v, 0);
  report.info.mobile = lines.slice(0, 32);
});
return report;
