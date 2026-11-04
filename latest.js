// step 289 · My settings pages (Web + Mobile) in new Section "My settings": default (Privacy, Notifications, Blocked people) + No blocked people; derived from Contacts / My contacts; Account menu "Settings" row link; flow starts
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
const PAD = (n, t, r, b, l) => { n.setBoundVariable('paddingTop', V(t)); n.setBoundVariable('paddingRight', V(r)); n.setBoundVariable('paddingBottom', V(b)); n.setBoundVariable('paddingLeft', V(l)); };
const GAP = (n, v) => n.setBoundVariable('itemSpacing', V(v));
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
const nav = (dest, fade) => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: fade ? { type: 'DISSOLVE', easing: { type: 'EASE_OUT' }, duration: 0.2 } : { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
async function setNav(el, to, fade) { const keep = (el.reactions || []).filter(r => !(r.actions || []).some(isNavAct)); await el.setReactionsAsync(keep.concat([nav(to, fade)])); }
async function clearNavAll(root) { for (const n of root.findAll(x => 'reactions' in x && x.reactions && x.reactions.length)) { const keep = n.reactions.filter(r => !(r.actions || []).some(isNavAct)); if (keep.length !== n.reactions.length) await n.setReactionsAsync(keep); } }
const setText = async (node, str) => { for (const seg of node.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); node.characters = str; };
const sz = n => Math.round(n.width) + 'x' + Math.round(n.height);
const BB = n => n.absoluteBoundingBox;
const frameIn = name => p02.findOne(n => n.type === 'FRAME' && n.name === name);
const findSet = nm => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === nm);
const contactSet = findSet('Contact row'), settingSet = findSet('Setting row'), optionSet = findSet('Option row'), emptySet = findSet('Empty card'), eventSet = findSet('Event row');
if (!contactSet || !settingSet || !optionSet || !emptySet || !eventSet) throw new Error('component missing (Contact row / Setting row / Option row / Empty card / Event row)');
if (!contactSet.children.some(v => /Kind=Blocked/.test(v.name))) throw new Error('Contact row Kind=Blocked missing: run step 288');
const srcHeading = emptySet.children[0].findOne(n => n.type === 'TEXT' && n.name === 'Section heading');
const srcBody = eventSet.children.find(v => v.name === 'Device=Desktop, State=Default').findOne(n => n.type === 'TEXT' && n.name === 'Dates');
if (!srcHeading || !srcBody) throw new Error('heading/body source text missing');

async function cardHead(title, help) {
  const f = figma.createFrame(); f.name = 'Card head'; f.fills = []; f.clipsContent = false; f.layoutMode = 'VERTICAL'; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; GAP(f, 'spacing/2xs');
  f.setBoundVariable('paddingBottom', V('spacing/xs'));
  const h = srcHeading.clone(); h.name = 'Card heading'; await setText(h, title); h.textAutoResize = 'WIDTH_AND_HEIGHT'; f.appendChild(h);
  const t = srcBody.clone(); t.name = 'Card help'; await setText(t, help); t.fills = [P(V('color/text/secondary'))]; f.appendChild(t); t.layoutSizingHorizontal = 'FILL';
  return f;
}
async function optionInst(label, sub, selected) {
  const v = optionSet.children.find(x => x.name.indexOf('State=' + (selected ? 'Selected' : 'Default')) >= 0); if (!v) throw new Error('Option row variant');
  const i = v.createInstance(); i.name = 'Option · ' + label; const pr = {};
  for (const k of Object.keys(i.componentProperties)) { if (/^Code#/.test(k)) pr[k] = false; if (/^Sub#/.test(k)) pr[k] = true; }
  i.setProperties(pr);
  await setText(i.findOne(n => n.type === 'TEXT' && n.name === 'Label'), label);
  await setText(i.findOne(n => n.type === 'TEXT' && n.name === 'Sub'), sub);
  return i;
}
async function settingInst(dev, title, sub, on, last) {
  const v = settingSet.children.find(x => x.name === 'Device=' + dev + ', Divider=' + (last ? 'Off' : 'On')); if (!v) throw new Error('Setting row variant');
  const i = v.createInstance(); i.name = 'Setting · ' + title;
  await setText(i.findOne(n => n.type === 'TEXT' && n.name === 'Title'), title);
  await setText(i.findOne(n => n.type === 'TEXT' && n.name === 'Sub'), sub);
  const sw = i.findOne(n => n.type === 'INSTANCE' && n.name === 'Switch'); const pr = {};
  for (const k of Object.keys(sw.componentProperties)) if (/^Checked/.test(k)) pr[k] = on ? 'On' : 'Off';
  sw.setProperties(pr);
  return i;
}
async function blockedInst(dev, name, meta) {
  const v = contactSet.children.find(x => x.name === 'Device=' + dev + ', Kind=Blocked, State=Default'); if (!v) throw new Error('Blocked variant');
  const i = v.createInstance(); i.name = 'Blocked · ' + name;
  await setText(i.findOne(n => n.type === 'TEXT' && n.name === 'Name'), name);
  await setText(i.findOne(n => n.type === 'TEXT' && n.name === 'Meta'), meta);
  return i;
}

await step('cleanup previous run', async () => {
  for (const root of p02.children.filter(n => n.name === 'Web' || n.name === 'Mobile')) for (const s of root.children.filter(c => c.type === 'SECTION' && c.name === 'My settings')) s.remove();
});

const created = { Desktop: {}, Mobile: {} };
for (const dev of ['Desktop', 'Mobile']) {
  await step('pages ' + dev, async () => {
    const root = p02.children.find(n => n.name === (dev === 'Desktop' ? 'Web' : 'Mobile'));
    const prev = root.children.find(c => c.type === 'SECTION' && c.name === 'My contacts'); if (!prev) throw new Error('My contacts section missing: run step 287');
    const src = frameIn('Contacts / My contacts · ' + dev); if (!src) throw new Error('My contacts page missing');
    const sec = figma.createSection(); sec.name = 'My settings'; root.appendChild(sec);
    sec.fills = prev.fills; sec.x = prev.x; sec.y = prev.y + prev.height + 160;
    const defs = [['Default', 'Settings / My settings · ' + dev, false], ['NoBlocked', 'Settings / My settings / No blocked people · ' + dev, true]];
    let col = 0, maxH = 0;
    for (const [key, nm, empty] of defs) {
      const page = src.clone(); page.name = nm; sec.appendChild(page);
      page.x = dev === 'Desktop' ? 80 + col * 1920 : 80 + col * 470; page.y = dev === 'Desktop' ? 100 : 80; col++;
      await clearNavAll(page);
      p02.flowStartingPoints = p02.flowStartingPoints.filter(f => f.nodeId !== page.id);
      const body = page.findOne(n => n.name === 'My contacts body'); body.name = 'My settings body';
      const colm = body.findOne(n => n.name === 'Column');
      await setText(colm.findOne(n => n.type === 'TEXT' && n.name === 'Title'), 'Settings');
      const cta = colm.findOne(n => n.type === 'INSTANCE' && n.name === 'Button · Find people'); if (cta) cta.remove();
      const tabs = colm.findOne(n => n.name === 'Tabs'); if (tabs) tabs.remove();
      const tpl = colm.findOne(n => n.name === 'List card');
      const mkCard = name => { const c = tpl.clone(); c.name = name; for (const k of c.children.slice()) k.remove(); if (dev === 'Desktop') PAD(c, 'spacing/lg', 'spacing/xl', 'spacing/lg', 'spacing/xl'); else PAD(c, 'spacing/md', 'spacing/md', 'spacing/md', 'spacing/md'); return c; };
      const cards = [mkCard('Privacy card'), mkCard('Notifications card'), mkCard('Blocked people card')];
      tpl.remove();
      for (const c of cards) { colm.appendChild(c); c.layoutSizingHorizontal = 'FILL'; }
      if (dev === 'Desktop') { colm.resize(720, colm.height); colm.primaryAxisSizingMode = 'AUTO'; const hr = colm.findOne(n => n.name === 'Heading row'); hr.layoutSizingHorizontal = 'FILL'; }
      // Privacy
      const [cp, cn, cb] = cards;
      cp.appendChild(await cardHead('Privacy', 'Choose who can find your profile and write to you.')); cp.children[0].layoutSizingHorizontal = 'FILL';
      for (const [l, s, sel] of [['Public', 'Anyone can find you and send you a message.', false], ['Connections only', 'Anyone can find you; only your connections can send messages.', true], ['Hidden', 'You do not appear in search results or on the map.', false]]) { const o = await optionInst(l, s, sel); cp.appendChild(o); o.layoutSizingHorizontal = 'FILL'; }
      GAP(cp, 'spacing/xs');
      // Notifications
      cn.appendChild(await cardHead('Notifications', 'Choose what we email you about.')); cn.children[0].layoutSizingHorizontal = 'FILL';
      const ns = [['New messages', 'When someone writes to you', true], ['Connection requests', 'When someone wants to connect with you', true], ['Event requests and replies', 'When someone asks to join your event, and when yours is answered', true], ['New tournaments and matches', 'When a new tournament or match is published', false]];
      for (let k = 0; k < ns.length; k++) { const r = await settingInst(dev, ns[k][0], ns[k][1], ns[k][2], k === ns.length - 1); cn.appendChild(r); r.layoutSizingHorizontal = 'FILL'; }
      // Blocked people
      cb.appendChild(await cardHead('Blocked people', 'Blocked people cannot message you or send you contact requests.')); cb.children[0].layoutSizingHorizontal = 'FILL';
      if (!empty) { for (const [n, m] of [['Rui Santos', 'Player · Coastal United'], ['Karim Haddad', 'Manager · Harbour City']]) { const b = await blockedInst(dev, n, m); cb.appendChild(b); b.layoutSizingHorizontal = 'FILL'; } }
      else { const t = srcBody.clone(); t.name = 'No blocked'; await setText(t, 'You have not blocked anyone.'); t.fills = [P(V('color/text/secondary'))]; cb.appendChild(t); t.layoutSizingHorizontal = 'FILL'; }
      created[dev][key] = page; maxH = Math.max(maxH, page.height);
    }
    sec.resizeWithoutConstraints(dev === 'Desktop' ? 80 + 2 * 1920 - 480 : 80 + 2 * 470 - 10, (dev === 'Desktop' ? 100 : 80) + maxH + 100);
    root.resizeWithoutConstraints(root.width, Math.max(root.height, sec.y + sec.height + 120));
  });
}

await step('links + flow starts', async () => {
  let n = 0;
  for (const dev of ['Desktop', 'Mobile']) {
    const c = created[dev]; if (!c.Default) throw new Error('page missing ' + dev);
    const am = frameIn('Events / Account menu · ' + dev);
    if (am) { const row = am.findOne(x => x.name === 'Row · Settings'); if (row) { await setNav(row, c.Default, false); n++; } else report.errors.push('Account menu page has no Row · Settings (' + dev + ')'); }
    p02.flowStartingPoints = p02.flowStartingPoints.filter(f => f.nodeId !== c.Default.id).concat([{ nodeId: c.Default.id, name: (dev === 'Desktop' ? 'Web' : 'Mobile') + ' · My settings' }]);
  }
  report.info.linksAdded = n;
});

await step('verify', async () => {
  let links = 0, broken = 0;
  for (const root of p02.children.filter(n => n.name === 'Web' || n.name === 'Mobile')) for (const nd of root.findAll(x => 'reactions' in x && x.reactions && x.reactions.length)) for (const r of nd.reactions) for (const a of (r.actions || [])) if (isNavAct(a)) { links++; const d = a.destinationId ? await figma.getNodeByIdAsync(a.destinationId) : null; if (!d) broken++; }
  report.info.linksAll = links + ' links, ' + broken + ' broken'; report.info.flowStartCount = p02.flowStartingPoints.length;
  const out = {};
  for (const dev of ['Desktop', 'Mobile']) for (const k of Object.keys(created[dev])) {
    const pg = created[dev][k]; const colm = pg.findOne(n => n.name === 'Column');
    const cards = colm.children.filter(c => /card$/.test(c.name));
    const uns = []; for (const n of pg.findAll(() => true)) if (n.type === 'TEXT' && !n.textStyleId) uns.push(n.name);
    const outside = []; for (const c of cards) { const cb = BB(c); for (const ch of c.children) { const b = BB(ch); if (b.x < cb.x - .5 || b.x + b.width > cb.x + cb.width + .5) outside.push(c.name + ' › ' + ch.name); } }
    const sw = pg.findAll(n => n.type === 'INSTANCE' && n.name === 'Switch').map(s => Object.values(s.componentProperties).filter(p => p.type === 'VARIANT').map(p => p.value).join('')).join(' ');
    const opts = pg.findAll(n => n.type === 'INSTANCE' && /^Option ·/.test(n.name)).map(o => o.name.replace('Option · ', '') + ':' + (o.componentProperties.State ? o.componentProperties.State.value : '?')).join(' | ');
    out[dev + '/' + k] = { page: sz(pg), column: sz(colm), cards: cards.map(c => c.name.replace(' card', '') + ' ' + sz(c)).join(' | '), rowsOutsideCard: outside.length ? outside.slice(0, 5) : 'none', switches: sw, options: opts, unstyledText: uns.length ? uns.slice(0, 4) : 'none' };
  }
  report.info.pages = out;
  const secs = [];
  for (const root of p02.children.filter(n => n.name === 'Web' || n.name === 'Mobile')) {
    const s = root.children.find(c => c.type === 'SECTION' && c.name === 'My settings'); const sb = BB(s), rb = BB(root); const ov = [];
    for (const a of root.children.filter(c => c.type === 'SECTION' && c !== s)) { const ab = BB(a); if (ab.x < sb.x + sb.width && sb.x < ab.x + ab.width && ab.y < sb.y + sb.height && sb.y < ab.y + ab.height) ov.push(a.name); }
    secs.push(root.name + ': section ' + sz(s) + ' @' + Math.round(s.x) + ',' + Math.round(s.y) + ' · platform ' + sz(root) + ' · overlaps ' + (ov.length ? ov.join(',') : 'none') + ' · inside platform ' + (sb.x + sb.width <= rb.x + rb.width && sb.y + sb.height <= rb.y + rb.height) + ' · pages inside ' + s.children.every(f => { const fb = BB(f); return fb.x >= sb.x && fb.y >= sb.y && fb.x + fb.width <= sb.x + sb.width && fb.y + fb.height <= sb.y + sb.height; }));
  }
  report.info.sections = secs;
  const mobx = p02.children.find(n => n.name === 'Mobile'), webx = p02.children.find(n => n.name === 'Web'); report.info.mobileGap = Math.round(mobx.x - (webx.x + webx.width));
});
return report;
