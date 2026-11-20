'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const catalog = require('../src/main/catalog');
const { normalize, cleanIcon } = require('../src/main/store');
const { iconType, httpsUrl, fetchIcon, MAX_BYTES } = require('../src/main/favicon');
const { parseLink, nameFromUrl } = require('../src/renderer/game-hub');

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

test('catalogo: todo jogo tem logo existente, link https e origem unica', () => {
  const dir = path.join(__dirname, '..', 'src', 'renderer', 'assets', 'games');
  const origins = new Set();
  for (const c of catalog) {
    assert.ok(fs.existsSync(path.join(dir, c.logo)), c.logo);
    assert.ok(['contain', 'cover'].includes(c.fit), c.name);
    const u = new URL(c.url);
    assert.equal(u.protocol, 'https:');
    assert.ok(!origins.has(u.origin), 'origem repetida: ' + u.origin);
    origins.add(u.origin);
    assert.ok(fs.statSync(path.join(dir, c.logo)).size < 80 * 1024, c.logo + ' grande demais');
  }
});

test('estado: icone so aceita PNG em data URL e de tamanho limitado', () => {
  assert.equal(cleanIcon(PNG), PNG);
  assert.equal(cleanIcon('data:image/svg+xml;base64,PHN2Zy8+'), null);
  assert.equal(cleanIcon('https://x.com/favicon.png'), null);
  assert.equal(cleanIcon('data:image/png;base64,' + 'A'.repeat(70000)), null);
  assert.equal(cleanIcon('data:image/png;base64,AAAA"><script>'), null);
  const [g] = normalize({ games: [{ id: 'g1', name: 'X', url: 'https://x.com', icon: 'javascript:1' }] }).games;
  assert.equal(g.icon, null);
});

test('favicon: tipos aceitos e so https', () => {
  assert.equal(iconType('image/png; charset=binary', 'https://x.com/a.png'), 'image/png');
  assert.equal(iconType('application/octet-stream', 'https://x.com/favicon.ico'), 'image/x-icon');
  assert.equal(iconType('text/html', 'https://x.com/favicon.ico'), null);
  assert.equal(iconType('application/octet-stream', 'https://x.com/a.bin'), null);
  assert.equal(httpsUrl('http://x.com/f.ico'), null);
  assert.equal(httpsUrl('file:///c:/x.ico'), null);
  assert.equal(httpsUrl('https://u:p@x.com/f.ico'), null);
});

const fakeResponse = (bytes, type, extra = {}) => new Response(bytes, { status: 200, headers: { 'content-type': type, ...extra } });

test('favicon: baixa pela sessao, pula o que nao serve e respeita o limite', async () => {
  const asked = [];
  const ses = {
    fetch: async (url) => {
      asked.push(url);
      if (url.endsWith('/page')) return fakeResponse('<html>', 'text/html');
      if (url.endsWith('/big.png')) return fakeResponse(new Uint8Array(MAX_BYTES + 10), 'image/png');
      return fakeResponse(new Uint8Array([1, 2, 3]), 'image/png');
    }
  };
  const out = await fetchIcon(ses, ['http://x.com/a.png', 'https://x.com/page', 'https://x.com/big.png', 'https://x.com/ok.png']);
  assert.equal(out, 'data:image/png;base64,AQID');
  assert.deepEqual(asked, ['https://x.com/page', 'https://x.com/big.png', 'https://x.com/ok.png']); // http nunca e pedido
  assert.equal(await fetchIcon(ses, 'nao-e-lista'), null);
  assert.equal(await fetchIcon({ fetch: async () => { throw new Error('rede'); } }, ['https://x.com/a.png']), null);
});

test('hub: texto digitado vira link https ou fica como busca', () => {
  assert.deepEqual(parseLink('meujogo.com'), { url: 'https://meujogo.com/' });
  assert.deepEqual(parseLink(' https://jogo.com.br/play#x '), { url: 'https://jogo.com.br/play' });
  assert.deepEqual(parseLink('http://jogo.com'), { insecure: true });
  assert.equal(parseLink('poke'), null);
  assert.equal(parseLink('poke idle'), null);
  assert.equal(parseLink('ftp://jogo.com'), null);
  assert.equal(parseLink('javascript:alert(1)'), null);
  assert.equal(parseLink('https://u:p@jogo.com'), null);
});

test('hub: nome sugerido a partir do endereco', () => {
  assert.equal(nameFromUrl('https://play.meu-jogo.com.br/x'), 'Meu Jogo');
  assert.equal(nameFromUrl('https://www.idlegame.io/'), 'Idlegame');
  assert.equal(nameFromUrl('https://app.super_farm.net/'), 'Super Farm');
});
