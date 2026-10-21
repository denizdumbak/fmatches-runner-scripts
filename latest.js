// step 177 · SALT OKUNUR inspect: Header/Footer/Ticker varyantlari, Web ve Mobile Section yapisi, Home sayfasi iskeleti, metin stilleri (Signup ekranlari icin). Hicbir sey degismez.
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
const r = n => Math.round(n);
const hex = p => p && p.color ? '#' + [p.color.r, p.color.g, p.color.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('') : '-';
const sz = n => r(n.width) + 'x' + r(n.height);
const fillInfo = n => { try { return (n.fills || []).map(f => f.type === 'SOLID' ? hex(f) + (f.boundVariables && f.boundVariables.color ? ' var:' + f.boundVariables.color.id : '') : f.type).join(',') || 'none'; } catch (e) { return '?'; } };
const vars = await figma.variables.getLocalVariablesAsync(); const vname = {}; for (const v of vars) vname[v.id] = v.name;
const fillNamed = n => fillInfo(n).replace(/var:(\S+)/g, (m, id) => 'var:' + (vname[id] || id));

await step('sets', async () => {
  const out = {};
  for (const nm of ['Header', 'Footer', 'Ticker', 'Logo', 'Avatar']) {
    const s = p01.findOne(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && n.name === nm);
    if (!s) { out[nm] = 'missing'; continue; }
    out[nm] = s.type === 'COMPONENT_SET' ? { props: Object.keys(s.componentPropertyDefinitions).join(' | '), variants: s.children.map(c => c.name + ' ' + sz(c)).slice(0, 8) } : sz(s);
  }
  report.info.sets = out;
});

await step('sections', async () => {
  const out = [];
  for (const P_ of ['Web', 'Mobile']) {
    const ps = p02.children.find(n => n.type === 'SECTION' && n.name === P_);
    out.push(P_ + ' ' + sz(ps) + ' @' + r(ps.x) + ',' + r(ps.y) + ' · ' + ps.children.map(c => (c.type === 'SECTION' ? '[S] ' : '') + c.name + ' ' + sz(c) + ' @' + r(c.x) + ',' + r(c.y)).join(' | '));
  }
  report.info.platforms = out;
  report.info.topLevel = p02.children.map(c => c.type + ' ' + c.name + ' @' + r(c.x) + ',' + r(c.y)).slice(0, 12);
});

await step('home skeleton', async () => {
  const out = {};
  for (const D of ['Desktop', 'Mobile']) {
    const f = p02.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · ' + D);
    if (!f) { out[D] = 'missing'; continue; }
    out[D] = { size: sz(f), fill: fillNamed(f), mode: f.layoutMode, kids: f.children.map(c => c.type + ' ' + c.name + ' ' + sz(c) + ' fill ' + fillNamed(c)) };
    const nv = f.findOne(n => n.type === 'INSTANCE' && n.name === 'Navigation'); if (nv) { const m = await nv.getMainComponentAsync(); out[D].nav = (m ? m.name : '?') + ' ' + sz(nv); }
    const hd = f.findAll(n => n.type === 'INSTANCE').filter(n => /Header|Ticker|Footer/.test(n.name)).slice(0, 4);
    out[D].inst = [];
    for (const i of hd) { const m = await i.getMainComponentAsync(); out[D].inst.push(i.name + ' -> ' + (m ? m.name : '?') + ' ' + sz(i)); }
  }
  report.info.home = out;
});

await step('profile page (white body)', async () => {
  const f = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player / Own profile · Desktop');
  if (!f) return;
  report.info.ownDesktop = { size: sz(f), fill: fillNamed(f), kids: f.children.map(c => c.name + ' ' + sz(c) + ' fill ' + fillNamed(c)) };
  const body = f.findOne(n => n.name === 'Profile body');
  if (body) report.info.profileBody = { padding: [body.paddingTop, body.paddingRight, body.paddingBottom, body.paddingLeft].join('/'), fill: fillNamed(body), gap: body.itemSpacing };
});

await step('text styles', async () => {
  const ts = await figma.getLocalTextStylesAsync();
  report.info.textStyles = ts.filter(s => /^(Display|Heading|Body)/.test(s.name)).map(s => s.name + ' ' + s.fontSize + '/' + (s.lineHeight && s.lineHeight.value ? r(s.lineHeight.value) : 'auto')).join(' · ');
});

await step('home hero + nav buttons', async () => {
  const f = p02.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · Desktop');
  const btns = f.findAll(n => n.type === 'INSTANCE' && /^Button · (Log in|Sign up)/.test(n.name));
  report.info.navButtons = btns.map(b => b.name + ' reactions ' + (b.reactions ? b.reactions.length : 0));
  const own = p02.findOne(n => n.name === 'Flow · Entry · Own profile');
  report.info.entryArrowExample = own ? own.name + ' ' + sz(own) : 'none';
  report.info.flowStarts = (p02.flowStartingPoints || []).map(s => s.name).join(' | ');
});

return report;
