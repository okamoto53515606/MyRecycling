/**
 * ヘッダーコンポーネント
 * 
 * サイト全体で共通のヘッダーを提供します。
 * - 左: ハンバーガーメニュー（サイト内リンク）
 * - 中央: サイト名
 * - 右: ユーザープロフィール（ログイン/ログアウト）
 * 
 * 【サーバーコンポーネント】
 * ユーザー情報とサイト設定を取得し、UI要素を配置します。
 * インタラクティブな部分はクライアントコンポーネントに委譲します。
 */

import Link from 'next/link';
import { getUser } from '@/lib/auth';
import { getTags } from '@/lib/data';
import { getSiteSettings } from '@/lib/settings';
import { UserProfileClient } from './header-client';
import HamburgerMenu from './hamburger-menu';

export default async function Header() {
  // サーバーサイドでユーザー情報とタグ情報とサイト設定を並行取得
  const [user, tags, settings] = await Promise.all([
    getUser(),
    getTags(20), // 上位20件のタグを取得
    getSiteSettings(),
  ]);
  
  return (
    <header className="site-header">
      <div className="header__left">
        <HamburgerMenu tags={tags} />
      </div>
      
      <div className="header__center">
        <Link href="/" className="header__site-name">
          {settings?.siteName || ''}
        </Link>
      </div>

      <div className="header__right">
        <UserProfileClient 
          user={user} 
          siteName={settings?.siteName || 'homepage'}
          termsOfServiceContent={settings?.termsOfServiceContent || ''}
        />
      </div>
    </header>
  );
}
