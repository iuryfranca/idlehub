'use strict';
// Monta um User-Agent igual ao de um Chrome comum a partir do UA padrao do Electron.
// Sites atras de protecao anti-bot desconfiam de UAs com "Electron/x" ou com o nome do app,
// e de versoes completas do Chrome que nao batem com os Client Hints (que so expoem a versao principal).
const KEEP = /^(Mozilla|AppleWebKit|Chrome|Safari|Gecko)\b/;

function chromeLikeUserAgent(original) {
  const parts = String(original).match(/\([^)]*\)|\S+/g) || [];
  return parts
    .filter((p) => p.startsWith('(') || p === 'like' || KEEP.test(p))
    .map((p) => {
      const chrome = /^Chrome\/(\d+)/.exec(p);
      return chrome ? `Chrome/${chrome[1]}.0.0.0` : p;
    })
    .join(' ');
}

module.exports = { chromeLikeUserAgent };
