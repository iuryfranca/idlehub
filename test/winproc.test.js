'use strict';
// Regras de seguranca da secao "Processos do Windows" (src/main/monitor-core.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const { protectReason, prepareProcesses, checkKill } = require('../src/main/monitor-core');

const ctx = { appPids: new Set([500, 501]), ownPids: new Set([900]) };
const raw = [
  { n: 'chrome', p: 1200, c: 3.5, m: 300e6, d: 'Google Chrome', f: 'C:\\Program Files\\Google\\Chrome\\chrome.exe' },
  { n: 'svchost', p: 1300, c: 0.1, m: 20e6, d: 'Host Process for Windows Services', f: '' },
  { n: 'IdleHub', p: 500, c: 1, m: 100e6, d: 'IdleHub', f: '' },
  { n: 'powershell', p: 900, c: 0.2, m: 40e6, d: 'Windows PowerShell', f: '' },
  { n: 'System', p: 4, c: 0.5, m: 1e6, d: '', f: '' },
  { n: 'lixo', p: 'x' },
  { n: 'Explorer', p: 1400, c: 0, m: 150e6, d: 'Windows Explorer', f: '' }
];

test('protege processos do sistema, do IdleHub e o proprio coletor', () => {
  assert.equal(protectReason({ pid: 1200, name: 'chrome' }, ctx), null);
  assert.equal(protectReason({ pid: 1300, name: 'svchost' }, ctx), 'system');
  assert.equal(protectReason({ pid: 1400, name: 'Explorer' }, ctx), 'system'); // sem diferenciar maiusculas
  assert.equal(protectReason({ pid: 4, name: 'System' }, ctx), 'system');
  assert.equal(protectReason({ pid: 0, name: 'qualquer' }, ctx), 'system');
  assert.equal(protectReason({ pid: 500, name: 'IdleHub' }, ctx), 'app');
  assert.equal(protectReason({ pid: 900, name: 'powershell' }, ctx), 'app');
});

test('prepareProcesses descarta entradas invalidas e marca protecao', () => {
  const list = prepareProcesses(raw, ctx);
  assert.equal(list.length, 6);
  assert.deepEqual(list.filter((p) => !p.protected).map((p) => p.name), ['chrome']);
  assert.equal(list.find((p) => p.pid === 1200).desc, 'Google Chrome');
  assert.deepEqual(prepareProcesses(null, ctx), []);
});

test('checkKill: so encerra se o PID ainda e o mesmo programa e nao e protegido', () => {
  const list = prepareProcesses(raw, ctx);
  assert.deepEqual(checkKill({ pid: 1200, name: 'chrome' }, list, ctx).ok, true);
  assert.equal(checkKill({ pid: 1200, name: 'firefox' }, list, ctx).reason, 'changed'); // PID reaproveitado
  assert.equal(checkKill({ pid: 7777, name: 'chrome' }, list, ctx).reason, 'gone');
  assert.equal(checkKill({ pid: 1300, name: 'svchost' }, list, ctx).reason, 'protected');
  assert.equal(checkKill({ pid: 500, name: 'IdleHub' }, list, ctx).reason, 'protected');
  assert.equal(checkKill({ pid: -1, name: 'x' }, list, ctx).reason, 'invalid');
  assert.equal(checkKill({ pid: '1200', name: 'chrome' }, list, ctx).ok, true); // numero vindo como texto e aceito
});
