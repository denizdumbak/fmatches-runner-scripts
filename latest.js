// step 369 · inspect (368 hatası): "node 907:45829 does not exist" hangi aşamada? klon, satır taraması, yetim "Unread only" kalıntıları
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const R = n => Math.round(n);
const secOf = (plat, name) => { const root = p02.children.find(n => n.type === 'SECTION' && n.name === plat); return root ? root.children.find(n => n.type === 'SECTION' && n.name === name) : null; };

await step('907:45829 nedir', async () => {
  const n = await figma.getNodeByIdAsync('907:45829');
  report.info.node907 = n ? (n.type + ' ' + n.name + ' | parent ' + (n.parent ? n.parent.type + ' ' + n.parent.name : 'yok')) : 'bulunamadi (silinmis)';
});

await step('kalintilar', async () => {
  const found = p02.findAll(n => /Unread only/.test(n.name));
  report.info.leftovers = found.map(n => n.type + ' ' + n.name + ' ' + R(n.width) + 'x' + R(n.height));
  report.info.sectionChildren = {};
  for (const plat of ['Web', 'Mobile']) { const sec = secOf(plat, 'Notifications'); report.info.sectionChildren[plat] = sec.children.map(c => c.type + ' ' + c.name + ' @' + R(c.x) + ',' + R(c.y)); }
});

await step('klon testi (sonunda silinir)', async () => {
  for (const plat of ['Web', 'Mobile']) {
    const d = plat === 'Web' ? 'Desktop' : 'Mobile';
    const sec = secOf(plat, 'Notifications'); const base = sec.children.find(c => c.type === 'FRAME' && c.name === 'Notifications / Notifications · ' + d);
    const log = [];
    let c = null;
    try { c = base.clone(); log.push('clone ok, parent ' + (c.parent ? c.parent.name : 'yok')); } catch (e) { log.push('clone HATA: ' + e.message); }
    if (c) {
      try {
        const insts = c.findAll(n => n.type === 'INSTANCE'); log.push('klonda instance ' + insts.length);
        const bad = [];
        for (const inst of insts) {
          try { const m = await inst.getMainComponentAsync(); if (!m) { bad.push(inst.name + ': main yok'); continue; } const p = m.parent; if (p) { p.type; } }
          catch (e) { bad.push(inst.name + ' (' + inst.id + '): ' + e.message); }
        }
        log.push('bozuk instance ' + bad.length); report.info['bad ' + plat] = bad.slice(0, 12);
      } catch (e) { log.push('tarama HATA: ' + e.message); }
      try { const rx = []; for (const n of c.findAll(() => true)) { if (n.reactions && n.reactions.length) for (const r of n.reactions) for (const a of (r.actions || [])) if (a && a.destinationId) { const t = await figma.getNodeByIdAsync(a.destinationId); if (!t) rx.push(n.name + ' -> ' + a.destinationId + ' YOK'); } } log.push('kopuk reaction ' + rx.length); report.info['brokenReactions ' + plat] = rx.slice(0, 12); } catch (e) { log.push('reaction taramasi HATA: ' + e.message); }
      try { c.remove(); log.push('klon silindi'); } catch (e) { log.push('silme HATA: ' + e.message); }
    }
    report.info['clone ' + plat] = log;
  }
});

await step('satir ozellikleri (base)', async () => {
  const sec = secOf('Web', 'Notifications'); const base = sec.children.find(c => c.type === 'FRAME' && c.name === 'Notifications / Notifications · Desktop');
  const out = [];
  for (const inst of base.findAll(n => n.type === 'INSTANCE')) { const m = await inst.getMainComponentAsync(); const sn = m && m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent.name : (m ? m.name : '?'); if (/Notification row/.test(sn)) out.push(inst.name + ' | ' + Object.keys(inst.componentProperties).map(k => k + '=' + inst.componentProperties[k].value).join(', ')); }
  report.info.rowProps = out;
});
return report;
