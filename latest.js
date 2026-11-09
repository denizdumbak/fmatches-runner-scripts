// step 351 · Silüet cinsiyeti taraması 2. tur: eksik erkek adları listeye eklendi, adı bulunamayan silüet sayısı raporlanır
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const F = new Set('anna maria sofia sophia ana lena julia katrin katharina sabine laura elena emma sara sarah lisa nina eva marta clara hanna hannah mia lea johanna charlotte ingrid helena petra monika claudia nadine anja alexandra sandra jana olga irina natalia svetlana elisa giulia chiara camille marie sophie emily emilia amelie lara lina nora ida greta heidi birgit ursula karin kristina christina maja hilda'.split(' '));
const M = new Set('peter lukas luca tom jake leo hans jan marco mateus david michael thomas martin stefan andreas markus daniel felix max paul jonas tim nico carlos joao miguel pedro ivan sergey alexander oliver james john mark jack klaus jürgen matthias florian tobias sebastian erik lars henrik ole jens marcus tomas tommaso lucas rui karim liam noah theo cian'.split(' '));
const nameRe = /^[A-ZÀ-Ý][\p{L}.'’-]+(\s+[A-ZÀ-Ý][\p{L}'’-]+)+$/u;
const screenOf = n => { let q = n; while (q.parent && q.parent.type !== 'SECTION' && q.parent.type !== 'PAGE') q = q.parent; return q.name; };
const seen = {}, fixed = {}, unknown = {};
await step('Silüet cinsiyeti taraması', async () => {
  const sil = p02.findAll(n => n.type === 'INSTANCE' && n.componentProperties && n.componentProperties['Gender'] && n.componentProperties['Role']);
  report.info.silhouettes = sil.length;
  for (const s of sil) {
    let q = s.parent, cand = null, anc = null;
    for (let i = 0; i < 5 && q && q.type !== 'SECTION' && q.type !== 'PAGE'; i++, q = q.parent) {
      if (q.findAll(n => n.type === 'INSTANCE' && n.componentProperties && n.componentProperties['Gender'] && n.componentProperties['Role']).length > 1) break;
      const texts = q.findAll(n => n.type === 'TEXT' && nameRe.test(n.characters.trim()));
      if (texts.length) { cand = texts; anc = q; break; }
    }
    if (!cand) { report.info.noNameFound = (report.info.noNameFound || 0) + 1; continue; }
    const hit = cand.find(t => { const f = t.characters.trim().split(/\s+/)[0].toLowerCase(); return F.has(f) || M.has(f); });
    const gender = s.componentProperties['Gender'].value;
    if (!hit) { const k = cand[0].characters.trim(); unknown[k] = (unknown[k] || 0) + 1; continue; }
    const nm = hit.characters.trim(), want = F.has(nm.split(/\s+/)[0].toLowerCase()) ? 'Female' : 'Male';
    const key = nm + ' | ' + gender;
    if (!seen[key]) seen[key] = { n: 0, screens: [] };
    seen[key].n++; if (seen[key].screens.length < 3) seen[key].screens.push(screenOf(s));
    if (gender !== want) { s.setProperties({ Gender: want }); const fk = nm + ': ' + gender + ' -> ' + want; fixed[fk] = (fixed[fk] || 0) + 1; }
  }
});
report.info.fixed = fixed;
report.info.unknownNames = unknown;
report.info.checked = seen;
figma.notify(report.errors.length ? 'step 351: ' + report.errors.length + ' hata' : 'step 351: ' + Object.values(fixed).reduce((a, b) => a + b, 0) + ' silüet düzeltildi');
return report;
