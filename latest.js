// step 223 · Bottom sheet component (Height = Handle / Half / Full) in 01 > 7 · Map, mobile map base

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync(); await figma.setCurrentPageAsync(p01);
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const tryV = (...names) => { for (const n of names) { const v = allVars.find(x => x.name === n); if (v) return v; } throw new Error('none of variables found: ' + names.join(', ')); };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const PAD = (n, t, r, b, l) => { n.setBoundVariable('paddingTop', V(t)); n.setBoundVariable('paddingRight', V(r)); n.setBoundVariable('paddingBottom', V(b)); n.setBoundVariable('paddingLeft', V(l)); };
const GAP = (n, v) => n.setBoundVariable('itemSpacing', V(v));
const RADV = (n, keys, v) => { for (const k of keys) n.setBoundVariable(k, v); };
const effects = await figma.getLocalEffectStylesAsync(); const effect = nm => effects.find(s => s.name === nm);
const texts = await figma.getLocalTextStylesAsync();
const tstyle = (...names) => { for (const n of names) { const s = texts.find(t => t.name === n) || texts.find(t => t.name.indexOf(n) === 0); if (s) return s; } return null; };
const S_LABEL = tstyle('Label/Default'), S_SMALL = tstyle('Label/Small'), S_BODY = tstyle('Body/Default', 'Label/Default');
for (const s of [S_LABEL, S_SMALL, S_BODY]) await figma.loadFontAsync(s.fontName);
async function txt(str, style, colorVar) { const t = figma.createText(); await t.setTextStyleIdAsync(style.id); t.characters = str; t.fills = [P(colorVar)]; return t; }
async function setText(node, str) { const f = node.fontName === figma.mixed ? node.getRangeFontName(0, 1) : node.fontName; await figma.loadFontAsync(f); node.characters = str; }
const set01 = nm => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === nm);
const sec7 = p01.children.find(n => n.type === 'SECTION' && /^7 /.test(n.name));
if (!sec7) throw new Error('01 > 7 Map section missing');
const rowSet = set01('Map result row'), swSet = set01('Map type switcher');
if (!rowSet || !swSet) throw new Error('Map result row or Map type switcher set missing');
const SEARCH_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>';
function mkIcon(svg, colorVar, size) {
  const ic = figma.createNodeFromSvg(svg); ic.name = 'Icon'; ic.fills = []; ic.resize(size, size); ic.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
  const walk = x => { if ('children' in x) x.children.forEach(walk); if (x.type !== 'FRAME' && x.type !== 'GROUP') { if (x.strokes && x.strokes.length) x.strokes = [P(colorVar)]; x.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; } };
  walk(ic); return ic;
}
const rowDef = rowSet.children[0];
const ROWS = [['Spreeufer FC', 'Regional League · Tier 3 · Mitte'], ['Nordpark SC', 'Fifth Division · Tier 5 · Wedding'], ['Havelblick United', 'Fourth Division · Tier 4 · Spandau']];

async function buildSheet(kind) {
  const c = figma.createComponent(); c.name = 'Height=' + kind;
  c.layoutMode = 'VERTICAL'; c.counterAxisSizingMode = 'FIXED'; c.primaryAxisSizingMode = 'AUTO'; c.resize(390, 100); c.primaryAxisSizingMode = 'AUTO';
  c.fills = [P(V('color/bg/surface'))]; c.clipsContent = true;
  const radV = (() => { try { return tryV('radius/xl', 'radius/lg', 'radius/md'); } catch (e) { return V('radius/md'); } })();
  RADV(c, ['topLeftRadius', 'topRightRadius'], radV); c.bottomLeftRadius = 0; c.bottomRightRadius = 0;
  const sh = effect('Shadow/Raised') || effect('Shadow/Card'); if (sh) await c.setEffectStyleIdAsync(sh.id);
  GAP(c, 'spacing/sm'); PAD(c, 'spacing/sm', 'spacing/md', 'spacing/md', 'spacing/md');
  // grab handle
  const grab = figma.createFrame(); grab.name = 'Handle'; grab.layoutMode = 'VERTICAL'; grab.counterAxisAlignItems = 'CENTER'; grab.primaryAxisSizingMode = 'AUTO'; grab.counterAxisSizingMode = 'FIXED'; grab.resize(358, 12); grab.primaryAxisSizingMode = 'AUTO'; grab.fills = [];
  const bar = figma.createFrame(); bar.name = 'Grab bar'; bar.layoutMode = 'NONE'; bar.resize(40, 4); bar.fills = [P(V('color/border/default'))]; RADV(bar, ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'], V('radius/full'));
  grab.appendChild(bar); c.appendChild(grab); grab.layoutAlign = 'STRETCH';
  // search (Full only)
  if (kind === 'Full') {
    const f = figma.createFrame(); f.name = 'Field · Search'; f.layoutMode = 'HORIZONTAL'; f.counterAxisAlignItems = 'CENTER'; f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'FIXED'; f.resize(358, 48); GAP(f, 'spacing/sm'); PAD(f, 'spacing/sm', 'spacing/md', 'spacing/sm', 'spacing/md');
    f.fills = []; f.strokes = [P(V('color/border/default'))]; f.strokeWeight = 1; RADV(f, ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'], V('radius/md'));
    f.appendChild(mkIcon(SEARCH_SVG, V('color/icon/default'), 20));
    const ph = await txt('Search city, club or facility', S_BODY, V('color/text/secondary')); ph.name = 'Placeholder'; f.appendChild(ph);
    c.appendChild(f); f.layoutAlign = 'STRETCH';
    const sw = swSet.children.find(v => v.name === 'Active=Clubs') || swSet.children[0]; const si = sw.createInstance(); si.name = 'Type switcher'; c.appendChild(si); si.layoutAlign = 'STRETCH';
  }
  // summary
  const sum = figma.createFrame(); sum.name = 'Summary'; sum.layoutMode = 'HORIZONTAL'; sum.counterAxisAlignItems = 'CENTER'; sum.primaryAxisAlignItems = 'SPACE_BETWEEN'; sum.primaryAxisSizingMode = 'FIXED'; sum.counterAxisSizingMode = 'AUTO'; sum.resize(358, 40); sum.counterAxisSizingMode = 'AUTO'; sum.fills = [];
  const counts = figma.createFrame(); counts.name = 'Counts'; counts.layoutMode = 'VERTICAL'; counts.primaryAxisSizingMode = 'AUTO'; counts.counterAxisSizingMode = 'AUTO'; counts.fills = [];
  const total = await txt('20 clubs in view', S_LABEL, V('color/text/primary')); total.name = 'Total'; counts.appendChild(total);
  const brk = await txt('Berlin and surroundings', S_SMALL, V('color/text/secondary')); brk.name = 'Breakdown'; counts.appendChild(brk);
  sum.appendChild(counts);
  const clr = await txt('Clear all', S_LABEL, tryV('color/text/brand', 'color/text/link', 'color/bg/brand')); clr.name = 'Clear all'; sum.appendChild(clr);
  c.appendChild(sum); sum.layoutAlign = 'STRETCH';
  // rows
  const n = kind === 'Handle' ? 0 : (kind === 'Half' ? 2 : 3);
  if (n) {
    const list = figma.createFrame(); list.name = 'Results'; list.layoutMode = 'VERTICAL'; list.primaryAxisSizingMode = 'AUTO'; list.counterAxisSizingMode = 'FIXED'; list.resize(358, 10); list.primaryAxisSizingMode = 'AUTO'; list.fills = [];
    for (let i = 0; i < n; i++) {
      const r = rowDef.createInstance(); r.name = 'Result · ' + ROWS[i][0]; list.appendChild(r); r.layoutAlign = 'STRETCH';
      const a = r.findOne(t => t.type === 'TEXT' && t.name === 'Name'); const b = r.findOne(t => t.type === 'TEXT' && t.name === 'Meta');
      if (a) await setText(a, ROWS[i][0]); else report.info['noName' + kind + i] = true;
      if (b) await setText(b, ROWS[i][1]);
    }
    c.appendChild(list); list.layoutAlign = 'STRETCH';
    if (kind === 'Full') { const sa = await txt('Show all 20 clubs', S_LABEL, tryV('color/text/brand', 'color/text/link', 'color/bg/brand')); sa.name = 'Show all'; c.appendChild(sa); }
  }
  if (kind === 'Full') { c.primaryAxisSizingMode = 'FIXED'; c.resize(390, 700); }
  return c;
}

await step('Bottom sheet component', async () => {
  for (const k of sec7.children.filter(n => n.name === 'Bottom sheet')) k.remove();
  for (const k of sec7.children.filter(n => n.type === 'COMPONENT' && /^Height=/.test(n.name))) k.remove();
  const vs = []; for (const k of ['Handle', 'Half', 'Full']) { const c = await buildSheet(k); sec7.appendChild(c); vs.push(c); }
  const set = figma.combineAsVariants(vs, sec7); set.name = 'Bottom sheet';
  set.layoutMode = 'HORIZONTAL'; set.primaryAxisSizingMode = 'AUTO'; set.counterAxisSizingMode = 'AUTO'; set.counterAxisAlignItems = 'MAX'; GAP(set, 'spacing/lg'); PAD(set, 'spacing/lg', 'spacing/lg', 'spacing/lg', 'spacing/lg');
  set.description = 'Mobile map list. Map stays full screen, the list lives in this sheet: Handle (one summary line), Half (first rows), Full (search, type switcher, list). Figma cannot drag, so each state is a variant; screens pick one.';
  const emp = sec7.children.find(n => n.name === 'Map empty state');
  set.x = emp ? emp.x : 80; set.y = emp ? emp.y + emp.height + 80 : 80;
  let r7 = 0, b7 = 0; for (const ch of sec7.children) { r7 = Math.max(r7, ch.x + ch.width); b7 = Math.max(b7, ch.y + ch.height); }
  sec7.resizeWithoutConstraints(Math.max(1200, Math.ceil(r7 + 80)), Math.ceil(b7 + 80));
  report.info.sheet = set.children.map(v => v.name + ' ' + Math.round(v.width) + 'x' + Math.round(v.height)).join(' | ');
  report.info.set = Math.round(set.width) + 'x' + Math.round(set.height) + ' at ' + Math.round(set.x) + ',' + Math.round(set.y);
  // self-check
  const gray = []; set.findAll(n => 'fills' in n && Array.isArray(n.fills) && n.fills.some(f => f.type === 'SOLID' && !(n.boundVariables && n.boundVariables.fills))).forEach(n => { const f = n.fills.find(x => x.type === 'SOLID'); const h = [f.color.r, f.color.g, f.color.b].map(x => Math.round(x * 255)); if (h[0] === 128 && h[1] === 128 && h[2] === 128) gray.push(n.name); });
  report.info.grayFills = gray.length ? gray : 'none';
  report.info.unstyledText = set.findAll(n => n.type === 'TEXT' && !n.textStyleId).length;
});
await figma.setCurrentPageAsync(p02);
figma.notify('223: ' + report.done.length + ' ok, ' + report.errors.length + ' errors');
return report;
