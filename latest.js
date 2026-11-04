// step 297 · inspect (salt okunur): Mobile Shortlists · Key facts kolonları (G4 sonrası durum)
const report = { rows: [], errors: [] };
const page = figma.root.children.find(p => /^02/.test(p.name));
await page.loadAsync();
const R = n => Math.round(n);
try {
  const sec = page.children.find(n => n.type === 'SECTION' && n.name === 'Mobile').children.find(n => n.type === 'SECTION' && n.name === 'Shortlists');
  const s = sec.children.find(c => c.type === 'FRAME' && c.name === 'Shortlists / Shortlists · Mobile');
  const kfs = s.findAll(n => n.name === 'Key facts' && n.visible !== false);
  report.count = kfs.length;
  for (const kf of kfs) {
    const owner = (() => { let x = kf.parent; while (x && !/^Player ·/.test(x.name)) x = x.parent; return x ? x.name : '?'; })();
    const facts = kf.children.map(f => {
      const lab = f.findOne(n => n.type === 'TEXT' && n.name === 'Label');
      const v = f.findOne(n => n.name === 'Value');
      const t = v ? (v.type === 'TEXT' ? v : v.findOne(x => x.type === 'TEXT')) : null;
      return `${f.name} ${R(f.width)}px sH=${f.layoutSizingHorizontal} grow=${f.layoutGrow} | label "${lab ? lab.characters : '-'}" ${lab ? R(lab.width) : '-'} | value ${v ? R(v.width) : '-'} sH=${v ? v.layoutSizingHorizontal : '-'} | text "${t ? t.characters : '-'}" ${t ? R(t.width) : '-'} trunc=${t ? t.textTruncation : '-'} auto=${t ? t.textAutoResize : '-'}`;
    });
    report.rows.push(`${owner} · Key facts ${R(kf.width)} gap=${kf.itemSpacing} :: ` + facts.join(' || '));
  }
} catch (e) { report.errors.push(e.message); }
return report;
