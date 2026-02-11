import { notFound } from 'next/navigation';
import { getPublishedProduct } from '@/lib/data';
import { getSiteSettings } from '@/lib/settings';
import { getUser } from '@/lib/auth'; // ← 正しい認証ヘルパーをインポート
import type { Metadata } from 'next';
import ProductDisplay from '@/components/product-display';
import ProductImageSlider from '@/components/product-image-slider';
import ProductOrderActions from '@/components/product-order-actions';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

// メタデータの生成
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const [product, settings] = await Promise.all([
    getPublishedProduct(id),
    getSiteSettings(),
  ]);
  const siteName = settings?.siteName || '';

  if (!product) {
    return {
      title: `Not Found | ${siteName}`,
    };
  }

  const title = `${product.title} | ${siteName}`;
  const description = product.excerpt || `「${product.title}」の購入ページです。`;
  const imageUrl = product.imageAssets?.[0]?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `/products/${product.id}`,
    },
  };
}

// ページ本体
export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  // Promise.allでユーザー情報も同時に取得する
  const [product, settings, user] = await Promise.all([
    getPublishedProduct(id),
    getSiteSettings(),
    getUser(), // ← getUser() を使用
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="container page-section">
      <div className="product-detail__layout">
        <div className="product-detail__image-section">
          <ProductImageSlider images={product.imageAssets} />
        </div>

        <div className="product-detail__info-section">
            <ProductDisplay product={product} />
            <ProductOrderActions 
                product={product} 
                user={user} // ← 取得したuserオブジェクトを渡す
                siteName={settings?.siteName || ''}
                termsOfServiceContent={settings?.termsOfServiceContent || ''}
            />
        </div>
      </div>
    </div>
  );
}
