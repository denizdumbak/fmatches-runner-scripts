// step 323 · stadyum kartı varsayılan durum "Minimal data" (directory kaydı: yalnız ad, şehir, zemin; fotoğraf, kapasite, tenant, etkinlik, galeri yok) · masaüstü + mobil, ana sayfalardan türetilir, aynı Stadium card Section'larına eklenir
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = Math.round;
const p01 = figma.root.children.find(p => /^01/.test(p.name));
const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const sub = (plat, re) => plat.children.find(n => n.type === 'SECTION' && re.test(n.name));
const frameIn = (sec, re) => sec.children.find(n => n.type === 'FRAME' && re.test(n.name));
const pick = re => { let r = null; (function w(n) { if (r) return; if ((n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name)) { r = n; return; } if ('children' in n) for (const k of n.children) w(k); })(p01); return r; };
const variantOf = (set, re) => (set.type === 'COMPONENT_SET' ? set.children.find(c => re.test(c.name)) : set);
async function setText(t, str) { if (!t) throw new Error('metin katmanı yok: ' + str); for (const f of t.getRangeAllFontNames(0, Math.max(t.characters.length, 1))) await figma.loadFontAsync(f); t.characters = str; }
const textByName = (root, nm) => root.findOne(n => n.type === 'TEXT' && n.name === nm);
const nav = dest => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
const NAME = 'Havelblick Sportplatz';

const secD = sub(web, /^Stadium card$/), secM = sub(mob, /^Stadium card$/);
const deskFr = frameIn(secD, /^Facilities \/ Stadium card · Desktop$/), mobFr = frameIn(secM, /^Facilities \/ Stadium card · Mobile$/);
const mapD = frameIn(sub(web, /^Map$/), /^Map \/ Stadium card · Desktop$/), mapM = frameIn(sub(mob, /^Map$/), /^Map \/ Stadium card · Mobile$/);
report.info.sources = { deskFr: !!deskFr, mobFr: !!mobFr, mapD: !!mapD, mapM: !!mapM };
const made = {};

async function derive(src, sec, device, x) {
  const old = sec.children.find(n => n.type === 'FRAME' && n.name === `Facilities / Stadium card / Minimal data · ${device}`);
  if (old) old.remove();
  const fr = src.clone(); sec.appendChild(fr); fr.name = `Facilities / Stadium card / Minimal data · ${device}`; fr.x = x; fr.y = 100;
  try { p02.flowStartingPoints = p02.flowStartingPoints.filter(f => f.nodeId !== fr.id); } catch (e) { /* yok say */ }
  for (const n of [fr].concat(fr.findAll(() => true))) {
    if ('reactions' in n && n.reactions && n.reactions.length) {
      const keep = n.reactions.filter(r => !(r.actions || []).some(isNavAct));
      if (keep.length !== n.reactions.length) await n.setReactionsAsync(keep);
    }
  }
  const mobile = device === 'Mobile';
  // hero
  const hero = fr.findOne(n => n.name === 'Hero · stadium identity');
  const bc = fr.findOne(n => n.name === 'Breadcrumb'); if (bc) await setText(bc, `Facilities / Germany / ${NAME}`);
  const big = fr.findAll(n => n.type === 'TEXT' && n.characters === 'Spreeufer Stadium')[0]; await setText(big, NAME);
  const ph = hero.findOne(n => n.name === 'Facility photo'); if (ph) ph.remove();
  const role = fr.findOne(n => n.name === 'Role') || fr.findOne(n => n.name === 'Name and role');
  role.visible = false;
  const kf = fr.findOne(n => n.name === 'Key facts');
  const cap = kf.children.find(n => /Capacity/.test(n.name)); if (cap) cap.remove();
  const sf = kf.children.find(n => /Surface/.test(n.name)); await setText(textByName(sf, 'Value'), 'Artificial turf');
  // body
  const body = fr.findOne(n => n.name === 'Profile body');
  const cols = body.findOne(n => n.name === 'Profile columns');
  const container = cols || body;
  const left = cols ? cols.findOne(n => n.name === 'Left column') : body, right = cols ? cols.findOne(n => n.name === 'Right column') : body;
  for (const nm of ['Gallery', 'Tenants', 'Upcoming events']) { const c = container.findOne(n => n.name === nm && n.type === 'FRAME'); if (c) c.remove(); }
  const loc = fr.findOne(n => /^Location ·/.test(n.name)); await setText(textByName(loc, 'Place'), 'Havelblick, Berlin, Germany');
  const ev = variantOf(pick(/^Empty card$/), new RegExp('Device=' + device)).createInstance();
  right.appendChild(ev); ev.layoutSizingHorizontal = 'FILL'; ev.name = 'Upcoming events · empty';
  await setText(textByName(ev, 'Section heading'), 'Upcoming events');
  await setText(textByName(ev, 'Title'), 'No events yet');
  await setText(textByName(ev, 'Body'), 'Tournaments and matches played at this facility will show up here.');
  const eb = ev.findOne(n => n.type === 'INSTANCE' && /Button/.test(n.name)); if (eb) { await setText(eb.findOne(n => n.type === 'TEXT'), 'Browse events'); eb.name = 'Button · Browse events'; }
  // link back to map
  const hb = fr.findOne(n => n.name === 'Button · View on map');
  await hb.setReactionsAsync(hb.reactions.filter(r => !(r.actions || []).some(isNavAct)).concat([nav(mobile ? mapM : mapD)]));
  return fr;
}

await step('A desktop minimal', async () => { made.d = await derive(deskFr, secD, 'Desktop', 80 + 1440 + 160); });
await step('B mobile minimal', async () => { made.m = await derive(mobFr, secM, 'Mobile', 80 + 390 + 160); });

await step('C section sizes + check', async () => {
  const out = [];
  for (const [sec, plat, fr] of [[secD, web, made.d], [secM, mob, made.m]]) {
    if (!fr) continue;
    let r = 0, b = 0; for (const k of sec.children) { r = Math.max(r, k.x + k.width); b = Math.max(b, k.y + k.height); }
    sec.resizeWithoutConstraints(r + 80, b + 100);
    plat.resizeWithoutConstraints(plat.width, Math.max(plat.height, sec.y + sec.height + 120));
    const un = fr.findAll(n => n.type === 'TEXT' && !n.textStyleId).length;
    const over = [];
    for (const n of fr.findAll(x => x.visible !== false && x.type !== 'VECTOR')) { const p = n.parent; if (!p || p === fr || p.type === 'INSTANCE' || n.layoutPositioning === 'ABSOLUTE' || p.type !== 'FRAME') continue; const a = n.absoluteBoundingBox, bb = p.absoluteBoundingBox; if (a && bb && a.x + a.width > bb.x + bb.width + 0.5) over.push(`${p.name} :: ${n.name}`); }
    const hero = fr.findOne(n => n.name === 'Hero · stadium identity');
    const body = fr.findOne(n => n.name === 'Profile body');
    const sb = sec.absoluteBoundingBox, ov = [];
    for (const s of plat.children) if (s !== sec && s.type === 'SECTION') { const c = s.absoluteBoundingBox; if (sb.x < c.x + c.width && c.x < sb.x + sb.width && sb.y < c.y + c.height && c.y < sb.y + sb.height) ov.push(s.name); }
    out.push(`${fr.name}: ${R(fr.width)}x${R(fr.height)} hero ${R(hero.height)} body ${R(body.height)} unstyled ${un} overflow ${over.length ? over.join('; ') : 'none'} section ${R(sec.width)}x${R(sec.height)} overlaps ${ov.length ? ov.join(',') : 'none'}`);
  }
  report.info.check = out;
});

return report;
