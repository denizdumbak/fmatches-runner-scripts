// step 311 · salt okunur inspect: Web Home page, Mobile Profiles · player ve Mobile Own profile'daki stilsiz metinler (hangi ekran, hangi instance, font, boyut, metin)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = Math.round;
const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p02.loadAsync();
const screens = [];
for (const plat of p02.children.filter(n => n.type === 'SECTION')) for (const sec of plat.children.filter(n => n.type === 'SECTION'))
  for (const s of sec.children) if (s.type === 'FRAME' && !/^Flow ·/.test(s.name)) screens.push({ plat: plat.name, sec: sec.name, s });
const targets = [['Web', 'Home page'], ['Mobile', 'Profiles · player'], ['Mobile', 'Own profile']];
const isTarget = x => targets.some(t => x.plat.indexOf(t[0]) === 0 && x.sec.indexOf(t[1]) === 0);
const nearestInstance = n => { let x = n.parent; while (x && x.type !== 'PAGE') { if (x.type === 'INSTANCE') return x; x = x.parent; } return null; };
const groups = {};
let total = 0;
await step('unstyled text dump', async () => {
  for (const x of screens.filter(isTarget)) {
    const texts = x.s.findAll(n => n.type === 'TEXT');
    for (const t of texts) {
      if (typeof t.textStyleId === 'string' && t.textStyleId !== '') continue;
      total++;
      const inst = nearestInstance(t);
      let comp = '-';
      if (inst) { const mc = await inst.getMainComponentAsync(); comp = mc ? (mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent.name : mc.name) : inst.name; }
      const fam = typeof t.fontName === 'object' && t.fontName.family ? t.fontName.family + ' ' + t.fontName.style : 'mixed';
      const size = typeof t.fontSize === 'number' ? t.fontSize : 'mixed';
      const key = x.plat + ' > ' + x.sec + ' :: ' + comp + ' :: ' + t.name + ' :: ' + fam + ' ' + size;
      const g = groups[key] || (groups[key] = { n: 0, screens: [], sample: t.characters.slice(0, 28), w: R(t.width), visible: t.visible });
      g.n++;
      if (g.screens.indexOf(x.s.name) < 0 && g.screens.length < 3) g.screens.push(x.s.name);
    }
  }
});
report.info.total = total;
report.info.groups = Object.keys(groups).map(k => k + ' | x' + groups[k].n + ' | "' + groups[k].sample + '" | ' + groups[k].w + 'w' + (groups[k].visible ? '' : ' | hidden') + ' | ' + groups[k].screens.join('; '));
return report;
