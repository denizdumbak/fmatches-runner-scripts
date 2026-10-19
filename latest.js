// step 153 · inspect (salt okunur): form parcalari icin referanslar · Header arama alani, Log out dialog, Filter chip, Account menu, Button, Positions sahasi, stiller

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();

const allVars = await figma.variables.getLocalVariablesAsync();
const varName = {}; for (const v of allVars) varName[v.id] = v.name;
const styleName = {};
for (const s of await figma.getLocalTextStylesAsync()) styleName[s.id] = s.name;
for (const s of await figma.getLocalEffectStylesAsync()) styleName[s.id] = s.name;

function paintInfo(paints, bound) {
  if (!paints || paints === figma.mixed || !paints.length) return '';
  return paints.filter(p => p.visible !== false).map(p => {
    if (p.boundVariables && p.boundVariables.color) return varName[p.boundVariables.color.id] || 'var?';
    if (p.type === 'SOLID') { const c = p.color; return '#' + [c.r, c.g, c.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('') + (p.opacity !== undefined && p.opacity < 1 ? '@' + p.opacity.toFixed(2) : ''); }
    return p.type;
  }).join('+');
}
function boundNum(n, key) { const b = n.boundVariables && n.boundVariables[key]; return b ? varName[b.id] : null; }

function line(n, depth) {
  const r = [];
  r.push('  '.repeat(depth) + n.type.slice(0, 4) + ' "' + n.name + '"');
  r.push(Math.round(n.width) + 'x' + Math.round(n.height));
  if (n.visible === false) r.push('HIDDEN');
  if (n.layoutPositioning === 'ABSOLUTE') r.push('ABS');
  if (n.layoutMode && n.layoutMode !== 'NONE') {
    r.push(n.layoutMode[0] + (n.layoutWrap === 'WRAP' ? 'W' : '') + ' gap ' + n.itemSpacing + (boundNum(n, 'itemSpacing') ? '(' + boundNum(n, 'itemSpacing') + ')' : ''));
    r.push('pad ' + [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].join('/'));
    r.push('align ' + n.primaryAxisAlignItems + '/' + n.counterAxisAlignItems);
  }
  if ('layoutSizingHorizontal' in n) r.push('size ' + n.layoutSizingHorizontal[0] + '/' + n.layoutSizingVertical[0]);
  if ('cornerRadius' in n && n.cornerRadius !== 0) r.push('r ' + (n.cornerRadius === figma.mixed ? 'mixed' : n.cornerRadius) + (boundNum(n, 'topLeftRadius') ? '(' + boundNum(n, 'topLeftRadius') + ')' : ''));
  const f = paintInfo(n.fills); if (f) r.push('fill ' + f);
  const s = paintInfo(n.strokes); if (s) r.push('stroke ' + s + ' ' + (n.strokeWeight === figma.mixed ? 'mixed' : n.strokeWeight) + (n.strokeAlign ? n.strokeAlign[0] : ''));
  if (n.effectStyleId) r.push('fx ' + (styleName[n.effectStyleId] || '?'));
  if (n.type === 'TEXT') {
    r.push('ts ' + (n.textStyleId === figma.mixed ? 'mixed' : (styleName[n.textStyleId] || 'NONE')));
    r.push('"' + n.characters.slice(0, 40).replace(/\n/g, '⏎') + '"');
  }
  if (n.type === 'INSTANCE' && n.componentProperties) {
    r.push('props {' + Object.entries(n.componentProperties).map(([k, v]) => k.replace(/#.*/, '') + '=' + v.value).join(', ') + '}');
  }
  if (n.reactions && n.reactions.length) r.push('reactions ' + n.reactions.length);
  return r.join(' · ');
}
function tree(n, depth, maxDepth, intoInstances, out) {
  out.push(line(n, depth));
  if (depth >= maxDepth || !('children' in n)) return;
  if (n.type === 'INSTANCE' && !intoInstances) return;
  for (const c of n.children) tree(c, depth + 1, maxDepth, intoInstances, out);
}
const dump = (n, maxDepth, intoInstances) => { const out = []; tree(n, 0, maxDepth, intoInstances, out); return out; };
const findSet = name => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === name);
const defs = set => Object.entries(set.componentPropertyDefinitions).map(([k, d]) => k + ':' + d.type + (d.variantOptions ? '[' + d.variantOptions.join('|') + ']' : '=' + d.defaultValue));

// 1. Header arama alani (input dili buradan gelecek)
await step('header search', async () => {
  const h = await figma.getNodeByIdAsync('63:333');
  const v = h.children.find(c => /Desktop/.test(c.name) && /Logged in/.test(c.name)) || h.children[0];
  const search = v.findOne(n => /search/i.test(n.name) && n.type !== 'TEXT' && n.width > 200);
  report.info.headerVariant = v.name;
  report.info.headerSearch = search ? dump(search, 4, true) : 'not found';
});

// 2. Log out dialog (kaydetmeden cikma uyarisinin kalibi)
await step('log out dialog', async () => {
  const set = findSet('Log out dialog') || p01.findOne(n => /Log out dialog/.test(n.name) && (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT'));
  report.info.dialogType = set.type;
  report.info.dialogDefs = set.type === 'COMPONENT_SET' ? defs(set) : [];
  const first = set.type === 'COMPONENT_SET' ? set.children.find(c => /Desktop/.test(c.name)) || set.children[0] : set;
  report.info.dialog = dump(first, 4, false);
});

// 3. Filter chip (uyruk cipleri, segmented control)
await step('filter chip', async () => {
  const set = await figma.getNodeByIdAsync('69:800');
  report.info.chipDefs = defs(set);
  report.info.chipVariants = set.children.map(c => c.name);
  report.info.chip = set.children.slice(0, 3).flatMap(c => dump(c, 3, false));
});

// 4. Account menu (dropdown / autocomplete listesinin kalibi)
await step('account menu', async () => {
  const set = findSet('Account menu');
  report.info.menuDefs = defs(set);
  const v = set.children.find(c => /Desktop|280/.test(c.name)) || set.children[0];
  report.info.menu = dump(v, 2, false);
  const row = findSet('Menu row');
  if (row) { report.info.menuRowDefs = defs(row); report.info.menuRow = dump(row.children[0], 3, false); }
});

// 5. Button ve Tag ozellikleri
await step('button + tag', async () => {
  const b = await figma.getNodeByIdAsync('8:10');
  report.info.buttonDefs = defs(b);
  const prim = b.children.find(c => /Primary/.test(c.name) && /Default/.test(c.name)) || b.children[0];
  report.info.buttonPrimary = dump(prim, 2, false);
  const t = await figma.getNodeByIdAsync('63:111');
  report.info.tagDefs = defs(t);
  report.info.tag = dump(t.children[0], 2, false);
});

// 6. Positions karti ve saha (mevki secicinin tabani)
await step('positions', async () => {
  const prof = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player · Desktop');
  report.info.profileFound = !!prof;
  const card = prof.findOne(n => n.type === 'FRAME' && /^Positions/.test(n.name));
  report.info.positions = dump(card, 3, false);
  const pitch = card.findOne(n => n.name === 'Pitch');
  if (pitch) report.info.pitch = dump(pitch, 3, true).slice(0, 40);
});

// 7. Kart basligi kalibi (kalem ikonu nereye oturacak) · Career Section heading
await step('section heading', async () => {
  const prof = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player · Desktop');
  const head = prof.findOne(n => n.name === 'Section heading');
  report.info.sectionHeading = head ? dump(head, 3, false) : 'not found';
});

// 8. Stil ve degisken envanteri (form icin gerekenler)
await step('styles', async () => {
  report.info.textStyles = (await figma.getLocalTextStylesAsync()).map(s => s.name + ' ' + s.fontSize + '/' + (s.lineHeight.unit === 'PIXELS' ? s.lineHeight.value : 'auto')).filter(x => /^(Body|Label|Heading\/H4|Heading\/H3|Eyebrow)/.test(x));
  report.info.effectStyles = (await figma.getLocalEffectStylesAsync()).map(s => s.name);
  report.info.colorVars = allVars.filter(v => /^color\//.test(v.name)).map(v => v.name);
  report.info.icons = (await figma.getNodeByIdAsync('63:88')).componentPropertyDefinitions;
});

// 9. 01 Section listesi ve konumlari (5 · Forms nereye girecek)
await step('sections 01', async () => {
  report.info.sections01 = p01.children.filter(n => n.type === 'SECTION').map(s => s.name + ' x' + Math.round(s.x) + ' y' + Math.round(s.y) + ' ' + Math.round(s.width) + 'x' + Math.round(s.height));
});

return report;
