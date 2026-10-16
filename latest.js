// step 125 · Directory profili: siluet hero'nun icine, ana profildeki gibi soluk arma arkada; eski No photo · Stage kutusu gizlendi; bos durum metni tek satir

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
async function loadFonts(n) { for (const seg of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName); }
const r = n => Math.round(n);
const web = figma.root.children.find(p => /^02/.test(p.name));
await web.loadAsync();
const F = name => web.findOne(n => n.type === 'FRAME' && n.name === name && n.parent && n.parent.type === 'SECTION');

for (const D of ['Desktop', 'Mobile']) {
  await step('directory · ' + D, async () => {
    const main = F('Profiles / Player · ' + D);
    const dir = F('Profiles / Player / Directory, no photo · ' + D);
    if (!main || !dir) throw new Error('frame missing');
    const mHero = main.findOne(n => /^Hero/.test(n.name));
    const hero = dir.findOne(n => /^Hero/.test(n.name));
    const out = [];

    // 1. soluk arma (ana profilden kopya, en arkada)
    if (!hero.children.some(k => k.name === 'Club crest' && k.type === 'FRAME')) {
      const mc = mHero.children.find(k => k.name === 'Club crest');
      const c = mc.clone();
      hero.insertChild(0, c);
      c.layoutPositioning = 'ABSOLUTE';
      c.x = mc.x; c.y = mc.y;
      out.push('crest ' + r(c.x) + ',' + r(c.y) + ' op' + Math.round(c.opacity * 100));
    }

    // 2. siluet
    let sil = dir.findOne(n => n.type === 'INSTANCE' && n.name === 'Player silhouette');
    if (!sil) throw new Error('Player silhouette not found');
    const stage = hero.findOne(n => n.name === 'No photo · Stage');

    if (D === 'Desktop') {
      const mPhoto = mHero.children.find(k => /^Player photo/.test(k.name));
      if (sil.parent !== hero) { hero.appendChild(sil); sil.layoutPositioning = 'ABSOLUTE'; }
      sil.x = r(mPhoto.x + (mPhoto.width - sil.width) / 2);
      sil.y = r(hero.height - sil.height);
      if (stage) { stage.visible = false; stage.name = 'No photo · Stage (old, hidden)'; }
      out.push('silhouette ' + sil.x + ',' + sil.y + ' (photo box ' + r(mPhoto.x) + ',' + r(mPhoto.y) + ')');
    } else {
      if (!stage) throw new Error('mobile stage not found');
      stage.name = 'Player photo · silhouette';
      stage.fills = [];
      for (const k of stage.children.slice()) if (k !== sil) k.remove();
      if (sil.parent !== stage) { stage.appendChild(sil); sil.layoutPositioning = 'ABSOLUTE'; }
      sil.x = r((stage.width - sil.width) / 2);
      sil.y = r(stage.height - sil.height);
      out.push('silhouette in stage ' + sil.x + ',' + sil.y + ' stage ' + r(stage.width) + 'x' + r(stage.height));
    }

    // 3. bos durum metni: fotograf ve mesaj tek satirda
    const t = dir.findOne(n => n.type === 'TEXT' && /^(Messaging opens|Photo and messaging)/.test(n.characters));
    if (t) {
      await loadFonts(t);
      t.characters = 'Photo and messaging appear once the player claims this profile.';
      t.name = t.characters;
      out.push('note text updated (' + r(t.width) + ' wide)');
    } else out.push('note text not found');

    report.info[D] = out;
  });
}
return report;
