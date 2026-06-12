import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

function mountQuizDOM() {
  mountDOM(`
    <div id="science-page" class="sub">
      <button id="quiz-entry" onclick="startQuiz()">真题演练</button>
      <div id="quiz-panel"></div>
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

beforeEach(() => {
  vi.resetModules();
  resetGlobals();
  mountQuizDOM();
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

describe('basic quiz module', () => {
  test('setQuestions renders the first question', async () => {
    await import('../src/js/quiz.js');

    window.quizAPI.setQuestions(QUESTIONS);

    expect(document.getElementById('quiz-panel').textContent).toContain('第 1 / 2 题');
    expect(document.getElementById('quiz-panel').textContent).toContain('秦统一后在全国推行的地方行政制度是？');
    expect(document.querySelectorAll('#quiz-panel .quiz-option')).toHaveLength(4);
  });

  test('selectQuizAnswer shows correct feedback and explanation', async () => {
    await import('../src/js/quiz.js');
    window.quizAPI.setQuestions(QUESTIONS);

    window.quizAPI.selectQuizAnswer('郡县制');

    expect(document.getElementById('quiz-panel').textContent).toContain('✅ 回答正确！');
    expect(document.getElementById('quiz-panel').textContent).toContain('郡县制由中央任免地方长官');
    expect(window.quizAPI.getQuizState().correctCount).toBe(1);
  });

  test('selectQuizAnswer shows wrong feedback and correct answer', async () => {
    await import('../src/js/quiz.js');
    window.quizAPI.setQuestions(QUESTIONS);

    window.quizAPI.selectQuizAnswer('分封制');

    expect(document.getElementById('quiz-panel').textContent).toContain('❌ 回答错误，正确答案：郡县制');
    expect(window.quizAPI.getQuizState().correctCount).toBe(0);
  });

  test('nextQuizQuestion moves to the next question after answering', async () => {
    await import('../src/js/quiz.js');
    window.quizAPI.setQuestions(QUESTIONS);
    window.quizAPI.selectQuizAnswer('郡县制');

    window.quizAPI.nextQuizQuestion();

    expect(window.quizAPI.getQuizState().currentIndex).toBe(1);
    expect(document.getElementById('quiz-panel').textContent).toContain('第 2 / 2 题');
    expect(document.getElementById('quiz-panel').textContent).toContain('科举制正式形成');
  });

  test('nextQuizQuestion blocks progression before selecting an answer', async () => {
    await import('../src/js/quiz.js');
    window.quizAPI.setQuestions(QUESTIONS);

    window.quizAPI.nextQuizQuestion();

    expect(window.quizAPI.getQuizState().currentIndex).toBe(0);
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('请先选择一个答案');
  });

  test('finishes quiz and shows score after the last question', async () => {
    await import('../src/js/quiz.js');
    window.quizAPI.setQuestions(QUESTIONS);
    window.quizAPI.selectQuizAnswer('郡县制');
    window.quizAPI.nextQuizQuestion();
    window.quizAPI.selectQuizAnswer('隋唐');

    window.quizAPI.nextQuizQuestion();

    expect(window.quizAPI.getQuizState().completed).toBe(true);
    expect(document.getElementById('quiz-panel').textContent).toContain('练习完成');
    expect(document.getElementById('quiz-panel').textContent).toContain('2 / 2');
    expect(document.getElementById('quiz-panel').textContent).toContain('100%');
  });

  test('empty question list renders empty state', async () => {
    await import('../src/js/quiz.js');

    window.quizAPI.setQuestions([]);

    expect(document.getElementById('quiz-panel').textContent).toContain('暂无题目');
  });

  test('escapes question option and explanation HTML before rendering', async () => {
    await import('../src/js/quiz.js');
    window.quizAPI.setQuestions([
      {
        id: 'xss',
        question: '<script>window.__quizXss = true</script>题干',
        options: ['<img src=x onerror="window.__quizXss = true">', '安全选项'],
        answer: '安全选项',
        explanation: '<script>解析</script>',
        topic: '<script>主题</script>',
        dynasty: '测试'
      }
    ]);
    window.quizAPI.selectQuizAnswer('安全选项');

    expect(document.querySelector('#quiz-panel script')).toBeNull();
    expect(document.querySelector('#quiz-panel img')).toBeNull();
    expect(window.__quizXss).toBeUndefined();
    expect(document.getElementById('quiz-panel').innerHTML).toContain('&lt;script&gt;window.__quizXss = true&lt;/script&gt;题干');
    expect(document.getElementById('quiz-panel').innerHTML).toContain('&lt;script&gt;解析&lt;/script&gt;');
  });
});
