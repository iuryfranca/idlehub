// Redimensiona PNGs com o nativeImage do Electron (sem dependencias). Uso: electron scripts/resize-images.js <entrada> <saida> <largura>
const { app, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');
app.whenReady().then(() => {
  const [src, dst, width] = process.argv.slice(-3);
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(src).filter((n) => n.endsWith('.png'))) {
    const img = nativeImage.createFromPath(path.join(src, f));
    const out = img.resize({ width: Number(width), quality: 'best' }).toPNG();
    fs.writeFileSync(path.join(dst, f), out);
    console.log(f, img.getSize().width + 'px ->', width + 'px,', Math.round(out.length / 1024) + ' KB');
  }
  app.quit();
});
