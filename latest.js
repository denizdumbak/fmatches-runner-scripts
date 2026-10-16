// step 131 · INSPECT (salt okunur): profil header/ticker kontrolu, eski Display/Hero stillerinin kullanimi, gizli "No photo · Stage (old, hidden)", kulup seridindeki League country bayraklari. Hicbir sey degismez.

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/), p02 = pageOf(/^02/), p03 = pageOf(/^03/);
for (const p of [p01, p02, p03]) if (p) await p.loadAsync();

function box(n) { const b = n.absoluteBoundingBox; return b ? Math.round(b.x) + ',' + Math.round(b.y) + ' ' + Math.round(b.width) + 'x' + Math.round(b.height) : '-'; }

async function instInfo(n) {
  if (n.type !== 'INSTANCE') return n.type;
  let main = null; try { main = await n.getMainComponentAsync(); } catch (e) {}
  const setName = main && main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent.name : (main ? main.name : '?');
  return 'INSTANCE of ' + setName + ' [' + JSON.stringify(n.variantProperties || {}) + '] main ' + (main ? main.id : '?');
}

// 2 · Profil sayfalarinda header ve ticker, ana sayfa ile karsilastirma
await step('2 header/ticker', async () => {
  const frames = p02.findAll(n => n.type === 'FRAME' && /^(Home \/ Main|Profiles \/ Player)/.test(n.name) && n.parent && n.parent.type === 'SECTION');
  const out = [];
  for (const f of frames) {
    const row = { frame: f.name, section: f.parent.name, top: [] };
    for (const c of f.children.slice(0, 4)) {
      let desc = c.name + ' · ' + await instInfo(c) + (c.visible ? '' : ' HIDDEN');
      if (c.type !== 'INSTANCE' && c.children) {
        const inner = [];
        for (const k of c.children.slice(0, 3)) inner.push(k.name + ' (' + await instInfo(k) + ')');
        desc += ' > ' + inner.join(' | ');
      }
      row.top.push(desc);
    }
    out.push(row);
  }
  report.info.frames = out;
});

// 9 · Eski Display/Hero stillerinin kullanimi
await step('9 old hero styles', async () => {
  const styles = (await figma.getLocalTextStylesAsync()).filter(s => /^Display\/Hero/.test(s.name));
  const res = {};
  for (const s of styles) res[s.name] = { id: s.id, uses: [] };
  for (const p of [p01, p02, p03]) {
    if (!p) continue;
    const texts = p.findAll(n => n.type === 'TEXT');
    for (const t of texts) {
      let ids = [];
      if (t.textStyleId === figma.mixed) { for (const seg of t.getStyledTextSegments(['textStyleId'])) ids.push(seg.textStyleId); }
      else ids.push(t.textStyleId);
      for (const s of styles) if (ids.indexOf(s.id) >= 0) res[s.name].uses.push(p.name.slice(0, 2) + ' · ' + t.name + ' · in ' + (t.parent ? t.parent.name : '?'));
    }
  }
  for (const k in res) res[k].count = res[k].uses.length, res[k].uses = res[k].uses.slice(0, 8);
  report.info.heroStyles = res;
});

// 10 · Gizli eski stage
await step('10 old stage', async () => {
  const hits = p02.findAll(n => /No photo · Stage/.test(n.name));
  report.info.oldStage = hits.map(n => n.id + ' · ' + n.name + ' · ' + n.type + (n.visible ? ' VISIBLE' : ' hidden') + ' · parent ' + (n.parent ? n.parent.name : '?') + ' · top ' + (function (x) { while (x.parent && x.parent.type !== 'SECTION' && x.parent.type !== 'PAGE') x = x.parent; return x.name; })(n));
});

// 11 · Kulup seridi bayraklari
await step('11 club strip flags', async () => {
  const sets = p01.findAll(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && /^Club strip/.test(n.name));
  const flagSet = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Flag');
  report.info.flagSet = flagSet ? flagSet.id + ' · variants ' + flagSet.children.map(c => c.name).join(' / ') : 'missing';
  const out = [];
  function tree(n, d, acc) {
    acc.push('  '.repeat(d) + n.name + ' · ' + n.type + ' · ' + Math.round(n.width) + 'x' + Math.round(n.height) + (n.layoutMode && n.layoutMode !== 'NONE' ? ' · ' + n.layoutMode + ' gap ' + n.itemSpacing : '') + (n.visible ? '' : ' HIDDEN') + (n.type === 'TEXT' ? ' "' + n.characters.slice(0, 30) + '"' : ''));
    if (n.type === 'INSTANCE' || !n.children || d > 4) return;
    for (const c of n.children) tree(c, d + 1, acc);
  }
  for (const s of sets) {
    const acc = []; tree(s, 0, acc); out.push(acc.slice(0, 60).join('\n'));
  }
  report.info.clubStrip = out;
  const inst = p02.findAll(n => n.type === 'INSTANCE' && /^Club strip/.test(n.name));
  const insts = [];
  for (const i of inst) insts.push(i.name + ' · ' + box(i) + ' · ' + await instInfo(i));
  report.info.clubStripInstances = insts;
  const loose = p02.findAll(n => /League country/.test(n.name) && n.type !== 'INSTANCE');
  report.info.leagueCountryOn02 = loose.map(n => n.id + ' · ' + n.name + ' · ' + n.type + ' · parent ' + (n.parent ? n.parent.name : '?'));
});

return report;
