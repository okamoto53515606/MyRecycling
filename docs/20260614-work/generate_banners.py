# /// script
# dependencies = [
#   "google-genai",
#   "Pillow",
#   "python-dotenv",
# ]
# ///
"""
商品販促バナー生成スクリプト（Nano Banana 2 / gemini-3.1-flash-image）

Usage:
  uv run generate_banners.py                         # 全商品
  uv run generate_banners.py --id PRODUCT_ID         # 特定商品のみ再生成
"""

import argparse
import csv
import os
from io import BytesIO
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types
from PIL import Image

load_dotenv()

# ── 設定 ────────────────────────────────────────────────────────────────────
MODEL       = "gemini-3.1-flash-image"   # Nano Banana 2
CSV_PATH    = Path("sozai/products.csv")
SOZAI_DIR   = Path("sozai")
OUTPUT_DIR  = Path("output")
MAX_REF_IMG = 3   # 商品写真は最大3枚まで渡す


def build_prompt(row: dict) -> str:
    """商品データから画像生成プロンプトを組み立てる"""
    price_note = f"市場価格: {row['marketPrice']}" if row.get("marketPrice") else ""
    return f"""\
あなたはプロのグラフィックデザイナーです。
以下の商品情報をもとに、日本語のオンラインガレージセール用・横長販促バナー画像（16:9）を1枚作成してください。
添付の商品写真を必ず参照し、商品をバナー内の中央〜左側に自然に大きく配置してください。

━━━━━━━━━━━━━━━━━━━━━━
■ 商品名
{row['title']}

■ 販売価格（最も大きなテキストで強調）
{row['price']}円

■ 商品の状態
{row['condition']}

■ 市場価格との比較（お得感を視覚的に表現）
{price_note}

■ 訴求ポイント（バナー内に要点を簡潔に記載）
{row.get('appealPoint', '')}
━━━━━━━━━━━━━━━━━━━━━━

■ デザイン要件
- 横長バナー（16:9）、明るく清潔感のある温かみのあるデザイン
- 商品写真を大きく中央〜左に配置し、右側にテキスト情報を配置
- 販売価格「{row['price']}円」を最大フォントで強調（例: 赤・オレンジなど目立つ色）
- 市場価格に取り消し線を引き「→ {row['price']}円！」と比較表示
- 右上または左上に「okamoのリサイクル」をブランド名として小さく表示
- バナー下部に「📍 東京都国立市エリア限定・直接手渡し」を含める
- バッジや吹き出し等で「14日間返品OK」を目立つ形で含める
- 訴求ポイントの要点を2〜3行の箇条書き（✓ マーク等使用）で記載
- 全体的にプロのマーケティング素材として通用するクオリティで仕上げる
"""


def generate_banner(client: genai.Client, row: dict) -> Path | None:
    """1商品分のバナーを生成してoutput/に保存する"""
    product_id = row["id"]
    title      = row["title"][:45]
    print(f"\n{'─'*55}")
    print(f"[{product_id[:8]}…] {title}")

    # ── 商品写真を収集（最大 MAX_REF_IMG 枚）──────────────────────────────
    ref_images: list[Image.Image] = []
    for fname in (row.get("imageFiles") or "").split()[:MAX_REF_IMG]:
        img_path = SOZAI_DIR / fname
        if img_path.exists():
            ref_images.append(Image.open(img_path).convert("RGB"))
            print(f"  参照画像: {fname}")
        else:
            print(f"  [WARN] 画像なし: {fname}")

    if not ref_images:
        print("  [SKIP] 商品写真が0枚のためスキップ")
        return None

    # ── API 呼び出し ─────────────────────────────────────────────────────────
    prompt   = build_prompt(row)
    contents = [prompt] + ref_images

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
            ),
        )
    except Exception as e:
        print(f"  [ERROR] API 呼び出し失敗: {e}")
        return None

    # ── 結果を保存 ─────────────────────────────────────────────────────────
    for part in response.candidates[0].content.parts:
        if part.inline_data is not None:
            img      = Image.open(BytesIO(part.inline_data.data))
            out_path = OUTPUT_DIR / f"{product_id}_banner.png"
            img.save(str(out_path))
            print(f"  ✅ 保存: {out_path}  ({img.size[0]}x{img.size[1]}px)")
            return out_path

    # テキストのみ返った場合
    print("  [WARN] 画像が返されませんでした")
    for part in response.candidates[0].content.parts:
        if part.text:
            print(f"  テキスト: {part.text[:300]}")
    return None


def main() -> None:
    parser = argparse.ArgumentParser(description="商品バナー画像生成（Nano Banana 2）")
    parser.add_argument(
        "--id",
        metavar="PRODUCT_ID",
        help="特定の商品IDのみ生成（省略時は全商品）",
    )
    args = parser.parse_args()

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("[ERROR] .env に GEMINI_API_KEY が設定されていません")
        return

    OUTPUT_DIR.mkdir(exist_ok=True)

    # ── CSV 読み込み ──────────────────────────────────────────────────────────
    rows: list[dict] = []
    with open(CSV_PATH, encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            rows.append(row)

    if args.id:
        rows = [r for r in rows if r["id"] == args.id]
        if not rows:
            print(f"[ERROR] 商品ID '{args.id}' が見つかりません")
            available = "\n".join(
                f"  {r['id']}  {r['title'][:40]}"
                for r in rows
            )
            return

    client = genai.Client(api_key=api_key)

    print(f"=== バナー生成開始: {len(rows)} 件  モデル: {MODEL} ===")
    success = 0
    for row in rows:
        if generate_banner(client, row):
            success += 1

    print(f"\n{'='*55}")
    print(f"完了: {success}/{len(rows)} 件成功")
    print(f"出力先: {OUTPUT_DIR.resolve()}")


if __name__ == "__main__":
    main()
