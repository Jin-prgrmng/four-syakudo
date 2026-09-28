// STEP 1 フローチャートモード。項目ごとに3つの問いへ順に答え、尺度にたどり着く。
// メモリンが例の値を使って考え方を促し、まちがえたときは答えの向きに合わせたヒントを出す。
import { FLOW_STEPS, SCALE_IDS, answersForScale, thinkPrompt } from '../scales.js';
import { shuffle } from '../pick.js';
import { h, win, button, scaleLabel, messageWindow, verdict, mount } from '../ui.js';

const ITEMS_PER_PLAY = 5;

// 各尺度から1つずつと、残り1つをランダムに選ぶ。発展（level 3）と議論のある項目は除く。
function pickItems(items) {
  const pool = shuffle(items.filter((i) => i.level <= 2 && !i.contested));
  const picked = SCALE_IDS.map((id) => pool.find((i) => i.scale === id));
  const rest = pool.filter((i) => !picked.includes(i));
  return shuffle([...picked, ...rest.slice(0, ITEMS_PER_PLAY - picked.length)]);
}

const yn = (b) => (b ? 'はい' : 'いいえ');

export function startFlow(ctx) {
  const { root, go, settings, history } = ctx;
  const items = pickItems(ctx.items);
  const answers = [];
  const memo = messageWindow(settings);

  function playItem(index) {
    const item = items[index];
    const correctAnswers = answersForScale(item.scale);
    const given = {};
    let stepIndex = 0;
    let mistakes = 0;
    let missesHere = 0;

    const card = win(null,
      h('div', { class: 'card' },
        h('p', { class: 'qno' }, `STEP 1 フローチャート　項目 ${index + 1} / ${items.length}`),
        h('p', { class: 'label' }, item.label),
        h('p', { class: 'example' }, `例：${item.example}`)));
    const questionBox = h('div');

    mount(root, card, win(null, questionBox), memo.el);

    function stepChips() {
      return h('div', { class: 'steps', 'aria-hidden': 'true' }, FLOW_STEPS.map((st, i) => {
        const cls = i === stepIndex ? 'now' : i < stepIndex ? 'done' : '';
        const label = i < stepIndex ? `問い${i + 1} ${yn(given[st.key])}` : `問い${i + 1}`;
        return h('span', { class: cls }, label);
      }));
    }

    function renderQuestion() {
      const step = FLOW_STEPS[stepIndex];
      missesHere = 0;
      questionBox.replaceChildren(
        stepChips(),
        h('p', { class: 'q-main' }, h('span', { class: 'sr-only' }, `問い ${stepIndex + 1}。`), step.question),
        h('div', { class: 'examples' },
          h('div', {}, h('b', {}, `「はい」の例：${step.yesExample.label}`), step.yesExample.text),
          h('div', {}, h('b', {}, `「いいえ」の例：${step.noExample.label}`), step.noExample.text)),
        h('div', { class: 'yesno' },
          button('はい', () => answer(true)),
          button('いいえ', () => answer(false))));
      questionBox.querySelector('.yesno button').focus({ preventScroll: true });
    }

    function answer(yes) {
      const step = FLOW_STEPS[stepIndex];
      const right = correctAnswers[step.key];
      if (yes !== right) {
        mistakes += 1;
        missesHere += 1;
        const hint = right ? step.wrongHint.whenYes : step.wrongHint.whenNo;
        if (missesHere === 1) {
          memo.say(verdict('×', 'おしい！'), hint);
        } else {
          memo.say(verdict('×', `答えは「${yn(right)}」だよ。`), hint);
        }
        return;
      }
      given[step.key] = yes;
      if (!yes) return finish();
      stepIndex += 1;
      if (stepIndex === FLOW_STEPS.length) return finish();
      memo.say(verdict('○', 'そのとおり！'), thinkPrompt(FLOW_STEPS[stepIndex], item));
      renderQuestion();
    }

    function finish() {
      answers.push({ id: item.id, scale: item.scale, chosen: null, correct: mistakes === 0 });
      const last = index === items.length - 1;
      stepIndex = FLOW_STEPS.length;
      questionBox.replaceChildren(
        stepChips(),
        h('p', { class: 'found q-main' }, 'この項目は ', scaleLabel(item.scale), '！'),
        h('div', { class: 'btn-row' }, button(last ? '結果を見る' : '次の項目へ', () => {
          memo.finish();
          if (last) showResult();
          else playItem(index + 1);
        })));
      questionBox.querySelector('.btn').focus({ preventScroll: true });
      memo.say(mistakes === 0 ? verdict('○', '一度もまちがえずにたどり着けた！') : null, item.explanation);
    }

    memo.say(null, thinkPrompt(FLOW_STEPS[0], item));
    renderQuestion();
  }

  function showResult() {
    const ok = answers.filter((a) => a.correct).length;
    history.add({ mode: 'flow', summary: { correct: ok, total: answers.length }, answers });
    const missed = answers.filter((a) => !a.correct).map((a) => ctx.itemsById.get(a.id));
    mount(root,
      h('h1', { class: 'head' }, 'STEP 1　結果'),
      win(null,
        h('p', { class: 'verdict' }, `${answers.length} 項目のうち、まちがえずにたどり着けたのは ${ok} 項目`),
        missed.length
          ? h('div', {}, h('p', { class: 'small' }, '途中でまちがえた項目'),
            h('ul', { class: 'review-list' }, missed.map((i) => h('li', {}, h('span', { class: 'label' }, i.label), '　', scaleLabel(i.scale)))))
          : h('p', {}, 'すべて一度で正しくたどり着けた。4択クイズに進もう。')),
      h('div', { class: 'btn-row' },
        button('もう一度', () => go('flow')),
        button('4択クイズへ進む', () => go('quiz')),
        button('メニューにもどる', () => go('title'))));
    root.querySelector('.btn').focus({ preventScroll: true });
  }

  playItem(0);
  return () => memo.finish();
}
