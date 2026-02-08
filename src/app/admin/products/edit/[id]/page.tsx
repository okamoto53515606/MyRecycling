/**
 * 商品編集ページ（管理画面）
 */
import { getAdminDb } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import ProductEditForm from './product-edit-form';
import type { Timestamp } from 'firebase-admin/firestore';

// 商品の完全な型定義
interface ProductData {
  id: string;
  title: string;
  content: string;
  price: number;
  status: 'published' | 'draft';
  imageAssets: { url: string; }[];
  [key:string]: any;
}

/**
 * IDを指定して商品データを1件取得する（下書き含む）
 */
async function getProduct(id: string): Promise<ProductData | null> {
  try {
    const db = getAdminDb();
    const productRef = db.collection('products').doc(id);
    const doc = await productRef.get();
    
    if (!doc.exists) {
      return null;
    }
    
    const data = doc.data()!;
    
    // Firestore の Timestamp を JSON でシリアライズ可能な文字列に変換
    const serializableData = {
      ...data,
      createdAt: data.createdAt?.toDate?.().toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.().toISOString() || null,
    };
    
    return {
      id: doc.id,
      ...serializableData
    } as ProductData;

  } catch (error) {
    console.error(`[Admin] 商品の取得に失敗しました (ID: ${id}):`, error);
    return null;
  }
}

export default async function ProductEditPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <>
      <header className="admin-page-header">
        <h1>商品編集</h1>
        <p>商品の詳細情報を編集し、公開設定を管理します。</p>
      </header>

      <div className="admin-card">
        <ProductEditForm product={product} />
      </div>
    </>
  );
}
