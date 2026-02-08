/**
 * 商品一覧ページのサーバーアクション
 * 
 * @description
 * 商品の削除処理などを行います。
 */
'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth';

/**
 * 商品を削除するサーバーアクション
 * @param formData - フォームデータ（productIdを含む）
 */
export async function handleDeleteProduct(formData: FormData) {
  const user = await getUser();
  if (user.role !== 'admin') {
    throw new Error('管理者権限がありません。');
  }

  const productId = formData.get('productId') as string;
  if (!productId) {
    throw new Error('商品IDが指定されていません。');
  }

  try {
    const db = getAdminDb();
    await db.collection('products').doc(productId).delete();

    console.log(`[Admin] 商品を削除しました: ${productId}`);

    // 商品一覧ページのキャッシュをクリアして再生成
    revalidatePath('/admin/products');
  } catch (error) {
    console.error(`[Admin] 商品の削除に失敗 (ID: ${productId}):`, error);
    throw new Error('商品の削除中にサーバーエラーが発生しました。');
  }
}
