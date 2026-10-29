// step 266 · Message menu sits right under its own bubble (Web + Mobile): top = bubble bottom + 8, flips above when it would hit the composer; right edge = bubble right edge
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync(); await figma.setCurrentPageAsync(p02);
const R = v => Math.round(v);
const BB = n => n.absoluteBoundingBox;
const GAP = 8;
async function fix(label, pageName) {
  const pg = p02.findOne(n => n.type === 'FRAME' && n.name === pageName);
  if (!pg) throw new Error('missing page: ' + pageName);
  const msgs = pg.findOne(n => n.name === 'Messages');
  const row = msgs && msgs.children.find(c => c.name === 'Message · Mine · Text');
  if (!row) throw new Error('own message row not found on ' + pageName);
  const inner = row.findOne(n => n.name === 'Bubble') || row;
  const menu = pg.findOne(n => n.type === 'INSTANCE' && n.name === 'Message menu');
  if (!menu) throw new Error('Message menu not found on ' + pageName);
  const comp = pg.findOne(n => n.type === 'INSTANCE' && /^Composer/.test(n.name));
  const P = BB(pg), b = BB(inner), m0 = BB(menu), c = comp ? BB(comp) : { y: P.y + P.height };
  const before = { gap: R(m0.y - (b.y + b.height)), y: R(m0.y - P.y) };
  let top = b.y + b.height + GAP, flipped = false;
  if (top + m0.height > c.y - 8) { top = b.y - GAP - m0.height; flipped = true; }
  menu.x += (b.x + b.width - m0.width) - m0.x;
  menu.y += top - m0.y;
  const a = BB(menu);
  const gapAfter = flipped ? R(b.y - (a.y + a.height)) : R(a.y - (b.y + b.height));
  report.info[label] = {
    usedInner: inner === row ? 'ROW (no Bubble child found)' : 'Bubble',
    bubble: '(' + R(b.x - P.x) + ',' + R(b.y - P.y) + ' ' + R(b.width) + 'x' + R(b.height) + ')',
    menuBefore: before.y + ' (gap ' + before.gap + ')',
    menuAfter: '(' + R(a.x - P.x) + ',' + R(a.y - P.y) + ' ' + R(a.width) + 'x' + R(a.height) + ')',
    gapAfter, flipped,
    rightEdgesEqual: R(a.x + a.width) === R(b.x + b.width),
    insidePage: a.y >= P.y && a.y + a.height <= P.y + P.height && a.x >= P.x && a.x + a.width <= P.x + P.width
  };
}
await step('Web: Message menu', async () => { await fix('web', 'Messenger / Message menu · Desktop'); });
await step('Mobile: Message menu', async () => { await fix('mobile', 'Messenger / Message menu · Mobile'); });
return report;
