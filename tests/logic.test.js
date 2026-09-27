import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCALE_IDS, scaleFromAnswers, answersForScale, divergingStep } from '../js/scales.js';
import { summarize, speedBonus, titleFor, SORT_CONFIG, TITLES } from '../js/scoring.js';

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

test('正答率が低いと得点が高くても上位の称号にならない', () => {
  assert.equal(titleFor(9999, 1).grade, '皆伝');
  assert.equal(titleFor(9999, 0.6).grade, '六級');
  assert.equal(titleFor(0, 0).grade, '十級');
});

test('称号は得点・正答率の基準が上から順に厳しくなっている', () => {
  for (let i = 1; i < TITLES.length; i++) {
    assert.ok(TITLES[i - 1].minScore > TITLES[i].minScore);
    assert.ok(TITLES[i - 1].minAccuracy >= TITLES[i].minAccuracy);
  }
});

test('回答なしでも集計できる', () => {
  const r = summarize([]);
  assert.equal(r.score, 0);
  assert.equal(r.accuracy, 0);
  assert.equal(r.avgSec, null);
});

test('誤答の分かれ目になった問いを特定できる', () => {
  assert.equal(divergingStep('ratio', 'ratio'), null);
  const d = divergingStep('ratio', 'interval');
  assert.equal(d.step.key, 'trueZero');
  assert.equal(d.chosen, true);
  assert.equal(d.correct, false);
  assert.equal(divergingStep('nominal', 'ratio').step.key, 'order');
});
