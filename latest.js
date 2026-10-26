// step 219 · Map sayfalarini sabit siraya diz (tek satir, 1920 aralik), once mevcut konumlari raporla

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync(); await figma.setCurrentPageAsync(p02);
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const PAD = (n, t, r, b, l) => { n.setBoundVariable('paddingTop', V(t)); n.setBoundVariable('paddingRight', V(r)); n.setBoundVariable('paddingBottom', V(b)); n.setBoundVariable('paddingLeft', V(l)); };
const GAP = (n, v) => n.setBoundVariable('itemSpacing', V(v));
const RAD = (n, v) => { for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) n.setBoundVariable(k, V(v)); };
const hex = p => p && p.color ? '#' + [p.color.r, p.color.g, p.color.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('') : '-';
const effects = await figma.getLocalEffectStylesAsync(); const effect = nm => effects.find(s => s.name === nm);
const texts = await figma.getLocalTextStylesAsync();
const tstyle = (...names) => { for (const n of names) { const s = texts.find(t => t.name === n) || texts.find(t => t.name.indexOf(n) === 0); if (s) return s; } return null; };
const S_H4 = tstyle('Heading/H4'), S_LABEL = tstyle('Label/Default'), S_SMALL = tstyle('Label/Small');
for (const s of [S_H4, S_LABEL, S_SMALL]) await figma.loadFontAsync(s.fontName);
async function txt(str, style, colorVar) { const t = figma.createText(); await t.setTextStyleIdAsync(style.id); t.characters = str; t.fills = [P(V(colorVar))]; return t; }
async function setText(node, str) { const f = node.fontName === figma.mixed ? node.getRangeFontName(0, 1) : node.fontName; await figma.loadFontAsync(f); node.characters = str; }
const set01 = nm => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === nm);
const sec7 = p01.children.find(n => n.type === 'SECTION' && /^7 /.test(n.name));
const markerSet = set01('Map marker'), clusterSet = set01('Map cluster');
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web'); const mapSec = web.children.find(n => n.type === 'SECTION' && n.name === 'Map');
const created = {};
const mv = (kind, state) => markerSet.children.find(c => c.name === 'Kind=' + kind + ', State=' + state);
const setIn = async (root, nm, str) => { const t = root.findOne(n => n.type === 'TEXT' && n.name === nm); if (t) await setText(t, str); return !!t; };




async function applySwitcher(pg, active) {
  const sset = set01('Map type switcher'); const filters = pg.findOne(n => n.name === 'Filters'); if (!filters) return 'no Filters';
  for (const k of filters.children.slice()) if (k.name === 'Type switcher') k.remove();
  const inst = sset.children.find(v => v.name === 'Active=' + active).createInstance(); inst.name = 'Type switcher';
  filters.insertChild(0, inst); inst.layoutAlign = 'STRETCH'; return 'ok';
}



await step('Relayout Map pages', async () => {
  const order = ['Map / Default · Desktop', 'Map / Club card · Desktop', 'Map / Events · Desktop', 'Map / Match requests · Desktop', 'Map / Stadium card · Desktop', 'Map / Scouts near you · ask · Desktop', 'Map / Scouts near you · Desktop'];
  report.info.before = mapSec.children.map(c => c.name.replace('Map / ', '') + ' ' + Math.round(c.x) + ',' + Math.round(c.y) + ' ' + Math.round(c.width) + 'x' + Math.round(c.height)).join(' | ');
  const missing = []; let i = 0;
  for (const nm of order) { const pg = mapSec.children.find(n => n.name === nm); if (!pg) { missing.push(nm); continue; } pg.x = 80 + i * 1920; pg.y = 80; i++; }
  report.info.missing = missing.length ? missing : 'none';
  const extra = mapSec.children.filter(n => order.indexOf(n.name) < 0).map(n => n.name + ' ' + Math.round(n.x) + ',' + Math.round(n.y) + ' ' + Math.round(n.width) + 'x' + Math.round(n.height));
  report.info.otherChildren = extra.length ? extra : 'none';
  let right = 0, bottom = 0; for (const ch of mapSec.children) { right = Math.max(right, ch.x + ch.width); bottom = Math.max(bottom, ch.y + ch.height); }
  mapSec.resizeWithoutConstraints(Math.ceil(right + 80), Math.ceil(bottom + 80));
  report.info.after = mapSec.children.map(c => c.name.replace('Map / ', '') + ' ' + Math.round(c.x) + ',' + Math.round(c.y)).join(' | ');
  report.info.mapSection = Math.round(mapSec.width) + 'x' + Math.round(mapSec.height) + ' at ' + Math.round(mapSec.x) + ',' + Math.round(mapSec.y);
  const A = mapSec.absoluteBoundingBox; const hits = [];
  for (const s of web.children) { if (s === mapSec || !s.absoluteBoundingBox) continue; const B = s.absoluteBoundingBox; if (A.x < B.x + B.width && B.x < A.x + A.width && A.y < B.y + B.height && B.y < A.y + A.height) hits.push(s.name); }
  report.info.overlaps = hits.length ? hits : 'none';
});
return report;
