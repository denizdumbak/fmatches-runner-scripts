// step 116 · Uyruk inspect (salt okunur): Key fact NATIONALITY yapisi, bayrak katmani, key facts kapsayicisi (masaustu + mobil), Key fact component

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const STY = {}; for (const s of await figma.getLocalTextStylesAsync()) STY[s.id] = s.name;

function dump(n, depth) {
  const o = { n: n.name, t: n.type, w: Math.round(n.width), h: Math.round(n.height) };
  if (n.type === 'TEXT') { o.c = n.characters; o.st = typeof n.textStyleId === 'string' ? (STY[n.textStyleId] || n.textStyleId) : 'mixed'; o.ar = n.textAutoResize; }
  if ('layoutMode' in n && n.layoutMode !== 'NONE') { o.lm = n.layoutMode; o.gap = n.itemSpacing; o.wrap = n.layoutWrap; o.cgap = n.counterAxisSpacing; o.pad = [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft]; }
  if ('layoutSizingHorizontal' in n) o.sz = n.layoutSizingHorizontal + '/' + n.layoutSizingVertical;
  if ('layoutGrow' in n && n.layoutGrow) o.grow = n.layoutGrow;
  if (n.type === 'INSTANCE') o.props = n.componentProperties ? Object.keys(n.componentProperties).map(k => k + '=' + n.componentProperties[k].value).join(', ') : null;
  if ('fills' in n && Array.isArray(n.fills) && n.fills.length) o.fill = n.fills.map(f => f.type + (f.boundVariables && f.boundVariables.color ? ':var' : '')).join(',');
  if ('strokes' in n && Array.isArray(n.strokes) && n.strokes.length) o.stroke = n.strokeWeight;
  if ('cornerRadius' in n && typeof n.cornerRadius === 'number' && n.cornerRadius) o.r = n.cornerRadius;
  if (depth > 0 && 'children' in n) o.k = n.children.map(c => dump(c, depth - 1));
  return o;
}

const p2 = pageOf(/^02/); await p2.loadAsync();
const p1 = pageOf(/^01/); await p1.loadAsync();

for (const fname of ['Profiles / Player · Desktop', 'Profiles / Player · Mobile']) {
  await step('key facts · ' + fname, async () => {
    const f = p2.findOne(n => n.type === 'FRAME' && n.name === fname);
    const nat = f.findOne(n => n.type === 'TEXT' && /^NATIONALITY$/i.test(n.characters.trim()));
    if (!nat) throw new Error('NATIONALITY etiketi yok');
    // etiketten yukari: key fact koku ve key facts kapsayicisi
    let fact = nat.parent; while (fact.parent && !/Key fact/i.test(fact.name) && fact.parent.name !== 'Identity') fact = fact.parent;
    const container = fact.parent;
    report.info[fname] = {
      factPath: (function () { const a = []; let p = nat; while (p && p !== f) { a.push(p.name + ':' + p.type); p = p.parent; } return a.join(' < '); })(),
      fact: dump(fact, 6),
      container: dump(container, 1)
    };
    if (fact.type === 'INSTANCE') { const mc = await fact.getMainComponentAsync(); report.info[fname].main = mc ? (mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent.name + ' / ' + mc.name : mc.name) : null; }
  });
}

await step('Key fact component (sekme 01)', async () => {
  const set = p1.findOne(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && /^Key fact/.test(n.name));
  if (!set) throw new Error('Key fact component yok');
  report.info.component = dump(set, 4);
});

await step('bayrak benzeri katmanlar (sekme 01)', async () => {
  report.info.flags = p1.findAll(n => /flag/i.test(n.name)).slice(0, 30).map(n => n.name + ' · ' + n.type + ' · ' + Math.round(n.width) + 'x' + Math.round(n.height) + ' · in ' + (n.parent ? n.parent.name : ''));
});

return JSON.stringify(report);
