// STEP 3 60秒仕分けモード。カードを4つの箱へドラッグするか、箱をタップ（または 1〜4 キー）して仕分ける。
import { SCALE_IDS, SCALES } from '../scales.js';
import { createSortDeck } from '../pick.js';
import { SORT_CONFIG, TITLES, summarize } from '../scoring.js';
import { h, win, button, scaleLabel, mount, verdict } from '../ui.js';

const WRONG_LOCK_MS = 300;

export function startSort(ctx) {
  const { root, go, history } = ctx;
  const timers = new Set();
  let onKey = null;

  const later = (fn, ms) => {
    const t = setTimeout(() => { timers.delete(t); fn(); }, ms);
    timers.add(t);
  };

  function showIntro() {
    const best = history.best('sort');
    root.replaceChildren(
      h('h1', { class: 'head' }, 'STEP 3　60秒仕分けチャレンジ'),
      win('ルール',
        h('p', {}, `出てくる項目を、${SORT_CONFIG.timeLimitSec}秒のあいだにできるだけ多く4つの尺度へ仕分ける。`),
        h('p', {}, 'カードを箱へドラッグするか、箱をタップする。キーボードなら 1〜4 キーで選べる。'),
        h('p', {}, '速く答えるほど得点が増え、連続で正解するとコンボで得点が上がる。まちがえると減点になり、コンボが切れる。'),
        h('p', { class: 'small' }, '称号は得点と正答率の両方で決まる。数だけこなしても上の称号にはなれない。'),
        best ? h('p', { class: 'head' }, `自己ベスト：${best} 点`) : null),
      h('div', { class: 'btn-row' },
        button('スタート', countdown, { 'data-autofocus': true }),
        button('メニューにもどる', () => go('title'))));
  }

  function countdown() {
    const n = h('p', { class: 'countdown', 'aria-live': 'assertive' }, '3');
    root.replaceChildren(n);
    later(() => { n.textContent = '2'; }, 700);
    later(() => { n.textContent = '1'; }, 1400);
    later(play, 2100);
  }

  function play() {
    const deck = createSortDeck(ctx.items);
    const answers = [];
    const endAt = performance.now() + SORT_CONFIG.timeLimitSec * 1000;
    let item = null;
    let shownAt = 0;
    let locked = false;
    let over = false;

    const bar = h('i');
    const timebar = h('div', { class: 'timebar', role: 'progressbar', 'aria-label': '残り時間' }, bar);
    const timeText = h('span', {}, '');
    const scoreText = h('span', {}, 'SCORE 0');
    const comboText = h('p', { class: 'combo', 'aria-live': 'off' }, '');
    const feedback = h('p', { class: 'feedback', 'aria-live': 'polite' }, '');
    const label = h('p', { class: 'label' });
    const example = h('p', { class: 'example' });
    const card = h('section', { class: 'win card sort-card', 'aria-live': 'polite' }, label, example);
    const boxes = h('div', { class: 'boxes' },
      SCALE_IDS.map((id, n) => h('button', {
        class: 'box', type: 'button', 'data-scale': id, onclick: () => answer(id),
      },
      h('span', { class: 'mark', 'aria-hidden': 'true' }, SCALES[id].mark),
      SCALES[id].name,
      h('span', { class: 'key', 'aria-hidden': 'true' }, `[${n + 1}]`))));

    root.replaceChildren(h('div', { class: 'hud' }, timebar, timeText, scoreText), card, comboText, feedback, boxes);

    function nextCard() {
      item = deck.next();
      label.textContent = item.label;
      example.textContent = `例：${item.example}`;
      shownAt = performance.now();
      locked = false;
    }

    function answer(id) {
      if (locked || over) return;
      const elapsedSec = (performance.now() - shownAt) / 1000;
      const correct = id === item.scale;
      const before = summarize(answers).score;
      answers.push({ id: item.id, scale: item.scale, chosen: id, correct, elapsedSec });
      const now = summarize(answers);
      scoreText.textContent = `SCORE ${now.score}`;
      const combo = currentCombo();
      comboText.textContent = combo >= 2 ? `${combo} コンボ！` : '';
      if (correct) {
        feedback.replaceChildren(verdict('○', `正解 +${now.score - before}`));
        nextCard();
      } else {
        feedback.replaceChildren(verdict('×', `${item.label} は `, scaleLabel(item.scale)));
        locked = true;
        card.classList.remove('shake');
        void card.offsetWidth; // アニメーションを最初からやり直す
        card.classList.add('shake');
        later(nextCard, WRONG_LOCK_MS);
      }
    }

    function currentCombo() {
      let c = 0;
      for (let i = answers.length - 1; i >= 0 && answers[i].correct; i--) c++;
      return c;
    }

    // ドラッグ操作。Pointer Events でマウスとタッチを同じ処理で扱う。
    let drag = null;
    const boxAt = (x, y) => document.elementsFromPoint(x, y).find((el) => el.classList.contains('box'));
    const clearHover = () => boxes.querySelectorAll('.hover').forEach((b) => b.classList.remove('hover'));
    card.addEventListener('pointerdown', (e) => {
      if (locked || over) return;
      drag = { x: e.clientX, y: e.clientY };
      card.setPointerCapture(e.pointerId);
      card.classList.add('dragging');
    });
    card.addEventListener('pointermove', (e) => {
      if (!drag) return;
      card.style.transform = `translate(${e.clientX - drag.x}px, ${e.clientY - drag.y}px)`;
      clearHover();
      boxAt(e.clientX, e.clientY)?.classList.add('hover');
    });
    const endDrag = (e) => {
      if (!drag) return;
      const target = e.type === 'pointerup' ? boxAt(e.clientX, e.clientY) : null;
      drag = null;
      card.style.transform = '';
      card.classList.remove('dragging');
      clearHover();
      if (target) answer(target.dataset.scale);
    };
    card.addEventListener('pointerup', endDrag);
    card.addEventListener('pointercancel', endDrag);

    onKey = (e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= 4) answer(SCALE_IDS[n - 1]);
    };

    const tick = setInterval(() => {
      const left = Math.max(0, endAt - performance.now()) / 1000;
      bar.style.transform = `scaleX(${left / SORT_CONFIG.timeLimitSec})`;
      timeText.textContent = `TIME ${Math.ceil(left)}`;
      timebar.classList.toggle('low', left <= 10);
      if (left <= 0) {
        clearInterval(tick);
        timers.delete(tick);
        finish();
      }
    }, 100);
    timers.add(tick);

    function finish() {
      over = true;
      onKey = null;
      for (const b of boxes.querySelectorAll('button')) b.disabled = true;
      feedback.replaceChildren(verdict('', 'そこまで！'));
      later(() => showResult(answers), 900);
    }

    nextCard();
    timeText.textContent = `TIME ${SORT_CONFIG.timeLimitSec}`;
  }

  function showResult(answers) {
    const r = summarize(answers);
    const prevBest = history.best('sort');
    history.add({
      mode: 'sort',
      summary: {
        score: r.score, correct: r.correct, total: r.answered, accuracy: r.accuracy,
        perMinute: r.perMinute, avgSec: r.avgSec, maxCombo: r.maxCombo, grade: r.title.grade, title: r.title.title,
      },
      answers,
    });

    const idx = TITLES.indexOf(r.title);
    const nextTitle = idx > 0 ? TITLES[idx - 1] : null;
    const missedIds = [...new Set(answers.filter((a) => !a.correct).map((a) => a.id))];
    const missedItems = missedIds.map((id) => ctx.itemsById.get(id));
    const pct = (x) => `${Math.round(x * 100)}%`;
    const stat = (k, v) => h('div', {}, h('small', {}, k), h('b', {}, v));

    mount(root,
      h('h1', { class: 'head' }, 'STEP 3　結果'),
      h('section', { class: 'win banner' },
        h('p', { class: 'grade' }, `称号　${r.title.grade}`),
        h('p', { class: 'ttl' }, r.title.title)),
      r.score > prevBest && prevBest > 0 ? h('p', { class: 'new-best' }, '自己ベスト更新！') : null,
      win('成績', h('div', { class: 'stat-grid' },
        stat('スコア', r.score),
        stat('正解/回答', `${r.correct}/${r.answered}`),
        stat('正答率', pct(r.accuracy)),
        stat('1分の正解数', r.perMinute.toFixed(1)),
        stat('平均回答秒', r.avgSec === null ? '―' : r.avgSec.toFixed(2)),
        stat('最大コンボ', r.maxCombo)),
      nextTitle ? h('p', { class: 'small', style: 'margin-top:8px' },
        `次の称号「${nextTitle.grade} ${nextTitle.title}」の条件：${nextTitle.minScore} 点以上、正答率 ${pct(nextTitle.minAccuracy)} 以上`) : null),
      missedItems.length ? win(null, h('details', {},
        h('summary', {}, `まちがえた項目（${missedItems.length}）を見る`),
        h('ul', { class: 'review-list' }, missedItems.map((item) => h('li', {},
          h('p', {}, h('span', { class: 'label' }, item.label), '　', scaleLabel(item.scale)),
          h('p', { class: 'small' }, item.explanation)))))) : null,
      h('div', { class: 'btn-row' },
        button('もう一度', countdown, { 'data-autofocus': true }),
        missedItems.length ? button('まちがえた項目をクイズで復習', () => go('quiz', { items: missedItems })) : null,
        button('メニューにもどる', () => go('title'))));
    root.querySelector('[data-autofocus]').focus({ preventScroll: true });
  }

  const keyHandler = (e) => onKey?.(e);
  document.addEventListener('keydown', keyHandler);
  showIntro();
  return () => {
    for (const t of timers) { clearTimeout(t); clearInterval(t); }
    document.removeEventListener('keydown', keyHandler);
  };
}
