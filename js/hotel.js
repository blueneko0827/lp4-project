/* パラブルエージェント ホテル・宿泊 LP
 * - 5画面のステップ式フォーム（Salesforce Web-to-Lead へ直接送信）
 * - gclid / gbraid / wbraid / UTM を保持して送信（lp4 と同じ項目ID）
 * - 離脱防止ポップアップは時間経過・PCのカーソル離脱で1回のみ（履歴操作は行わない）
 */
(function () {
  'use strict';

  /* ===== 設定 ===================================================== */
  var CONFIG = {
    popupDelayMs: 30000,          // 何ミリ秒後にポップアップを表示するか
    lineUrl: 'https://line.me/R/ti/p/@449ggrbq', // ポップアップのLINE相談先（空ならフォームへスクロール）
    trackingTtlDays: 90,          // 広告パラメータの保持期間
    testParam: 'test',            // ?test=1 で開くとテスト送信扱い（コンバージョン計測しない・utm_source=test）
    trackingFields: {             // Salesforce 項目ID（lp4 と共通）
      gclid: '00NQ900000bVnf3',
      gbraid: '00NQ900000bY0jR',
      wbraid: '00NQ900000bY14P',
      utm_source: '00NQ90000034Ln4',
      utm_medium: '00NQ90000034Ln3',
      utm_campaign: '00NQ90000034Ln1',
      utm_term: '00NQ90000034Ln5',
      utm_content: '00NQ90000034Ln2'
    }
  };

  var PREFS = [
    ['北海道・東北', ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県']],
    ['関東', ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県']],
    ['甲信越・北陸', ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県']],
    ['東海', ['岐阜県', '静岡県', '愛知県', '三重県']],
    ['関西', ['滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県']],
    ['中国・四国', ['鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県']],
    ['九州・沖縄', ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県']]
  ];
  var PREF_FIELD = '00NQ900000hT90j';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function push(obj) { window.dataLayer = window.dataLayer || []; window.dataLayer.push(obj); }

  function store(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
  function load(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

  function sset(key, val) { try { sessionStorage.setItem(key, val); } catch (e) {} }
  function sget(key) { try { return sessionStorage.getItem(key); } catch (e) { return null; } }

  /* ===== テスト送信の判定 ========================================= */
  // ?test=1 で開いたタブはテスト扱い（同じタブ内で有効。thanks.html でコンバージョンを送らない）
  var TEST_KEY = 'pa_hotel_test';
  var SUBMIT_KEY = 'pa_hotel_submitted';
  function detectTest() {
    var on = false;
    try { on = new URLSearchParams(location.search).get(CONFIG.testParam) === '1'; } catch (e) {}
    if (on) sset(TEST_KEY, '1');
    return sget(TEST_KEY) === '1';
  }
  var IS_TEST = detectTest();

  /* ===== 広告パラメータの保持 ===================================== */
  var TRACK_KEY = 'pa_hotel_tracking';

  function captureTracking() {
    var params;
    try { params = new URLSearchParams(location.search); } catch (e) { return; }
    var found = {};
    var any = false;
    Object.keys(CONFIG.trackingFields).forEach(function (k) {
      var v = params.get(k);
      if (v) { found[k] = v; any = true; }
    });
    if (any) store(TRACK_KEY, JSON.stringify({ t: Date.now(), v: found }));
  }

  function storedTracking() {
    var raw = load(TRACK_KEY);
    if (!raw) return {};
    try {
      var o = JSON.parse(raw);
      if (Date.now() - o.t > CONFIG.trackingTtlDays * 864e5) return {};
      return o.v || {};
    } catch (e) { return {}; }
  }

  function gclidFromCookie() {
    var m = document.cookie.match(/(?:^|; )_gcl_aw=([^;]+)/);
    if (!m) return '';
    var p = decodeURIComponent(m[1]).split('.');
    return p[p.length - 1] || '';
  }

  function fillTracking(form) {
    var saved = storedTracking();
    var params;
    try { params = new URLSearchParams(location.search); } catch (e) { params = null; }
    Object.keys(CONFIG.trackingFields).forEach(function (k) {
      var v = (params && params.get(k)) || saved[k] || '';
      if (!v && k === 'gclid') v = gclidFromCookie();
      if (IS_TEST && k === 'utm_source') v = 'test';   // Salesforce上でテストと判別できるように
      if (!v) return;
      var name = CONFIG.trackingFields[k];
      var el = form.querySelector('input[name="' + name + '"]');
      if (!el) { el = document.createElement('input'); el.type = 'hidden'; el.name = name; form.appendChild(el); }
      el.value = v;
    });
  }

  /* ===== 選択肢の生成 ============================================= */
  function buildPrefectures() {
    var regions = $('#prefRegions');
    var prefSelect = $('#pref');
    PREFS.forEach(function (group) {
      var details = document.createElement('details');
      details.className = 'region';
      var summary = document.createElement('summary');
      summary.innerHTML = '<span>' + group[0] + '</span><em data-count></em>';
      details.appendChild(summary);
      var box = document.createElement('div');
      box.className = 'choices choices--3col choices--sm';
      group[1].forEach(function (p) {
        box.insertAdjacentHTML('beforeend',
          '<label class="choice"><input type="checkbox" name="' + PREF_FIELD + '" value="' + p + '"><span>' + p + '</span></label>');
        prefSelect.insertAdjacentHTML('beforeend', '<option value="' + p + '">' + p + '</option>');
      });
      details.appendChild(box);
      regions.appendChild(details);
    });
  }

  function buildBirthYears() {
    var sel = $('#birthYear');
    var now = new Date().getFullYear();
    for (var y = now - 15; y >= now - 75; y--) {
      var o = document.createElement('option');
      o.value = String(y); o.textContent = y + '年';
      sel.appendChild(o);
    }
  }

  function updatePrefSummary() {
    var checked = $$('input[name="' + PREF_FIELD + '"]:checked').map(function (i) { return i.value; });
    $('#prefPicked').textContent = checked.length ? '選択中：' + checked.join('・') : '未選択';
    $('#prefPicked').classList.toggle('is-set', checked.length > 0);
    $$('.region').forEach(function (d) {
      var n = $$('input:checked', d).length;
      $('[data-count]', d).textContent = n ? n + '件選択' : '';
    });
  }

  /* ===== ステップ制御 ============================================= */
  var current = 1;
  var TOTAL = 5;
  var started = false;

  function showStep(n, scroll) {
    $$('.step').forEach(function (s) { s.classList.toggle('is-active', Number(s.dataset.step) === n); });
    current = n;
    $('#progressNow').textContent = n;
    $('#progressFill').style.width = (n / TOTAL * 100) + '%';
    if (scroll) {
      var top = $('#form-top').getBoundingClientRect().top + window.pageYOffset - 8;
      if (Math.abs(window.pageYOffset - top) > 40) window.scrollTo({ top: top, behavior: 'smooth' });
    }
    push({ event: 'hotel_lp_step', step: n });
  }

  function setError(n, msg) {
    var el = $('[data-err="' + n + '"]');
    el.textContent = msg || '';
    el.classList.toggle('is-shown', !!msg);
  }

  function checked(name) { return $$('input[name="' + name + '"]:checked'); }

  function toHalf(s) {
    return (s || '').replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); });
  }
  function digits(s) { return toHalf(s).replace(/[^0-9]/g, ''); }

  function validate(n) {
    switch (n) {
      case 1:
        return checked('00NQ900000hT8Sr').length ? '' : '希望する職種を1つ以上選択してください。';
      case 2:
        if (!checked('00NBL000000OLIm').length) return '希望する雇用形態を選択してください。';
        if (!checked('00NQ900000hT70X').length) return '転居の可否を選択してください。';
        if (!checked(PREF_FIELD).length) return '希望勤務地を1つ以上選択してください。';
        return '';
      case 3:
        if (!checked('00N2x000008eoMP').length) return '希望の時期を選択してください。';
        if (!checked('00NQ900000dKio1').length) return '現在のご状況を選択してください。';
        return '';
      case 4:
        var zipOk = digits($('#zip').value).length === 7;
        var addrOk = $('#pref').value !== '' && $('#city').value.trim() !== '';
        if (!zipOk && !addrOk) return '郵便番号（7桁）、または都道府県と市区町村を入力してください。';
        if (!$('#lastName').value.trim() || !$('#firstName').value.trim()) return 'お名前（姓・名）を入力してください。';
        if (!$('#birthYear').value) return '生まれ年を選択してください。';
        return '';
      case 5:
        var tel = digits($('#tel').value);
        if (!/^0\d{9,10}$/.test(tel)) return '電話番号を正しく入力してください（ハイフンなし10〜11桁）。';
        var mail = $('#email').value.trim();
        if (mail && !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(mail)) return 'メールアドレスの形式が正しくありません。';
        if (!$('#agree').checked) return '個人情報の取扱い・利用規約への同意が必要です。';
        return '';
    }
    return '';
  }

  /* ===== 住所補完の表示 =========================================== */
  var pollTimer = null;
  function watchAddress() {
    clearInterval(pollTimer);
    var tries = 0;
    pollTimer = setInterval(function () {
      tries++;
      var pref = $('#pref').value;
      var city = $('#city').value;
      var hint = $('#addrHint');
      if (pref) {
        hint.textContent = '📍 ' + pref + ' ' + city;
        hint.hidden = false;
        clearInterval(pollTimer);
      } else if (tries > 12) {
        hint.hidden = true;
        clearInterval(pollTimer);
      }
    }, 250);
  }

  /* ===== ポップアップ ============================================= */
  var POPUP_KEY = 'pa_hotel_popup_shown';
  var submitted = false;

  function canShowPopup() {
    var shown = false;
    try { shown = sessionStorage.getItem(POPUP_KEY) === '1'; } catch (e) {}
    return !shown && !submitted && !started;
  }

  function openPopup() {
    if (!canShowPopup()) return;
    try { sessionStorage.setItem(POPUP_KEY, '1'); } catch (e) {}
    $('#popup').hidden = false;
    document.documentElement.classList.add('is-locked');
    push({ event: 'hotel_lp_popup_show' });
  }

  function closePopup() {
    $('#popup').hidden = true;
    document.documentElement.classList.remove('is-locked');
  }

  /* ===== 初期化 =================================================== */
  function init() {
    var form = $('#entryForm');
    captureTracking();
    buildPrefectures();
    buildBirthYears();

    // 職種：最大3つ
    var jobBox = $('[data-max="3"]');
    jobBox.addEventListener('change', function () {
      var boxes = $$('input', jobBox);
      var n = boxes.filter(function (b) { return b.checked; }).length;
      boxes.forEach(function (b) {
        b.disabled = !b.checked && n >= 3;
        b.closest('.choice').classList.toggle('is-disabled', b.disabled);
      });
    });

    // 勤務地サマリ
    $('#prefRegions').addEventListener('change', updatePrefSummary);

    // 入力開始の判定（ポップアップ抑止）
    form.addEventListener('input', function () { started = true; }, { once: true });
    form.addEventListener('change', function () { started = true; }, { once: true });

    // 次へ・戻る
    form.addEventListener('click', function (e) {
      var t = e.target;
      if (t.classList.contains('btn-next')) {
        var msg = validate(current);
        setError(current, msg);
        if (!msg) showStep(current + 1, true);
      } else if (t.classList.contains('btn-back')) {
        setError(current, '');
        showStep(current - 1, true);
      }
    });

    // 回答したらエラー表示を消す
    form.addEventListener('change', function () {
      if (!validate(current)) setError(current, '');
    });

    // 郵便番号
    var zip = $('#zip');
    zip.addEventListener('input', function () {
      // 全角数字・ハイフンを半角に揃えてから住所補完に渡す
      var half = toHalf(zip.value).replace(/[ー－‐−]/g, '-');
      if (half !== zip.value) zip.value = half;
      if (digits(zip.value).length === 7) watchAddress();
    });
    $('#zipToggle').addEventListener('click', function () {
      var panel = $('#zipFallback');
      var open = panel.hidden;
      panel.hidden = !open;
      this.setAttribute('aria-expanded', String(open));
      this.textContent = open ? '郵便番号で入力する' : '郵便番号が分からない方はこちら';
    });

    // 生年を既存項目にも転記
    $('#birthYear').addEventListener('change', function () { $('#birthRecord').value = this.value; });

    // 送信
    form.addEventListener('submit', function (e) {
      var msg = validate(5);
      setError(5, msg);
      if (msg || $('#hpField').value) { e.preventDefault(); return; }
      if (submitted) { e.preventDefault(); return; }

      // 値の整形
      $('#tel').value = digits($('#tel').value);
      var z = digits(zip.value);
      zip.value = z.length === 7 ? z.slice(0, 3) + '-' + z.slice(3) : '';
      $('#birthRecord').value = $('#birthYear').value;
      $('#hpField').disabled = true;     // ダミー項目は送らない
      fillTracking(form);

      submitted = true;
      sset(SUBMIT_KEY, '1');             // thanks.html で「実際に送信した」ことを確認するため
      var btn = $('#submitBtn');
      btn.disabled = true; btn.textContent = '送信中…';
      push({ event: 'hotel_lp_submit', lp_test: IS_TEST });
    });

    // ページ内CTA
    $$('.js-to-form').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        closePopup();
        showStep(current, true);
      });
    });

    // 追従CTA：フォームが見えている間は隠す
    var sticky = $('#stickyCta');
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        sticky.classList.toggle('is-hidden', entries[0].isIntersecting);
      }, { threshold: 0.05 }).observe($('#form-top'));
    }

    // ポップアップ
    if (CONFIG.lineUrl) {
      var pc = $('#popupCta');
      pc.href = CONFIG.lineUrl; pc.target = '_blank'; pc.rel = 'noopener';
      pc.innerHTML = '<svg class="cta__line-icon" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="11" fill="#fff"/>'
        + '<path fill="#06c755" d="M24 10c-8.8 0-16 5.8-16 13 0 6.4 5.7 11.8 13.4 12.8.5.1 1.2.3 1.4.8.2.4.1 1 .1 1.4l-.2 1.4c-.1.4-.3 1.6 1.4.9 1.7-.7 9.3-5.5 12.7-9.4C39.3 28.3 40 25.8 40 23c0-7.2-7.2-13-16-13z"/>'
        + '<path fill="#fff" d="M17.3 26.8h-3.1c-.4 0-.8-.4-.8-.8v-6.2c0-.4.4-.8.8-.8s.8.4.8.8v5.4h2.3c.4 0 .8.4.8.8s-.4.8-.8.8zm3.2-.8c0 .4-.4.8-.8.8s-.8-.4-.8-.8v-6.2c0-.4.4-.8.8-.8s.8.4.8.8V26zm7.5 0c0 .3-.2.6-.5.7h-.3c-.2 0-.5-.1-.6-.3l-3.2-4.3V26c0 .4-.4.8-.8.8s-.8-.4-.8-.8v-6.2c0-.3.2-.6.5-.7h.3c.2 0 .5.1.6.3l3.2 4.3v-3.9c0-.4.4-.8.8-.8s.8.4.8.8V26zm5-3.9c.4 0 .8.4.8.8s-.4.8-.8.8h-2.3v1.5h2.3c.4 0 .8.4.8.8s-.4.8-.8.8h-3.1c-.4 0-.8-.4-.8-.8v-6.2c0-.4.4-.8.8-.8h3.1c.4 0 .8.4.8.8s-.4.8-.8.8h-2.3v1.5h2.3z"/></svg>'
        + 'LINEで気軽に相談する';
      $('#popup').classList.add('popup--line');
      pc.classList.remove('js-to-form');
      pc.addEventListener('click', function () { push({ event: 'hotel_lp_line_click' }); });
    } else {
      $('#popupCta').classList.add('js-to-form');
      $('#popupCta').addEventListener('click', function (e) { e.preventDefault(); closePopup(); showStep(current, true); });
    }
    $$('[data-close]', $('#popup')).forEach(function (el) { el.addEventListener('click', closePopup); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePopup(); });
    setTimeout(openPopup, CONFIG.popupDelayMs);
    document.addEventListener('mouseout', function (e) {
      if (!e.relatedTarget && e.clientY <= 0 && window.matchMedia('(pointer:fine)').matches) openPopup();
    });

    showStep(1, false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
