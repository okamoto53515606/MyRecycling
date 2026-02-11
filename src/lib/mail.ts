/**
 * メール送信機能
 * 
 * Firestoreのmail_templatesコレクションからテンプレートを取得し、
 * プレースホルダーを置換してメールを送信する。
 */

import nodemailer from 'nodemailer';
import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/env';
import { Timestamp } from 'firebase-admin/firestore';

// メールテンプレートの型
interface MailTemplate {
  subject: string;
  body: string;
  ccEmail: string;
}

// 注文データの型（プレースホルダー置換用）
interface OrderData {
  id: string;
  productId?: string;
  productName?: string;
  price?: number;
  currency?: string;
  buyerUid?: string;
  buyerEmail?: string;
  buyerDisplayName?: string;
  commentFromBuyer?: string;
  meetingLocationName?: string;
  meetingLocationDescription?: string;
  meetingDatetime?: Timestamp | Date | string;
  orderStatus?: string;
  orderedAt?: Timestamp | Date;
  approvedAt?: Timestamp | Date;
  cancellationReason?: string;
  canceledAt?: Timestamp | Date;
  handedOverAt?: Timestamp | Date;
  refundRequestReason?: string;
  refundMeetingDatetime?: Timestamp | Date | string;
  refundMeetingLocationName?: string;
  returnedAt?: Timestamp | Date;
}

/**
 * 環境変数からSMTP設定を取得
 */
function getSmtpConfig() {
  const host = process.env.MY_MAIL_SMTP_HOST;
  const port = process.env.MY_MAIL_SMTP_PORT;
  const user = process.env.MY_MAIL_SMTP_USER;
  const password = process.env.MY_MAIL_SMTP_PASSWORD;
  const from = process.env.MY_MAIL_FROM;
  const fromName = process.env.MY_MAIL_FROM_NAME || '';

  if (!host || !port || !user || !password || !from) {
    return null;
  }

  return { host, port: parseInt(port, 10), user, password, from, fromName };
}

/**
 * Firestoreからメールテンプレートを取得
 */
async function getMailTemplate(templateId: string): Promise<MailTemplate | null> {
  try {
    const db = getAdminDb();
    const doc = await db.collection('mail_templates').doc(templateId).get();
    
    if (!doc.exists) {
      logger.warn(`Mail template '${templateId}' not found`);
      return null;
    }

    const data = doc.data();
    return {
      subject: data?.subject || '',
      body: data?.body || '',
      ccEmail: data?.ccEmail || '',
    };
  } catch (error) {
    logger.error(`Failed to get mail template '${templateId}':`, error);
    return null;
  }
}

/**
 * Timestamp/Date を日本語フォーマットに変換
 */
function formatDateTime(value: Timestamp | Date | string | undefined): string {
  if (!value) return '';
  
  let date: Date;
  if (value instanceof Timestamp) {
    date = value.toDate();
  } else if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string') {
    date = new Date(value);
  } else {
    return '';
  }

  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  });
}

/**
 * プレースホルダーを置換
 */
function replacePlaceholders(text: string, order: OrderData): string {
  return text
    .replace(/\{id\}/g, order.id || '')
    .replace(/\{productId\}/g, order.productId || '')
    .replace(/\{productName\}/g, order.productName || '')
    .replace(/\{price\}/g, order.price?.toString() || '')
    .replace(/\{currency\}/g, order.currency || '')
    .replace(/\{buyerUid\}/g, order.buyerUid || '')
    .replace(/\{buyerEmail\}/g, order.buyerEmail || '')
    .replace(/\{buyerDisplayName\}/g, order.buyerDisplayName || '')
    .replace(/\{commentFromBuyer\}/g, order.commentFromBuyer || '')
    .replace(/\{meetingLocationName\}/g, order.meetingLocationName || '')
    .replace(/\{meetingLocationDescription\}/g, order.meetingLocationDescription || '')
    .replace(/\{meetingDatetime\}/g, formatDateTime(order.meetingDatetime))
    .replace(/\{orderStatus\}/g, order.orderStatus || '')
    .replace(/\{orderedAt\}/g, formatDateTime(order.orderedAt))
    .replace(/\{approvedAt\}/g, formatDateTime(order.approvedAt))
    .replace(/\{cancellationReason\}/g, order.cancellationReason || '')
    .replace(/\{canceledAt\}/g, formatDateTime(order.canceledAt))
    .replace(/\{handedOverAt\}/g, formatDateTime(order.handedOverAt))
    .replace(/\{refundRequestReason\}/g, order.refundRequestReason || '')
    .replace(/\{refundMeetingDatetime\}/g, formatDateTime(order.refundMeetingDatetime))
    .replace(/\{refundMeetingLocationName\}/g, order.refundMeetingLocationName || '')
    .replace(/\{returnedAt\}/g, formatDateTime(order.returnedAt));
}

/**
 * メールを送信
 */
async function sendMail(to: string, subject: string, body: string): Promise<boolean> {
  const config = getSmtpConfig();
  if (!config) {
    logger.warn('SMTP configuration is not set, skipping email send');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });

    const from = config.fromName 
      ? `"${config.fromName}" <${config.from}>`
      : config.from;

    await transporter.sendMail({
      from,
      to,
      subject,
      text: body,
    });

    logger.info(`Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error);
    return false;
  }
}

/**
 * 注文関連メールを送信
 * 
 * @param templateId メールテンプレートID
 * @param order 注文データ
 * @param options オプション
 *   - toEmail: 送信先（指定しない場合はorder.buyerEmailを使用）
 *   - sendToOperatorOnly: trueの場合、ccEmailのみに送信（利用者には送信しない）
 */
export async function sendOrderMail(
  templateId: string,
  order: OrderData,
  options?: {
    toEmail?: string;
    sendToOperatorOnly?: boolean;
  }
): Promise<boolean> {
  const template = await getMailTemplate(templateId);
  if (!template) {
    logger.warn(`Skipping email: template '${templateId}' not found`);
    return false;
  }

  const subject = replacePlaceholders(template.subject, order);
  const body = replacePlaceholders(template.body, order);

  let success = true;

  // 運営者のみに送信する場合（refund_requested_mail）
  if (options?.sendToOperatorOnly) {
    if (template.ccEmail) {
      success = await sendMail(template.ccEmail, subject, body);
    } else {
      logger.warn(`Skipping email: ccEmail not set for template '${templateId}'`);
      return false;
    }
    return success;
  }

  // 利用者に送信
  const toEmail = options?.toEmail || order.buyerEmail;
  if (toEmail) {
    success = await sendMail(toEmail, subject, body);
  } else {
    logger.warn(`Skipping email: no recipient email for template '${templateId}'`);
    return false;
  }

  // 控えメールを送信
  if (template.ccEmail) {
    await sendMail(template.ccEmail, subject, body);
  }

  return success;
}
