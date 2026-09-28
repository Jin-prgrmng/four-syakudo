// 入口。問題データと記録を読み込み、画面を切り替える。
import { SCALES, SCALE_IDS, FLOW_STEPS } from './scales.js';
import { createHistory } from './history.js';
import { loadSettings, saveSettings, applySettings, SETTING_OPTIONS } from './settings.js';
import { h, win, menu, button, scaleLabel, enableArrowKeys, mount } from './ui.js';
import { memorin } from './sprites.js';
import { startFlow } from './modes/flow.js';
import { startQuiz } from './modes/quiz.js';
import { startSort } from './modes/sort.js';
import { startLog } from './modes/log.js';

const root = document.getElementById('app');
const settings = loadSettings();
applySettings(settings);

let cleanup = null;

// 各画面は (ctx, params) を受け取って root に描画し、必要なら後片付けの関数を返す。
const SCREENS = {
  title: showTitle,
  flow: startFlow,
  quiz: startQuiz,
  sort: startSort,
  log: startLog,
  guide: showGuide,
  settings: showSettings,
};

function go(name, params = {}) {
  if (cleanup) cleanup();
  cleanup = null;
  root.replaceChildren();
  window.scrollTo(0, 0);
  cleanup = SCREENS[name](ctx, params) ?? null;
  // 画面が変わったら最初のボタンにフォーカスを移し、キーボードだけでも操作できるようにする
  const first = root.querySelector('[data-autofocus], .menu button, .btn');
  first?.focus({ preventScroll: true });
}

const ctx = { root, go, settings, history: createHistory(), items: [], itemsById: new Map() };

function showTitle({ root, history }) {
  const best = history.best('sort');
  const m = menu([
    ['1. フローチャートで考える', '3つの問いで尺度にたどり着く', () => go('flow')],
    ['2. 4択クイズで確かめる', '1問ずつ答えて解説を読む', () => go('quiz')],
    ['3. 60秒仕分けチャレンジ', best ? `称号をねらう（自己ベスト ${best} 点）` : 'スコアと称号をねらう', () => go('sort')],
    ['冒険の記録', '成績と苦手な項目の復習', () => go('log')],
    ['尺度の図鑑', null, () => go('guide')],
    ['設定', null, () => go('settings')],
  ]);
  enableArrowKeys(m);
  root.append(
    h('div', { class: 'title-head' },
      memorin(),
      h('h1', { class: 'logo' }, '4つの尺度', h('small', {}, 'メモリンと ものさしの冒険'))),
    h('div', { class: 'scale-row', 'aria-hidden': 'true' }, SCALE_IDS.map((id) => scaleLabel(id, { short: true }))),
    win('メニュー', m));
}

// 尺度の図鑑。タブで1つずつ表示し、スマートフォンの1画面に収める。
function showGuide({ root, items }) {
  const tabs = [...SCALE_IDS, 'flow'];
  const panel = h('div');
  const tabRow = h('div', { class: 'opts', role: 'group', 'aria-label': '表示する内容' });

  function render(tab) {
    tabRow.replaceChildren(...tabs.map((t) => h('button', {
      type: 'button', 'aria-pressed': String(t === tab), onclick: () => render(t),
    }, t === 'flow' ? '見分け方' : scaleLabel(t, { short: true }))));
    if (tab === 'flow') {
      panel.replaceChildren(
        h('ol', { style: 'margin:0; padding-left:1.4em' }, FLOW_STEPS.map((st) =>
          h('li', { style: 'margin-bottom:8px' }, st.question, h('br'),
            h('span', { class: 'small' }, st.detail), h('br'),
            h('span', { class: 'small' }, 'いいえ → '), scaleLabel(st.ifNo)))),
        h('p', {}, '3つとも「はい」なら ', scaleLabel('ratio'), '。'));
      return;
    }
    const s = SCALES[tab];
    const examples = items.filter((i) => i.scale === tab && i.level === 1 && !i.contested).slice(0, 4);
    mount(panel,
      h('h2', {}, scaleLabel(tab)),
      h('p', {}, s.summary),
      h('p', { class: 'small' }, `${s.kind}　できる計算：${s.operations}`),
      s.alias ? h('p', { class: 'small' }, `「${s.alias}」と呼ぶ本もある。`) : null,
      h('p', { class: 'small' }, `例：${examples.map((i) => i.label).join('、')}`));
  }

  render(SCALE_IDS[0]);
  root.append(
    h('h1', { class: 'head' }, '尺度の図鑑'),
    h('div', { class: 'setting' }, tabRow),
    win(null, panel),
    h('div', { class: 'btn-row' }, button('メニューにもどる', () => go('title'))));
}

function showSettings({ root, settings }) {
  const body = h('div');
  const render = () => {
    body.replaceChildren(
      ...Object.entries(SETTING_OPTIONS).map(([key, def]) =>
        h('div', { class: 'setting', role: 'group', 'aria-label': def.label },
          h('p', { class: 'head' }, def.label),
          h('div', { class: 'opts' }, def.options.map(([value, label]) =>
            h('button', {
              type: 'button',
              'aria-pressed': String(settings[key] === value),
              onclick: () => { settings[key] = value; saveSettings(settings); render(); },
            }, label))))));
  };
  render();
  root.append(
    h('h1', { class: 'head' }, '設定'),
    win(null, body,
      h('p', { class: 'small' }, '本文はいつも読みやすい UD フォントで表示する。ドット文字が読みにくいときは、見出しも UD フォントに切り替えられる。')),
    h('div', { class: 'btn-row' }, button('メニューにもどる', () => go('title'))));
}

async function init() {
  const res = await fetch('data/items.json');
  if (!res.ok) throw new Error(`問題データを読み込めなかった（${res.status}）`);
  ctx.items = (await res.json()).items;
  ctx.itemsById = new Map(ctx.items.map((i) => [i.id, i]));
  go('title');
}

init().catch((err) => {
  root.replaceChildren(win('エラー', h('p', {}, err.message), h('p', { class: 'small' }, 'ページを読み込みなおしてほしい。')));
});
