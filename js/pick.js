// 出題する項目の抽選。rng を引数で受け取り、テストでは固定の乱数を渡す。
import { SCALE_IDS } from './scales.js';

export function shuffle(list, rng = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 仕分けモード用: 尺度を均等に選んでから、その尺度の項目を選ぶ。
// 間隔尺度の項目は少ないため、項目から直接選ぶと間隔尺度のカードがほとんど出なくなる。
// 同じ項目が続けて出ないよう、尺度ごとに山札を作って使い切ったら切り直す。
export function createSortDeck(items, rng = Math.random) {
  const pool = items.filter((i) => !i.contested);
  const piles = new Map();
  let last = null;

  function draw(scale) {
    let pile = piles.get(scale);
    if (!pile || pile.length === 0) {
      pile = shuffle(pool.filter((i) => i.scale === scale), rng);
      piles.set(scale, pile);
    }
    return pile.pop();
  }

  return {
    next() {
      let item;
      do {
        item = draw(SCALE_IDS[Math.floor(rng() * SCALE_IDS.length)]);
      } while (item === last && pool.length > 1);
      last = item;
      return item;
    },
  };
}

// 4択クイズ用: はじめは level 1 から出し、後半に level 2・3 を混ぜる。
export function pickQuiz(items, count = 10, rng = Math.random) {
  const easy = shuffle(items.filter((i) => i.level === 1), rng);
  const hard = shuffle(items.filter((i) => i.level > 1), rng);
  const nEasy = Math.min(easy.length, Math.ceil(count * 0.4));
  const head = easy.slice(0, nEasy);
  const tail = shuffle([...easy.slice(nEasy), ...hard], rng).slice(0, count - nEasy);
  return [...head, ...tail];
}
