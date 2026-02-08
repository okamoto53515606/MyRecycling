/**
 * サイト設定ページのサーバーアクション
 */
'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { getUser } from '@/lib/auth';
import { logger } from '@/lib/env';

// バリデーションスキーマを新しい設計に更新
const SettingsSchema = z.object({
  siteName: z.string().min(1, 'サイト名は必須です'),
  siteDescription: z.string().optional(),
  guideContent: z.string().optional(),
  metaTitle: z.string().min(1, 'Meta Titleは必須です'),
  metaDescription: z.string().min(1, 'Meta Descriptionは必須です'),
  legalCommerceContent: z.string().optional(),
  privacyPolicyContent: z.string().optional(),
  termsOfServiceContent: z.string().optional(),
  copyright: z.string().optional(),
  gtmId: z.string().regex(/^(GTM-[A-Z0-9]+)?$/, 'GTM IDはGTM-で始まる形式で入力してください（例: GTM-XXXXXXX）').optional(),
});

// フォームの状態を表す型
export interface SettingsFormState {
  status: 'idle' | 'success' | 'error';
  message: string;
}

/**
 * サイト設定を更新するサーバーアクション
 */
export async function updateSettingsAction(
  prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  // 管理者権限チェック
  const user = await getUser();
  if (user.role !== 'admin') {
    return { status: 'error', message: '管理者権限がありません。' };
  }

  const validatedFields = SettingsSchema.safeParse({
    siteName: formData.get('siteName'),
    siteDescription: formData.get('siteDescription'),
    guideContent: formData.get('guideContent'),
    metaTitle: formData.get('metaTitle'),
    metaDescription: formData.get('metaDescription'),
    legalCommerceContent: formData.get('legalCommerceContent'),
    privacyPolicyContent: formData.get('privacyPolicyContent'),
    termsOfServiceContent: formData.get('termsOfServiceContent'),
    copyright: formData.get('copyright'),
    gtmId: formData.get('gtmId') || '',
  });

  // バリデーション失敗
  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.issues.map(issue => issue.message).join('\n');
    return {
      status: 'error',
      message: `入力エラー: ${errorMessages}`,
    };
  }
  
  try {
    const db = getAdminDb();
    const settingsRef = db.collection('settings').doc('site_config');
    
    // Firestoreドキュメントを更新
    await settingsRef.set({
      ...validatedFields.data,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    // 関連ページのキャッシュをクリア
    revalidatePath('/'); // トップページ (siteDescription)
    revalidatePath('/guide'); // ご利用ガイド
    revalidatePath('/legal/commerce');
    revalidatePath('/legal/privacy');
    revalidatePath('/legal/terms');
    revalidatePath('/admin/settings'); // 設定ページ自体も再検証

    logger.info('[Admin] サイト設定を更新しました。');

    return {
      status: 'success',
      message: '設定が正常に保存されました。',
    };

  } catch (error) {
    logger.error('[Admin] サイト設定の更新に失敗:', error);
    return {
      status: 'error',
      message: 'サーバーエラーが発生しました。設定の保存に失敗しました。',
    };
  }
}
