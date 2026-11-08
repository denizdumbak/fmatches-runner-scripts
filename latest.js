// step 336 · düzeltme (335'te text/brand bulunamadı): Notifications başlığına "N unread" etiketi, masaüstü + mobil; değişken adı sonek ile aranır
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const sub = (plat, re) => plat.children.find(n => n.type === 'SECTION' && re.test(n.name));
const allVars = await figma.variables.getLocalVariablesAsync();
const brandCands = allVars.filter(v => v.resolvedType === 'COLOR' && /(^|\/)text\/brand$/.test(v.name)).map(v => v.name);
report.info.brandCandidates = brandCands;
const brand = allVars.find(v => v.resolvedType === 'COLOR' && /(^|\/)text\/brand$/.test(v.name));
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const fonts = async t => { for (const f of t.getRangeAllFontNames(0, Math.max(1, t.characters.length))) await figma.loadFontAsync(f); };
const sz = n => Math.round(n.width) + 'x' + Math.round(n.height);
const floatVars = allVars.filter(v => v.resolvedType === 'FLOAT' && /space|spacing|gap/i.test(v.name));
const g12 = floatVars.find(v => v.valuesByMode[Object.keys(v.valuesByMode)[0]] === 12);
await step('Notifications unread', async () => {
  if (!brand) throw new Error('text/brand yok; adaylar: ' + allVars.filter(v => /brand/.test(v.name) && v.resolvedType === 'COLOR').map(v => v.name).join(', '));
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Shortlist row');
  const src = set.findOne(n => n.type === 'TEXT' && n.name === 'Label'); await fonts(src);
  const out = [];
  for (const [plat, dv] of [[web, 'Desktop'], [mob, 'Mobile']]) {
    const sec = sub(plat, /^Notifications$/); const f = sec.children.find(n => n.type === 'FRAME' && n.name === 'Notifications / Notifications · ' + dv);
    const rows = f.findAll(n => n.type === 'INSTANCE' && /^Notification · /.test(n.name));
    let unread = 0;
    for (const r of rows) { const k = Object.keys(r.componentProperties).find(x => /^Unread/i.test(x)); if (k && String(r.componentProperties[k].value).toLowerCase() === 'true') unread++; }
    const heading = f.findOne(n => n.name === 'Heading row'); const title = heading.findOne(n => n.type === 'TEXT' && n.name === 'Title');
    let grp = heading.children.find(n => n.name === 'Title group');
    if (!grp) { grp = figma.createFrame(); grp.name = 'Title group'; grp.fills = []; grp.layoutMode = 'HORIZONTAL'; grp.counterAxisAlignItems = 'CENTER'; heading.insertChild(0, grp); grp.layoutSizingHorizontal = 'HUG'; grp.layoutSizingVertical = 'HUG'; if (g12) grp.setBoundVariable('itemSpacing', g12); else grp.itemSpacing = 12; grp.appendChild(title); }
    for (const o of grp.children.filter(n => n.name === 'Unread count')) o.remove();
    const t = figma.createText(); t.fontName = src.getRangeFontName(0, 1);
    if (typeof src.textStyleId === 'string' && src.textStyleId) await t.setTextStyleIdAsync(src.textStyleId);
    t.characters = unread + ' unread'; t.fills = [P(brand)]; t.name = 'Unread count'; grp.appendChild(t);
    out.push(dv + ': ' + t.characters + ' | group ' + sz(grp) + ' heading ' + sz(heading) + ' frame ' + sz(f) + ' fill ' + (t.fills[0].boundVariables && t.fills[0].boundVariables.color ? 'bound' : 'UNBOUND'));
  }
  report.info.unread = out;
});
return report;
