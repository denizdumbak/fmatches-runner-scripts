// step 194 · SALT OKUNUR inspect: Log in alt Section'inda Flow · wrong password ve Flow · new link oklari, Link expired / Wrong email konumlari

const report = { done: [], errors: [], info: {} };
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync(); await figma.setCurrentPageAsync(p02);
const r = n => Math.round(n);
for (const D of ['Desktop', 'Mobile']) {
  const ps = p02.children.find(n => n.type === 'SECTION' && n.name === (D === 'Desktop' ? 'Web' : 'Mobile'));
  const sub = ps.children.find(n => n.type === 'SECTION' && n.name === 'Log in');
  report.info['section ' + D] = r(sub.x) + ',' + r(sub.y) + ' ' + r(sub.width) + 'x' + r(sub.height);
  report.info['pages ' + D] = sub.children.filter(n => n.type === 'FRAME' || (n.type === 'TEXT')).map(n => n.name + ' @' + r(n.x) + ',' + r(n.y) + ' ' + r(n.width) + 'x' + r(n.height));
  for (const gname of ['Flow · wrong password · ' + D, 'Flow · new link · ' + D]) {
    const g = sub.children.find(n => n.name === gname); if (!g) { report.errors.push('missing ' + gname); continue; }
    const lines = [gname + ' @' + r(g.x) + ',' + r(g.y) + ' ' + r(g.width) + 'x' + r(g.height)];
    for (const c of g.children) {
      let extra = '';
      if (c.type === 'VECTOR') { const vn = c.vectorNetwork; extra = ' pts ' + vn.vertices.map(v => '(' + r(c.x + v.x) + ',' + r(c.y + v.y) + ')').join(' ') + ' stroke ' + c.strokeWeight + ' dash ' + JSON.stringify(c.dashPattern); }
      else if (c.type === 'FRAME' && c.name === 'Label') { const t = c.findOne(n => n.type === 'TEXT'); extra = ' "' + (t ? t.characters : '') + '"'; }
      lines.push('  ' + c.type + ' ' + c.name + ' @' + r(c.x) + ',' + r(c.y) + ' ' + r(c.width) + 'x' + r(c.height) + extra);
    }
    report.info[gname] = lines;
  }
}
return report;
