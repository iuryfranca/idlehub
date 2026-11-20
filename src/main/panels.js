'use strict';
// Politica dos paineis de jogo (<webview>): o que pode ser criado, para onde pode navegar,
// o que cada sessao pode pedir e como um painel se recupera de queda ou travamento.
const { session } = require('electron');
const { accountOfPartition } = require('./store');

// Preferencias impostas a todo painel, independente do que a interface pedir.
const ON = ['contextIsolation', 'sandbox', 'webSecurity'];
const OFF = [
  'allowRunningInsecureContent', 'backgroundThrottling', 'experimentalFeatures', 'nodeIntegration',
  'nodeIntegrationInSubFrames', 'nodeIntegrationInWorker', 'plugins', 'webviewTag'
]; // backgroundThrottling desligado: jogo idle precisa continuar rodando fora de vista
const LOCKED_PREFS = Object.freeze(Object.fromEntries([...ON.map((k) => [k, true]), ...OFF.map((k) => [k, false])]));
const UNSAFE_PREFS = ['preload', 'preloadURL', 'enableBlinkFeatures'];

const GRANTED = new Set(['clipboard-sanitized-write', 'fullscreen']);
const BLOCKED_CHECKS = new Set(['media', 'speaker-selection', 'notifications', 'geolocation']);
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const isGeneratedImage = (url) => url.startsWith('data:') && IMAGE_TYPES.has(url.slice(5).split(/[;,]/)[0]);

const RETRY_DELAYS_MS = [2000, 5000, 15000, 30000, 60000];
const STABLE_AFTER_MS = 90_000;  // ficou de pe esse tempo: zera a contagem de quedas
const HANG_LIMIT_MS = 25_000;    // sem responder por esse tempo: derruba para recarregar

const originOf = (u) => (URL.canParse(String(u)) ? new URL(String(u)).origin : null);
const sameOrigin = (a, b) => originOf(a) !== null && originOf(a) === originOf(b);
const isWebUrl = (u) => /^https?:\/\//i.test(String(u));

function lockSession(partition) {
  const ses = session.fromPartition(partition);
  if (ses.__idlehubLocked) return;
  ses.__idlehubLocked = true;
  ses.setPermissionRequestHandler((_wc, permission, reply) => reply(GRANTED.has(permission)));
  ses.setPermissionCheckHandler((_wc, permission) => !BLOCKED_CHECKS.has(permission));
  ses.on('will-download', (event, item) => {
    if (!isGeneratedImage(item.getURL())) event.preventDefault();
  });
}

// Recarrega um painel que caiu, esperando cada vez mais entre tentativas,
// e derruba de proposito um painel travado para que ele passe pela mesma recarga.
function attachRecovery(contents) {
  const state = { failures: 0, upSince: 0, hang: null };
  const alive = () => !contents.isDestroyed();
  const clearHang = () => { clearTimeout(state.hang); state.hang = null; };
  const handlers = {
    'did-finish-load': () => { state.upSince = Date.now(); },
    'render-process-gone': (_event, { reason }) => {
      if (reason === 'clean-exit') return;
      const stable = state.upSince > 0 && Date.now() - state.upSince >= STABLE_AFTER_MS;
      state.failures = stable ? 0 : state.failures;
      state.upSince = 0;
      const step = Math.min(state.failures++, RETRY_DELAYS_MS.length - 1);
      setTimeout(() => alive() && contents.reload(), RETRY_DELAYS_MS[step]);
    },
    unresponsive: () => {
      clearHang();
      state.hang = setTimeout(() => alive() && contents.forcefullyCrashRenderer(), HANG_LIMIT_MS);
    },
    responsive: clearHang,
    destroyed: clearHang
  };
  for (const [name, fn] of Object.entries(handlers)) contents.on(name, fn);
}

// Criacao: so conta existente, so no site do proprio jogo, sempre com as preferencias travadas.
function guardAttach(hooks) {
  return (event, prefs, params) => {
    UNSAFE_PREFS.forEach((key) => Reflect.deleteProperty(prefs, key));
    const partition = String(params.partition ?? '');
    Object.assign(prefs, LOCKED_PREFS, { partition });
    const target = accountOfPartition(partition) ? hooks.lookup(partition) : null;
    if (target && sameOrigin(params.src, target.gameUrl)) lockSession(partition);
    else event.preventDefault();
  };
}

// Popups (login social etc.) abrem numa janela propria, na mesma sessao da conta; o resto vai pro navegador.
function popupPolicy(hooks) {
  return ({ url }) => {
    if (/^https:/i.test(url)) {
      const webPreferences = { contextIsolation: true, nodeIntegration: false, sandbox: true };
      const overrideBrowserWindowOptions = { width: 520, height: 720, autoHideMenuBar: true, parent: hooks.popupParent() ?? undefined, webPreferences };
      return { action: 'allow', overrideBrowserWindowOptions };
    }
    hooks.openOutside(url);
    return { action: 'deny' };
  };
}

// Regras de um painel ja criado.
function guardPanel(contents, hooks) {
  contents.setWindowOpenHandler(popupPolicy(hooks));
  // O frame principal so vai para paginas web (nada de file:, data:, esquemas de app).
  const keepOnWeb = (event, url) => {
    const subFrame = event.isMainFrame === false;
    if (!subFrame && !isWebUrl(url) && url !== 'about:blank') event.preventDefault();
  };
  for (const name of ['will-navigate', 'will-redirect']) contents.on(name, keepOnWeb);
  // Esc dentro do jogo tambem sai do modo foco, sem impedir que o jogo receba a tecla.
  contents.on('before-input-event', (_event, input) => {
    const escPressed = input.type === 'keyDown' && input.key === 'Escape' && !input.isAutoRepeat;
    if (escPressed) hooks.onEscape();
  });
  attachRecovery(contents);
}

/**
 * Instala a politica em todo webContents novo do app.
 * @param {{ lookup(partition: string): { gameUrl: string } | null, openOutside(url: string): void,
 *           onEscape(): void, popupParent(): Electron.BrowserWindow | null }} hooks
 */
function installPanelPolicy(hooks) {
  return (contents) => {
    contents.on('will-attach-webview', guardAttach(hooks));
    if (contents.getType() === 'webview') guardPanel(contents, hooks);
  };
}

module.exports = { installPanelPolicy, LOCKED_PREFS };
