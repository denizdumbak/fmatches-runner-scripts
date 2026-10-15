// step 111 · Sayfa duzeni: 02 · Website (Section = modul, sutun = cihaz, satir = durum) · Player Profile 02'ye · durum panolari 01'e · 03 · Archive

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const page0 = pageOf(/^01/), page2 = pageOf(/^02/), page3 = pageOf(/^03/);
for (const p of [page0, page2, page3]) await p.loadAsync();
const findTop = (name) => {
  for (const p of [page2, page3]) {
    for (const n of p.children) {
      if (n.name === name) return n;
      if (n.type === 'SECTION') { const c = n.children.find(k => k.name === name); if (c) return c; }
    }
  }
  return null;
};
const any = (...names) => { for (const n of names) { const f = findTop(n); if (f) return f; } return null; };
const allTop = () => { const out = []; for (const p of [page2, page3]) for (const n of p.children) { out.push(n); if (n.type === 'SECTION') out.push(...n.children); } return out; };

// ---------- names ----------
const RENAME = [
  ['Home · Desktop', 'Home / Main · Desktop'],
  ['Home · Mobile', 'Home / Main · Mobile'],
  ['Home · Desktop · calendar view', 'Home / Main / Calendar view · Desktop'],
  ['Home · Mobile · calendar view', 'Home / Main / Calendar view · Mobile'],
  ['Player profile · Desktop', 'Profiles / Player · Desktop'],
  ['Player profile · Mobile', 'Profiles / Player · Mobile'],
  ['State · Directory profile, no photo · Desktop', 'Profiles / Player / Directory, no photo · Desktop'],
  ['State · Directory profile, no photo · Mobile', 'Profiles / Player / Directory, no photo · Mobile'],
];
const F = {};
const flows3 = page3.flowStartingPoints.slice();
await step('find frames', async () => {
  for (const [o, n] of RENAME) { const f = any(o, n); if (!f) throw new Error('missing ' + o); f.name = n; F[n] = f; }
  F.heroOld = any('Home · Hero slides 2–3');
  F.heroD = any('Home / Main / Hero slides 2–3 · Desktop');
  F.heroM = any('Home / Main / Hero slides 2–3 · Mobile');
  F.noteFig = any('Note · Placeholder figures');
  F.noteDir = any('Note · Directory profile');
  F.barNotes = allTop().filter(n => n.name === 'Note · Fixed action bar');
  const starts = allTop().filter(n => n.name === 'Start here');
  F.start2 = starts.find(n => n.parent === page2 || (n.parent.type === 'SECTION' && n.parent.name === 'Home')) || null;
  F.start3 = starts.find(n => n !== F.start2) || null;
  F.tickerStates = any('Ticker · role states');
  F.actionStates = any('Profile actions · states');
  F.rowLabels = allTop().filter(n => /^Row label/.test(n.name));
  report.info.found = { barNotes: F.barNotes.length, rowLabels: F.rowLabels.length, start2: !!F.start2, start3: !!F.start3 };
});

// ---------- split hero slides 2-3 into desktop / mobile frames ----------
await step('split hero slides', async () => {
  if (F.heroD && F.heroM) return;
  const old = F.heroOld; if (!old) throw new Error('hero slides frame missing');
  const insts = old.findAll(n => n.type === 'INSTANCE' && /^Hero/.test(n.name));
  const mk = (name, list) => {
    const f = figma.createFrame(); f.name = name; f.fills = [];
    f.layoutMode = 'VERTICAL'; f.itemSpacing = 64; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO';
    page2.appendChild(f);
    for (const i of list) f.appendChild(i);
    return f;
  };
  F.heroD = mk('Home / Main / Hero slides 2–3 · Desktop', insts.filter(i => i.width > 1000));
  F.heroM = mk('Home / Main / Hero slides 2–3 · Mobile', insts.filter(i => i.width < 1000));
  report.info.heroSplit = F.heroD.children.length + ' desktop, ' + F.heroM.children.length + ' mobile';
  if (!old.findAll(n => n.type === 'INSTANCE').length) old.remove(); else report.info.heroOldLeft = 'old frame kept, still has content';
});

// ---------- layout helper ----------
const GAP_COL = 120, GAP_ROW = 240, PAD = 160, NOTE_W = 320, NOTE_GAP = 80;
function placeSection(name, x, y, start, rows) {
  let s = page2.children.find(n => n.type === 'SECTION' && n.name === name);
  if (!s) { s = figma.createSection(); s.name = name; page2.appendChild(s); }
  s.x = x; s.y = y;
  const colD = PAD + NOTE_W + NOTE_GAP, colM = colD + 1440 + GAP_COL;
  let yy = PAD;
  if (start) { s.appendChild(start); start.x = colD; start.y = yy; yy += start.height + GAP_ROW; }
  for (const row of rows) {
    let h = 0;
    if (row.d) { s.appendChild(row.d); row.d.x = colD; row.d.y = yy; h = Math.max(h, row.d.height); }
    if (row.m) { s.appendChild(row.m); row.m.x = colM; row.m.y = yy; h = Math.max(h, row.m.height); }
    if (row.note) { s.appendChild(row.note); row.note.x = PAD; row.note.y = yy + (row.noteDy || 0); }
    for (const e of row.side || []) { s.appendChild(e.node); e.node.x = colM + 390 + 40; e.node.y = yy + e.dy; }
    yy += h + GAP_ROW;
  }
  s.resizeWithoutConstraints(colM + 390 + 40 + 160 + PAD, yy - GAP_ROW + PAD);
  return s;
}

// ---------- 02 · Website ----------
let secHome;
await step('section Home', async () => {
  const d = F['Home / Main · Desktop'];
  const noteDy = F.noteFig ? Math.max(0, F.noteFig.absoluteBoundingBox.y - d.absoluteBoundingBox.y) : 0;
  secHome = placeSection('Home', 0, 0, F.start2, [
    { d, m: F['Home / Main · Mobile'], note: F.noteFig, noteDy },
    { d: F['Home / Main / Calendar view · Desktop'], m: F['Home / Main / Calendar view · Mobile'] },
    { d: F.heroD, m: F.heroM },
  ]);
});
await step('section Profiles', async () => {
  const pD = F['Profiles / Player · Desktop'], pM = F['Profiles / Player · Mobile'];
  const dD = F['Profiles / Player / Directory, no photo · Desktop'], dM = F['Profiles / Player / Directory, no photo · Mobile'];
  // fixed action bar notes keep their offset from the mobile frame they sit next to
  const side1 = [], side2 = [];
  for (const n of F.barNotes) {
    const b = n.absoluteBoundingBox, a = pM.absoluteBoundingBox, c = dM.absoluteBoundingBox;
    const inFirst = b.y < c.y;
    (inFirst ? side1 : side2).push({ node: n, dy: b.y - (inFirst ? a.y : c.y) });
  }
  placeSection('Profiles', secHome.x + secHome.width + 400, 0, F.start3, [
    { d: pD, m: pM, side: side1 },
    { d: dD, m: dM, note: F.noteDir, side: side2 },
  ]);
});

// ---------- flows ----------
await step('flows', async () => {
  const cur = page2.flowStartingPoints.filter(f => !flows3.some(g => g.nodeId === f.nodeId));
  page2.flowStartingPoints = cur.concat(flows3);
  report.info.flows = page2.flowStartingPoints.map(f => f.name);
});

// ---------- state boards to 01 ----------
function relayout(s) {
  const kids = s.children.slice();
  const ordered = kids.filter(n => n.type === 'TEXT').concat(kids.filter(n => n.type !== 'TEXT'));
  const left = s.x + 80; let y = s.y + 80, prevText = false, first = true;
  for (const k of ordered) {
    const b = k.absoluteBoundingBox; if (!b) continue; const isText = k.type === 'TEXT';
    if (!first) y += (isText && prevText) ? 16 : 120;
    k.x += left - b.x; k.y += y - b.y; y += b.height; prevText = isText; first = false;
  }
  let right = -Infinity, bottom = -Infinity;
  for (const k of s.children) { const b = k.absoluteBoundingBox; if (!b) continue;
    if (b.x + b.width > right) right = b.x + b.width; if (b.y + b.height > bottom) bottom = b.y + b.height; }
  s.resizeWithoutConstraints(Math.ceil(right - s.x + 80), Math.ceil(bottom - s.y + 80));
}
await step('state boards to 01', async () => {
  const sHome = page0.children.find(n => n.type === 'SECTION' && /Home page/.test(n.name));
  const sProf = page0.children.find(n => n.type === 'SECTION' && /Player profile/.test(n.name));
  if (F.tickerStates && F.tickerStates.parent !== sHome) sHome.appendChild(F.tickerStates);
  if (F.actionStates && F.actionStates.parent !== sProf) sProf.appendChild(F.actionStates);
  for (const s of [sHome, sProf]) relayout(s);
  let x = 1640;
  for (const s of page0.children.filter(n => n.type === 'SECTION').sort((a, b) => a.x - b.x)) { s.x = x; s.y = 0; x += s.width + 160; }
});

// ---------- archive + page names ----------
await step('archive and rename', async () => {
  for (const n of F.rowLabels) page3.appendChild(n);
  let y = 0; for (const n of page3.children) { n.x = 0; n.y = y; y += n.height + 80; }
  page3.flowStartingPoints = [];
  page2.name = '02 · Website';
  page3.name = '03 · Archive';
  report.info.page2 = page2.children.map(n => n.type.slice(0, 4) + ' ' + n.name + ' ' + Math.round(n.width) + 'x' + Math.round(n.height) + (n.type === 'SECTION' ? ' [' + n.children.map(c => c.name).join(' | ') + ']' : ''));
  report.info.page3 = page3.children.map(n => n.name);
});
return report;
