// step 261 · Mobile messenger fixes: new "Message bubble · Mobile" set (row 358, bubble max 280, photo 240x160) and bubbles swapped on the 11 screens; messages top-aligned (empty space at the bottom); menus and dialogs placed (they sat at 0,0 because the screen frame has no auto layout)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const R = n => Math.round(n * 10) / 10;
const BB = n => n.absoluteBoundingBox;
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
await figma.setCurrentPageAsync(p01);
const mob = p02.children.find(n => n.name === 'Mobile'), mobSec = mob.children.find(n => n.name === 'Messenger');
const sec8 = p01.children.find(n => n.type === 'SECTION' && /^8 · Messenger/.test(n.name));
const bubSet = sec8.children.find(c => c.name === 'Message bubble');
if (!bubSet || !mobSec) throw new Error('Message bubble set or Mobile Messenger section missing');
let mobSet = sec8.children.find(c => c.name === 'Message bubble · Mobile') || null;
const fillWidth = n => { try { n.layoutSizingHorizontal = 'FILL'; return true; } catch (e) { return false; } };
const rel = (page, node) => { const a = BB(page), b = BB(node); return { x: b.x - a.x, y: b.y - a.y, w: b.width, h: b.height }; };
const screensAll = () => mobSec.children.filter(c => c.type === 'FRAME' && /^Messenger \//.test(c.name));
const screen = nm => mobSec.children.find(c => c.name === 'Messenger / ' + nm + ' · Mobile');

await step('Message bubble · Mobile set', async () => {
  if (mobSet) { report.info.mobileBubbleSet = 'reused existing (' + mobSet.children.length + ' variants)'; return; }
  const clones = [];
  for (const v of bubSet.children) {
    const c = v.clone(); sec8.appendChild(c); c.name = v.name;
    c.resize(358, c.height); c.counterAxisSizingMode = 'AUTO';
    const b = c.findOne(n => n.name === 'Bubble'); if (b) b.maxWidth = 280;
    const ph = c.findOne(n => n.name === 'Photo'); if (ph) ph.resize(240, 160);
    clones.push(c);
  }
  const set = figma.combineAsVariants(clones, sec8);
  set.name = 'Message bubble · Mobile';
  try { set.fills = bubSet.fills; set.strokes = bubSet.strokes; set.strokeWeight = bubSet.strokeWeight; set.dashPattern = bubSet.dashPattern; set.cornerRadius = bubSet.cornerRadius; } catch (e) { }
  let y = 32; for (const v of set.children) { v.x = 32; v.y = y; y += v.height + 40; }
  set.resizeWithoutConstraints(358 + 64, y - 40 + 32);
  let bottom = 0; const sb = BB(sec8);
  for (const k of sec8.children) { if (k === set) continue; const b = BB(k); if (b && b.y + b.height - sb.y > bottom) bottom = b.y + b.height - sb.y; }
  set.x = 80; set.y = Math.ceil(bottom + 120);
  sec8.resizeWithoutConstraints(Math.max(sec8.width, set.x + set.width + 80), Math.ceil(set.y + set.height + 80));
  mobSet = set;
  report.info.mobileBubbleSet = 'built ' + set.children.length + ' variants, set ' + R(set.width) + 'x' + R(set.height) + ' @' + R(set.x) + ',' + R(set.y) + ' | section ' + R(sec8.width) + 'x' + R(sec8.height);
  report.info.mobileBubbleVariants = set.children.map(v => v.name + ' ' + R(v.width) + 'x' + R(v.height) + ' | bubble maxW=' + (v.findOne(n => n.name === 'Bubble') ? v.findOne(n => n.name === 'Bubble').maxWidth : '-')).join(' ; ');
  const ov = []; for (const k of sec8.children) { if (k === set) continue; const a = BB(k), b = BB(set); if (a && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov.push(k.name); }
  report.info.bubbleSetOverlaps = ov.length ? ov : 'none';
});

await figma.setCurrentPageAsync(p02);

await step('swap bubbles on the mobile screens', async () => {
  if (!mobSet) throw new Error('mobile set missing');
  let swapped = 0, skipped = 0; const miss = [];
  for (const f of screensAll()) for (const inst of f.findAll(n => n.type === 'INSTANCE' && /^Message · /.test(n.name))) {
    const main = await inst.getMainComponentAsync();
    if (main && main.parent === mobSet) { skipped++; continue; }
    const t = mobSet.children.find(v => v.name === (main ? main.name : ''));
    if (!t) { miss.push(inst.name + ' / ' + (main ? main.name : '?')); continue; }
    inst.swapComponent(t); fillWidth(inst); swapped++;
  }
  report.info.bubblesSwapped = swapped + ' swapped, ' + skipped + ' already mobile' + (miss.length ? ', MISSING variants: ' + miss.join('; ') : '');
});

await step('messages top-aligned', async () => {
  const rows = [];
  for (const f of screensAll()) {
    const msgs = f.findOne(n => n.name === 'Messages'); if (!msgs) continue;
    msgs.primaryAxisAlignItems = 'MIN';
    fillWidth(msgs);
    const kids = msgs.children.filter(c => c.visible !== false); if (!kids.length) continue;
    const mb = BB(msgs), first = BB(kids[0]), last = BB(kids[kids.length - 1]);
    rows.push(f.name.replace('Messenger / ', '') + ' | area ' + R(mb.height) + ' | space above first ' + R(first.y - mb.y) + ' | gap below last ' + R((mb.y + mb.height) - (last.y + last.height)));
  }
  report.info.messagesAlign = rows;
});

await step('place menus and dialogs', async () => {
  const out = [];
  const mm = screen('Message menu');
  { const m = mm.findOne(n => n.type === 'INSTANCE' && n.name === 'Message menu'); const b = mm.findAll(n => n.type === 'INSTANCE' && n.name === 'Message · Mine · Text')[0];
    const r = rel(mm, b); let y = r.y + r.h + 8; if (y + m.height > 763 - 8) y = r.y - 8 - m.height;
    m.x = Math.round(390 - 16 - m.width); m.y = Math.round(y); out.push('Message menu @' + R(m.x) + ',' + R(m.y) + ' ' + R(m.width) + 'x' + R(m.height) + ' (bubble ' + R(r.y) + '+' + R(r.h) + ')'); }
  for (const [sn, nm] of [['Delete message', 'Confirm dialog · Delete message'], ['Block person', 'Confirm dialog · Block person']]) {
    const f = screen(sn), d = f.findOne(n => n.type === 'INSTANCE' && n.name === nm);
    d.x = Math.round((390 - d.width) / 2); d.y = Math.round((844 - d.height) / 2); out.push(nm + ' @' + R(d.x) + ',' + R(d.y) + ' ' + R(d.width) + 'x' + R(d.height));
  }
  { const f = screen('Thread menu'), m = f.findOne(n => n.type === 'INSTANCE' && n.name === 'Thread menu'), mo = f.findOne(n => n.name === 'More'); const r = rel(f, mo);
    m.x = Math.round(390 - 16 - m.width); m.y = Math.round(r.y + r.h + 8); out.push('Thread menu @' + R(m.x) + ',' + R(m.y) + ' ' + R(m.width) + 'x' + R(m.height) + ' (More ' + R(r.y) + '+' + R(r.h) + ')'); }
  report.info.placed = out;
  const scr = [];
  for (const sn of ['Delete message', 'Block person']) { const f = screen(sn), s = f.findOne(n => n.name === 'Scrim'); scr.push(sn + ': scrim ' + (s ? R(s.width) + 'x' + R(s.height) + ' @' + R(s.x) + ',' + R(s.y) : 'missing')); }
  report.info.scrims = scr;
});

await step('verify', async () => {
  const rows = [];
  for (const f of screensAll()) {
    const fb = BB(f), bad = [];
    for (const n of f.findAll(x => x.visible !== false && x.absoluteBoundingBox)) { const b = BB(n); if (b.x < fb.x - 1 || b.x + b.width > fb.x + fb.width + 1) bad.push(n.name + ' ' + R(b.x - fb.x) + '+' + R(b.width)); }
    const old = f.findAll(n => n.type === 'INSTANCE' && /^Message · /.test(n.name)).length;
    rows.push(f.name.replace('Messenger / ', '') + ' | overflow: ' + (bad.slice(0, 5).join('; ') || 'none') + ' | message rows: ' + old);
  }
  report.info.screens = rows;
  const th = screen('Thread').findOne(n => n.name === 'Messages');
  report.info.threadBubbles = th ? th.children.map(c => c.name + ' ' + R(c.width) + 'x' + R(c.height)).join(' | ') : 'n/a';
  const desktopLeft = [];
  for (const f of screensAll()) for (const inst of f.findAll(n => n.type === 'INSTANCE' && /^Message · /.test(n.name))) { const m = await inst.getMainComponentAsync(); if (!m || m.parent !== mobSet) desktopLeft.push(f.name + ' > ' + inst.name); }
  report.info.desktopBubblesLeft = desktopLeft.length ? desktopLeft.slice(0, 6) : 'none';
  const ov = []; const ss = mob.children.filter(n => n.type === 'SECTION'); for (let i = 0; i < ss.length; i++) for (let j = i + 1; j < ss.length; j++) { const a = ss[i], b = ss[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov.push(a.name + ' x ' + b.name); }
  report.info.sectionOverlaps = ov.length ? ov : 'none';
});

return report;
