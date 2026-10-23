// step 196 · Link expired oku hedefi duzeltilir: Forgot password sayfasinin alt kenarina iner (195'te yanlislikla Check your email'in altina cizilmisti)

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync(); await figma.setCurrentPageAsync(p02);
const r = n => Math.round(n);
async function setPath(v, pts) {
  const minX = Math.min(...pts.map(q => q[0])), minY = Math.min(...pts.map(q => q[1]));
  await v.setVectorNetworkAsync({ vertices: pts.map((q, i) => ({ x: q[0] - minX, y: q[1] - minY, strokeCap: i === pts.length - 1 ? 'ARROW_LINES' : 'NONE' })), segments: pts.slice(1).map((q, i) => ({ start: i, end: i + 1 })), regions: [] });
  v.x = minX; v.y = minY;
}
const ptsOf = v => v.vectorNetwork.vertices.map(q => [v.x + q.x, v.y + q.y]);
function segs(pts) { const h = [], vv = []; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; if (a[1] === b[1]) h.push([Math.min(a[0], b[0]), Math.max(a[0], b[0]), a[1]]); else vv.push([a[0], Math.min(a[1], b[1]), Math.max(a[1], b[1])]); } return { h, vv }; }
function crossings(list) { let c = 0; for (let i = 0; i < list.length; i++) for (let j = 0; j < list.length; j++) { if (i === j) continue; for (const h of list[i].h) for (const v of list[j].vv) if (v[0] > h[0] && v[0] < h[1] && h[2] > v[1] && h[2] < v[2]) c++; } return c; }
for (const D of ['Desktop', 'Mobile']) {
  await step('link expired arrow · ' + D, async () => {
    const desk = D === 'Desktop';
    const sub = p02.children.find(n => n.type === 'SECTION' && n.name === (desk ? 'Web' : 'Mobile')).children.find(n => n.type === 'SECTION' && n.name === 'Log in');
    const fp = sub.children.find(n => n.type === 'FRAME' && n.name === 'Log in / Forgot password · ' + D); if (!fp) throw new Error('Forgot password page missing');
    const g = sub.children.find(n => n.name === 'Flow · new link · ' + D); const v = g.children.find(c => c.type === 'VECTOR'); const o = ptsOf(v);
    const tx = fp.x + fp.width / 2 + (desk ? 180 : 75), ty = fp.y + fp.height;
    await setPath(v, [o[0], o[1], o[2], [tx, o[2][1]], [tx, ty]]);
    const all = ['Flow · wrong password · ', 'Flow · wrong email · '].map(nm => ptsOf(sub.children.find(n => n.name === nm + D).children.find(c => c.type === 'VECTOR'))).concat([ptsOf(v)]);
    report.info['arrows ' + D] = all.map(p => p.map(q => '(' + r(q[0]) + ',' + r(q[1]) + ')').join(' '));
    report.info['crossings ' + D] = crossings(all.map(segs));
    report.info['forgot ' + D] = 'x ' + r(fp.x) + '-' + r(fp.x + fp.width) + ' bottom ' + r(ty);
  });
}
return report;
