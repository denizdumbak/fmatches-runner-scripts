// step 353 · Women's club notu: sarı Page notice (ikon, altı çizili yeşil bağlantı) kaldırılır; yerine mevcut Body/Small stili + color/text/secondary ile tek satır sönük not, sayfa gövdesinin en üstüne
const report = { done: [], errors: [], info: { frames: [] } };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const ts = await figma.getLocalTextStylesAsync(); const style = ts.find(s => s.name === 'Body/Small');
const vs = await figma.variables.getLocalVariablesAsync('COLOR'); const sec = vs.find(v => v.name === 'color/text/secondary');
if (!style || !sec) throw new Error('stil ya da değişken yok: ' + (style ? '' : 'Body/Small ') + (sec ? '' : 'color/text/secondary'));
await figma.loadFontAsync(style.fontName);
const sz = n => Math.round(n.width) + 'x' + Math.round(n.height);
for (const dev of ['Desktop', 'Mobile']) {
  await step('Not ' + dev, async () => {
    const f = p02.findAll(n => n.type === 'FRAME' && n.name === "Clubs / Club card / Women's club · " + dev)[0];
    if (!f) throw new Error('frame yok');
    const body = f.findOne(n => n.name === 'Profile body'); if (!body) throw new Error('Profile body yok');
    const old = body.findOne(n => n.name === "Page notice · Women's club");
    const before = sz(f), oldH = old ? Math.round(old.height) : 0;
    if (old) old.remove();
    body.findAll(n => n.name === "Note · Women's club").forEach(n => n.remove());
    const t = figma.createText(); t.name = "Note · Women's club";
    t.fontName = style.fontName; t.characters = "All teams of this club are women's teams.";
    await t.setTextStyleIdAsync(style.id);
    t.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', sec)];
    body.insertChild(0, t);
    t.layoutSizingHorizontal = 'FILL'; t.textAutoResize = 'HEIGHT';
    report.info.frames.push({ dev, frame: before + ' -> ' + sz(f), noticeRemoved: oldH, note: sz(t), deco: t.textDecoration, size: t.fontSize, bodyFirst: body.children.slice(0, 3).map(c => c.name) });
  });
}
figma.notify(report.errors.length ? 'step 353: ' + report.errors.length + ' hata' : 'step 353 tamam');
return report;
