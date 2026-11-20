'use strict';
// Funcoes puras do monitor (sem Electron), para poderem ser testadas no Node.

// Uso total de CPU entre duas leituras de os.cpus(): fracao do tempo em que os nucleos nao ficaram ociosos.
function cpuTotals(cpus) {
  let idle = 0, total = 0;
  for (const c of cpus) {
    idle += c.times.idle;
    total += c.times.user + c.times.nice + c.times.sys + c.times.idle + c.times.irq;
  }
  return { idle, total };
}
function cpuPercent(prev, cur) {
  const dTotal = cur.total - prev.total;
  if (!(dTotal > 0)) return 0;
  return clampPct(100 * (1 - (cur.idle - prev.idle) / dTotal));
}
const clampPct = (n) => Math.min(100, Math.max(0, Number.isFinite(n) ? n : 0));

// Converte a linha JSON do coletor PDH (perf-sampler.ps1) em numeros uteis.
// Formato: { gpu: {instancia: %}, diskIdle: {_Total: %}, diskBytes: {_Total: B/s}, netRx: {placa: B/s}, netTx: {placa: B/s} }
function fromPdh(raw) {
  const out = { gpu: null, gpuByPid: {}, diskActive: null, diskBps: null, netRx: null, netTx: null };
  const values = (key) => Object.entries((raw && raw[key]) || {}).filter(([, v]) => Number.isFinite(v));
  const gpu = values('gpu');
  if (gpu.length || (raw && raw.gpu)) {
    out.gpu = 0;
    for (const [name, v] of gpu) {
      out.gpu += v;
      const pid = /pid_(\d+)_/i.exec(name);
      if (pid) out.gpuByPid[pid[1]] = (out.gpuByPid[pid[1]] ?? 0) + v;
    }
    out.gpu = clampPct(out.gpu);
    for (const k of Object.keys(out.gpuByPid)) out.gpuByPid[k] = clampPct(out.gpuByPid[k]);
  }
  const idle = values('diskIdle')[0];
  if (idle) out.diskActive = clampPct(100 - idle[1]);
  const bytes = values('diskBytes')[0];
  if (bytes) out.diskBps = bytes[1];
  const sum = (key) => { const v = values(key); return v.length ? v.reduce((a, [, x]) => a + x, 0) : null; };
  out.netRx = sum('netRx');
  out.netTx = sum('netTx');
  return out;
}

// Tipo de cada processo do app, para a tela explicar o que ele faz.
function classifyProcess(metric, ctx) {
  if (ctx.accountId) return ctx.kind === 'window' ? 'popup' : 'panel';
  if (metric.type === 'Browser') return 'main';
  if (metric.type === 'GPU') return 'gpu';
  if (metric.type === 'Utility' && /network/i.test(metric.serviceName || metric.name || '')) return 'network';
  if (metric.type === 'Utility' && /audio/i.test(metric.serviceName || metric.name || '')) return 'audio';
  if (metric.type === 'Tab' && ctx.kind === 'window') return 'ui';
  return 'other';
}

// Nome da pasta da particao -> id da conta ("...\\Partitions\\acc-a-123" -> "a-123").
function accountFromStoragePath(storagePath) {
  const m = /[\\/]Partitions[\\/]acc-([a-z0-9][a-z0-9-]{0,39})[\\/]?$/.exec(String(storagePath || ''));
  return m ? m[1] : null;
}

module.exports = { cpuTotals, cpuPercent, fromPdh, classifyProcess, accountFromStoragePath, clampPct };
