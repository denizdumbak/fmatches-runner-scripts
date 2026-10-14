// step 94 · M5 son: mobilde List/Calendar toggle, secili gunde uc farkli etkinlik

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const pageOf = re => figma.root.children.find(p => re.test(p.name));
const pageHome = pageOf(/^02/);
if (pageHome) await pageHome.loadAsync();

const top = nm => pageHome.children.find(n => n.name === nm);
const homeD = top('Home · Desktop'), calD = top('Home · Desktop · calendar view');
const homeM = top('Home · Mobile'), calM = top('Home · Mobile · calendar view');
report.info['frameler'] = [homeD, calD, homeM, calM].map(f => f ? f.name : 'YOK');

const blockOf = f => f && f.findOne(n => /Upcoming events/i.test(n.name) && (n.type === 'FRAME' || n.type === 'INSTANCE'));

// --- 1) mobilde toggle
async function addToggle(mobileFrame, sourceFrame) {
  const block = blockOf(mobileFrame);
  if (!block) throw new Error(mobileFrame.name + ': blok yok');
  const old = block.findOne(n => /View toggle/i.test(n.name));
  if (old) old.remove();
  const srcToggle = blockOf(sourceFrame).findOne(n => /View toggle/i.test(n.name));
  if (!srcToggle) throw new Error(sourceFrame.name + ': kaynak toggle yok');
  const t = srcToggle.clone();
  t.name = 'View toggle';

  // basligi bul: blogun dogrudan cocuklari icinde "Upcoming events" metnini tasiyan
  const kids = block.children;
  let idx = kids.findIndex(k => (k.type === 'TEXT' && /Upcoming events/i.test(k.characters)) ||
                                 (k.findOne && k.findOne(x => x.type === 'TEXT' && /Upcoming events/i.test(x.characters))));
  if (idx < 0) idx = 0;
  block.insertChild(idx + 1, t);
  return t;
}

const toggles = {};
await step('Mobil toggle eklendi', async () => {
  if (!homeM || !calM || !homeD || !calD) throw new Error('frameler eksik');
  toggles.list = await addToggle(homeM, homeD);
  toggles.cal = await addToggle(calM, calD);
  report.info['mobil toggle'] = Math.round(toggles.list.width) + 'x' + Math.round(toggles.list.height);
});

await step('Mobil prototip', async () => {
  const link = async (node, dest) => node.setReactionsAsync([{
    trigger: { type: 'ON_CLICK' },
    actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE',
      transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 },
      preserveScrollPosition: true }]
  }]);
  await link(toggles.list, calM);
  await link(toggles.cal, homeM);
  report.info['prototip'] = 'mobil liste <-> takvim baglandi';
});

// --- 2) secili gunde uc farkli etkinlik
const EVENTS = [
  { name: 'Riverside Autumn Cup', type: 'Tournament', place: 'Riverside, England', dates: '17 – 25 Oct' },
  { name: 'Northgate Athletic open trial', type: 'Trial', place: 'Northgate, England', dates: '17 Oct' },
  { name: 'Harbour City vs Coastal United', type: 'Match', place: 'Harbour City, England', dates: '17 Oct' }
];

async function setText(node, value) {
  if (!node) return false;
  await figma.loadFontAsync(node.fontName === figma.mixed ? node.getRangeFontName(0, 1) : node.fontName);
  node.characters = value;
  return true;
}

async function fillRows(frame) {
  const block = blockOf(frame);
  const sel = block && block.findOne(n => n.name === 'Selected day');
  if (!sel) throw new Error(frame.name + ': Selected day yok');
  const rows = sel.findAll(n => n.type === 'INSTANCE' && /^Event row/.test(n.name));
  const out = [];
  for (let i = 0; i < rows.length && i < EVENTS.length; i++) {
    const e = EVENTS[i], texts = rows[i].findAll(n => n.type === 'TEXT');
    const byText = re => texts.find(t => re.test(t.characters));
    const ok = [
      await setText(byText(/Autumn Cup|Cup|vs|trial/i), e.name),
      await setText(byText(/^(Tournament|Match|Trial|Seminar|Camp)$/), e.type),
      await setText(byText(/England|,/), e.place),
      await setText(byText(/Oct$/), e.dates)
    ];
    out.push(e.name + ' [' + ok.map(x => x ? 'ok' : 'yok').join(',') + ']');
  }
  return out;
}

await step('Masaustu secili gun', async () => { report.info['masaustu satirlar'] = await fillRows(calD); });
await step('Mobil secili gun', async () => { report.info['mobil satirlar'] = await fillRows(calM); });

return report;
