// ══════════════════════════════════════════════════════
// product.js — 📦 제작물 분석 탭 전체
// 디자인세창 영업 마스터 CRM
// ══════════════════════════════════════════════════════

// ── 탭 HTML 삽입 ──
function _insertProductTabHTML() {
  var memoTab = document.querySelector('[data-tab="memo"]');
  if (memoTab && !document.querySelector('[data-tab="product"]')) {
    var productTab = document.createElement('div');
    productTab.className = 'tab';
    productTab.dataset.tab = 'product';
    productTab.textContent = '📦 제작물 분석';
    productTab.addEventListener('click', function() { switchTab('product'); });
    memoTab.parentNode.insertBefore(productTab, memoTab);
  }
  if (!document.getElementById('tab-product')) {
    var appZone = document.getElementById('appZone');
    var div = document.createElement('div');
    div.className = 'tab-content';
    div.id = 'tab-product';
    div.innerHTML = _getProductTabHTML();
    appZone.appendChild(div);
  }
}

function _getProductTabHTML() {
  return `
  <div class="info-box">
    📦 <strong>제작물 분석</strong> — 사이즈, 페이지, 수량, 납품일 데이터를 활용한 제작물 패턴 분석 탭입니다.<br>
    • <strong>사이즈별 주문 빈도</strong>: 어떤 사이즈가 가장 많이 요청되는지 파악합니다. 전체 기간 또는 연도별로 조회할 수 있습니다.<br>
    • <strong>페이지 구간별 분포</strong>: 주문 페이지 구간별 빈도를 도넛 차트로 보여줍니다.<br>
    • <strong>리드타임 분석</strong>: 발주일→납기일 소요일을 거래처별로 분석합니다. 납기일이 입력된 건만 집계되며, 평균 납기가 짧은 순(급한 거래처 우선)으로 정렬됩니다.<br>
    &nbsp;&nbsp;&nbsp;— 구분 태그 기준: <span style="background:rgba(255,85,119,.18);color:#ff5577;font-size:12px;font-weight:700;padding:2px 8px;border-radius:4px;">급건 多</span> 평균 5일 이내 &nbsp;|&nbsp; <span style="background:rgba(255,184,48,.18);color:#ffb830;font-size:12px;font-weight:700;padding:2px 8px;border-radius:4px;">단기</span> 6~10일 &nbsp;|&nbsp; <span style="background:rgba(0,212,255,.14);color:#00d4ff;font-size:12px;font-weight:700;padding:2px 8px;border-radius:4px;">일반</span> 11~20일 &nbsp;|&nbsp; <span style="background:rgba(58,66,96,.5);color:#b0bcdb;font-size:12px;font-weight:700;padding:2px 8px;border-radius:4px;">장기</span> 21일 이상<br>
    • <strong>납품 달성률</strong>: 발주일 기준 납기일까지 기한 내 납품된 비율을 월별 막대 차트로 보여줍니다. 초록색(90% 이상) · 노란색(70~89%) · 빨간색(70% 미만)으로 구분됩니다.
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px;">
    <div class="section">
      <div class="section-header">
        <span class="section-title">📐 사이즈별 주문 빈도 (상위 15)</span>
        <select id="productSizeYear" class="si" style="max-width:120px;flex:none;font-size:13px;padding:7px 10px;">
          <option value="all">전체 기간</option>
        </select>
      </div>
      <div style="padding:20px;position:relative;height:520px;"><canvas id="productSizeChart"></canvas></div>
      <div style="overflow-x:auto;overflow-y:auto;max-height:200px;"><table class="data-table" id="productSizeTable"></table></div>
    </div>

    <div class="section">
      <div class="section-header">
        <span class="section-title">📄 페이지 구간별 주문 분포</span>
        <select id="productPageYear" class="si" style="max-width:120px;flex:none;font-size:13px;padding:7px 10px;">
          <option value="all">전체 기간</option>
        </select>
      </div>
      <div style="padding:20px;position:relative;height:320px;"><canvas id="productPageChart"></canvas></div>
      <div style="overflow-x:auto;"><table class="data-table" id="productPageTable"></table></div>
    </div>
  </div>

  <div class="section" style="margin-bottom:18px;">
    <div class="section-header">
      <span class="section-title">⏱️ 리드타임 분석 (발주일 → 납기일 소요일)</span>
      <div style="display:flex;gap:8px;align-items:center;">
        <select id="leadtimeYear" class="si" style="max-width:120px;flex:none;font-size:13px;padding:7px 10px;">
          <option value="all">전체 기간</option>
        </select>
        <button class="btn" style="padding:7px 14px;font-size:13px;" onclick="productRenderLeadtime()">조회</button>
      </div>
    </div>
    <div class="kpi-grid" id="leadtimeKpi" style="padding:20px 20px 0;"></div>
    <div style="overflow-x:auto;overflow-y:auto;max-height:380px;"><table class="data-table" id="leadtimeTable"></table></div>
  </div>

  <div class="section">
    <div class="section-header">
      <span class="section-title">✅ 월별 납품 마감 달성률</span>
      <select id="deliveryYear" class="si" style="max-width:130px;flex:none;font-size:13px;padding:7px 10px;"></select>
    </div>
    <div class="kpi-grid" id="deliveryKpi" style="padding:20px 20px 0;"></div>
    <div style="padding:0 20px 20px;position:relative;height:260px;"><canvas id="deliveryChart"></canvas></div>
  </div>
  `;
}

// ── 차트 인스턴스 관리 ──
var _productCharts = {};
function _destroyProductChart(key) {
  if (_productCharts[key]) { _productCharts[key].destroy(); _productCharts[key] = null; }
}

// ── 사이즈 정규화 ──
function _normalizeSize(s) {
  if (!s) return '';
  var str = s.toString().trim().toUpperCase();
  // 흔한 별칭 정리
  str = str.replace(/\s+/g, '');
  if (str === 'A4' || str === 'A-4') return 'A4';
  if (str === 'A3' || str === 'A-3') return 'A3';
  if (str === 'A5' || str === 'A-5') return 'A5';
  if (str === 'B4' || str === 'B-4') return 'B4';
  if (str === 'B5' || str === 'B-5') return 'B5';
  return str;
}

// ── 사이즈별 빈도 ──
function productRenderSize() {
  var sel = document.getElementById('productSizeYear');
  var el = document.getElementById('productSizeTable');
  if (!sel || !el) return;
  var yr = sel.value;
  var rows = allRows.filter(function(r) { return r.size; });
  if (yr !== 'all') rows = rows.filter(function(r) { return r.year === parseInt(yr); });

  var sizeCnt = {};
  rows.forEach(function(r) {
    var s = _normalizeSize(r.size);
    if (s) sizeCnt[s] = (sizeCnt[s] || 0) + 1;
  });
  var sorted = Object.entries(sizeCnt).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 15);
  var total = sorted.reduce(function(s, e) { return s + e[1]; }, 0);

  _destroyProductChart('size');
  var ctx = document.getElementById('productSizeChart');
  if (ctx && sorted.length) {
    _productCharts['size'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sorted.map(function(e) { return e[0]; }),
        datasets: [{
          label: '주문 건수',
          data: sorted.map(function(e) { return e[1]; }),
          backgroundColor: sorted.map(function(_, i) { return ['#00d4ff','#44e87a','#ffb830','#ff5577','#c084fc','#ff8c42','#38bdf8','#fbbf24','#6ee7b7','#f472b6','#34d399','#a78bfa','#fb923c','#60a5fa','#4ade80'][i] + 'BB'; }),
          borderRadius: 5, borderWidth: 0,
          barThickness: 24
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#b0bcdb', font: { size: 13 } }, grid: { color: '#3a4260' } },
          y: {
            ticks: { color: '#b0bcdb', font: { size: 14 }, padding: 8 },
            grid: { display: false }
          }
        },
        layout: { padding: { left: 10, right: 20, top: 10, bottom: 10 } }
      }
    });
  } else if (ctx) {
    var wrap = ctx.parentNode;
    wrap.innerHTML = '<div class="empty">사이즈 데이터 없음<br><span style="font-size:13px;color:var(--text3);">엑셀의 사이즈 컬럼에 값이 있어야 합니다</span></div>';
  }

  var html = '<thead><tr><th>사이즈</th><th>건수</th><th>비율</th></tr></thead><tbody>';
  if (!sorted.length) { html += '<tr><td colspan="3" class="empty">데이터 없음</td></tr>'; }
  sorted.forEach(function(e) {
    var pct = total > 0 ? (e[1] / total * 100).toFixed(1) : 0;
    html += '<tr><td style="font-weight:600;font-family:IBM Plex Mono,monospace">' + e[0] + '</td><td class="mono">' + e[1].toLocaleString() + '</td><td class="mono">' + pct + '%</td></tr>';
  });
  el.innerHTML = html + '</tbody>';
}

// ── 페이지 구간별 분포 ──
function productRenderPage() {
  var sel = document.getElementById('productPageYear');
  var el = document.getElementById('productPageTable');
  if (!sel || !el) return;
  var yr = sel.value;
  var rows = allRows.filter(function(r) { return r.page && parseFloat(r.page) > 0; });
  if (yr !== 'all') rows = rows.filter(function(r) { return r.year === parseInt(yr); });

  var bands = [
    { label: '~32p', min: 0, max: 32 },
    { label: '33~64p', min: 33, max: 64 },
    { label: '65~128p', min: 65, max: 128 },
    { label: '129~200p', min: 129, max: 200 },
    { label: '201~300p', min: 201, max: 300 },
    { label: '301~400p', min: 301, max: 400 },
    { label: '401p~', min: 401, max: Infinity }
  ];
  var bandCnt = bands.map(function(b) {
    return { label: b.label, cnt: rows.filter(function(r) { var p = parseFloat(r.page); return p >= b.min && p <= b.max; }).length };
  });
  var total = bandCnt.reduce(function(s, b) { return s + b.cnt; }, 0);

  _destroyProductChart('page');
  var ctx = document.getElementById('productPageChart');
  if (ctx && total > 0) {
    _productCharts['page'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: bandCnt.map(function(b) { return b.label; }),
        datasets: [{
          data: bandCnt.map(function(b) { return b.cnt; }),
          backgroundColor: ['#00d4ff','#44e87a','#ffb830','#ff5577','#c084fc','#ff8c42','#38bdf8'],
          borderWidth: 2, borderColor: '#1a1e2a'
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#b0bcdb', font: { size: 12 } } },
          tooltip: { callbacks: { label: function(ctx) { return ctx.label + ': ' + ctx.raw + '건 (' + (ctx.raw/total*100).toFixed(1) + '%)'; } } }
        }
      }
    });
  } else if (ctx && total === 0) {
    var wrap2 = ctx.parentNode;
    wrap2.innerHTML = '<div class="empty">페이지 데이터 없음<br><span style="font-size:13px;color:var(--text3);">엑셀의 페이지 컬럼에 값이 있어야 합니다</span></div>';
  }

  var html = '<thead><tr><th>페이지 구간</th><th>건수</th><th>비율</th></tr></thead><tbody>';
  bandCnt.forEach(function(b) {
    var pct = total > 0 ? (b.cnt / total * 100).toFixed(1) : 0;
    html += '<tr><td style="font-weight:600">' + b.label + '</td><td class="mono">' + b.cnt.toLocaleString() + '</td><td class="mono">' + pct + '%</td></tr>';
  });
  el.innerHTML = html + '</tbody>';
}

// ── 리드타임 분석 ──
function productRenderLeadtime() {
  var sel = document.getElementById('leadtimeYear');
  var kpiEl = document.getElementById('leadtimeKpi');
  var tableEl = document.getElementById('leadtimeTable');
  if (!kpiEl || !tableEl) return;
  var yr = sel ? sel.value : 'all';

  // 납기일이 있고 발주일도 있는 행만
  var rows = allRows.filter(function(r) { return r.deliveryDate && r.date; });
  if (yr !== 'all') rows = rows.filter(function(r) { return r.year === parseInt(yr); });

  var leadtimes = [];
  rows.forEach(function(r) {
    var deliv = new Date(r.deliveryDate);
    if (isNaN(deliv)) return;
    var days = Math.round((deliv.getTime() - r.date.getTime()) / 86400000);
    if (days >= 0 && days <= 365) leadtimes.push({ client: r.client, days: days, date: r.date, subject: r.subject });
  });

  if (!leadtimes.length) {
    kpiEl.innerHTML = '<div style="padding:10px;color:var(--text3);">납기일 데이터가 없습니다. 엑셀의 납기 컬럼에 날짜 값이 있어야 합니다.</div>';
    tableEl.innerHTML = '';
    return;
  }

  var avg = Math.round(leadtimes.reduce(function(s, l) { return s + l.days; }, 0) / leadtimes.length);
  var min = Math.min.apply(null, leadtimes.map(function(l) { return l.days; }));
  var max = Math.max.apply(null, leadtimes.map(function(l) { return l.days; }));
  var under5 = leadtimes.filter(function(l) { return l.days <= 5; }).length;
  var over14 = leadtimes.filter(function(l) { return l.days > 14; }).length;

  kpiEl.innerHTML =
    '<div class="kpi-card blue"><div class="kpi-label">평균 리드타임</div><div class="kpi-value">' + avg + '</div><div class="kpi-sub">일 (발주→납기)</div></div>' +
    '<div class="kpi-card green"><div class="kpi-label">최단 납기</div><div class="kpi-value">' + min + '</div><div class="kpi-sub">일</div></div>' +
    '<div class="kpi-card yellow"><div class="kpi-label">최장 납기</div><div class="kpi-value">' + max + '</div><div class="kpi-sub">일</div></div>' +
    '<div class="kpi-card red"><div class="kpi-label">5일 이내 급건</div><div class="kpi-value">' + under5 + '</div><div class="kpi-sub">건 (' + (leadtimes.length>0?(under5/leadtimes.length*100).toFixed(0):0) + '%)</div></div>';

  // 거래처별 평균 리드타임
  var clientLt = {};
  leadtimes.forEach(function(l) {
    if (!clientLt[l.client]) clientLt[l.client] = [];
    clientLt[l.client].push(l.days);
  });
  var sorted = Object.entries(clientLt).map(function(e) {
    var avgDays = Math.round(e[1].reduce(function(s, d) { return s + d; }, 0) / e[1].length);
    return { client: e[0], avg: avgDays, cnt: e[1].length, min: Math.min.apply(null, e[1]), max: Math.max.apply(null, e[1]) };
  }).sort(function(a, b) { return a.avg - b.avg; }).slice(0, 50);

  var html = '<thead><tr><th>발주처</th><th>평균 (일)</th><th>최단</th><th>최장</th><th>건수</th><th>구분</th></tr></thead><tbody>';
  if (!sorted.length) html += '<tr><td colspan="6" class="empty">데이터 없음</td></tr>';
  sorted.forEach(function(d) {
    var tag = d.avg <= 5 ? '<span class="tag red">급건 多</span>' : d.avg <= 10 ? '<span class="tag yellow">단기</span>' : d.avg <= 20 ? '<span class="tag blue">일반</span>' : '<span class="tag gray">장기</span>';
    var safe = d.client.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    html += '<tr onclick="goHistory(\'' + safe + '\')" style="cursor:pointer">' +
      '<td style="font-weight:600">' + d.client + '</td>' +
      '<td class="mono" style="color:' + (d.avg<=5?'var(--red)':d.avg<=10?'var(--yellow)':'var(--text)') + '">' + d.avg + '일</td>' +
      '<td class="mono">' + d.min + '일</td>' +
      '<td class="mono">' + d.max + '일</td>' +
      '<td class="mono">' + d.cnt + '</td>' +
      '<td>' + tag + '</td></tr>';
  });
  tableEl.innerHTML = html + '</tbody>';
}

// ── 납품 달성률 ──
function productRenderDelivery() {
  var sel = document.getElementById('deliveryYear');
  var kpiEl = document.getElementById('deliveryKpi');
  var ctx = document.getElementById('deliveryChart');
  if (!sel || !kpiEl || !ctx) return;
  var yr = parseInt(sel.value) || years[years.length - 1];

  var rows = allRows.filter(function(r) { return r.year === yr && r.deliveryDate && r.date; });
  if (!rows.length) {
    kpiEl.innerHTML = '<div style="padding:10px;color:var(--text3);">납기일 데이터 없음</div>';
    return;
  }

  // 납기일 기준으로 기한 내 납품 = 발주일이 납기일 이전
  // (실제로는 납품 완료일이 없으므로 납기일-발주일 차이가 0일 이상 = 기한 내로 가정)
  var monthly = [];
  for (var m = 1; m <= 12; m++) {
    var mRows = rows.filter(function(r) { return r.month === m; });
    var onTime = mRows.filter(function(r) {
      var deliv = new Date(r.deliveryDate);
      if (isNaN(deliv)) return false;
      return deliv.getTime() >= r.date.getTime(); // 납기일이 발주일 이후
    }).length;
    monthly.push({ m: m, total: mRows.length, onTime: onTime, rate: mRows.length > 0 ? Math.round(onTime / mRows.length * 100) : 0 });
  }

  var totalRows = rows.length;
  var totalOnTime = monthly.reduce(function(s, m) { return s + m.onTime; }, 0);
  var overallRate = totalRows > 0 ? (totalOnTime / totalRows * 100).toFixed(1) : 0;
  var hasData = monthly.filter(function(m) { return m.total > 0; }).length;

  kpiEl.innerHTML =
    '<div class="kpi-card green"><div class="kpi-label">' + yr + '년 전체 달성률</div><div class="kpi-value" style="color:#44e87a;">' + overallRate + '%</div><div class="kpi-sub">' + totalRows + '건 중 ' + totalOnTime + '건 기한 내</div></div>' +
    '<div class="kpi-card blue"><div class="kpi-label">데이터 있는 월</div><div class="kpi-value">' + hasData + '</div><div class="kpi-sub">월</div></div>';

  _destroyProductChart('delivery');
  _productCharts['delivery'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: monthly.filter(function(m) { return m.total > 0; }).map(function(m) { return m.m + '월'; }),
      datasets: [{
        label: '달성률 (%)',
        data: monthly.filter(function(m) { return m.total > 0; }).map(function(m) { return m.rate; }),
        backgroundColor: monthly.filter(function(m) { return m.total > 0; }).map(function(m) {
          return m.rate >= 90 ? 'rgba(68,232,122,.7)' : m.rate >= 70 ? 'rgba(255,184,48,.7)' : 'rgba(255,85,119,.7)';
        }),
        borderRadius: 5, borderWidth: 0
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: function(ctx) { return '달성률: ' + ctx.raw + '%'; } } }
      },
      scales: {
        x: { ticks: { color: '#b0bcdb' }, grid: { color: '#3a4260' } },
        y: { min: 0, max: 100, ticks: { color: '#b0bcdb', callback: function(v) { return v + '%'; } }, grid: { color: '#3a4260' } }
      }
    }
  });
}

// ── initProductTab: 탭 초기화 (initApp에서 호출) ──
function initProductTab() {
  _insertProductTabHTML();

  // 연도 셀렉터 채우기
  ['productSizeYear','productPageYear','leadtimeYear'].forEach(function(id) {
    var sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '<option value="all">전체 기간</option>';
    years.forEach(function(y) { var o = document.createElement('option'); o.value = y; o.textContent = y + '년'; sel.appendChild(o); });
  });

  var delivYearSel = document.getElementById('deliveryYear');
  if (delivYearSel) {
    delivYearSel.innerHTML = '';
    years.forEach(function(y) { var o = document.createElement('option'); o.value = y; o.textContent = y + '년'; delivYearSel.appendChild(o); });
    delivYearSel.value = years[years.length - 1];
    delivYearSel.addEventListener('change', productRenderDelivery);
  }

  // 이벤트 리스너
  var sizeYearSel = document.getElementById('productSizeYear');
  if (sizeYearSel) sizeYearSel.addEventListener('change', productRenderSize);
  var pageYearSel = document.getElementById('productPageYear');
  if (pageYearSel) pageYearSel.addEventListener('change', productRenderPage);

  // 탭 클릭 시 재렌더링 (타이밍 문제 해결)
  var productTabBtn = document.querySelector('[data-tab="product"]');
  if (productTabBtn) {
    productTabBtn.addEventListener('click', function() {
      setTimeout(function() {
        productRenderSize();
        productRenderPage();
        productRenderLeadtime();
        productRenderDelivery();
      }, 50);
    });
  }

  // 초기 렌더링 (데이터 로드 완료 후 실행 보장)
  setTimeout(function() {
    productRenderSize();
    productRenderPage();
    productRenderLeadtime();
    productRenderDelivery();
  }, 300);
}
