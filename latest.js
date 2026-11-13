// step 393 · INSPECT (salt okunur): giris yapmamis (visitor) arama hali icin Header/Navigation/Ticker durumlari, Player result Action dugmesi, Club result ic yapisi (takim sayisi var mi)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const sWeb = web.children.find(n => n.type === 'SECTION' && n.name === 'Search results');
function dump(n, depth, max, out, ind) {
  if (depth > max) return; let extra = '';
  if (n.type === 'TEXT') extra = ' "' + String(n.characters).slice(0, 50).replace(/\n/g, ' ') + '"';
  if (n.type === 'INSTANCE') { try { const cp = n.componentProperties; const ks = Object.keys(cp).map(k => k.replace(/#.*/, '') + '=' + cp[k].value); if (ks.length) extra = ' {' + ks.join(',') + '}'; } catch (e) {} }
  out.push(ind + n.name + ' [' + n.type.slice(0, 4) + '] ' + R(n.width) + 'x' + R(n.height) + extra + (n.visible === false ? ' (hidden)' : ''));
  if (n.children && !(n.type === 'INSTANCE' && depth >= 2)) for (const c of n.children) dump(c, depth + 1, max, out, ind + '  ');
}
const defs = set => Object.keys(set.componentPropertyDefinitions).map(k => k.replace(/#.*/, '') + '(' + (set.componentPropertyDefinitions[k].variantOptions ? set.componentPropertyDefinitions[k].variantOptions.join('|') : set.componentPropertyDefinitions[k].type) + ')').join(', ');
await step('Header/Navigation/Ticker setleri', async () => {
  const out = [];
  for (const re of [/^Header/, /^Navigation/, /^Ticker/, /^Account menu/]) { for (const c of p01.findAll(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name) && !(n.parent && n.parent.type === 'COMPONENT_SET'))) out.push(c.name + ' [' + c.type + '] ' + (c.type === 'COMPONENT_SET' ? c.children.length + ' var · ' + defs(c) : R(c.width) + 'x' + R(c.height)) + ' · parent ' + (c.parent && c.parent.name)); }
  report.info.headerSets = out;
});
await step('Players ekraninda Navigation ve Ticker', async () => {
  const f = sWeb.children.find(c => c.name === 'Search / Players · Desktop'); const out = [];
  for (const nm of ['Ticker', 'Navigation']) { const n = f.children.find(c => c.name === nm || new RegExp('^' + nm).test(c.name)); if (n) dump(n, 0, 3, out, ''); else out.push(nm + ' yok'); }
  report.info.playersTopBars = out;
});
await step('Button ve Player result Action dugmesi', async () => {
  const b = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Button'); report.info.buttonDefs = b ? defs(b) : 'Button set yok';
  const ps = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Player result'); const v = ps.children.find(x => x.name === 'Device=Desktop, Action=Add to contacts, State=Default'); const out = []; dump(v.findOne(n => n.name === 'Actions'), 0, 3, out, '');
  report.info.addToContactsActions = out; report.info.playerResultDefs = defs(ps);
});
await step('Club result ic yapisi', async () => {
  const cs = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Club result'); const out = []; dump(cs.children[0], 0, 4, out, ''); report.info.clubResult = [cs.children[0].name].concat(out);
  const f = sWeb.children.find(c => c.name === 'Search / Clubs · Desktop'); const rows = f.findAll(n => n.type === 'INSTANCE' && /^Club ·/.test(n.name)); report.info.clubRowTexts = rows.map(r => r.name + ': ' + r.findAll(t => t.type === 'TEXT' && t.visible).map(t => t.characters).join(' | '));
  const all = sWeb.children.find(c => c.name === 'Search / All results · Desktop'); const r2 = all.findAll(n => n.type === 'INSTANCE' && /^Club ·/.test(n.name)); report.info.allClubRowTexts = r2.map(r => r.findAll(t => t.type === 'TEXT' && t.visible).map(t => t.characters).join(' | '));
});
await step('Header visitor ornegi (Home)', async () => {
  const home = web.findOne(n => n.type === 'FRAME' && /^Home \/ Main/.test(n.name)); const out = []; if (home) { const nav = home.findOne(n => n.type === 'INSTANCE' && /^Navigation/.test(n.name)); if (nav) dump(nav, 0, 2, out, ''); else out.push('Navigation instance yok'); const tk = home.findOne(n => n.type === 'INSTANCE' && /^Ticker/.test(n.name)); if (tk) { const cp = tk.componentProperties; out.push('Ticker ' + Object.keys(cp).map(k => k + '=' + cp[k].value).join(',')); } } else out.push('Home yok');
  report.info.homeNav = out;
});
return JSON.stringify(report, null, 1);
