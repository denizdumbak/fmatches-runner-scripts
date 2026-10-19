// step 139 · About: kapali varyantlarda 4 satir kesme (ENDING, maxLines 4) · Leo About ilk paragrafina bir cumle (4. satir bos satira denk gelmesin) · component aciklamasina developer kurali

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();

const ANCHOR = 'play the final pass.';
const ADD = ' Reads the game early and keeps the ball under pressure.';
async function extend(t) {
  if (!t || t.characters.indexOf(ADD.trim()) !== -1) return false;
  const i = t.characters.indexOf(ANCHOR);
  if (i === -1) return false;
  await loadFonts(t);
  t.insertCharacters(i + ANCHOR.length, ADD, 'BEFORE');
  return true;
}

let set = null;
await step('collapsed truncation', async () => {
  set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'About');
  if (!set) throw new Error('About set missing');
  for (const v of set.children) {
    const t = v.findOne(n => n.name === 'About text' && n.type === 'TEXT');
    if (v.variantProperties.State === 'Collapsed') {
      t.textTruncation = 'ENDING';
      t.maxLines = 4;
    } else {
      t.textTruncation = 'DISABLED';
      t.maxLines = null;
    }
  }
});

await step('leo text', async () => {
  let changed = 0;
  for (const v of set.children) if (await extend(v.findOne(n => n.name === 'About text' && n.type === 'TEXT'))) changed++;
  const inst = p02.findAll(n => n.type === 'INSTANCE' && !!n.findOne(c => c.name === 'About text'));
  for (const i of inst) if (await extend(i.findOne(c => c.name === 'About text' && c.type === 'TEXT'))) changed++;
  report.info.textsExtended = changed;
});

await step('description', async () => {
  const rule = 'Collapsed shows the first 4 lines of the text, the empty line between paragraphs counts as a line (CSS: white-space: pre-line; -webkit-line-clamp: 4). "Show more" appears only when the text is longer than 4 lines.';
  if (set.description.indexOf('line-clamp') === -1) set.description = (set.description ? set.description + ' ' : '') + rule;
});

await step('report', async () => {
  report.info.variants = set.children.map(v => {
    const t = v.findOne(n => n.name === 'About text');
    return v.name + ': text h ' + Math.round(t.height) + ', card h ' + Math.round(v.height) + ', maxLines ' + t.maxLines;
  });
  const inst = p02.findAll(n => n.type === 'INSTANCE' && !!n.findOne(c => c.name === 'About text'));
  report.info.instances = inst.map(i => {
    let top = i; while (top.parent && top.parent.type !== 'SECTION') top = top.parent;
    const t = i.findOne(c => c.name === 'About text');
    return top.name + ' · ' + i.variantProperties.State + ': text h ' + Math.round(t.height) + ', card h ' + Math.round(i.height) + ', maxLines ' + t.maxLines;
  });
});

return report;
