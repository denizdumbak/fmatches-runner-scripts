figma.showUI(__html__, { width: 560, height: 520, themeColors: true });

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

function toText(v) {
  if (v === undefined) return 'Done (no return value).';
  try { return JSON.stringify(v, null, 2); } catch (e) { return String(v); }
}

figma.ui.onmessage = async (msg) => {
  if (!msg) return;

  // UI asks for the saved script URL on startup
  if (msg.type === 'load-url') {
    const url = await figma.clientStorage.getAsync('scriptUrl');
    figma.ui.postMessage({ type: 'url', url: url || '' });
    return;
  }

  if (msg.type === 'save-url') {
    await figma.clientStorage.setAsync('scriptUrl', msg.url || '');
    return;
  }

  if (msg.type === 'run') {
    const t0 = Date.now();
    try {
      const r = await new AsyncFunction('figma', msg.code)(figma);
      figma.commitUndo();
      figma.ui.postMessage({ type: 'result', ok: true, text: toText(r), ms: Date.now() - t0 });
    } catch (e) {
      figma.ui.postMessage({ type: 'result', ok: false, text: (e && e.stack) ? e.stack : String(e), ms: Date.now() - t0 });
    }
  }
};
