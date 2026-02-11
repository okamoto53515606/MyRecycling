/**
 * 注文管理サーバーアクション（管理画面）
 * 
 * 承認、売上確定、キャンセル、返金処理
 */
'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { checkAdminAccess } from '@/lib/admin-auth';
import { logger } from '@/lib/env';
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';
import Stripe from 'stripe';

/**
 * 注文を承認する（authorized → approved）
 */
export async function approveOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const access = await checkAdminAccess();
    if (!access.isAllowed) {
      return { success: false, error: access.error };
    }

    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return { success: false, error: '注文が見つかりません' };
    }

    const orderData = orderDoc.data();
    if (orderData?.orderStatus !== 'authorized') {
      return { success: false, error: 'この注文は承認できません（ステータス: ' + orderData?.orderStatus + '）' };
    }

    await orderRef.update({
      orderStatus: 'approved',
      approvedAt: FieldValue.serverTimestamp(),
    });

    logger.info(`[Admin] Order ${orderId} approved`);
    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${orderId}`);

    return { success: true };
  } catch (error) {
    logger.error('[Admin] approveOrder failed:', error);
    return { success: false, error: '承認処理中にエラーが発生しました' };
  }
}

/**
 * 売上を確定する（approved → delivered）
 * Stripe PaymentIntentをキャプチャ
 */
export async function capturePayment(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const access = await checkAdminAccess();
    if (!access.isAllowed) {
      return { success: false, error: access.error };
    }

    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return { success: false, error: '注文が見つかりません' };
    }

    const orderData = orderDoc.data();
    if (orderData?.orderStatus !== 'approved') {
      return { success: false, error: 'この注文は売上確定できません（ステータス: ' + orderData?.orderStatus + '）' };
    }

    const paymentIntentId = orderData.stripePaymentIntentId;
    if (!paymentIntentId) {
      return { success: false, error: 'PaymentIntent IDが見つかりません' };
    }

    // Stripe PaymentIntentをキャプチャ
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    await stripe.paymentIntents.capture(paymentIntentId);
    logger.info(`[Admin] PaymentIntent ${paymentIntentId} captured`);

    // 注文ステータスを更新
    await orderRef.update({
      orderStatus: 'delivered',
      handedOverAt: FieldValue.serverTimestamp(),
    });

    logger.info(`[Admin] Order ${orderId} delivered`);
    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${orderId}`);

    return { success: true };
  } catch (error) {
    logger.error('[Admin] capturePayment failed:', error);
    const errorMessage = error instanceof Error ? error.message : '売上確定処理中にエラーが発生しました';
    return { success: false, error: errorMessage };
  }
}

/**
 * 注文をキャンセルする（管理者による）
 * Stripe PaymentIntentをキャンセル
 */
export async function cancelOrderByAdmin(orderId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  try {
    const access = await checkAdminAccess();
    if (!access.isAllowed) {
      return { success: false, error: access.error };
    }

    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return { success: false, error: '注文が見つかりません' };
    }

    const orderData = orderDoc.data();
    if (!orderData) {
      return { success: false, error: '注文データが取得できません' };
    }
    const currentStatus = orderData.orderStatus;
    if (currentStatus !== 'authorized' && currentStatus !== 'approved') {
      return { success: false, error: 'この注文はキャンセルできません（ステータス: ' + currentStatus + '）' };
    }

    const paymentIntentId = orderData.stripePaymentIntentId;
    if (paymentIntentId) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      await stripe.paymentIntents.cancel(paymentIntentId);
      logger.info(`[Admin] PaymentIntent ${paymentIntentId} canceled`);
    }

    await orderRef.update({
      orderStatus: 'canceled',
      cancellationReason: reason || '管理者によるキャンセル',
      canceledAt: FieldValue.serverTimestamp(),
    });

    logger.info(`[Admin] Order ${orderId} canceled by admin`);
    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${orderId}`);

    return { success: true };
  } catch (error) {
    logger.error('[Admin] cancelOrderByAdmin failed:', error);
    return { success: false, error: 'キャンセル処理中にエラーが発生しました' };
  }
}

/**
 * 返金処理を行う（delivered/refund_requested → refunded）
 * Stripeで全額返金
 */
export async function processRefund(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const access = await checkAdminAccess();
    if (!access.isAllowed) {
      return { success: false, error: access.error };
    }

    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return { success: false, error: '注文が見つかりません' };
    }

    const orderData = orderDoc.data();
    if (!orderData) {
      return { success: false, error: '注文データが取得できません' };
    }
    const currentStatus = orderData.orderStatus;
    if (currentStatus !== 'delivered' && currentStatus !== 'refund_requested') {
      return { success: false, error: 'この注文は返金できません（ステータス: ' + currentStatus + '）' };
    }

    const paymentIntentId = orderData.stripePaymentIntentId;
    if (!paymentIntentId) {
      return { success: false, error: 'PaymentIntent IDが見つかりません' };
    }

    // Stripeで返金
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    await stripe.refunds.create({
      payment_intent: paymentIntentId,
    });
    logger.info(`[Admin] PaymentIntent ${paymentIntentId} refunded`);

    await orderRef.update({
      orderStatus: 'refunded',
      returnedAt: FieldValue.serverTimestamp(),
    });

    logger.info(`[Admin] Order ${orderId} refunded`);
    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${orderId}`);

    return { success: true };
  } catch (error) {
    logger.error('[Admin] processRefund failed:', error);
    const errorMessage = error instanceof Error ? error.message : '返金処理中にエラーが発生しました';
    return { success: false, error: errorMessage };
  }
}
