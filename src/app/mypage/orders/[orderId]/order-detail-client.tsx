/**
 * 注文詳細クライアントコンポーネント
 * 
 * 注文の詳細情報表示とアクション（キャンセル、返品依頼）を担当
 */
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, X, Loader } from 'lucide-react';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/types';
import { cancelOrder, requestRefund } from './actions';

// サーバーから渡される注文データ（日付はISO文字列）
interface OrderData {
  id: string;
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
  orderStatus: OrderStatus;
  stripePaymentIntentId: string;
  ipAddress: string;
  orderedAt: string;
  approvedAt?: string;
  cancellationReason?: string;
  canceledAt?: string;
  handedOverAt?: string;
  refundRequestReason?: string;
  refundMeetingDatetime?: string;
  refundMeetingLocationName?: string;
  refundMeetingLocationPhotoURL?: string;
  refundMeetingLocationDescription?: string;
  refundMeetingLocationGoogleMapEmbedURL?: string;
  returnedAt?: string;
}

interface OrderDetailClientProps {
  order: OrderData;
  meetingLocationDescriptionHtml: string;
  receiptUrl?: string;
  refundReceiptUrl?: string;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateWithWeekday(isoString: string): string {
  const date = new Date(isoString);
  const weekdays = ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜'];
  const weekday = weekdays[date.getDay()];
  const formatted = date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${formatted}（${weekday}）`;
}

function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`;
}

// ステータスに応じたボタン状態
function getButtonStates(status: OrderStatus): { canCancel: boolean; canRefund: boolean } {
  switch (status) {
    case 'authorized':
    case 'approved':
      return { canCancel: true, canRefund: false };
    case 'delivered':
      return { canCancel: false, canRefund: true };
    case 'canceled':
    case 'refund_requested':
    case 'refunded':
    default:
      return { canCancel: false, canRefund: false };
  }
}

// ステータスに応じた注意メッセージ
function getStatusNotice(status: OrderStatus): string | null {
  switch (status) {
    case 'authorized':
      return '現在、注文内容を確認中です。確認が完了次第、メールでお知らせいたします。';
    case 'refund_requested':
      return '返品依頼を受け付けました。確認が完了次第、メールでお知らせいたします。';
    default:
      return null;
  }
}

export function OrderDetailClient({ order, meetingLocationDescriptionHtml, receiptUrl, refundReceiptUrl }: OrderDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const buttonStates = getButtonStates(order.orderStatus);
  const statusNotice = getStatusNotice(order.orderStatus);

  const handleCancel = () => {
    setError(null);
    startTransition(async () => {
      const result = await cancelOrder(order.id, cancelReason);
      if (result.success) {
        setIsCancelModalOpen(false);
        router.refresh();
      } else {
        setError(result.error || 'エラーが発生しました');
      }
    });
  };

  const handleRefund = () => {
    setError(null);
    if (!refundReason.trim()) {
      setError('返品理由を入力してください');
      return;
    }
    startTransition(async () => {
      const result = await requestRefund(order.id, refundReason);
      if (result.success) {
        setIsRefundModalOpen(false);
        router.refresh();
      } else {
        setError(result.error || 'エラーが発生しました');
      }
    });
  };

  return (
    <div className="order-detail">
      <div className="order-detail__header">
        <Link href="/mypage" className="order-detail__back">
          <ArrowLeft size={20} />
          注文履歴に戻る
        </Link>
        <h1>注文詳細</h1>
      </div>

      {/* ステータス */}
      <div className="order-detail__status-section">
        <span className={`order-detail__status order-detail__status--${order.orderStatus}`}>
          {ORDER_STATUS_LABELS[order.orderStatus]}
        </span>
        {statusNotice && (
          <div className="order-detail__notice">
            {statusNotice}
          </div>
        )}
      </div>

      {/* 注文情報 */}
      <section className="order-detail__section">
        <dl className="order-detail__list">
          <dt>注文日時</dt>
          <dd>{formatDate(order.orderedAt)}</dd>
          
          <dt>商品名</dt>
          <dd>
            <Link href={`/products/${order.productId}`} className="order-detail__product-link">
              {order.productName}
            </Link>
          </dd>
          
          <dt>金額</dt>
          <dd>{formatPrice(order.price)}</dd>
        </dl>
      </section>

      {/* 受け渡し情報 */}
      <section className="order-detail__section">
        <dl className="order-detail__list">
          <dt>受け渡し日時</dt>
          <dd>{formatDateWithWeekday(order.meetingDatetime)}</dd>
          
          <dt>受け渡し場所</dt>
          <dd>
            {order.meetingLocationName}
            <button
              type="button"
              className="order-detail__location-link"
              onClick={() => setIsLocationModalOpen(true)}
            >
              <MapPin size={16} />
              詳細を見る
            </button>
          </dd>
        </dl>
      </section>

      {/* 購入者コメント */}
      {order.commentFromBuyer && (
        <section className="order-detail__section">
          <h2>コメント</h2>
          <p className="order-detail__comment">{order.commentFromBuyer}</p>
        </section>
      )}

      {/* キャンセル情報（キャンセル済みの場合） */}
      {order.orderStatus === 'canceled' && order.canceledAt && (
        <section className="order-detail__section order-detail__section--canceled">
          <h2>キャンセル情報</h2>
          <dl className="order-detail__list">
            <dt>キャンセル日時</dt>
            <dd>{formatDate(order.canceledAt)}</dd>
            {order.cancellationReason && (
              <>
                <dt>キャンセル理由</dt>
                <dd>{order.cancellationReason}</dd>
              </>
            )}
          </dl>
        </section>
      )}

      {/* 受け渡し完了情報 */}
      {order.handedOverAt && (
        <section className="order-detail__section">
          <h2>受け渡し完了</h2>
          <dl className="order-detail__list">
            <dt>受け渡し日時</dt>
            <dd>{formatDate(order.handedOverAt)}</dd>
            {receiptUrl && (
              <>
                <dt>領収書</dt>
                <dd>
                  <a 
                    href={receiptUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="order-detail__receipt-link"
                  >
                    領収書を表示
                  </a>
                </dd>
              </>
            )}
          </dl>
        </section>
      )}

      {/* 返品情報 */}
      {(order.orderStatus === 'refund_requested' || order.orderStatus === 'refunded') && (
        <section className="order-detail__section order-detail__section--refund">
          <h2>返品情報</h2>
          <dl className="order-detail__list">
            {order.refundRequestReason && (
              <>
                <dt>返品理由</dt>
                <dd>{order.refundRequestReason}</dd>
              </>
            )}
            {order.refundMeetingDatetime && (
              <>
                <dt>返品受け渡し日時</dt>
                <dd>{formatDate(order.refundMeetingDatetime)}</dd>
              </>
            )}
            {order.refundMeetingLocationName && (
              <>
                <dt>返品受け渡し場所</dt>
                <dd>{order.refundMeetingLocationName}</dd>
              </>
            )}
            {order.returnedAt && (
              <>
                <dt>返品完了日時</dt>
                <dd>{formatDate(order.returnedAt)}</dd>
              </>
            )}
            {refundReceiptUrl && (
              <>
                <dt>返金明細</dt>
                <dd>
                  <a 
                    href={refundReceiptUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="order-detail__receipt-link"
                  >
                    返金明細を表示
                  </a>
                </dd>
              </>
            )}
          </dl>
        </section>
      )}

      {/* アクションボタン */}
      <div className="order-detail__actions">
        {/* キャンセル */}
        <div className={`order-detail__action-box ${!buttonStates.canCancel ? 'order-detail__action-box--disabled' : ''}`}>
          <button
            type="button"
            className="btn btn--danger btn--full"
            disabled={!buttonStates.canCancel}
            onClick={() => setIsCancelModalOpen(true)}
          >
            注文をキャンセル
          </button>
          <p className="order-detail__action-note">
            キャンセルすると注文が取り消され、クレジットカードの与信枚確保（オーソリ）も自動的に取り消されます。請求は発生しません。
          </p>
        </div>

        {/* 返品依頼 */}
        <div className={`order-detail__action-box ${!buttonStates.canRefund ? 'order-detail__action-box--disabled' : ''}`}>
          <button
            type="button"
            className="btn btn--secondary btn--full"
            disabled={!buttonStates.canRefund}
            onClick={() => setIsRefundModalOpen(true)}
          >
            返品を依頼
          </button>
          <p className="order-detail__action-note">
            返品の受け渡し日時は確定ではありません。依頼後、運営者よりメールで調整のご連絡をいたします。
          </p>
        </div>
      </div>

      {/* 受け渡し場所モーダル */}
      {isLocationModalOpen && (
        <div className="modal-overlay" onClick={() => setIsLocationModalOpen(false)}>
          <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{order.meetingLocationName}</h2>
              <button
                type="button"
                className="modal__close"
                onClick={() => setIsLocationModalOpen(false)}
                aria-label="閉じる"
              >
                <X size={24} />
              </button>
            </div>
            <div className="modal__body">
              {/* Google Map */}
              {order.meetingLocationGoogleMapEmbedURL && (
                <div 
                  className="meeting-location-detail__map"
                  dangerouslySetInnerHTML={{ __html: order.meetingLocationGoogleMapEmbedURL }}
                />
              )}

              {/* 写真と説明 */}
              <div className="meeting-location-detail__content">
                {order.meetingLocationPhotoURL && (
                  <a
                    href={order.meetingLocationPhotoURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="meeting-location-detail__photo-link"
                  >
                    <img
                      src={order.meetingLocationPhotoURL}
                      alt={`${order.meetingLocationName}の写真`}
                      className="meeting-location-detail__photo"
                    />
                  </a>
                )}
                {meetingLocationDescriptionHtml && (
                  <div 
                    className="meeting-location-detail__description"
                    dangerouslySetInnerHTML={{ __html: meetingLocationDescriptionHtml }}
                  />
                )}
              </div>
            </div>
            <div className="modal__footer">
              <button
                type="button"
                className="btn"
                onClick={() => setIsLocationModalOpen(false)}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* キャンセルモーダル */}
      {isCancelModalOpen && (
        <div className="modal-overlay" onClick={() => !isPending && setIsCancelModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>注文をキャンセル</h2>
              <button
                type="button"
                className="modal__close"
                onClick={() => !isPending && setIsCancelModalOpen(false)}
                aria-label="閉じる"
                disabled={isPending}
              >
                <X size={24} />
              </button>
            </div>
            <div className="modal__body">
              <p>この注文をキャンセルしますか？</p>
              <p className="order-detail__modal-note">キャンセル後は元に戻せません。</p>
              <label className="order-detail__modal-label">
                キャンセル理由（任意）
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="キャンセル理由を入力してください"
                  className="order-detail__modal-textarea"
                  disabled={isPending}
                />
              </label>
              {error && <p className="order-detail__modal-error">{error}</p>}
            </div>
            <div className="modal__footer">
              <button
                type="button"
                className="btn"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isPending}
              >
                戻る
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={handleCancel}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader size={16} className="loading-spinner" />
                    処理中...
                  </>
                ) : (
                  'キャンセルする'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 返品依頼モーダル */}
      {isRefundModalOpen && (
        <div className="modal-overlay" onClick={() => !isPending && setIsRefundModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>返品を依頼</h2>
              <button
                type="button"
                className="modal__close"
                onClick={() => !isPending && setIsRefundModalOpen(false)}
                aria-label="閉じる"
                disabled={isPending}
              >
                <X size={24} />
              </button>
            </div>
            <div className="modal__body">
              <p>この注文の返品を依頼しますか？</p>
              <label className="order-detail__modal-label">
                返品理由（必須）
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="返品理由を入力してください"
                  className="order-detail__modal-textarea"
                  required
                  disabled={isPending}
                />
              </label>
              {error && <p className="order-detail__modal-error">{error}</p>}
            </div>
            <div className="modal__footer">
              <button
                type="button"
                className="btn"
                onClick={() => setIsRefundModalOpen(false)}
                disabled={isPending}
              >
                戻る
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleRefund}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader size={16} className="loading-spinner" />
                    処理中...
                  </>
                ) : (
                  '返品を依頼する'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
