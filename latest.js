// step 283 · READ-ONLY inspect for Phase 5 (My contacts, My settings, Notifications, Shortlists): reusable components, Account menu rows, Section layout on 02, existing pages/links related to Phase 5. Changes nothing.
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/); await p01.loadAsync();
const p02 = pageOf(/^02/); await p02.loadAsync();
const BB = n => n.absoluteBoundingBox;
const sz = n => Math.round(n.width) + 'x' + Math.round(n.height);
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';

await step('01 sections', async () => {
  report.info.sections01 = p01.children.filter(n => n.type === 'SECTION').map(s => s.name + ' @' + Math.round(s.x) + ' ' + sz(s));
});

await step('wanted components', async () => {
  const wanted = /^(Person row|Chat list item|Application status|Filter chip|Empty card|Page notice|Form field|Checkbox|Tag|Button|Avatar|Silhouette|Switch|Toggle|Radio|Option row|Option list|Event row|Tab|Confirm dialog|Icon button|Menu row|Account menu|Header|Notification.*|Contact.*|Shortlist.*|Setting.*|Section header|Stat card|Key fact|Club crest|Flag|Verification badge)$/;
  const found = {};
  for (const n of p01.findAll(x => (x.type === 'COMPONENT_SET' || x.type === 'COMPONENT') && !(x.parent && x.parent.type === 'COMPONENT_SET'))) {
    if (!wanted.test(n.name)) continue;
    let props = '';
    if (n.type === 'COMPONENT_SET') { const d = n.componentPropertyDefinitions; props = Object.keys(d).map(k => k + '[' + (d[k].variantOptions ? d[k].variantOptions.join('|') : d[k].type) + ']').join(' ; '); }
    found[n.name] = (n.type === 'COMPONENT_SET' ? n.children.length + ' var ' : 'single ') + sz(n) + (props ? ' · ' + props : '');
  }
  report.info.components = found;
  report.info.missingFromWanted = ['Person row', 'Chat list item', 'Application status', 'Filter chip', 'Empty card', 'Page notice', 'Form field', 'Checkbox', 'Tag', 'Button', 'Avatar', 'Silhouette', 'Switch', 'Toggle', 'Radio', 'Event row', 'Tab', 'Confirm dialog'].filter(k => !found[k]);
  // anything with these words in the name, even if not exact
  const loose = [];
  for (const n of p01.findAll(x => x.type === 'COMPONENT_SET' || (x.type === 'COMPONENT' && !(x.parent && x.parent.type === 'COMPONENT_SET')))) if (/switch|toggle|radio|notif|contact|shortlist|setting|banner|notice|badge|segment|tab/i.test(n.name)) loose.push(n.name + ' (' + n.type.toLowerCase() + ', ' + sz(n) + ')');
  report.info.looseMatches = loose;
});

await step('Account menu rows', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Account menu');
  if (!set) { report.info.accountMenu = 'not found'; return; }
  const out = {};
  for (const v of set.children) out[v.name] = sz(v) + ' rows: ' + v.findAll(n => /^Row ·/.test(n.name)).map(r => r.name.replace('Row · ', '')).join(', ');
  report.info.accountMenu = out;
});

await step('Header: bell / messages / account', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Header');
  if (!set) { report.info.header = 'not found'; return; }
  report.info.headerVariants = set.children.map(v => v.name + ' ' + sz(v));
  const v = set.children.find(c => /Account|Player|Logged|Signed/i.test(c.name)) || set.children[0];
  report.info.headerTree = v.findAll(n => /Account actions|Header actions|Icon button|Notification|Bell|Messages/i.test(n.name)).slice(0, 14).map(n => n.type + ' · ' + n.name + ' ' + sz(n));
});

await step('02 layout', async () => {
  const out = {};
  for (const root of p02.children.filter(n => n.name === 'Web' || n.name === 'Mobile')) {
    out[root.name] = 'SECTION @' + Math.round(root.x) + ',' + Math.round(root.y) + ' ' + sz(root) + ' :: ' + root.children.filter(c => c.type === 'SECTION').map(s => s.name + ' @' + Math.round(s.x) + ',' + Math.round(s.y) + ' ' + sz(s)).join(' | ');
  }
  report.info.layout02 = out;
});

await step('Events sections detail (placement reference)', async () => {
  for (const root of p02.children.filter(n => n.name === 'Web' || n.name === 'Mobile')) {
    const ev = root.children.find(c => c.type === 'SECTION' && /Events/.test(c.name));
    if (!ev) continue;
    report.info['events' + root.name] = ev.children.filter(c => c.type === 'FRAME').map(f => f.name + ' @' + Math.round(f.x) + ',' + Math.round(f.y) + ' ' + sz(f)).slice(0, 8);
  }
});

await step('existing pages that mention Phase 5 topics', async () => {
  const hit = [];
  for (const f of p02.findAll(n => n.type === 'FRAME' && /contact|setting|notif|shortlist/i.test(n.name))) hit.push(f.name + ' ' + sz(f));
  report.info.pagesByName = hit.slice(0, 30);
  // text labels on pages that point to Phase 5 destinations, with their link state
  const labels = {};
  for (const t of p02.findAll(n => n.type === 'TEXT' && /^(My contacts|Contacts|My settings|Settings|Notifications|Shortlists?|Add to shortlist|Add to contacts|Message|Blocked users|Privacy)$/i.test(n.characters.trim()))) {
    const k = t.characters.trim();
    let linked = false, cur = t;
    for (let i = 0; i < 4 && cur && !linked; i++) { if ('reactions' in cur && cur.reactions && cur.reactions.some(r => (r.actions || []).some(isNavAct))) linked = true; cur = cur.parent; }
    labels[k] = labels[k] || { count: 0, linked: 0 };
    labels[k].count++; if (linked) labels[k].linked++;
  }
  report.info.labelLinkState = labels;
});

await step('Page notice / Empty card usage and the Notifications bell', async () => {
  const insts = p02.findAll(n => n.type === 'INSTANCE' && /Page notice|Empty card/.test(n.name));
  const byName = {}; for (const i of insts) byName[i.name] = (byName[i.name] || 0) + 1;
  report.info.noticeInstances = byName;
  const bells = p02.findAll(n => /Icon button · Notif|Notifications/.test(n.name) && n.type !== 'TEXT');
  report.info.bellNodes = bells.length + ' (first: ' + (bells[0] ? bells[0].name + ' parent ' + bells[0].parent.name : '-') + ')';
});

await step('Person row / Chat list item structure', async () => {
  for (const nm of ['Person row', 'Chat list item', 'Application status', 'Filter chip']) {
    const set = p01.findOne(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && n.name === nm);
    if (!set) continue;
    const v = set.type === 'COMPONENT_SET' ? set.children[0] : set;
    report.info['tree · ' + nm] = v.name + ' ' + sz(v) + ' :: ' + v.findAll(() => true).slice(0, 14).map(n => n.name + '(' + n.type.toLowerCase() + ')').join(' > ');
  }
});

await step('prototype state', async () => {
  report.info.flowStarts = p02.flowStartingPoints.length;
});

return report;
