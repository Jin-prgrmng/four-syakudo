import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { splitPhrases } from '../js/phrase.js';

test('文節の切れ目で区切る', () => {
  assert.deepEqual(splitPhrases('値の差に意味があるが、0 は「何もない」ことを表さない。'),
    ['値の', '差に', '意味があるが、', '0 は', '「何もない」ことを', '表さない。']);
  assert.deepEqual(splitPhrases('「上・下」や「多い・少ない」で並べられる？'),
    ['「上・下」や', '「多い・少ない」で', '並べられる？']);
});

test('句読点やかっこの位置で不自然に区切らない', () => {
  for (const part of splitPhrases('どちらかが上と言えるかな？　（例：8畳は6畳より広い）は、0 K（−273.15℃）は「いいえ」で止まる。')) {
    assert.ok(!/^[、。？」）はがをにでと]/.test(part), `「${part}」が句読点・閉じかっこ・助詞で始まっている`);
    assert.ok(!/[「（]$/.test(part), `「${part}」が開きかっこで終わっている`);
  }
});

test('すべての解説を区切っても、つなげると元の文に戻る', () => {
  const items = JSON.parse(readFileSync(new URL('../data/items.json', import.meta.url), 'utf-8')).items;
  for (const item of items) {
    for (const text of [item.label, item.example, item.explanation, item.hint ?? '']) {
      assert.equal(splitPhrases(text).join(''), text);
    }
  }
});
