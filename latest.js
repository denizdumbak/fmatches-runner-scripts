// step 288 · Settings components in Section 10: "Setting row" (title + sub + Switch; Device x Divider) and Contact row Kind=Blocked (Unblock); sets below shifted, Section grown
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/); await p01.loadAsync();
await figma.setCurrentPageAsync(p01);
const allVars = await figma.variables.getLocalVariablesAsync();
const tryV = (...names) => { for (const n of names) { const v = allVars.find(x => x.name === n || x.name.endsWith('/' + n)); if (v) return v; } return null; };
const V = name => { const v = tryV(name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const PAD = (n, t, r, b, l) => { n.setBoundVariable('paddingTop', V(t)); n.setBoundVariable('paddingRight', V(r)); n.setBoundVariable('paddingBottom', V(b)); n.setBoundVariable('paddingLeft', V(l)); };
const GAP = (n, v) => n.setBoundVariable('itemSpacing', V(v));
const sz = n => Math.round(n.width) + 'x' + Math.round(n.height);
const setText = async (node, str) => { for (const seg of node.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); node.characters = str; };
const findSet = nm => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === nm);
const SEC = '10 · Contacts & settings';
const sec = p01.findOne(n => n.type === 'SECTION' && n.name === SEC); if (!sec) throw new Error('Section 10 missing');
const contactSet = findSet('Contact row'), btnSet = findSet('Button'), switchSet = findSet('Switch'), personSet = findSet('Person row');
if (!contactSet || !btnSet || !switchSet || !personSet) throw new Error('source set missing (Contact row / Button / Switch / Person row)');

async function btn(style, label) {
  const v = btnSet.children.find(x => x.name === 'Style=' + style + ', State=Default'); if (!v) throw new Error('Button variant ' + style);
  const i = v.createInstance(); const pr = {};
  for (const k of Object.keys(i.componentProperties)) { if (/^Label#/.test(k)) pr[k] = label; if (/^Icon#/.test(k)) pr[k] = false; }
  i.setProperties(pr); i.name = 'Button · ' + label;
  const lt = i.findOne(n => n.type === 'TEXT'); if (!lt) throw new Error('button has no text'); await setText(lt, label);
  return i;
}

// ---------- A. Contact row: Kind=Blocked ----------
await step('Contact row: Kind=Blocked', async () => {
  for (const v of contactSet.children.filter(x => /Kind=Blocked/.test(x.name)).slice()) v.remove();
  const oldBottom = contactSet.y + contactSet.height;
  const bottoms = {};
  for (const v of contactSet.children) bottoms[Math.round(v.x)] = Math.max(bottoms[Math.round(v.x)] || 0, v.y + v.height);
  const srcs = contactSet.children.filter(x => /Kind=Sent/.test(x.name));
  if (srcs.length !== 4) throw new Error('expected 4 Sent variants, found ' + srcs.length);
  for (const s of srcs) {
    const c = s.clone(); contactSet.appendChild(c); c.name = s.name.replace('Kind=Sent', 'Kind=Blocked');
    const acts = c.findOne(n => n.name === 'Actions'); if (!acts) throw new Error('Actions missing');
    for (const k of acts.children.slice()) k.remove();
    const b = await btn('Secondary', 'Unblock'); acts.appendChild(b);
    if (/Device=Mobile/.test(c.name)) b.layoutSizingHorizontal = 'FILL';
    const nm = c.findOne(n => n.type === 'TEXT' && n.name === 'Name'); await setText(nm, 'Rui Santos');
    const mt = c.findOne(n => n.type === 'TEXT' && n.name === 'Meta'); await setText(mt, 'Player · Coastal United');
    const key = Math.round(s.x);
    c.x = s.x; c.y = bottoms[key] + 24; bottoms[key] = c.y + c.height;
  }
  const newBottom = Math.max.apply(null, Object.values(bottoms)) + 8;
  contactSet.resizeWithoutConstraints(contactSet.width, newBottom - 0);
  const delta = Math.round(contactSet.y + contactSet.height - oldBottom);
  let moved = 0;
  if (delta > 0) { for (const s of sec.children) if (s !== contactSet && s.y >= oldBottom - 1) { s.y += delta; moved++; } sec.resizeWithoutConstraints(sec.width, sec.height + delta); }
  report.info.blocked = { variants: contactSet.children.length, setSize: sz(contactSet), delta, shiftedBelow: moved };
});

// ---------- B. Setting row ----------
await step('Setting row', async () => {
  for (const o of sec.children.filter(n => n.name === 'Setting row' || n.name === 'Setting row note').slice()) o.remove();
  const pv = personSet.children.find(v => /State=Default/.test(v.name));
  const srcName = pv.findOne(n => n.type === 'TEXT' && n.name === 'Name'), srcMeta = pv.findOne(n => n.type === 'TEXT' && n.name === 'Meta');
  if (!srcName || !srcMeta) throw new Error('Person row texts missing');
  const sw = switchSet.children.find(v => v.name === 'Checked=On, State=Default'); if (!sw) throw new Error('Switch On/Default missing');
  const comps = [];
  for (const dev of ['Desktop', 'Mobile']) for (const dv of ['On', 'Off']) {
    const w = dev === 'Desktop' ? 656 : 326;
    const c = figma.createComponent(); c.name = 'Device=' + dev + ', Divider=' + dv;
    c.layoutMode = 'HORIZONTAL'; c.resize(w, 20); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO'; c.counterAxisAlignItems = 'CENTER';
    c.fills = []; c.clipsContent = false; PAD(c, 'spacing/md', 'spacing/2xs', 'spacing/md', 'spacing/2xs'); GAP(c, 'spacing/md');
    if (dv === 'On') { c.strokes = [P(V('color/border/default'))]; c.strokeAlign = 'INSIDE'; c.strokeTopWeight = 0; c.strokeLeftWeight = 0; c.strokeRightWeight = 0; c.strokeBottomWeight = 1; }
    const text = figma.createFrame(); text.name = 'Text'; text.fills = []; text.clipsContent = false; text.layoutMode = 'VERTICAL'; text.primaryAxisSizingMode = 'AUTO'; text.counterAxisSizingMode = 'AUTO'; GAP(text, 'spacing/2xs');
    const t1 = srcName.clone(); t1.name = 'Title'; await setText(t1, 'New messages'); t1.textAutoResize = 'WIDTH_AND_HEIGHT';
    const t2 = srcMeta.clone(); t2.name = 'Sub'; await setText(t2, 'Email me when someone writes to me'); t2.textAutoResize = 'WIDTH_AND_HEIGHT';
    text.appendChild(t1); text.appendChild(t2); c.appendChild(text); text.layoutSizingHorizontal = 'FILL'; t2.layoutSizingHorizontal = 'FILL';
    const s = sw.createInstance(); s.name = 'Switch'; c.appendChild(s);
    comps.push(c);
  }
  let y = 32; const xs = { Desktop: 32, Mobile: 32 + 656 + 48 };
  const ys = { Desktop: 32, Mobile: 32 };
  for (const c of comps) { sec.appendChild(c); const d = /Device=Mobile/.test(c.name) ? 'Mobile' : 'Desktop'; c.x = xs[d]; c.y = ys[d]; ys[d] += c.height + 24; }
  // below everything in the section except the final developer note / this set
  let top = 0; for (const n of sec.children) { if (comps.indexOf(n) >= 0) continue; top = Math.max(top, n.y + n.height); }
  const styles = await figma.getLocalTextStylesAsync(); const st = styles.find(s => s.name === 'Label/Small'); if (!st) throw new Error('Label/Small missing'); await figma.loadFontAsync(st.fontName);
  const note = figma.createText(); note.name = 'Setting row note'; await note.setTextStyleIdAsync(st.id);
  note.characters = 'Setting row: one on/off setting (title, one-line help, Switch). Divider = Off for the last row of a card. Click the Switch in the prototype to toggle.';
  note.fills = [P(V('color/text/secondary'))]; sec.appendChild(note); note.x = 80; note.y = top + 100;
  const set = figma.combineAsVariants(comps, sec); set.name = 'Setting row';
  set.resizeWithoutConstraints(32 + 656 + 48 + 326 + 32, Math.max(ys.Desktop, ys.Mobile) + 8);
  set.x = 80; set.y = note.y + 40;
  const needW = Math.max(sec.width, Math.ceil(note.width) + 160, set.x + set.width + 80);
  sec.resizeWithoutConstraints(needW, set.y + set.height + 80);
  const arch = p01.findOne(n => n.type === 'SECTION' && /^Archive/.test(n.name));
  const others = p01.children.filter(n => n.type === 'SECTION' && n !== arch);
  if (arch) arch.x = Math.max.apply(null, others.map(s => s.x + s.width)) + 160;
  // checks
  const unstyled = [], clip = [];
  for (const v of set.children) { for (const n of v.findAll(() => true)) if (n.type === 'TEXT' && !n.textStyleId) unstyled.push(n.name);
    const vb = v.absoluteBoundingBox; for (const k of v.findAll(n => n.type !== 'TEXT' && 'width' in n)) { const b = k.absoluteBoundingBox; if (b && b.x + b.width > vb.x + vb.width + .5) clip.push(v.name + ' › ' + k.name); } }
  report.info.settingRow = { variants: set.children.map(v => v.name + ' ' + sz(v)), setSize: sz(set), unstyledText: unstyled.length ? unstyled.slice(0, 5) : 'none', overflowRight: clip.length ? clip.slice(0, 6) : 'none' };
});

await step('layout checks', async () => {
  const kids = sec.children.filter(n => 'width' in n); const ov = [];
  for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) { const a = kids[i], b = kids[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov.push(a.name + ' x ' + b.name); }
  const outside = kids.filter(k => k.x + k.width > sec.width || k.y + k.height > sec.height).map(k => k.name);
  const secs = p01.children.filter(n => n.type === 'SECTION'); const sov = [];
  for (let i = 0; i < secs.length; i++) for (let j = i + 1; j < secs.length; j++) { const a = secs[i], b = secs[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) sov.push(a.name + ' x ' + b.name); }
  report.info.section10 = { size: sz(sec), children: kids.map(k => k.name + ' @' + Math.round(k.x) + ',' + Math.round(k.y) + ' ' + sz(k)), overlapsInside: ov.length ? ov : 'none', outsideSection: outside.length ? outside : 'none', sectionOverlaps: sov.length ? sov : 'none' };
});
return report;
