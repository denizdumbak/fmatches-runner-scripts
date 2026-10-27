// step 234 · Menu · Mobile screen (hamburger panel) + wiring: Home/Map hamburger -> Menu, Interactive map -> Map Default, close -> Home, Log in / Sign up

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync(); await figma.setCurrentPageAsync(p02);
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const tryV = (...names) => { for (const n of names) { const v = allVars.find(x => x.name === n); if (v) return v; } throw new Error('none of: ' + names.join(', ')); };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const texts = await figma.getLocalTextStylesAsync(); const tstyle = (...names) => { for (const n of names) { const t = texts.find(x => x.name === n) || texts.find(x => x.name.indexOf(n) === 0); if (t) return t; } return null; };
const S_H4 = tstyle('Heading/H4'), S_LABEL = tstyle('Label/Default'); for (const x of [S_H4, S_LABEL]) await figma.loadFontAsync(x.fontName);
async function setText(node, str) { const f = node.fontName === figma.mixed ? node.getRangeFontName(0, 1) : node.fontName; await figma.loadFontAsync(f); node.characters = str; }
const nav = dest => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
async function link(label, el, dest) { if (!el) { report.errors.push('missing element: ' + label); return; } if (!dest) { report.errors.push('missing destination: ' + label); return; } try { await el.setReactionsAsync((el.reactions || []).filter(rx => !(rx.actions || []).some(isNavAct)).concat([nav(dest)])); report.info.links = (report.info.links || 0) + 1; } catch (e) { report.errors.push('link ' + label + ': ' + e.message); } }
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web'); const mob = p02.children.find(n => n.type === 'SECTION' && /^Mobile/.test(n.name));
const mm = mob.children.find(n => n.type === 'SECTION' && n.name === 'Map');
const findM = nm => mob.findOne(n => n.type === 'FRAME' && n.name === nm);
const sample = findM('Profiles / Manager · Mobile'); const tickerSrc = sample.children.find(n => n.name === 'Ticker'), navSrc = sample.children.find(n => n.name === 'Navigation');
const btnSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Button');
const NAME = 'Menu · Mobile'; let MENU = null;
await step(NAME, async () => {
  for (const k of mm.children.filter(n => n.name === NAME)) k.remove();
  const f = figma.createFrame(); f.name = NAME; f.resize(390, 844); f.clipsContent = true; f.fills = [P(V('color/bg/surface'))]; mm.appendChild(f); f.x = 80 + 8 * 470; f.y = 80; MENU = f;
  const tk = tickerSrc.clone(); tk.name = 'Ticker'; f.appendChild(tk); tk.x = 0; tk.y = 0;
  const nv = navSrc.clone(); nv.name = 'Navigation'; f.appendChild(nv); nv.x = 0; nv.y = 36;
  // swap hamburger for close if the Icon button set has such a variant
  const ibSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Icon button'); const mi = nv.findOne(n => n.type === 'INSTANCE' && n.name === 'Icon button · Menu');
  const closeV = ibSet && ibSet.children.find(v => /Icon=(Close|X)/i.test(v.name)); report.info.closeVariant = closeV ? closeV.name : 'none (hamburger kept)';
  if (closeV && mi) { try { mi.swapComponent(closeV); } catch (e) { report.errors.push('swap close: ' + e.message); } }
  // links
  const list = figma.createFrame(); list.name = 'Menu links'; list.layoutMode = 'VERTICAL'; list.counterAxisSizingMode = 'FIXED'; list.primaryAxisSizingMode = 'AUTO'; list.resize(358, 100); list.primaryAxisSizingMode = 'AUTO'; list.fills = []; f.appendChild(list); list.x = 16; list.y = 101 + 16;
  for (const lab of ['Football database', 'Events calendar', 'Interactive map']) {
    const row = figma.createFrame(); row.name = 'Menu link · ' + lab; row.layoutMode = 'HORIZONTAL'; row.counterAxisAlignItems = 'CENTER'; row.primaryAxisSizingMode = 'FIXED'; row.counterAxisSizingMode = 'FIXED'; row.resize(358, 60); row.fills = [];
    row.strokes = [P(V('color/border/default'))]; row.strokeWeight = 1; row.strokeAlign = 'INSIDE'; row.strokeTopWeight = 0; row.strokeLeftWeight = 0; row.strokeRightWeight = 0; row.strokeBottomWeight = 1;
    const t = figma.createText(); await t.setTextStyleIdAsync(S_H4.id); t.characters = lab; t.name = 'Label'; t.fills = [P(V('color/text/primary'))]; row.appendChild(t); list.appendChild(row); row.layoutAlign = 'STRETCH';
  }
  // account actions
  const bar = figma.createFrame(); bar.name = 'Account actions'; bar.layoutMode = 'VERTICAL'; bar.counterAxisSizingMode = 'FIXED'; bar.primaryAxisSizingMode = 'AUTO'; bar.resize(358, 100); bar.primaryAxisSizingMode = 'AUTO'; bar.itemSpacing = 12; bar.fills = []; f.appendChild(bar);
  const mk = async (label, style) => { const v = btnSet.children.find(c => new RegExp('Style=' + style).test(c.name) && /State=Default/.test(c.name)) || btnSet.children[0]; const b = v.createInstance(); b.name = 'Button · ' + label; const cp = b.componentProperties || {}; const lk = Object.keys(cp).find(k => /^Label/.test(k)); const ik = Object.keys(cp).find(k => /^Icon/.test(k)); if (lk) b.setProperties({ [lk]: label }); if (ik) b.setProperties({ [ik]: false }); const bt = b.findOne(n => n.type === 'TEXT'); if (bt) await setText(bt, label); return b; };
  const su = await mk('Sign up', 'Primary'); bar.appendChild(su); su.layoutAlign = 'STRETCH'; const li = await mk('Log in', 'Secondary'); bar.appendChild(li); li.layoutAlign = 'STRETCH';
  bar.x = 16; bar.y = 844 - 24 - bar.height;
  report.info.menu = 'links end y' + Math.round(list.y + list.height) + ', actions start y' + Math.round(bar.y);
  report.info.overlap = (list.y + list.height) > bar.y;
  let r = 0, b = 0; for (const ch of mm.children) { r = Math.max(r, ch.x + ch.width); b = Math.max(b, ch.y + ch.height); } mm.resizeWithoutConstraints(Math.max(mm.width, Math.ceil(r + 80)), Math.max(mm.height, Math.ceil(b + 80)));
});
await step('wire menu', async () => {
  if (!MENU) throw new Error('menu screen missing');
  const homeM = findM('Home / Main · Mobile'), mapDefault = mm.children.find(n => n.name === 'Map / Default · Mobile');
  const loginM = findM('Log in · Mobile'), signM = findM('Sign up / Account · Mobile');
  const menuBtn = fr => { const nv = fr.children.find(c => c.name === 'Navigation'); return nv && nv.findOne(n => n.type === 'INSTANCE' && n.name === 'Icon button · Menu'); };
  const sources = ['Home / Main · Mobile', 'Home / Main / Slide 2 · Mobile', 'Home / Main / Slide 3 · Mobile', 'Home / Main / Calendar view · Mobile'].map(findM).filter(Boolean).concat(mm.children.filter(n => /^Map \/ .* · Mobile$/.test(n.name) && n.name !== 'Map / Filters · Mobile'));
  report.info.menuSources = sources.length;
  for (const s of sources) { const b = menuBtn(s); await link(s.name + ' · hamburger', b, MENU); }
  const cl = MENU.findOne(n => n.type === 'INSTANCE' && n.parent && n.parent.name === 'Header actions' && n.name !== 'Icon button · Search');
  await link('Menu · close', cl, homeM);
  await link('Menu · Interactive map', MENU.findOne(n => n.name === 'Menu link · Interactive map'), mapDefault);
  await link('Menu · Log in', MENU.findOne(n => n.name === 'Button · Log in'), loginM);
  await link('Menu · Sign up', MENU.findOne(n => n.name === 'Button · Sign up'), signM);
});
return report;
