// step 246 · INSPECT (salt okunur): 02 · Website yerlesimi, Web ve Mobile alt Section'lari, sayfa satirlari ve ok gruplari (duzenleme plani icin)
const report = { info: {} };
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const R = n => Math.round(n);
report.info.topLevel = p02.children.map(s => s.type + ' "' + s.name + '" @' + R(s.x) + ',' + R(s.y) + ' ' + R(s.width) + 'x' + R(s.height)).join(' | ');
function describe(sec) {
  const kids = sec.children;
  const frames = kids.filter(k => k.type === 'FRAME'), groups = kids.filter(k => k.type === 'GROUP'), other = kids.filter(k => k.type !== 'FRAME' && k.type !== 'GROUP');
  const rows = {};
  for (const f of frames) { const key = R(f.y / 50) * 50; (rows[key] = rows[key] || []).push(f); }
  const rowTxt = Object.keys(rows).map(Number).sort((a, b) => a - b).map(k => { const r = rows[k]; const xs = r.map(f => f.x), xe = r.map(f => f.x + f.width); return 'y~' + k + ': ' + r.length + ' pages x ' + R(Math.min.apply(null, xs)) + '..' + R(Math.max.apply(null, xe)) + ' h ' + R(Math.max.apply(null, r.map(f => f.height))); });
  const flowGroups = groups.filter(g => /^Flow/.test(g.name)).length;
  const otherTxt = other.map(o => o.type + ':' + o.name + '@' + R(o.x) + ',' + R(o.y) + ' ' + R(o.width) + 'x' + R(o.height));
  const pageW = {}; for (const f of frames) pageW[R(f.width)] = (pageW[R(f.width)] || 0) + 1;
  return { pos: '@' + R(sec.x) + ',' + R(sec.y) + ' ' + R(sec.width) + 'x' + R(sec.height), frames: frames.length, groups: groups.length, flowGroups: flowGroups, otherCount: other.length, pageWidths: JSON.stringify(pageW), rows: rowTxt, subsections: kids.filter(k => k.type === 'SECTION').length, other: otherTxt.slice(0, 6) };
}
for (const plat of ['Web', 'Mobile']) {
  const p = p02.children.find(n => n.type === 'SECTION' && new RegExp('^' + plat).test(n.name));
  if (!p) { report.info[plat] = 'MISSING'; continue; }
  const subs = p.children.filter(n => n.type === 'SECTION').sort((a, b) => a.y - b.y || a.x - b.x);
  const out = { platform: '@' + R(p.x) + ',' + R(p.y) + ' ' + R(p.width) + 'x' + R(p.height), directChildren: p.children.map(c => c.type + ':' + c.name).join(' | ').slice(0, 900), sections: {} };
  for (const s of subs) out.sections[s.name] = describe(s);
  report.info[plat] = out;
}
const web = p02.children.find(n => n.type === 'SECTION' && /^Web/.test(n.name));
if (web) {
  const subs = web.children.filter(n => n.type === 'SECTION').sort((a, b) => a.y - b.y);
  report.info.webOrder = subs.map((s, i) => s.name + ' y ' + R(s.y) + '..' + R(s.y + s.height) + ' x ' + R(s.x) + '..' + R(s.x + s.width) + (i ? ' gapAbove ' + R(s.y - (subs[i - 1].y + subs[i - 1].height)) : '')).join(' | ');
  let r = 0, b = 0; for (const s of web.children) { r = Math.max(r, s.x + s.width); b = Math.max(b, s.y + s.height); }
  report.info.webContent = 'content right ' + R(r) + ' bottom ' + R(b) + ' · web ' + R(web.width) + 'x' + R(web.height);
}
return report;
