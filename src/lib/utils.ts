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

/**
 * Date オブジェクトまたは日付文字列を日本の日付形式 (YYYY/MM/DD) にフォーマットします。
 * @param date - Dateオブジェクトまたは日付文字列
 * @returns フォーマットされた日付文字列
 */
export function formatDate(date: Date | string): string {
  if (!date) return '';
  try {
    const dateObj = new Date(date);
    // getTime() を使って有効な日付かチェック
    if (isNaN(dateObj.getTime())) {
      return '無効な日付';
    }
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  } catch (e) {
    return '日付の解析エラー';
  }
}
