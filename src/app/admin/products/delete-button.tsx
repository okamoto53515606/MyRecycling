/**
 * 商品削除ボタン（クライアントコンポーネント）
 *
 * @description
 * 削除前に確認ダイアログを表示するインタラクティブなボタン。
 * サーバーアクションを呼び出して商品を削除します。
 */
'use client';

import { useFormStatus } from 'react-dom';
import { handleDeleteProduct } from './actions'; // handleDeleteArticleから変更
import { Loader2, Trash2 } from 'lucide-react';

/**
 * フォームの送信状態に応じて表示を切り替えるボタン
 */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="admin-btn admin-btn--danger"
      disabled={pending}
      onClick={(e) => {
        if (!confirm('この商品を本当に削除しますか？この操作は元に戻せません。')) {
          e.preventDefault();
        }
      }}
    >
      {pending ? (
        <Loader2 size={16} className="loading-spin" />
      ) : (
        <Trash2 size={16} />
      )}
    </button>
  );
}

export default function DeleteButton({ productId }: { productId: string }) {
  return (
    <form action={handleDeleteProduct} style={{ display: 'inline' }}>
      <input type="hidden" name="productId" value={productId} />
      <SubmitButton />
    </form>
  );
}
