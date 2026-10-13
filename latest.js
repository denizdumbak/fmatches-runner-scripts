// step 68 · Social icon componenti (4 marka x Default/Hover) + koyu footer
const out = { steps: [], errors: [] };

const V = { inverse:'1:31', textInverse:'1:41', textPrimary:'1:38' };
const BRANDS = [
  { key:'LinkedIn',  match:/linkedin/i,            hoverBg:'#0A66C2', hoverGlyph:'#FFFFFF' },
  { key:'Instagram', match:/instagram/i,           hoverBg:'#E4405F', hoverGlyph:'#FFFFFF' },
  { key:'Facebook',  match:/facebook/i,            hoverBg:'#0866FF', hoverGlyph:'#FFFFFF' },
  { key:'X',         match:/(^|[^a-z])x([^a-z]|$)|twitter/i, hoverBg:'#FFFFFF', hoverGlyph:'#111613' }
];
const URLS = {
  LinkedIn:'linkedin.com/company/fmatches', Instagram:'instagram.com/friendlymatches.international',
  Facebook:'facebook.com/FriendlyMatches.International', X:'x.com/f_matches'
};

async function step(name, fn) {
  try { const r = await fn(); out.steps.push({ name, done:true, result:r }); return r; }
  catch (e) { out.errors.push({ name, error:String(e && e.message ? e.message : e) }); return null; }
}
function hexRgb(h){ return { r:parseInt(h.slice(1,3),16)/255, g:parseInt(h.slice(3,5),16)/255, b:parseInt(h.slice(5,7),16)/255 }; }
const vc = {};
async function getVar(id){ if(!vc[id]) vc[id] = await figma.variables.getVariableByIdAsync(id.indexOf('VariableID')===0?id:'VariableID:'+id); return vc[id]; }
async function paintVar(node, id){
  const v = await getVar(id);
  node.fills = [figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color',v)];
}
function paintHex(node, hex){ node.fills = [{ type:'SOLID', color: hexRgb(hex) }]; }
function paintAllVectors(node, hex){
  const vs = 'findAll' in node ? node.findAll(n => 'fills' in n) : [];
  for (const v of vs) v.fills = [{ type:'SOLID', color: hexRgb(hex) }];
  if ('fills' in node && node.type !== 'FRAME') node.fills = [{ type:'SOLID', color: hexRgb(hex) }];
}
async function loadFontsOf(n){
  const len = n.characters.length;
  const fonts = len>0 ? n.getRangeAllFontNames(0,len) : [n.fontName];
  for (const f of fonts) if (f && f.family) await figma.loadFontAsync(f);
}

// yeni degiskenlerin id'leri
const IDS = await step('koyu zemin degiskenleri', async () => {
  const all = await figma.variables.getLocalVariablesAsync('COLOR');
  const f = n => { const v = all.find(x => x.name === n); if (!v) throw new Error(n + ' yok, once step 67'); return v.id; };
  return { sec: f('text/inverse-secondary'), border: f('border/inverse') };
});

// ---------- 1. Social icon component ----------
const SET = await step('Social icon componenti', async () => {
  const p = figma.root.children.find(n => /^01/.test(n.name));
  await p.loadAsync();

  const existing = p.children.find(n => n.name === 'Social icon' && n.type === 'COMPONENT_SET');
  if (existing) existing.remove();

  const loose = p.children.filter(n => n.type === 'FRAME' && /icon|linkedin|instagram|facebook|twitter|^x$/i.test(n.name) && n.width <= 64);
  if (!loose.length) throw new Error('Sayfada serbest ikon bulunamadi');

  const comps = [];
  const used = [];
  for (const b of BRANDS) {
    const src = loose.find(n => b.match.test(n.name));
    if (!src) throw new Error(b.key + ' ikonu bulunamadi. Bulunanlar: ' + loose.map(n => n.name).join(', '));
    used.push(src.name + ' -> ' + b.key);

    for (const state of ['Default', 'Hover']) {
      const comp = figma.createComponent();
      comp.name = 'Brand=' + b.key + ', State=' + state;
      comp.resize(32, 32);
      comp.layoutMode = 'HORIZONTAL';
      comp.primaryAxisAlignItems = 'CENTER';
      comp.counterAxisAlignItems = 'CENTER';
      comp.cornerRadius = 999;
      comp.clipsContent = false;
      if (state === 'Hover') paintHex(comp, b.hoverBg); else comp.fills = [];

      const glyph = src.clone();
      glyph.name = 'Glyph';
      const factor = 18 / src.width;
      glyph.rescale(factor);
      comp.appendChild(glyph);
      glyph.layoutSizingHorizontal = 'FIXED';
      glyph.layoutSizingVertical = 'FIXED';
      glyph.fills = [];
      paintAllVectors(glyph, state === 'Hover' ? b.hoverGlyph : '#FFFFFF');

      comp.description = b.key + ' · ' + URLS[b.key] + (state === 'Hover' ? ' · hover fills the circle with the brand colour' : '');
      comps.push(comp);
    }
  }

  const set = figma.combineAsVariants(comps, p);
  set.name = 'Social icon';
  set.layoutMode = 'HORIZONTAL';
  set.itemSpacing = 24;
  set.paddingTop = set.paddingBottom = set.paddingLeft = set.paddingRight = 32;
  set.primaryAxisSizingMode = 'AUTO';
  set.counterAxisSizingMode = 'AUTO';
  set.description = 'Social links in the footer. Default is the white glyph on the dark footer; hover fills the circle with the brand colour. X inverts, because its brand colour is black.';

  // konum: Home page sectionunun altina degil, Navigation sectionunun yanina koymadan sayfa kokunde birak
  const maxY = Math.max(...p.children.filter(n => n.type === 'SECTION').map(n => n.y + n.height));
  set.x = 1640; set.y = maxY + 160;

  // hover gecisleri
  for (const b of BRANDS) {
    const d = set.children.find(c => c.name === 'Brand=' + b.key + ', State=Default');
    const h = set.children.find(c => c.name === 'Brand=' + b.key + ', State=Hover');
    if (d && h) {
      await d.setReactionsAsync([{
        trigger: { type: 'ON_HOVER' },
        actions: [{ type: 'NODE', destinationId: h.id, navigation: 'CHANGE_TO',
                    transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.15 },
                    preserveScrollPosition: false }]
      }]);
    }
  }

  // kaynak ikonlar temizlensin
  for (const n of loose) n.remove();

  return { eslesme: used, varyant: set.children.length, id: set.id };
});

// ---------- 2. Koyu footer ----------
await step('footer koyuya alinir', async () => {
  const p = figma.root.children.find(n => /^01/.test(n.name));
  const footer = p.children.find(n => n.name === 'Footer' && n.type === 'COMPONENT_SET')
              || p.findOne(n => n.name === 'Footer' && n.type === 'COMPONENT_SET');
  if (!footer) throw new Error('Footer yok');
  const set = await figma.getNodeByIdAsync(SET.id);

  const log = [];
  for (const variant of footer.children) {
    await paintVar(variant, V.inverse);

    // alt satirdaki ince cizgi
    const bottom = variant.findOne(n => /Footer bottom/i.test(n.name));
    if (bottom) {
      if (bottom.strokes && bottom.strokes.length) {
        const v = await getVar(IDS.border);
        bottom.strokes = [figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color',v)];
      }
      const rules = bottom.findAll(n => n.type === 'RECTANGLE' || n.type === 'LINE');
      for (const r of rules) await paintVar(r, IDS.border);
    }

    // metinler
    for (const t of variant.findAll(n => n.type === 'TEXT')) {
      const inBottom = bottom && bottom.findOne ? !!bottom.findOne(n => n.id === t.id) : false;
      await paintVar(t, inBottom ? IDS.sec : V.textInverse);
    }

    // sosyal metinleri ikonla degistir
    const wrap = variant.findOne(n => n.name === 'Social links' && n.type === 'FRAME');
    if (wrap) {
      for (const c of [...wrap.children]) c.remove();
      wrap.itemSpacing = 8;
      for (const b of BRANDS) {
        const comp = set.children.find(c => c.name === 'Brand=' + b.key + ', State=Default');
        wrap.appendChild(comp.createInstance());
      }
      log.push(variant.name + ' · 4 ikon');
    }
  }
  return log;
});

await step('Section tasmasi', async () => {
  const p = figma.root.children.find(n => /^01/.test(n.name));
  const fixed = [];
  for (const sec of p.children) {
    if (sec.type !== 'SECTION' || !sec.children.length) continue;
    const bottom = Math.max(...sec.children.map(n => n.y + n.height));
    const right = Math.max(...sec.children.map(n => n.x + n.width));
    if (bottom + 80 > sec.height || right + 80 > sec.width) {
      sec.resizeWithoutConstraints(Math.max(sec.width, right + 80), bottom + 80);
      fixed.push(sec.name);
    }
  }
  return fixed.length ? fixed : 'tasma yok';
});

return out;
