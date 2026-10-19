// step 145 · Rol profilleri (8 sayfa) Web ve Mobile icinde etiketli alt Section "Profiles · other roles" altinda toplanir + kariyer ciplerinin metni okunur (kontrol)

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p02 = pageOf(/^02/);
await p02.loadAsync();
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;

const SUB = 'Profiles · other roles';
const ROLE_RE = /^Profiles \/ (Manager|Intermediary|Referee|Football fan) · (Desktop|Mobile)$/;
const NOTE = 'One profile template for every role: only the identity block, key facts, club strip and actions change. Rules per role: 01 · Foundations › Profile · key facts by role.';
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const abs = n => n.absoluteBoundingBox;

async function group(sec, key) {
  let sub = sec.children.find(n => n.type === 'SECTION' && n.name === SUB);
  const frames = sec.findAll(n => n.type === 'FRAME' && ROLE_RE.test(n.name));
  if (!frames.length) throw new Error('no role frames in ' + sec.name);
  const box = { x: Infinity, y: Infinity, r: -Infinity, b: -Infinity };
  for (const f of frames) { const a = abs(f); box.x = Math.min(box.x, a.x); box.y = Math.min(box.y, a.y); box.r = Math.max(box.r, a.x + a.width); box.b = Math.max(box.b, a.y + a.height); }
  const pad = 80, top = 200;
  const S = abs(sec);
  if (!sub) {
    sub = figma.createSection();
    sub.name = SUB;
    sec.appendChild(sub);
  }
  sub.x = box.x - pad - S.x; sub.y = box.y - top - S.y;
  sub.resizeWithoutConstraints(box.r - box.x + pad * 2, box.b - box.y + top + pad);
  const U = abs(sub);
  for (const f of frames) {
    if (f.parent === sub) continue;
    const a = abs(f);
    sub.appendChild(f);
    f.x = a.x - U.x; f.y = a.y - U.y;
  }
  let note = sub.children.find(n => n.type === 'TEXT' && n.name === 'Note · Other roles');
  if (!note) {
    note = figma.createText();
    const st = TS['Body/Default'] || TS['Body/Small'];
    await figma.loadFontAsync(st.fontName);
    sub.appendChild(note);
    await note.setTextStyleIdAsync(st.id);
    note.characters = NOTE;
    note.name = 'Note · Other roles';
    note.fills = [P(V('color/text/secondary'))];
    note.textAutoResize = 'HEIGHT';
  }
  note.resize(key === 'web' ? 960 : 700, note.height);
  note.x = pad; note.y = 88;
  report.info[key] = SUB + ' @' + Math.round(sub.x) + ',' + Math.round(sub.y) + ' ' + Math.round(sub.width) + 'x' + Math.round(sub.height) + ', frames ' + sub.children.filter(n => n.type === 'FRAME').length;
}

await step('group web', () => group(web, 'web'));
await step('group mobile', () => group(mob, 'mob'));

// ---------- Web grows if needed; Mobile and anything right of Web follow ----------
await step('sections', async () => {
  const oldW = web.width, oldRight = web.x + oldW;
  let right = 0, bottom = 0;
  for (const k of web.children) { right = Math.max(right, k.x + k.width); bottom = Math.max(bottom, k.y + k.height); }
  const newW = Math.max(oldW, right + 80);
  web.resizeWithoutConstraints(newW, Math.max(web.height, bottom + 80));
  const dx = newW - oldW;
  if (dx > 0) for (const n of p02.children) if (n !== web && n.x >= oldRight) n.x += dx;
  let mr = 0, mb = 0;
  for (const k of mob.children) { mr = Math.max(mr, k.x + k.width); mb = Math.max(mb, k.y + k.height); }
  mob.resizeWithoutConstraints(Math.max(mob.width, mr + 80), Math.max(mob.height, mb + 80));
  report.info.sections = 'Web ' + Math.round(web.width) + 'x' + Math.round(web.height) + ' · Mobile @' + Math.round(mob.x) + ' ' + Math.round(mob.width) + 'x' + Math.round(mob.height) + ' (moved ' + Math.round(dx) + ')';
});

// ---------- check (read only): career entry texts per role page ----------
await step('career check', async () => {
  const out = {};
  for (const f of p02.findAll(n => n.type === 'FRAME' && ROLE_RE.test(n.name))) {
    const list = f.findOne(n => n.name === 'Club entries');
    if (!list) { out[f.name] = 'no career'; continue; }
    out[f.name] = list.children.filter(n => n.type === 'INSTANCE').map(e => {
      const tags = e.findAll(n => n.type === 'INSTANCE' && n.name !== 'Club crest' && n.visible && !!n.findOne(t => t.type === 'TEXT' && t.name === 'Label'));
      return e.findOne(n => n.name === 'Club name').characters + ' | ' + tags.map(t => t.name + '=' + t.findOne(x => x.name === 'Label').characters).join(', ');
    });
  }
  report.info.career = out;
});

return report;
