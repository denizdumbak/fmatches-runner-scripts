// step 193 · armasiz sayfalar: hero'nun dogrudan cocugu olan buyuk soluk arma (adla bulunur) gizlenir

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync(); await figma.setCurrentPageAsync(p02);
const r = n => Math.round(n);
for (const D of ['Desktop', 'Mobile']) {
  await step('hero crest · ' + D, async () => {
    const pg = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player / No crest uploaded · ' + D); if (!pg) throw new Error('page missing');
    const hero = pg.findOne(n => n.name === 'Hero · player identity'); if (!hero) throw new Error('hero missing');
    report.info['hero children ' + D] = hero.children.map(c => c.type[0] + ' ' + c.name + ' ' + r(c.width) + 'x' + r(c.height) + ' op ' + c.opacity + (c.layoutPositioning === 'ABSOLUTE' ? ' ABS' : '') + (c.visible === false ? ' hidden' : ''));
    let hidden = 0;
    for (const c of hero.children) if (/crest/i.test(c.name) && c.visible !== false && (c.layoutPositioning === 'ABSOLUTE' || c.width > 100)) { c.visible = false; hidden++; }
    report.info['hidden ' + D] = hidden;
  });
}
return report;
