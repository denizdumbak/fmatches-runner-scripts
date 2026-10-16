// step 130 · Club entry (129 + 130 birlesik): Expanded'da Achievements satiri ozellige yeniden baglandi (tiklayinca kayboluyordu), "Less" katmani ayrildi; 01'de Achievements ve acici varsayilan acik, ornek iki basari

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const r = n => Math.round(n);
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }

const p1 = figma.root.children.find(p => /^01/.test(p.name));
await p1.loadAsync();
const set = p1.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Club entry');
const keyOf = re => Object.keys(set.componentPropertyDefinitions).find(k => re.test(k));
const achKey = keyOf(/^Achievements#/), moreKey = keyOf(/^Achievements more#/);

await step('before', async () => {
  report.info.before = set.children.map(c => {
    const row = c.findOne(n => n.name === 'Achievements'), more = c.findOne(n => n.name === 'More');
    return c.name + ' · row ' + (row.visible ? 'on' : 'OFF') + ' ' + JSON.stringify(row.componentPropertyReferences || {}) + ' · more ' + (more.visible ? 'on' : 'OFF') + ' ' + JSON.stringify(more.componentPropertyReferences || {});
  });
});

await step('rebind Expanded', async () => {
  for (const c of set.children) {
    if (c.variantProperties.State !== 'Expanded') continue;
    const row = c.findOne(n => n.name === 'Achievements');
    row.visible = true;
    row.componentPropertyReferences = { visible: achKey };
    const more = c.findOne(n => n.name === 'More');
    more.visible = true;
    more.componentPropertyReferences = { visible: moreKey };
    const lbl = more.findOne(n => n.name === 'Count');
    if (lbl) lbl.name = 'Less label';
  }
  // Default ve Hover da bagli olsun (emin olmak icin)
  for (const c of set.children) {
    if (c.variantProperties.State === 'Expanded') continue;
    c.findOne(n => n.name === 'Achievements').componentPropertyReferences = { visible: achKey };
    c.findOne(n => n.name === 'More').componentPropertyReferences = { visible: moreKey };
  }
});

await step('after', async () => {
  report.info.after = set.children.map(c => {
    const row = c.findOne(n => n.name === 'Achievements'), more = c.findOne(n => n.name === 'More');
    const t = more.findOne(n => n.type === 'TEXT');
    return c.name + ' · row ' + JSON.stringify(row.componentPropertyReferences || {}) + ' · more ' + JSON.stringify(more.componentPropertyReferences || {}) + ' · "' + t.characters + '" (' + t.name + ') · ' + r(c.height);
  });
});

// ---------- 129: 01'de varsayilan acik, ornek metin ----------
await step('defaults on', async () => {
  set.editComponentProperty(achKey, { defaultValue: true });
  set.editComponentProperty(moreKey, { defaultValue: true });
});
await step('sample text in variants', async () => {
  for (const c of set.children) {
    const t = c.findOne(n => n.name === 'Achievements text');
    await loadFonts(t);
    t.characters = 'U19 league champions 2022/23\nClub young player of the year 2023';
  }
});
await step('where and pages', async () => {
  report.info.where = 'page 01 · ' + set.parent.name + ' · set "Club entry" at ' + r(set.x) + ',' + r(set.y) + ' size ' + r(set.width) + 'x' + r(set.height);
  const web = figma.root.children.find(p => /^02/.test(p.name));
  await web.loadAsync();
  let on = 0, off = 0;
  for (const e of web.findAll(n => n.type === 'INSTANCE' && n.name === 'Club entry')) { if (e.componentProperties[achKey].value) on++; else off++; }
  report.info.pageEntries = 'achievements on: ' + on + ', off: ' + off;
});

return report;
