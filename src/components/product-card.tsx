/**
 * 商品カードコンポーネント
 * 
 * 商品一覧ページで使用されるカード形式の商品プレビューです。
 * - 画像, タイトル, 概要, 価格, 最終更新日, Sold out表示
 */

import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

function formatTimestamp(date: Date): string {
  if (!date) return '日付不明';
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export default function ProductCard({ product, priority = false }: { product: Product, priority?: boolean }) {
  const cardContent = (
    <>
      <div className="product-card__image-wrapper">
        {product.isSoldOut && (
          <div className="product-card__sold-out-badge">Sold out</div>
        )}
        <Image
          src={product.imageAssets?.[0]?.url || '/placeholder.svg'}
          alt={product.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="product-card__image"
          priority={priority}
        />
      </div>
      <div className="product-card__content">
        <h2>{product.title}</h2>
        <p>{product.excerpt}</p>
      </div>
      <div className="product-card__footer">
        <span className="product-card__price">
          {formatPrice(product.price)}
        </span>
        <span className="product-card__date">
          {formatTimestamp(product.updatedAt)}
        </span>
      </div>
    </>
  );

  return product.isSoldOut ? (
    <div className="product-card sold-out">{cardContent}</div>
  ) : (
    <Link href={`/products/${product.id}`} className="product-card" style={{ display: 'block' }}>
      {cardContent}
    </Link>
  );
}
