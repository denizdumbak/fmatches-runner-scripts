// step 99 · Kullanilmayan yon panolari silindi (Visual direction A/B/C, Ticker direction A and B)

const report = { done: [], errors: [], info: {} };
const out = [];
for (const p of figma.root.children) {
  await p.loadAsync();
  for (const n of p.children.slice()) {
    if (/^Visual direction · A \/ B \/ C$/.test(n.name) || /^Ticker · direction A and B$/.test(n.name)) {
      out.push(p.name + ' / ' + n.name);
      n.remove();
    }
  }
}
report.info['silinen'] = out.length ? out : 'bulunamadi';
report.done.push('panolar');
return report;
