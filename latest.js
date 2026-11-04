// step 287 · My contacts pages (Web + Mobile) in new Section "My contacts": Connected, Requests, No contacts, No requests; derived from Events / My events; Contact row instances; tab links, Account menu "My contacts" row link, flow starts
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/); await p01.loadAsync();
const p02 = pageOf(/^02/); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const allVars = await figma.variables.getLocalVariablesAsync();
const tryV = (...names) => { for (const n of names) { const v = allVars.find(x => x.name === n); if (v) return v; } return null; };
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

const contactSet = findSet('Contact row'), emptySet = findSet('Empty card');
if (!contactSet || !emptySet) throw new Error('Contact row / Empty card missing: run step 285');
const styles = await figma.getLocalTextStylesAsync();
const gStyle = styles.find(s => s.name === 'Label/Large') || styles.find(s => s.name === 'Label/Default');
if (!gStyle) throw new Error('group heading text style missing'); await figma.loadFontAsync(gStyle.fontName);

const DATA = {
  connected: [['Tom Reilly', 'Manager · Riverside FC', 'Other', 'Male'], ['Sofia Lindqvist', 'Intermediary · Northgate Athletic', 'Other', 'Female'], ['Ana Ferreira', 'Referee · Berlin FA', 'Player', 'Female'], ['Daniel Brandt', 'Head scout · Spreeufer FC', 'Other', 'Male'], ['Jake Morris', 'Football fan', 'Other', 'Male']],
  received: [['Lucas Novak', 'Manager · Harbour City', 'Other', 'Male'], ['Elena Petrova', 'Player · Coastal United', 'Player', 'Female']],
  sent: [['Marco Bellini', 'Intermediary · Milano Sports Agency', 'Other', 'Male']]
};
const CAP = { Desktop: 'Desktop', Mobile: 'Mobile' };

async function contactInst(dev, kind, d) {
  const v = contactSet.children.find(x => x.name === 'Device=' + dev + ', Kind=' + kind + ', State=Default'); if (!v) throw new Error('Contact row variant ' + dev + '/' + kind);
  const i = v.createInstance(); i.name = 'Contact · ' + d[0];
  await setText(i.findOne(n => n.type === 'TEXT' && n.name === 'Name'), d[0]);
  await setText(i.findOne(n => n.type === 'TEXT' && n.name === 'Meta'), d[1]);
  const sil = i.findOne(n => n.type === 'INSTANCE' && n.name === 'Silhouette');
  if (sil) { const pr = {}; for (const k of Object.keys(sil.componentProperties)) { if (/^Role/.test(k)) pr[k] = d[2]; if (/^Gender/.test(k)) pr[k] = d[3]; } sil.setProperties(pr); }
  return i;
}
async function groupHeading(str) { const t = figma.createText(); t.name = 'Group heading'; await t.setTextStyleIdAsync(gStyle.id); t.characters = str; t.fills = [P(V('color/text/secondary'))]; return t; }

// remove previous run
await step('cleanup previous run', async () => {
  for (const root of p02.children.filter(n => n.name === 'Web' || n.name === 'Mobile')) for (const s of root.children.filter(c => c.type === 'SECTION' && c.name === 'My contacts')) s.remove();
});

const created = { Desktop: {}, Mobile: {} };
for (const dev of ['Desktop', 'Mobile']) {
  await step('pages ' + dev, async () => {
    const root = p02.children.find(n => n.name === (dev === 'Desktop' ? 'Web' : 'Mobile'));
    const ev = root.children.find(c => c.type === 'SECTION' && c.name === 'Events');
    const src = frameIn('Events / My events · ' + dev); if (!src) throw new Error('My events page missing');
    const sec = figma.createSection(); sec.name = 'My contacts'; root.appendChild(sec);
    sec.fills = ev.fills; sec.x = ev.x; sec.y = ev.y + ev.height + 160;
    const defs = [['Connected', 'Contacts / My contacts · ' + dev], ['Requests', 'Contacts / My contacts / Requests · ' + dev], ['NoContacts', 'Contacts / My contacts / No contacts · ' + dev], ['NoRequests', 'Contacts / My contacts / No requests · ' + dev]];
    let col = 0, maxH = 0;
    for (const [key, nm] of defs) {
      const page = src.clone(); page.name = nm; sec.appendChild(page);
      page.x = dev === 'Desktop' ? 80 + col * 1920 : 80 + col * 470; page.y = dev === 'Desktop' ? 100 : 80; col++;
      await clearNavAll(page);
      p02.flowStartingPoints = p02.flowStartingPoints.filter(f => f.nodeId !== page.id);
      const body = page.findOne(n => n.name === 'My events body'); body.name = 'My contacts body';
      const colm = body.findOne(n => n.name === 'Column');
      await setText(colm.findOne(n => n.type === 'TEXT' && n.name === 'Title'), 'My contacts');
      const cta = colm.findOne(n => n.type === 'INSTANCE' && n.name === 'Button · Create event');
      await setText(cta.findOne(n => n.type === 'TEXT'), 'Find people'); cta.name = 'Button · Find people';
      const tabs = colm.findOne(n => n.name === 'Tabs');
      const tA = tabs.findOne(n => n.name === 'Tab · Organising'), tB = tabs.findOne(n => n.name === 'Tab · Applied');
      tA.name = 'Tab · Connected'; tB.name = 'Tab · Requests';
      await setText(tA.findOne(n => n.type === 'TEXT'), 'Connected'); await setText(tB.findOne(n => n.type === 'TEXT'), key === 'NoRequests' ? 'Requests' : 'Requests (2)');
      const onB = key === 'Requests' || key === 'NoRequests';
      for (const [t, sel] of [[tA, !onB], [tB, onB]]) { const pr = {}; for (const k of Object.keys(t.componentProperties)) if (/^State/.test(k)) pr[k] = sel ? 'Selected' : 'Default'; t.setProperties(pr); }
      const card = colm.findOne(n => n.name === 'List card');
      if (key === 'Connected' || key === 'Requests') {
        for (const r of card.children.slice()) r.remove();
        if (key === 'Connected') { for (const d of DATA.connected) { const i = await contactInst(dev, 'Connected', d); card.appendChild(i); i.layoutSizingHorizontal = 'FILL'; } }
        else {
          const h1 = await groupHeading('Received · 2'); card.appendChild(h1);
          for (const d of DATA.received) { const i = await contactInst(dev, 'Received', d); card.appendChild(i); i.layoutSizingHorizontal = 'FILL'; }
          const h2 = await groupHeading('Sent · 1'); card.appendChild(h2);
          for (const d of DATA.sent) { const i = await contactInst(dev, 'Sent', d); card.appendChild(i); i.layoutSizingHorizontal = 'FILL'; }
        }
      } else {
        const idx = colm.children.indexOf(card); card.remove();
        const ev2 = emptySet.children.find(v => v.name === 'Device=' + dev); if (!ev2) throw new Error('Empty card variant ' + dev);
        const e = ev2.createInstance(); e.name = 'Empty card'; colm.insertChild(idx, e); e.layoutSizingHorizontal = 'FILL';
        const sh = e.findOne(n => n.type === 'TEXT' && n.name === 'Section heading'); if (sh) sh.visible = false;
        await setText(e.findOne(n => n.type === 'TEXT' && n.name === 'Title'), key === 'NoContacts' ? 'No contacts yet' : 'No requests');
        await setText(e.findOne(n => n.type === 'TEXT' && n.name === 'Body'), key === 'NoContacts' ? 'People you connect with appear here. Use Add to contacts on a profile to send a request.' : 'Connection requests you send or receive show up here.');
        const eb = e.findOne(n => n.type === 'INSTANCE' && /^Button/.test(n.name));
        if (eb) { if (key === 'NoContacts') { await setText(eb.findOne(n => n.type === 'TEXT'), 'Find people'); eb.name = 'Button · Find people'; } else eb.visible = false; }
      }
      created[dev][key] = page; maxH = Math.max(maxH, page.height);
    }
    sec.resizeWithoutConstraints(dev === 'Desktop' ? 80 + 4 * 1920 - 480 : 80 + 4 * 470 - 10 + 0, (dev === 'Desktop' ? 100 : 80) + maxH + 100);
    // platform grows to contain the new section
    root.resizeWithoutConstraints(root.width, Math.max(root.height, sec.y + sec.height + 120));
  });
}

await step('links + flow starts', async () => {
  let n = 0;
  for (const dev of ['Desktop', 'Mobile']) {
    const c = created[dev]; if (!c.Connected || !c.Requests) throw new Error('pages missing for ' + dev);
    const tab = (page, nm) => page.findOne(x => x.name === 'Tab · ' + nm);
    await setNav(tab(c.Connected, 'Requests'), c.Requests, false); n++;
    await setNav(tab(c.Requests, 'Connected'), c.Connected, false); n++;
    // Account menu open page -> My contacts
    const am = frameIn('Events / Account menu · ' + dev);
    if (am) { const row = am.findOne(x => x.name === 'Row · My contacts'); if (row) { await setNav(row, c.Connected, false); n++; } else report.errors.push('Account menu page has no Row · My contacts (' + dev + ')'); }
    const fs = p02.flowStartingPoints.filter(f => f.nodeId !== c.Connected.id);
    p02.flowStartingPoints = fs.concat([{ nodeId: c.Connected.id, name: (dev === 'Desktop' ? 'Web' : 'Mobile') + ' · My contacts' }]);
  }
  report.info.linksAdded = n;
});

await step('verify', async () => {
  let links = 0, broken = 0; const bad = [];
  for (const root of p02.children.filter(n => n.name === 'Web' || n.name === 'Mobile')) for (const nd of root.findAll(x => 'reactions' in x && x.reactions && x.reactions.length)) for (const r of nd.reactions) for (const a of (r.actions || [])) if (isNavAct(a)) { links++; const d = a.destinationId ? await figma.getNodeByIdAsync(a.destinationId) : null; if (!d) { broken++; bad.push(nd.name); } }
  report.info.linksAll = links + ' links, ' + broken + ' broken' + (bad.length ? ' (' + bad.slice(0, 5).join(', ') + ')' : '');
  report.info.flowStartCount = p02.flowStartingPoints.length;
  const out = {};
  for (const dev of ['Desktop', 'Mobile']) for (const k of Object.keys(created[dev])) {
    const pg = created[dev][k]; const pb = BB(pg);
    const card = pg.findOne(n => n.name === 'List card'); const emp = pg.findOne(n => n.type === 'INSTANCE' && n.name === 'Empty card');
    const rows = card ? card.children.filter(c => c.type === 'INSTANCE').length : 0;
    let over = 0; if (card) { const cb = BB(card); for (const c of card.children) { const b = BB(c); if (b.x < cb.x - .5 || b.x + b.width > cb.x + cb.width + .5) over++; } }
    const gray = [], uns = [];
    for (const n of pg.findAll(() => true)) { if (n.type === 'TEXT' && !n.textStyleId) uns.push(n.name); }
    out[dev + '/' + k] = { size: sz(pg), rows, card: card ? sz(card) : '-', rowsOutsideCard: over, empty: emp ? sz(emp) + ' invite ' + (function () { const iv = emp.findOne(n => n.name === 'Invite'); return iv ? sz(iv) : '-'; })() : '-', unstyledText: uns.length ? uns.slice(0, 4) : 'none', tabs: pg.findAll(n => /^Tab ·/.test(n.name)).map(t => t.name.replace('Tab · ', '') + ':' + Object.values(t.componentProperties).filter(p => p.type === 'VARIANT').map(p => p.value).join('')).join(' ') };
  }
  report.info.pages = out;
  const secs = [];
  for (const root of p02.children.filter(n => n.name === 'Web' || n.name === 'Mobile')) {
    const s = root.children.find(c => c.type === 'SECTION' && c.name === 'My contacts');
    const sb = s ? BB(s) : null, rb = BB(root);
    const ov = []; const sibs = root.children.filter(c => c.type === 'SECTION');
    for (const a of sibs) if (a !== s && s) { const ab = BB(a); if (ab.x < sb.x + sb.width && sb.x < ab.x + ab.width && ab.y < sb.y + sb.height && sb.y < ab.y + ab.height) ov.push(a.name); }
    const outside = s ? (sb.x + sb.width > rb.x + rb.width || sb.y + sb.height > rb.y + rb.height) : 'n/a';
    secs.push(root.name + ': section ' + (s ? sz(s) + ' @' + Math.round(s.x) + ',' + Math.round(s.y) : 'missing') + ' · platform ' + sz(root) + ' · overlaps ' + (ov.length ? ov.join(',') : 'none') + ' · outsidePlatform ' + outside + ' · pagesInsideSection ' + (s ? s.children.every(f => { const fb = BB(f); return fb.x >= sb.x && fb.y >= sb.y && fb.x + fb.width <= sb.x + sb.width && fb.y + fb.height <= sb.y + sb.height; }) : 'n/a'));
  }
  report.info.sections = secs;
  const mobx = p02.children.find(n => n.name === 'Mobile'), webx = p02.children.find(n => n.name === 'Web');
  report.info.mobileGap = Math.round(mobx.x - (webx.x + webx.width));
});
return report;
