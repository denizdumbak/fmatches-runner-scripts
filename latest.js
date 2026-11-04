// step 300 · (0) 'My events' katmanları nerede duruyor (salt okunur) · (1) Mobile Shortlists kolonları: Age / Contract until etiketi + Fact HUG, Nationality FILL · (2) salt okunur: 02 · Website tüm ekranlarda metin-metin çakışması
const report = { done: [], errors: [], fixes: [], textOverlaps: [] };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const page = figma.root.children.find(p => /^02/.test(p.name));
await page.loadAsync();
const BB = n => n.absoluteBoundingBox;
const R = n => Math.round(n);
const rightOver = (n, p) => R(BB(n).x + BB(n).width - (BB(p).x + BB(p).width));

await step('G4c Shortlists kolonları (HUG)', async () => {
  const sec = page.children.find(n => n.type === 'SECTION' && n.name === 'Mobile').children.find(n => n.type === 'SECTION' && n.name === 'Shortlists');
  const s = sec.children.find(c => c.type === 'FRAME' && c.name === 'Shortlists / Shortlists · Mobile');
  const kfs = s.findAll(n => n.name === 'Key facts' && n.visible !== false);
  const kind = f => { const l = f.findOne(n => n.type === 'TEXT' && n.name === 'Label'); const t = l ? l.characters : ''; return /^age/i.test(t) ? 'age' : /contract/i.test(t) ? 'contract' : /national/i.test(t) ? 'nat' : '?'; };
  let worst = -999;
  for (const kf of kfs) {
    for (const f of kf.children) {
      const k = kind(f);
      if (k === 'age' || k === 'contract') {
        const lab = f.findOne(n => n.type === 'TEXT' && n.name === 'Label');
        lab.textAutoResize = 'WIDTH_AND_HEIGHT'; lab.layoutSizingHorizontal = 'HUG';
        f.layoutSizingHorizontal = 'HUG';
      } else if (k === 'nat') f.layoutSizingHorizontal = 'FILL';
    }
    for (const f of kf.children) if (kind(f) === 'nat') { const v = f.findOne(n => n.name === 'Value'); worst = Math.max(worst, rightOver(v, f)); }
  }
  const sizes = kfs.slice(0, 2).map(kf => kf.children.map(f => `${kind(f)} ${R(f.width)}`).join(' / ')).join(' ; ');
  report.fixes.push(`G4c kolonlar (ilk 2 satır): ${sizes} · Nationality en büyük sağ taşma ${worst} (<=0 olmalı)`);
});

// ---------- metin-metin çakışması (salt okunur) ----------
const SKIPSUB = /^(Ticker|Scrim|Lightbox|Badge|Profile menu|Message menu|Thread menu|Account menu|Confirm dialog|Book dialog|Option list|Date picker|Map card|Bottom sheet|Map marker|Map cluster|Map controls|Map panel|Silhouette|Club crest|Hero visual|Preview ·|Stage|Flow ·|Note ·)/;
const SKIPSCR = /(Gallery lightbox|Profile menu|Block person|Delete message|Message menu|Thread menu|Book tournament|Request sent|Account menu|Date picker)/;
const inter = (a, b) => { const x1 = Math.max(a.x, b.x), y1 = Math.max(a.y, b.y), x2 = Math.min(a.x + a.width, b.x + b.width), y2 = Math.min(a.y + a.height, b.y + b.height); return x2 > x1 && y2 > y1 ? { x: x1, y: y1, w: x2 - x1, h: y2 - y1 } : null; };
const groups = new Map();
await step('T text overlaps', async () => {
  for (const plat of page.children.filter(n => n.type === 'SECTION')) for (const sec of plat.children.filter(n => n.type === 'SECTION')) {
    for (const s of sec.children.filter(c => c.type === 'FRAME' && !/^Flow ·/.test(c.name))) {
      if (SKIPSCR.test(s.name)) continue;
      const sb = BB(s), texts = [];
      const walk = (n, clip) => {
        if (n.visible === false || !BB(n) || SKIPSUB.test(n.name)) return;
        let c = clip;
        if (n !== s && n.clipsContent) { c = c ? inter(c, BB(n)) : BB(n); if (!c) return; }
        if (n.type === 'TEXT') { const b = c ? inter(BB(n), c) : BB(n); if (b) texts.push({ b: { x: b.x, y: b.y, width: b.w === undefined ? b.width : b.w, height: b.h === undefined ? b.height : b.h }, t: n.characters.slice(0, 26) }); return; }
        if ('children' in n) for (const k of n.children) walk(k, c);
      };
      for (const k of s.children) walk(k, sb);
      if (texts.length > 700) { report.errors.push('çok metin: ' + s.name); continue; }
      for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
        const a = texts[i], b = texts[j], o = inter(a.b, b.b); if (!o || o.w <= 4 || o.h <= 4) continue;
        const ratio = (o.w * o.h) / Math.min(a.b.width * a.b.height, b.b.width * b.b.height); if (ratio < 0.2) continue;
        const key = `${plat.name} › ${sec.name} :: "${a.t}" x "${b.t}"`;
        const g = groups.get(key) || { n: 0, ex: `${s.name} @ ${R(o.x - sb.x)},${R(o.y - sb.y)} ${R(o.w)}x${R(o.h)}` }; g.n++; groups.set(key, g);
      }
    }
  }
  report.textOverlaps = [...groups.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 60).map(([k, g]) => `${g.n}x ${k} · ${g.ex}`);
  report.textOverlapGroups = groups.size;
});

// ---------- My events katmanları nerede? (salt okunur) ----------
report.myEvents = [];
await step('M My events katman konumu', async () => {
  const chain = n => { const a = []; let x = n.parent; while (x) { a.unshift(`${x.type === 'PAGE' ? 'PAGE' : x.type}:${(x.name || '').slice(0, 24)}`); x = x.parent; } return a.join(' > '); };
  for (const pg of figma.root.children) {
    await pg.loadAsync();
    const hits = pg.findAll(n => /^Events \/ My events/.test(n.name) && (n.type === 'FRAME' || n.type === 'COMPONENT' || n.type === 'GROUP'));
    for (const n of hits) {
      const b = BB(n); const par = n.parent;
      const pb = par && par.type === 'SECTION' ? BB(par) : null;
      const inside = pb ? (b.x >= pb.x && b.y >= pb.y && b.x + b.width <= pb.x + pb.width && b.y + b.height <= pb.y + pb.height) : 'n/a';
      report.myEvents.push(`[${pg.name}] "${n.name}" ${R(b.width)}x${R(b.height)} @${R(b.x)},${R(b.y)} · içinde: ${chain(n)} · ebeveyn sınırı içinde: ${inside}`);
    }
  }
  const web = page.children.find(n => n.type === 'SECTION' && n.name === 'Web'), wb = BB(web);
  report.myEvents.push(`Web Section: @${R(wb.x)},${R(wb.y)} ${R(wb.width)}x${R(wb.height)}`);
  const stray = page.children.filter(n => !(n.type === 'SECTION' && (n.name === 'Web' || n.name === 'Mobile')));
  report.myEvents.push(`02 sayfa kökünde Web/Mobile dışı çocuk sayısı: ${stray.length}` + (stray.length ? ' · ' + stray.slice(0, 12).map(n => `${n.type} "${(n.name || '').slice(0, 30)}" @${R(BB(n).x)},${R(BB(n).y)}`).join(' ; ') : ''));
});
return report;
