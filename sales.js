// ══════════════════════════════════════════════════════
// sales.js — 💰 매출 분석 탭 전체
// 디자인세창 영업 마스터 CRM
// ══════════════════════════════════════════════════════

// ── 매출 분석 탭 HTML 삽입 ──
function _insertSalesTabHTML() {
  // 탭 버튼 추가 (메모 탭 앞에)
  var memoTab = document.querySelector('[data-tab="memo"]');
  if (memoTab && !document.querySelector('[data-tab="sales"]')) {
    var salesTab = document.createElement('div');
    salesTab.className = 'tab';
    salesTab.dataset.tab = 'sales';
    salesTab.textContent = '💰 매출 분석';
    salesTab.addEventListener('click', function() { switchTab('sales'); });
    memoTab.parentNode.insertBefore(salesTab, memoTab);
  }

  // 탭 컨텐츠 추가
  if (!document.getElementById('tab-sales')) {
    var appZone = document.getElementById('appZone');
    var div = document.createElement('div');
    div.className = 'tab-content';
    div.id = 'tab-sales';
    div.innerHTML = _getSalesTabHTML();
    appZone.appendChild(div);
  }
}

function _getSalesTabHTML() {
  return `
  <div class="info-box">
    💰 <strong>매출 분석</strong> — 금액 데이터 기반의 매출 심층 분석 탭입니다.<br>
    • <strong>사업장 필터</strong>: 상단 버튼으로 전체 또는 특정 사업장(수원세창, 서울세창 등)만 볼 수 있습니다.<br>
    • <strong>월별 매출 추이</strong>: 선택 연도의 월별 매출을 막대 차트로 보여줍니다.<br>
    • <strong>전년 동기 비교</strong>: 두 연도의 월별 매출을 나란히 비교합니다.<br>
    • <strong>발주처별 매출 순위</strong>: 금액 기준 상위 거래처와 매출 집중도를 분석합니다. 누적비율이 붉은색으로 표시되는 구간이 매출 집중 거래처입니다.<br>
    • <strong>사업장별 매출</strong>: 사업장별 매출 비중을 도넛 차트와 표로 보여줍니다.<br>
    • <strong>신규 vs 기존 거래처 매출 분리</strong>: 선택 연도의 매출이 기존 거래처에서 온 것인지, 그 해 처음 거래한 신규 거래처에서 온 것인지 분리해서 보여줍니다.<br>
    • <strong>재주문율 분석</strong>: 두 가지 지표를 보여줍니다.<br>
    &nbsp;&nbsp;&nbsp;① <strong>재주문율</strong>: 선택 연도 이전부터 거래하던 기존 거래처 중, 선택 연도에 다시 발주한 거래처의 비율입니다. 예) 2026년 재주문율 = 2025년 이전 거래처 중 2026년에 발주한 곳의 비율.<br>
    &nbsp;&nbsp;&nbsp;② <strong>신규→다음해 유지율</strong>: 선택 연도에 처음 거래를 시작한 신규 거래처가 다음 해에도 계속 거래하는 비율입니다. 데이터가 쌓일수록 의미 있는 수치가 됩니다.<br>
    &nbsp;&nbsp;&nbsp;③ <strong>하단 표</strong>: 기존 거래처 목록을 매출 높은 순으로 보여주며, 선택 연도에 재거래했는지(✓ 재거래) 안 했는지(미거래)를 함께 표시합니다. 클릭하면 해당 거래처 히스토리로 이동합니다.
  </div>

  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;align-items:center;">
    <span style="font-size:14px;color:var(--text2);font-weight:600;">사업장:</span>
    <span id="salesBizAll" class="biz-pill active" onclick="salesSetBiz('all')" style="display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;padding:5px 14px;border-radius:16px;border:2px solid var(--accent);cursor:pointer;background:rgba(0,212,255,.08);color:var(--accent);">🏢 전체</span>
    <span id="salesBizPills"></span>
  </div>

  <div class="kpi-grid" id="salesMainKpi"></div>

  <div class="section" style="margin-bottom:18px;">
    <div class="section-header">
      <span class="section-title">📈 월별 매출 추이</span>
      <div style="display:flex;gap:8px;align-items:center;">
        <select id="salesMonthlyYear" class="si" style="max-width:130px;flex:none;font-size:13px;padding:7px 10px;"></select>
        <button class="btn" style="padding:7px 14px;font-size:13px;" onclick="salesRenderMonthly()">조회</button>
      </div>
    </div>
    <div style="padding:20px;position:relative;height:320px;"><canvas id="salesMonthlyChart"></canvas></div>
  </div>

  <div class="section" style="margin-bottom:18px;">
    <div class="section-header">
      <span class="section-title">⚖️ 전년 동기 매출 비교</span>
      <div style="display:flex;gap:8px;align-items:center;">
        <select id="salesYoYA" class="si" style="max-width:120px;flex:none;font-size:13px;padding:7px 10px;"></select>
        <span style="color:var(--text2);">vs</span>
        <select id="salesYoYB" class="si" style="max-width:120px;flex:none;font-size:13px;padding:7px 10px;"></select>
        <button class="btn" style="padding:7px 14px;font-size:13px;" onclick="salesRenderYoY()">비교</button>
      </div>
    </div>
    <div style="padding:20px;position:relative;height:320px;"><canvas id="salesYoYChart"></canvas></div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px;">
    <div class="section">
      <div class="section-header">
        <span class="section-title">🏆 발주처별 매출 순위</span>
        <div style="display:flex;gap:8px;align-items:center;">
          <select id="salesRankYear" class="si" style="max-width:120px;flex:none;font-size:13px;padding:7px 10px;">
            <option value="all">전체 기간</option>
          </select>
          <button class="btn" style="padding:7px 14px;font-size:13px;" onclick="salesRenderRank()">조회</button>
        </div>
      </div>
      <div style="overflow-x:auto;overflow-y:auto;max-height:460px;"><table class="data-table" id="salesRankTable"></table></div>
    </div>

    <div class="section">
      <div class="section-header">
        <span class="section-title">🏭 사업장별 매출 현황</span>
        <select id="salesBizYear" class="si" style="max-width:120px;flex:none;font-size:13px;padding:7px 10px;">
          <option value="all">전체 기간</option>
        </select>
      </div>
      <div style="padding:20px;position:relative;height:240px;"><canvas id="salesBizChart"></canvas></div>
      <div style="overflow-x:auto;overflow-y:auto;max-height:200px;"><table class="data-table" id="salesBizTable"></table></div>
    </div>
  </div>

  <div class="section" style="margin-bottom:18px;">
    <div class="section-header">
      <span class="section-title">🆕 신규 vs 기존 거래처 매출 분리</span>
      <select id="salesNewOldYear" class="si" style="max-width:130px;flex:none;font-size:13px;padding:7px 10px;"></select>
    </div>
    <div class="kpi-grid" id="salesNewOldKpi" style="padding:20px;"></div>
    <div style="padding:0 20px 20px;position:relative;height:260px;"><canvas id="salesNewOldChart"></canvas></div>
  </div>

  <div class="section">
    <div class="section-header">
      <span class="section-title">🔁 재주문율 분석</span>
      <select id="salesReorderYear" class="si" style="max-width:130px;flex:none;font-size:13px;padding:7px 10px;"></select>
    </div>
    <div class="kpi-grid" id="salesReorderKpi" style="padding:20px;"></div>
    <div style="overflow-x:auto;overflow-y:auto;max-height:300px;padding:0 20px 16px;"><table class="data-table" id="salesReorderTable"></table></div>
  </div>
  `;
}

// ── 차트 인스턴스 관리 ──
var _salesCharts = {};
function _destroyChart(key) {
  if (_salesCharts[key]) { _salesCharts[key].destroy(); _salesCharts[key] = null; }
}

// ── 사업장 필터 ──
var _salesBiz = 'all';
function salesSetBiz(biz) {
  _salesBiz = biz;
  document.querySelectorAll('#salesBizAll, .sales-biz-pill').forEach(function(el) {
    var isAll = el.id === 'salesBizAll';
    var elBiz = isAll ? 'all' : el.dataset.biz;
    var active = (elBiz === biz);
    el.style.borderColor = active ? 'var(--accent)' : 'var(--border)';
    el.style.color = active ? 'var(--accent)' : 'var(--text2)';
    el.style.background = active ? 'rgba(0,212,255,.08)' : 'var(--surface2)';
  });
  salesRenderAll();
}

function _getSalesRows() {
  if (_salesBiz === 'all') return allRows;
  return allRows.filter(function(r) { return r.bizUnit === _salesBiz; });
}

// ── 전체 렌더 ──
function salesRenderAll() {
  salesRenderKpi();
  salesRenderMonthly();
  salesRenderRank();
  salesRenderBiz();
  salesRenderNewOld();
  salesRenderReorder();
}

// ── KPI 카드 ──
function salesRenderKpi() {
  var el = document.getElementById('salesMainKpi');
  if (!el) return;
  var rows = _getSalesRows();
  var now = new Date();
  var curY = now.getFullYear(), curM = now.getMonth() + 1;
  var ly = years[years.length - 1] || curY;

  var thisYearAmt = rows.filter(function(r) { return r.year === ly; }).reduce(function(s, r) { return s + (r.totalAmount || 0); }, 0);
  var thisMonthAmt = rows.filter(function(r) { return r.year === curY && r.month === curM; }).reduce(function(s, r) { return s + (r.totalAmount || 0); }, 0);
  var totalAmt = rows.reduce(function(s, r) { return s + (r.totalAmount || 0); }, 0);

  var prevY = years[years.length - 2];
  var prevYearAmt = prevY ? rows.filter(function(r) { return r.year === prevY; }).reduce(function(s, r) { return s + (r.totalAmount || 0); }, 0) : 0;
  var yoyDiff = thisYearAmt - prevYearAmt;
  var yoyStr = prevYearAmt > 0 ? (yoyDiff >= 0 ? '▲ +' : '▼ ') + fmtMoney(Math.abs(yoyDiff)) + ' vs ' + prevY : '—';
  var yoyColor = yoyDiff >= 0 ? '#44e87a' : '#ff5577';

  el.innerHTML =
    '<div class="kpi-card green"><div class="kpi-label">' + ly + '년 총 매출</div><div class="kpi-value" style="font-size:26px;color:#44e87a;">' + fmtMoney(thisYearAmt) + '</div><div class="kpi-sub" style="color:' + yoyColor + '">' + yoyStr + '</div></div>' +
    '<div class="kpi-card blue"><div class="kpi-label">이달 매출 (' + curM + '월)</div><div class="kpi-value" style="font-size:26px;">' + fmtMoney(thisMonthAmt) + '</div><div class="kpi-sub">올해 월평균: ' + fmtMoney(Math.round(thisYearAmt / curM)) + '</div></div>' +
    '<div class="kpi-card yellow"><div class="kpi-label">전체 기간 누적 매출</div><div class="kpi-value" style="font-size:22px;">' + fmtMoney(totalAmt) + '</div><div class="kpi-sub">' + years[0] + ' ~ ' + ly + '</div></div>';
}

// ── 월별 매출 추이 ──
function salesRenderMonthly() {
  var sel = document.getElementById('salesMonthlyYear');
  if (!sel) return;
  var yr = parseInt(sel.value) || years[years.length - 1];
  var rows = _getSalesRows().filter(function(r) { return r.year === yr; });
  var monthly = [];
  for (var m = 1; m <= 12; m++) {
    monthly.push(rows.filter(function(r) { return r.month === m; }).reduce(function(s, r) { return s + (r.totalAmount || 0); }, 0));
  }
  _destroyChart('monthly');
  var ctx = document.getElementById('salesMonthlyChart');
  if (!ctx) return;
  _salesCharts['monthly'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
      datasets: [{
        label: yr + '년 매출',
        data: monthly,
        backgroundColor: monthly.map(function(v, i) {
          var now = new Date(); return (i === now.getMonth() && yr === now.getFullYear()) ? 'rgba(255,184,48,.85)' : 'rgba(0,212,255,.6)';
        }),
        borderColor: 'rgba(0,212,255,.9)', borderWidth: 1, borderRadius: 5
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: function(ctx) { return fmtMoneyFull(ctx.raw); } } }
      },
      scales: {
        x: { ticks: { color: '#b0bcdb' }, grid: { color: '#3a4260' } },
        y: { ticks: { color: '#b0bcdb', callback: function(v) { return fmtMoney(v); } }, grid: { color: '#3a4260' } }
      }
    }
  });
}

// ── 전년 동기 비교 ──
function salesRenderYoY() {
  var selA = document.getElementById('salesYoYA');
  var selB = document.getElementById('salesYoYB');
  if (!selA || !selB) return;
  var ya = parseInt(selA.value), yb = parseInt(selB.value);
  if (!ya || !yb || ya === yb) return;
  var rowsBase = _getSalesRows();
  var rA = rowsBase.filter(function(r) { return r.year === ya; });
  var rB = rowsBase.filter(function(r) { return r.year === yb; });
  var dataA = [], dataB = [];
  for (var m = 1; m <= 12; m++) {
    dataA.push(rA.filter(function(r) { return r.month === m; }).reduce(function(s, r) { return s + (r.totalAmount || 0); }, 0));
    dataB.push(rB.filter(function(r) { return r.month === m; }).reduce(function(s, r) { return s + (r.totalAmount || 0); }, 0));
  }
  _destroyChart('yoy');
  var ctx = document.getElementById('salesYoYChart');
  if (!ctx) return;
  _salesCharts['yoy'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
      datasets: [
        { label: ya + '년', data: dataA, backgroundColor: 'rgba(0,212,255,.5)', borderColor: 'rgba(0,212,255,.9)', borderWidth: 1, borderRadius: 3 },
        { label: yb + '년', data: dataB, backgroundColor: 'rgba(255,184,48,.5)', borderColor: 'rgba(255,184,48,.9)', borderWidth: 1, borderRadius: 3 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#b0bcdb' } },
        tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': ' + fmtMoneyFull(ctx.raw); } } }
      },
      scales: {
        x: { ticks: { color: '#b0bcdb' }, grid: { color: '#3a4260' } },
        y: { ticks: { color: '#b0bcdb', callback: function(v) { return fmtMoney(v); } }, grid: { color: '#3a4260' } }
      }
    }
  });
}

// ── 발주처별 매출 순위 ──
function salesRenderRank() {
  var sel = document.getElementById('salesRankYear');
  var el = document.getElementById('salesRankTable');
  if (!sel || !el) return;
  var yr = sel.value;
  var rows = _getSalesRows();
  if (yr !== 'all') rows = rows.filter(function(r) { return r.year === parseInt(yr); });
  var clientAmt = {};
  rows.forEach(function(r) { clientAmt[r.client] = (clientAmt[r.client] || 0) + (r.totalAmount || 0); });
  var allSorted = Object.entries(clientAmt).filter(function(e) { return e[1] > 0; }).sort(function(a, b) { return b[1] - a[1]; });
  // 전체 거래처 합계를 100% 기준으로 사용
  var totalAmt = allSorted.reduce(function(s, e) { return s + e[1]; }, 0);
  var top50 = allSorted.slice(0, 50);
  var top50Amt = top50.reduce(function(s, e) { return s + e[1]; }, 0);
  var top50Pct = totalAmt > 0 ? (top50Amt / totalAmt * 100).toFixed(1) : 0;
  var cumul = 0;
  var html = '<thead><tr>' +
    '<th>#</th><th>발주처</th><th>매출</th>' +
    '<th title="전체 거래처 합계 기준 점유율">비율 <span style="font-size:11px;color:var(--text3);">(전체기준)</span></th>' +
    '<th title="1위부터 해당 순위까지 합산한 점유율">누적비율</th>' +
    '</tr></thead><tbody>';
  if (!top50.length) { html += '<tr><td colspan="5" class="empty">금액 데이터 없음</td></tr>'; }
  top50.forEach(function(e, i) {
    var pct = totalAmt > 0 ? (e[1] / totalAmt * 100).toFixed(1) : 0;
    cumul += parseFloat(pct);
    var cumulColor = cumul <= 50 ? 'var(--red)' : cumul <= 80 ? 'var(--yellow)' : 'var(--text3)';
    var safe = e[0].replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    html += '<tr onclick="goHistory(\'' + safe + '\')" style="cursor:pointer">' +
      '<td class="mono" style="color:var(--text3)">' + (i+1) + '</td>' +
      '<td style="font-weight:600">' + e[0] + '</td>' +
      '<td class="mono" style="color:#44e87a">' + fmtMoneyFull(e[1]) + '</td>' +
      '<td class="mono">' + pct + '%</td>' +
      '<td class="mono" style="color:' + cumulColor + '">' + cumul.toFixed(1) + '%</td></tr>';
  });
  // 나머지 거래처 요약 행 추가
  if (allSorted.length > 50) {
    var restCnt = allSorted.length - 50;
    var restAmt = totalAmt - top50Amt;
    var restPct = totalAmt > 0 ? (restAmt / totalAmt * 100).toFixed(1) : 0;
    html += '<tr style="background:var(--surface2);">' +
      '<td class="mono" style="color:var(--text3)">51~</td>' +
      '<td style="color:var(--text3);font-size:13px;">나머지 ' + restCnt.toLocaleString() + '개 거래처</td>' +
      '<td class="mono" style="color:var(--text3)">' + fmtMoney(restAmt) + '</td>' +
      '<td class="mono" style="color:var(--text3)">' + restPct + '%</td>' +
      '<td class="mono" style="color:var(--text3)">100.0%</td></tr>';
  }
  el.innerHTML = html + '</tbody>';
}

// ── 사업장별 매출 ──
function salesRenderBiz() {
  var sel = document.getElementById('salesBizYear');
  var el = document.getElementById('salesBizTable');
  if (!sel || !el) return;
  var yr = sel.value;
  var rows = allRows; // 사업장 필터 없이 전체
  if (yr !== 'all') rows = rows.filter(function(r) { return r.year === parseInt(yr); });
  var bizAmt = {};
  rows.forEach(function(r) {
    if (!r.bizUnit) return;
    bizAmt[r.bizUnit] = (bizAmt[r.bizUnit] || 0) + (r.totalAmount || 0);
  });
  var sorted = Object.entries(bizAmt).filter(function(e) { return e[1] > 0; }).sort(function(a, b) { return b[1] - a[1]; });
  var totalAmt = sorted.reduce(function(s, e) { return s + e[1]; }, 0);

  _destroyChart('biz');
  var ctx = document.getElementById('salesBizChart');
  if (ctx && sorted.length) {
    _salesCharts['biz'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: sorted.map(function(e) { return e[0]; }),
        datasets: [{ data: sorted.map(function(e) { return e[1]; }), backgroundColor: ['#00d4ff','#44e87a','#ffb830','#ff5577','#c084fc','#ff8c42','#38bdf8'], borderWidth: 2, borderColor: '#1a1e2a' }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#b0bcdb', font: { size: 12 } } },
          tooltip: { callbacks: { label: function(ctx) { return ctx.label + ': ' + fmtMoney(ctx.raw); } } }
        }
      }
    });
  }

  var html = '<thead><tr><th>사업장</th><th>매출</th><th>비율</th><th>건수</th></tr></thead><tbody>';
  if (!sorted.length) { html += '<tr><td colspan="4" class="empty">금액 데이터 없음</td></tr>'; }
  sorted.forEach(function(e) {
    var pct = totalAmt > 0 ? (e[1] / totalAmt * 100).toFixed(1) : 0;
    var cnt = rows.filter(function(r) { return r.bizUnit === e[0]; }).length;
    html += '<tr><td style="font-weight:600">' + e[0] + '</td><td class="mono" style="color:#44e87a">' + fmtMoney(e[1]) + '</td><td class="mono">' + pct + '%</td><td class="mono">' + cnt + '</td></tr>';
  });
  el.innerHTML = html + '</tbody>';
}

// ── 신규 vs 기존 거래처 매출 ──
function salesRenderNewOld() {
  var sel = document.getElementById('salesNewOldYear');
  var kpiEl = document.getElementById('salesNewOldKpi');
  if (!sel || !kpiEl) return;
  var yr = parseInt(sel.value) || years[years.length - 1];
  var rows = _getSalesRows();
  var prevClients = new Set(rows.filter(function(r) { return r.year < yr; }).map(function(r) { return r.client; }));
  var thisYearRows = rows.filter(function(r) { return r.year === yr; });
  var existingAmt = 0, newAmt = 0, existingCnt = 0, newCnt = 0;
  var seen = new Set();
  thisYearRows.forEach(function(r) {
    if (prevClients.has(r.client)) { existingAmt += (r.totalAmount || 0); if (!seen.has(r.client)) { existingCnt++; seen.add(r.client); } }
    else { newAmt += (r.totalAmount || 0); if (!seen.has(r.client)) { newCnt++; seen.add(r.client); } }
  });
  var totalAmt = existingAmt + newAmt;
  var existPct = totalAmt > 0 ? (existingAmt / totalAmt * 100).toFixed(1) : 0;
  var newPct = totalAmt > 0 ? (newAmt / totalAmt * 100).toFixed(1) : 0;

  kpiEl.innerHTML =
    '<div class="kpi-card blue"><div class="kpi-label">기존 거래처 매출</div><div class="kpi-value" style="font-size:22px;">' + fmtMoney(existingAmt) + '</div><div class="kpi-sub">' + existPct + '% · ' + existingCnt + '개사</div></div>' +
    '<div class="kpi-card green"><div class="kpi-label">신규 거래처 매출</div><div class="kpi-value" style="font-size:22px;color:#44e87a;">' + fmtMoney(newAmt) + '</div><div class="kpi-sub">' + newPct + '% · ' + newCnt + '개사</div></div>' +
    '<div class="kpi-card yellow"><div class="kpi-label">' + yr + '년 총 매출</div><div class="kpi-value" style="font-size:22px;">' + fmtMoney(totalAmt) + '</div><div class="kpi-sub">기존 + 신규 합산</div></div>';

  _destroyChart('newold');
  var ctx = document.getElementById('salesNewOldChart');
  if (!ctx) return;
  var months = [];
  for (var m = 1; m <= 12; m++) {
    var mRows = thisYearRows.filter(function(r) { return r.month === m; });
    var eAmt = mRows.filter(function(r) { return prevClients.has(r.client); }).reduce(function(s, r) { return s + (r.totalAmount || 0); }, 0);
    var nAmt = mRows.filter(function(r) { return !prevClients.has(r.client); }).reduce(function(s, r) { return s + (r.totalAmount || 0); }, 0);
    months.push({ e: eAmt, n: nAmt });
  }
  _salesCharts['newold'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
      datasets: [
        { label: '기존 거래처', data: months.map(function(m) { return m.e; }), backgroundColor: 'rgba(0,212,255,.6)', borderRadius: 3 },
        { label: '신규 거래처', data: months.map(function(m) { return m.n; }), backgroundColor: 'rgba(68,232,122,.6)', borderRadius: 3 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#b0bcdb' } },
        tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': ' + fmtMoney(ctx.raw); } } }
      },
      scales: {
        x: { stacked: true, ticks: { color: '#b0bcdb' }, grid: { color: '#3a4260' } },
        y: { stacked: true, ticks: { color: '#b0bcdb', callback: function(v) { return fmtMoney(v); } }, grid: { color: '#3a4260' } }
      }
    }
  });
}

// ── 재주문율 ──
function salesRenderReorder() {
  var sel = document.getElementById('salesReorderYear');
  var kpiEl = document.getElementById('salesReorderKpi');
  var tableEl = document.getElementById('salesReorderTable');
  if (!sel || !kpiEl) return;
  var yr = parseInt(sel.value) || years[years.length - 1];
  var rows = _getSalesRows();

  // 해당 연도 이전에 처음 거래한 거래처 중 해당 연도에 재거래한 곳
  var firstYearMap = {};
  rows.forEach(function(r) {
    if (!firstYearMap[r.client] || r.year < firstYearMap[r.client]) firstYearMap[r.client] = r.year;
  });
  var newClientsBeforeYr = Object.keys(firstYearMap).filter(function(c) { return firstYearMap[c] < yr; });
  var reordered = newClientsBeforeYr.filter(function(c) { return rows.some(function(r) { return r.client === c && r.year === yr; }); });
  var rate = newClientsBeforeYr.length > 0 ? (reordered.length / newClientsBeforeYr.length * 100).toFixed(1) : 0;

  // 해당 연도 신규 중 다음 연도에 재거래
  var nextYr = yr + 1;
  var newThisYr = Object.keys(firstYearMap).filter(function(c) { return firstYearMap[c] === yr; });
  var reorderedNext = newThisYr.filter(function(c) { return rows.some(function(r) { return r.client === c && r.year === nextYr; }); });
  var rateNext = newThisYr.length > 0 ? (reorderedNext.length / newThisYr.length * 100).toFixed(1) : 0;

  kpiEl.innerHTML =
    '<div class="kpi-card green"><div class="kpi-label">' + yr + '년 재주문율</div><div class="kpi-value" style="color:#44e87a;">' + rate + '%</div><div class="kpi-sub">' + newClientsBeforeYr.length + '개사 중 ' + reordered.length + '개사 재거래</div></div>' +
    '<div class="kpi-card blue"><div class="kpi-label">' + yr + '년 신규→' + nextYr + '년 유지율</div><div class="kpi-value">' + rateNext + '%</div><div class="kpi-sub">' + newThisYr.length + '개 신규 중 ' + reorderedNext.length + '개 유지</div></div>' +
    '<div class="kpi-card yellow"><div class="kpi-label">' + yr + '년 신규 거래처</div><div class="kpi-value">' + newThisYr.length + '</div><div class="kpi-sub">처음 거래 시작</div></div>';

  if (tableEl) {
    var html = '<thead><tr><th>발주처</th><th>첫 거래년도</th><th>' + yr + '년 매출</th><th>재거래 여부</th></tr></thead><tbody>';
    var reorderData = newClientsBeforeYr.map(function(c) {
      var amt = rows.filter(function(r) { return r.client === c && r.year === yr; }).reduce(function(s, r) { return s + (r.totalAmount || 0); }, 0);
      return { c: c, firstYr: firstYearMap[c], amt: amt, reordered: reordered.includes(c) };
    }).sort(function(a, b) { return b.amt - a.amt; }).slice(0, 30);
    reorderData.forEach(function(d) {
      var safe = d.c.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      html += '<tr onclick="goHistory(\'' + safe + '\')" style="cursor:pointer">' +
        '<td style="font-weight:600">' + d.c + '</td>' +
        '<td class="mono">' + d.firstYr + '년</td>' +
        '<td class="mono" style="color:#44e87a">' + (d.amt > 0 ? fmtMoney(d.amt) : '—') + '</td>' +
        '<td>' + (d.reordered ? '<span class="tag green">✓ 재거래</span>' : '<span class="tag red">미거래</span>') + '</td></tr>';
    });
    tableEl.innerHTML = html + '</tbody>';
  }
}

// ── initSalesTab: 탭 초기화 (initApp에서 호출) ──
function initSalesTab() {
  _insertSalesTabHTML();

  // 연도 셀렉터 채우기
  ['salesMonthlyYear','salesYoYA','salesYoYB','salesNewOldYear','salesReorderYear'].forEach(function(id) {
    var sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '';
    years.forEach(function(y) { var o = document.createElement('option'); o.value = y; o.textContent = y + '년'; sel.appendChild(o); });
    if (id === 'salesYoYA') sel.value = years[years.length-2] || years[0];
    else sel.value = years[years.length-1];
  });
  ['salesRankYear','salesBizYear'].forEach(function(id) {
    var sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '<option value="all">전체 기간</option>';
    years.forEach(function(y) { var o = document.createElement('option'); o.value = y; o.textContent = y + '년'; sel.appendChild(o); });
  });

  // 사업장 필터 버튼
  var pills = document.getElementById('salesBizPills');
  if (pills) {
    pills.innerHTML = bizUnits.map(function(b) {
      return '<span class="sales-biz-pill" data-biz="' + b.replace(/"/g,'&quot;') + '" onclick="salesSetBiz(this.dataset.biz)" style="display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;padding:5px 14px;border-radius:16px;border:2px solid var(--border);cursor:pointer;background:var(--surface2);color:var(--text2);margin-right:6px;white-space:nowrap;">' + b + '</span>';
    }).join('');
  }

  // 이벤트 리스너
  var bizYearSel = document.getElementById('salesBizYear');
  if (bizYearSel) bizYearSel.addEventListener('change', salesRenderBiz);
  var newOldYearSel = document.getElementById('salesNewOldYear');
  if (newOldYearSel) newOldYearSel.addEventListener('change', salesRenderNewOld);
  var reorderYearSel = document.getElementById('salesReorderYear');
  if (reorderYearSel) reorderYearSel.addEventListener('change', salesRenderReorder);

  // 초기 렌더링
  salesRenderAll();
}
