// step 225 · READ-ONLY inspect before mobile map: empty state component, Mobile section, mobile header, Map card, Filter chip

const out = {};
const p01 = figma.root.children.find(p => /^01/.test(p.name)); const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
const r = n => Math.round(n);
const line = n => n.type + ' "' + n.name + '" ' + r(n.width) + 'x' + r(n.height) + (n.layoutMode && n.layoutMode !== 'NONE' ? ' ' + n.layoutMode : '');
// 1. empty state component and its instances
const comps = p01.findAll(n => n.type === 'COMPONENT' && /empty/i.test(n.name)).map(n => n.name + ' in ' + (n.parent ? n.parent.name : '?'));
out.emptyComponents = comps.length ? comps : 'NONE on page 01';
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web'); const mapSec = web.children.find(n => n.type === 'SECTION' && n.name === 'Map');
const inst = [];
for (const pg of mapSec.children.filter(n => /^Map \//.test(n.name))) { const i = pg.findAll(n => n.type === 'INSTANCE' && /empty/i.test(n.name)).length; const f = pg.findAll(n => n.type === 'FRAME' && /empty/i.test(n.name)).length; if (i || f) inst.push(pg.name.slice(0, 30) + ': instances ' + i + ', frames ' + f); }
out.emptyOnPages = inst;
// 2. mobile platform
const mob = p02.children.find(n => n.type === 'SECTION' && /^Mobile/.test(n.name));
out.mobile = mob ? line(mob) + ' at ' + r(mob.x) + ',' + r(mob.y) : 'no Mobile section';
if (mob) {
  out.mobileChildren = mob.children.map(n => n.type + ' "' + n.name + '" ' + r(n.width) + 'x' + r(n.height) + ' @' + r(n.x) + ',' + r(n.y));
  const mm = mob.children.find(n => n.type === 'SECTION' && n.name === 'Map');
  if (mm) out.mobileMap = line(mm) + ' @' + r(mm.x) + ',' + r(mm.y) + ' kids ' + mm.children.length;
  // a signed-in mobile screen to copy header from
  const frames = mob.findAll(n => n.type === 'FRAME' && n.width === 390 && n.height > 600 && /Player|Home|Profile/i.test(n.name));
  const f = frames[0];
  if (f) { out.sampleScreen = line(f); out.sampleTop = f.children.slice(0, 5).map(c => line(c) + ' y' + r(c.y) + (c.type === 'INSTANCE' ? ' [instance]' : '')); }
}
// 3. Map card, Filter chip, Bottom sheet set details
const sets = {};
for (const nm of ['Map card', 'Filter chip', 'Bottom sheet', 'Map marker', 'Map controls']) { const s = p01.findOne(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && n.name === nm); sets[nm] = s ? s.type + ' ' + r(s.width) + 'x' + r(s.height) + (s.children && s.type === 'COMPONENT_SET' ? ' variants ' + s.children.length : '') : 'missing'; }
out.sets = sets;
const card = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Map card');
if (card) out.cardVariants = card.children.map(v => v.name + ' ' + r(v.width) + 'x' + r(v.height));
// 4. mobile-relevant components names in 01 (header, nav, status)
out.mobileComps = p01.findAll(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && /mobile|nav|header|ticker|tab bar|status/i.test(n.name)).map(n => n.name + ' ' + r(n.width) + 'x' + r(n.height)).slice(0, 20);
return out;
