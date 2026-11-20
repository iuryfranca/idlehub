// Gera os icones do app a partir de build/icon.svg, usando o Chromium do proprio Electron (sem dependencias).
// Uso: npm run icon   ->  build/icon.png (512), build/icon.ico (16 a 256) e as imagens do MSIX em build/appx/
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SVG = path.join(ROOT, 'build', 'icon.svg');
const APPX = path.join(ROOT, 'build', 'appx');
const ICO_SIZES = [16, 20, 24, 32, 40, 48, 64, 128, 256];

// Imagens do pacote MSIX (Microsoft Store). Nome = o que o manifesto pede + qualificador de escala/tamanho;
// o Windows escolhe a melhor para a tela. [largura, altura, tamanho do icone dentro].
// Fundo transparente: no Windows 11 o menu Iniciar e a barra de tarefas mostram so o icone.
const APPX_ASSETS = {
  'StoreLogo.scale-100.png': [50, 50, 50],
  'StoreLogo.scale-200.png': [100, 100, 100],
  'Square44x44Logo.scale-100.png': [44, 44, 44],
  'Square44x44Logo.scale-200.png': [88, 88, 88],
  'Square150x150Logo.scale-100.png': [150, 150, 100],
  'Square150x150Logo.scale-200.png': [300, 300, 200],
  'Wide310x150Logo.scale-100.png': [310, 150, 100],
  'Wide310x150Logo.scale-200.png': [620, 300, 200],
  'SmallTile.scale-100.png': [71, 71, 50],
  'SmallTile.scale-200.png': [142, 142, 100],
  'LargeTile.scale-100.png': [310, 310, 200],
  'LargeTile.scale-200.png': [620, 620, 400],
  'SplashScreen.scale-100.png': [620, 300, 200]
};
// Barra de tarefas, Alt+Tab, lista de apps: tamanhos exatos, "sem placa" (sem quadro colorido atras).
for (const s of [16, 24, 32, 48, 256]) {
  APPX_ASSETS[`Square44x44Logo.targetsize-${s}.png`] = [s, s, s];
  APPX_ASSETS[`Square44x44Logo.targetsize-${s}_altform-unplated.png`] = [s, s, s];
  APPX_ASSETS[`Square44x44Logo.targetsize-${s}_altform-lightunplated.png`] = [s, s, s];
}

// ICO com imagens PNG dentro (aceito pelo Windows desde o Vista).
function toIco(pngs) {
  const head = Buffer.alloc(6);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
  const dir = Buffer.alloc(16 * pngs.length);
  let offset = 6 + dir.length;
  pngs.forEach(({ size, data }, i) => {
    const o = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, o); dir.writeUInt8(size >= 256 ? 0 : size, o + 1);
    dir.writeUInt8(0, o + 2); dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4); dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(data.length, o + 8); dir.writeUInt32LE(offset, o + 12);
    offset += data.length;
  });
  return Buffer.concat([head, dir, ...pngs.map((p) => p.data)]);
}

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false });
  await w.loadURL('data:text/html,<p>icon</p>');
  const svg = 'data:image/svg+xml;base64,' + fs.readFileSync(SVG).toString('base64');
  // Desenha o icone (lado `icon`) centralizado numa imagem `width` x `height` com fundo transparente.
  const render = (width, height = width, icon = Math.min(width, height)) => w.webContents.executeJavaScript(`new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => { const c = document.createElement('canvas'); c.width = ${width}; c.height = ${height};
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
      x.drawImage(i, Math.round((${width} - ${icon}) / 2), Math.round((${height} - ${icon}) / 2), ${icon}, ${icon});
      res(c.toDataURL('image/png').split(',')[1]); };
    i.onerror = rej; i.src = ${JSON.stringify(svg)};
  })`).then((b64) => Buffer.from(b64, 'base64'));

  const pngs = [];
  for (const size of ICO_SIZES) pngs.push({ size, data: await render(size) });
  fs.writeFileSync(path.join(ROOT, 'build', 'icon.ico'), toIco(pngs));
  fs.writeFileSync(path.join(ROOT, 'build', 'icon.png'), await render(512));

  fs.rmSync(APPX, { recursive: true, force: true });
  fs.mkdirSync(APPX, { recursive: true });
  for (const [name, [width, height, icon]] of Object.entries(APPX_ASSETS)) fs.writeFileSync(path.join(APPX, name), await render(width, height, icon));

  console.log('icon.ico:', ICO_SIZES.join(', '), 'px · icon.png 512 px · build/appx:', Object.keys(APPX_ASSETS).length, 'imagens');
  app.exit(0);
});
