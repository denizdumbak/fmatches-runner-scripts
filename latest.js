// step 199 · color/map/* degiskenleri (198'de modeId hatasi: mode.id yerine mode.modeId); Section'lar 198'de tamam

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const hexToRgb = h => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });

await step('color/map variables', async () => {
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const col = cols.find(c => c.name === 'Color');
  if (!col) throw new Error('collection Color missing');
  const mode = col.modes.find(m => m.name === 'Light') || col.modes[0];
  const all = await figma.variables.getLocalVariablesAsync();
  const defs = { 'color/map/club': '#0b7f3e', 'color/map/facility': '#3a423d', 'color/map/event': '#b7791f', 'color/map/request': '#6d4ac4' };
  report.info.mapVars = [];
  for (const name of Object.keys(defs)) {
    let v = all.find(x => x.name === name && x.variableCollectionId === col.id);
    if (!v) v = figma.variables.createVariable(name, col, 'COLOR');
    v.setValueForMode(mode.modeId, hexToRgb(defs[name]));
    report.info.mapVars.push(name + ' ' + defs[name]);
  }
  const again = await figma.variables.getLocalVariablesAsync();
  report.info.mapVarCount = again.filter(x => /^color\/map\//.test(x.name)).length;
});
return report;
