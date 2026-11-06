// step 317 · Faz 6 stadyum kartı (masaüstü, yapı A): Manager sayfasından türetilen `Facilities / Stadium card · Desktop`, yeni Section "Stadium card" (Web), hero + Location + Gallery + Tenants + Upcoming events, haritadaki "View stadium" ve hero "View on map" prototip bağlantıları
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = Math.round;
const p01 = figma.root.children.find(p => /^01/.test(p.name));
const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
const allVars = await figma.variables.getLocalVariablesAsync();
const tryV = (...ns) => { for (const n of ns) { const v = allVars.find(x => x.name === n); if (v) return v; } return null; };
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const sub = (plat, re) => plat.children.find(n => n.type === 'SECTION' && re.test(n.name));
const frameIn = (sec, re) => sec.children.find(n => n.type === 'FRAME' && re.test(n.name));
const pick = re => { let r = null; (function w(n) { if (r) return; if ((n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name)) { r = n; return; } if ('children' in n) for (const k of n.children) w(k); })(p01); return r; };
const variantOf = (set, re) => (set.type === 'COMPONENT_SET' ? set.children.find(c => re.test(c.name)) : set);
async function setText(t, str) { if (!t) throw new Error('metin katmanı yok: ' + str); for (const f of t.getRangeAllFontNames(0, Math.max(t.characters.length, 1))) await figma.loadFontAsync(f); t.characters = str; }
const textByName = (root, nm) => root.findOne(n => n.type === 'TEXT' && n.name === nm);
const nav = dest => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
const fillW = n => { n.layoutSizingHorizontal = 'FILL'; };

const mgrFr = frameIn(sub(web, /^Profiles · other roles/), /^Profiles \/ Manager · Desktop$/);
const plFr = frameIn(sub(web, /^Profiles · player/), /^Profiles \/ Player · Desktop$/);
const mapFr = frameIn(sub(web, /^Map$/), /^Map \/ Stadium card · Desktop$/);
report.info.sources = { manager: !!mgrFr, player: !!plFr, map: !!mapFr };
let secN, fr;

await step('A section + clone', async () => {
  const old = web.children.find(n => n.type === 'SECTION' && n.name === 'Stadium card');
  if (old) old.remove();
  secN = figma.createSection(); secN.name = 'Stadium card'; web.appendChild(secN);
  let bottom = 0;
  for (const s of web.children) if (s !== secN && s.type === 'SECTION') bottom = Math.max(bottom, s.y + s.height);
  secN.x = 120; secN.y = bottom + 160;
  secN.resizeWithoutConstraints(1600, 2000);
  fr = mgrFr.clone(); secN.appendChild(fr);
  fr.name = 'Facilities / Stadium card · Desktop'; fr.x = 80; fr.y = 100;
  try { p02.flowStartingPoints = p02.flowStartingPoints.filter(f => f.nodeId !== fr.id); } catch (e) { report.info.flowStartNote = String(e.message || e); }
  let cleared = 0;
  for (const n of [fr].concat(fr.findAll(() => true))) {
    if ('reactions' in n && n.reactions && n.reactions.length) {
      const keep = n.reactions.filter(r => !(r.actions || []).some(isNavAct));
      if (keep.length !== n.reactions.length) { await n.setReactionsAsync(keep); cleared++; }
    }
  }
  report.info.clearedReactions = cleared;
});

await step('B hero', async () => {
  const hero = fr.findOne(n => n.name === 'Hero · player identity'); hero.name = 'Hero · stadium identity';
  for (const k of hero.children.slice()) if (k.layoutPositioning === 'ABSOLUTE') k.remove();
  const identity = hero.children.find(n => n.name === 'Identity');
  await setText(identity.children.find(n => n.name === 'Breadcrumb'), 'Facilities / Germany / Spreeufer Stadium');
  const nr = identity.findOne(n => n.name === 'Name and role'), pn = nr.findOne(n => n.name === 'Player name');
  const texts = pn.findAll(n => n.type === 'TEXT');
  report.info.nameTexts = texts.map(t => `${t.name}|${t.characters}|${typeof t.fontSize === 'number' ? t.fontSize : 'm'}`);
  const small = texts.find(t => /first/i.test(t.name)) || texts.slice().sort((a, b) => a.fontSize - b.fontSize)[0];
  const big = texts.find(t => /surname/i.test(t.name)) || texts.slice().sort((a, b) => b.fontSize - a.fontSize)[0];
  await setText(small, 'Spreeufer'); await setText(big, 'Stadium');
  for (const b of pn.findAll(n => n.type === 'INSTANCE' && /Verification/.test(n.name))) b.visible = false;
  const role = nr.findOne(n => n.name === 'Role');
  const rt = role.findAll(n => n.type === 'TEXT');
  report.info.roleTexts = rt.map(t => t.characters);
  await setText(rt[0], 'Stadium');
  const kf = identity.children.find(n => n.name === 'Key facts');
  const setFact = async (inst, label, value, subText) => {
    await setText(textByName(inst, 'Label'), label); await setText(textByName(inst, 'Value'), value);
    const s = textByName(inst, 'Sub');
    if (s) { if (subText) { await setText(s, subText); s.visible = true; } else s.visible = false; }
    for (const x of inst.findAll(n => /^(Flag|Nation 2|Nation 3|Value row 2)$/.test(n.name))) x.visible = false;
  };
  const fAge = kf.children.find(n => /Age/.test(n.name)), fRole = kf.children.find(n => /· Role/.test(n.name)), fC = kf.children.find(n => /Contract/.test(n.name)), fNat = kf.children.find(n => /Nationality/.test(n.name));
  await setFact(fAge, 'Capacity', '4,200', null); fAge.name = 'Fact · Capacity';
  await setFact(fRole, 'Surface', 'Natural grass', null); fRole.name = 'Fact · Surface';
  await setFact(fC, 'City', 'Berlin', 'Germany'); fC.name = 'Fact · City';
  if (fNat) fNat.remove();
  const cs = identity.children.find(n => n.name === 'Club strip'); if (cs) cs.remove();
  const pa = identity.children.find(n => n.name === 'Profile actions');
  const btn = pa.children.find(n => /Button · Message/.test(n.name));
  for (const k of pa.children.slice()) if (k !== btn) k.remove();
  btn.name = 'Button · View on map';
  report.info.btnProps = Object.keys(btn.componentProperties || {});
  await setText(btn.findOne(n => n.type === 'TEXT'), 'View on map');
  const ik = Object.keys(btn.componentProperties || {}).find(k => /^Icon/.test(k));
  if (ik && btn.componentProperties[ik].type === 'BOOLEAN') btn.setProperties({ [ik]: false });
  const photo = figma.createRectangle(); hero.appendChild(photo); photo.name = 'Facility photo'; photo.layoutPositioning = 'ABSOLUTE';
  photo.resize(488, hero.height - 80); photo.x = 872; photo.y = 40;
  const rv = tryV('radius/lg', 'Dimension/radius/lg');
  if (rv) for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) photo.setBoundVariable(k, rv); else photo.cornerRadius = 20;
  const img = await figma.createImageAsync('https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/img/gallery/gallery-b.jpg');
  photo.fills = [{ type: 'IMAGE', imageHash: img.hash, scaleMode: 'FILL' }];
  report.info.hero = `${R(hero.width)}x${R(hero.height)}`; report.info.photo = `${R(photo.width)}x${R(photo.height)} @${R(photo.x)},${R(photo.y)} radiusBound=${!!rv}`;
});

await step('C body', async () => {
  const body = fr.findOne(n => n.name === 'Profile body');
  const cols = body.findOne(n => n.name === 'Profile columns');
  const left = cols.findOne(n => n.name === 'Left column'), right = cols.findOne(n => n.name === 'Right column');
  for (const c of left.children.slice()) c.remove(); for (const c of right.children.slice()) c.remove();
  const loc = pick(/^Event location card$/).createInstance(); left.appendChild(loc); fillW(loc); loc.name = 'Location · Spreeufer Stadium';
  await setText(textByName(loc, 'Place'), 'Mitte, Berlin, Germany');
  const mm = pick(/^Map marker$/);
  report.info.markerVariants = mm.type === 'COMPONENT_SET' ? mm.children.map(c => c.name) : 'single';
  const mInst = loc.findOne(n => n.type === 'INSTANCE' && /Marker/i.test(n.name));
  const fv = mm.type === 'COMPONENT_SET' ? mm.children.find(c => /Stadium|Facilit/i.test(c.name) && !/selected|hover/i.test(c.name)) : null;
  if (mInst && fv) { mInst.swapComponent(fv); report.info.markerSwap = fv.name; } else report.info.markerSwap = 'yok';
  const gal = plFr.findOne(n => n.name === 'Gallery' && n.type === 'FRAME').clone(); left.appendChild(gal); fillW(gal);
  const career = plFr.findOne(n => n.name === 'Career' && n.type === 'FRAME');
  const mkCard = async (name, title) => {
    const c = career.clone(); right.appendChild(c); fillW(c); c.name = name;
    const h = c.findAll(n => n.type === 'TEXT').find(t => t.characters === 'Career'); await setText(h, title);
    const ce = c.findOne(n => n.name === 'Club entries'); if (ce) ce.remove();
    return c;
  };
  const ten = await mkCard('Tenants', 'Tenants');
  const csSet = pick(/^Club strip$/); const csV = variantOf(csSet, /Kind=Club, Device=Desktop/);
  const tenants = [['Spreeufer FC', 'Germany', 'Fourth Division'], ['Nordpark SC', 'Germany', 'Fifth Division']];
  report.info.flagTry = [];
  for (const [nm, ctry, lg] of tenants) {
    const i = csV.createInstance(); ten.appendChild(i); fillW(i); i.name = 'Club strip · ' + nm;
    const tx = i.findAll(n => n.type === 'TEXT');
    await setText(tx[0], nm); await setText(tx[1], ctry); await setText(tx[2], lg);
    const fl = i.findOne(n => n.type === 'INSTANCE' && /Flag/.test(n.name));
    if (fl) { const k = Object.keys(fl.componentProperties || {}).find(x => /Country/i.test(x)); if (k) { try { fl.setProperties({ [k]: ctry }); report.info.flagTry.push('ok ' + ctry); } catch (e) { report.info.flagTry.push('fail ' + k + ': ' + (e.message || e).slice(0, 60)); } } else report.info.flagTry.push('no Country prop'); }
  }
  const ev = await mkCard('Upcoming events', 'Upcoming events');
  const evSet = pick(/^Event row$/); const evV = variantOf(evSet, /Device=Desktop, State=Default/);
  const rows = [['NOV', '14', 'Berlin Autumn Cup', 'Tournament', 'Mitte, Berlin', '14 – 22 Nov'], ['DEC', '6', 'Open trial day', 'Trial', 'Mitte, Berlin', '6 Dec']];
  for (const [mo, dy, nm, tg, lc, dt] of rows) {
    const i = evV.createInstance(); ev.appendChild(i); fillW(i); i.name = 'Event row · ' + nm;
    await setText(textByName(i, 'Month'), mo); await setText(textByName(i, 'Day'), dy); await setText(textByName(i, 'Event name'), nm);
    await setText(textByName(i, 'Location'), lc); await setText(textByName(i, 'Dates'), dt);
    const tag = i.findOne(n => n.type === 'INSTANCE' && /Type tag/.test(n.name)); await setText(tag.findOne(n => n.type === 'TEXT'), tg);
  }
  report.info.body = `${R(body.width)}x${R(body.height)}; left ${R(left.height)}, right ${R(right.height)}`;
});

await step('D section size', async () => {
  secN.resizeWithoutConstraints(fr.width + 160, fr.y + fr.height + 100);
  web.resizeWithoutConstraints(web.width, Math.max(web.height, secN.y + secN.height + 120));
  report.info.section = `${R(secN.width)}x${R(secN.height)} @${R(secN.x)},${R(secN.y)} web ${R(web.width)}x${R(web.height)}`;
});

await step('E links', async () => {
  const btn = mapFr.findOne(n => n.name === 'Button · View stadium');
  const keep = btn.reactions.filter(r => !(r.actions || []).some(isNavAct));
  await btn.setReactionsAsync(keep.concat([nav(fr)]));
  const hb = fr.findOne(n => n.name === 'Button · View on map');
  const keep2 = hb.reactions.filter(r => !(r.actions || []).some(isNavAct));
  await hb.setReactionsAsync(keep2.concat([nav(mapFr)]));
  report.info.links = 'map View stadium -> stadium card; hero View on map -> map';
});

await step('F check', async () => {
  const un = fr.findAll(n => n.type === 'TEXT' && !n.textStyleId).length;
  const gray = fr.findAll(n => 'fills' in n && Array.isArray(n.fills) && n.fills.some(f => f.type === 'SOLID' && f.visible !== false && Math.abs(f.color.r - 0.5) < 0.01 && Math.abs(f.color.g - 0.5) < 0.01 && Math.abs(f.color.b - 0.5) < 0.01)).length;
  report.info.unstyledText = un; report.info.grayFills = gray;
  const over = [];
  for (const n of fr.findAll(x => x.visible !== false && x.type !== 'VECTOR')) {
    const p = n.parent; if (!p || p === fr || p.type === 'INSTANCE' || n.layoutPositioning === 'ABSOLUTE') continue;
    if (p.type !== 'FRAME') continue; const a = n.absoluteBoundingBox, b = p.absoluteBoundingBox; if (!a || !b) continue;
    if (a.x + a.width > b.x + b.width + 0.5) over.push(`${p.name} :: ${n.name} +${R(a.x + a.width - b.x - b.width)}`);
  }
  report.info.rightOverflow = over.length ? over.slice(0, 12) : 'none';
  const sb = secN.absoluteBoundingBox, ov = [];
  for (const s of web.children) if (s !== secN && s.type === 'SECTION') { const c = s.absoluteBoundingBox; if (sb.x < c.x + c.width && c.x < sb.x + sb.width && sb.y < c.y + c.height && c.y < sb.y + sb.height) ov.push(s.name); }
  report.info.sectionOverlaps = ov.length ? ov : 'none';
  const hero = fr.findOne(n => n.name === 'Hero · stadium identity'), ph = hero.findOne(n => n.name === 'Facility photo'), idn = hero.findOne(n => n.name === 'Identity');
  report.info.heroCheck = `identity right ${R(idn.absoluteBoundingBox.x + idn.width - fr.absoluteBoundingBox.x)} photo left ${R(ph.absoluteBoundingBox.x - fr.absoluteBoundingBox.x)} photo bottom gap ${R(hero.height - (ph.y + ph.height))}`;
  report.info.frame = `${fr.name} ${R(fr.width)}x${R(fr.height)}`;
});

return report;
