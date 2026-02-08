/**
 * 管理者ダッシュボードページ
 * 
 * @description
 * 管理機能のトップページ。サイトの概要や主要な機能へのリンクを提供します。
 */
import { Settings, ShoppingCart, MapPin, PlusSquare, CalendarClock } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <>
      <header className="admin-page-header">
        <h1>管理者ダッシュボード</h1>
        <p>
          左のメニューからサイトのコンテンツや設定を管理します。
        </p>
      </header>

      <div className="admin-card">
        <h2>クイックリンク</h2>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <Link href="/admin/settings" className="admin-btn">
            <Settings size={16} /> サイト設定
          </Link>
          <Link href="/admin/products" className="admin-btn">
            <ShoppingCart size={16} /> 商品管理
          </Link>
          <Link href="/admin/meeting-locations" className="admin-btn">
            <MapPin size={16} /> 受け渡し場所
          </Link>
          <Link href="/admin/delivery-settings" className="admin-btn">
            <CalendarClock size={16} /> 受け渡し日時設定
          </Link>
          <Link href="/admin/products/new" className="admin-btn admin-btn--primary">
            <PlusSquare size={16} /> 新しい商品を作成
          </Link>
        </div>
      </div>
    </>
  );
}
