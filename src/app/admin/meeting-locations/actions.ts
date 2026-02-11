/**
 * 受け渡し場所サーバーアクション (作成・更新・削除)
 */
'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { checkAdminAccess } from '@/lib/admin-auth';
import { logger } from '@/lib/env';

// バリデーションスキーマ (共通)
const FormSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  description: z.string().optional(),
  // 変更: URLのバリデーションを緩める。空文字列も許容。
  photoURL: z.string().optional(), 
  googleMapEmbedURL: z.string().optional(),
  order: z.coerce.number(),
});

// フォームの状態 (共通)
export interface FormState {
  status: 'idle' | 'success' | 'error';
  message: string;
}

// --- 作成アクション ---
export async function createMeetingLocationAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const access = await checkAdminAccess();
  if (!access.isAllowed) {
    return { status: 'error', message: access.error || '管理者権限がありません。' };
  }

  const validatedFields = FormSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    photoURL: formData.get('photoURL'),
    googleMapEmbedURL: formData.get('googleMapEmbedURL'),
    order: formData.get('order'),
  });

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.issues.map(issue => issue.message).join('\n');
    return { status: 'error', message: `入力エラー: ${errorMessages}` };
  }

  let newLocationId = '';
  try {
    const db = getAdminDb();
    const docRef = await db.collection('meeting_locations').add({
      ...validatedFields.data,
    });
    newLocationId = docRef.id;

    logger.info(`[Admin] 受け渡し場所を新規作成しました: ${newLocationId}`);
    revalidatePath('/admin/meeting-locations');

  } catch (error) {
    logger.error('[Admin] 受け渡し場所の新規作成に失敗:', error);
    return { status: 'error', message: 'データベースの作成に失敗しました。' };
  }
  
  redirect(`/admin/meeting-locations/edit/${newLocationId}`);
}

// --- 更新アクション ---
export async function updateMeetingLocationAction(
  id: string,
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const access = await checkAdminAccess();
  if (!access.isAllowed) {
    return { status: 'error', message: access.error || '管理者権限がありません。' };
  }

  const validatedFields = FormSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    photoURL: formData.get('photoURL'),
    googleMapEmbedURL: formData.get('googleMapEmbedURL'),
    order: formData.get('order'),
  });

  if (!validatedFields.success) {
    return { status: 'error', message: `入力エラー: ${validatedFields.error.issues.map(i => i.message).join(', ')}` };
  }

  try {
    const db = getAdminDb();
    await db.collection('meeting_locations').doc(id).update(validatedFields.data);

    logger.info(`[Admin] 受け渡し場所を更新しました: ${id}`);
    revalidatePath('/admin/meeting-locations');
    revalidatePath(`/admin/meeting-locations/edit/${id}`);

    return { status: 'success', message: '受け渡し場所を更新しました。' };

  } catch (error) {
    logger.error(`[Admin] 受け渡し場所(${id})の更新に失敗:', error`);
    return { status: 'error', message: 'データベースの更新に失敗しました。' };
  }
}

// --- 削除アクション ---
export async function deleteMeetingLocationAction(id: string) {
  const access = await checkAdminAccess();
  if (!access.isAllowed) {
    throw new Error(access.error || '管理者権限が必要です');
  }

  try {
    const db = getAdminDb();
    await db.collection('meeting_locations').doc(id).delete();

    logger.info(`[Admin] 受け渡し場所を削除しました: ${id}`);
    revalidatePath('/admin/meeting-locations');

  } catch (error) {
    logger.error(`[Admin] 受け渡し場所(${id})の削除に失敗:', error`);
    throw new Error('データベースからの削除に失敗しました。');
  }

  redirect('/admin/meeting-locations');
}
