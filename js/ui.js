// 画面部品の共通処理。DOM を組み立てる小さな関数だけを置く。
import { SCALES } from './scales.js';
import { memorin } from './sprites.js';
import { splitPhrases } from './phrase.js';

// 文節を、途中で改行しないまとまり（.ph）として包むかどうか。
// 空白を含む文節（「150 cm, 165 cm」など）は空白で改行できるので包まない。
// 1行より長い文節を包むと画面からはみ出すので、12文字を超える文節も包まない。
const keepTogether = (part) => !/\s/.test(part) && [...part].length <= 12;

// 文字列を、文節の切れ目にだけ改行を許す形（区切りに <wbr> を入れた断片）にする。
// css/style.css で word-break: keep-all を指定し、さらに短い文節は .ph（white-space: nowrap）で包むので、
// 「・」の直後のようにブラウザが独自に改行しがちな位置でも、文節の途中では改行しない。
export function phrased(text) {
  const frag = document.createDocumentFragment();
  splitPhrases(text).forEach((part, i) => {
    if (i > 0) frag.append(document.createElement('wbr'));
    if (keepTogether(part)) {
      const span = document.createElement('span');
      span.className = 'ph';
      span.textContent = part;
      frag.append(span);
    } else {
      frag.append(document.createTextNode(part));
    }
  });
  return frag;
}

// h('div', { class: 'win' }, '文字', 子要素...) の形で要素を作る。文字列はテキストとして入るので安全。
// 文字列は phrased() を通し、文節の切れ目で改行されるようにする。
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : phrased(String(c)));
  }
  return el;
}

export function win(title, ...children) {
  return h('section', { class: 'win' }, title ? h('h2', { class: 'win-title' }, title) : null, ...children);
}

// 尺度名を、色・形の記号・名前の3つで表示する。
export function scaleLabel(id, { short = false } = {}) {
  const s = SCALES[id];
  return h('span', { class: 'scale', 'data-scale': id },
    h('span', { class: 'mark', 'aria-hidden': 'true' }, s.mark), short ? s.short : s.name);
}

// ボタンは中身を横に並べる（flex）ので、文字は1つの span に包み、文節ごとの部品がばらばらに並ばないようにする。
export function button(label, onclick, attrs = {}) {
  return h('button', { class: 'btn', type: 'button', onclick, ...attrs }, h('span', {}, label));
}

export function menu(entries) {
  return h('div', { class: 'menu', role: 'menu' },
    entries.map(([label, sub, onclick]) =>
      h('button', { type: 'button', role: 'menuitem', onclick },
        h('span', {}, label, sub ? h('span', { class: 'sub' }, sub) : null))));
}

// ↑↓ キーでメニューやボタン列の中を移動できるようにする。
export function enableArrowKeys(root) {
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const list = [...root.querySelectorAll('button:not([disabled])')];
    const i = list.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const next = list[(i + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length];
    next.focus();
  });
}

// RPG のメッセージのように1文字ずつ表示する。タップかキー操作ですぐ全文を出す。
// 画面読み上げ用には、全文を最初から見えない要素に入れておく。
// 表示し終えたときの改行位置が途中で動かないよう、全文を最初から並べておき、まだ出していない文字を見えなくしておく。
export function typeText(target, text, speed) {
  const visible = h('span', { 'aria-hidden': 'true', class: 'tw' });
  target.append(h('span', { class: 'sr-only' }, text), visible);
  const chars = [];
  splitPhrases(text).forEach((part, i) => {
    if (i > 0) visible.append(document.createElement('wbr'));
    const holder = keepTogether(part) ? h('span', { class: 'ph' }) : visible;
    for (const c of part) {
      const span = document.createElement('span');
      span.textContent = c;
      chars.push(span);
      holder.append(span);
    }
    if (holder !== visible) visible.append(holder);
  });
  const delay = { instant: 0, fast: 15, normal: 40 }[speed] ?? 15;
  if (delay === 0) return { done: Promise.resolve(), finish() {} };

  visible.classList.add('typing');
  let i = 0;
  let timer;
  let resolve;
  const done = new Promise((r) => (resolve = r));
  const finish = () => {
    clearInterval(timer);
    visible.classList.remove('typing');
    resolve();
  };
  timer = setInterval(() => {
    chars[i]?.classList.add('shown');
    i += 1;
    if (i >= chars.length) finish();
  }, delay);
  return { done, finish };
}

export function formatDate(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// null や false を除いて root の中身を置き換える（条件つきの部品をそのまま並べられるようにする）。
export function mount(root, ...nodes) {
  root.replaceChildren(...nodes.flat().filter((n) => n !== null && n !== undefined && n !== false));
}

// メモリンが話すメッセージウインドウ。say(文字列 or 要素の配列, 1文字ずつ表示する本文) で中身を差し替える。
export function messageWindow(settings) {
  const text = h('div', { class: 'text', 'aria-live': 'polite' });
  const el = win('メモリン', h('div', { class: 'msg' }, memorin('face'), text));
  let typing = null;
  return {
    el,
    say(lead, body) {
      typing?.finish();
      text.replaceChildren(...[lead].flat().filter(Boolean));
      if (body) {
        const p = h('p');
        text.append(p);
        typing = typeText(p, body, settings.textSpeed);
      }
    },
    finish() {
      typing?.finish();
    },
  };
}

// 正誤の表示。色ではなく記号（○ × △）と文字で示す。
export function verdict(sym, ...children) {
  return h('p', { class: 'verdict' }, h('span', { class: 'sym', 'aria-hidden': 'true' }, sym), ...children);
}

// プレイ中に置く「メニュー」ボタン。押すと確認の画面を出し、「やめる」でメニューに戻る。
// ウインドウの上の枠線に載せる（.win-title と同じ位置）ので、画面の高さは増えない。
// onOpen / onClose は確認の画面を出し入れするときに呼ぶ（60秒仕分けではタイマーを止めるのに使う）。
// Esc キーでも同じ確認の画面を開く（js/main.js が .quit ボタンを押す）。
export function quitButton({ onQuit, onOpen, onClose }) {
  const btn = h('button', { class: 'win-title quit', type: 'button', 'aria-label': 'プレイをやめてメニューにもどる' }, '◀ メニュー');
  btn.addEventListener('click', () => {
    if (document.querySelector('.overlay')) return;
    onOpen?.();
    const close = () => {
      document.removeEventListener('keydown', onEsc, true);
      overlay.remove();
    };
    const onEsc = (e) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      close();
      onClose?.();
      btn.focus({ preventScroll: true });
    };
    const keep = button('つづける', () => { close(); onClose?.(); btn.focus({ preventScroll: true }); });
    const overlay = h('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'プレイをやめる' },
      win(null,
        h('p', { class: 'q-main' }, 'プレイをやめて、メニューにもどる？'),
        h('p', { class: 'small' }, 'ここまでの回答は記録されない。'),
        h('div', { class: 'btn-row' }, keep, button('やめる', () => { close(); onQuit(); }))));
    document.addEventListener('keydown', onEsc, true);
    document.body.append(overlay);
    keep.focus({ preventScroll: true });
  });
  return btn;
}
