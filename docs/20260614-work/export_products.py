# /// script
# dependencies = [
#   "firebase-admin",
#   "requests",
#   "python-dotenv",
# ]
# ///

import os
import csv
import ast
import re
from pathlib import Path
from urllib.parse import urlparse, unquote

from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore, storage
import requests

load_dotenv()

key_file = os.getenv("FIREBASE_ADMINSDK_KEY_FILE")
project_id = os.getenv("GOOGLE_CLOUD_PROJECT_ID")

cred = credentials.Certificate(key_file)
firebase_admin.initialize_app(cred, {
    "storageBucket": f"{project_id}.firebasestorage.app"
})

db = firestore.client()
bucket = storage.bucket()

sozai_dir = Path("sozai")
sozai_dir.mkdir(exist_ok=True)


def clean_text(value):
    """改行を半角スペースに置換"""
    if value is None:
        return ""
    return str(value).replace("\r\n", " ").replace("\r", " ").replace("\n", " ")


def extract_storage_path(url: str) -> str | None:
    """Firebase Storage URL から バケット内パスを抽出"""
    parsed = urlparse(url)
    # https://storage.googleapis.com/BUCKET/PATH
    if "storage.googleapis.com" in parsed.netloc:
        # path = /BUCKET/REST…
        parts = parsed.path.lstrip("/").split("/", 1)
        if len(parts) == 2:
            return unquote(parts[1])
    # https://firebasestorage.googleapis.com/v0/b/BUCKET/o/ENCODED_PATH?...
    if "firebasestorage.googleapis.com" in parsed.netloc:
        m = re.search(r"/o/(.+?)(\?|$)", parsed.path)
        if m:
            return unquote(m.group(1))
    return None


def guess_extension(blob) -> str:
    ct = getattr(blob, "content_type", None) or ""
    mapping = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
    }
    return mapping.get(ct.lower(), ".jpg")


def download_image(url: str, doc_id: str, idx: int) -> str:
    """
    画像を sozai/ に保存してファイル名を返す。
    失敗時は空文字を返す。
    """
    storage_path = extract_storage_path(url)
    if not storage_path:
        print(f"  [WARN] URLからパス抽出失敗: {url}")
        return ""

    try:
        blob = bucket.blob(storage_path)
        blob.reload()          # メタデータ取得 (content_type など)
        ext = guess_extension(blob)
        filename = f"{doc_id}_{idx}{ext}"
        dest = sozai_dir / filename
        blob.download_to_filename(str(dest))
        print(f"  画像保存: {filename}")
        return filename
    except Exception as e:
        print(f"  [WARN] Admin SDK DL失敗 ({storage_path}): {e}")
        # フォールバック: 直接 HTTP
        try:
            resp = requests.get(url, timeout=30)
            resp.raise_for_status()
            ext = ".jpg"
            ct = resp.headers.get("Content-Type", "")
            if "png" in ct:
                ext = ".png"
            elif "webp" in ct:
                ext = ".webp"
            elif "gif" in ct:
                ext = ".gif"
            filename = f"{doc_id}_{idx}{ext}"
            dest = sozai_dir / filename
            dest.write_bytes(resp.content)
            print(f"  画像保存 (HTTP fallback): {filename}")
            return filename
        except Exception as e2:
            print(f"  [ERROR] HTTP DLも失敗: {e2}")
            return ""


# ── メイン処理 ──────────────────────────────────────────────────────────────

print("=== Firestore products コレクション取得 ===")
docs = list(db.collection("products").stream())
print(f"  {len(docs)} 件取得\n")

rows = []

for doc in docs:
    data = doc.to_dict()
    doc_id = doc.id

    # imageAssets をパース（Firestore では list<map> のはずだが文字列の場合も考慮）
    image_assets = data.get("imageAssets", [])
    if isinstance(image_assets, str):
        try:
            image_assets = ast.literal_eval(image_assets)
        except Exception:
            image_assets = []

    print(f"[{doc_id}] {data.get('title', '(タイトルなし)')}")

    image_filenames = []
    for i, asset in enumerate(image_assets, start=1):
        url = asset.get("url", "") if isinstance(asset, dict) else str(asset)
        if not url:
            continue
        fname = download_image(url, doc_id, i)
        if fname:
            image_filenames.append(fname)

    row = {
        "id":           doc_id,
        "title":        clean_text(data.get("title")),
        "excerpt":      clean_text(data.get("excerpt")),
        "content":      clean_text(data.get("content")),
        "price":        data.get("price", ""),
        "condition":    clean_text(data.get("condition")),
        "status":       data.get("status", ""),
        "tags":         clean_text(str(data.get("tags", ""))),
        "referenceURL": data.get("referenceURL", ""),
        "imageFiles":   " ".join(image_filenames),
        "createdAt":    str(data.get("createdAt", "")),
        "updatedAt":    str(data.get("updatedAt", "")),
    }
    rows.append(row)

# CSV 書き出し（UTF-8 BOM付き → Excel で文字化けしない）
csv_path = sozai_dir / "products.csv"
if rows:
    with open(csv_path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    print(f"\n✅ 完了: {csv_path}  ({len(rows)} 件)")
else:
    print("\n⚠️ データが0件です")
