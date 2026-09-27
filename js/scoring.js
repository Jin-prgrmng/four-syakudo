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

// 判定（成績の段階）。上から順に、score と accuracy の両方を満たした最初の段階になる。
// 正答率の下限を設けて、当てずっぽうで数をこなしても上位に入れないようにする。
export const RANKS = [
  { id: 'S', title: '尺度マスター', minScore: 6000, minAccuracy: 0.9 },
  { id: 'A', title: '尺度の達人', minScore: 4000, minAccuracy: 0.8 },
  { id: 'B', title: '一人前', minScore: 2500, minAccuracy: 0.7 },
  { id: 'C', title: '見習い', minScore: 1200, minAccuracy: 0.5 },
  { id: 'D', title: 'もう一度フローチャートへ', minScore: -Infinity, minAccuracy: 0 },
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
    rank: rankFor(score, accuracy),
  };
}

export function rankFor(score, accuracy) {
  return RANKS.find((r) => score >= r.minScore && accuracy >= r.minAccuracy);
}
