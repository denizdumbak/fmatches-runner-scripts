// step 410 · Faz 8 (2): 02'de yeni "Cookies & privacy" Section'i (Web + Mobile): Cookie banner (Home ustunde), Cookie settings (dialog acik), Privacy policy sayfasi; prototip baglantilari + akis baslangici
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const sz = n => R(n.width) + 'x' + R(n.height);
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name) || allVars.find(x => x.name.endsWith('/' + name)); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const GAP = (n, v) => n.setBoundVariable('itemSpacing', V(v));
const styles = await figma.getLocalTextStylesAsync();
const TS = nm => { const s = styles.find(x => x.name === nm); if (!s) throw new Error('text style yok: ' + nm); return s; };
for (const s of styles) { try { await figma.loadFontAsync(s.fontName); } catch (e) {} }
async function setText(t, s) { const f = t.fontName; await figma.loadFontAsync(f === figma.mixed ? t.getRangeFontName(0, 1) : f); t.characters = s; }
async function txt(name, str, style, color) { const t = figma.createText(); t.name = name; await t.setTextStyleIdAsync(TS(style).id); t.characters = str; t.fills = [P(V(color))]; return t; }
function frame(name, dir) { const f = figma.createFrame(); f.name = name; f.layoutMode = dir; f.fills = []; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; f.clipsContent = false; return f; }
const fillW = n => { try { n.layoutSizingHorizontal = 'FILL'; } catch (e) {} };
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
const nav = dest => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
async function clearNav(root) {
  for (const n of [root].concat(root.findAll(() => true))) {
    try { const rs = n.reactions; if (!rs || !rs.length) continue;
      const keep = rs.filter(r => !(r.actions || (r.action ? [r.action] : [])).some(isNavAct));
      if (keep.length !== rs.length) await n.setReactionsAsync(keep); } catch (e) {}
  }
}
const links = [];
async function link(root, name, dest) {
  const el = root.findOne(n => n.name === name);
  if (!el) { report.errors.push('link: ' + name + ' yok / ' + root.name); return; }
  const keep = (el.reactions || []).filter(r => !(r.actions || []).some(isNavAct));
  await el.setReactionsAsync(keep.concat([nav(dest)]));
  links.push(root.name.replace(/^System \//, '') + ' :: ' + name + ' -> ' + dest.name.replace(/^System \//, ''));
}
const SEC = 'Cookies & privacy';
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const bannerSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Cookie banner');
const dialogSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Cookie dialog');
if (!bannerSet || !dialogSet) throw new Error('Cookie component yok (409)');
const btnSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Button');

const POLICY = [
  ['Who we are', 'FriendlyMatches International runs fmatches.com, a global football directory with profiles, search, events and direct messaging.'],
  ['What we collect', 'The details you add to your profile, your messages and event requests, and basic technical data such as your browser and language.'],
  ['How we use it', 'To show your profile in search, connect you with clubs, scouts and players, and keep the site secure. We do not sell your data.'],
  ['Cookies', 'Necessary cookies keep you signed in and the site secure. Analytics and marketing cookies are used only if you allow them.'],
  ['Your rights', 'You can see, correct or delete your data at any time. Deleting your account hides your profile and removes your personal details.'],
  ['Contact', 'Questions about your data: privacy@fmatches.com']
];

// ---------- 0. temizlik + Section
const secs = {};
await step('Section hazirla', async () => {
  const before = p02.flowStartingPoints.length;
  for (const [key, plat] of [['Web', web], ['Mobile', mob]]) {
    let s = plat.children.find(n => n.type === 'SECTION' && n.name === SEC);
    if (s) { for (const c of s.children.slice()) c.remove(); }
    else {
      const subs = plat.children.filter(n => n.type === 'SECTION');
      const last = subs.sort((a, b) => (b.y + b.height) - (a.y + a.height))[0];
      s = figma.createSection(); s.name = SEC; plat.appendChild(s);
      s.x = last.x; s.y = last.y + last.height + 160;
    }
    secs[key] = s;
  }
  const ids = new Set(); for (const s of Object.values(secs)) for (const n of s.findAll(() => true)) ids.add(n.id);
  p02.flowStartingPoints = p02.flowStartingPoints.filter(f => !ids.has(f.nodeId) && !/Cookie/.test(f.name));
  report.info.flowStartsBefore = before;
});

// ---------- 1. ekranlar
const home = {
  Web: web.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · Desktop'),
  Mobile: mob.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · Mobile')
};
const settingsScr = {
  Web: web.findOne(n => n.type === 'FRAME' && n.name === 'Settings / My settings · Desktop'),
  Mobile: mob.findOne(n => n.type === 'FRAME' && n.name === 'Settings / My settings · Mobile')
};
const scrimSrc = {
  Web: web.findOne(n => n.type === 'RECTANGLE' && n.name === 'Scrim' && R(n.width) === 1440),
  Mobile: mob.findOne(n => n.type === 'RECTANGLE' && n.name === 'Scrim' && R(n.width) === 390)
};
report.info.sources = Object.keys(home).map(k => k + ': home ' + (home[k] ? sz(home[k]) : 'YOK') + ', settings ' + (settingsScr[k] ? 'ok' : 'YOK') + ', scrim ' + (scrimSrc[k] ? 'ok' : 'YOK'));
const S = { Web: {}, Mobile: {} };
function viewport(src, sec, name, D) {
  const f = src.clone(); sec.appendChild(f); f.name = name;
  f.primaryAxisSizingMode = 'FIXED'; f.resize(D ? 1440 : 390, D ? 900 : 844); f.clipsContent = true;
  return f;
}
for (const key of ['Web', 'Mobile']) {
  const D = key === 'Web', dev = D ? 'Desktop' : 'Mobile', sec = secs[key];
  await step(key + ' · Cookie banner', async () => {
    const f = viewport(home[key], sec, 'System / Cookie banner · ' + dev, D);
    await clearNav(f);
    const b = bannerSet.children.find(v => v.name === 'Device=' + dev).createInstance(); b.name = 'Cookie banner';
    f.appendChild(b); b.layoutPositioning = 'ABSOLUTE'; b.x = 0; b.y = f.height - b.height;
    S[key].banner = f;
  });
  await step(key + ' · Cookie settings', async () => {
    const f = viewport(home[key], sec, 'System / Cookie settings · ' + dev, D);
    await clearNav(f);
    const sc = scrimSrc[key].clone(); f.appendChild(sc); sc.layoutPositioning = 'ABSOLUTE'; sc.x = 0; sc.y = 0; sc.resize(f.width, f.height);
    const d = dialogSet.children.find(v => v.name === 'Device=' + dev).createInstance(); d.name = 'Cookie dialog';
    f.appendChild(d); d.layoutPositioning = 'ABSOLUTE'; d.x = R((f.width - d.width) / 2); d.y = R((f.height - d.height) / 2);
    S[key].dialog = f;
  });
  await step(key + ' · Privacy policy', async () => {
    const f = home[key].clone(); sec.appendChild(f); f.name = 'System / Privacy policy · ' + dev;
    await clearNav(f);
    for (const c of f.children.slice()) if (!/^(Ticker|Navigation|Footer)$/.test(c.name)) c.remove();
    const body = settingsScr[key].findOne(n => n.name === 'My settings body').clone();
    f.insertChild(f.children.findIndex(c => c.name === 'Navigation') + 1, body); body.name = 'Policy body'; fillW(body);
    const col = body.findOne(n => n.name === 'Column');
    for (const c of col.children.slice()) if (c.name !== 'Heading row') c.remove();
    await setText(col.findOne(n => n.type === 'TEXT' && n.name === 'Title'), 'Privacy policy');
    const meta = await txt('Updated', 'Last updated 14 November 2026', 'Body/Small', 'color/text/secondary');
    col.appendChild(meta);
    for (const [h, p] of POLICY) {
      const s = frame('Part · ' + h, 'VERTICAL'); GAP(s, 'spacing/xs'); col.appendChild(s); fillW(s);
      const ht = await txt('Heading', h, D ? 'Heading/H3' : 'Heading/H4', 'color/text/primary');
      const pt = await txt('Body', p, 'Body/Default', 'color/text/primary');
      s.appendChild(ht); s.appendChild(pt); pt.layoutSizingHorizontal = 'FILL'; pt.textAutoResize = 'HEIGHT';
      if (h === 'Cookies') {
        const b = btnSet.children.find(v => v.name === 'Style=Secondary, State=Default').createInstance();
        b.name = 'Button · Cookie settings'; b.setProperties({ 'Label#8:0': 'Cookie settings' });
        const bt = b.findOne(n => n.type === 'TEXT'); if (bt) await setText(bt, 'Cookie settings');
        s.appendChild(b);
      }
    }
    f.primaryAxisSizingMode = 'AUTO';
    S[key].policy = f;
  });
  await step(key + ' · yerlesim', async () => {
    const list = [S[key].banner, S[key].dialog, S[key].policy].filter(Boolean);
    list.forEach((f, i) => { f.x = D ? 80 + i * 1920 : 80 + i * 470; f.y = D ? 100 : 80; });
    const note = await txt('Note · Placeholder policy', 'Privacy policy: placeholder copy. Final legal text comes from FriendlyMatches.', 'Label/Small', 'color/text/secondary');
    sec.appendChild(note); note.x = list[2] ? list[2].x : 80; note.y = D ? 56 : 40;
    const right = Math.max.apply(null, sec.children.map(n => n.x + n.width)), bottom = Math.max.apply(null, sec.children.map(n => n.y + n.height));
    sec.resizeWithoutConstraints(right + 80, bottom + 80);
  });
}

// ---------- 2. prototip
await step('Prototip', async () => {
  for (const key of ['Web', 'Mobile']) {
    const s = S[key], h = home[key]; if (!s.banner || !s.dialog || !s.policy) continue;
    await link(s.banner, 'Button · Manage', s.dialog);
    await link(s.banner, 'Button · Accept all', h);
    await link(s.banner, 'Button · Reject all', h);
    await link(s.banner, 'Link · Privacy policy', s.policy);
    await link(s.dialog, 'Button · Save choices', h);
    await link(s.dialog, 'Button · Accept all', h);
    await link(s.dialog, 'Button · Reject all', h);
    await link(s.policy, 'Button · Cookie settings', s.dialog);
  }
  const fs = p02.flowStartingPoints.slice();
  const seen = new Set(fs.map(f => f.nodeId));
  for (const [nm, node] of [['Web · Cookie banner', S.Web.banner], ['Mobile · Cookie banner', S.Mobile.banner]]) if (node && !seen.has(node.id)) fs.push({ nodeId: node.id, name: nm });
  p02.flowStartingPoints = fs.filter((f, i, a) => a.findIndex(x => x.nodeId === f.nodeId) === i);
  report.info.links = links;
  report.info.flowStartsAfter = p02.flowStartingPoints.length;
});

// ---------- 3. platformlar + kontrol
await step('Platform ve kontrol', async () => {
  for (const plat of [web, mob]) {
    const bottom = Math.max.apply(null, plat.children.map(n => n.y + n.height));
    const right = Math.max.apply(null, plat.children.map(n => n.x + n.width));
    plat.resizeWithoutConstraints(Math.max(plat.width, right + 120), Math.ceil(bottom + 120));
  }
  mob.x = Math.max(mob.x, web.x + web.width + 400);
  const ov = [];
  for (const plat of [web, mob]) { const ss = plat.children.filter(n => n.type === 'SECTION');
    for (let i = 0; i < ss.length; i++) for (let j = i + 1; j < ss.length; j++) { const a = ss[i], b = ss[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov.push(plat.name + ': ' + a.name + ' x ' + b.name); } }
  report.info.sectionOverlaps = ov.length ? ov : 'none';
  report.info.sections = Object.keys(secs).map(k => k + ' ' + R(secs[k].x) + ',' + R(secs[k].y) + ' ' + sz(secs[k]));
  report.info.screens = [].concat.apply([], ['Web', 'Mobile'].map(k => Object.values(S[k]).map(f => f.name + ' ' + sz(f))));
  let unstyled = 0; const over = [];
  for (const k of ['Web', 'Mobile']) for (const f of Object.values(S[k])) {
    for (const t of f.findAll(n => n.type === 'TEXT')) { let p = t.parent, inst = false; while (p && p !== f) { if (p.type === 'INSTANCE') { inst = true; break; } p = p.parent; } if (!inst && !t.textStyleId) unstyled++; }
    const pb = f.absoluteBoundingBox;
    for (const nm of ['Cookie banner', 'Cookie dialog']) { const n = f.findOne(x => x.name === nm); if (n) { const b = n.absoluteBoundingBox; if (b.x < pb.x || b.y < pb.y || b.x + b.width > pb.x + pb.width + .5 || b.y + b.height > pb.y + pb.height + .5) over.push(f.name + ' :: ' + nm); } }
    const pol = f.findOne(x => x.name === 'Policy body'); if (pol) { const c = pol.findOne(x => x.name === 'Column'); report.info['column · ' + k] = sz(c); }
  }
  report.info.check = { unstyledText: unstyled, outsideScreen: over.length ? over : 'none' };
});
return report;
