(function () {
  var EVENTS_KEY = 'xds_learning_events';
  var EVENT_MINUTES = {
    noun_learned: 1,
    quiz_correct: 1,
    quiz_wrong: 1,
    checkin: 1
  };

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

  function normalizeEvents(value) {
    return Array.isArray(value) ? value.filter(function (event) {
      return event && event.type && event.timestamp;
    }) : [];
  }

  function getLearningEvents() {
    return normalizeEvents(readStoredJSON(EVENTS_KEY, []));
  }

  function setLearningEvents(events) {
    return writeStoredJSON(EVENTS_KEY, normalizeEvents(events));
  }

  function recordLearningEvent(type, sourceId) {
    var events;
    var event;

    if (!type) return null;

    events = getLearningEvents();
    event = {
      type: type,
      timestamp: new Date().toISOString()
    };

    if (typeof sourceId !== 'undefined' && sourceId !== null) {
      event.sourceId = sourceId;
    }

    events.push(event);
    setLearningEvents(events);
    updateProfileStats();
    return event;
  }

  function collectEventDates(events) {
    var dates = {};

    events.forEach(function (event) {
      if (event && event.timestamp) {
        dates[String(event.timestamp).slice(0, 10)] = true;
      }
    });

    return dates;
  }

  function calcStreakFromDates(dateMap) {
    var keys = Object.keys(dateMap).sort();
    var latest;
    var date;
    var streak = 0;

    if (!keys.length) return 0;

    latest = keys[keys.length - 1];
    date = new Date(latest + 'T00:00:00.000Z');

    while (true) {
      var dateString = date.toISOString().slice(0, 10);
      if (dateMap[dateString]) {
        streak += 1;
        date.setUTCDate(date.getUTCDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  function getLearningStats() {
    var events = getLearningEvents();
    var dateMap = collectEventDates(events);
    var minutes = 0;
    var exercises = 0;

    events.forEach(function (event) {
      if (!event || !event.type) return;

      minutes += EVENT_MINUTES[event.type] || 0;
      if (event.type === 'quiz_correct' || event.type === 'quiz_wrong') {
        exercises += 1;
      }
    });

    return {
      days: Object.keys(dateMap).length,
      minutes: minutes,
      exercises: exercises,
      streak: calcStreakFromDates(dateMap)
    };
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) {
      el.textContent = String(value);
    }
  }

  function updateProfileStats() {
    var stats = getLearningStats();
    var profileSubtitle;

    setText('stat-days', stats.days);
    setText('stat-mins', stats.minutes);
    setText('stat-ex', stats.exercises);
    setText('stat-streak', stats.streak);

    profileSubtitle = document.querySelector('#profile-page .p2');
    if (profileSubtitle) {
      profileSubtitle.textContent = '已学习 ' + stats.days + ' 天 · 今天也要加油！';
    }

    return stats;
  }

  window.learningStatsAPI = {
    recordLearningEvent: recordLearningEvent,
    getLearningEvents: getLearningEvents,
    setLearningEvents: setLearningEvents,
    getLearningStats: getLearningStats,
    updateProfileStats: updateProfileStats,
    calcStreakFromDates: calcStreakFromDates
  };
})();
