/**
 * サイト設定データモジュール
 */

import { getAdminDb } from './firebase-admin';
import { logger } from './env';

// SiteSettings の型定義をデータベース設計に合わせて更新
export interface SiteSettings {
  siteName?: string;
  siteDescription?: string; // 新規追加
  guideContent?: string;    // 新規追加
  metaTitle?: string;
  metaDescription?: string;
  legalCommerceContent?: string;
  privacyPolicyContent?: string;
  termsOfServiceContent?: string;
  copyright?: string;
  gtmId?: string;
}

/**
 * サイト設定を取得する
 * 
 * @returns {Promise<SiteSettings | null>} サイト設定オブジェクト。ドキュメントが存在しない場合は null。
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    const db = getAdminDb();
    const docRef = db.collection('settings').doc('site_config');
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      logger.warn('サイト設定ドキュメント /settings/site_config が見つかりません。');
      return null;
    }
    
    // as SiteSettings を使って型キャストする
    return docSnap.data() as SiteSettings;

  } catch (error) {
    logger.error('サイト設定の取得に失敗しました:', error);
    return null;
  }
}
