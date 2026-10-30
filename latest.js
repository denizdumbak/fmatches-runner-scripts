// step 273 · read-only inspect before Book dialog: Confirm dialog, Form field Textarea, scrim and dialog placement on existing dialog pages (Web + Mobile), Key fact hidden rows, effect styles
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const hexc = c => '#' + [c.r, c.g, c.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
async function line(n) {
  let s = n.type + ' "' + n.name + '" ' + Math.round(n.width) + 'x' + Math.round(n.height) + ' @' + Math.round(n.x) + ',' + Math.round(n.y);
  if ('layoutMode' in n && n.layoutMode !== 'NONE') s += ' ' + n.layoutMode + ' gap' + n.itemSpacing + ' pad' + [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].join('/') + ' ' + (n.primaryAxisSizingMode || '') + '/' + (n.counterAxisSizingMode || '');
  if (n.type === 'TEXT') { let st = 'none'; if (n.textStyleId && n.textStyleId !== figma.mixed) { const x = await figma.getStyleByIdAsync(n.textStyleId); st = x ? x.name : 'none'; } s += ' "' + n.characters.slice(0, 40) + '" style:' + st; }
  if ('fills' in n && n.fills !== figma.mixed && n.fills.length) { const f = n.fills[0]; s += ' fill:' + (f.type === 'SOLID' ? hexc(f.color) + (f.boundVariables && f.boundVariables.color ? '(var)' : '') : f.type) + (n.opacity !== 1 ? ' op' + n.opacity : ''); }
  if ('effects' in n && n.effects.length) s += ' fx' + n.effects.length + (n.effectStyleId ? '(style)' : '');
  if ('cornerRadius' in n && n.cornerRadius && n.cornerRadius !== figma.mixed) s += ' r' + n.cornerRadius;
  if ('strokes' in n && n.strokes.length) s += ' stroke' + (n.strokeWeight !== figma.mixed ? n.strokeWeight : 'm');
  if (n.visible === false) s += ' HIDDEN';
  return s;
}
async function dump(n, d, max, out) { out.push('  '.repeat(d) + await line(n)); if (d < max && 'children' in n) for (const c of n.children) await dump(c, d + 1, max, out); return out; }
const findSet = (p, re) => p.findAll(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name) && !(n.parent && n.parent.type === 'COMPONENT_SET'))[0];

await step('confirm dialog', async () => {
  const p1 = pageOf(/^01/); await p1.loadAsync();
  const cd = findSet(p1, /^Confirm dialog$/);
  report.info.confirmVariants = cd.children.map(v => v.name + ' ' + Math.round(v.width) + 'x' + Math.round(v.height)).join(' | ');
  report.info.confirmDesktop = await dump(cd.children.find(v => /Block person/.test(v.name) && /Desktop/.test(v.name)), 0, 3, []);
  report.info.confirmMobile = await dump(cd.children.find(v => /Block person/.test(v.name) && /Mobile/.test(v.name)), 0, 3, []);
});

await step('form field textarea', async () => {
  const p1 = pageOf(/^01/);
  const ff = findSet(p1, /^Form field$/);
  const v = ff.children.find(x => /Type=Textarea, State=Default/.test(x.name));
  report.info.textareaName = v.name;
  report.info.textarea = await dump(v, 0, 3, []);
  const f2 = ff.children.find(x => /Type=Textarea, State=Filled/.test(x.name)); report.info.textareaFilled = await dump(f2, 0, 3, []);
});

await step('dialog pages', async () => {
  const p = pageOf(/^02/); await p.loadAsync();
  const names = ['Messenger / Delete message · Desktop', 'Messenger / Delete message · Mobile'];
  const out = {};
  for (const nm of names) {
    const f = p.findOne(n => n.type === 'FRAME' && n.name === nm);
    out[nm] = f ? await dump(f, 0, 1, []) : 'NOT FOUND';
  }
  report.info.dialogPages = out;
  report.info.messengerPageNames = p.findAll(n => n.type === 'FRAME' && /^Messenger \//.test(n.name)).map(n => n.name + ' ' + Math.round(n.width) + 'x' + Math.round(n.height)).join(' | ');
});

await step('key fact hidden rows on mobile card', async () => {
  const p = pageOf(/^02/);
  const pg = p.findOne(n => n.type === 'FRAME' && n.name === 'Events / Event card · Mobile');
  const k = pg.findOne(n => n.name === 'Fact · Location');
  report.info.mobileFact = await dump(k, 0, 3, []);
  report.info.keyFactsFrame = await dump(pg.findOne(n => n.name === 'Key facts'), 0, 1, []);
});

await step('effects', async () => {
  report.info.effectStyles = (await figma.getLocalEffectStylesAsync()).map(s => s.name).join(' | ');
  const p = pageOf(/^02/);
  const pg = p.findOne(n => n.type === 'FRAME' && n.name === 'Events / Event card / Manager · Desktop');
  report.info.managerCardTop = await dump(pg, 0, 1, []);
});

return report;
