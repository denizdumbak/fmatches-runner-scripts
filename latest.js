// step 298 · Mobile Shortlists · Key facts kolonlarını içerikten ölç: Age ve Contract until sabit (doğal genişlik), Nationality kalanı alır, kısaltma geri alınır
const report = { done: [], errors: [], fixes: [] };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const page = figma.root.children.find(p => /^02/.test(p.name));
await page.loadAsync();
const BB = n => n.absoluteBoundingBox;
const R = n => Math.round(n);
const rightOver = (n, p) => R(BB(n).x + BB(n).width - (BB(p).x + BB(p).width));
await step('G4b Shortlists kolonları', async () => {
  const sec = page.children.find(n => n.type === 'SECTION' && n.name === 'Mobile').children.find(n => n.type === 'SECTION' && n.name === 'Shortlists');
  const s = sec.children.find(c => c.type === 'FRAME' && c.name === 'Shortlists / Shortlists · Mobile');
  const kfs = s.findAll(n => n.name === 'Key facts' && n.visible !== false);
  const kind = f => { const l = f.findOne(n => n.type === 'TEXT' && n.name === 'Label'); const t = l ? l.characters : ''; return /^age/i.test(t) ? 'age' : /contract/i.test(t) ? 'contract' : /national/i.test(t) ? 'nat' : '?'; };
  const colW = { age: 0, contract: 0 };
  // 1) doğal genişlikleri ölç
  for (const kf of kfs) for (const f of kf.children) {
    const k = kind(f); if (k !== 'age' && k !== 'contract') continue;
    const lab = f.findOne(n => n.type === 'TEXT' && n.name === 'Label'), v = f.findOne(n => n.name === 'Value');
    lab.textAutoResize = 'WIDTH_AND_HEIGHT';
    colW[k] = Math.max(colW[k], Math.ceil(Math.max(lab.width, v.width)));
    lab.textAutoResize = 'HEIGHT'; lab.layoutSizingHorizontal = 'FILL';
  }
  report.fixes.push(`doğal kolon genişlikleri: Age ${colW.age}, Contract until ${colW.contract}`);
  // 2) sabit genişlik + Nationality'yi eski haline getir
  let worstOver = -999, labelWrap = 0;
  for (const kf of kfs) for (const f of kf.children) {
    const k = kind(f);
    if (k === 'age' || k === 'contract') {
      f.layoutSizingHorizontal = 'FIXED'; f.resize(colW[k], f.height); f.layoutSizingVertical = 'HUG';
      const lab = f.findOne(n => n.type === 'TEXT' && n.name === 'Label'); if (lab.height > 18) labelWrap++;
    } else if (k === 'nat') {
      f.layoutSizingHorizontal = 'FILL';
      const v = f.findOne(n => n.name === 'Value'); v.layoutSizingHorizontal = 'HUG';
      const t = v.type === 'TEXT' ? v : v.findOne(x => x.type === 'TEXT');
      t.textTruncation = 'DISABLED'; t.textAutoResize = 'WIDTH_AND_HEIGHT'; t.layoutSizingHorizontal = 'HUG';
    }
  }
  for (const kf of kfs) for (const f of kf.children) if (kind(f) === 'nat') { const v = f.findOne(n => n.name === 'Value'); worstOver = Math.max(worstOver, rightOver(v, f)); }
  const sizes = kfs.slice(0, 2).map(kf => kf.children.map(f => `${kind(f)} ${R(f.width)}`).join(' / ')).join(' ; ');
  const natText = kfs.map(kf => { const f = kf.children.find(x => kind(x) === 'nat'); const t = f.findOne(x => x.type === 'TEXT' && x.name !== 'Label'); return `${t.characters} ${R(t.width)} ${t.textTruncation}`; }).join(' | ');
  report.fixes.push(`kolonlar (ilk 2 satır): ${sizes} · Nationality en büyük sağ taşma ${worstOver} (<=0 olmalı) · etiketi sarılan ${labelWrap} · uyruk metinleri: ${natText}`);
});
return report;
