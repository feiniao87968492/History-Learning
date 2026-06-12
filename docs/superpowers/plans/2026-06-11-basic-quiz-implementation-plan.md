# Basic Quiz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Phase 2 Task 2.3 basic multiple-choice quiz with seed questions, browser entry, safe rendering, and tests.

**Architecture:** Add `questions.json` as the quiz source of truth and a standalone ES5 IIFE `quiz.js` that owns quiz state and rendering. `app.js` only loads question data and exposes quiz globals; `index.html` only supplies the real science-prep entry and render container.

**Tech Stack:** Native HTML, ES5 JavaScript IIFEs, JSON static data, adapter-based `dataLoaderAPI` via `app.js`, `window.htmlUtils.escapeHtml`, Vitest, jsdom.

---

## File Structure

- Create: `tests/quiz.test.js`
  - Responsibility: TDD coverage for quiz rendering, answer feedback, progression, completion score, empty state, and XSS-safe rendering.
- Create: `src/js/quiz.js`
  - Responsibility: quiz state, rendering, answer selection, next-question flow, completion state, and `window.quizAPI` exposure.
- Create: `src/data/questions.json`
  - Responsibility: 12 seed multiple-choice questions with `id`, `question`, `options`, `answer`, `explanation`, `topic`, and `dynasty`.
- Modify: `index.html`
  - Responsibility: replace one science-prep fake entry with real “真题演练”, add `#quiz-panel`, and load `quiz.js` before `app.js`.
- Modify: `src/js/app.js`
  - Responsibility: expose quiz globals and load `questions.json` into `quizAPI`.
- Modify: `CHANGELOG.md`
  - Responsibility: record Task 2.3 implementation and verification.

---

### Task 1: Add failing quiz tests

**Files:**
- Create: `tests/quiz.test.js`

- [ ] **Step 1: Write the failing test file**

Create `tests/quiz.test.js` with this complete content:

```js
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
```

- [ ] **Step 2: Run the quiz tests to verify RED**

Run:

```powershell
npx vitest run tests/quiz.test.js --environment jsdom
```

Expected: FAIL because `src/js/quiz.js` does not exist.

---

### Task 2: Implement the quiz module

**Files:**
- Create: `src/js/quiz.js`
- Test: `tests/quiz.test.js`

- [ ] **Step 1: Create `src/js/quiz.js`**

Create `src/js/quiz.js` with this complete content:

```js
(function () {
  var questions = [];
  var currentIndex = 0;
  var selectedAnswers = {};
  var correctAnswers = {};
  var completed = false;

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

  function getPanel() {
    return document.getElementById('quiz-panel');
  }

  function getCurrentQuestion() {
    return questions[currentIndex] || null;
  }

  function getCorrectCount() {
    return Object.keys(correctAnswers).filter(function (id) {
      return correctAnswers[id];
    }).length;
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
    resetQuiz: resetQuiz
  };
})();
```

- [ ] **Step 2: Run quiz tests to verify GREEN**

Run:

```powershell
npx vitest run tests/quiz.test.js --environment jsdom
```

Expected: PASS.

---

### Task 3: Add seed question data

**Files:**
- Create: `src/data/questions.json`

- [ ] **Step 1: Write seed data**

Create `src/data/questions.json` with this complete content:

```json
[
  {
    "id": "q001",
    "question": "秦统一后在全国推行的地方行政制度是？",
    "options": ["分封制", "郡县制", "井田制", "科举制"],
    "answer": "郡县制",
    "explanation": "郡县制由中央任免地方长官，削弱地方割据，是中央集权制度形成的重要标志。",
    "topic": "制度史",
    "dynasty": "秦朝"
  },
  {
    "id": "q002",
    "question": "商鞅变法中最能直接增强秦国军事实力的措施是？",
    "options": ["奖励军功", "设立军机处", "推行科举", "实行一条鞭法"],
    "answer": "奖励军功",
    "explanation": "奖励军功打破旧贵族特权，使士兵可以凭战功获得爵位，直接增强军队战斗力。",
    "topic": "改革史",
    "dynasty": "战国"
  },
  {
    "id": "q003",
    "question": "汉武帝推行推恩令的主要目的是？",
    "options": ["加强诸侯王势力", "削弱诸侯国力量", "废除郡县制", "开放海上贸易"],
    "answer": "削弱诸侯国力量",
    "explanation": "推恩令允许诸侯王分封子弟，使诸侯国越分越小，从而加强中央集权。",
    "topic": "制度史",
    "dynasty": "西汉"
  },
  {
    "id": "q004",
    "question": "丝绸之路形成的重要前提之一是？",
    "options": ["张骞通西域", "郑和下西洋", "设立军机处", "八股取士"],
    "answer": "张骞通西域",
    "explanation": "张骞通西域加强了汉朝与西域的联系，为陆上丝绸之路的发展奠定基础。",
    "topic": "交流史",
    "dynasty": "西汉"
  },
  {
    "id": "q005",
    "question": "科举制的主要历史作用是？",
    "options": ["按血缘分封诸侯", "通过考试选拔官员", "由商人发行纸币", "由皇帝直接处理军务"],
    "answer": "通过考试选拔官员",
    "explanation": "科举制通过考试选拔官员，扩大了统治基础，也为社会流动提供通道。",
    "topic": "制度史",
    "dynasty": "隋唐"
  },
  {
    "id": "q006",
    "question": "三省六部制中负责执行政令的是？",
    "options": ["中书省", "门下省", "尚书省", "军机处"],
    "answer": "尚书省",
    "explanation": "三省中，中书省起草诏令，门下省审议封驳，尚书省负责执行政令。",
    "topic": "制度史",
    "dynasty": "隋唐"
  },
  {
    "id": "q007",
    "question": "北宋四川地区出现的早期纸币是？",
    "options": ["交子", "半两钱", "开元通宝", "白银"],
    "answer": "交子",
    "explanation": "交子是北宋四川地区出现的早期纸币，反映了宋代商品经济的发展。",
    "topic": "经济史",
    "dynasty": "北宋"
  },
  {
    "id": "q008",
    "question": "明代张居正推行的一项重要赋役改革是？",
    "options": ["一条鞭法", "推恩令", "商鞅变法", "租庸调制"],
    "answer": "一条鞭法",
    "explanation": "一条鞭法将田赋、徭役和杂税合并折银征收，推动白银在财政中的地位上升。",
    "topic": "经济史",
    "dynasty": "明朝"
  },
  {
    "id": "q009",
    "question": "清代军机处的设立反映了什么趋势？",
    "options": ["君主专制强化", "诸侯分封恢复", "地方自治扩大", "科举制度废除"],
    "answer": "君主专制强化",
    "explanation": "军机处直接承旨办事，强化皇帝对军国大政的控制，体现君主专制加强。",
    "topic": "制度史",
    "dynasty": "清朝"
  },
  {
    "id": "q010",
    "question": "井田制主要体现了西周时期哪一方面的制度特征？",
    "options": ["土地与等级秩序结合", "纸币广泛流通", "考试选官成熟", "海禁政策实施"],
    "answer": "土地与等级秩序结合",
    "explanation": "井田制体现了宗法分封社会中土地、身份和义务之间的结合。",
    "topic": "经济史",
    "dynasty": "西周"
  },
  {
    "id": "q011",
    "question": "分封制在西周初期的重要作用是？",
    "options": ["扩大和巩固统治范围", "彻底消除地方割据", "建立纸币制度", "废除宗法关系"],
    "answer": "扩大和巩固统治范围",
    "explanation": "周王通过分封诸侯镇守各地，在早期有利于扩大和巩固统治范围。",
    "topic": "制度史",
    "dynasty": "西周"
  },
  {
    "id": "q012",
    "question": "与科举制相比，九品中正制更突出的问题是？",
    "options": ["门阀士族垄断仕途", "完全依据军功授爵", "由商人决定官员", "只选拔外国使者"],
    "answer": "门阀士族垄断仕途",
    "explanation": "九品中正制后期容易被门阀士族把持，科举制则试图通过考试打破这种垄断。",
    "topic": "制度史",
    "dynasty": "魏晋南北朝"
  }
]
```

- [ ] **Step 2: Run data validation**

Run:

```powershell
node scripts/validate-data.js
```

Expected: `0 ERROR`, and no `questions.json file not found` WARN.

---

### Task 4: Wire quiz into index and app

**Files:**
- Modify: `index.html`
- Modify: `src/js/app.js`
- Test: `tests/quiz.test.js`
- Test: `tests/app-static-data.test.js`

- [ ] **Step 1: Update science-prep shell in `index.html`**

In `index.html`, replace this science-prep fake entry:

```html
<button class="scard" onclick="showToast('挖空练习功能开发中')"><span class="ic">✏️</span><h4>挖空练习</h4><p>历年真题挖空训练</p></button>
```

with:

```html
<button class="scard" onclick="startQuiz()"><span class="ic">📝</span><h4>真题演练</h4><p>基础选择题训练</p></button>
```

Then insert this line immediately after the closing `</div>` for `<div class="sg">...</div>` in `#science-page`:

```html
<div id="quiz-panel"></div>
```

- [ ] **Step 2: Load `quiz.js` before `app.js`**

In `index.html`, add this script tag between `ai-assistant.js` and `app.js`:

```html
<script src="./src/js/quiz.js"></script>
```

The script block should include:

```html
<script src="./src/js/ai-assistant.js"></script>
<script src="./src/js/quiz.js"></script>
<script src="./src/js/app.js"></script>
```

- [ ] **Step 3: Expose quiz globals in `src/js/app.js`**

Inside `exposeGlobals()`, after the `aiAssistantAPI` block, add:

```js
    if (window.quizAPI) {
      window.startQuiz = window.quizAPI.startQuiz;
      window.selectQuizAnswer = window.quizAPI.selectQuizAnswer;
      window.nextQuizQuestion = window.quizAPI.nextQuizQuestion;
    }
```

- [ ] **Step 4: Load questions data in `src/js/app.js`**

Inside `initializeData()`, after the podcast loading block:

```js
    var podcasts = await loadJSON('./src/data/podcasts.json', []);
    if (window.podcastAPI) window.podcastAPI.setPodcasts(podcasts);
```

add:

```js
    var questions = await loadJSON('./src/data/questions.json', []);
    if (window.quizAPI) window.quizAPI.setQuestions(questions);
```

- [ ] **Step 5: Run related tests**

Run:

```powershell
npx vitest run tests/quiz.test.js tests/app-static-data.test.js --environment jsdom
```

Expected: PASS.

---

### Task 5: Update changelog and validate

**Files:**
- Modify: `CHANGELOG.md`
- Test: `tests/quiz.test.js`

- [ ] **Step 1: Run focused quiz tests**

Run:

```powershell
npx vitest run tests/quiz.test.js --environment jsdom
```

Expected: PASS.

- [ ] **Step 2: Update `CHANGELOG.md`**

Insert this section under `## 2026-06-11`, above the Task 2.2 entry:

```md
### Phase 2 Task 2.3：基础选择题

- 新增 `src/data/questions.json`，提供 `12` 道结构化选择题种子数据。
- 新增 `src/js/quiz.js`，支持开始练习、单选答题、正确/错误反馈、解析展示、下一题和完成页正确率统计。
- 科学备考页新增真实“真题演练”入口和 `#quiz-panel` 渲染容器，并加载 `quiz.js`。
- `app.js` 新增加载 `questions.json` 并注入 `quizAPI`，同时暴露内联事件需要的 quiz 全局函数。
- 新增 `tests/quiz.test.js`，覆盖渲染、答题反馈、题目切换、完成统计、空题库和 XSS 转义。

#### 验证

- `npx vitest run tests/quiz.test.js --environment jsdom`：通过。
- `npx vitest run tests/quiz.test.js tests/app-static-data.test.js --environment jsdom`：通过。
- `node scripts/validate-data.js`：`questions.json` 校验通过。
```

- [ ] **Step 3: Run focused and related tests again**

Run:

```powershell
npx vitest run tests/quiz.test.js tests/app-static-data.test.js --environment jsdom
```

Expected: PASS.

---

### Task 6: Final validation and optional commit

**Files:**
- Create: `src/data/questions.json`
- Create: `src/js/quiz.js`
- Create: `tests/quiz.test.js`
- Modify: `index.html`
- Modify: `src/js/app.js`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Run data validation**

Run:

```powershell
node scripts/validate-data.js
```

Expected: `0 ERROR`; `questions.json` should parse and should not produce the prior missing-file WARN.

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
git diff --stat -- src/data/questions.json src/js/quiz.js tests/quiz.test.js index.html src/js/app.js CHANGELOG.md docs/superpowers/specs/2026-06-11-basic-quiz-design.md docs/superpowers/plans/2026-06-11-basic-quiz-implementation-plan.md
```

Expected: Task 2.3 files appear. Pre-existing unrelated files may remain in the working tree and should not be staged for this task unless the user explicitly asks for a broader commit.

- [ ] **Step 4: Stage only Task 2.3 files if the user authorizes a commit**

Run only after explicit commit approval:

```powershell
git add -- src/data/questions.json src/js/quiz.js tests/quiz.test.js index.html src/js/app.js CHANGELOG.md docs/superpowers/specs/2026-06-11-basic-quiz-design.md docs/superpowers/plans/2026-06-11-basic-quiz-implementation-plan.md
```

Expected: no command output.

- [ ] **Step 5: Commit Task 2.3 if the user authorizes a commit**

Run only after explicit commit approval:

```powershell
git commit -m "feat: add basic multiple-choice quiz"
```

Expected: a commit is created with only Task 2.3 files.

- [ ] **Step 6: Report completion**

Report these facts:

```text
Task 2.3 complete.
questions.json contains 12 valid seed questions.
quiz.js supports basic multiple-choice practice, answer feedback, explanations, next question, and score completion.
Science prep has a real quiz entry and app.js loads questions through the data loader flow.
Focused quiz tests, data validation, and full Vitest suite pass.
```
