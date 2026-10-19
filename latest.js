// step 137 · Mobil hero sekmeleri 3 slaytta ayni yukseklikte (slayt 3 buton kutusu kisalir) · achievements ilk satir max genisligi sayfadaki gercek satirlardan

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));

const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();

// ---------- 1. Mobile hero tabs aligned ----------
await step('mobile hero tabs', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Hero slide');
  const mob = set.children.filter(c => c.variantProperties && c.variantProperties.Device === 'Mobile');
  const tabY = v => { const t = v.findOne(n => n.name === 'Hero tabs'); return t.absoluteBoundingBox.y - v.absoluteBoundingBox.y; };
  // natural height of Actions = its buttons stacked; target = lowest tabs position any slide needs
  const rows = mob.map(v => {
    const a = v.findOne(n => n.name === 'Actions' && n.type === 'FRAME');
    const btns = a.children.filter(n => n.type === 'INSTANCE' && n.visible);
    const natural = a.layoutMode === 'VERTICAL' ? btns.reduce((s, b) => s + b.height, 0) + a.itemSpacing * Math.max(0, btns.length - 1) : Math.max(...btns.map(b => b.height));
    return { v, a, natural, slack: a.height - natural };
  });
  const target = Math.max(...rows.map(r => tabY(r.v) - r.slack));
  report.info.tabsTarget = Math.round(target);
  report.info.tabs = [];
  for (const r of rows) {
    const h = r.a.height - (tabY(r.v) - target);
    if (h < r.natural - 0.5) throw new Error(r.v.name + ': would squeeze buttons');
    r.a.resize(r.a.width, Math.round(h));
    report.info.tabs.push(r.v.name + ': actions ' + Math.round(r.a.height) + ', tabs y ' + Math.round(tabY(r.v)));
  }
});

// ---------- 2. Achievements max width from real rows on the pages ----------
await step('achievements max width', async () => {
  const setCE = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Club entry');
  const room = { Desktop: Infinity, Mobile: Infinity };
  const seen = { Desktop: 0, Mobile: 0 };
  const inst = p02.findAll(n => n.type === 'INSTANCE' && !!n.findOne(c => c.name === 'Achievements first'));
  for (const i of inst) {
    const dev = i.variantProperties && i.variantProperties.Device;
    if (!dev || !(dev in room)) continue;
    const ach = i.findOne(c => c.name === 'Achievements');
    const icon = ach && ach.findOne(c => c.name === 'Icon');
    const more = ach && ach.findOne(c => c.name === 'More');
    if (!ach || !ach.visible) continue;
    const r = ach.width - (icon ? icon.width : 16) - (more ? more.width : 0) - ach.itemSpacing * 2;
    if (r < room[dev]) room[dev] = r;
    seen[dev]++;
  }
  report.info.rowsMeasured = seen;
  report.info.room = { Desktop: Math.floor(room.Desktop), Mobile: Math.floor(room.Mobile) };
  for (const v of setCE.children) {
    const dev = v.variantProperties.Device;
    if (v.variantProperties.State === 'Expanded' || !isFinite(room[dev])) continue;
    const first = v.findOne(n => n.name === 'Achievements first');
    if (first) first.maxWidth = Math.floor(room[dev]);
  }
  // report how each row now looks
  report.info.rows = inst.filter(i => i.variantProperties && i.variantProperties.State !== 'Expanded').map(i => {
    const ach = i.findOne(c => c.name === 'Achievements');
    if (!ach || !ach.visible) return null;
    const f = i.findOne(c => c.name === 'Achievements first');
    return i.variantProperties.Device + ' · "' + f.characters.slice(0, 30) + '" w ' + Math.round(f.width) + ' / max ' + f.maxWidth;
  }).filter(Boolean);
});

return report;
