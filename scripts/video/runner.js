'use strict';
// Grava UMA cena em video (MP4). Rodar pelo scripts/video/record.js, que passa:
//   VIDEO_SCENE=<id>  VIDEO_OUT=<arquivo.mp4>  IDLEHUB_USERDATA=<pasta com idlehub.json>
// O app roda como em desenvolvimento, numa janela 1600x900 (escala 1.2 -> 1920x1080) fora da tela.
// Os jogos sao paginas de demonstracao servidas aqui mesmo (hosts *.example); nada sai para a rede.
const { app, BrowserWindow, session } = require('electron');
const { spawn } = require('node:child_process');
const path = require('node:path');
const { demoHtml } = require('./demo-game');
const SCENES = require('./scenes');

const W = 1600, H = 900, SCALE = 1.2, FPS = 30;
const OW = Math.round(W * SCALE), OH = Math.round(H * SCALE);

app.commandLine.appendSwitch('force-device-scale-factor', String(SCALE));
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
BrowserWindow.prototype.maximize = function () {}; // o app maximiza; aqui o tamanho e fixo

// Jogos de demonstracao: qualquer https://*.example vira a pagina ficticia. O resto e bloqueado.
function serveDemo(ses) {
  const acc = path.basename(ses.storagePath || '');
  const seed = Number((acc.match(/(\d+)$/) || [0, 0])[1]);
  ses.protocol.handle('https', (req) => {
    const u = new URL(req.url);
    if (!u.hostname.endsWith('.example')) return new Response('', { status: 404 });
    if (u.pathname.startsWith('/favicon')) return new Response('', { status: 404 });
    return new Response(demoHtml(u.hostname, seed), { headers: { 'content-type': 'text/html; charset=utf-8' } });
  });
}
app.on('session-created', serveDemo);

app.on('browser-window-created', (_e, win) => {
  win.setContentSize(W, H);
  win.setPosition(-6000, 40);
  win.webContents.once('did-finish-load', () => setTimeout(() => run(win).catch((e) => { console.error(e); app.exit(1); }), 1500));
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// ---------- gravador: copia do compositor (inclui os <webview>) -> ffmpeg ----------
function recorder(ui, out) {
  let last = null, frames = 0, t0 = 0, timer = null, ff = null, done = null;
  const blank = Buffer.alloc(OW * OH * 4);
  const bitmap = () => {
    if (!last) return blank;
    const s = last.getSize();
    const img = s.width === OW && s.height === OH ? last : last.resize({ width: OW, height: OH, quality: 'best' });
    return img.toBitmap();
  };
  return {
    async start() {
      ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', `${OW}x${OH}`, '-r', String(FPS), '-i', '-',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
      done = new Promise((r) => ff.on('close', r));
      ui.beginFrameSubscription(false, (image) => { last = image; });
      ui.invalidate();
      for (let i = 0; i < 50 && !last; i++) await wait(20);
      t0 = Date.now();
      timer = setInterval(() => {
        const due = Math.floor(((Date.now() - t0) * FPS) / 1000);
        if (due <= frames) return;
        const buf = bitmap();
        while (frames < due) { ff.stdin.write(buf); frames++; }
      }, 1000 / FPS / 2);
    },
    async stop() {
      clearInterval(timer);
      ui.endFrameSubscription();
      ff.stdin.end();
      await done;
      return { frames, seconds: frames / FPS };
    }
  };
}

// ---------- diretor: cursor falso + eventos de mouse/teclado reais ----------
const CURSOR_CSS = `
#__cur{position:fixed;inset:auto;left:0;top:0;margin:0;padding:0;border:0;background:transparent;overflow:visible;pointer-events:none;width:28px;height:28px;
  transition:transform var(--d,600ms) cubic-bezier(.45,0,.2,1);will-change:transform;z-index:2147483647}
#__cur svg{position:absolute;left:-3px;top:-2px;width:26px;height:30px;filter:drop-shadow(0 3px 4px rgba(0,0,0,.45));transition:transform .12s}
#__cur.down svg{transform:scale(.86)}
#__cur .ring{position:absolute;left:-22px;top:-22px;width:44px;height:44px;border-radius:50%;border:3px solid #fff;background:rgba(255,255,255,.25);opacity:0;transform:scale(.3)}
#__cur .ring.go{animation:__ring .55s ease-out}
@keyframes __ring{0%{opacity:.95;transform:scale(.3)}100%{opacity:0;transform:scale(1.25)}}
`;
const CURSOR_JS = `(() => {
  if (window.__cur) return true;
  const c = document.createElement('div'); c.id = '__cur'; c.setAttribute('popover', 'manual');
  c.innerHTML = '<div class="ring"></div><svg viewBox="0 0 26 30"><path d="M3 2 L3 24 L8.6 18.8 L12.4 27.4 L16.4 25.6 L12.7 17.2 L20.4 17.2 Z" fill="#fff" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  document.body.appendChild(c);
  const top = () => { try { c.hidePopover(); } catch {} try { c.showPopover(); } catch {} };
  top();
  // qualquer <dialog> aberto depois fica por cima; o cursor volta para o topo
  new MutationObserver(() => setTimeout(top, 0)).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
  window.__cur = {
    move(x, y, ms) { c.style.setProperty('--d', ms + 'ms'); c.style.transform = 'translate(' + x + 'px,' + y + 'px)'; },
    down() { c.classList.add('down'); const r = c.querySelector('.ring'); r.classList.remove('go'); void r.offsetWidth; r.classList.add('go'); },
    up() { c.classList.remove('down'); },
    top
  };
  return true;
})()`;

function director(win) {
  const ui = win.webContents;
  let pos = { x: W * 0.62, y: H * 0.72 };
  const js = (code) => ui.executeJavaScript(code);
  const d = {
    ui, wait, js, W, H,
    async cursor() { await ui.insertCSS(CURSOR_CSS); await js(CURSOR_JS); await js(`__cur.move(${pos.x},${pos.y},0)`); },
    // centro (ou ponto relativo) de um elemento; sel e uma expressao JS que devolve o elemento
    async at(sel, fx = 0.5, fy = 0.5) {
      const r = await js(`(() => { const e = ${sel}; if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; })()`);
      if (!r) throw new Error('elemento nao achado: ' + sel);
      return { x: Math.round(r.x + r.w * fx), y: Math.round(r.y + r.h * fy) };
    },
    async waitFor(sel, ms = 8000) {
      for (let t = 0; t < ms; t += 100) { if (await js(`!!(${sel})`)) return; await wait(100); }
      throw new Error('demorou: ' + sel);
    },
    async moveTo(p, ms = 650) {
      const from = { ...pos };
      await js(`__cur.move(${p.x},${p.y},${ms})`);
      // por tempo (o timer do Windows atrasa): termina em ms, com quantos passos der
      for (const t0 = Date.now(); ;) {
        const f = Math.min(1, (Date.now() - t0) / ms), k = ease(f);
        ui.sendInputEvent({ type: 'mouseMove', x: Math.round(from.x + (p.x - from.x) * k), y: Math.round(from.y + (p.y - from.y) * k) });
        if (f >= 1) break;
        await wait(12);
      }
      pos = { ...p };
    },
    async move(sel, ms, fx, fy) { await d.moveTo(await d.at(sel, fx, fy), ms); },
    async click(sel, ms = 650, fx, fy, hold = 90) {
      if (sel) await d.move(sel, ms, fx, fy);
      await js('__cur.down()');
      ui.sendInputEvent({ type: 'mouseDown', x: pos.x, y: pos.y, button: 'left', clickCount: 1 });
      await wait(hold);
      ui.sendInputEvent({ type: 'mouseUp', x: pos.x, y: pos.y, button: 'left', clickCount: 1 });
      await js('__cur.up()');
    },
    async dblclick(sel, ms) {
      await d.click(sel, ms, undefined, undefined, 50);
      await wait(60);
      await js('__cur.down()');
      ui.sendInputEvent({ type: 'mouseDown', x: pos.x, y: pos.y, button: 'left', clickCount: 2 });
      await wait(50);
      ui.sendInputEvent({ type: 'mouseUp', x: pos.x, y: pos.y, button: 'left', clickCount: 2 });
      await js('__cur.up()');
    },
    async drag(sel, to, ms = 900) {
      await d.move(sel);
      await js('__cur.down()');
      ui.sendInputEvent({ type: 'mouseDown', x: pos.x, y: pos.y, button: 'left', clickCount: 1 });
      await wait(80);
      const from = { ...pos };
      await js(`__cur.move(${to.x},${to.y},${ms})`);
      for (const t0 = Date.now(); ;) {
        const f = Math.min(1, (Date.now() - t0) / ms), k = ease(f);
        ui.sendInputEvent({ type: 'mouseMove', x: Math.round(from.x + (to.x - from.x) * k), y: Math.round(from.y + (to.y - from.y) * k), button: 'left', modifiers: ['leftButtonDown'] });
        if (f >= 1) break;
        await wait(12);
      }
      pos = { ...to };
      ui.sendInputEvent({ type: 'mouseUp', x: pos.x, y: pos.y, button: 'left', clickCount: 1 });
      await js('__cur.up()');
    },
    async type(text, per = 55) { for (const ch of text) { ui.insertText(ch); await wait(per + Math.random() * 40); } },
    async key(keyCode) { ui.sendInputEvent({ type: 'keyDown', keyCode }); ui.sendInputEvent({ type: 'keyUp', keyCode }); },
    async scroll(dy, steps = 12) { for (let i = 0; i < steps; i++) { ui.sendInputEvent({ type: 'mouseWheel', x: pos.x, y: pos.y, deltaX: 0, deltaY: -dy / steps }); await wait(22); } },
    setPos(p) { pos = { ...p }; }
  };
  return d;
}

async function run(win) {
  const scene = SCENES[process.env.VIDEO_SCENE];
  if (!scene) throw new Error('cena desconhecida: ' + process.env.VIDEO_SCENE);
  const d = director(win);
  if (scene.setup) await scene.setup(d);
  await wait(scene.settle ?? 3500); // jogos carregados, skeleton fora
  await d.cursor();
  await wait(300);
  const rec = recorder(win.webContents, process.env.VIDEO_OUT);
  await rec.start();
  await scene.play(d);
  const info = await rec.stop();
  console.log(JSON.stringify({ scene: process.env.VIDEO_SCENE, ...info }));
  app.exit(0);
}

// O app de verdade (src/main/main.js), sem nenhuma mudanca.
require('../../src/main/main.js');
