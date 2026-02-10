/**
 * 商品カードコンポーネント
 * 
 * 商品一覧ページで使用されるカード形式の商品プレビューです。
 * - 画像, タイトル, 概要, 価格, Sold out表示
 */

import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

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
      {/* flex-grow: 1 をインラインで指定し、価格の縦位置を揃える */}
      <div className="product-card__content" style={{ flexGrow: 1 }}>
        <h2>{product.title}</h2>
        <p>{product.excerpt}</p>
      </div>
      <div className="product-card__footer">
        <span className="product-card__price">
          {formatPrice(product.price)}
        </span>
      </div>
    </>
  );

  return product.isSoldOut ? (
    <div className="product-card sold-out">{cardContent}</div>
  ) : (
    <Link href={`/products/${product.id}`} className="product-card">
      {cardContent}
    </Link>
  );
}
