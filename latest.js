// step 190 · armasiz ornek sayfalar: hero arka planindaki buyuk soluk arma (bos kalkana donusmustu) gizlenir

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync(); await figma.setCurrentPageAsync(p02);
const contains = (a, b) => { let x = b; while (x) { if (x === a) return true; x = x.parent; } return false; };
for (const D of ['Desktop', 'Mobile']) {
  await step('hero crest · ' + D, async () => {
    const pg = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player / No crest uploaded · ' + D); if (!pg) throw new Error('page missing');
    const hero = pg.findOne(n => n.name === 'Hero · player identity'); if (!hero) throw new Error('hero missing');
    const rows = []; let hidden = 0;
    for (const i of pg.findAll(n => n.type === 'INSTANCE')) {
      const m = await i.getMainComponentAsync(); if (!m || !m.parent || m.parent.name !== 'Club crest') continue;
      const big = contains(hero, i) && (i.width > 100 || i.opacity < 0.5);
      rows.push(Math.round(i.width) + 'x' + Math.round(i.height) + ' op ' + i.opacity + ' ' + (m.name) + (big ? ' -> hidden' : ''));
      if (big) { i.visible = false; hidden++; }
    }
    report.info['crests ' + D] = rows; report.info['hidden ' + D] = hidden;
  });
}
return report;
