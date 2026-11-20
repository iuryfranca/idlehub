'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../src/main/monitor-core');
const { normalize } = require('../src/main/store');

const cpu = (idle, busy) => ({ times: { user: busy, nice: 0, sys: 0, idle, irq: 0 } });

test('CPU da maquina: fracao nao ociosa entre duas leituras', () => {
  const a = core.cpuTotals([cpu(100, 100), cpu(100, 100)]);
  const b = core.cpuTotals([cpu(150, 150), cpu(190, 110)]); // +140 ocioso, +60 ocupado
  assert.ok(Math.abs(core.cpuPercent(a, b) - 30) < 1e-9);
  assert.equal(core.cpuPercent(a, a), 0);
});

test('PDH: soma GPU por pid, disco ativo e rede somada entre placas', () => {
  const r = core.fromPdh({
    gpu: { 'pid_10_luid_0x0_phys_0_eng_0_engtype_3D': 5, 'pid_10_luid_0x0_phys_0_eng_1_engtype_3D': 2.5, 'pid_20_luid_0x0_phys_0_eng_0_engtype_3D': 10 },
    diskIdle: { _Total: 93 }, diskBytes: { _Total: 2048 },
    netRx: { Ethernet: 1000, 'Wi-Fi': 500 }, netTx: { Ethernet: 300 }
  });
  assert.equal(r.gpu, 17.5);
  assert.deepEqual(r.gpuByPid, { 10: 7.5, 20: 10 });
  assert.equal(r.diskActive, 7);
  assert.equal(r.diskBps, 2048);
  assert.equal(r.netRx, 1500);
  assert.equal(r.netTx, 300);
});

test('PDH: contador ausente fica null (a tela mostra "coletando"/"indisponivel")', () => {
  const r = core.fromPdh({ diskIdle: {} });
  assert.equal(r.diskActive, null);
  assert.equal(r.gpu, null);
  assert.equal(r.netRx, null);
});

test('PDH: GPU acima de 100 (varias engines somadas) fica limitada a 100', () => {
  assert.equal(core.fromPdh({ gpu: { 'pid_1_eng_0_engtype_3D': 80, 'pid_1_eng_2_engtype_3D': 70 } }).gpu, 100);
});

test('conta a partir da pasta da particao', () => {
  assert.equal(core.accountFromStoragePath('C:\\Users\\x\\AppData\\Roaming\\idlehub\\Partitions\\acc-a-mwp1abc'), 'a-mwp1abc');
  assert.equal(core.accountFromStoragePath('C:\\Users\\x\\AppData\\Roaming\\idlehub'), null);
  assert.equal(core.accountFromStoragePath('C:\\x\\Partitions\\p1'), null);
});

test('classificacao dos processos', () => {
  assert.equal(core.classifyProcess({ type: 'Browser' }, {}), 'main');
  assert.equal(core.classifyProcess({ type: 'GPU' }, {}), 'gpu');
  assert.equal(core.classifyProcess({ type: 'Utility', serviceName: 'network.mojom.NetworkService' }, {}), 'network');
  assert.equal(core.classifyProcess({ type: 'Tab' }, { kind: 'window' }), 'ui');
  assert.equal(core.classifyProcess({ type: 'Tab' }, { kind: 'webview', accountId: 'a-1' }), 'panel');
  assert.equal(core.classifyProcess({ type: 'Tab' }, { kind: 'window', accountId: 'a-1' }), 'popup');
});

test('conta hibernada e salva; o padrao e acordada', () => {
  const g = { id: 'g1', name: 'J', url: 'https://x.com/' };
  const s = normalize({ games: [g], accounts: [{ id: 'a1', gameId: 'g1', name: 'A', hibernated: true }, { id: 'a2', gameId: 'g1', name: 'B' }] });
  assert.equal(s.accounts[0].hibernated, true);
  assert.equal(s.accounts[1].hibernated, false);
});
