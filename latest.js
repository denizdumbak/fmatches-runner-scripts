// step 386 · duzeltme: Qualification bos satirlarda Fact gizlenince Nationality saga kayiyor; Fact gorunur kalir, deger bos (sutun yeri korunur). Tum satirlarin hizasi olculur
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const sWeb = web.children.find(n => n.type === 'SECTION' && n.name === 'Search results');
async function setText(t, s) { const f = t.fontName; if (f === figma.mixed) { await figma.loadFontAsync(t.getRangeFontName(0, 1)); } else { await figma.loadFontAsync(f); } t.characters = s; }
const bx = n => { const b = n.absoluteBoundingBox; return b ? R(b.x) : null; };
for (const nm of ['Managers & officials', 'Intermediaries']) {
  await step(nm, async () => {
    const f = sWeb.children.find(c => c.name === 'Search / ' + nm + ' · Desktop'); if (!f) throw new Error('ekran yok');
    const rows = f.findAll(n => n.type === 'INSTANCE' && /^Person ·/.test(n.name));
    const head = f.findOne(n => n.name === 'Table header');
    const hn = head.findOne(n => n.type === 'TEXT' && n.characters === 'Nationality');
    const hq = head.findAll(n => n.type === 'TEXT' && n.visible).pop();
    let fixed = 0; const out = [];
    for (const r of rows) {
      const facts = r.findAll(n => n.name === 'Fact' && n.type === 'FRAME');
      const q = facts[2];
      if (q && !q.visible) { q.visible = true; const v = q.findOne(n => n.type === 'TEXT' && n.name === 'Value'); if (v) await setText(v, ''); fixed++; }
      out.push(r.name.replace('Person · ', '') + ' nat dx ' + (bx(facts[1]) - bx(hn)) + ' · qual dx ' + (bx(facts[2]) - bx(hq)));
    }
    report.info[nm] = { fixed, rows: out };
  });
}
return JSON.stringify(report, null, 1);
