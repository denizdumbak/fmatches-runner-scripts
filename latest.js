// step 182 · Silhouette: Gender ekseni (Role x Gender x Size = 16 varyant), 4 yeni cizim (gorsel dolgu); Intermediary ve Referee kadin, digerleri erkek
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
const r1 = n => Math.round(n * 10) / 10;
const RAW = 'https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/img/silhouettes/';
const FILES = { 'Male|Player': 'male-kit-v2', 'Male|Other': 'male-smart-v1', 'Female|Player': 'female-kit-v1', 'Female|Other': 'female-smart-v1' };
const SIZES = ['Hero desktop', 'Hero mobile', '64', '40'];
const ROWS = [['Male', 'Player'], ['Male', 'Other'], ['Female', 'Player'], ['Female', 'Other']];
const imgs = {}; let rr = 1; let set = null;
const parse = n => { const o = {}; n.split(',').forEach(p => { const kv = p.trim().split('='); o[kv[0]] = kv[1]; }); return o; };

await step('load images and set', async () => {
  for (const k of Object.keys(FILES)) {
    const im = await figma.createImageAsync(RAW + FILES[k] + '.png'); const s = await im.getSizeAsync();
    imgs[k] = im.hash; rr = s.height / s.width; report.info['img ' + FILES[k]] = s.width + 'x' + s.height;
  }
  set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Silhouette');
  if (!set) throw new Error('Silhouette set missing');
});

await step('Gender axis: rename and clone variants', async () => {
  if (!set) throw new Error('skipped');
  if (set.children.length === 16) { report.info.structure = 'already 16 variants, skipped'; return; }
  if (set.children.length !== 8) throw new Error('unexpected variant count ' + set.children.length);
  const orig = set.children.slice();
  for (const v of orig) v.name = v.name.replace(/^Role=(\w+),/, 'Role=$1, Gender=Male,');
  for (const v of orig) {
    const c = v.clone(); if (c.parent !== set) set.appendChild(c);
    c.name = v.name.replace('Gender=Male', 'Gender=Female');
  }
  report.info.structure = 'renamed 8, cloned 8 -> ' + set.children.length;
});

await step('layout variants in a grid', async () => {
  if (!set || set.children.length !== 16) throw new Error('skipped');
  const widths = {}; for (const v of set.children) { const p = parse(v.name); widths[p.Size] = v.width; }
  const PAD = 24, GAPX = 48, GAPY = 48, H = 480;
  const xs = {}; let x = PAD; for (const s of SIZES) { xs[s] = x; x += widths[s] + GAPX; }
  let maxR = 0;
  for (const v of set.children) {
    const p = parse(v.name); const ri = ROWS.findIndex(r => r[0] === p.Gender && r[1] === p.Role);
    v.x = xs[p.Size]; v.y = PAD + ri * (H + GAPY); maxR = Math.max(maxR, v.x + v.width);
  }
  set.resizeWithoutConstraints(maxR + PAD, PAD * 2 + ROWS.length * H + (ROWS.length - 1) * GAPY);
  report.info.setSize = Math.round(set.width) + 'x' + Math.round(set.height);
});

await step('fill variants with the new drawings', async () => {
  if (!set || set.children.length !== 16) throw new Error('skipped');
  const placed = [];
  for (const v of set.children) {
    const p = parse(v.name); const hash = imgs[p.Gender + '|' + p.Role]; if (!hash) throw new Error('no image for ' + v.name);
    const W = v.width, H = v.height; const hero = /Hero/.test(p.Size);
    let w, h, x, y;
    if (hero) { w = W; h = W * rr; x = 0; y = H - h; } else { h = H * 0.96; w = h / rr; x = (W - w) / 2; y = H - h; }
    for (const c of v.children.slice()) c.remove();
    const rect = figma.createRectangle(); rect.name = 'Silhouette image'; rect.resize(w, h);
    rect.fills = [{ type: 'IMAGE', imageHash: hash, scaleMode: 'FILL' }];
    v.appendChild(rect); rect.x = x; rect.y = y; rect.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
    placed.push(v.name + ' > ' + r1(w) + 'x' + r1(h));
  }
  report.info.placed = placed.length + ' variants filled';
});

function topFrameName(i) { let x = i; while (x.parent && x.parent.type !== 'SECTION' && x.parent.type !== 'PAGE') x = x.parent; return x.name; }
async function variantOf(i) { const m = await i.getMainComponentAsync(); return m && m.parent === set ? m.name : null; }

await step('instances: gender by profile', async () => {
  const changed = [];
  for (const i of p02.findAll(n => n.type === 'INSTANCE')) {
    const vn = await variantOf(i); if (!vn) continue;
    const top = topFrameName(i); const want = /^Profiles \/ (Intermediary|Referee)/.test(top) ? 'Female' : 'Male';
    const key = Object.keys(i.componentProperties).find(k => /^Gender/.test(k)); if (!key) throw new Error('no Gender property on instance in ' + top);
    if (i.componentProperties[key].value === want) continue;
    const w = i.width, h = i.height; const o = {}; o[key] = want; i.setProperties(o);
    if (Math.round(i.width) !== Math.round(w) || Math.round(i.height) !== Math.round(h)) i.resize(w, h);
    changed.push(top + ' > ' + (await variantOf(i)));
  }
  report.info.genderChanged = changed;
});

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
  for (const k of s.children) { const b = k.absoluteBoundingBox; if (!b) continue; if (b.x + b.width > right) right = b.x + b.width; if (b.y + b.height > bottom) bottom = b.y + b.height; }
  s.resizeWithoutConstraints(Math.ceil(right - s.x + 80), Math.ceil(bottom - s.y + 80));
}
await step('section layout on tab 01', async () => {
  const sec = set && set.parent; if (!sec || sec.type !== 'SECTION') throw new Error('set is not in a Section');
  relayout(sec); report.info.section = sec.name + ' ' + Math.round(sec.width) + 'x' + Math.round(sec.height);
  const secs = p01.children.filter(n => n.type === 'SECTION').sort((a, b) => a.x - b.x);
  let x = secs[0].x; for (const s of secs) { s.x = x; x += s.width + 160; }
  report.info.sectionOrder = secs.map(s => s.name + '@' + Math.round(s.x));
});

await step('verify', async () => {
  const rows = {};
  for (const i of p02.findAll(n => n.type === 'INSTANCE')) { const vn = await variantOf(i); if (!vn) continue; const k = vn + ' | ' + topFrameName(i); rows[k] = (rows[k] || 0) + 1; }
  report.info.usageAfter = rows;
  report.info.variantNames = set.children.map(v => v.name);
  report.info.props = Object.keys(set.componentPropertyDefinitions);
  report.info.imageLayers = set.findAll(n => n.name === 'Silhouette image').length;
});

return report;
