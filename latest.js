// step 140 · Leo About ilk paragrafi bir cumle daha uzar: kapali halde 4. satir dolu, kesme cumle ortasina duser ("season.…" gorunmez)

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();

const ANCHOR = 'in the 2023/24 season.';
const ADD = ' Has played every central and right-sided role, usually as the link between midfield and attack.';
async function extend(t) {
  if (!t || t.characters.indexOf(ADD.trim()) !== -1) return false;
  const i = t.characters.indexOf(ANCHOR);
  if (i === -1) return false;
  await loadFonts(t);
  t.insertCharacters(i + ANCHOR.length, ADD, 'BEFORE');
  return true;
}

await step('extend', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'About');
  let changed = 0;
  for (const v of set.children) if (await extend(v.findOne(n => n.name === 'About text' && n.type === 'TEXT'))) changed++;
  const inst = p02.findAll(n => n.type === 'INSTANCE' && !!n.findOne(c => c.name === 'About text'));
  for (const i of inst) if (await extend(i.findOne(c => c.name === 'About text' && c.type === 'TEXT'))) changed++;
  report.info.textsExtended = changed;
  report.info.heights = set.children.map(v => v.name + ': text h ' + Math.round(v.findOne(n => n.name === 'About text').height));
});

return report;
