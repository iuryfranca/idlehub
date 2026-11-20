// Gera src/themes.json: as mesmas paletas Material 3 do app (scripts/build-theme.mjs na raiz),
// com as mesmas cores base. O site nao carrega a biblioteca de cores: so o resultado.
import fs from 'node:fs';
import {
  Hct, argbFromHex, hexFromArgb, MaterialDynamicColors, SchemeTonalSpot, SchemeNeutral, SchemeMonochrome
} from '@material/material-color-utilities';

const THEMES = {
  aurora: { seed: '#7c4dff', Scheme: SchemeTonalSpot },
  oceano: { seed: '#0288d1', Scheme: SchemeTonalSpot },
  grafite: { seed: '#9ccc65', Scheme: SchemeNeutral },
  areia: { seed: '#c4572e', Scheme: SchemeTonalSpot },
  papel: { seed: '#5b5b66', Scheme: SchemeMonochrome }
};
const ROLES = [
  'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer',
  'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer',
  'tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer',
  'error', 'surface', 'onSurface', 'onSurfaceVariant', 'surfaceDim', 'surfaceBright',
  'surfaceContainerLowest', 'surfaceContainerLow', 'surfaceContainer', 'surfaceContainerHigh', 'surfaceContainerHighest',
  'outline', 'outlineVariant', 'inverseSurface', 'inverseOnSurface', 'inversePrimary'
];
const kebab = (s) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

const out = {};
for (const [name, { seed, Scheme }] of Object.entries(THEMES)) {
  out[name] = { seed };
  for (const mode of ['light', 'dark']) {
    const scheme = new Scheme(Hct.fromInt(argbFromHex(seed)), mode === 'dark', 0);
    out[name][mode] = Object.fromEntries(ROLES.map((r) => [kebab(r), hexFromArgb(MaterialDynamicColors[r].getArgb(scheme))]));
  }
}
fs.writeFileSync(new URL('../src/themes.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
console.log('themes.json:', Object.keys(out).join(', '));
