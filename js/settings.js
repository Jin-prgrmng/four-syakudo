// 表示の設定。<html> の data 属性に反映し、CSS 側で見た目を切り替える。
const KEY = 'four-syakudo:settings:v1';

export const SETTING_OPTIONS = {
  palette: { label: '画面の色', options: [['color', 'カラー'], ['gb', 'モノクロ4階調']] },
  font: { label: '見出しの文字', options: [['dot', 'ドット文字'], ['ud', 'UDフォント']] },
  size: { label: '文字の大きさ', options: [['m', 'ふつう'], ['l', '大きい']] },
  textSpeed: { label: 'メッセージの速さ', options: [['normal', 'ゆっくり'], ['fast', 'はやい'], ['instant', 'すぐ全文']] },
  motion: { label: '点滅・ゆれの演出', options: [['on', 'あり'], ['off', 'なし']] },
};

const DEFAULTS = { palette: 'color', font: 'dot', size: 'm', textSpeed: 'fast', motion: 'on' };

export function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // 保存できない環境では、このページを開いている間だけ有効になる
  }
  applySettings(settings);
}

export function applySettings(settings) {
  const root = document.documentElement;
  root.dataset.palette = settings.palette;
  root.dataset.font = settings.font;
  root.dataset.size = settings.size;
  root.dataset.motion = settings.motion;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', settings.palette === 'gb' ? '#8bac0f' : '#0b0f1e');
}
