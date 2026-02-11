import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createProductOrder } from '@/lib/order-admin';
import { isSoldOut } from '@/lib/data';
import { logger } from '@/lib/env';
import { sendOrderMail } from '@/lib/mail';
import Stripe from 'stripe';

/**
 * Stripe Webhook 受信 API
 * 
 * 商品注文のオーソリ完了時にordersコレクションに注文データを作成する。
 * オーソリのみなので payment_status は 'unpaid' または 'requires_capture' になる。
 */
export async function POST(request: NextRequest) {
  try {
    // 生のリクエストボディを取得（署名検証に必要）
    const body = await request.text();
    
    // Stripe からの署名ヘッダー
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      logger.error('Webhook: Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // 署名検証
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      logger.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // イベントタイプに応じた処理
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleProductOrderCompleted(session);
        break;
      }
      
      default:
        logger.debug(`Webhook: Unhandled event type: ${event.type}`);
    }

    // Stripe に成功を返す（必須）
    return NextResponse.json({ received: true });

  } catch (error) {
    logger.error('Webhook processing failed:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * 商品注文のCheckout完了ハンドラ
 * 
 * オーソリ完了時に呼ばれる。ordersコレクションに注文データを作成する。
 * レースコンディション対策として、売り切れチェックを行う。
 */
async function handleProductOrderCompleted(session: Stripe.Checkout.Session) {
  logger.info('=== Product Order Checkout Completed ===');
  logger.info('Session ID:', session.id);
  logger.info('Payment Intent:', session.payment_intent);

  const metadata = session.metadata;
  
  if (!metadata) {
    logger.error('No metadata found in session');
    return;
  }

  const productId = metadata.productId;
  const userId = metadata.userId;

  if (!productId || !userId) {
    logger.error('Missing productId or userId in metadata');
    return;
  }

  // レースコンディション対策: 売り切れチェック
  const soldOut = await isSoldOut(productId);
  if (soldOut) {
    logger.warn(`Product ${productId} is already sold out. Cancelling payment intent.`);
    
    // オーソリをキャンセル
    const paymentIntentId = typeof session.payment_intent === 'string' 
      ? session.payment_intent 
      : session.payment_intent?.id;
    
    if (paymentIntentId) {
      try {
        await stripe.paymentIntents.cancel(paymentIntentId);
        logger.info(`Payment intent ${paymentIntentId} cancelled due to sold out`);
      } catch (err) {
        logger.error('Failed to cancel payment intent:', err);
      }
    }
    return;
  }

  // ordersコレクションに注文データを作成
  try {
    const orderId = await createProductOrder({
      productId,
      productName: metadata.productTitle || '',
      price: parseInt(metadata.productPrice || '0', 10),
      currency: 'jpy',
      buyerUid: userId,
      buyerEmail: metadata.userEmail || '',
      buyerDisplayName: metadata.userDisplayName || '',
      commentFromBuyer: metadata.commentFromBuyer || '',
      meetingLocationName: metadata.meetingLocationName || '',
      meetingLocationPhotoURL: metadata.meetingLocationPhotoURL || '',
      meetingLocationDescription: metadata.meetingLocationDescription || '',
      meetingLocationGoogleMapEmbedURL: metadata.meetingLocationGoogleMapEmbedURL || '',
      meetingDatetime: metadata.meetingDateTime || '',
      stripeSessionId: session.id,
      stripePaymentIntentId: typeof session.payment_intent === 'string' 
        ? session.payment_intent 
        : session.payment_intent?.id || '',
      ipAddress: metadata.clientIp || '',
    });

    logger.info(`Order created with ID: ${orderId}`);

    // 注文確定待ちメールを送信
    await sendOrderMail('authorized_mail', {
      id: orderId,
      productId,
      productName: metadata.productTitle || '',
      price: parseInt(metadata.productPrice || '0', 10),
      currency: 'jpy',
      buyerEmail: metadata.userEmail || '',
      buyerDisplayName: metadata.userDisplayName || '',
      meetingLocationName: metadata.meetingLocationName || '',
      meetingDatetime: metadata.meetingDateTime || '',
    });

  } catch (error) {
    logger.error('Failed to create order:', error);
    throw error;
  }
}
