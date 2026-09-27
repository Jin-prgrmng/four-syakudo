// 仕分けモード（時間制限つき）の採点。UI から独立した純粋な関数だけを置く。
// 数値は授業で試したうえで調整する前提の初期値。

export const SORT_CONFIG = {
  timeLimitSec: 60,
  basePoint: 100,
  // 回答までの時間が短いほど加点する。fastSec 以内なら満額、slowSec 以上なら 0。
  speedBonusMax: 100,
  fastSec: 1.5,
  slowSec: 6,
  // 連続正解の数に応じて倍率を上げる（上限あり）。
  comboStep: 0.1,
  comboCap: 10,
  wrongPenalty: 50,
};

// 称号。上から順に、score と accuracy の両方を満たした最初の称号になる。
// 正答率の下限を設けて、当てずっぽうで数をこなしても上位に入れないようにする。
// 得点の目安（全問正解の場合）: 1枚2.5秒で約7600点、3秒で約5800点、4秒で約3500点、6秒で約1450点。
export const TITLES = [
  { id: 'kaiden', grade: '皆伝', title: 'スティーヴンスの継承者', minScore: 7500, minAccuracy: 0.95 },
  { id: 'dan3', grade: '三段', title: '尺度の賢者', minScore: 5500, minAccuracy: 0.9 },
  { id: 'dan1', grade: '初段', title: '比例の魔導士', minScore: 4000, minAccuracy: 0.85 },
  { id: 'kyu2', grade: '二級', title: '間隔の騎士', minScore: 2800, minAccuracy: 0.8 },
  { id: 'kyu4', grade: '四級', title: '順序の旅人', minScore: 1800, minAccuracy: 0.7 },
  { id: 'kyu6', grade: '六級', title: '名義の番人', minScore: 1000, minAccuracy: 0.6 },
  { id: 'kyu8', grade: '八級', title: '目盛り見習い', minScore: 400, minAccuracy: 0.4 },
  { id: 'kyu10', grade: '十級', title: 'ものさし拾い', minScore: -Infinity, minAccuracy: 0 },
];

export function speedBonus(elapsedSec, cfg = SORT_CONFIG) {
  if (elapsedSec <= cfg.fastSec) return cfg.speedBonusMax;
  if (elapsedSec >= cfg.slowSec) return 0;
  const ratio = (cfg.slowSec - elapsedSec) / (cfg.slowSec - cfg.fastSec);
  return Math.round(cfg.speedBonusMax * ratio);
}

export function comboMultiplier(combo, cfg = SORT_CONFIG) {
  return 1 + cfg.comboStep * Math.min(combo, cfg.comboCap);
}

// 1枚ごとの回答記録 [{correct: boolean, elapsedSec: number}] からプレイ結果を集計する。
// combo は「この回答より前に続いた連続正解数」で倍率を決める。
export function summarize(answers, cfg = SORT_CONFIG) {
  let score = 0;
  let combo = 0;
  let maxCombo = 0;
  let correct = 0;
  let correctTime = 0;

  for (const a of answers) {
    if (a.correct) {
      const gained = (cfg.basePoint + speedBonus(a.elapsedSec, cfg)) * comboMultiplier(combo, cfg);
      score += Math.round(gained);
      combo += 1;
      correct += 1;
      correctTime += a.elapsedSec;
      maxCombo = Math.max(maxCombo, combo);
    } else {
      score -= cfg.wrongPenalty;
      combo = 0;
    }
  }

  const answered = answers.length;
  const accuracy = answered === 0 ? 0 : correct / answered;
  const perMinute = (correct / cfg.timeLimitSec) * 60;
  const avgSec = correct === 0 ? null : correctTime / correct;
  score = Math.max(0, score);

  return {
    score,
    answered,
    correct,
    accuracy,
    perMinute,
    avgSec,
    maxCombo,
    title: titleFor(score, accuracy),
  };
}

export function titleFor(score, accuracy) {
  return TITLES.find((r) => score >= r.minScore && accuracy >= r.minAccuracy);
}
