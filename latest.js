// step 69 · M4: uc CTA uc hedefe ayrilir, slayt 1'e ikincil buton eklenir
const out = { steps: [], errors: [], onceki: [] };

const LABEL_PROP = 'Label#8:0';

async function step(name, fn) {
  try { const r = await fn(); out.steps.push({ name, done:true, result:r }); return r; }
  catch (e) { out.errors.push({ name, error:String(e && e.message ? e.message : e) }); return null; }
}
function labelOf(inst) {
  try {
    const p = inst.componentProperties || {};
    for (const k of Object.keys(p)) if (/^Label/.test(k)) return p[k].value;
  } catch (e) {}
  const t = inst.findOne ? inst.findOne(n => n.type === 'TEXT') : null;
  return t ? t.characters : null;
}
async function setLabel(inst, text) {
  const p = inst.componentProperties || {};
  const key = Object.keys(p).find(k => /^Label/.test(k));
  if (key) { inst.setProperties({ [key]: text }); return 'property'; }
  const t = inst.findOne(n => n.type === 'TEXT');
  if (!t) throw new Error('metin katmani yok');
  const fonts = t.getRangeAllFontNames(0, Math.max(1, t.characters.length));
  for (const f of fonts) await figma.loadFontAsync(f);
  t.characters = text;
  return 'text';
}
function setStyle(inst, style) {
  const p = inst.componentProperties || {};
  if (p.Style) inst.setProperties({ Style: style });
}

// ---------- once oku ----------
await step('mevcut butonlar', async () => {
  const p1 = figma.root.children.find(n => /^01/.test(n.name));
  await p1.loadAsync();
  const hero = p1.findOne(n => n.name === 'Hero slide' && n.type === 'COMPONENT_SET');
  const rows = [];
  if (hero) for (const v of hero.children) {
    const acts = v.findOne(n => /^Actions$/i.test(n.name));
    rows.push({ yer: 'Hero slide · ' + v.name,
      actionsLayout: acts ? acts.layoutMode : null,
      butonlar: acts ? acts.children.map(c => ({ ad: c.name, tur: c.type, metin: labelOf(c) })) : 'Actions yok' });
  }
  const p2 = figma.root.children.find(n => /^02/.test(n.name));
  await p2.loadAsync();
  for (const frame of p2.children) {
    if (!/^Home · (Desktop|Mobile)$/.test(frame.name)) continue;
    const cta = frame.children.find(c => /closing/i.test(c.name));
    if (!cta) { rows.push({ yer: frame.name, not: 'Closing bloku bulunamadi', bolumler: frame.children.map(c => c.name) }); continue; }
    const insts = cta.findAll(n => n.type === 'INSTANCE' && /button/i.test(n.name));
    rows.push({ yer: frame.name + ' · ' + cta.name, butonlar: insts.map(c => ({ ad: c.name, metin: labelOf(c) })) });
  }
  out.onceki = rows;
  return rows.length + ' yer okundu';
});

// ---------- slayt 1 ----------
await step('slayt 1 · iki buton', async () => {
  const p1 = figma.root.children.find(n => /^01/.test(n.name));
  const hero = p1.findOne(n => n.name === 'Hero slide' && n.type === 'COMPONENT_SET');
  if (!hero) throw new Error('Hero slide yok');
  const log = [];
  for (const v of hero.children) {
    if (!/Slide=1/.test(v.name)) continue;
    const mobile = /Device=Mobile/.test(v.name);
    const acts = v.findOne(n => /^Actions$/i.test(n.name));
    if (!acts) { log.push(v.name + ' · Actions yok'); continue; }

    let btns = acts.children.filter(c => c.type === 'INSTANCE');
    if (!btns.length) { log.push(v.name + ' · buton yok'); continue; }

    // birincil
    await setLabel(btns[0], 'Create your free profile');
    setStyle(btns[0], 'Primary');
    btns[0].name = 'Button · Create your free profile';

    // ikincil
    if (btns.length < 2) {
      const clone = btns[0].clone();
      acts.appendChild(clone);
      btns = acts.children.filter(c => c.type === 'INSTANCE');
    }
    await setLabel(btns[1], 'Browse the database');
    setStyle(btns[1], 'Secondary');
    btns[1].name = 'Button · Browse the database';

    // fazlasi varsa birak, sadece raporla
    if (mobile) {
      acts.layoutMode = 'VERTICAL';
      acts.itemSpacing = 12;
      acts.layoutSizingHorizontal = 'FILL';
      for (const b of acts.children) if (b.type === 'INSTANCE') b.layoutSizingHorizontal = 'FILL';
    } else {
      acts.layoutMode = 'HORIZONTAL';
      acts.itemSpacing = 12;
    }
    log.push(v.name + ' · ' + acts.children.filter(c => c.type === 'INSTANCE').length + ' buton');
  }
  return log;
});

// ---------- kapanis bloku ----------
await step('kapanis CTA · haritaya', async () => {
  const p2 = figma.root.children.find(n => /^02/.test(n.name));
  const log = [];
  for (const frame of p2.children) {
    if (!/^Home · (Desktop|Mobile)$/.test(frame.name)) continue;
    const cta = frame.children.find(c => /closing/i.test(c.name));
    if (!cta) { log.push(frame.name + ' · closing yok'); continue; }
    const insts = cta.findAll(n => n.type === 'INSTANCE' && /button/i.test(n.name));
    for (const b of insts) {
      const cur = labelOf(b);
      if (cur && /find a player/i.test(cur)) {
        await setLabel(b, 'Find clubs near you');
        b.name = 'Button · Find clubs near you';
        log.push(frame.name + ' · ' + cur + ' -> Find clubs near you');
      } else {
        log.push(frame.name + ' · dokunulmadi: ' + cur);
      }
    }
  }
  return log;
});

// ---------- developer notu ----------
await step('hedef notlari', async () => {
  const p1 = figma.root.children.find(n => /^01/.test(n.name));
  const hero = p1.findOne(n => n.name === 'Hero slide' && n.type === 'COMPONENT_SET');
  if (hero) hero.description = 'Hero carousel. Slide 1 actions: Create your free profile goes to signup, Browse the database goes to /site/search?query=. Slide 2: Find a player goes to the player search. Slide 3: booking.';
  return 'Hero slide aciklamasi yazildi';
});

await step('tasma kontrolu', async () => {
  const p1 = figma.root.children.find(n => /^01/.test(n.name));
  const hero = p1.findOne(n => n.name === 'Hero slide' && n.type === 'COMPONENT_SET');
  const r = [];
  for (const v of hero.children) {
    if (!/Slide=1/.test(v.name)) continue;
    const acts = v.findOne(n => /^Actions$/i.test(n.name));
    if (!acts) continue;
    let used = 0;
    acts.children.forEach((c, i) => { used += c.width + (i ? acts.itemSpacing : 0); });
    r.push({ variant: v.name, actions: Math.round(acts.width), icerik: Math.round(used),
             yon: acts.layoutMode, sigdi: acts.layoutMode === 'VERTICAL' ? true : used <= acts.width + 0.5 });
  }
  return r;
});

return out;
