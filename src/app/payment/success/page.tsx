'use client';

/**
 * 注文成功ページ
 * 
 * @description
 * Stripe Checkout 完了後にリダイレクトされるページ。
 * オーソリ（与信枠確保）完了であり、まだ決済確定ではない。
 * 
 * 注意: このページはあくまで「注文完了の通知」であり、
 * Firestoreへの注文データ作成は Webhook で行う。
 */

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

/**
 * 注文成功コンテンツ
 * useSearchParams を使用するため Suspense でラップが必要
 */
function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const productTitle = searchParams.get('product_title');
  const meetingLocation = searchParams.get('meeting_location');
  const meetingDateTime = searchParams.get('meeting_datetime');

  return (
    <div className="payment-result">
      <div className="payment-result__card">
        {/* 成功アイコン */}
        <div>
          <div className="payment-result__icon payment-result__icon--success">
            <CheckCircle size={48} />
          </div>
          <h1>注文内容を確認中です</h1>
          <p>ありがとうございます！ご注文を受け付けました。</p>
          <p>現在、注文内容を確認中です。</p>
        </div>

        {/* 注文情報 */}
        {(productTitle || meetingLocation || meetingDateTime) && (
          <div className="payment-result__info">
            <h2>注文内容</h2>
            {productTitle && <p><strong>商品:</strong> {productTitle}</p>}
            {meetingLocation && <p><strong>受け渡し場所:</strong> {meetingLocation}</p>}
            {meetingDateTime && <p><strong>受け渡し日時:</strong> {meetingDateTime}</p>}
          </div>
        )}

        {/* 注意事項 */}
        <div className="payment-result__notice">
          <h2>ご注意</h2>
          <ul>
            <li>この時点ではまだ決済は確定していません（与信枠の確保のみ）</li>
            <li>注文内容を確認後、メールにてご連絡いたします</li>
            <li>受け渡し完了後に決済が確定します</li>
          </ul>
        </div>

        {/* アクションボタン */}
        <div className="payment-result__actions">
          <Link href="/mypage" className="btn btn--primary btn--full">
            マイページへ
          </Link>
          <Link href="/" className="btn btn--full">
            トップページへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * 注文成功ページ（エクスポート）
 * useSearchParams を使用するコンテンツを Suspense でラップ
 */
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="loading">
        <Loader2 size={32} className="loading-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
