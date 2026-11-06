// step 326 · SALT OKUNUR inspect: Shortlists ve My contacts sayfa gövdesi (Tabs, Heading row, List card), mobil Shortlists, Map filtre çipleri/Select alanı. Arama sonuçları ekranlarının iskeleti için.
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = Math.round; const num = v => (typeof v === 'number' ? R(v) : '?');
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const sub = (plat, re) => plat.children.find(n => n.type === 'SECTION' && re.test(n.name));
function line(n, d) {
  let s = `${'  '.repeat(d)}${n.type[0]}${n.type === 'INSTANCE' ? 'I' : ''} ${n.name} ${num(n.width)}x${num(n.height)}`;
  try { if (n.layoutMode && n.layoutMode !== 'NONE') s += ` ${n.layoutMode[0]} gap${num(n.itemSpacing)} pad${num(n.paddingTop)}/${num(n.paddingRight)}/${num(n.paddingBottom)}/${num(n.paddingLeft)}`; } catch (e) {}
  try { if (n.layoutPositioning === 'ABSOLUTE') s += ' ABS'; } catch (e) {}
  try { if (n.layoutSizingHorizontal === 'FILL') s += ' FILL'; } catch (e) {}
  try { if (n.type === 'TEXT') s += ` "${String(n.characters).slice(0, 36)}"`; } catch (e) {}
  try { if (n.visible === false) s += ' HIDDEN'; } catch (e) {}
  return s;
}
function dump(n, d, max, out) { if (d > max) return; out.push(line(n, d)); if ('children' in n) { try { for (const k of n.children) dump(k, d + 1, max, out); } catch (e) {} } }
const frameIn = (sec, re) => sec && sec.children.find(n => n.type === 'FRAME' && re.test(n.name));
await step('shortlists body desktop', async () => {
  const fr = frameIn(sub(web, /^Shortlists$/), /^Shortlists \/ Shortlists · Desktop$/);
  const out = [line(fr, 0)]; for (const k of fr.children) { if (/Ticker|Navigation/.test(k.name)) { out.push(line(k, 1)); continue; } dump(k, 1, 4, out); }
  report.info.shortlistsD = out.slice(0, 70);
});
await step('shortlists body mobile', async () => {
  const fr = frameIn(sub(mob, /^Shortlists$/), /^Shortlists \/ Shortlists · Mobile$/);
  const out = [line(fr, 0)]; for (const k of fr.children) { if (/Ticker|Navigation|Footer/.test(k.name)) { out.push(line(k, 1)); continue; } dump(k, 1, 3, out); }
  report.info.shortlistsM = out.slice(0, 40);
});
await step('contacts tabs desktop', async () => {
  const fr = frameIn(sub(web, /^My contacts$/), /^Contacts \/ My contacts · Desktop$/) || sub(web, /^My contacts$/).children.find(n => n.type === 'FRAME');
  const tabs = fr.findOne(n => n.name === 'Tabs'); const out = [fr.name]; if (tabs) dump(tabs, 0, 3, out); report.info.tabs = out.slice(0, 16);
});
await step('map filters', async () => {
  const fr = frameIn(sub(web, /^Map$/), /^Map \/ Default · Desktop$/); const f = fr.findOne(n => n.name === 'Filters'); const out = []; dump(f, 0, 4, out);
  report.info.mapFilters = out.slice(0, 40);
});
await step('footer + frame props', async () => {
  const fr = frameIn(sub(web, /^Shortlists$/), /^Shortlists \/ Shortlists · Desktop$/);
  report.info.frameProps = { clips: fr.clipsContent, children: fr.children.map(k => k.name + ' ' + num(k.height)).join(' | ') };
});
return report;
