// step 229 · READ-ONLY inspect of prototype state: flow starts, reactions, unreachable screens, Map entry points

const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const out = {}; const r = n => Math.round(n);
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web'); const mob = p02.children.find(n => n.type === 'SECTION' && /^Mobile/.test(n.name));
const isScreen = n => n.type === 'FRAME' && (n.width === 1440 || n.width === 390) && n.height > 300 && / · (Desktop|Mobile)$/.test(n.name);
const collect = root => { const res = []; const walk = n => { if (isScreen(n)) { res.push(n); return; } if ('children' in n) n.children.forEach(walk); }; walk(root); return res; };
const screens = { Web: collect(web), Mobile: collect(mob) };
const byId = {}; for (const k in screens) for (const s of screens[k]) byId[s.id] = s;
// flow starts
const fs = p02.flowStartingPoints || [];
out.flowStarts = fs.map(f => f.name + ' -> ' + (byId[f.nodeId] ? byId[f.nodeId].name : f.nodeId));
// reactions
const dest = new Set(), srcCount = {}; let totalR = 0, broken = 0;
for (const k in screens) for (const s of screens[k]) {
  const nodes = [s].concat(s.findAll(n => 'reactions' in n && n.reactions && n.reactions.length));
  let c = 0;
  for (const n of nodes) for (const rx of (n.reactions || [])) { const acts = rx.actions || (rx.action ? [rx.action] : []); for (const a of acts) { if (a && a.type === 'NODE' && a.destinationId) { totalR++; c++; if (byId[a.destinationId]) dest.add(a.destinationId); else { const t = figma.getNodeById ? null : null; broken++; } } } }
  srcCount[s.id] = c;
}
out.totals = { screensWeb: screens.Web.length, screensMobile: screens.Mobile.length, reactions: totalR, destNotAScreen: broken };
const starts = new Set(fs.map(f => f.nodeId));
for (const k in screens) {
  out['noOutgoing_' + k] = screens[k].filter(s => !srcCount[s.id]).map(s => s.name);
  out['unreachable_' + k] = screens[k].filter(s => !dest.has(s.id) && !starts.has(s.id)).map(s => s.name);
}
// map screens status
const mapScreens = screens.Web.concat(screens.Mobile).filter(s => /^Map \//.test(s.name));
out.mapScreens = mapScreens.map(s => s.name + ' | out ' + srcCount[s.id] + ' | inbound ' + (dest.has(s.id) ? 'yes' : 'no'));
// nav: does Navigation have reactions in a sample (desktop home and mobile)
const navInfo = [];
for (const nm of ['Home / Main · Desktop', 'Profiles / Player · Desktop', 'Profiles / Manager · Mobile']) { const s = screens.Web.concat(screens.Mobile).find(x => x.name === nm); if (!s) continue; const nav = s.children.find(c => c.name === 'Navigation'); if (!nav) continue; const rs = nav.findAll(n => n.reactions && n.reactions.length).map(n => n.name + '->' + (n.reactions[0].actions && n.reactions[0].actions[0] ? (byId[n.reactions[0].actions[0].destinationId] ? byId[n.reactions[0].actions[0].destinationId].name : '?') : '?')); navInfo.push(nm + ': ' + (rs.length ? rs.join('; ') : 'no reactions in Navigation') + ' | texts: ' + nav.findAll(n => n.type === 'TEXT').map(t => t.characters).slice(0, 8).join(' / ')); }
out.navigation = navInfo;
return out;
