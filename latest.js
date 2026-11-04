// step 290 · Notifications pages (Web + Mobile) in new Section "Notifications": list (mixed unread, requests + replies), No notifications, Email not verified (Page notice + empty); derived from Contacts / My contacts; bell links from Phase 5 pages + Own profile + Event card / Manager; row links; flow starts
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/); await p01.loadAsync();
const p02 = pageOf(/^02/); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const allVars = await figma.variables.getLocalVariablesAsync();
const tryV = (...names) => { for (const n of names) { const v = allVars.find(x => x.name === n || x.name.endsWith('/' + n)); if (v) return v; } return null; };
const V = name => { const v = tryV(name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
const nav = (dest, fade) => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: fade ? { type: 'DISSOLVE', easing: { type: 'EASE_OUT' }, duration: 0.2 } : { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
async function setNav(el, to, fade) { const keep = (el.reactions || []).filter(r => !(r.actions || []).some(isNavAct)); await el.setReactionsAsync(keep.concat([nav(to, fade)])); }
async function clearNavAll(root) { for (const n of root.findAll(x => 'reactions' in x && x.reactions && x.reactions.length)) { const keep = n.reactions.filter(r => !(r.actions || []).some(isNavAct)); if (keep.length !== n.reactions.length) await n.setReactionsAsync(keep); } }
const setText = async (node, str) => { for (const seg of node.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); node.characters = str; };
const sz = n => Math.round(n.width) + 'x' + Math.round(n.height);
const BB = n => n.absoluteBoundingBox;
const frameIn = name => p02.findOne(n => n.type === 'FRAME' && n.name === name);
const findSet = nm => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === nm);
const notifSet = findSet('Notification row'), emptySet = findSet('Empty card'), noticeSet = findSet('Page notice');
if (!notifSet || !emptySet || !noticeSet) throw new Error('component missing (Notification row / Empty card / Page notice)');

const ROWS = [
  { key: 'joinReq', kind: 'Request', unread: true, title: 'Join request', body: 'Daniel Brandt wants to join Berlin Autumn Cup.', time: '2 hours ago', role: 'Other', gender: 'Male' },
  { key: 'contactReq', kind: 'Request', unread: true, title: 'Contact request', body: 'Lucas Novak wants to connect with you.', time: '5 hours ago', role: 'Other', gender: 'Male' },
  { key: 'eventOk', kind: 'Update', unread: false, title: 'Request accepted', body: 'Your request for Berlin Autumn Cup was accepted.', time: 'Yesterday', role: 'Other', gender: 'Male', status: 'Accepted' },
  { key: 'eventNo', kind: 'Update', unread: false, title: 'Request declined', body: 'Your request for Nordpark Friendly was declined.', time: '2 days ago', role: 'Other', gender: 'Female', status: 'Declined' },
  { key: 'contactOk', kind: 'Update', unread: false, title: 'Contact request accepted', body: 'Elena Petrova accepted your contact request.', time: '3 days ago', role: 'Player', gender: 'Female', status: 'Accepted' }
];
async function notifInst(dev, d) {
  const v = notifSet.children.find(x => x.name === 'Device=' + dev + ', Kind=' + d.kind + ', Unread=' + (d.unread ? 'True' : 'False')); if (!v) throw new Error('Notification row variant ' + dev + '/' + d.kind);
  const i = v.createInstance(); i.name = 'Notification · ' + d.key;
  await setText(i.findOne(n => n.type === 'TEXT' && n.name === 'Title'), d.title);
  await setText(i.findOne(n => n.type === 'TEXT' && n.name === 'Body'), d.body);
  await setText(i.findOne(n => n.type === 'TEXT' && n.name === 'Time'), d.time);
  const sil = i.findOne(n => n.type === 'INSTANCE' && n.name === 'Silhouette');
  if (sil) { const pr = {}; for (const k of Object.keys(sil.componentProperties)) { if (/^Role/.test(k)) pr[k] = d.role; if (/^Gender/.test(k)) pr[k] = d.gender; } sil.setProperties(pr); }
  if (d.status) { const st = i.findOne(n => n.type === 'INSTANCE' && n.name === 'Application status'); if (!st) throw new Error('Application status missing in ' + d.key); const pr = {}; for (const k of Object.keys(st.componentProperties)) if (/^Status/.test(k)) pr[k] = d.status; st.setProperties(pr); }
  return i;
}
function divider() { const r = figma.createRectangle(); r.name = 'Divider'; r.resize(10, 1); r.fills = [P(V('color/border/default'))]; return r; }

await step('cleanup previous run', async () => {
  for (const root of p02.children.filter(n => n.name === 'Web' || n.name === 'Mobile')) for (const s of root.children.filter(c => c.type === 'SECTION' && c.name === 'Notifications')) s.remove();
});

const created = { Desktop: {}, Mobile: {} };
for (const dev of ['Desktop', 'Mobile']) {
  await step('pages ' + dev, async () => {
    const root = p02.children.find(n => n.name === (dev === 'Desktop' ? 'Web' : 'Mobile'));
    const prev = root.children.find(c => c.type === 'SECTION' && c.name === 'My settings'); if (!prev) throw new Error('My settings section missing: run step 289');
    const src = frameIn('Contacts / My contacts · ' + dev); if (!src) throw new Error('My contacts page missing');
    const sec = figma.createSection(); sec.name = 'Notifications'; root.appendChild(sec);
    sec.fills = prev.fills; sec.x = prev.x; sec.y = prev.y + prev.height + 160;
    const defs = [['List', 'Notifications / Notifications · ' + dev], ['Empty', 'Notifications / No notifications · ' + dev], ['Unverified', 'Notifications / Email not verified · ' + dev]];
    let col = 0, maxH = 0;
    for (const [key, nm] of defs) {
      const page = src.clone(); page.name = nm; sec.appendChild(page);
      page.x = dev === 'Desktop' ? 80 + col * 1920 : 80 + col * 470; page.y = dev === 'Desktop' ? 100 : 80; col++;
      await clearNavAll(page);
      p02.flowStartingPoints = p02.flowStartingPoints.filter(f => f.nodeId !== page.id);
      const body = page.findOne(n => n.name === 'My contacts body'); body.name = 'Notifications body';
      const colm = body.findOne(n => n.name === 'Column');
      await setText(colm.findOne(n => n.type === 'TEXT' && n.name === 'Title'), 'Notifications');
      const cta = colm.findOne(n => n.type === 'INSTANCE' && n.name === 'Button · Find people');
      if (key === 'List') { await setText(cta.findOne(n => n.type === 'TEXT'), 'Mark all as read'); cta.name = 'Button · Mark all as read'; const pr = {}; for (const k of Object.keys(cta.componentProperties)) if (/^Style/.test(k)) pr[k] = 'Secondary'; cta.setProperties(pr); }
      else cta.remove();
      const tabs = colm.findOne(n => n.name === 'Tabs'); if (tabs) tabs.remove();
      const card = colm.findOne(n => n.name === 'List card');
      if (key === 'List') {
        for (const r of card.children.slice()) r.remove();
        for (let k = 0; k < ROWS.length; k++) {
          const i = await notifInst(dev, ROWS[k]); card.appendChild(i); i.layoutSizingHorizontal = 'FILL';
          if (k < ROWS.length - 1) { const d = divider(); card.appendChild(d); d.layoutSizingHorizontal = 'FILL'; }
        }
      } else {
        const idx = colm.children.indexOf(card); card.remove();
        const v = emptySet.children.find(x => x.name === 'Device=' + dev); if (!v) throw new Error('Empty card variant');
        const e = v.createInstance(); e.name = 'Empty card'; colm.insertChild(idx, e); e.layoutSizingHorizontal = 'FILL';
        const sh = e.findOne(n => n.type === 'TEXT' && n.name === 'Section heading'); if (sh) sh.visible = false;
        await setText(e.findOne(n => n.type === 'TEXT' && n.name === 'Title'), 'No notifications yet');
        await setText(e.findOne(n => n.type === 'TEXT' && n.name === 'Body'), 'Join requests, contact requests and replies to your own requests show up here.');
        const eb = e.findOne(n => n.type === 'INSTANCE' && /^Button/.test(n.name)); if (eb) eb.visible = false;
      }
      if (dev === 'Desktop') { colm.resize(720, colm.height); colm.primaryAxisSizingMode = 'AUTO'; const hr = colm.findOne(n => n.name === 'Heading row'); hr.layoutSizingHorizontal = 'FILL'; }
      if (key === 'Unverified') {
        const v = noticeSet.children.find(x => x.name === 'Device=' + dev); if (!v) throw new Error('Page notice variant');
        const nt = v.createInstance(); nt.name = 'Page notice'; const nav0 = page.findOne(n => n.type === 'INSTANCE' && n.name === 'Navigation');
        const idx = page.children.indexOf(nav0); page.insertChild(idx + 1, nt); nt.layoutSizingHorizontal = 'FILL';
      }
      created[dev][key] = page; maxH = Math.max(maxH, page.height);
    }
    sec.resizeWithoutConstraints(dev === 'Desktop' ? 80 + 3 * 1920 - 480 : 80 + 3 * 470 - 10, (dev === 'Desktop' ? 100 : 80) + maxH + 100);
    root.resizeWithoutConstraints(root.width, Math.max(root.height, sec.y + sec.height + 120));
  });
}

await step('links + flow starts', async () => {
  let n = 0; const miss = [];
  for (const dev of ['Desktop', 'Mobile']) {
    const c = created[dev]; if (!c.List) throw new Error('pages missing ' + dev);
    // row links on the list page
    const reqP = frameIn('Contacts / My contacts / Requests · ' + dev), conP = frameIn('Contacts / My contacts · ' + dev), evP = frameIn('Events / Event card / Manager · ' + dev);
    const rowLink = async (key, dest) => { const r = c.List.findOne(x => x.name === 'Notification · ' + key); if (r && dest) { await setNav(r, dest, false); n++; } else miss.push(dev + ' row ' + key); };
    await rowLink('contactReq', reqP); await rowLink('eventOk', evP); await rowLink('contactOk', conP);
    // bell -> Notifications from selected logged-in pages
    const from = ['Contacts / My contacts · ', 'Contacts / My contacts / Requests · ', 'Contacts / My contacts / No contacts · ', 'Contacts / My contacts / No requests · ', 'Settings / My settings · ', 'Settings / My settings / No blocked people · ', 'Events / Event card / Manager · ', 'Events / My events · ', 'Own profile · '].map(p => p + dev);
    const bellDone = [];
    for (const nm of from) { const f = frameIn(nm); if (!f) { miss.push('page ' + nm); continue; } const bell = f.findOne(x => x.name === 'Icon button · Notifications'); if (!bell) { miss.push('bell ' + nm); continue; } await setNav(bell, c.List, false); n++; bellDone.push(nm.split(' · ')[0]); }
    report.info['bell' + dev] = bellDone.join(', ');
    p02.flowStartingPoints = p02.flowStartingPoints.filter(f => f.nodeId !== c.List.id).concat([{ nodeId: c.List.id, name: (dev === 'Desktop' ? 'Web' : 'Mobile') + ' · Notifications' }]);
  }
  report.info.linksAdded = n; report.info.notLinked = miss.length ? miss : 'none';
});

await step('verify', async () => {
  let links = 0, broken = 0;
  for (const root of p02.children.filter(n => n.name === 'Web' || n.name === 'Mobile')) for (const nd of root.findAll(x => 'reactions' in x && x.reactions && x.reactions.length)) for (const r of nd.reactions) for (const a of (r.actions || [])) if (isNavAct(a)) { links++; const d = a.destinationId ? await figma.getNodeByIdAsync(a.destinationId) : null; if (!d) broken++; }
  report.info.linksAll = links + ' links, ' + broken + ' broken'; report.info.flowStartCount = p02.flowStartingPoints.length;
  const out = {};
  for (const dev of ['Desktop', 'Mobile']) for (const k of Object.keys(created[dev])) {
    const pg = created[dev][k]; const colm = pg.findOne(n => n.name === 'Column'); const card = pg.findOne(n => n.name === 'List card'); const emp = pg.findOne(n => n.type === 'INSTANCE' && n.name === 'Empty card');
    const uns = []; for (const n of pg.findAll(() => true)) if (n.type === 'TEXT' && !n.textStyleId) uns.push(n.name);
    let over = 0, rows = 0, dots = 0; if (card) { const cb = BB(card); for (const c of card.children) { const b = BB(c); if (b.x < cb.x - .5 || b.x + b.width > cb.x + cb.width + .5) over++; } rows = card.children.filter(c => /^Notification ·/.test(c.name)).length; dots = card.findAll(n => n.name === 'Unread dot').length; }
    const notice = pg.findOne(n => n.type === 'INSTANCE' && n.name === 'Page notice');
    out[dev + '/' + k] = { page: sz(pg), column: sz(colm), card: card ? sz(card) : '-', rows, unreadDots: dots, rowsOutsideCard: over, empty: emp ? sz(emp) : '-', notice: notice ? sz(notice) + ' at y ' + Math.round(notice.y) : '-', unstyledText: uns.length ? uns.slice(0, 4) : 'none' };
  }
  report.info.pages = out;
  const secs = [];
  for (const root of p02.children.filter(n => n.name === 'Web' || n.name === 'Mobile')) {
    const s = root.children.find(c => c.type === 'SECTION' && c.name === 'Notifications'); const sb = BB(s), rb = BB(root); const ov = [];
    for (const a of root.children.filter(c => c.type === 'SECTION' && c !== s)) { const ab = BB(a); if (ab.x < sb.x + sb.width && sb.x < ab.x + ab.width && ab.y < sb.y + sb.height && sb.y < ab.y + ab.height) ov.push(a.name); }
    secs.push(root.name + ': section ' + sz(s) + ' @' + Math.round(s.x) + ',' + Math.round(s.y) + ' · platform ' + sz(root) + ' · overlaps ' + (ov.length ? ov.join(',') : 'none') + ' · inside platform ' + (sb.x + sb.width <= rb.x + rb.width && sb.y + sb.height <= rb.y + rb.height) + ' · pages inside ' + s.children.every(f => { const fb = BB(f); return fb.x >= sb.x && fb.y >= sb.y && fb.x + fb.width <= sb.x + sb.width && fb.y + fb.height <= sb.y + sb.height; }));
  }
  report.info.sections = secs;
  const mobx = p02.children.find(n => n.name === 'Mobile'), webx = p02.children.find(n => n.name === 'Web'); report.info.mobileGap = Math.round(mobx.x - (webx.x + webx.width));
});
return report;
