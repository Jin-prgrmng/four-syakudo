// 冒険の記録。これまでのプレイと苦手な項目を示し、復習と記録の書き出しができる。
import { weakItems, toCSV } from '../history.js';
import { h, win, button, scaleLabel, formatDate, mount } from '../ui.js';

const MODE_NAMES = { flow: 'フローチャート', quiz: '4択クイズ', review: '復習クイズ', sort: '60秒仕分け' };

function describe(play) {
  const s = play.summary ?? {};
  if (play.mode === 'sort') return `${s.score} 点　${s.grade} ${s.title}`;
  return `${s.total} 問中 ${s.correct} 問正解`;
}

const playRow = (p) => h('div', { class: 'log-row' },
  h('span', { class: 'small' }, `${formatDate(p.at)}　${MODE_NAMES[p.mode] ?? p.mode}`),
  h('span', {}, describe(p)));

export function startLog(ctx) {
  const { root, go, history, itemsById } = ctx;
  const plays = history.all();
  const weak = weakItems(plays).filter((w) => itemsById.has(w.id)).slice(0, 10);
  const recent = [...plays].reverse().slice(0, 20);

  if (plays.length === 0) {
    root.append(
      h('h1', { class: 'head' }, '冒険の記録'),
      win(null, h('p', {}, 'まだ記録がない。フローチャートから冒険をはじめよう。'),
        h('p', { class: 'small' }, '記録はこの端末のブラウザに保存される。別の端末やブラウザとは共有されない。')),
      h('div', { class: 'btn-row' }, button('メニューにもどる', () => go('title'))));
    return null;
  }

  const sortPlays = plays.filter((p) => p.mode === 'sort');
  const best = sortPlays.reduce((a, p) => (!a || p.summary.score > a.summary.score ? p : a), null);

  function download() {
    const csv = '﻿' + toCSV(plays, itemsById); // 先頭の BOM で Excel でも文字化けしない
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = h('a', { href: url, download: `尺度の記録_${new Date().toISOString().slice(0, 10)}.csv` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function clearAll() {
    if (!confirm('この端末に保存された記録をすべて消す。よいか？')) return;
    history.clear();
    go('log');
  }

  mount(root,
    h('h1', { class: 'head' }, '冒険の記録'),
    win('これまで',
      h('p', {}, `プレイ ${plays.length} 回`,
        best ? `　仕分けの自己ベスト ${best.summary.score} 点（${best.summary.grade} ${best.summary.title}）` : ''),
      h('details', {}, h('summary', { class: 'small' }, '記録の保存場所について'),
        h('p', { class: 'small' }, '記録はこの端末のブラウザに保存される。ブラウザの履歴やデータを消すと記録も消えるので、残したいときは CSV で保存する。'))),
    weak.length ? win('苦手な項目',
      h('ul', { class: 'review-list' }, weak.slice(0, 5).map((w) => {
        const item = itemsById.get(w.id);
        return h('li', {}, h('details', {},
          h('summary', {}, h('span', { class: 'label' }, item.label), '　', scaleLabel(item.scale, { short: true }),
            h('span', { class: 'small' }, `　${w.wrong}/${w.tries}ミス`)),
          w.lastChosen ? h('p', { class: 'small' }, '最後に選んだ答え：', scaleLabel(w.lastChosen)) : null,
          h('p', { class: 'small' }, item.explanation)));
      })),
      h('div', { class: 'btn-row' },
        button(`苦手な項目${weak.length}件をクイズで復習`, () => go('quiz', { items: weak.map((w) => itemsById.get(w.id)) }), { 'data-autofocus': true })))
      : null,
    win('最近のプレイ',
      h('div', {}, recent.slice(0, 3).map(playRow)),
      recent.length > 3 ? h('details', {}, h('summary', { class: 'small' }, 'もっと見る'), recent.slice(3).map(playRow)) : null),
    h('div', { class: 'btn-row' },
      button('記録を CSV で保存', download),
      button('記録をすべて消す', clearAll),
      button('メニューにもどる', () => go('title'))));
  return null;
}
