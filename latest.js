// step 197 · SALT OKUNUR envanter (Faz 3 harita): 01 Section'lari ve component set'leri, 02 Section duzeni ve bos yer, harita icin lazim olan renk/efekt degiskenleri

const report = { done: [], errors: [], info: {} };
const p01 = figma.root.children.find(p => /^01/.test(p.name)); const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
const r = n => Math.round(n);
report.info.sections01 = p01.children.filter(n => n.type === 'SECTION').sort((a, b) => a.x - b.x).map(s => s.name + ' @' + r(s.x) + ' ' + r(s.width) + 'x' + r(s.height));
report.info.sets01 = p01.findAll(n => n.type === 'COMPONENT_SET').map(s => s.name + ' [' + Object.keys(s.componentPropertyDefinitions).join(', ') + '] ' + s.children.length + 'v');
report.info.loneComponents01 = p01.findAll(n => n.type === 'COMPONENT' && (!n.parent || n.parent.type !== 'COMPONENT_SET')).map(c => c.name).slice(0, 40);
report.info.sections02 = p02.children.filter(n => n.type === 'SECTION').map(s => s.name + ' @' + r(s.x) + ',' + r(s.y) + ' ' + r(s.width) + 'x' + r(s.height) + ' · subs: ' + s.children.filter(c => c.type === 'SECTION').map(c => c.name + '(' + r(c.x) + ',' + r(c.y) + ' ' + r(c.width) + 'x' + r(c.height) + ')').join(' | '));
const vars = await figma.variables.getLocalVariablesAsync();
const names = vars.map(v => v.name);
report.info.colorVars = names.filter(n => /^color\//.test(n));
report.info.otherVars = names.filter(n => !/^color\//.test(n));
report.info.textStyles = (await figma.getLocalTextStylesAsync()).map(s => s.name);
report.info.effectStyles = (await figma.getLocalEffectStylesAsync()).map(s => s.name);
const gridOf = sec => { const fs = sec.children.filter(c => c.type === 'FRAME'); return fs.length ? fs.slice(0, 3).map(f => f.name + ' ' + r(f.width) + 'x' + r(f.height)) : []; };
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
report.info.webFirstFrames = gridOf(web);
return report;
