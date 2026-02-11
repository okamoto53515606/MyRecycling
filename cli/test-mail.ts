/**
 * CLI: メール送信テストコマンド
 *
 * 環境変数に設定されたSMTP情報を使って、テストメールを送信します。
 *
 *【使い方】
 * npm run test-mail -- <宛先メールアドレス>
 *
 *【例】
 * npm run test-mail -- test@example.com
 *
 *【必要な環境変数】
 * MY_MAIL_SMTP_HOST - SMTPサーバーホスト
 * MY_MAIL_SMTP_PORT - SMTPポート（465推奨）
 * MY_MAIL_SMTP_USER - SMTPユーザー名
 * MY_MAIL_SMTP_PASSWORD - SMTPパスワード
 * MY_MAIL_FROM - 送信元メールアドレス
 * MY_MAIL_FROM_NAME - 送信者名
 */
import 'dotenv/config'; // .envファイルを読み込む
import nodemailer from 'nodemailer';

// 宛先メールアドレスを引数から取得
const toEmail = process.argv[2];

if (!toEmail) {
  console.error('エラー: 宛先メールアドレスを引数に指定してください。');
  console.log('使用法: npm run test-mail -- <宛先メールアドレス>');
  console.log('例: npm run test-mail -- test@example.com');
  process.exit(1);
}

// 環境変数のチェック
const requiredEnvVars = [
  'MY_MAIL_SMTP_HOST',
  'MY_MAIL_SMTP_PORT',
  'MY_MAIL_SMTP_USER',
  'MY_MAIL_SMTP_PASSWORD',
  'MY_MAIL_FROM',
];

const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.error('エラー: 以下の環境変数が設定されていません:');
  missingVars.forEach((v) => console.error(`  - ${v}`));
  process.exit(1);
}

const sendTestMail = async (to: string) => {
  const host = process.env.MY_MAIL_SMTP_HOST!;
  const port = parseInt(process.env.MY_MAIL_SMTP_PORT!, 10);
  const user = process.env.MY_MAIL_SMTP_USER!;
  const password = process.env.MY_MAIL_SMTP_PASSWORD!;
  const from = process.env.MY_MAIL_FROM!;
  const fromName = process.env.MY_MAIL_FROM_NAME || '';

  console.log('📧 メール送信テストを開始します...');
  console.log(`  SMTPホスト: ${host}`);
  console.log(`  SMTPポート: ${port}`);
  console.log(`  送信元: ${fromName} <${from}>`);
  console.log(`  宛先: ${to}`);

  // SMTPトランスポートを作成
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // ポート465の場合はSSL/TLS
    auth: {
      user,
      pass: password,
    },
  });

  // 送信日時
  const now = new Date();
  const dateStr = now.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Tokyo',
  });

  // メール内容
  const mailOptions = {
    from: fromName ? `"${fromName}" <${from}>` : from,
    to,
    subject: `【テストメール】メール送信テスト - ${dateStr}`,
    text: `これはメール送信テストです。

このメールは、SMTPサーバーの設定確認のために送信されました。

■ 送信情報
送信日時: ${dateStr}
SMTPホスト: ${host}
SMTPポート: ${port}
送信元: ${from}
宛先: ${to}

このメールが正常に届いていれば、SMTP設定は正しく機能しています。

---
${fromName || 'メール送信テストシステム'}
`,
    html: `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>メール送信テスト</title>
</head>
<body style="font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">📧 メール送信テスト</h1>
  
  <p>これはメール送信テストです。</p>
  <p>このメールは、SMTPサーバーの設定確認のために送信されました。</p>
  
  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <h2 style="margin-top: 0; color: #1f2937;">■ 送信情報</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 5px 10px 5px 0; font-weight: bold;">送信日時:</td>
        <td style="padding: 5px 0;">${dateStr}</td>
      </tr>
      <tr>
        <td style="padding: 5px 10px 5px 0; font-weight: bold;">SMTPホスト:</td>
        <td style="padding: 5px 0;">${host}</td>
      </tr>
      <tr>
        <td style="padding: 5px 10px 5px 0; font-weight: bold;">SMTPポート:</td>
        <td style="padding: 5px 0;">${port}</td>
      </tr>
      <tr>
        <td style="padding: 5px 10px 5px 0; font-weight: bold;">送信元:</td>
        <td style="padding: 5px 0;">${from}</td>
      </tr>
      <tr>
        <td style="padding: 5px 10px 5px 0; font-weight: bold;">宛先:</td>
        <td style="padding: 5px 0;">${to}</td>
      </tr>
    </table>
  </div>
  
  <p style="color: #16a34a; font-weight: bold;">✅ このメールが正常に届いていれば、SMTP設定は正しく機能しています。</p>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #6b7280; font-size: 14px;">${fromName || 'メール送信テストシステム'}</p>
</body>
</html>
`,
  };

  try {
    // SMTP接続テスト
    console.log('\n🔌 SMTPサーバーに接続中...');
    await transporter.verify();
    console.log('✅ SMTPサーバーへの接続に成功しました。');

    // メール送信
    console.log('\n📤 メールを送信中...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('\n✅ メール送信に成功しました！');
    console.log(`  メッセージID: ${info.messageId}`);
    if (info.accepted.length > 0) {
      console.log(`  送信成功: ${info.accepted.join(', ')}`);
    }
    if (info.rejected.length > 0) {
      console.log(`  送信失敗: ${info.rejected.join(', ')}`);
    }

  } catch (error: any) {
    console.error('\n❌ エラーが発生しました:');
    console.error(`  ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 ヒント: SMTPサーバーに接続できません。ホスト名とポート番号を確認してください。');
    } else if (error.code === 'EAUTH') {
      console.error('\n💡 ヒント: 認証に失敗しました。ユーザー名とパスワードを確認してください。');
    } else if (error.code === 'ESOCKET') {
      console.error('\n💡 ヒント: ソケットエラーです。ポート番号とSSL設定を確認してください。');
    }
    
    process.exit(1);
  }
};

sendTestMail(toEmail);
