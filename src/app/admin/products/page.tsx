/**
 * 商品一覧ページ（管理画面）
 */
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { getAdminProducts } from '@/lib/data';
import DeleteButton from './delete-button';
import PaginationControls from '@/components/admin/pagination-controls';

function formatTimestamp(timestamp: any): string {
  if (!timestamp || !timestamp.toDate) return '----/--/--';
  return timestamp.toDate().toLocaleDateString('ja-JP');
}

function formatPrice(price: number): string {
  if (typeof price !== 'number') return '-';
  return price.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' });
}

export default async function ProductListPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const page = Number(searchParams?.page || 1);
  const { items: products, hasMore } = await getAdminProducts(page);

  return (
    <>
      <header className="admin-page-header">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h1>商品管理</h1>
            <p>商品の作成、編集、削除を行います。</p>
          </div>
          <Link href="/admin/products/new" className="admin-btn admin-btn--primary">
            <PlusCircle size={16} />
            <span>新規作成</span>
          </Link>
        </div>
      </header>

      <div className="admin-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>商品名</th>{/* ラベルを修正 */}
                <th>ステータス</th>
                <th>価格</th>
                <th>最終更新日</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <Link href={`/admin/products/edit/${product.id}`} className="admin-link">
                      {product.title}{/* 正しくproduct.titleで表示 */}
                    </Link>
                  </td>
                  <td>
                    <span className={`admin-badge admin-badge--${product.status}`}>
                      {product.status === 'published' ? '公開中' : '下書き'}
                    </span>
                  </td>
                  <td>{formatPrice(product.price)}</td>
                  <td>{formatTimestamp(product.updatedAt)}</td>
                  <td className="admin-table-actions">
                    <DeleteButton productId={product.id} /> 
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <p style={{textAlign: 'center', padding: '2rem'}}>商品はまだありません。</p>
          )}
        </div>
        
        <PaginationControls
          currentPage={page}
          hasMore={hasMore}
          basePath="/admin/products"
        />
      </div>
    </>
  );
}
