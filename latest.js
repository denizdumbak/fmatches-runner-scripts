// step 364 · INSPECT (salt okunur): 40 px filtre çipleri (hangi component, komşu çipler kaç px) + mobil Players satırı genişlik/yükseklik nedeni
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const R = n => Math.round(n);
function dump(n, depth, max, out, ind) {
  if (!n || depth > max) return;
  out.push(ind + n.type + ' · ' + n.name + ' [' + R(n.width) + 'x' + R(n.height) + ']' + ('layoutMode' in n && n.layoutMode !== 'NONE' ? ' ' + n.layoutMode + (n.layoutWrap === 'WRAP' ? '/WRAP' : '') + ' g' + n.itemSpacing + ' p' + [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].join('/') : '') + (n.type === 'TEXT' ? ' "' + String(n.characters).slice(0, 24) + '" ' + n.fontSize : '') + (n.visible === false ? ' (gizli)' : ''));
  if ('children' in n) for (const c of n.children.slice(0, 9)) dump(c, depth + 1, max, out, ind + '  ');
}
const scr = (plat, sec, re) => p02.children.find(n => n.type === 'SECTION' && n.name === plat).children.find(n => n.type === 'SECTION' && n.name === sec).children.find(c => c.type === 'FRAME' && re.test(c.name));
await step('chip sets', async () => {
  report.info.chipSets = p01.findAll(n => n.type === 'COMPONENT_SET' && /chip/i.test(n.name)).map(s => s.name + ' · ' + s.children.length + ' varyant · ' + s.children.slice(0, 6).map(k => k.name + ' ' + R(k.width) + 'x' + R(k.height)).join(' | '));
});
for (const [label, plat, sec, re] of [['Web Players', 'Web', 'Search results', /^Search results \/ Players · Desktop|Players · Desktop/], ['Web Clubs', 'Web', 'Search results', /Clubs · Desktop/], ['Mobile Filters', 'Mobile', 'Search results', /Filters · Mobile/]]) {
  await step('chips ' + label, async () => {
    const f = scr(plat, sec, re); if (!f) throw new Error('ekran yok');
    const chips = f.findAll(n => n.type === 'INSTANCE' && /^(Chip|Filter chip)/.test(n.name));
    const groups = {};
    for (const c of chips) { const m = await c.getMainComponentAsync(); const k = (m ? (m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent.name + ' / ' + m.name : m.name) : '?') + ' -> ' + R(c.height) + 'px'; if (!groups[k]) groups[k] = { n: 0, parents: {}, names: [] }; groups[k].n++; groups[k].parents[c.parent.name] = 1; if (groups[k].names.length < 4) groups[k].names.push(c.name); }
    report.info['chips ' + label] = Object.keys(groups).map(k => groups[k].n + 'x ' + k + ' · ' + groups[k].names.join(', ') + ' · in: ' + Object.keys(groups[k].parents).slice(0, 3).join(' / '));
  });
}
await step('mobile player rows', async () => {
  for (const [label, sec, re] of [['Players · Mobile', 'Search results', /Players · Mobile/], ['All results · Mobile', 'Search results', /All results · Mobile/]]) {
    const f = scr('Mobile', sec, re); if (!f) throw new Error(label + ' yok');
    const rows = f.findAll(n => n.type === 'INSTANCE' && /^Player/.test(n.name) && n.height > 100).slice(0, 4);
    const lines = [];
    for (const r of rows) { const m = await r.getMainComponentAsync(); let up = r.parent; const ch = []; while (up && up !== f && ch.length < 3) { ch.push(up.name + ' ' + R(up.width) + ('layoutMode' in up ? ' p' + [up.paddingLeft, up.paddingRight].join('/') : '')); up = up.parent; } lines.push(r.name + ' ' + R(r.width) + 'x' + R(r.height) + ' main=' + (m ? m.name + ' ' + R(m.width) + 'x' + R(m.height) : '?') + ' | ' + ch.join(' < ')); }
    report.info['rows ' + label] = lines;
    if (rows[0]) { const d = []; dump(rows[0], 0, 3, d, ''); report.info['tree ' + label] = d.slice(0, 26); }
  }
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && /^Player result$/.test(n.name));
  const mv = set && set.children.find(k => k.name === 'Device=Mobile, Action=Message, State=Default');
  if (mv) { const d = []; dump(mv, 0, 3, d, ''); report.info.componentMobileTree = d.slice(0, 26); }
});
return report;
