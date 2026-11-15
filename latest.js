// step 418 · INSPECT (salt okunur): Home'dan her ozellik ekranina en kisa tiklama yolu + Account menu varyantlari ve Scouts near you giris adaylari
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const plats = { Web: p02.children.find(n => n.type === 'SECTION' && n.name === 'Web'), Mobile: p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile') };
const dev = { Web: 'Desktop', Mobile: 'Mobile' };
const actsOf = r => (r.actions || (r.action ? [r.action] : [])).filter(a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO' && a.destinationId);
const topOf = n => { let c = n; while (c && c.parent && c.parent.type !== 'SECTION' && c.parent.type !== 'PAGE') c = c.parent; return c; };
const short = s => s.replace(/ · (Desktop|Mobile)$/, '');
const visTexts = (node, max) => { const out = []; node.findAll(n => n.type === 'TEXT' && n.visible).forEach(t => { if (out.length < max) out.push(t.characters.slice(0, 28)); }); return out; };

const features = ['Search / All results', 'Profiles / Player', 'Profiles / Manager', 'Profiles / Player / Own profile', 'Profiles / Player / Own profile / Edit details', 'Sign up / Account', 'Sign up / Check your email', 'Signup / Email verified', 'Log in', 'Map / Default', 'Map / Club card', 'Map / Events', 'Map / Match requests', 'Map / Scouts near you · ask', 'Map / Scouts near you', 'Messenger / Default', 'Events / Event card / Manager', 'Events / Create event', 'Events / My events', 'Contacts / My contacts', 'Settings / My settings', 'Notifications / Notifications', 'Shortlists / Shortlists', 'Clubs / Club card', 'Facilities / Stadium card', 'Search / Players', 'Search / Clubs', 'System / Privacy policy', 'System / Cookie settings'];
await step('En kisa yollar (Home baslangicindan)', async () => {
  for (const key of ['Web', 'Mobile']) {
    const plat = plats[key]; const list = plat.findAll(n => n.type === 'FRAME' && n.parent && n.parent.type === 'SECTION' && n.parent !== plat);
    const byId = {}, byName = {}, adj = {}; list.forEach(s => { byId[s.id] = s; byName[s.name] = s; });
    for (const s of list) {
      adj[s.id] = {}; const holders = s.findAll(n => { try { return n.reactions && n.reactions.length > 0; } catch (e) { return false; } });
      try { if (s.reactions && s.reactions.length) holders.push(s); } catch (e) {}
      for (const h of holders) for (const r of h.reactions) for (const a of actsOf(r)) { let d = null; try { d = await figma.getNodeByIdAsync(a.destinationId); } catch (e) {} if (!d) continue; const t = topOf(d); if (t && byId[t.id] && !adj[s.id][t.id]) adj[s.id][t.id] = h.name.slice(0, 30); }
    }
    const home = byName['Home / Main · ' + dev[key]]; const prev = {}; prev[home.id] = null; const q = [home.id];
    while (q.length) { const id = q.shift(); Object.keys(adj[id]).forEach(t => { if (!(t in prev)) { prev[t] = id; q.push(t); } }); }
    const paths = {};
    for (const f of features) {
      const s = byName[f + ' · ' + dev[key]]; if (!s) { paths[f] = 'EKRAN YOK'; continue; }
      if (!(s.id in prev)) { paths[f] = 'ULASILAMIYOR'; continue; }
      const chain = []; let c = s.id; while (prev[c] !== null) { chain.unshift(short(byId[c].name) + ' <-[' + adj[prev[c]][c] + ']'); c = prev[c]; }
      paths[f] = chain.length + ' tik: ' + chain.map(x => x.replace(/ <-\[.*\]$/, '')).join(' > ');
    }
    report.info['paths' + key] = paths;
  }
});

await step('Account menu varyantlari', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Account menu');
  report.info.accountMenuSet = set ? set.children.map(v => v.name + ' :: ' + visTexts(v, 14).join(' | ')) : 'Account menu set yok';
  const frames = [];
  for (const key of ['Web', 'Mobile']) plats[key].findAll(n => n.type === 'INSTANCE' && /account menu/i.test(n.name)).forEach(i => { const t = topOf(i); frames.push(key + ' :: ' + (t ? t.name : '?') + ' :: ' + JSON.stringify(i.componentProperties ? Object.keys(i.componentProperties).map(k => k + '=' + i.componentProperties[k].value) : [])); });
  report.info.accountMenuInstances = frames.length ? frames : 'hic instance yok';
});

await step('Scouts near you giris adaylari', async () => {
  const out = {};
  for (const key of ['Web', 'Mobile']) for (const nm of ['Home / Main', 'Profiles / Player', 'Profiles / Player / Own profile', 'Menu']) {
    const s = plats[key].findOne(n => n.type === 'FRAME' && n.name === nm + ' · ' + dev[key]); if (!s) continue;
    const hits = s.findAll(n => n.type === 'TEXT' && /scout|trial|near you/i.test(n.characters)).map(t => '"' + t.characters.slice(0, 40) + '" @' + Math.round(t.absoluteBoundingBox ? t.absoluteBoundingBox.y - s.absoluteBoundingBox.y : 0));
    out[key + ' ' + nm] = hits.length ? hits : 'yok';
  }
  report.info.scoutsCandidates = out;
  const st = p02.findOne(n => n.type === 'FRAME' && n.name === 'Settings / My settings · Desktop');
  report.info.settingsAccountCard = st ? visTexts(st, 80).filter((t, i, a) => /account|delete|password|about|support|privacy|terms|language/i.test(t)) : 'yok';
});
return report;
