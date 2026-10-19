// step 152 · bos sol sutun gizlenir, Career tam genislik (Manager directory masaustu) + kural notu · Organization kariyer satirinda ikon kutusu bg/subtle

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
const R = v => Math.round(v);
const setOf = name => p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === name);
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const SUB = 'Profiles · other roles';
const subOf = (sec, name) => sec.children.find(n => n.type === 'SECTION' && n.name === name);

// ---------- 1. Bos sol sutun ----------
await step('empty left column', async () => {
  const out = [];
  const frames = p02.findAll(n => n.type === 'FRAME' && /^Profiles \//.test(n.name) && /· Desktop$/.test(n.name));
  for (const f of frames) {
    const left = f.findOne(n => n.name === 'Left column');
    if (!left) continue;
    const visible = left.children.filter(c => c.visible);
    if (visible.length) continue;
    const right = left.parent.children.find(c => c.name === 'Right column');
    const h0 = f.height;
    left.remove();
    if (right) right.layoutSizingHorizontal = 'FILL';
    out.push(f.name + ' · right ' + (right ? R(right.width) : 'missing') + ' · h ' + R(h0) + ' → ' + R(f.height));
  }
  report.info.leftColumn = out.length ? out : 'none empty';
});

await step('rule note', async () => {
  const note = subOf(web, SUB).children.find(c => c.type === 'TEXT' && c.name === 'Note · Other roles');
  if (!note) { report.info.note = 'note not found'; return; }
  if (note.characters.indexOf('left column') >= 0) { report.info.note = 'already done'; return; }
  await loadFonts(note);
  note.insertCharacters(note.characters.length, '\nIf the left column has no cards (directory profile without links), it is hidden and the right column takes the full width.', 'BEFORE');
  report.info.note = 'added · h ' + R(note.height);
});

// ---------- 2. Organization ikon kutusu ----------
await step('org icon box fill', async () => {
  const set = setOf('Club entry');
  const out = [];
  for (const v of set.children.filter(c => /Kind=Organization/.test(c.name))) {
    const box = v.findOne(n => n.name === 'Organization icon');
    if (!box) { out.push(v.name + ' · no box'); continue; }
    box.fills = [P(V('color/bg/subtle'))];
    out.push(v.name.replace('Kind=Organization, ', '') + ' ' + R(box.width) + 'x' + R(box.height) + ' r' + box.topLeftRadius);
  }
  report.info.orgBox = out;
});

// ---------- 3. Alt Section boyu ----------
await step('resize sections', async () => {
  const out = [];
  for (const sec of [web, mob]) {
    const sub = subOf(sec, SUB);
    let r = 0, b = 0;
    for (const c of sub.children) { r = Math.max(r, c.x + c.width); b = Math.max(b, c.y + c.height); }
    sub.resizeWithoutConstraints(Math.max(sub.width, Math.ceil(r + 80)), Math.ceil(b + 80));
    out.push(sec.name + ' sub ' + R(sub.width) + 'x' + R(sub.height));
    const subs = sec.children.filter(c => c.type === 'SECTION');
    for (let i = 0; i < subs.length; i++) for (let j = i + 1; j < subs.length; j++) {
      const a = subs[i], z = subs[j];
      if (a.x < z.x + z.width && z.x < a.x + a.width && a.y < z.y + z.height && z.y < a.y + a.height) out.push('OVERLAP ' + a.name + ' / ' + z.name);
    }
  }
  if (!out.some(s => /OVERLAP/.test(s))) out.push('overlaps: none');
  report.info.sizes = out;
});

return report;
