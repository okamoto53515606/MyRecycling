/**
 * 管理者認証ユーティリティ
 * 
 * 管理者権限とIPアドレスの両方をチェックする共通関数を提供します。
 * Server Actions内で使用します。
 */

import { headers } from 'next/headers';
import { getUser } from './auth';
import { logger } from './env';

export interface AdminAccessResult {
  isAllowed: boolean;
  error?: string;
  uid?: string;
}

/**
 * 管理者アクセスをチェックする
 * 
 * 1. 管理者ロールチェック（Firebase Custom Claims）
 * 2. IPアドレスチェック（環境変数 ALLOWED_IP_ADDRESSES_FOR_THE_ADMIN_PAGE）
 * 
 * @returns アクセス可否と、拒否された場合のエラーメッセージ
 */
export async function checkAdminAccess(): Promise<AdminAccessResult> {
  // 1. 管理者ロールチェック
  const user = await getUser();
  if (user.role !== 'admin') {
    logger.warn('[checkAdminAccess] 管理者権限がありません');
    return { isAllowed: false, error: '管理者権限がありません。' };
  }

  // 2. IPアドレスチェック
  const allowedIpsString = process.env.ALLOWED_IP_ADDRESSES_FOR_THE_ADMIN_PAGE;
  
  // 環境変数が設定されていない場合はIPチェックをスキップ（開発環境向け）
  if (!allowedIpsString) {
    return { isAllowed: true, uid: user.uid };
  }

  const allowedIps = allowedIpsString.split(' ').filter(ip => ip.trim() !== '');
  
  // 有効なIPが設定されていない場合もスキップ
  if (allowedIps.length === 0) {
    return { isAllowed: true, uid: user.uid };
  }

  // リクエストヘッダーからIPアドレスを取得
  const headersList = await headers();
  const requestIp = headersList.get('x-fah-client-ip') || '0.0.0.0';

  // IPアドレスチェック
  if (!allowedIps.includes(requestIp)) {
    logger.warn(`[checkAdminAccess] 許可されていないIPアドレス: ${requestIp}`);
    return { isAllowed: false, error: 'このIPアドレスからのアクセスは許可されていません。' };
  }

  return { isAllowed: true, uid: user.uid };
}

/**
 * 管理者アクセスをチェックし、拒否された場合はエラーをスローする
 * 
 * redirect() を使用するアクションで使用
 */
export async function requireAdminAccess(): Promise<string> {
  const result = await checkAdminAccess();
  if (!result.isAllowed) {
    throw new Error(result.error);
  }
  return result.uid!;
}
