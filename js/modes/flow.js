// STEP 1 フローチャートモード。項目ごとに3つの問いへ順に答え、尺度にたどり着く。
import { FLOW_STEPS, SCALE_IDS, answersForScale } from '../scales.js';
import { shuffle } from '../pick.js';
import { h, win, button, scaleLabel, typeText } from '../ui.js';

const ITEMS_PER_PLAY = 5;

// 各尺度から1つずつと、残り1つをランダムに選ぶ。発展（level 3）と議論のある項目は除く。
function pickItems(items) {
  const pool = shuffle(items.filter((i) => i.level <= 2 && !i.contested));
  const picked = SCALE_IDS.map((id) => pool.find((i) => i.scale === id));
  const rest = pool.filter((i) => !picked.includes(i));
  return shuffle([...picked, ...rest.slice(0, ITEMS_PER_PLAY - picked.length)]);
}

export function startFlow(ctx) {
  const { root, go, settings, history } = ctx;
  const items = pickItems(ctx.items);
  const answers = [];
  let typing = null;

  function playItem(index) {
    const item = items[index];
    const correctAnswers = answersForScale(item.scale);
    const path = [];
    let stepIndex = 0;
    let mistakes = 0;

    const card = win(null,
      h('div', { class: 'card' },
        h('p', { class: 'qno' }, `項目 ${index + 1} / ${items.length}`),
        h('p', { class: 'label' }, item.label),
        h('p', { class: 'example' }, `例：${item.example}`)));
    const pathList = h('ul', { class: 'path', 'aria-label': 'ここまでの答え' });
    const questionBox = h('div');
    const msg = h('div', { class: 'msg', 'aria-live': 'polite' });

    root.replaceChildren(h('h1', { class: 'head' }, 'フローチャートで考える'), card, win('問い', pathList, questionBox), win('メモリン', msg));

    function say(text, extra) {
      typing?.finish();
      msg.replaceChildren();
      if (extra) msg.append(extra);
      const p = h('p');
      msg.append(p);
      typing = typeText(p, text, settings.textSpeed);
      return typing.done;
    }

    function renderQuestion() {
      const step = FLOW_STEPS[stepIndex];
      questionBox.replaceChildren(
        h('p', { class: 'head' }, `問い ${stepIndex + 1}`),
        h('p', {}, step.question),
        h('div', { class: 'yesno' },
          button('はい', () => answer(true), { 'data-autofocus': true }),
          button('いいえ', () => answer(false))));
      questionBox.querySelector('button').focus({ preventScroll: true });
    }

    function answer(yes) {
      const step = FLOW_STEPS[stepIndex];
      if (yes !== correctAnswers[step.key]) {
        mistakes += 1;
        say(`うーん、もう一度考えてみよう。ヒント：${step.hint}`);
        return;
      }
      path.push(h('li', {}, `${step.short} → ${yes ? 'はい' : 'いいえ'}`));
      pathList.replaceChildren(...path);
      if (!yes) return finish();
      stepIndex += 1;
      if (stepIndex === FLOW_STEPS.length) return finish();
      say('そのとおり！　次の問いに進もう。');
      renderQuestion();
    }

    function finish() {
      answers.push({ id: item.id, scale: item.scale, chosen: null, correct: mistakes === 0 });
      const last = index === items.length - 1;
      questionBox.replaceChildren(
        h('p', { class: 'verdict good' }, 'この項目は ', scaleLabel(item.scale), '！'),
        h('div', { class: 'btn-row' }, button(last ? '結果を見る' : '次の項目へ', () => {
          typing?.finish();
          if (last) showResult();
          else playItem(index + 1);
        })));
      questionBox.querySelector('button').focus({ preventScroll: true });
      say(item.explanation);
    }

    say('この項目の値について、問いに順番に答えよう。');
    renderQuestion();
  }

  function showResult() {
    const ok = answers.filter((a) => a.correct).length;
    history.add({ mode: 'flow', summary: { correct: ok, total: answers.length }, answers });
    const missed = answers.filter((a) => !a.correct).map((a) => ctx.itemsById.get(a.id));
    root.replaceChildren(
      h('h1', { class: 'head' }, 'フローチャート　結果'),
      win(null,
        h('p', { class: 'verdict' }, `${answers.length} 項目のうち、一度もまちがえずにたどり着けたのは ${ok} 項目。`),
        missed.length
          ? h('div', {}, h('p', {}, '途中でまちがえた項目：'),
            h('ul', { class: 'review-list' }, missed.map((i) => h('li', {}, h('span', { class: 'label' }, i.label), '　', scaleLabel(i.scale)))))
          : h('p', {}, 'すべて一度で正しくたどり着けた。4択クイズに進もう。')),
      h('div', { class: 'btn-row' },
        button('もう一度', () => go('flow')),
        button('4択クイズへ進む', () => go('quiz')),
        button('メニューにもどる', () => go('title'))));
    root.querySelector('.btn').focus({ preventScroll: true });
  }

  playItem(0);
  return () => typing?.finish();
}
