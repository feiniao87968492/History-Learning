import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

function createStorageMock(initial) {
  var store = initial || {};

  return {
    getStoredJSON: vi.fn(function (key, fallbackValue) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : fallbackValue;
    }),
    setStoredJSON: vi.fn(function (key, value) {
      store[key] = value;
      return true;
    }),
    getStore: function () {
      return store;
    }
  };
}

function mountProfileDOM() {
  mountDOM(`
    <div id="profile-page">
      <p class="p2">已学习 0 天 · 今天也要加油！</p>
      <div id="stat-days">0</div>
      <div id="stat-mins">0</div>
      <div id="stat-ex">0</div>
      <div id="stat-streak">0</div>
    </div>
  `);
}

const QUESTIONS = [
  {
    id: 'q001',
    question: '秦统一后在全国推行的地方行政制度是？',
    options: ['分封制', '郡县制'],
    answer: '郡县制',
    explanation: '郡县制由中央任免地方长官。',
    topic: '制度史',
    dynasty: '秦朝'
  }
];

const NOUNS = {
  '郡县制': {
    text: '秦统一后在全国推行郡县制。',
    related: [],
    dynasty: '秦朝',
    category: '制度',
    map: '秦统一后的郡县分布示意',
    year: '前221年'
  }
};

beforeEach(() => {
  vi.resetModules();
  resetGlobals();
  mountProfileDOM();
  window.storageAPI = createStorageMock();
  window.navigationAPI = { showToast: vi.fn() };
  window.htmlUtils = {
    escapeHtml(value) {
      if (value === null || typeof value === 'undefined') return '';
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  };
});

describe('learning stats events', () => {
  test('records a learning event to xds_learning_events', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-11T12:00:00.000Z'));

    await import('../src/js/learning-stats.js');

    window.learningStatsAPI.recordLearningEvent('noun_learned', '郡县制');

    expect(window.storageAPI.setStoredJSON).toHaveBeenCalledWith('xds_learning_events', [
      {
        type: 'noun_learned',
        timestamp: '2026-06-11T12:00:00.000Z',
        sourceId: '郡县制'
      }
    ]);

    vi.useRealTimers();
  });

  test('aggregates learning days minutes exercises and streak from events', async () => {
    window.storageAPI = createStorageMock({
      xds_learning_events: [
        { type: 'noun_learned', timestamp: '2026-06-10T08:00:00.000Z', sourceId: '郡县制' },
        { type: 'quiz_correct', timestamp: '2026-06-11T09:00:00.000Z', sourceId: 'q001' },
        { type: 'quiz_wrong', timestamp: '2026-06-11T09:01:00.000Z', sourceId: 'q002' },
        { type: 'checkin', timestamp: '2026-06-11T10:00:00.000Z', sourceId: '2026-06-11' }
      ]
    });
    await import('../src/js/learning-stats.js');

    expect(window.learningStatsAPI.getLearningStats()).toEqual({
      days: 2,
      minutes: 4,
      exercises: 2,
      streak: 2
    });
  });

  test('renders profile stats from aggregated events', async () => {
    window.storageAPI = createStorageMock({
      xds_learning_events: [
        { type: 'noun_learned', timestamp: '2026-06-10T08:00:00.000Z', sourceId: '郡县制' },
        { type: 'quiz_correct', timestamp: '2026-06-11T09:00:00.000Z', sourceId: 'q001' },
        { type: 'checkin', timestamp: '2026-06-11T10:00:00.000Z', sourceId: '2026-06-11' }
      ]
    });
    await import('../src/js/learning-stats.js');

    window.learningStatsAPI.updateProfileStats();

    expect(document.getElementById('stat-days').textContent).toBe('2');
    expect(document.getElementById('stat-mins').textContent).toBe('3');
    expect(document.getElementById('stat-ex').textContent).toBe('1');
    expect(document.getElementById('stat-streak').textContent).toBe('2');
    expect(document.querySelector('#profile-page .p2').textContent).toBe('已学习 2 天 · 今天也要加油！');
  });

  test('learning stats APIs do not throw when storageAPI is unavailable', async () => {
    delete window.storageAPI;
    await import('../src/js/learning-stats.js');

    expect(function () {
      window.learningStatsAPI.recordLearningEvent('checkin', '2026-06-11');
      window.learningStatsAPI.updateProfileStats();
    }).not.toThrow();
    expect(window.learningStatsAPI.getLearningEvents()).toEqual([]);
    expect(window.learningStatsAPI.getLearningStats()).toEqual({
      days: 0,
      minutes: 0,
      exercises: 0,
      streak: 0
    });
  });
});

describe('learning stats integrations', () => {
  test('markNounLearned records a noun learned event once', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-11T12:00:00.000Z'));
    mountDOM(`
      <div class="nc" id="noun-grid"></div>
      <div id="noun-detail" class="nd">
        <h2 id="nd-title"></h2>
        <div id="nd-meta"></div>
        <p id="nd-text"></p>
        <div class="mp"></div>
        <div id="nd-related"></div>
      </div>
      <div id="stat-days">0</div>
      <div id="stat-mins">0</div>
      <div id="stat-ex">0</div>
      <div id="stat-streak">0</div>
    `);
    window.storageAPI = createStorageMock();
    await import('../src/js/learning-stats.js');
    await import('../src/js/noun.js');
    window.nounAPI.setNounData(NOUNS);

    window.nounAPI.markNounLearned('郡县制');
    window.nounAPI.markNounLearned('郡县制');

    expect(window.storageAPI.getStore().xds_learning_events).toEqual([
      {
        type: 'noun_learned',
        timestamp: '2026-06-11T12:00:00.000Z',
        sourceId: '郡县制'
      }
    ]);

    vi.useRealTimers();
  });

  test('selectQuizAnswer records correct and wrong quiz events', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-11T12:00:00.000Z'));
    mountDOM('<div id="quiz-panel"></div><div id="wrong-question-panel"></div><div id="stat-ex">0</div>');
    window.storageAPI = createStorageMock();
    await import('../src/js/learning-stats.js');
    await import('../src/js/quiz.js');

    window.quizAPI.setQuestions(QUESTIONS);
    window.quizAPI.selectQuizAnswer('郡县制');
    window.quizAPI.startQuiz();
    window.quizAPI.selectQuizAnswer('分封制');

    expect(window.storageAPI.getStore().xds_learning_events).toEqual([
      {
        type: 'quiz_correct',
        timestamp: '2026-06-11T12:00:00.000Z',
        sourceId: 'q001'
      },
      {
        type: 'quiz_wrong',
        timestamp: '2026-06-11T12:00:00.000Z',
        sourceId: 'q001'
      }
    ]);

    vi.useRealTimers();
  });

  test('doCheckin records a checkin event once for the day', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-11T12:00:00.000Z'));
    mountDOM(`
      <button id="checkin-btn">📅 今日打卡</button>
      <div id="ck-total">0</div>
      <div id="ck-streak">0</div>
      <div id="ck-month">0</div>
      <div id="stat-days">0</div>
      <div id="stat-mins">0</div>
      <div id="stat-ex">0</div>
      <div id="stat-streak">0</div>
    `);
    window.storageAPI = createStorageMock();
    await import('../src/js/learning-stats.js');
    await import('../src/js/checkin.js');

    window.checkinAPI.doCheckin();
    window.checkinAPI.doCheckin();

    expect(window.storageAPI.getStore().xds_learning_events).toEqual([
      {
        type: 'checkin',
        timestamp: '2026-06-11T12:00:00.000Z',
        sourceId: '2026-06-11'
      }
    ]);

    vi.useRealTimers();
  });
});
