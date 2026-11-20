'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { compute, fit } = require('../src/renderer/layout');

const W = 1600, H = 900, gap = 8;
const ids = (n) => Array.from({ length: n }, (_, i) => 'a' + i);
const inside = (r) => r.x >= -0.01 && r.y >= -0.01 && r.x + r.w <= W + 0.01 && r.y + r.h <= H + 0.01;
const overlap = (a, b) => a.x < b.x + b.w - 0.01 && b.x < a.x + a.w - 0.01 && a.y < b.y + b.h - 0.01 && b.y < a.y + a.h - 0.01;

for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
  for (const mode of ['grade', 'destaque']) {
    test(`${mode} com ${n} conta(s): tudo dentro e sem sobreposicao`, () => {
      const { rects } = compute({ ids: ids(n), mode, featuredId: 'a1', split: 0.68, width: W, height: H, gap });
      const rs = Object.values(rects);
      assert.equal(rs.length, n);
      rs.forEach((r) => assert.ok(inside(r), JSON.stringify(r)));
      for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) assert.ok(!overlap(rs[i], rs[j]));
    });
  }
}

test('grade: 2 contas lado a lado, 4 em 2x2', () => {
  const two = compute({ ids: ids(2), mode: 'grade', width: W, height: H, gap }).rects;
  assert.equal(two.a0.y, two.a1.y);
  const four = compute({ ids: ids(4), mode: 'grade', width: W, height: H, gap }).rects;
  assert.equal(new Set(Object.values(four).map((r) => r.y)).size, 2);
});

test('destaque: conta escolhida fica grande a esquerda, divisoria entre as colunas', () => {
  const out = compute({ ids: ids(4), mode: 'destaque', featuredId: 'a2', split: 0.7, width: W, height: H, gap });
  assert.equal(out.main, 'a2');
  assert.equal(out.rects.a2.x, 0); assert.equal(out.rects.a2.h, H);
  assert.ok(out.rects.a2.w > out.rects.a0.w * 2);
  assert.equal(out.splitter.x, out.rects.a2.w);
});

test('destaque invalido cai na primeira conta', () => {
  assert.equal(compute({ ids: ids(3), mode: 'destaque', featuredId: 'zzz', split: 0.7, width: W, height: H }).main, 'a0');
});

test('foco ocupa a area toda e esconde o resto', () => {
  const { rects } = compute({ ids: ids(4), mode: 'grade', focusId: 'a3', width: W, height: H });
  assert.deepEqual(Object.keys(rects), ['a3']);
  assert.deepEqual(rects.a3, { x: 0, y: 0, w: W, h: H });
});

test('fit: proporcao fixa centralizada; livre ocupa tudo', () => {
  assert.deepEqual(fit(800, 600, 'livre'), { x: 0, y: 0, w: 800, h: 600 });
  const r = fit(800, 600, '16:9');
  assert.equal(r.w, 800); assert.equal(r.h, 450); assert.equal(r.y, 75);
  const t = fit(800, 600, '9:16');
  assert.equal(t.h, 600); assert.ok(Math.abs(t.w - 337.5) < 1e-9);
});
