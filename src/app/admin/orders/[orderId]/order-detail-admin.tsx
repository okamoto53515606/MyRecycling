/**
 * 注文詳細クライアントコンポーネント（管理画面）
 * 
 * 注文の詳細情報表示、Stripe決済履歴、管理者アクション
 */
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, X, Loader, ExternalLink, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/types';
import { approveOrder, capturePayment, cancelOrderByAdmin, processRefund } from './actions';

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

interface PaymentHistoryEvent {
  id: string;
  type: string;
  created: string;
  status: string;
  amount?: number;
  errorMessage?: string;
  errorCode?: string;
}

interface OrderDetailAdminProps {
  order: OrderData;
  meetingLocationDescriptionHtml: string;
  paymentHistory: PaymentHistoryEvent[];
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

// イベントタイプの日本語表示
function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'payment_intent.created': 'PaymentIntent作成',
    'payment_intent.requires_action': '3Dセキュア要求',
    'payment_intent.processing': '処理中',
    'payment_intent.succeeded': '決済成功',
    'payment_intent.payment_failed': '決済失敗',
    'payment_intent.canceled': 'キャンセル',
    'payment_intent.amount_capturable_updated': 'オーソリ完了',
    'charge.succeeded': '請求成功',
    'charge.failed': '請求失敗',
    'charge.refunded': '返金完了',
    'charge.captured': '売上確定',
  };
  return labels[type] || type;
}

// イベントのアイコン
function EventIcon({ type }: { type: string }) {
  if (type.includes('succeeded') || type.includes('captured') || type.includes('refunded')) {
    return <CheckCircle size={16} className="event-icon event-icon--success" />;
  }
  if (type.includes('failed')) {
    return <XCircle size={16} className="event-icon event-icon--error" />;
  }
  if (type.includes('canceled')) {
    return <XCircle size={16} className="event-icon event-icon--warning" />;
  }
  return <Clock size={16} className="event-icon event-icon--info" />;
}

// ステータスに応じたアクション可否
function getActionStates(status: OrderStatus): {
  canApprove: boolean;
  canCapture: boolean;
  canCancel: boolean;
  canRefund: boolean;
} {
  switch (status) {
    case 'authorized':
      return { canApprove: true, canCapture: false, canCancel: true, canRefund: false };
    case 'approved':
      return { canApprove: false, canCapture: true, canCancel: true, canRefund: false };
    case 'delivered':
      return { canApprove: false, canCapture: false, canCancel: false, canRefund: true };
    case 'refund_requested':
      return { canApprove: false, canCapture: false, canCancel: false, canRefund: true };
    default:
      return { canApprove: false, canCapture: false, canCancel: false, canRefund: false };
  }
}

export function OrderDetailAdmin({
  order,
  meetingLocationDescriptionHtml,
  paymentHistory,
  receiptUrl,
  refundReceiptUrl,
}: OrderDetailAdminProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [actionModal, setActionModal] = useState<'approve' | 'capture' | 'cancel' | 'refund' | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const actionStates = getActionStates(order.orderStatus);

  const handleAction = (action: 'approve' | 'capture' | 'cancel' | 'refund') => {
    setError(null);
    startTransition(async () => {
      let result: { success: boolean; error?: string };

      switch (action) {
        case 'approve':
          result = await approveOrder(order.id);
          break;
        case 'capture':
          result = await capturePayment(order.id);
          break;
        case 'cancel':
          result = await cancelOrderByAdmin(order.id, reason);
          break;
        case 'refund':
          result = await processRefund(order.id);
          break;
      }

      if (result.success) {
        setActionModal(null);
        setReason('');
        router.refresh();
      } else {
        setError(result.error || 'エラーが発生しました');
      }
    });
  };

  return (
    <div className="admin-order-detail">
      <div className="admin-order-detail__header">
        <Link href="/admin/orders" className="admin-order-detail__back">
          <ArrowLeft size={20} />
          注文一覧に戻る
        </Link>
        <h1>注文詳細</h1>
      </div>

      {/* ステータス */}
      <div className="admin-order-detail__status-section">
        <span className={`admin-order-detail__status admin-order-detail__status--${order.orderStatus}`}>
          {ORDER_STATUS_LABELS[order.orderStatus]}
        </span>
      </div>

      {/* 基本情報 */}
      <section className="admin-order-detail__section">
        <h2>注文情報</h2>
        <dl className="admin-order-detail__list">
          <dt>注文ID</dt>
          <dd><code>{order.id}</code></dd>

          <dt>注文日時</dt>
          <dd>{formatDate(order.orderedAt)}</dd>
          
          <dt>商品名</dt>
          <dd>
            <Link href={`/products/${order.productId}`} target="_blank" className="admin-order-detail__product-link">
              {order.productName}
              <ExternalLink size={14} />
            </Link>
          </dd>
          
          <dt>金額</dt>
          <dd>{formatPrice(order.price)}</dd>

          <dt>Stripe PaymentIntent</dt>
          <dd><code>{order.stripePaymentIntentId}</code></dd>

          <dt>IPアドレス</dt>
          <dd><code>{order.ipAddress}</code></dd>
        </dl>
      </section>

      {/* 購入者情報 */}
      <section className="admin-order-detail__section">
        <h2>購入者情報</h2>
        <dl className="admin-order-detail__list">
          <dt>表示名</dt>
          <dd>{order.buyerDisplayName}</dd>

          <dt>メールアドレス</dt>
          <dd><a href={`mailto:${order.buyerEmail}`}>{order.buyerEmail}</a></dd>

          <dt>UID</dt>
          <dd><code>{order.buyerUid}</code></dd>

          {order.commentFromBuyer && (
            <>
              <dt>コメント</dt>
              <dd>{order.commentFromBuyer}</dd>
            </>
          )}
        </dl>
      </section>

      {/* 受け渡し情報 */}
      <section className="admin-order-detail__section">
        <h2>受け渡し情報</h2>
        <dl className="admin-order-detail__list">
          <dt>受け渡し日時</dt>
          <dd>{formatDateWithWeekday(order.meetingDatetime)}</dd>
          
          <dt>受け渡し場所</dt>
          <dd>
            {order.meetingLocationName}
            <button
              type="button"
              className="admin-order-detail__location-link"
              onClick={() => setIsLocationModalOpen(true)}
            >
              <MapPin size={16} />
              詳細を見る
            </button>
          </dd>
        </dl>
      </section>

      {/* ステータス履歴 */}
      <section className="admin-order-detail__section">
        <h2>ステータス履歴</h2>
        <dl className="admin-order-detail__list">
          {order.approvedAt && (
            <>
              <dt>承認日時</dt>
              <dd>{formatDate(order.approvedAt)}</dd>
            </>
          )}
          {order.handedOverAt && (
            <>
              <dt>受渡完了日時</dt>
              <dd>{formatDate(order.handedOverAt)}</dd>
            </>
          )}
          {order.canceledAt && (
            <>
              <dt>キャンセル日時</dt>
              <dd>{formatDate(order.canceledAt)}</dd>
            </>
          )}
          {order.cancellationReason && (
            <>
              <dt>キャンセル理由</dt>
              <dd>{order.cancellationReason}</dd>
            </>
          )}
          {order.refundRequestReason && (
            <>
              <dt>返品理由</dt>
              <dd>{order.refundRequestReason}</dd>
            </>
          )}
          {order.returnedAt && (
            <>
              <dt>返金完了日時</dt>
              <dd>{formatDate(order.returnedAt)}</dd>
            </>
          )}
        </dl>
      </section>

      {/* 領収書リンク */}
      {(receiptUrl || refundReceiptUrl) && (
        <section className="admin-order-detail__section">
          <h2>領収書</h2>
          <div className="admin-order-detail__receipts">
            {receiptUrl && (
              <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="btn">
                領収書を表示
                <ExternalLink size={14} />
              </a>
            )}
            {refundReceiptUrl && (
              <a href={refundReceiptUrl} target="_blank" rel="noopener noreferrer" className="btn">
                返金明細を表示
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </section>
      )}

      {/* Stripe決済履歴 */}
      <section className="admin-order-detail__section">
        <h2>Stripe決済履歴</h2>
        {paymentHistory.length === 0 ? (
          <p className="admin-order-detail__empty">決済履歴がありません。</p>
        ) : (
          <div className="admin-order-detail__payment-history">
            {paymentHistory.map((event) => (
              <div key={event.id} className={`admin-order-detail__event ${event.errorMessage ? 'admin-order-detail__event--error' : ''}`}>
                <div className="admin-order-detail__event-header">
                  <EventIcon type={event.type} />
                  <span className="admin-order-detail__event-type">{getEventTypeLabel(event.type)}</span>
                  <span className="admin-order-detail__event-time">{formatDate(event.created)}</span>
                </div>
                <div className="admin-order-detail__event-details">
                  {event.amount && (
                    <span className="admin-order-detail__event-amount">{formatPrice(event.amount)}</span>
                  )}
                  <code className="admin-order-detail__event-id">{event.id}</code>
                </div>
                {event.errorMessage && (
                  <div className="admin-order-detail__event-error">
                    <AlertCircle size={14} />
                    <span>{event.errorMessage}</span>
                    {event.errorCode && <code>{event.errorCode}</code>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 管理者アクション */}
      <section className="admin-order-detail__section">
        <h2>管理者アクション</h2>
        <div className="admin-order-detail__actions">
          <div className={`admin-order-detail__action-box ${!actionStates.canApprove ? 'admin-order-detail__action-box--disabled' : ''}`}>
            <button
              type="button"
              className="btn btn--primary btn--full"
              disabled={!actionStates.canApprove}
              onClick={() => setActionModal('approve')}
            >
              注文を承認
            </button>
            <p className="admin-order-detail__action-note">
              注文内容を確認し、承認します。購入者に承認メールが送信されます。
            </p>
          </div>

          <div className={`admin-order-detail__action-box ${!actionStates.canCapture ? 'admin-order-detail__action-box--disabled' : ''}`}>
            <button
              type="button"
              className="btn btn--primary btn--full"
              disabled={!actionStates.canCapture}
              onClick={() => setActionModal('capture')}
            >
              売上確定（受渡完了）
            </button>
            <p className="admin-order-detail__action-note">
              商品の受け渡しが完了したら、売上を確定します。クレジットカードへの請求が実行されます。
            </p>
          </div>

          <div className={`admin-order-detail__action-box ${!actionStates.canCancel ? 'admin-order-detail__action-box--disabled' : ''}`}>
            <button
              type="button"
              className="btn btn--danger btn--full"
              disabled={!actionStates.canCancel}
              onClick={() => setActionModal('cancel')}
            >
              注文をキャンセル
            </button>
            <p className="admin-order-detail__action-note">
              注文をキャンセルし、オーソリを取り消します。購入者に請求は発生しません。
            </p>
          </div>

          <div className={`admin-order-detail__action-box ${!actionStates.canRefund ? 'admin-order-detail__action-box--disabled' : ''}`}>
            <button
              type="button"
              className="btn btn--secondary btn--full"
              disabled={!actionStates.canRefund}
              onClick={() => setActionModal('refund')}
            >
              返金処理
            </button>
            <p className="admin-order-detail__action-note">
              売上確定済みの注文を返金します。Stripeで全額返金が実行されます。
            </p>
          </div>
        </div>
      </section>

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
              {order.meetingLocationGoogleMapEmbedURL && (
                <div 
                  className="meeting-location-detail__map"
                  dangerouslySetInnerHTML={{ __html: order.meetingLocationGoogleMapEmbedURL }}
                />
              )}
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

      {/* 承認モーダル */}
      {actionModal === 'approve' && (
        <div className="modal-overlay" onClick={() => !isPending && setActionModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>注文を承認</h2>
              <button
                type="button"
                className="modal__close"
                onClick={() => !isPending && setActionModal(null)}
                disabled={isPending}
              >
                <X size={24} />
              </button>
            </div>
            <div className="modal__body">
              <p>この注文を承認しますか？</p>
              <p className="admin-order-detail__modal-note">購入者に承認完了メールが送信されます。</p>
              {error && <p className="admin-order-detail__modal-error">{error}</p>}
            </div>
            <div className="modal__footer">
              <button type="button" className="btn" onClick={() => setActionModal(null)} disabled={isPending}>
                戻る
              </button>
              <button type="button" className="btn btn--primary" onClick={() => handleAction('approve')} disabled={isPending}>
                {isPending ? <><Loader size={16} className="loading-spinner" />処理中...</> : '承認する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 売上確定モーダル */}
      {actionModal === 'capture' && (
        <div className="modal-overlay" onClick={() => !isPending && setActionModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>売上確定（受渡完了）</h2>
              <button
                type="button"
                className="modal__close"
                onClick={() => !isPending && setActionModal(null)}
                disabled={isPending}
              >
                <X size={24} />
              </button>
            </div>
            <div className="modal__body">
              <p>売上を確定しますか？</p>
              <p className="admin-order-detail__modal-note">クレジットカードへの請求が実行されます。この操作は取り消せません。</p>
              {error && <p className="admin-order-detail__modal-error">{error}</p>}
            </div>
            <div className="modal__footer">
              <button type="button" className="btn" onClick={() => setActionModal(null)} disabled={isPending}>
                戻る
              </button>
              <button type="button" className="btn btn--primary" onClick={() => handleAction('capture')} disabled={isPending}>
                {isPending ? <><Loader size={16} className="loading-spinner" />処理中...</> : '売上を確定する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* キャンセルモーダル */}
      {actionModal === 'cancel' && (
        <div className="modal-overlay" onClick={() => !isPending && setActionModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>注文をキャンセル</h2>
              <button
                type="button"
                className="modal__close"
                onClick={() => !isPending && setActionModal(null)}
                disabled={isPending}
              >
                <X size={24} />
              </button>
            </div>
            <div className="modal__body">
              <p>この注文をキャンセルしますか？</p>
              <label className="admin-order-detail__modal-label">
                キャンセル理由
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="キャンセル理由を入力してください"
                  className="admin-order-detail__modal-textarea"
                  disabled={isPending}
                />
              </label>
              {error && <p className="admin-order-detail__modal-error">{error}</p>}
            </div>
            <div className="modal__footer">
              <button type="button" className="btn" onClick={() => setActionModal(null)} disabled={isPending}>
                戻る
              </button>
              <button type="button" className="btn btn--danger" onClick={() => handleAction('cancel')} disabled={isPending}>
                {isPending ? <><Loader size={16} className="loading-spinner" />処理中...</> : 'キャンセルする'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 返金モーダル */}
      {actionModal === 'refund' && (
        <div className="modal-overlay" onClick={() => !isPending && setActionModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>返金処理</h2>
              <button
                type="button"
                className="modal__close"
                onClick={() => !isPending && setActionModal(null)}
                disabled={isPending}
              >
                <X size={24} />
              </button>
            </div>
            <div className="modal__body">
              <p>この注文を返金しますか？</p>
              <p className="admin-order-detail__modal-note">Stripeで全額返金が実行されます。この操作は取り消せません。</p>
              {error && <p className="admin-order-detail__modal-error">{error}</p>}
            </div>
            <div className="modal__footer">
              <button type="button" className="btn" onClick={() => setActionModal(null)} disabled={isPending}>
                戻る
              </button>
              <button type="button" className="btn btn--primary" onClick={() => handleAction('refund')} disabled={isPending}>
                {isPending ? <><Loader size={16} className="loading-spinner" />処理中...</> : '返金する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
