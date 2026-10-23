// step 195 · Log in akisi: Wrong email, Wrong password'un yanina alinir (Link expired ve notu bir slot saga), Log in'den iki ok (Incorrect password / Incorrect email), Link expired oku yeniden cizilir

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync(); await figma.setCurrentPageAsync(p02);
const r = n => Math.round(n);
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }
async function setPath(v, pts) {
  const minX = Math.min(...pts.map(q => q[0])), minY = Math.min(...pts.map(q => q[1]));
  await v.setVectorNetworkAsync({ vertices: pts.map((q, i) => ({ x: q[0] - minX, y: q[1] - minY, strokeCap: i === pts.length - 1 ? 'ARROW_LINES' : 'NONE' })), segments: pts.slice(1).map((q, i) => ({ start: i, end: i + 1 })), regions: [] });
  v.x = minX; v.y = minY;
}
const ptsOf = v => v.vectorNetwork.vertices.map(q => [v.x + q.x, v.y + q.y]);
async function setLabel(g, text) { const lab = g.children.find(c => c.name === 'Label'); const t = lab.findOne(n => n.type === 'TEXT'); await loadFonts(t); t.characters = text; return lab; }
function segs(pts) { const h = [], vv = []; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; if (a[1] === b[1]) h.push([Math.min(a[0], b[0]), Math.max(a[0], b[0]), a[1]]); else vv.push([a[0], Math.min(a[1], b[1]), Math.max(a[1], b[1])]); } return { h, vv }; }
function crossings(list) { let c = 0; for (let i = 0; i < list.length; i++) for (let j = 0; j < list.length; j++) { if (i === j) continue; for (const h of list[i].h) for (const v of list[j].vv) if (v[0] > h[0] && v[0] < h[1] && h[2] > v[1] && h[2] < v[2]) c++; } return c; }

for (const D of ['Desktop', 'Mobile']) {
  await step('login flow · ' + D, async () => {
    const desk = D === 'Desktop';
    const ps = p02.children.find(n => n.type === 'SECTION' && n.name === (desk ? 'Web' : 'Mobile'));
    const sub = ps.children.find(n => n.type === 'SECTION' && n.name === 'Log in'); if (!sub) throw new Error('Log in section missing');
    const get = nm => { const n = sub.children.find(c => c.name === nm); if (!n) throw new Error('missing ' + nm); return n; };
    const wp = get('Log in / Wrong password · ' + D), we = get('Log in / Wrong email · ' + D), lk = get('Log in / Set new password / Link expired · ' + D), login = get('Log in · ' + D);
    const nExp = get('Note · expired · ' + D), nWe = get('Note · wrongemail · ' + D), gNew = get('Flow · new link · ' + D), gWp = get('Flow · wrong password · ' + D);
    const S = desk ? 1920 : 750, weX = wp.x + S, lkX = wp.x + 2 * S;
    // 1) sayfalari yerlestir
    if (lk.x !== lkX) { const dx = lkX - lk.x; lk.x += dx; nExp.x += dx; gNew.x += dx; }
    we.x = weX; we.y = wp.y; nWe.x = weX; nWe.y = we.y + we.height + 40;
    // 2) Link expired oku: Forgot password'e
    const vNew = gNew.children.find(c => c.type === 'VECTOR'); const o = ptsOf(vNew);
    const tx = o[4][0] + (desk ? 180 : 75);
    await setPath(vNew, [o[0], o[1], o[2], [tx, o[3][1]], [tx, o[4][1]]]);
    // 3) Log in'den iki ok
    const vA = gWp.children.find(c => c.type === 'VECTOR'); const a = ptsOf(vA);
    const labA = await setLabel(gWp, 'From Log in · Incorrect password');
    labA.x = (a[1][0] - 16) - labA.width; labA.y = a[2][1] - 34 - 8;
    for (const old of sub.children.filter(c => c.name === 'Flow · wrong email · ' + D)) old.remove();
    const gB = gWp.clone(); if (gB.parent !== sub) sub.appendChild(gB); gB.name = 'Flow · wrong email · ' + D;
    const rect = gB.children.find(c => c.type === 'RECTANGLE'); if (rect) rect.remove();
    const vB = gB.children.find(c => c.type === 'VECTOR');
    const bx = a[1][0] + 80, by = a[2][1] + 80, tgx = we.x + we.width / 2;
    const pB = [[a[0][0], a[0][1] - 14], [bx, a[0][1] - 14], [bx, by], [tgx, by], [tgx, we.y]];
    await setPath(vB, pB);
    const labB = await setLabel(gB, 'From Log in · Incorrect email');
    labB.x = bx + 16; labB.y = a[0][1] + 320;
    // sonuc
    let rr = 0, bb = 0; for (const k of sub.children) { rr = Math.max(rr, k.x + k.width); bb = Math.max(bb, k.y + k.height); }
    sub.resizeWithoutConstraints(Math.max(sub.width, Math.ceil(rr + 80)), Math.max(sub.height, Math.ceil(bb + 80)));
    const all = [ptsOf(vA), pB, ptsOf(vNew)];
    report.info['arrows ' + D] = all.map(p => p.map(q => '(' + r(q[0]) + ',' + r(q[1]) + ')').join(' '));
    report.info['crossings ' + D] = crossings(all.map(segs));
    const rect_ = n => ({ x0: n.x, y0: n.y, x1: n.x + n.width, y1: n.y + n.height });
    const hit = (p, q) => p.x0 < q.x1 && q.x0 < p.x1 && p.y0 < q.y1 && q.y0 < p.y1;
    const pages = sub.children.filter(c => c.type === 'FRAME'); const bad = [];
    for (const lab of [labA, labB]) { const lr = { x0: lab.absoluteBoundingBox.x - sub.absoluteBoundingBox.x, y0: lab.absoluteBoundingBox.y - sub.absoluteBoundingBox.y, x1: lab.absoluteBoundingBox.x - sub.absoluteBoundingBox.x + lab.width, y1: lab.absoluteBoundingBox.y - sub.absoluteBoundingBox.y + lab.height }; for (const pg of pages) if (hit(lr, rect_(pg))) bad.push(lab.parent.name + ' label over ' + pg.name); }
    for (let i = 0; i < pages.length; i++) for (let j = i + 1; j < pages.length; j++) if (hit(rect_(pages[i]), rect_(pages[j]))) bad.push(pages[i].name + ' / ' + pages[j].name);
    report.info['overlaps ' + D] = bad.length ? bad : 'none';
    report.info['positions ' + D] = [wp, we, lk].map(n => n.name.split(' · ')[0].replace('Log in / ', '') + ' @' + r(n.x) + ',' + r(n.y)).join(' | ');
  });
}
await step('widen platforms', async () => {
  const log = [];
  for (const P_ of ['Web', 'Mobile']) {
    const ps = p02.children.find(n => n.type === 'SECTION' && n.name === P_); let right = 0, bottom = 0; for (const k of ps.children) { right = Math.max(right, k.x + k.width); bottom = Math.max(bottom, k.y + k.height); }
    const needW = Math.ceil(right + 160), needH = Math.ceil(bottom + 160); const oldRight = ps.x + ps.width, dx = Math.max(0, needW - ps.width);
    if (dx > 0 || needH > ps.height) ps.resizeWithoutConstraints(Math.max(ps.width, needW), Math.max(ps.height, needH));
    if (dx > 0) for (const n of p02.children) if (n !== ps && n.x >= oldRight - 1) n.x += dx;
    log.push(P_ + ' · ' + r(ps.width) + 'x' + r(ps.height) + (dx ? ' · grew ' + dx : ''));
  }
  report.info.platforms = log;
});
await step('check', async () => {
  const ov = [], out = [];
  function walk(sec) {
    const kids = sec.children; const secs = kids.filter(c => c.type === 'SECTION');
    for (let i = 0; i < secs.length; i++) for (let j = i + 1; j < secs.length; j++) { const a = secs[i], z = secs[j]; if (a.x < z.x + z.width && z.x < a.x + a.width && a.y < z.y + z.height && z.y < a.y + a.height) ov.push(a.name + ' / ' + z.name + ' in ' + sec.name); }
    if (sec.type === 'SECTION') for (const k of kids) if (k.x < 0 || k.y < 0 || k.x + k.width > sec.width + 1 || k.y + k.height > sec.height + 1) out.push(k.name + ' outside ' + sec.name);
    for (const c of secs) walk(c);
  }
  const top = p02.children.filter(c => c.type === 'SECTION');
  for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) { const a = top[i], z = top[j]; if (a.x < z.x + z.width && z.x < a.x + a.width && a.y < z.y + z.height && z.y < a.y + a.height) ov.push(a.name + ' / ' + z.name); }
  for (const t of top) walk(t);
  report.info.sectionOverlaps = ov.length ? ov : 'none'; report.info.outsideParent = out.length ? out.slice(0, 20) : 'none';
  let total = 0, broken = 0;
  for (const n of p02.findAll(n => n.reactions && n.reactions.length)) for (const rr of n.reactions) for (const a of (rr.actions || [])) { if (!a.destinationId) continue; total++; if (!(await figma.getNodeByIdAsync(a.destinationId))) broken++; }
  report.info.prototype = total + ' links, ' + broken + ' broken';
});
return report;
