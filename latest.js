// step 00 · boru hattı testi
const page = figma.currentPage;
return { ok: true, page: page.name, nodeCount: page.children.length };
