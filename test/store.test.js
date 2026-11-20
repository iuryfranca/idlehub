'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { normalize, Store, cleanUrl, accountOfPartition, partitionOf } = require('../src/main/store');

const game = (id, extra = {}) => ({ id, name: 'Jogo ' + id, url: 'https://exemplo.com/' + id, ...extra });

test('estado vazio vira estado padrao', () => {
  const s = normalize(null);
  assert.deepEqual(s.games, []); assert.deepEqual(s.accounts, []);
  assert.equal(s.prefs.theme, 'grafite'); assert.equal(s.prefs.activeGame, null);
});

test('so aceita link https sem usuario/senha', () => {
  assert.equal(cleanUrl('http://x.com'), null);
  assert.equal(cleanUrl('javascript:alert(1)'), null);
  assert.equal(cleanUrl('https://u:p@x.com'), null);
  assert.equal(cleanUrl(' https://x.com/play#a '), 'https://x.com/play');
});

test('descarta jogos e contas invalidos', () => {
  const s = normalize({
    games: [game('g1'), game('g1'), { id: 'BAD ID', name: 'x', url: 'https://a.com' }, game('g2', { url: 'file:///c:/x' }), game('g3', { name: '' })],
    accounts: [
      { id: 'a1', gameId: 'g1', name: 'Conta 1' },
      { id: 'a1', gameId: 'g1', name: 'duplicada' },
      { id: 'a2', gameId: 'nao-existe', name: 'orfa' },
      { id: 'a3', gameId: 'g1', name: '   ' }
    ]
  });
  assert.deepEqual(s.games.map((g) => g.id), ['g1']);
  assert.deepEqual(s.accounts.map((a) => a.id), ['a1']);
});

test('limita zoom, divisoria, layout e proporcao', () => {
  const [g] = normalize({ games: [game('g1', { zoom: 9, split: 0.1, layout: 'xyz', aspect: '21:9' })] }).games;
  assert.equal(g.zoom, 2); assert.equal(g.split, 0.4); assert.equal(g.layout, 'grade'); assert.equal(g.aspect, 'livre');
});

test('maximo de 9 contas por jogo', () => {
  const accounts = Array.from({ length: 12 }, (_, i) => ({ id: 'a' + i, gameId: 'g1', name: 'C' + i }));
  assert.equal(normalize({ games: [game('g1')], accounts }).accounts.length, 9);
});

test('destaque precisa ser conta do proprio jogo', () => {
  const s = normalize({ games: [game('g1', { featured: 'b1' }), game('g2')], accounts: [{ id: 'b1', gameId: 'g2', name: 'B' }] });
  assert.equal(s.games[0].featured, null);
});

test('nome perde caracteres de controle e e cortado', () => {
  const [g] = normalize({ games: [game('g1', { name: 'A\u0000B' + 'x'.repeat(100) })] }).games;
  assert.ok(g.name.startsWith('AB')); assert.equal(g.name.length, 40);
});

test('particao: ida e volta, e nada fora do padrao', () => {
  assert.equal(accountOfPartition(partitionOf('a-1')), 'a-1');
  assert.equal(accountOfPartition('persist:conta1'), null);
  assert.equal(accountOfPartition('persist:acc-../x'), null);
});

test('Store grava de forma atomica e preserva arquivo corrompido', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'idlehub-'));
  const file = path.join(dir, 'idlehub.json');
  const st = new Store(file);
  st.save({ games: [game('g1')], accounts: [{ id: 'a1', gameId: 'g1', name: 'C' }] });
  assert.equal(new Store(file).account('a1').name, 'C');
  fs.writeFileSync(file, '{quebrado');
  const st2 = new Store(file);
  assert.deepEqual(st2.state.games, []);
  assert.ok(fs.readdirSync(dir).some((f) => f.includes('corrompido')));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('modo de aparencia: padrao segue o sistema e valores invalidos sao descartados', () => {
  assert.equal(normalize({}).prefs.mode, 'sistema');
  assert.equal(normalize({ prefs: { mode: 'escuro' } }).prefs.mode, 'escuro');
  assert.equal(normalize({ prefs: { mode: 'roxo' } }).prefs.mode, 'sistema');
});

test('espacos mistos: so contas existentes, sem repetir, ate 9, e destaque valido', () => {
  const accounts = [];
  for (let i = 1; i <= 9; i++) accounts.push({ id: 'a' + i, gameId: i % 2 ? 'g1' : 'g2', name: 'C' + i });
  const s = normalize({
    games: [game('g1'), game('g2')],
    accounts,
    mixes: [
      { id: 'm1', name: 'Noite', accounts: ['a1', 'a2', 'a1', 'fantasma', 'a3'], featured: 'fantasma', layout: 'destaque', aspect: '16:9' },
      { id: 'm2', name: 'Cheio', accounts: [...accounts.map((a) => a.id), 'a1'] },
      { id: 'g1', name: 'mesmo id de jogo', accounts: ['a1'] },
      { id: 'm3', name: '   ', accounts: ['a1'] },
      { id: 'm4', name: 'Vazio', accounts: [] }
    ],
    prefs: { activeMix: 'm1' }
  });
  assert.deepEqual(s.mixes.map((m) => m.id), ['m1', 'm2', 'm4']);
  assert.deepEqual(s.mixes[0].accounts, ['a1', 'a2', 'a3']);
  assert.equal(s.mixes[0].featured, null);
  assert.equal(s.mixes[0].layout, 'destaque');
  assert.equal(s.mixes[0].aspect, '16:9');
  assert.equal(s.mixes[1].accounts.length, 9);
  assert.equal(s.prefs.activeMix, 'm1');
});

test('espacos mistos: conta removida sai do espaco e espaco apagado deixa de estar ativo', () => {
  const base = { games: [game('g1')], accounts: [{ id: 'a1', gameId: 'g1', name: 'C1' }, { id: 'a2', gameId: 'g1', name: 'C2' }] };
  const s = normalize({ ...base, accounts: base.accounts.slice(1), mixes: [{ id: 'm1', name: 'X', accounts: ['a1', 'a2'], featured: 'a1' }] });
  assert.deepEqual(s.mixes[0].accounts, ['a2']);
  assert.equal(s.mixes[0].featured, null);
  assert.equal(normalize({ ...base, mixes: [], prefs: { activeMix: 'm1' } }).prefs.activeMix, null);
});
