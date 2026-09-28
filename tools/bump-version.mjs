// 公開用のバージョン番号を更新する。変更を push する前に `npm run bump` で実行する。
//
// GitHub Pages はファイルをブラウザに最大10分保存させる。再読み込みしても Chrome などは JavaScript や CSS を
// 保存済みのものから使うため、新旧のファイルが混ざって動かなくなることがある。
// そこで index.html の中で、CSS・JavaScript のすべてのファイル名に ?v=バージョン を付ける。
// index.html は再読み込みのたびに取り直されるので、バージョンが変われば他のファイルも必ず最新になる。
// JavaScript どうしの import は、index.html の import map で ?v= 付きの URL に置き換える。
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;

function listJs(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listJs(path) : name.endsWith('.js') ? [path] : [];
  });
}

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const version = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

const modules = listJs(join(root, 'js')).map((p) => relative(root, p)).sort();
const imports = Object.fromEntries(modules.map((m) => [`./${m}`, `./${m}?v=${version}`]));
const importMap = `<script type="importmap">\n${JSON.stringify({ imports }, null, 2)}\n  </script>`;

const indexPath = join(root, 'index.html');
let html = readFileSync(indexPath, 'utf-8');
html = html.replace(/<script type="importmap">[\s\S]*?<\/script>/, importMap);
html = html.replace(/href="css\/style\.css(\?v=[^"]*)?"/, `href="css/style.css?v=${version}"`);
html = html.replace(/src="js\/main\.js(\?v=[^"]*)?"/, `src="js/main.js?v=${version}"`);
writeFileSync(indexPath, html);
console.log(`version ${version}（${modules.length} ファイル）`);
