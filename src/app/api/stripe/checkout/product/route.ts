/**
 * 商品注文用 Stripe Checkout セッション作成 API
 * 
 * 有料記事購読とは異なり、以下の点が特徴:
 * - 即時決済ではなく与信枠の確保（オーソリ）のみ
 * - 商品情報、受け渡し場所・日時をmetadataに含める
 * - Webhookでordersコレクションに登録
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getClientIp, logger } from '@/lib/env';
import { isSoldOut } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productId,
      productTitle,
      productPrice,
      userId,
      userEmail,
      userDisplayName,
      meetingLocationId,
      meetingLocationName,
      meetingLocationPhotoURL,
      meetingLocationDescription,
      meetingLocationGoogleMapEmbedURL,
      meetingDate,
      meetingTime,
      commentFromBuyer,
    } = body;

    // バリデーション
    if (!productId || !userId || !meetingLocationId || !meetingDate || !meetingTime) {
      return NextResponse.json(
        { error: '必須パラメータが不足しています' },
        { status: 400 }
      );
    }

    // 売り切れチェック（2重注文防止）
    const soldOut = await isSoldOut(productId);
    if (soldOut) {
      return NextResponse.json(
        { error: 'この商品は売り切れです' },
        { status: 400 }
      );
    }

    // 成功・キャンセル時の戻りURL
    const origin = request.headers.get('origin') || 'http://localhost:9002';
    const successUrl = `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=order`;
    const cancelUrl = `${origin}/payment/cancel?type=order`;

    // IPアドレスを取得
    const clientIp = await getClientIp();

    // 受け渡し日時を結合
    const meetingDateTime = `${meetingDate} ${meetingTime}`;

    // Stripe Checkout セッション作成（オーソリのみ）
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],

      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: productTitle,
            },
            unit_amount: productPrice,
          },
          quantity: 1,
        },
      ],

      // 決済モード: 都度課金
      mode: 'payment',

      // 【重要】オーソリのみ（即時決済しない）
      payment_intent_data: {
        capture_method: 'manual',
      },

      success_url: successUrl,
      cancel_url: cancelUrl,

      client_reference_id: userId,
      customer_email: userEmail,

      // Webhookで使用するメタデータ
      metadata: {
        type: 'product_order', // 有料記事購読と区別するため
        productId,
        productTitle,
        productPrice: String(productPrice),
        userId,
        userEmail: userEmail || '',
        userDisplayName: userDisplayName || '',
        meetingLocationId,
        meetingLocationName,
        meetingLocationPhotoURL: meetingLocationPhotoURL || '',
        meetingLocationDescription: meetingLocationDescription || '',
        meetingLocationGoogleMapEmbedURL: meetingLocationGoogleMapEmbedURL || '',
        meetingDate,
        meetingTime,
        meetingDateTime,
        commentFromBuyer: commentFromBuyer || '',
        clientIp,
      },

      // 日本語ロケール
      locale: 'ja',
    });

    logger.info(`[Stripe] Product checkout session created: ${session.id}`);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    logger.error('[Stripe] Product checkout session creation failed:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
