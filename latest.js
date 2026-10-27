// step 233 · READ-ONLY inspect: mobile Navigation structure, menu icon, desktop nav items, Home mobile screens, existing menu components

const p01 = figma.root.children.find(p => /^01/.test(p.name)); const p02 = figma.root.children.find(p => /^02/.test(p.name));
await p01.loadAsync(); await p02.loadAsync();
const out = {}; const r = n => Math.round(n);
const mob = p02.children.find(n => n.type === 'SECTION' && /^Mobile/.test(n.name)); const web = p02.children.find(n => n.type === 'SECTION' && n.name === 'Web');
const tree = (n, d, max) => { let s = '  '.repeat(d) + n.type + ' "' + n.name + '" ' + r(n.width) + 'x' + r(n.height) + (n.type === 'TEXT' ? ' "' + n.characters.slice(0, 30) + '"' : '') + (n.visible === false ? ' [hidden]' : '') + '\n'; if ('children' in n && d < max) for (const c of n.children) s += tree(c, d + 1, max); return s; };
const hm = mob.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · Mobile'); 
if (hm) { const nv = hm.children.find(c => c.name === 'Navigation'); out.mobileNavTree = nv ? tree(nv, 0, 4) : 'no Navigation'; if (nv) { const mc = await nv.getMainComponentAsync(); out.mobileNavMain = mc ? mc.name + ' in ' + (mc.parent ? mc.parent.name : '?') : '?'; } out.homeTop = hm.children.slice(0, 4).map(c => c.name + ' ' + r(c.width) + 'x' + r(c.height)).join(' | '); }
const dh = web.findOne(n => n.type === 'FRAME' && n.name === 'Home / Main · Desktop'); const dn = dh && dh.children.find(c => c.name === 'Navigation'); out.desktopNavTree = dn ? tree(dn, 0, 3) : 'none';
out.mobileHomeScreens = mob.findAll(n => n.type === 'FRAME' && /^Home/.test(n.name) && n.width === 390).map(n => n.name + ' ' + r(n.width) + 'x' + r(n.height));
out.menuLike = p01.findAll(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && /menu|hamburger|drawer|nav/i.test(n.name)).map(n => n.type + ' ' + n.name + ' ' + r(n.width) + 'x' + r(n.height) + ' in ' + (n.parent ? n.parent.name : '?'));
out.menuScreens = mob.findAll(n => n.type === 'FRAME' && n.width === 390 && /menu/i.test(n.name)).map(n => n.name);
const hdr = p01.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Header'); if (hdr) out.headerVariants = hdr.children.map(v => v.name + ' ' + r(v.width) + 'x' + r(v.height));
const mv = hdr && hdr.children.find(v => /Device=Mobile/.test(v.name)); if (mv) out.headerMobileTree = tree(mv, 0, 4);
return out;
