/**
 * CLI: サイト設定初期化コマンド
 *
 * Firestoreの各コレクションに初期データを投入します。
 * - settings
 * - meeting_locations
 * - available_weekdays
 * - available_times
 * - unavailable_dates
 *
 * 【使い方】
 * npm run init-settings
 *
 * 【セキュリティ】
 * 本番環境 (NODE_ENV=production) では実行できません。
 */
import 'dotenv/config';
import { getAdminDb } from '../src/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// 本番環境での実行を防止
if (process.env.NODE_ENV === 'production') {
  console.error('エラー: このスクリプトは本番環境では実行できません。');
  process.exit(1);
}

// --- 以下に設定値を定義 ---

const FIXED_DATE = '2026-02-08';
const FIXED_YEAR = '2026';
const FIXED_TIMESTAMP = Timestamp.fromDate(new Date('2026-02-08T00:00:00Z'));

// 1. settingsコレクション
const siteConfig = {
  siteName: 'okamoのリサイクル',
  siteDescription: `
### 東京都国立市近辺にお住まいの方向けの小さなリサイクルサービスです

このサイトは、まだ使えるけれど自分では使わなくなったモノを、必要としている人へ繋ぐための場所です。

#### ご利用の流れ

1.  気になる商品を見つけたら、受け取りたい日時と場所を選んで注文します。この時点では注文確定待ちの状態です。
2.  日時の調整が必要な場合、運営者から連絡があります。日時確定後、指定のメールアドレスに注文確定済のメールが届きます。
3.  当日、指定の場所で商品を受け取ります。
4.  商品の引き渡し後に運営者が決済を確定します。

#### お支払いのタイミング

**実際の商品を見てから判断できるので安心です。**
お支払いは、商品の引き渡し後に確定します。

#### 受け渡し場所

- [くにたち北市民プラザのロビー](https://www.city.kunitachi.tokyo.jp/soshiki/Dept05/Div01/Sec01/gyomu/shisetsu/0502/1463551230361.html)
- [国立駅南口すぐの旧国立駅舎](https://www.city.kunitachi.tokyo.jp/kyukunitachiekisha_specialsite/index.html)

いずれも、誰でも気兼ねなく利用できる公共のスペースです。

#### 返品・キャンセルについて

万が一、商品に満足いただけなかった場合でもご安心ください。
**商品の引き渡し後、14日以内であれば返品・全額返金**を承ります。
`.trim(),
  metaTitle: 'okamoのリサイクル | 国立市周辺での手渡しリサイクル',
  metaDescription: '国立市周辺（くにたち北市民プラザ、旧国立駅舎）で直接会って品物を受け渡す、小さなリサイクルサービス。安心して取引できます。',
  copyright: `© ${FIXED_YEAR} okamoのリサイクル. All Rights Reserved.`,
  guideContent: '作成中',
  gtmId: '', // 例: GTM-XXXXXXX

  // 特定商取引法に基づく表記
  legalCommerceContent: `
## 販売業者

【要書き換え】屋号

## 運営統括責任者

【要書き換え】氏名

## 所在地

【要書き換え】住所

## 電話番号

【要書き換え】電話番号

## メールアドレス

【要書き換え】お問い合わせ用メールアドレス

## 販売価格

各商品ページに記載の金額

## 追加手数料

なし

## 支払方法

クレジットカード（VISA、Mastercard、American Express、JCB）
※決済はStripe社のシステムを利用します。

## 支払時期

商品の引き渡し後に決済が確定します。
（注文時には、クレジットカードの与信枠確保のみが行われます）

## 商品の引渡時期

注文時に指定された日時に、指定の場所で手渡しします。

## 返品・キャンセルについて

### 1. 引き渡し前のキャンセル

注文後、商品の引き渡し前であれば、マイページからいつでも無料でキャンセル可能です。費用は一切かかりません。

### 2. 引き渡し後の返品

商品引き渡しから14日以内であれば、理由を問わず返品を受け付けます。ただし、返品時の受け渡し場所は指定場所（国立周辺）に限ります。
返金は、ご利用のクレジットカード経由で行われます。
`.trim(),

  // プライバシーポリシー
  privacyPolicyContent: `
okamoのリサイクル（以下「当サイト」）は、当サイトが提供するサービス（以下「本サービス」）における、ユーザーの個人情報の取り扱いについて、以下のとおりプライバシーポリシーを定めます。

## 1. 収集する情報

当サイトは、本サービスの提供にあたり、以下の情報を収集します。

- **Googleアカウント情報**: メールアドレス、表示名、プロフィール画像URL
- **注文情報**: 注文日時、商品情報、指定された受け渡し場所・日時
- **決済関連情報**: Stripeが発行する決済ID（クレジットカード番号自体は当サイトで保持しません）
- **アクセス情報**: IPアドレス（不正利用防止のため）

## 2. 情報の利用目的

収集した情報は、以下の目的で利用します。

- 本サービスの提供および運営（商品の受け渡し等）
- ユーザーからのお問い合わせへの対応
- 利用規約に違反する行為への対応
- サービスの改善および新機能の開発

## 3. 第三者提供

当サイトは、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。

- ユーザーの同意がある場合
- 法令に基づく場合
- 人の生命、身体または財産の保護のために必要がある場合

## 4. 外部サービスの利用

当サイトでは、以下の外部サービスを利用しています。

### Firebase（Google LLC）

認証およびデータ管理に使用しています。
- [Googleのプライバシーポリシー](https://policies.google.com/privacy)

### Google Analytics（Google LLC）

当サイトでは、サービス向上のためGoogle Analytics 4を使用しています。Google Analyticsは、Cookieを使用してアクセス情報（閲覧ページ、滞在時間、デバイス情報、おおよその地域等）を収集します。収集されたデータはGoogle社（米国）のサーバーで処理されます。なお、このデータは個人を特定する情報と紐づけておりません。
- [Googleのプライバシーポリシー](https://policies.google.com/privacy)
- [Google Analyticsのデータ収集について](https://support.google.com/analytics/answer/12017362)

## 5. 決済業務の外部委託および外国へのデータ移転について

当サイトは、サービス料金の決済のために、Stripe, Inc.（米国）の決済代行サービスを利用しています。決済処理のため、メールアドレス、決済金額等の情報を同社へ提供します。

### (1) 提供先

Stripe, Inc.（アメリカ合衆国カリフォルニア州）

### (2) 提供先における個人情報の保護措置

同社はOECDプライバシーガイドライン8原則に対応する措置を講じています。

### (3) 詳細情報

- [Stripeプライバシーセンター](https://stripe.com/jp/privacy)

なお、クレジットカード番号等の機密情報は、Stripe社が管理しており、当サイトでは保持しません。

## 6. セキュリティ

当サイトは、個人情報の漏洩、滅失、毀損を防止するため、通信の暗号化（HTTPS）など適切なセキュリティ対策を講じています。

## 7. 退会（アカウント削除）時のデータ取り扱い

ユーザーが退会（アカウント削除）された場合、以下のとおりデータを取り扱います。

### (1) 削除されるデータ

- アカウント情報（メールアドレス、表示名、プロフィール画像URL）

### (2) 保持されるデータ

- 注文履歴（会計・税務上の理由により、法定期間保持します）

## 8. お問い合わせ

個人情報の取り扱いに関するお問い合わせは、以下までご連絡ください。
メールアドレス: 【要書き換え】連絡先メールアドレス

## 9. 改定

当サイトは、必要に応じて本ポリシーを改定することがあります。重要な変更がある場合は、サイト上でお知らせします。

制定日: 【要書き換え】YYYY年MM月DD日
`.trim(),

  // 利用規約
  termsOfServiceContent: `
この利用規約（以下「本規約」）は、okamoのリサイクル（以下「当サイト」）が提供するサービス（以下「本サービス」）の利用条件を定めるものです。

## 第1条（適用）

本規約は、ユーザーと当サイトとの間の本サービスの利用に関わる一切の関係に適用されます。

## 第2条（利用登録）

本サービスの利用を希望する方は、Googleアカウントによる認証をもって利用登録を行うものとします。

## 第3条（取引の流れ）

1.  ユーザーは商品を選択し、希望する受け渡し日時と場所を指定して注文します。
2.  注文時、クレジットカードの与信枠が確保されます（オーソリ）。この時点では決済は確定しません。
3.  日時の調整が必要な場合、運営者から連絡があります。日時確定後、指定のメールアドレスに注文確定済のメールが届きます。
4.  指定の日時・場所で商品の受け渡しを行います。
5.  商品の受け渡し後、運営者が決済を確定し、代金が支払われます。

## 第4条（キャンセル・返品）

1.  **受け取り前のキャンセル**: ユーザーは、商品の受け取り前であれば、マイページからいつでも注文をキャンセルできます。キャンセルに伴う費用は発生しません。
2.  **受け取り後の返品**: 商品の受け取り後、14日以内に当サイト所定の方法で連絡があった場合に限り、返品・返金を受け付けます。ただし、返品時の受け渡し場所は指定場所（国立周辺）に限ります。返金は、ご利用のクレジットカード経由で行われます。

## 第5条（禁止事項）

ユーザーは、以下の行為をしてはなりません。
- 法令または公序良俗に違反する行為
- 虚偽の情報で登録、注文する行為
- 正当な理由なく商品の受け取りを拒否する行為
- 他のユーザーや当サイトに不利益、損害を与える行為

## 第6条（免責事項）

- 当サイトは、商品の完全性、正確性を保証するものではありません。取引はユーザー自身の責任で行うものとします。
- 通信回線やコンピュータの障害によるシステムの中断・遅滞・中止・データの消失、データへの不正アクセスにより生じた損害、その他本サービスに関してユーザーに生じた損害について、当サイトは一切責任を負わないものとします。

## 第7条（本サービスの変更・終了）

当サイトは、ユーザーに通知することなく、本サービスの内容を変更し、または本サービスの提供を終了することができるものとします。

## 第8条（準拠法・管轄裁判所）

本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、東京地方裁判所を第一審の専属的合意管轄とします。

制定日: 【要書き換え】YYYY年MM月DD日
`.trim(),
};

// 2. meeting_locationsコレクション
const meetingLocations = [
  {
    name: 'くにたち北市民プラザのロビー',
    description: `
北市民プラザのロビーは施設の利用に関係なくどなたでも利用できます。ちょっとした打ち合わせや、お仕事や勉強の他、休憩スペースとして利用可能な場所です。
[詳細はこちら](https://www.city.kunitachi.tokyo.jp/soshiki/Dept05/Div01/Sec01/gyomu/shisetsu/0502/1463551230361.html)

**住所**
東京都国立市北3-1-1 9号棟1階
（国立市コミュニティバス「くにっこ」北ルート、北西中ルート「北市民プラザ」バス停すぐ）
`.trim(),
    googleMapEmbedURL: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3240.0912530491673!2d139.43016671051106!3d35.69937197246706!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6018e15895322525%3A0xc8770d975829e351!2z5Zu956uL5biC5b255omAIOOBj-OBq-OBn-OBoeWMl-W4guawkeODl-ODqeOCtg!5e0!3m2!1sja!2sjp!4v1770549114000!5m2!1sja!2sjp" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
    order: 1,
  },
  {
    name: '国立駅南口すぐの旧国立駅舎',
    description: `
旧国立駅舎は、JR国立駅南口すぐにある赤い三角屋根のランドマークで、誰でも気軽に立ち寄れる「憩いの場」や「待ち合わせ場所」として最適です。館内には懐かしい旧改札の展示や、木の温もりを感じるベンチがあり、まち案内所や展示室、ピアノも設置されています。
[詳細はこちら](https://www.city.kunitachi.tokyo.jp/kyukunitachiekisha_specialsite/index.html)
`.trim(),
    googleMapEmbedURL: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3240.1072507928325!2d139.4440410105111!3d35.69897827246712!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6018e5235175535d%3A0x5cf4c0c58590e7c5!2z5pen5Zu956uL6aeF6IiO!5e0!3m2!1sja!2sjp!4v1770549350614!5m2!1sja!2sjp" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
    order: 2,
  },
];

// 3. available_weekdaysコレクション
const availableWeekdays = [
  { id: 'sun', isAvailable: true, order: 0 },
  { id: 'mon', isAvailable: false, order: 1 },
  { id: 'tue', isAvailable: false, order: 2 },
  { id: 'wed', isAvailable: false, order: 3 },
  { id: 'thu', isAvailable: false, order: 4 },
  { id: 'fri', isAvailable: false, order: 5 },
  { id: 'sat', isAvailable: true, order: 6 },
];

// 4. available_timesコレクション
const availableTimes = [
  '10:00', '10:30', '11:00', '11:30',
  '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:30', '17:00'
].map(time => ({ time }));


// 5. unavailable_datesコレクション
const unavailableDates = [
  '2026-12-30',
  '2026-12-31',
  '2027-01-01',
  '2027-01-02',
  '2027-01-03'
].map(dateStr => ({ date: Timestamp.fromDate(new Date(dateStr)) }));


/**
 * データをFirestoreに書き込むメイン関数
 */
const initializeFirestoreData = async () => {
  try {
    console.log('Firestoreに接続中...');
    const db = getAdminDb();
    const batch = db.batch();

    // 1. settings
    const settingsRef = db.collection('settings').doc('site_config');
    batch.set(settingsRef, {
      ...siteConfig,
      updatedAt: FIXED_TIMESTAMP,
    });
    console.log('-> settings の初期データを準備しました。');

    // 2. meeting_locations
    const locationsCollectionRef = db.collection('meeting_locations');
    meetingLocations.forEach((location) => {
      const docRef = locationsCollectionRef.doc(); // 自動ID
      batch.set(docRef, location);
    });
    console.log(`-> meeting_locations の初期データ (${meetingLocations.length}件) を準備しました。`);

    // 3. available_weekdays
    const weekdaysCollectionRef = db.collection('available_weekdays');
    availableWeekdays.forEach((weekday) => {
        const docRef = weekdaysCollectionRef.doc(weekday.id);
        batch.set(docRef, { isAvailable: weekday.isAvailable, order: weekday.order });
    });
    console.log(`-> available_weekdays の初期データ (${availableWeekdays.length}件) を準備しました。`);

    // 4. available_times
    const timesCollectionRef = db.collection('available_times');
    availableTimes.forEach((time) => {
        const docRef = timesCollectionRef.doc(); // 自動ID
        batch.set(docRef, time);
    });
    console.log(`-> available_times の初期データ (${availableTimes.length}件) を準備しました。`);

    // 5. unavailable_dates
    const unavailableDatesCollectionRef = db.collection('unavailable_dates');
    unavailableDates.forEach((date) => {
        const docRef = unavailableDatesCollectionRef.doc(); // 自動ID
        batch.set(docRef, date);
    });
    console.log(`-> unavailable_dates の初期データ (${unavailableDates.length}件) を準備しました。`);


    console.log('\nFirestoreへの書き込みを実行中...');
    await batch.commit();

    console.log('\n✅ 成功しました！');
    console.log("Firestoreの各コレクションに初期データを投入しました。");

  } catch (error: any) {
    console.error('エラーが発生しました:', error.message);
    process.exit(1);
  }
};

initializeFirestoreData();
