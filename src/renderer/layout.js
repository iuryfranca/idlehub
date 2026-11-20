'use strict';
// Calculo puro de posicoes dos paineis. Nao toca no DOM, entao da para testar no Node.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HubLayout = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const RATIOS = { livre: null, '16:9': 16 / 9, '4:3': 4 / 3, '3:2': 3 / 2, '9:16': 9 / 16 };

  // Escolhe o numero de colunas que deixa cada painel com a maior area util num formato ~16:9.
  function bestColumns(n, W, H, gap) {
    let best = 1, bestScore = -1;
    for (let cols = 1; cols <= n; cols++) {
      const rows = Math.ceil(n / cols);
      const cw = (W - gap * (cols - 1)) / cols, ch = (H - gap * (rows - 1)) / rows;
      if (cw <= 0 || ch <= 0) continue;
      const score = Math.min(cw / 16, ch / 9);
      if (score > bestScore + 1e-9) { bestScore = score; best = cols; }
    }
    return best;
  }

  function grid(ids, W, H, gap) {
    const rects = {}, n = ids.length;
    if (!n) return rects;
    const cols = bestColumns(n, W, H, gap), rows = Math.ceil(n / cols);
    const cw = (W - gap * (cols - 1)) / cols, ch = (H - gap * (rows - 1)) / rows;
    ids.forEach((id, i) => {
      const r = Math.floor(i / cols), c = i % cols;
      const inRow = r === rows - 1 ? n - cols * (rows - 1) : cols;
      const offset = ((cols - inRow) * (cw + gap)) / 2; // ultima linha incompleta fica centralizada
      rects[id] = { x: offset + c * (cw + gap), y: r * (ch + gap), w: cw, h: ch };
    });
    return rects;
  }

  // Destaque: um painel grande a esquerda e os outros empilhados numa coluna a direita.
  function featured(ids, featuredId, split, W, H, gap) {
    const main = ids.includes(featuredId) ? featuredId : ids[0];
    const rest = ids.filter((id) => id !== main);
    if (!rest.length) return { rects: { [main]: { x: 0, y: 0, w: W, h: H } }, splitter: null, main };
    const mw = Math.round((W - gap) * split);
    const sw = W - gap - mw;
    const sh = (H - gap * (rest.length - 1)) / rest.length;
    const rects = { [main]: { x: 0, y: 0, w: mw, h: H } };
    rest.forEach((id, i) => { rects[id] = { x: mw + gap, y: i * (sh + gap), w: sw, h: sh }; });
    return { rects, splitter: { x: mw, y: 0, w: gap, h: H }, main };
  }

  function compute({ ids, mode, featuredId, split, focusId, width, height, gap = 8 }) {
    const W = Math.max(0, width), H = Math.max(0, height);
    if (focusId && ids.includes(focusId)) return { rects: { [focusId]: { x: 0, y: 0, w: W, h: H } }, splitter: null, main: focusId };
    if (mode === 'destaque' && ids.length) return featured(ids, featuredId, split, W, H, gap);
    return { rects: grid(ids, W, H, gap), splitter: null, main: null };
  }

  // Encaixa um conteudo com proporcao fixa dentro de uma area, centralizado.
  function fit(w, h, aspect) {
    const r = RATIOS[aspect];
    if (!r || w <= 0 || h <= 0) return { x: 0, y: 0, w: Math.max(0, w), h: Math.max(0, h) };
    let fw = w, fh = w / r;
    if (fh > h) { fh = h; fw = h * r; }
    return { x: (w - fw) / 2, y: (h - fh) / 2, w: fw, h: fh };
  }

  return { compute, fit, bestColumns, RATIOS };
});
