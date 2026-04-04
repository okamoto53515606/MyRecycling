# Cloud Run デプロイガイド（東京リージョン）

## 概要

MyRecyclingシステムをCloud Run（asia-northeast1 / 東京）にデプロイする手順です。

- **GCPプロジェクト**: `studio-616520910-f0a62`
- **リージョン**: `asia-northeast1`（東京）
- **サービス名**: `myrecycling`
- **Service URL**: `https://myrecycling-404540121480.asia-northeast1.run.app`
- **ドメイン**: `myrecycling.okamomedia.tokyo`
- **Artifact Registry**: `myrecycling-images`

## 前提条件

- gcloud CLI がインストールされていること
- `gcloud auth login` で認証済みであること
- Node.js v22 がインストールされていること

## 1. Artifact Registry（初回のみ）

```bash
gcloud artifacts repositories create myrecycling-images \
  --repository-format=docker \
  --location=asia-northeast1 \
  --project=studio-616520910-f0a62
```

## 2. コンテナイメージのビルド

Cloud Build を使ってビルドします。`_IMAGE_TAG` のバージョンは適宜更新してください。

```bash
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=studio-616520910-f0a62 \
  --region=asia-northeast1 \
  --substitutions=\
_IMAGE_TAG=asia-northeast1-docker.pkg.dev/studio-616520910-f0a62/myrecycling-images/myrecycling:v1,\
_NEXT_PUBLIC_FIREBASE_API_KEY=xxx,\
_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=studio-616520910-f0a62.firebaseapp.com,\
_NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-616520910-f0a62,\
_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=studio-616520910-f0a62.firebasestorage.app,\
_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx,\
_NEXT_PUBLIC_FIREBASE_APP_ID=xxx,\
_NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com,\
_NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_xxx
```

※ `xxx` 部分は `.env.production` の実際の値に置き換えてください。

## 3. Cloud Run へデプロイ

```bash
gcloud run deploy myrecycling \
  --image=asia-northeast1-docker.pkg.dev/studio-616520910-f0a62/myrecycling-images/myrecycling:v1 \
  --region=asia-northeast1 \
  --project=studio-616520910-f0a62 \
  --platform=managed \
  --port=8080 \
  --allow-unauthenticated \
  --service-account=firebase-app-hosting-compute@studio-616520910-f0a62.iam.gserviceaccount.com \
  --memory=512Mi \
  --cpu=1 \
  --max-instances=1 \
  --min-instances=0 \
  --timeout=300 \
  --set-env-vars="\
NEXT_PUBLIC_FIREBASE_API_KEY=xxx,\
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=studio-616520910-f0a62.firebaseapp.com,\
NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-616520910-f0a62,\
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=studio-616520910-f0a62.firebasestorage.app,\
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx,\
NEXT_PUBLIC_FIREBASE_APP_ID=xxx,\
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com,\
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_xxx,\
STRIPE_SECRET_KEY=sk_live_xxx,\
STRIPE_WEBHOOK_SECRET=whsec_xxx,\
STRIPE_TAX_RATES=txr_xxx,\
CSP_REPORT_ONLY=false,\
ALLOWED_IP_ADDRESSES_FOR_THE_ADMIN_PAGE=219.104.139.88,\
MY_MAIL_SMTP_HOST=smtp.hetemail.jp,\
MY_MAIL_SMTP_PORT=465,\
MY_MAIL_SMTP_USER=xxx@okamomedia.tokyo,\
MY_MAIL_SMTP_PASSWORD=xxx,\
MY_MAIL_FROM=xxx@okamomedia.tokyo,\
MY_MAIL_FROM_NAME=【okamoのリサイクル】"
```

※ `xxx` 部分は `.env.production` の実際の値に置き換えてください。

## 4. デプロイ確認

```bash
# HTTPステータスとレスポンス時間を確認
curl -s -o /dev/null -w "HTTP Status: %{http_code}\nTTFB: %{time_starttransfer}s\n" \
  https://myrecycling-404540121480.asia-northeast1.run.app/
```

## 5. ドメインマッピング

### Cloud Run ドメインマッピング

```bash
gcloud beta run domain-mappings create \
  --service=myrecycling \
  --domain=myrecycling.okamomedia.tokyo \
  --region=asia-northeast1 \
  --project=studio-616520910-f0a62
```

もしくは Cloud Run コンソールからカスタムドメインを設定してください。

### DNS設定

DNSプロバイダーで以下のCNAMEレコードを設定：

| ホスト名 | タイプ | 値 |
|---------|-------|---|
| myrecycling | CNAME | ghs.googlehosted.com. |

### Firebase Auth 認証ドメイン

Firebase コンソール → Authentication → Settings → 認証済みドメイン に `myrecycling.okamomedia.tokyo` を追加。

### Google OAuth リダイレクトURI

Google Cloud Console → APIとサービス → 認証情報 → OAuth 2.0 クライアントID で以下を追加：

- 承認済みの JavaScript 生成元: `https://myrecycling.okamomedia.tokyo`
- 承認済みのリダイレクトURI: `https://myrecycling.okamomedia.tokyo/auth/callback`

## 6. 再ビルド＆再デプロイ（更新手順）

コード変更後の手順：

```bash
# 1. バージョン番号を更新してビルド（v1 → v2 → v3...）
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=studio-616520910-f0a62 \
  --region=asia-northeast1 \
  --substitutions=_IMAGE_TAG=asia-northeast1-docker.pkg.dev/studio-616520910-f0a62/myrecycling-images/myrecycling:v2,...

# 2. 新しいイメージでデプロイ
gcloud run deploy myrecycling \
  --image=asia-northeast1-docker.pkg.dev/studio-616520910-f0a62/myrecycling-images/myrecycling:v2 \
  --region=asia-northeast1 \
  --project=studio-616520910-f0a62
```

環境変数は前回デプロイ時の設定が保持されるため、変更がなければ `--set-env-vars` は不要です。

## 構成ファイル

| ファイル | 説明 |
|---------|------|
| `Dockerfile` | マルチステージビルド（deps → builder → runner） |
| `.dockerignore` | Dockerビルドの除外ファイル |
| `cloudbuild.yaml` | Cloud Build設定（NEXT_PUBLIC_* をビルド引数として渡す） |
| `next.config.ts` | `output: 'standalone'` で Next.js standalone モード |

## 主な変更点（App Hosting → Cloud Run 移行）

| ファイル | 変更内容 |
|---------|---------|
| `src/middleware.ts` | IP取得を `x-forwarded-for` 対応に変更 |
| `src/lib/env.ts` | IP取得を `x-forwarded-for` 対応に変更 |
| `next.config.ts` | `output: 'standalone'`、`staticPageGenerationTimeout: 120` 追加 |
| `src/lib/stripe.ts` | Stripe を遅延初期化（ビルド時のエラー回避） |
| `src/lib/settings.ts` | Firestore アクセスに3秒タイムアウト追加 |
| `src/lib/data.ts` | Firestore アクセスに3秒タイムアウト追加 |
| `src/app/page.tsx` | `force-dynamic` 追加（ビルド時の静的生成回避） |
| `src/app/admin/layout.tsx` | `force-dynamic` 追加（ビルド時の静的生成回避） |
