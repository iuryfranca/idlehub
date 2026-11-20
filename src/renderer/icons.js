'use strict';
// Icones proprios em SVG (traco simples, 20x20). Montados com createElementNS: sem innerHTML.
(function () {
  const P = {
    menu: ['M3.5 6h13', 'M3.5 10h13', 'M3.5 14h13'],
    plus: ['M10 4.5v11', 'M4.5 10h11'],
    minus: ['M4.5 10h11'],
    check: ['M4.5 10.5l3.5 3.5 7.5-8'],
    sun: ['M10 7a3 3 0 1 0 0 6a3 3 0 1 0 0-6', 'M10 2.5v1.5', 'M10 16v1.5', 'M2.5 10H4', 'M16 10h1.5', 'M4.7 4.7l1 1', 'M14.3 14.3l1 1', 'M4.7 15.3l1-1', 'M14.3 5.7l1-1'],
    moon: ['M15.5 12.5A6 6 0 0 1 7.5 4.5a6 6 0 1 0 8 8z'],
    auto: ['M10 3.5a6.5 6.5 0 1 0 0 13z', 'M10 3.5a6.5 6.5 0 0 1 0 13'],
    sound: ['M4 8h3l4-3v10l-4-3H4z', 'M14 7.5a3.5 3.5 0 0 1 0 5', 'M15.8 5.5a6 6 0 0 1 0 9'],
    mute: ['M4 8h3l4-3v10l-4-3H4z', 'M14 8l4 4', 'M18 8l-4 4'],
    expand: ['M4 8V4h4', 'M16 8V4h-4', 'M4 12v4h4', 'M16 12v4h-4'],
    shrink: ['M8 4v4H4', 'M12 4v4h4', 'M8 16v-4H4', 'M12 16v-4h4'],
    reload: ['M15.5 7A6 6 0 1 0 16 11', 'M16 3.5V7h-3.5'],
    star: ['M10 3.2l2 4.3 4.6.5-3.4 3.1 1 4.6L10 13.4l-4.2 2.3 1-4.6L3.4 8l4.6-.5z'],
    edit: ['M4 16l1-4 8-8 3 3-8 8z', 'M11.5 5.5l3 3'],
    trash: ['M4 6h12', 'M8 6V4h4v2', 'M6 6l1 10h6l1-10'],
    gear: ['M3 6h8', 'M15 6h2', 'M13 4v4', 'M3 14h2', 'M9 14h8', 'M7 12v4'],
    full: ['M3 7V3h4', 'M17 7V3h-4', 'M3 13v4h4', 'M17 13v4h-4', 'M7 7h6v6H7z'],
    unfull: ['M7 3v4H3', 'M13 3v4h4', 'M7 17v-4H3', 'M13 17v-4h4']
  };
  const NS = 'http://www.w3.org/2000/svg';
  window.HubIcon = function icon(name) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('ico');
    for (const d of P[name] || []) {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      svg.appendChild(p);
    }
    return svg;
  };
})();
