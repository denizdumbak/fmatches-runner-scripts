// step 282 · Account menu open pages (Web + Mobile): clone of Event card / Manager, Account menu instance (Role=Other) under the header account button, "My events" row -> My events; header button on Manager card opens it; no arrows
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/); await p01.loadAsync();
const p02 = pageOf(/^02/); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
const nav = (dest, fade) => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: fade ? { type: 'DISSOLVE', easing: { type: 'EASE_OUT' }, duration: 0.2 } : { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
const frameIn = name => p02.findOne(n => n.type === 'FRAME' && n.name === name);
const BB = n => n.absoluteBoundingBox;
async function setNav(el, to, fade) { const keep = (el.reactions || []).filter(r => !(r.actions || []).some(isNavAct)); await el.setReactionsAsync(keep.concat([nav(to, fade)])); }

const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Account menu');
if (!set) throw new Error('Account menu component set missing on 01');

for (const [dev, hdrName] of [['Desktop', 'Account actions'], ['Mobile', 'Header actions']]) {
  await step(dev + ': Account menu open page', async () => {
    const src = frameIn('Events / Event card / Manager · ' + dev);
    const my = frameIn('Events / My events · ' + dev);
    const ref = frameIn('Events / Event card / Request sent · ' + dev);
    if (!src || !my || !ref) throw new Error('source/target/reference page missing');
    const nm = 'Events / Account menu · ' + dev;
    for (const old of p02.findAll(n => n.type === 'FRAME' && n.name === nm)) old.remove();
    const page = src.clone(); page.name = nm;
    ref.parent.appendChild(page);
    page.x = ref.x + (dev === 'Desktop' ? 1920 : 470); page.y = ref.y;
    // clear page navigation copied from the source, keep hover
    for (const n of page.findAll(x => 'reactions' in x && x.reactions && x.reactions.length)) {
      const keep = n.reactions.filter(r => !(r.actions || []).some(isNavAct));
      if (keep.length !== n.reactions.length) await n.setReactionsAsync(keep);
    }
    p02.flowStartingPoints = p02.flowStartingPoints.filter(f => f.nodeId !== page.id);
    // menu instance under the header account button
    const hdr = page.findOne(n => n.name === hdrName);
    if (!hdr) throw new Error(hdrName + ' not found in header');
    const btn = hdr.children[hdr.children.length - 1];
    const variant = set.children.find(v => v.name === 'Device=' + dev + ', Role=Other');
    if (!variant) throw new Error('variant missing: ' + dev + ' Role=Other');
    const inst = variant.createInstance(); inst.name = 'Account menu';
    page.appendChild(inst);
    if (page.layoutMode !== 'NONE') inst.layoutPositioning = 'ABSOLUTE';
    const b = BB(btn), pb = BB(page);
    let x = b.x + b.width - pb.x - inst.width; const y = b.y + b.height - pb.y + 8;
    if (dev === 'Mobile') x = Math.max(16, Math.min(x, pb.width - inst.width - 16));
    inst.x = Math.round(x); inst.y = Math.round(y);
    // links
    const row = inst.findOne(n => n.name === 'Row · My events');
    if (!row) throw new Error('Row · My events not found in Account menu');
    await setNav(row, my, false);
    // reset the Manager page's header button to open this page
    const srcBtn = src.findOne(n => n.name === hdrName).children.slice(-1)[0];
    await setNav(srcBtn, page, true);
    const ib = BB(inst);
    report.info[dev] = { page: page.name, size: Math.round(page.width) + 'x' + Math.round(page.height), button: btn.type + ' ' + btn.name, menu: Math.round(ib.width) + 'x' + Math.round(ib.height), menuAt: Math.round(ib.x - pb.x) + ',' + Math.round(ib.y - pb.y), gapUnderButton: Math.round(ib.y - (b.y + b.height)), rightEdgesEqual: Math.round(ib.x + ib.width) === Math.round(b.x + b.width), insidePage: ib.x >= pb.x && ib.y >= pb.y && ib.x + ib.width <= pb.x + pb.width && ib.y + ib.height <= pb.y + pb.height, sectionContains: (function () { const s = page.parent, sb = BB(s); return pb.x + pb.width <= sb.x + sb.width && pb.y + pb.height <= sb.y + sb.height; })() };
  });
}

await step('verify: all page links resolve + flow starts', async () => {
  let links = 0, broken = 0; const bad = [];
  for (const root of p02.children.filter(n => n.name === 'Web' || n.name === 'Mobile')) for (const n of root.findAll(x => 'reactions' in x && x.reactions && x.reactions.length)) for (const r of n.reactions) for (const a of (r.actions || [])) if (isNavAct(a)) { links++; const d = a.destinationId ? await figma.getNodeByIdAsync(a.destinationId) : null; if (!d) { broken++; bad.push(n.name); } }
  report.info.linksAll = links + ' links, ' + broken + ' broken' + (bad.length ? ' (' + bad.slice(0, 5).join(', ') + ')' : '');
  report.info.flowStartCount = p02.flowStartingPoints.length;
});
return report;
