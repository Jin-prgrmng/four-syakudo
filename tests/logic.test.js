import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCALE_IDS, scaleFromAnswers, answersForScale } from '../js/scales.js';
import { summarize, speedBonus, rankFor, SORT_CONFIG } from '../js/scoring.js';

test('フローチャートの答えと尺度が相互に対応する', () => {
  for (const id of SCALE_IDS) {
    assert.equal(scaleFromAnswers(answersForScale(id)), id);
  }
  // 順序がないと答えた時点で、後の答えにかかわらず名義尺度になる
  assert.equal(scaleFromAnswers({ order: false, equalInterval: true, trueZero: true }), 'nominal');
});

test('速さボーナスは速いほど大きく、範囲外で打ち止めになる', () => {
  assert.equal(speedBonus(0.5), SORT_CONFIG.speedBonusMax);
  assert.equal(speedBonus(10), 0);
  assert.ok(speedBonus(3) > speedBonus(5));
});

test('誤答で連続正解が途切れ、減点される', () => {
  const r = summarize([
    { correct: true, elapsedSec: 1 },
    { correct: true, elapsedSec: 1 },
    { correct: false, elapsedSec: 1 },
    { correct: true, elapsedSec: 1 },
  ]);
  assert.equal(r.correct, 3);
  assert.equal(r.maxCombo, 2);
  assert.equal(r.accuracy, 0.75);
  // 200 + 220 - 50 + 200
  assert.equal(r.score, 570);
});

test('正答率が低いと得点が高くても上位の判定にならない', () => {
  assert.equal(rankFor(9999, 0.95).id, 'S');
  assert.equal(rankFor(9999, 0.6).id, 'C');
  assert.equal(rankFor(0, 0).id, 'D');
});

test('回答なしでも集計できる', () => {
  const r = summarize([]);
  assert.equal(r.score, 0);
  assert.equal(r.accuracy, 0);
  assert.equal(r.avgSec, null);
});
