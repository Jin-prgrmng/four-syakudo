import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SPRITES, PIXEL_COLORS, spriteErrors } from '../js/sprite-data.js';

test('ドット絵のコマは決めた大きさで、定義済みの色だけを使う', () => {
  for (const [name, s] of Object.entries(SPRITES)) {
    assert.deepEqual(spriteErrors(name, s), []);
  }
});

test('ドット絵の色はすべて CSS で塗り分けが決まっている', () => {
  const css = readFileSync(new URL('../css/style.css', import.meta.url), 'utf-8');
  for (const c of Object.keys(PIXEL_COLORS)) {
    assert.match(css, new RegExp(`\\.px-${c}[ ,{]`), `.px-${c} の色が css/style.css にない`);
  }
});

test('誤ったコマを見つけられる', () => {
  const bad = { width: 2, height: 2, frames: { a: ['..', '.'], b: ['.z', '..'] }, idle: ['a', 'c'] };
  assert.equal(spriteErrors('bad', bad).length, 3);
});
