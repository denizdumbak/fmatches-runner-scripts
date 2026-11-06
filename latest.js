// step 318 · stadyum kartı düzeltmeleri: Role satırındaki ikinci metin ("Name in home country…") gizlenir, Tenants bayrakları ülkeye göre (varyant seçenekleri raporlanır), hero butonundaki ikon özelliği tipi raporlanır
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name));
const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const sec = web.children.find(n => n.type === 'SECTION' && n.name === 'Stadium card');
const fr = sec.children.find(n => n.type === 'FRAME' && n.name === 'Facilities / Stadium card · Desktop');

await step('A role text', async () => {
  const role = fr.findOne(n => n.name === 'Role');
  const rt = role.findAll(n => n.type === 'TEXT');
  rt.forEach((t, i) => { if (i >= 1) t.visible = false; });
  report.info.roleTexts = rt.map(t => `${t.visible ? 'on' : 'off'}:${t.characters}`);
  const nr = fr.findOne(n => n.name === 'Name and role');
  report.info.nameAndRoleTexts = nr.findAll(n => n.type === 'TEXT' && n.visible !== false).map(t => t.characters);
});

await step('B flags', async () => {
  const out = [];
  for (const cs of fr.findAll(n => n.type === 'INSTANCE' && /^Club strip/.test(n.name))) {
    const fl = cs.findOne(n => n.type === 'INSTANCE' && /Flag/.test(n.name));
    if (!fl) { out.push(cs.name + ': flag yok'); continue; }
    const main = await fl.getMainComponentAsync();
    const defs = main.parent && main.parent.componentPropertyDefinitions ? main.parent.componentPropertyDefinitions : {};
    const key = Object.keys(defs).find(k => /Country/i.test(k));
    const opts = key ? defs[key].variantOptions : [];
    out.push(`${cs.name}: ${key} options=[${opts.join(', ')}] current=${JSON.stringify(fl.componentProperties)}`);
    const hit = opts.find(o => /germany|^de$|^ger$/i.test(o));
    if (hit) { fl.setProperties({ [key]: hit }); out.push('  -> ' + hit); } else out.push('  -> Germany yok, değiştirilmedi');
  }
  report.info.flags = out;
});

await step('C hero button icon', async () => {
  const btn = fr.findOne(n => n.name === 'Button · View on map');
  const props = btn.componentProperties || {};
  report.info.btnIconProps = Object.keys(props).map(k => `${k}:${props[k].type}=${String(props[k].value).slice(0, 20)}`);
  const ik = Object.keys(props).find(k => /^Icon/.test(k));
  const defs = (await btn.getMainComponentAsync()).parent.componentPropertyDefinitions;
  report.info.btnIconDef = ik && defs[ik] ? defs[ik].type : 'yok';
  const visIcons = btn.findAll(n => n.visible !== false && /Icon|Vector/.test(n.name)).map(n => `${n.type}:${n.name}`).slice(0, 8);
  report.info.btnVisibleIconNodes = visIcons;
  const menu = [];
  (function w(n) { if (n.type === 'COMPONENT_SET' && /^Menu icon$/.test(n.name)) n.children.forEach(c => menu.push(c.name)); else if ('children' in n && n.type !== 'COMPONENT_SET') n.children.forEach(w); })(p01);
  report.info.menuIconVariants = menu;
});

return report;
