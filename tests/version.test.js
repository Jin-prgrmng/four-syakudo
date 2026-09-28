// index.html のバージョン番号がそろっていて、js/ のすべてのファイルが import map に入っていることを検査する。
// 失敗したら `npm run bump` を実行する（tools/bump-version.mjs を参照）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const html = readFileSync(join(root, 'index.html'), 'utf-8');

function listJs(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listJs(path) : name.endsWith('.js') ? [path] : [];
  });
}

test('CSS・JavaScript のすべてに同じバージョン番号が付いている', () => {
  const map = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
  const versions = new Set([
    html.match(/css\/style\.css\?v=([^"]+)"/)?.[1],
    html.match(/src="js\/main\.js\?v=([^"]+)"/)?.[1],
    ...Object.values(map).map((u) => u.split('?v=')[1]),
  ]);
  assert.equal(versions.size, 1, `バージョン番号がそろっていない: ${[...versions].join(', ')}`);
  assert.ok([...versions][0], 'バージョン番号がない');
  for (const file of listJs(join(root, 'js')).map((p) => `./${relative(root, p)}`)) {
    assert.ok(map[file], `${file} が import map にない（npm run bump を実行する）`);
  }
});
