// step 110 · Sayfa duzeni envanteri (salt okunur): sekme 01-02-03 ust seviye ogeler, Section icerikleri, prototip baglantilari. Hicbir sey degismez.

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const r = Math.round;
const line = n => n.type.slice(0, 4) + ' "' + n.name + '" ' + r(n.width) + 'x' + r(n.height) + ' @' + r(n.x) + ',' + r(n.y) + (n.locked ? ' locked' : '') + (n.visible === false ? ' hidden' : '');

for (const p of figma.root.children) {
  await step('page ' + p.name, async () => {
    await p.loadAsync();
    const out = [];
    for (const n of p.children) {
      out.push(line(n));
      if (n.type === 'SECTION') for (const c of n.children) out.push('  ' + line(c));
    }
    report.info[p.name] = out;
    report.info[p.name + ' · flows'] = (p.flowStartingPoints || []).map(f => f.name);
  });
}

await step('prototype links on 02 and 03', async () => {
  const out = [];
  for (const p of figma.root.children.filter(x => /^0[23]/.test(x.name))) {
    const nodes = p.findAll(n => 'reactions' in n && n.reactions && n.reactions.length);
    for (const n of nodes) {
      for (const re of n.reactions) {
        const a = re.actions ? re.actions[0] : re.action;
        if (!a || !a.destinationId) continue;
        const d = await figma.getNodeByIdAsync(a.destinationId);
        let top = n; while (top.parent && top.parent.type !== 'PAGE') top = top.parent;
        out.push(p.name.slice(0, 2) + ' ' + top.name + ' :: ' + n.name + ' -> ' + (d ? d.name : a.destinationId));
      }
    }
  }
  report.info.links = out;
});
return report;
