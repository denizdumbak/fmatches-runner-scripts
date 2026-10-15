// step 112 · Website: Web ve Mobile Section'lari · her hero slayti tam Home sayfasi (yan yana) · tiklanan oge mavi cerceve + ok + etiket · prototip tam sayfalara

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const page2 = pageOf(/^02/), page3 = pageOf(/^03/);
for (const p of [page2, page3]) await p.loadAsync();
const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;
const labelStyle = TS['Body/Large'] || TS['Body/Default'];
if (labelStyle) await figma.loadFontAsync(labelStyle.fontName);
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

const allNodes = () => { const out = []; for (const n of page2.children) { out.push(n); if (n.type === 'SECTION') out.push(...n.children); } return out; };
const get = name => allNodes().find(n => n.name === name) || null;
const BLUE = { r: 13 / 255, g: 153 / 255, b: 1 };

// ---------- frames ----------
const F = {};
await step('find frames', async () => {
  const need = {
    d1: 'Home / Main · Desktop', m1: 'Home / Main · Mobile',
    dCal: 'Home / Main / Calendar view · Desktop', mCal: 'Home / Main / Calendar view · Mobile',
    dPro: 'Profiles / Player · Desktop', mPro: 'Profiles / Player · Mobile',
    dDir: 'Profiles / Player / Directory, no photo · Desktop', mDir: 'Profiles / Player / Directory, no photo · Mobile'
  };
  for (const k in need) { F[k] = get(need[k]); if (!F[k]) throw new Error('missing ' + need[k]); }
  F.starts = allNodes().filter(n => n.name === 'Start here');
  F.noteFig = get('Note · Placeholder figures');
  F.noteDir = get('Note · Directory profile');
  F.barNotes = allNodes().filter(n => n.name === 'Note · Fixed action bar');
  F.oldHero = allNodes().filter(n => /Hero slides 2–3/.test(n.name));
  const a = F.mPro.absoluteBoundingBox, c = F.mDir.absoluteBoundingBox;
  F.barDy = F.barNotes.map(n => { const b = n.absoluteBoundingBox; const first = Math.abs(b.y - a.y) < Math.abs(b.y - c.y); return [n, b.y - (first ? a.y : c.y), first]; });
});

// ---------- slide 2 and 3 as full pages ----------
async function slidePage(base, k, dev) {
  const name = 'Home / Main / Slide ' + k + ' · ' + dev;
  let f = get(name);
  if (!f) { f = base.clone(); f.name = name; }
  const hero = f.findOne(n => n.type === 'INSTANCE' && /^Hero carousel/.test(n.name));
  hero.setProperties({ Slide: String(k) });
  hero.name = 'Hero carousel · slide ' + k + ' of 3';
  return f;
}
await step('slide pages', async () => {
  F.d2 = await slidePage(F.d1, 2, 'Desktop'); F.d3 = await slidePage(F.d1, 3, 'Desktop');
  F.m2 = await slidePage(F.m1, 2, 'Mobile'); F.m3 = await slidePage(F.m1, 3, 'Mobile');
});

// ---------- sections ----------
function section(name) {
  let s = page2.children.find(n => n.type === 'SECTION' && n.name === name);
  if (!s) { s = figma.createSection(); s.name = name; page2.appendChild(s); }
  for (const c of s.children.filter(c => /^Flow · /.test(c.name))) c.remove();
  return s;
}
const put = (s, n, x, y) => { s.appendChild(n); n.x = x; n.y = y; };
const rel = (s, n) => { const b = n.absoluteBoundingBox; return { x: b.x - s.absoluteBoundingBox.x, y: b.y - s.absoluteBoundingBox.y, w: b.width, h: b.height }; };

// ---------- annotation helpers ----------
async function chip(text) {
  const f = figma.createFrame(); f.name = 'Label';
  f.layoutMode = 'HORIZONTAL'; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO';
  f.paddingLeft = f.paddingRight = 16; f.paddingTop = f.paddingBottom = 10; f.cornerRadius = 10;
  f.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]; f.strokes = [{ type: 'SOLID', color: BLUE }]; f.strokeWeight = 2;
  const t = figma.createText(); if (labelStyle) await t.setTextStyleIdAsync(labelStyle.id); t.characters = text; t.fills = [{ type: 'SOLID', color: BLUE }];
  f.appendChild(t); return f;
}
async function flow(s, title, pts, label, opt) {
  opt = opt || {};
  const g = [];
  const v = figma.createVector();
  v.vectorPaths = [{ windingRule: 'NONE', data: 'M ' + pts.map(p => p.x + ' ' + p.y).join(' L ') }];
  v.strokes = [{ type: 'SOLID', color: BLUE }]; v.strokeWeight = 4; v.strokeCap = 'ARROW_LINES'; v.strokeJoin = 'ROUND';
  if (opt.dashed) v.dashPattern = [16, 12];
  v.fills = []; s.appendChild(v); g.push(v);
  if (opt.box) {
    const b = figma.createRectangle(); b.name = 'Trigger';
    b.x = opt.box.x - 8; b.y = opt.box.y - 8; b.resize(opt.box.w + 16, opt.box.h + 16); b.cornerRadius = 12;
    b.fills = [{ type: 'SOLID', color: BLUE, opacity: 0.08 }]; b.strokes = [{ type: 'SOLID', color: BLUE }]; b.strokeWeight = 4;
    s.appendChild(b); g.push(b);
  }
  if (label) { const c = await chip(label); s.appendChild(c); c.x = (opt.lx != null ? opt.lx : pts[0].x + 24) - (opt.alignRight ? c.width : 0); c.y = (opt.ly != null ? opt.ly : pts[0].y - c.height - 16); g.push(c); }
  const grp = figma.group(g, s); grp.name = 'Flow · ' + title;
  return grp;
}
// arrow from a trigger inside src to the left edge of a target on the right
async function linkRight(s, src, trig, dst, label) {
  const t = rel(s, trig), a = rel(s, src), d = rel(s, dst);
  const sy = t.y + t.h / 2, ty = d.y + Math.min(400, d.h / 4);
  const x0 = a.x + a.w, mid = x0 + (d.x - x0) / 2;
  return await flow(s, label, [{ x: t.x + t.w + 8, y: sy }, { x: mid, y: sy }, { x: mid, y: ty }, { x: d.x - 6, y: ty }], label, { box: t, lx: x0 + 24, ly: sy - 80 });
}
// arrow from a trigger inside src down into a target below (enters from the left)
async function linkDown(s, src, trig, dst, label, gutterX) {
  const t = rel(s, trig), d = rel(s, dst);
  const sy = t.y + t.h / 2, ty = d.y + 200;
  return await flow(s, label, [{ x: t.x - 8, y: sy }, { x: gutterX, y: sy }, { x: gutterX, y: ty }, { x: d.x - 6, y: ty }], label, { box: t, lx: gutterX - 16, ly: sy - 80, alignRight: true });
}
async function navigate(node, dest) {
  try {
    await node.setReactionsAsync([{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE',
      transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] }]);
    return true;
  } catch (e) { report.errors.push('reaction ' + node.name + ': ' + e.message); return false; }
}
const tabOf = (frame, re) => frame.findOne(n => /^Tab · /.test(n.name) && re.test(n.name));
const TABS = {
  Desktop: [/Create a profile/, /Search and connect/, /Book matches/],
  Mobile: [/Tab · Profile/, /Tab · Search/, /Tab · Book/]
};

// ---------- build one platform section ----------
async function build(dev) {
  const D = dev === 'Desktop';
  const W = D ? 1440 : 390, G = D ? 480 : 360, PAD = 200, NOTE = D ? 400 : 360;
  const s = section(D ? 'Web' : 'Mobile');
  const p1 = D ? F.d1 : F.m1, p2 = D ? F.d2 : F.m2, p3 = D ? F.d3 : F.m3, cal = D ? F.dCal : F.mCal, pro = D ? F.dPro : F.mPro, dir = D ? F.dDir : F.mDir;
  let y = PAD;
  if (D) { let x = PAD + NOTE; for (const st of F.starts) { put(s, st, x, y); x += st.width + 80; } y += Math.max(0, ...F.starts.map(n => n.height)) + 240; }
  const c0 = PAD + NOTE, c1 = c0 + W + G, c2 = c1 + W + G;
  // row A: three slides
  put(s, p1, c0, y); put(s, p2, c1, y); put(s, p3, c2, y);
  if (D && F.noteFig) put(s, F.noteFig, PAD, y + 809);
  const yB = y + Math.max(p1.height, p2.height, p3.height) + 480;
  // row B: calendar view under slide 1, profile + directory state
  put(s, cal, c0, yB); put(s, pro, c1, yB + 400); put(s, dir, c2, yB + 400);
  if (D && F.noteDir) put(s, F.noteDir, c2, yB + 400 + dir.height + 40);
  if (!D) {
    for (const [n, dy, first] of F.barDy) put(s, n, (first ? c1 : c2) + W + 24, (first ? pro.y : dir.y) + dy);
  }
  const right = c2 + W + (D ? 0 : 200) + PAD;
  const bottom = Math.max(cal.y + cal.height, pro.y + pro.height, dir.y + dir.height + (D && F.noteDir ? F.noteDir.height + 40 : 0)) + PAD;
  s.resizeWithoutConstraints(right, bottom);

  // arrows
  const [r1, r2, r3] = TABS[dev];
  await linkRight(s, p1, tabOf(p1, r2), p2, 'Click: Tab 02 · ' + (D ? 'Search and connect' : 'Search'));
  await linkRight(s, p2, tabOf(p2, r3), p3, 'Click: Tab 03 · ' + (D ? 'Book matches' : 'Book'));
  const tog = p1.findOne(n => n.name === 'View toggle');
  await linkDown(s, p1, tog, cal, 'Click: List / Calendar', c0 - 80);
  const pr = rel(s, pro);
  await flow(s, 'From player search', [{ x: pr.x + 160, y: pr.y - 300 }, { x: pr.x + 160, y: pr.y - 10 }], 'From player search · Phase 2', { lx: pr.x + 184, ly: pr.y - 300 });
  const dr = rel(s, dir);
  await flow(s, 'Not joined yet', [{ x: pr.x + pr.w + 8, y: pr.y + 300 }, { x: dr.x - 8, y: pr.y + 300 }], 'Same page, player has not joined yet', { dashed: true, lx: pr.x + pr.w + 24, ly: pr.y + 300 - 80 });

  // prototype: tabs open the full slide pages, toggle opens calendar
  const pages = [p1, p2, p3];
  for (const p of pages) for (let i = 0; i < 3; i++) { const t = tabOf(p, [r1, r2, r3][i]); if (t && pages[i] !== p) await navigate(t, pages[i]); }
  for (const p of [p2, p3]) { const t = p.findOne(n => n.name === 'View toggle'); if (t) await navigate(t, cal); }
  for (let i = 1; i < 3; i++) { const t = tabOf(cal, [r1, r2, r3][i]); if (t) await navigate(t, pages[i]); }
  const calTog = cal.findOne(n => n.name === 'View toggle'); if (calTog) await navigate(calTog, p1);
  return s;
}

let web, mob;
await step('Web', async () => { web = await build('Desktop'); web.x = 0; web.y = 0; });
await step('Mobile', async () => { mob = await build('Mobile'); mob.x = web.x + web.width + 400; mob.y = 0; });

// ---------- cleanup ----------
await step('cleanup', async () => {
  for (const n of F.oldHero) { page3.appendChild(n); }
  for (const s of page2.children.filter(n => n.type === 'SECTION' && /^(Home|Profiles)$/.test(n.name))) if (!s.children.length) s.remove(); else report.info['left in ' + s.name] = s.children.map(c => c.name);
  let y = 0; for (const n of page3.children) { n.x = 0; n.y = y; y += n.height + 80; }
  const want = [[F.d1, 'Web · Home'], [F.dPro, 'Web · Player profile'], [F.dDir, 'Web · Not joined yet'], [F.m1, 'Mobile · Home'], [F.mPro, 'Mobile · Player profile'], [F.mDir, 'Mobile · Not joined yet']];
  page2.flowStartingPoints = want.map(([n, name]) => ({ nodeId: n.id, name }));
  report.info.page2 = page2.children.map(n => n.type.slice(0, 4) + ' ' + n.name + ' ' + Math.round(n.width) + 'x' + Math.round(n.height));
  report.info.web = web.children.map(c => c.name);
});
return report;
