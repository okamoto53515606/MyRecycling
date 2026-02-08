/**
 * 新規商品作成ページのサーバーアクション
 */
'use server';

import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase-admin';
import { getUser } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '@/lib/env';
import { revalidatePath } from 'next/cache';

// zodスキーマによるバリデーションから stock を削除
const CreateProductSchema = z.object({
  title: z.string().min(1, '商品名は必須です。'), // name を title に変更
  content: z.string().optional(),
  excerpt: z.string().optional(),
  price: z.coerce.number().min(0, '価格は0以上である必要があります。'),
  condition: z.string().optional(),
  referenceURL: z.string().url('有効なURLを入力してください。').optional().or(z.literal('')),
  tags: z.string().optional(),
  imageUrls: z.string().optional(), 
});

export interface FormState {
  status: 'idle' | 'success' | 'error';
  message: string;
}

interface ImageAsset {
  url: string;
}

/**
 * 商品を作成するサーバーアクション
 */
export async function handleCreateProduct(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await getUser();
  if (user.role !== 'admin') {
    return { status: 'error', message: '管理者権限がありません。' };
  }

  // バリデーション
  const validatedFields = CreateProductSchema.safeParse({
    title: formData.get('title'),
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

    // Firestoreに商品データを保存
    const db = getAdminDb();
    const newProductData = {
      ...restOfData,
      tags: tagsArray,
      imageAssets,
      status: 'draft', // 初期ステータス
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const newProductRef = await db.collection('products').add(newProductData);
    logger.info(`[DB] 新規商品を作成しました: ${newProductRef.id}`);

  } catch (error) {
    logger.error('[Action Error] 商品の作成に失敗しました:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なサーバーエラーです。';
    return { status: 'error', message: `サーバーエラー: ${errorMessage}` };
  }

  revalidatePath('/admin/products');
  return {
    status: 'success',
    message: '商品が正常に作成されました。',
  };
}
