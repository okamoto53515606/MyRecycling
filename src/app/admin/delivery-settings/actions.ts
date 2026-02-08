/**
 * 受け渡し日時設定サーバーアクション
 */
'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getUser } from '@/lib/auth';
import { logger } from '@/lib/env';
import { FieldValue } from 'firebase-admin/firestore';

// フォームの状態
export interface FormState {
  status: 'idle' | 'success' | 'error';
  message: string;
}

// バリデーションスキーマ
const FormSchema = z.object({
  available_weekdays: z.array(z.string()),
  available_times: z.string().optional(),
  unavailable_dates: z.string().optional(),
});

export async function updateDeliverySettingsAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await getUser();
  if (user.role !== 'admin') {
    return { status: 'error', message: '管理者権限がありません。' };
  }

  const validatedFields = FormSchema.safeParse({
    available_weekdays: formData.getAll('available_weekdays'),
    available_times: formData.get('available_times'),
    unavailable_dates: formData.get('unavailable_dates'),
  });

  if (!validatedFields.success) {
    return { status: 'error', message: `入力エラー: ${validatedFields.error.format()}` };
  }

  const db = getAdminDb();
  const batch = db.batch();

  try {
    // 1. available_weekdays の更新
    const weekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const selectedWeekdays = new Set(validatedFields.data.available_weekdays);
    weekdays.forEach((day, index) => {
      const docRef = db.collection('available_weekdays').doc(day);
      batch.set(docRef, { isAvailable: selectedWeekdays.has(day), order: index });
    });

    // 2. available_times の更新
    const timesCollectionRef = db.collection('available_times');
    const existingTimesSnapshot = await timesCollectionRef.get();
    existingTimesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    const newTimes = validatedFields.data.available_times
      ?.split('\n')
      .map(t => t.trim())
      .filter(t => t.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/));
    
    if (newTimes) {
        newTimes.forEach(time => {
            const docRef = timesCollectionRef.doc(); // 自動ID
            batch.set(docRef, { time });
        });
    }

    // 3. unavailable_dates の更新
    const datesCollectionRef = db.collection('unavailable_dates');
    const existingDatesSnapshot = await datesCollectionRef.get();
    existingDatesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    const newDates = validatedFields.data.unavailable_dates
      ?.split('\n')
      .map(d => d.trim())
      .filter(d => d.match(/^\d{4}-\d{2}-\d{2}$/))
      .map(d => new Date(d));

    if (newDates) {
        newDates.forEach(date => {
            const docRef = datesCollectionRef.doc(); // 自動ID
            batch.set(docRef, { date });
        });
    }
    
    // バッチ処理の実行
    await batch.commit();

    logger.info('[Admin] 受け渡し日時設定を更新しました。');
    revalidatePath('/admin/delivery-settings');

    return { status: 'success', message: '受け渡し日時設定を更新しました。' };

  } catch (error) {
    logger.error('[Admin] 受け渡し日時設定の更新に失敗:', error);
    return { status: 'error', message: 'データベースの更新に失敗しました。' };
  }
}
