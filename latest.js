// step 82 · Social icon seti Foundations'ta koyu zemine alindi (beyaz uzerine beyaz sorunu)

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const page = re => figma.root.children.find(p => re.test(p.name));
const page0 = page(/^01/);
if (page0) await page0.loadAsync();

const V = {};
for (const [k, id] of Object.entries({ inverse: '1:31', rLg: '1:63' })) {
  V[k] = await figma.variables.getVariableByIdAsync('VariableID:' + id);
}
const paint = k => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', V[k]);

await step('Social icon seti koyu zemine alindi', async () => {
  const set = page0.findOne(n => n.name === 'Social icon' && n.type === 'COMPONENT_SET');
  if (!set) throw new Error('Social icon set bulunamadi');

  set.fills = [paint('inverse')];
  set.paddingLeft = 32; set.paddingRight = 32; set.paddingTop = 32; set.paddingBottom = 32;
  set.itemSpacing = 24;
  for (const c of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) set.setBoundVariable(c, V.rLg);

  report.info['set'] = {
    id: set.id,
    boyut: Math.round(set.width) + 'x' + Math.round(set.height),
    varyant: set.children.length
  };
});

function relayout(s) {
  const kids = s.children.slice().sort((a, b) => {
    const ba = a.absoluteBoundingBox, bb = b.absoluteBoundingBox;
    if (!ba || !bb) return 0;
    if (Math.abs(ba.y - bb.y) > 4) return ba.y - bb.y;
    return ba.x - bb.x;
  });
  const left = s.x + 80; let y = s.y + 80, prevText = false, first = true;
  for (const k of kids) {
    const b = k.absoluteBoundingBox; if (!b) continue;
    const isText = k.type === 'TEXT';
    if (!first) y += (isText && prevText) ? 16 : 120;
    k.x += left - b.x; k.y += y - b.y; y += b.height; prevText = isText; first = false;
  }
  let right = -Infinity, bottom = -Infinity;
  for (const k of s.children) {
    const b = k.absoluteBoundingBox; if (!b) continue;
    if (b.x + b.width > right) right = b.x + b.width;
    if (b.y + b.height > bottom) bottom = b.y + b.height;
  }
  s.resizeWithoutConstraints(Math.ceil(right - s.x + 80), Math.ceil(bottom - s.y + 80));
}

await step('Section duzeni', async () => {
  const section = page0.findOne(n => n.type === 'SECTION' && /Navigation/.test(n.name));
  if (!section) throw new Error('Navigation Section bulunamadi');
  relayout(section);
  report.info['Section'] = Math.round(section.width) + 'x' + Math.round(section.height);

  const secs = page0.children.filter(n => n.type === 'SECTION');
  const hits = [];
  for (let i = 0; i < secs.length; i++) for (let j = i + 1; j < secs.length; j++) {
    const a = secs[i].absoluteBoundingBox, b = secs[j].absoluteBoundingBox;
    if (!a || !b) continue;
    if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height)
      hits.push(secs[i].name + ' <-> ' + secs[j].name);
  }
  report.info['Section cakismasi'] = hits.length ? hits : 'yok';
});

return report;
