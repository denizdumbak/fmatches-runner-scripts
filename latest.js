// step 396 · Faz 7 edit formlari (1/4): Manager, Referee, Intermediary icin Edit details sayfalari (masaustu). Rol profili klonlanir, hero'da Key facts/Club strip/Profile actions yerine Details form girer. Yeni Section "Own profile · other roles"
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
async function setText(t, s) { const f = t.fontName; if (f === figma.mixed) { await figma.loadFontAsync(t.getRangeFontName(0, 1)); } else { await figma.loadFontAsync(f); } t.characters = s; }
async function setIn(root, name, s) { const t = root.findOne(n => n.type === 'TEXT' && n.name === name); if (!t) throw new Error('metin yok: ' + name + ' / ' + root.name); await setText(t, s); }
async function clearNav(root) { for (const n of [root].concat(root.findAll(() => true))) { try { const rs = n.reactions; if (!rs || !rs.length) continue; const keep = rs.filter(r => !(r.actions || (r.action ? [r.action] : [])).some(isNavAct)); if (keep.length !== rs.length) await n.setReactionsAsync(keep); } catch (e) {} } }
function settle(plat, sec) {
  const secs = plat.children.filter(n => n.type === 'SECTION').sort((a, b) => a.y - b.y); let prev = null; const moved = [];
  for (const s of secs) { if (s === sec) { prev = s.y + s.height; continue; } if (prev === null) continue; if (s.y < prev + 160) { moved.push(s.name + ' ' + R(s.y) + ' -> ' + R(prev + 160)); s.y = prev + 160; } prev = s.y + s.height; }
  plat.resizeWithoutConstraints(plat.width, Math.ceil(Math.max.apply(null, plat.children.map(n => n.y + n.height)) + 120));
  return moved;
}
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const ownSec = web.children.find(n => n.type === 'SECTION' && n.name === 'Own profile');
const rolesSec = web.children.find(n => n.type === 'SECTION' && n.name === 'Profiles · other roles');
const srcEdit = ownSec && ownSec.children.find(c => c.type === 'FRAME' && c.name === 'Profiles / Player / Own profile / Edit details · Desktop');
if (!ownSec || !rolesSec || !srcEdit) throw new Error('Own profile / roles Section ya da Player Edit details yok');
const SEC_NAME = 'Own profile · other roles';
const ROLES = [
  { role: 'Manager', initials: 'TR', dob: '02.03.1979', nat: ['England', 'Ireland'], cob: 'Ireland', city: 'Cork', home: 'Thomas Reilly', gen: 'Male', group: 'Work', fields: [['Current role', 'Select', 'Head coach'], ['License', 'Select', 'PRO'], ['Specialization', 'Text', 'Youth development']] },
  { role: 'Referee', initials: 'AF', dob: '22.06.1993', nat: ['France'], cob: 'France', city: 'Lyon', home: 'Ana Ferreira Costa', gen: 'Female', group: 'Refereeing', fields: [['Current role', 'Select', 'Assistant referee'], ['Category', 'Select', 'FIFA 1st']] },
  { role: 'Intermediary', initials: 'SL', dob: '14.11.1988', nat: ['England'], cob: 'England', city: 'Manchester', home: 'Sofia Lindqvist', gen: 'Female', group: 'Agency', fields: [['Agency', 'Select', 'Northline Sports Agency'], ['Specialization', 'Text', 'Youth transfers'], ['Clients', 'Chips', ['Leo Marsh', 'Mateus Kowalczyk-Brun', 'Liam Hartley']]] }
];
// ---------- Section
let ns = web.children.find(n => n.type === 'SECTION' && n.name === SEC_NAME);
await step('Section', async () => {
  if (!ns) { ns = figma.createSection(); ns.name = SEC_NAME; web.appendChild(ns); ns.x = ownSec.x; ns.y = ownSec.y + ownSec.height + 150; ns.resizeWithoutConstraints(3000, 1000); }
  for (const c of ns.children.slice()) if (/Edit details · Desktop/.test(c.name)) c.remove();
  report.info.section = SEC_NAME + ' @' + R(ns.x) + ',' + R(ns.y);
});
const newIds = new Set(); const made = [];
async function fillForm(form, cfg) {
  const pg = form.children.find(c => c.name === 'Group · Personal'), fb = form.children.find(c => c.name === 'Group · Football');
  if (!pg || !fb) throw new Error('Group · Personal/Football yok');
  const pf = pg.findOne(n => n.name === 'Fields'), ff = fb.findOne(n => n.name === 'Fields');
  const fld = (fr, nm) => { const f = fr.children.find(c => c.name === 'Field · ' + nm); if (!f) throw new Error('alan yok: ' + nm); return f; };
  const natTpl = fld(pf, 'Nationality').clone(); ff.appendChild(natTpl);   // Clients icin sablon, hemen tasindi
  await setIn(fld(pf, 'Date of birth'), 'Value', cfg.dob); await setIn(fld(pf, 'Country of birth'), 'Value', cfg.cob); await setIn(fld(pf, 'City of birth'), 'Value', cfg.city);
  await setIn(fld(pf, 'Name in home country'), 'Value', cfg.home); await setIn(fld(pf, 'Gender'), 'Value', cfg.gen);
  const nat = fld(pf, 'Nationality'); const chips = nat.findAll(n => n.name === 'Chip');
  for (let i = 0; i < chips.length; i++) { if (i < cfg.nat.length) { chips[i].visible = true; await setIn(chips[i], 'Value', cfg.nat[i]); } else chips[i].visible = false; }
  // rol grubu
  await setIn(fb, 'Group title', cfg.group);
  const sel = fld(ff, 'Current club'), txt = fld(ff, 'Height (cm)'); const fresh = [];
  for (const [label, kind, val] of cfg.fields) {
    let c;
    if (kind === 'Chips') { c = natTpl; const cs = c.findAll(n => n.name === 'Chip'); for (let i = 0; i < cs.length; i++) { if (i < val.length) { cs[i].visible = true; await setIn(cs[i], 'Value', val[i]); } else cs[i].visible = false; } try { c.resize(ff.width, c.height); c.layoutSizingHorizontal = 'FIXED'; } catch (e) { report.errors.push('Clients genislik: ' + e.message); } }
    else { c = (kind === 'Select' ? sel : txt).clone(); ff.appendChild(c); await setIn(c, 'Value', val); }
    await setIn(c, 'Label', label); c.name = 'Field · ' + label; fresh.push(c);
  }
  if (!cfg.fields.some(f => f[1] === 'Chips')) natTpl.remove();
  sel.remove(); txt.remove(); for (const o of ff.children.slice()) if (/^Field · (Strong foot|Weight)/.test(o.name)) o.remove();
  // Fields icinde siralama: yeni alanlar
  return { personal: pf.children.map(c => c.name), roleFields: ff.children.map(c => c.name + ' ' + R(c.width) + 'x' + R(c.height)) };
}
for (const cfg of ROLES) {
  await step(cfg.role + ' · Edit details · Desktop', async () => {
    const rp = rolesSec.children.find(c => c.type === 'FRAME' && c.name === 'Profiles / ' + cfg.role + ' · Desktop'); if (!rp) throw new Error('rol profili yok');
    const f = rp.clone(); ns.appendChild(f); f.name = 'Profiles / ' + cfg.role + ' / Own profile / Edit details · Desktop'; await clearNav(f);
    const hero = f.findOne(n => n.type === 'FRAME' && /^Hero/.test(n.name)); if (!hero) throw new Error('Hero yok');
    const identity = hero.children.find(c => c.name === 'Identity'); if (!identity) throw new Error('Identity yok');
    const before = identity.children.map(c => c.name);
    const nr = identity.children.find(c => c.name === 'Name and role'); const at = identity.children.indexOf(nr) + 1;
    for (const c of identity.children.slice()) if (/^(Key facts|Club strip|Profile actions)/.test(c.name)) c.remove();
    const bc = identity.children.find(c => c.name === 'Breadcrumb'); if (bc) await setText(bc, 'My profile');
    const leoForm = srcEdit.findOne(n => n.name === 'Details form'); const form = leoForm.clone(); identity.insertChild(at, form);
    try { form.layoutSizingHorizontal = 'FILL'; } catch (e) {}
    const info = await fillForm(form, cfg);
    // gezinme: avatar bas harfleri
    const nav = f.children.find(c => c.type === 'INSTANCE' && /^Navigation/.test(c.name)); let av = 'yok';
    if (nav) { const a = nav.findOne(n => n.type === 'INSTANCE' && /^Avatar/.test(n.name)); if (a) { const k = Object.keys(a.componentProperties).find(x => /^Initials/.test(x)); if (k) { a.setProperties({ [k]: cfg.initials }); av = cfg.initials; } } }
    // silüet tabana
    const sils = hero.children.filter(c => c.type === 'INSTANCE' && /Silhouette/.test(c.name)); for (const s of sils) { try { s.y = hero.height - s.height; } catch (e) {} }
    const hb = hero.absoluteBoundingBox; const gaps = sils.map(s => { const b = s.absoluteBoundingBox; return R(hb.y + hb.height - (b.y + b.height)); });
    newIds.add(f.id); made.push(f);
    report.info[cfg.role] = { frame: R(f.width) + 'x' + R(f.height), hero: R(hero.height), identityBefore: before, identityAfter: identity.children.map(c => c.name + ' ' + R(c.height)), silhouettes: sils.length, silhouetteBottomGap: gaps, avatar: av, personal: info.personal, roleFields: info.roleFields };
  });
}
await step('Yerlestirme ve Section', async () => {
  let i = 0; for (const f of made) { f.x = 80 + i * 1920; f.y = 100; i++; }
  const right = Math.max.apply(null, ns.children.map(c => c.x + c.width)), bottom = Math.max.apply(null, ns.children.map(c => c.y + c.height));
  ns.resizeWithoutConstraints(Math.ceil(right + 80), Math.ceil(bottom + 80));
  report.info.moved = settle(web, ns); report.info.sectionSize = R(ns.width) + 'x' + R(ns.height) + ' · Web ' + R(web.width) + 'x' + R(web.height);
  const fs = p02.flowStartingPoints; const keep = fs.filter(x => !newIds.has(x.nodeId)); report.info.flowStarts = fs.length + ' -> ' + keep.length; if (keep.length !== fs.length) p02.flowStartingPoints = keep;
});
await step('Kontrol', async () => {
  const bb = n => n.absoluteBoundingBox; const ov = [];
  for (let i = 0; i < made.length; i++) for (let j = i + 1; j < made.length; j++) { const a = bb(made[i]), b = bb(made[j]); if (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y) ov.push(made[i].name + ' x ' + made[j].name); }
  report.info.screenOverlaps = ov.length ? ov : 'none';
  const secs = web.children.filter(n => n.type === 'SECTION').sort((a, b) => a.y - b.y); const sov = []; for (let i = 0; i < secs.length - 1; i++) if (secs[i].y + secs[i].height > secs[i + 1].y) sov.push(secs[i].name + ' x ' + secs[i + 1].name); report.info.sectionOverlaps = sov.length ? sov : 'none';
  let uns = 0, dash = 0; for (const f of made) for (const t of f.findAll(n => n.type === 'TEXT')) { if (typeof t.textStyleId === 'string' && t.textStyleId === '') uns++; if (t.characters.indexOf(String.fromCharCode(8212)) >= 0) dash++; }
  report.info.unstyledText = uns; report.info.longDash = dash; report.info.leoPageIntact = srcEdit.findAll(n => n.name === 'Details form').length + ' Details form in Player Edit details';
});
return JSON.stringify(report, null, 1);
