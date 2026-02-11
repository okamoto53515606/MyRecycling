/**
 * 注文確認ページ
 * 
 * 商品詳細ページから「注文する」ボタンを押した後に遷移するページ。
 * 受け渡し場所・日時を選択し、Stripe決済に進む。
 * 
 * アクセス制御: ログイン済みかつ商品が売り切れでないことをチェック
 */

import { notFound, redirect } from 'next/navigation';
import { getPublishedProduct, getMeetingLocationsWithDetails, getAvailableWeekdays, getAvailableTimes, getUnavailableDates, isSoldOut } from '@/lib/data';
import { getUser } from '@/lib/auth';
import { getSiteSettings } from '@/lib/settings';
import type { Metadata } from 'next';
import OrderConfirmClient from './order-confirm-client';
import { marked, Renderer } from 'marked';

// リンクを別タブで開くカスタムレンダラー
const renderer = new Renderer();
renderer.link = ({ href, title, text }) => {
  const titleAttr = title ? ` title="${title}"` : '';
  return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
};

interface OrderConfirmPageProps {
  params: Promise<{ productId: string }>;
}

// キャッシュ無効化: アクセス権と在庫を毎回チェック
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: OrderConfirmPageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await getPublishedProduct(productId);
  
  if (!product) {
    return { title: '商品が見つかりません' };
  }

  return {
    title: `注文確認 - ${product.title}`,
  };
}

export default async function OrderConfirmPage({ params }: OrderConfirmPageProps) {
  const { productId } = await params;

  // データを並列取得
  const [product, user, settings, meetingLocations, availableWeekdays, availableTimes, unavailableDates] = await Promise.all([
    getPublishedProduct(productId),
    getUser(),
    getSiteSettings(),
    getMeetingLocationsWithDetails(),
    getAvailableWeekdays(),
    getAvailableTimes(),
    getUnavailableDates(),
  ]);

  // 商品が存在しない場合は404
  if (!product) {
    notFound();
  }

  // 未ログインの場合は商品詳細ページにリダイレクト
  if (!user.isLoggedIn) {
    redirect(`/products/${productId}`);
  }

  // 売り切れの場合は商品詳細ページにリダイレクト
  if (product.isSoldOut) {
    redirect(`/products/${productId}`);
  }

  // シリアライズ可能な形式に変換
  const serializableUnavailableDates = unavailableDates.map(d => d.date.toISOString());

  // 受け渡し場所の説明をMarkdownからHTMLに変換（リンクは別タブで開く）
  const meetingLocationsWithHtml = await Promise.all(
    meetingLocations.map(async (location) => ({
      ...location,
      descriptionHtml: location.description ? await marked(location.description, { renderer }) : '',
    }))
  );

  return (
    <div className="container page-section">
      <h1>受け渡し場所と日時のご指定</h1>
      <OrderConfirmClient
        product={product}
        user={user}
        meetingLocations={meetingLocationsWithHtml}
        availableWeekdays={availableWeekdays}
        availableTimes={availableTimes}
        unavailableDates={serializableUnavailableDates}
        siteName={settings?.siteName || ''}
        termsOfServiceContent={settings?.termsOfServiceContent || ''}
        privacyPolicyContent={settings?.privacyPolicyContent || ''}
      />
    </div>
  );
}
