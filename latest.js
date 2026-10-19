// step 138 · inspect (salt okunur): About kartinin kapali hali neden 4 satirda kesilmiyor. Component varyantlari + sayfadaki her About instance

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();

async function textInfo(t) {
  if (!t) return null;
  const lh = t.lineHeight === figma.mixed ? 'mixed' : (t.lineHeight.unit === 'AUTO' ? 'AUTO' : t.lineHeight.value + t.lineHeight.unit);
  let style = null;
  if (typeof t.textStyleId === 'string' && t.textStyleId) { const s = await figma.getStyleByIdAsync(t.textStyleId); style = s ? s.name : '?'; }
  else if (t.textStyleId === figma.mixed) style = 'mixed';
  return {
    w: Math.round(t.width), h: Math.round(t.height),
    autoResize: t.textAutoResize, truncation: t.textTruncation, maxLines: t.maxLines,
    sizing: t.layoutSizingHorizontal + '/' + t.layoutSizingVertical,
    maxWidth: t.maxWidth, maxHeight: t.maxHeight,
    lineHeight: lh, style,
    paragraphSpacing: t.paragraphSpacing,
    chars: t.characters.length,
    newlines: (t.characters.match(/\n/g) || []).length,
    start: t.characters.slice(0, 50)
  };
}

await step('component variants', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'About');
  if (!set) throw new Error('About set missing');
  report.info.variants = [];
  for (const v of set.children) {
    const content = v.findOne(n => n.name === 'About content');
    report.info.variants.push({
      name: v.name, w: Math.round(v.width), h: Math.round(v.height),
      content: content ? { w: Math.round(content.width), h: Math.round(content.height), sizing: content.layoutSizingHorizontal + '/' + content.layoutSizingVertical, clip: content.clipsContent } : null,
      text: await textInfo(v.findOne(n => n.name === 'About text' && n.type === 'TEXT'))
    });
  }
});

await step('page instances', async () => {
  const inst = p02.findAll(n => n.type === 'INSTANCE' && !!n.findOne(c => c.name === 'About text'));
  report.info.instances = [];
  for (const i of inst) {
    let top = i; while (top.parent && top.parent.type !== 'SECTION' && top.parent.type !== 'PAGE') top = top.parent;
    const more = i.findOne(c => c.name === 'Show more');
    report.info.instances.push({
      page: top.name, variant: i.variantProperties, visible: i.visible,
      w: Math.round(i.width), h: Math.round(i.height),
      showMoreVisible: more ? more.visible : null,
      text: await textInfo(i.findOne(c => c.name === 'About text' && c.type === 'TEXT'))
    });
  }
});

return report;
