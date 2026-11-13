// step 395 · INSPECT (salt okunur): Own profile edit sayfalari (Edit details, Career row), rol profillerinin hero key fact'leri, Key fact / Form field / Multi-chip yapisi. Faz 7 rol edit formlari hazirligi
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const skip = /^(Ticker|Navigation|Footer)/;
function dump(n, depth, max, out, ind) {
  if (depth > max) return; let extra = '';
  if (n.type === 'TEXT') extra = ' "' + String(n.characters).slice(0, 40).replace(/\n/g, ' ') + '"';
  if (n.type === 'INSTANCE') { try { const cp = n.componentProperties; const ks = Object.keys(cp).map(k => k.replace(/#.*/, '') + '=' + cp[k].value); if (ks.length) extra = ' {' + ks.join(',') + '}'; } catch (e) {} }
  const lm = n.layoutMode && n.layoutMode !== 'NONE' ? ' ' + n.layoutMode[0] + (n.layoutWrap === 'WRAP' ? 'W' : '') : '';
  out.push(ind + n.name + ' [' + n.type.slice(0, 4) + '] ' + R(n.width) + 'x' + R(n.height) + lm + extra + (n.visible === false ? ' (hidden)' : ''));
  if (n.children && !(n.type === 'INSTANCE' && depth >= 3)) for (const c of n.children) { if (depth === 0 && skip.test(c.name)) { out.push(ind + '  ' + c.name + ' (atlandi)'); continue; } dump(c, depth + 1, max, out, ind + '  '); }
}
const defs = set => Object.keys(set.componentPropertyDefinitions).map(k => k.replace(/#.*/, '') + '(' + (set.componentPropertyDefinitions[k].variantOptions ? set.componentPropertyDefinitions[k].variantOptions.join('|') : set.componentPropertyDefinitions[k].type) + ')').join(', ');
const plats = {}, own = {}, prof = {};
for (const pl of ['Web', 'Mobile']) { plats[pl] = p02.children.find(n => n.type === 'SECTION' && n.name === pl); own[pl] = plats[pl].children.find(n => n.type === 'SECTION' && /^Own profile/.test(n.name)); prof[pl] = plats[pl].children.find(n => n.type === 'SECTION' && /Profiles · other roles/.test(n.name)); }
await step('Own profile ve rol profili Section listesi', async () => {
  const out = [];
  for (const pl of ['Web', 'Mobile']) for (const [lab, s] of [['own', own[pl]], ['roles', prof[pl]]]) { if (!s) { out.push(pl + ' ' + lab + ': yok'); continue; } out.push(pl + ' ' + lab + ' Section "' + s.name + '" ' + R(s.x) + ',' + R(s.y) + ' ' + R(s.width) + 'x' + R(s.height)); for (const c of s.children) out.push('   ' + c.type.slice(0, 4) + ' ' + c.name + ' @' + R(c.x) + ',' + R(c.y) + ' ' + R(c.width) + 'x' + R(c.height)); }
  report.info.sections = out;
});
await step('Edit details formu (masaustu)', async () => {
  const f = own.Web.children.find(c => c.type === 'FRAME' && /Edit details/.test(c.name) && !/Career|row/i.test(c.name)); if (!f) throw new Error('Edit details ekrani yok'); const out = []; dump(f, 0, 6, out, ''); report.info.editDetailsDesktop = [f.name].concat(out);
});
await step('Edit details formu (mobil)', async () => {
  const f = own.Mobile.children.find(c => c.type === 'FRAME' && /Edit details/.test(c.name) && !/Career|row/i.test(c.name)); if (!f) throw new Error('mobil Edit details yok'); const hero = f.findOne(n => /^Hero/.test(n.name)); const form = f.findOne(n => n.name === 'Details form'); const out = []; if (form) dump(form, 0, 4, out, ''); report.info.editDetailsMobile = [f.name + ' ' + R(f.width) + 'x' + R(f.height) + ' hero ' + (hero ? R(hero.height) : '-')].concat(out);
});
await step('Career row formu (masaustu)', async () => {
  const f = own.Web.children.find(c => c.type === 'FRAME' && /Career/.test(c.name)); if (!f) throw new Error('Career edit ekrani yok'); const form = f.findOne(n => n.name === 'Career row form'); const out = []; if (form) dump(form, 0, 4, out, ''); report.info.careerForm = [f.name + ' ' + R(f.width) + 'x' + R(f.height)].concat(out);
});
await step('Rol profili hero ve key facts', async () => {
  const out = [];
  for (const pl of ['Web', 'Mobile']) for (const role of ['Manager', 'Referee', 'Intermediary']) { const f = prof[pl] && prof[pl].findOne(n => n.type === 'FRAME' && new RegExp('^Profiles / ' + role + ' · ').test(n.name) && n.parent === prof[pl]) || (prof[pl] && prof[pl].children.find(c => c.type === 'FRAME' && c.name.indexOf(role) >= 0 && !/Directory/.test(c.name))); if (!f) { out.push(pl + ' ' + role + ': profil yok'); continue; } const kf = f.findOne(n => n.name === 'Key facts'); out.push(pl + ' ' + role + ' ' + f.name + ' ' + R(f.width) + 'x' + R(f.height) + ' | Key facts: ' + (kf ? kf.children.map(c => c.name + ' ' + R(c.width) + 'x' + R(c.height) + '[' + c.findAll(t => t.type === 'TEXT').map(t => t.characters).join('/') + ']').join(' ; ') : 'yok')); }
  report.info.roleKeyFacts = out;
});
await step('Component tanimlari', async () => {
  const out = [];
  for (const nm of ['Key fact', 'Form field', 'Multi-chip', 'Option list', 'Edit button', 'Checkbox']) { const c = p01.findOne(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && n.name === nm); out.push(nm + ': ' + (c ? (c.type === 'COMPONENT_SET' ? c.children.length + ' var · ' + defs(c) : R(c.width) + 'x' + R(c.height)) : 'yok')); }
  const lists = p01.findAll(n => n.type === 'COMPONENT_SET' && n.name === 'Option list'); if (lists[0]) out.push('Option list kinds: ' + Array.from(new Set(lists[0].children.map(v => v.name))).join(' | '));
  report.info.componentDefs = out;
});
return JSON.stringify(report, null, 1);
