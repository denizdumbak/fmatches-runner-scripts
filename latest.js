// step 179 · Yama: Google isareti orijinal 4 renkle (component, iki durum) · Sign up sayfalarinda mevki yazimi edit formuyla ayni (Select: "CAM · Attacking Midfield", cipler kisaltma kodu)
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }

const G_SVG = '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>' +
  '<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>' +
  '<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>' +
  '<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>';

await figma.setCurrentPageAsync(p01);
await step('Google mark colours', async () => {
  const set = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Google button'); if (!set) throw new Error('Google button set missing');
  let k = 0;
  for (const v of set.children) {
    const old = v.findOne(n => n.name === 'Google mark'); if (!old) throw new Error('Google mark missing in ' + v.name);
    const idx = v.children.indexOf(old); old.remove();
    const f = figma.createNodeFromSvg(G_SVG); f.name = 'Google mark'; f.fills = []; f.clipsContent = false; f.rescale(20 / f.width);
    v.insertChild(idx, f); k++;
  }
  report.info.googleMark = k + ' variants updated (4 brand colours)';
});

await figma.setCurrentPageAsync(p02);
await step('position labels', async () => {
  const MAP = { 'Attacking Midfield': 'CAM · Attacking Midfield', 'Central Midfield': 'CM', 'Left Winger': 'LW', 'Central Midfield, Left Winger': 'CM, LW' };
  let n = 0; const seen = {};
  for (const P_ of ['Web', 'Mobile']) {
    const ps = p02.children.find(x => x.type === 'SECTION' && x.name === P_); const sec = ps.children.find(x => x.type === 'SECTION' && x.name === 'Sign up');
    for (const t of sec.findAll(x => x.type === 'TEXT' && MAP[x.characters] !== undefined && x.visible)) {
      await loadFonts(t); const old = t.characters; t.characters = MAP[old]; n++; seen[old + ' > ' + MAP[old]] = (seen[old + ' > ' + MAP[old]] || 0) + 1;
    }
  }
  report.info.positionTexts = n; report.info.changed = seen;
});

return report;
