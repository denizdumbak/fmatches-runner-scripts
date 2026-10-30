// step 267 · read-only inspect for Events phase: reusable components, Web/Mobile section layout, Home upcoming-events and calendar structure
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const bb = n => { const b = n.absoluteBoundingBox; return b ? '(' + Math.round(b.x) + ',' + Math.round(b.y) + ' ' + Math.round(b.width) + 'x' + Math.round(b.height) + ')' : '-'; };
const kidsOf = n => ('children' in n ? n.children : []);
function tree(n, depth, max, out, pad) {
  out.push(pad + n.name + ' [' + n.type + '] ' + bb(n) + (n.type === 'INSTANCE' ? '' : ''));
  if (depth < max) for (const c of kidsOf(n)) tree(c, depth + 1, max, out, pad + '  ');
}
const want = /^(Event row|Calendar day|Tag|Filter chip|Form field|Option list|Date picker|Checkbox|Button|Link row|Key fact|Section header|Map marker|Map card|Avatar|Page notice|Empty card|Role icon|Stat card|Icon button|Silhouette|Club crest)$/;

await step('01 components', async () => {
  const p = pageOf(/^01/); await p.loadAsync();
  const out = [];
  for (const s of p.children) {
    if (s.type !== 'SECTION') continue;
    for (const c of s.children) {
      if ((c.type === 'COMPONENT_SET' || c.type === 'COMPONENT') && want.test(c.name)) {
        const n = c.type === 'COMPONENT_SET' ? c.children.length : 1;
        const props = c.type === 'COMPONENT_SET' ? Object.keys(c.componentPropertyDefinitions).join(', ') : '';
        out.push(s.name + ' > ' + c.name + ' ' + bb(c) + ' variants=' + n + (props ? ' props=[' + props + ']' : ''));
      }
    }
  }
  report.info.components = out;
});

await step('02 layout', async () => {
  const p = pageOf(/^02/); await p.loadAsync();
  const web = p.findOne(n => n.type === 'SECTION' && n.name === 'Web');
  const mob = p.findOne(n => n.type === 'SECTION' && n.name === 'Mobile');
  report.info.web = bb(web);
  report.info.mobile = bb(mob);
  report.info.webSections = web.children.map(c => c.name + ' [' + c.type + '] ' + bb(c) + ' kids=' + kidsOf(c).length);
  report.info.mobileSections = mob.children.map(c => c.name + ' [' + c.type + '] ' + bb(c) + ' kids=' + kidsOf(c).length);
});

await step('home upcoming events', async () => {
  const p = pageOf(/^02/); await p.loadAsync();
  const home = p.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · Desktop');
  if (!home) throw new Error('Home / Main · Desktop not found; frames: ' + p.findAll(n => n.type === 'FRAME' && /^Home/.test(n.name)).map(n => n.name).join(' | '));
  report.info.homeTop = kidsOf(home).map(c => c.name + ' ' + bb(c));
  const up = home.findOne(n => /upcoming events/i.test(n.name));
  const out = [];
  if (up) tree(up, 0, 3, out, ''); else out.push('no node named Upcoming events');
  report.info.upcoming = out;
});

await step('calendar view', async () => {
  const p = pageOf(/^02/); await p.loadAsync();
  const cal = p.findOne(n => n.type === 'FRAME' && /calendar/i.test(n.name) && /Home/.test(n.name));
  if (!cal) throw new Error('calendar frame not found');
  const out = [];
  tree(cal, 0, 1, out, '');
  report.info.calendarFrame = out;
});

await step('event row instance', async () => {
  const p = pageOf(/^02/); await p.loadAsync();
  const row = p.findOne(n => n.type === 'INSTANCE' && /^Event row/.test(n.name));
  if (!row) throw new Error('no Event row instance');
  const out = [];
  tree(row, 0, 3, out, '');
  report.info.eventRow = out;
  report.info.eventRowProps = Object.keys(row.componentProperties).join(', ');
});

return report;
