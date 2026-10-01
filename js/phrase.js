// 日本語の文を、改行してよい位置（文節の切れ目）で区切る。DOM に触れない関数だけを置く（tests/ で検査する）。
//
// 日本語は単語の間に空白がないため、ブラウザは文字単位で改行し、「表さ／ない」のように語の途中で行が変わる。
// ここでは次の簡単な規則で切れ目を決め、画面側（js/ui.js）でその位置にだけ改行を許す。
//   - ひらがなの後に、漢字・カタカナ・英数字が来たところ（「意味が｜あるが」「の｜2倍」）
//   - 読点・句点の後（「あるが、｜0 は」）
//   - 閉じかっこの後。ただし直後が助詞などのひらがなのときは区切らない（「）は」「」で」を行頭に送らない）
//   - 開きかっこの前（「0 は｜「何もない」」）
// 句読点や閉じかっこの前、開きかっこの直後では区切らない（行頭の「。」や行末の「「」を防ぐ）。
// 英数字の記号（. , : など）は小数や時刻に使われるので、区切りの目印にしない（「273.15」を分けない）。
// 中黒（・）の前後でも区切らない（「多い・少ない」を分けない）。
// ひらがなどうしの境目は判断できないので区切らない（「意味があるが」は1つのまとまりになる）。
// 漢字の後に送りがな（ひらがな）が続くところでは区切らないので、「表さない」は分かれない。

const PUNCT = /[、。，．！？…：；]/;
const CLOSE = /[」』）〕】〉》]/;
const OPEN = /[「『（(〔【〈《]/;
const HIRAGANA = /[ぁ-ゟ]/;

function kind(c) {
  if (/\s/.test(c)) return 'space';
  if (c === '・') return 'join';
  if (PUNCT.test(c)) return 'punct';
  if (CLOSE.test(c)) return 'close';
  if (OPEN.test(c)) return 'open';
  if (HIRAGANA.test(c)) return 'hira';
  return 'other';
}

function canBreak(prev, next) {
  const a = kind(prev);
  const b = kind(next);
  if (a === 'join' || b === 'join') return false;
  if (b === 'punct' || b === 'close' || b === 'space' || a === 'space' || a === 'open') return false;
  if (a === 'punct') return true;
  if (a === 'close') return b !== 'hira';
  if (b === 'open') return true;
  return a === 'hira' && b === 'other';
}

// 文を、改行してよい位置で区切った配列にする。区切った部分をつなげると元の文に戻る。
export function splitPhrases(text) {
  const chars = [...String(text)];
  const parts = [];
  let current = '';
  chars.forEach((c, i) => {
    if (i > 0 && canBreak(chars[i - 1], c)) {
      parts.push(current);
      current = '';
    }
    current += c;
  });
  if (current) parts.push(current);
  return parts;
}
