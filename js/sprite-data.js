// ドット絵のデータ。画面（DOM）に触れないので tests/ から直接検査できる。描画は js/sprites.js がおこなう。
//
// 1体のキャラクターは、同じ大きさの「コマ」をいくつか持つ。コマは文字列の配列で、1文字が1マスを表す。
// 文字はマスの色を表し、「.」は透明。色そのものは css/style.css の .px-<文字> が決めるので、
// 「レトロ液晶」などの画面の色の設定に合わせて、CSS 側で塗り分けを変えられる。
// 新しい色を使うときは PIXEL_COLORS と css/style.css の両方に足す（tests/sprites.test.js が対応を検査する）。

export const PIXEL_COLORS = {
  k: '輪郭・黒',
  b: '瞳',
  y: '黄（メモリンの体）',
  o: '橙（メモリンの足元）',
  w: '白（白目）',
  p: 'ピンク（ほお）',
};

const MEMORIN_STAND = [
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

export const SPRITES = {
  memorin: {
    label: 'マスコットのメモリン',
    width: 12,
    height: 16,
    frames: {
      stand: MEMORIN_STAND,
      // かがんだコマ。目盛りのない体の下のほう（13行目）を1マス縮め、頭から上が1マス下がる（ひざを曲げたように見える）。
      crouch: ['............', ...MEMORIN_STAND.slice(0, 12), ...MEMORIN_STAND.slice(13)],
    },
    // 待機モーションで順に切り替えるコマ
    idle: ['stand', 'crouch'],
  },
};

// キャラクターのデータの誤りを文字列の配列で返す（誤りがなければ空の配列）。
export function spriteErrors(name, s) {
  const errors = [];
  for (const [frameName, rows] of Object.entries(s.frames)) {
    if (rows.length !== s.height) errors.push(`${name}.${frameName}: 行数が ${rows.length}（${s.height} であるべき）`);
    rows.forEach((row, y) => {
      if ([...row].length !== s.width) errors.push(`${name}.${frameName} ${y + 1}行目: 幅が ${[...row].length}（${s.width} であるべき）`);
      for (const c of row) {
        if (c !== '.' && !(c in PIXEL_COLORS)) errors.push(`${name}.${frameName} ${y + 1}行目: 未定義の色「${c}」`);
      }
    });
  }
  for (const f of s.idle ?? []) {
    if (!(f in s.frames)) errors.push(`${name}.idle: コマ「${f}」がない`);
  }
  return errors;
}
