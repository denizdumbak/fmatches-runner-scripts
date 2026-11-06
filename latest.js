// step 319 · stadyum kartı: "Verified profile" rozeti gizlenir, Role satırı "Home of ..." olur (tekrar eden "Stadium" gider), Flag setine Germany varyantı eklenir (yatay üç şerit) ve Tenants bayrakları Germany olur
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = Math.round;
const p01 = figma.root.children.find(p => /^01/.test(p.name));
const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const sec = web.children.find(n => n.type === 'SECTION' && n.name === 'Stadium card');
const fr = sec.children.find(n => n.type === 'FRAME' && n.name === 'Facilities / Stadium card · Desktop');
async function setText(t, str) { for (const f of t.getRangeAllFontNames(0, Math.max(t.characters.length, 1))) await figma.loadFontAsync(f); t.characters = str; }

await step('A badge + role', async () => {
  const nr = fr.findOne(n => n.name === 'Name and role');
  const vt = nr.findAll(n => n.type === 'TEXT').find(t => t.characters === 'Verified profile');
  if (vt) { let a = vt; while (a.parent && a.parent !== nr && !/First name row|Player name/.test(a.parent.name)) a = a.parent; a.visible = false; report.info.hidBadge = a.name; } else report.info.hidBadge = 'bulunamadı';
  const role = fr.findOne(n => n.name === 'Role');
  const t = role.findAll(n => n.type === 'TEXT' && n.visible !== false)[0];
  await setText(t, 'Home of Spreeufer FC and Nordpark SC');
  report.info.nameAndRoleVisible = nr.findAll(n => n.type === 'TEXT' && n.visible !== false).map(x => x.characters);
});

let flagSet;
await step('B Germany flag variant', async () => {
  flagSet = null;
  (function w(n) { if (flagSet) return; if (n.type === 'COMPONENT_SET' && n.name === 'Flag') { flagSet = n; return; } if ('children' in n) for (const k of n.children) w(k); })(p01);
  const existing = flagSet.children.find(c => /Germany/.test(c.name));
  if (existing) { report.info.germany = 'zaten var'; return; }
  const src = flagSet.children.find(c => /France/.test(c.name));
  report.info.sourceVariant = `${src.name} ${R(src.width)}x${R(src.height)} kids=${src.children.map(c => c.type + ':' + c.name).join(',')}`;
  const v = src.clone(); flagSet.appendChild(v); v.name = 'Country=Germany';
  for (const k of v.children.slice()) k.remove();
  const h = v.height / 3, cols = [{ r: 0, g: 0, b: 0 }, { r: 0.8667, g: 0, b: 0 }, { r: 1, g: 0.8078, b: 0 }];
  cols.forEach((c, i) => { const r = figma.createRectangle(); v.appendChild(r); r.name = 'Stripe ' + (i + 1); r.resize(v.width, h); r.x = 0; r.y = i * h; r.fills = [{ type: 'SOLID', color: c }]; r.constraints = { horizontal: 'STRETCH', vertical: 'SCALE' }; });
  const last = flagSet.children.filter(c => c !== v).sort((a, b) => (a.x + a.width) - (b.x + b.width)).pop();
  v.x = last.x + last.width + 16; v.y = last.y;
  flagSet.resizeWithoutConstraints(Math.max(flagSet.width, v.x + v.width + (flagSet.width - (last.x + last.width))), flagSet.height);
  report.info.germany = `eklendi ${R(v.width)}x${R(v.height)} @${R(v.x)},${R(v.y)}; set ${R(flagSet.width)}x${R(flagSet.height)}; varyant sayısı ${flagSet.children.length}`;
});

await step('C tenants flags', async () => {
  const out = [];
  for (const cs of fr.findAll(n => n.type === 'INSTANCE' && /^Club strip/.test(n.name))) {
    const fl = cs.findOne(n => n.type === 'INSTANCE' && /Flag/.test(n.name));
    fl.setProperties({ Country: 'Germany' });
    out.push(`${cs.name}: ${fl.componentProperties.Country.value} ${R(fl.width)}x${R(fl.height)}`);
  }
  report.info.tenantFlags = out;
});

return report;
