// 画面の切り替えだけを担う入口。各モードの本体は js/modes/ に実装する予定。
const MODES = {
  flow: 'フローチャートで考える',
  quiz: '4択クイズで確かめる',
  sort: '60秒仕分けチャレンジ',
};

async function loadItems() {
  const res = await fetch('data/items.json');
  if (!res.ok) throw new Error(`問題データを読み込めない: ${res.status}`);
  return (await res.json()).items;
}

function showPlaceholder(mode) {
  const screen = document.getElementById('screen');
  screen.hidden = false;
  screen.innerHTML = `<p>「${MODES[mode]}」は未実装。</p>`;
}

async function init() {
  const items = await loadItems();
  console.info(`問題データ ${items.length} 件を読み込んだ`);
  for (const btn of document.querySelectorAll('.mode')) {
    btn.addEventListener('click', () => showPlaceholder(btn.dataset.mode));
  }
}

init().catch((err) => {
  document.getElementById('app').textContent = err.message;
});
