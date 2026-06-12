(function () {
  var LEARNED_KEY = 'xds_learned';
  var WRONG_KEY = 'xds_wrong_questions';
  var currentRangeDays = 30;

  function readStoredJSON(key, fallbackValue) {
    if (!window.storageAPI || typeof window.storageAPI.getStoredJSON !== 'function') {
      return fallbackValue;
    }

    return window.storageAPI.getStoredJSON(key, fallbackValue);
  }

  function normalizeMap(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

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

  function escapeJSString(value) {
    return String(value || '')
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n')
      .replace(/</g, '\\x3c')
      .replace(/>/g, '\\x3e');
  }

  function getPanel() {
    return document.getElementById('review-zone-panel');
  }

  function getLearnedMap() {
    if (window.nounAPI && typeof window.nounAPI.getLearnedNouns === 'function') {
      return normalizeMap(window.nounAPI.getLearnedNouns());
    }

    return normalizeMap(readStoredJSON(LEARNED_KEY, {}));
  }

  function getWrongMap() {
    if (window.quizAPI && typeof window.quizAPI.getWrongQuestions === 'function') {
      return normalizeMap(window.quizAPI.getWrongQuestions());
    }

    return normalizeMap(readStoredJSON(WRONG_KEY, {}));
  }

  function getQuestions() {
    if (window.quizAPI && typeof window.quizAPI.getQuizState === 'function') {
      var state = window.quizAPI.getQuizState() || {};
      return Array.isArray(state.questions) ? state.questions : [];
    }

    return [];
  }

  function findQuestion(questionId) {
    var questions = getQuestions();
    var i;

    for (i = 0; i < questions.length; i += 1) {
      if (questions[i].id === questionId) {
        return questions[i];
      }
    }

    return null;
  }

  function isWithinRange(timestamp, rangeDays) {
    var time;
    var cutoff;

    if (!rangeDays || !timestamp) return true;

    time = new Date(timestamp).getTime();
    if (isNaN(time)) return false;

    cutoff = new Date().getTime() - (Number(rangeDays) * 24 * 60 * 60 * 1000);
    return time >= cutoff;
  }

  function getLearnedItems(rangeDays) {
    var learnedMap = getLearnedMap();

    return Object.keys(learnedMap).map(function (name) {
      var record = learnedMap[name] || {};
      var noun = window.nounAPI && typeof window.nounAPI.getNoun === 'function' ? window.nounAPI.getNoun(record.name || name) : null;
      return {
        name: record.name || name,
        learnedAt: record.learnedAt || '',
        noun: noun || {}
      };
    }).filter(function (item) {
      return isWithinRange(item.learnedAt, rangeDays);
    }).sort(function (a, b) {
      return String(b.learnedAt).localeCompare(String(a.learnedAt));
    });
  }

  function getWrongItems(rangeDays) {
    var wrongMap = getWrongMap();

    return Object.keys(wrongMap).map(function (questionId) {
      var record = wrongMap[questionId] || {};
      return {
        record: record,
        question: findQuestion(record.questionId || questionId)
      };
    }).filter(function (item) {
      return item.record && item.record.mastered !== true && isWithinRange(item.record.lastWrongAt, rangeDays);
    }).sort(function (a, b) {
      return String(b.record.lastWrongAt || '').localeCompare(String(a.record.lastWrongAt || ''));
    });
  }

  function renderRangeButtons(rangeDays) {
    var ranges = [1, 7, 30];

    return '<div style="display:flex;gap:8px;margin:12px 0;flex-wrap:wrap">' + ranges.map(function (days) {
      var active = Number(rangeDays) === days;
      return '<button class="review-range' + (active ? ' act' : '') + '" onclick="filterReviewRange(' + days + ')" style="padding:8px 12px;border:none;border-radius:999px;background:' + (active ? '#C9A96E' : '#F4EFE6') + ';color:' + (active ? '#fff' : '#8A8279') + ';font-size:13px;cursor:pointer">近 ' + days + ' 天</button>';
    }).join('') + '</div>';
  }

  function renderLearnedList(items) {
    if (!items.length) {
      return '<div id="review-learned-list"><div style="text-align:center;padding:18px;color:#B5ADA5">暂无已学名词</div></div>';
    }

    return '<div id="review-learned-list" style="display:flex;flex-direction:column;gap:10px">' + items.map(function (item) {
      return '<button class="review-card" data-review-noun="' + escapeHtml(item.name) + '" style="background:#fff;border:none;border-radius:14px;padding:12px;text-align:left;cursor:pointer">' +
        '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:6px">' +
          '<strong style="font-size:15px;color:#2C1810">' + escapeHtml(item.name) + '</strong>' +
          '<span style="font-size:11px;color:#B5ADA5">' + escapeHtml(String(item.learnedAt || '').slice(0, 10)) + '</span>' +
        '</div>' +
        '<div style="font-size:12px;color:#8A8279">' + escapeHtml(item.noun.dynasty || '未标注朝代') + ' · ' + escapeHtml(item.noun.category || '未分类') + '</div>' +
      '</button>';
    }).join('') + '</div>';
  }

  function renderWrongList(items) {
    if (!items.length) {
      return '<div id="review-wrong-list"><div style="text-align:center;padding:18px;color:#B5ADA5">暂无待复习错题</div></div>';
    }

    return '<div id="review-wrong-list" style="display:flex;flex-direction:column;gap:10px">' + items.map(function (item) {
      var record = item.record || {};
      var question = item.question || {};
      return '<button class="review-card" data-review-question="' + escapeHtml(record.questionId || '') + '" style="background:#fff;border:none;border-radius:14px;padding:12px;text-align:left;cursor:pointer">' +
        '<div style="font-size:12px;color:#C9A96E;margin-bottom:6px">' + escapeHtml(question.topic || '错题复习') + ' · ' + escapeHtml(question.dynasty || '未标注') + '</div>' +
        '<strong style="display:block;font-size:15px;color:#2C1810;line-height:1.5;margin-bottom:6px">' + escapeHtml(question.question || record.questionId || '题目暂未加载') + '</strong>' +
        '<div style="font-size:12px;color:#8A8279">最近错选：' + escapeHtml(record.lastUserAnswer || '') + ' · 错误次数：' + escapeHtml(record.wrongCount || 0) + '</div>' +
      '</button>';
    }).join('') + '</div>';
  }

  function renderReviewZone(rangeDays) {
    var panel = getPanel();
    var days = Number(rangeDays || currentRangeDays || 30);
    var learnedItems;
    var wrongItems;

    currentRangeDays = days;
    if (!panel) return;

    learnedItems = getLearnedItems(days);
    wrongItems = getWrongItems(days);

    panel.innerHTML = '<div style="margin-top:12px;background:#FFFBF0;border-radius:16px;padding:14px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">' +
        '<div><h3 style="font-size:18px;color:#2C1810;margin-bottom:4px">📚 复习专区</h3><p style="font-size:12px;color:#8A8279">回看已学名词与待复习错题</p></div>' +
      '</div>' +
      renderRangeButtons(days) +
      '<h4 style="font-size:15px;color:#2C1810;margin:14px 0 8px">已学名词</h4>' +
      renderLearnedList(learnedItems) +
      '<h4 style="font-size:15px;color:#2C1810;margin:16px 0 8px">待复习错题</h4>' +
      renderWrongList(wrongItems) +
    '</div>';

    panel.querySelectorAll('[data-review-noun]').forEach(function (button) {
      button.onclick = function () {
        openReviewNoun(button.getAttribute('data-review-noun'));
      };
    });

    panel.querySelectorAll('[data-review-question]').forEach(function (button) {
      button.onclick = function () {
        retryReviewQuestion(button.getAttribute('data-review-question'));
      };
    });
  }

  function filterReviewRange(days) {
    renderReviewZone(days);
  }

  function openReviewNoun(name) {
    if (window.nounAPI && typeof window.nounAPI.openNounDet === 'function') {
      window.nounAPI.openNounDet(name);
      return true;
    }
    return false;
  }

  function retryReviewQuestion(questionId) {
    if (window.quizAPI && typeof window.quizAPI.retryWrongQuestion === 'function') {
      return window.quizAPI.retryWrongQuestion(questionId);
    }
    return false;
  }

  window.reviewAPI = {
    renderReviewZone: renderReviewZone,
    filterReviewRange: filterReviewRange,
    openReviewNoun: openReviewNoun,
    retryReviewQuestion: retryReviewQuestion,
    getLearnedItems: getLearnedItems,
    getWrongItems: getWrongItems,
    isWithinRange: isWithinRange
  };

  window.renderReviewZone = renderReviewZone;
  window.filterReviewRange = filterReviewRange;
  window.openReviewNoun = openReviewNoun;
  window.retryReviewQuestion = retryReviewQuestion;
})();
