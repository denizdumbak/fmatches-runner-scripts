// step 134 · Start here kartlari yeni duzene gore (01 ve 02 Web) + Typography altina Kiril yedek font notu (Roboto Condensed) + Barlow stillerinin aciklamasina RU yedegi + genislik olcumu

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const allVars = await figma.variables.getLocalVariablesAsync();
const V = name => { const v = allVars.find(x => x.name === name); if (!v) throw new Error('variable missing: ' + name); return v; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
const TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;

const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
for (const st of ['Regular', 'Medium', 'Semi Bold']) await figma.loadFontAsync({ family: 'Inter', style: st });

const numbered = card => card.children.filter(n => n.type === 'TEXT' && /^\d+\.\s/.test(n.characters));
function rewrite(card, lines) {
  const items = numbered(card);
  if (!items.length) throw new Error('no numbered items in ' + card.name);
  const tpl = items[0];
  for (let i = 0; i < lines.length; i++) {
    const t = tpl.clone();
    card.appendChild(t);
    const txt = (i + 1) + '.  ' + lines[i];
    t.characters = txt;
    t.name = txt.slice(0, 40);
  }
  for (const o of items) o.remove();
}

// ---------- 1. Measure: Barlow Latin vs Roboto Condensed Cyrillic ----------
let widerPct = null;
await step('measure widths', async () => {
  async function w(family, style, str) {
    await figma.loadFontAsync({ family, style });
    const t = figma.createText();
    try { t.fontName = { family, style }; t.fontSize = 100; t.characters = str; t.textAutoResize = 'WIDTH_AND_HEIGHT'; return Math.round(t.width); }
    finally { t.remove(); }
  }
  const lat = ['KOWALCZYK-BRUN', 'MARSH', 'VAN DER WESTHUIZEN'];
  const cyr = ['КОВАЛЬЧИК-БРУН', 'МАРШ', 'АРХАНГЕЛЬСКИЙ'];
  const m = { barlowLatin: [], robotoLatin: [], robotoCyr: [], sofiaCyr: [] };
  for (const s of lat) { m.barlowLatin.push(await w('Barlow Condensed', 'SemiBold', s)); m.robotoLatin.push(await w('Roboto Condensed', 'SemiBold', s)); }
  for (const s of cyr) { m.robotoCyr.push(await w('Roboto Condensed', 'SemiBold', s)); m.sofiaCyr.push(await w('Sofia Sans Condensed', 'SemiBold', s)); }
  // per-letter width, SemiBold 100 px
  const per = (arr, strs) => arr.reduce((a, v, i) => a + v / strs[i].length, 0) / arr.length;
  const b = per(m.barlowLatin, lat), rl = per(m.robotoLatin, lat), rc = per(m.robotoCyr, cyr), sc = per(m.sofiaCyr, cyr);
  widerPct = Math.round((rc / b - 1) * 100);
  report.info.widths = m;
  report.info.perLetter = { barlowLatin: b.toFixed(1), robotoLatin: rl.toFixed(1), robotoCyrillic: rc.toFixed(1), sofiaCyrillic: sc.toFixed(1), robotoCyrVsBarlowPct: widerPct };
});

// ---------- 2. Typography note on page 01 ----------
await step('typography note', async () => {
  const typo = p01.findOne(n => n.name === 'Section · Typography' && n.type === 'FRAME');
  if (!typo) throw new Error('Section · Typography not found');
  let note = typo.children.find(n => n.name === 'Note · Cyrillic fallback');
  if (!note) { note = figma.createText(); typo.insertChild(1, note); note.name = 'Note · Cyrillic fallback'; }
  const wider = widerPct !== null && widerPct > 2
    ? ` Cyrillic in Roboto Condensed runs about ${widerPct}% wider than Latin in Barlow, so check the longest surnames against the size steps.`
    : '';
  note.characters = `For the developer · Russian site: Barlow Condensed has no Cyrillic letters. Switch every Barlow Condensed style (display, headings, names, data) to Roboto Condensed at the same size and weight, for the whole text rather than letter by letter, so names and figures stay in one font. Inter covers Cyrillic and stays.` + wider;
  await note.setTextStyleIdAsync(TS['Label/Small'].id);
  note.fills = [P(V('color/text/warning'))];
  note.layoutSizingHorizontal = 'FIXED';
  note.resize(760, note.height);
  note.textAutoResize = 'HEIGHT';
});

// ---------- 3. Barlow style descriptions ----------
await step('style descriptions', async () => {
  let changed = 0;
  for (const s of Object.values(TS)) {
    if (s.fontName.family !== 'Barlow Condensed') continue;
    if (s.description && s.description.indexOf('Roboto Condensed') !== -1) continue;
    s.description = (s.description ? s.description + ' ' : '') + 'Russian: Roboto Condensed, same size and weight.';
    changed++;
  }
  report.info.descriptionsChanged = changed;
});

// ---------- 4. Start here on page 01 ----------
await step('start here 01', async () => {
  const card = p01.findOne(n => n.name === 'Start here' && n.type === 'FRAME');
  if (!card) throw new Error('Start here 01 not found');
  rewrite(card, [
    `Left: the foundations. Colours, type, spacing, radius and shadows, all saved as variables and styles.`,
    `Right: every component, grouped by where it appears: Navigation, Buttons & tags, Player profile, Home page. The boards next to a component show its states and who sees each one.`,
    `Select a component to read its description in the right panel.`,
    `Archive · not used, at the far right, holds early components the final designs do not use.`,
    `Russian site: Barlow Condensed has no Cyrillic, so its styles switch to Roboto Condensed. See the yellow note under Typography.`
  ]);
  report.info.startHere01 = Math.round(card.height);
});

// ---------- 5. Start here cards on page 02 (Web) ----------
await step('start here 02', async () => {
  const web = p02.findOne(n => n.type === 'SECTION' && n.name === 'Web');
  const mob = p02.findOne(n => n.type === 'SECTION' && n.name === 'Mobile');
  if (!web || !mob) throw new Error('Web or Mobile section missing');
  const cards = web.children.filter(n => n.name === 'Start here');
  const hasTitle = (c, t) => c.children.some(k => k.type === 'TEXT' && k.characters === t);
  const home = cards.find(c => hasTitle(c, 'Home page'));
  const prof = cards.find(c => hasTitle(c, 'Player profile'));
  if (!home || !prof) throw new Error('home or profile card missing');

  const hdrBoard = p01.findOne(n => n.type !== 'TEXT' && n.type !== 'INSTANCE' && /header.*account/i.test(n.name));
  const actBoard = p01.findOne(n => n.type !== 'TEXT' && n.type !== 'INSTANCE' && /profile actions.*state/i.test(n.name));
  report.info.boards = { header: hdrBoard ? hdrBoard.name : null, actions: actBoard ? actBoard.name : null };

  const oldBottom = Math.max(...cards.map(c => c.y + c.height));

  rewrite(home, [
    `Web (1440) is on the left, Mobile (390) on the right. Both follow the same layout.`,
    `The top row is the home page flow: slide 1, then hero slides 2 and 3 as full pages. The calendar view sits below slide 1.`,
    `Press ▶ (top right) and pick a flow, for example "Web · Home". The hero tabs switch slides, event rows react on hover and the List / Calendar switch opens the calendar view.`,
    `Blue frames and arrows show what is clicked and where it leads. Yellow notes mark placeholders, for example the figures, which are sample numbers.`,
    `Styles and components are on page 01.` + (hdrBoard ? ` The logged-in header and account menu: section 1 · Navigation, board "${hdrBoard.name}".` : '')
  ]);

  rewrite(prof, [
    `The player profile as a signed-in manager sees it. Next to it, the same profile before the player joins: a silhouette instead of a photo, no links, no About and no messaging, only shortlisting.`,
    `Below the profile: test states for long names, two nationalities, a missing weight, few or many links, an empty About and long achievements. A dashed arrow marks a data state, not a click.`,
    `Press ▶ and pick "Web · Player profile". "Show more" in About and "+N" under a career entry open in place. On mobile, the action bar stays at the bottom while the page scrolls.`,
    (actBoard ? `Which buttons each type of visitor sees: page 01, section 3 · Player profile, board "${actBoard.name}". ` : '') + `Yellow notes are for developers and can be skipped on a first look.`
  ]);

  const newBottom = Math.max(...cards.map(c => c.y + c.height));
  const below = web.children.filter(n => cards.indexOf(n) === -1 && n.y >= oldBottom - 1);
  const firstBelow = below.length ? Math.min(...below.map(n => n.y)) : Infinity;
  const need = Math.ceil(newBottom + 80 - firstBelow);
  report.info.cards = { home: Math.round(home.height), profile: Math.round(prof.height), oldBottom: Math.round(oldBottom), newBottom: Math.round(newBottom), firstBelow: Math.round(firstBelow), pushed: need > 0 ? need : 0 };

  if (need > 0 && isFinite(firstBelow)) {
    const thresholdAbs = web.absoluteBoundingBox.y + firstBelow - 1;
    for (const n of below) n.y += need;
    let movedMobile = 0;
    for (const n of mob.children) { const b = n.absoluteBoundingBox; if (b && b.y >= thresholdAbs) { n.y += need; movedMobile++; } }
    web.resizeWithoutConstraints(web.width, web.height + need);
    mob.resizeWithoutConstraints(mob.width, mob.height + need);
    report.info.moved = { web: below.length, mobile: movedMobile };
  }
});

return report;
