// step 280 · read-only inspect before Faz 4 prototype links + Account menu "My events" row (Account menu / Menu row component trees, where Account menu instances live, Events pages' clickable layer names, Home Event rows)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/); await p01.loadAsync();
const p02 = pageOf(/^02/); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const web = p02.children.find(n => n.name === 'Web'), mob = p02.children.find(n => n.name === 'Mobile');
const bb = n => { const b = n.absoluteBoundingBox; return b ? Math.round(b.x) + ',' + Math.round(b.y) + ' ' + Math.round(b.width) + 'x' + Math.round(b.height) : '-'; };
function tree(n, depth, max, out, pre) {
  out.push(pre + n.type[0] + ' ' + n.name + (n.type === 'TEXT' ? ' "' + String(n.characters).slice(0, 40) + '"' : '') + ' [' + Math.round(n.width) + 'x' + Math.round(n.height) + ']' + (n.visible === false ? ' (hidden)' : '') + ((n.reactions && n.reactions.length) ? ' ⚡' + n.reactions.length : ''));
  if (depth < max && 'children' in n) for (const c of n.children) tree(c, depth + 1, max, out, pre + '  ');
}

await step('Account menu + Menu row components (01)', async () => {
  await figma.setCurrentPageAsync(p01);
  const comps = p01.findAll(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && /^(Account menu|Menu row)/.test(n.name) && !(n.parent && n.parent.type === 'COMPONENT_SET'));
  report.info.accountComps = comps.map(c => c.type + ' ' + c.name + ' @' + bb(c));
  for (const c of comps) {
    const out = []; const first = c.type === 'COMPONENT_SET' ? c.children.slice(0, 2) : [c];
    for (const f of first) tree(f, 0, 3, out, '');
    report.info['tree · ' + c.name] = out;
    if (c.type === 'COMPONENT_SET') report.info['variants · ' + c.name] = c.children.map(v => v.name);
  }
  await figma.setCurrentPageAsync(p02);
});

await step('Account menu instances on 02', async () => {
  const inst = p02.findAll(n => n.type === 'INSTANCE' && /^Account menu/.test(n.name));
  report.info.accountMenuInstances = inst.length;
  report.info.accountMenuPages = inst.slice(0, 20).map(i => { let p = i; while (p.parent && p.parent.type !== 'SECTION' && p.parent.type !== 'PAGE') p = p.parent; return p.name + ' (' + bb(i) + ')'; });
  const rows = [];
  for (const i of inst.slice(0, 1)) { const t = []; tree(i, 0, 3, t, ''); rows.push(...t); }
  report.info.firstAccountMenuTree = rows;
});

await step('Account menu open state pages (names containing menu)', async () => {
  const fr = p02.findAll(n => n.type === 'FRAME' && n.parent && n.parent.type === 'SECTION' && /menu/i.test(n.name));
  report.info.menuPages = fr.map(f => f.name + ' @' + bb(f));
});

await step('Events pages: frames and clickable layers', async () => {
  for (const [label, root] of [['Web', web], ['Mobile', mob]]) {
    const sec = root.findOne(n => n.type === 'SECTION' && n.name === 'Events');
    if (!sec) { report.errors.push('Events section missing on ' + label); continue; }
    const frames = sec.children.filter(c => c.type === 'FRAME');
    report.info[label + ' Events frames'] = frames.map(f => f.name + ' @' + bb(f));
    for (const f of frames) {
      const hits = f.findAll(n => /^(Button|Icon button|Row|Link|Tab|Chip|Filter chip|Event row|Menu row|Menu link|Person|Event|Create|Edit|Done|Cancel|Send)/.test(n.name) || (n.type === 'INSTANCE' && /^(Button|Event row|Filter chip)/.test(n.name)));
      report.info[label + ' · ' + f.name] = hits.slice(0, 40).map(h => h.type[0] + ' ' + h.name + (h.type === 'TEXT' ? '' : (function () { const t = 'findOne' in h ? h.findOne(x => x.type === 'TEXT') : null; return t ? ' "' + String(t.characters).slice(0, 30) + '"' : ''; })()));
    }
  }
});

await step('Home: Event rows and Navigation menu layer names', async () => {
  const home = p02.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · Desktop') || p02.findOne(n => n.type === 'FRAME' && /^Home/.test(n.name));
  if (!home) { report.errors.push('Home frame missing'); return; }
  report.info.homeFrame = home.name;
  const rows = home.findAll(n => /^Event row/.test(n.name));
  report.info.homeEventRows = rows.map(r => r.name + ' @' + bb(r) + ' ⚡' + (r.reactions ? r.reactions.length : 0));
  const hdr = home.findOne(n => /^Header/.test(n.name) || /^Navigation/.test(n.name));
  if (hdr) { const t = []; tree(hdr, 0, 3, t, ''); report.info.homeHeaderTree = t.slice(0, 40); }
});

await step('Existing flow starts', async () => {
  report.info.flowStarts = p02.flowStartingPoints.map(f => f.name);
});

return report;
