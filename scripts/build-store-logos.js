// Gera as imagens de logotipo da listagem da Microsoft Store a partir de build/icon.svg (Chromium do Electron).
// Uso: npm run store-logos  ->  docs/store/screens/{.,en,es}/store-*.png
//  - icone do bloco 1:1 (300, 150, 71) com fundo transparente;
//  - arte de caixa 1:1 (1080, 2160) e poster 9:16 (720x1080, 1440x2160): icone sobre fundo escuro com brilho Aurora;
//    o poster leva o nome "IdleHub" na Roboto Flex (a mesma fonte do app).
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SVG = fs.readFileSync(path.join(ROOT, 'build', 'icon.svg')).toString('base64');
const FONT = fs.readFileSync(path.join(ROOT, 'src', 'renderer', 'm3', 'fonts', 'roboto-flex-latin-wght-normal.woff2')).toString('base64');
const DIRS = ['', 'en', 'es'].map((d) => path.join(ROOT, 'docs', 'store', 'screens', d));

// [arquivo, largura, altura, tipo]
const IMAGES = [
  ['store-tile-300.png', 300, 300, 'icon'],
  ['store-tile-150.png', 150, 150, 'icon'],
  ['store-tile-71.png', 71, 71, 'icon'],
  ['store-boxart-1080.png', 1080, 1080, 'box'],
  ['store-boxart-2160.png', 2160, 2160, 'box'],
  ['store-poster-720x1080.png', 720, 1080, 'poster'],
  ['store-poster-1440x2160.png', 1440, 2160, 'poster']
];

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false });
  await w.loadURL('data:text/html,<p>logos</p>');
  await w.webContents.executeJavaScript(`(async () => {
    const f = new FontFace('Roboto Flex', 'url(data:font/woff2;base64,${FONT})', { weight: '100 1000' });
    document.fonts.add(await f.load());
    window.icon = await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/svg+xml;base64,${SVG}'; });
  })()`);
  for (const [name, W, H, kind] of IMAGES) {
    const b64 = await w.webContents.executeJavaScript(`(() => {
      const W = ${W}, H = ${H}, kind = '${kind}';
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
      if (kind === 'icon') { x.drawImage(icon, 0, 0, W, H); return c.toDataURL('image/png').split(',')[1]; }
      // fundo: quase preto + brilho violeta/rosa vindo de baixo (a faixa Aurora do site)
      x.fillStyle = '#131218'; x.fillRect(0, 0, W, H);
      const g1 = x.createRadialGradient(W * 0.3, H * 1.05, 0, W * 0.3, H * 1.05, Math.max(W, H) * 0.75);
      g1.addColorStop(0, 'rgba(124,77,255,.55)'); g1.addColorStop(1, 'rgba(124,77,255,0)');
      x.fillStyle = g1; x.fillRect(0, 0, W, H);
      const g2 = x.createRadialGradient(W * 0.8, H * 1.0, 0, W * 0.8, H * 1.0, Math.max(W, H) * 0.6);
      g2.addColorStop(0, 'rgba(238,184,202,.35)'); g2.addColorStop(1, 'rgba(238,184,202,0)');
      x.fillStyle = g2; x.fillRect(0, 0, W, H);
      // grade de pontinhos
      x.fillStyle = 'rgba(255,255,255,.07)';
      const step = Math.round(W / 40), r = Math.max(1, W / 900);
      for (let yy = step / 2; yy < H; yy += step) for (let xx = step / 2; xx < W; xx += step) { x.beginPath(); x.arc(xx, yy, r, 0, 7); x.fill(); }
      if (kind === 'box') {
        const s = W * 0.52; x.drawImage(icon, (W - s) / 2, (H - s) / 2, s, s);
      } else {
        const s = W * 0.56; x.drawImage(icon, (W - s) / 2, H * 0.3, s, s);
        x.fillStyle = '#e6e1e9'; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
        x.font = '600 ' + Math.round(W * 0.15) + 'px "Roboto Flex"';
        x.fillText('IdleHub', W / 2, H * 0.3 + s + W * 0.22);
      }
      return c.toDataURL('image/png').split(',')[1];
    })()`);
    const buf = Buffer.from(b64, 'base64');
    for (const d of DIRS) { fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, name), buf); }
    console.log(name, `${W}x${H}`, Math.round(buf.length / 1024) + ' KB');
  }
  app.exit(0);
});
