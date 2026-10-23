// step 191 · SALT OKUNUR inspect: Log in alt Section'i, Wrong password sayfasi (alanlar, hata mesaji, oklar)

const report = { done: [], errors: [], info: {} };
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync(); await figma.setCurrentPageAsync(p02);
const r = n => Math.round(n);
const hex = p => p && p.color ? '#' + [p.color.r, p.color.g, p.color.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('') : '-';
for (const P_ of ['Web', 'Mobile']) {
  const ps = p02.children.find(n => n.type === 'SECTION' && n.name === P_);
  const sub = ps && ps.children.find(n => n.type === 'SECTION' && n.name === 'Log in'); if (!sub) { report.errors.push('no Log in section in ' + P_); continue; }
  report.info['pages ' + P_] = sub.children.map(n => n.type[0] + ' ' + n.name + ' @' + r(n.x) + ',' + r(n.y) + ' ' + r(n.width) + 'x' + r(n.height));
  const wp = sub.children.find(n => n.type === 'FRAME' && /wrong/i.test(n.name));
  if (!wp) { report.errors.push('no wrong-password page in ' + P_); continue; }
  const lines = [];
  (function walk(n, d) {
    if (d > 7) return;
    let extra = '';
    if (n.type === 'TEXT') extra = ' "' + n.characters.slice(0, 60) + '"';
    else if (n.type === 'INSTANCE') extra = ' [' + Object.keys(n.componentProperties).map(k => k.split('#')[0] + '=' + n.componentProperties[k].value).join(', ') + ']';
    if (n.type === 'COMPONENT' || n.type === 'INSTANCE') {} 
    lines.push('  '.repeat(d) + n.type[0] + ' ' + n.name + extra + (n.visible === false ? ' (hidden)' : '') + ' ' + r(n.width) + 'x' + r(n.height));
    if ('children' in n && n.type !== 'INSTANCE' || (n.type === 'INSTANCE' && d < 4)) for (const c of n.children) walk(c, d + 1);
  })(wp, 0);
  report.info['tree ' + P_] = lines.slice(0, 70);
}
const fs = p02.findOne(n => false);
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const ff = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Form field');
report.info.formFieldProps = ff ? Object.keys(ff.componentPropertyDefinitions).join(', ') : 'missing';
const err = ff && ff.children.find(v => v.variantProperties.Type === 'Text' && v.variantProperties.State === 'Error');
report.info.errorVariant = err ? err.children.map(c => c.name + ' ' + r(c.width) + 'x' + r(c.height) + (c.visible === false ? ' hidden' : '')) : 'missing';
return report;
