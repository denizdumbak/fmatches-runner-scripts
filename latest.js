// step 340 · INSPECT (salt okunur, değişiklik yok): Team select için Form field Select, Option row/list, Person row, Tag, Club strip, Filter chip, Event row iç yapıları
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p01 = figma.root.children.find(p => /^01/.test(p.name)); await p01.loadAsync();
const sz = n => Math.round(n.width) + 'x' + Math.round(n.height);
const lay = n => ('layoutMode' in n && n.layoutMode !== 'NONE') ? n.layoutMode[0] + '/' + n.layoutSizingHorizontal[0] + n.layoutSizingVertical[0] + ' g' + (typeof n.itemSpacing === 'number' ? n.itemSpacing : '?') : '-';
async function vname(id) { try { const v = await figma.variables.getVariableByIdAsync(id); return v ? v.name : '?'; } catch (e) { return '?'; } }
async function fillOf(n) { try { if (!('fills' in n) || typeof n.fills === 'symbol' || !n.fills.length) return ''; const f = n.fills[0]; if (f.type !== 'SOLID') return f.type; const b = f.boundVariables && f.boundVariables.color; return b ? await vname(b.id) : 'raw'; } catch (e) { return '?'; } }
async function strokeOf(n) { try { if (!('strokes' in n) || !n.strokes.length) return ''; const f = n.strokes[0]; const b = f.boundVariables && f.boundVariables.color; return ' stroke ' + (b ? await vname(b.id) : 'raw') + ' ' + (typeof n.strokeWeight === 'number' ? n.strokeWeight : 'mixed'); } catch (e) { return ''; } }
async function dump(n, maxD) {
  const out = [];
  async function walk(x, d, pre) {
    if (d > maxD) return;
    let extra = '';
    if (x.type === 'TEXT') { let st = ''; try { const s = typeof x.textStyleId === 'string' && x.textStyleId ? await figma.getStyleByIdAsync(x.textStyleId) : null; st = s ? s.name : ''; } catch (e) {} extra = ' "' + x.characters.slice(0, 40) + '" ' + st + ' fill:' + await fillOf(x); }
    else { const f = await fillOf(x); if (f) extra += ' fill:' + f; extra += await strokeOf(x); if ('cornerRadius' in x && typeof x.cornerRadius === 'number' && x.cornerRadius) extra += ' r' + x.cornerRadius; if ('paddingTop' in x && x.layoutMode !== 'NONE') extra += ' pad ' + [x.paddingTop, x.paddingRight, x.paddingBottom, x.paddingLeft].join('/'); }
    out.push(pre + x.name + ' [' + x.type + ' ' + sz(x) + ' ' + lay(x) + ']' + extra);
    if ('children' in x && (x.type !== 'INSTANCE' || d === 0)) for (const c of x.children) await walk(c, d + 1, pre + ' ');
  }
  await walk(n, 0, ''); return out.slice(0, 45);
}
const sets = p01.findAll(n => n.type === 'COMPONENT_SET' || (n.type === 'COMPONENT' && n.parent && n.parent.type !== 'COMPONENT_SET'));
const byName = nm => sets.find(n => n.name === nm);
const variant = (set, re) => set.type === 'COMPONENT_SET' ? set.children.find(c => re.test(c.name)) : set;

for (const [label, nm, re] of [
  ['Form field Select Default', 'Form field', /Type=Select.*State=Default|State=Default.*Type=Select/],
  ['Option row Default', 'Option row', /State=Default/],
  ['Option row Selected', 'Option row', /State=Selected/],
  ['Option list Clubs', 'Option list', /Kind=Clubs/],
  ['Person row Default', 'Person row', /State=Default/],
  ['Tag Brand subtle', 'Tag', /Brand subtle/],
  ['Club strip Club Desktop', 'Club strip', /Kind=Club.*Device=Desktop|Device=Desktop.*Kind=Club/],
  ['Filter chip Default', 'Filter chip', /State=Default/],
  ['Event row Desktop Default', 'Event row', /Device=Desktop.*State=Default|State=Default.*Device=Desktop/],
]) {
  await step(label, async () => {
    const set = byName(nm); if (!set) throw new Error(nm + ' yok');
    const v = variant(set, re); if (!v) throw new Error('varyant yok: ' + set.children.map(c => c.name).join(' ; '));
    report.info[label] = await dump(v, 4);
    if (label === 'Form field Select Default') { let s = set; while (s && s.type !== 'SECTION') s = s.parent; report.info.formFieldSection = s ? s.name + ' x=' + Math.round(s.x) + ' y=' + Math.round(s.y) + ' ' + sz(s) + ' | children bottoms: ' + s.children.map(c => c.name + '@' + Math.round(c.y) + '+' + Math.round(c.height)).slice(-6).join(' ; ') : 'section yok'; }
  });
}
return report;
