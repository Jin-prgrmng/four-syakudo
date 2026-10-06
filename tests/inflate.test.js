import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coinGain, formatBig, DOPA_CONFIG } from '../js/inflate.js';

test('連続正解でコインが指数関数的に増え、JACKPOT 中は倍率がかかる', () => {
  assert.equal(coinGain(1), DOPA_CONFIG.coinBase);
  assert.ok(coinGain(10) > coinGain(9) * 2);
  assert.equal(coinGain(1, { jackpot: true }), DOPA_CONFIG.coinBase * DOPA_CONFIG.jackpotMultiplier);
});

test('大きな数を日本語の単位で短く表す', () => {
  assert.equal(formatBig(0), '0');
  assert.equal(formatBig(9999), '9999');
  assert.equal(formatBig(12345), '1.2万');
  assert.equal(formatBig(350000000), '3.5億');
  assert.equal(formatBig(42e12), '42兆');
  assert.equal(formatBig(99999999), '1億');
  assert.equal(formatBig(1e68), '1無量大数');
  assert.match(formatBig(1e80), /無量大数$/);
});
