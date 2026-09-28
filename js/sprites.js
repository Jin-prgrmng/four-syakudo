// ドット絵のマスコット「メモリン」（ものさしの妖精）。1マスを1つの矩形として SVG で描く。
// 画像ファイルを読み込まないので軽く、拡大してもぼやけない。
// 色は CSS のクラス（.px-k など）で塗るので、レトロ液晶モードでは CSS 側で色が切り替わる。
const MEMORIN = [
  '..kkkkkkkk..',
  '.kyyyyyyyyk.',
  '.kykkyyyyyk.',
  '.kyyyyyyyyk.',
  '.kykkkyyyyk.',
  '.kyyyyyyyyk.',
  '.kywbyywbyk.',
  '.kywbyywbyk.',
  '.kpyyyyyypk.',
  '.kyyykkyyyk.',
  '.kyyyyyyyyk.',
  '.kykkyyyyyk.',
  '.kyyyyyyyyk.',
  '.kooooooook.',
  '..kk....kk..',
  '.kkk....kkk.',
];

// 待機モーション用の「かがんだ」コマ。目盛りのない体の下のほう（13行目）を1マス縮め、頭から上が1マス下がる（ひざを曲げたように見える）。
const MEMORIN_CROUCH = ['............', ...MEMORIN.slice(0, 12), ...MEMORIN.slice(13)];

function frame(rows, cls) {
  const rects = [];
  rows.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c !== '.') rects.push(`<rect class="px-${c}" x="${x}" y="${y}" width="1" height="1"/>`);
    });
  });
  return `<g class="${cls}">${rects.join('')}</g>`;
}

// idle: true で、2コマを交互に表示する待機モーション（軽い屈伸）を付ける。
// 動きは CSS のアニメーションで切り替えるので、「点滅・ゆれの演出：なし」や OS の動きを減らす設定では止まる。
export function memorin(className = 'mascot', { idle = false } = {}) {
  const a11y = className === 'face' ? 'aria-hidden="true"' : 'role="img" aria-label="マスコットのメモリン"';
  const frames = idle ? frame(MEMORIN, 'f1') + frame(MEMORIN_CROUCH, 'f2') : frame(MEMORIN, 'f1');
  const wrap = document.createElement('span');
  wrap.innerHTML = `<svg class="${className}${idle ? ' idle' : ''}" viewBox="0 0 12 16" shape-rendering="crispEdges" ${a11y}>${frames}</svg>`;
  return wrap.firstChild;
}
