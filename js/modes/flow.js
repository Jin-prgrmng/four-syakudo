// STEP 1 フローチャートモード。項目ごとに3つの問いへ順に答え、最後に尺度を自分で選ぶ。
// メモリンが例の値を使って考え方を促し、まちがえたときは答えの向きに合わせたヒントを出す。
import { FLOW_STEPS, SCALE_IDS, SCALES, PICK_HINT, answersForScale, thinkPrompt } from '../scales.js';
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
    const path = [];
    let stepIndex = 0;
    let mistakes = 0;
    let missesHere = 0;
    let firstPick = null;

    const card = win(null,
      h('div', { class: 'card' },
        h('p', { class: 'qno' }, `フローチャート　項目 ${index + 1} / ${items.length}`),
        h('p', { class: 'label' }, item.label),
        h('p', { class: 'example' }, `例：${item.example}`),
        item.hint ? h('p', { class: 'item-hint' }, item.hint) : null));
    const questionBox = h('div');

    mount(root, card, win(null, questionBox), memo.el);

    function renderQuestion() {
      const step = FLOW_STEPS[stepIndex];
      missesHere = 0;
      questionBox.replaceChildren(
        h('p', { class: 'qno' }, `問い ${stepIndex + 1} / ${FLOW_STEPS.length}`),
        h('p', { class: 'q-main' }, step.question),
        h('p', { class: 'ex-line' }, `はい の例　${step.yesExample.label}：${step.yesExample.text}`),
        h('p', { class: 'ex-line' }, `いいえの例　${step.noExample.label}：${step.noExample.text}`),
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
        if (missesHere === 1) memo.say(verdict('×', 'おしい！'), hint);
        else memo.say(verdict('×', `答えは「${yn(right)}」だよ。`), hint);
        return;
      }
      path.push(`問い${stepIndex + 1} ${yn(yes)}`);
      stepIndex += 1;
      if (!yes || stepIndex === FLOW_STEPS.length) return renderPick();
      memo.say(verdict('○', 'そのとおり！'), thinkPrompt(FLOW_STEPS[stepIndex], item));
      renderQuestion();
    }

    // 最後の問い: たどった答えをもとに、プレイヤーが尺度を選ぶ。
    function renderPick() {
      missesHere = 0;
      questionBox.replaceChildren(
        h('p', { class: 'qno' }, '最後の問い'),
        h('p', { class: 'q-main' }, 'では、この項目は何尺度？'),
        h('p', { class: 'ex-line' }, `たどった答え：${path.join(' → ')}`),
        h('div', { class: 'boxes', role: 'group', 'aria-label': '尺度を選ぶ' },
          SCALE_IDS.map((id) => h('button', { class: 'box', type: 'button', 'data-scale': id, onclick: () => pick(id) },
            h('span', { class: 'mark', 'aria-hidden': 'true' }, SCALES[id].mark), SCALES[id].name))));
      questionBox.querySelector('.box').focus({ preventScroll: true });
      memo.say(verdict('○', 'そのとおり！'), 'たどった答えから、尺度を選ぼう。');
    }

    function pick(id) {
      firstPick ??= id;
      if (id !== item.scale) {
        mistakes += 1;
        missesHere += 1;
        if (missesHere === 1) memo.say(verdict('×', 'おしい！'), PICK_HINT.first);
        else memo.say(verdict('×', '答えは ', scaleLabel(item.scale), ' だよ。'), PICK_HINT.second);
        return;
      }
      finish();
    }

    function finish() {
      answers.push({ id: item.id, scale: item.scale, chosen: firstPick, correct: mistakes === 0 });
      const last = index === items.length - 1;
      questionBox.replaceChildren(
        h('p', { class: 'found q-main' }, scaleLabel(item.scale), ' 正解！'),
        h('div', { class: 'btn-row' }, button(last ? '結果を見る' : '次の項目へ', () => {
          memo.finish();
          if (last) showResult();
          else playItem(index + 1);
        })));
      questionBox.querySelector('.btn').focus({ preventScroll: true });
      memo.say(mistakes === 0 ? verdict('○', '一度もまちがえずに正解！') : null, item.explanation);
    }

    memo.say(null, thinkPrompt(FLOW_STEPS[0], item));
    renderQuestion();
  }

  function showResult() {
    const ok = answers.filter((a) => a.correct).length;
    history.add({ mode: 'flow', summary: { correct: ok, total: answers.length }, answers });
    const missed = answers.filter((a) => !a.correct).map((a) => ctx.itemsById.get(a.id));
    mount(root,
      h('h1', { class: 'head' }, 'フローチャート　結果'),
      win(null,
        h('p', { class: 'verdict' }, `${answers.length} 項目のうち、まちがえずに正解できたのは ${ok} 項目`),
        missed.length
          ? h('div', {}, h('p', { class: 'small' }, '途中でまちがえた項目'),
            h('ul', { class: 'review-list' }, missed.map((i) => h('li', {}, h('span', { class: 'label' }, i.label), '　', scaleLabel(i.scale)))))
          : h('p', {}, 'すべて一度で正解できた。4択クイズに進もう。')),
      h('div', { class: 'btn-row' },
        button('もう一度', () => go('flow')),
        button('4択クイズへ進む', () => go('quiz')),
        button('メニューにもどる', () => go('title'))));
    root.querySelector('.btn').focus({ preventScroll: true });
  }

  playItem(0);
  return () => memo.finish();
}
