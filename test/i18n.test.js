'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const i18n = require('../src/renderer/i18n');
const { normalize, langFromLocale } = require('../src/main/store');

const ids = i18n.LANGUAGES.map((l) => l.id);
const base = Object.keys(i18n.STRINGS['pt-BR']).sort();

test('todos os idiomas tem exatamente as mesmas chaves', () => {
  for (const id of ids) assert.deepEqual(Object.keys(i18n.STRINGS[id]).sort(), base, id);
});

test('nenhuma traducao vazia e as variaveis {x} batem entre idiomas', () => {
  const vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  for (const key of base) for (const id of ids) {
    assert.ok(i18n.STRINGS[id][key].trim(), `${id}.${key} vazio`);
    assert.equal(vars(i18n.STRINGS[id][key]), vars(i18n.STRINGS['pt-BR'][key]), `${id}.${key}`);
  }
});

test('toda chave usada na interface existe no dicionario', () => {
  const dir = path.join(__dirname, '..', 'src', 'renderer');
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const js = ['app.js', 'monitor-ui.js', 'winproc-ui.js'].map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  const used = new Set([
    ...[...html.matchAll(/data-i18n(?:-title|-aria)?="(\w+)"/g)].map((m) => m[1]),
    ...[...js.matchAll(/\bt\('(\w+)'/g)].map((m) => m[1]),
    ...[...js.matchAll(/\bkey: '(mode\w+)'/g)].map((m) => m[1]),      // MODES em app.js
    ...[...js.matchAll(/'(col[A-Z]\w+)'/g)].map((m) => m[1]), // cabecalho da tabela do Monitor
    ...['grafite', 'aurora', 'oceano', 'areia', 'papel'].map((th) => 'theme' + cap(th)),
    // nomes montados na tela Monitor: 'proc' + tipo e 'proc' + tipo + 'Desc'
    ...['main', 'ui', 'gpu', 'network', 'audio', 'other'].flatMap((k) => ['proc' + cap(k), 'proc' + cap(k) + 'Desc'])
  ]);
  for (const key of used) assert.ok(base.includes(key), `chave sem traducao: ${key}`);
});

test('t() troca de idioma e preenche variaveis', () => {
  i18n.setLanguage('en');
  assert.equal(i18n.t('accountsOf', { game: 'X' }), 'Accounts · X');
  i18n.setLanguage('es');
  assert.equal(i18n.t('addGame'), 'Añadir juego');
  i18n.setLanguage('xx');
  assert.equal(i18n.language, 'pt-BR');
});

test('idioma salvo e validado; idioma do sistema vira o padrao', () => {
  assert.equal(normalize({ prefs: { lang: 'es' } }).prefs.lang, 'es');
  assert.equal(normalize({ prefs: { lang: 'fr' } }).prefs.lang, null);
  assert.equal(langFromLocale('pt-BR'), 'pt-BR');
  assert.equal(langFromLocale('pt-PT'), 'pt-BR');
  assert.equal(langFromLocale('es-419'), 'es');
  assert.equal(langFromLocale('de-DE'), 'en');
});
