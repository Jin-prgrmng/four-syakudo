// 4つの尺度の定義と、フローチャートモードで使う判定の問い。
// UI から独立した純粋なデータと関数だけを置く（tests/ から直接読み込む）。

export const SCALES = {
  nominal: {
    id: 'nominal',
    name: '名義尺度',
    short: '名義',
    kind: '質的データ',
    summary: '区別や分類のためだけに値を使う。順序も大小もない。',
    operations: '同じか違うか（＝, ≠）',
  },
  ordinal: {
    id: 'ordinal',
    name: '順序尺度',
    short: '順序',
    kind: '質的データ',
    summary: '値の並び順に意味があるが、値と値の間の幅はそろっていない。',
    operations: '同じか違うか、大きいか小さいか（＜, ＞）',
  },
  interval: {
    id: 'interval',
    name: '間隔尺度',
    short: '間隔',
    kind: '量的データ',
    summary: '値の差に意味があるが、0 は「何もない」ことを表さない。',
    operations: '上に加えて、差を計算できる（＋, −）',
  },
  ratio: {
    id: 'ratio',
    name: '比例尺度',
    short: '比例',
    kind: '量的データ',
    summary: '0 が「何もない」ことを表すので、「何倍」という比べ方ができる。',
    operations: '上に加えて、比を計算できる（×, ÷）',
  },
};

export const SCALE_IDS = ['nominal', 'ordinal', 'interval', 'ratio'];

// フローチャートの問い。yes なら次の問いへ進み、no ならその時点で尺度が決まる。
export const FLOW_STEPS = [
  {
    key: 'order',
    question: '値を小さい順・大きい順に並べることに意味はあるか。',
    hint: '数字で書かれていても、ただの名前（番号）なら並べる意味はない。',
    ifNo: 'nominal',
  },
  {
    key: 'equalInterval',
    question: '値と値の差（間隔）は、どこでも同じ大きさを表しているか。',
    hint: '1位と2位の差と、2位と3位の差は同じとは限らない。',
    ifNo: 'ordinal',
  },
  {
    key: 'trueZero',
    question: '0 は「まったくない」ことを表し、「2倍」「半分」と言えるか。',
    hint: '0℃ は「温度がない」ことではない。0 kg は「重さがない」ことを表す。',
    ifNo: 'interval',
  },
];

// フローチャートの答え（{order, equalInterval, trueZero} の真偽値）から尺度を決める。
export function scaleFromAnswers(answers) {
  for (const step of FLOW_STEPS) {
    if (!answers[step.key]) return step.ifNo;
  }
  return 'ratio';
}

// 尺度から、フローチャートの各問いへの正しい答えを求める。
export function answersForScale(scaleId) {
  const rank = SCALE_IDS.indexOf(scaleId);
  if (rank < 0) throw new Error(`unknown scale: ${scaleId}`);
  return {
    order: rank >= 1,
    equalInterval: rank >= 2,
    trueZero: rank >= 3,
  };
}
