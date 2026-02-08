/**
 * ユーティリティ関数
 * 
 * プロジェクト全体で再利用されるヘルパー関数を定義します。
 */

/**
 * 数値を日本円の通貨形式にフォーマットします。
 * @param price - 価格（数値）
 * @returns - フォーマットされた価格文字列 (例: "¥1,200")
 */
export function formatPrice(price: number): string {
  // price が null や undefined の場合、または数値でない場合はデフォルトの文字列を返す
  if (price == null || isNaN(price)) {
    return '価格未定';
  }

  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(price);
}
