'use strict';
// Processo principal do IdleHub: janela, atalhos, IPC e ligacao com a politica dos paineis.
const electron = require('electron');
const { app, BrowserWindow, ipcMain, session, shell, Menu, nativeTheme } = electron;
const fs = require('node:fs');
const path = require('node:path');
const { Store, partitionOf, accountOfPartition, langFromLocale } = require('./store');
const { installPanelPolicy, setPanelLanguage } = require('./panels');
const { chromeLikeUserAgent } = require('./user-agent');
const { createMonitor } = require('./monitor');
const catalog = require('./catalog');

const IS_DEV = !app.isPackaged;
const RENDERER = path.resolve(__dirname, '..', 'renderer');
const PRELOAD = path.resolve(__dirname, '..', 'preload.js');

// Em desenvolvimento, permite apontar os dados para outra pasta (testes automaticos).
if (IS_DEV && process.env.IDLEHUB_USERDATA) app.setPath('userData', path.resolve(process.env.IDLEHUB_USERDATA));

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) app.quit();

app.userAgentFallback = chromeLikeUserAgent(app.userAgentFallback);

/** @type {BrowserWindow|null} */
let mainWindow = null;
/** @type {Store|null} */
let store = null;

function toRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload);
}

// Links externos vao para o navegador padrao, no maximo 3 a cada 10 segundos.
const recentOpens = [];
function openOutside(url) {
  if (!/^https?:\/\//i.test(String(url))) return;
  const now = Date.now();
  while (recentOpens.length && now - recentOpens[0] > 10_000) recentOpens.shift();
  if (recentOpens.length >= 3) return;
  recentOpens.push(now);
  shell.openExternal(String(url));
}

app.on('web-contents-created', (_event, contents) => installPanelPolicy({
  lookup: (partition) => {
    const account = store && store.account(accountOfPartition(partition));
    const game = account && store.game(account.gameId);
    return game ? { gameUrl: game.url } : null;
  },
  openOutside,
  onEscape: () => toRenderer('hotkey', 'escape'),
  popupParent: () => mainWindow
})(contents));

// ---------- IPC (aceito apenas do frame principal da janela do app) ----------
function expose(channel, handler) {
  ipcMain.handle(channel, (event, ...args) => {
    const trusted = mainWindow && event.sender === mainWindow.webContents && event.senderFrame === mainWindow.webContents.mainFrame;
    if (!trusted) throw new Error('origem nao autorizada');
    return handler(...args);
  });
}

expose('state:load', () => ({ state: store.state, catalog, version: app.getVersion() }));
expose('state:save', (next) => {
  const saved = store.save(next);
  setPanelLanguage(saved.prefs.lang);
  applyMode(saved.prefs.mode);
  return saved;
});
expose('account:clear', async (accountId) => {
  // So limpa sessao de conta que ja saiu do estado salvo (evita apagar uma conta ativa por engano).
  const partition = partitionOf(String(accountId));
  if (!accountOfPartition(partition) || store.account(accountId)) return false;
  const ses = session.fromPartition(partition);
  await Promise.all([ses.clearStorageData(), ses.clearCache()]);
  return true;
});
// ---------- monitor e acoes por conta ----------
let monitor = null;
const existingAccount = (accountId) => (typeof accountId === 'string' && store.account(accountId) ? accountId : null);
expose('monitor:start', () => { monitor.start(); return true; });
expose('monitor:stop', () => { monitor.stop(); return true; });
expose('account:restart', (accountId) => (existingAccount(accountId) ? monitor.restartAccount(accountId) : false));
// Processos do Windows: a lista so e coletada com a secao ligada; encerrar confere tudo de novo aqui.
expose('winproc:enable', (on) => monitor.setWindowsProcesses(on === true));
expose('winproc:kill', (pid, name) => (Number.isInteger(pid) && typeof name === 'string' ? monitor.killWindowsProcess({ pid, name }) : { ok: false, reason: 'invalid' }));
expose('account:clearCache', async (accountId) => {
  // So o cache (imagens, scripts baixados); cookies e login ficam.
  if (!existingAccount(accountId)) return false;
  await session.fromPartition(partitionOf(accountId)).clearCache();
  return true;
});

expose('window:fullscreen', () => {
  mainWindow.setFullScreen(!mainWindow.isFullScreen());
  return mainWindow.isFullScreen();
});
expose('open:external', (url) => openOutside(url));

// ---------- atalhos ----------
// Menu oculto: os aceleradores funcionam mesmo com o foco dentro de um jogo.
function installShortcuts() {
  const shortcut = (accelerator, action) => ({ label: action, accelerator, click: () => toRenderer('hotkey', action) });
  const focusKeys = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => shortcut(`CmdOrCtrl+${n}`, `focus-${n}`));
  const shortcuts = [
    shortcut('F11', 'fullscreen'),
    shortcut('CmdOrCtrl+B', 'drawer'),
    shortcut('CmdOrCtrl+M', 'mute'),
    shortcut('CmdOrCtrl+=', 'zoom-in'),
    shortcut('CmdOrCtrl+Plus', 'zoom-in'),
    shortcut('CmdOrCtrl+-', 'zoom-out'),
    shortcut('CmdOrCtrl+0', 'zoom-reset'),
    shortcut('CmdOrCtrl+Shift+L', 'layout'),
    ...focusKeys
  ];
  if (IS_DEV) shortcuts.push({ role: 'toggleDevTools', accelerator: 'CmdOrCtrl+Shift+I' });
  const editing = ['undo', 'redo', 'cut', 'copy', 'paste', 'selectAll'].map((role) => ({ role }));
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Atalhos', submenu: shortcuts },
    { label: 'Editar', submenu: editing }
  ]));
}

// ---------- janela ----------
// Aparencia escolhida no app vale tambem para os jogos (prefers-color-scheme dentro dos paineis).
const THEME_SOURCE = { sistema: 'system', claro: 'light', escuro: 'dark' };
function applyMode(mode) { nativeTheme.themeSource = THEME_SOURCE[mode] || 'system'; }

function openMainWindow() {
  mainWindow = new BrowserWindow({
    title: 'IdleHub',
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 560,
    show: false,
    // cor de fundo antes da interface carregar (surface do M3), para nao piscar no modo errado
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#131412' : '#fcf9f5',
    autoHideMenuBar: true,
    webPreferences: {
      preload: PRELOAD,
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      backgroundThrottling: false
    }
  });
  mainWindow.setMenuBarVisibility(false);

  const ui = mainWindow.webContents;
  // A interface nunca troca de pagina; qualquer link vira aba no navegador padrao.
  ui.on('will-navigate', (event, url) => {
    if (url === ui.getURL()) return;
    event.preventDefault();
    openOutside(url);
  });
  ui.setWindowOpenHandler(({ url }) => {
    openOutside(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => monitor?.stop());
  mainWindow.on('enter-full-screen', () => toRenderer('fullscreen', true));
  mainWindow.on('leave-full-screen', () => toRenderer('fullscreen', false));
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });
  mainWindow.loadFile(path.join(RENDERER, 'index.html'));

  if (IS_DEV && process.env.IDLEHUB_SMOKE) runSmokeCapture(ui);
}

// Teste automatico (so em desenvolvimento): roda um script opcional na interface, salva um print e fecha.
function runSmokeCapture(ui) {
  const out = process.env.IDLEHUB_SMOKE;
  const delay = Number(process.env.IDLEHUB_SMOKE_DELAY) || 2500;
  ui.once('did-finish-load', () => {
    setTimeout(async () => {
      try {
        const script = process.env.IDLEHUB_SMOKE_JS;
        if (script) {
          const result = await ui.executeJavaScript(fs.readFileSync(script, 'utf8'));
          fs.writeFileSync(`${out}.json`, JSON.stringify(result, null, 2));
        }
        const image = await ui.capturePage();
        fs.writeFileSync(out, image.toPNG());
      } finally {
        app.quit();
      }
    }, delay);
  });
}

app.on('second-instance', () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.whenReady().then(() => {
  if (!hasLock) return;
  session.defaultSession.setPermissionRequestHandler((_wc, permission, reply) => reply(permission === 'clipboard-sanitized-write'));
  store = new Store(path.join(app.getPath('userData'), 'idlehub.json'));
  // Primeira abertura: idioma do sistema.
  if (!store.state.prefs.lang) store.save({ ...store.state, prefs: { ...store.state.prefs, lang: langFromLocale(app.getLocale()) } });
  setPanelLanguage(store.state.prefs.lang);
  applyMode(store.state.prefs.mode);
  monitor = createMonitor({ store, send: (sample) => toRenderer('monitor:sample', sample), uiContents: () => (mainWindow && !mainWindow.isDestroyed() ? mainWindow.webContents : null) });
  installShortcuts();
  openMainWindow();
});

app.on('window-all-closed', () => app.quit());
