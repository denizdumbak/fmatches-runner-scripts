// step 304 · salt okunur: Focus varyantı eklenecek 6 set (Button, Icon button, Filter chip, Checkbox, Switch, Link row) yapısı · border/focus kullanımı · Foundations not yeri. Hiçbir şey değiştirmez.
const report = { done: [], errors: [] };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const R = n => Math.round(n);
const p01 = figma.root.children.find(p => /^01/.test(p.name));
const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
const vars = await figma.variables.getLocalVariablesAsync();
const vName = id => { const v = vars.find(x => x.id === id); return v ? v.name.replace('color/', '') : id; };
const paint = n => { if (!('fills' in n) || n.fills === figma.mixed || !n.fills.length) return '-'; const p = n.fills[0]; return p.boundVariables && p.boundVariables.color ? vName(p.boundVariables.color.id) : p.type; };
const stroke = n => { if (!('strokes' in n) || !n.strokes.length) return '-'; const p = n.strokes[0]; return `${p.boundVariables && p.boundVariables.color ? vName(p.boundVariables.color.id) : 'raw'} ${n.strokeWeight === figma.mixed ? 'mixed' : n.strokeWeight}${n.strokeAlign ? ' ' + n.strokeAlign : ''}`; };
const rad = n => 'cornerRadius' in n ? (n.cornerRadius === figma.mixed ? 'mixed' : R(n.cornerRadius)) + (n.boundVariables && n.boundVariables.topLeftRadius ? '(' + vName(n.boundVariables.topLeftRadius.id) + ')' : '') : '-';
const fx = n => 'effects' in n && n.effects.length ? n.effects.map(e => e.type).join('+') : '-';

const NAMES = ['Button', 'Icon button', 'Filter chip', 'Checkbox', 'Switch', 'Link row'];
await step('sets', async () => {
  report.sets = {};
  for (const nm of NAMES) {
    const s = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === nm);
    if (!s) { report.sets[nm] = 'YOK'; continue; }
    const g = s.variantGroupProperties || {};
    const defs = s.componentPropertyDefinitions || {};
    const info = {
      section: s.parent ? s.parent.name : '-',
      box: `${R(s.x)},${R(s.y)} ${R(s.width)}x${R(s.height)} layout ${s.layoutMode}`,
      variants: s.children.length,
      props: Object.keys(g).map(k => `${k}: ${g[k].values.join('/')}`),
      otherProps: Object.keys(defs).filter(k => defs[k].type !== 'VARIANT').map(k => `${k} (${defs[k].type})`),
      sample: []
    };
    const seen = new Set();
    for (const c of s.children) {
      const st = c.name.split(', ').filter(x => !/^State=/.test(x)).join(', ');
      if (seen.has(st)) continue; seen.add(st);
      const d = c.name.indexOf('State=Default') >= 0 || c.name.indexOf('State') < 0 ? c : null;
      const base = d || c;
      info.sample.push(`${base.name} @${R(base.x)},${R(base.y)} ${R(base.width)}x${R(base.height)} · layout ${base.layoutMode} clip ${base.clipsContent} · fill ${paint(base)} · stroke ${stroke(base)} · rad ${rad(base)} · fx ${fx(base)} · kids [${base.children.map(k => k.name + ':' + k.type).slice(0, 5).join(', ')}]`);
      if (info.sample.length >= 6) break;
    }
    const hover = s.children.find(c => /State=Hover/.test(c.name));
    if (hover) info.hover = `${hover.name} · fill ${paint(hover)} · stroke ${stroke(hover)} · fx ${fx(hover)}`;
    const dis = s.children.find(c => /State=Disabled/.test(c.name));
    if (dis) info.disabled = `${dis.name} · opacity ${dis.opacity} · fill ${paint(dis)}`;
    const inst = p02.findAll(n => n.type === 'INSTANCE' && n.name.length < 80).length;
    report.sets[nm] = info;
  }
});

await step('form field focus', async () => {
  const s = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Form field');
  const f = s.children.find(c => /State=Focus/.test(c.name) && /Type=Text/.test(c.name));
  const field = f.findOne(n => n.name === 'Field');
  report.formFieldFocus = `${f.name} · Field stroke ${stroke(field)} · rad ${rad(field)} · fx ${fx(field)}`;
});

await step('border/focus kullanımı', async () => {
  const fv = vars.find(v => v.name === 'color/border/focus');
  const use = new Map();
  for (const page of [p01, p02]) for (const n of page.findAll(n => ('strokes' in n) || ('fills' in n))) {
    const hit = (arr) => arr && arr !== figma.mixed && arr.some(p => p.boundVariables && p.boundVariables.color && p.boundVariables.color.id === fv.id);
    if (hit(n.strokes) || hit(n.fills)) { let x = n, path = []; while (x && x.type !== 'PAGE' && path.length < 3) { path.unshift(x.name); x = x.parent; } const k = page.name.slice(0, 2) + ' ' + path.join(' > '); use.set(k, (use.get(k) || 0) + 1); }
  }
  report.focusUse = [...use.entries()].slice(0, 20).map(([k, c]) => `${c}x ${k}`);
  report.focusUseTotal = [...use.values()].reduce((a, b) => a + b, 0);
  const col = await figma.variables.getVariableCollectionByIdAsync(fv.variableCollectionId);
  const raw = fv.valuesByMode[Object.keys(fv.valuesByMode)[0]];
  report.focusVar = `${fv.name} koleksiyon ${col.name} · ${raw && raw.type === 'VARIABLE_ALIAS' ? 'alias -> ' + (vars.find(v => v.id === raw.id) || {}).name : 'doğrudan'}`;
  report.inverseVarExists = !!vars.find(v => v.name === 'color/border/focus-inverse');
});

await step('Foundations notları', async () => {
  const notes = p01.findAll(n => n.type === 'TEXT' && /(developer|for the developer|Note)/i.test(n.characters)).slice(0, 6);
  report.noteSamples = notes.map(t => `${t.parent ? t.parent.name : '-'} › "${t.characters.slice(0, 50)}" style ${t.textStyleId && t.textStyleId !== figma.mixed ? 'var' : 'yok'} fill ${paint(t)}`);
  report.sections01 = p01.children.filter(n => n.type === 'SECTION').map(s => `${s.name} ${R(s.x)},${R(s.y)} ${R(s.width)}x${R(s.height)}`);
});
return report;
