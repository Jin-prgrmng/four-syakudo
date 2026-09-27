import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHistory, weakItems, toCSV, MAX_PLAYS } from '../js/history.js';
import { createSortDeck, pickQuiz } from '../js/pick.js';
import { readFileSync } from 'node:fs';

function fakeStorage() {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

const items = JSON.parse(readFileSync(new URL('../data/items.json', import.meta.url), 'utf-8')).items;

test('履歴を保存して読み出せ、上限を超えると古いものから消える', () => {
  const h = createHistory(fakeStorage());
  h.add({ mode: 'sort', summary: { score: 100 }, answers: [] });
  h.add({ mode: 'sort', summary: { score: 300 }, answers: [] });
  assert.equal(h.all().length, 2);
  assert.equal(h.best(), 300);
  for (let i = 0; i < MAX_PLAYS; i++) h.add({ mode: 'quiz', answers: [] });
  assert.equal(h.all().length, MAX_PLAYS);
});

test('storage が使えなくても動く', () => {
  const h = createHistory(null);
  h.add({ mode: 'quiz', answers: [] });
  assert.equal(h.all().length, 1);
});

test('苦手な項目は間違えた回数の多い順に並ぶ', () => {
  const plays = [
    { answers: [{ id: 'a', correct: false, chosen: 'ratio' }, { id: 'b', correct: false }, { id: 'c', correct: true }] },
    { answers: [{ id: 'a', correct: false, chosen: 'interval' }] },
  ];
  const w = weakItems(plays);
  assert.deepEqual(w.map((s) => s.id), ['a', 'b']);
  assert.equal(w[0].lastChosen, 'interval');
});

test('CSV は引用符をエスケープする', () => {
  const csv = toCSV([{ at: 't', mode: 'quiz', answers: [{ id: 'x', correct: true, chosen: 'ratio', scale: 'ratio' }] }], new Map([['x', { label: 'a"b' }]]));
  assert.match(csv, /"a""b"/);
});

test('仕分けの山札は議論のある項目を出さず、同じ項目を続けて出さない', () => {
  let seed = 1;
  const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const deck = createSortDeck(items, rng);
  let prev = null;
  const counts = {};
  for (let i = 0; i < 400; i++) {
    const it = deck.next();
    assert.ok(!it.contested);
    assert.notEqual(it, prev);
    prev = it;
    counts[it.scale] = (counts[it.scale] ?? 0) + 1;
  }
  for (const n of Object.values(counts)) assert.ok(n > 60, '尺度ごとの出題が偏っている');
});

test('4択クイズは指定数を重複なく選ぶ', () => {
  const q = pickQuiz(items, 10);
  assert.equal(q.length, 10);
  assert.equal(new Set(q).size, 10);
  assert.ok(q.slice(0, 4).every((i) => i.level === 1));
});
