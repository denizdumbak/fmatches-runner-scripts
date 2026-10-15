// step 102 · Logo yesil (Sergey #009933, yeni degisken color/logo/brand), footer beyaz kalir · Start here (02) satir 1-2 guncel + satir 5: giris yapmis header nerede

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const page0 = pageOf(/^01/), pageHome = pageOf(/^02/), pageProf = pageOf(/^03/);
for (const p of [page0, pageHome, pageProf]) if (p) await p.loadAsync();
const allVars = await figma.variables.getLocalVariablesAsync();
const pick = (...pats) => { for (const p of pats) { const h = allVars.find(v => new RegExp(p, 'i').test(v.name)); if (h) return h; } return null; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const vTextPrimary = pick('color/text/primary$', 'text/primary$');
const vTextInverse = pick('color/text/inverse$', 'text/inverse$');
const boundId = node => { const f = node && node.fills; if (!f || f === figma.mixed || !f[0] || !f[0].boundVariables || !f[0].boundVariables.color) return null; return f[0].boundVariables.color.id; };
let vLogo = null;

await step('1 variable color/logo/brand', async () => {
  vLogo = allVars.find(v => v.name === 'color/logo/brand');
  if (!vLogo) {
    const colls = await figma.variables.getLocalVariableCollectionsAsync();
    const coll = colls.find(c => /^Color$/i.test(c.name)) || colls.find(c => c.id === vTextPrimary.variableCollectionId);
    vLogo = figma.variables.createVariable('color/logo/brand', coll, 'COLOR');
    for (const m of coll.modes) vLogo.setValueForMode(m.modeId, { r: 0, g: 0x99 / 255, b: 0x33 / 255, a: 1 });
    vLogo.description = 'Logo green from the official FMI SVG (#009933). Logo only; buttons and text use bg/brand and text/brand.';
  }
  vLogo.scopes = ['SHAPE_FILL'];
});

await step('2 Logo component green', async () => {
  const comp = page0.findOne(n => n.name === 'Logo' && n.type === 'COMPONENT');
  if (!comp) throw new Error('Logo component not found');
  const vecs = comp.findAll(n => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION');
  for (const v of vecs) v.fills = [P(vLogo)];
  report.info.componentVectors = vecs.length;
  const d = comp.description || '';
  if (!/green/i.test(d)) comp.description = 'FMI mark, green (color/logo/brand). On dark surfaces (footer) override the fill to text/inverse.' + (d ? ' ' + d : '');
});

await step('3 instances: dark text -> green, white kept', async () => {
  let green = 0, white = 0, other = 0;
  for (const p of [page0, pageHome, pageProf]) {
    for (const n of p.findAllWithCriteria({ types: ['INSTANCE'] })) {
      const m = await n.getMainComponentAsync();
      if (!m || m.name !== 'Logo' || m.type !== 'COMPONENT') continue;
      const vecs = n.findAll(x => x.type === 'VECTOR' || x.type === 'BOOLEAN_OPERATION');
      let isWhite = false;
      for (const v of vecs) { const id = boundId(v); if (vTextInverse && id === vTextInverse.id) isWhite = true; }
      if (isWhite) { white++; continue; }
      for (const v of vecs) { const id = boundId(v); if (id !== vLogo.id) v.fills = [P(vLogo)]; }
      green++;
    }
  }
  report.info.instances = { green: green, whiteKept: white, other: other };
});

await step('4 Start here (02) lines', async () => {
  const card = pageHome.children.find(n => /^Start here/.test(n.name));
  if (!card) throw new Error('Start here card not found');
  const texts = card.findAll(n => n.type === 'TEXT');
  const byText = re => texts.find(t => re.test(t.characters));
  const load = async t => { for (const f of t.getRangeAllFontNames(0, t.characters.length)) await figma.loadFontAsync(f); };
  const setKeepPrefix = async (t, body) => {
    await load(t);
    const m = t.characters.match(/^(\s*\d+\.\s*)/);
    t.characters = (m ? m[1] : '') + body;
  };

  const l1 = byText(/Left to right/);
  if (l1) await setKeepPrefix(l1, 'Left to right: desktop (1440) and its calendar view, mobile (390) and its calendar view, then hero slides 2 and 3.');
  const l2 = byText(/to try it/);
  if (l2 && !/Calendar switch/.test(l2.characters)) { await load(l2); l2.characters = l2.characters.replace(/\s*$/, '') + ' The List / Calendar switch in Upcoming events opens the calendar view.'; }

  const l4 = byText(/Styles and components are on page 01/);
  if (!l4) throw new Error('line 4 not found');
  if (!byText(/account states/)) {
    const body = 'Logged-in header and account menu: page 01, section 1 · Navigation, board "Header · account states". Press ▶ on "Try it · account menu closed" to open the menu.';
    const hasNum = /^\s*4\./.test(l4.characters);
    if (hasNum) {
      const c = l4.clone(); l4.parent.insertChild(l4.parent.children.indexOf(l4) + 1, c);
      await load(c); const m = c.characters.match(/^(\s*)4(\.\s*)/);
      c.characters = m[1] + '5' + m[2] + body;
    } else {
      const row = l4.parent; const c = row.clone(); row.parent.insertChild(row.parent.children.indexOf(row) + 1, c);
      for (const t of c.findAll(n => n.type === 'TEXT')) { await load(t); if (/^\s*4\.?\s*$/.test(t.characters)) t.characters = t.characters.replace('4', '5'); else if (/Styles and components/.test(t.characters)) t.characters = body; }
    }
  }
  report.info.startHere = card.findAll(n => n.type === 'TEXT').map(t => t.characters.slice(0, 60));
});

return report;
