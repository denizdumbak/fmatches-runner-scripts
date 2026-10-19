// step 143 · inspect (salt okunur) madde 8 cizimi icin: oyuncu profilinin hero ve govde agaci (metinlerle), Key fact / Club entry / Button ozellikleri, directory foto katmani, satir C alti ve Section olculeri

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();

async function tree(n, d, maxD) {
  const o = { n: n.name, t: n.type, wh: Math.round(n.width) + 'x' + Math.round(n.height) };
  if (n.visible === false) o.hidden = true;
  if ('layoutMode' in n && n.layoutMode !== 'NONE') {
    o.lay = n.layoutMode + (n.layoutWrap === 'WRAP' ? '+WRAP' : '') + ' gap ' + n.itemSpacing + ' pad ' + [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].join('/');
  }
  if ('layoutSizingHorizontal' in n) o.size = n.layoutSizingHorizontal + '/' + n.layoutSizingVertical;
  if (n.layoutPositioning === 'ABSOLUTE') o.abs = Math.round(n.x) + ',' + Math.round(n.y);
  if (n.type === 'TEXT') {
    o.text = n.characters.slice(0, 50);
    if (typeof n.textStyleId === 'string' && n.textStyleId) { const s = await figma.getStyleByIdAsync(n.textStyleId); o.style = s ? s.name : '?'; }
    return o;
  }
  if (n.type === 'INSTANCE') {
    const mc = await n.getMainComponentAsync();
    o.comp = mc ? (mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent.name : mc.name) : '?';
    const cp = n.componentProperties, props = {};
    for (const k of Object.keys(cp)) props[k] = cp[k].value;
    o.props = props;
    o.texts = n.findAll(c => c.type === 'TEXT' && c.visible !== false).map(c => c.name + '=' + c.characters.slice(0, 40));
    return o;
  }
  if (n.fills && n.fills !== figma.mixed && n.fills.some(f => f.type === 'IMAGE')) o.image = true;
  if ('children' in n && d < maxD) { o.kids = []; for (const c of n.children) o.kids.push(await tree(c, d + 1, maxD)); }
  return o;
}
const frame = name => p02.findOne(n => n.type === 'FRAME' && n.name === name);
const setOf = name => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === name);
function defs(set) {
  const out = {}, d = set.componentPropertyDefinitions;
  for (const k of Object.keys(d)) out[k] = d[k].type + (d[k].variantOptions ? ' [' + d[k].variantOptions.join(', ') + ']' : ' = ' + d[k].defaultValue);
  return out;
}

await step('desktop frame list', async () => {
  const f = frame('Profiles / Player · Desktop');
  report.info.desktopTop = f.children.map(c => c.name + ' ' + c.type + ' ' + Math.round(c.width) + 'x' + Math.round(c.height));
});

await step('desktop hero', async () => {
  const f = frame('Profiles / Player · Desktop');
  report.info.desktopHero = await tree(f.findOne(n => n.name === 'Hero · player identity'), 0, 5);
});

await step('desktop body', async () => {
  const f = frame('Profiles / Player · Desktop');
  report.info.desktopBody = await tree(f.findOne(n => n.name === 'Profile body'), 0, 4);
});

await step('mobile frame', async () => {
  const f = frame('Profiles / Player · Mobile');
  report.info.mobileTop = f.children.map(c => c.name + ' ' + c.type + ' ' + Math.round(c.width) + 'x' + Math.round(c.height) + (c.layoutPositioning === 'ABSOLUTE' ? ' ABS ' + Math.round(c.x) + ',' + Math.round(c.y) : ''));
  report.info.mobileHero = await tree(f.findOne(n => n.name === 'Hero · player identity'), 0, 6);
  report.info.mobileBody = await tree(f.findOne(n => n.name === 'Profile body'), 0, 2);
});

await step('directory photo', async () => {
  for (const [k, name] of [['dirDesktop', 'Profiles / Player / Directory, no photo · Desktop'], ['dirMobile', 'Profiles / Player / Directory, no photo · Mobile']]) {
    const f = frame(name);
    if (!f) { report.info[k] = 'not found: ' + name; continue; }
    const hero = f.findOne(n => n.name === 'Hero · player identity');
    const out = [];
    for (const n of hero.findAll(c => /photo|silhouette|crest/i.test(c.name) && c.parent && !/INSTANCE/.test(c.parent.type))) {
      out.push(n.name + ' ' + n.type + ' ' + Math.round(n.width) + 'x' + Math.round(n.height) + (n.layoutPositioning === 'ABSOLUTE' ? ' ABS ' + Math.round(n.x) + ',' + Math.round(n.y) : '') + ' in ' + n.parent.name);
    }
    report.info[k] = { h: Math.round(f.height), photoLayers: out, desc: hero.findAll(c => c.type === 'TEXT' && /claims/.test(c.characters)).map(t => t.name + ' in ' + t.parent.name) };
  }
});

await step('component props', async () => {
  const out = {};
  for (const name of ['Key fact', 'Club entry', 'Button', 'Tag', 'Silhouette', 'Club strip', 'Sticky action bar', 'Verification badge', 'Breadcrumb']) {
    const s = setOf(name);
    out[name] = s ? defs(s) : 'not found';
  }
  report.info.props = out;
});

await step('sections and rows', async () => {
  const out = {};
  for (const sec of p02.children.filter(n => n.type === 'SECTION')) {
    out[sec.name] = {
      at: Math.round(sec.x) + ',' + Math.round(sec.y), wh: Math.round(sec.width) + 'x' + Math.round(sec.height),
      kids: sec.children.filter(k => k.y > 2400).map(k => k.name + ' ' + k.type + ' @' + Math.round(k.x) + ',' + Math.round(k.y) + ' ' + Math.round(k.width) + 'x' + Math.round(k.height))
    };
  }
  report.info.sections = out;
});

return report;
