// step 255 · READ-ONLY inspect for messenger + profile prototype links: Messenger page list, click targets per page, dialog buttons, flow starts, existing reactions (no changes)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const R = n => Math.round(n * 10) / 10;
const p02 = pageOf(/^02/); await p02.loadAsync();
const web = p02.children.find(n => n.name === 'Web'), mob = p02.children.find(n => n.name === 'Mobile');
const msg = web.children.find(n => n.name === 'Messenger');
const hasNav = n => 'reactions' in n && n.reactions && n.reactions.some(r => (r.actions || []).some(a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO'));
const short = (n, root) => { const a = n.absoluteBoundingBox, b = root.absoluteBoundingBox; return n.type[0] + ':' + n.name + ' @' + R(a.x - b.x) + ',' + R(a.y - b.y) + ' ' + R(a.width) + 'x' + R(a.height) + (hasNav(n) ? ' [has nav]' : ''); };

await step('Messenger pages', async () => {
  report.info.messengerPages = msg.children.filter(c => c.type === 'FRAME').map(c => c.name + ' ' + R(c.width) + 'x' + R(c.height) + ' @' + R(c.x) + ',' + R(c.y));
});

await step('click targets per Messenger page', async () => {
  const out = {};
  for (const pg of msg.children) {
    if (pg.type !== 'FRAME') continue;
    const rows = [];
    for (const n of pg.findAll(x => x.type === 'INSTANCE')) {
      if (/^(Chat list item|Icon button · (More|New message|Back|Attach|Send|Messages|Notifications)|Row · |Button · |Person row|Message bubble|Thread header|Thread menu|Message menu|Confirm dialog|Composer)/.test(n.name)) rows.push(short(n, pg));
    }
    out[pg.name] = rows.slice(0, 26);
  }
  report.info.targets = out;
});

await step('chat list items and states', async () => {
  const pg = msg.children.find(c => /^Messenger \/ Default/.test(c.name)) || msg.children.find(c => c.type === 'FRAME');
  report.info.defaultPage = pg.name;
  report.info.chatItems = pg.findAll(n => n.type === 'INSTANCE' && /^Chat list item/.test(n.name)).map(n => n.name + ' | ' + JSON.stringify(Object.fromEntries(Object.entries(n.componentProperties).map(([k, v]) => [k.replace(/#.*/, ''), v.value]))) + ' | ' + n.findAll(t => t.type === 'TEXT').slice(0, 2).map(t => t.characters).join(' / '));
});

await step('profile pages: Message button and header icon', async () => {
  const out = [];
  for (const [label, root] of [['Web', web], ['Mobile', mob]]) {
    const sec = root.children.find(n => n.name === 'Profiles · player'); if (!sec) continue;
    for (const pg of sec.children) {
      if (pg.type !== 'FRAME') continue;
      const m = pg.findAll(n => n.type === 'INSTANCE' && (n.name === 'Button · Message' || n.name === 'Icon button · Messages' || n.name === 'Icon button · More'));
      out.push(label + ' › ' + pg.name + ' | ' + m.map(n => n.name + (hasNav(n) ? '[nav]' : '')).join(', '));
    }
  }
  report.info.profilePlayerPages = out;
});

await step('flow starts', async () => {
  report.info.flowStarts = p02.flowStartingPoints.map(f => f.name + ' -> ' + f.nodeId);
});

await step('Messages header icon reactions', async () => {
  let withNav = 0, total = 0;
  for (const root of [web, mob]) for (const n of root.findAll(x => x.type === 'INSTANCE' && x.name === 'Icon button · Messages')) { total++; if (hasNav(n)) withNav++; }
  report.info.messagesIcons = { total, withNav };
});

return report;
