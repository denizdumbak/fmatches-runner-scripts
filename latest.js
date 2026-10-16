// step 118 · Kilo: Height kutusu "Height / Weight · 178 cm · 74 kg"; kilo yoksa sadece "Height" (Mateus); masaustu tasma kontrolu

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }

const p2 = pageOf(/^02/); await p2.loadAsync();

// Leo: kilo var · Mateus: kilo bos (bos durum testi) · Pieter: kilo var
const DATA = {
  leo: { label: 'Height / Weight', value: '178 cm · 74 kg' },
  mateus: { label: 'Height', value: '181 cm' },
  pieter: { label: 'Height / Weight', value: '186 cm · 81 kg' }
};
const who = name => /Name length 9/.test(name) ? 'mateus' : (/Name length 15/.test(name) ? 'pieter' : 'leo');
const frames = p2.findAll(n => n.type === 'FRAME' && /^Profiles \/ Player/.test(n.name) && n.parent && n.parent.type === 'SECTION');

await step('Height kutusu', async () => {
  const out = [];
  for (const f of frames) {
    const fact = f.findOne(n => n.type === 'INSTANCE' && n.name === 'Fact · Height');
    if (!fact) { out.push(f.name + ': Fact · Height yok'); continue; }
    const d = DATA[who(f.name)];
    const label = fact.findOne(n => n.type === 'TEXT' && n.name === 'Label');
    const value = fact.findOne(n => n.type === 'TEXT' && n.name === 'Value');
    await loadFonts(label); label.characters = d.label;
    await loadFonts(value); value.characters = d.value;
    out.push(f.name + ': ' + d.label + ' = ' + d.value + ' · kutu ' + Math.round(fact.width));
  }
  report.info.height = out;
});

await step('masaustu: key facts fotografa degiyor mu', async () => {
  const out = [];
  for (const f of frames.filter(n => / · Desktop$/.test(n.name))) {
    const kf = f.findOne(n => n.type === 'FRAME' && n.name === 'Key facts');
    const fb = f.absoluteBoundingBox;
    const photo = f.findOne(n => n.name === 'Player cut-out');
    const limit = (photo ? photo.absoluteBoundingBox.x - fb.x : 798) - 24;
    const right = () => Math.round(kf.absoluteBoundingBox.x + kf.width - fb.x);
    const before = right();
    if (before > limit) for (const c of kf.children) if (c.type === 'INSTANCE') {
      if (c.paddingLeft === 32) c.paddingLeft = 24;
      if (c.paddingRight === 32) c.paddingRight = 24;
    }
    const after = right();
    out.push(f.name + ': sag kenar ' + before + (after !== before ? ' -> ' + after + ' (bosluk 24)' : '') + ' · sinir ' + Math.round(limit) + (after > limit ? ' · TASIYOR' : ' · ok'));
  }
  report.info.desktopFit = out;
});

return JSON.stringify(report, null, 1);
