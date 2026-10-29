// step 254 · Profile more-menu pages: Web + Mobile "Profile menu" (menu open under the ⋯) and "Block person" (scrim + "Block Leo Marsh?" dialog) pages in Profiles · player, as viewport-sized clones of the Leo profile; sections re-stacked where they grew; no arrows or prototype yet
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const R = n => Math.round(n * 10) / 10;
const BB = n => n.absoluteBoundingBox;
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => allVars.find(x => x.name === name);
const web = p02.children.find(n => n.name === 'Web'), mob = p02.children.find(n => n.name === 'Mobile');
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';

const menuComp = p01.findOne(n => n.type === 'COMPONENT' && n.name === 'Profile menu');
const dlgSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Confirm dialog');
if (!menuComp || !dlgSet) throw new Error('Profile menu or Confirm dialog not found (run step 253 first)');
const dlgVariant = dev => dlgSet.children.find(v => v.name === 'Kind=Block person, Device=' + dev);

const NAMES = { menuD: 'Profiles / Player / Profile menu · Desktop', blockD: 'Profiles / Player / Block person · Desktop', menuM: 'Profiles / Player / Profile menu · Mobile', blockM: 'Profiles / Player / Block person · Mobile' };
const created = [];

// scrim: reuse the one from the Messenger block page when there is one
let scrimSource = null;
await step('find scrim source', async () => {
  const m = web.children.find(n => n.name === 'Messenger');
  const pg = m && m.children.find(n => /Block person/.test(n.name));
  scrimSource = pg ? pg.findOne(n => /scrim/i.test(n.name)) : null;
  report.info.scrimSource = scrimSource ? scrimSource.name + ' ' + R(scrimSource.width) + 'x' + R(scrimSource.height) : 'none (fallback rectangle)';
});

function makeScrim(page, w, h) {
  let s;
  if (scrimSource) { s = scrimSource.clone(); }
  else { s = figma.createRectangle(); s.name = 'Scrim'; const v = V('color/bg/inverse'); if (v) s.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v)]; s.opacity = 0.5; }
  page.appendChild(s);
  s.layoutPositioning = 'ABSOLUTE'; s.x = 0; s.y = 0; s.resize(w, h); s.name = 'Scrim';
  return s;
}
async function clearNav(root) {
  let n = 0;
  for (const x of [root].concat(root.findAll(() => true))) {
    if (!('reactions' in x) || !x.reactions || !x.reactions.length) continue;
    const keep = x.reactions.filter(r => !(r.actions || []).some(isNavAct));
    if (keep.length !== x.reactions.length) { try { await x.setReactionsAsync(keep); n++; } catch (e) { } }
  }
  return n;
}
function fixToViewport(page, w, h) {
  page.primaryAxisSizingMode = 'FIXED'; page.counterAxisSizingMode = 'FIXED';
  page.resize(w, h); page.clipsContent = true;
}
function rel(page, node) { const a = BB(page), b = BB(node); return { x: b.x - a.x, y: b.y - a.y, w: b.width, h: b.height }; }

async function buildPage(srcName, newName, sec, kind, device) {
  const src = sec.children.find(n => n.name === srcName);
  if (!src) throw new Error('source page missing: ' + srcName);
  const old = sec.children.find(n => n.name === newName); if (old) old.remove();
  const pg = src.clone(); sec.appendChild(pg);
  pg.name = newName;
  report.info['navCleared ' + newName] = await clearNav(pg);
  const W = device === 'Desktop' ? 1440 : 390, H = device === 'Desktop' ? 900 : 844;
  fixToViewport(pg, W, H);
  if (device === 'Mobile') { const bar = pg.findOne(n => /^Sticky action bar/.test(n.name)); if (bar) { bar.y = H - 81; } }
  if (kind === 'menu') {
    const inst = menuComp.createInstance(); inst.name = 'Profile menu';
    pg.appendChild(inst); inst.layoutPositioning = 'ABSOLUTE';
    if (device === 'Desktop') {
      const btn = pg.findOne(n => n.type === 'INSTANCE' && n.name === 'Icon button · More');
      if (!btn) throw new Error('⋯ button not found on ' + newName);
      const r = rel(pg, btn);
      let y = r.y + r.h + 8; if (y + inst.height > H - 16) y = r.y - 8 - inst.height;
      inst.x = Math.round(r.x); inst.y = Math.round(y);
      report.info['menu ' + newName] = 'button ' + R(r.x) + ',' + R(r.y) + ' ' + R(r.w) + 'x' + R(r.h) + ' -> menu ' + R(inst.x) + ',' + R(inst.y) + ' ' + R(inst.width) + 'x' + R(inst.height);
    } else {
      inst.x = 390 - 16 - inst.width; inst.y = H - 81 + 13 - 8 - inst.height;
      report.info['menu ' + newName] = 'menu ' + R(inst.x) + ',' + R(inst.y) + ' ' + R(inst.width) + 'x' + R(inst.height) + ' (above the bar, right aligned)';
    }
  } else {
    makeScrim(pg, W, H);
    const v = dlgVariant(device); if (!v) throw new Error('Block person dialog variant missing for ' + device);
    const d = v.createInstance(); d.name = 'Confirm dialog · Block person';
    pg.appendChild(d); d.layoutPositioning = 'ABSOLUTE';
    d.x = Math.round((W - d.width) / 2); d.y = Math.round((H - d.height) / 2);
    const title = d.findOne(n => n.type === 'TEXT' && n.name === 'Title');
    if (title) { await figma.loadFontAsync(title.fontName); title.characters = 'Block Leo Marsh?'; }
    report.info['dialog ' + newName] = R(d.x) + ',' + R(d.y) + ' ' + R(d.width) + 'x' + R(d.height) + ' title="' + (title ? title.characters : '?') + '"';
  }
  created.push(pg);
  return pg;
}

async function growAndRestack(platform, label) {
  const secs = platform.children.filter(n => n.type === 'SECTION').sort((a, b) => a.y - b.y || a.x - b.x);
  const moved = [];
  for (let i = 0; i < secs.length; i++) for (let j = 0; j < i; j++) {
    const a = secs[j], b = secs[i];
    const xo = a.x < b.x + b.width && b.x < a.x + a.width;
    if (xo && b.y >= a.y && b.y < a.y + a.height + 160) { const ny = a.y + a.height + 160; if (ny !== b.y) { moved.push(b.name + ' ' + R(b.y) + '->' + R(ny)); b.y = ny; } }
  }
  let right = 0, bottom = 0;
  for (const s of platform.children) { right = Math.max(right, s.x + s.width); bottom = Math.max(bottom, s.y + s.height); }
  const nw = Math.max(platform.width, right + 120), nh = Math.max(platform.height, bottom + 120);
  const before = R(platform.width) + 'x' + R(platform.height);
  platform.resizeWithoutConstraints(nw, nh);
  report.info['restack ' + label] = { sectionsMoved: moved.length ? moved : 'none', platform: before + ' -> ' + R(nw) + 'x' + R(nh) };
}

await step('Web pages', async () => {
  const sec = web.children.find(n => n.name === 'Profiles · player'); if (!sec) throw new Error('Web section Profiles · player missing');
  const leo = sec.children.find(n => n.name === 'Profiles / Player · Desktop'); if (!leo) throw new Error('Leo Web page missing');
  const menu = await buildPage('Profiles / Player · Desktop', NAMES.menuD, sec, 'menu', 'Desktop');
  const block = await buildPage('Profiles / Player · Desktop', NAMES.blockD, sec, 'block', 'Desktop');
  let bottom = 0; for (const k of sec.children) { if (k === menu || k === block) continue; bottom = Math.max(bottom, k.y + k.height); }
  menu.x = leo.x; menu.y = Math.ceil(bottom + 160);
  block.x = menu.x + 1440 + 160; block.y = menu.y;
  sec.resizeWithoutConstraints(Math.max(sec.width, block.x + block.width + 80), Math.ceil(menu.y + 900 + 80));
  report.info.webSection = sec.name + ' ' + R(sec.width) + 'x' + R(sec.height) + ' | new pages @ ' + R(menu.x) + ',' + R(menu.y) + ' and ' + R(block.x) + ',' + R(block.y);
  await growAndRestack(web, 'Web');
});

await step('Mobile pages', async () => {
  const sec = mob.children.find(n => n.name === 'Profiles · player'); if (!sec) throw new Error('Mobile section Profiles · player missing');
  const leo = sec.children.find(n => n.name === 'Profiles / Player · Mobile'); if (!leo) throw new Error('Leo Mobile page missing');
  const menu = await buildPage('Profiles / Player · Mobile', NAMES.menuM, sec, 'menu', 'Mobile');
  const block = await buildPage('Profiles / Player · Mobile', NAMES.blockM, sec, 'block', 'Mobile');
  let bottom = 0; for (const k of sec.children) { if (k === menu || k === block) continue; bottom = Math.max(bottom, k.y + k.height); }
  menu.x = leo.x; menu.y = Math.ceil(bottom + 160);
  block.x = menu.x + 390 + 80; block.y = menu.y;
  sec.resizeWithoutConstraints(Math.max(sec.width, block.x + block.width + 80), Math.ceil(menu.y + 844 + 80));
  report.info.mobileSection = sec.name + ' ' + R(sec.width) + 'x' + R(sec.height) + ' | new pages @ ' + R(menu.x) + ',' + R(menu.y) + ' and ' + R(block.x) + ',' + R(block.y);
  await growAndRestack(mob, 'Mobile');
});

await step('Mobile x follows Web width', async () => {
  const nx = web.x + web.width + 400;
  report.info.mobileX = R(mob.x) + ' -> ' + R(nx);
  if (Math.abs(mob.x - nx) > 0.5) { mob.x = nx; }
});

await step('flow starts: drop the ones copied with the clones', async () => {
  await figma.setCurrentPageAsync(p02);
  const ids = new Set(created.map(c => c.id));
  const before = p02.flowStartingPoints.length;
  p02.flowStartingPoints = p02.flowStartingPoints.filter(f => !ids.has(f.nodeId));
  report.info.flowStarts = before + ' -> ' + p02.flowStartingPoints.length + ' (expected 16 kept)';
});

await step('verify', async () => {
  const rows = created.map(pg => pg.name + ' ' + R(pg.width) + 'x' + R(pg.height) + ' | top children: ' + pg.children.slice(-3).map(c => c.name).join(' | '));
  report.info.newPages = rows;
  const outside = [];
  for (const platform of [web, mob]) for (const s of platform.children.filter(n => n.type === 'SECTION')) for (const c of s.children) { if (c.x < -1 || c.y < -1 || c.x + c.width > s.width + 1 || c.y + c.height > s.height + 1) outside.push(platform.name + ' › ' + s.name + ' > ' + c.name); }
  report.info.outsideParent = outside.length ? outside.slice(0, 10) : 'none';
  const ov = [];
  for (const platform of [web, mob]) { const ss = platform.children.filter(n => n.type === 'SECTION'); for (let i = 0; i < ss.length; i++) for (let j = i + 1; j < ss.length; j++) { const a = ss[i], b = ss[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov.push(platform.name + ': ' + a.name + ' x ' + b.name); } }
  report.info.sectionOverlaps = ov.length ? ov : 'none';
  const tops = {}; for (const platform of [web, mob]) tops[platform.name] = platform.children.map(s => s.name + ' @' + R(s.x) + ',' + R(s.y) + ' ' + R(s.width) + 'x' + R(s.height)).join(' | ');
  report.info.platformSections = tops;
  let gray = 0; for (const pg of created) for (const n of pg.findAll(x => 'fills' in x)) if (Array.isArray(n.fills)) for (const f of n.fills) if (f.type === 'SOLID' && Math.abs(f.color.r - 0.5) < 0.01 && Math.abs(f.color.g - 0.5) < 0.01 && Math.abs(f.color.b - 0.5) < 0.01 && !(f.boundVariables && f.boundVariables.color)) gray++;
  report.info.grayFills = gray;
});

return report;
