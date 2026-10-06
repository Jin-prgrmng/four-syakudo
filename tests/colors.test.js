// 尺度の4色が、色覚の型によらず見分けられることを検査する。
// css/style.css の --nominal など4色を読み、Machado et al. (2009) の行列で1型・2型・3型の見え方を再現して、
// どの2色の組み合わせも CIELAB の色差（ΔE）が十分に離れているかを確かめる。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const MIN_DELTA_E = 40;
const MIN_CONTRAST = 4.5;

const css = readFileSync(new URL('../css/style.css', import.meta.url), 'utf-8');
const root = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
const color = (name) => root.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))[1];
const palette = Object.fromEntries(['nominal', 'ordinal', 'interval', 'ratio'].map((n) => [n, color(n)]));
const background = color('win');

const MATRICES = {
  normal: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]],
};

const toLinear = (hex) => [1, 3, 5].map((i) => {
  const c = parseInt(hex.slice(i, i + 2), 16) / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
});
const simulate = (rgb, m) => m.map((row) => Math.min(1, Math.max(0, row.reduce((s, v, j) => s + v * rgb[j], 0))));
function toLab([r, g, b]) {
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047);
  const y = f(0.2126 * r + 0.7152 * g + 0.0722 * b);
  const z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
const luminance = (hex) => { const [r, g, b] = toLinear(hex); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

test('尺度の4色は、どの色覚の型でも互いに十分に離れている', () => {
  const names = Object.keys(palette);
  for (const [type, m] of Object.entries(MATRICES)) {
    const labs = Object.fromEntries(names.map((n) => [n, toLab(simulate(toLinear(palette[n]), m))]));
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const d = Math.hypot(...labs[names[i]].map((v, k) => v - labs[names[j]][k]));
        assert.ok(d >= MIN_DELTA_E, `${type}: ${names[i]} と ${names[j]} の色差が ${d.toFixed(1)} しかない`);
      }
    }
  }
});

test('尺度の4色は、ウインドウの背景に対して読みやすいコントラストがある', () => {
  const lb = luminance(background);
  for (const [name, hex] of Object.entries(palette)) {
    const ratio = (luminance(hex) + 0.05) / (lb + 0.05);
    assert.ok(ratio >= MIN_CONTRAST, `${name} のコントラスト比が ${ratio.toFixed(1)} しかない`);
  }
});

test('レトロ液晶モードの文字色は、明るい2色の背景に対して読みやすいコントラストがある', () => {
  const gb = css.slice(css.indexOf(':root[data-palette="gb"] {'));
  const tone = (n) => gb.match(new RegExp(`--gb${n}:\\s*(#[0-9a-fA-F]{6})`))[1];
  const text = tone(3);
  for (const bg of [tone(0), tone(1)]) {
    const [hi, lo] = [luminance(bg), luminance(text)].sort((a, b) => b - a);
    const ratio = (hi + 0.05) / (lo + 0.05);
    assert.ok(ratio >= MIN_CONTRAST, `${text} と ${bg} のコントラスト比が ${ratio.toFixed(1)} しかない`);
  }
  // 文字に使う変数は、いちばん暗い色（--gb3）だけを指していること
  for (const v of ['fg', 'fg-dim', 'nominal', 'ordinal', 'interval', 'ratio']) {
    assert.match(gb, new RegExp(`--${v}:\\s*var\\(--gb3\\)`), `--${v} がいちばん暗い色になっていない`);
  }
});

test('「ド派手！」モードの文字と尺度の色は、ウインドウの背景に対して読みやすいコントラストがある', () => {
  const block = css.slice(css.indexOf(':root[data-palette="dopa"] {'));
  const v = (n) => block.match(new RegExp(`--${n}:\\s*(#[0-9a-fA-F]{6})`))[1];
  const win = v('win');
  const lw = luminance(win);
  for (const hex of [v('fg'), v('fg-dim'), v('gold'), ...Object.values(palette)]) {
    const [hi, lo] = [luminance(hex), lw].sort((a, b) => b - a);
    const ratio = (hi + 0.05) / (lo + 0.05);
    assert.ok(ratio >= MIN_CONTRAST, `${hex} と ${win} のコントラスト比が ${ratio.toFixed(1)} しかない`);
  }
});
