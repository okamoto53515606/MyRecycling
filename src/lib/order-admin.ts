/**
 * 商品注文関連のAdmin操作
 * 
 * Admin SDKを使用したFirestore操作を行う。
 * セキュリティルールをバイパスするため、サーバーサイドでのみ使用する。
 */

import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/env';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { isSoldOut } from '@/lib/data';

/**
 * "YYYY-MM-DD HH:mm" 形式の文字列をFirestore Timestampに変換
 */
function parseMeetingDatetime(datetimeStr: string): Timestamp {
  // "2026-02-15 14:00" -> Date -> Timestamp
  const [datePart, timePart] = datetimeStr.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  const date = new Date(year, month - 1, day, hour, minute);
  return Timestamp.fromDate(date);
}

/**
 * 注文作成パラメータ
 */
interface CreateOrderParams {
  productId: string;
  productName: string;
  price: number;
  currency: string;
  buyerUid: string;
  buyerEmail: string;
  buyerDisplayName: string;
  commentFromBuyer: string;
  meetingLocationName: string;
  meetingLocationPhotoURL: string;
  meetingLocationDescription: string;
  meetingLocationGoogleMapEmbedURL: string;
  meetingDatetime: string;
  stripeSessionId: string;
  stripePaymentIntentId: string;
  ipAddress: string;
}

/**
 * 商品注文をFirestoreに作成する
 * 
 * 2重登録防止のため、stripeSessionIdをドキュメントIDとして使用する。
 * 既に存在する場合は何もしない（冪等性）。
 * 
 * @returns 作成された注文のドキュメントID
 */
export async function createProductOrder(params: CreateOrderParams): Promise<string> {
  const db = getAdminDb();
  
  // stripeSessionIdをドキュメントIDとして使用（2重登録防止）
  const orderId = params.stripeSessionId;
  const orderRef = db.collection('orders').doc(orderId);

  // トランザクションで売り切れチェックと注文作成を行う
  const result = await db.runTransaction(async (transaction) => {
    // 既存注文のチェック
    const existingOrder = await transaction.get(orderRef);
    if (existingOrder.exists) {
      logger.warn(`Order ${orderId} already exists, skipping creation`);
      return { orderId, created: false };
    }

    // 商品の存在チェック
    const productRef = db.collection('products').doc(params.productId);
    const productDoc = await transaction.get(productRef);
    
    if (!productDoc.exists) {
      throw new Error(`Product ${params.productId} not found`);
    }

    // ordersコレクションで売り切れ確認
    if (await isSoldOut(params.productId)) {
      throw new Error(`Product ${params.productId} is already sold out`);
    }

    // 注文データを作成（database-schema.mdに従う）
    const orderData = {
      productId: params.productId,
      productName: params.productName,
      price: params.price,
      currency: params.currency,
      buyerUid: params.buyerUid,
      buyerEmail: params.buyerEmail,
      buyerDisplayName: params.buyerDisplayName,
      commentFromBuyer: params.commentFromBuyer,
      meetingLocationName: params.meetingLocationName,
      meetingLocationPhotoURL: params.meetingLocationPhotoURL,
      meetingLocationDescription: params.meetingLocationDescription,
      meetingLocationGoogleMapEmbedURL: params.meetingLocationGoogleMapEmbedURL,
      meetingDatetime: parseMeetingDatetime(params.meetingDatetime),
      orderStatus: 'authorized', // オーソリ済み状態
      stripePaymentIntentId: params.stripePaymentIntentId,
      ipAddress: params.ipAddress,
      orderedAt: FieldValue.serverTimestamp(),
    };

    transaction.set(orderRef, orderData);

    // 商品を売り切れにする
    transaction.update(productRef, {
      isSoldOut: true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info(`Order ${orderId} created and product ${params.productId} marked as sold out`);
    return { orderId, created: true };
  });

  return result.orderId;
}

/**
 * 注文ステータスを更新する
 */
export async function updateOrderStatus(
  orderId: string, 
  newStatus: 'authorized' | 'captured' | 'cancelled' | 'completed'
): Promise<void> {
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc(orderId);

  await orderRef.update({
    orderStatus: newStatus,
    updatedAt: FieldValue.serverTimestamp(),
  });

  logger.info(`Order ${orderId} status updated to ${newStatus}`);
}

/**
 * 注文を取得する
 */
export async function getOrder(orderId: string) {
  const db = getAdminDb();
  const orderDoc = await db.collection('orders').doc(orderId).get();
  
  if (!orderDoc.exists) {
    return null;
  }

  return {
    id: orderDoc.id,
    ...orderDoc.data(),
  };
}
