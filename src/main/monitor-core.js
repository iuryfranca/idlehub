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

// ---------- processos do Windows ----------
// Processos que o IdleHub nunca encerra: encerrar qualquer um deles derruba a sessao, trava o Windows
// ou simplesmente falha por falta de permissao. Comparacao sem diferenciar maiusculas.
const PROTECTED_NAMES = new Set([
  'system', 'idle', 'registry', 'memory compression', 'secure system', 'smss', 'csrss', 'wininit', 'winlogon',
  'services', 'lsass', 'lsaiso', 'svchost', 'fontdrvhost', 'dwm', 'explorer', 'sihost', 'ctfmon', 'taskhostw',
  'runtimebroker', 'startmenuexperiencehost', 'searchhost', 'shellexperiencehost', 'textinputhost',
  'msmpeng', 'nissrv', 'securityhealthservice', 'securityhealthsystray', 'mpdefendercoreservice',
  'audiodg', 'spoolsv', 'wudfhost', 'dllhost', 'conhost', 'wmiprvse', 'lsm', 'userinit'
]);

/**
 * Motivo para nao deixar encerrar um processo, ou null se pode.
 * @param {{ pid: number, name: string }} proc
 * @param {{ appPids: Set<number>, ownPids: Set<number> }} ctx  appPids: processos do IdleHub; ownPids: o proprio coletor etc.
 */
function protectReason(proc, ctx) {
  if (!proc || proc.pid <= 4) return 'system';
  if (ctx.appPids.has(proc.pid) || ctx.ownPids.has(proc.pid)) return 'app';
  if (PROTECTED_NAMES.has(String(proc.name || '').toLowerCase())) return 'system';
  return null;
}

// Lista crua do coletor -> lista para a tela, com o motivo de protecao ja calculado.
function prepareProcesses(raw, ctx) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p) => p && Number.isInteger(p.p) && p.p > 0)
    .map((p) => {
      const proc = { pid: p.p, name: String(p.n || ''), desc: String(p.d || ''), path: String(p.f || ''), cpu: clampPct(p.c), mem: Number.isFinite(p.m) ? p.m : 0 };
      proc.protected = protectReason(proc, ctx);
      return proc;
    });
}

// Confere, na hora de encerrar, que o PID ainda e o mesmo programa que a pessoa viu e confirmou
// (o Windows reaproveita PIDs) e que ele nao e protegido.
function checkKill(request, current, ctx) {
  const pid = Number(request && request.pid);
  if (!Number.isInteger(pid) || pid <= 0) return { ok: false, reason: 'invalid' };
  const proc = current.find((p) => p.pid === pid);
  if (!proc) return { ok: false, reason: 'gone' };
  if (proc.name.toLowerCase() !== String(request.name || '').toLowerCase()) return { ok: false, reason: 'changed' };
  const why = protectReason(proc, ctx);
  if (why) return { ok: false, reason: 'protected' };
  return { ok: true, proc };
}

module.exports = { cpuTotals, cpuPercent, fromPdh, classifyProcess, accountFromStoragePath, clampPct, protectReason, prepareProcesses, checkKill, PROTECTED_NAMES };
