// 4つの尺度の定義と、フローチャートモードで使う判定の問い。
// UI から独立した純粋なデータと関数だけを置く（tests/ から直接読み込む）。

export const SCALES = {
  nominal: {
    id: 'nominal',
    // 色だけに頼らず区別できるよう、尺度ごとに形の記号を付ける
    mark: '●',
    name: '名義尺度',
    short: '名義',
    kind: '質的データ',
    summary: '区別や分類のためだけに値を使う。順序も大小もない。',
    operations: '同じか違うか（＝, ≠）',
  },
  ordinal: {
    id: 'ordinal',
    mark: '▲',
    name: '順序尺度',
    short: '順序',
    kind: '質的データ',
    summary: '値の並び順に意味があるが、値と値の間の幅はそろっていない。',
    operations: '同じか違うか、大きいか小さいか（＜, ＞）',
  },
  interval: {
    id: 'interval',
    mark: '■',
    name: '間隔尺度',
    short: '間隔',
    kind: '量的データ',
    summary: '値の差に意味があるが、0 は「何もない」ことを表さない。',
    operations: '上に加えて、差を計算できる（＋, −）',
  },
  ratio: {
    id: 'ratio',
    mark: '★',
    name: '比例尺度',
    alias: '比率尺度',
    short: '比例',
    kind: '量的データ',
    summary: '0 が「何もない」ことを表すので、「何倍」という比べ方ができる。',
    operations: '上に加えて、比を計算できる（×, ÷）',
  },
};

export const SCALE_IDS = ['nominal', 'ordinal', 'interval', 'ratio'];

// フローチャートの問い。yes なら次の問いへ進み、no ならその時点で尺度が決まる。
// 初めて学ぶ人向けに、問いは短く具体的にし、「はい」「いいえ」それぞれの例を添える。
// 例とヒントには、data/items.json の問題にない事例だけを使う（答えのヒントにならないように）。
// tests/items.test.js で、問題の項目名が例やヒントに出てこないことを検査している。
// wrongHint は、正しい答えが yes なのに no と答えた場合（whenYes）と、その逆（whenNo）のヒント。
export const FLOW_STEPS = [
  {
    key: 'order',
    question: '「上・下」や「多い・少ない」で並べられる？',
    detail: '2つの値を比べて、どちらかが上・大きい・多いと言えるなら「はい」。ただの名前や番号なら「いいえ」。',
    yesExample: { label: '部屋の広さ', text: '8畳は6畳より広い' },
    noExample: { label: '好きな動物', text: '犬と猫に上下はない' },
    wrongHint: {
      whenYes: 'よく見ると、どちらかが上・強い・多いと言えないかな？　メダルの金・銀・銅のような段階も「並べられる」に入るよ。',
      whenNo: '数字で書かれていても、区別するための名前なら並べる意味はないよ。ロッカーの番号のように。',
    },
    ifNo: 'nominal',
  },
  {
    key: 'equalInterval',
    question: 'ものさしの目盛りのように、1つ分の幅はどこでも同じ？',
    detail: '1つ上がるときの増え方が、どこでも同じ大きさなら「はい」。段階やメダルの色のように幅がばらばらなら「いいえ」。',
    yesExample: { label: '定規で測った長さ', text: '1→2 cm も 9→10 cm も同じ 1 cm 分' },
    noExample: { label: 'メダルの色', text: '金と銀の差と、銀と銅の差は同じとは限らない' },
    wrongHint: {
      whenYes: 'cm・g・分のように単位が付いた量は、1つ分の幅がどこでも同じだよ。',
      whenNo: '段階やメダルの色は、1つ分の幅がそろっていないことが多いよ。',
    },
    ifNo: 'ordinal',
  },
  {
    key: 'trueZero',
    question: '0 は「何もない」ってこと？「2倍」と言える？',
    detail: '0 が「まったくない」を表し、「2倍」「半分」が意味をもつなら「はい」。0 がただの基準点なら「いいえ」。',
    yesExample: { label: '小銭の枚数', text: '0 枚は「ない」。10 枚は 5 枚の2倍' },
    noExample: { label: 'IQ', text: '0 は「知能がない」ではない' },
    wrongHint: {
      whenYes: '0 のときは「まったくない」状態じゃないかな？　0 g、0 枚、0 cm のように。',
      whenNo: 'その 0 は本当に「何もない」？　IQ のように、0 が「まったくない」を表さない値もあるよ。',
    },
    ifNo: 'interval',
  },
];

// 最後に尺度を選ぶ場面のヒント。たどった答えと尺度の対応を思い出させる。
export const PICK_HINT = {
  first: 'たどった答えを見てみよう。「いいえ」で止まった問いが決め手だよ。',
  second: '問い1で「いいえ」なら名義、問い2なら順序、問い3なら間隔、3つとも「はい」なら比例。',
};

// 例の値（"A, B, C" の形）から、メモリンが考え方を促す一言を作る。
export function thinkPrompt(step, item) {
  const values = item.example.split(/[,、]\s*/).map((v) => v.trim()).filter(Boolean);
  const [a, b] = values;
  if (step.key === 'order' && b) {
    return `「${a}」と「${b}」、どちらかが上と言えるかな？`;
  }
  if (step.key === 'equalInterval' && b) {
    return `「${a}」と「${b}」の差を、同じ単位で「いくつ分」と数えられるかな？`;
  }
  if (step.key === 'trueZero') {
    return `「${item.label}」が 0 のとき、それは「何もない」状態かな？`;
  }
  return `「${item.label}」の値を思い浮かべてみよう。`;
}

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

// 誤答したとき、フローチャートのどの問いで判断が分かれたかを返す。一致すれば null。
export function divergingStep(chosenId, correctId) {
  const chosen = answersForScale(chosenId);
  const correct = answersForScale(correctId);
  const step = FLOW_STEPS.find((s) => chosen[s.key] !== correct[s.key]);
  return step ? { step, chosen: chosen[step.key], correct: correct[step.key] } : null;
}
