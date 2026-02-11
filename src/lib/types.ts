import { Timestamp } from 'firebase-admin/firestore';

// 商品データ
export interface Product {
  id: string;
  title: string;
  status: 'published' | 'draft';
  content: string;
  excerpt: string;
  price: number;
  condition: string;
  referenceURL: string;
  tags: string[];
  imageAssets: { url: string }[];
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  isSoldOut: boolean;
}

// 受け渡し場所データ
export interface MeetingLocation {
  id: string;
  name: string;
  description: string;
  photoURL: string;
  googleMapEmbedURL: string;
  order: number;
}

// 受け渡し可能曜日
export interface AvailableWeekday {
  id: string; // sun, mon, etc.
  isAvailable: boolean;
  order: number;
  name: string; // 日本語名 (例: 日曜日)
}

// 受け渡し可能時間
export interface AvailableTime {
  id: string;
  time: string;
}

// 受け渡し不可日
export interface UnavailableDate {
  id: string;
  date: Date;
}

// 注文ステータス
export type OrderStatus = 
  | 'authorized'      // 注文確定待ち
  | 'approved'        // 注文確定済
  | 'canceled'        // 注文キャンセル済
  | 'delivered'       // 商品受け渡し済
  | 'refund_requested' // 返品依頼中
  | 'refunded';       // 商品返品済

// 注文ステータス表示名
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  authorized: '注文確定待ち',
  approved: '注文確定済',
  canceled: '注文キャンセル済',
  delivered: '商品受け渡し済',
  refund_requested: '返品依頼中',
  refunded: '商品返品済',
};

// 注文データ
export interface Order {
  id: string;
  productId: string;
  productName: string;
  price: number;
  currency: string;
  buyerUid: string;
  buyerEmail: string;
  buyerDisplayName: string;
  commentFromBuyer: string;
  meetingLocationName: string;
  meetingLocationPhotoURL: string;
  meetingLocationDescription: string;
  meetingLocationGoogleMapEmbedURL: string;
  meetingDatetime: Date;
  orderStatus: OrderStatus;
  stripePaymentIntentId: string;
  ipAddress: string;
  orderedAt: Date;
  approvedAt?: Date;
  cancellationReason?: string;
  canceledAt?: Date;
  handedOverAt?: Date;
  refundRequestReason?: string;
  refundMeetingDatetime?: Date;
  refundMeetingLocationName?: string;
  refundMeetingLocationPhotoURL?: string;
  refundMeetingLocationDescription?: string;
  refundMeetingLocationGoogleMapEmbedURL?: string;
  returnedAt?: Date;
}
