// step 363 · SENIOR TUR (salt okunur): stadyum kartı + arama sonuçları + kulüp kartı + Shortlists, §6 ölçülebilir kontroller, mobil Players satırı 192/176, mobil Teams kartı
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const R = n => Math.round(n);
const BB = n => n.absoluteBoundingBox;
const EX = /^(Flag|Club crest|Silhouette|Icon|Social|Logo|Map area|Pitch|Hero visual|Photo|Gallery photo|Player photo|Stage|Scrim)/;
const underEx = (n, stop) => { let x = n; while (x && x !== stop) { if (EX.test(x.name)) return true; x = x.parent; } return false; };
const hex = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
const vcache = {}; async function vname(id) { if (vcache[id] !== undefined) return vcache[id]; const v = await figma.variables.getVariableByIdAsync(id); vcache[id] = v ? v.name : '?'; return vcache[id]; }
const RAD_OK = [0, 4, 8, 12, 20];
function add(map, key, frame) { if (!map[key]) map[key] = { n: 0, ex: frame }; map[key].n++; }
function top(map, k) { return Object.keys(map).map(x => map[x].n + 'x ' + x + '  (' + map[x].ex + ')').sort((a, b) => parseInt(b) - parseInt(a)).slice(0, k || 8); }
function dump(n, depth, max, out, ind) {
  if (!n || depth > max) return;
  out.push(ind + n.type + ' · ' + n.name + ' [' + R(n.width) + 'x' + R(n.height) + ']' + ('layoutMode' in n && n.layoutMode !== 'NONE' ? ' ' + n.layoutMode + ' g' + n.itemSpacing : '') + (n.type === 'TEXT' ? ' "' + String(n.characters).slice(0, 26) + '" ' + n.fontSize : '') + (n.visible === false ? ' (gizli)' : ''));
  if ('children' in n) for (const c of n.children.slice(0, 10)) dump(c, depth + 1, max, out, ind + '  ');
}
const SECS = ['Stadium card', 'Search results', 'Club card', 'Shortlists'];
const audits = {};
for (const plat of ['Web', 'Mobile']) for (const sn of SECS) {
  await step('audit ' + plat + ' · ' + sn, async () => {
    const P = p02.children.find(n => n.type === 'SECTION' && n.name === plat);
    const sec = P.children.find(n => n.type === 'SECTION' && n.name === sn);
    if (!sec) { report.errors.push(plat + ' · ' + sn + ': Section yok'); return; }
    const frames = sec.children.filter(c => c.type === 'FRAME');
    const A = { frames: frames.map(f => f.name.replace(/^.*\/ /, '') + ' ' + R(f.width) + 'x' + R(f.height)), unbound: {}, unstyled: {}, small: {}, tap: {}, dash: {}, tert: {}, radius: {}, over: {}, nodes: 0, links: 0 };
    for (const f of frames) {
      const fn = f.name.replace(/^.*\/ /, '');
      const all = f.findAll(() => true); A.nodes += all.length;
      for (const n of all) {
        if (n.visible === false) continue;
        let hid = false; { let x = n.parent; while (x && x !== f) { if (x.visible === false) { hid = true; break; } x = x.parent; } } if (hid) continue;
        const pn = n.parent ? n.parent.name : '';
        if ('fills' in n && Array.isArray(n.fills) && n.type !== 'TEXT' && !underEx(n, f)) {
          for (const fl of n.fills) if (fl.type === 'SOLID' && fl.visible !== false && !(fl.boundVariables && fl.boundVariables.color) && !n.fillStyleId) add(A.unbound, pn + ' :: ' + n.name + ' ' + hex(fl.color), fn);
        }
        if (n.type === 'TEXT') {
          if (typeof n.textStyleId !== 'string' || n.textStyleId === '') add(A.unstyled, pn + ' :: ' + n.name, fn);
          if (typeof n.fontSize === 'number' && n.fontSize < 12) add(A.small, pn + ' :: ' + n.name + ' ' + n.fontSize + 'px', fn);
          if (/—/.test(n.characters)) add(A.dash, n.name + ' "' + n.characters.slice(0, 30) + '"', fn);
          for (const fl of (Array.isArray(n.fills) ? n.fills : [])) if (fl.boundVariables && fl.boundVariables.color) { const vn = await vname(fl.boundVariables.color.id); if (/text\/tertiary/.test(vn)) add(A.tert, pn + ' :: "' + String(n.characters).slice(0, 24) + '"', fn); }
        }
        if (n.type === 'INSTANCE' && /^(Button|Icon button|Chip|Filter chip|Switch|Checkbox)/.test(n.name) && !underEx(n, f)) { const b = BB(n); if (b && b.height < 44) add(A.tap, n.name + ' ' + R(b.height) + 'px', fn); }
        if ((n.type === 'FRAME' || n.type === 'RECTANGLE') && typeof n.cornerRadius === 'number' && n.cornerRadius > 0 && n.cornerRadius < 100 && !(n.boundVariables && n.boundVariables.topLeftRadius) && !underEx(n, f) && RAD_OK.indexOf(n.cornerRadius) < 0) add(A.radius, pn + ' :: ' + n.name + ' r' + n.cornerRadius, fn);
        if (n.parent && n.parent !== f && n.layoutPositioning !== 'ABSOLUTE' && n.parent.type !== 'INSTANCE' && !underEx(n, f) && 'layoutMode' in n.parent && n.parent.layoutMode !== 'NONE') {
          const b = BB(n), pb = BB(n.parent); if (b && pb && (b.x + b.width > pb.x + pb.width + 1)) add(A.over, n.parent.name + ' :: ' + n.name + ' +' + R(b.x + b.width - pb.x - pb.width), fn);
        }
        if ('reactions' in n && n.reactions && n.reactions.length) for (const r of n.reactions) for (const a of (r.actions || [])) if (a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO') A.links++;
      }
    }
    audits[plat + ' · ' + sn] = A;
    report.info[plat + ' · ' + sn] = { frames: A.frames, nodes: A.nodes, clickLinks: A.links, unboundFills: top(A.unbound), unstyledText: top(A.unstyled), textUnder12: top(A.small), tapUnder44: top(A.tap), longDash: top(A.dash), tertiaryText: top(A.tert, 6), radiusOffScale: top(A.radius), overflowRight: top(A.over) };
  });
}
await step('player result mobile 192 vs 176', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && /^Player result$/.test(n.name));
  report.info.playerResultSet = set ? set.children.map(k => k.name + ' ' + R(k.width) + 'x' + R(k.height)) : 'Player result seti yok';
  const sec = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile').children.find(n => n.type === 'SECTION' && n.name === 'Search results');
  const inst = sec.findAll(n => n.type === 'INSTANCE' && /^Player result/.test(n.name)).slice(0, 3);
  const out = [];
  for (const i of inst) {
    const m = await i.getMainComponentAsync();
    out.push('INSTANCE ' + i.name + ' [' + R(i.width) + 'x' + R(i.height) + '] main=' + (m ? m.name + ' ' + R(m.width) + 'x' + R(m.height) : '?') + ' <' + (i.parent ? i.parent.name : '') + '>');
  }
  report.info.playerInstances = out;
  if (inst[0]) { const d = []; dump(inst[0], 0, 3, d, ''); report.info.playerInstanceTree = d.slice(0, 30); const m = await inst[0].getMainComponentAsync(); if (m) { const d2 = []; dump(m, 0, 3, d2, ''); report.info.playerMainTree = d2.slice(0, 30); } }
});
await step('club card mobile teams', async () => {
  const sec = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile').children.find(n => n.type === 'SECTION' && n.name === 'Club card');
  const f = sec.children.find(c => c.type === 'FRAME' && /Club card · Mobile/.test(c.name) && !/(Staff|Minimal|Women|Team list)/.test(c.name)) || sec.children[0];
  const teams = f.findOne(n => /^Teams/.test(n.name) && 'children' in n);
  if (!teams) throw new Error('Teams kartı yok');
  const d = []; dump(teams, 0, 1, d, ''); report.info.teamsCard = d;
  const rows = teams.findAll(n => n.type === 'INSTANCE' && /^Player result|^Player/.test(n.name));
  report.info.teamsRows = rows.slice(0, 6).map(r => r.name + ' ' + R(r.width) + 'x' + R(r.height));
});
return report;
