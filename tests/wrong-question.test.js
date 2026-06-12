import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

function mountQuizDOM() {
  mountDOM(`
    <div id="science-page" class="sub">
      <div id="quiz-panel"></div>
      <div id="wrong-question-panel"></div>
    </div>
    <div id="toast"></div>
  `);
}

const QUESTIONS = [
  {
    id: 'q001',
    question: '秦统一后在全国推行的地方行政制度是？',
    options: ['分封制', '郡县制', '井田制', '科举制'],
    answer: '郡县制',
    explanation: '郡县制由中央任免地方长官，是中央集权制度形成的重要标志。',
    topic: '制度史',
    dynasty: '秦朝'
  },
  {
    id: 'q002',
    question: '科举制正式形成通常追溯到哪一时期？',
    options: ['西周', '秦朝', '隋唐', '明清'],
    answer: '隋唐',
    explanation: '隋唐时期通过考试选拔官员的制度逐渐成形并完善。',
    topic: '制度史',
    dynasty: '隋唐'
  }
];

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

beforeEach(() => {
  vi.resetModules();
  resetGlobals();
  mountQuizDOM();
  window.navigationAPI = { showToast: vi.fn() };
  window.storageAPI = createStorageMock();
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

describe('wrong question persistence', () => {
  test('records a wrong answer to xds_wrong_questions', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-11T12:00:00.000Z'));

    await import('../src/js/quiz.js');
    window.quizAPI.setQuestions(QUESTIONS);

    window.quizAPI.selectQuizAnswer('分封制');

    expect(window.storageAPI.setStoredJSON).toHaveBeenCalledWith('xds_wrong_questions', {
      q001: {
        questionId: 'q001',
        wrongCount: 1,
        lastWrongAt: '2026-06-11T12:00:00.000Z',
        lastUserAnswer: '分封制',
        mastered: false
      }
    });

    vi.useRealTimers();
  });

  test('increments wrongCount for repeated wrong answers to the same question', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-11T12:30:00.000Z'));
    window.storageAPI = createStorageMock({
      xds_wrong_questions: {
        q001: {
          questionId: 'q001',
          wrongCount: 1,
          lastWrongAt: '2026-06-11T12:00:00.000Z',
          lastUserAnswer: '井田制',
          mastered: true
        }
      }
    });

    await import('../src/js/quiz.js');
    window.quizAPI.setQuestions(QUESTIONS);

    window.quizAPI.selectQuizAnswer('分封制');

    expect(window.storageAPI.setStoredJSON).toHaveBeenCalledWith('xds_wrong_questions', {
      q001: {
        questionId: 'q001',
        wrongCount: 2,
        lastWrongAt: '2026-06-11T12:30:00.000Z',
        lastUserAnswer: '分封制',
        mastered: false
      }
    });

    vi.useRealTimers();
  });

  test('does not record a wrong question for a correct answer', async () => {
    await import('../src/js/quiz.js');
    window.quizAPI.setQuestions(QUESTIONS);

    window.quizAPI.selectQuizAnswer('郡县制');

    expect(window.storageAPI.setStoredJSON).not.toHaveBeenCalledWith('xds_wrong_questions', expect.anything());
    expect(window.quizAPI.getWrongQuestions()).toEqual({});
  });
});

describe('wrong question list actions', () => {
  test('renderWrongQuestions displays unmastered wrong questions', async () => {
    window.storageAPI = createStorageMock({
      xds_wrong_questions: {
        q001: {
          questionId: 'q001',
          wrongCount: 2,
          lastWrongAt: '2026-06-11T12:00:00.000Z',
          lastUserAnswer: '分封制',
          mastered: false
        }
      }
    });
    await import('../src/js/quiz.js');
    window.quizAPI.setQuestions(QUESTIONS);

    window.quizAPI.renderWrongQuestions();

    expect(document.getElementById('wrong-question-panel').textContent).toContain('秦统一后在全国推行的地方行政制度是？');
    expect(document.getElementById('wrong-question-panel').textContent).toContain('最近错选：分封制');
    expect(document.getElementById('wrong-question-panel').textContent).toContain('错误次数：2');
    expect(document.getElementById('wrong-question-panel').textContent).toContain('再做一次');
    expect(document.getElementById('wrong-question-panel').textContent).toContain('标记已掌握');
  });

  test('retryWrongQuestion jumps to the target question and clears its selected state', async () => {
    await import('../src/js/quiz.js');
    window.quizAPI.setQuestions(QUESTIONS);
    window.quizAPI.selectQuizAnswer('郡县制');
    window.quizAPI.nextQuizQuestion();
    window.quizAPI.selectQuizAnswer('秦朝');

    window.quizAPI.retryWrongQuestion('q001');

    expect(window.quizAPI.getQuizState().currentIndex).toBe(0);
    expect(window.quizAPI.getQuizState().selectedAnswers.q001).toBeUndefined();
    expect(document.getElementById('quiz-panel').textContent).toContain('第 1 / 2 题');
    expect(document.getElementById('quiz-panel').textContent).toContain('秦统一后在全国推行的地方行政制度是？');
  });

  test('markWrongQuestionMastered updates storage and hides the item from the default list', async () => {
    window.storageAPI = createStorageMock({
      xds_wrong_questions: {
        q001: {
          questionId: 'q001',
          wrongCount: 1,
          lastWrongAt: '2026-06-11T12:00:00.000Z',
          lastUserAnswer: '分封制',
          mastered: false
        }
      }
    });
    await import('../src/js/quiz.js');
    window.quizAPI.setQuestions(QUESTIONS);

    window.quizAPI.markWrongQuestionMastered('q001');

    expect(window.storageAPI.setStoredJSON).toHaveBeenCalledWith('xds_wrong_questions', {
      q001: {
        questionId: 'q001',
        wrongCount: 1,
        lastWrongAt: '2026-06-11T12:00:00.000Z',
        lastUserAnswer: '分封制',
        mastered: true
      }
    });
    expect(document.getElementById('wrong-question-panel').textContent).toContain('暂无错题');
  });

  test('wrong question APIs do not throw when storageAPI is unavailable', async () => {
    delete window.storageAPI;
    await import('../src/js/quiz.js');
    window.quizAPI.setQuestions(QUESTIONS);

    expect(function () {
      window.quizAPI.selectQuizAnswer('分封制');
      window.quizAPI.renderWrongQuestions();
      window.quizAPI.retryWrongQuestion('missing');
      window.quizAPI.markWrongQuestionMastered('q001');
    }).not.toThrow();

    expect(window.quizAPI.getWrongQuestions()).toEqual({});
  });

  test('renderWrongQuestions escapes script-like question fields', async () => {
    window.storageAPI = createStorageMock({
      xds_wrong_questions: {
        xss: {
          questionId: 'xss',
          wrongCount: 1,
          lastWrongAt: '2026-06-11T12:00:00.000Z',
          lastUserAnswer: '<img src=x onerror="window.__wrongXss = true">',
          mastered: false
        }
      }
    });
    await import('../src/js/quiz.js');
    window.quizAPI.setQuestions([
      {
        id: 'xss',
        question: '<script>window.__wrongXss = true</script>题干',
        options: ['错项', '正项'],
        answer: '正项',
        explanation: '<script>解析</script>',
        topic: '<script>主题</script>',
        dynasty: '测试'
      }
    ]);

    window.quizAPI.renderWrongQuestions();

    expect(document.querySelector('#wrong-question-panel script')).toBeNull();
    expect(document.querySelector('#wrong-question-panel img')).toBeNull();
    expect(window.__wrongXss).toBeUndefined();
    expect(document.getElementById('wrong-question-panel').innerHTML).toContain('&lt;script&gt;window.__wrongXss = true&lt;/script&gt;题干');
    expect(document.getElementById('wrong-question-panel').textContent).toContain('<img src=x onerror="window.__wrongXss = true">');
  });
});
