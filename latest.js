// step 306 · salt okunur: (A) mobil dokunma alanı: Social icon, Icon button (40), Switch, sekme çipleri ve ebeveynleri · (B) hover eksik setler: Icon button, Filter chip, Role card, Calendar day, Map marker yapısı + mevcut hover kalıpları. Hiçbir şey değiştirmez.
const report = { done: [], errors: [] };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const p01 = figma.root.children.find(p => /^01/.test(p.name));
const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
const vars = await figma.variables.getLocalVariablesAsync();
const vn = id => { const v = vars.find(x => x.id === id); return v ? v.name.replace('color/', '') : '?'; };
const paint = n => { if (!('fills' in n) || n.fills === figma.mixed || !n.fills.length) return '-'; const p = n.fills[0]; return (p.boundVariables && p.boundVariables.color ? vn(p.boundVariables.color.id) : p.type) + (p.opacity !== undefined && p.opacity < 1 ? '@' + Math.round(p.opacity * 100) : ''); };
const stroke = n => { if (!('strokes' in n) || !n.strokes.length) return '-'; const p = n.strokes[0]; return (p.boundVariables && p.boundVariables.color ? vn(p.boundVariables.color.id) : 'raw') + ' ' + (n.strokeWeight === figma.mixed ? 'mixed' : n.strokeWeight); };
const lay = n => n.layoutMode && n.layoutMode !== 'NONE' ? `${n.layoutMode} gap ${n.itemSpacing} pad ${n.paddingTop}/${n.paddingRight}/${n.paddingBottom}/${n.paddingLeft} ${n.primaryAxisSizingMode}/${n.counterAxisSizingMode}` : 'NONE';
const desc = n => `${n.name} ${R(n.width)}x${R(n.height)} · ${lay(n)} · fill ${paint(n)} · stroke ${stroke(n)} · rad ${'cornerRadius' in n ? (n.cornerRadius === figma.mixed ? 'mixed' : R(n.cornerRadius)) : '-'} · op ${n.opacity}`;
const kids = n => 'children' in n ? n.children.map(k => `${k.name}:${k.type} ${R(k.width)}x${R(k.height)}${k.layoutPositioning === 'ABSOLUTE' ? ' ABS' : ''}`).join(', ') : '';
const getSet = nm => p01.findOne(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && n.name === nm);
const reacts = n => (n.reactions || []).map(r => `${r.trigger.type}>${(r.actions || []).map(a => a.navigation + (a.transition ? ' ' + a.transition.type + ' ' + Math.round(a.transition.duration * 100) / 100 : '')).join('/')}`).join(' ; ') || '-';

function setInfo(nm, max) {
  const s = getSet(nm); if (!s) return nm + ': YOK';
  const out = { set: `${s.type} ${R(s.width)}x${R(s.height)} parent ${s.parent.name}`, props: s.variantGroupProperties ? Object.keys(s.variantGroupProperties).map(k => k + ': ' + s.variantGroupProperties[k].values.join('/')) : [], variants: [] };
  const list = s.type === 'COMPONENT_SET' ? s.children : [s];
  for (const c of list.slice(0, max || 6)) out.variants.push(`${desc(c)} · kids [${kids(c)}] · reactions ${reacts(c)}`);
  return out;
}
async function parentsOf(setName, plat, filterFn, limit) {
  const s = getSet(setName); const groups = new Map();
  const plats = p02.children.filter(n => n.type === 'SECTION' && n.name === plat);
  for (const pl of plats) for (const inst of pl.findAll(n => n.type === 'INSTANCE')) {
    if (filterFn && !filterFn(inst)) continue;
    const m = await inst.getMainComponentAsync(); if (!m) continue;
    const owner = m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
    if (owner !== s) continue;
    const p = inst.parent;
    const k = `${m.name} ${R(inst.width)}x${R(inst.height)} in "${p.name}" [${lay(p)}] (${R(p.width)}x${R(p.height)})`;
    const g = groups.get(k) || { n: 0 }; g.n++; groups.set(k, g);
  }
  return [...groups.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, limit || 8).map(([k, g]) => `${g.n}x ${k}`);
}

await step('A tap', async () => {
  report.socialIcon = setInfo('Social icon');
  report.socialParentsMobile = await parentsOf('Social icon', 'Mobile');
  report.socialParentsWeb = await parentsOf('Social icon', 'Web', null, 4);
  report.iconButton40Mobile = await parentsOf('Icon button', 'Mobile', n => R(n.width) < 44, 10);
  report.switchParentsMobile = await parentsOf('Switch', 'Mobile');
  report.chipParentsMobile = await parentsOf('Filter chip', 'Mobile', n => /^Tab ·/.test(n.name));
  report.iconButtonSizes = getSet('Icon button').children.filter(c => /State=Default/.test(c.name)).map(c => `${c.name.replace(', State=Default', '')} ${R(c.width)} fill ${paint(c)} stroke ${stroke(c)}`);
});

await step('B hover', async () => {
  report.filterChip = setInfo('Filter chip');
  report.roleCard = setInfo('Role card', 4);
  report.calendarDay = setInfo('Calendar day', 5);
  report.mapMarker = setInfo('Map marker', 6);
  // mevcut hover kalıpları: Default vs Hover farkı
  const pats = [];
  for (const nm of ['Button', 'Link row', 'Menu row', 'Event row', 'Chat list item', 'Person row', 'Edit button', 'Option row', 'Social icon', 'Club entry']) {
    const s = getSet(nm); if (!s || s.type !== 'COMPONENT_SET') continue;
    const d = s.children.find(c => /State=Default/.test(c.name)); if (!d) continue;
    const h = s.children.find(c => c.name === d.name.replace('State=Default', 'State=Hover')); if (!h) continue;
    const diffs = [];
    const walk = (a, b, path) => {
      if (paint(a) !== paint(b)) diffs.push(`${path || 'root'} fill ${paint(a)}→${paint(b)}`);
      if (stroke(a) !== stroke(b)) diffs.push(`${path || 'root'} stroke ${stroke(a)}→${stroke(b)}`);
      if ('effects' in a && a.effects.length !== b.effects.length) diffs.push(`${path || 'root'} fx ${a.effects.length}→${b.effects.length}`);
      if ('children' in a && 'children' in b) for (let i = 0; i < Math.min(a.children.length, b.children.length); i++) walk(a.children[i], b.children[i], (path ? path + '>' : '') + a.children[i].name);
    };
    walk(d, h, '');
    pats.push(`${nm}: ${diffs.slice(0, 4).join(' · ') || 'fark yok'} · Default reactions ${reacts(d)}`);
  }
  report.hoverPatterns = pats;
});
return report;
