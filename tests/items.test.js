// 問題データの形式を検査する。項目を追加・修正したら npm test で確認する。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SCALE_IDS } from '../js/scales.js';

const data = JSON.parse(readFileSync(new URL('../data/items.json', import.meta.url), 'utf-8'));
const items = data.items;

test('全項目が必須フィールドを持つ', () => {
  for (const item of items) {
    for (const key of ['id', 'label', 'example', 'scale', 'level', 'explanation']) {
      assert.ok(item[key] !== undefined && item[key] !== '', `${item.id ?? '?'}: ${key} がない`);
    }
    assert.ok(SCALE_IDS.includes(item.scale), `${item.id}: scale が不正`);
    assert.ok([1, 2, 3].includes(item.level), `${item.id}: level は 1〜3`);
  }
});

test('id と label が重複しない', () => {
  assert.equal(new Set(items.map((i) => i.id)).size, items.length);
  assert.equal(new Set(items.map((i) => i.label)).size, items.length);
});

test('alternatives は議論のある項目にだけ付け、正解と重ならない', () => {
  for (const item of items.filter((i) => i.alternatives)) {
    assert.equal(item.contested, true, `${item.id}: alternatives があるなら contested: true`);
    for (const alt of item.alternatives) {
      assert.ok(SCALE_IDS.includes(alt) && alt !== item.scale, `${item.id}: alternatives が不正`);
    }
  }
});

test('仕分けモードで出題できる項目が各尺度に5問以上ある', () => {
  for (const scale of SCALE_IDS) {
    const n = items.filter((i) => i.scale === scale && !i.contested).length;
    assert.ok(n >= 5, `${scale}: ${n} 問しかない`);
  }
});
