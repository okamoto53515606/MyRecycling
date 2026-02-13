皆さん、こんにちは。okamoです。

私物のガレージセールシステムを開発したので、紹介させて下さい。

## 開発の経緯：メルカリは面倒、なら作ってしまおう(AIで)

子供のおもちゃ、ゲーム、衣類等、捨てるのはもったいないけれど、メルカリに出品するのは梱包や発送の手間がかかって面倒だと感じていました。

「近所の人に手渡しで譲れたら楽なのに…」

そう考えた私は、2月8日（日）にふとこのシステムの構想を思いつき、すぐに開発企画書を作成。その日のうちにFirebase studioを立ち上げ、Geminiと共に開発を開始しました。

## AIが全てのコードを書く：5日間の爆速開発録

このプロジェクトの最大の特徴は、**私がソースコードを一切書いていない**という点です。

私は開発企画書を作成し、開発担当のAI（GeminiやClaude）に指示を出し、上がってきた成果物にツッコミを入れるだけ。夜な夜な開発を進め、2月12日（木）の夜には開発が完了しました。

*   **構想開始:** 2/8（日）
*   **開発完了:** 2/12（木）
*   **Stripe審査通過:** 2/13（金）
*   **サイトオープン:** 2/13（金）

まさに爆速開発です。

開発の様子や具体的な指示内容は、GitHub上のプロンプト履歴やコミットログで全て公開しています。

*   [開発企画書（Blueprint）](https://github.com/okamoto53515606/MyRecycling/blob/main/docs/blueprint.md)
*   [コミットログ](https://github.com/okamoto53515606/MyRecycling/commits/main/)
*   [プロンプト履歴](https://github.com/okamoto53515606/MyRecycling/tree/main/prompt_history)

## 「okamoのリサイクル」システム機能ツアー

では、実際に完成したシステム「okamoのリサイクル」の機能と画面を見ていきましょう。

### 1. 利用者サイト（トップページ・商品一覧）

まず、トップページです。サイトの趣旨や利用の流れが簡潔に記載されています。

![トップページ](https://storage.googleapis.com/studio-4200137858-cfe20.firebasestorage.app/articles/8L047bkoMROOvV9vrhTgTObqKdO2/1770992241044-Top.png)

商品一覧には、不要になったおもちゃや教材を登録しています。画像付きで見やすく整理されています。

![商品一覧](https://storage.googleapis.com/studio-4200137858-cfe20.firebasestorage.app/articles/8L047bkoMROOvV9vrhTgTObqKdO2/1770992241484-ProductList.png)

### 2. ログインと注文プロセス

注文を行うにはログインが必要です。Googleアカウント認証を利用しているため、面倒なフォーム入力なしで安全にログインできます。

![ログインモーダル](https://storage.googleapis.com/studio-4200137858-cfe20.firebasestorage.app/articles/8L047bkoMROOvV9vrhTgTObqKdO2/1770992240618-LoginModal.png)

ログイン後、受け取りたい場所と日時を指定して注文を行います。場所については「詳細はこちら」から地図や施設情報を確認できるようにしました。

![注文確認画面](https://storage.googleapis.com/studio-4200137858-cfe20.firebasestorage.app/articles/8L047bkoMROOvV9vrhTgTObqKdO2/1770992240902-OrderConfirm.png)

例えば、受け渡し場所の一つである「旧国立駅舎」の情報はこのように表示されます。

![受け渡し場所の詳細](https://storage.googleapis.com/studio-4200137858-cfe20.firebasestorage.app/articles/8L047bkoMROOvV9vrhTgTObqKdO2/1770992241036-MeetingLocationModal.png)

### 3. 安心の決済フロー（Stripe連携）

決済にはStripeを導入しました。重要なポイントは、**注文時点では「与信枠の確保（オーソリ）」のみが行われる**という点です。

![Stripe決済画面](https://storage.googleapis.com/studio-4200137858-cfe20.firebasestorage.app/articles/8L047bkoMROOvV9vrhTgTObqKdO2/1770992240804-StripePayment.png)

注文が完了すると、まずは「注文内容を確認中」というステータスになります。

![注文完了画面](https://storage.googleapis.com/studio-4200137858-cfe20.firebasestorage.app/articles/8L047bkoMROOvV9vrhTgTObqKdO2/1770992240793-PaymentSuccess.png)

同時に、購入者には「注文を受け付けました」というメールが自動送信されます。

![注文受付メール](https://storage.googleapis.com/studio-4200137858-cfe20.firebasestorage.app/articles/8L047bkoMROOvV9vrhTgTObqKdO2/1770992241733-authorized_mail.png)

### 4. 運営者による承認と引き渡し

運営者（私）が注文を確認し、日時等に問題がなければ承認します。すると、購入者に「注文が確定しました」というメールが届きます。

![注文確定メール](https://storage.googleapis.com/studio-4200137858-cfe20.firebasestorage.app/articles/8L047bkoMROOvV9vrhTgTObqKdO2/1770992242023-approved_mail.png)

万が一、都合がつかない場合や、受け渡し前に購入者がキャンセルしたい場合は、キャンセル処理が可能です。この場合、与信枠が解放されるだけで請求は発生しません。

![キャンセルメール](https://storage.googleapis.com/studio-4200137858-cfe20.firebasestorage.app/articles/8L047bkoMROOvV9vrhTgTObqKdO2/1770992241917-canceled_mail.png)

無事に商品の引き渡しが完了した後、管理画面から「引き渡し完了」の処理を行うことで初めてクレジットカードの売上が確定し、領収書メールが送信されます。

![領収書メール](https://storage.googleapis.com/studio-4200137858-cfe20.firebasestorage.app/articles/8L047bkoMROOvV9vrhTgTObqKdO2/1770992240737-after_delivered_receipt.png)

## 管理者機能も充実

裏側の管理画面（運営者専用）もAIに作ってもらいました。

*   **商品管理:** 画像アップロード対応の追加・変更機能。
*   **受け渡し設定:** 場所、曜日、時間、NG日の登録機能。
*   **注文管理:** ステータス変更、キャンセル、返品処理。
*   **メール管理:** 件名や文面のテンプレート編集（プレースホルダー対応）。
*   **サイト基本設定:** SEO設定、利用規約、特商法表記の編集。

これら全ての機能を、コードを書かずに実装できたのは驚きです。

## 誰かの役に立つかも？ソースコードは全公開

あくまで私自身の不用品処分のために開発したシステムですが、「誰かの役に立つかも？」というほのかな願いから、ソースコードはGitHubで公開しています。

*   **GitHubリポジトリ:** [MyRecycling](https://github.com/okamoto53515606/MyRecycling)
*   **実際に運用中のサイト:** [okamoのリサイクル](https://myrecycling.okamomedia.tokyo)

FirebaseとStripeを使った個人開発のサンプルとして、あるいはプロンプトエンジニアリングの実例として、ぜひ参考にしてみてください。