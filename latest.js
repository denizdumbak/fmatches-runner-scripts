// step 222 · Clubs: Gender filtresi (Tier ile ayni dilde cip satiri) Default, Club card ve No results sayfalarinda
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync(); await figma.setCurrentPageAsync(p02);
async function setText(node, str) { const f = node.fontName === figma.mixed ? node.getRangeFontName(0, 1) : node.fontName; await figma.loadFontAsync(f); node.characters = str; }
const chipSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Filter chip'); if (!chipSet) throw new Error('Filter chip set missing');
const chipDef = chipSet.children.find(v => /State=Default/.test(v.name));
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web'); const mapSec = web.children.find(n => n.type === 'SECTION' && n.name === 'Map');
for (const nm of ['Map / Default · Desktop', 'Map / Club card · Desktop', 'Map / No results · Desktop']) {
  await step(nm, async () => {
    const pg = mapSec.children.find(n => n.name === nm); if (!pg) throw new Error('page missing');
    const filters = pg.findOne(n => n.name === 'Filters'); const tier = filters.children.find(n => n.name === 'Tier'); if (!tier) throw new Error('Tier row missing');
    for (const k of filters.children.filter(n => n.name === 'Gender')) k.remove();
    const g = tier.clone(); filters.insertChild(filters.children.indexOf(tier) + 1, g); g.name = 'Gender';
    const lab = g.findOne(n => n.type === 'TEXT' && n.name === 'Group label'); await setText(lab, 'Gender');
    const chips = g.findOne(n => n.name === 'Chips'); chips.children.slice(2).forEach(c => c.remove());
    const names = ["Men's", "Women's"];
    for (let i = 0; i < 2; i++) { const c = chips.children[i]; c.swapComponent(chipDef); c.name = 'Chip · ' + names[i]; const t = c.findOne(n => n.type === 'TEXT'); await setText(t, names[i]); }
    for (const fr of [tier, g]) { const l = fr.findOne(n => n.type === 'TEXT' && n.name === 'Group label'); l.textAutoResize = 'NONE'; l.resize(56, 16); }
    const panel = pg.findOne(n => n.name === 'Map panel'); let bottom = 0; for (const k of panel.children) if (k.visible) bottom = Math.max(bottom, k.y + k.height);
    report.info[nm] = 'filters ' + Math.round(filters.width) + 'x' + Math.round(filters.height) + ' · gender ' + Math.round(g.width) + 'x' + Math.round(g.height) + ' · chips ' + chips.children.map(c => c.name).join(', ') + ' · panel content bottom ' + Math.round(bottom) + ' of ' + Math.round(panel.height);
  });
}
return report;
