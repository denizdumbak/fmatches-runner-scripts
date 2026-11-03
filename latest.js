// step 281 · Faz 4 prototype links (Web + Mobile): Home Event rows -> Event card, Book flow, Edit event, My events rows/tabs/Create/Cancel/Save, flow starts "Web/Mobile · Event card" and "Web/Mobile · My events"; ideal scenarios only, no arrows
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p02 = pageOf(/^02/); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const web = p02.children.find(n => n.name === 'Web'), mob = p02.children.find(n => n.name === 'Mobile');
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
const nav = (dest, fade) => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: fade ? { type: 'DISSOLVE', easing: { type: 'EASE_OUT' }, duration: 0.2 } : { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
const frameIn = (root, name) => root.findOne(n => n.type === 'FRAME' && n.name === name);
const log = [];
const any = (...names) => n => names.indexOf(n.name) >= 0;
const short = s => s.replace(/^Events \//, 'E /');

async function setNav(el, to, fade) {
  const keep = (el.reactions || []).filter(r => !(r.actions || []).some(isNavAct));
  await el.setReactionsAsync(keep.concat([nav(to, fade)]));
}
async function link(from, selector, to, fade, label) {
  if (!from) { report.errors.push('source screen missing for ' + label); return; }
  if (!to) { report.errors.push('target screen missing for ' + label); return; }
  const el = from.findOne(selector);
  if (!el) { report.errors.push('click target not found: ' + label + ' on ' + from.name); return; }
  await setNav(el, to, fade);
  log.push(label + '  [' + short(from.name) + ' -> ' + short(to.name) + ']');
}
async function linkAll(from, selector, to, fade, label) {
  if (!from || !to) { report.errors.push('screen missing for ' + label); return; }
  const els = from.findAll(selector);
  if (!els.length) { report.errors.push('click targets not found: ' + label + ' on ' + from.name); return; }
  for (const el of els) await setNav(el, to, fade);
  log.push(label + ' x' + els.length + '  [' + short(from.name) + ' -> ' + short(to.name) + ']');
}

const names = {
  card: 'Events / Event card', mgr: 'Events / Event card / Manager', own: 'Events / Event card / Own event', fin: 'Events / Event card / Finished',
  book: 'Events / Event card / Book tournament', sent: 'Events / Event card / Request sent',
  create: 'Events / Create event', edit: 'Events / Edit event',
  my: 'Events / My events', app: 'Events / My events / Applied', none: 'Events / My events / No events created', noApp: 'Events / My events / No applications'
};
const homeNames = { Desktop: 'Home / Main · Desktop', Mobile: 'Home / Main · Mobile' };

for (const [dev, root] of [['Desktop', web], ['Mobile', mob]]) {
  const S = {};
  for (const k of Object.keys(names)) S[k] = frameIn(p02, names[k] + ' · ' + dev);
  S.home = frameIn(root, homeNames[dev]);
  report.info['screens ' + dev] = Object.entries(S).filter(([k, v]) => !v).map(([k]) => k).join(',') || 'all ' + Object.keys(S).length + ' found';
  const evRow = n => /^Event row/.test(n.name);

  await step(dev + ': Home Event rows -> Event card', async () => { await linkAll(S.home, evRow, S.card, false, dev + ' Home Event row'); });
  await step(dev + ': Book flow and Edit', async () => {
    await link(S.mgr, any('Button · Book tournament'), S.book, true, dev + ' Book tournament');
    await link(S.book, any('Button · Send request'), S.sent, false, dev + ' Send request');
    await link(S.book, any('Button · Cancel'), S.mgr, true, dev + ' Book dialog Cancel');
    await link(S.sent, any('Button · Done'), S.mgr, false, dev + ' Request sent Done');
    await link(S.own, any('Button · Edit event'), S.edit, false, dev + ' Edit event');
  });
  await step(dev + ': My events', async () => {
    await linkAll(S.my, n => /^Event row · (Berlin Autumn Cup|Nordpark Friendly|Scouting Basics Seminar)/.test(n.name), S.own, false, dev + ' Organising row (open)');
    await linkAll(S.my, n => /^Event row · Spreeufer Summer Camp/.test(n.name), S.fin, false, dev + ' Organising row (finished)');
    await linkAll(S.app, evRow, S.mgr, false, dev + ' Applied row');
    for (const [from, tab, to, nm] of [[S.my, 'Tab · Applied', S.app, 'Applied tab'], [S.app, 'Tab · Organising', S.my, 'Organising tab'], [S.none, 'Tab · Applied', S.app, 'Applied tab (empty organising)'], [S.noApp, 'Tab · Organising', S.my, 'Organising tab (empty applied)']]) await link(from, any(tab), to, false, dev + ' ' + nm);
    for (const [from, nm] of [[S.my, 'My events'], [S.app, 'Applied'], [S.none, 'No events']]) await link(from, any('Button · Create event'), S.create, false, dev + ' ' + nm + ': Create event');
    await link(S.none, any('Button · Add link'), S.create, false, dev + ' empty organising CTA');
  });
  await step(dev + ': Create / Edit forms', async () => {
    await link(S.create, any('Button · Cancel'), S.my, false, dev + ' Create Cancel');
    await link(S.create, any('Button · Create event'), S.my, false, dev + ' Create submit');
    await link(S.edit, any('Button · Cancel'), S.my, false, dev + ' Edit Cancel');
    await link(S.edit, any('Button · Save changes'), S.own, false, dev + ' Edit Save');
  });
  await step(dev + ': flow starts', async () => {
    const now = p02.flowStartingPoints;
    const pre = dev === 'Desktop' ? 'Web' : 'Mobile';
    const add = [[S.mgr, pre + ' · Event card'], [S.my, pre + ' · My events']];
    let keep = now.filter(f => !add.some(([fr, nm]) => f.name === nm || (fr && f.nodeId === fr.id)));
    for (const [fr, nm] of add) if (fr) keep.push({ nodeId: fr.id, name: nm }); else report.errors.push('flow start frame missing: ' + nm);
    const seen = new Set(); p02.flowStartingPoints = keep.filter(f => { if (seen.has(f.nodeId)) return false; seen.add(f.nodeId); return true; });
  });
}

await step('verify: all page links resolve', async () => {
  let links = 0, broken = 0; const bad = [];
  for (const root of [web, mob]) for (const n of root.findAll(x => 'reactions' in x && x.reactions && x.reactions.length)) for (const r of n.reactions) for (const a of (r.actions || [])) if (isNavAct(a)) { links++; const d = a.destinationId ? await figma.getNodeByIdAsync(a.destinationId) : null; if (!d) { broken++; bad.push(n.name); } }
  report.info.linksAll = links + ' links, ' + broken + ' broken' + (bad.length ? ' (' + bad.slice(0, 5).join(', ') + ')' : '');
  report.info.flowStarts = p02.flowStartingPoints.length + ': ' + p02.flowStartingPoints.map(f => f.name).join(' | ');
});

report.info.linksThisStep = log.length;
report.info.links = log;
return report;
