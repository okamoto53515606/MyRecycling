/**
 * メールテンプレート管理ページのサーバーアクション
 */
'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { checkAdminAccess } from '@/lib/admin-auth';
import { logger } from '@/lib/env';
import { MAIL_TEMPLATE_LABELS, type MailTemplate, type MailTemplateFormState } from './types';

// バリデーションスキーマ
const MailTemplateSchema = z.object({
  id: z.string().min(1, 'テンプレートIDは必須です'),
  subject: z.string().min(1, '件名は必須です'),
  body: z.string().min(1, '本文は必須です'),
  ccEmail: z.string().email('有効なメールアドレスを入力してください').or(z.literal('')),
});

/**
 * すべてのメールテンプレートを取得
 */
export async function getMailTemplates(): Promise<MailTemplate[]> {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('mail_templates').get();
    
    const templates: MailTemplate[] = [];
    snapshot.forEach((doc) => {
      templates.push({
        id: doc.id,
        subject: doc.data().subject || '',
        body: doc.data().body || '',
        ccEmail: doc.data().ccEmail || '',
      });
    });

    // 定義された順序でソート
    const order = Object.keys(MAIL_TEMPLATE_LABELS);
    templates.sort((a, b) => {
      const aIndex = order.indexOf(a.id);
      const bIndex = order.indexOf(b.id);
      return aIndex - bIndex;
    });

    return templates;
  } catch (error) {
    logger.error('[Admin] メールテンプレートの取得に失敗:', error);
    return [];
  }
}

/**
 * メールテンプレートを更新するサーバーアクション
 */
export async function updateMailTemplateAction(
  prevState: MailTemplateFormState,
  formData: FormData
): Promise<MailTemplateFormState> {
  // 管理者権限チェック
  const access = await checkAdminAccess();
  if (!access.isAllowed) {
    return { status: 'error', message: access.error || '管理者権限がありません。' };
  }

  const validatedFields = MailTemplateSchema.safeParse({
    id: formData.get('id'),
    subject: formData.get('subject'),
    body: formData.get('body'),
    ccEmail: formData.get('ccEmail') || '',
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
    const { id, ...data } = validatedFields.data;
    const templateRef = db.collection('mail_templates').doc(id);

    await templateRef.set(data, { merge: true });

    revalidatePath('/admin/mail-templates');

    logger.info(`[Admin] メールテンプレート(${id})を更新しました。`);

    return {
      status: 'success',
      message: '保存しました。',
    };

  } catch (error) {
    logger.error('[Admin] メールテンプレートの更新に失敗:', error);
    return {
      status: 'error',
      message: 'サーバーエラーが発生しました。',
    };
  }
}
