// step 235 · Map: "Stadiums" -> "Facilities" (Sergey, 28 Oct): type switcher, summaries, filters, empty states, frame names; singular "stadium" names/buttons stay

const report = { done: [], errors: [], info: { changed: {}, layerNames: [], leftover: [] } };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pages = figma.root.children.filter(p => /^0[12]/.test(p.name));

// only the map sections: "7 · Map" on 01, "Map" under Web / Mobile on 02
const inMap = n => { let x = n.parent; while (x) { if (x.type === 'SECTION' && /^(7 · )?Map$/.test(x.name)) return true; x = x.parent; } return false; };

const fix = s => s
  .replace(/Stadiums/g, 'Facilities')
  .replace(/stadiums/g, 'facilities')
  .replace(/(\d[\d,]*) stadium\b/g, '$1 facility');

async function rewrite(t, next) {
  const old = t.characters;
  const fonts = t.getRangeAllFontNames(0, old.length);
  for (const f of fonts) await figma.loadFontAsync(f);
  t.insertCharacters(old.length, next, 'AFTER');
  t.deleteCharacters(0, old.length);
}

for (const pg of pages) {
  await step('texts · ' + pg.name, async () => {
    await pg.loadAsync();
    const texts = pg.findAll(n => n.type === 'TEXT' && inMap(n) && fix(n.characters) !== n.characters);
    for (const t of texts) {
      const before = t.characters, after = fix(before);
      await rewrite(t, after);
      const k = before + '  ->  ' + after;
      report.info.changed[k] = (report.info.changed[k] || 0) + 1;
    }
  });
  await step('layer names · ' + pg.name, async () => {
    const nodes = pg.findAll(n => inMap(n) && /Stadiums/.test(n.name) && n.type !== 'COMPONENT' && n.type !== 'COMPONENT_SET' && n.type !== 'INSTANCE');
    for (const n of nodes) {
      const before = n.name;
      try { n.name = before.replace(/Stadiums/g, 'Facilities'); report.info.layerNames.push(before + '  ->  ' + n.name); }
      catch (e) { report.errors.push('rename ' + before + ': ' + e.message); }
    }
  });
  await step('leftover · ' + pg.name, async () => {
    const left = pg.findAll(n => n.type === 'TEXT' && inMap(n) && /stadium/i.test(n.characters));
    const seen = {};
    for (const t of left) seen[t.characters] = (seen[t.characters] || 0) + 1;
    for (const k of Object.keys(seen)) report.info.leftover.push(k + '  x' + seen[k]);
  });
}

report.info.changedTotal = Object.keys(report.info.changed).reduce((a, k) => a + report.info.changed[k], 0);
return report;
