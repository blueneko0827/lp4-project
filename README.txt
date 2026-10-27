パラブルエージェント ホテル・宿泊 LP
=====================================

■ ファイル構成
  index.html      LP本体（5画面ステップ式フォーム）
  thanks.html     送信完了ページ（Web-to-Lead の retURL）
  privacy.html    個人情報保護方針（クライアント支給の原稿）
  terms.html      利用規約（クライアント支給の原稿）
  css/hotel.css   スタイル
  js/hotel.js     フォーム制御・gclid/UTM保持・ポップアップ
  img/            ロゴ（logo.png）・FV写真の置き場（img/README_images.txt 参照）

■ 設置先
  さくらのレンタルサーバ：ドメイン新規追加で hotel.parableagent.com（公開フォルダ ~/www/hotel）
  → SSL（無料SSL）を有効化 → 上記ファイルを ~/www/hotel にアップロード

■ Salesforce 送信項目（Web-to-Lead）
  oid                 00D2x0000075l4j
  retURL              https://hotel.parableagent.com/thanks.html
  recordType          0122x000000he0w   ← 看護師LPと同じ。ホテル用を分ける場合は差し替え【要確認】
  00NBL000000OKpf     HOTEL-LP1（LP名）
  Q1 希望職種         00NQ900000hT8Sr（新規・複数選択）
  Q3 雇用形態         00NBL000000OLIm（既存・選択肢追加が必要）
  Q4 転居可否         00NQ900000hT70X（新規）
  Q5 希望勤務地       00NQ900000hT90j（新規・複数選択）
  Q6 時期             00N2x000008eoMP（既存・選択肢追加が必要）
  Q7 お仕事のご状況   00NQ900000dKio1（既存・選択肢追加が必要）
  Q8 郵便番号/住所    zip / state / city
  Q9 氏名             last_name / first_name
  Q10 生まれ年        00NQ9000003vidi（＋ 00N2x000008eoLl にも転記：lp4と同じ）
  Q11 電話            mobile
  Q12 メール（任意）  email
  広告パラメータ      gclid 00NQ900000bVnf3 / gbraid 00NQ900000bY0jR / wbraid 00NQ900000bY14P
                      utm_source 00NQ90000034Ln4 / utm_medium 00NQ90000034Ln3 / utm_campaign 00NQ90000034Ln1
                      utm_term 00NQ90000034Ln5 / utm_content 00NQ90000034Ln2
  ※ gclid等は初回アクセス時に90日間保持（URL → 保存値 → _gcl_aw クッキーの順で取得）

■ 設定済み
  ・GTM：GTM-PTF8NCDS（index.html / thanks.html）
  ・有料職業紹介事業 許可番号：13-ユ-311336
  ・ポップアップのLINE相談先：https://line.me/R/ti/p/@449ggrbq（js/hotel.js の CONFIG.lineUrl）
  ・ロゴ：img/logo.png（PARABLE AGENT ロゴ＋「ホテル・宿泊」ラベル）
  ・利用規約・個人情報保護：LP内の terms.html / privacy.html にリンク

■ 公開前に残っている作業
  1. Salesforce：既存3項目（雇用形態・時期・お仕事のご状況）にホテル用の選択肢を追加
     （値・レコードタイプの選択肢にも追加。綴りが違うとリードが作成されません）
  2. FV写真（img/fv-hotel.jpg。無い場合はベルのイラストを表示）
  3. 原稿（FV・選ばれる理由・FAQ）のクライアント確認

■ GTM の設定（コンテナ GTM-PTF8NCDS）
  1. Google タグ：タグID AW-633044713 ／ トリガー「Initialization - All Pages」
  2. コンバージョン リンカー ／ トリガー「All Pages」（gclid のクッキー保存に必要）
  3. Google 広告のコンバージョン トラッキング
       コンバージョンID 633044713 ／ コンバージョンラベル lacaCJDAh6sdE0n97a0C（要確認）
       トリガー：カスタムイベント「hotel_lp_thanks」
  ※ thanks.html は「フォームから実際に送信した時だけ」hotel_lp_thanks を1回送ります
    （直接アクセス・再読み込みでは送らないため、ページビューではなくカスタムイベントで計測）

■ テスト送信（コンバージョンから除外）
  URL の末尾に ?test=1 を付けて開き、送信してください。
  ・thanks.html では hotel_lp_thanks_test が送られ、コンバージョンは計測されません
  ・Salesforce のリードは utm_source = test になります（オフラインコンバージョンの取り込み対象外にする）
  ・同じタブ内では有効。通常の確認に戻す時はタブを閉じてください

■ 動作仕様
  ・各画面で必須未回答の場合は次へ進めません（エラー表示）
  ・希望職種は最大3つ（4つ目は選択不可）
  ・郵便番号7桁で住所自動補完。分からない場合は都道府県・市区町村を直接入力
  ・離脱防止ポップアップ：表示から30秒後、またはPCでカーソルが画面上端から外れた時に1回のみ
    （フォーム入力開始後・送信後は表示しない。ブラウザの「戻る」操作は妨げない）
  ・迷惑送信対策：非表示のダミー項目に入力があれば送信しない
  ・dataLayer イベント：hotel_lp_step（画面番号）/ hotel_lp_popup_show / hotel_lp_line_click / hotel_lp_submit / hotel_lp_thanks（テスト時は hotel_lp_thanks_test）

■ 公開後のテスト
  https://hotel.parableagent.com/?test=1&gclid=TEST123 で全項目を入力して送信
  → Salesforce のリードに全回答・gclid・utm_source=test・LP名 HOTEL-LP1 が入っているか確認
  → GTM のプレビューで hotel_lp_thanks_test が出て、コンバージョンタグが発火しないことを確認 → テストリードを削除
