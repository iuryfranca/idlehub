'use strict';
// Confere as cores geradas (src/renderer/m3/colors.css): todos os temas nos dois modos,
// e contraste WCAG suficiente nos pares que a interface usa para texto e icones.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer', 'm3', 'colors.css'), 'utf8');
const blocks = {};
for (const m of css.matchAll(/\[data-theme="(\w+)"\]\[data-mode="(\w+)"\]\s*\{([^}]*)\}/g)) {
  blocks[`${m[1]}/${m[2]}`] = Object.fromEntries([...m[3].matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/g)].map((x) => [x[1], x[2]]));
}

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

test('5 temas x 2 modos gerados', () => {
  for (const t of ['grafite', 'aurora', 'oceano', 'areia', 'papel']) for (const m of ['light', 'dark']) assert.ok(blocks[`${t}/${m}`], `${t}/${m}`);
});

// [fundo, texto, minimo]: 4.5 para texto normal, 3 para elementos graficos (WCAG 2.x)
const PAIRS = [
  ['md-sys-color-surface', 'md-sys-color-on-surface', 4.5],
  ['md-sys-color-surface', 'md-sys-color-on-surface-variant', 4.5],
  ['md-sys-color-surface-container-low', 'md-sys-color-on-surface-variant', 4.5],
  ['md-sys-color-surface-container-high', 'md-sys-color-on-surface', 4.5],
  ['md-sys-color-primary', 'md-sys-color-on-primary', 4.5],
  ['md-sys-color-primary-container', 'md-sys-color-on-primary-container', 4.5],
  ['md-sys-color-secondary-container', 'md-sys-color-on-secondary-container', 4.5],
  ['md-sys-color-inverse-surface', 'md-sys-color-inverse-on-surface', 4.5],
  ['md-sys-color-surface', 'md-sys-color-primary', 3],
  ['md-sys-color-surface-container-high', 'md-sys-color-error', 3],
  ['md-sys-color-surface-container-low', 'app-color-success', 3],
  ['md-sys-color-surface-container-low', 'app-color-warning', 3],
  ['md-sys-color-surface', 'md-sys-color-outline', 3]
];

for (const [name, vars] of Object.entries(blocks)) {
  test(`contraste ${name}`, () => {
    for (const [bg, fg, min] of PAIRS) {
      const c = contrast(vars[bg], vars[fg]);
      assert.ok(c >= min, `${name}: ${fg} sobre ${bg} = ${c.toFixed(2)} (minimo ${min})`);
    }
  });
}
