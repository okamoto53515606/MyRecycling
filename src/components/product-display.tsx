import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Product } from '@/lib/types';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { Tag } from 'lucide-react';

const truncateUrl = (url: string) => {
    if (url.length > 30) {
      return url.substring(0, 30) + '...';
    }
    return url;
};

export default function ProductDisplay({ product }: { product: Product }) {
  return (
    <>
      <h1 className="product-detail__title">{product.title}</h1>
      <div className="product-detail__price">{formatPrice(product.price)}</div>

      {/* 状態表示: 下マージンを縮小 */}
      <div className="product-detail__meta" style={{ marginBottom: '16px' }}>
          <p><strong>状態:</strong> {product.condition}</p>
      </div>

      {/* 説明、参考URL、タグを含む本体エリア */}
      {/* 不要な区切り線やマージンを発生させないように要素を整理 */}
      <div className="product-detail__content-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {product.content}
          </ReactMarkdown>

          {product.referenceURL && (
              <div className="product-detail__reference" style={{ marginTop: '24px' }}>
                参考URL: <a href={product.referenceURL} target="_blank" rel="noopener noreferrer">
                  {truncateUrl(product.referenceURL)}
                </a>
              </div>
          )}

          {product.tags && product.tags.length > 0 && (
            <div className="article__meta" style={{ marginTop: '24px', marginBottom: '24px' }}>
                <div className="article__tags">
                  <Tag size={16} style={{ marginRight: '8px' }}/>
                  {product.tags.map((tag, index) => (
                    <span key={tag}>
                      <Link href={`/tags/${tag}`} className="article__tag-link">
                        {tag}
                      </Link>
                      {index < product.tags.length - 1 && ', '}
                    </span>
                  ))}
                </div>
            </div>
          )}
      </div>
    </>
  );
}
