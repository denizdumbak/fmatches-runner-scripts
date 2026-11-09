// step 366 · inspect (salt okunur): Club card gövdesi (Management, Location, Facilities, Events), Women's notu, Shortlists filtre satırı, Notifications başlığı, yetim "2 unread" metinleri
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const R = n => Math.round(n);
const BB = n => n.absoluteBoundingBox;
const secOf = (plat, name) => { const root = p02.children.find(n => n.type === 'SECTION' && n.name === plat); return root ? root.children.find(n => n.type === 'SECTION' && n.name === name) : null; };
const SKIP = /^(Ticker|Navigation|Footer)/;
function dump(n, base, max, depth, out) {
  const b = BB(n); const pad = '  '.repeat(depth);
  let s = pad + n.name + ' [' + n.type + (n.layoutMode && n.layoutMode !== 'NONE' ? ' ' + n.layoutMode : '') + (n.layoutWrap === 'WRAP' ? ' WRAP' : '') + '] ' + R(n.width) + 'x' + R(n.height);
  if (b && base) s += ' @' + R(b.x - base.x) + ',' + R(b.y - base.y);
  if (n.layoutSizingHorizontal) s += ' h:' + n.layoutSizingHorizontal;
  if (n.layoutSizingVertical) s += ' v:' + n.layoutSizingVertical;
  if (n.layoutPositioning === 'ABSOLUTE') s += ' ABS';
  if (n.visible === false) s += ' hidden';
  if (n.type === 'TEXT') s += ' "' + String(n.characters).slice(0, 50) + '"';
  out.push(s);
  if (depth < max && 'children' in n && n.type !== 'INSTANCE' && !SKIP.test(n.name)) for (const c of n.children) dump(c, base, max, depth + 1, out);
  return out;
}
const frameByName = (sec, name) => sec ? sec.children.find(c => c.type === 'FRAME' && c.name === name) : null;

await step('Club card ekranlari', async () => {
  const cases = [
    ['Web', 'Clubs / Club card · Desktop', 5],
    ['Web', "Clubs / Club card / Women's club · Desktop", 3],
    ['Mobile', 'Clubs / Club card · Mobile', 4]
  ];
  for (const [plat, nm, max] of cases) {
    const sec = secOf(plat, 'Club card'); const f = frameByName(sec, nm);
    if (!f) { report.errors.push('ekran yok: ' + plat + ' ' + nm + ' | var olanlar: ' + (sec ? sec.children.map(c => c.name).join(' ; ') : 'Section yok')); continue; }
    report.info[plat + ' · ' + nm] = dump(f, BB(f), max, 0, []);
  }
});

await step('Notifications baslik', async () => {
  for (const plat of ['Web', 'Mobile']) {
    const sec = secOf(plat, 'Notifications'); if (!sec) throw new Error('Section yok: ' + plat);
    const frames = sec.children.filter(c => c.type === 'FRAME');
    const f = frames[0];
    const t = f.findOne(n => n.name === 'Title group');
    const out = [];
    if (t) { dump(t.parent, BB(f), 1, 0, out); out.push('--- Title group:'); dump(t, BB(f), 3, 0, out); } else out.push('Title group yok');
    report.info['Notifications ' + plat] = { frames: frames.map(c => c.name + ' ' + R(c.width) + 'x' + R(c.height)), titleArea: out };
  }
});

await step('yetim 2 unread', async () => {
  const kids = p02.children.filter(n => n.type !== 'SECTION');
  report.info.pageRootNonSection = kids.map(n => n.type + ' ' + n.name + (n.type === 'TEXT' ? ' "' + String(n.characters).slice(0, 30) + '"' : '') + ' ' + R(n.width) + 'x' + R(n.height) + ' @' + R(n.x) + ',' + R(n.y) + (n.visible === false ? ' hidden' : ''));
});

await step('Shortlists filtre satiri', async () => {
  for (const plat of ['Web', 'Mobile']) {
    const sec = secOf(plat, 'Shortlists'); if (!sec) throw new Error('Section yok: ' + plat);
    const frames = sec.children.filter(c => c.type === 'FRAME');
    const f = frames.find(c => !/No players|Position list open/.test(c.name)) || frames[0];
    const pf = f.findOne(n => n.name === 'Position filters');
    const out = [];
    if (pf) { dump(pf.parent, BB(f), 2, 0, out); out.push('--- Position filters:'); dump(pf, BB(f), 3, 0, out); } else out.push('Position filters yok');
    report.info['Shortlists ' + plat] = { frames: frames.map(c => c.name + ' ' + R(c.width) + 'x' + R(c.height)), filterArea: out };
  }
});

await step('component listesi', async () => {
  const re = /^(Person row|Event row|Filter chip|Form field|Position menu|Option list|Option row|Button|Icon button|Chip|Team select|Event location card|Section heading|Page notice|Facility|Badge|Tag)/;
  const comps = p01.findAll(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name));
  report.info.components = comps.map(c => c.type.slice(0, 4) + ' ' + c.name + ' ' + R(c.width) + 'x' + R(c.height) + (c.type === 'COMPONENT_SET' ? ' variants:' + c.children.length : ''));
});

return report;
