// step 322 · stadyum kartı MOBİL (390): Player · Mobile sayfasından türetilen `Facilities / Stadium card · Mobile`, Mobile'a yeni Section "Stadium card"; hero (tek parça ad, saha fotoğrafı, key fact'ler, View on map), Location, Tenants, Upcoming events, Gallery · haritadaki mobil "View stadium" ve hero "View on map" bağlantıları
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = Math.round;
const p01 = figma.root.children.find(p => /^01/.test(p.name));
const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
const allVars = await figma.variables.getLocalVariablesAsync();
const tryV = (...ns) => { for (const n of ns) { const v = allVars.find(x => x.name === n); if (v) return v; } return null; };
const styles = await figma.getLocalTextStylesAsync();
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
const fillW = n => { n.layoutSizingHorizontal = 'FILL'; };
const missing = [];
const trySet = async (root, nm, str) => { const t = textByName(root, nm); if (t) await setText(t, str); else missing.push(nm); };

const plMob = frameIn(sub(mob, /^Profiles · player/), /^Profiles \/ Player · Mobile$/);
const mapMob = frameIn(sub(mob, /^Map$/), /^Map \/ Stadium card · Mobile$/);
const deskFr = frameIn(sub(web, /^Stadium card$/), /^Facilities \/ Stadium card · Desktop$/);
report.info.sources = { playerMobile: !!plMob, mapMobile: !!mapMob, desktopStadium: !!deskFr };
let secN, fr;

await step('A section + clone', async () => {
  const old = mob.children.find(n => n.type === 'SECTION' && n.name === 'Stadium card');
  if (old) old.remove();
  secN = figma.createSection(); secN.name = 'Stadium card'; mob.appendChild(secN);
  const others = mob.children.filter(s => s !== secN && s.type === 'SECTION');
  let bottom = 0, minX = Infinity;
  for (const s of others) { bottom = Math.max(bottom, s.y + s.height); minX = Math.min(minX, s.x); }
  report.info.mobileSections = others.map(s => `${s.name}@${R(s.x)},${R(s.y)} ${R(s.width)}x${R(s.height)}`).slice(0, 6);
  secN.x = isFinite(minX) ? minX : 120; secN.y = bottom + 160;
  secN.resizeWithoutConstraints(560, 1000);
  fr = plMob.clone(); secN.appendChild(fr); fr.name = 'Facilities / Stadium card · Mobile'; fr.x = 80; fr.y = 100;
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
  const hero = fr.findOne(n => /^Hero/.test(n.name) && n.type === 'FRAME'); hero.name = 'Hero · stadium identity';
  for (const k of hero.children.slice()) if (k.layoutPositioning === 'ABSOLUTE') k.remove();
  const pn = hero.children.find(n => n.name === 'Player name');
  const frow = pn.children.find(n => /First name row/.test(n.name)); if (frow) frow.visible = false;
  const sur = pn.findAll(n => n.type === 'TEXT').find(t => /Surname/i.test(t.name)) || pn.findAll(n => n.type === 'TEXT').pop();
  const ms = styles.filter(s => /^Display\/Surname/.test(s.name) && /Mobile/.test(s.name));
  report.info.mobileStyles = ms.map(s => `${s.name} ${s.fontSize}`);
  const st = ms.slice().sort((a, b) => Math.abs(a.fontSize - 56) - Math.abs(b.fontSize - 56))[0];
  await sur.setTextStyleIdAsync(st.id); await setText(sur, 'Spreeufer Stadium');
  pn.layoutSizingHorizontal = 'FILL'; sur.layoutSizingHorizontal = 'FILL'; sur.textAutoResize = 'HEIGHT';
  report.info.name = `${st.name} ${st.fontSize}; ${R(sur.width)}x${R(sur.height)}`;
  const ib = hero.children.find(n => n.name === 'Identity block');
  const nph = ib.children.find(n => n.name === 'Name and photo');
  for (const k of nph.children.slice()) if (/photo|silhouette/i.test(k.name)) k.remove();
  const nr = nph.children.find(n => n.name === 'Name and role') || nph.children[0];
  nr.layoutSizingHorizontal = 'FILL';
  const rts = nr.findAll(n => n.type === 'TEXT');
  report.info.roleTexts = rts.map(t => t.characters);
  await setText(rts[0], 'Home of Spreeufer FC and Nordpark SC'); rts.slice(1).forEach(t => { t.visible = false; });
  for (const b of nr.findAll(n => n.type === 'INSTANCE' && /Verification/.test(n.name))) b.visible = false;
  const kf = ib.children.find(n => n.name === 'Key facts');
  const setFact = async (inst, label, value, subText) => {
    await setText(textByName(inst, 'Label'), label); await setText(textByName(inst, 'Value'), value);
    const s = textByName(inst, 'Sub');
    if (s) { if (subText) { await setText(s, subText); s.visible = true; } else s.visible = false; }
    for (const x of inst.findAll(n => /^(Flag|Nation 2|Nation 3|Value row 2)$/.test(n.name))) x.visible = false;
  };
  const f = re => kf.children.find(n => re.test(n.name));
  const fAge = f(/Age/), fFoot = f(/Foot/), fC = f(/Contract/), fNat = f(/Nationality/), fH = f(/Height/);
  await setFact(fAge, 'Capacity', '4,200', null); fAge.name = 'Fact · Capacity';
  await setFact(fFoot, 'Surface', 'Natural grass', null); fFoot.name = 'Fact · Surface';
  await setFact(fC, 'City', 'Berlin', 'Germany'); fC.name = 'Fact · City';
  if (fNat) fNat.remove(); if (fH) fH.remove();
  report.info.keyFacts = kf.children.map(k => `${k.name} ${R(k.width)}x${R(k.height)}`);
  // photo
  const photo = figma.createRectangle(); ib.insertChild(1, photo); photo.name = 'Facility photo'; photo.resize(358, 200); photo.layoutAlign = 'STRETCH';
  const rv = tryV('radius/lg', 'Dimension/radius/lg');
  if (rv) for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) photo.setBoundVariable(k, rv); else photo.cornerRadius = 20;
  const img = await figma.createImageAsync('https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/img/facility/stadium-aerial-v1.jpg');
  photo.fills = [{ type: 'IMAGE', imageHash: img.hash, scaleMode: 'FILL' }];
  ib.itemSpacing = 16;
  const cs = hero.children.find(n => n.name === 'Club strip'); if (cs) cs.remove();
  const bs = pick(/^Button$/); const bv = variantOf(bs, /Style=Primary, State=Default/);
  const btn = bv.createInstance(); hero.appendChild(btn); btn.name = 'Button · View on map'; btn.layoutSizingHorizontal = 'FILL';
  await setText(btn.findOne(n => n.type === 'TEXT'), 'View on map');
  const ik = Object.keys(btn.componentProperties || {}).find(k => /^Icon/.test(k));
  if (ik && btn.componentProperties[ik].type === 'BOOLEAN') btn.setProperties({ [ik]: false });
  const sticky = fr.children.find(n => /Sticky action bar/.test(n.name)); if (sticky) sticky.remove();
  report.info.hero = `${R(hero.width)}x${R(hero.height)}`;
});

await step('C body', async () => {
  const body = fr.findOne(n => n.name === 'Profile body');
  const gal = body.children.find(n => n.name === 'Gallery');
  const career = body.children.find(n => n.name === 'Career');
  const cardSrc = career.clone();
  for (const c of body.children.slice()) if (c !== gal) c.remove();
  const loc = pick(/^Event location card$/).createInstance(); body.insertChild(0, loc); loc.name = 'Location · Spreeufer Stadium'; loc.resize(358, 232);
  await setText(textByName(loc, 'Place'), 'Mitte, Berlin, Germany');
  const mm = pick(/^Map marker$/); const mInst = loc.findOne(n => n.type === 'INSTANCE' && /Marker/i.test(n.name));
  const fv = mm.children.find(c => /Kind=Stadium, State=Default/.test(c.name)); if (mInst && fv) mInst.swapComponent(fv);
  const mkCard = async (name, title, idx) => {
    const c = cardSrc.clone(); body.insertChild(idx, c); fillW(c); c.name = name;
    const h = c.findAll(n => n.type === 'TEXT').find(t => t.characters === 'Career'); await setText(h, title);
    const ce = c.findOne(n => n.name === 'Club entries'); if (ce) ce.remove();
    return c;
  };
  const ten = await mkCard('Tenants', 'Tenants', 1);
  const csV = variantOf(pick(/^Club strip$/), /Kind=Club, Device=Mobile/);
  report.info.tenantTexts = [];
  for (const [nm, ctry, lg] of [['Spreeufer FC', 'Germany', 'Fourth Division'], ['Nordpark SC', 'Germany', 'Fifth Division']]) {
    const i = csV.createInstance(); ten.appendChild(i); fillW(i); i.name = 'Club strip · ' + nm;
    const tx = i.findAll(n => n.type === 'TEXT'); report.info.tenantTexts.push(tx.map(t => t.characters).join('|'));
    await setText(tx[0], nm); if (tx[1]) await setText(tx[1], ctry); if (tx[2]) await setText(tx[2], lg);
    const fl = i.findOne(n => n.type === 'INSTANCE' && /Flag/.test(n.name)); if (fl) { try { fl.setProperties({ Country: 'Germany' }); } catch (e) { missing.push('flag:' + (e.message || e).slice(0, 40)); } }
  }
  const ev = await mkCard('Upcoming events', 'Upcoming events', 2);
  const evV = variantOf(pick(/^Event row$/), /Device=Mobile, State=Default/);
  for (const [mo, dy, nm, tg, lc, dt] of [['NOV', '14', 'Berlin Autumn Cup', 'Tournament', 'Mitte, Berlin', '14 – 22 Nov'], ['DEC', '6', 'Open trial day', 'Trial', 'Mitte, Berlin', '6 Dec']]) {
    const i = evV.createInstance(); ev.appendChild(i); fillW(i); i.name = 'Event row · ' + nm;
    report.info.eventRowTexts = i.findAll(n => n.type === 'TEXT').map(t => t.name + '=' + t.characters).slice(0, 10);
    await trySet(i, 'Month', mo); await trySet(i, 'Day', dy); await trySet(i, 'Event name', nm); await trySet(i, 'Location', lc); await trySet(i, 'Dates', dt);
    const tag = i.findOne(n => n.type === 'INSTANCE' && /Type tag/.test(n.name)); if (tag) await setText(tag.findOne(n => n.type === 'TEXT'), tg); else missing.push('Type tag');
  }
  cardSrc.remove();
  report.info.body = `${R(body.width)}x${R(body.height)}: ` + body.children.map(c => `${c.name} ${R(c.height)}`).join(', ');
});

await step('D section + links', async () => {
  secN.resizeWithoutConstraints(fr.width + 160, fr.y + fr.height + 100);
  mob.resizeWithoutConstraints(mob.width, Math.max(mob.height, secN.y + secN.height + 120));
  report.info.section = `${R(secN.width)}x${R(secN.height)} @${R(secN.x)},${R(secN.y)}; mobile ${R(mob.width)}x${R(mob.height)}`;
  const mb = mapMob.findOne(n => /^Button · View stadium$/.test(n.name));
  if (mb) { await mb.setReactionsAsync(mb.reactions.filter(r => !(r.actions || []).some(isNavAct)).concat([nav(fr)])); report.info.mapLink = 'ok'; } else report.info.mapLink = 'View stadium düğmesi mobil haritada bulunamadı';
  const hb = fr.findOne(n => n.name === 'Button · View on map');
  await hb.setReactionsAsync(hb.reactions.filter(r => !(r.actions || []).some(isNavAct)).concat([nav(mapMob)]));
});

await step('E check', async () => {
  report.info.missing = missing.length ? missing : 'none';
  report.info.unstyledText = fr.findAll(n => n.type === 'TEXT' && !n.textStyleId).length;
  report.info.grayFills = fr.findAll(n => 'fills' in n && Array.isArray(n.fills) && n.fills.some(f => f.type === 'SOLID' && f.visible !== false && Math.abs(f.color.r - 0.5) < 0.01 && Math.abs(f.color.g - 0.5) < 0.01 && Math.abs(f.color.b - 0.5) < 0.01)).length;
  const over = [];
  for (const n of fr.findAll(x => x.visible !== false && x.type !== 'VECTOR')) {
    const p = n.parent; if (!p || p === fr || p.type === 'INSTANCE' || n.layoutPositioning === 'ABSOLUTE' || p.type !== 'FRAME') continue;
    const a = n.absoluteBoundingBox, b = p.absoluteBoundingBox; if (!a || !b) continue;
    if (a.x + a.width > b.x + b.width + 0.5) over.push(`${p.name} :: ${n.name} +${R(a.x + a.width - b.x - b.width)}`);
  }
  report.info.rightOverflow = over.length ? over.slice(0, 12) : 'none';
  const sb = secN.absoluteBoundingBox, ov = [];
  for (const s of mob.children) if (s !== secN && s.type === 'SECTION') { const c = s.absoluteBoundingBox; if (sb.x < c.x + c.width && c.x < sb.x + sb.width && sb.y < c.y + c.height && c.y < sb.y + sb.height) ov.push(s.name); }
  report.info.sectionOverlaps = ov.length ? ov : 'none';
  report.info.frame = `${fr.name} ${R(fr.width)}x${R(fr.height)}`;
});

return report;
