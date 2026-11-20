// Gera as cores Material 3 dos temas e copia a fonte Roboto Flex para dentro do app.
// Rodar: npm run theme   (so precisa rodar de novo ao mudar uma cor base ou atualizar a fonte)
//
// As cores saem do algoritmo oficial do Google (@material/material-color-utilities): a partir de uma
// cor base, ele gera todas as funcoes de cor do M3 (primary, surface-container, on-surface...) com o
// contraste entre os pares garantido. O resultado e um CSS estatico: o app nao carrega a biblioteca.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Hct, argbFromHex, hexFromArgb, Blend, TonalPalette, MaterialDynamicColors,
  SchemeTonalSpot, SchemeNeutral, SchemeMonochrome
} from '@material/material-color-utilities';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'src', 'renderer', 'm3');

// Tema -> cor base + variante do algoritmo.
const THEMES = {
  grafite: { seed: '#9ccc65', Scheme: SchemeNeutral },     // cinzas com um toque de verde
  aurora: { seed: '#7c4dff', Scheme: SchemeTonalSpot },    // violeta
  oceano: { seed: '#0288d1', Scheme: SchemeTonalSpot },    // azul
  areia: { seed: '#c4572e', Scheme: SchemeTonalSpot },     // terracota
  papel: { seed: '#5b5b66', Scheme: SchemeMonochrome }     // preto e branco
};

// Funcoes de cor do M3 exportadas como --md-sys-color-*.
const ROLES = [
  'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer',
  'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer',
  'tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer',
  'error', 'onError', 'errorContainer', 'onErrorContainer',
  'surface', 'onSurface', 'surfaceVariant', 'onSurfaceVariant', 'surfaceDim', 'surfaceBright',
  'surfaceContainerLowest', 'surfaceContainerLow', 'surfaceContainer', 'surfaceContainerHigh', 'surfaceContainerHighest',
  'outline', 'outlineVariant', 'inverseSurface', 'inverseOnSurface', 'inversePrimary', 'scrim', 'shadow', 'surfaceTint'
];
const kebab = (s) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

// Cores de status que o M3 nao tem (sucesso/aviso), harmonizadas com a primary de cada tema.
const STATUS = { success: '#2e7d32', warning: '#f9a825' };

function block(theme, mode) {
  const { seed, Scheme } = THEMES[theme];
  const dark = mode === 'dark';
  const scheme = new Scheme(Hct.fromInt(argbFromHex(seed)), dark, 0);
  const lines = ROLES.map((role) => `  --md-sys-color-${kebab(role)}: ${hexFromArgb(MaterialDynamicColors[role].getArgb(scheme))};`);
  for (const [name, hex] of Object.entries(STATUS)) {
    const palette = TonalPalette.fromInt(Blend.harmonize(argbFromHex(hex), scheme.primary));
    lines.push(`  --app-color-${name}: ${hexFromArgb(palette.tone(dark ? 80 : 45))};`);
  }
  return `[data-theme="${theme}"][data-mode="${mode}"] {\n${lines.join('\n')}\n}`;
}

const css = [
  '/* GERADO por scripts/build-theme.mjs (npm run theme). Nao editar a mao. */',
  ...Object.keys(THEMES).flatMap((t) => [block(t, 'light'), block(t, 'dark')]),
  // amostras dos seletores de tema (cor base de cada um)
  ...Object.entries(THEMES).map(([t, { seed, Scheme }]) => {
    const s = new Scheme(Hct.fromInt(argbFromHex(seed)), false, 0);
    return `.swatch[data-theme="${t}"] { --swatch-a: ${hexFromArgb(MaterialDynamicColors.primaryContainer.getArgb(s))}; --swatch-b: ${hexFromArgb(MaterialDynamicColors.primary.getArgb(s))}; }`;
  })
].join('\n\n') + '\n';

fs.mkdirSync(path.join(out, 'fonts'), { recursive: true });
fs.writeFileSync(path.join(out, 'colors.css'), css);

// Fonte: so o eixo de peso (wght), alfabetos latino e latino estendido (portugues, ingles, espanhol).
const fontDir = path.join(root, 'node_modules', '@fontsource-variable', 'roboto-flex');
for (const f of ['roboto-flex-latin-wght-normal.woff2', 'roboto-flex-latin-ext-wght-normal.woff2']) {
  fs.copyFileSync(path.join(fontDir, 'files', f), path.join(out, 'fonts', f));
}
fs.copyFileSync(path.join(fontDir, 'LICENSE'), path.join(out, 'fonts', 'OFL.txt'));

console.log(`ok: ${Object.keys(THEMES).length} temas x 2 modos -> src/renderer/m3/colors.css; fonte copiada para src/renderer/m3/fonts/`);
