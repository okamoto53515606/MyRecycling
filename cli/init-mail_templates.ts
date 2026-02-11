/**
 * CLI: メールテンプレート初期化コマンド
 *
 * Firestoreのmail_templatesコレクションに初期データを投入します。
 *
 * 【使い方】
 * npx ts-node cli/init-mail_templates.ts
 *
 * 【セキュリティ】
 * 本番環境 (NODE_ENV=production) では実行できません。
 */
import 'dotenv/config';
import { getAdminDb } from '../src/lib/firebase-admin';

// 本番環境での実行を防止
if (process.env.NODE_ENV === 'production') {
  console.error('エラー: このスクリプトは本番環境では実行できません。');
  process.exit(1);
}

// --- メールテンプレート定義 ---

const mailTemplates = [
  {
    id: 'authorized_mail',
    subject: '【{productName}】ご注文を受け付けました',
    body: `{buyerDisplayName} 様

ご注文いただきありがとうございます。

■ご注文内容
商品名: {productName}
金額: {price}円
受け渡し場所: {meetingLocationName}
受け渡し希望日時: {meetingDatetime}

※ご注意
受け渡し日時はこの時点ではまだ確定ではありません。
日時の調整が必要な場合、運営者から連絡があります。

詳細はマイページにてご確認ください。
https://myrecycling.okamomedia.tokyo/mypage/orders/{id}
`,
    ccEmail: '【要設定】運営者メールアドレス',
  },
  {
    id: 'approved_mail',
    subject: '【{productName}】ご注文が確定しました',
    body: `{buyerDisplayName} 様

ご注文が確定しました。

■ご注文内容
商品名: {productName}
金額: {price}円
受け渡し場所: {meetingLocationName}
受け渡し日時: {meetingDatetime}

当日、指定の場所で商品をお受け取りください。

詳細はマイページにてご確認ください。
https://myrecycling.okamomedia.tokyo/mypage/orders/{id}
`,
    ccEmail: '',
  },
  {
    id: 'canceled_mail',
    subject: '【{productName}】ご注文がキャンセルされました',
    body: `{buyerDisplayName} 様

ご注文がキャンセルされました。

■キャンセルされた注文
商品名: {productName}
金額: {price}円

またのご利用をお待ちしております。

詳細はマイページにてご確認ください。
https://myrecycling.okamomedia.tokyo/mypage/orders/{id}
`,
    ccEmail: '',
  },
  {
    id: 'refund_requested_mail',
    subject: '【返品依頼】{productName}',
    body: `返品依頼がありました。

■注文情報
商品名: {productName}
金額: {price}円
購入者: {buyerDisplayName}
購入者メールアドレス: {buyerEmail}

■返品理由
{refundRequestReason}

■返品時の受け渡し希望
場所: {refundMeetingLocationName}
日時: {refundMeetingDatetime}

管理画面で対応してください。
`,
    ccEmail: '',
  },
];

/**
 * データをFirestoreに書き込むメイン関数
 */
const initializeMailTemplates = async () => {
  try {
    console.log('Firestoreに接続中...');
    const db = getAdminDb();
    const batch = db.batch();

    const collectionRef = db.collection('mail_templates');
    mailTemplates.forEach((template) => {
      const docRef = collectionRef.doc(template.id);
      batch.set(docRef, {
        subject: template.subject,
        body: template.body,
        ccEmail: template.ccEmail,
      });
    });
    console.log(`-> mail_templates の初期データ (${mailTemplates.length}件) を準備しました。`);

    console.log('\nFirestoreへの書き込みを実行中...');
    await batch.commit();

    console.log('\n✅ 成功しました！');
    console.log('Firestoreのmail_templatesコレクションに初期データを投入しました。');
    console.log('\n⚠️  注意: authorized_mailのccEmailを実際のメールアドレスに変更してください。');

  } catch (error: any) {
    console.error('エラーが発生しました:', error.message);
    process.exit(1);
  }
};

initializeMailTemplates();
