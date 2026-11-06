// step 315 · 314'ün hatalı adımlarını (A, C, E, F) yeniden çalıştırır, SALT OKUNUR; karışık stil kimliği düzeltildi. Orijinal: stadyum kartı ikinci inspect: profil hero ve gövde ayrıntıları, kart boyaları, Event location card, Event row / Section header / Empty card / Tag ağaçları, Map card Stadium, Home Upcoming events
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = Math.round;
const p01 = figma.root.children.find(p => /^01/.test(p.name));
const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
const varName = {};
for (const v of await figma.variables.getLocalVariablesAsync()) varName[v.id] = v.name;
const styleName = {};
for (const s of await figma.getLocalTextStylesAsync()) styleName[s.id] = s.name;
for (const s of await figma.getLocalEffectStylesAsync()) styleName[s.id] = s.name;
const paint = n => {
  if (!('fills' in n) || n.fills === figma.mixed || !n.fills.length) return '';
  const f = n.fills[0]; if (f.visible === false) return '';
  if (f.type === 'IMAGE') return 'IMG';
  const bv = f.boundVariables && f.boundVariables.color;
  return bv ? 'fill:' + (varName[bv.id] || bv.id).replace('color/', '') : 'fill:raw';
};
const stroke = n => {
  if (!('strokes' in n) || !n.strokes.length) return '';
  const bv = n.strokes[0].boundVariables && n.strokes[0].boundVariables.color;
  return 'str:' + (bv ? (varName[bv.id] || '').replace('color/', '') : 'raw') + n.strokeWeight;
};
const dump = (root, maxD, maxN) => {
  const out = [];
  (function w(x, d) {
    if (out.length >= maxN) return;
    const lay = 'layoutMode' in x && x.layoutMode !== 'NONE' ? `${x.layoutMode[0]} g${x.itemSpacing} p${x.paddingTop}/${x.paddingRight}/${x.paddingBottom}/${x.paddingLeft}` : '';
    const rad = 'cornerRadius' in x && x.cornerRadius && x.cornerRadius !== figma.mixed ? 'r' + x.cornerRadius : '';
    const eff = 'effectStyleId' in x && typeof x.effectStyleId === 'string' && x.effectStyleId ? 'fx:' + (styleName[x.effectStyleId] || '?') : '';
    let t = '';
    if (x.type === 'TEXT') t = ` "${x.characters.slice(0, 40)}" ${typeof x.textStyleId === 'string' && x.textStyleId ? (styleName[x.textStyleId] || '?') : (typeof x.textStyleId === 'string' ? 'NOSTYLE' : 'MIXED')}`;
    const vis = x.visible === false ? ' [hidden]' : '';
    const abs = 'layoutPositioning' in x && x.layoutPositioning === 'ABSOLUTE' ? ' ABS@' + R(x.x) + ',' + R(x.y) : '';
    out.push(`${'  '.repeat(d)}${x.type === 'INSTANCE' ? '◇' : ''}${x.name} ${R(x.width)}x${R(x.height)} ${lay} ${rad} ${paint(x)} ${stroke(x)} ${eff}${abs}${vis}${t}`.replace(/ +/g, ' ').trimEnd());
    if ('children' in x && d < maxD && (x.type !== 'INSTANCE' || d === 0 || /Event location|Event row|Section header|Empty card|Tag|Club strip|Key fact/.test(x.name))) for (const k of x.children) w(k, d + 1);
  })(root, 0);
  return out;
};
const findSec = (plat, re) => { const P = p02.children.find(n => n.type === 'SECTION' && n.name === plat); return P && P.children.find(n => n.type === 'SECTION' && re.test(n.name)); };
const findFrame = (sec, re) => sec && sec.children.find(n => n.type === 'FRAME' && re.test(n.name));
const pick = re => { const r = []; (function w(n) { if ((n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name)) r.push(n); if ('children' in n) for (const k of n.children) w(k); })(p01); return r; };
const firstVariant = h => (h.type === 'COMPONENT_SET' ? h.children[0] : h);

await step('A other-roles screens + manager directory hero', async () => {
  const sec = findSec('Web', /^Profiles · other roles/);
  report.info.otherRolesScreens = sec ? sec.children.filter(c => c.type === 'FRAME' && !/^Flow/.test(c.name)).map(c => `${c.name} ${R(c.width)}x${R(c.height)}`) : 'yok';
  const fr = findFrame(sec, /Manager/);
  if (fr) {
    const hero = fr.findOne(n => /^Hero/.test(n.name));
    report.info.managerHero = hero ? dump(hero, 3, 70) : 'yok';
  }
});

if (false) await step('B player desktop body cards', async () => {
  const fr = findFrame(findSec('Web', /^Profiles · player/), /^Profiles \/ Player · Desktop$/);
  const body = fr.findOne(n => n.name === 'Profile body');
  report.info.bodyTree = dump(body, 4, 70);
});

await step('C components trees', async () => {
  const names = [['Event location card', /^Event location card$/, 3], ['Event row', /^Event row$/, 3], ['Section header', /^Section header$/, 2], ['Empty card', /^Empty card$/, 3], ['Tag', /^Tag$/, 2], ['Gallery photo', /^Gallery photo$/, 1]];
  for (const [key, re, d] of names) {
    const h = pick(re);
    report.info['c_' + key] = h.length ? { variants: h[0].type === 'COMPONENT_SET' ? h[0].children.map(c => c.name).slice(0, 8) : 'single', tree: dump(firstVariant(h[0]), d, 30) } : 'yok';
  }
});

if (false) await step('D Map card Stadium + its screen', async () => {
  const mc = pick(/^Map card$/)[0];
  const st = mc.children.find(c => /Stadium/.test(c.name));
  report.info.mapCardStadium = dump(st, 3, 30);
  const sec = findSec('Web', /^Map/);
  const fr = findFrame(sec, /Stadium card · Desktop/);
  const card = fr && fr.findOne(n => /^Map card/.test(n.name));
  report.info.mapStadiumScreenCard = card ? dump(card, 3, 25) : 'yok';
});

await step('E Home upcoming events section', async () => {
  const fr = findFrame(findSec('Web', /^Home page$/), /Main · Desktop$/);
  const ev = fr && fr.findOne(n => /Upcoming events/.test(n.name) && n.type === 'FRAME');
  report.info.homeUpcoming = ev ? dump(ev, 3, 30) : 'yok';
});

await step('F player mobile hero + body text', async () => {
  const fr = findFrame(findSec('Mobile', /^Profiles · player/), /^Profiles \/ Player · Mobile$/);
  const hero = fr.findOne(n => /^Hero/.test(n.name));
  report.info.mobileHero = dump(hero, 3, 45);
  const g = fr.findOne(n => n.name === 'Gallery');
  report.info.mobileGallery = g ? dump(g, 3, 20) : 'yok';
});

return report;
