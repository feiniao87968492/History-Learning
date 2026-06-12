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

function mountReviewDOM() {
  mountDOM(`
    <div id="science-page">
      <div id="review-zone-panel"></div>
    </div>
    <div id="quiz-panel"></div>
    <div id="toast"></div>
  `);
}

const NOUNS = {
  '郡县制': {
    text: '秦统一后在全国推行郡县制。',
    dynasty: '秦朝',
    category: '制度'
  },
  '科举制': {
    text: '科举制是隋唐以后通过考试选拔官员的制度。',
    dynasty: '隋唐',
    category: '制度'
  }
};

const QUESTIONS = [
  {
    id: 'q001',
    question: '秦统一后在全国推行的地方行政制度是？',
    options: ['分封制', '郡县制'],
    answer: '郡县制',
    explanation: '郡县制由中央任免地方长官。',
    topic: '制度史',
    dynasty: '秦朝'
  },
  {
    id: 'q002',
    question: '科举制正式形成通常追溯到哪一时期？',
    options: ['西周', '隋唐'],
    answer: '隋唐',
    explanation: '隋唐时期考试取士逐渐成形。',
    topic: '制度史',
    dynasty: '隋唐'
  }
];

beforeEach(() => {
  vi.resetModules();
  resetGlobals();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-11T12:00:00.000Z'));
  mountReviewDOM();
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

describe('review zone', () => {
  test('renders learned nouns by learnedAt descending', async () => {
    window.storageAPI = createStorageMock({
      xds_learned: {
        '郡县制': { name: '郡县制', learnedAt: '2026-06-10T10:00:00.000Z' },
        '科举制': { name: '科举制', learnedAt: '2026-06-11T10:00:00.000Z' }
      }
    });
    window.nounAPI = {
      getNoun: vi.fn(function (name) { return NOUNS[name] || null; }),
      openNounDet: vi.fn()
    };
    await import('../src/js/review.js');

    window.reviewAPI.renderReviewZone();

    var learnedCards = document.querySelectorAll('#review-learned-list .review-card');
    expect(learnedCards).toHaveLength(2);
    expect(learnedCards[0].textContent).toContain('科举制');
    expect(learnedCards[1].textContent).toContain('郡县制');
    expect(document.getElementById('review-zone-panel').textContent).toContain('已学名词');
  });

  test('renders unmastered wrong questions in the review zone', async () => {
    window.storageAPI = createStorageMock({
      xds_wrong_questions: {
        q001: {
          questionId: 'q001',
          wrongCount: 2,
          lastWrongAt: '2026-06-11T09:00:00.000Z',
          lastUserAnswer: '分封制',
          mastered: false
        },
        q002: {
          questionId: 'q002',
          wrongCount: 1,
          lastWrongAt: '2026-06-11T10:00:00.000Z',
          lastUserAnswer: '西周',
          mastered: true
        }
      }
    });
    window.quizAPI = {
      getQuizState: vi.fn(function () { return { questions: QUESTIONS }; }),
      retryWrongQuestion: vi.fn()
    };
    await import('../src/js/review.js');

    window.reviewAPI.renderReviewZone();

    expect(document.querySelectorAll('#review-wrong-list .review-card')).toHaveLength(1);
    expect(document.getElementById('review-wrong-list').textContent).toContain('秦统一后在全国推行的地方行政制度是？');
    expect(document.getElementById('review-wrong-list').textContent).toContain('错误次数：2');
    expect(document.getElementById('review-wrong-list').textContent).not.toContain('科举制正式形成');
  });

  test('filters learned nouns and wrong questions by time range', async () => {
    window.storageAPI = createStorageMock({
      xds_learned: {
        '郡县制': { name: '郡县制', learnedAt: '2026-06-10T10:00:00.000Z' },
        '科举制': { name: '科举制', learnedAt: '2026-05-01T10:00:00.000Z' }
      },
      xds_wrong_questions: {
        q001: {
          questionId: 'q001', wrongCount: 1, lastWrongAt: '2026-06-11T09:00:00.000Z', lastUserAnswer: '分封制', mastered: false
        },
        q002: {
          questionId: 'q002', wrongCount: 1, lastWrongAt: '2026-05-01T10:00:00.000Z', lastUserAnswer: '西周', mastered: false
        }
      }
    });
    window.nounAPI = { getNoun: vi.fn(function (name) { return NOUNS[name] || null; }), openNounDet: vi.fn() };
    window.quizAPI = { getQuizState: vi.fn(function () { return { questions: QUESTIONS }; }), retryWrongQuestion: vi.fn() };
    await import('../src/js/review.js');

    window.reviewAPI.renderReviewZone(7);

    expect(document.getElementById('review-learned-list').textContent).toContain('郡县制');
    expect(document.getElementById('review-learned-list').textContent).not.toContain('科举制');
    expect(document.getElementById('review-wrong-list').textContent).toContain('秦统一后');
    expect(document.getElementById('review-wrong-list').textContent).not.toContain('科举制正式形成');
  });

  test('renders empty states when there is no review data', async () => {
    await import('../src/js/review.js');

    window.reviewAPI.renderReviewZone();

    expect(document.getElementById('review-learned-list').textContent).toContain('暂无已学名词');
    expect(document.getElementById('review-wrong-list').textContent).toContain('暂无待复习错题');
  });

  test('clicking review items opens noun detail or retries wrong question', async () => {
    window.storageAPI = createStorageMock({
      xds_learned: {
        '郡县制': { name: '郡县制', learnedAt: '2026-06-10T10:00:00.000Z' }
      },
      xds_wrong_questions: {
        q001: {
          questionId: 'q001', wrongCount: 1, lastWrongAt: '2026-06-11T09:00:00.000Z', lastUserAnswer: '分封制', mastered: false
        }
      }
    });
    window.nounAPI = { getNoun: vi.fn(function (name) { return NOUNS[name] || null; }), openNounDet: vi.fn() };
    window.quizAPI = { getQuizState: vi.fn(function () { return { questions: QUESTIONS }; }), retryWrongQuestion: vi.fn() };
    await import('../src/js/review.js');

    window.reviewAPI.renderReviewZone();
    document.querySelector('#review-learned-list .review-card').click();
    document.querySelector('#review-wrong-list .review-card').click();

    expect(window.nounAPI.openNounDet).toHaveBeenCalledWith('郡县制');
    expect(window.quizAPI.retryWrongQuestion).toHaveBeenCalledWith('q001');
  });

  test('escapes script-like review data before rendering', async () => {
    window.storageAPI = createStorageMock({
      xds_learned: {
        '<img src=x onerror="window.__reviewXss = true">': {
          name: '<img src=x onerror="window.__reviewXss = true">',
          learnedAt: '2026-06-10T10:00:00.000Z'
        }
      }
    });
    window.nounAPI = {
      getNoun: vi.fn(function () {
        return { dynasty: '<script>window.__reviewXss = true</script>', category: '制度' };
      }),
      openNounDet: vi.fn()
    };
    await import('../src/js/review.js');

    window.reviewAPI.renderReviewZone();

    expect(document.querySelector('#review-zone-panel script')).toBeNull();
    expect(document.querySelector('#review-zone-panel img')).toBeNull();
    expect(window.__reviewXss).toBeUndefined();
    expect(document.getElementById('review-zone-panel').innerHTML).toContain('&lt;img src=x onerror=');
  });
});
