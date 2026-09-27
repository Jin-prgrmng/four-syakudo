// STEP 2 4択クイズモード。1問ごとに正誤と解説を示す。
// params.items を渡すと、その項目だけで出題する（冒険の記録からの復習に使う）。
import { SCALE_IDS, SCALES, divergingStep } from '../scales.js';
import { pickQuiz, shuffle } from '../pick.js';
import { h, win, button, scaleLabel, typeText } from '../ui.js';

export function startQuiz(ctx, params = {}) {
  const { root, go, settings, history } = ctx;
  const review = Boolean(params.items);
  const questions = review ? shuffle(params.items).slice(0, 10) : pickQuiz(ctx.items, 10);
  const answers = [];
  let typing = null;
  let onKey = null;

  function ask(index) {
    const item = questions[index];
    let answered = false;

    const choices = h('div', { class: 'boxes', role: 'group', 'aria-label': '尺度を選ぶ' },
      SCALE_IDS.map((id, n) =>
        h('button', { class: 'box', type: 'button', 'data-scale': id, onclick: () => choose(id) },
          h('span', { class: 'mark', 'aria-hidden': 'true' }, SCALES[id].mark),
          SCALES[id].name,
          h('span', { class: 'key', 'aria-hidden': 'true' }, `[${n + 1}]`))));
    const msg = h('div', { class: 'msg', 'aria-live': 'polite' });
    const next = h('div', { class: 'btn-row' });

    root.replaceChildren(
      h('h1', { class: 'head' }, review ? '苦手な項目の復習' : '4択クイズで確かめる'),
      win(null, h('div', { class: 'card' },
        h('p', { class: 'qno' }, `第 ${index + 1} 問 / ${questions.length}`),
        h('p', { class: 'label' }, item.label),
        h('p', { class: 'example' }, `例：${item.example}`))),
      choices,
      h('div', { style: 'height:12px' }),
      win('メモリン', msg),
      next);
    choices.querySelector('button').focus({ preventScroll: true });
    msg.append(h('p', {}, 'この項目は、どの尺度にあたるだろう？'));

    onKey = (e) => {
      const n = Number(e.key);
      if (!answered && n >= 1 && n <= 4) choose(SCALE_IDS[n - 1]);
    };

    function choose(id) {
      if (answered) return;
      answered = true;
      for (const b of choices.querySelectorAll('button')) {
        b.disabled = true;
        // 正解の箱を塗りつぶして示す（色だけでなく、塗りと形の記号でも分かる）
        if (b.dataset.scale === item.scale) b.classList.add('answer');
      }
      const exact = id === item.scale;
      const partial = !exact && (item.alternatives ?? []).includes(id);
      answers.push({ id: item.id, scale: item.scale, chosen: id, correct: exact || partial, partial });

      msg.replaceChildren();
      if (exact) {
        msg.append(h('p', { class: 'verdict good' }, '○ 正解！'));
      } else if (partial) {
        msg.append(h('p', { class: 'verdict good' }, '△ その考え方もある。'),
          h('p', {}, 'よく使われる答えは ', scaleLabel(item.scale), '。'));
      } else {
        const d = divergingStep(id, item.scale);
        msg.append(
          h('p', { class: 'verdict bad' }, '× 残念。正解は ', scaleLabel(item.scale), '。'),
          h('p', { class: 'hint' }, `分かれ目の問い：${d.step.question}`, h('br'),
            `あなたの答えだと「${d.chosen ? 'はい' : 'いいえ'}」、正しくは「${d.correct ? 'はい' : 'いいえ'}」。`));
      }
      const p = h('p');
      msg.append(p);
      typing = typeText(p, item.explanation, settings.textSpeed);

      const last = index === questions.length - 1;
      next.append(button(last ? '結果を見る' : '次の問題へ', () => {
        typing?.finish();
        if (last) showResult();
        else ask(index + 1);
      }));
      next.querySelector('button').focus({ preventScroll: true });
    }
  }

  function showResult() {
    onKey = null;
    const ok = answers.filter((a) => a.correct).length;
    history.add({ mode: review ? 'review' : 'quiz', summary: { correct: ok, total: answers.length }, answers });
    const missed = answers.filter((a) => !a.correct);
    const missedItems = missed.map((a) => ctx.itemsById.get(a.id));
    root.replaceChildren(
      h('h1', { class: 'head' }, 'クイズ　結果'),
      win(null,
        h('p', { class: 'verdict' }, `${answers.length} 問中 ${ok} 問正解。`),
        missed.length === 0
          ? h('p', {}, '全問正解！　60秒仕分けチャレンジに挑戦しよう。')
          : h('ul', { class: 'review-list' }, missed.map((a) => {
            const item = ctx.itemsById.get(a.id);
            return h('li', {},
              h('p', { class: 'label' }, item.label),
              h('p', { class: 'small' }, 'あなたの答え：', scaleLabel(a.chosen), '　正解：', scaleLabel(item.scale)),
              h('p', {}, item.explanation));
          }))),
      h('div', { class: 'btn-row' },
        missed.length ? button('まちがえた問題だけもう一度', () => go('quiz', { items: missedItems })) : null,
        button('もう一度', () => go('quiz')),
        button('60秒仕分けへ進む', () => go('sort')),
        button('メニューにもどる', () => go('title'))));
    root.querySelector('.btn').focus({ preventScroll: true });
  }

  if (questions.length === 0) {
    root.append(win(null, h('p', {}, '出題できる項目がない。')), button('メニューにもどる', () => go('title')));
    return null;
  }
  const keyHandler = (e) => onKey?.(e);
  document.addEventListener('keydown', keyHandler);
  ask(0);
  return () => {
    typing?.finish();
    document.removeEventListener('keydown', keyHandler);
  };
}
