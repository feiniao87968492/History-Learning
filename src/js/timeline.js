(function () {
  var dynasties = ['qin', 'han', 'suitang', 'song', 'ming', 'qing'];
  var curDynIdx = 0;
  var timelineEvents = [];
  var timelineZoom = 0;
  var timelineOffsetX = 0;
  var timelineOffsetY = 0;
  var minOffsetX = -220;
  var maxOffsetX = 220;
  var minOffsetY = -160;
  var maxOffsetY = 160;
  var isDragging = false;
  var dragStartX = 0;
  var dragStartY = 0;
  var TIMELINE_CHART = {
    width: 460,
    height: 480,
    plotLeft: 60,
    plotRight: 400,
    plotTop: 40,
    plotBottom: 400,
    xPadding: 18
  };

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

  function clamp(value, minValue, maxValue) {
    return Math.max(minValue, Math.min(maxValue, value));
  }

  function formatCoord(value) {
    return String(Math.round(value * 100) / 100);
  }

  function getZoomScale() {
    return Math.pow(1.22, timelineZoom);
  }

  function mapRange(value, sourceMin, sourceMax, targetMin, targetMax) {
    if (sourceMax === sourceMin) {
      return (targetMin + targetMax) / 2;
    }
    return targetMin + ((value - sourceMin) / (sourceMax - sourceMin)) * (targetMax - targetMin);
  }

  function getTimelineViewBox() {
    var scale = getZoomScale();
    var viewW = TIMELINE_CHART.width / scale;
    var viewH = TIMELINE_CHART.height / scale;
    var viewX = (TIMELINE_CHART.width - viewW) / 2 - timelineOffsetX / scale;
    var viewY = (TIMELINE_CHART.height - viewH) / 2 - timelineOffsetY / scale;
    return [viewX, viewY, viewW, viewH].map(formatCoord).join(' ');
  }

  function getEventXRange(events) {
    var minX = Infinity;
    var maxX = -Infinity;
    var validCount = 0;

    events.forEach(function (eventItem) {
      var x = Number(eventItem && eventItem.x);
      if (isFinite(x)) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        validCount += 1;
      }
    });

    if (validCount === events.length && maxX > minX) {
      return { minX: minX, maxX: maxX, useIndex: false };
    }

    return { minX: 0, maxX: Math.max(events.length - 1, 1), useIndex: true };
  }

  function buildTimelinePoints(events) {
    var range = getEventXRange(events);
    var targetMin = TIMELINE_CHART.plotLeft + TIMELINE_CHART.xPadding;
    var targetMax = TIMELINE_CHART.plotRight - TIMELINE_CHART.xPadding;
    var targetCenter = (targetMin + targetMax) / 2;

    return events.map(function (eventItem, index) {
      var sourceX = range.useIndex ? index : safeNumber(eventItem.x, index);
      var x = events.length === 1 ? targetCenter : mapRange(sourceX, range.minX, range.maxX, targetMin, targetMax);

      return {
        eventItem: eventItem,
        x: x,
        pol: clamp(safeNumber(eventItem.pol, TIMELINE_CHART.plotBottom), TIMELINE_CHART.plotTop, TIMELINE_CHART.plotBottom),
        eco: clamp(safeNumber(eventItem.eco, TIMELINE_CHART.plotBottom), TIMELINE_CHART.plotTop, TIMELINE_CHART.plotBottom),
        cul: clamp(safeNumber(eventItem.cul, TIMELINE_CHART.plotBottom), TIMELINE_CHART.plotTop, TIMELINE_CHART.plotBottom)
      };
    });
  }

  function getCurrentDynasty() {
    return dynasties[curDynIdx] || dynasties[0];
  }

  function getVisibleEvents() {
    var currentDynasty = getCurrentDynasty();
    var filtered = timelineEvents.filter(function (eventItem) {
      return !eventItem.dynasty || eventItem.dynasty === currentDynasty;
    });
    return filtered.length ? filtered : timelineEvents;
  }

  function applyTimelineTransform() {
    var svg = document.querySelector('#coord-chart svg');
    if (!svg) return;
    svg.setAttribute('viewBox', getTimelineViewBox());
  }

  function resetTimelineView() {
    timelineZoom = 0;
    timelineOffsetX = 0;
    timelineOffsetY = 0;
    isDragging = false;
  }

  function setDynasties(list) {
    dynasties = Array.isArray(list) && list.length ? list : dynasties;
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
    resetTimelineView();
    renderTimeline();
    renderEventList();
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
    var e = getVisibleEvents()[idx] || timelineEvents[idx];
    if (!e || typeof window.openFeatDet !== 'function') return false;
    window.openFeatDet('📅 ' + (e.name || '') + '（' + (e.year || '') + '）', e.description || '');
    return true;
  }

  function showTimelineConn(idx, dim) {
    var e = getVisibleEvents()[idx] || timelineEvents[idx];
    var dimMap = { pol: '🏛️ 政治影响', eco: '💰 经济影响', cul: '📚 文化影响' };
    var label = dimMap[dim] || '影响';
    var txt;

    if (!e || !e.conn || typeof window.openFeatDet !== 'function') return false;
    txt = '从【' + (e.name || '') + '】到【' + (e.conn.next || '') + '】\n\n' + label + '：\n' + (e.conn[dim] || '暂无说明');
    window.openFeatDet('🔗 ' + (e.name || '') + ' → ' + (e.conn.next || ''), txt);
    return true;
  }

  function findClosestWithClass(node, className) {
    while (node && node !== document) {
      if (node.classList && node.classList.contains(className)) {
        return node;
      }
      node = node.parentNode;
    }
    return null;
  }

  function bindTimelineClicks() {
    var chart = document.getElementById('coord-chart');
    var eventList = document.getElementById('event-list');

    if (chart && chart.getAttribute('data-click-bound') !== 'true') {
      chart.setAttribute('data-click-bound', 'true');
      chart.addEventListener('click', function (event) {
        var dash = findClosestWithClass(event.target, 'tldash');
        var node = findClosestWithClass(event.target, 'tlevt');
        if (dash) {
          showTimelineConn(Number(dash.getAttribute('data-i')), dash.getAttribute('data-dim'));
          return;
        }
        if (node) {
          showTimelineDetail(Number(node.getAttribute('data-i')));
        }
      });
    }

    if (eventList && eventList.getAttribute('data-click-bound') !== 'true') {
      eventList.setAttribute('data-click-bound', 'true');
      eventList.addEventListener('click', function (event) {
        var item = findClosestWithClass(event.target, 'evitem');
        if (item) {
          showTimelineDetail(Number(item.getAttribute('data-i')));
        }
      });
    }
  }

  function bindTimelineDrag() {
    var chart = document.getElementById('coord-chart');
    if (!chart || chart.getAttribute('data-drag-bound') === 'true') return;

    chart.setAttribute('data-drag-bound', 'true');
    chart.addEventListener('mousedown', pointerDown);
    chart.addEventListener('touchstart', touchStart, { passive: true });
    document.addEventListener('mousemove', pointerMove);
    document.addEventListener('touchmove', touchMove, { passive: false });
    document.addEventListener('mouseup', pointerUp);
    document.addEventListener('touchend', touchEnd);
  }

  function renderTimeline() {
    var c = document.getElementById('coord-chart');
    var events = getVisibleEvents();
    var points;
    var x0 = TIMELINE_CHART.plotLeft;
    var x1 = TIMELINE_CHART.plotRight;
    var y0 = TIMELINE_CHART.plotTop;
    var y1 = TIMELINE_CHART.plotBottom;
    var plotCenter = (x0 + x1) / 2;
    var s;
    var i;

    if (!c) return;
    bindTimelineDrag();
    bindTimelineClicks();

    if (!events.length) {
      c.innerHTML = '<div style="text-align:center;padding:24px;color:#B5ADA5">暂无时间轴事件</div>';
      return;
    }

    points = buildTimelinePoints(events);
    s = '<svg viewBox="' + getTimelineViewBox() + '" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">';
    s += '<rect x="30" y="20" width="410" height="440" fill="#FFFBF0" rx="8"/>';
    s += '<line class="tl-axis-x" x1="' + x0 + '" y1="' + y1 + '" x2="' + (x1 + 20) + '" y2="' + y1 + '" stroke="#5A3E1B" stroke-width="2"/>';
    s += '<text x="' + (x1 + 10) + '" y="' + (y1 - 5) + '" font-size="10" fill="#C0392B" font-weight="700">政治集权度 →</text>';
    s += '<line class="tl-axis-y" x1="' + x0 + '" y1="' + y1 + '" x2="' + x0 + '" y2="' + y0 + '" stroke="#5A3E1B" stroke-width="2"/>';
    s += '<text x="' + (x0 - 25) + '" y="' + (y0 + 10) + '" font-size="10" fill="#27AE60" font-weight="700">经济↑</text>';
    s += '<line class="tl-culture-line" x1="' + x0 + '" y1="' + (y1 - 80) + '" x2="' + (x1 + 20) + '" y2="' + (y0 + 40) + '" stroke="#8B6914" stroke-width="1.5" stroke-dasharray="6,3"/>';
    s += '<text x="' + (x1 - 20) + '" y="' + (y0 + 30) + '" font-size="10" fill="#8B6914" font-weight="700">文化 ↗</text>';
    s += '<text x="' + plotCenter + '" y="' + (y1 + 25) + '" font-size="9" fill="#8A7A6A" text-anchor="middle">一定的政治经济决定一定的思想文化</text>';

    for (i = 0; i < points.length - 1; i += 1) {
      var aPoint = points[i];
      var bPoint = points[i + 1];
      var a = aPoint.eventItem;
      var b = bPoint.eventItem;
      if (!a.conn || !b) continue;
      s += '<line x1="' + formatCoord(aPoint.x) + '" y1="' + formatCoord(aPoint.pol) + '" x2="' + formatCoord(bPoint.x) + '" y2="' + formatCoord(bPoint.pol) + '" stroke="#C0392B" stroke-width="1" stroke-dasharray="5,3" opacity="0.4" class="tldash" data-i="' + i + '" data-dim="pol" style="cursor:pointer"/>';
      s += '<line x1="' + formatCoord(aPoint.x) + '" y1="' + formatCoord(aPoint.eco) + '" x2="' + formatCoord(bPoint.x) + '" y2="' + formatCoord(bPoint.eco) + '" stroke="#27AE60" stroke-width="1" stroke-dasharray="5,3" opacity="0.4" class="tldash" data-i="' + i + '" data-dim="eco" style="cursor:pointer"/>';
      s += '<line x1="' + formatCoord(aPoint.x) + '" y1="' + formatCoord(aPoint.cul) + '" x2="' + formatCoord(bPoint.x) + '" y2="' + formatCoord(bPoint.cul) + '" stroke="#8B6914" stroke-width="1" stroke-dasharray="5,3" opacity="0.4" class="tldash" data-i="' + i + '" data-dim="cul" style="cursor:pointer"/>';
    }

    points.forEach(function (point, index) {
      var d = point.eventItem;
      s += '<circle cx="' + formatCoord(point.x) + '" cy="' + formatCoord(point.pol) + '" r="6" fill="#C0392B" opacity="0.85" stroke="#fff" stroke-width="1" class="tlevt" data-i="' + index + '" style="cursor:pointer"/>';
      s += '<text x="' + formatCoord(point.x) + '" y="' + formatCoord(point.pol - 10) + '" font-size="8" text-anchor="middle" fill="#C0392B" font-weight="700">' + escapeHtml(d.name) + '</text>';
      s += '<text x="' + formatCoord(point.x) + '" y="' + formatCoord(point.pol - 20) + '" font-size="7" text-anchor="middle" fill="#8A7A6A">' + escapeHtml(d.year) + '</text>';
      s += '<circle cx="' + formatCoord(point.x) + '" cy="' + formatCoord(point.eco) + '" r="5" fill="#27AE60" opacity="0.85" stroke="#fff" stroke-width="1"/>';
      s += '<circle cx="' + formatCoord(point.x) + '" cy="' + formatCoord(point.cul) + '" r="4" fill="#8B6914" opacity="0.85" stroke="#fff" stroke-width="1"/>';
    });
    s += '<text x="' + plotCenter + '" y="' + (y1 + 40) + '" font-size="8" fill="#8A7A6A" text-anchor="middle">🔴政治  🟢经济  🟤文化  |  从秦至清，政治集权逐步增强，经济与文化同步演进</text>';
    s += '<text x="' + plotCenter + '" y="' + (y1 + 53) + '" font-size="7" fill="#C0392B" text-anchor="middle" opacity="0.7">点按虚线上每段可查看事件间相互作用</text>';
    s += '</svg>';
    c.innerHTML = s;
    applyTimelineTransform();
  }

  function zoomTL(dir) {
    timelineZoom = Math.max(-3, Math.min(3, timelineZoom + dir));
    renderTimeline();
    renderEventList();
    if (typeof window.showToast === 'function') {
      window.showToast(dir > 0 ? '放大时间轴：查看细节' : '缩小时间轴：查看全景');
    }
  }

  function renderEventList() {
    var el = document.getElementById('event-list');
    var events = getVisibleEvents();
    var h = '';
    if (!el) return;
    bindTimelineClicks();
    events.forEach(function (d, i) {
      h += '<div class="evitem" data-i="' + i + '"><div class="evdot pol"></div><div class="evtxt"><h5>' + escapeHtml(d.name) + ' <span class="evyr">' + escapeHtml(d.year) + '</span></h5><div class="evdesc">' + escapeHtml(d.description) + '</div></div></div>';
    });
    el.innerHTML = h || '<div style="padding:16px;text-align:center;color:#B5ADA5">暂无事件数据</div>';
  }

  function startDrag(clientX, clientY) {
    isDragging = true;
    dragStartX = clientX;
    dragStartY = clientY;
    var chart = document.getElementById('coord-chart');
    if (chart) chart.classList.add('dragging');
  }

  function moveDrag(clientX, clientY) {
    var dx;
    var dy;
    if (!isDragging) return;
    dx = clientX - dragStartX;
    dy = clientY - dragStartY;
    dragStartX = clientX;
    dragStartY = clientY;
    timelineOffsetX = clamp(timelineOffsetX + dx, minOffsetX, maxOffsetX);
    timelineOffsetY = clamp(timelineOffsetY + dy, minOffsetY, maxOffsetY);
    applyTimelineTransform();
  }

  function endDrag() {
    isDragging = false;
    var chart = document.getElementById('coord-chart');
    if (chart) chart.classList.remove('dragging');
  }

  function pointerDown(event) {
    if (!event) return;
    if (event.preventDefault) event.preventDefault();
    startDrag(event.clientX || 0, event.clientY || 0);
  }

  function pointerMove(event) {
    if (!event) return;
    if (isDragging && event.preventDefault) event.preventDefault();
    moveDrag(event.clientX || 0, event.clientY || 0);
  }

  function pointerUp() {
    endDrag();
  }

  function touchStart(event) {
    if (!event || !event.touches || event.touches.length !== 1) return;
    startDrag(event.touches[0].clientX || 0, event.touches[0].clientY || 0);
  }

  function touchMove(event) {
    if (!event || !event.touches || event.touches.length !== 1) return;
    if (isDragging && event.preventDefault) event.preventDefault();
    moveDrag(event.touches[0].clientX || 0, event.touches[0].clientY || 0);
  }

  function touchEnd() {
    endDrag();
  }

  function getTimelineState() {
    return {
      zoom: timelineZoom,
      offsetX: timelineOffsetX,
      offsetY: timelineOffsetY,
      minOffsetX: minOffsetX,
      maxOffsetX: maxOffsetX,
      minOffsetY: minOffsetY,
      maxOffsetY: maxOffsetY,
      currentDynasty: getCurrentDynasty(),
      eventCount: getVisibleEvents().length
    };
  }

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
    renderEventList: renderEventList,
    pointerDown: pointerDown,
    pointerMove: pointerMove,
    pointerUp: pointerUp,
    touchStart: touchStart,
    touchMove: touchMove,
    touchEnd: touchEnd,
    getTimelineState: getTimelineState
  };
})();
