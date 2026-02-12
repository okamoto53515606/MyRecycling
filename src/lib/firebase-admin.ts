/**
 * Firebase Admin SDK 初期化
 * サーバーサイド（API Routes, Webhook など）で使用
 * 
 * 【提供する機能】
 * - getAdminDb(): Firestore インスタンス
 * - getAdminAuth(): Auth インスタンス（セッション管理用）

 * 
 * 注意: クライアントサイドでは src/lib/firebase.ts を使用
 */
import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App | undefined;
let adminDb: Firestore | undefined;
let adminAuth: Auth | undefined;

const ADMIN_APP_NAME = 'admin-with-credentials';

// 本番環境ではデバッグログを出力しない
const isDev = process.env.NODE_ENV !== 'production';
const debugLog = (...args: unknown[]) => { if (isDev) console.log(...args); };

function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const apps = getApps();
  const hasServiceAccountKey = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  debugLog('[Admin SDK] FIREBASE_SERVICE_ACCOUNT_KEY exists:', hasServiceAccountKey);
  debugLog('[Admin SDK] Existing apps count:', apps.length);
  debugLog('[Admin SDK] Existing app names:', apps.map(a => a.name).join(', '));
  
  // サービスアカウントキーがある場合
  if (hasServiceAccountKey) {
    // 既に admin-with-credentials という名前のアプリがあれば、それを使用
    const existingAdminApp = apps.find(app => app.name === ADMIN_APP_NAME);
    if (existingAdminApp) {
      debugLog('[Admin SDK] Reusing existing app:', ADMIN_APP_NAME);
      adminApp = existingAdminApp;
      return adminApp;
    }
    
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
      
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      
      debugLog('[Admin SDK] Service account email:', serviceAccount.client_email);
      
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET; //【追加】
      
      // 既存のアプリがある場合は別名で、ない場合はデフォルトで初期化
      const appConfig = {
        credential: cert(serviceAccount),
        projectId,
        storageBucket, //【追加】
      };

      if (apps.length > 0) {
        adminApp = initializeApp(appConfig, ADMIN_APP_NAME);
        debugLog('[Admin SDK] Initialized NEW app with name:', ADMIN_APP_NAME);
      } else {
        adminApp = initializeApp(appConfig);
        debugLog('[Admin SDK] Initialized default app with service account key');
      }
      
      return adminApp;
    } catch (error) {
      console.error('[Admin SDK] Failed to initialize with service account:', error);
      throw error;
    }
  }
  
  // サービスアカウントキーがない場合（ローカル開発で gcloud ADC を使用）
  const appConfig = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, //【追加】
  };

  if (apps.length > 0) {
    adminApp = apps[0];
    debugLog('[Admin SDK] Using existing app with default credentials');
  } else {
    adminApp = initializeApp(appConfig);
    debugLog('[Admin SDK] Initialized with default credentials');
  }

  return adminApp;
}

export function getAdminDb(): Firestore {
  if (adminDb) {
    return adminDb;
  }
  
  const app = getAdminApp();
  adminDb = getFirestore(app);
  return adminDb;
}


export function getAdminAuth(): Auth {
  if (adminAuth) {
    return adminAuth;
  }
  
  const app = getAdminApp();
  adminAuth = getAuth(app);
  return adminAuth;
}
