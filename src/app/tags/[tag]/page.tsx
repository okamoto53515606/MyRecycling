/**
 * タグ別商品一覧ページ
 * 
 * 指定されたタグを持つ商品を一覧表示します。
 * ページネーションに対応しています。
 */

import { getProducts } from '@/lib/data';
import type { Product } from '@/lib/types'; // dataからtypesに変更
import { getSiteSettings } from '@/lib/settings';
import ProductCard from '@/components/product-card';
import Pagination from '@/components/pagination';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

const PRODUCTS_PER_PAGE = 30;

interface TagPageProps {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * タグページ用の動的なメタデータ生成
 */
export async function generateMetadata({ params, searchParams }: TagPageProps): Promise<Metadata> {
  const { tag: rawTag } = await params;
  const resolvedSearchParams = await searchParams;
  const tag = decodeURIComponent(rawTag);
  const page = Number(resolvedSearchParams?.p || 1);
  const settings = await getSiteSettings();
  const siteName = settings?.siteName || '';
  
  const title = page > 1
    ? `タグ「${tag}」の商品一覧 - ${page}ページ目 | ${siteName}`
    : `タグ「${tag}」の商品一覧 | ${siteName}`;

  return {
    title,
    description: `タグ「${tag}」に関する商品の一覧です。`,
    alternates: {
      canonical: `/tags/${tag}`,
    },
  };
}


export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { tag: rawTag } = await params;
  const resolvedSearchParams = await searchParams;
  const tag = decodeURIComponent(rawTag);
  const page = Number(resolvedSearchParams?.p || 1);

  const { products, total } = await getProducts({ 
    page, 
    limit: PRODUCTS_PER_PAGE, 
    tag 
  });

  if (products.length === 0) {
    notFound();
  }

  const totalPages = Math.ceil(total / PRODUCTS_PER_PAGE);

  return (
    <div className="page-section container">
      <h1>タグ: {tag}</h1>

      <div className="product-list">
        {products.map((product: Product, index: number) => (
          <ProductCard key={product.id} product={product} priority={index < 3} />
        ))}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath={`/tags/${tag}`}
      />
    </div>
  );
}
