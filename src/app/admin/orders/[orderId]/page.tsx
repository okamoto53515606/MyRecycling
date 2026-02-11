/**
 * 注文詳細ページ（管理画面）
 * 
 * 注文の詳細情報表示とStripe決済履歴、管理者アクション
 */
import { redirect } from 'next/navigation';
import { getOrderById } from '@/lib/data';
import { marked } from 'marked';
import { OrderDetailAdmin } from './order-detail-admin';
import Stripe from 'stripe';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

// Stripe決済履歴を取得
async function getPaymentHistory(paymentIntentId: string): Promise<Array<{
  id: string;
  type: string;
  created: Date;
  status: string;
  amount?: number;
  errorMessage?: string;
  errorCode?: string;
}>> {
  if (!paymentIntentId) return [];

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    
    // PaymentIntentに関連するイベントを取得
    const events = await stripe.events.list({
      limit: 100,
    });

    // payment_intent.id でフィルタリング
    const relatedEvents = events.data.filter(event => {
      if (event.type.startsWith('payment_intent.')) {
        const pi = event.data.object as Stripe.PaymentIntent;
        return pi.id === paymentIntentId;
      }
      if (event.type.startsWith('charge.')) {
        const charge = event.data.object as Stripe.Charge;
        return charge.payment_intent === paymentIntentId;
      }
      return false;
    });

    return relatedEvents.map(event => {
      const eventData: {
        id: string;
        type: string;
        created: Date;
        status: string;
        amount?: number;
        errorMessage?: string;
        errorCode?: string;
      } = {
        id: event.id,
        type: event.type,
        created: new Date(event.created * 1000),
        status: '',
      };

      if (event.type.startsWith('payment_intent.')) {
        const pi = event.data.object as Stripe.PaymentIntent;
        eventData.status = pi.status;
        eventData.amount = pi.amount;
        if (pi.last_payment_error) {
          eventData.errorMessage = pi.last_payment_error.message || undefined;
          eventData.errorCode = pi.last_payment_error.code || undefined;
        }
      } else if (event.type.startsWith('charge.')) {
        const charge = event.data.object as Stripe.Charge;
        eventData.status = charge.status;
        eventData.amount = charge.amount;
        if (charge.failure_message) {
          eventData.errorMessage = charge.failure_message;
          eventData.errorCode = charge.failure_code || undefined;
        }
      }

      return eventData;
    });
  } catch (error) {
    console.error('[admin/orders] getPaymentHistory failed:', error);
    return [];
  }
}

// 領収書URLを取得
async function getReceiptUrls(paymentIntentId: string): Promise<{ receiptUrl?: string; refundReceiptUrl?: string }> {
  if (!paymentIntentId) return {};

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge', 'latest_charge.refunds'],
    });

    const latestCharge = paymentIntent.latest_charge as Stripe.Charge | null;
    if (!latestCharge) return {};

    const receiptUrl = latestCharge.receipt_url || undefined;
    
    let refundReceiptUrl: string | undefined;
    if (latestCharge.refunds?.data && latestCharge.refunds.data.length > 0) {
      refundReceiptUrl = latestCharge.refunds.data[0].receipt_number 
        ? `https://pay.stripe.com/receipts/${latestCharge.refunds.data[0].receipt_number}`
        : undefined;
    }

    return { receiptUrl, refundReceiptUrl };
  } catch (error) {
    console.error('[admin/orders] getReceiptUrls failed:', error);
    return {};
  }
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { orderId } = await params;

  const order = await getOrderById(orderId);

  if (!order) {
    redirect('/admin/orders');
  }

  // Markdown変換
  const meetingLocationDescriptionHtml = order.meetingLocationDescription
    ? await marked.parse(order.meetingLocationDescription)
    : '';

  // Stripe決済履歴を取得
  const paymentHistory = await getPaymentHistory(order.stripePaymentIntentId);

  // 領収書URLを取得
  const receipts = await getReceiptUrls(order.stripePaymentIntentId);

  // 日付をISO文字列に変換
  const orderData = {
    ...order,
    meetingDatetime: order.meetingDatetime.toISOString(),
    orderedAt: order.orderedAt.toISOString(),
    approvedAt: order.approvedAt?.toISOString(),
    canceledAt: order.canceledAt?.toISOString(),
    handedOverAt: order.handedOverAt?.toISOString(),
    refundMeetingDatetime: order.refundMeetingDatetime?.toISOString(),
    returnedAt: order.returnedAt?.toISOString(),
  };

  // 決済履歴も日付変換
  const paymentHistoryData = paymentHistory.map(event => ({
    ...event,
    created: event.created.toISOString(),
  }));

  return (
    <OrderDetailAdmin
      order={orderData}
      meetingLocationDescriptionHtml={meetingLocationDescriptionHtml}
      paymentHistory={paymentHistoryData}
      receiptUrl={receipts.receiptUrl}
      refundReceiptUrl={receipts.refundReceiptUrl}
    />
  );
}
