/**
 * 新規商品登録ページ（管理画面）
 */
import ProductCreateForm from './product-create-form';

export default function NewProductPage() {
  return (
    <>
      <header className="admin-page-header">
        <h1>新規商品登録</h1>
        <p>新しい商品の情報を入力し、画像をアップロードして登録します。</p>
      </header>

      <div className="admin-card">
        <ProductCreateForm />
      </div>
    </>
  );
}
