/**
 * 商品編集ページのサーバーアクション
 */
'use server';

import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase-admin';
import { getUser } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '@/lib/env';
import { revalidatePath } from 'next/cache';

// zodスキーマによるバリデーション（更新用）
const UpdateProductSchema = z.object({
  title: z.string().min(1, '商品名は必須です。'),
  status: z.enum(['published', 'draft']), // ★修正：statusを追加
  content: z.string().optional(),
  excerpt: z.string().optional(),
  price: z.coerce.number().min(0, '価格は0以上である必要があります。'),
  condition: z.string().optional(),
  referenceURL: z.string().url('有効なURLを入力してください。').optional().or(z.literal('')),
  tags: z.string().optional(),
  imageUrls: z.string().optional(), // JSON形式の文字列として受け取る
});

// フォームの状態
export interface FormState {
  status: 'idle' | 'success' | 'error';
  message: string;
}

interface ImageAsset {
  url: string;
}

/**
 * 商品を更新するサーバーアクション
 * @param productId 更新対象の商品ID
 */
export async function handleUpdateProduct(
  productId: string,
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await getUser();
  if (user.role !== 'admin') {
    return { status: 'error', message: '管理者権限がありません。' };
  }
  
  if (!productId) {
    return { status: 'error', message: '商品IDが指定されていません。' };
  }

  // 1. フォームデータのバリデーション
  const validatedFields = UpdateProductSchema.safeParse({
    title: formData.get('title'),
    status: formData.get('status'), // ★修正：statusを追加
    content: formData.get('content'),
    excerpt: formData.get('excerpt'),
    price: formData.get('price'),
    condition: formData.get('condition'),
    referenceURL: formData.get('referenceURL'),
    tags: formData.get('tags'),
    imageUrls: formData.get('imageUrls'),
  });

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.issues.map(issue => issue.message).join('\n');
    return { status: 'error', message: `入力エラー: ${errorMessages}` };
  }

  try {
    const { tags, imageUrls, ...restOfData } = validatedFields.data;

    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    let imageAssets: ImageAsset[] = [];
    if (imageUrls) {
      try {
        const parsedUrls: string[] = JSON.parse(imageUrls);
        if (Array.isArray(parsedUrls)) {
          imageAssets = parsedUrls.map(url => ({ url }));
        }
      } catch (e) {
        logger.warn('[Action] 画像URLのJSONパースに失敗しました。', imageUrls);
      }
    }

    // Firestoreのデータを更新
    const db = getAdminDb();
    const productRef = db.collection('products').doc(productId);

    await productRef.update({
      ...restOfData, // statusがここに含まれるようになった
      tags: tagsArray,
      imageAssets, // 更新されたアセット配列
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info(`[DB] 商品を更新しました: ${productId}`);

  } catch (error) {
    logger.error(`[Action Error] 商品(${productId})の更新に失敗しました:`, error);
    const errorMessage = error instanceof Error ? error.message : '不明なサーバーエラーです。';
    return { status: 'error', message: `サーバーエラー: ${errorMessage}` };
  }

  // キャッシュを再検証
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/edit/${productId}`);
  revalidatePath(`/products/${productId}`); // 公開ページも再検証

  return {
    status: 'success',
    message: '商品が正常に更新されました。',
  };
}
