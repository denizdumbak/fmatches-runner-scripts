// step 408 · INSPECT (salt okunur), Faz 8 hazirligi: diyalog ve bildirim component'leri, Switch, Checkbox, Setting row, metin stilleri, 01 Section'lari, 02 Web/Mobile Section sirasi, My settings ekrani
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const sz = n => R(n.width) + 'x' + R(n.height);
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const lay = n => n.layoutMode && n.layoutMode !== 'NONE' ? ' ' + n.layoutMode[0] + ' gap' + R(n.itemSpacing) + ' pad' + [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].map(R).join('/') : '';
const fillInfo = n => { try { const f = (n.fills || [])[0]; if (!f) return ''; if (f.boundVariables && f.boundVariables.color) return ' fill=var'; return ' fill=' + f.type; } catch (e) { return ''; } };
function tree(root, depth, max) {
  const out = [];
  (function walk(n, d) {
    if (out.length >= max) return;
    let s = '  '.repeat(d) + n.name + ' [' + n.type.toLowerCase() + ' ' + sz(n) + lay(n) + fillInfo(n) + ']';
    if (n.type === 'TEXT') s += ' "' + n.characters.slice(0, 50) + '" ' + (n.textStyleId ? 'styled' : 'NOSTYLE');
    out.push(s);
    if (d < depth && 'children' in n && n.type !== 'INSTANCE') for (const c of n.children) walk(c, d + 1);
  })(root, 0);
  return out;
}
const findComp = nm => p01.findOne(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && n.name === nm);

await step('01 Section listesi', async () => {
  report.info.sections01 = p01.children.filter(n => n.type === 'SECTION').sort((a, b) => a.x - b.x).map(s => s.name + ' @' + R(s.x) + ',' + R(s.y) + ' ' + sz(s));
});
await step('Component yapilari', async () => {
  for (const nm of ['Log out dialog', 'Confirm dialog', 'Book dialog', 'Page notice', 'Empty card', 'Setting row', 'Switch', 'Checkbox', 'Button']) {
    const c = findComp(nm);
    if (!c) { report.info['comp · ' + nm] = 'YOK'; continue; }
    const vars = c.type === 'COMPONENT_SET' ? c.children : [c];
    const info = { section: c.parent ? c.parent.name : '-', variants: vars.map(v => v.name + ' ' + sz(v)).slice(0, 12) };
    if (c.type === 'COMPONENT_SET') info.props = Object.keys(c.componentPropertyDefinitions);
    if (!/^(Button|Switch|Checkbox)$/.test(nm)) info.tree = tree(vars[0], 4, 30);
    report.info['comp · ' + nm] = info;
  }
});
await step('Metin stilleri ve efektler', async () => {
  report.info.textStyles = (await figma.getLocalTextStylesAsync()).map(s => s.name);
  report.info.effectStyles = (await figma.getLocalEffectStylesAsync()).map(s => s.name);
});
await step('02 Section sirasi', async () => {
  for (const nm of ['Web', 'Mobile']) {
    const p = p02.children.find(n => n.type === 'SECTION' && n.name === nm);
    report.info['sec02 · ' + nm] = p ? (sz(p) + ' @' + R(p.x) + ' :: ' + p.children.filter(n => n.type === 'SECTION').sort((a, b) => a.y - b.y).map(s => s.name + ' y' + R(s.y) + ' ' + sz(s) + ' (' + s.children.length + ')').join(' | ')) : 'YOK';
  }
});
await step('My settings ekrani', async () => {
  for (const nm of ['Web', 'Mobile']) {
    const p = p02.children.find(n => n.type === 'SECTION' && n.name === nm);
    const s = p && p.children.find(n => n.type === 'SECTION' && n.name === 'My settings');
    if (!s) { report.info['settings · ' + nm] = 'Section yok'; continue; }
    const f = s.children.find(n => n.type === 'FRAME' && !/No blocked/.test(n.name));
    report.info['settings · ' + nm] = { screens: s.children.map(c => c.name + ' @' + R(c.x) + ',' + R(c.y) + ' ' + sz(c)), tree: f ? tree(f, 6, 70) : 'frame yok' };
  }
});
await step('Dialog iceren ornek ekran', async () => {
  const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
  const scr = web.findOne(n => n.type === 'FRAME' && /Block person · Desktop$/.test(n.name)) || web.findOne(n => n.type === 'FRAME' && /Book tournament · Desktop$/.test(n.name));
  report.info.dialogScreen = scr ? { name: scr.name, parent: scr.parent.name, top: tree(scr, 1, 20) } : 'yok';
});
return report;
