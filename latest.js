// step 251 · Fix language slot: every header instance whose "EN" text shows anything else (the LM override that slid onto it when the Messages button was added) is set back to "EN"; full re-scan of 01 and 02 afterwards
const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p01 = pageOf(/^01/), p02 = pageOf(/^02/);
await p01.loadAsync(); await p02.loadAsync();
const pageNameOf = n => { let p = n; while (p && p.parent && p.type !== 'PAGE' && p.parent.type !== 'SECTION' && p.parent.type !== 'PAGE') p = p.parent; return p ? p.name : '?'; };

// every "EN" language text that lives in an Account actions frame inside a component instance
function langTexts(page) {
  return page.findAll(n => n.type === 'TEXT' && n.name === 'EN' && n.parent && n.parent.name === 'Account actions' && n.parent.parent && (function () { let p = n; while (p) { if (p.type === 'INSTANCE') return true; p = p.parent; } return false; })());
}

await step('fix language slot', async () => {
  const fixed = [];
  for (const page of [p02, p01]) {
    for (const t of langTexts(page)) {
      if (t.characters === 'EN') continue;
      await figma.loadFontAsync(t.fontName);
      const before = t.characters;
      t.characters = 'EN';
      fixed.push(page.name.slice(0, 2) + ' › ' + pageNameOf(t) + ' : "' + before + '" -> "EN"');
    }
  }
  report.info.fixed = fixed;
  report.info.fixedCount = fixed.length;
});

await step('re-scan', async () => {
  const rows = {};
  for (const page of [p02, p01]) {
    const ts = langTexts(page);
    rows[page.name.slice(0, 2)] = { langSlots: ts.length, notEN: ts.filter(t => t.characters !== 'EN').length };
  }
  report.info.rescan = rows;
});

await step('avatar initials still intact', async () => {
  const out = {};
  for (const page of [p02]) {
    for (const t of page.findAll(n => n.type === 'TEXT' && n.name === 'Initials')) out[t.characters] = (out[t.characters] || 0) + 1;
  }
  report.info.initialsCounts = out;
});

return report;
