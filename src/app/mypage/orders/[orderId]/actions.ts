/**
 * 注文アクション
 * 
 * キャンセル・返品依頼のサーバーアクション
 */
'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { getUser } from '@/lib/auth';
import { logger } from '@/lib/env';
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * 注文をキャンセルする
 * 
 * authorized/approved状態の注文のみキャンセル可能
 * Stripe PaymentIntentをキャンセルする
 */
export async function cancelOrder(orderId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUser();
    if (!user || !user.isLoggedIn || !user.uid) {
      return { success: false, error: 'ログインが必要です' };
    }

    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return { success: false, error: '注文が見つかりません' };
    }

    const orderData = orderDoc.data();
    
    // 購入者本人のみキャンセル可能
    if (orderData?.buyerUid !== user.uid) {
      return { success: false, error: '注文をキャンセルする権限がありません' };
    }

    // ステータスチェック
    const currentStatus = orderData?.orderStatus;
    if (currentStatus !== 'authorized' && currentStatus !== 'approved') {
      return { success: false, error: 'この注文はキャンセルできません' };
    }

    // Stripe PaymentIntentをキャンセル
    const paymentIntentId = orderData?.stripePaymentIntentId;
    if (paymentIntentId) {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      await stripe.paymentIntents.cancel(paymentIntentId);
      logger.info(`PaymentIntent ${paymentIntentId} canceled`);
    }

    // 注文ステータスを更新
    await orderRef.update({
      orderStatus: 'canceled',
      cancellationReason: reason || '購入者によるキャンセル',
      canceledAt: FieldValue.serverTimestamp(),
    });

    logger.info(`Order ${orderId} canceled by user ${user.uid}`);

    revalidatePath('/mypage');
    revalidatePath(`/mypage/orders/${orderId}`);

    return { success: true };
  } catch (error) {
    logger.error('cancelOrder failed:', error);
    return { success: false, error: 'キャンセル処理に失敗しました' };
  }
}

/**
 * 返品を依頼する
 * 
 * delivered状態の注文のみ返品依頼可能
 */
export async function requestRefund(
  orderId: string, 
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUser();
    if (!user || !user.isLoggedIn || !user.uid) {
      return { success: false, error: 'ログインが必要です' };
    }

    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return { success: false, error: '注文が見つかりません' };
    }

    const orderData = orderDoc.data();
    
    // 購入者本人のみ返品依頼可能
    if (orderData?.buyerUid !== user.uid) {
      return { success: false, error: '返品を依頼する権限がありません' };
    }

    // ステータスチェック
    if (orderData?.orderStatus !== 'delivered') {
      return { success: false, error: 'この注文は返品依頼できません' };
    }

    if (!reason.trim()) {
      return { success: false, error: '返品理由を入力してください' };
    }

    // 注文ステータスを更新
    await orderRef.update({
      orderStatus: 'refund_requested',
      refundRequestReason: reason,
    });

    logger.info(`Order ${orderId} refund requested by user ${user.uid}`);

    revalidatePath('/mypage');
    revalidatePath(`/mypage/orders/${orderId}`);

    return { success: true };
  } catch (error) {
    logger.error('requestRefund failed:', error);
    return { success: false, error: '返品依頼に失敗しました' };
  }
}
