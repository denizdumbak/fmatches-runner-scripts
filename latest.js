// step 417 · prototip tek giris: 5 eksik baglanti (Other role signup, Change password, Scouts near you, Privacy policy, Directory profil), akis baslangiclari 36 -> 2 (Web · Home, Mobile · Home), erisilebilirlik olcumu
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const plats = { Web: p02.children.find(n => n.type === 'SECTION' && n.name === 'Web'), Mobile: p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile') };
const dev = { Web: 'Desktop', Mobile: 'Mobile' };
const actsOf = r => (r.actions || (r.action ? [r.action] : [])).filter(a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO' && a.destinationId);
const nav = dest => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
const topOf = n => { let c = n; while (c && c.parent && c.parent.type !== 'SECTION' && c.parent.type !== 'PAGE') c = c.parent; return c; };
const tapTarget = (t, frame) => { const p = t.parent; return (p && p.id !== frame.id && (p.type === 'FRAME' || p.type === 'INSTANCE' || p.type === 'COMPONENT') && p.children.length <= 3) ? p : t; };
const screens = {};
for (const key of ['Web', 'Mobile']) { screens[key] = {}; plats[key].findAll(n => n.type === 'FRAME' && n.parent && n.parent.type === 'SECTION' && n.parent !== plats[key]).forEach(f => { screens[key][f.name] = f; }); }
const scr = (key, name) => screens[key][name + ' · ' + dev[key]] || null;
const short = s => s.replace(/ · (Desktop|Mobile)$/, '');

const specs = [
  { label: 'Sign up Account -> Other role', from: ['Sign up / Account'], re: /manager/i, to: { Web: 'Sign up / Account / Other role', Mobile: 'Sign up / Account / Other role' } },
  { label: 'My settings Change password', from: ['Settings / My settings'], re: /change password/i, to: { Web: 'Settings / Change password', Mobile: 'Settings / Change password' } },
  { label: 'Scouts near you', from: ['Map / Default', 'Home / Main'], re: /scouts near you/i, to: { Web: 'Map / Scouts near you · ask', Mobile: 'Map / Scouts near you' } },
  { label: 'Footer Privacy policy', from: ['Home / Main'], re: /^privacy/i, to: { Web: 'System / Privacy policy', Mobile: 'System / Privacy policy' } },
  { label: 'Directory profile (Search Players)', from: ['Search / Players'], re: /not joined|unclaimed|directory/i, to: { Web: 'Profiles / Player / Directory, no photo', Mobile: 'Profiles / Player / Directory, no photo' } }
];
await step('Eksik baglantilar', async () => {
  const out = [];
  for (const key of ['Web', 'Mobile']) for (const sp of specs) {
    const dest = scr(key, sp.to[key]); const tag = key + ' :: ' + sp.label;
    if (!dest) { report.errors.push(tag + ': hedef ekran yok (' + sp.to[key] + ')'); continue; }
    let done = false, seenFrame = null;
    for (const f of sp.from) {
      const frame = scr(key, f); if (!frame) continue; seenFrame = seenFrame || frame;
      const texts = frame.findAll(n => n.type === 'TEXT' && sp.re.test(n.characters));
      if (texts.length === 1) {
        const el = tapTarget(texts[0], frame); const cur = el.reactions || [];
        if (cur.some(r => actsOf(r).length)) { out.push(tag + ': zaten bagli (' + short(frame.name) + ' / ' + el.name + ')'); done = true; break; }
        await el.setReactionsAsync(cur.concat([nav(dest)])); out.push(tag + ': ' + short(frame.name) + ' / "' + texts[0].characters.slice(0, 30) + '" -> ' + short(dest.name)); done = true; break;
      } else if (texts.length > 1) { report.errors.push(tag + ': ' + texts.length + ' aday metin (' + short(frame.name) + '), baglanmadi: ' + texts.slice(0, 6).map(t => '"' + t.characters.slice(0, 24) + '"').join(', ')); done = true; break; }
    }
    if (!done) {
      const labels = []; if (seenFrame) seenFrame.findAll(n => n.type === 'TEXT' && n.characters.length <= 30 && n.visible).forEach(t => { if (labels.indexOf(t.characters) < 0 && labels.length < 45) labels.push(t.characters); });
      report.errors.push(tag + ': eslesen metin yok; ' + (seenFrame ? short(seenFrame.name) + ' metinleri: ' + labels.join(' | ') : 'kaynak ekran yok'));
    }
  }
  report.info.links = out;
});

await step('Akis baslangiclari 36 -> 2', async () => {
  const before = p02.flowStartingPoints; const keep = before.filter(f => f.name === 'Web · Home' || f.name === 'Mobile · Home');
  if (keep.length !== 2) { report.errors.push('Home baslangiclari 2 degil (' + keep.length + '), silme yapilmadi'); return; }
  report.info.removedStarts = before.filter(f => keep.indexOf(f) < 0).map(f => f.name);
  p02.flowStartingPoints = keep.map(f => ({ nodeId: f.nodeId, name: f.name }));
  report.info.flowStartsNow = p02.flowStartingPoints.map(f => f.name);
});

await step('Erisilebilirlik olcumu', async () => {
  for (const key of ['Web', 'Mobile']) {
    const byId = {}, adj = {};
    const list = Object.keys(screens[key]).map(k => screens[key][k]); list.forEach(s => { byId[s.id] = s; });
    for (const s of list) {
      adj[s.id] = new Set(); const holders = s.findAll(n => { try { return n.reactions && n.reactions.length > 0; } catch (e) { return false; } });
      try { if (s.reactions && s.reactions.length) holders.push(s); } catch (e) {}
      for (const h of holders) for (const r of h.reactions) for (const a of actsOf(r)) { let d = null; try { d = await figma.getNodeByIdAsync(a.destinationId); } catch (e) {} if (!d) continue; const t = topOf(d); if (t && byId[t.id]) adj[s.id].add(t.id); }
    }
    const home = scr(key, 'Home / Main'); const seen = new Set([home.id]), q = [home.id];
    while (q.length) { const id = q.shift(); adj[id].forEach(t => { if (!seen.has(t)) { seen.add(t); q.push(t); } }); }
    const un = list.filter(s => !seen.has(s.id) && !/^Note · /.test(s.name)).map(s => short(s.name));
    report.info['reach' + key] = { total: list.length, reachable: seen.size, unreachable: un.length, unreachableScreens: un };
  }
});
return report;
