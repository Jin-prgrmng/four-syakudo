// 「ド派手！」モードの演出。設定の「画面の色」で「ド派手！」を選んだときだけ働く。
//
// 低性能の端末でも重くならないよう、演出は次の範囲にとどめる。
//   - 動きは transform と、steps() による段階的な変化だけ（ぼかし・半透明・連続的な変化は使わない）
//   - 一度に出す粒（コイン）は最大 12 個で、演出が終わったら要素を消す
// 光過敏の人への配慮として、光る演出（.fx-flash）は 1 秒に 3 回を超えないよう間引く。
// 「点滅・ゆれの演出：なし」や OS の動きを減らす設定では、動きを止め、文字の表示だけを残す。
import { phrased } from './ui.js';

export const isDopa = () => document.documentElement.dataset.palette === 'dopa';

const motionOn = () =>
  document.documentElement.dataset.motion !== 'off'
  && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function center(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function fixedAt(cls, { x, y }, content) {
  const el = document.createElement('div');
  el.className = cls;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  if (content !== undefined) el.append(typeof content === 'string' ? phrased(content) : content);
  el.setAttribute('aria-hidden', 'true');
  document.body.append(el);
  return el;
}

// anchor の上に大きな文字を「ドーン」と出す。tone は 'good' | 'bad' | 'jackpot'。
// small: true で小さめにする（60秒仕分けのように、次の問題を隠したくない場面で使う）。
export function stamp(anchor, text, tone = 'good', { ms = 700, small = false } = {}) {
  if (!isDopa() || !anchor) return;
  document.querySelectorAll('.fx-stamp').forEach((e) => e.remove());
  const el = fixedAt(`fx-stamp ${tone}${small ? ' small' : ''}`, center(anchor), text);
  setTimeout(() => el.remove(), tone === 'jackpot' ? 1400 : ms);
}

// anchor の中心からコインを飛び散らせる。
export function burst(anchor, count = 8) {
  if (!isDopa() || !anchor || !motionOn()) return;
  const c = center(anchor);
  const n = Math.min(12, count);
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n + Math.random() * 0.4;
    const dist = 70 + Math.random() * 60;
    const el = fixedAt('fx-coin', c, '◆');
    el.style.setProperty('--dx', `${Math.round(Math.cos(angle) * dist)}px`);
    el.style.setProperty('--dy', `${Math.round(Math.sin(angle) * dist)}px`);
    setTimeout(() => el.remove(), 650);
  }
}

// 要素の枠を一瞬光らせる。1 秒に 3 回を超えないよう間引く（光過敏への配慮）。
let lastFlash = 0;
export function flash(el) {
  if (!isDopa() || !el || !motionOn()) return;
  const now = performance.now();
  if (now - lastFlash < 350) return;
  lastFlash = now;
  el.classList.remove('fx-flash');
  void el.offsetWidth; // アニメーションを最初からやり直す
  el.classList.add('fx-flash');
}

// 要素を大きく出してから元の大きさに戻す（文字 PV のような登場）。
export function pop(el) {
  if (!isDopa() || !el || !motionOn()) return;
  el.classList.remove('fx-pop');
  void el.offsetWidth;
  el.classList.add('fx-pop');
}

// 数値を段階的に増やして見せる。format は数値を文字列にする関数。
export function countUp(el, from, to, format, steps = 4, stepMs = 60) {
  if (!isDopa() || !motionOn()) {
    el.textContent = format(to);
    return;
  }
  let i = 0;
  const timer = setInterval(() => {
    i += 1;
    el.textContent = format(i >= steps ? to : from + ((to - from) * i) / steps);
    if (i >= steps) clearInterval(timer);
  }, stepMs);
}

// スロットのように文字を回してから止める。止まったら done を呼ぶ。
export function slot(el, text, done) {
  const finish = () => {
    el.replaceChildren(phrased(text));
    done?.();
  };
  if (!isDopa() || !motionOn()) return finish();
  const pool = '名義順序間隔比例尺度級段★●▲■';
  const len = [...text].length;
  let n = 0;
  const timer = setInterval(() => {
    n += 1;
    const fixed = [...text].slice(0, Math.floor(n / 3));
    const rest = Array.from({ length: len - fixed.length }, () => pool[Math.floor(Math.random() * pool.length)]);
    el.textContent = [...fixed, ...rest].join('');
    if (fixed.length >= len) {
      clearInterval(timer);
      finish();
    }
  }, 70);
}

// 正解・不正解の演出をまとめて出す（4択クイズとフローチャートで使う）。
export function celebrate(card, text = '正解!!') {
  stamp(card, text, 'good');
  burst(card, 8);
  flash(card);
}

export function miss(card, text = 'ざんねん…') {
  stamp(card, text, 'bad');
}
