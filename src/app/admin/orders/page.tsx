/**
 * 注文管理一覧ページ（管理画面）
 * 
 * 全注文の一覧を表示し、ステータス別のフィルタリングが可能
 */
import Link from 'next/link';
import { getAllOrders } from '@/lib/data';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/types';

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

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status;
  
  const orders = await getAllOrders({
    status: statusFilter,
  });

  const statusOptions: { value: string; label: string }[] = [
    { value: '', label: 'すべて' },
    { value: 'authorized', label: '注文確定待ち' },
    { value: 'approved', label: '注文確定済' },
    { value: 'delivered', label: '商品受け渡し済' },
    { value: 'canceled', label: '注文キャンセル済' },
    { value: 'refund_requested', label: '返品依頼中' },
    { value: 'refunded', label: '商品返品済' },
  ];

  return (
    <div className="admin-orders">
      <div className="admin-orders__header">
        <h1>注文管理</h1>
      </div>

      {/* ステータスフィルター */}
      <div className="admin-orders__filters">
        <div className="admin-orders__filter-group">
          <label>ステータス:</label>
          <div className="admin-orders__filter-buttons">
            {statusOptions.map((option) => (
              <Link
                key={option.value}
                href={option.value ? `/admin/orders?status=${option.value}` : '/admin/orders'}
                className={`admin-orders__filter-btn ${statusFilter === option.value || (!statusFilter && option.value === '') ? 'admin-orders__filter-btn--active' : ''}`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 注文一覧 */}
      {orders.length === 0 ? (
        <p className="admin-orders__empty">注文がありません。</p>
      ) : (
        <div className="admin-orders__table-wrapper">
          <table className="admin-orders__table">
            <thead>
              <tr>
                <th>注文日時</th>
                <th>商品名</th>
                <th>金額</th>
                <th>購入者</th>
                <th>ステータス</th>
                <th>受け渡し日時</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{formatDate(order.orderedAt)}</td>
                  <td className="admin-orders__product-name">
                    <Link href={`/products/${order.productId}`} target="_blank">
                      {order.productName}
                    </Link>
                  </td>
                  <td>{formatPrice(order.price)}</td>
                  <td>
                    <div className="admin-orders__buyer">
                      <span className="admin-orders__buyer-name">{order.buyerDisplayName}</span>
                      <span className="admin-orders__buyer-email">{order.buyerEmail}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`admin-orders__status admin-orders__status--${order.orderStatus}`}>
                      {ORDER_STATUS_LABELS[order.orderStatus]}
                    </span>
                  </td>
                  <td>{formatDate(order.meetingDatetime)}</td>
                  <td>
                    <Link 
                      href={`/admin/orders/${order.id}`}
                      className="btn btn--small"
                    >
                      詳細
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
