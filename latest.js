// step 119 · Siluet: Silhouette component (Role x Size), directory profillerinde kesme fotograf yerine oyuncu silueti

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const allVars = await figma.variables.getLocalVariablesAsync();
const pick = (...pats) => { for (const p of pats) { const h = allVars.find(v => new RegExp(p, 'i').test(v.name)); if (h) return h; } return null; };
const P = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);

const p1 = pageOf(/^01/); await p1.loadAsync();
const p2 = pageOf(/^02/); await p2.loadAsync();

// cizim (360x400 tuval, govde tabana basar)
const FILL = '#C9CFCB', DARK = '#B3BAB5', LIGHT = '#E2E6E3';
const HEAD = '<ellipse cx="180" cy="118" rx="56" ry="68" fill="' + FILL + '"/>';
const NECK = '<path d="M154 160 L206 160 L212 236 L148 236 Z" fill="' + FILL + '"/>';
const TORSO = '<path d="M36 400 L50 300 C56 262 84 238 120 226 L150 210 C162 228 198 228 210 210 L240 226 C276 238 304 262 310 300 L324 400 Z" fill="' + FILL + '"/>';
const BODY = {
  Player: HEAD + NECK + TORSO +
    '<path d="M148 210 C160 236 200 236 212 210" stroke="' + DARK + '" stroke-width="9" fill="none" stroke-linecap="round"/>' +
    '<path d="M120 228 C108 268 98 300 90 342" stroke="' + DARK + '" stroke-width="3" fill="none"/>' +
    '<path d="M240 228 C252 268 262 300 270 342" stroke="' + DARK + '" stroke-width="3" fill="none"/>',
  Other: HEAD + NECK + TORSO +
    '<path d="M150 212 L180 306 L210 212 Z" fill="' + LIGHT + '"/>' +
    '<path d="M150 210 L166 236 L180 222 L194 236 L210 210 Z" fill="' + DARK + '"/>' +
    '<path d="M150 214 L128 268 L170 330 M210 214 L232 268 L190 330" stroke="' + DARK + '" stroke-width="4" fill="none" stroke-linejoin="round"/>'
};
const SIZES = [
  { name: 'Hero desktop', w: 432, h: 480, vb: '0 0 360 400', avatar: false },
  { name: 'Hero mobile', w: 144, h: 160, vb: '0 0 360 400', avatar: false },
  { name: '64', w: 64, h: 64, vb: '55 10 250 250', avatar: true },
  { name: '40', w: 40, h: 40, vb: '55 10 250 250', avatar: true }
];

const vBody = pick('^color/border/default$'), vDetail = pick('^color/border/strong$'), vLight = pick('^color/bg/subtle$');
report.info.vars = [vBody, vDetail, vLight].map(v => v ? v.name : null);
const sameHex = (paint, h) => { if (!paint || paint.type !== 'SOLID') return false; const c = paint.color; const to = x => Math.round(x * 255).toString(16).padStart(2, '0'); return ('#' + to(c.r) + to(c.g) + to(c.b)).toUpperCase() === h; };
function rebind(root) {
  for (const n of root.findAll(() => true)) {
    if ('constraints' in n) n.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
    for (const key of ['fills', 'strokes']) {
      if (!(key in n) || !Array.isArray(n[key]) || !n[key].length) continue;
      n[key] = n[key].map(p => sameHex(p, FILL) && vBody ? P(vBody) : (sameHex(p, DARK) && vDetail ? P(vDetail) : (sameHex(p, LIGHT) && vLight ? P(vLight) : p)));
    }
  }
}

let set = null;
await step('Silhouette component (Role x Size)', async () => {
  set = p1.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Silhouette');
  if (set) { report.info.silhouette = 'zaten var, yeniden kullanildi'; return; }
  const sec = p1.children.find(n => n.type === 'SECTION' && /Player profile/.test(n.name));
  const comps = [];
  for (const role of ['Player', 'Other']) for (const s of SIZES) {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + s.w + '" height="' + s.h + '" viewBox="' + s.vb + '">' + BODY[role] + '</svg>';
    const node = figma.createNodeFromSvg(svg);
    sec.appendChild(node);
    const c = figma.createComponentFromNode(node);
    c.name = 'Role=' + role + ', Size=' + s.name;
    c.clipsContent = true;
    rebind(c);
    if (s.avatar) { c.cornerRadius = s.w / 2; c.fills = vLight ? [P(vLight)] : [{ type: 'SOLID', color: { r: .93, g: .94, b: .93 } }]; }
    else c.fills = [];
    comps.push(c);
  }
  set = figma.combineAsVariants(comps, sec);
  set.name = 'Silhouette';
  set.layoutMode = 'HORIZONTAL'; set.layoutWrap = 'WRAP'; set.itemSpacing = 24; set.counterAxisSpacing = 24;
  set.counterAxisAlignItems = 'MAX';
  set.paddingTop = set.paddingBottom = set.paddingLeft = set.paddingRight = 24;
  set.primaryAxisSizingMode = 'FIXED'; set.resize(820, 100); set.counterAxisSizingMode = 'AUTO';
  set.description = 'Shown when a person has no photo (default for directory profiles in lower leagues). Role: Player (jersey) or Other (jacket: manager/official, intermediary, referee, fan). Hero sizes stand on the hero base line with the faded club crest behind, like the cut-out photo. 64 and 40 are round avatars for search results and messenger.';
  report.info.silhouette = comps.map(c => c.name);
});

await step('directory profillerinde siluet', async () => {
  const out = [];
  for (const dev of ['Desktop', 'Mobile']) {
    const base = p2.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player · ' + dev);
    const dir = p2.findOne(n => n.type === 'FRAME' && n.name === 'Profiles / Player / Directory, no photo · ' + dev);
    if (!base || !dir) { out.push(dev + ': frame yok'); continue; }
    const cut = base.findOne(n => n.name === 'Player cut-out');
    const parentName = cut.parent.name;
    const target = dir.findOne(n => n.name === parentName && n.type === cut.parent.type) || dir;
    const existing = dir.findOne(n => n.type === 'INSTANCE' && n.name === 'Player silhouette');
    if (existing) existing.remove();
    const old = dir.findOne(n => n.name === 'Player cut-out'); if (old) old.visible = false;
    const comp = set.children.find(c => c.variantProperties.Role === 'Player' && c.variantProperties.Size === (dev === 'Desktop' ? 'Hero desktop' : 'Hero mobile'));
    const inst = comp.createInstance();
    inst.name = 'Player silhouette';
    const idx = cut.parent.children.indexOf(cut);
    target.insertChild(Math.min(idx, target.children.length), inst);
    if ('layoutMode' in target && target.layoutMode !== 'NONE') inst.layoutPositioning = 'ABSOLUTE';
    // kesme fotografin kutusuna, tabana basacak sekilde ortala
    const cb = cut.absoluteBoundingBox, bb = base.absoluteBoundingBox, tb = target.absoluteBoundingBox, db = dir.absoluteBoundingBox;
    const relX = cb.x - bb.x, relY = cb.y - bb.y;
    const absX = db.x + relX + (cb.width - inst.width) / 2;
    const absY = db.y + relY + cb.height - inst.height;
    inst.x = Math.round(absX - tb.x); inst.y = Math.round(absY - tb.y);
    out.push(dev + ': ' + target.name + ' icine, ' + Math.round(inst.width) + 'x' + Math.round(inst.height) + (old ? ' (eski cut-out gizlendi)' : '') + ' · kardesler: ' + target.children.map(c => c.name + (c.visible ? '' : '(gizli)')).join(', '));
  }
  report.info.directory = out;
});

await step('Avatar yapisi (salt okunur, sonraki adim icin)', async () => {
  const av = p1.findOne(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && n.name === 'Avatar');
  report.info.avatar = av ? (av.type === 'COMPONENT_SET' ? av.children.map(c => c.name + ' ' + Math.round(c.width)) : ['tek component ' + Math.round(av.width)]) : 'yok';
});

await step('sekme 01 Section duzeni', async () => {
  const s = p1.children.find(n => n.type === 'SECTION' && /Player profile/.test(n.name));
  const kids = s.children.slice();
  const ordered = kids.filter(n => n.type === 'TEXT').concat(kids.filter(n => n.type !== 'TEXT'));
  const left = s.x + 80; let y = s.y + 80, prevText = false, first = true;
  for (const k of ordered) {
    const b = k.absoluteBoundingBox; if (!b) continue; const isText = k.type === 'TEXT';
    if (!first) y += (isText && prevText) ? 16 : 120;
    k.x += left - b.x; k.y += y - b.y; y += b.height; prevText = isText; first = false;
  }
  let right = -Infinity, bottom = -Infinity;
  for (const k of s.children) { const b = k.absoluteBoundingBox; if (!b) continue;
    if (b.x + b.width > right) right = b.x + b.width;
    if (b.y + b.height > bottom) bottom = b.y + b.height; }
  s.resizeWithoutConstraints(Math.ceil(right - s.x + 80), Math.ceil(bottom - s.y + 80));
  const secs = p1.children.filter(n => n.type === 'SECTION').sort((a, b) => a.x - b.x);
  let x = 1640; for (const sc of secs) { if (sc.x < 1000) continue; sc.x = x; x += sc.width + 160; }
});

return JSON.stringify(report, null, 1);
