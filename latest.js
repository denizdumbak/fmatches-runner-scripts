// step 342 · INSPECT (salt okunur, değişiklik yok): kulüp kartı ekranı için stadyum hero ayrıntısı, Players sekmesi gövdesi, Event location card, Link row, Club crest
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const sz = n => Math.round(n.width) + 'x' + Math.round(n.height);
const lay = n => ('layoutMode' in n && n.layoutMode !== 'NONE') ? n.layoutMode[0] + '/' + n.layoutSizingHorizontal[0] + n.layoutSizingVertical[0] + ' g' + (typeof n.itemSpacing === 'number' ? n.itemSpacing : '?') : '-';
async function vname(id) { try { const v = await figma.variables.getVariableByIdAsync(id); return v ? v.name : '?'; } catch (e) { return '?'; } }
async function fillOf(n) { try { if (!('fills' in n) || typeof n.fills === 'symbol' || !n.fills.length) return ''; const f = n.fills[0]; if (f.type !== 'SOLID') return f.type + (f.opacity !== undefined && f.opacity < 1 ? '@' + f.opacity : ''); const b = f.boundVariables && f.boundVariables.color; return b ? await vname(b.id) : 'raw'; } catch (e) { return '?'; } }
async function dump(n, maxD, cap) {
  const out = [];
  async function walk(x, d, pre) {
    if (d > maxD) return; let extra = '';
    if (x.type === 'TEXT') { let st = ''; try { const s = typeof x.textStyleId === 'string' && x.textStyleId ? await figma.getStyleByIdAsync(x.textStyleId) : null; st = s ? s.name : ''; } catch (e) {} extra = ' "' + x.characters.slice(0, 36) + '" ' + st; }
    else { const f = await fillOf(x); if (f) extra += ' fill:' + f; if ('cornerRadius' in x && typeof x.cornerRadius === 'number' && x.cornerRadius) extra += ' r' + x.cornerRadius; if ('paddingTop' in x && x.layoutMode !== 'NONE') extra += ' pad ' + [x.paddingTop, x.paddingRight, x.paddingBottom, x.paddingLeft].join('/'); if (x.type === 'INSTANCE') { const m = await x.getMainComponentAsync(); extra += ' <' + (m ? (m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent.name : m.name) : '?') + '>'; } }
    if ('layoutPositioning' in x && x.layoutPositioning === 'ABSOLUTE') extra += ' ABS@' + Math.round(x.x) + ',' + Math.round(x.y);
    if ('opacity' in x && x.opacity < 1) extra += ' op' + x.opacity;
    out.push(pre + x.name + ' [' + x.type + ' ' + sz(x) + ' ' + lay(x) + ']' + extra);
    if ('children' in x && (x.type !== 'INSTANCE' || d === 0)) for (const c of x.children) await walk(c, d + 1, pre + ' ');
  }
  await walk(n, 0, ''); return out.slice(0, cap || 60);
}
const sets = p01.findAll(n => n.type === 'COMPONENT_SET' || (n.type === 'COMPONENT' && n.parent && n.parent.type !== 'COMPONENT_SET'));
const byName = nm => sets.find(n => n.name === nm);
const props = s => s.type === 'COMPONENT_SET' ? Object.entries(s.variantGroupProperties || {}).map(([k, v]) => k + ':' + v.values.join('|')).join('; ') : 'single';

await step('Stadyum hero (padding, görsel, ayrıntı)', async () => {
  const sec = web.children.find(n => n.type === 'SECTION' && n.name === 'Stadium card');
  const f = sec.children.find(n => n.type === 'FRAME' && /Stadium card · Desktop$/.test(n.name));
  const hero = f.findOne(n => n.name === 'Hero · stadium identity');
  report.info.heroDesktop = await dump(hero, 3, 40);
  const body = f.findOne(n => n.name === 'Profile body');
  report.info.bodyDesktop = await dump(body, 3, 40);
});
await step('Tenants başlık ve satır', async () => {
  const sec = web.children.find(n => n.type === 'SECTION' && n.name === 'Stadium card');
  const f = sec.children.find(n => n.type === 'FRAME' && /Stadium card · Desktop$/.test(n.name));
  const t = f.findOne(n => n.name === 'Tenants'); report.info.tenants = await dump(t, 3, 30);
});
await step('Players sekmesi gövdesi (masaüstü)', async () => {
  const sec = web.children.find(n => n.type === 'SECTION' && n.name === 'Search results');
  const f = sec.children.find(n => n.type === 'FRAME' && /Players · Desktop$/.test(n.name));
  const out = [];
  const main = f.findOne(n => /Results|Result list|Content/i.test(n.name) && n.type === 'FRAME');
  report.info.playersFrameChildren = f.children.map(c => c.name + ' ' + sz(c));
  const rows = f.findAll(n => n.type === 'INSTANCE'); let r0 = null; for (const n of rows) { const m = await n.getMainComponentAsync(); if (m && m.parent && m.parent.name === 'Player result') { r0 = n; break; } }
  if (r0) { report.info.playerResultInPage = await dump(r0, 3, 35); const th = f.findOne(n => n.name === 'Table header'); if (th) report.info.tableHeader = await dump(th, 2, 12); report.info.resultsContainer = (function (n) { const c = []; for (let p = r0.parent; p && p !== f; p = p.parent) c.push(p.name + ' ' + sz(p) + ' ' + lay(p)); return c; })(r0); }
});
await step('Event location card, Link row, Club crest, Key fact', async () => {
  for (const nm of ['Event location card', 'Link row', 'Club crest', 'Key fact', 'Facility result']) {
    const s = byName(nm); if (!s) { report.info[nm] = 'yok'; continue; }
    const v = s.type === 'COMPONENT_SET' ? s.children[0] : s; report.info[nm] = [props(s) + ' | ilk varyant: ' + v.name].concat(await dump(v, 2, 14));
  }
});
return report;
