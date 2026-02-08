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
