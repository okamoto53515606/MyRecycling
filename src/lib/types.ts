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
