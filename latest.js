// step 291 · Shortlists pages (Web + Mobile) in new Section "Shortlists": list (6 players, position filter chips) + empty; Account menu "Shortlists" row link, bell links; plus Own profile bell -> Notifications (found via flow start)
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
const shortSet = findSet('Shortlist row'), emptySet = findSet('Empty card');
if (!shortSet || !emptySet) throw new Error('component missing (Shortlist row / Empty card)');

const PLAYERS = [
  ['Jonas Weber', 'Attacking Midfield · Riverside FC', '19', 'Poland', 'Jun 2027'],
  ['Mateus Kowalczyk-Brun', 'Centre-Back · Northgate Athletic', '22', 'Netherlands', 'Jun 2027'],
  ['Liam Hartley', 'Goalkeeper · Harbour City', '24', 'England', 'Jun 2028'],
  ['Noah Peeters', 'Right-Back · Coastal United', '20', 'Belgium', 'Jun 2027'],
  ['Theo Marchand', 'Winger · Spreeufer FC', '18', 'France', 'Jun 2029'],
  ['Cian Doyle', 'Centre-Forward · Nordpark SC', '21', 'Ireland', 'Dec 2026']
];
async function playerInst(dev, d) {
  const v = shortSet.children.find(x => x.name === 'Device=' + dev + ', State=Default'); if (!v) throw new Error('Shortlist row variant ' + dev);
  const i = v.createInstance(); i.name = 'Player · ' + d[0];
  await setText(i.findOne(n => n.type === 'TEXT' && n.name === 'Name'), d[0]);
  await setText(i.findOne(n => n.type === 'TEXT' && n.name === 'Meta'), d[1]);
  const facts = i.findOne(n => n.name === 'Key facts'); const f = facts.children;
  await setText(f[0].findOne(n => n.type === 'TEXT' && n.name === 'Value'), d[2]);
  await setText(f[1].findOne(n => n.type === 'TEXT' && n.name === 'Nation'), d[3]);
  const fl = f[1].findOne(n => n.type === 'INSTANCE' && n.name === 'Flag'); const pr = {}; for (const k of Object.keys(fl.componentProperties)) if (/^Country/.test(k)) pr[k] = d[3]; fl.setProperties(pr);
  await setText(f[2].findOne(n => n.type === 'TEXT' && n.name === 'Value'), d[4]);
  const sil = i.findOne(n => n.type === 'INSTANCE' && n.name === 'Silhouette');
  if (sil) { const p2 = {}; for (const k of Object.keys(sil.componentProperties)) { if (/^Role/.test(k)) p2[k] = 'Player'; if (/^Gender/.test(k)) p2[k] = 'Male'; } sil.setProperties(p2); }
  return i;
}
function divider() { const r = figma.createRectangle(); r.name = 'Divider'; r.resize(10, 1); r.fills = [P(V('color/border/default'))]; return r; }

await step('cleanup previous run', async () => {
  for (const root of p02.children.filter(n => n.name === 'Web' || n.name === 'Mobile')) for (const s of root.children.filter(c => c.type === 'SECTION' && c.name === 'Shortlists')) s.remove();
});

const created = { Desktop: {}, Mobile: {} };
for (const dev of ['Desktop', 'Mobile']) {
  await step('pages ' + dev, async () => {
    const root = p02.children.find(n => n.name === (dev === 'Desktop' ? 'Web' : 'Mobile'));
    const prev = root.children.find(c => c.type === 'SECTION' && c.name === 'Notifications'); if (!prev) throw new Error('Notifications section missing: run step 290');
    const src = frameIn('Contacts / My contacts · ' + dev); if (!src) throw new Error('My contacts page missing');
    const sec = figma.createSection(); sec.name = 'Shortlists'; root.appendChild(sec);
    sec.fills = prev.fills; sec.x = prev.x; sec.y = prev.y + prev.height + 160;
    const defs = [['List', 'Shortlists / Shortlists · ' + dev], ['Empty', 'Shortlists / No players · ' + dev]];
    let col = 0, maxH = 0;
    for (const [key, nm] of defs) {
      const page = src.clone(); page.name = nm; sec.appendChild(page);
      page.x = dev === 'Desktop' ? 80 + col * 1920 : 80 + col * 470; page.y = dev === 'Desktop' ? 100 : 80; col++;
      await clearNavAll(page);
      p02.flowStartingPoints = p02.flowStartingPoints.filter(f => f.nodeId !== page.id);
      const body = page.findOne(n => n.name === 'My contacts body'); body.name = 'Shortlists body';
      const colm = body.findOne(n => n.name === 'Column');
      await setText(colm.findOne(n => n.type === 'TEXT' && n.name === 'Title'), 'Shortlists');
      const cta = colm.findOne(n => n.type === 'INSTANCE' && n.name === 'Button · Find people');
      await setText(cta.findOne(n => n.type === 'TEXT'), 'Find players'); cta.name = 'Button · Find players';
      const tabs = colm.findOne(n => n.name === 'Tabs');
      const card = colm.findOne(n => n.name === 'List card');
      if (key === 'List') {
        // position filter chips
        tabs.name = 'Position filters';
        const t0 = tabs.findOne(n => n.name === 'Tab · Connected'), t1 = tabs.findOne(n => n.name === 'Tab · Requests');
        const labels = ['All (6)', 'Goalkeepers', 'Defenders', 'Midfielders', 'Forwards'];
        const chips = [t0, t1];
        while (chips.length < labels.length) { const c = t1.clone(); tabs.appendChild(c); chips.push(c); }
        for (let k = 0; k < labels.length; k++) {
          const t = chips[k]; t.name = 'Chip · ' + labels[k].replace(' (6)', ''); await setText(t.findOne(n => n.type === 'TEXT'), labels[k]);
          const pr = {}; for (const kk of Object.keys(t.componentProperties)) if (/^State/.test(kk)) pr[kk] = k === 0 ? 'Selected' : 'Default'; t.setProperties(pr);
        }
        tabs.layoutWrap = 'WRAP'; tabs.counterAxisSpacing = 8; tabs.layoutSizingHorizontal = 'FILL';
        for (const r of card.children.slice()) r.remove();
        for (let k = 0; k < PLAYERS.length; k++) {
          const i = await playerInst(dev, PLAYERS[k]); card.appendChild(i); i.layoutSizingHorizontal = 'FILL';
          if (k < PLAYERS.length - 1) { const d = divider(); card.appendChild(d); d.layoutSizingHorizontal = 'FILL'; }
        }
      } else {
        tabs.remove();
        const idx = colm.children.indexOf(card); card.remove();
        const v = emptySet.children.find(x => x.name === 'Device=' + dev); if (!v) throw new Error('Empty card variant');
        const e = v.createInstance(); e.name = 'Empty card'; colm.insertChild(idx, e); e.layoutSizingHorizontal = 'FILL';
        const sh = e.findOne(n => n.type === 'TEXT' && n.name === 'Section heading'); if (sh) sh.visible = false;
        await setText(e.findOne(n => n.type === 'TEXT' && n.name === 'Title'), 'Your shortlist is empty');
        await setText(e.findOne(n => n.type === 'TEXT' && n.name === 'Body'), 'Use Add to shortlist on a player profile to follow them here.');
        const eb = e.findOne(n => n.type === 'INSTANCE' && /^Button/.test(n.name)); if (eb) { await setText(eb.findOne(n => n.type === 'TEXT'), 'Find players'); eb.name = 'Button · Find players'; }
        cta.remove();
      }
      created[dev][key] = page; maxH = Math.max(maxH, page.height);
    }
    sec.resizeWithoutConstraints(dev === 'Desktop' ? 80 + 2 * 1920 - 480 : 80 + 2 * 470 - 10, (dev === 'Desktop' ? 100 : 80) + maxH + 100);
    root.resizeWithoutConstraints(root.width, Math.max(root.height, sec.y + sec.height + 120));
  });
}

await step('links + flow starts', async () => {
  let n = 0; const miss = [];
  for (const dev of ['Desktop', 'Mobile']) {
    const c = created[dev]; if (!c.List) throw new Error('pages missing ' + dev);
    const am = frameIn('Events / Account menu · ' + dev);
    if (am) { const row = am.findOne(x => x.name === 'Row · Shortlists'); if (row) { await setNav(row, c.List, false); n++; } else miss.push('Row · Shortlists not on Account menu page ' + dev); } else miss.push('Account menu page ' + dev);
    const notif = frameIn('Notifications / Notifications · ' + dev);
    for (const k of ['List', 'Empty']) { const bell = c[k].findOne(x => x.name === 'Icon button · Notifications'); if (bell && notif) { await setNav(bell, notif, false); n++; } else miss.push('bell ' + k + ' ' + dev); }
    const prof = frameIn('Profiles / Player · ' + dev) || frameIn('Profiles / Player / Profile · ' + dev);
    const row1 = c.List.findOne(x => x.name === 'Player · Jonas Weber');
    if (prof && row1) { await setNav(row1, prof, false); n++; } else miss.push('player profile page for row link ' + dev);
    p02.flowStartingPoints = p02.flowStartingPoints.filter(f => f.nodeId !== c.List.id).concat([{ nodeId: c.List.id, name: (dev === 'Desktop' ? 'Web' : 'Mobile') + ' · Shortlists' }]);
  }
  report.info.linksAdded = n; report.info.notLinked = miss.length ? miss : 'none';
});

await step('Own profile bell -> Notifications (via flow start)', async () => {
  const found = [];
  for (const dev of ['Desktop', 'Mobile']) {
    const fp = p02.flowStartingPoints.find(f => /own profile/i.test(f.name) && (dev === 'Desktop' ? /web|desktop/i : /mobile/i).test(f.name));
    if (!fp) { report.errors.push('no Own profile flow start for ' + dev + ' (flow starts: ' + p02.flowStartingPoints.map(f => f.name).join(' | ') + ')'); continue; }
    const pg = await figma.getNodeByIdAsync(fp.nodeId); const notif = frameIn('Notifications / Notifications · ' + dev);
    const bell = pg.findOne(x => x.name === 'Icon button · Notifications'); if (!bell || !notif) { report.errors.push('bell/notif missing for ' + pg.name); continue; }
    await setNav(bell, notif, false); found.push(dev + ': ' + pg.name);
  }
  report.info.ownProfileBell = found.join(' ; ');
});

await step('verify', async () => {
  let links = 0, broken = 0;
  for (const root of p02.children.filter(n => n.name === 'Web' || n.name === 'Mobile')) for (const nd of root.findAll(x => 'reactions' in x && x.reactions && x.reactions.length)) for (const r of nd.reactions) for (const a of (r.actions || [])) if (isNavAct(a)) { links++; const d = a.destinationId ? await figma.getNodeByIdAsync(a.destinationId) : null; if (!d) broken++; }
  report.info.linksAll = links + ' links, ' + broken + ' broken'; report.info.flowStartCount = p02.flowStartingPoints.length;
  const out = {};
  for (const dev of ['Desktop', 'Mobile']) for (const k of Object.keys(created[dev])) {
    const pg = created[dev][k]; const colm = pg.findOne(n => n.name === 'Column'); const card = pg.findOne(n => n.name === 'List card'); const emp = pg.findOne(n => n.type === 'INSTANCE' && n.name === 'Empty card');
    const uns = []; for (const n of pg.findAll(() => true)) if (n.type === 'TEXT' && !n.textStyleId) uns.push(n.name);
    let over = 0, rows = 0; const bad = []; if (card) { const cb = BB(card); for (const c of card.children) { const b = BB(c); if (b.x < cb.x - .5 || b.x + b.width > cb.x + cb.width + .5) over++; } rows = card.children.filter(c => /^Player ·/.test(c.name)).length;
      for (const r of card.children.filter(c => /^Player ·/.test(c.name))) { const rb = BB(r); for (const k2 of r.findAll(n => 'width' in n && n.type !== 'TEXT')) { const b = BB(k2); if (b && b.x + b.width > rb.x + rb.width + .5) bad.push(r.name + ' › ' + k2.name); } } }
    const chips = pg.findAll(n => /^Chip ·/.test(n.name)); const tabs = pg.findOne(n => n.name === 'Position filters');
    out[dev + '/' + k] = { page: sz(pg), column: sz(colm), card: card ? sz(card) : '-', rows, rowHeights: card ? card.children.filter(c => /^Player ·/.test(c.name)).map(c => Math.round(c.height)).join(',') : '-', rowsOutsideCard: over, innerOverflow: bad.length ? bad.slice(0, 5) : 'none', chips: chips.length + (tabs ? ' in ' + sz(tabs) : ''), empty: emp ? sz(emp) : '-', unstyledText: uns.length ? uns.slice(0, 4) : 'none' };
  }
  report.info.pages = out;
  const secs = [];
  for (const root of p02.children.filter(n => n.name === 'Web' || n.name === 'Mobile')) {
    const s = root.children.find(c => c.type === 'SECTION' && c.name === 'Shortlists'); const sb = BB(s), rb = BB(root); const ov = [];
    for (const a of root.children.filter(c => c.type === 'SECTION' && c !== s)) { const ab = BB(a); if (ab.x < sb.x + sb.width && sb.x < ab.x + ab.width && ab.y < sb.y + sb.height && sb.y < ab.y + ab.height) ov.push(a.name); }
    secs.push(root.name + ': section ' + sz(s) + ' @' + Math.round(s.x) + ',' + Math.round(s.y) + ' · platform ' + sz(root) + ' · overlaps ' + (ov.length ? ov.join(',') : 'none') + ' · inside platform ' + (sb.x + sb.width <= rb.x + rb.width && sb.y + sb.height <= rb.y + rb.height) + ' · pages inside ' + s.children.every(f => { const fb = BB(f); return fb.x >= sb.x && fb.y >= sb.y && fb.x + fb.width <= sb.x + sb.width && fb.y + fb.height <= sb.y + sb.height; }));
  }
  report.info.sections = secs;
  const mobx = p02.children.find(n => n.name === 'Mobile'), webx = p02.children.find(n => n.name === 'Web'); report.info.mobileGap = Math.round(mobx.x - (webx.x + webx.width));
});
return report;
