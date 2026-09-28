// ドット絵のマスコット「メモリン」（ものさしの妖精）。1マスを1つの矩形として SVG で描く。
// 画像ファイルを読み込まないので軽く、拡大してもぼやけない。
// 色は CSS のクラス（.px-k など）で塗るので、モノクロ4階調モードでは CSS 側で色が切り替わる。
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

export function memorin(className = 'mascot') {
  const rects = [];
  MEMORIN.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c !== '.') rects.push(`<rect class="px-${c}" x="${x}" y="${y}" width="1" height="1"/>`);
    });
  });
  const a11y = className === 'face' ? 'aria-hidden="true"' : 'role="img" aria-label="マスコットのメモリン"';
  const wrap = document.createElement('span');
  wrap.innerHTML = `<svg class="${className}" viewBox="0 0 12 16" shape-rendering="crispEdges" ${a11y}>${rects.join('')}</svg>`;
  return wrap.firstChild;
}
