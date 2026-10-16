// step 129 · Club entry: 01'de Achievements ve acici varsayilan olarak acik (Expanded farki gorunsun), ornek iki basari; sette Expanded varyantlarinin yeri raporda

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }
const r = n => Math.round(n);

const p1 = figma.root.children.find(p => /^01/.test(p.name));
await p1.loadAsync();
const set = p1.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Club entry');
const keyOf = re => Object.keys(set.componentPropertyDefinitions).find(k => re.test(k));
const achKey = keyOf(/^Achievements#/), moreKey = keyOf(/^Achievements more#/);

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

await step('report', async () => {
  const sec = set.parent;
  report.info.where = 'page 01 · ' + sec.name + ' · set "Club entry" at ' + r(set.x) + ',' + r(set.y) + ' size ' + r(set.width) + 'x' + r(set.height);
  report.info.variants = set.children.map(c => c.name + ' · ' + r(c.width) + 'x' + r(c.height));
});

// sayfalarda acik olmamasi gereken satirlar kapali mi
await step('check pages', async () => {
  const web = figma.root.children.find(p => /^02/.test(p.name));
  await web.loadAsync();
  let on = 0, off = 0;
  for (const e of web.findAll(n => n.type === 'INSTANCE' && n.name === 'Club entry')) {
    if (e.componentProperties[achKey].value) on++; else off++;
  }
  report.info.pageEntries = 'achievements on: ' + on + ', off: ' + off;
});

return report;
