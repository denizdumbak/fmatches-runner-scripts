// step 144 · Madde 8 cizimi: dort rol profili (Manager, Intermediary, Referee, Football fan) x masaustu + mobil, oyuncu profilinden kopya, satir C altinda yeni satir D. Foto yerine Silhouette Other (portreler sonra).

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }
async function setText(t, s) { if (!t) return false; await loadFonts(t); if (t.characters !== s) t.characters = s; return true; }
const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;
const setOf = name => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === name);
const kidNamed = (n, name) => n.children.find(c => c.name === name);
const textNamed = (n, name) => n.findOne(c => c.type === 'TEXT' && c.name === name);

const silSet = setOf('Silhouette');
const silVar = size => silSet.children.find(c => c.variantProperties.Role === 'Other' && c.variantProperties.Size === size);
const crestSet = setOf('Club crest');
const crestKey = crestSet ? Object.keys(crestSet.componentPropertyDefinitions).find(k => crestSet.componentPropertyDefinitions[k].type === 'VARIANT') : null;

// ---------- data ----------
const ROLES = [
  {
    key: 'Manager', frameName: 'Profiles / Manager',
    breadcrumb: 'Managers  /  Head coaches  /  Tom Reilly', first: 'Tom', surname: 'Reilly', size: 'L',
    line: 'Manager / Official', homeName: null,
    age: '47', born: '02.03.1979', nation: 'Ireland',
    role: { value: 'Head coach', sub: 'since Jul 2022' },
    contract: { value: '30 Jun 2027', sub: '8 months left' },
    strip: { kind: 'Club' },
    links: [['Profile', 'transfermarkt.com/tom-reilly'], ['Social', 'x.com/tomreilly_coach']],
    about: 'Head coach building a young, high-pressing side. Looking for pre-season friendlies and tournaments within 200 km.',
    careerSummary: '2 clubs · since 2016',
    career: [
      { name: 'Riverside FC', crest: 'Riverside FC', tags: ['Head coach', 'Senior', 'Current'], dates: 'Jul 2022 – present' },
      { name: 'Northgate Athletic', crest: 'Northgate Athletic', tags: ['Assistant coach', 'U21'], dates: 'Aug 2016 – Jun 2022' }
    ]
  },
  {
    key: 'Intermediary', frameName: 'Profiles / Intermediary',
    breadcrumb: 'Intermediaries  /  Sofia Lindqvist', first: 'Sofia', surname: 'Lindqvist', size: 'M',
    line: 'Intermediary', homeName: null,
    age: '37', born: '14.11.1988', nation: 'England',
    role: { value: 'Football agent', sub: 'since Mar 2019' },
    contract: null,
    strip: { kind: 'Organization', name: 'Northline Sports Management', country: 'England', tier: null },
    links: [['Website', 'northlinesports.com'], ['Social', 'linkedin.com/in/sofia-lindqvist']],
    about: 'Agent for lower-league and women’s players in England and Scandinavia. Happy to talk trials and loan moves.',
    careerSummary: '1 organization · since 2019',
    career: [
      { name: 'Northline Sports Management', crest: null, tags: ['Football agent', 'Current'], dates: 'Mar 2019 – present' }
    ]
  },
  {
    key: 'Referee', frameName: 'Profiles / Referee',
    breadcrumb: 'Referees  /  Ana Ferreira', first: 'Ana', surname: 'Ferreira', size: 'L',
    line: 'Referee', homeName: 'Name in home country: Ana Beatriz Ferreira',
    age: '33', born: '22.06.1993', nation: 'France',
    role: { value: 'Assistant referee', sub: 'since Aug 2020' },
    contract: null,
    strip: { kind: 'Organization', name: 'Northern Counties League', country: 'England', tier: 'Tier 4' },
    links: [['Social', 'instagram.com/ana.ferreira.ref']],
    about: 'Assistant referee in the Northern Counties League. Available for friendlies and youth tournaments at weekends.',
    careerSummary: '1 league · since 2020',
    career: [
      { name: 'Northern Counties League', crest: null, tags: ['Assistant referee', 'Tier 4', 'Current'], dates: 'Aug 2020 – present' }
    ]
  },
  {
    key: 'Football fan', frameName: 'Profiles / Football fan',
    breadcrumb: 'My contacts  /  Jake Morris', first: 'Jake', surname: 'Morris', size: 'L',
    line: 'Football fan', homeName: null,
    age: '30', born: '09.08.1996', nation: 'England',
    role: null, contract: null, strip: null,
    links: [['Social', 'instagram.com/jakemorris']],
    about: 'Riverside FC season-ticket holder. Plays Sunday league and helps organise local friendlies.',
    careerSummary: null, career: []
  }
];

// ---------- helpers ----------
async function setFact(inst, label, value, sub) {
  await setText(textNamed(inst, 'Label'), label);
  const row = inst.findOne(n => n.name === 'Value row');
  const val = row ? row.children.find(c => c.type === 'TEXT' && c.name === 'Value') : textNamed(inst, 'Value');
  await setText(val, value);
  const subKey = Object.keys(inst.componentProperties).find(k => /^Sub/.test(k));
  if (subKey) inst.setProperties({ [subKey]: !!sub });
  if (sub) await setText(textNamed(inst, 'Sub'), sub);
}
async function setNation(inst, country) {
  const row = inst.findOne(n => n.name === 'Value row');
  const flag = row.children.find(c => c.type === 'INSTANCE');
  if (flag) flag.setProperties({ Country: country });
  await setText(row.children.find(c => c.type === 'TEXT' && c.name === 'Value'), country);
  const n2 = row.findOne(n => n.name === 'Nation 2'); if (n2) n2.visible = false;
  const r2 = inst.findOne(n => n.name === 'Value row 2'); if (r2) r2.visible = false;
}
async function editKeyFacts(kf, d) {
  const f = name => kf.children.find(c => c.name === 'Fact · ' + name);
  await setFact(f('Age'), 'Age', d.age, d.born);
  await setNation(f('Nationality'), d.nation);
  const h = f('Height'), foot = f('Foot'), con = f('Contract until');
  if (d.role) { await setFact(h, 'Role', d.role.value, d.role.sub); h.name = 'Fact · Role'; } else h.remove();
  foot.remove();
  if (d.contract) await setFact(con, 'Contract until', d.contract.value, d.contract.sub); else con.remove();
}
async function editStrip(strip, d) {
  if (!d.strip) { strip.remove(); return; }
  strip.setProperties({ Kind: d.strip.kind });
  if (d.strip.kind === 'Club') return;
  await setText(textNamed(strip, 'Riverside FC'), d.strip.name);
  await setText(textNamed(strip, 'England'), d.strip.country);
  const tier = textNamed(strip, 'Third Division');
  if (d.strip.tier) { tier.visible = true; await setText(tier, d.strip.tier); }
  else {
    tier.visible = false;
    const sib = tier.parent.children, i = sib.indexOf(tier);
    if (i > 0 && /Divider/.test(sib[i - 1].name)) sib[i - 1].visible = false;
  }
}
async function editName(scope, d, device) {
  await setText(textNamed(scope, 'First name'), d.first);
  const sn = textNamed(scope, 'Surname');
  await setText(sn, d.surname);
  const st = TS['Display/Surname ' + d.size + ' · ' + device];
  if (st) await sn.setTextStyleIdAsync(st.id); else report.errors.push('style missing ' + d.size + ' ' + device);
}
async function editRoleLine(scope, d) {
  await setText(textNamed(scope, 'Player category'), d.line);
  const full = textNamed(scope, 'Full name');
  if (d.homeName) { full.visible = true; await setText(full, d.homeName); } else full.visible = false;
}
async function editLinks(card, d) {
  const list = card.findOne(n => n.name === 'Link list');
  const old = list.children.slice();
  const tpl = old[0];
  const typeText = textNamed(tpl, 'Type');
  const upper = typeText && typeText.characters === typeText.characters.toUpperCase();
  for (const [type, domain] of d.links) {
    const r = tpl.clone(); list.appendChild(r);
    r.setProperties({ Type: type });
    r.name = 'Link row · ' + type;
    await setText(textNamed(r, 'Domain'), domain);
    if (typeText) await setText(textNamed(r, 'Type'), upper ? type.toUpperCase() : type);
  }
  for (const o of old) o.remove();
}
async function editAbout(about, d) {
  await setText(textNamed(about, 'About text'), d.about);
  const more = about.findOne(n => n.name === 'Show more'); if (more) more.visible = false;
}
let entryInfo = null;
async function editCareer(card, d) {
  if (!d.career.length) { card.remove(); return; }
  const head = card.findOne(n => n.name === 'Section heading');
  const summary = head.findAll(n => n.type === 'TEXT').find(t => t.characters !== 'Career');
  await setText(summary, d.careerSummary);
  const list = card.findOne(n => n.name === 'Club entries');
  const entries = list.children.filter(n => n.type === 'INSTANCE');
  if (!entryInfo) entryInfo = entries[0].findAll(n => n.type === 'TEXT').map(t => t.name + '=' + t.characters.slice(0, 30) + (t.visible ? '' : ' (hidden)'));
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i], c = d.career[i];
    if (!c) { e.remove(); continue; }
    const props = {};
    for (const k of Object.keys(e.componentProperties)) {
      if (/^Achievements/.test(k)) props[k] = false;
      if (/^Tag 2/.test(k)) props[k] = c.tags.length >= 2;
      if (/^Tag 3/.test(k)) props[k] = c.tags.length >= 3;
    }
    e.setProperties(props);
    const name = e.findOne(n => n.type === 'TEXT' && /club name/i.test(n.name)) || e.findOne(n => n.type === 'TEXT');
    await setText(name, c.name);
    for (const dt of e.findAll(n => n.type === 'TEXT' && /^dates?$/i.test(n.name))) await setText(dt, c.dates);
    const tags = e.findAll(n => n.type === 'INSTANCE' && n.name !== 'Club crest' && !!n.findOne(t => t.type === 'TEXT') && /tag/i.test(n.name));
    for (let j = 0; j < tags.length && j < c.tags.length; j++) await setText(tags[j].findOne(t => t.type === 'TEXT'), c.tags[j]);
    const crest = e.findOne(n => n.type === 'INSTANCE' && n.name === 'Club crest');
    if (crest) {
      if (c.crest) { crest.visible = true; if (crestKey) crest.setProperties({ [crestKey]: c.crest }); }
      else crest.visible = false;
    }
  }
}

async function buildDesktop(src, d) {
  const f = src.clone();
  f.name = d.frameName + ' · Desktop';
  const hero = f.findOne(n => n.name === 'Hero · player identity');
  const id = kidNamed(hero, 'Identity');
  await setText(kidNamed(id, 'Breadcrumb'), d.breadcrumb);
  const nr = kidNamed(id, 'Name and role');
  await editName(nr, d, 'Desktop');
  await editRoleLine(nr, d);
  await editKeyFacts(kidNamed(id, 'Key facts'), d);
  await editStrip(kidNamed(id, 'Club strip'), d);
  const acts = kidNamed(id, 'Profile actions');
  const second = acts.children.find(c => /shortlist/i.test(c.name));
  second.setProperties({ 'Label#8:0': 'Add to contacts', 'Icon#63:0': false, Style: 'Secondary' });
  second.name = 'Button · Add to contacts';
  if (!d.strip || d.strip.kind !== 'Club') { const cr = kidNamed(hero, 'Club crest'); if (cr) cr.remove(); }
  const photo = kidNamed(hero, 'Player photo · cut-out'); if (photo) photo.remove();
  const sil = silVar('Hero desktop').createInstance();
  hero.appendChild(sil); sil.layoutPositioning = 'ABSOLUTE'; sil.name = 'Person silhouette';
  const body = f.findOne(n => n.name === 'Profile body');
  const left = body.findOne(n => n.name === 'Left column'), right = body.findOne(n => n.name === 'Right column');
  kidNamed(left, 'Positions').remove();
  await editLinks(kidNamed(left, 'Links'), d);
  await editAbout(kidNamed(right, 'About'), d);
  await editCareer(kidNamed(right, 'Career'), d);
  sil.x = 883; sil.y = hero.height - sil.height;
  return f;
}

async function buildMobile(src, d) {
  const f = src.clone();
  f.name = d.frameName + ' · Mobile';
  const hero = f.findOne(n => n.name === 'Hero · player identity');
  await editName(kidNamed(hero, 'Player name'), d, 'Mobile');
  const block = kidNamed(hero, 'Identity block');
  const np = kidNamed(block, 'Name and photo');
  await editRoleLine(np, d);
  await editKeyFacts(kidNamed(block, 'Key facts'), d);
  await editStrip(kidNamed(hero, 'Club strip'), d);
  if (!d.strip || d.strip.kind !== 'Club') { const cr = kidNamed(hero, 'Club crest'); if (cr) cr.remove(); }
  const ph = kidNamed(np, 'Player photo · cut-out');
  for (const k of ph.children.slice()) k.remove();
  ph.name = 'Person photo · silhouette';
  const sil = silVar('Hero mobile').createInstance();
  ph.appendChild(sil); sil.name = 'Person silhouette';
  if (ph.layoutMode !== 'NONE') sil.layoutPositioning = 'ABSOLUTE';
  sil.x = Math.round((ph.width - sil.width) / 2); sil.y = ph.height - sil.height;
  const body = f.findOne(n => n.name === 'Profile body');
  kidNamed(body, 'Positions').remove();
  await editLinks(kidNamed(body, 'Links'), d);
  await editAbout(kidNamed(body, 'About'), d);
  await editCareer(kidNamed(body, 'Career'), d);
  const bar = f.children.find(c => c.type === 'INSTANCE' && /Sticky action bar/.test(c.name));
  bar.setProperties({ Role: 'Other' });
  bar.y = f.height - bar.height;
  return f;
}

// ---------- build ----------
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const srcD = web.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player · Desktop');
const srcM = mob.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player · Mobile');

await step('remove previous run', async () => {
  let n = 0;
  for (const d of ROLES) for (const sec of [web, mob]) for (const k of sec.children.filter(c => c.type === 'FRAME' && (c.name === d.frameName + ' · Desktop' || c.name === d.frameName + ' · Mobile'))) { k.remove(); n++; }
  report.info.removed = n;
});

const bottomOf = sec => Math.max(...sec.children.map(k => k.y + k.height));
const rowWebY = bottomOf(web) + 400, rowMobY = bottomOf(mob) + 400;
const built = { web: [], mob: [] };

for (let i = 0; i < ROLES.length; i++) {
  const d = ROLES[i];
  await step('desktop ' + d.key, async () => {
    const f = await buildDesktop(srcD, d);
    web.appendChild(f); f.x = 600 + i * 1920; f.y = rowWebY;
    built.web.push(f.name + ' @' + Math.round(f.x) + ',' + Math.round(f.y) + ' h' + Math.round(f.height));
  });
  await step('mobile ' + d.key, async () => {
    const f = await buildMobile(srcM, d);
    mob.appendChild(f); f.x = 560 + i * 750; f.y = rowMobY;
    built.mob.push(f.name + ' @' + Math.round(f.x) + ',' + Math.round(f.y) + ' h' + Math.round(f.height));
  });
}
report.info.built = built;
report.info.clubEntryTexts = entryInfo;

// ---------- sections: grow Web, move Mobile (and anything right of Web) along ----------
await step('sections', async () => {
  const oldW = web.width, oldRight = web.x + oldW;
  const right = Math.max(...web.children.map(k => k.x + k.width));
  const newW = Math.max(oldW, right + 80);
  const newH = Math.max(web.height, bottomOf(web) + 80);
  web.resizeWithoutConstraints(newW, newH);
  const dx = newW - oldW;
  if (dx > 0) for (const n of p02.children) if (n !== web && n.x >= oldRight) n.x += dx;
  const mRight = Math.max(...mob.children.map(k => k.x + k.width));
  mob.resizeWithoutConstraints(Math.max(mob.width, mRight + 400), Math.max(mob.height, bottomOf(mob) + 80));
  report.info.sections = 'Web ' + Math.round(web.width) + 'x' + Math.round(web.height) + ' · Mobile @' + Math.round(mob.x) + ' ' + Math.round(mob.width) + 'x' + Math.round(mob.height) + ' (moved ' + Math.round(dx) + ')';
});

return report;
