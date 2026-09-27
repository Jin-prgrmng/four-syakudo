// プレイ履歴。ブラウザの localStorage に保存するため、記録は端末とブラウザごとに残る。
// storage を引数で受け取り、テストでは Map を使った代用品を渡す。

const KEY = 'four-syakudo:history:v1';
export const MAX_PLAYS = 300;

function safeStorage() {
  try {
    const s = globalThis.localStorage;
    s.setItem('__test__', '1');
    s.removeItem('__test__');
    return s;
  } catch {
    return null;
  }
}

export function createHistory(storage = safeStorage()) {
  let memory = [];

  function load() {
    if (!storage) return memory;
    try {
      const plays = JSON.parse(storage.getItem(KEY) ?? '[]');
      return Array.isArray(plays) ? plays : [];
    } catch {
      return [];
    }
  }

  function save(plays) {
    memory = plays;
    if (!storage) return;
    try {
      storage.setItem(KEY, JSON.stringify(plays));
    } catch {
      // 容量超過などで保存できない場合は、このページを開いている間だけ保持する
    }
  }

  return {
    // play: { mode, summary, answers: [{ id, chosen, scale, correct, elapsedSec? }] }
    add(play) {
      const record = { at: new Date().toISOString(), ...play };
      const plays = [...load(), record].slice(-MAX_PLAYS);
      save(plays);
      return record;
    },
    all() {
      return load();
    },
    clear() {
      save([]);
    },
    // 仕分けモードの最高得点
    best(mode = 'sort') {
      return load()
        .filter((p) => p.mode === mode && p.summary?.score !== undefined)
        .reduce((max, p) => Math.max(max, p.summary.score), 0);
    },
  };
}

// 項目ごとの成績を集計し、間違えた回数が多い順に並べる。
export function weakItems(plays) {
  const stats = new Map();
  for (const play of plays) {
    for (const a of play.answers ?? []) {
      const s = stats.get(a.id) ?? { id: a.id, tries: 0, wrong: 0, lastChosen: null };
      s.tries += 1;
      if (!a.correct) {
        s.wrong += 1;
        s.lastChosen = a.chosen;
      }
      stats.set(a.id, s);
    }
  }
  return [...stats.values()]
    .filter((s) => s.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong || b.wrong / b.tries - a.wrong / a.tries);
}

// 復習や提出に使えるよう、回答1件を1行にした CSV を作る。
export function toCSV(plays, itemsById) {
  const header = ['日時', 'モード', '項目', '選んだ尺度', '正解の尺度', '正誤', '回答秒数'];
  const rows = [header];
  for (const play of plays) {
    for (const a of play.answers ?? []) {
      rows.push([
        play.at,
        play.mode,
        itemsById.get(a.id)?.label ?? a.id,
        a.chosen ?? '',
        a.scale ?? '',
        a.correct ? '正解' : '不正解',
        a.elapsedSec === undefined ? '' : a.elapsedSec.toFixed(2),
      ]);
    }
  }
  return rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\r\n');
}
