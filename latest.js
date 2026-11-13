// step 401 (400 duzeltmesi: ic ice eslesme) · Faz 7 edit formlari (2/4): Manager, Referee, Intermediary icin Edit details mobil. Rol mobil profili klonlanir, Key facts/Club strip/Sticky bar kalkar, hero'ya Leo'nun mobil Details form'u girer. Yeni Mobile Section "Own profile · other roles"
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
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const ownSec = mob.children.find(n => n.type === 'SECTION' && n.name === 'Own profile');
const rolesSec = mob.children.find(n => n.type === 'SECTION' && n.name === 'Profiles · other roles');
const srcEdit = ownSec && ownSec.children.find(c => c.type === 'FRAME' && c.name === 'Profiles / Player / Own profile / Edit details · Mobile');
if (!ownSec || !rolesSec || !srcEdit) throw new Error('Mobile Own profile / roles Section ya da Player Edit details yok');
const SEC_NAME = 'Own profile · other roles';
const ROLES = [
  { role: 'Manager', dob: '02.03.1979', nat: ['England', 'Ireland'], cob: 'Ireland', city: 'Cork', home: 'Thomas Reilly', gen: 'Male', group: 'Work', fields: [['Current role', 'Select', 'Head coach'], ['License', 'Select', 'PRO'], ['Specialization', 'Text', 'Youth development']] },
  { role: 'Referee', dob: '22.06.1993', nat: ['France'], cob: 'France', city: 'Lyon', home: 'Ana Ferreira Costa', gen: 'Female', group: 'Refereeing', fields: [['Current role', 'Select', 'Assistant referee'], ['Category', 'Select', 'FIFA 1st']] },
  { role: 'Intermediary', dob: '14.11.1988', nat: ['England'], cob: 'England', city: 'Manchester', home: 'Sofia Lindqvist', gen: 'Female', group: 'Agency', fields: [['Agency', 'Select', 'Northline Sports Agency'], ['Specialization', 'Text', 'Youth transfers'], ['Clients', 'Chips', ['Leo Marsh', 'Mateus Kowalczyk-Brun', 'Liam Hartley']]] }
];
let ns = mob.children.find(n => n.type === 'SECTION' && n.name === SEC_NAME);
await step('Section', async () => {
  if (!ns) { ns = figma.createSection(); ns.name = SEC_NAME; mob.appendChild(ns); ns.x = ownSec.x; ns.y = ownSec.y + ownSec.height + 150; ns.resizeWithoutConstraints(1600, 1000); }
  for (const c of ns.children.slice()) if (/Edit details · Mobile/.test(c.name)) c.remove();
  report.info.section = SEC_NAME + ' @' + R(ns.x) + ',' + R(ns.y);
});
const newIds = new Set(); const made = [];
async function fillForm(form, cfg) {
  const pg = form.children.find(c => c.name === 'Group · Personal'), fb = form.children.find(c => c.name === 'Group · Football');
  if (!pg || !fb) throw new Error('Group · Personal/Football yok');
  const pf = pg.findOne(n => n.name === 'Fields'), ff = fb.findOne(n => n.name === 'Fields');
  const fld = (fr, nm) => { const f = fr.children.find(c => c.name === 'Field · ' + nm); if (!f) throw new Error('alan yok: ' + nm); return f; };
  const natTpl = fld(pf, 'Nationality').clone(); ff.appendChild(natTpl);
  await setIn(fld(pf, 'Date of birth'), 'Value', cfg.dob); await setIn(fld(pf, 'Country of birth'), 'Value', cfg.cob); await setIn(fld(pf, 'City of birth'), 'Value', cfg.city);
  await setIn(fld(pf, 'Name in home country'), 'Value', cfg.home); await setIn(fld(pf, 'Gender'), 'Value', cfg.gen);
  const chips = fld(pf, 'Nationality').findAll(n => n.name === 'Chip');
  for (let i = 0; i < chips.length; i++) { if (i < cfg.nat.length) { chips[i].visible = true; await setIn(chips[i], 'Value', cfg.nat[i]); } else chips[i].visible = false; }
  await setIn(fb, 'Group title', cfg.group);
  const sel = fld(ff, 'Current club'), txt = fld(ff, 'Height (cm)');
  const ordered = cfg.fields.filter(f => f[1] !== 'Chips').concat(cfg.fields.filter(f => f[1] === 'Chips'));
  for (const [label, kind, val] of ordered) {
    let c;
    if (kind === 'Chips') { c = natTpl; ff.appendChild(c); const cs = c.findAll(n => n.name === 'Chip'); for (let i = 0; i < cs.length; i++) { if (i < val.length) { cs[i].visible = true; await setIn(cs[i], 'Value', val[i]); } else cs[i].visible = false; } try { c.layoutSizingHorizontal = 'FILL'; } catch (e) { report.errors.push('Clients genislik: ' + e.message); } }
    else { c = (kind === 'Select' ? sel : txt).clone(); ff.appendChild(c); await setIn(c, 'Value', val); }
    await setIn(c, 'Label', label); c.name = 'Field · ' + label;
  }
  if (!cfg.fields.some(f => f[1] === 'Chips')) natTpl.remove();
  sel.remove(); txt.remove(); for (const o of ff.children.slice()) if (/^Field · (Strong foot|Weight)/.test(o.name)) o.remove();
  return { roleFields: ff.children.map(c => c.name + ' ' + R(c.width) + 'x' + R(c.height)) };
}
for (const cfg of ROLES) {
  await step(cfg.role + ' · Edit details · Mobile', async () => {
    const rp = rolesSec.children.find(c => c.type === 'FRAME' && c.name === 'Profiles / ' + cfg.role + ' · Mobile'); if (!rp) throw new Error('rol profili yok');
    const f = rp.clone(); ns.appendChild(f); f.name = 'Profiles / ' + cfg.role + ' / Own profile / Edit details · Mobile'; await clearNav(f);
    const hero = f.findOne(n => n.type === 'FRAME' && /^Hero/.test(n.name)); if (!hero) throw new Error('Hero yok');
    const idb = hero.children.find(c => c.name === 'Identity block'); if (!idb) throw new Error('Identity block yok');
    const heroBefore = hero.children.map(c => c.name + ' ' + R(c.height)), idBefore = idb.children.map(c => c.name + ' ' + R(c.height));
    const rm = []; const tgt = f.findAll(x => /^(Key facts|Club strip|Profile actions|Sticky action bar)/.test(x.name)).map(x => ({ n: x, name: x.name })); for (const t of tgt) { try { if (t.n.removed) continue; t.n.remove(); rm.push(t.name); } catch (e) { report.errors.push('kaldirilamadi ' + t.name + ': ' + e.message); } }
    const leoForm = srcEdit.findOne(n => n.name === 'Details form'); const form = leoForm.clone();
    hero.insertChild(hero.children.indexOf(idb) + 1, form);
    try { form.layoutSizingHorizontal = 'FILL'; } catch (e) {}
    const info = await fillForm(form, cfg);
    newIds.add(f.id); made.push(f);
    report.info[cfg.role] = { frame: R(f.width) + 'x' + R(f.height), hero: R(hero.height), heroLayout: hero.layoutMode, removed: rm, heroBefore, heroAfter: hero.children.map(c => c.name + ' ' + R(c.height) + (c.layoutPositioning === 'ABSOLUTE' ? ' abs' : '')), idBefore, idAfter: idb.children.map(c => c.name + ' ' + R(c.height)), formWidth: R(form.width), roleFields: info.roleFields };
  });
}
await step('Yerlestirme ve Section', async () => {
  let i = 0; for (const f of made) { f.x = 80 + i * 470; f.y = 100; i++; }
  const right = Math.max.apply(null, ns.children.map(c => c.x + c.width)), bottom = Math.max.apply(null, ns.children.map(c => c.y + c.height));
  ns.resizeWithoutConstraints(Math.ceil(right + 80), Math.ceil(bottom + 80));
  report.info.moved = settle(mob, ns); report.info.sectionSize = R(ns.width) + 'x' + R(ns.height) + ' · Mobile ' + R(mob.width) + 'x' + R(mob.height);
  const fs = p02.flowStartingPoints; const keep = fs.filter(x => !newIds.has(x.nodeId)); report.info.flowStarts = fs.length + ' -> ' + keep.length; if (keep.length !== fs.length) p02.flowStartingPoints = keep;
});
await step('Kontrol', async () => {
  const bb = n => n.absoluteBoundingBox; const ov = [];
  for (let i = 0; i < made.length; i++) for (let j = i + 1; j < made.length; j++) { const a = bb(made[i]), b = bb(made[j]); if (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y) ov.push(made[i].name + ' x ' + made[j].name); }
  report.info.screenOverlaps = ov.length ? ov : 'none';
  const secs = mob.children.filter(n => n.type === 'SECTION').sort((a, b) => a.y - b.y); const sov = []; for (let i = 0; i < secs.length - 1; i++) if (secs[i].y + secs[i].height > secs[i + 1].y) sov.push(secs[i].name + ' x ' + secs[i + 1].name); report.info.sectionOverlaps = sov.length ? sov : 'none';
  let uns = 0, dash = 0; for (const f of made) for (const t of f.findAll(n => n.type === 'TEXT')) { if (typeof t.textStyleId === 'string' && t.textStyleId === '') uns++; if (t.characters.indexOf(String.fromCharCode(8212)) >= 0) dash++; }
  report.info.unstyledText = uns; report.info.longDash = dash; report.info.leoPageIntact = srcEdit.findAll(n => n.name === 'Details form').length + ' Details form in Player Edit details';
});
return JSON.stringify(report, null, 1);
