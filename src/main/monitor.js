'use strict';
// Monitor de recursos: so coleta enquanto a tela Monitor esta aberta. Nada e gravado em disco nem enviado.
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { app, webContents } = require('electron');
const core = require('./monitor-core');

const SAMPLE_MS = 1000;
const SAMPLER_SCRIPT = path.join(__dirname, 'perf-sampler.ps1');

// GPU, disco e rede vem dos contadores do Windows (API PDH com nomes em ingles, que valem em qualquer idioma).
// Um unico PowerShell fica rodando enquanto a tela esta aberta e sai sozinho se o IdleHub fechar.
class WindowsCounters {
  constructor() { this.latest = null; this.proc = null; this.available = process.platform === 'win32'; }
  start() {
    if (!this.available || this.proc) return;
    let script;
    try { script = `$ParentPid = ${process.pid}\n` + fs.readFileSync(SAMPLER_SCRIPT, 'utf8'); } catch { this.available = false; return; }
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    const proc = spawn('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', encoded], { windowsHide: true });
    this.proc = proc;
    let buffer = '';
    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', (chunk) => {
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('{')) continue;
        try { this.latest = core.fromPdh(JSON.parse(line)); } catch {}
      }
    });
    proc.on('error', () => { this.available = false; });
    proc.on('exit', (code) => { if (this.proc === proc) { this.proc = null; if (code && !this.latest) this.available = false; } });
  }
  stop() { if (this.proc) { try { this.proc.kill(); } catch {} this.proc = null; } this.latest = null; }
}

/**
 * @param {{ store: import('./store').Store, send(sample: object): void, uiContents(): Electron.WebContents | null }} deps
 */
function createMonitor(deps) {
  const counters = new WindowsCounters();
  let timer = null;
  let prevCpu = null;
  const cores = os.cpus().length;

  // Liga cada processo ao que ele e: painel de qual conta, popup de login, a interface do app...
  function contextByPid() {
    const map = new Map();
    const ui = deps.uiContents();
    for (const wc of webContents.getAllWebContents()) {
      if (wc.isDestroyed()) continue;
      const pid = wc.getOSProcessId();
      const accountId = core.accountFromStoragePath(wc.session.storagePath);
      const kind = wc === ui ? 'window' : wc.getType();
      if (!map.has(pid) || accountId) map.set(pid, { accountId, kind });
    }
    return map;
  }

  function sample() {
    const started = process.hrtime.bigint();
    const cpuNow = core.cpuTotals(os.cpus());
    const systemCpu = prevCpu ? core.cpuPercent(prevCpu, cpuNow) : 0;
    prevCpu = cpuNow;

    const ctx = contextByPid();
    const win = counters.latest;
    const processes = app.getAppMetrics().map((m) => {
      const c = ctx.get(m.pid) || {};
      return {
        pid: m.pid,
        kind: core.classifyProcess(m, c),
        accountId: c.accountId || null,
        // No Electron 43, percentCPUUsage ja vem como "% da maquina inteira", igual ao Gerenciador de Tarefas
        // (medido: um nucleo ocupado num processador de 16 threads = ~6,2%).
        cpu: core.clampPct(m.cpu.percentCPUUsage),
        mem: (m.memory.workingSetSize || 0) * 1024,
        gpu: win && win.gpuByPid[m.pid] != null ? win.gpuByPid[m.pid] : null
      };
    });
    const sum = (key) => processes.reduce((acc, p) => acc + (p[key] || 0), 0);

    const total = os.totalmem();
    deps.send({
      t: Date.now(),
      system: {
        cpu: systemCpu, cores, cpuModel: os.cpus()[0]?.model?.trim() || '',
        memTotal: total, memUsed: total - os.freemem(),
        gpu: win ? win.gpu : null, diskActive: win ? win.diskActive : null, diskBps: win ? win.diskBps : null,
        netRx: win ? win.netRx : null, netTx: win ? win.netTx : null,
        countersAvailable: counters.available
      },
      app: { cpu: core.clampPct(sum('cpu')), mem: sum('mem'), gpu: processes.some((p) => p.gpu != null) ? core.clampPct(sum('gpu')) : null },
      processes,
      costMs: Number(process.hrtime.bigint() - started) / 1e6
    });
  }

  return {
    start() {
      if (timer) return;
      prevCpu = core.cpuTotals(os.cpus());
      app.getAppMetrics(); // primeira leitura de CPU por processo sempre vem 0: descarta
      counters.start();
      timer = setInterval(sample, SAMPLE_MS);
    },
    stop() {
      clearInterval(timer); timer = null;
      counters.stop();
    },
    // Encerra o processo do painel de uma conta. O watchdog de panels.js recarrega o painel logo em seguida.
    restartAccount(accountId) {
      const wc = webContents.getAllWebContents().find((w) => w.getType() === 'webview' && core.accountFromStoragePath(w.session.storagePath) === accountId);
      if (!wc) return false;
      wc.forcefullyCrashRenderer();
      return true;
    }
  };
}

module.exports = { createMonitor };
