# 错题集设计

## 1. 背景

Phase 2 Task 2.3 已建立基础选择题能力：`src/js/quiz.js` 支持题目注入、单选答题、正确/错误反馈、解析、下一题和完成页统计。当前答错只在当前题目反馈中显示，不会持久化，也没有错题列表、再做一次或标记掌握能力。

Task 2.4 需要在现有 quiz 模块上补齐错题集，为后续复习专区和学习统计提供数据基础。

## 2. 目标

本任务实现以下能力：

1. 用户答错选择题后，将错题写入 `xds_wrong_questions`。
2. 同一道题多次答错时，`wrongCount` 累加。
3. 错题记录保存最近一次答错时间和最近一次用户答案。
4. 科学备考页提供真实“错题集”入口。
5. 错题列表显示未掌握错题。
6. 用户可从错题列表点击“再做一次”跳回对应题目。
7. 用户可将错题标记为“已掌握”。
8. 缺少 `storageAPI` 时安全降级，不抛异常。

## 3. 非目标

本任务不实现以下内容：

- 不实现完整复习专区。
- 不实现学习统计事件。
- 不实现错题按时间/朝代/主题筛选。
- 不实现错题导出或同步。
- 不移除已掌握记录，只在默认列表中隐藏已掌握项。
- 不新增独立 `wrong-question.js` 模块。

## 4. 存储设计

使用 LocalStorage key：`xds_wrong_questions`。

通过 adapter 访问：

```js
window.storageAPI.getStoredJSON('xds_wrong_questions', {})
window.storageAPI.setStoredJSON('xds_wrong_questions', wrongMap)
```

数据结构为对象映射，key 是 `questionId`：

```json
{
  "q001": {
    "questionId": "q001",
    "wrongCount": 2,
    "lastWrongAt": "2026-06-11T12:00:00.000Z",
    "lastUserAnswer": "分封制",
    "mastered": false
  }
}
```

字段说明：

- `questionId`：题目 ID。
- `wrongCount`：该题累计答错次数。
- `lastWrongAt`：最近一次答错时间，ISO 字符串。
- `lastUserAnswer`：最近一次用户选择的错误答案。
- `mastered`：是否已掌握。答错时会重置为 `false`。

选择对象映射是为了便于对同一题去重和累加。

## 5. 模块设计

继续扩展 `src/js/quiz.js`，不新增模块。

新增内部常量：

```js
var WRONG_KEY = 'xds_wrong_questions';
```

新增内部/对外函数：

- `getWrongQuestions()`：读取错题映射，异常或缺失 adapter 时返回 `{}`。
- `setWrongQuestions(map)`：写入错题映射，缺失 adapter 时返回 `false`。
- `recordWrongQuestion(question, userAnswer)`：答错时创建或更新错题记录。
- `renderWrongQuestions()`：渲染错题列表到 `#wrong-question-panel`。
- `retryWrongQuestion(questionId)`：跳转到对应题目重新练习。
- `markWrongQuestionMastered(questionId)`：将错题标记为已掌握。

`selectQuizAnswer(answer)` 中新增逻辑：

- 如果 `answer !== question.answer`，调用 `recordWrongQuestion(question, answer)`。
- 如果答对，不写入错题。

`window.quizAPI` 新增：

```js
getWrongQuestions: getWrongQuestions,
renderWrongQuestions: renderWrongQuestions,
retryWrongQuestion: retryWrongQuestion,
markWrongQuestionMastered: markWrongQuestionMastered
```

`app.js` 暴露内联调用：

- `window.renderWrongQuestions`
- `window.retryWrongQuestion`
- `window.markWrongQuestionMastered`

## 6. UI 设计

修改 `index.html` 科学备考页：

1. 将一个剩余“开发中”伪入口替换为真实“错题集”入口：

```html
<button class="scard" onclick="renderWrongQuestions()"><span class="ic">📌</span><h4>错题集</h4><p>回顾未掌握题目</p></button>
```

2. 在 `#quiz-panel` 后增加：

```html
<div id="wrong-question-panel"></div>
```

错题列表渲染内容：

- 空态：`暂无错题`。
- 每条错题显示：题干、朝代/主题、最近错误答案、错误次数。
- 操作按钮：
  - `再做一次`
  - `标记已掌握`

默认列表只展示 `mastered !== true` 的错题。已掌握记录仍保存在存储中，供未来统计或复习功能使用。

## 7. 再做一次行为

`retryWrongQuestion(questionId)` 行为：

1. 在当前 `questions` 中查找对应题目。
2. 找不到则 toast：`题目不存在`。
3. 找到则设置 `currentIndex` 为该题索引。
4. 删除该题在本轮 `selectedAnswers` 和 `correctAnswers` 中的状态。
5. 将 `completed` 设为 `false`。
6. 调用 `renderQuiz()`。

这样可以复用当前 quiz 面板，不新增单独答题页面。

## 8. 错误处理与安全

- `storageAPI` 缺失时：读取 `{}`，写入 `false`，不抛错。
- `xds_wrong_questions` 不是对象时：按 `{}` 处理。
- `questions` 中找不到错题 ID 时：显示 toast，不抛错。
- 错题列表中所有题干、答案、主题、朝代进入 `innerHTML` 前必须转义。
- `navigationAPI.showToast` 缺失时静默跳过 toast。

## 9. 测试设计

新增 `tests/wrong-question.test.js`。

覆盖：

1. 答错后写入 `xds_wrong_questions`。
2. 同一题多次答错时 `wrongCount` 累加，并更新 `lastWrongAt` / `lastUserAnswer`。
3. 答对不写错题。
4. `renderWrongQuestions()` 显示未掌握错题列表。
5. `retryWrongQuestion(questionId)` 跳转到对应题目并清除该题已选状态。
6. `markWrongQuestionMastered(questionId)` 将 `mastered` 设为 `true`，并从默认列表隐藏。
7. storage adapter 缺失时错题 API 不抛错。
8. 错题列表渲染时转义脚本样文本。

相关回归：

```powershell
npx vitest run tests/quiz.test.js tests/wrong-question.test.js --environment jsdom
npx vitest run tests/app-static-data.test.js tests/wrong-question.test.js --environment jsdom
```

## 10. 验收标准

Task 2.4 完成时应满足：

1. 答错题目会通过 `storageAPI` 写入 `xds_wrong_questions`。
2. 同题多次答错会累加 `wrongCount`。
3. 科学备考页有真实“错题集”入口。
4. 错题列表能展示未掌握错题。
5. “再做一次”能跳转到对应题目。
6. “标记已掌握”能更新状态并隐藏该错题。
7. 新增错题测试与既有 quiz 测试通过。
8. `CHANGELOG.md` 记录本任务实现和验证结果。
