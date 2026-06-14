# generate_banners.py 使い方ガイド（非エンジニア向け）

## これは何をするスクリプト？

`sozai/products.csv`（商品データ）と `sozai/` 内の商品写真をもとに、  
**Gemini AI（Google の生成 AI）が自動で販促バナー画像を作ってくれる**スクリプトです。

```
商品CSV + 商品写真  →  generate_banners.py  →  output/{商品ID}_banner.png
```

生成されるバナーは横長（16:9）で、以下の要素が自動でデザインされます：

- 商品写真を大きく中央〜左に配置
- 販売価格を目立つ大きなフォントで強調
- 市場価格に取り消し線を引いてお得感を表現
- 「14日間返品OK」バッジ
- 「okamoのリサイクル」ブランド名
- 「国立市エリア限定・直接手渡し」の表示

> 先に `export_products.py` を実行して `sozai/products.csv` と商品写真を用意しておく必要があります。  
> 詳しくは `export_products.md` を参照してください。

---

## 事前に必要なもの

### 1. uv（Python 実行ツール）

`export_products.py` で使う `uv` と同じものです。  
まだ入れていない場合は `export_products.md` の「事前に必要なもの」手順を参照してください。

### 2. Gemini API キー

Gemini（Google の生成 AI）を使うための認証キーです。

**取得手順：**

1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス（Google アカウントでログイン）
2. 「Create API key」ボタンをクリック
3. 表示されたキー（`AIzaSy...` で始まる文字列）をコピー

> ⚠️ API キーは**パスワードと同じ**です。絶対に他人に見せたり Git にコミットしたりしないでください。

### 3. `.env` ファイルへの追記

このフォルダに `.env` ファイルを作成（または既存のものに追記）して、以下を記入してください：

```
GEMINI_API_KEY=AIzaSy...（取得したキーを貼り付け）
```

`.env.exsample` がサンプルとして置いてあります。これをコピーして `.env` という名前に変更し、値を埋めてください。

---

## 実行方法

ターミナル（PowerShell）でこのフォルダに移動してから実行します。

### 全商品のバナーを一括生成

```powershell
uv run generate_banners.py
```

`sozai/products.csv` に書かれた全商品分のバナーが順番に生成されます。  
はじめての実行時は依存ライブラリが自動インストールされるため、少し時間がかかります。

### 特定の商品だけ（再）生成

```powershell
uv run generate_banners.py --id 商品ID
```

**商品 ID の確認方法：**  
`sozai/products.csv` を Excel で開き、`id` 列の値（例：`kDE6KTFzKmhM8PFtl0ma`）をコピーして使います。

**例：**

```powershell
uv run generate_banners.py --id kDE6KTFzKmhM8PFtl0ma
```

---

## 出力ファイル

生成されたバナーは `output/` フォルダに保存されます。

```
output/
├── kDE6KTFzKmhM8PFtl0ma_banner.png   ← Kindle Scribe のバナー
├── viHEbu08ndrSjzRzhEnV_banner.png   ← LEGO WeDo のバナー
└── ...
```

ファイル名は `{商品ID}_banner.png` の形式です。

---

## よくあるエラーと対処法

### `[ERROR] .env に GEMINI_API_KEY が設定されていません`
→ `.env` ファイルに `GEMINI_API_KEY=...` の行がありません。「事前に必要なもの」の手順を確認してください。

### `[SKIP] 商品写真が0枚のためスキップ`
→ `sozai/` フォルダにその商品の画像ファイルがありません。先に `export_products.py` を実行して画像をダウンロードしてください。

### `[ERROR] 商品ID '...' が見つかりません`
→ `--id` に指定した商品 ID が `sozai/products.csv` に存在しません。CSV の `id` 列を確認してください。

### `[ERROR] API 呼び出し失敗: ...`
→ API キーが間違っている、または Gemini API の無料枠を使い切った可能性があります。  
[Google AI Studio](https://aistudio.google.com/app/apikey) でキーの状態を確認してください。

### 画像が生成されたのに真っ白／おかしいデザインになる
→ AI の出力はランダム性があるため、同じ商品でも毎回少し異なるバナーが生成されます。  
再度 `--id 商品ID` で再生成してください。

---

## AI へのカスタマイズ依頼例

このスクリプトのデザインや挙動を変えたいときは、以下の文章をそのままコピーして AI（GitHub Copilot や ChatGPT など）に貼り付けてください。

---

### デザインを変えたい

> `generate_banners.py` の `build_prompt` 関数がバナーのデザイン指示（プロンプト）を生成しています。  
> 以下の変更をお願いします：
>
> ・（例）背景色を白ではなく薄いグリーンにしたい  
> ・（例）価格の文字色を赤ではなく青にしたい  
> ・（例）「14日間返品OK」の代わりに「即日受け渡し可」というバッジを入れたい

---

### 別のサービスのバナーに使いたい（ブランド名・エリアを変えたい）

> `generate_banners.py` の `build_prompt` 関数の中にある以下の文言を変更してください：
>
> - `「okamoのリサイクル」` → `「（新しいブランド名）」`  
> - `「東京都国立市エリア限定・直接手渡し」` → `「（新しいエリア・方法）」`  
> - `「14日間返品OK」` → `「（新しい訴求文言）」`

---

### バナーの縦横比を変えたい（例：正方形・縦長）

> `generate_banners.py` の `build_prompt` 関数の中の `横長バナー（16:9）` という記述を  
> `正方形バナー（1:1）` など希望の比率に変更してください。

---

### 特定の商品が常にスキップされる／画像が少ない商品も生成したい

> `generate_banners.py` の `generate_banner` 関数を確認してください。  
> 現在は `sozai/` フォルダに商品写真が 1 枚もない場合はスキップしています（`[SKIP]` ログが出ます）。  
> 商品写真がなくてもバナーを生成できるよう、写真なしでもプロンプトだけで生成するように変更してください。

---

### 生成枚数・品質を変えたい

> `generate_banners.py` の定数設定部分（`MAX_REF_IMG = 3`）を変更してください。  
> 現在は商品写真を最大 3 枚まで AI に渡しています。  
> これを `MAX_REF_IMG = 1` にすると最初の 1 枚だけ渡すようになります（処理が速くなります）。

---

## 技術メモ（AI への変更依頼をするときに一緒に渡す情報）

このスクリプトの全体的な流れと、設計上の重要な判断ポイントをまとめています。  
変更を AI に依頼するときに「このメモも読んでください」と一緒に渡すと、より正確に対応してもらえます。

### スクリプトの処理の流れ

```
① .env から GEMINI_API_KEY を読み込む
② sozai/products.csv を読み込んで商品リストを作成
   （--id オプションがある場合はその商品のみに絞り込む）
③ 各商品について以下を繰り返す：
   ③-1. sozai/ フォルダ内の商品写真（最大 MAX_REF_IMG 枚）を読み込む
   ③-2. build_prompt() で AI へのデザイン指示文を作成
   ③-3. Gemini API に「指示文 + 商品写真」を送信
   ③-4. 返ってきた画像データを output/{商品ID}_banner.png に保存
```

### 主な設定値（変更しやすい箇所）

| 変数名 | 初期値 | 意味 |
|--------|--------|------|
| `MODEL` | `gemini-3.1-flash-image-preview` | 使用する Gemini モデル名 |
| `CSV_PATH` | `sozai/products.csv` | 商品データの CSV ファイルパス |
| `SOZAI_DIR` | `sozai` | 商品写真の格納フォルダ |
| `OUTPUT_DIR` | `output` | バナー保存先フォルダ |
| `MAX_REF_IMG` | `3` | AI に渡す商品写真の最大枚数 |

### プロンプト設計のポイント（`build_prompt` 関数）

AI へのデザイン指示は `build_prompt()` 関数の中の f-string（`f"""..."""`）に書かれています。  
この文字列の中の日本語テキストを変えるだけでデザインテイストやコピーを変更できます。

CSV の各列（`row['title']`、`row['price']` など）が自動で埋め込まれる仕組みになっており、  
商品ごとに異なる情報が入ったプロンプトが生成されます。

### `uv run` + `# /// script` ブロックについて

スクリプト先頭の以下のコメント：

```python
# /// script
# dependencies = [
#   "google-genai",
#   "Pillow",
#   "python-dotenv",
# ]
# ///
```

これは `uv run` に対して「このライブラリを自動インストールしてね」と伝える特別な書き方です。  
`pip install` なしで `uv run generate_banners.py` の一発実行が実現できています。
