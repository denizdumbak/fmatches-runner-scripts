// step 192 (190 dahil) · Wrong password sayfasi: parola hatasi "Incorrect password"; yanina ayni ekranin diger hali "Log in / Wrong email" (e-posta kutusu kirmizi, "Incorrect email"). Ayrica armasiz sayfalarda hero'daki buyuk soluk arma gizlenir

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync(); await figma.setCurrentPageAsync(p02);
const r = n => Math.round(n);
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync(TS['Label/Small'].fontName);
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }
const contains = (a, b) => { let x = b; while (x) { if (x === a) return true; x = x.parent; } return false; };
const NAME_OF = { Desktop: 'Web', Mobile: 'Mobile' };

const fieldsOf = pg => { const f = pg.findOne(n => n.type === 'FRAME' && n.name === 'Fields'); if (!f) throw new Error('Fields missing'); const email = f.findOne(n => n.type === 'INSTANCE' && /Email/.test(n.name)), pass = f.findOne(n => n.type === 'INSTANCE' && /Password/.test(n.name)); if (!email || !pass) throw new Error('email/password field missing'); return { email, pass }; };
const valueText = i => i.findOne(n => n.type === 'TEXT' && n.name === 'Value' && n.parent && n.parent.name === 'Field');
const errText = i => i.findOne(n => n.type === 'TEXT' && (n.name === 'Error message' || (n.parent && n.parent.name === 'Error message')));
async function setErr(i, msg) { const t = errText(i); if (!t) throw new Error('error text missing in ' + i.name); await loadFonts(t); t.characters = msg; }
async function setVal(i, v) { const t = valueText(i); if (t) { await loadFonts(t); t.characters = v; } }

for (const D of ['Desktop', 'Mobile']) {
  await step('wrong password · ' + D, async () => {
    const desk = D === 'Desktop', W = desk ? 1440 : 390;
    const ps = p02.children.find(n => n.type === 'SECTION' && n.name === NAME_OF[D]);
    const sub = ps.children.find(n => n.type === 'SECTION' && n.name === 'Log in'); if (!sub) throw new Error('Log in section missing');
    const newName = 'Log in / Wrong email · ' + D;
    for (const o of sub.children.filter(n => n.name === newName || n.name === 'Note · wrongemail · ' + D)) o.remove();
    const wp = sub.children.find(n => n.type === 'FRAME' && n.name === 'Log in / Wrong password · ' + D); if (!wp) throw new Error('Wrong password page missing');
    // 1) parola hatasi
    const a = fieldsOf(wp); const emailVal = valueText(a.email) ? valueText(a.email).characters : '', passVal = valueText(a.pass) ? valueText(a.pass).characters : '';
    await setErr(a.pass, 'Incorrect password');
    // 2) e-posta hatasi: klon
    const pg = wp.clone(); pg.name = newName; if (pg.parent !== sub) sub.appendChild(pg);
    for (const n of [pg].concat(pg.findAll(x => x.reactions && x.reactions.length))) { try { await n.setReactionsAsync([]); } catch (e) {} }
    const slot = desk ? 3920 : 1580; pg.x = slot; pg.y = wp.y;
    const b = fieldsOf(pg);
    b.email.setProperties({ State: 'Error' }); b.pass.setProperties({ State: 'Filled' });
    await setVal(b.email, emailVal); await setVal(b.pass, passVal);
    await setErr(b.email, 'Incorrect email');
    const note = figma.createText(); note.name = 'Note · wrongemail · ' + D; await note.setTextStyleIdAsync(TS['Label/Small'].id);
    note.characters = 'Same screen as Wrong password, other state: the field that failed turns red with its own message. Developer: show only the one that applies. Naming the failed field tells a visitor whether an email is registered.';
    note.fills = [P(V('color/text/warning'))]; sub.appendChild(note); note.textAutoResize = 'HEIGHT'; note.resize(Math.min(W, 440), note.height); note.x = pg.x; note.y = pg.y + pg.height + 40;
    let rr = 0, bb = 0; for (const k of sub.children) { rr = Math.max(rr, k.x + k.width); bb = Math.max(bb, k.y + k.height); }
    sub.resizeWithoutConstraints(Math.max(sub.width, Math.ceil(rr + 80)), Math.max(sub.height, Math.ceil(bb + 80)));
    const sa = fieldsOf(wp), sb = fieldsOf(pg);
    report.info['states ' + D] = 'Wrong password: email ' + sa.email.componentProperties.State.value + ' / password ' + sa.pass.componentProperties.State.value + ' · Wrong email: email ' + sb.email.componentProperties.State.value + ' / password ' + sb.pass.componentProperties.State.value;
    report.info['texts ' + D] = [errText(sa.pass).characters, errText(sb.email).characters, valueText(sb.email) ? valueText(sb.email).characters : '-', valueText(sb.pass) ? valueText(sb.pass).characters : '-'];
    report.info['heights ' + D] = r(wp.height) + ' | ' + r(pg.height);
  });
}

for (const D of ['Desktop', 'Mobile']) {
  await step('hero crest · ' + D, async () => {
    const pg = p02.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player / No crest uploaded · ' + D); if (!pg) throw new Error('page missing');
    const hero = pg.findOne(n => n.name === 'Hero · player identity'); if (!hero) throw new Error('hero missing');
    const rows = []; let hidden = 0;
    for (const i of pg.findAll(n => n.type === 'INSTANCE')) {
      const m = await i.getMainComponentAsync(); if (!m || !m.parent || m.parent.name !== 'Club crest') continue;
      const big = contains(hero, i) && (i.width > 100 || i.opacity < 0.5);
      rows.push(r(i.width) + 'x' + r(i.height) + ' op ' + i.opacity + ' ' + m.name + (big ? ' -> hidden' : ''));
      if (big) { i.visible = false; hidden++; }
    }
    report.info['crests ' + D] = rows; report.info['hidden ' + D] = hidden;
  });
}

await step('widen platforms', async () => {
  const log = [];
  for (const P_ of ['Web', 'Mobile']) {
    const ps = p02.children.find(n => n.type === 'SECTION' && n.name === P_); let right = 0, bottom = 0; for (const k of ps.children) { right = Math.max(right, k.x + k.width); bottom = Math.max(bottom, k.y + k.height); }
    const needW = Math.ceil(right + 160), needH = Math.ceil(bottom + 160); const oldRight = ps.x + ps.width, dx = Math.max(0, needW - ps.width);
    if (dx > 0 || needH > ps.height) ps.resizeWithoutConstraints(Math.max(ps.width, needW), Math.max(ps.height, needH));
    if (dx > 0) for (const n of p02.children) if (n !== ps && n.x >= oldRight - 1) n.x += dx;
    log.push(P_ + ' · ' + r(ps.width) + 'x' + r(ps.height) + (dx ? ' · grew ' + dx : ''));
  }
  report.info.platforms = log;
});
await step('check', async () => {
  const ov = [], out = [];
  function walk(sec) {
    const kids = sec.children; const secs = kids.filter(c => c.type === 'SECTION');
    for (let i = 0; i < secs.length; i++) for (let j = i + 1; j < secs.length; j++) { const a = secs[i], z = secs[j]; if (a.x < z.x + z.width && z.x < a.x + a.width && a.y < z.y + z.height && z.y < a.y + a.height) ov.push(a.name + ' / ' + z.name + ' in ' + sec.name); }
    if (sec.type === 'SECTION') for (const k of kids) if (k.x < 0 || k.y < 0 || k.x + k.width > sec.width + 1 || k.y + k.height > sec.height + 1) out.push(k.name + ' outside ' + sec.name);
    for (const c of secs) walk(c);
  }
  const top = p02.children.filter(c => c.type === 'SECTION');
  for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) { const a = top[i], z = top[j]; if (a.x < z.x + z.width && z.x < a.x + a.width && a.y < z.y + z.height && z.y < a.y + a.height) ov.push(a.name + ' / ' + z.name); }
  for (const t of top) walk(t);
  report.info.sectionOverlaps = ov.length ? ov : 'none'; report.info.outsideParent = out.length ? out.slice(0, 20) : 'none';
  let total = 0, broken = 0;
  for (const n of p02.findAll(n => n.reactions && n.reactions.length)) for (const rr of n.reactions) for (const a of (rr.actions || [])) { if (!a.destinationId) continue; total++; if (!(await figma.getNodeByIdAsync(a.destinationId))) broken++; }
  report.info.prototype = total + ' links, ' + broken + ' broken';
});
return report;
