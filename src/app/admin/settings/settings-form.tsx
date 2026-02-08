/**
 * サイト設定フォーム（クライアントコンポーネント）
 */
'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import type { SiteSettings } from '@/lib/settings';
import { updateSettingsAction, type SettingsFormState } from './actions';
import { Loader2 } from 'lucide-react';

/**
 * 送信ボタン
 */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="admin-btn admin-btn--primary" disabled={pending}>
      {pending ? (
        <>
          <Loader2 size={16} className="loading-spin" />
          <span>保存中...</span>
        </>
      ) : (
        '設定を保存'
      )}
    </button>
  );
}

interface SettingsFormProps {
  initialSettings: SiteSettings | null;
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const initialState: SettingsFormState = { status: 'idle', message: '' };
  const [state, formAction] = useActionState(updateSettingsAction, initialState);

  // サーバーアクションの完了後、通知メッセージを一定時間で消す
  useEffect(() => {
    if (state.status !== 'idle') {
      const timer = setTimeout(() => {
        // このコンポーネントでは状態を直接リセットせず、
        // ユーザーの次の操作に備える（メッセージが残っていても操作は可能）
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  // デフォルト値が null の場合のフォールバック
  const settings = initialSettings || {};

  return (
    <form action={formAction}>
      {/* フォーム送信結果の通知 */}
      {state.message && (
        <div 
          className={`admin-notice ${state.status === 'success' ? 'admin-notice--success' : 'admin-notice--error'}`}
          style={{ marginBottom: '1.5rem' }}
        >
          <p>{state.message}</p>
        </div>
      )}

      {/* --- 基本設定 --- */}
      <h2 className="admin-section-title">基本設定</h2>
      <div className="admin-form-group">
        <label htmlFor="siteName">サイト名</label>
        <input type="text" id="siteName" name="siteName" className="admin-form-input" defaultValue={settings.siteName} />
        <small>サイトのヘッダーなどに表示されます。</small>
      </div>

      <div className="admin-form-group">
        <label htmlFor="siteDescription">サイトの概要説明 (Markdown)</label>
        <textarea id="siteDescription" name="siteDescription" className="admin-form-input" rows={5} defaultValue={settings.siteDescription}></textarea>
        <small>トップページなどに表示される、サイト全体の紹介文です。</small>
      </div>

      <div className="admin-form-group">
        <label htmlFor="guideContent">ご利用ガイド (Markdown)</label>
        <textarea id="guideContent" name="guideContent" className="admin-form-input" rows={15} defaultValue={settings.guideContent}></textarea>
        <small>「ご利用ガイド」ページに表示される内容です。</small>
      </div>
      
      {/* --- SEO設定 --- */}
      <h2 className="admin-section-title">SEO設定</h2>
      <div className="admin-form-group">
        <label htmlFor="metaTitle">トップページのmeta title</label>
        <input type="text" id="metaTitle" name="metaTitle" className="admin-form-input" defaultValue={settings.metaTitle} />
      </div>

      <div className="admin-form-group">
        <label htmlFor="metaDescription">トップページのmeta description</label>
        <textarea id="metaDescription" name="metaDescription" className="admin-form-input" rows={3} defaultValue={settings.metaDescription}></textarea>
      </div>
      
      {/* --- 法務ページ設定 --- */}
      <h2 className="admin-section-title">ページコンテンツ設定</h2>
      <div className="admin-form-group">
        <label htmlFor="legalCommerceContent">特定商取引法に基づく表記</label>
        <textarea id="legalCommerceContent" name="legalCommerceContent" className="admin-form-input" rows={15} defaultValue={settings.legalCommerceContent}></textarea>
      </div>
      
      <div className="admin-form-group">
        <label htmlFor="privacyPolicyContent">プライバシーポリシー</label>
        <textarea id="privacyPolicyContent" name="privacyPolicyContent" className="admin-form-input" rows={15} defaultValue={settings.privacyPolicyContent}></textarea>
      </div>

      <div className="admin-form-group">
        <label htmlFor="termsOfServiceContent">利用規約</label>
        <textarea id="termsOfServiceContent" name="termsOfServiceContent" className="admin-form-input" rows={15} defaultValue={settings.termsOfServiceContent}></textarea>
      </div>

      {/* --- フッターと外部連携 --- */}
      <h2 className="admin-section-title">その他</h2>
      <div className="admin-form-group">
        <label htmlFor="copyright">フッターのコピーライト</label>
        <input type="text" id="copyright" name="copyright" className="admin-form-input" defaultValue={settings.copyright} />
        <small>例: © 2024 My Recycle Shop. All Rights Reserved.</small>
      </div>

      <div className="admin-form-group">
        <label htmlFor="gtmId">Google Tag Manager ID</label>
        <input type="text" id="gtmId" name="gtmId" className="admin-form-input" defaultValue={settings.gtmId} placeholder="GTM-XXXXXXX" />
        <small>GTMの管理画面で確認できるコンテナIDを入力してください（例: GTM-XXXXXXX）。空欄の場合、GTMは無効になります。</small>
      </div>

      <div className="admin-form-actions">
        <SubmitButton />
      </div>
    </form>
  );
}
