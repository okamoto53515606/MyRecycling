# export_products.py 使い方ガイド（初心者向け）

## これは何をするスクリプト？

Firebase（Firestore）に保存された商品データを **CSV ファイル** に書き出し、
商品の画像も **`sozai/` フォルダ** にまとめてダウンロードするスクリプトです。

---

## 事前に必要なもの

### 1. uv（Python パッケージマネージャー）

このスクリプトは `uv` というツールを使って実行します。  
`pip` や `python` コマンドは**不要**です。`uv` が依存ライブラリをすべて自動でインストールしてくれます。

**インストール（Windows PowerShell）：**

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

インストール後、ターミナルを再起動してから以下で確認：

```powershell
uv --version
```

### 2. Firebase Admin SDK 秘密鍵ファイル（`.json`）

Firebase コンソールから取得する秘密鍵ファイルです。

**取得手順：**
1. [Firebase コンソール](https://console.firebase.google.com/) を開く
2. プロジェクトを選択 → 歯車アイコン（プロジェクトの設定）→「サービスアカウント」タブ
3. 「新しい秘密鍵の生成」ボタンをクリック → JSON ファイルをダウンロード
4. ダウンロードした JSON ファイルをこのフォルダに置く

> ⚠️ この JSON ファイルは**絶対に Git にコミットしたり公開したりしない**でください。

### 3. `.env` ファイルの作成

このフォルダに `.env` というファイルを作り、以下の内容を記入してください：

```
GOOGLE_CLOUD_PROJECT_ID=あなたのFirebaseプロジェクトID
FIREBASE_ADMINSDK_KEY_FILE=ダウンロードした秘密鍵ファイルのファイル名.json
```

**例：**

```
GOOGLE_CLOUD_PROJECT_ID=my-project-12345
FIREBASE_ADMINSDK_KEY_FILE=my-project-12345-firebase-adminsdk-xxxxx-xxxxxxxxxx.json
```

> プロジェクト ID は Firebase コンソールの「プロジェクトの設定 > 全般」で確認できます。

---

## 実行方法

ターミナル（PowerShell）でこのフォルダに移動してから：

```powershell
uv run export_products.py
```

はじめての実行時は依存ライブラリ（`firebase-admin` など）が自動でインストールされます。少し時間がかかる場合があります。

---

## 出力されるファイル

| ファイル | 内容 |
|----------|------|
| `sozai/products.csv` | 商品データ一覧（Excel で開ける UTF-8 BOM 付き CSV） |
| `sozai/{商品ID}_1.jpg` など | 商品画像ファイル |

### CSV の列

| 列名 | 内容 |
|------|------|
| `id` | Firestore のドキュメント ID |
| `title` | 商品名 |
| `excerpt` | 短い説明 |
| `content` | 詳細説明 |
| `price` | 価格 |
| `condition` | 状態（新品・中古など） |
| `status` | 公開状態 |
| `tags` | タグ |
| `referenceURL` | 参考 URL |
| `imageFiles` | ダウンロードした画像ファイル名（スペース区切り） |
| `createdAt` | 作成日時 |
| `updatedAt` | 更新日時 |

---

## よくあるエラーと対処法

### `FileNotFoundError: ... .json`
→ `.env` の `FIREBASE_ADMINSDK_KEY_FILE` に書いたファイル名と、実際に置いた JSON ファイルの名前が違います。ファイル名を確認してください。

### `invalid_grant: Invalid JWT Signature`
→ 秘密鍵ファイルが古くなっています。Firebase コンソールから新しい鍵を再生成してください。

### `PERMISSION_DENIED`
→ Firebase コンソールで Firestore と Storage のアクセス権が有効になっているか確認してください。

---

## generate_banners.py について

商品ごとの販促バナー画像（16:9）を **Gemini AI（Nano Banana 2）** で生成するスクリプトです。

### 追加で必要なもの

**Gemini API キー：**
1. [Google AI Studio](https://aistudio.google.com/app/apikey) でキーを取得
2. `.env` に追記：

```
GEMINI_API_KEY=AIzaSy...（取得したキー）
```

### 実行方法

**全商品のバナーを生成：**

```powershell
uv run generate_banners.py
```

**特定商品のバナーだけ再生成：**

```powershell
uv run generate_banners.py --id 商品ID
```

**出力先：** `output/{商品ID}_banner.png`（1376×768px）

---

## フォルダ構成（実行後）

```
20260614-work/
├── .env                          ← 認証情報（公開しないこと）
├── export_products.py            ← 商品データ書き出しスクリプト
├── generate_banners.py           ← バナー画像生成スクリプト
├── sozai/
│   ├── products.csv              ← 書き出された商品データ
│   ├── {商品ID}_1.jpg            ← ダウンロードされた商品画像
│   └── ...
├── output/
│   ├── {商品ID}_banner.png       ← 生成されたバナー画像
│   └── ...
└── welcome/
    └── index.html                ← LP（ランディングページ）
```

---

---

## 現状実装のポイント（技術メモ）

AIに変更を依頼するときの参考情報です。「どこを変えたいか」を伝える際にこのメモを一緒に渡してください。

### export_products.py の構造

```
① .envから認証情報を読み込む（load_dotenv）
② Firebaseに接続（firebase_admin）
③ Firestore の "products" コレクションを全件取得
④ 各ドキュメントの imageAssets フィールドから画像URLを取り出す
⑤ Firebase Storage SDK でダウンロード（失敗時はHTTP直接ダウンロードで再試行）
⑥ sozai/products.csv に書き出し（UTF-8 BOM付き）
```

**重要な実装の判断ポイント：**

- **`uv run` + `# /// script` ブロック**  
  スクリプトの先頭にある `# /// script` のコメント内に依存ライブラリを書くと、`uv run` 実行時に自動インストールされます。`pip install` 不要のワンコマンド実行を実現しています。

- **画像の保存先ファイル名 → `{商品ID}_{連番}{拡張子}`**  
  例：`kDE6KTFzKmhM8PFtl0ma_1.jpg`。商品IDを含めることでどの商品の画像か一目でわかります。

- **改行の除去 → `clean_text()` 関数**  
  Firestore の文字列フィールドに改行が含まれていると CSV が壊れるため、すべて半角スペースに置き換えています。

- **CSV の文字コード → UTF-8 BOM付き（`utf-8-sig`）**  
  Windows の Excel で直接開いたときに文字化けしないよう BOM を付けています。

### generate_banners.py の構造

```
① .envからGEMINI_API_KEYを読み込む
② products.csvを読み込み、対象商品を決定（--idオプションで絞り込み可）
③ 商品の画像（sozai/内）を参照画像として読み込む
④ 商品情報（名前・価格・アピールポイント等）をプロンプトに埋め込む
⑤ Gemini API（gemini-3.1-flash-image）に送信
⑥ 返ってきた画像データをPNGとして output/ に保存
```

**重要な実装の判断ポイント：**

- **モデル名 → `gemini-3.1-flash-image`（Nano Banana 2）**  
  画像生成に対応した特殊モデルです。通常の `gemini-*` モデルとは異なり、`response_modalities=["IMAGE"]` の指定が必要です。`response_format` パラメーターは**使えません**（エラーになります）。

- **参照画像の渡し方**  
  商品の実物写真を参照画像として一緒に送ることで、AIが商品の外観を把握してバナーを生成します。`sozai/` フォルダ内の `{商品ID}_*.jpg` を自動的に探して使います。

- **プロンプトの場所**  
  `generate_banners.py` 内の `build_prompt()` 関数（または `PROMPT = """..."""` のような文字列）がAIへの指示文です。バナーのデザイン・文言・雰囲気を変えたいときはここを変更します。

---

## カスタマイズガイド（AIに変更してもらう前提）

以下は「こう変えたい」という要望をAI（GitHub Copilot や ChatGPT など）に伝えるときのヒント集です。  
**ファイルの内容をそのままAIに貼り付けて**、下記の説明文を添えてください。

---

### ▶ 取得するコレクションを変えたい（Firestore以外も含む）

**Firestoreの別コレクションにする場合：**

> 「`export_products.py` の `db.collection("products")` という部分を `db.collection("★変えたいコレクション名★")` に変えてください。CSV の列名も合わせて変更をお願いします。」

**Firestoreをやめてスプレッドシート（Google Sheets）から読み込む場合：**

> 「`export_products.py` を、FirebaseではなくGoogle スプレッドシート（シートID：★★★）からデータを読み込む形に書き換えてください。認証には Google サービスアカウントを使います。`uv run` で動くよう `# /// script` ブロックも更新してください。」

**CSV や Excel ファイルから読み込む場合（一番シンプル）：**

> 「`export_products.py` を、Firebase接続部分をすべて削除して、代わりに `input/data.csv` を読み込む形に変えてください。画像ダウンロード処理は残してください。」

---

### ▶ CSV の列を増やしたい・減らしたい

> 「`export_products.py` のCSV出力に `★追加したいフィールド名★` という列を追加してください。Firestoreのフィールド名は `★Firestoreでのキー名★` です。」

> 「`export_products.py` のCSV出力から `tags` と `referenceURL` の列を削除してください。」

---

### ▶ バナーのデザイン・雰囲気を変えたい

プロンプト（AIへの指示文）を変えることでバナーの見た目が変わります。

> 「`generate_banners.py` のプロンプト部分（`build_prompt` 関数または `PROMPT` 変数）を以下のように変更してください：
> - 現在：★現在の指示の特徴★
> - 変更後：★こういうデザイン・雰囲気にしたい★（例：「和風・墨絵風」「ポップでカラフル」「シンプルなミニマルデザイン」）」

**バナーのサイズを変えたい場合：**

> 「`generate_banners.py` の出力画像サイズを現在の 1376×768px から ★幅★×★高さ★px に変えてください。プロンプトの縦横比の記述も合わせて更新してください。」

---

### ▶ 画像の保存先・ファイル名を変えたい

> 「`export_products.py` の画像保存先を `sozai/` から `images/` に変えてください。ファイル名は `{商品ID}_{連番}` のままで構いません。」

> 「`generate_banners.py` のバナー保存先を `output/` から `banners/` に変えてください。」

---

### ▶ 特定のステータスの商品だけ対象にしたい

> 「`export_products.py` で、Firestoreから取得した商品のうち `status` フィールドが `"published"` のものだけをCSVに出力するようにしてください。」

---

### ▶ AIに変更を依頼するときの基本的な伝え方

1. **このドキュメント（export_products.md）** をAIに見せる
2. **変更したいファイルの中身** をそのまま貼り付ける
3. **「〇〇を△△に変えてほしい」** と具体的に伝える
4. 変更後のコードを受け取ったら、元のファイルを上書きして `uv run` で動作確認する

> 💡 **ポイント：** 「なぜそうなっているか」より「何を変えたいか」を具体的に伝えるほうがうまくいきます。エラーが出たときはエラーメッセージをそのままコピーしてAIに渡してください。
