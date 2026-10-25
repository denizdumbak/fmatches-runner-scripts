// step 198 · Faz 3 iskelet: 01'de "7 · Map" ve "8 · Messenger" Section'lari, color/map/* degiskenleri, 02'de Web ve Mobile icinde Map ve Messenger alt Section'lari

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
const r = n => Math.round(n);
const hexToRgb = h => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });

// 1. Harita tur renkleri (Color koleksiyonu, mode Light)
await step('color/map variables', async () => {
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const col = cols.find(c => c.name === 'Color');
  if (!col) throw new Error('collection Color missing');
  const mode = col.modes.find(m => m.name === 'Light') || col.modes[0];
  const all = await figma.variables.getLocalVariablesAsync();
  const defs = { 'color/map/club': '#0b7f3e', 'color/map/facility': '#3a423d', 'color/map/event': '#b7791f', 'color/map/request': '#6d4ac4' };
  report.info.mapVars = [];
  for (const name of Object.keys(defs)) {
    let v = all.find(x => x.name === name && x.variableCollectionId === col.id);
    if (!v) v = figma.variables.createVariable(name, col, 'COLOR');
    v.setValueForMode(mode.id, hexToRgb(defs[name]));
    report.info.mapVars.push(name + ' ' + defs[name]);
  }
});

// 2. Sekme 01: yeni Section'lar, Archive sagda
const relayoutNew = () => {
  const secs = p01.children.filter(n => n.type === 'SECTION');
  const six = secs.find(s => /^6 /.test(s.name));
  const archive = secs.find(s => /^Archive/.test(s.name));
  if (!six || !archive) throw new Error('section 6 or Archive missing');
  return { six, archive };
};
await step('01 Map and Messenger sections', async () => {
  for (const nm of ['7 · Map', '8 · Messenger']) { const old = p01.children.find(n => n.type === 'SECTION' && n.name === nm); if (old) old.remove(); }
  const { six, archive } = relayoutNew();
  let x = six.x + six.width + 160;
  for (const nm of ['7 · Map', '8 · Messenger']) {
    const s = figma.createSection(); s.name = nm; s.x = x; s.y = six.y; s.resizeWithoutConstraints(1200, 800);
    p01.appendChild(s); x += 1200 + 160;
  }
  archive.x = x;
  report.info.sections01 = p01.children.filter(n => n.type === 'SECTION').sort((a, b) => a.x - b.x).map(s => s.name + ' @' + r(s.x) + ' ' + r(s.width));
});

// 3. Sekme 02: Web ve Mobile icinde alt Section'lar (Own profile'in altina)
await step('02 Map and Messenger sub-sections', async () => {
  const dims = { Web: [2400, 1600], Mobile: [1800, 1400] };
  for (const plat of ['Web', 'Mobile']) {
    const P = p02.children.find(n => n.type === 'SECTION' && n.name === plat);
    if (!P) throw new Error('platform section missing: ' + plat);
    for (const nm of ['Map', 'Messenger']) { const old = P.children.find(n => n.type === 'SECTION' && n.name === nm); if (old) old.remove(); }
    const own = P.children.find(n => n.type === 'SECTION' && n.name === 'Own profile');
    if (!own) throw new Error('Own profile missing in ' + plat);
    let y = own.y + own.height + 160;
    for (const nm of ['Map', 'Messenger']) {
      const s = figma.createSection(); s.name = nm; P.appendChild(s);
      s.x = own.x; s.y = y; s.resizeWithoutConstraints(dims[plat][0], dims[plat][1]);
      y += dims[plat][1] + 160;
    }
    const need = y - 160 + 80;
    if (need > P.height) P.resizeWithoutConstraints(P.width, need);
    report.info['sub_' + plat] = P.children.filter(n => n.type === 'SECTION').map(s => s.name + ' ' + r(s.x) + ',' + r(s.y) + ' ' + r(s.width) + 'x' + r(s.height));
    report.info['platform_' + plat] = r(P.width) + 'x' + r(P.height);
  }
});

// 4. Kontrol: 02'de ust seviye Section cakismasi
await step('check overlap 02', async () => {
  const top = p02.children.filter(n => n.type === 'SECTION');
  const bad = [];
  for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) {
    const a = top[i], b = top[j];
    if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) bad.push(a.name + ' x ' + b.name);
  }
  report.info.overlap02 = bad.length ? bad : 'none';
});
return report;
