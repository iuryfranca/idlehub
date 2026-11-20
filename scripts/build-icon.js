// Gera os icones do app a partir de build/icon.svg, usando o Chromium do proprio Electron (sem dependencias).
// Uso: npm run icon   ->  build/icon.png (512) e build/icon.ico (16 a 256)
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SVG = path.join(ROOT, 'build', 'icon.svg');
const ICO_SIZES = [16, 20, 24, 32, 40, 48, 64, 128, 256];

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
  const render = (size) => w.webContents.executeJavaScript(`new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => { const c = document.createElement('canvas'); c.width = c.height = ${size};
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(i, 0, 0, ${size}, ${size});
      res(c.toDataURL('image/png').split(',')[1]); };
    i.onerror = rej; i.src = ${JSON.stringify(svg)};
  })`).then((b64) => Buffer.from(b64, 'base64'));

  const pngs = [];
  for (const size of ICO_SIZES) pngs.push({ size, data: await render(size) });
  fs.writeFileSync(path.join(ROOT, 'build', 'icon.ico'), toIco(pngs));
  fs.writeFileSync(path.join(ROOT, 'build', 'icon.png'), await render(512));
  console.log('icon.ico:', ICO_SIZES.join(', '), 'px · icon.png 512 px');
  app.exit(0);
});
