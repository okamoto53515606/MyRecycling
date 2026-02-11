/**
 * メールテンプレート管理ページ（管理画面）
 *
 * @description
 * 注文ステータスに応じて送信するメールのテンプレートを管理します。
 */

import { getMailTemplates } from './actions';
import MailTemplatesForm from './mail-templates-form';

export default async function MailTemplatesPage() {
  const templates = await getMailTemplates();

  return (
    <>
      <header className="admin-page-header">
        <h1>メールテンプレート管理</h1>
        <p>注文ステータスに応じて送信するメールの件名・本文を編集できます。</p>
      </header>

      <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
        <h2>プレースホルダーについて</h2>
        <p>件名・本文には、注文情報を挿入するためのプレースホルダーを使用できます。</p>
        <p>
          例: <code>{'https://myrecycling.okamomedia.tokyo/mypage/orders/{id}'}</code>
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          主なプレースホルダー: <code>{'{id}'}</code>, <code>{'{productName}'}</code>, <code>{'{price}'}</code>, <code>{'{buyerDisplayName}'}</code>, <code>{'{meetingLocationName}'}</code>, <code>{'{meetingDatetime}'}</code>
        </p>
      </div>

      <MailTemplatesForm templates={templates} />
    </>
  );
}
