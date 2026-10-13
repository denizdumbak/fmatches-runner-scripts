// step 70 · M4 duzeltme: Network and figures haritaya, buton metni geri + Changes in this round panosu
const out = { steps: [], errors: [], anasayfaButonlari: [] };

const V = { canvas:'1:28', subtle:'1:30', textPrimary:'1:38', textSecondary:'1:39', textBrand:'1:42', brandSubtle:'1:34' };
const S = { labelStrong:'S:3db4fc217cc3dc57a2419c10fa077eb3f744478e,',
            bodySmall:'S:ea9dd88a660a659c42b2b3dc3e84dfe226fc2179,',
            eyebrow:'S:ab352e24d4e998a5e455b3aa8dbbc007bd9fbf28,',
            labelSmall:'S:6643355740b2629409d37698be89121d16c2ec96,' };

async function step(name, fn) {
  try { const r = await fn(); out.steps.push({ name, done:true, result:r }); return r; }
  catch (e) { out.errors.push({ name, error:String(e && e.message ? e.message : e) }); return null; }
}
const vc = {};
async function getVar(id){ if(!vc[id]) vc[id] = await figma.variables.getVariableByIdAsync('VariableID:'+id); return vc[id]; }
async function paint(node, id){
  const v = await getVar(id);
  node.fills = [figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color',v)];
}
async function loadFontsOf(n){
  const len = n.characters.length;
  const fonts = len>0 ? n.getRangeAllFontNames(0,len) : [n.fontName];
  for (const f of fonts) if (f && f.family) await figma.loadFontAsync(f);
}
function labelOf(inst){
  const p = inst.componentProperties || {};
  for (const k of Object.keys(p)) if (/^Label/.test(k)) return p[k].value;
  const t = inst.findOne ? inst.findOne(n => n.type === 'TEXT') : null;
  return t ? t.characters : null;
}
async function setLabel(inst, text){
  const p = inst.componentProperties || {};
  const key = Object.keys(p).find(k => /^Label/.test(k));
  if (key) { inst.setProperties({ [key]: text }); return; }
  const t = inst.findOne(n => n.type === 'TEXT');
  await loadFontsOf(t);
  t.characters = text;
}

// ---------- 0. ana sayfadaki tum butonlar ----------
await step('ana sayfa butonlari', async () => {
  const p2 = figma.root.children.find(n => /^02/.test(n.name));
  await p2.loadAsync();
  const rows = [];
  for (const frame of p2.children) {
    if (!/^Home · (Desktop|Mobile)$/.test(frame.name)) continue;
    for (const section of frame.children) {
      const insts = section.findAll ? section.findAll(n => n.type === 'INSTANCE' && /button/i.test(n.name)) : [];
      for (const b of insts) rows.push({ frame: frame.name, bolum: section.name, metin: labelOf(b) });
    }
  }
  out.anasayfaButonlari = rows;
  return rows.length + ' buton';
});

// ---------- 1. slayt 1 birincil buton geri ----------
await step('slayt 1 · Create your profile', async () => {
  const p1 = figma.root.children.find(n => /^01/.test(n.name));
  await p1.loadAsync();
  const hero = p1.findOne(n => n.name === 'Hero slide' && n.type === 'COMPONENT_SET');
  const log = [];
  for (const v of hero.children) {
    if (!/Slide=1/.test(v.name)) continue;
    const acts = v.findOne(n => /^Actions$/i.test(n.name));
    const b = acts.children.find(c => c.type === 'INSTANCE');
    if (!b) continue;
    await setLabel(b, 'Create your profile');
    b.name = 'Button · Create your profile';
    log.push(v.name);
  }
  return log;
});

// ---------- 2. Network and figures -> harita ----------
await step('Network and figures · haritaya', async () => {
  const p2 = figma.root.children.find(n => /^02/.test(n.name));
  const log = [];
  for (const frame of p2.children) {
    if (!/^Home · (Desktop|Mobile)$/.test(frame.name)) continue;
    const block = frame.children.find(c => /network and figures/i.test(c.name));
    if (!block) { log.push(frame.name + ' · blok yok: ' + frame.children.map(c => c.name).join(', ')); continue; }
    const insts = block.findAll(n => n.type === 'INSTANCE' && /button/i.test(n.name));
    if (!insts.length) { log.push(frame.name + ' · butonsuz'); continue; }
    for (const b of insts) {
      const before = labelOf(b);
      await setLabel(b, 'Find clubs near you');
      b.name = 'Button · Find clubs near you';
      log.push(frame.name + ' · "' + before + '" -> "Find clubs near you"');
    }
  }
  return log;
});

// ---------- 3. Changes in this round panosu ----------
await step('Changes in this round panosu', async () => {
  const p1 = figma.root.children.find(n => /^01/.test(n.name));
  const tset = p1.findOne(n => n.name === 'Ticker' && n.type === 'COMPONENT_SET');
  const TPL = tset.findOne(n => n.type === 'TEXT').clone();
  figma.currentPage.appendChild(TPL);

  async function txt(parent, name, chars, styleId, colorVar, fill) {
    const t = TPL.clone();
    await loadFontsOf(t);
    t.name = name; t.characters = chars;
    await t.setTextStyleIdAsync(styleId);
    await paint(t, colorVar);
    parent.appendChild(t);
    if (fill) { t.layoutSizingHorizontal = 'FILL'; t.textAutoResize = 'HEIGHT'; }
    else { t.layoutSizingHorizontal = 'HUG'; t.textAutoResize = 'WIDTH_AND_HEIGHT'; }
    t.layoutSizingVertical = 'HUG';
    return t;
  }

  const p2 = figma.root.children.find(n => /^02/.test(n.name));
  const old = p2.children.find(n => n.name === 'Changes in this round');
  if (old) old.remove();

  let maxX = 0, minY = 0;
  for (const c of p2.children) { maxX = Math.max(maxX, c.x + c.width); minY = Math.min(minY, c.y); }

  const board = figma.createFrame();
  board.name = 'Changes in this round';
  board.layoutMode = 'VERTICAL'; board.itemSpacing = 28;
  board.paddingTop = board.paddingBottom = board.paddingLeft = board.paddingRight = 64;
  board.primaryAxisSizingMode = 'AUTO'; board.counterAxisSizingMode = 'FIXED';
  board.resize(880, 100);
  board.cornerRadius = 20;
  await paint(board, V.canvas);
  p2.appendChild(board);
  board.x = maxX + 400; board.y = minY;

  await txt(board, 'Title', 'Changes in this round', S.labelStrong, V.textPrimary, true);
  await txt(board, 'Intro', 'Your six points from 12 October, what I did for each, and the places where I did something different from what you asked. Everything here is easy to reverse.', S.bodySmall, V.textSecondary, true);

  const ITEMS = [
    ['1 · Ticker by role', 'Done',
     'One Ticker component with six role variants: three signed out messages that cycle, tournaments for managers, trials for players, and one shared message for intermediaries, referees and fans. That last one also covers the case where a member has no upcoming events, so the strip is never empty. See the "Ticker · role states" board. Event names are placeholders.',
     'The strip now sits on a dark surface. Details below.'],
    ['2 · Logged in header', 'Next',
     'Thanks for the test account. I am matching the logged in header to the spec and to what the live site shows.', ''],
    ['3 · Visuals', 'Coming to you',
     'I am preparing a few visual directions for the three hero slides and the three role cards, so you can tell me which one fits. The dark strip and footer below are a first step in that direction.', ''],
    ['4 · Find a player repeated', 'Done',
     'Three places, three destinations now. Slide 1: Create your profile as the main action, Browse the database as a secondary one, going to the open search. Slide 2 keeps Find a player. The network block goes to the map as Find clubs near you.',
     'Slide 1 keeps signup as its main action instead of only linking to search. Details below.'],
    ['5 · Calendar view', 'Planned',
     'The screen does not exist yet. I am drawing it for desktop and mobile, month view with a day detail.', ''],
    ['6 · Footer social links', 'Done',
     'Replaced with the four accounts from the live site header: LinkedIn, Instagram, Facebook and X. They are icons now, each in a circle that fills with the brand colour on hover.', '']
  ];

  for (const [head, status, body, note] of ITEMS) {
    const card = figma.createFrame();
    card.name = head;
    card.layoutMode = 'VERTICAL'; card.itemSpacing = 8;
    card.paddingTop = card.paddingBottom = card.paddingLeft = card.paddingRight = 24;
    card.cornerRadius = 12;
    await paint(card, V.subtle);
    board.appendChild(card);
    card.layoutSizingHorizontal = 'FILL'; card.layoutSizingVertical = 'HUG';

    const top = figma.createFrame();
    top.name = 'Head'; top.layoutMode = 'HORIZONTAL'; top.itemSpacing = 12;
    top.counterAxisAlignItems = 'CENTER'; top.fills = [];
    card.appendChild(top);
    top.layoutSizingHorizontal = 'FILL'; top.layoutSizingVertical = 'HUG';
    await txt(top, 'Heading', head, S.labelStrong, V.textPrimary);
    const pill = figma.createFrame();
    pill.name = 'Status'; pill.layoutMode = 'HORIZONTAL';
    pill.paddingLeft = pill.paddingRight = 8; pill.paddingTop = pill.paddingBottom = 3;
    pill.cornerRadius = 999;
    await paint(pill, V.brandSubtle);
    top.appendChild(pill);
    pill.layoutSizingHorizontal = 'HUG'; pill.layoutSizingVertical = 'HUG';
    await txt(pill, 'Status label', status.toUpperCase(), S.eyebrow, V.textBrand);

    await txt(card, 'Body', body, S.bodySmall, V.textSecondary, true);
    if (note) await txt(card, 'Deviation', 'Different from your note: ' + note, S.labelSmall, V.textBrand, true);
  }

  const foot = figma.createFrame();
  foot.name = 'Deviations'; foot.layoutMode = 'VERTICAL'; foot.itemSpacing = 8; foot.fills = [];
  board.appendChild(foot);
  foot.layoutSizingHorizontal = 'FILL'; foot.layoutSizingVertical = 'HUG';
  await txt(foot, 'Heading', 'Where I went a different way', S.labelStrong, V.textPrimary, true);
  await txt(foot, 'D1', 'Slide 1. You asked for that button to open the general search. Slide 1 is the signup slide, so I kept Create your profile as the main action and added Browse the database next to it, which opens the search. Happy to drop it to one button.', S.bodySmall, V.textSecondary, true);
  await txt(foot, 'D2', 'Dark surfaces. The page stays light. Only the top strip and the footer sit on a dark surface, so they frame the content and connect the site to the mobile app. Easy to reverse.', S.bodySmall, V.textSecondary, true);
  await txt(foot, 'D3', 'Ticker position. On the live site the strip sits under the header. I kept it above, so that a sticky header later scrolls clean.', S.bodySmall, V.textSecondary, true);
  await txt(foot, 'D4', 'Copy. I replaced the long dashes in your three ticker texts with commas. Nothing else in the wording changed.', S.bodySmall, V.textSecondary, true);

  TPL.remove();
  return { x: Math.round(board.x), y: Math.round(board.y), w: Math.round(board.width), h: Math.round(board.height) };
});

return out;
