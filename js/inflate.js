// 「ド派手！」モードの数値のインフレ。画面（DOM）に触れないので tests/ で検査する。
// コインは演出のための数値で、称号の判定には js/scoring.js の得点だけを使う。

export const DOPA_CONFIG = {
  coinBase: 100,
  // 連続正解ごとにコインの増え方が何倍になるか（指数関数的に増える）
  comboGrowth: 2.5,
  // FEVER のランプの数。すべて点くと JACKPOT になる
  lamps: 7,
  // JACKPOT のあいだのコインの倍率と、続く秒数
  jackpotMultiplier: 1000,
  jackpotSec: 5,
};

// 1回の正解で得るコイン。combo はこの正解を含めた連続正解数。
export function coinGain(combo, { jackpot = false } = {}, cfg = DOPA_CONFIG) {
  const gain = cfg.coinBase * cfg.comboGrowth ** Math.max(0, combo - 1);
  return Math.round(gain * (jackpot ? cfg.jackpotMultiplier : 1));
}

// 日本語の数の単位（4桁ごと）。最後は無量大数。
const UNITS = ['', '万', '億', '兆', '京', '垓', '𥝱', '穣', '溝', '澗', '正', '載', '極', '恒河沙', '阿僧祇', '那由他', '不可思議', '無量大数'];

// 大きな数を「1.2億」「35兆」のように、上から2〜3桁と単位で表す。
export function formatBig(n) {
  if (!Number.isFinite(n)) return '∞';
  const value = Math.floor(Math.max(0, n));
  if (value < 10000) return String(value);
  let unit = Math.min(Math.floor(Math.log10(value) / 4), UNITS.length - 1);
  let scaled = value / 10 ** (unit * 4);
  // 表示を丸めた結果が 10000 になったら、1つ上の単位にする
  if (Math.round(scaled * 10) / 10 >= 10000 && unit < UNITS.length - 1) {
    unit += 1;
    scaled /= 10000;
  }
  const digits = scaled < 10 ? 1 : 0;
  return `${scaled.toFixed(digits).replace(/\.0$/, '')}${UNITS[unit]}`;
}
