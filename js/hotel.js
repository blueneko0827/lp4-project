/* パラブルエージェント ホテル・宿泊 LP
 * - 見た目は lp4（看護LP4）と同じ構成。7画面のステップ式フォーム（Salesforce Web-to-Lead へ直接送信）
 * - 最初の質問（あなたのお気持ちは…）の回答は「お仕事のご状況」00NQ900000dKio1 に送信（lp4 と同じ値）
 * - gclid / gbraid / wbraid / UTM を保持して送信（lp4 と同じ項目ID）
 * - ?test=1 で開くとテスト送信扱い（コンバージョン計測しない・utm_source=test）
 * - 離脱防止ポップアップ（LINE相談）は時間経過・PCのカーソル離脱で1回のみ（ブラウザの「戻る」は妨げない）
 */
(function () {
  'use strict';

  /* ===== 設定 ===================================================== */
  var CONFIG = {
    popupDelayMs: 30000,          // 何ミリ秒後にポップアップを表示するか
    trackingTtlDays: 90,          // 広告パラメータの保持期間
    testParam: 'test',
    maxJobs: 3,
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
  var F = {                       // フォーム項目名
    job: '00NQ900000hT8Sr',       // 希望職種（複数）
    emp: '00NBL000000OLIm',       // 雇用形態
    time: '00N2x000008eoMP',      // 時期
    pref: '00NQ900000hT90j',      // 希望勤務地（複数）
    move: '00NQ900000hT70X'       // 転居可否
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

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  function push(obj) { window.dataLayer = window.dataLayer || []; window.dataLayer.push(obj); }
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }

  /* ===== テスト送信の判定 ========================================= */
  var TEST_KEY = 'pa_hotel_test';
  var SUBMIT_KEY = 'pa_hotel_submitted';
  var IS_TEST = (function () {
    var on = false;
    try { on = new URLSearchParams(location.search).get(CONFIG.testParam) === '1'; } catch (e) {}
    if (on) sset(TEST_KEY, '1');
    return sget(TEST_KEY) === '1';
  })();

  /* ===== 広告パラメータの保持 ===================================== */
  var TRACK_KEY = 'pa_hotel_tracking';
  function params() { try { return new URLSearchParams(location.search); } catch (e) { return null; } }
  function captureTracking() {
    var p = params(); if (!p) return;
    var found = {}, any = false;
    Object.keys(CONFIG.trackingFields).forEach(function (k) { var v = p.get(k); if (v) { found[k] = v; any = true; } });
    if (any) store(TRACK_KEY, JSON.stringify({ t: Date.now(), v: found }));
  }
  function storedTracking() {
    var raw = load(TRACK_KEY); if (!raw) return {};
    try { var o = JSON.parse(raw); return (Date.now() - o.t > CONFIG.trackingTtlDays * 864e5) ? {} : (o.v || {}); } catch (e) { return {}; }
  }
  function gclidFromCookie() {
    var m = document.cookie.match(/(?:^|; )_gcl_aw=([^;]+)/); if (!m) return '';
    var p = decodeURIComponent(m[1]).split('.'); return p[p.length - 1] || '';
  }
  function fillTracking(form) {
    var saved = storedTracking(), p = params();
    Object.keys(CONFIG.trackingFields).forEach(function (k) {
      var v = (p && p.get(k)) || saved[k] || '';
      if (!v && k === 'gclid') v = gclidFromCookie();
      if (IS_TEST && k === 'utm_source') v = 'test';   // Salesforce上でテストと判別できるように
      if (!v) return;
      var name = CONFIG.trackingFields[k];
      var el = form.querySelector('input[name="' + name + '"]');
      if (!el) { el = document.createElement('input'); el.type = 'hidden'; el.name = name; form.appendChild(el); }
      el.value = v;
    });
  }

  /* ===== 入力値ユーティリティ ===================================== */
  function toHalf(s) { return (s || '').replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); }); }
  function digits(s) { return toHalf(s).replace(/[^0-9]/g, ''); }
  function checked(name) { return $$('input[name="' + name + '"]:checked'); }
  function telOk() { return /^0\d{9,10}$/.test(digits($('#tel').value)); }
  function mailOk() { var m = $('#email').value.trim(); return !m || /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(m); }

  /* ===== 選択肢の生成 ============================================= */
  function buildPrefectures() {
    var box = $('#prefRegions'), sel = $('#pref');
    PREFS.forEach(function (g) {
      var d = document.createElement('details');
      d.className = 'region-card';
      var html = '<summary><span>' + g[0] + '</span><em data-count></em></summary><div class="pref-chips">';
      g[1].forEach(function (p) {
        html += '<label class="pref-chip"><input type="checkbox" name="' + F.pref + '" value="' + p + '"><span>' + p + '</span></label>';
        sel.insertAdjacentHTML('beforeend', '<option value="' + p + '">' + p + '</option>');
      });
      d.innerHTML = html + '</div>';
      box.appendChild(d);
    });
  }
  function buildBirthYears() {
    var sel = $('#birthYear'), now = new Date().getFullYear();
    for (var y = now - 15; y >= now - 75; y--) sel.insertAdjacentHTML('beforeend', '<option value="' + y + '">' + y + '</option>');
  }
  function updatePrefSummary() {
    var v = checked(F.pref).map(function (i) { return i.value; });
    var el = $('#prefPicked');
    el.textContent = v.length ? '選択中：' + v.join('・') : 'エリアを開いて都道府県を選んでください';
    el.classList.toggle('is-set', v.length > 0);
    $$('.region-card').forEach(function (d) { var n = $$('input:checked', d).length; $('[data-count]', d).textContent = n ? n : ''; });
  }

  /* ===== ステップ ================================================= */
  var current = 1, TOTAL = 7, started = false;

  function valid(n) {
    switch (n) {
      case 1: return checked(F.job).length > 0;
      case 2: return checked(F.emp).length > 0;
      case 3: return checked(F.time).length > 0;
      case 4: return checked(F.pref).length > 0 && checked(F.move).length > 0;
      case 5:
        return digits($('#zip').value).length === 7 || ($('#pref').value !== '' && $('#city').value.trim() !== '');
      case 6: return !!($('#lastName').value.trim() && $('#firstName').value.trim() && $('#birthYear').value);
      case 7: return telOk() && mailOk();
    }
    return false;
  }

  function refreshButtons() {
    var area = $('.mainarea[data-step="' + current + '"]');
    var ok = valid(current);
    var next = area && $('.nextbtn', area);
    if (next) { next.classList.toggle('nextbtn--acbg', ok); next.setAttribute('aria-disabled', ok ? 'false' : 'true'); }
    if (current === TOTAL) { var b = $('#submitBtn'); b.classList.toggle('submit--acbg', ok); }
  }

  function scrollToForm() {
    var top = $('#form-top').getBoundingClientRect().top + window.pageYOffset;
    if (Math.abs(window.pageYOffset - top) > 40) window.scrollTo({ top: top, behavior: 'smooth' });
  }

  function show(n, scroll) {
    n = Math.max(1, Math.min(TOTAL, n));
    $$('.mainarea').forEach(function (a) { a.classList.toggle('is-active', Number(a.dataset.step) === n); });
    $$('.comstep .stepnum').forEach(function (s, i) {
      s.classList.toggle('active', i + 1 === n);
      s.classList.toggle('is-done', i + 1 < n);
    });
    current = n;
    if (scroll) scrollToForm();
    refreshButtons();
    push({ event: 'hotel_lp_step', step: n });
  }

  /* ===== ポップアップ（LINE相談） ================================= */
  var POPUP_KEY = 'pa_hotel_popup_shown', submitted = false;
  function popupAllowed() {
    return sget(POPUP_KEY) !== '1' && !submitted && !started && $('#step0').hidden;
  }
  function openPopup() {
    if (!popupAllowed()) return;
    sset(POPUP_KEY, '1');
    $('#popup').classList.add('is-open');
    $('#popupCover').hidden = false;
    push({ event: 'hotel_lp_popup_show' });
  }
  function closePopup() {
    $('#popup').classList.remove('is-open');
    $('#popupCover').hidden = true;
  }

  /* ===== 初期化 =================================================== */
  function init() {
    window.__hotelReady = true;
    var form = $('#entryForm');
    captureTracking();
    buildPrefectures();
    buildBirthYears();

    // 最初の質問（あなたのお気持ちは…）
    var step0 = $('#step0');
    step0.addEventListener('click', function (e) {
      var b = e.target.closest('.step0-opt'); if (!b) return;
      $('#step0_value').value = b.getAttribute('data-step0') || '';
      step0.hidden = true;
      document.documentElement.className = document.documentElement.className.replace(/\s*step0-open/, '');
      push({ event: 'hotel_lp_step0', answer: $('#step0_value').value });
    });

    // 職種：最大3つ
    var jobBox = $('[data-max]');
    jobBox.addEventListener('change', function () {
      var boxes = $$('input', jobBox), n = boxes.filter(function (b) { return b.checked; }).length;
      boxes.forEach(function (b) { b.disabled = !b.checked && n >= CONFIG.maxJobs; });
    });

    // 入力のたびにボタン状態を更新
    form.addEventListener('input', function () { started = true; refreshButtons(); });
    form.addEventListener('change', function (e) {
      started = true;
      if (e.target.name === F.pref) updatePrefSummary();
      refreshButtons();
      // 1つ選ぶだけの質問（雇用形態・時期）は自動で次へ（lp4 と同じ）
      if (e.target.type === 'radio' && (current === 2 || current === 3) && valid(current)) {
        setTimeout(function () { show(current + 1, true); }, 220);
      }
    });

    // 戻る・次へ
    form.addEventListener('click', function (e) {
      var a = e.target.closest('[data-go]'); if (!a) return;
      e.preventDefault();
      var to = Number(a.getAttribute('data-go'));
      if (a.classList.contains('nextbtn') && !valid(current)) return;
      show(to, true);
    });

    // 郵便番号：全角→半角、住所を吹き出しで表示
    var zip = $('#zip'), timer = null;
    zip.addEventListener('input', function () {
      var half = toHalf(zip.value).replace(/[ー－‐−]/g, '-');
      if (half !== zip.value) zip.value = half;
      var bubble = $('#zipBubble');
      clearInterval(timer);
      if (digits(zip.value).length !== 7) { bubble.hidden = true; return; }
      var tries = 0;
      timer = setInterval(function () {
        tries++;
        if ($('#pref').value) {
          bubble.textContent = '📍 ' + $('#pref').value + ' ' + $('#city').value;
          bubble.hidden = false; clearInterval(timer); refreshButtons();
        } else if (tries > 12) { clearInterval(timer); }
      }, 250);
    });
    $('#zipToggle').addEventListener('click', function (e) {
      e.preventDefault();
      var panel = $('#zipFallback'), open = panel.hidden;
      panel.hidden = !open;
      this.setAttribute('aria-expanded', String(open));
      this.textContent = open ? '郵便番号で入力する' : '郵便番号が分からない方はこちら';
    });

    // 生まれ年を既存項目にも転記（lp4 と同じ）
    $('#birthYear').addEventListener('change', function () { $('#birthRecord').value = this.value; });

    // 電話・メールの形式エラーは入力欄を離れた時に表示
    $('#tel').addEventListener('blur', function () { $('#telErr').hidden = !this.value || telOk(); });
    $('#email').addEventListener('blur', function () { $('#emailErr').hidden = mailOk(); });

    // 送信
    form.addEventListener('submit', function (e) {
      if (!valid(TOTAL) || $('#hpField').value || submitted) {
        e.preventDefault();
        $('#telErr').hidden = telOk(); $('#emailErr').hidden = mailOk();
        return;
      }
      $('#tel').value = digits($('#tel').value);
      var z = digits(zip.value);
      zip.value = z.length === 7 ? z.slice(0, 3) + '-' + z.slice(3) : '';
      $('#birthRecord').value = $('#birthYear').value;
      $('#hpField').disabled = true;
      fillTracking(form);
      submitted = true;
      sset(SUBMIT_KEY, '1');
      var btn = $('#submitBtn');
      btn.disabled = true; btn.innerHTML = '送信中…';
      push({ event: 'hotel_lp_submit', lp_test: IS_TEST });
    });

    // ページ内CTA：フォームへ移動してハイライト（lp4 と同じ演出）
    $$('.js-to-form').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault(); closePopup(); scrollToForm();
        var c = $('#form-top'); c.classList.remove('is-cta-focus'); void c.offsetWidth; c.classList.add('is-cta-focus');
      });
    });

    // ポップアップ
    $$('[data-close]', $('#popup')).forEach(function (el) { el.addEventListener('click', function (e) { e.preventDefault(); closePopup(); }); });
    $('#popupCover').addEventListener('click', closePopup);
    $('#popupLine').addEventListener('click', function () { push({ event: 'hotel_lp_line_click' }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePopup(); });
    setTimeout(openPopup, CONFIG.popupDelayMs);
    document.addEventListener('mouseout', function (e) {
      if (!e.relatedTarget && e.clientY <= 0 && window.matchMedia('(pointer:fine)').matches) openPopup();
    });

    show(1, false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
