// step 403 · Faz 7 edit formlari (3/4): Manager, Referee, Intermediary icin Edit career (masaustu + mobil). Rol profili klonlanir, Career karti icine Player'in Career row form'u girer; Role (Manager, Referee) ve Achievements alanlari eklenir, On loan gizlenir
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
const ROLES = [
  { role: 'Manager', initials: 'TR', hasRole: true, v: { Club: 'Cork City', Team: 'First team', Role: 'Head coach', Joined: '07.2021', 'Contract until': '06.2026', Achievements: 'League of Ireland Premier Division 2023' } },
  { role: 'Referee', initials: 'AF', hasRole: true, v: { Club: 'Ligue 1 Referees Pool', Team: 'Elite group', Role: 'Assistant referee', Joined: '08.2019', 'Contract until': '06.2027', Achievements: 'FIFA badge 2023' } },
  { role: 'Intermediary', initials: 'SL', hasRole: false, v: { Club: 'Northline Sports Agency', Team: 'Youth division', Joined: '01.2017', 'Contract until': '12.2028', Achievements: 'Closed 40 youth transfers' } }
];
const newIds = new Set();
async function runPlat(plat) {
  const isWeb = plat === 'Web', suf = isWeb ? 'Desktop' : 'Mobile';
  const root = p02.children.find(n => n.type === 'SECTION' && n.name === (isWeb ? 'Web' : 'Mobile'));
  const ownSec = root.children.find(n => n.type === 'SECTION' && n.name === 'Own profile');
  const rolesSec = root.children.find(n => n.type === 'SECTION' && n.name === 'Profiles · other roles');
  const ns = root.children.find(n => n.type === 'SECTION' && n.name === 'Own profile · other roles');
  const srcCareer = ownSec.children.find(c => c.type === 'FRAME' && c.name === 'Profiles / Player / Own profile / Edit career · ' + suf);
  const srcDetails = ownSec.children.find(c => c.type === 'FRAME' && c.name === 'Profiles / Player / Own profile / Edit details · ' + suf);
  if (!ns || !srcCareer || !srcDetails) throw new Error(plat + ': Section ya da kaynak sayfa yok');
  for (const c of ns.children.slice()) if (new RegExp('Edit career · ' + suf).test(c.name)) c.remove();
  const rowSrc = srcCareer.findOne(n => n.name === 'Career row form'), addSrc = srcCareer.findOne(n => n.type === 'FRAME' && n.name === 'Add club');
  const txtSrc = srcDetails.findOne(n => n.name === 'Field · Height (cm)');
  if (!rowSrc || !addSrc || !txtSrc) throw new Error(plat + ': Career row form / Add club / text alan yok');
  const made = [];
  for (const cfg of ROLES) {
    await step(plat + ' ' + cfg.role + ' · Edit career', async () => {
      const rp = rolesSec.children.find(c => c.type === 'FRAME' && c.name === 'Profiles / ' + cfg.role + ' · ' + suf); if (!rp) throw new Error('rol profili yok');
      const f = rp.clone(); ns.appendChild(f); f.name = 'Profiles / ' + cfg.role + ' / Own profile / Edit career · ' + suf; await clearNav(f);
      for (const n of f.findAll(x => /^Sticky action bar/.test(x.name)).map(x => x)) { try { if (!n.removed) n.remove(); } catch (e) {} }
      const bc = f.findOne(n => n.type === 'TEXT' && n.name === 'Breadcrumb'); if (bc) await setText(bc, 'My profile');
      const nav = f.children.find(c => c.type === 'INSTANCE' && /^Navigation/.test(c.name)); if (nav) { const a = nav.findOne(n => n.type === 'INSTANCE' && /^Avatar/.test(n.name)); if (a) { const k = Object.keys(a.componentProperties).find(x => /^Initials/.test(x)); if (k) { try { a.setProperties({ [k]: cfg.initials }); } catch (e) {} } } }
      const career = f.findOne(n => n.type === 'FRAME' && n.name === 'Career' && n.children.some(c => c.name === 'Club entries')); if (!career) throw new Error('Career karti yok');
      const entries = career.children.find(c => c.name === 'Club entries');
      const form = rowSrc.clone(); entries.insertChild(0, form); try { form.layoutSizingHorizontal = 'FILL'; } catch (e) {}
      const fields = form.findOne(n => n.name === 'Fields');
      const fld = nm => { const x = fields.children.find(c => c.name === 'Field · ' + nm); if (!x) throw new Error('alan yok: ' + nm); return x; };
      if (cfg.hasRole) { const r = fld('Club').clone(); fields.insertChild(fields.children.indexOf(fld('Team')) + 1, r); await setIn(r, 'Label', 'Role'); r.name = 'Field · Role'; }
      const ach = txtSrc.clone(); fields.appendChild(ach); await setIn(ach, 'Label', 'Achievements'); ach.name = 'Field · Achievements';
      try { ach.layoutSizingHorizontal = 'FILL'; } catch (e) { report.errors.push('Achievements genislik: ' + e.message); }
      for (const k of Object.keys(cfg.v)) await setIn(fld(k), 'Value', cfg.v[k]);
      const loan = form.findOne(n => /^Checkbox · On loan/.test(n.name)); if (loan) loan.visible = false;
      const add = addSrc.clone(); career.appendChild(add);
      newIds.add(f.id); made.push(f);
      report.info[plat + ' ' + cfg.role] = { frame: R(f.width) + 'x' + R(f.height), career: R(career.width) + 'x' + R(career.height), form: R(form.width) + 'x' + R(form.height), fields: fields.children.map(c => c.name + ' ' + R(c.width) + 'x' + R(c.height)), careerAfter: career.children.map(c => c.name + ' ' + R(c.height)), entriesAfter: entries.children.map(c => c.name + ' ' + R(c.height)) };
    });
  }
  await step(plat + ' yerlestirme', async () => {
    const others = ns.children.filter(c => !made.includes(c) && !new RegExp('Edit career · ').test(c.name));
    if (isWeb) { const rowY = Math.max.apply(null, others.map(c => c.y + c.height)) + 151; let i = 0; for (const f of made) { f.x = 80 + i * 1920; f.y = rowY; i++; } }
    else { let i = 3; for (const f of made) { f.x = 80 + i * 470; f.y = 100; i++; } }
    const right = Math.max.apply(null, ns.children.map(c => c.x + c.width)), bottom = Math.max.apply(null, ns.children.map(c => c.y + c.height));
    ns.resizeWithoutConstraints(Math.ceil(right + 80), Math.ceil(bottom + 80));
    report.info[plat + ' moved'] = settle(root, ns); report.info[plat + ' sectionSize'] = R(ns.width) + 'x' + R(ns.height);
  });
  await step(plat + ' kontrol', async () => {
    const all = ns.children.filter(c => c.type === 'FRAME'); const ov = [];
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) { const a = all[i].absoluteBoundingBox, b = all[j].absoluteBoundingBox; if (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y) ov.push(all[i].name + ' x ' + all[j].name); }
    report.info[plat + ' screenOverlaps'] = ov.length ? ov : 'none';
    let uns = 0, dash = 0; for (const f of made) for (const t of f.findAll(n => n.type === 'TEXT')) { if (typeof t.textStyleId === 'string' && t.textStyleId === '') uns++; if (t.characters.indexOf(String.fromCharCode(8212)) >= 0) dash++; }
    report.info[plat + ' unstyledText'] = uns; report.info[plat + ' longDash'] = dash;
  });
}
for (const plat of ['Web', 'Mobile']) { try { await runPlat(plat); } catch (e) { report.errors.push(plat + ': ' + (e && e.message ? e.message : e)); } }
const fs = p02.flowStartingPoints; const keep = fs.filter(x => !newIds.has(x.nodeId)); report.info.flowStarts = fs.length + ' -> ' + keep.length; if (keep.length !== fs.length) p02.flowStartingPoints = keep;
const secsAll = ['Web', 'Mobile'].map(n => p02.children.find(x => x.type === 'SECTION' && x.name === n)); report.info.sectionOverlapsY = 'bkz settle';
return JSON.stringify(report, null, 1);
