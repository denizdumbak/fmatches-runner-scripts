// step 275 · read-only inspect before Create/Edit event form: Form field Text/Select/Date, Checkbox, Terms row, Option row, Edit details form page layout, Sign up page frame, Mobile Edit details, Book dialog mobile textarea
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const hexc = c => '#' + [c.r, c.g, c.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
async function line(n) {
  let s = n.type + ' "' + n.name + '" ' + Math.round(n.width) + 'x' + Math.round(n.height) + ' @' + Math.round(n.x) + ',' + Math.round(n.y);
  if ('layoutMode' in n && n.layoutMode !== 'NONE') s += ' ' + n.layoutMode + ' gap' + n.itemSpacing + ' pad' + [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].join('/') + ' ' + (n.primaryAxisSizingMode || '') + '/' + (n.counterAxisSizingMode || '');
  if (n.type === 'TEXT') { let st = 'none'; if (n.textStyleId && n.textStyleId !== figma.mixed) { const x = await figma.getStyleByIdAsync(n.textStyleId); st = x ? x.name : 'none'; } s += ' "' + n.characters.slice(0, 40) + '" style:' + st; }
  if ('fills' in n && n.fills !== figma.mixed && n.fills.length) { const f = n.fills[0]; s += ' fill:' + (f.type === 'SOLID' ? hexc(f.color) + (f.boundVariables && f.boundVariables.color ? '(var)' : '') : f.type); }
  if ('cornerRadius' in n && n.cornerRadius && n.cornerRadius !== figma.mixed) s += ' r' + n.cornerRadius;
  if (n.visible === false) s += ' HIDDEN';
  return s;
}
async function dump(n, d, max, out) { out.push('  '.repeat(d) + await line(n)); if (d < max && 'children' in n) for (const c of n.children) await dump(c, d + 1, max, out); return out; }
const findSet = (p, re) => p.findAll(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name) && !(n.parent && n.parent.type === 'COMPONENT_SET'))[0];
const props = n => { try { return Object.entries(n.componentPropertyDefinitions).map(([k, v]) => k + ':' + v.type + (v.variantOptions ? '[' + v.variantOptions.join('/') + ']' : '')).join(', '); } catch (e) { return 'n/a'; } };

await step('form field variants', async () => {
  const p1 = pageOf(/^01/); await p1.loadAsync();
  const ff = findSet(p1, /^Form field$/);
  for (const t of ['Text', 'Select', 'Date']) { const v = ff.children.find(x => x.name === 'Type=' + t + ', State=Default'); report.info['field' + t] = v ? await dump(v, 0, 3, []) : 'none'; }
  const err = ff.children.find(x => x.name === 'Type=Text, State=Error'); report.info.fieldTextError = err ? await dump(err, 0, 2, []) : 'none';
});

await step('checkbox, terms row, option row', async () => {
  const p1 = pageOf(/^01/);
  const cb = findSet(p1, /^Checkbox$/); report.info.checkbox = cb ? (cb.type === 'COMPONENT_SET' ? cb.children.length + ' variants; ' + props(cb) + ' | ' + cb.children.map(v => v.name).join(' ; ') : 'single') : 'none';
  if (cb) report.info.checkboxTree = await dump(cb.type === 'COMPONENT_SET' ? cb.children[0] : cb, 0, 3, []);
  const tr = findSet(p1, /^Terms row$/); report.info.termsRow = tr ? (tr.type === 'COMPONENT_SET' ? tr.children.map(v => v.name).join(' ; ') : 'single') + ' | props ' + props(tr) : 'none';
  if (tr) report.info.termsRowTree = await dump(tr.type === 'COMPONENT_SET' ? tr.children[0] : tr, 0, 3, []);
  const dp = findSet(p1, /^Date picker$/); report.info.datePicker = dp ? dp.name + ' ' + Math.round(dp.width) + 'x' + Math.round(dp.height) + ' ' + props(dp) : 'none';
  const ol = findSet(p1, /^Option list$/); report.info.optionList = ol ? ol.children.map(v => v.name + ' ' + Math.round(v.width) + 'x' + Math.round(v.height)).join(' | ') : 'none';
});

await step('edit details page', async () => {
  const p = pageOf(/^02/); await p.loadAsync();
  const pg = p.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player / Own profile / Edit details · Desktop');
  report.info.editDetailsTop = await dump(pg, 0, 1, []);
  const form = pg.findOne(n => n.name === 'Details form'); report.info.detailsForm = form ? await dump(form, 0, 3, []).then(a => a.slice(0, 40)) : 'none';
  const mob = p.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player / Own profile / Edit details · Mobile');
  const mf = mob && mob.findOne(n => n.name === 'Details form'); report.info.detailsFormMobile = mf ? await dump(mf, 0, 2, []).then(a => a.slice(0, 24)) : 'none';
});

await step('sign up page frame', async () => {
  const p = pageOf(/^02/);
  const web = p.findOne(n => n.type === 'SECTION' && n.name === 'Web'); const su = web.findOne(n => n.type === 'SECTION' && n.name === 'Sign up');
  const fr = su.children.filter(c => c.type === 'FRAME');
  report.info.signupPages = fr.map(f => f.name + ' ' + Math.round(f.width) + 'x' + Math.round(f.height)).join(' | ');
  const pg = fr.find(f => /Football|Personal|Account/.test(f.name)) || fr[0];
  report.info.signupTree = await dump(pg, 0, 3, []).then(a => a.slice(0, 40));
});

await step('book dialog mobile textarea', async () => {
  const p = pageOf(/^02/);
  const pg = p.findOne(n => n.type === 'FRAME' && n.name === 'Events / Event card / Book tournament · Mobile');
  const d = pg.findOne(n => n.name === 'Book dialog · Request'); const ta = d.findOne(n => n.name === 'Form field · Comment'); const fld = ta.findOne(n => n.name === 'Field'); const val = ta.findOne(n => n.name === 'Value');
  report.info.mobileTextarea = 'dialog ' + Math.round(d.width) + ' textarea ' + Math.round(ta.width) + ' field ' + Math.round(fld.width) + ' value ' + Math.round(val.width) + ' (expect 310 / 310 / 310 / ~278)';
});

return report;
