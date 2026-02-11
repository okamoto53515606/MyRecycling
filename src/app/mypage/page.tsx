/**
 * マイページ - 注文履歴一覧
 * 
 * ログインユーザーの注文履歴を表示する。
 * 未ログインの場合はログイン画面を表示。
 */
import { getUser } from '@/lib/auth';
import { getSettings, getUserOrders } from '@/lib/data';
import { ORDER_STATUS_LABELS } from '@/lib/types';
import Link from 'next/link';
import { LoginRequired } from './login-required';

function formatDate(date: Date): string {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`;
}

export default async function MyPage() {
  const user = await getUser();
  const settings = await getSettings();

  if (!user || !user.isLoggedIn || !user.uid) {
    return <LoginRequired siteName={settings.siteName || ''} />;
  }

  const orders = await getUserOrders(user.uid);

  return (
    <div className="mypage">
      <h1>マイページ</h1>
      
      <section className="mypage__section">
        <h2>注文履歴</h2>
        
        {orders.length === 0 ? (
          <p className="mypage__empty">注文履歴がありません。</p>
        ) : (
          <div className="mypage__orders">
            <table className="mypage__table">
              <thead>
                <tr>
                  <th>注文日時</th>
                  <th>商品名</th>
                  <th>金額</th>
                  <th>ステータス</th>
                  <th>受け渡し日時</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td data-label="注文日時">{formatDate(order.orderedAt)}</td>
                    <td data-label="商品名" className="mypage__product-name">{order.productName}</td>
                    <td data-label="金額">{formatPrice(order.price)}</td>
                    <td data-label="ステータス">
                      <span className={`mypage__status mypage__status--${order.orderStatus}`}>
                        {ORDER_STATUS_LABELS[order.orderStatus]}
                      </span>
                    </td>
                    <td data-label="受け渡し日時">{formatDate(order.meetingDatetime)}</td>
                    <td>
                      <Link href={`/mypage/orders/${order.id}`} className="btn btn--small">
                        詳細
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mypage__section mypage__section--withdraw">
        <h2>退会</h2>
        <Link href="/withdraw" className="mypage__withdraw-link">
          退会する
        </Link>
      </section>
    </div>
  );
}
