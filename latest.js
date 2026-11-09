// step 358 · INSPECT (salt okunur): Club card ekranlarındaki prototip bağlantıları, tıklanan öğe -> hedef ekran adı
const report = { done: [], errors: [], info: { frames: {}, foreign: [] } };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const secs = [web, mob].map(p => p.children.find(n => n.type === 'SECTION' && n.name === 'Club card'));
const nameCache = {};
async function destName(id) { if (nameCache[id] !== undefined) return nameCache[id]; const d = await figma.getNodeByIdAsync(id); nameCache[id] = d ? d.name : 'YOK'; return nameCache[id]; }
await step('club card links', async () => {
  for (const s of secs) {
    if (!s) { report.errors.push('Club card Section yok'); continue; }
    for (const f of s.children.filter(n => n.type === 'FRAME')) {
      const rows = []; let total = 0;
      const nodes = [f].concat(f.findAll(x => 'reactions' in x && x.reactions && x.reactions.length));
      for (const n of nodes) {
        if (!n.reactions || !n.reactions.length) continue;
        for (const r of n.reactions) for (const a of (r.actions || [])) {
          if (!a || a.type !== 'NODE' || !a.destinationId) continue;
          total++;
          const dn = await destName(a.destinationId);
          const trig = r.trigger ? r.trigger.type : '-';
          const label = (n.type === 'INSTANCE' || n.type === 'FRAME' ? n.name : n.type + ':' + n.name) + (n.parent ? ' [' + n.parent.name + ']' : '');
          if (rows.length < 40) rows.push(trig + ' · ' + label + ' -> ' + dn + (a.navigation === 'CHANGE_TO' ? ' (CHANGE_TO)' : ''));
          if (!/Club card|Staff tab|Women's club|Minimal data|Team list open|Player|Profiles|Map|Search|Facilities|Events/.test(dn)) report.info.foreign.push(f.name + ': ' + label + ' -> ' + dn);
        }
      }
      report.info.frames[f.name] = { total, shown: rows };
    }
  }
});
return report;
