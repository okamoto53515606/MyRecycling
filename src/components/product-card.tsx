/**
 * 商品カードコンポーネント
 * 
 * 商品一覧ページで使用されるカード形式の商品プレビューです。
 * - タイトル, 概要, タグ, 価格, 最終更新日
 */

import Link from 'next/link';
import type { Product } from '@/lib/types'; // 型のimport先を修正
import { Tag } from 'lucide-react';
import { formatPrice } from '@/lib/utils'; // 価格フォーマット用の関数を想定

/**
 * タイムスタンプを読みやすい形式にフォーマットする（JST）
 */
function formatTimestamp(date: Date): string {
  if (!date) return '日付不明';
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// コンポーネント名とprops名を変更
export default function ProductCard({ product, priority = false }: { product: Product, priority?: boolean }) {
  return (
    // CSSクラス名とリンク先を変更
    <Link href={`/products/${product.id}`} className="product-card" style={{ display: 'block' }}>
      
      <div className="product-card__content">
        <h2>{product.title}</h2>
        <p>{product.excerpt}</p>
        
        {/* タグ表示 */}
        {product.tags && product.tags.length > 0 && (
          <div className="product-card__tags">
            <Tag size={14} />
            {product.tags.join(', ')}
          </div>
        )}
      </div>

      {/* フッター */}
      <div className="product-card__footer">
        {/* article.accessからproduct.priceに変更 */}
        <span className="product-card__price">
          {formatPrice(product.price)}
        </span>
        <span className="product-card__date">
          {formatTimestamp(product.updatedAt)}
        </span>
      </div>
    </Link>
  );
}
