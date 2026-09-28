// ドット絵のマスコット「メモリン」（ものさしの妖精）。1マスを1つの矩形として SVG で描く。
// 画像ファイルを読み込まないので軽く、拡大してもぼやけない。
const PALETTE = { k: '#1b1b2f', y: '#f0e442', o: '#e69f00', w: '#ffffff', b: '#1b1b2f', p: '#e08fc4' };

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
      if (PALETTE[c]) rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${PALETTE[c]}"/>`);
    });
  });
  const wrap = document.createElement('span');
  wrap.innerHTML = `<svg class="${className}" viewBox="0 0 12 16" shape-rendering="crispEdges" ${className === 'face' ? 'aria-hidden="true"' : 'role="img" aria-label="マスコットのメモリン"'}>${rects.join('')}</svg>`;
  return wrap.firstChild;
}
