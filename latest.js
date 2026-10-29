// step 265 · read-only inspect: Message menu position vs. its bubble (Web + Mobile): bubbles, menu instance, thread/composer boxes
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync(); await figma.setCurrentPageAsync(p02);
const R = v => Math.round(v);
const BB = n => n.absoluteBoundingBox;
const box = (pg, n) => { const a = BB(pg), b = BB(n); return '(' + R(b.x - a.x) + ',' + R(b.y - a.y) + ' ' + R(b.width) + 'x' + R(b.height) + ')'; };
const frameIn = nm => p02.findOne(n => n.type === 'FRAME' && n.name === nm);
async function dump(label, nm) {
  const pg = frameIn(nm); if (!pg) { report.errors.push('missing page: ' + nm); return; }
  const out = [];
  const msgs = pg.findOne(n => n.name === 'Messages');
  out.push('page ' + R(BB(pg).width) + 'x' + R(BB(pg).height));
  if (msgs) { out.push('Messages ' + box(pg, msgs)); for (const c of msgs.children) { let extra = ''; if (c.type === 'INSTANCE') { const mc = await c.getMainComponentAsync(); extra = ' [' + (mc ? mc.name : '?') + ']'; } out.push('  bubble ' + c.name + extra + ' ' + box(pg, c) + (c.visible === false ? ' HIDDEN' : '')); } } else out.push('no Messages frame');
  const th = pg.findOne(n => n.name === 'Thread'); if (th) out.push('Thread ' + box(pg, th));
  const comp = pg.findOne(n => n.type === 'INSTANCE' && /^Composer/.test(n.name)); if (comp) out.push('Composer ' + box(pg, comp));
  for (const m of pg.findAll(n => /menu/i.test(n.name) && (n.type === 'INSTANCE' || n.type === 'FRAME'))) { const mc = m.type === 'INSTANCE' ? await m.getMainComponentAsync() : null; out.push('MENU-ish ' + m.type + ' "' + m.name + '"' + (mc ? ' <' + mc.name + '>' : '') + ' ' + box(pg, m) + ' parent=' + m.parent.name); }
  report.info[label] = out;
}
await step('Web: Default + Message menu', async () => { await dump('web_default', 'Messenger / Default · Desktop'); await dump('web_menu', 'Messenger / Message menu · Desktop'); });
await step('Mobile: Thread + Message menu', async () => { await dump('mob_thread', 'Messenger / Thread · Mobile'); await dump('mob_menu', 'Messenger / Message menu · Mobile'); });
return report;
