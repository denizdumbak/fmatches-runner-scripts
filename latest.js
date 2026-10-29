// step 250 · READ-ONLY inspect: which Navigation instances show something other than "EN" in the language slot (Desktop Logged in), where "LM" appears in headers, and the text node ids in the Header main component (no changes)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const R = n => Math.round(n * 10) / 10;
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
const subOf = n => { let p = n; while (p && p.parent && p.parent.type !== 'SECTION') p = p.parent; return p && p.parent ? p.parent.name : '?'; };
const pageNameOf = n => { let p = n; while (p && p.parent && p.parent.type !== 'SECTION') p = p.parent; return p ? p.name : '?'; };

await step('header main texts', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Header');
  const out = [];
  for (const v of set.children) {
    const holder = v.findOne(n => n.name === 'Account actions' || n.name === 'Header actions');
    const texts = v.findAll(n => n.type === 'TEXT' && /^(EN|Initials|Count)$/.test(n.name));
    out.push(v.name + ' | ' + texts.map(t => t.name + '="' + t.characters + '" id=' + t.id).join(' ; ') + (holder ? ' | holder children: ' + holder.children.map(c => c.name).join(', ') : ''));
  }
  report.info.headerMain = out;
});

await step('scan Navigation instances', async () => {
  const rows = [], enBad = [], lmAll = [];
  for (const label of ['Web', 'Mobile']) {
    const plat = p02.children.find(n => n.name === label);
    const navs = plat.findAll(n => n.type === 'INSTANCE' && /^Navigation/.test(n.name));
    for (const nav of navs) {
      const holder = nav.findOne(n => n.name === 'Account actions' || n.name === 'Header actions');
      if (!holder) continue;
      const first = holder.children[0];
      const lang = label === 'Web' && first && first.type === 'TEXT' ? first : null;
      const init = nav.findOne(n => n.type === 'TEXT' && n.name === 'Initials');
      const cnts = nav.findAll(n => n.type === 'TEXT' && n.name === 'Count').map(t => t.characters);
      const tag = label + ' › ' + subOf(nav) + ' › ' + pageNameOf(nav);
      if (lang && lang.characters !== 'EN') enBad.push(tag + ' | lang slot shows "' + lang.characters + '" (name=' + lang.name + ', id=' + lang.id + ') | Initials="' + (init ? init.characters : '-') + '" id=' + (init ? init.id : '-') + ' | holder: ' + holder.children.map(c => c.name).join(', '));
      if ((lang && lang.characters === 'LM') || (init && init.characters === 'LM')) lmAll.push(tag + ' | lang=' + (lang ? lang.characters : '-') + ' init=' + (init ? init.characters : '-') + ' counts=' + cnts.join('/'));
    }
  }
  report.info.langSlotNotEN = enBad;
  report.info.lmHeaders = lmAll.slice(0, 40);
  report.info.langSlotNotENCount = enBad.length;
});

await step('Log in section pages with logged-in header', async () => {
  const web = p02.children.find(n => n.name === 'Web');
  const sec = web.children.find(n => n.name === 'Log in');
  const out = [];
  for (const pg of sec.children) {
    if (pg.type !== 'FRAME') continue;
    const nav = pg.findOne(n => n.type === 'INSTANCE' && /^Navigation/.test(n.name));
    if (!nav) continue;
    const holder = nav.findOne(n => n.name === 'Account actions');
    out.push(pg.name + ' | ' + (holder ? holder.children.map(c => c.type === 'TEXT' ? 'T"' + c.characters + '"' : c.name).join(', ') : 'no holder (logged out)'));
  }
  report.info.loginPages = out;
});

return report;
