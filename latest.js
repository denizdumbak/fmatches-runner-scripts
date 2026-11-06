// step 325 · arama sonuçları component'leri (01 › 10 · Contacts & settings altına): Player result (Device x Action x State, 8), Club result (4), Facility result (4). Shortlist row / Contact row varyantlarından türetilir; hover bağlantıları yeniden kurulur.
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = Math.round;
const p01 = figma.root.children.find(p => /^01/.test(p.name));
await p01.loadAsync();
await figma.setCurrentPageAsync(p01);
const pick = re => { let r = null; (function w(n) { if (r) return; if ((n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name)) { r = n; return; } if ('children' in n) for (const k of n.children) w(k); })(p01); return r; };
const variants = s => (s.type === 'COMPONENT_SET' ? s.children : [s]);
async function setText(t, str) { if (!t) throw new Error('metin katmanı yok: ' + str); for (const f of t.getRangeAllFontNames(0, Math.max(t.characters.length, 1))) await figma.loadFontAsync(f); t.characters = str; }
const byName = (root, nm) => root.findOne(n => n.name === nm);
const sec = p01.children.find(n => n.type === 'SECTION' && /Contacts & settings/.test(n.name));
if (!sec) throw new Error('Section 10 · Contacts & settings yok');
const NAMES = ['Player result', 'Club result', 'Facility result'];

// önce eski çalıştırmadan kalanları sil
for (const k of sec.children.slice()) if (NAMES.indexOf(k.name) >= 0) k.remove();
for (const k of p01.children.slice()) if (k.type === 'COMPONENT' && /^(Device=.*Action=|Device=.*Kind=Result)/.test(k.name)) k.remove();

let cursor = 0;
for (const k of sec.children) cursor = Math.max(cursor, k.y + k.height);
cursor += 120;

const starSet = pick(/^Icon button$/);
const starV = variants(starSet).find(v => /Icon=Star/.test(v.name) && /State=Default/.test(v.name));
const crestSet = pick(/^Club crest$/);
const crestV = crestSet ? variants(crestSet)[0] : null;
report.info.parts = { star: !!starV, crest: !!crestV };

async function assemble(setName, specs) {
  // specs: [{ src, name, edit(clone) }]
  const clones = [];
  for (const s of specs) {
    const c = s.src.clone(); sec.appendChild(c); c.name = s.name;
    await s.edit(c);
    clones.push({ c, device: /Device=Mobile/.test(s.name) ? 1 : 0 });
  }
  // ızgara: sütun = Device, sıra = diğer varyantlar
  const rows = {}; let ri = 0;
  const rowKey = n => n.replace(/Device=\w+,?\s*/, '');
  const keys = []; for (const x of clones) { const k = rowKey(x.c.name); if (keys.indexOf(k) < 0) keys.push(k); }
  let y = 0;
  for (const k of keys) {
    const grp = clones.filter(x => rowKey(x.c.name) === k);
    let h = 0;
    for (const x of grp) { x.c.x = 80 + x.device * 1140; x.c.y = cursor + y; h = Math.max(h, x.c.height); }
    y += h + 40;
  }
  const set = figma.combineAsVariants(clones.map(x => x.c), sec);
  set.name = setName; set.x = 80; set.y = cursor;
  // hover bağlantıları
  for (const v of set.children) {
    if (!/State=Default/.test(v.name)) continue;
    const hv = set.children.find(h => h.name === v.name.replace('State=Default', 'State=Hover'));
    if (!hv) continue;
    await v.setReactionsAsync([{ trigger: { type: 'ON_HOVER' }, actions: [{ type: 'NODE', destinationId: hv.id, navigation: 'CHANGE_TO', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.15 }, preserveScrollPosition: false, resetVideoPosition: false }] }]);
  }
  cursor += set.height + 120;
  return set;
}

// 1) Player result
await step('player result', async () => {
  const src = pick(/^Shortlist row$/);
  const specs = [];
  for (const v of src.children) {
    const dev = /Device=Mobile/.test(v.name) ? 'Mobile' : 'Desktop';
    const st = /State=Hover/.test(v.name) ? 'Hover' : 'Default';
    for (const act of ['Message', 'Add to contacts']) {
      specs.push({ src: v, name: `Device=${dev}, Action=${act}, State=${st}`, edit: async c => {
        const actions = byName(c, 'Actions');
        const msg = byName(actions, 'Button · Message'), rem = byName(actions, 'Button · Remove');
        if (act === 'Message') { if (rem) rem.remove(); }
        else {
          if (msg) msg.remove();
          if (rem) { await setText(rem.findOne(n => n.type === 'TEXT' && n.name === 'Label'), 'Add to contacts'); rem.name = 'Button · Add to contacts'; }
        }
        if (starV) { const st2 = starV.createInstance(); actions.appendChild(st2); st2.name = 'Icon button · Shortlist'; }
      } });
    }
  }
  const set = await assemble('Player result', specs);
  report.info.playerResult = set.children.map(v => `${v.name} ${R(v.width)}x${R(v.height)} actions: ${byName(v, 'Actions').children.map(a => a.name).join(' | ')}`);
});

// 2) Club result ve 3) Facility result (Contact row Connected)
async function resultFromContact(setName, kind) {
  const src = pick(/^Contact row$/);
  const specs = [];
  const base = src.children.filter(v => /Kind=Connected/.test(v.name));
  let img = null;
  if (kind === 'facility') { img = await figma.createImageAsync('https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/img/facility/stadium-aerial-v1.jpg'); }
  for (const v of base) {
    const dev = /Device=Mobile/.test(v.name) ? 'Mobile' : 'Desktop';
    const st = /State=Hover/.test(v.name) ? 'Hover' : 'Default';
    specs.push({ src: v, name: `Device=${dev}, State=${st}`, edit: async c => {
      const photo = byName(c, 'Photo');
      const sil = photo.findOne(n => n.type === 'INSTANCE' && /Silhouette/.test(n.name)); if (sil) sil.remove();
      if (kind === 'club') {
        if (!crestV) throw new Error('Club crest yok');
        const cr = crestV.createInstance(); photo.appendChild(cr);
        if (photo.layoutMode === 'NONE') { cr.x = (photo.width - cr.width) / 2; cr.y = (photo.height - cr.height) / 2; }
        cr.name = 'Club crest';
        await setText(byName(c, 'Name'), 'Riverside FC'); await setText(byName(c, 'Meta'), 'England · Third Division');
      } else {
        photo.fills = [{ type: 'IMAGE', imageHash: img.hash, scaleMode: 'FILL' }];
        await setText(byName(c, 'Name'), 'Riverside Park'); await setText(byName(c, 'Meta'), 'Riverside, England · Natural grass · 4,200');
      }
      const actions = byName(c, 'Actions');
      const msg = byName(actions, 'Button · Message'); if (!msg) throw new Error('Button · Message yok');
      await setText(msg.findOne(n => n.type === 'TEXT' && n.name === 'Label'), kind === 'club' ? 'View club' : 'View stadium');
      msg.name = kind === 'club' ? 'Button · View club' : 'Button · View stadium';
      const more = byName(actions, 'Icon button · More'); if (more) more.remove();
    } });
  }
  const set = await assemble(setName, specs);
  report.info[setName] = set.children.map(v => `${v.name} ${R(v.width)}x${R(v.height)} actions: ${byName(v, 'Actions').children.map(a => a.name).join(' | ')}`);
}
await step('club result', () => resultFromContact('Club result', 'club'));
await step('facility result', () => resultFromContact('Facility result', 'facility'));

// kontrol ve Section boyutu
await step('check', async () => {
  let r = 0, b = 0; for (const k of sec.children) { r = Math.max(r, k.x + k.width); b = Math.max(b, k.y + k.height); }
  sec.resizeWithoutConstraints(Math.max(sec.width, r + 80), b + 80);
  const out = [];
  for (const nm of NAMES) {
    const s = sec.children.find(k => k.name === nm); if (!s) { out.push(nm + ': YOK'); continue; }
    const un = s.findAll(n => n.type === 'TEXT' && !(typeof n.textStyleId === 'string' && n.textStyleId)).length;
    const gray = s.findAll(n => { try { return Array.isArray(n.fills) && n.fills.some(f => f.type === 'SOLID' && !(f.boundVariables && f.boundVariables.color) && Math.abs(f.color.r - 0.5) < 0.01 && Math.abs(f.color.g - 0.5) < 0.01); } catch (e) { return false; } }).length;
    const over = [];
    for (const v of s.children) for (const n of v.findAll(x => x.visible !== false && x.type !== 'VECTOR')) { const p = n.parent; if (!p || p === v || p.type === 'INSTANCE' || n.layoutPositioning === 'ABSOLUTE' || p.type !== 'FRAME') continue; const a = n.absoluteBoundingBox, bb = p.absoluteBoundingBox; if (a && bb && a.x + a.width > bb.x + bb.width + 0.5) over.push(`${v.name} :: ${p.name} > ${n.name}`); }
    out.push(`${nm}: n${s.children.length} ${R(s.width)}x${R(s.height)} at ${R(s.x)},${R(s.y)} unstyled ${un} grayFills ${gray} overflow ${over.length ? over.slice(0, 4).join('; ') : 'none'}`);
  }
  const sb = sec.absoluteBoundingBox, ov = [];
  for (const s of p01.children) if (s !== sec && s.type === 'SECTION') { const c = s.absoluteBoundingBox; if (sb.x < c.x + c.width && c.x < sb.x + sb.width && sb.y < c.y + c.height && c.y < sb.y + sb.height) ov.push(s.name); }
  report.info.check = out; report.info.section = `${R(sec.width)}x${R(sec.height)} overlaps ${ov.length ? ov.join(',') : 'none'}`;
});
await step('view', async () => { const s = sec.children.find(k => k.name === 'Player result'); if (s) { figma.currentPage.selection = [s]; figma.viewport.scrollAndZoomIntoView([s]); } });

return report;
