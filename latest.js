// step 367 · Notifications: "2 unread" başlık satırının sağına, "Mark all as read" düğmesinin soluna (masaüstü) / başlıkla aynı satırda sağ uca (mobil) + sayfa kökündeki 4 yetim "2 unread" metni 03 · Archive'a
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const p03 = figma.root.children.find(p => /^03/.test(p.name)); await p03.loadAsync();
const R = n => Math.round(n);
const BB = n => n.absoluteBoundingBox;
const allVars = await figma.variables.getLocalVariablesAsync();
const tryV = (...names) => { for (const nm of names) { const v = allVars.find(x => x.name === nm); if (v) return v; } return null; };
const secOf = (plat, name) => { const root = p02.children.find(n => n.type === 'SECTION' && n.name === plat); return root ? root.children.find(n => n.type === 'SECTION' && n.name === name) : null; };

await step('Unread count tasima', async () => {
  const rows = [];
  const gapVar = tryV('spacing/md', 'Spacing/md', 'dimension/spacing/md');
  report.info.gapVariable = gapVar ? gapVar.name : 'bulunamadi, itemSpacing 16 bagsiz';
  for (const plat of ['Web', 'Mobile']) {
    const sec = secOf(plat, 'Notifications'); if (!sec) throw new Error('Section yok: ' + plat);
    for (const f of sec.children.filter(c => c.type === 'FRAME')) {
      const nm = plat + ' · ' + f.name.replace(/^.*\/ /, '');
      const un = f.findOne(n => n.type === 'TEXT' && n.name === 'Unread count');
      if (!un) { rows.push(nm + ': Unread count yok (beklenen, atlandi)'); continue; }
      const tg = un.parent; const heading = tg.parent;
      const btn = heading.children.find(c => /Mark all as read/.test(c.name));
      if (!btn) throw new Error('Mark all as read yok: ' + nm);
      const h0 = R(f.height); const fb = BB(f);
      const reactionsBefore = btn.reactions ? btn.reactions.length : 0;
      if (heading.layoutMode === 'HORIZONTAL') {
        let actions = heading.children.find(c => c.name === 'Heading actions');
        if (!actions) {
          actions = figma.createFrame(); actions.name = 'Heading actions';
          actions.layoutMode = 'HORIZONTAL'; actions.primaryAxisSizingMode = 'AUTO'; actions.counterAxisSizingMode = 'AUTO';
          actions.counterAxisAlignItems = 'CENTER'; actions.fills = [];
          if (gapVar) actions.setBoundVariable('itemSpacing', gapVar); else actions.itemSpacing = 16;
          const idx = heading.children.indexOf(btn);
          heading.insertChild(idx, actions);
          actions.appendChild(un);
          actions.appendChild(btn);
        }
        heading.primaryAxisAlignItems = 'SPACE_BETWEEN';
        heading.counterAxisAlignItems = 'CENTER';
        un.layoutSizingHorizontal = 'HUG';
      } else {
        tg.layoutSizingHorizontal = 'FILL';
        tg.primaryAxisAlignItems = 'SPACE_BETWEEN';
        tg.counterAxisAlignItems = 'CENTER';
        un.layoutSizingHorizontal = 'HUG';
      }
      const ub = BB(un), bb = BB(btn), hb = BB(heading), tb = BB(tg.children.find(c => c.name === 'Title') || tg);
      rows.push(nm + ': unread @' + R(ub.x - fb.x) + ',' + R(ub.y - fb.y) + ' sag ' + R(ub.x + ub.width - fb.x) +
        ' | dugme sol ' + R(bb.x - fb.x) + ' | satir sag ' + R(hb.x + hb.width - fb.x) +
        ' | unread dugmeye binmiyor: ' + (heading.layoutMode === 'HORIZONTAL' ? (ub.x + ub.width <= bb.x - 8) : (ub.y + ub.height <= bb.y)) +
        ' | unread basligin sagi: ' + (ub.x >= tb.x + tb.width) + ' | icinde: ' + (ub.x + ub.width <= hb.x + hb.width + 0.5) +
        ' | frame ' + h0 + ' -> ' + R(f.height) + ' | dugme reactions ' + reactionsBefore + ' -> ' + (btn.reactions ? btn.reactions.length : 0) +
        ' | stil: ' + (un.textStyleId ? 'var' : 'YOK'));
    }
  }
  report.info.unread = rows;
});

await step('yetim 2 unread -> Archive', async () => {
  const orphans = p02.children.filter(n => n.type === 'TEXT' && /unread/.test(n.characters));
  let right = 0; for (const k of p03.children) right = Math.max(right, k.x + k.width);
  let x = right + 400; const moved = [];
  for (const o of orphans) { o.x = x; o.y = 0; p03.appendChild(o); x += 80; moved.push(o.name + ' -> Archive'); }
  report.info.orphans = { moved: moved.length, rest: p02.children.filter(n => n.type !== 'SECTION').length };
});

await step('stilsiz metin / bagsiz boya kontrolu', async () => {
  const bad = [];
  for (const plat of ['Web', 'Mobile']) { const sec = secOf(plat, 'Notifications'); for (const t of sec.findAll(n => n.type === 'TEXT' && n.name === 'Unread count')) { if (!t.textStyleId) bad.push('stilsiz'); const fl = t.fills && t.fills[0]; if (!fl || !fl.boundVariables || !fl.boundVariables.color) bad.push('boya bagsiz'); } }
  report.info.unreadChecks = bad.length ? bad : 'temiz';
});
return report;
