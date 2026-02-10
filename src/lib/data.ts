/**
 * データ取得モジュール
 * 
 * Firestore のデータを取得・管理します。
 * 主にサーバーコンポーネントから使用されます。
 */

import { getAdminDb } from './firebase-admin';
import { logger } from './env';
import type { Timestamp, DocumentData, DocumentSnapshot, Query } from 'firebase-admin/firestore';
import type { Product, MeetingLocation, AvailableWeekday, AvailableTime, UnavailableDate } from './types';
import { Settings } from './settings';

// --- 型定義 (サマリー) ---

export interface AdminProductSummary {
  id: string;
  title: string;
  price: number;
  status: 'published' | 'draft';
  updatedAt: Timestamp;
}

// 受け渡し場所一覧で利用するサマリーデータ
export interface AdminMeetingLocationSummary {
  id:string;
  name: string;
  order: number;
}

// タグ情報
export interface TagInfo {
  name: string;
  count: number;
}

// --- Helper --- 

const convertTimestamp = (timestamp: Timestamp | Date): Date => {
  if (timestamp instanceof Date) return timestamp;
  return timestamp.toDate();
};

// isSoldOut 判定
export async function isSoldOut(productId: string): Promise<boolean> {
  const db = getAdminDb();
  const ordersRef = db.collection('orders');
  const snapshot = await ordersRef
    .where('productId', '==', productId)
    .where('orderStatus', 'not-in', ['canceled', 'refunded'])
    .get();

  return !snapshot.empty;
}

// Firestore のドキュメントから Product 型へ変換
const docToProduct = async (doc: DocumentSnapshot<DocumentData>): Promise<Product> => {
  const data = doc.data();
  if (!data) throw new Error('Document data not found');
  
  const soldOut = await isSoldOut(doc.id);

  return {
    id: doc.id,
    title: data.title,
    status: data.status,
    content: data.content,
    excerpt: data.excerpt,
    price: data.price,
    condition: data.condition,
    referenceURL: data.referenceURL,
    tags: data.tags || [],
    imageAssets: data.imageAssets || [],
    authorId: data.authorId,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    isSoldOut: soldOut,
  };
};

// --- Settings Data ---
export async function getSettings(): Promise<Settings> {
  const db = getAdminDb();
  const docRef = db.collection('settings').doc('site_config');
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    throw new Error("Settings not found");
  }
  const data = docSnap.data() as DocumentData;
  return {
    ...data,
    siteDescription: data.siteDescription,
  } as Settings;
}

// --- Public Product Data ---

export async function getProducts({
  page = 1,
  limit = 10,
  tag,
}: {
  page?: number;
  limit?: number;
  tag?: string;
}): Promise<{ products: Product[]; total: number }> {
  try {
    const db = getAdminDb();
    let query: Query<DocumentData> = db
      .collection('products')
      .where('status', '==', 'published');

    if (tag) {
      query = query.where('tags', 'array-contains', tag);
    }

    // Get total count for pagination
    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;
    
    // Add order and pagination to the query
    query = query.orderBy('createdAt', 'desc').limit(limit).offset((page - 1) * limit);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return { products: [], total: 0 };
    }

    const products = await Promise.all(snapshot.docs.map(doc => docToProduct(doc)));

    return { products, total };
  } catch (error) {
    logger.error('[data.ts] getProducts failed:', error);
    return { products: [], total: 0 };
  }
}

// --- Admin Product Data ---

const ADMIN_PAGE_LIMIT = 15;

export async function getAdminProducts(page: number = 1): Promise<{ items: AdminProductSummary[], hasMore: boolean }> {
  try {
    const db = getAdminDb();
    const productsRef = db.collection('products');
    
    const limit = ADMIN_PAGE_LIMIT;
    
    const snapshot = await productsRef
      .orderBy('updatedAt', 'desc')
      .limit(limit + 1)
      .offset((page - 1) * limit)
      .get();

    const hasMore = snapshot.docs.length > limit;

    const items = snapshot.docs.slice(0, limit).map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        price: data.price,
        status: data.status,
        updatedAt: data.updatedAt,
      } as AdminProductSummary;
    });

    return { items, hasMore };
  } catch (error) {
    logger.error('[data.ts] getAdminProducts failed:', error);
    return { items: [], hasMore: false };
  }
}


export async function getProduct(id: string): Promise<Product | null> {
  try {
    const db = getAdminDb();
    const docSnap = await db.collection('products').doc(id).get();
    if (!docSnap.exists) return null;
    return await docToProduct(docSnap);
  } catch (error) {
    logger.error(`商品(${id})の取得に失敗:', error`);
    return null;
  }
}

// --- Meeting Location Data ---

export async function getMeetingLocations(): Promise<AdminMeetingLocationSummary[]> {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('meeting_locations').orderBy('order', 'asc').get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      order: doc.data().order,
    }));
  } catch (error) {
    logger.error('[data.ts] getMeetingLocations failed:', error);
    return [];
  }
}

export async function getMeetingLocation(id: string): Promise<MeetingLocation | null> {
  try {
    const db = getAdminDb();
    const docSnap = await db.collection('meeting_locations').doc(id).get();
    if (!docSnap.exists) return null;

    const data = docSnap.data();
    if (!data) return null;

    return {
      id: docSnap.id,
      name: data.name,
      description: data.description,
      photoURL: data.photoURL,
      googleMapEmbedURL: data.googleMapEmbedURL,
      order: data.order,
    };
  } catch (error) {
    logger.error(`受け渡し場所(${id})の取得に失敗:', error`);
    return null;
  }
}

// --- Delivery Settings Data ---

const ORDERED_WEEKDAYS = [
  { id: 'sun', name: '日曜' },
  { id: 'mon', name: '月曜' },
  { id: 'tue', name: '火曜' },
  { id: 'wed', name: '水曜' },
  { id: 'thu', name: '木曜' },
  { id: 'fri', name: '金曜' },
  { id: 'sat', name: '土曜' },
];

const JAPANESE_WEEKDAYS_MAP: { [key: string]: string } = {
  sun: '日曜',
  mon: '月曜',
  tue: '火曜',
  wed: '水曜',
  thu: '木曜',
  fri: '金曜',
  sat: '土曜',
};

export async function getAvailableWeekdays(): Promise<AvailableWeekday[]> {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('available_weekdays').orderBy('order', 'asc').get();
    if (snapshot.empty) {
      // デフォルト値を返す
      return ORDERED_WEEKDAYS.map((day, index) => ({
        id: day.id,
        isAvailable: true, // デフォルトはすべて利用可能
        order: index,
        name: day.name,
      }));
    }
    return snapshot.docs.map(doc => ({
      id: doc.id,
      isAvailable: doc.data().isAvailable,
      order: doc.data().order,
      name: JAPANESE_WEEKDAYS_MAP[doc.id] || '不明',
    }));
  } catch (error) {
    logger.error('[data.ts] getAvailableWeekdays failed:', error);
    return [];
  }
}

export async function getAvailableTimes(): Promise<AvailableTime[]> {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('available_times').orderBy('time', 'asc').get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({
      id: doc.id,
      time: doc.data().time,
    }));
  } catch (error) {
    logger.error('[data.ts] getAvailableTimes failed:', error);
    return [];
  }
}

export async function getUnavailableDates(): Promise<UnavailableDate[]> {
  try {
    const db = getAdminDb();
    // 未来の日付のみを取得
    const snapshot = await db.collection('unavailable_dates').where('date', '>=', new Date()).get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({
      id: doc.id,
      date: convertTimestamp(doc.data().date),
    }));
  } catch (error) {
    logger.error('[data.ts] getUnavailableDates failed:', error);
    return [];
  }
}

// --- Tag Data ---

export async function getTags(limit: number = 30): Promise<TagInfo[]> {
  try {
    const db = getAdminDb();
    const productsSnapshot = await db.collection('products').where('status', '==', 'published').select('tags').get();
    const tagCounts: { [key: string]: number } = {};
    productsSnapshot.docs.forEach(doc => {
      const tags = doc.data().tags;
      if (Array.isArray(tags)) {
        tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    const sortedTags = Object.entries(tagCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    return sortedTags.slice(0, limit);
  } catch (error) {
    logger.error('[data.ts] getTags failed:', error);
    return [];
  }
}
