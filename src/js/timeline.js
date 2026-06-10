(function () {
  var dynasties = ['qin', 'han', 'suitang', 'song', 'ming', 'qing'];
  var curDynIdx = 0;
  var timelineEvents = [];
  var timelineZoom = 0;

  function escapeHtml(value) {
    if (window.htmlUtils && typeof window.htmlUtils.escapeHtml === 'function') {
      return window.htmlUtils.escapeHtml(value);
    }

    if (value === null || typeof value === 'undefined') {
      return '';
    }

    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeNumber(value, fallbackValue) {
    var num = Number(value);
    return isFinite(num) ? num : fallbackValue;
  }

  function setDynasties(list) {
    dynasties = Array.isArray(list) ? list : dynasties;
  }

  function setTimelineEvents(events) {
    timelineEvents = Array.isArray(events) ? events : [];
  }

  function selDyn(id, btn) {
    document.querySelectorAll('#dynasty-tabs .dtab').forEach(function (t) { t.classList.remove('act'); });
    if (btn) btn.classList.add('act');
    document.querySelectorAll('#dynasty-features .df').forEach(function (f) { f.style.display = 'none'; });
    var el = document.getElementById('feat-' + id);
    if (el) el.style.display = 'block';
    var idx = dynasties.indexOf(id);
    if (idx >= 0) curDynIdx = idx;
  }

  function prevDyn() {
    curDynIdx = (curDynIdx - 1 + dynasties.length) % dynasties.length;
    selDyn(dynasties[curDynIdx], document.querySelectorAll('#dynasty-tabs .dtab')[curDynIdx]);
  }

  function nextDyn() {
    curDynIdx = (curDynIdx + 1) % dynasties.length;
    selDyn(dynasties[curDynIdx], document.querySelectorAll('#dynasty-tabs .dtab')[curDynIdx]);
  }

  function showTimelineDetail(idx) {
    var e = timelineEvents[idx];
    if (!e) return;
    window.openFeatDet('📅 ' + e.name + '（' + e.year + '）', e.description);
  }

  function showTimelineConn(idx, dim) {
    var e = timelineEvents[idx];
    if (!e || !e.conn) return;
    var dimMap = { pol: '🏛️ 政治影响', eco: '💰 经济影响', cul: '📚 文化影响' };
    var txt = '从【' + e.name + '】到【' + e.conn.next + '】\n\n' + dimMap[dim] + '：\n' + e.conn[dim];
    window.openFeatDet('🔗 ' + e.name + ' → ' + e.conn.next, txt);
  }

  function renderTimeline() {
    var c = document.getElementById('coord-chart');
    if (!c) return;
    var pad = timelineZoom * 20;
    var x0 = 60 - pad, x1 = 400 + pad, y0 = 40 - pad, y1 = 400 + pad;
    var w = x1 - x0 + 40;
    var s = '<svg viewBox="0 0 ' + (w + 60) + ' 480" xmlns="http://www.w3.org/2000/svg">';
    s += '<rect x="30" y="20" width="' + (w + 20) + '" height="440" fill="#FFFBF0" rx="8"/>';
    s += '<line x1="' + x0 + '" y1="' + y1 + '" x2="' + (x1 + 20) + '" y2="' + y1 + '" stroke="#5A3E1B" stroke-width="2"/>';
    s += '<text x="' + (x1 + 10) + '" y="' + (y1 - 5) + '" font-size="10" fill="#C0392B" font-weight="700">政治集权度 →</text>';
    s += '<line x1="' + x0 + '" y1="' + y1 + '" x2="' + x0 + '" y2="' + y0 + '" stroke="#5A3E1B" stroke-width="2"/>';
    s += '<text x="' + (x0 - 25) + '" y="' + (y0 + 10) + '" font-size="10" fill="#27AE60" font-weight="700">経済↑</text>';
    s += '<line x1="' + x0 + '" y1="' + (y1 - 80 + pad) + '" x2="' + (x1 + 20) + '" y2="' + (y0 + 40 - pad) + '" stroke="#8B6914" stroke-width="1.5" stroke-dasharray="6,3"/>';
    s += '<text x="' + (x1 - 20) + '" y="' + (y0 + 30 - pad) + '" font-size="10" fill="#8B6914" font-weight="700">文化 ↗</text>';
    s += '<text x="' + (x0 + (w) / 2) + '" y="' + (y1 + 25) + '" font-size="9" fill="#8A7A6A" text-anchor="middle">一定的政治经济决定一定的思想文化</text>';

    for (var i = 0; i < timelineEvents.length - 1; i++) {
      var a = timelineEvents[i], b = timelineEvents[i + 1];
      if (!a.conn || !b) continue;
      s += '<line x1="' + safeNumber(a.x, 0) + '" y1="' + safeNumber(a.pol, 0) + '" x2="' + safeNumber(b.x, 0) + '" y2="' + safeNumber(b.pol, 0) + '" stroke="#C0392B" stroke-width="1" stroke-dasharray="5,3" opacity="0.4" class="tldash" data-i="' + i + '" data-dim="pol" onclick="showTimelineConn(' + i + ',\'pol\')" style="cursor:pointer"/>';
      s += '<line x1="' + safeNumber(a.x, 0) + '" y1="' + safeNumber(a.eco, 0) + '" x2="' + safeNumber(b.x, 0) + '" y2="' + safeNumber(b.eco, 0) + '" stroke="#27AE60" stroke-width="1" stroke-dasharray="5,3" opacity="0.4" class="tldash" data-i="' + i + '" data-dim="eco" onclick="showTimelineConn(' + i + ',\'eco\')" style="cursor:pointer"/>';
      s += '<line x1="' + safeNumber(a.x, 0) + '" y1="' + safeNumber(a.cul, 0) + '" x2="' + safeNumber(b.x, 0) + '" y2="' + safeNumber(b.cul, 0) + '" stroke="#8B6914" stroke-width="1" stroke-dasharray="5,3" opacity="0.4" class="tldash" data-i="' + i + '" data-dim="cul" onclick="showTimelineConn(' + i + ',\'cul\')" style="cursor:pointer"/>';
    }

    timelineEvents.forEach(function (d) {
      s += '<circle cx="' + safeNumber(d.x, 0) + '" cy="' + safeNumber(d.pol, 0) + '" r="6" fill="#C0392B" opacity="0.85" stroke="#fff" stroke-width="1" class="tlevt" onclick="showTimelineDetail(' + timelineEvents.indexOf(d) + ')" style="cursor:pointer"/>';
      s += '<text x="' + safeNumber(d.x, 0) + '" y="' + (safeNumber(d.pol, 0) - 10) + '" font-size="8" text-anchor="middle" fill="#C0392B" font-weight="700">' + escapeHtml(d.name) + '</text>';
      s += '<text x="' + safeNumber(d.x, 0) + '" y="' + (safeNumber(d.pol, 0) - 20) + '" font-size="7" text-anchor="middle" fill="#8A7A6A">' + escapeHtml(d.year) + '</text>';
      s += '<circle cx="' + safeNumber(d.x, 0) + '" cy="' + safeNumber(d.eco, 0) + '" r="5" fill="#27AE60" opacity="0.85" stroke="#fff" stroke-width="1"/>';
      s += '<circle cx="' + safeNumber(d.x, 0) + '" cy="' + safeNumber(d.cul, 0) + '" r="4" fill="#8B6914" opacity="0.85" stroke="#fff" stroke-width="1"/>';
    });
    s += '<text x="' + (x0 + (w) / 2) + '" y="' + (y1 + 40) + '" font-size="8" fill="#8A7A6A" text-anchor="middle">🔴政治  🟢经济  🟤文化  |  从秦至清，政治集权逐步增强，经济与文化同步演进</text>';
    s += '<text x="' + (x0 + (w) / 2) + '" y="' + (y1 + 53) + '" font-size="7" fill="#C0392B" text-anchor="middle" opacity="0.7">点按虚线上每段可查看事件间相坒作用</text>';
    s += '</svg>'; c.innerHTML = s;
  }

  function zoomTL(dir) {
    timelineZoom = Math.max(0, Math.min(5, timelineZoom + dir));
    renderTimeline();
    renderEventList();
    window.showToast(dir > 0 ? '放大时间跨度：查看细节' : '缩小时间跨度：查看全景');
  }

  function renderEventList() {
    var el = document.getElementById('event-list');
    if (!el) return;
    var h = '';
    timelineEvents.forEach(function (d, i) {
      h += '<div class="evitem" onclick="showTimelineDetail(' + i + ')"><div class="evdot pol"></div><div class="evtxt"><h5>' + escapeHtml(d.name) + ' <span class="evyr">' + escapeHtml(d.year) + '</span></h5><div class="evdesc">' + escapeHtml(d.description) + '</div></div></div>';
    });
    el.innerHTML = h || '<div style="padding:16px;text-align:center;color:#B5ADA5">暂无事件数据</div>';
  }

  // SVG drag
  (function () {
    var cc = document.getElementById('coord-chart'), isDrag = false, sx, sy, st, svg = null;
    if (!cc) return;
    cc.addEventListener('mousedown', function (e) { isDrag = true; sx = e.clientX; sy = e.clientY; st = Date.now(); cc.classList.add('dragging'); if (!svg) svg = cc.querySelector('svg'); e.preventDefault(); });
    cc.addEventListener('touchstart', function (e) { if (e.touches.length === 1) { isDrag = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now(); cc.classList.add('dragging'); } }, { passive: true });
    document.addEventListener('mousemove', function (e) { if (!isDrag || !svg) return; var dx = e.clientX - sx, dy = e.clientY - sy; sx = e.clientX; sy = e.clientY; var t = getComputedStyle(svg).transform; var mx = 0, my = 0; if (t && t !== 'none') { var m = t.match(/matrix\(([^)]+)\)/); if (m) { var v = m[1].split(','); mx = parseFloat(v[4]) || 0; my = parseFloat(v[5]) || 0; } } svg.style.transform = 'translate(' + (mx + dx) + 'px,' + (my + dy) + 'px)'; });
    document.addEventListener('touchmove', function (e) { if (!isDrag || !svg || e.touches.length !== 1) return; var dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy; sx = e.touches[0].clientX; sy = e.touches[0].clientY; var t = getComputedStyle(svg).transform; var mx = 0, my = 0; if (t && t !== 'none') { var m = t.match(/matrix\(([^)]+)\)/); if (m) { var v = m[1].split(','); mx = parseFloat(v[4]) || 0; my = parseFloat(v[5]) || 0; } } svg.style.transform = 'translate(' + (mx + dx) + 'px,' + (my + dy) + 'px)'; });
    document.addEventListener('mouseup', function () { if (isDrag) { isDrag = false; cc.classList.remove('dragging'); if (svg) svg.style.transition = 'transform .4s ease'; setTimeout(function () { if (svg) svg.style.transition = ''; }, 400); } });
    document.addEventListener('touchend', function () { if (isDrag) { isDrag = false; cc.classList.remove('dragging'); if (svg) svg.style.transition = 'transform .4s ease'; setTimeout(function () { if (svg) svg.style.transition = ''; }, 400); } });
  })();

  window.timelineAPI = {
    setDynasties: setDynasties,
    setTimelineEvents: setTimelineEvents,
    selDyn: selDyn,
    prevDyn: prevDyn,
    nextDyn: nextDyn,
    showTimelineDetail: showTimelineDetail,
    showTimelineConn: showTimelineConn,
    renderTimeline: renderTimeline,
    zoomTL: zoomTL,
    renderEventList: renderEventList
  };
})();
