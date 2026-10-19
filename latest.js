// step 133 · inspect (salt okunur): Start here kartlari (sekme 01 ve 02) tam metinleriyle + Foundations frame ust yapisi + yedek font adaylarinin Figmada yuklu stilleri

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const styleName = {};
async function sName(id) {
  if (typeof id !== 'string' || !id) return id === figma.mixed ? 'mixed' : null;
  if (!(id in styleName)) { const s = await figma.getStyleByIdAsync(id); styleName[id] = s ? s.name : '?'; }
  return styleName[id];
}

async function tree(n, d, maxD) {
  const o = { name: n.name, type: n.type, x: Math.round(n.x), y: Math.round(n.y), w: Math.round(n.width), h: Math.round(n.height) };
  if (n.visible === false) o.hidden = true;
  if ('layoutMode' in n && n.layoutMode !== 'NONE') {
    o.layout = n.layoutMode; o.gap = n.itemSpacing;
    o.pad = [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].join('/');
  }
  if (n.type === 'TEXT') {
    o.text = n.characters;
    o.style = await sName(n.textStyleId);
    if (o.style === 'mixed') {
      const segs = n.getStyledTextSegments(['textStyleId']);
      o.segs = [];
      for (const s of segs) o.segs.push((await sName(s.textStyleId)) + ': ' + s.characters.slice(0, 30));
    }
    return o;
  }
  if (n.type === 'INSTANCE') {
    const mc = await n.getMainComponentAsync();
    o.component = mc ? (mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent.name : mc.name) : '?';
    o.variant = n.variantProperties;
    return o;
  }
  if ('children' in n && d < maxD) {
    o.kids = [];
    for (const c of n.children) o.kids.push(await tree(c, d + 1, maxD));
  }
  return o;
}

const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();

function topMatches(page) {
  const hits = page.findAll(n => /start here/i.test(n.name));
  return hits.filter(h => { let p = h.parent; while (p && p.type !== 'PAGE') { if (/start here/i.test(p.name)) return false; p = p.parent; } return true; });
}

await step('start here 01', async () => {
  const hits = topMatches(p01);
  report.info.startHere01 = [];
  for (const h of hits) report.info.startHere01.push(await tree(h, 0, 6));
});

await step('start here 02', async () => {
  const hits = topMatches(p02);
  report.info.startHere02 = [];
  for (const h of hits) {
    const t = await tree(h, 0, 6);
    t.parentName = h.parent ? h.parent.name : null;
    report.info.startHere02.push(t);
  }
});

await step('foundations frame top', async () => {
  const f = p01.findOne(n => n.name === 'Foundations' && n.type === 'FRAME');
  if (!f) { report.info.foundations = 'not found'; return; }
  report.info.foundations = await tree(f, 0, 2);
});

await step('typography styles', async () => {
  const ts = await figma.getLocalTextStylesAsync();
  report.info.textStyles = ts.map(s => s.name + ' | ' + s.fontName.family + ' ' + s.fontName.style + ' ' + s.fontSize + (s.description ? ' | desc: ' + s.description.slice(0, 60) : ''));
});

await step('fallback font candidates', async () => {
  const fonts = await figma.listAvailableFontsAsync();
  const fams = ['Barlow Condensed', 'Roboto Condensed', 'Sofia Sans Condensed', 'Sofia Sans Extra Condensed', 'PT Sans Narrow', 'Fira Sans Condensed', 'Fira Sans Extra Condensed', 'Oswald', 'IBM Plex Sans Condensed', 'Inter'];
  report.info.fonts = {};
  for (const f of fams) {
    const st = fonts.filter(x => x.fontName.family === f).map(x => x.fontName.style);
    report.info.fonts[f] = st.length ? st.join(', ') : 'YOK';
  }
});

return report;
