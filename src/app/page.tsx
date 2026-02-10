/**
 * ホームページ（商品一覧）
 * 
 * サイトのトップページです。
 * 全ての商品をカード形式で表示します（30件ごとのページネーション対応）。
 */

import { getProducts, getSettings } from '@/lib/data';
import type { Product } from '@/lib/types';
import ProductCard from '@/components/product-card';
import Pagination from '@/components/pagination';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const PRODUCTS_PER_PAGE = 30;

/**
 * ページネーションに応じた動的なメタデータ生成
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const settings = await getSettings();
  const params = await searchParams;
  const page = Number(params?.p || 1);
  const siteName = settings?.siteName || '';
  
  const title = page > 1 
    ? `${siteName} - ${page}ページ目`
    : settings?.metaTitle || siteName;
  
  return {
    title: title,
    description: settings?.metaDescription,
    alternates: {
      canonical: '/',
    },
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params?.p || 1);

  const [{ products, total }, settings] = await Promise.all([
    getProducts({ page, limit: PRODUCTS_PER_PAGE }),
    getSettings(),
  ]);

  const siteName = settings?.siteName || '商品一覧';
  const totalPages = Math.ceil(total / PRODUCTS_PER_PAGE);

  return (
    <div className="page-section container">
      <h1>{siteName}</h1>
      {settings.siteDescription && 
        <div className="site-description">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {settings.siteDescription}
          </ReactMarkdown>
        </div>
      }

      {products.length > 0 ? (
        <>
          <div className="product-list">
            {products.map((product: Product, index: number) => (
              <ProductCard key={product.id} product={product} priority={index < 3} />
            ))}
          </div>
          
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath="/"
          />
        </>
      ) : (
        <p>
          現在、表示できる商品がありません。
        </p>
      )}
    </div>
  );
}
