パラブルエージェント ホテル・宿泊 LP
=====================================
デザインは看護LP4（kango.tensyoku-garden.com/lp4/）と同じ構成・スタイルです。
css/reset.css・style_mini.css・lp4.css は LP4 のものをそのまま使用し、ホテル用の追加分だけを css/hotel.css に記載しています。

■ ファイル構成
  index.html      LP本体（最初の質問＋7画面のステップ式フォーム）
  thanks.html     送信完了ページ（Web-to-Lead の retURL）
  privacy.html    個人情報保護方針（クライアント支給の原稿）
  terms.html      利用規約（クライアント支給の原稿）
  css/            reset.css / style_mini.css / lp4.css（LP4と同じ）＋ hotel.css（ホテル用の追加）
  js/hotel.js     フォーム制御・gclid/UTM保持・ポップアップ（jQuery不要）
  img/            ロゴ・アドバイザー・木のイラスト等（img/README_images.txt 参照）

■ 設置先
  さくらのレンタルサーバ：ドメイン新規追加で hotel.parableagent.com（公開フォルダ ~/www/hotel）
  → SSL（無料SSL）を有効化 → 上記ファイルを ~/www/hotel にアップロード

■ フォームの流れ
  最初の質問  あなたのお気持ちは？（近いうちに転職したい／今は情報収集したい）→ 00NQ900000dKio1（LP4と同じ値）
  STEP1 希望職種（最大3つ）     00NQ900000hT8Sr（複数選択）
  STEP2 雇用形態               00NBL000000OLIm（選ぶと自動で次へ）
  STEP3 就業時期               00NBL000000OLJ1（LP3・LP4と同じ項目・同じ値。選ぶと自動で次へ）
  STEP4 希望勤務地＋転居可否    00NQ900000hT90j（複数選択）／ 00NQ900000hT70X
  STEP5 住所                   zip / state / city（郵便番号から自動入力）
  STEP6 お名前・生まれ年        last_name / first_name / 00NQ9000003vidi（＋ 00N2x000008eoLl にも転記：LP4と同じ）
  STEP7 電話・メール（任意）    mobile / email
  固定値  oid 00D2x0000075l4j ／ recordType 0122x000000he0w ／ LP名 00NBL000000OKpf = HOTEL-LP1
  広告    gclid 00NQ900000bVnf3 / gbraid 00NQ900000bY0jR / wbraid 00NQ900000bY14P
          utm_source 00NQ90000034Ln4 / utm_medium 00NQ90000034Ln3 / utm_campaign 00NQ90000034Ln1
          utm_term 00NQ90000034Ln5 / utm_content 00NQ90000034Ln2
  ※ gclid等は初回アクセス時に90日間保持（URL → 保存値 → _gcl_aw クッキーの順で取得）

■ 設定済み
  ・GTM：GTM-PTF8NCDS（index.html / thanks.html）
  ・有料職業紹介事業 許可番号：13-ユ-311336
  ・離脱防止ポップアップのLINE相談先：https://line.me/R/ti/p/@449ggrbq
  ・ロゴ：img/logo.png（PARABLE AGENT）
  ・利用規約・個人情報保護：LP内の terms.html / privacy.html

■ 公開前に残っている作業
  1. Salesforce：雇用形態（00NBL000000OLIm）に「正社員・契約社員・アルバイト・パート・こだわらない」を追加
     （値・レコードタイプの選択肢にも追加。綴りが違うとリードが作成されません）
     ※「就業時期」「お仕事のご状況」はLP3・LP4と同じ値を使うため、追加は不要です
  2. 写真（任意。無くても表示は崩れません）
       img/fv-hotel.png    FVの人物写真（背景透過、横700×縦1000px程度）→ 無い場合はベルのイラスト
       img/proof-hotel.jpg 「理想の働き方を実現」の写真（横1280×縦1024px程度）→ 無い場合は非表示
  3. 原稿（FV・選ばれる理由など）のクライアント確認

■ GTM の設定（コンテナ GTM-PTF8NCDS）
  1. Google タグ：タグID AW-633044713 ／ トリガー「Initialization - All Pages」
  2. コンバージョン リンカー ／ トリガー「All Pages」（gclid のクッキー保存に必要）
  3. Google 広告のコンバージョン トラッキング
       コンバージョンID 633044713 ／ コンバージョンラベル lacaCJDAh6sdE0n97a0C（要確認）
       トリガー：カスタムイベント「hotel_lp_thanks」
  ※ thanks.html は「フォームから実際に送信した時だけ」hotel_lp_thanks を1回送ります

■ テスト送信（コンバージョンから除外）
  URL の末尾に ?test=1 を付けて開き、送信してください。
  ・thanks.html では hotel_lp_thanks_test が送られ、コンバージョンは計測されません
  ・Salesforce のリードは utm_source = test になります
  ・同じタブ内では有効。通常の確認に戻す時はタブを閉じてください

■ 動作仕様
  ・各画面は必須項目が揃うまで「次へ進む」「送信」ボタンが押せません（LP4と同じ）
  ・希望職種は最大3つ（4つ目は選択不可）
  ・離脱防止ポップアップ：表示から30秒後、またはPCでカーソルが画面上端から外れた時に1回のみ
    （最初の質問の表示中・フォーム入力開始後・送信後は表示しない。ブラウザの「戻る」操作は妨げない）
  ・迷惑送信対策：非表示のダミー項目に入力があれば送信しない
  ・dataLayer イベント：hotel_lp_step0 / hotel_lp_step（画面番号）/ hotel_lp_popup_show / hotel_lp_line_click
                        / hotel_lp_submit / hotel_lp_thanks（テスト時は hotel_lp_thanks_test）

■ 公開後のテスト
  https://hotel.parableagent.com/?test=1&gclid=TEST123 で全項目を入力して送信
  → Salesforce のリードに全回答・gclid・utm_source=test・LP名 HOTEL-LP1 が入っているか確認
  → GTM のプレビューで hotel_lp_thanks_test が出て、コンバージョンタグが発火しないことを確認 → テストリードを削除
