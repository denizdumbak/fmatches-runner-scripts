// step 365 · senior tur düzeltmeleri: (1) Player result Mobile: "Contract until" etiketi tek satır (Contract sütunu HUG, Nationality FILL) (2) elle 40 px yapılmış Filter chip örnekleri 44 px
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const R = n => Math.round(n);
const BB = n => n.absoluteBoundingBox;
const SECS = ['Stadium card', 'Search results', 'Club card', 'Shortlists'];
const secOf = (plat, name) => p02.children.find(n => n.type === 'SECTION' && n.name === plat).children.find(n => n.type === 'SECTION' && n.name === name);

await step('Player result Mobile key facts', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Player result');
  const rows = [];
  for (const v of set.children.filter(k => /Device=Mobile/.test(k.name))) {
    const kf = v.findOne(n => n.name === 'Key facts'); if (!kf) throw new Error('Key facts yok: ' + v.name);
    const facts = kf.children.filter(c => c.name === 'Fact'); const by = {};
    for (const f of facts) { const l = f.findOne(n => n.type === 'TEXT' && n.name === 'Label'); if (l) by[l.characters] = f; }
    if (!by['Contract until'] || !by['Nationality']) throw new Error('Fact eksik: ' + v.name + ' ' + Object.keys(by).join(','));
    const cf = by['Contract until'], nf = by['Nationality'];
    const before = { contract: R(cf.width), nat: R(nf.width), cSizing: cf.layoutSizingHorizontal, nSizing: nf.layoutSizingHorizontal };
    const cl = cf.findOne(n => n.type === 'TEXT' && n.name === 'Label');
    cl.textAutoResize = 'WIDTH_AND_HEIGHT';
    cl.layoutSizingHorizontal = 'HUG';
    cf.layoutSizingHorizontal = 'HUG';
    nf.layoutSizingHorizontal = 'FILL';
    rows.push(v.name.replace('Device=Mobile, ', '') + ': contract ' + before.contract + '(' + before.cSizing + ') -> ' + R(cf.width) + '(' + cf.layoutSizingHorizontal + '), nat ' + before.nat + '(' + before.nSizing + ') -> ' + R(nf.width) + '(' + nf.layoutSizingHorizontal + '), labelH ' + R(cl.height) + ', keyFacts ' + R(kf.height) + ', variant ' + R(v.width) + 'x' + R(v.height));
  }
  report.info.componentVariants = rows;
});

await step('Filter chip 44', async () => {
  const fixed = []; let remaining = 0;
  for (const plat of ['Web', 'Mobile']) for (const sn of SECS) {
    const sec = secOf(plat, sn); if (!sec) continue;
    for (const f of sec.children.filter(c => c.type === 'FRAME')) {
      const chips = f.findAll(n => n.type === 'INSTANCE' && /^(Chip|Filter chip)/.test(n.name) && n.visible !== false);
      let n40 = 0;
      for (const c of chips) { const b = BB(c); if (b && b.height < 43.5) { const w = c.width; c.resize(w, 44); c.layoutSizingHorizontal = 'HUG'; n40++; } }
      if (n40) fixed.push(plat + ' · ' + f.name.replace(/^.*\/ /, '') + ': ' + n40 + ' çip -> 44');
      for (const c of chips) { const b = BB(c); if (b && b.height < 43.5) remaining++; }
    }
  }
  report.info.chips = { fixed, remainingUnder44: remaining };
});

await step('section settle', async () => {
  const inter = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
  const out = [];
  for (const plat of ['Web', 'Mobile']) {
    const P = p02.children.find(n => n.type === 'SECTION' && n.name === plat);
    for (const sn of SECS) {
      const sec = P.children.find(n => n.type === 'SECTION' && n.name === sn); if (!sec) continue;
      let right = 0, bottom = 0; for (const k of sec.children) { right = Math.max(right, k.x + k.width); bottom = Math.max(bottom, k.y + k.height); }
      const needW = R(right + 80), needH = R(bottom + 80);
      if (needW > sec.width || needH > sec.height) { sec.resizeWithoutConstraints(Math.max(R(sec.width), needW), Math.max(R(sec.height), needH)); out.push(plat + ' · ' + sn + ' büyüdü: ' + R(sec.width) + 'x' + R(sec.height)); }
      for (let it = 0; it < 6; it++) { let moved = false; for (const s of P.children.filter(n => n.type === 'SECTION' && n !== sec)) { if (inter({ x: sec.x, y: sec.y, width: sec.width, height: sec.height }, { x: s.x, y: s.y, width: s.width, height: s.height }) && s.y >= sec.y) { const d = R(sec.y + sec.height + 160 - s.y); s.y += d; out.push(s.name + ' ↓' + d); moved = true; } } if (!moved) break; }
    }
    let pr = 0, pb = 0; for (const k of P.children) { pr = Math.max(pr, k.x + k.width); pb = Math.max(pb, k.y + k.height); }
    P.resizeWithoutConstraints(Math.max(R(P.width), R(pr + 120)), Math.max(R(P.height), R(pb + 120)));
  }
  report.info.settle = out.length ? out : 'değişiklik yok';
});

await step('check: rows + labels', async () => {
  const res = {};
  for (const [plat, sn] of [['Mobile', 'Search results'], ['Mobile', 'Club card'], ['Mobile', 'Shortlists']]) {
    const sec = secOf(plat, sn); const agg = {}; let wrap = 0;
    for (const f of sec.children.filter(c => c.type === 'FRAME')) {
      for (const r of f.findAll(n => n.type === 'INSTANCE' && /^Player ·/.test(n.name))) {
        const k = R(r.width) + 'x' + R(r.height); agg[k] = (agg[k] || 0) + 1;
        const cl = r.findOne(n => n.type === 'TEXT' && n.name === 'Label' && n.characters === 'Contract until' && n.visible !== false);
        if (cl && cl.height > 20) wrap++;
      }
    }
    res[plat + ' · ' + sn] = { rows: agg, contractLabelStillWrapped: wrap, frames: sec.children.filter(c => c.type === 'FRAME').map(f => f.name.replace(/^.*\/ /, '') + ' ' + R(f.height)) };
  }
  report.info.check = res;
});
return report;
