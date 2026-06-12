# 基础选择题设计

## 1. 背景

Phase 2 的学习闭环需要在“学习名词”之后进入“做题”和“查看解析”。当前项目已经完成名词数据渲染、收藏与标记已学，但科学备考页仍是伪入口，点击后只显示“开发中”。仓库中还没有 `questions.json`、`quiz.js` 或选择题测试。

Task 2.3 的目标是建立第一版基础选择题能力，为后续 Task 2.4 错题集、Task 2.5 学习统计打基础。

## 2. 目标

本任务实现以下能力：

1. 新增 10–15 道结构化选择题种子数据。
2. 科学备考页提供真实“真题演练”入口。
3. 用户可以开始答题、选择单个答案、看到正确/错误反馈。
4. 答题后显示题目解析。
5. 用户可以切换下一题。
6. 答完最后一题后显示正确率。
7. 题目数据进入 `innerHTML` 前必须转义。
8. 题目数据校验脚本不再因 `questions.json` 缺失产生 WARN。

## 3. 非目标

本任务不实现以下内容：

- 不记录错题到 `xds_wrong_questions`。
- 不提供错题本、再做一次、标记掌握。
- 不记录学习统计事件。
- 不实现随机组卷、题目筛选、倒计时或联机 PK。
- 不扩展到 50+ 题库。

## 4. 数据设计

新增 `src/data/questions.json`，结构为数组。

每题字段：

```json
{
  "id": "q001",
  "question": "秦统一后在全国推行的地方行政制度是？",
  "options": ["分封制", "郡县制", "井田制", "科举制"],
  "answer": "郡县制",
  "explanation": "郡县制由中央任免地方长官，削弱地方割据，是中央集权制度形成的重要标志。",
  "topic": "制度史",
  "dynasty": "秦朝"
}
```

约束：

- `id` 唯一。
- `options` 为非空数组。
- `answer` 必须属于 `options`。
- 第一轮数量控制在 10–15 道。

现有 `scripts/validate-data.js` 已具备 `questions.json` 的基础校验：数组、id、options、answer 属于 options。本任务应让该校验通过。

## 5. 模块设计

新增 `src/js/quiz.js`，采用现有 ES5 IIFE 模式：

```js
(function () {
  var questions = [];
  var currentIndex = 0;
  var selectedAnswers = {};
  var correctCount = 0;

  window.quizAPI = { ... };
})();
```

对外 API：

- `setQuestions(list)`：注入题目数据，重置状态并渲染第一题。
- `startQuiz()`：打开/显示 quiz 面板，重置状态并渲染。
- `renderQuiz()`：渲染当前题目或完成页。
- `selectQuizAnswer(answer)`：选择答案，记录正确/错误，显示解析。
- `nextQuizQuestion()`：进入下一题；最后一题后进入完成态。
- `getQuizState()`：供测试读取当前索引、正确数、完成状态。
- `resetQuiz()`：重置当前答题状态。

保留全局暴露给内联 HTML 调用：

- `window.startQuiz`
- `window.selectQuizAnswer`
- `window.nextQuizQuestion`

`app.js` 负责在数据初始化阶段加载 `./src/data/questions.json`，并调用 `window.quizAPI.setQuestions(questions)`。

## 6. UI 设计

修改 `index.html` 科学备考页：

- 将一个“开发中”伪入口替换为真实入口：

```html
<button class="scard" onclick="startQuiz()"><span class="ic">📝</span><h4>真题演练</h4><p>基础选择题训练</p></button>
```

- 增加 quiz 容器：

```html
<div id="quiz-panel"></div>
```

`quiz.js` 渲染内容：

1. 当前题序号，例如 `第 1 / 12 题`。
2. `topic · dynasty` 元信息。
3. 题干。
4. 单选按钮列表。
5. 选中后显示：
   - 正确：`✅ 回答正确！`
   - 错误：`❌ 回答错误，正确答案：xxx`
6. 解析文本。
7. 下一题按钮；最后一题为“查看成绩”。
8. 完成页显示正确数、总题数、正确率，并提供“重新练习”。

样式优先使用内联简洁样式或现有 class，不新增大规模 CSS。

## 7. 安全与降级

- 所有题目字段、选项和解析进入 `innerHTML` 前使用 `window.htmlUtils.escapeHtml`，缺失时使用模块内 fallback。
- `questions.json` 缺失或为空时，quiz 容器显示空态：`暂无题目`。
- 用户未选择答案前点击下一题时，不推进题目，显示 toast：`请先选择一个答案`。
- `navigationAPI.showToast` 缺失时，静默跳过 toast。

## 8. 测试设计

新增 `tests/quiz.test.js`。

覆盖：

1. `setQuestions()` 后渲染第一题。
2. 选择正确答案后显示正确反馈和解析，正确数加一。
3. 选择错误答案后显示错误反馈、正确答案和解析。
4. `nextQuizQuestion()` 切换下一题。
5. 全部完成后显示正确率。
6. 空题库显示 `暂无题目`。
7. 题干/选项/解析中的脚本样文本不会注入 DOM。

相关回归：

```powershell
npx vitest run tests/quiz.test.js --environment jsdom
npx vitest run tests/app-static-data.test.js tests/quiz.test.js --environment jsdom
node scripts/validate-data.js
```

## 9. 验收标准

Task 2.3 完成时应满足：

1. `src/data/questions.json` 存在且包含 10–15 道有效题目。
2. `src/js/quiz.js` 暴露 `window.quizAPI` 并支持完整基础答题流程。
3. 科学备考页有真实“真题演练”入口，不再只弹开发中。
4. `app.js` 加载 `questions.json` 并注入 quiz 模块。
5. `tests/quiz.test.js` 通过。
6. `node scripts/validate-data.js` 对 `questions.json` 无 WARN/ERROR。
7. `CHANGELOG.md` 记录本任务实现和验证结果。
