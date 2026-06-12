# Wrong Question Collection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Phase 2 Task 2.4 wrong-question collection with persistent wrong records, review list, retry, and mastered state.

**Architecture:** Extend the existing ES5 IIFE `src/js/quiz.js` because wrong questions are part of quiz behavior and depend on the current question bank. Persist wrong-question records through `window.storageAPI` using `xds_wrong_questions`; render the wrong list into an `index.html` shell container and expose only small global wrappers through `app.js` for inline handlers.

**Tech Stack:** Native HTML, ES5 JavaScript IIFEs, DOM APIs, `window.storageAPI`, `window.navigationAPI.showToast`, `window.htmlUtils.escapeHtml`, Vitest, jsdom.

---

## File Structure

- Create: `tests/wrong-question.test.js`
  - Responsibility: TDD coverage for wrong-question persistence, count accumulation, list rendering, retry, mastered state, missing storage adapter safety, and XSS-safe wrong-list rendering.
- Modify: `src/js/quiz.js`
  - Responsibility: record wrong answers, persist/read wrong records, render wrong list, retry a wrong question, and mark wrong questions mastered.
- Modify: `index.html`
  - Responsibility: replace one remaining science-prep fake entry with a real wrong-question entry and add `#wrong-question-panel`.
- Modify: `src/js/app.js`
  - Responsibility: expose wrong-question functions for inline HTML handlers.
- Modify: `CHANGELOG.md`
  - Responsibility: record Task 2.4 implementation and verification.

---

### Task 1: Add failing wrong-question tests

**Files:**
- Create: `tests/wrong-question.test.js`

- [ ] **Step 1: Write the failing test file**

Create `tests/wrong-question.test.js` with this complete content:

```js
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
    expect(document.getElementById('wrong-question-panel').innerHTML).toContain('&lt;img src=x onerror=&quot;window.__wrongXss = true&quot;&gt;');
  });
});
```

- [ ] **Step 2: Run the wrong-question tests to verify RED**

Run:

```powershell
npx vitest run tests/wrong-question.test.js --environment jsdom
```

Expected: FAIL because `quiz.js` does not expose wrong-question APIs and does not record wrong answers yet.

---

### Task 2: Implement wrong-question persistence

**Files:**
- Modify: `src/js/quiz.js`
- Test: `tests/wrong-question.test.js`

- [ ] **Step 1: Add storage key and adapter helpers**

In `src/js/quiz.js`, immediately after `var completed = false;`, add:

```js
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
```

- [ ] **Step 2: Add wrong-record function**

In `src/js/quiz.js`, add this function after `getCorrectCount()`:

```js
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
```

- [ ] **Step 3: Record wrong answers inside `selectQuizAnswer`**

In `selectQuizAnswer(answer)`, replace:

```js
    selectedAnswers[question.id] = answer;
    correctAnswers[question.id] = answer === question.answer;
    renderQuiz();
```

with:

```js
    selectedAnswers[question.id] = answer;
    correctAnswers[question.id] = answer === question.answer;

    if (answer !== question.answer) {
      recordWrongQuestion(question, answer);
    }

    renderQuiz();
```

- [ ] **Step 4: Expose `getWrongQuestions` for tests**

In `window.quizAPI`, add:

```js
    getWrongQuestions: getWrongQuestions,
```

The API block should now include:

```js
  window.quizAPI = {
    setQuestions: setQuestions,
    startQuiz: startQuiz,
    renderQuiz: renderQuiz,
    selectQuizAnswer: selectQuizAnswer,
    nextQuizQuestion: nextQuizQuestion,
    getQuizState: getQuizState,
    getWrongQuestions: getWrongQuestions,
    resetQuiz: resetQuiz
  };
```

- [ ] **Step 5: Run wrong-question tests**

Run:

```powershell
npx vitest run tests/wrong-question.test.js --environment jsdom
```

Expected: persistence tests PASS; list/retry/mastered tests still FAIL because those APIs are not implemented yet.

---

### Task 3: Implement wrong-question list, retry, and mastered actions

**Files:**
- Modify: `src/js/quiz.js`
- Test: `tests/wrong-question.test.js`

- [ ] **Step 1: Add question lookup helpers**

In `src/js/quiz.js`, add these functions after `getCurrentQuestion()`:

```js
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
```

- [ ] **Step 2: Add wrong panel and renderer**

In `src/js/quiz.js`, add this function after `renderComplete()`:

```js
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
```

- [ ] **Step 3: Add retry and mastered functions**

In `src/js/quiz.js`, add these functions after `nextQuizQuestion()`:

```js
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
```

- [ ] **Step 4: Expose wrong-list APIs**

In `window.quizAPI`, add:

```js
    renderWrongQuestions: renderWrongQuestions,
    retryWrongQuestion: retryWrongQuestion,
    markWrongQuestionMastered: markWrongQuestionMastered,
```

The final API block should include:

```js
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
```

- [ ] **Step 5: Run wrong-question tests**

Run:

```powershell
npx vitest run tests/wrong-question.test.js --environment jsdom
```

Expected: PASS.

---

### Task 4: Wire wrong-question UI into index and app

**Files:**
- Modify: `index.html`
- Modify: `src/js/app.js`
- Test: `tests/wrong-question.test.js`
- Test: `tests/app-static-data.test.js`

- [ ] **Step 1: Replace one remaining fake science-prep entry**

In `index.html`, replace this button:

```html
<button class="scard" onclick="showToast('笔记上传功能开发中')"><span class="ic">📤</span><h4>笔记上传</h4><p>上传分享学习笔记</p></button>
```

with:

```html
<button class="scard" onclick="renderWrongQuestions()"><span class="ic">📌</span><h4>错题集</h4><p>回顾未掌握题目</p></button>
```

- [ ] **Step 2: Add wrong-question panel shell**

In `index.html`, replace:

```html
<div id="quiz-panel"></div>
```

with:

```html
<div id="quiz-panel"></div>
<div id="wrong-question-panel"></div>
```

- [ ] **Step 3: Expose wrong-question globals in `src/js/app.js`**

Inside `exposeGlobals()`, extend the existing `if (window.quizAPI)` block from:

```js
    if (window.quizAPI) {
      window.startQuiz = window.quizAPI.startQuiz;
      window.selectQuizAnswer = window.quizAPI.selectQuizAnswer;
      window.nextQuizQuestion = window.quizAPI.nextQuizQuestion;
    }
```

to:

```js
    if (window.quizAPI) {
      window.startQuiz = window.quizAPI.startQuiz;
      window.selectQuizAnswer = window.quizAPI.selectQuizAnswer;
      window.nextQuizQuestion = window.quizAPI.nextQuizQuestion;
      window.renderWrongQuestions = window.quizAPI.renderWrongQuestions;
      window.retryWrongQuestion = window.quizAPI.retryWrongQuestion;
      window.markWrongQuestionMastered = window.quizAPI.markWrongQuestionMastered;
    }
```

- [ ] **Step 4: Run related tests**

Run:

```powershell
npx vitest run tests/wrong-question.test.js tests/quiz.test.js tests/app-static-data.test.js --environment jsdom
```

Expected: PASS.

---

### Task 5: Update changelog and validate

**Files:**
- Modify: `CHANGELOG.md`
- Test: `tests/wrong-question.test.js`
- Test: `tests/quiz.test.js`

- [ ] **Step 1: Run focused wrong-question tests**

Run:

```powershell
npx vitest run tests/quiz.test.js tests/wrong-question.test.js --environment jsdom
```

Expected: PASS.

- [ ] **Step 2: Update `CHANGELOG.md`**

Insert this section under `## 2026-06-11`, above the Task 2.3 entry:

```md
### Phase 2 Task 2.4：错题集

- 更新 `src/js/quiz.js`，答错选择题后通过 `storageAPI` 持久化到 `xds_wrong_questions`。
- 同一题多次答错会累加 `wrongCount`，并更新最近答错时间和最近错误答案。
- 科学备考页新增真实“错题集”入口和 `#wrong-question-panel` 渲染容器。
- 错题列表支持“再做一次”跳回对应题目，以及“标记已掌握”隐藏未掌握列表中的记录。
- 新增 `tests/wrong-question.test.js`，覆盖错题写入、累加、答对不写入、列表渲染、再做一次、标记掌握、storage adapter 缺失降级和 XSS 转义。

#### 验证

- `npx vitest run tests/quiz.test.js tests/wrong-question.test.js --environment jsdom`：通过。
- `npx vitest run tests/wrong-question.test.js tests/quiz.test.js tests/app-static-data.test.js --environment jsdom`：通过。
```

- [ ] **Step 3: Run focused and related tests again**

Run:

```powershell
npx vitest run tests/wrong-question.test.js tests/quiz.test.js tests/app-static-data.test.js --environment jsdom
```

Expected: PASS.

---

### Task 6: Final validation and optional commit

**Files:**
- Modify: `src/js/quiz.js`
- Modify: `index.html`
- Modify: `src/js/app.js`
- Modify: `CHANGELOG.md`
- Create: `tests/wrong-question.test.js`
- Create: `docs/superpowers/specs/2026-06-11-wrong-question-design.md`
- Create: `docs/superpowers/plans/2026-06-11-wrong-question-implementation-plan.md`

- [ ] **Step 1: Run data validation**

Run:

```powershell
node scripts/validate-data.js
```

Expected: `0 ERROR`. Existing `people.json` centers-structure WARN may remain.

- [ ] **Step 2: Run the full test suite**

Run:

```powershell
npx vitest run --environment jsdom
```

Expected: PASS.

- [ ] **Step 3: Inspect changed files**

Run:

```powershell
git status --short
git diff --stat -- src/js/quiz.js tests/wrong-question.test.js index.html src/js/app.js CHANGELOG.md docs/superpowers/specs/2026-06-11-wrong-question-design.md docs/superpowers/plans/2026-06-11-wrong-question-implementation-plan.md
```

Expected: Task 2.4 files appear. Pre-existing unrelated files may remain in the working tree and should not be staged unless the user explicitly asks for a broader commit.

- [ ] **Step 4: Stage only Task 2.4 files if the user authorizes a commit**

Run only after explicit commit approval:

```powershell
git add -- src/js/quiz.js tests/wrong-question.test.js index.html src/js/app.js CHANGELOG.md docs/superpowers/specs/2026-06-11-wrong-question-design.md docs/superpowers/plans/2026-06-11-wrong-question-implementation-plan.md
```

Expected: no command output.

- [ ] **Step 5: Commit Task 2.4 if the user authorizes a commit**

Run only after explicit commit approval:

```powershell
git commit -m "feat: add wrong question collection"
```

Expected: a commit is created with only Task 2.4 files.

- [ ] **Step 6: Report completion**

Report these facts:

```text
Task 2.4 complete.
Wrong answers persist to xds_wrong_questions through storageAPI.
Repeated wrong answers increment wrongCount and update last wrong metadata.
Wrong-question list supports retry and mark mastered.
Focused wrong-question tests, data validation, and full Vitest suite pass.
```
