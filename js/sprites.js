// ドット絵を SVG で描き、コマを切り替えて動かす。絵のデータは js/sprite-data.js にある。
// 1マスを1つの矩形として描くので、画像ファイルを読み込まずに済み、拡大してもぼやけない。
import { SPRITES } from './sprite-data.js';

function frameGroup(rows, frameName, visible) {
  const rects = [];
  rows.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c !== '.') rects.push(`<rect class="px-${c}" x="${x}" y="${y}" width="1" height="1"/>`);
    });
  });
  return `<g data-frame="${frameName}"${visible ? ' class="on"' : ''}>${rects.join('')}</g>`;
}

// キャラクター name の SVG を作る。frames に挙げたコマを持ち、最初のコマだけを表示する。
// decorative: true なら読み上げ対象から外す（メッセージウインドウの顔など）。
export function sprite(name, { className = '', frames, decorative = false } = {}) {
  const s = SPRITES[name];
  const use = frames ?? [Object.keys(s.frames)[0]];
  const a11y = decorative ? 'aria-hidden="true"' : `role="img" aria-label="${s.label}"`;
  const groups = use.map((f, i) => frameGroup(s.frames[f], f, i === 0)).join('');
  const wrap = document.createElement('span');
  wrap.innerHTML = `<svg class="sprite ${className}" viewBox="0 0 ${s.width} ${s.height}" shape-rendering="crispEdges" ${a11y}>${groups}</svg>`;
  return wrap.firstChild;
}

// SVG が持つコマを intervalMs ごとに順に切り替える。止めるための関数を返す。
// 設定の「点滅・ゆれの演出」が「なし」のときは動かさない。
export function animate(svg, intervalMs = 500) {
  if (document.documentElement.dataset.motion === 'off') return () => {};
  const groups = [...svg.querySelectorAll('g[data-frame]')];
  if (groups.length < 2) return () => {};
  let i = 0;
  const timer = setInterval(() => {
    groups[i].classList.remove('on');
    i = (i + 1) % groups.length;
    groups[i].classList.add('on');
  }, intervalMs);
  return () => clearInterval(timer);
}

// マスコットのメモリン。idle: true で待機モーション（軽い屈伸）用のコマを持たせる（動かすのは animate）。
export function memorin(className = 'mascot', { idle = false } = {}) {
  return sprite('memorin', {
    className,
    frames: idle ? SPRITES.memorin.idle : ['stand'],
    decorative: className === 'face',
  });
}
