// step 149 · inspect (salt okunur) madde 8 kalanlari icin: Club entry seti (kurum varyanti), rol sayfalarinin kariyer satirlari, directory ile oyuncu sayfasi farki, Manager sayfasi agaci, alt Section olculeri, giris oku ve Start here karti

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
const R = v => Math.round(v);
const abs = n => n.absoluteBoundingBox;

async function tree(n, d, maxD) {
  const o = { n: n.name, t: n.type, wh: R(n.width) + 'x' + R(n.height) };
  if (n.visible === false) o.hidden = true;
  if ('layoutMode' in n && n.layoutMode !== 'NONE') o.lay = n.layoutMode + (n.layoutWrap === 'WRAP' ? '+WRAP' : '') + ' gap ' + n.itemSpacing + ' pad ' + [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].join('/') + ' cross ' + n.counterAxisAlignItems;
  if ('layoutSizingHorizontal' in n) o.size = n.layoutSizingHorizontal + '/' + n.layoutSizingVertical;
  if (n.layoutPositioning === 'ABSOLUTE') o.abs = R(n.x) + ',' + R(n.y);
  if (n.componentPropertyReferences && Object.keys(n.componentPropertyReferences).length) o.refs = n.componentPropertyReferences;
  if (n.type === 'TEXT') {
    o.text = n.characters.slice(0, 50);
    if (typeof n.textStyleId === 'string' && n.textStyleId) { const s = await figma.getStyleByIdAsync(n.textStyleId); o.style = s ? s.name : '?'; }
    return o;
  }
  if (n.type === 'INSTANCE') {
    const mc = await n.getMainComponentAsync();
    o.comp = mc ? (mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent.name + ' › ' + mc.name : mc.name) : '?';
    const cp = n.componentProperties, props = {};
    for (const k of Object.keys(cp)) props[k] = cp[k].value;
    o.props = props;
    if (d >= maxD) { o.texts = n.findAll(c => c.type === 'TEXT' && c.visible !== false).map(c => c.name + '=' + c.characters.slice(0, 40)); return o; }
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

await step('club entry set', async () => {
  const s = setOf('Club entry');
  report.info.clubEntry = {
    at: s.parent.name + ' @' + R(s.x) + ',' + R(s.y) + ' ' + R(s.width) + 'x' + R(s.height),
    lay: s.layoutMode + ' gap ' + s.itemSpacing,
    defs: defs(s),
    variants: s.children.map(c => c.name + ' ' + R(c.width) + 'x' + R(c.height)),
    desc: s.description.slice(0, 300)
  };
  const v = s.children.find(c => /Device=Desktop/.test(c.name) && /State=Default/.test(c.name));
  report.info.clubEntryDesktopDefault = await tree(v, 0, 4);
  const m = s.children.find(c => /Device=Mobile/.test(c.name) && /State=Default/.test(c.name));
  report.info.clubEntryMobileDefault = await tree(m, 0, 3);
});

await step('club strip organization icon', async () => {
  const s = setOf('Club strip');
  const v = s.children.find(c => /Kind=Organization/.test(c.name) && /Device=Desktop/.test(c.name));
  const ic = v.findOne(n => n.name === 'Organization icon');
  report.info.orgIcon = ic ? await tree(ic, 0, 3) : 'not found';
});

await step('role career rows', async () => {
  const out = {};
  for (const role of ['Manager', 'Intermediary', 'Referee']) for (const dev of ['Desktop', 'Mobile']) {
    const f = frame('Profiles / ' + role + ' · ' + dev);
    if (!f) { out[role + ' ' + dev] = 'not found'; continue; }
    const list = f.findOne(n => n.name === 'Club entries');
    out[role + ' ' + dev] = list ? await Promise.all(list.children.map(async e => {
      const crest = e.findOne(n => n.name === 'Club crest');
      return { n: e.name, w: R(e.width), props: Object.fromEntries(Object.keys(e.componentProperties).map(k => [k, e.componentProperties[k].value])), crest: crest ? (crest.visible ? 'visible' : 'hidden') : 'none', texts: e.findAll(c => c.type === 'TEXT' && c.visible !== false).map(c => c.name + '=' + c.characters.slice(0, 30)) };
    })) : 'no Club entries';
  }
  report.info.roleCareer = out;
});

await step('directory vs player', async () => {
  const out = {};
  for (const dev of ['Desktop', 'Mobile']) {
    const p = frame('Profiles / Player · ' + dev), d = frame('Profiles / Player / Directory, no photo · ' + dev);
    const sig = f => f.findAll(n => (n.type === 'FRAME' || n.type === 'INSTANCE') && n.visible !== false && !(n.parent && n.parent.type === 'INSTANCE')).map(n => n.name);
    const ps = new Set(sig(p)), ds = new Set(sig(d));
    out[dev] = {
      onlyPlayer: [...ps].filter(x => !ds.has(x)),
      onlyDirectory: [...ds].filter(x => !ps.has(x)),
      dirH: R(d.height), playerH: R(p.height)
    };
    const hero = d.findOne(n => n.name === 'Hero · player identity');
    out[dev].dirHero = await tree(hero, 0, dev === 'Desktop' ? 2 : 3);
    const bar = d.children.find(c => c.type === 'INSTANCE' && /Sticky action bar/.test(c.name));
    if (bar) out[dev].dirBar = await tree(bar, 0, 0);
    const body = d.findOne(n => n.name === 'Profile body');
    out[dev].dirBody = await tree(body, 0, 2);
  }
  report.info.directory = out;
});

await step('manager pages', async () => {
  for (const dev of ['Desktop', 'Mobile']) {
    const f = frame('Profiles / Manager · ' + dev);
    report.info['manager' + dev] = { top: f.children.map(c => c.name + ' ' + c.type + ' ' + R(c.width) + 'x' + R(c.height) + (c.layoutPositioning === 'ABSOLUTE' ? ' ABS ' + R(c.x) + ',' + R(c.y) : '')), hero: await tree(f.findOne(n => n.name === 'Hero · player identity'), 0, dev === 'Desktop' ? 2 : 3) };
  }
});

await step('sub sections', async () => {
  const out = {};
  for (const sec of p02.children.filter(n => n.type === 'SECTION')) {
    const S = abs(sec);
    out[sec.name] = { at: R(sec.x) + ',' + R(sec.y), wh: R(sec.width) + 'x' + R(sec.height), subs: {}, loose: [] };
    for (const k of sec.children) {
      if (k.type === 'SECTION' && /^Profiles/.test(k.name)) {
        out[sec.name].subs[k.name] = { at: R(k.x) + ',' + R(k.y), wh: R(k.width) + 'x' + R(k.height), kids: k.children.map(c => c.name + ' ' + c.type + ' @' + R(c.x) + ',' + R(c.y) + ' ' + R(c.width) + 'x' + R(c.height)) };
      } else if (k.type === 'SECTION') {
        out[sec.name].subs[k.name] = { at: R(k.x) + ',' + R(k.y), wh: R(k.width) + 'x' + R(k.height) };
      } else out[sec.name].loose.push(k.name + ' ' + k.type + ' @' + R(k.x) + ',' + R(k.y) + ' ' + R(k.width) + 'x' + R(k.height));
    }
  }
  report.info.sections = out;
});

await step('entry arrow from player search', async () => {
  const out = [];
  for (const g of p02.findAll(n => /^Flow · From player search/.test(n.name))) {
    out.push({ parent: g.parent.name, at: R(g.x) + ',' + R(g.y), wh: R(g.width) + 'x' + R(g.height), tree: await tree(g, 0, 3) });
  }
  report.info.entryArrows = out;
});

await step('start here player card', async () => {
  const cards = p02.findAll(n => n.type === 'FRAME' && /Start here/i.test(n.name));
  report.info.startHere = await Promise.all(cards.map(async c => ({ n: c.name, parent: c.parent.name, at: R(c.x) + ',' + R(c.y), wh: R(c.width) + 'x' + R(c.height), tree: await tree(c, 0, 3) })));
});

return report;
