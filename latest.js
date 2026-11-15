// step 415 · INSPECT (salt okunur, hicbir sey degismez): 02 · Website akis baslangiclari (36) + Web ve Mobile Home'dan prototip erisilebilirligi (hangi ekrana bu iki baslangictan gidilemez)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const plats = { Web: p02.children.find(n => n.type === 'SECTION' && n.name === 'Web'), Mobile: p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile') };
const topOf = n => { let c = n; while (c && c.parent && c.parent.type !== 'SECTION' && c.parent.type !== 'PAGE') c = c.parent; return c; };
const topOfSec = (n, plat) => { let c = n; while (c && c.parent && c.parent !== plat && c.parent.type !== 'PAGE') c = c.parent; return c; };
const actsOf = r => (r.actions || (r.action ? [r.action] : [])).filter(a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO' && a.destinationId);
const destCache = {};
async function destNode(id) { if (!(id in destCache)) { try { destCache[id] = await figma.getNodeByIdAsync(id); } catch (e) { destCache[id] = null; } } return destCache[id]; }

const data = {};
await step('Ekranlar ve baglantilar', async () => {
  for (const key of ['Web', 'Mobile']) {
    const plat = plats[key]; if (!plat) { report.errors.push(key + ' Section yok'); continue; }
    const screens = plat.findAll(n => n.type === 'FRAME' && n.parent && n.parent.type === 'SECTION' && n.parent !== plat);
    const byId = {}; screens.forEach(s => { byId[s.id] = s; });
    const adj = {}, inbound = {}, cross = [];
    let linkCount = 0;
    for (const s of screens) {
      adj[s.id] = new Set();
      const holders = s.findAll(n => { try { return n.reactions && n.reactions.length > 0; } catch (e) { return false; } });
      try { if (s.reactions && s.reactions.length) holders.push(s); } catch (e) {}
      for (const h of holders) for (const r of h.reactions) for (const a of actsOf(r)) {
        const d = await destNode(a.destinationId); if (!d) continue;
        const t = topOfSec(d, plat);
        if (t && byId[t.id]) { adj[s.id].add(t.id); inbound[t.id] = (inbound[t.id] || 0) + 1; linkCount++; }
        else cross.push(s.name + ' -> ' + (d.name || a.destinationId));
      }
    }
    data[key] = { plat, screens, byId, adj, inbound, cross, linkCount };
  }
});

await step('Akis baslangiclari', async () => {
  const starts = p02.flowStartingPoints; const out = { Web: [], Mobile: [], other: [] };
  for (const f of starts) {
    const n = await destNode(f.nodeId); let key = 'other', scr = n ? n.name : '(yok)';
    if (n) for (const k of ['Web', 'Mobile']) { const pl = plats[k]; if (pl) { let c = n, inside = false; while (c) { if (c === pl) { inside = true; break; } c = c.parent; } if (inside) { key = k; const t = data[k] && data[k].byId[topOfSec(n, pl).id]; scr = t ? t.name : n.name; } } }
    out[key].push(f.name + ' -> ' + scr);
  }
  report.info.flowStartCount = starts.length;
  report.info.flowStarts = out;
});

await step('Erisilebilirlik (Home baslangicindan)', async () => {
  for (const key of ['Web', 'Mobile']) {
    const d = data[key]; if (!d) continue;
    const homes = d.screens.filter(s => /^Home \/ Main/.test(s.name));
    const home = homes.filter(s => /Desktop|Mobile/.test(s.name))[0] || homes[0];
    const info = { totalScreens: d.screens.length, links: d.linkCount, homeCandidates: homes.map(s => s.name), crossPlatformOrExternalLinks: d.cross.length ? d.cross.slice(0, 10) : 'none' };
    if (!home) { info.error = 'Home / Main ekrani bulunamadi'; report.info['reach' + key] = info; continue; }
    const seen = new Set([home.id]), q = [home.id];
    while (q.length) { const id = q.shift(); d.adj[id].forEach(t => { if (!seen.has(t)) { seen.add(t); q.push(t); } }); }
    const startIds = new Set(p02.flowStartingPoints.map(f => f.nodeId));
    const un = d.screens.filter(s => !seen.has(s.id));
    const bySec = {};
    for (const s of un) {
      const hasStart = startIds.has(s.id) || s.findOne(n => startIds.has(n.id));
      const tag = (hasStart ? '[start] ' : '') + s.name + (d.inbound[s.id] ? '' : ' (kimse baglanmiyor)');
      (bySec[s.parent.name] = bySec[s.parent.name] || []).push(tag);
    }
    info.home = home.name; info.reachable = seen.size; info.unreachable = un.length; info.unreachableBySection = bySec;
    report.info['reach' + key] = info;
  }
});
return report;
