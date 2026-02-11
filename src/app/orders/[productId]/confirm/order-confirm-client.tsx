/**
 * 注文確認クライアントコンポーネント
 * 
 * 受け渡し場所・日時の選択と、Stripe決済への遷移を担当
 */
'use client';

import { useState, useMemo } from 'react';
import type { Product, MeetingLocation, AvailableWeekday, AvailableTime } from '@/lib/types';
import type { UserInfo } from '@/lib/auth';
import { formatPrice } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import MeetingLocationModal from '@/components/meeting-location-modal';

// サーバーでMarkdownをHTMLに変換済みの受け渡し場所
type MeetingLocationWithHtml = MeetingLocation & { descriptionHtml: string };

interface OrderConfirmClientProps {
  product: Product;
  user: UserInfo;
  meetingLocations: MeetingLocationWithHtml[];
  availableWeekdays: AvailableWeekday[];
  availableTimes: AvailableTime[];
  unavailableDates: string[]; // ISO文字列の配列
  siteName: string;
  termsOfServiceContent: string;
  privacyPolicyContent: string;
}

// 曜日のインデックスからIDを取得するマップ
const WEEKDAY_INDEX_TO_ID: { [key: number]: string } = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
};

// 曜日の日本語表記
const WEEKDAY_NAMES: { [key: string]: string } = {
  sun: '日',
  mon: '月',
  tue: '火',
  wed: '水',
  thu: '木',
  fri: '金',
  sat: '土',
};

export default function OrderConfirmClient({
  product,
  user,
  meetingLocations,
  availableWeekdays,
  availableTimes,
  unavailableDates,
  siteName,
  termsOfServiceContent,
  privacyPolicyContent,
}: OrderConfirmClientProps) {
  // 初期値は最初の場所を選択
  const [selectedLocationId, setSelectedLocationId] = useState<string>(meetingLocations[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [modalLocationId, setModalLocationId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [commentFromBuyer, setCommentFromBuyer] = useState<string>('');

  // 選択可能な日付を計算（今日から7日後まで、曜日・除外日をチェック）
  const availableDates = useMemo(() => {
    const dates: { date: Date; dateString: string; weekdayName: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 利用可能な曜日のIDセット
    const availableWeekdayIds = new Set(
      availableWeekdays.filter(w => w.isAvailable).map(w => w.id)
    );

    // 除外日のセット（YYYY-MM-DD形式）
    const unavailableDateSet = new Set(
      unavailableDates.map(d => {
        const date = new Date(d);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      })
    );

    // 翌日から7日後までをチェック
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const weekdayId = WEEKDAY_INDEX_TO_ID[date.getDay()];
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      // 曜日が利用可能かつ除外日でない場合のみ追加
      if (availableWeekdayIds.has(weekdayId) && !unavailableDateSet.has(dateString)) {
        dates.push({
          date,
          dateString,
          weekdayName: WEEKDAY_NAMES[weekdayId],
        });
      }
    }

    return dates;
  }, [availableWeekdays, unavailableDates]);

  // フォーム送信処理
  const handleSubmit = async () => {
    setHasAttemptedSubmit(true);
    
    if (!selectedLocationId || !selectedDate || !selectedTime) {
      const missing = [];
      if (!selectedLocationId) missing.push('受け渡し場所');
      if (!selectedDate) missing.push('受け渡し日');
      if (!selectedTime) missing.push('受け渡し時刻');
      setError(`${missing.join('、')}を選択してください。`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 選択された場所の情報を取得
      const selectedLocation = meetingLocations.find(l => l.id === selectedLocationId);

      const response = await fetch('/api/stripe/checkout/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productTitle: product.title,
          productPrice: product.price,
          userId: user.uid,
          userEmail: user.email,
          userDisplayName: user.name || '',
          meetingLocationId: selectedLocationId,
          meetingLocationName: selectedLocation?.name || '',
          meetingLocationPhotoURL: selectedLocation?.photoURL || '',
          meetingLocationDescription: selectedLocation?.description || '',
          meetingLocationGoogleMapEmbedURL: selectedLocation?.googleMapEmbedURL || '',
          meetingDate: selectedDate,
          meetingTime: selectedTime,
          commentFromBuyer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '注文処理に失敗しました');
      }

      // Stripe Checkoutページにリダイレクト
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '注文処理に失敗しました');
      setIsSubmitting(false);
    }
  };

  // 日付のフォーマット（M月D日）
  const formatDateDisplay = (date: Date) => {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <div className="order-confirm">
      {/* 商品情報サマリー */}
      <div className="order-confirm__product">
        <h2>{product.title}</h2>
        <div className="order-confirm__price">{formatPrice(product.price)}</div>
      </div>

      {/* 注意書き */}
      <div className="order-confirm__notice">
        <p>
          <strong>ご注意：</strong>受け渡し日時はこの時点ではまだ確定ではありません。
          日時の調整が必要な場合、注文後に運営者から連絡があります。
        </p>
        <p>
          注文直後は「注文確定待ち」ステータスになります。
          「注文確定済」ステータスに変わり、確定メールが届いた時点で注文と日時が確定します。
        </p>
      </div>

      {/* 受け渡し場所選択 */}
      <div className="order-confirm__section">
        <h3>受け渡し場所を選択</h3>
        <div className="order-confirm__locations">
          {meetingLocations.map(location => (
            <div
              key={location.id}
              className={`order-confirm__location-card ${selectedLocationId === location.id ? 'selected' : ''}`}
              onClick={() => setSelectedLocationId(location.id)}
            >
              <label className="order-confirm__radio-label">
                <input
                  type="radio"
                  name="meetingLocation"
                  value={location.id}
                  checked={selectedLocationId === location.id}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                />
                <span className="order-confirm__location-name">{location.name}</span>
              </label>
              <button
                type="button"
                className="order-confirm__detail-link"
                onClick={(e) => {
                  e.stopPropagation();
                  setModalLocationId(location.id);
                }}
              >
                （詳細はこちら）
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 受け渡し日選択 */}
      <div className={`order-confirm__section ${hasAttemptedSubmit && !selectedDate ? 'order-confirm__section--error' : ''}`}>
        <h3>受け渡し日を選択 {hasAttemptedSubmit && !selectedDate && <span className="order-confirm__required">※必須</span>}</h3>
        {availableDates.length === 0 ? (
          <p className="order-confirm__no-dates">現在選択可能な日付がありません。</p>
        ) : (
          <div className="order-confirm__dates">
            {availableDates.map(({ date, dateString, weekdayName }) => (
              <button
                key={dateString}
                type="button"
                className={`order-confirm__date-btn ${selectedDate === dateString ? 'selected' : ''}`}
                onClick={() => setSelectedDate(dateString)}
              >
                {formatDateDisplay(date)}（{weekdayName}）
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 受け渡し時刻選択 */}
      <div className={`order-confirm__section ${hasAttemptedSubmit && !selectedTime ? 'order-confirm__section--error' : ''}`}>
        <h3>受け渡し時刻を選択 {hasAttemptedSubmit && !selectedTime && <span className="order-confirm__required">※必須</span>}</h3>
        <select
          value={selectedTime}
          onChange={(e) => setSelectedTime(e.target.value)}
          className={`form-group__select ${hasAttemptedSubmit && !selectedTime ? 'form-group__select--error' : ''}`}
          disabled={!selectedDate}
        >
          <option value="">時刻を選択してください</option>
          {availableTimes.map(time => (
            <option key={time.id} value={time.time}>
              {time.time}
            </option>
          ))}
        </select>
      </div>

      {/* 購入者からのコメント（任意） */}
      <div className="order-confirm__section">
        <h3>コメント（任意）</h3>
        <textarea
          value={commentFromBuyer}
          onChange={(e) => setCommentFromBuyer(e.target.value)}
          className="form-group__textarea"
          placeholder="受け渡しに関するご要望やご質問があればご記入ください"
          rows={3}
        />
      </div>

      {/* 規約同意文言 */}
      <div className="order-confirm__legal">
        <p>
          <a href="/legal/terms" target="_blank" rel="noopener noreferrer">利用規約</a>、
          <a href="/legal/privacy" target="_blank" rel="noopener noreferrer">プライバシーポリシー</a>
          （Stripe等の米国事業者へのデータ提供を含む）、および
          <a href="/legal/commerce" target="_blank" rel="noopener noreferrer">特定商取引法に基づく表記</a>
          の内容を確認・同意の上、注文するボタンを押してください。ボタン押下後、クレジットカードのお支払い画面に遷移します。
        </p>
      </div>

      {/* エラー表示 */}
      {error && <p className="order-confirm__error">{error}</p>}

      {/* 注文ボタン */}
      <button
        type="button"
        className="btn btn--primary btn--full"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="loading-spin" />
            処理中...
          </>
        ) : (
          '同意の上、注文する'
        )}
      </button>

      {/* 受け渡し場所詳細モーダル */}
      {modalLocationId && (
        <MeetingLocationModal
          location={meetingLocations.find(l => l.id === modalLocationId)!}
          onClose={() => setModalLocationId(null)}
        />
      )}
    </div>
  );
}
