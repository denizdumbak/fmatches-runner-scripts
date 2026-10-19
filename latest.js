// step 148 · List / Calendar oku iki grubu bagladigi icin gruplarin disina alinir, Home page alt Section'i satir A'ya gore kisalir (calendar view grubuyla cakisma biter)

const report = { done: [], errors: [], info: {} };
async function step(name, fn) { try { await fn(); report.done.push(name); } catch (e) { report.errors.push(name + ': ' + (e && e.message ? e.message : e)); } }
const pageOf = re => figma.root.children.find(p => re.test(p.name));
const p02 = pageOf(/^02/);
await p02.loadAsync();
const abs = n => n.absoluteBoundingBox;
const hit = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
function moveKeep(n, parent) {
  const a = abs(n);
  parent.appendChild(n);
  const b = abs(n);
  n.x += a.x - b.x; n.y += a.y - b.y;
}

for (const secName of ['Web', 'Mobile']) {
  await step(secName, async () => {
    const sec = p02.children.find(n => n.type === 'SECTION' && n.name === secName);
    const home = sec.children.find(n => n.type === 'SECTION' && n.name === 'Home page');
    const arrow = home.children.find(n => n.name === 'Flow · Click: List / Calendar');
    if (arrow) moveKeep(arrow, sec);
    let bottom = 0;
    for (const k of home.children) bottom = Math.max(bottom, k.y + k.height);
    const before = Math.round(home.height);
    home.resizeWithoutConstraints(home.width, bottom + 80);
    const subs = sec.children.filter(n => n.type === 'SECTION');
    const overlaps = [];
    for (let i = 0; i < subs.length; i++) for (let j = i + 1; j < subs.length; j++) if (hit(abs(subs[i]), abs(subs[j]))) overlaps.push(subs[i].name + ' x ' + subs[j].name);
    report.info[secName] = 'arrow ' + (arrow ? 'moved out' : 'already out') + ', Home page h ' + before + ' -> ' + Math.round(home.height) + ', overlaps: ' + (overlaps.length ? overlaps.join(' | ') : 'none');
  });
}

return report;
