# CLAUDE.md

高校の授業で使う、4つの尺度（名義・順序・間隔・比例）を学ぶ静的 Web ゲーム。仕様は docs/design.md を正とする。

- ビルドなし・外部ライブラリなしの HTML / CSS / ES Modules で書く。GitHub Pages にそのまま置ける状態を保つ。
- UI から独立したロジック（js/scales.js, js/scoring.js）は純粋な関数にし、tests/ で検査する。
- 変更後は `npm test` を通す。画面の確認は `npm start` でローカルサーバーを起動しておこなう。
- 画面の文言・解説は高校生向けの平易な常体で書く。用語は「比例尺度」に統一する。
- 問題項目は data/items.json に置き、フィールドの意味は docs/design.md の「問題データの仕様」に従う。
