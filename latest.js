// step 356 · Team list open düzeltmesi: menü genişliği alan genişliğine eşitlenir (instance detach), artan Riverside metninin yeri raporlanır
const report = { done: [], errors: [], info: { dimsMissing: [] } };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const sz = n => Math.round(n.width) + 'x' + Math.round(n.height);
const sets = p01.findAll(n => n.type === 'COMPONENT_SET' || (n.type === 'COMPONENT' && n.parent && n.parent.type !== 'COMPONENT_SET'));
const variantOf = (nm, re) => { const s = sets.find(n => n.name === nm); if (!s) throw new Error('component yok: ' + nm); const v = s.type === 'COMPONENT_SET' ? s.children.find(c => re.test(c.name)) : s; if (!v) throw new Error('varyant yok: ' + nm + ' ' + re); return v; };
const sWeb = web.children.find(n => n.type === 'SECTION' && n.name === 'Club card'), sMob = mob.children.find(n => n.type === 'SECTION' && n.name === 'Club card'); if (!sWeb || !sMob) throw new Error('Club card Section yok');
const fdFull = sWeb.children.find(n => n.type === 'FRAME' && /Club card · Desktop$/.test(n.name)), fmFull = sMob.children.find(n => n.type === 'FRAME' && /Club card · Mobile$/.test(n.name));
if (!fdFull || !fmFull) throw new Error('Full frame yok');
async function loadFor(t) { const fs = t.getRangeAllFontNames(0, Math.max(1, t.characters.length)); for (const f of fs) await figma.loadFontAsync(f); }
async function setT(root, name, str, nth) { const t = root.findAll(n => n.type === 'TEXT' && n.name === name)[nth || 0]; if (!t) throw new Error('metin yok: ' + name + ' in ' + root.name + ' (var: ' + root.findAll(n => n.type === 'TEXT').slice(0, 8).map(n => n.name).join(',') + ')'); await loadFor(t); t.characters = str; return t; }
const fill = n => { n.layoutSizingHorizontal = 'FILL'; };
const out = {};
for (const dev of ['Desktop', 'Mobile']) {
  await step(dev + ' menü genişliği', async () => {
    const s = dev === 'Mobile' ? sMob : sWeb; const f = s.children.find(n => n.type === 'FRAME' && new RegExp('Team list open · ' + dev + '$').test(n.name)); if (!f) throw new Error('frame yok');
    const teams = f.findOne(n => n.name === 'Teams'); let ts = teams.children.find(c => c.name === 'Team select · Open'); if (!ts) throw new Error('Team select · Open yok (var: ' + teams.children.map(c => c.name).join(',') + ')');
    const before = { ts: sz(ts), type: ts.type };
    if (ts.type === 'INSTANCE') { const x = ts.x, y = ts.y; ts = ts.detachInstance(); ts.name = 'Team select · Open'; ts.layoutPositioning = 'ABSOLUTE'; ts.x = x; ts.y = y; }
    const menu = ts.findOne(n => n.name === 'Menu'); const mb0 = sz(menu);
    menu.resize(ts.width, menu.height);
    for (const r of menu.children) { try { r.layoutSizingHorizontal = 'FILL'; } catch (e) {} }
    const field = ts.findOne(n => n.name === 'Field');
    const mb = menu.absoluteBoundingBox, tb = teams.absoluteBoundingBox, fb = f.absoluteBoundingBox, fdb = field.absoluteBoundingBox;
    const left = []; for (const t of f.findAll(n => n.type === 'TEXT' && /Riverside|Third Division|Fifth Division/.test(n.characters))) left.push('"' + t.characters + '" in ' + (t.parent ? t.parent.name : '-') + ' > ' + (t.parent && t.parent.parent ? t.parent.parent.name : '-'));
    out[dev] = { before, after: sz(ts) + ' menu ' + mb0 + ' -> ' + sz(menu), menuMatchesField: Math.round(mb.x) === Math.round(fdb.x) && Math.round(mb.width) === Math.round(fdb.width), menuInsideTeams: mb.y + mb.height <= tb.y + tb.height + 1 && mb.x >= tb.x - 1 && mb.x + mb.width <= tb.x + tb.width + 1, menuInsideFrameX: mb.x >= fb.x && mb.x + mb.width <= fb.x + fb.width, rowWidths: menu.children.map(r => Math.round(r.width)).join(','), leftoverText: left };
  });
}
report.info.fix = out;
return report;
