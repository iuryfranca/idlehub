'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { chromeLikeUserAgent } = require('../src/main/user-agent');

test('remove Electron e o nome do app, e reduz a versao do Chrome', () => {
  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) idlehub/0.1.0 Chrome/148.0.7778.97 Electron/43.8.12 Safari/537.36';
  assert.equal(chromeLikeUserAgent(ua), 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36');
});

test('UA ja limpo continua igual', () => {
  const ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36';
  assert.equal(chromeLikeUserAgent(ua), ua);
});
