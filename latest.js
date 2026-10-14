// step 95 · Mobil filtre cipleri tek satir, yatay kaydirma (gorsel + prototip)

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }

const pageOf = re => figma.root.children.find(p => re.test(p.name));
const pageHome = pageOf(/^02/);
if (pageHome) await pageHome.loadAsync();

const targets = ['Home · Mobile', 'Home · Mobile · calendar view'];

for (const nm of targets) {
  await step(nm, async () => {
    const frame = pageHome.children.find(n => n.name === nm);
    if (!frame) throw new Error('frame yok');
    const filters = frame.findOne(n => n.name === 'Event filters' && n.type === 'FRAME');
    if (!filters) throw new Error('Event filters yok');

    const parent = filters.parent;
    const idx = parent.children.indexOf(filters);

    // eski scroller varsa coz (tekrar calistirilabilir)
    let scroller = parent.type === 'FRAME' && parent.name === 'Filter scroller' ? parent : null;
    if (!scroller) {
      scroller = figma.createFrame();
      scroller.name = 'Filter scroller';
      scroller.fills = [];
      scroller.layoutMode = 'HORIZONTAL';
      scroller.primaryAxisSizingMode = 'FIXED';
      scroller.counterAxisSizingMode = 'AUTO';
      parent.insertChild(idx, scroller);
      scroller.appendChild(filters);
      scroller.layoutSizingHorizontal = 'FILL';
    }
    scroller.clipsContent = true;
    scroller.overflowDirection = 'HORIZONTAL';

    // cipler tek satir, icerik kadar genis
    filters.layoutMode = 'HORIZONTAL';
    filters.layoutWrap = 'NO_WRAP';
    filters.primaryAxisSizingMode = 'AUTO';
    filters.counterAxisSizingMode = 'AUTO';
    filters.layoutSizingHorizontal = 'HUG';
    filters.paddingRight = 16;

    report.info[nm] = 'scroller ' + Math.round(scroller.width) + ' px, cip satiri ' + Math.round(filters.width) + ' px (' + (filters.width > scroller.width ? 'tasiyor, kayar' : 'sigiyor, kaymaz') + ')';
  });
}

return report;
