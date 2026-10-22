// step 186 · read-only inspect: Own profile sayfasi (hero, kartlar), Verification badge, Empty card, Silhouette kullanimi, banner benzeri component var mi
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
const r = n => Math.round(n);
const L = [];
function line(n, d) {
  let s = '  '.repeat(d) + n.type + ' "' + n.name + '" ' + r(n.width) + 'x' + r(n.height);
  if (n.type === 'INSTANCE') { try { s += ' [' + Object.keys(n.componentProperties).map(k => k.split('#')[0] + '=' + n.componentProperties[k].value).join(', ') + ']'; } catch (e) {} }
  if (n.type === 'TEXT') s += ' "' + n.characters.slice(0, 50).replace(/\n/g, ' / ') + '"';
  if ('visible' in n && !n.visible) s += ' (hidden)';
  return s;
}
function dump(n, d, max) { L.push(line(n, d)); if (d < max && 'children' in n && n.type !== 'INSTANCE') for (const c of n.children) dump(c, d + 1, max); }

await step('component sets on 01', async () => {
  report.info.sets = p01.findAll(n => n.type === 'COMPONENT_SET').map(n => n.name + ' (' + n.children.length + ')');
});
await step('Verification badge + Empty card', async () => {
  for (const nm of ['Verification badge', 'Empty card', 'Edit button']) {
    const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === nm);
    if (!set) { report.info[nm] = 'missing'; continue; }
    report.info[nm] = { variants: set.children.map(v => v.name), props: Object.keys(set.componentPropertyDefinitions), texts: set.children[0].findAll(n => n.type === 'TEXT').map(t => t.name + '=' + t.characters.slice(0, 60)), size: r(set.children[0].width) + 'x' + r(set.children[0].height) };
  }
});
await step('Empty card usage on 02', async () => {
  const rows = [];
  for (const i of p02.findAll(n => n.type === 'INSTANCE')) {
    const m = await i.getMainComponentAsync(); if (m && m.parent && m.parent.type === 'COMPONENT_SET' && m.parent.name === 'Empty card') {
      let top = i; while (top.parent && top.parent.type !== 'SECTION' && top.parent.type !== 'PAGE') top = top.parent;
      rows.push(m.name + ' in ' + top.name + ' > ' + (i.parent ? i.parent.name : '?'));
    }
  }
  report.info.emptyUsage = rows.slice(0, 20);
});
await step('Own profile desktop', async () => {
  const f = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player / Own profile · Desktop'); if (!f) throw new Error('missing');
  dump(f, 0, 4); report.info.ownDesktop = L.splice(0, L.length);
});
await step('Own profile mobile', async () => {
  const f = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player / Own profile · Mobile'); if (!f) throw new Error('missing');
  dump(f, 0, 3); report.info.ownMobile = L.splice(0, L.length);
});
await step('Directory (no photo) page, Silhouette use', async () => {
  const f = p02.findOne(n => n.type === 'FRAME' && /Directory, no photo/.test(n.name) && /Desktop/.test(n.name) && /Player/.test(n.name)); if (!f) { report.info.directory = 'missing'; return; }
  const hero = f.findOne(n => /^Hero/.test(n.name)); if (hero) { dump(hero, 0, 3); report.info.directoryHero = L.splice(0, L.length); }
});
await step('Header badges and tags', async () => {
  const hdr = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Header');
  if (hdr) report.info.headerVariants = hdr.children.map(v => v.name + ' ' + r(v.width) + 'x' + r(v.height));
  const tag = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Tag'); if (tag) report.info.tagVariants = tag.children.map(v => v.name);
});
return report;
