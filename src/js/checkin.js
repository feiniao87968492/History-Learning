(function () {
  var CHECKIN_KEY = 'xds_checkins';

  function getCheckins() {
    if (window.storageAPI && window.storageAPI.getStoredJSON) {
      return window.storageAPI.getStoredJSON(CHECKIN_KEY, {});
    }

    console.error('getCheckins failed:', new Error('storageAPI unavailable'));
    return {};
  }

  function setCheckins(checkins) {
    if (window.storageAPI && window.storageAPI.setStoredJSON) {
      return window.storageAPI.setStoredJSON(CHECKIN_KEY, checkins);
    }

    console.error('setCheckins failed:', new Error('storageAPI unavailable'));
    return false;
  }

  function recordLearningEvent(type, sourceId) {
    if (window.learningStatsAPI && typeof window.learningStatsAPI.recordLearningEvent === 'function') {
      window.learningStatsAPI.recordLearningEvent(type, sourceId);
    }
  }

  function openCheckin() {
    var panel = document.getElementById('checkin-panel');
    if (panel) {
      panel.classList.add('act');
    }
    renderCheckinCalendar();
  }

  function closeCheckin() {
    var panel = document.getElementById('checkin-panel');
    if (panel) {
      panel.classList.remove('act');
    }
  }

  function calcStreak(checkins) {
    var date = new Date();
    var streak = 0;

    while (true) {
      var dateString = date.toISOString().slice(0, 10);
      if (checkins[dateString]) {
        streak += 1;
        date.setDate(date.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  function updateCheckinStats() {
    var checkins = getCheckins();
    var keys = Object.keys(checkins);
    var total = keys.length;
    var today = new Date().toISOString().slice(0, 10);
    var doneToday = !!checkins[today];

    var totalEl = document.getElementById('ck-total');
    if (totalEl) {
      totalEl.textContent = String(total);
    }

    var streak = calcStreak(checkins);

    if (window.learningStatsAPI && typeof window.learningStatsAPI.updateProfileStats === 'function') {
      window.learningStatsAPI.updateProfileStats();
    } else {
      var statDaysEl = document.getElementById('stat-days');
      if (statDaysEl) {
        statDaysEl.textContent = String(total);
      }

      var statStreakEl = document.getElementById('stat-streak');
      if (statStreakEl) {
        statStreakEl.textContent = String(streak);
      }
    }

    var ckStreakEl = document.getElementById('ck-streak');
    if (ckStreakEl) {
      ckStreakEl.textContent = String(streak);
    }

    var monthCount = keys.filter(function (key) {
      return key.slice(0, 7) === today.slice(0, 7);
    }).length;
    var monthEl = document.getElementById('ck-month');
    if (monthEl) {
      monthEl.textContent = String(monthCount);
    }

    if (doneToday) {
      var button = document.getElementById('checkin-btn');
      if (button) {
        button.textContent = '✅ 已打卡';
        button.classList.add('done');
        button.disabled = true;
      }
    }
  }

  function getCheckinToast(streak) {
    if (streak >= 7) {
      return '打卡成功！连续 7 天学习，已经形成习惯啦！';
    }
    if (streak >= 3) {
      return '打卡成功！连续 3 天学习，保持节奏！';
    }
    return '打卡成功！连续学习，历史达人就是你！';
  }

  function renderCheckinCalendar() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth();
    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var checkins = getCheckins();
    var html = '<div class="ckrow head"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div><div class="ckrow">';

    for (var i = 0; i < firstDay; i++) {
      html += '<div></div>';
    }

    for (var day = 1; day <= daysInMonth; day++) {
      var dateString = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      var className = 'ckcell';
      if (checkins[dateString]) {
        className += ' done';
      }
      if (day === now.getDate()) {
        className += ' today';
      }
      html += '<div class="' + className + '">' + day + '</div>';
      if ((firstDay + day) % 7 === 0) {
        html += '</div><div class="ckrow">';
      }
    }

    html += '</div>';

    var calendar = document.getElementById('checkin-calendar');
    if (calendar) {
      calendar.innerHTML = html;
    }

    updateCheckinStats();
  }

  function doCheckin() {
    var today = new Date().toISOString().slice(0, 10);
    var checkins = getCheckins();

    if (checkins[today]) {
      if (window.navigationAPI && window.navigationAPI.showToast) {
        window.navigationAPI.showToast('今日已打卡，明天继续加油！');
      }
      return;
    }

    checkins[today] = true;
    setCheckins(checkins);
    recordLearningEvent('checkin', today);

    var button = document.getElementById('checkin-btn');
    if (button) {
      button.textContent = '✅ 已打卡';
      button.classList.add('done');
      button.disabled = true;
    }

    updateCheckinStats();

    if (window.navigationAPI && window.navigationAPI.showToast) {
      window.navigationAPI.showToast(getCheckinToast(calcStreak(checkins)));
    }
  }

  window.checkinAPI = {
    openCheckin: openCheckin,
    closeCheckin: closeCheckin,
    doCheckin: doCheckin,
    renderCheckinCalendar: renderCheckinCalendar,
    updateCheckinStats: updateCheckinStats,
    calcStreak: calcStreak,
    getCheckins: getCheckins,
    setCheckins: setCheckins,
    getCheckinToast: getCheckinToast
  };
})();
