#!/bin/bash
# Cloud Run デプロイスクリプト
# 使い方: bash cli/deploy.sh [IMAGE_TAG]
# 例: bash cli/deploy.sh v20260614
#
# .env.production を読み込んでビルド＆デプロイを行う。
# 値にカンマ・特殊文字が含まれることを考慮し、--env-vars-file（YAML形式）を使用する。
# （--set-env-vars のカンマ区切りだと値のカンマで壊れるため）

set -euo pipefail

PROJECT="studio-616520910-f0a62"
REGION="asia-northeast1"
SERVICE="myrecycling"
REGISTRY="asia-northeast1-docker.pkg.dev/${PROJECT}/myrecycling-images/myrecycling"
ENV_FILE="${BASH_SOURCE%/*}/../.env.production"

IMAGE_TAG="${1:-v$(date +%Y%m%d)}"
IMAGE="${REGISTRY}:${IMAGE_TAG}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: ${ENV_FILE} が見つかりません" >&2
  exit 1
fi

# .env.production を読み込む（コメント行・空行を除外、FIREBASE_SERVICE_ACCOUNT_KEY は不要）
set -a
# shellcheck disable=SC1090
source <(grep -E '^[A-Z_][A-Z0-9_]*=' "${ENV_FILE}" | grep -v '^FIREBASE_SERVICE_ACCOUNT_KEY=')
set +a

echo ""
echo "========================================"
echo "  Cloud Run デプロイ: ${IMAGE_TAG}"
echo "========================================"
echo ""

# ── Step 1: Cloud Build でコンテナイメージをビルド ────────────────────────
echo "--- Step 1/2: Cloud Build ビルド ---"
echo "  IMAGE: ${IMAGE}"

gcloud builds submit \
  --config=cloudbuild.yaml \
  --project="${PROJECT}" \
  --region="${REGION}" \
  "--substitutions=\
_IMAGE_TAG=${IMAGE},\
_NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY},\
_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN},\
_NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID},\
_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET},\
_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID},\
_NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID},\
_NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID},\
_NEXT_PUBLIC_STRIPE_PUBLIC_KEY=${NEXT_PUBLIC_STRIPE_PUBLIC_KEY}"

echo ""
echo "--- Step 2/2: Cloud Run デプロイ ---"

# Cloud Run 用 env-vars YAML を一時ファイルに生成
# （YAML の single-quote で値の特殊文字・カンマ等を安全に扱う）
TMPFILE=$(mktemp /tmp/cloudrun-envvars-XXXXXX.yaml)
trap 'rm -f "${TMPFILE}"' EXIT

python3 - "${ENV_FILE}" > "${TMPFILE}" <<'PYEOF'
import sys, re

env_file = sys.argv[1]
# Cloud Run に不要な変数
skip_keys = {"FIREBASE_SERVICE_ACCOUNT_KEY"}

with open(env_file) as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        m = re.match(r'^([A-Z_][A-Z0-9_]*)=(.*)$', line)
        if not m:
            continue
        key = m.group(1)
        if key in skip_keys:
            continue
        val = m.group(2).strip('"\'')
        # YAML single-quoted string（' は '' にエスケープ）
        val_yaml = val.replace("'", "''")
        print(f"{key}: '{val_yaml}'")
PYEOF

gcloud run deploy "${SERVICE}" \
  --image="${IMAGE}" \
  --region="${REGION}" \
  --project="${PROJECT}" \
  --platform=managed \
  --port=8080 \
  --allow-unauthenticated \
  --service-account="firebase-app-hosting-compute@${PROJECT}.iam.gserviceaccount.com" \
  --memory=512Mi \
  --cpu=1 \
  --max-instances=1 \
  --min-instances=0 \
  --timeout=300 \
  --env-vars-file="${TMPFILE}"

echo ""
echo "--- デプロイ確認 ---"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\nTTFB: %{time_starttransfer}s\n" \
  "https://myrecycling-404540121480.asia-northeast1.run.app/"

echo ""
echo "LP確認: https://myrecycling-404540121480.asia-northeast1.run.app/welcome/"
echo "完了!"
