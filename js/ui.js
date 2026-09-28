// 画面部品の共通処理。DOM を組み立てる小さな関数だけを置く。
import { SCALES } from './scales.js';
import { memorin } from './sprites.js';

// h('div', { class: 'win' }, '文字', 子要素...) の形で要素を作る。文字列はテキストとして入るので安全。
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
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
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

export function button(label, onclick, attrs = {}) {
  return h('button', { class: 'btn', type: 'button', onclick, ...attrs }, label);
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
export function typeText(target, text, speed) {
  const visible = h('span', { 'aria-hidden': 'true' });
  target.append(h('span', { class: 'sr-only' }, text), visible);
  const delay = { instant: 0, fast: 15, normal: 40 }[speed] ?? 15;
  if (delay === 0) {
    visible.textContent = text;
    return { done: Promise.resolve(), finish() {} };
  }
  let i = 0;
  let timer;
  let resolve;
  const done = new Promise((r) => (resolve = r));
  const finish = () => {
    clearInterval(timer);
    visible.textContent = text;
    resolve();
  };
  timer = setInterval(() => {
    i += 1;
    visible.textContent = text.slice(0, i);
    if (i >= text.length) finish();
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
