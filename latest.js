// step 130 · Club entry Expanded duzeltme: Achievements satiri ozellige yeniden baglandi (tiklayinca kayboluyordu); "Less" katmaninin adi ayrildi ki "+N" override'i ustune yazmasin

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const r = n => Math.round(n);

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

return report;
