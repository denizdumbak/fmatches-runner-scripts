// step 162 · "Button" yazisi kalan Button instance'lari duzelir (01 + 02): metin katman adindan ("Button · Done" → Done) · Button component'inin metin baglantisi raporlanir

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }

const btnSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Button');

await step('inspect Button', async () => {
  const defs = btnSet.componentPropertyDefinitions;
  report.info.props = Object.keys(defs).map(k => k + ' (' + defs[k].type + ')');
  const v = btnSet.children[0];
  report.info.variant = v.name;
  report.info.texts = v.findAll(n => n.type === 'TEXT').map(t => t.name + ' "' + t.characters + '" refs ' + JSON.stringify(t.componentPropertyReferences || {}));
});

await step('fix labels', async () => {
  const fixed = [], unknown = [];
  for (const page of [p01, p02]) {
    for (const i of page.findAll(n => n.type === 'INSTANCE')) {
      let main; try { main = await i.getMainComponentAsync(); } catch (e) { continue; }
      if (!main || main.parent !== btnSet) continue;
      const t = i.findOne(n => n.type === 'TEXT');
      if (!t || t.characters !== 'Button') continue;
      const m = i.name.match(/^Button · (.+)$/);
      if (!m) { unknown.push(page.name.slice(0, 2) + ' · ' + (i.parent ? i.parent.name : '') + ' / ' + i.name); continue; }
      await loadFonts(t); t.characters = m[1];
      fixed.push(page.name.slice(0, 2) + ' · ' + m[1]);
    }
  }
  report.info.fixed = fixed.length ? fixed : 'none';
  report.info.unknown = unknown.length ? unknown : 'none';
});

await step('left', async () => {
  let left = 0;
  for (const page of [p01, p02]) for (const i of page.findAll(n => n.type === 'INSTANCE' && /^Button · /.test(n.name))) {
    const t = i.findOne(n => n.type === 'TEXT'); if (t && t.characters === 'Button') left++;
  }
  report.info.buttonTextLeft = left;
});

return report;
