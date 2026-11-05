// step 312 · Mobile Profiles · player ve Own profile'daki stilsiz metinleri (First name, Player category) 310'daki gibi en yakın stile bağla · sonra stilsiz metin ve ekran çakışması kontrolü
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = Math.round;
const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p02.loadAsync();
const styles = await figma.getLocalTextStylesAsync();
const screens = [];
for (const plat of p02.children.filter(n => n.type === 'SECTION')) for (const sec of plat.children.filter(n => n.type === 'SECTION'))
  for (const s of sec.children) if (s.type === 'FRAME' && !/^Flow ·/.test(s.name)) screens.push({ plat: plat.name, sec: sec.name, secNode: sec, s });
report.info.screens = screens.length;
const inInstance = n => { let x = n.parent; while (x && x.type !== 'PAGE') { if (x.type === 'INSTANCE') return x; x = x.parent; } return null; };
const where = (x, n) => `${x.plat} › ${x.sec} › ${x.s.name} › "${n.characters.slice(0, 24)}"`;
function texts(root) { const out = []; (function w(n) { if (n.visible === false) return; if (n.type === 'TEXT') out.push(n); if ('children' in n) for (const k of n.children) w(k); })(root); return out; }
async function loadFonts(n) { const f = n.getRangeAllFontNames(0, n.characters.length); for (const x of f) await figma.loadFontAsync(x); }


await step('B mobile player and own profile: bind unstyled text', async () => {
  const bound = [], left = [];
  for (const x of screens) {
    if (x.plat !== 'Mobile' || !/^(Profiles · player|Own profile)/.test(x.sec)) continue;
    for (const n of texts(x.s)) {
      if (n.textStyleId && n.textStyleId !== figma.mixed && n.textStyleId !== '') continue;
      if (n.fontName === figma.mixed || n.fontSize === figma.mixed) { left.push(`karışık: ${where(x, n)}`); continue; }
      const fam = n.fontName.family, fst = n.fontName.style, fs = n.fontSize;
      const cands = styles.filter(s => s.fontName.family === fam);
      if (!cands.length) { left.push(`stil yok (${fam}): ${where(x, n)}`); continue; }
      cands.sort((a, b) => (Math.abs(a.fontSize - fs) * 10 + (a.fontName.style === fst ? 0 : 5)) - (Math.abs(b.fontSize - fs) * 10 + (b.fontName.style === fst ? 0 : 5)));
      const st = cands[0];
      const before = `${fam} ${fst} ${fs}`;
      await figma.loadFontAsync(n.fontName); await figma.loadFontAsync(st.fontName);
      await n.setTextStyleIdAsync(st.id);
      bound.push(`${where(x, n)}: ${before} -> ${st.name} (${st.fontName.style} ${st.fontSize})`);
    }
  }
  report.info.bound = bound.length ? bound : 'none';
  report.info.notBound = left.length ? left : 'none';
});

await step('C check', async () => {
  const un = new Map();
  for (const x of screens) for (const n of texts(x.s)) if (!n.textStyleId || n.textStyleId === '') { const k = `${x.plat} › ${x.sec}`; un.set(k, (un.get(k) || 0) + 1); }
  report.info.unstyledText02 = un.size ? [...un.entries()].map(([k, v]) => `${v}x ${k}`) : 'none';
  const ov = [], out = [];
  const bySec = new Map();
  for (const x of screens) { const a = bySec.get(x.secNode) || []; a.push(x.s); bySec.set(x.secNode, a); }
  for (const [sec, fr] of bySec) {
    const sb = sec.absoluteBoundingBox;
    for (let i = 0; i < fr.length; i++) {
      const a = fr[i].absoluteBoundingBox;
      if (a.y + a.height > sb.y + sb.height + 0.5 || a.x + a.width > sb.x + sb.width + 0.5) out.push(`${sec.name} › ${fr[i].name}`);
      for (let j = i + 1; j < fr.length; j++) { const b = fr[j].absoluteBoundingBox;
        if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov.push(`${sec.name}: ${fr[i].name} × ${fr[j].name}`); }
    }
  }
  report.info.screenOverlaps = ov.length ? ov : 'none';
  report.info.outsideSection = out.length ? out : 'none';
});
return report;
