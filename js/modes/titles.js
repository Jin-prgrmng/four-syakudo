// 称号と階級の説明。仕分けチャレンジの結果画面と説明画面から開く。
// params.current に称号の id を渡すと、その称号に「いまの称号」の印を付ける。
// params.back に戻り先の画面名と引数を渡すと、「もどる」でそこへ戻る。
import { TITLES, SORT_CONFIG } from '../scoring.js';
import { h, win, button, mount } from '../ui.js';

const pct = (x) => `${Math.round(x * 100)}%`;

function condition(t) {
  return Number.isFinite(t.minScore) ? `${t.minScore} 点以上・正答率 ${pct(t.minAccuracy)} 以上` : '条件なし（はじめの称号）';
}

// 1つの称号を開いたら、ほかの称号は閉じる（画面に収めるため）。
function closeOthers(e) {
  if (!e.target.open) return;
  for (const d of e.target.closest('.title-list').querySelectorAll('details[open]')) {
    if (d !== e.target) d.open = false;
  }
}

export function startTitles(ctx, params = {}) {
  const { root, go } = ctx;
  const back = params.back ?? { name: 'title' };
  const c = SORT_CONFIG;

  mount(root,
    h('h1', { class: 'head' }, '称号と階級'),
    win(null,
      h('p', { class: 'small' }, '級は数字が小さいほど上、段は大きいほど上。皆伝が最上位。'),
      h('ul', { class: 'title-list' }, TITLES.map((t) => {
        const now = t.id === params.current;
        return h('li', { class: now ? 'now' : null },
          h('details', { open: now || null, ontoggle: closeOthers },
            h('summary', {},
              h('span', { class: 'grade' }, t.grade), h('span', { class: 'ttl' }, t.title),
              now ? h('span', { class: 'mark-now' }, '◀ いま') : null),
            h('p', { class: 'small' }, condition(t)),
            h('p', { class: 'small' }, t.desc)));
      })),
      h('details', { style: 'margin-top:6px' },
      h('summary', {}, '称号の決まり方と得点のしくみ'),
      h('p', { class: 'small' }, '得点と正答率の両方が条件を満たした称号のうち、いちばん上のものがもらえる。'),
      h('p', { class: 'small' }, `正解すると ${c.basePoint} 点に、速さのボーナス（${c.fastSec} 秒以内なら ${c.speedBonusMax} 点、${c.slowSec} 秒かかると 0 点）を足す。`),
      h('p', { class: 'small' }, `連続で正解すると、1回ごとに得点が ${Math.round(c.comboStep * 100)}% ずつ増える（最大 ${c.comboCap} 連続で2倍）。`),
      h('p', { class: 'small' }, `まちがえると ${c.wrongPenalty} 点減り、連続正解が 0 に戻る。`))),
    h('div', { class: 'btn-row' }, button(back.label ?? 'もどる', () => go(back.name, back.params), { 'data-autofocus': true })));
  return null;
}
