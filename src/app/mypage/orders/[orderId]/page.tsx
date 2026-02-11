/**
 * 注文詳細ページ
 * 
 * 注文の詳細情報を表示する。
 * 未ログインの場合はログイン画面を表示。
 */
import { notFound } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { getSettings, getOrderForUser, getMeetingLocationsWithDetails, getAvailableWeekdays, getAvailableTimes, getUnavailableDates } from '@/lib/data';
import { LoginRequired } from '../../login-required';
import { OrderDetailClient } from './order-detail-client';
import { marked, Renderer } from 'marked';
import Stripe from 'stripe';

// リンクを別タブで開くカスタムレンダラー
const renderer = new Renderer();
renderer.link = ({ href, title, text }) => {
  const titleAttr = title ? ` title="${title}"` : '';
  return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
};

interface OrderDetailPageProps {
  params: Promise<{ orderId: string }>;
}

/**
 * Stripeから領収書URLを取得
 */
async function getReceiptUrls(
  paymentIntentId: string,
  orderStatus: string
): Promise<{ receiptUrl?: string; refundReceiptUrl?: string }> {
  // delivered または refunded 以外は領収書なし
  if (orderStatus !== 'delivered' && orderStatus !== 'refunded') {
    return {};
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge', 'latest_charge.refunds'],
    });

    const charge = paymentIntent.latest_charge as Stripe.Charge | null;
    if (!charge) return {};

    const result: { receiptUrl?: string; refundReceiptUrl?: string } = {};

    // delivered: 決済の領収書
    if (orderStatus === 'delivered' && charge.receipt_url) {
      result.receiptUrl = charge.receipt_url;
    }

    // refunded: 返金の領収書（Stripeは返金に個別の領収書URLを提供しないが、
    // 元の領収書に返金情報が反映される）
    if (orderStatus === 'refunded' && charge.receipt_url) {
      result.refundReceiptUrl = charge.receipt_url;
    }

    return result;
  } catch (error) {
    console.error('Failed to get receipt URL from Stripe:', error);
    return {};
  }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderId } = await params;
  const user = await getUser();
  const settings = await getSettings();

  if (!user || !user.isLoggedIn || !user.uid) {
    return <LoginRequired siteName={settings.siteName || ''} />;
  }

  const order = await getOrderForUser(orderId, user.uid);

  if (!order) {
    notFound();
  }

  // Markdown → HTML変換（受け渡し場所の説明）
  const meetingLocationDescriptionHtml = order.meetingLocationDescription
    ? await marked(order.meetingLocationDescription, { renderer })
    : '';

  // Stripe領収書URLを取得（delivered/refunded時のみ）
  const { receiptUrl, refundReceiptUrl } = await getReceiptUrls(
    order.stripePaymentIntentId,
    order.orderStatus
  );

  // 返品依頼可能な場合（delivered）は受け渡し場所・日時データを取得
  let refundScheduleData = null;
  if (order.orderStatus === 'delivered') {
    const [meetingLocations, availableWeekdays, availableTimes, unavailableDates] = await Promise.all([
      getMeetingLocationsWithDetails(),
      getAvailableWeekdays(),
      getAvailableTimes(),
      getUnavailableDates(),
    ]);

    // Markdown → HTML変換（各場所の説明）
    const locationsWithHtml = await Promise.all(
      meetingLocations.map(async (location) => ({
        ...location,
        descriptionHtml: location.description
          ? await marked(location.description, { renderer })
          : '',
      }))
    );

    refundScheduleData = {
      meetingLocations: locationsWithHtml,
      availableWeekdays,
      availableTimes,
      unavailableDates: unavailableDates.map(d => d.date.toISOString()),
    };
  }

  return (
    <OrderDetailClient 
      order={{
        ...order,
        orderedAt: order.orderedAt.toISOString(),
        meetingDatetime: order.meetingDatetime.toISOString(),
        approvedAt: order.approvedAt?.toISOString(),
        canceledAt: order.canceledAt?.toISOString(),
        handedOverAt: order.handedOverAt?.toISOString(),
        refundMeetingDatetime: order.refundMeetingDatetime?.toISOString(),
        returnedAt: order.returnedAt?.toISOString(),
      }}
      meetingLocationDescriptionHtml={meetingLocationDescriptionHtml}
      receiptUrl={receiptUrl}
      refundReceiptUrl={refundReceiptUrl}
      refundScheduleData={refundScheduleData}
    />
  );
}
