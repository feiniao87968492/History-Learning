(function () {
  var questions = [];
  var currentIndex = 0;
  var selectedAnswers = {};
  var correctAnswers = {};
  var completed = false;
  var WRONG_KEY = 'xds_wrong_questions';

  function readStoredJSON(key, fallbackValue) {
    if (!window.storageAPI || typeof window.storageAPI.getStoredJSON !== 'function') {
      return fallbackValue;
    }

    return window.storageAPI.getStoredJSON(key, fallbackValue);
  }

  function writeStoredJSON(key, value) {
    if (!window.storageAPI || typeof window.storageAPI.setStoredJSON !== 'function') {
      return false;
    }

    return window.storageAPI.setStoredJSON(key, value);
  }

  function normalizeWrongQuestions(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function getWrongQuestions() {
    return normalizeWrongQuestions(readStoredJSON(WRONG_KEY, {}));
  }

  function setWrongQuestions(map) {
    return writeStoredJSON(WRONG_KEY, normalizeWrongQuestions(map));
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

  function showToast(message) {
    if (window.navigationAPI && typeof window.navigationAPI.showToast === 'function') {
      window.navigationAPI.showToast(message);
    }
  }

  function recordLearningEvent(type, sourceId) {
    if (window.learningStatsAPI && typeof window.learningStatsAPI.recordLearningEvent === 'function') {
      window.learningStatsAPI.recordLearningEvent(type, sourceId);
    }
  }

  function getPanel() {
    return document.getElementById('quiz-panel');
  }

  function getCurrentQuestion() {
    return questions[currentIndex] || null;
  }

  function findQuestionIndex(questionId) {
    var i;

    for (i = 0; i < questions.length; i += 1) {
      if (questions[i].id === questionId) {
        return i;
      }
    }

    return -1;
  }

  function findQuestion(questionId) {
    var index = findQuestionIndex(questionId);
    return index === -1 ? null : questions[index];
  }

  function getCorrectCount() {
    return Object.keys(correctAnswers).filter(function (id) {
      return correctAnswers[id];
    }).length;
  }

  function recordWrongQuestion(question, userAnswer) {
    var wrongMap;
    var existing;

    if (!question || !question.id) return null;

    wrongMap = getWrongQuestions();
    existing = wrongMap[question.id] || {
      questionId: question.id,
      wrongCount: 0,
      lastWrongAt: '',
      lastUserAnswer: '',
      mastered: false
    };

    wrongMap[question.id] = {
      questionId: question.id,
      wrongCount: Number(existing.wrongCount || 0) + 1,
      lastWrongAt: new Date().toISOString(),
      lastUserAnswer: userAnswer,
      mastered: false
    };

    setWrongQuestions(wrongMap);
    return wrongMap[question.id];
  }

  function resetQuiz() {
    currentIndex = 0;
    selectedAnswers = {};
    correctAnswers = {};
    completed = false;
  }

  function normalizeQuestions(list) {
    return Array.isArray(list) ? list.filter(function (item) {
      return item && item.id && Array.isArray(item.options) && item.options.length;
    }) : [];
  }

  function renderEmpty() {
    var panel = getPanel();
    if (!panel) return;
    panel.innerHTML = '<div style="text-align:center;padding:24px;color:#B5ADA5">暂无题目</div>';
  }

  function renderComplete() {
    var panel = getPanel();
    var total = questions.length;
    var correct = getCorrectCount();
    var rate = total ? Math.round(correct / total * 100) : 0;

    if (!panel) return;

    panel.innerHTML = '<div style="background:#fff;border-radius:16px;padding:18px;margin-top:12px;text-align:center">' +
      '<h3 style="font-size:20px;color:#2C1810;margin-bottom:10px">练习完成</h3>' +
      '<div style="font-size:32px;color:#C9A96E;font-weight:700;margin-bottom:8px">' + correct + ' / ' + total + '</div>' +
      '<div style="font-size:14px;color:#8A8279;margin-bottom:16px">正确率 ' + rate + '%</div>' +
      '<button onclick="startQuiz()" style="padding:10px 24px;background:#C9A96E;color:#fff;border:none;border-radius:999px;font-size:14px;cursor:pointer">重新练习</button>' +
    '</div>';
  }

  function renderWrongQuestions() {
    var panel = document.getElementById('wrong-question-panel');
    var wrongMap = getWrongQuestions();
    var items = Object.keys(wrongMap).map(function (questionId) {
      var record = wrongMap[questionId];
      var question = findQuestion(questionId);
      return {
        record: record,
        question: question
      };
    }).filter(function (item) {
      return item.question && item.record && item.record.mastered !== true;
    });

    if (!panel) return;

    if (!items.length) {
      panel.innerHTML = '<div style="text-align:center;padding:24px;color:#B5ADA5">暂无错题</div>';
      return;
    }

    panel.innerHTML = '<div style="margin-top:12px;display:flex;flex-direction:column;gap:12px">' + items.map(function (item) {
      var q = item.question;
      var r = item.record;
      var safeId = escapeJSString(r.questionId);

      return '<div class="wrong-card" data-question-id="' + escapeHtml(r.questionId) + '" style="background:#fff;border-radius:16px;padding:14px">' +
        '<div style="font-size:12px;color:#C9A96E;margin-bottom:6px">' + escapeHtml(q.topic || '') + ' · ' + escapeHtml(q.dynasty || '') + '</div>' +
        '<h4 style="font-size:15px;color:#2C1810;line-height:1.5;margin-bottom:8px">' + escapeHtml(q.question || '') + '</h4>' +
        '<div style="font-size:13px;color:#8A8279;margin-bottom:10px">最近错选：' + escapeHtml(r.lastUserAnswer || '') + ' · 错误次数：' + escapeHtml(r.wrongCount || 0) + '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button onclick="retryWrongQuestion(\'' + safeId + '\')" style="padding:8px 12px;background:#C9A96E;color:#fff;border:none;border-radius:999px;font-size:13px;cursor:pointer">再做一次</button>' +
          '<button onclick="markWrongQuestionMastered(\'' + safeId + '\')" style="padding:8px 12px;background:#7EBDA6;color:#fff;border:none;border-radius:999px;font-size:13px;cursor:pointer">标记已掌握</button>' +
        '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  function renderQuiz() {
    var panel = getPanel();
    var question = getCurrentQuestion();
    var selected;
    var answered;
    var correct;

    if (!panel) return;

    if (!questions.length) {
      renderEmpty();
      return;
    }

    if (completed) {
      renderComplete();
      return;
    }

    if (!question) {
      completed = true;
      renderComplete();
      return;
    }

    selected = selectedAnswers[question.id];
    answered = typeof selected !== 'undefined';
    correct = selected === question.answer;

    panel.innerHTML = '<div style="background:#fff;border-radius:16px;padding:16px;margin-top:12px">' +
      '<div style="font-size:12px;color:#C9A96E;margin-bottom:8px">第 ' + (currentIndex + 1) + ' / ' + questions.length + ' 题 · ' + escapeHtml(question.topic || '') + ' · ' + escapeHtml(question.dynasty || '') + '</div>' +
      '<h4 style="font-size:16px;color:#2C1810;line-height:1.6;margin-bottom:14px">' + escapeHtml(question.question || '') + '</h4>' +
      '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">' + question.options.map(function (option) {
        var optionClass = 'quiz-option';
        var optionStyle = 'padding:10px 12px;border:1.5px solid #EDE8E0;border-radius:12px;background:#fff;text-align:left;color:#2C1810;cursor:pointer';
        if (answered && option === question.answer) {
          optionStyle = 'padding:10px 12px;border:1.5px solid #7EBDA6;border-radius:12px;background:#F0FAF6;text-align:left;color:#2C1810;cursor:pointer';
        } else if (answered && option === selected && option !== question.answer) {
          optionStyle = 'padding:10px 12px;border:1.5px solid #D96C6C;border-radius:12px;background:#FFF3F3;text-align:left;color:#2C1810;cursor:pointer';
        }
        return '<button class="' + optionClass + '" onclick="selectQuizAnswer(\'' + escapeJSString(option) + '\')" style="' + optionStyle + '">' + escapeHtml(option) + '</button>';
      }).join('') + '</div>' +
      (answered ? '<div style="background:#FFFBF0;border-radius:12px;padding:12px;margin-bottom:12px"><div style="font-weight:700;color:' + (correct ? '#3F8F6B' : '#B65353') + ';margin-bottom:6px">' + (correct ? '✅ 回答正确！' : '❌ 回答错误，正确答案：' + escapeHtml(question.answer)) + '</div><div style="font-size:13px;color:#2C1810;line-height:1.6">' + escapeHtml(question.explanation || '') + '</div></div>' : '') +
      '<button onclick="nextQuizQuestion()" style="padding:10px 24px;background:#C9A96E;color:#fff;border:none;border-radius:999px;font-size:14px;cursor:pointer">' + (currentIndex + 1 >= questions.length ? '查看成绩' : '下一题 →') + '</button>' +
    '</div>';
  }

  function setQuestions(list) {
    questions = normalizeQuestions(list);
    resetQuiz();
    renderQuiz();
  }

  function startQuiz() {
    resetQuiz();
    renderQuiz();
  }

  function selectQuizAnswer(answer) {
    var question = getCurrentQuestion();

    if (!question || completed) return;
    if (selectedAnswers[question.id]) return;

    selectedAnswers[question.id] = answer;
    correctAnswers[question.id] = answer === question.answer;

    if (answer !== question.answer) {
      recordWrongQuestion(question, answer);
      recordLearningEvent('quiz_wrong', question.id);
    } else {
      recordLearningEvent('quiz_correct', question.id);
    }

    renderQuiz();
  }

  function nextQuizQuestion() {
    var question = getCurrentQuestion();

    if (!question) {
      completed = true;
      renderQuiz();
      return;
    }

    if (!selectedAnswers[question.id]) {
      showToast('请先选择一个答案');
      return;
    }

    if (currentIndex + 1 >= questions.length) {
      completed = true;
    } else {
      currentIndex += 1;
    }

    renderQuiz();
  }

  function retryWrongQuestion(questionId) {
    var index = findQuestionIndex(questionId);
    var question;

    if (index === -1) {
      showToast('题目不存在');
      return false;
    }

    question = questions[index];
    currentIndex = index;
    completed = false;
    delete selectedAnswers[question.id];
    delete correctAnswers[question.id];
    renderQuiz();
    return true;
  }

  function markWrongQuestionMastered(questionId) {
    var wrongMap = getWrongQuestions();

    if (!wrongMap[questionId]) {
      return false;
    }

    wrongMap[questionId].mastered = true;
    setWrongQuestions(wrongMap);
    renderWrongQuestions();
    return true;
  }

  function getQuizState() {
    return {
      questions: questions.slice(),
      currentIndex: currentIndex,
      selectedAnswers: selectedAnswers,
      correctCount: getCorrectCount(),
      completed: completed
    };
  }

  window.quizAPI = {
    setQuestions: setQuestions,
    startQuiz: startQuiz,
    renderQuiz: renderQuiz,
    selectQuizAnswer: selectQuizAnswer,
    nextQuizQuestion: nextQuizQuestion,
    getQuizState: getQuizState,
    getWrongQuestions: getWrongQuestions,
    renderWrongQuestions: renderWrongQuestions,
    retryWrongQuestion: retryWrongQuestion,
    markWrongQuestionMastered: markWrongQuestionMastered,
    resetQuiz: resetQuiz
  };
})();
