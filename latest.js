// step 324 · arama sonuçları (19) için SALT OKUNUR inspect: mevcut arama alanları, satır/kart component'leri (Person row, Contact row, Shortlist row, Club strip, Event row, Filter chip, Tabs...), Shortlists ve Map panel yapısı, Web/Mobile Section sonu. Hiçbir şey değiştirilmez.
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = Math.round;
const num = v => (typeof v === 'number' ? R(v) : '?');
const str = v => (typeof v === 'string' ? v : '?');
const p01 = figma.root.children.find(p => /^01/.test(p.name));
const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const sub = (plat, re) => plat.children.find(n => n.type === 'SECTION' && re.test(n.name));
const frameIn = (sec, re) => sec && sec.children.find(n => n.type === 'FRAME' && re.test(n.name));
function line(n, d) {
  let s = '';
  try { s = `${'  '.repeat(d)}${n.type[0]}${n.type === 'INSTANCE' ? 'I' : ''} ${n.name} ${num(n.width)}x${num(n.height)}`; } catch (e) { return '?'; }
  try { if (n.layoutMode && n.layoutMode !== 'NONE') s += ` ${n.layoutMode[0]} gap${num(n.itemSpacing)}`; } catch (e) {}
  try { if (n.layoutPositioning === 'ABSOLUTE') s += ' ABS'; } catch (e) {}
  try { if (n.type === 'TEXT') s += ` "${String(n.characters).slice(0, 40)}" ${typeof n.textStyleId === 'string' && n.textStyleId ? 'styled' : 'UNSTYLED'}`; } catch (e) {}
  try { if (n.visible === false) s += ' HIDDEN'; } catch (e) {}
  return s;
}
function dump(n, d, max, out) { if (d > max) return; out.push(line(n, d)); if ('children' in n && n.type !== 'INSTANCE' || (n.type === 'INSTANCE' && d < max)) { try { for (const k of n.children) dump(k, d + 1, max, out); } catch (e) {} } }
const setsIn = (root, re) => { const r = []; (function w(n) { if ((n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && re.test(n.name)) { r.push(n); return; } if ('children' in n) for (const k of n.children) w(k); })(root); return r; };

// 1) arama izleri: katman adı ya da metin "search" / "find" içerenler (02 ve 01)
await step('search traces', async () => {
  const hits = {};
  for (const [label, root] of [['01', p01], ['02', p02]]) {
    const found = root.findAll(n => { try { if (n.type === 'TEXT') return /search|find /i.test(n.characters); return /search/i.test(n.name); } catch (e) { return false; } });
    const g = {};
    for (const n of found) {
      let top = n; while (top.parent && top.parent.type !== 'PAGE' && top.parent.type !== 'SECTION') top = top.parent;
      let key = `${n.type} ${n.name}${n.type === 'TEXT' ? ' "' + String(n.characters).slice(0, 36) + '"' : ''}`;
      const ctx = top && top.parent && top.parent.type === 'SECTION' ? top.parent.name : (top ? top.name : '');
      g[key] = g[key] || { n: 0, ctx: {} }; g[key].n++; g[key].ctx[ctx] = 1;
    }
    hits[label] = Object.keys(g).slice(0, 40).map(k => `${k} x${g[k].n} in ${Object.keys(g[k].ctx).slice(0, 3).join('|')}`);
  }
  report.info.searchTraces = hits;
});

// 2) component'ler: ad, tür, varyant sayısı, boyutlar, varyant özellikleri
await step('components', async () => {
  const names = /^(Person row|Contact row|Shortlist row|Club strip|Event row|Filter chip|Tabs?|Tab|Form field|Map type switcher|Map panel|Empty card|Option list|Tag|Chat list item|Application status|Page notice|Section header|List card|Heading row|Verification badge|Key fact|Icon button|Facility.*|Map card)$/i;
  const out = [];
  for (const c of setsIn(p01, names)) {
    let props = '';
    try { if (c.type === 'COMPONENT_SET') props = Object.keys(c.componentPropertyDefinitions).slice(0, 8).map(k => k.split('#')[0] + '=' + (c.componentPropertyDefinitions[k].variantOptions || [c.componentPropertyDefinitions[k].type]).slice(0, 5).join('/')).join(' · '); } catch (e) {}
    const kids = c.type === 'COMPONENT_SET' ? c.children : [c];
    const sizes = {}; kids.forEach(k => { const key = `${num(k.width)}x${num(k.height)}`; sizes[key] = (sizes[key] || 0) + 1; });
    out.push(`${c.type === 'COMPONENT_SET' ? 'SET' : 'COMP'} ${c.name} [${c.parent ? c.parent.name : '?'}] n${kids.length} sizes ${JSON.stringify(sizes)} ${props}`);
  }
  report.info.components = out;
});

// 3) satır component'lerinin iç yapısı (ilk varyant)
await step('row structure', async () => {
  const out = {};
  for (const nm of ['Person row', 'Contact row', 'Shortlist row', 'Club strip', 'Event row', 'Chat list item']) {
    const c = setsIn(p01, new RegExp('^' + nm + '$', 'i'))[0]; if (!c) { out[nm] = 'YOK'; continue; }
    const v = c.type === 'COMPONENT_SET' ? (c.children.find(k => /Desktop/.test(k.name)) || c.children[0]) : c;
    const lines = []; dump(v, 0, 4, lines); out[nm] = [v.name].concat(lines.slice(0, 26));
  }
  report.info.rows = out;
});

// 4) Shortlists sayfası (kalıp) ve Map panel arama alanı
await step('shortlists page', async () => {
  const sec = sub(web, /^Shortlists$/); const fr = frameIn(sec, /^Shortlists \/ Shortlists/);
  if (!fr) { report.info.shortlists = 'YOK'; return; }
  const lines = []; dump(fr, 0, 4, lines); report.info.shortlists = [fr.name, `section ${sec.name} ${num(sec.x)},${num(sec.y)} ${num(sec.width)}x${num(sec.height)}`].concat(lines.slice(0, 40));
});
await step('map panel search', async () => {
  const sec = sub(web, /^Map$/); const fr = frameIn(sec, /^Map \/ Clubs/) || (sec && sec.children.find(n => n.type === 'FRAME'));
  if (!fr) { report.info.mapPanel = 'YOK'; return; }
  const panel = fr.findOne(n => n.name === 'Map panel');
  const lines = []; if (panel) dump(panel, 0, 3, lines); report.info.mapPanel = [fr.name].concat(lines.slice(0, 24));
});
await step('header + home search', async () => {
  const sec = sub(web, /^Home page$/); const fr = sec && sec.children.find(n => n.type === 'FRAME');
  if (!fr) { report.info.home = 'YOK'; return; }
  const nav = fr.findOne(n => n.name === 'Navigation'); const lines = []; if (nav) dump(nav, 0, 3, lines);
  report.info.home = [fr.name].concat(lines.slice(0, 22));
});

// 5) Web / Mobile Section'lar: sıra, konum, boyut (yeni Search results Section'ının yeri için)
await step('sections', async () => {
  const f = plat => plat.children.filter(n => n.type === 'SECTION').sort((a, b) => a.y - b.y).map(s => `${s.name} ${num(s.x)},${num(s.y)} ${num(s.width)}x${num(s.height)} (${s.children.length})`);
  report.info.webSections = f(web); report.info.mobSections = f(mob);
  report.info.platform = `Web ${num(web.width)}x${num(web.height)} · Mobile ${num(mob.x)},${num(mob.y)} ${num(mob.width)}x${num(mob.height)}`;
});

// 6) Ek: Account menu / kişi satırlarında kullanılan Person row örneği, boş durum, filtre çipi örneği sayfada
await step('chips and tabs on pages', async () => {
  const sec = sub(web, /^Shortlists$/); const fr = frameIn(sec, /^Shortlists \/ Shortlists/);
  if (!fr) return;
  const chips = fr.findAll(n => n.type === 'INSTANCE' && /Filter chip/i.test(n.name)).slice(0, 3).map(n => line(n, 0));
  const tabs = fr.findAll(n => /^Tabs$/.test(n.name)).map(n => line(n, 0));
  report.info.shortlistChips = { chips, tabs };
});

return report;
