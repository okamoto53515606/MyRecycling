# データベース設計書

このドキュメントは、リサイクルシステムプロジェクトの Firestore データベース設計を定義します。

---

## コレクション一覧

- **settings**: サイト全体のグローバル設定
- **products**: 出品する商品データ
- **users**: ユーザー情報
- **orders**: 注文データ
- **meeting_locations**: 受け渡し場所の情報
- **available_weekdays**: 受け渡し可能な曜日
- **available_times**: 受け渡し可能な時間帯
- **unavailable_dates**: 受け渡しが不可能な特定の日付
- **mail_templates**: メールテンプレート

---

## 1. settings コレクション

サイト全体の設定を管理します。このコレクションには `site_config` という単一のドキュメントのみが存在します。

- **コレクションパス**: `/settings`
- **ドキュメントID**: `site_config`

### フィールド

| フィールド名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `siteName` | `string` | サイト名 |
| `siteDescription` | `string` | サイトの概要説明（トップページ表示用 / Markdown） |
| `guideContent` | `string` | ご利用ガイドページの内容 (Markdown) |
| `metaTitle` | `string` | トップページの `<title>` タグ |
| `metaDescription` | `string` | トップページの `<meta name="description">` |
| `legalCommerceContent` | `string` | 特定商取引法に基づく表記ページのコンテンツ (Markdown) |
| `privacyPolicyContent` | `string` | プライバシーポリシーページのコンテンツ (Markdown) |
| `termsOfServiceContent` | `string` | 利用規約ページのコンテンツ (Markdown) |
| `copyright` | `string` | フッターに表示するコピーライト表記 |
| `gtmId` | `string` | Google Tag Manager ID |
| `updatedAt` | `timestamp`| 最終更新日時 |

---

## 2. meeting_locations コレクション

受け渡し場所のマスターデータです。

- **コレクションパス**: `/meeting_locations`
- **ドキュメントID**: 自動生成ID

### フィールド

| フィールド名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `name` | `string` | 待ち合わせ場所の名称 |
| `description` | `string` | 場所に関する補足説明 (Markdown) |
| `photoURL` | `string` | 場所の写真URL |
| `googleMapEmbedURL`| `string` | Google Mapの埋め込み用HTMLタグ |
| `order` | `number` | 表示順を制御するための数値 |

---

## 3. 受け渡し日時関連コレクション

受け渡し可能な日時を制御するためのマスターデータです。

### 3-1. available_weekdays コレクション
- **コレクションパス**: `/available_weekdays`
- **ドキュメントID**: `sun`, `mon`, `tue`, `wed`, `thu`, `fri`, `sat`

| フィールド名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `isAvailable` | `boolean` | この曜日を受け渡し可能とするか |
| `order` | `number` | 曜日を並べ替えるための数値 (例: 日曜=0) |

### 3-2. available_times コレクション
- **コレクションパス**: `/available_times`
- **ドキュメントID**: 自動生成ID

| フィールド名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `time` | `string` | 時間（例: "10:00", "13:30"） |

### 3-3. unavailable_dates コレクション
- **コレクションパス**: `/unavailable_dates`
- **ドキュメントID**: 自動生成ID

| フィールド名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `date` | `timestamp` | 受け渡し不可の日付 (例: `2028-12-30`) |

---

## 4. products コレクション

出品するすべての商品データを格納します。各ドキュメントが1つの商品に対応します。URLにはドキュメントIDを直接使用します。

- **コレクションパス**: `/products`
- **ドキュメントID**: 自動生成ID

### フィールド

| フィールド名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `title` | `string` | 商品名 |
| `content` | `string` | 商品説明の本文 (Markdown) |
| `excerpt` | `string` | 商品一覧で表示する短い要約 |
| `imageAssets` | `array` of `map` | 商品画像のリスト |
| `tags` | `array` of `string` | カテゴリとして利用 |
| `status` | `string` | 公開状態 (`published` or `draft`) |
| `authorId` | `string` | 商品を登録した管理者のUID |
| `price` | `number` | 販売価格（円） |
| `condition` | `string` | 商品の状態（例: "新品、未使用", "やや傷や汚れあり"） |
| `referenceURL` | `string` | メーカーの商品説明URLなど |
| `createdAt` | `timestamp`| 初回作成日時 |
| `updatedAt` | `timestamp`| 最終更新日時 |

---

## 5. users コレクション

ログインしたユーザーの情報を格納します。

- **コレクションパス**: `/users`
- **ドキュメントID**: Firebase Auth の `uid`

### フィールド
| フィールド名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `uid` | `string` | Firebase Auth の `uid` |
| `email` | `string` | メールアドレス |
| `displayName` | `string` | 表示名 |
| `photoURL` | `string` | プロフィール画像のURL |
| `created_at` | `timestamp` | アカウント作成日時 |
| `updated_at` | `timestamp` | 最終更新日時 |

---

## 6. orders コレクション

商品の注文情報を格納します。1ドキュメントが1回の取引（注文から受け渡し、返品まで）に対応します。

- **コレクションパス**: `/orders`
- **ドキュメントID**: 自動生成ID

### フィールド
| フィールド名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `productId` | `string` | 紐づく商品のドキュメントID |
| `productName` | `string` | (冗長化) 商品名 |
| `price` | `number` | (冗長化) 金額 |
| `currency` | `string` | 通貨 (例: "jpy") |
| `buyerUid` | `string` | 購入者のUID |
| `buyerEmail` | `string` | (冗長化) 購入者のメールアドレス |
| `buyerDisplayName`| `string` | (冗長化) 購入者の表示名 |
| `commentFromBuyer` | `string` | (任意) 購入者からのコメント |
| `meetingLocationPhotoURL`| `string` | (冗長化) 受け渡し場所の写真URL |
| `meetingLocationName`| `string` | (冗長化) 受け渡し場所の名称 |
| `meetingLocationDescription`| `string` | (冗長化) 受け渡し場所の補足説明 (Markdown) |
| `meetingLocationGoogleMapEmbedURL`| `string` | (冗長化) Google Mapの埋め込み用HTMLタグ |
| `meetingDatetime` | `timestamp`| 受け渡し希望日時 |
| `orderStatus` | `string` | 注文ステータス<br>authorized: 注文確定待ち<br>approved: 注文確定済<br>canceled: 注文キャンセル済<br>delivered: 商品受け渡し済<br>refund_requested: 返品依頼中<br>refunded: 商品返品済 |
| `stripePaymentIntentId` | `string` | StripeのPaymentIntent ID |
| `ipAddress` | `string` | 注文時のIPアドレス |
| `orderedAt` | `timestamp`| 注文受付日時（オーソリ実行日時） |
| `approvedAt` | `timestamp`| (任意) 注文確定日時 |
| `cancellationReason`| `string` | (任意) 注文キャンセル理由 |
| `canceledAt` | `timestamp`| (任意) 注文キャンセル日時 |
| `handedOverAt` | `timestamp`| (任意) 商品受け渡し日時（売上確定日時） |
| `refundRequestReason`| `string` | (任意) 返品理由 |
| `refundMeetingDatetime` | `timestamp`| (任意) 返品時の受け渡し希望日時 |
| `refundMeetingLocationPhotoURL`| `string` | (任意/冗長化) 返品時の受け渡し場所の写真URL |
| `refundMeetingLocationName`| `string` | (任意/冗長化) 返品時の受け渡し場所名 |
| `refundMeetingLocationDescription`| `string` | (任意/冗長化) 返品時の場所補足説明 (Markdown) |
| `refundMeetingLocationGoogleMapEmbedURL`| `string` | (任意/冗長化) 返品時のGoogle Mapの埋め込み用HTMLタグ |
| `returnedAt` | `timestamp`| (任意) 商品返品日時（返金日時） |

**個数は固定値1の前提** ある商品ID（`productId`）に対し、`orderStatus` が `canceled`, `refunded` 以外の注文が存在する場合、その商品は「Sold out」扱いとして、他の人が注文できないようにアプリケーション側で制御する必要があります。

---

## 7. mail_templates コレクション

注文ステータスに応じて送信するメールのテンプレートを管理します。

- **コレクションパス**: `/mail_templates`
- **ドキュメントID**: メールテンプレート名（固定値）

### ドキュメントID一覧

| ドキュメントID | 説明 |
| :--- | :--- |
| `authorized_mail` | 注文確定待ちメール |
| `approved_mail` | 注文確定済メール |
| `canceled_mail` | 注文キャンセル済メール |
| `refund_requested_mail` | 返品依頼中メール |

### フィールド

| フィールド名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `subject` | `string` | メールの件名 |
| `body` | `string` | メール本文（テキスト） |
| `ccEmail` | `string` | 控えメールの送信先メールアドレス（送信後、このアドレスに同じメールを送信。空欄の場合は何もしない） |

### プレースホルダー

`subject` と `body` には、`orders` コレクションのフィールド値を挿入するためのプレースホルダーを使用できます。  
プレースホルダーは `{フィールド名}` の形式で記述します。

#### 使用可能なプレースホルダー

| プレースホルダー | 説明 |
| :--- | :--- |
| `{id}` | 注文ドキュメントID |
| `{productId}` | 商品ドキュメントID |
| `{productName}` | 商品名 |
| `{price}` | 金額 |
| `{currency}` | 通貨 |
| `{buyerUid}` | 購入者のUID |
| `{buyerEmail}` | 購入者のメールアドレス |
| `{buyerDisplayName}` | 購入者の表示名 |
| `{commentFromBuyer}` | 購入者からのコメント |
| `{meetingLocationName}` | 受け渡し場所の名称 |
| `{meetingLocationDescription}` | 受け渡し場所の補足説明 |
| `{meetingDatetime}` | 受け渡し希望日時 |
| `{orderStatus}` | 注文ステータス |
| `{orderedAt}` | 注文受付日時 |
| `{approvedAt}` | 注文確定日時 |
| `{cancellationReason}` | 注文キャンセル理由 |
| `{canceledAt}` | 注文キャンセル日時 |
| `{handedOverAt}` | 商品受け渡し日時 |
| `{refundRequestReason}` | 返品理由 |
| `{refundMeetingDatetime}` | 返品時の受け渡し希望日時 |
| `{refundMeetingLocationName}` | 返品時の受け渡し場所名 |
| `{returnedAt}` | 商品返品日時 |

#### 記載例

**件名の例:**
```
【{productName}】ご注文を受け付けました
```

**本文の例:**
```
{buyerDisplayName} 様

この度はご注文いただきありがとうございます。

■ご注文内容
商品名: {productName}
金額: {price}円
受け渡し場所: {meetingLocationName}
受け渡し希望日時: {meetingDatetime}

ご注文の詳細は以下のURLからご確認いただけます。
https://example.com/mypage/orders/{id}
```

**出力例（{id}が置換された場合）:**
```
https://example.com/mypage/orders/cs_test_a1cuqpgVI4GxG7S6HxIotwVkN5BTdcXzITACF34fYZvX55sRIAGqDhmRcp
```

---

## Firestoreインデックスの作成

本プロジェクトでは、特定のクエリを高速化するために複合インデックスが必要です。開発を進める中で、必要に応じてインデックスを定義・作成してください。（例: 特定のユーザーの注文一覧を表示するための `orders` コレクションに対するクエリなど）
