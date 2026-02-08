/**
 * 受け渡し日時設定ページ
 */
import { getAvailableWeekdays, getAvailableTimes, getUnavailableDates } from '@/lib/data';
import DeliverySettingsForm from './form';
import { updateDeliverySettingsAction } from './actions';

export default async function DeliverySettingsPage() {
  // データ取得
  const weekdays = await getAvailableWeekdays();
  const times = await getAvailableTimes();
  const dates = await getUnavailableDates();

  const initialState = { status: 'idle', message: '' };
  const initialData = { weekdays, times, dates };

  return (
    <div className="admin-content">
      <header className="admin-content-header">
        <h1>受け渡し日時の設定</h1>
      </header>
      <p className="admin-page-description">
        商品の受け渡しが可能な曜日・時間帯、および定休日を設定します。
        これらの設定は、購入者が商品を注文する際の「受け渡し日時選択」画面に反映されます。
      </p>
      <DeliverySettingsForm
        formAction={updateDeliverySettingsAction}
        initialState={initialState}
        initialData={initialData}
      />
    </div>
  );
}
