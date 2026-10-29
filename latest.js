// step 253 · Profile more-menu parts: Icon button gets Icon=More large (48), new Profile menu component (Block, Report) in 3 · Player profile, ⋯ added to Sticky action bar (both roles) and to Profile actions on other people's profiles (Web); no pages or arrows yet
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const R = n => Math.round(n * 10) / 10;
const BB = n => n.absoluteBoundingBox;
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
await figma.setCurrentPageAsync(p01);

const iconSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Icon button');
const stickySet = p01.findOne(n => n.type === 'COMPONENT_SET' && /^Sticky action bar/.test(n.name));
if (!iconSet || !stickySet) throw new Error('Icon button or Sticky action bar set not found');
const web = p02.children.find(n => n.name === 'Web'), mob = p02.children.find(n => n.name === 'Mobile');
const MORE = 'Icon button · More';
let moreLarge = null, profileMenu = null;

const textsOf = n => n.findAll(t => t.type === 'TEXT').map(t => t.characters).join(',');
const pageOfNode = n => { let p = n; while (p && p.parent && p.parent.type !== 'SECTION') p = p.parent; return p ? p.name : '?'; };
const beforeSticky = mob.findAll(n => n.type === 'INSTANCE' && /Sticky action bar/.test(n.name)).map(i => pageOfNode(i) + ' | ' + textsOf(i));

await step('clean previous run', async () => {
  let removed = 0;
  for (const root of [stickySet, web, mob]) for (const i of root.findAll(n => n.type === 'INSTANCE' && n.name === MORE)) { i.remove(); removed++; }
  const oldV = iconSet.children.find(c => c.name === 'Icon=More large'); if (oldV) oldV.remove();
  const oldM = p01.findOne(n => n.type === 'COMPONENT' && n.name === 'Profile menu'); if (oldM) oldM.remove();
  report.info.cleaned = { instancesRemoved: removed, variant: !!oldV, menu: !!oldM };
});

await step('Icon=More large variant', async () => {
  const star = iconSet.children.find(c => c.name === 'Icon=Star');
  const more = iconSet.children.find(c => c.name === 'Icon=More');
  if (!star || !more) throw new Error('Icon=Star or Icon=More missing');
  const last = iconSet.children.reduce((a, c) => (c.y + c.height > a ? c.y + c.height : a), 0);
  const clone = star.clone(); iconSet.appendChild(clone);
  clone.name = 'Icon=More large'; clone.x = star.x; clone.y = last + 40;
  const starIcon = clone.findOne(n => /^Icon · Star$/.test(n.name));
  const moreIcon = more.findOne(n => /^Icon · More$/.test(n.name));
  if (!starIcon || !moreIcon) throw new Error('icon frames not found');
  const dots = moreIcon.clone();
  clone.insertChild(clone.children.indexOf(starIcon), dots);
  starIcon.remove();
  dots.name = 'Icon · More';
  iconSet.resizeWithoutConstraints(iconSet.width, clone.y + clone.height + 32);
  moreLarge = clone;
  report.info.moreLarge = clone.name + ' ' + R(clone.width) + 'x' + R(clone.height) + ' | icon ' + R(dots.width) + 'x' + R(dots.height) + ' @' + R(dots.x) + ',' + R(dots.y);
  report.info.iconSetNow = iconSet.children.length + ' variants, ' + R(iconSet.width) + 'x' + R(iconSet.height);
});

await step('Profile menu component', async () => {
  const thread = p01.findOne(n => n.type === 'COMPONENT' && n.name === 'Thread menu');
  if (!thread) throw new Error('Thread menu component not found');
  const sec = p01.children.find(n => n.type === 'SECTION' && /^3 · Player profile/.test(n.name));
  if (!sec) throw new Error('Section 3 · Player profile not found');
  const c = thread.clone(); sec.appendChild(c);
  c.name = 'Profile menu';
  for (const r of c.children.slice()) if (/Row · View profile|^Divider$/.test(r.name)) r.remove();
  const sb = BB(sec);
  let bottom = 0; for (const k of sec.children) { if (k === c) continue; const b = BB(k); if (b && b.y + b.height - sb.y > bottom) bottom = b.y + b.height - sb.y; }
  c.x = 80; c.y = Math.ceil(bottom + 120);
  sec.resizeWithoutConstraints(Math.max(sec.width, 80 + c.width + 80), Math.ceil(c.y + c.height + 80));
  profileMenu = c;
  report.info.profileMenu = c.name + ' ' + R(c.width) + 'x' + R(c.height) + ' rows: ' + c.children.map(r => r.name).join(' | ') + ' @' + R(c.x) + ',' + R(c.y) + ' in ' + sec.name + ' ' + R(sec.width) + 'x' + R(sec.height);
  const out = [];
  for (const o of sec.children) { if (o === c) continue; const a = BB(o), b = BB(c); if (a && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) out.push(o.name); }
  report.info.profileMenuOverlaps = out.length ? out : 'none';
});

await step('Sticky action bar variants', async () => {
  if (!moreLarge) throw new Error('variant missing');
  const rows = [];
  for (const v of stickySet.children) {
    const msg = v.children.find(c => c.name === 'Button · Message');
    const inst = moreLarge.createInstance(); inst.name = MORE;
    v.appendChild(inst);
    const grows = msg.layoutGrow === 1 || msg.layoutSizingHorizontal === 'FILL';
    if (!grows) msg.resize(msg.width - 60, msg.height);
    const last = v.children[v.children.length - 1];
    rows.push(v.name + ' | msg ' + R(msg.width) + (grows ? ' (fill)' : ' (resized)') + ' | ' + v.children.map(c => c.name + '@' + R(c.x) + '+' + R(c.width)).join(' ; ') + ' | right edge ' + R(last.x + last.width) + ' of ' + R(v.width));
  }
  report.info.stickyRows = rows;
});

await step('Profile actions on other people profiles (Web)', async () => {
  if (!moreLarge) throw new Error('variant missing');
  const done = [];
  for (const secName of ['Profiles · other roles', 'Profiles · player']) {
    const sec = web.children.find(n => n.name === secName); if (!sec) { report.errors.push('section missing ' + secName); continue; }
    for (const pg of sec.children) {
      if (pg.type !== 'FRAME') continue;
      const pa = pg.findOne(n => n.name === 'Profile actions');
      if (!pa || !pa.children.some(c => c.name === 'Button · Message')) continue;
      const inst = moreLarge.createInstance(); inst.name = MORE;
      pa.appendChild(inst);
      const idn = pa.parent;
      done.push(pg.name + ' | actions ' + R(pa.width) + 'x' + R(pa.height) + ' | parent ' + idn.name + ' ' + R(idn.width) + 'x' + R(idn.height));
    }
  }
  report.info.profileActionsAdded = done;
  report.info.profileActionsAddedCount = done.length;
});

await step('hide ⋯ on Directory (unclaimed) mobile bar', async () => {
  const hidden = [];
  for (const i of mob.findAll(n => n.type === 'INSTANCE' && /Sticky action bar/.test(n.name))) {
    if (!/Directory/.test(pageOfNode(i))) continue;
    const m = i.findOne(n => n.name === MORE); if (m) { m.visible = false; hidden.push(pageOfNode(i)); }
  }
  report.info.hiddenOnDirectory = hidden;
});

await step('verify: sticky text overrides unchanged', async () => {
  const after = mob.findAll(n => n.type === 'INSTANCE' && /Sticky action bar/.test(n.name)).map(i => pageOfNode(i) + ' | ' + textsOf(i));
  const diff = after.filter((a, k) => a !== beforeSticky[k]);
  report.info.stickyBefore = beforeSticky;
  report.info.stickyTextChanged = diff.length ? diff : 'none';
  const bad = [];
  for (const i of mob.findAll(n => n.type === 'INSTANCE' && /Sticky action bar/.test(n.name))) {
    const last = i.children[i.children.length - 1], b = BB(i), lb = BB(last);
    if (last.visible !== false && lb.x + lb.width > b.x + b.width - 15) bad.push(pageOfNode(i));
  }
  report.info.stickyTooWide = bad.length ? bad : 'none';
});

await step('verify: language slot and header untouched', async () => {
  const bad = [];
  for (const page of [p02]) for (const t of page.findAll(n => n.type === 'TEXT' && n.name === 'EN' && n.parent && n.parent.name === 'Account actions')) if (t.characters !== 'EN') bad.push(pageOfNode(t));
  report.info.langSlotNotEN = bad.length ? bad : 'none';
});

await step('grayFills on new nodes', async () => {
  let gray = 0;
  for (const root of [moreLarge, profileMenu]) { if (!root) continue; for (const n of [root].concat(root.findAll(x => 'fills' in x))) if (Array.isArray(n.fills)) for (const f of n.fills) if (f.type === 'SOLID' && Math.abs(f.color.r - 0.5) < 0.01 && Math.abs(f.color.g - 0.5) < 0.01 && Math.abs(f.color.b - 0.5) < 0.01 && !(f.boundVariables && f.boundVariables.color)) gray++; }
  report.info.grayFills = gray;
});

return report;
