// ══════════════════════════════════════════════════════
// patch.js — 파싱 수정 + 기존 탭 보강
// 디자인세창 영업 마스터 CRM
// ══════════════════════════════════════════════════════

// ── 새 전역 변수 ──
var bizUnits = [];
var _bizFilter = 'all';

// ── 금액/수량 파싱 유틸 ──
function parseMoney(v) {
  if (!v && v !== 0) return 0;
  if (typeof v === 'number') return v;
  var n = parseFloat(String(v).replace(/[,원\s]/g, ''));
  return isNaN(n) ? 0 : n;
}
function parseQty(v) {
  if (!v) return 0;
  var n = parseInt(String(v).replace(/[^0-9]/g, ''));
  return isNaN(n) ? 0 : n;
}
function fmtMoney(n) {
  if (!n || n === 0) return '—';
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '억';
  if (n >= 10000) return Math.round(n / 10000).toLocaleString() + '만원';
  return n.toLocaleString() + '원';
}
function fmtMoneyFull(n) {
  if (!n || n === 0) return '—';
  return n.toLocaleString() + '원';
}

// ── parseDate 재정의 (YY-MM-DD 지원 추가) ──
window._origParseDate = window.parseDate;
window.parseDate = function(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return isNaN(raw) ? null : raw;
  if (typeof raw === 'number') {
    var d = new Date(Math.round((raw - 25569) * 86400 * 1000));
    return isNaN(d) ? null : d;
  }
  if (typeof raw === 'string') {
    var s = raw.trim();
    // YY-MM-DD → 20YY-MM-DD
    if (/^\d{2}-\d{2}-\d{2}$/.test(s)) s = '20' + s;
    var d2 = new Date(s.replace(/\./g, '-'));
    return isNaN(d2) ? null : d2;
  }
  return null;
};

// ── loadFile 재정의 (새 컬럼 포함) ──
window.loadFile = function(file) {
  window.setLoading(20);
  var reader = new FileReader();
  reader.onload = function(e) {
    window.setLoading(50);
    try {
      var wb = XLSX.read(e.target.result, { type: 'array', cellDates: true });
      allRows = [];
      wb.SheetNames.forEach(function(sn) {
        var ws = wb.Sheets[sn];
        var data = XLSX.utils.sheet_to_json(ws, { defval: '' });
        data.forEach(function(row) {
          var n = {};
          Object.keys(row).forEach(function(k) { n[k.trim()] = row[k]; });
          var date = parseDate(n['일자'] || n['날짜'] || '');
          if (!date) return;
          var client = (n['발주처'] || '').toString().trim();
          if (!client) return;
          var delivDate = parseDate(n['납기'] || n['납품일'] || '');
          var delivStr = delivDate
            ? (delivDate.getFullYear() + '-' + String(delivDate.getMonth()+1).padStart(2,'0') + '-' + String(delivDate.getDate()).padStart(2,'0'))
            : '';
          allRows.push({
            date: date,
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            jobNo: (n['작업번호'] || '').toString().trim(),
            client: client,
            manager: (n['담당자'] || '').toString().trim(),
            subject: (n['건명'] || '').toString().trim(),
            phone: (n['핸드폰'] || n['연락처'] || '').toString().trim(),
            tel: (n['일반전화'] || '').toString().trim(),
            email: (n['이메일'] || '').toString().trim(),
            size: (n['사이즈'] || '').toString().trim(),
            page: (n['페이지'] !== undefined && n['페이지'] !== '') ? String(parseFloat(n['페이지']) || 0) : '',
            qty: parseQty(n['수량'] || 0),
            deliveryDate: delivStr,
            unitPrice: parseMoney(n['단가'] || 0),
            totalAmount: parseMoney(n['금액'] || n['총금액'] || 0),
            bizUnit: (n['사업장'] || '').toString().trim(),
            deliveryPerson: (n['발송인'] || '').toString().trim()
          });
        });
      });
      window.setLoading(80);
      years = [...new Set(allRows.map(function(r) { return r.year; }))].sort(function(a, b) { return a - b; });
      clients = [...new Set(allRows.map(function(r) { return r.client; }))].filter(Boolean).sort();
      bizUnits = [...new Set(allRows.map(function(r) { return r.bizUnit; }))].filter(Boolean).sort();
      // localStorage 저장 (v3 포맷)
      _saveToStorageV3();
      initApp();
      window.setLoading(100);
      setTimeout(function() { window.setLoading(0); }, 500);
    } catch(err) {
      alert('파일 읽기 오류: ' + err.message);
      window.setLoading(0);
    }
  };
  reader.readAsArrayBuffer(file);
};

// ── localStorage v3 저장/로드 ──
var _LS_KEY_V3 = 'salesmaster_data_v3';
var _LS_META_V3 = 'salesmaster_meta_v3';

function _saveToStorageV3() {
  try {
    var pool = [], poolMap = {};
    function intern(s) {
      var k = String(s || '');
      if (poolMap[k] === undefined) { poolMap[k] = pool.length; pool.push(k); }
      return poolMap[k];
    }
    var cols = [];
    allRows.forEach(function(r) {
      cols.push([
        r.date.getTime(), r.year, r.month,
        intern(r.client), intern(r.manager), intern(r.subject),
        intern(r.phone), intern(r.tel), intern(r.email), intern(r.jobNo),
        r.totalAmount || 0, r.unitPrice || 0, r.qty || 0,
        intern(r.size || ''), intern(r.page || ''), intern(r.deliveryDate || ''),
        intern(r.bizUnit || ''), intern(r.deliveryPerson || '')
      ]);
    });
    var payload = { pool: pool, cols: cols, v: 3 };
    localStorage.setItem(_LS_KEY_V3, JSON.stringify(payload));
    var meta = { savedAt: new Date().toISOString(), rowCount: allRows.length, years: years, clientCount: clients.length };
    localStorage.setItem(_LS_META_V3, JSON.stringify(meta));
    // 기존 badge 업데이트
    if (typeof updateSavedBadge === 'function') updateSavedBadge();
    console.log('v3 saved:', allRows.length, 'rows');
    return true;
  } catch(e) {
    console.warn('v3 save failed:', e);
    return false;
  }
}

function _loadFromStorageV3() {
  try {
    var raw = localStorage.getItem(_LS_KEY_V3);
    if (!raw) return false;
    var payload = JSON.parse(raw);
    if (payload.v !== 3) return false;
    var pool = payload.pool, cols = payload.cols;
    allRows = cols.map(function(c) {
      return {
        date: new Date(c[0]), year: c[1], month: c[2],
        client: pool[c[3]] || '', manager: pool[c[4]] || '',
        subject: pool[c[5]] || '', phone: pool[c[6]] || '',
        tel: pool[c[7]] || '', email: pool[c[8]] || '', jobNo: pool[c[9]] || '',
        totalAmount: c[10] || 0, unitPrice: c[11] || 0, qty: c[12] || 0,
        size: pool[c[13]] || '', page: pool[c[14]] || '',
        deliveryDate: pool[c[15]] || '',
        bizUnit: pool[c[16]] || '', deliveryPerson: pool[c[17]] || ''
      };
    });
    years = [...new Set(allRows.map(function(r) { return r.year; }))].sort(function(a, b) { return a - b; });
    clients = [...new Set(allRows.map(function(r) { return r.client; }))].filter(Boolean).sort();
    bizUnits = [...new Set(allRows.map(function(r) { return r.bizUnit; }))].filter(Boolean).sort();
    return true;
  } catch(e) {
    console.error('v3 load error:', e);
    return false;
  }
}

// ── smLoadData 재정의 (v3 파싱 포함) ──
window.smLoadData = function() {
  // v3 로컬스토리지 우선 시도
  if (_loadFromStorageV3()) {
    console.log('Loaded from v3 localStorage:', allRows.length, 'rows');
    _smCheckServer();
    return;
  }
  // v2 로컬스토리지 시도 (하위호환)
  try {
    if (localStorage.getItem('salesmaster_data_v2') && typeof loadFromStorage === 'function' && loadFromStorage()) {
      // v2 로드 성공 시 새 필드 기본값으로 패치
      allRows.forEach(function(r) {
        if (r.totalAmount === undefined) r.totalAmount = 0;
        if (r.unitPrice === undefined) r.unitPrice = 0;
        if (r.qty === undefined) r.qty = 0;
        if (r.size === undefined) r.size = '';
        if (r.page === undefined) r.page = '';
        if (r.deliveryDate === undefined) r.deliveryDate = '';
        if (r.bizUnit === undefined) r.bizUnit = '';
        if (r.deliveryPerson === undefined) r.deliveryPerson = '';
      });
      bizUnits = [...new Set(allRows.map(function(r) { return r.bizUnit; }))].filter(Boolean).sort();
      _smCheckServer();
      return;
    }
  } catch(e) {}

  // 서버에서 로드
  var ov = document.getElementById('smLoadingOv');
  if (ov) ov.classList.add('show');
  smPost({ action: 'data', token: smSession.token })
    .then(function(res) {
      if (ov) ov.classList.remove('show');
      if (!res.ok || !res.hasData) { checkSavedDataOnStart(); return; }
      var bin = atob(res.fileBase64), buf = new ArrayBuffer(bin.length), view = new Uint8Array(buf);
      for (var i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
      setLoading(50);
      var wb = XLSX.read(buf, { type: 'array', cellDates: true });
      allRows = [];
      wb.SheetNames.forEach(function(sn) {
        var ws = wb.Sheets[sn];
        var data = XLSX.utils.sheet_to_json(ws, { defval: '' });
        data.forEach(function(row) {
          var n = {};
          Object.keys(row).forEach(function(k) { n[k.trim()] = row[k]; });
          var date = parseDate(n['일자'] || n['날짜'] || '');
          if (!date) return;
          var client = (n['발주처'] || '').toString().trim();
          if (!client) return;
          var delivDate = parseDate(n['납기'] || n['납품일'] || '');
          var delivStr = delivDate
            ? (delivDate.getFullYear() + '-' + String(delivDate.getMonth()+1).padStart(2,'0') + '-' + String(delivDate.getDate()).padStart(2,'0'))
            : '';
          allRows.push({
            date: date, year: date.getFullYear(), month: date.getMonth() + 1,
            jobNo: (n['작업번호'] || '').toString().trim(), client: client,
            manager: (n['담당자'] || '').toString().trim(),
            subject: (n['건명'] || '').toString().trim(),
            phone: (n['핸드폰'] || n['연락처'] || '').toString().trim(),
            tel: (n['일반전화'] || '').toString().trim(),
            email: (n['이메일'] || '').toString().trim(),
            size: (n['사이즈'] || '').toString().trim(),
            page: (n['페이지'] !== undefined && n['페이지'] !== '') ? String(parseFloat(n['페이지']) || 0) : '',
            qty: parseQty(n['수량'] || 0),
            deliveryDate: delivStr,
            unitPrice: parseMoney(n['단가'] || 0),
            totalAmount: parseMoney(n['금액'] || n['총금액'] || 0),
            bizUnit: (n['사업장'] || '').toString().trim(),
            deliveryPerson: (n['발송인'] || '').toString().trim()
          });
        });
      });
      years = [...new Set(allRows.map(function(r) { return r.year; }))].sort(function(a, b) { return a - b; });
      clients = [...new Set(allRows.map(function(r) { return r.client; }))].filter(Boolean).sort();
      bizUnits = [...new Set(allRows.map(function(r) { return r.bizUnit; }))].filter(Boolean).sort();
      _saveToStorageV3();
      initApp();
      setLoading(100);
      setTimeout(function() { setLoading(0); }, 500);
      var badge = document.getElementById('savedDataBadge');
      if (badge && res.uploadedAt) {
        var d = new Date(res.uploadedAt);
        badge.textContent = '☁ 서버 ' + d.getFullYear() + '.' + String(d.getMonth()+1).padStart(2,'0') + '.' + String(d.getDate()).padStart(2,'0');
        badge.style.display = 'inline-block';
      }
    })
    .catch(function() { if (ov) ov.classList.remove('show'); checkSavedDataOnStart(); });
};

function _smCheckServer() {
  smPost({ action: 'data', token: smSession ? smSession.token : '' })
    .then(function(res) {
      if (!res.ok || !res.hasData) return;
      var badge = document.getElementById('savedDataBadge');
      if (!badge || !res.uploadedAt) return;
      var meta = JSON.parse(localStorage.getItem(_LS_META_V3) || 'null') || JSON.parse(localStorage.getItem('salesmaster_meta_v2') || 'null');
      var serverT = new Date(res.uploadedAt).getTime();
      var localT = meta ? new Date(meta.savedAt).getTime() : 0;
      var d = new Date(res.uploadedAt);
      var ds = d.getFullYear() + '.' + String(d.getMonth()+1).padStart(2,'0') + '.' + String(d.getDate()).padStart(2,'0');
      if (serverT > localT + 60000) {
        badge.textContent = '🔔 새 데이터 ' + ds + '! 클릭→업데이트';
        badge.style.cssText = 'display:inline-block;background:rgba(255,184,48,.2);color:#ffb830;border:1px solid rgba(255,184,48,.4);padding:4px 12px;border-radius:16px;cursor:pointer;font-weight:700;font-family:IBM Plex Mono,monospace;font-size:12px;';
        badge.onclick = function() {
          if (confirm('새 데이터가 있습니다. 재로그인하시겠습니까?')) {
            try { localStorage.removeItem(_LS_KEY_V3); localStorage.removeItem(_LS_META_V3); localStorage.removeItem('salesmaster_data_v2'); localStorage.removeItem('salesmaster_meta_v2'); } catch(e) {}
            smClearSession(); location.reload();
          }
        };
      } else {
        badge.textContent = '☁ 서버 ' + ds;
        badge.style.display = 'inline-block';
      }
    }).catch(function() {});
}

// ── initApp 후처리 훅 (새 탭 초기화 연결) ──
var _origInitApp = null;
function _patchInitApp() {
  _origInitApp = window.initApp;
  window.initApp = function() {
    _origInitApp();
    // 매출/제작물 탭 초기화 (sales.js, product.js 로드된 경우)
    if (typeof initSalesTab === 'function') initSalesTab();
    if (typeof initProductTab === 'function') initProductTab();
    // 대시보드 매출 KPI 보강
    _patchDashboard();
    // 거래처 히스토리 보강 (showClientHistory 재정의)
    _patchHistoryDetail();
    // 담당자 분석 보강
    _patchManagerTab();
    // 이탈감지 보강
    _patchAlertTab();
  };
}

// ── 대시보드 KPI 보강 ──
function _patchDashboard() {
  var origRenderDashboard = window.renderDashboard;
  window.renderDashboard = function() {
    origRenderDashboard();
    _addDashboardSalesKpi();
    _addConcentrationWarning();
  };
  // 즉시 실행 (이미 initApp에서 renderDashboard 호출됨)
  setTimeout(function() {
    _addDashboardSalesKpi();
    _addConcentrationWarning();
  }, 100);
}

function _addDashboardSalesKpi() {
  var kpiGrid = document.getElementById('kpiGrid');
  if (!kpiGrid) return;
  var now = new Date();
  var curY = now.getFullYear(), curM = now.getMonth() + 1;

  var thisMonthRows = allRows.filter(function(r) { return r.year === curY && r.month === curM; });
  var thisMonthAmt = thisMonthRows.reduce(function(s, r) { return s + (r.totalAmount || 0); }, 0);

  var prevM = curM === 1 ? 12 : curM - 1;
  var prevY = curM === 1 ? curY - 1 : curY;
  var prevMonthRows = allRows.filter(function(r) { return r.year === prevY && r.month === prevM; });
  var prevMonthAmt = prevMonthRows.reduce(function(s, r) { return s + (r.totalAmount || 0); }, 0);

  var diff = thisMonthAmt - prevMonthAmt;
  var diffStr = (diff >= 0 ? '▲ +' : '▼ ') + fmtMoney(Math.abs(diff));
  var diffColor = diff >= 0 ? '#44e87a' : '#ff5577';

  // 이달 최대 거래처
  var clientAmt = {};
  thisMonthRows.forEach(function(r) { clientAmt[r.client] = (clientAmt[r.client] || 0) + (r.totalAmount || 0); });
  var topEntry = Object.entries(clientAmt).filter(function(e) { return e[1] > 0; }).sort(function(a, b) { return b[1] - a[1]; })[0];

  // 이달 총 수량
  var thisMonthQty = thisMonthRows.reduce(function(s, r) { return s + (r.qty || 0); }, 0);

  var newCards = '';
  if (thisMonthAmt > 0) {
    newCards += '<div class="kpi-card green" style="border-color:rgba(68,232,122,.4);">' +
      '<div class="kpi-label">이달 총 매출 (' + curM + '월)</div>' +
      '<div class="kpi-value" style="color:#44e87a;font-size:26px;">' + fmtMoney(thisMonthAmt) + '</div>' +
      '<div class="kpi-sub" style="color:' + diffColor + '">' + diffStr + ' 전월 대비</div></div>';
  }
  if (topEntry) {
    newCards += '<div class="kpi-card yellow">' +
      '<div class="kpi-label">이달 최대 거래처</div>' +
      '<div class="kpi-value" style="font-size:16px;line-height:1.3;color:#ffb830;">' + topEntry[0] + '</div>' +
      '<div class="kpi-sub">' + fmtMoney(topEntry[1]) + '</div></div>';
  }
  if (thisMonthRows.length > 0) {
    newCards += '<div class="kpi-card purple">' +
      '<div class="kpi-label">이달 발주 건수 (' + curM + '월)</div>' +
      '<div class="kpi-value" style="color:#c084fc;">' + thisMonthRows.length.toLocaleString() + '</div>' +
      '<div class="kpi-sub">전월 ' + prevMonthRows.length.toLocaleString() + '건</div></div>';
  }

  if (newCards) {
    var wrapper = document.createElement('div');
    wrapper.id = 'salesKpiCards';
    wrapper.className = 'kpi-grid';
    wrapper.style.marginBottom = '18px';
    wrapper.innerHTML = newCards;
    var existing = document.getElementById('salesKpiCards');
    if (existing) existing.remove();
    kpiGrid.parentNode.insertBefore(wrapper, kpiGrid.nextSibling);
  }
}

function _addConcentrationWarning() {
  var ly = years[years.length - 1];
  if (!ly) return;
  var lR = allRows.filter(function(r) { return r.year === ly; });
  var totalAmt = lR.reduce(function(s, r) { return s + (r.totalAmount || 0); }, 0);
  if (totalAmt === 0) return;

  var clientAmts = {};
  lR.forEach(function(r) { clientAmts[r.client] = (clientAmts[r.client] || 0) + (r.totalAmount || 0); });
  var sorted = Object.entries(clientAmts).sort(function(a, b) { return b[1] - a[1]; });
  var top3Amt = sorted.slice(0, 3).reduce(function(s, e) { return s + e[1]; }, 0);
  var conc = (top3Amt / totalAmt * 100).toFixed(1);

  var existing = document.getElementById('_concentrationWarn');
  if (existing) existing.remove();

  if (parseFloat(conc) >= 50) {
    var top3Names = sorted.slice(0, 3).map(function(e) { return e[0]; }).join(', ');
    var warn = document.createElement('div');
    warn.id = '_concentrationWarn';
    warn.style.cssText = 'background:rgba(255,85,119,.08);border:1px solid rgba(255,85,119,.3);border-left:4px solid #ff5577;border-radius:8px;padding:14px 18px;margin-bottom:18px;font-size:14px;color:#b0bcdb;';
    warn.innerHTML = '⚠️ <strong style="color:#ff5577">매출 집중도 주의</strong>: ' + ly + '년 상위 3개 거래처(' + top3Names + ')가 전체 매출의 <strong style="color:#ff5577">' + conc + '%</strong>를 차지하고 있습니다. 신규 거래처 개발을 권장합니다.';
    var thisMonthAlert = document.getElementById('thisMonthAlert');
    if (thisMonthAlert) thisMonthAlert.parentNode.insertBefore(warn, thisMonthAlert.nextSibling);
  }
}

// ── 거래처 히스토리 상세 보강 ──
function _patchHistoryDetail() {
  var origShow = window.showClientHistory;
  window.showClientHistory = function(client) {
    origShow(client);
    // 기존 showClientHistory 결과에 금액 정보 주입
    var detail = document.getElementById('historyDetail');
    if (!detail) return;
    var rows = allRows.filter(function(r) { return r.client === client; });
    var totalAmt = rows.reduce(function(s, r) { return s + (r.totalAmount || 0); }, 0);
    if (totalAmt === 0) return; // 금액 없으면 패치 불필요

    // 누적 금액 뱃지 추가 (맨 위 summary div)
    var tagArea = detail.querySelector('.kpi-card, .tag.blue');
    if (!tagArea) return;
    var parent = tagArea.parentNode;
    var existing = parent.querySelector('._amtBadge');
    if (!existing) {
      var span = document.createElement('span');
      span.className = 'tag green _amtBadge';
      span.textContent = '누적 ' + fmtMoney(totalAmt);
      parent.insertBefore(span, tagArea.nextSibling);
    }
  };
}

// ── 담당자 분석 보강 (매출 기여도) ──
function _patchManagerTab() {
  var origRender = window.renderManagerTab;
  var origShowDetail = window.showMgrDetail;

  window.renderManagerTab = function() {
    origRender();
    // 담당자 카드에 매출 금액 추가
    setTimeout(function() {
      var cards = document.querySelectorAll('.mgr-card');
      var totalAll = allRows.reduce(function(s, r) { return s + (r.totalAmount || 0); }, 0);
      cards.forEach(function(card) {
        var idx = parseInt(card.dataset.midx);
        if (isNaN(idx) || !window._mgrList || !window._mgrList[idx]) return;
        var m = window._mgrList[idx];
        var amt = m.rows.reduce(function(s, r) { return s + (r.totalAmount || 0); }, 0);
        if (amt === 0) return;
        var pct = totalAll > 0 ? (amt / totalAll * 100).toFixed(1) : '0';
        var meta = card.querySelector('.mgr-meta');
        if (meta && !meta.querySelector('._mgrAmt')) {
          var span = document.createElement('span');
          span.className = '_mgrAmt';
          span.style.cssText = 'color:#44e87a;font-family:IBM Plex Mono,monospace;margin-left:8px;';
          span.textContent = fmtMoney(amt) + ' (' + pct + '%)';
          meta.appendChild(span);
        }
      });
    }, 150);
  };

  window.showMgrDetail = function(idx) {
    origShowDetail(idx);
    // 상세 패널에 연도별 매출 합계 추가
    setTimeout(function() {
      var detail = document.getElementById('mgrDetail');
      if (!detail || !window._mgrList || !window._mgrList[idx]) return;
      var m = window._mgrList[idx];
      var totalAmt = m.rows.reduce(function(s, r) { return s + (r.totalAmount || 0); }, 0);
      if (totalAmt === 0) return;
      var tagArea = detail.querySelector('.tag.blue');
      if (tagArea && !detail.querySelector('._mgrTotalAmt')) {
        var span = document.createElement('span');
        span.className = 'tag green _mgrTotalAmt';
        span.textContent = '누적 매출 ' + fmtMoney(totalAmt);
        tagArea.parentNode.insertBefore(span, tagArea.nextSibling);
      }
    }, 150);
  };
}

// ── 이탈 감지 보강 (마지막 발주 금액 + 발주 주기) ──
function _patchAlertTab() {
  var origRenderAlert = window.renderAlert;
  window.renderAlert = function() {
    origRenderAlert();
    // 이탈 목록 각 항목에 금액/주기 추가
    setTimeout(function() {
      ['alertGone', 'alertReduced'].forEach(function(id) {
        var container = document.getElementById(id);
        if (!container) return;
        var items = container.querySelectorAll('.alert-item');
        items.forEach(function(item) {
          var titleEl = item.querySelector('.a-title');
          if (!titleEl) return;
          var client = titleEl.textContent.trim();
          var clientRows = allRows.filter(function(r) { return r.client === client; }).sort(function(a, b) { return b.date - a.date; });
          if (!clientRows.length) return;
          var lastAmt = clientRows[0].totalAmount || 0;
          var totalAmt = clientRows.reduce(function(s, r) { return s + (r.totalAmount || 0); }, 0);
          // 발주 주기 계산
          var dates = clientRows.map(function(r) { return r.date.getTime(); }).sort(function(a, b) { return a - b; });
          var cycleStr = '';
          if (dates.length > 1) {
            var diffs = [];
            for (var i = 1; i < dates.length; i++) diffs.push((dates[i] - dates[i-1]) / 86400000);
            var avg = Math.round(diffs.reduce(function(s, d) { return s + d; }, 0) / diffs.length);
            cycleStr = ' · 평균 ' + avg + '일 주기';
          }
          var metaEl = item.querySelector('.a-meta');
          if (metaEl && !item.querySelector('._alertAmt')) {
            var extra = document.createElement('div');
            extra.className = '_alertAmt';
            extra.style.cssText = 'font-size:12px;margin-top:3px;color:#b0bcdb;font-family:IBM Plex Mono,monospace;';
            extra.innerHTML = (lastAmt > 0 ? '최근 발주 <span style="color:#44e87a">' + fmtMoney(lastAmt) + '</span>' : '') +
              (totalAmt > 0 ? ' · 누적 <span style="color:#00d4ff">' + fmtMoney(totalAmt) + '</span>' : '') +
              '<span style="color:#7a8ab0">' + cycleStr + '</span>';
            metaEl.parentNode.insertBefore(extra, metaEl.nextSibling);
          }
        });
      });
    }, 200);
  };
}

// ── 페이지 로드 완료 후 패치 적용 ──
(function() {
  function _applyPatch() {
    if (typeof initApp === 'undefined') {
      setTimeout(_applyPatch, 100);
      return;
    }
    _patchInitApp();
    console.log('[patch.js] 패치 적용 완료');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _applyPatch);
  } else {
    _applyPatch();
  }
})();
