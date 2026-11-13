// step 392 · satir > rol profili baglantisi: ilk satirlarda eski (Players'tan klonlanan) tepki kalintisi baglantiyi reddettiriyor; satirin tum tepkileri temizlenip tek baglanti yazilir
const report = { done: [], errors: [], info: {} };
const p02 = figma.root.children.find(p => /^02/.test(p.name)); await p02.loadAsync();
await figma.setCurrentPageAsync(p02);
const isNavAct = a => a && a.type === 'NODE' && a.navigation !== 'CHANGE_TO';
const acts = r => r.actions || (r.action ? [r.action] : []);
const R = n => Math.round(n);
const nav = dest => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }] });
const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const mob = p02.children.find(n => n.type === 'SECTION' && n.name === 'Mobile');
const sWeb = web.children.find(n => n.type === 'SECTION' && n.name === 'Search results');
const sMob = mob.children.find(n => n.type === 'SECTION' && n.name === 'Search results');
const chain = n => { const o = []; let x = n; while (x && x.type !== 'PAGE') { o.push(x.name); x = x.parent; } return o.join(' < '); };
const frames = [];
for (const plat of [web, mob]) for (const s of plat.children) if (s.type === 'SECTION') for (const c of s.children) if (c.type === 'FRAME') frames.push({ plat: plat.name, sec: s.name, f: c });
const roleRe = /Manager|Referee|Intermediary/i;
report.info.allRoleFrames = frames.filter(x => roleRe.test(x.f.name) && !/^Search/.test(x.f.name)).map(x => x.plat + ' / ' + x.sec + ' / ' + x.f.name + ' ' + R(x.f.width) + 'x' + R(x.f.height) + ' [' + x.f.id + ']');
const MAP = [['Tom Reilly', /Manager/i], ['Ana Ferreira', /Referee/i], ['Sofia Lindqvist', /Intermediary/i]];
const pick = (re, device) => frames.filter(x => x.plat === (device === 'Desktop' ? 'Web' : 'Mobile') && re.test(x.f.name) && x.f.name.indexOf(device) >= 0 && !/Edit|Block|Directory|Minimal|Own|Lightbox|Gallery|^Search/i.test(x.f.name));
let ok = 0; const tried = {};
for (const [sec, device] of [[sWeb, 'Desktop'], [sMob, 'Mobile']]) {
  for (const [person, re] of MAP) {
    const cands = pick(re, device); tried[person + ' ' + device] = cands.map(c => c.sec + ' / ' + c.f.name + ' [' + c.f.id + ']');
    const rows = [];
    for (const f of sec.children) if (f.type === 'FRAME' && /^Search \//.test(f.name)) for (const r of f.findAll(n => n.type === 'INSTANCE' && n.name === 'Person · ' + person)) rows.push(r);
    if (!rows.length) { report.errors.push('satir yok: ' + person + ' ' + device); continue; }
    let dest = null;
    for (const c of cands) {
      try { report.info['onceki tepki ' + person + ' ' + device] = (rows[0].reactions || []).map(r => (r.trigger && r.trigger.type) + ':' + acts(r).map(a => a && (a.type + '/' + a.navigation + '/' + a.destinationId)).join('|')); await rows[0].setReactionsAsync([nav(c.f)]); dest = c.f; break; }
      catch (e) { report.errors.push(person + ' ' + device + ' aday reddedildi: ' + c.f.name + ' [' + chain(c.f) + '] ' + String(e.message).slice(0, 60)); }
    }
    if (!dest) continue;
    for (const r of rows.slice(1)) { try { await r.setReactionsAsync([nav(dest)]); } catch (e) { report.errors.push('satir ' + r.name + ': ' + e.message.slice(0, 60)); } }
    ok += rows.length; report.info[person + ' ' + device] = rows.length + ' satir -> ' + dest.name;
  }
}
report.info.candidates = tried; report.info.rowLinks = ok;
return JSON.stringify(report, null, 1);
