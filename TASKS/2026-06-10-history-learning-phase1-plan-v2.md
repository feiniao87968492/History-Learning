# 学的是史 — Web 原型补完与模块化整理 实施计划 v2

> **For agentic workers:** 本计划为 Coding Agent 长期执行清单。每个 Task 为独立可验收的最小工作单元。
> 推荐使用 `superpowers:subagent-driven-development` 逐任务执行。步骤使用 `- [ ]` checkbox 跟踪。

**目标：** 补完 Web 原型所有占位功能，清理内联脚本，建立平台适配层，为后续微信小程序迁移做好准备。

**架构：** 原生 HTML/CSS/JS + JSON 静态数据 + LocalStorage + Adapter 适配层。不引入框架，不迁移技术栈。

**技术栈：** HTML5 / CSS3 / ES5 JavaScript / JSON / LocalStorage / Vitest + jsdom

---

## Agent 强制执行规则

1. **当前阶段是 Web 原型补完与模块化整理，不是微信小程序正式迁移。** 不得将页面重写为 WXML/WXSS 或小程序组件。
2. **不得直接复制计划中的示例代码。** 示例仅表达目标，正式实现前必须检查仓库真实结构：函数名、DOM 结构、文件是否存在。
3. **每个 Task 开始前，必须先检查涉及的文件、函数名、DOM 结构和已有实现是否真实存在。**
4. **所有用户输入和外部 JSON 数据在进入 innerHTML 前必须进行 HTML 转义。** 能使用 `textContent` 时优先使用 `textContent`。
5. **每完成一个 Task，必须同时完成：**
   - 数据校验
   - 对应单元测试
   - 浏览器手动验收
   - CHANGELOG.md 更新
   - 单独 Git commit
6. **不得在页面交互尚未验证时批量生成大量历史内容。** 第一轮种子数据严格按计划中的数量执行。
7. **所有平台相关能力必须经过 adapter 封装：** `storageAPI`、`navigationAPI`、`audioAPI`、`externalLinkAPI`、`dataLoaderAPI`。
8. **新功能不得继续写入 index.html 内联脚本。** 必须创建独立 JS 模块文件。
9. **若计划示例与仓库真实结构冲突，以仓库现状为准，并在执行报告中说明。**
10. **每个 Task 完成后必须输出：** 修改文件、新增能力、自动化测试结果、手动验证步骤、遗留问题、commit hash。

---

## 总体阶段划分

```text
Phase 0：仓库审计与安全护栏         ← 第一轮立即执行
Phase 1：平台适配层与模块边界         ← 第一轮立即执行
Phase 2：核心学习闭环                 ← 第二轮
Phase 3：内容型扩展模块               ← 第三轮
Phase 4：复杂交互 Demo                ← 第四轮
Phase 5：内容扩充与质量检查           ← 第五轮
Phase 6：微信小程序迁移               ← 单独阶段，当前不执行
```

---

## Phase 0：仓库审计与安全护栏

**目标：** 建立仓库基线文档，补齐安全工具函数，确保后续所有工作有据可依。

**前置依赖：** 无

**Definition of Done：** `docs/current-state.md` 存在且准确；`src/js/utils/html.js` 通过测试；`scripts/validate-data.js` 可运行；`CHANGELOG.md` 已建立。

---

### Task 0.1：仓库现状扫描与基线文档

**文件：**
- 新建: `docs/current-state.md`

**实现要求：**
- 列出所有页面、模块、JSON 文件和内联脚本位置
- 记录已有 `window.xxxAPI` 接口
- 列出所有 LocalStorage key

**验收步骤：**
- `docs/current-state.md` 可被新开发者读懂
- 提交: `git add docs/current-state.md && git commit -m "docs: add current state baseline"`

---

### Task 0.2：占位文案与 innerHTML 审计

**实现要求：**
- 搜索全项目中的 `showToast` 调用，列出所有包含 "开发中""加载中""即将上线""功能" 的调用点
- 搜索所有 `innerHTML` 使用点，标注哪些使用了用户/外部数据、哪些是内部常量

**验收步骤：**
- 输出审计清单，记录在 `docs/current-state.md` 的审计结果章节
- 提交: `git add docs/current-state.md && git commit -m "docs: record audit of placeholders and innerHTML usage"`

---

### Task 0.3：建立 HTML 转义工具

**文件：**
- 新建: `src/js/utils/html.js`
- 新建: `tests/utils/html.test.js`

**实现要求：**

```js
// src/js/utils/html.js
(function () {
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  window.htmlUtils = { escapeHtml: escapeHtml };
})();
```

**测试要求：**
- 输入 `<script>alert(1)</script>` → 输出 `&lt;script&gt;alert(1)&lt;/script&gt;`
- 输入普通中文 → 原样输出
- 输入 `"quoted"` → 输出 `&quot;quoted&quot;`
- 输入空字符串和 `null` → 不抛异常

**验收步骤：**
- `npx vitest run tests/utils/html.test.js --environment jsdom` 全部通过
- 提交: `git add src/js/utils/html.js tests/utils/html.test.js && git commit -m "feat: add HTML escape utility"`

---

### Task 0.4：建立数据校验脚本

**文件：**
- 新建: `scripts/validate-data.js`

**实现要求：**
- 校验 `src/data/` 下所有 JSON 文件是否能解析
- 校验 nouns.json：必填字段（text, dynasty, category）是否缺失；related 中的名词是否真实存在
- 校验 timeline.json：x/pol/eco/cul 是否为有效数字且处于合理范围
- 校验 people.json（如存在）：人物 ID 是否重复；relations 的 source/target 是否指向存在的人物
- 校验 questions.json（如存在）：答案是否属于已有选项；题目 ID 是否重复
- 校验 films.json/podcasts.json/hot-articles.json：关键字段是否为空

**验收步骤：**
- `node scripts/validate-data.js` 运行成功，输出校验报告
- 提交: `git add scripts/validate-data.js && git commit -m "feat: add data validation script"`

---

### Task 0.5：运行现有测试并建立基线

**实现要求：**
- 运行 `npx vitest run --environment jsdom`，记录当前测试结果
- 运行 `node scripts/validate-data.js`
- 建立 `CHANGELOG.md`

**验收步骤：**
- CHANGELOG.md 记录基线测试结果
- 提交: `git add CHANGELOG.md && git commit -m "docs: establish test baseline and changelog"`

---

## Phase 1：平台适配层与模块边界

**目标：** 建立 adapter 层，所有平台能力通过 adapter 访问。业务模块不再直接调用 `localStorage`、`window.open`、`new Audio`、`fetch`。

**前置依赖：** Phase 0 完成

**Definition of Done：** 5 个 adapter 模块全部可用且通过测试；现有模块在不改变行为的前提下完成对接。

---

### Task 1.1：创建 storage adapter

**文件：**
- 新建: `src/js/adapters/storage.js`
- 新建: `tests/adapters/storage.test.js`

**实现要求：**
- 封装 `localStorage` 的 get/set/remove
- 提供 JSON 和字符串两种模式
- 错误时返回 fallback，不抛异常
- 接口与现有的 `window.storageAPI` 保持一致

**测试要求：**
- JSON 读写正常
- 读取不存在的 key 返回 fallback
- 写入非法 JSON 时 catch 错误并返回 false
- 存储空间满时 catch 错误

**验收步骤：**
- `npx vitest run tests/adapters/storage.test.js --environment jsdom` 全部通过
- 提交: `git add src/js/adapters/storage.js tests/adapters/storage.test.js && git commit -m "feat: add storage adapter with tests"`

---

### Task 1.2：创建 navigation adapter

**文件：**
- 新建: `src/js/adapters/navigation.js`
- 新建: `tests/adapters/navigation.test.js`

**实现要求：**
- 封装页面切换逻辑（当前使用 DOM class toggle）
- 提供 toast 显示
- 后代模块通过 adapter 而非直接操作 DOM

**测试要求：**
- toast 文本正确设置
- toast 在指定时间后隐藏
- 页面切换前后 DOM 状态验证

**验收步骤：**
- 测试全部通过
- 提交: `git add src/js/adapters/navigation.js tests/adapters/navigation.test.js && git commit -m "feat: add navigation adapter with tests"`

---

### Task 1.3：创建 audio adapter

**文件：**
- 新建: `src/js/adapters/audio.js`
- 新建: `tests/adapters/audio.test.js`

**实现要求：**
- 封装 HTML5 Audio API
- 提供 play / pause / seek / setSource / onTimeUpdate / onEnded / onError 接口
- 未来迁移微信小程序时替换为 `wx.createInnerAudioContext()`

**测试要求：**
- Mock Audio 对象，验证 play/pause/seek 调用
- 验证错误回调触发

**验收步骤：**
- 测试全部通过
- 提交: `git add src/js/adapters/audio.js tests/adapters/audio.test.js && git commit -m "feat: add audio adapter with tests"`

---

### Task 1.4：创建 externalLink adapter

**文件：**
- 新建: `src/js/adapters/external-link.js`
- 新建: `tests/adapters/external-link.test.js`

**实现要求：**
- 封装 `window.open`，Web 版在新标签页打开
- 未来微信小程序替换为复制链接或 web-view
- 提供 `open(url)` 接口

**验收步骤：**
- 测试全部通过
- 提交: `git add src/js/adapters/external-link.js tests/adapters/external-link.test.js && git commit -m "feat: add external link adapter with tests"`

---

### Task 1.5：创建 dataLoader adapter

**文件：**
- 新建: `src/js/adapters/data-loader.js`
- 新建: `tests/adapters/data-loader.test.js`

**实现要求：**
- 封装 `fetch` 调用，加载 JSON 数据
- 失败时返回 fallback 数据
- 输出控制台日志但不抛异常
- 未来微信小程序替换为 `wx.request` 或云开发数据查询

**测试要求：**
- Mock fetch，验证成功和失败两种路径
- 验证 JSON 解析失败时不崩溃
- 验证网络错误时返回 fallback

**验收步骤：**
- 测试全部通过
- 提交: `git add src/js/adapters/data-loader.js tests/adapters/data-loader.test.js && git commit -m "feat: add data loader adapter with tests"`

---

### Task 1.6：现有模块对接 adapter（非破坏性）

**文件：**
- 修改: `src/js/storage.js`（如果有直接 localStorage 调用则替换）
- 修改: `src/js/navigation.js`
- 修改: `src/js/podcast.js`（audio 调用改为 adapter）
- 修改: `src/js/app.js`（fetch 调用改为 dataLoader）

**实现要求：**
- 不改变现有业务行为
- 逐步将直接调用替换为 adapter
- 如有模块已使用 `window.storageAPI` 则保持不变，确认其接口一致即可

**验收步骤：**
- 浏览器全流程验收：登录→首页→名词→打卡→播客
- 所有现有功能不变
- 提交: `git add ... && git commit -m "refactor: wire existing modules to adapters"`

---

## Phase 2：核心学习闭环

**目标：** 打通从"搜索名词 → 学习详情 → 收藏/标记已学 → 做题 → 错题 → 复习 → 打卡 → 统计"的完整学习闭环。

**前置依赖：** Phase 1 完成

**Definition of Done：** 端到端验收路径完整通过。

**核心端到端验收路径：**
```text
用户进入首页
→ 搜索"郡县制"
→ 打开详情
→ 收藏并标记已学
→ 完成一道秦朝选择题
→ 故意答错
→ 错题进入错题集
→ 完成今日打卡
→ 在个人页看到学习记录变化
→ 在复习专区看到已学名词
```

---

### Task 2.1：名词解释种子数据

**文件：**
- 修改: `src/data/nouns.json`
- 修改: `src/js/noun.js`
- 新建: `tests/noun.test.js`

**实现要求：**
- 第一轮种子数据：8—12 条（覆盖主要朝代和分类即可，不求数量）
- 每条包含：text（100-500字正文）、related（2-3个相关名词）、dynasty、category、map（可选）、year（可选）
- 所有数据字段通过 `escapeHtml` 处理后渲染
- 删除 `index.html` 中 `#noun-grid` 内的硬编码卡片
- 新增 `renderNounCards()` 从 JSON 渲染卡片到 `#noun-grid`
- 搜索支持按名称、描述文本、朝代标签匹配

**测试要求：**
- 卡片渲染：给定 mock 数据，验证卡片数量和内容
- 搜索筛选：输入"唐朝"只显示 dynasty 包含"唐朝"的卡片
- 空搜索：显示全部卡片
- 无匹配：显示"暂无匹配名词"
- XSS 防护：名词标题含 `<script>` 标签时不执行脚本

**验收步骤：**
- `npx vitest run tests/noun.test.js --environment jsdom` 全部通过
- 浏览器：名词页显示 8-12 张卡片，搜索正常，详情显示朝代/分类
- 提交: `git add src/data/nouns.json src/js/noun.js tests/noun.test.js index.html && git commit -m "feat: noun module with seed data and data-driven rendering"`

---

### Task 2.2：名词收藏与标记已学

**文件：**
- 修改: `src/js/noun.js`
- 新建: `tests/noun-actions.test.js`

**实现要求：**
- 收藏：点击收藏按钮切换状态，数据持久化到 LocalStorage（通过 storageAPI）
- 标记已学：在详情页增加"标记已学"按钮，记录学习时间
- 使用 `xds_favorites` 和 `xds_learned` 两个 LocalStorage key
- 渲染时读取持久化状态恢复 UI

**测试要求：**
- 收藏切换测试
- 收藏持久化测试（mock storageAPI）
- 已学标记持久化测试
- 渲染恢复测试

**验收步骤：**
- 测试全部通过
- 浏览器：收藏名词→刷新页面→收藏状态保持
- 提交: `git add src/js/noun.js tests/noun-actions.test.js && git commit -m "feat: noun favorite and learned status with persistence"`

---

### Task 2.3：基础选择题

**文件：**
- 新建: `src/data/questions.json`
- 新建: `src/js/quiz.js`
- 新建: `tests/quiz.test.js`

**实现要求：**
- 第一轮种子数据：10—15 道选择题
- 每题包含：id、topic、dynasty、question、options（含 key 和 text）、answer、explanation
- 选项按钮使用 `data-key` 属性，判定时使用 `btn.dataset.key`
- 答错后：错误选项标红，正确选项标绿，所有按钮禁用
- 不使用 `btn.textContent.indexOf(key)` 判定选项

**测试要求：**
- 正确选项判定
- 错误选项判定
- 得分统计
- 空题库边界处理
- 选项按钮 `data-key` 属性正确设置

**验收步骤：**
- 测试全部通过
- 浏览器：科学备考→真题演练→答题→看解析→完成
- 提交: `git add src/data/questions.json src/js/quiz.js tests/quiz.test.js && git commit -m "feat: basic multiple-choice quiz with test coverage"`

---

### Task 2.4：错题集

**文件：**
- 修改: `src/js/quiz.js`（增加错题记录逻辑）
- 新建: `tests/wrong-question.test.js`

**实现要求：**
- 使用 `xds_wrong_questions` LocalStorage key
- 每条错题记录：
```json
{
  "questionId": "q001",
  "wrongCount": 2,
  "lastWrongAt": "2026-06-10T12:00:00.000Z",
  "lastUserAnswer": "A",
  "mastered": false
}
```
- 答题结束后将错题写入错题集（去重累加）
- 错题列表显示所有错题
- 支持"再做一次"跳转到对应题目
- 支持"标记已掌握"

**测试要求：**
- 答错后错题记录写入
- 同一题多次答错，wrongCount 累加
- 标记已掌握后状态更新
- 再做一次功能

**验收步骤：**
- 测试全部通过
- 浏览器：答题→故意答错→进入错题集→看到错题→再做一次→标记已掌握
- 提交: `git add src/js/quiz.js tests/wrong-question.test.js && git commit -m "feat: wrong question collection with review capability"`

---

### Task 2.5：学习记录

**文件：**
- 修改: `src/js/noun.js`
- 修改: `src/js/quiz.js`
- 新建: `src/js/learning-stats.js`
- 新建: `tests/learning-stats.test.js`

**实现要求：**
- 使用 `xds_learning_events` LocalStorage key
- 记录：学名词、做对题、做错题、打卡 等事件
- 每个事件含：type、timestamp、sourceId（可选）
- 个人页显示：学习天数、学习分钟、完成练习数
- 数据从 learning-stats 模块聚合计算

**测试要求：**
- 事件记录
- 统计数据聚合
- 连续天数计算

**验收步骤：**
- 测试全部通过
- 浏览器：学名词→做对一道题→做题错一道题→打卡→个人页统计数字更新
- 提交: `git add src/js/learning-stats.js tests/learning-stats.test.js && git commit -m "feat: learning stats tracking and display"`

---

### Task 2.6：打卡签到（增强）

**文件：**
- 修改: `src/js/checkin.js`
- 新建: `tests/checkin.test.js`

**实现要求：**
- 打卡数据持久化到 `xds_checkins`
- 使用 `storageAPI`（通过 adapter 间接访问）
- 打卡后统计数字联动更新
- 连续 3/7 天不同提示
- 今日已打卡时按钮置灰

**测试要求：**
- 打卡记录读写
- 连续天数计算
- 边界：同一天重复打卡
- 打卡按钮状态

**验收步骤：**
- 测试全部通过
- 浏览器：打卡→统计更新→连续打卡提示→刷新后状态保持
- 提交: `git add src/js/checkin.js tests/checkin.test.js && git commit -m "feat: enhanced checkin with streak tracking and stats sync"`

---

### Task 2.7：复习专区

**文件：**
- 修改: `index.html`（复习专区区域）
- 新建: `src/js/review.js`
- 新建: `tests/review.test.js`

**实现要求：**
- 展示已学名词列表（按学习时间倒序）
- 展示待复习错题
- 支持按时间范围筛选（1天/7天/30天）
- 点击条目跳转到详情或重新做题

**测试要求：**
- 已学名词列表渲染
- 错题列表渲染
- 时间筛选
- 空数据处理

**验收步骤：**
- 测试全部通过
- 浏览器：学名词→做错题→进入复习专区→看到已学和错题→点击跳转
- 提交: `git add src/js/review.js tests/review.test.js && git commit -m "feat: review zone with learned terms and wrong questions"`

---

## Phase 3：内容型扩展模块

**目标：** 完成首页热点、影视书目、播客、讨论区等非核心学习闭环的内容展示模块。

**前置依赖：** Phase 2 完成

**Definition of Done：** 各模块页面可用，数据驱动渲染，有对应测试，通过浏览器验证。

---

### Task 3.1：首页热点文章

**文件：**
- 修改: `src/data/hot-articles.json`
- 修改: `src/js/app.js`
- 修改: `index.html`
- 新建: `tests/hot-articles.test.js`

**实现要求：**
- 第一轮种子数据：5—8 条
- 删除 `index.html` 中硬编码的 `.hl`/`.hi` 元素
- 文章标题和元信息使用 `textContent` 或转义后的 `innerHTML`
- 点击通过 `externalLinkAPI` 打开

**测试要求：**
- 渲染测试
- 朝代筛选测试（全部/秦汉/隋唐/宋元/明清/近代）
- 空数据边界

**验收步骤：**
- 测试全部通过
- 浏览器：首页热点文章从 JSON 渲染→朝代筛选正常→点击打开外链
- 提交: `git add ... && git commit -m "feat: data-driven hot articles with external link adapter"`

---

### Task 3.2：影视书目

**文件：**
- 修改: `src/data/films.json`
- 修改: `src/js/film.js`
- 新建: `tests/film.test.js`

**实现要求：**
- 第一轮种子数据：每类 5—8 条（book/film/doc）
- 榜单按评分降序排列
- 筛选（全部/书籍/影视/纪录片）正常
- 待看栏通过 storageAPI 持久化

**测试要求：**
- 筛选逻辑
- 排序逻辑
- 待看栏增删

**验收步骤：**
- 测试全部通过
- 浏览器：影视书目→切换类型→榜单排序→管理待看栏
- 提交: `git add ... && git commit -m "feat: film/book list with ranking and watchlist"`

---

### Task 3.3：播客

**文件：**
- 修改: `src/data/podcasts.json`
- 修改: `src/js/podcast.js`
- 新建: `tests/podcast.test.js`

**实现要求：**
- 第一轮种子数据：2—4 条
- 使用 `audioAPI` adapter 播放音频，不直接 `new Audio()`
- 播放/暂停、进度条、倍速、定时关闭功能完整
- 加载失败时显示 toast 提示

**测试要求：**
- Mock audioAPI，验证播放/暂停/seek 调用
- 定时关闭逻辑
- 错误处理

**验收步骤：**
- 测试全部通过
- 浏览器：播放播客→暂停→拖动进度→定时关闭
- 提交: `git add ... && git commit -m "feat: podcast player via audio adapter"`

---

### Task 3.4：讨论区

**文件：**
- 新建: `src/js/discuss.js`
- 修改: `index.html`
- 新建: `tests/discuss.test.js`

**实现要求：**
- 第一轮种子数据：2—3 条帖子
- 每个帖子卡片使用 `data-post-id` 属性
- `toggleComments(postId)` 根据 `postId` 精确定位帖子
- 维护 `expandedPostIds` 集合追踪展开状态
- 重新渲染后恢复展开状态
- 用户输入标题、正文、评论通过 `htmlUtils.escapeHtml` 转义后拼接
- 数据通过 storageAPI 持久化

**修正原计划问题：**

原 `toggleComments` 的问题：
```js
// ❌ 原实现：不管 postId，默认操作第一条帖子
function toggleComments(postId) {
  var list = document.querySelector('#discuss-page .cmt-list');
  if (list) list.style.display = ...;
}

// ✅ 修正后：根据 data-post-id 精确定位
var expandedPostIds = {};

function toggleComments(postId) {
  var card = document.querySelector('.pcard[data-post-id="' + postId + '"]');
  if (!card) return;
  var list = card.querySelector('.cmt-list');
  if (!list) return;
  if (expandedPostIds[postId]) {
    list.style.display = 'none';
    delete expandedPostIds[postId];
  } else {
    list.style.display = 'block';
    expandedPostIds[postId] = true;
  }
}
```

**测试要求：**
- 发帖
- 评论
- 筛选（全部/史观/冷知识/求助/资源）
- 点击第 3 条帖子只展开第 3 条评论
- 切换筛选后展开状态行为符合设计
- XSS：输入 `<script>alert(1)</script>` 只显示文本不执行
- 持久化：刷新后帖子仍在

**验收步骤：**
- 测试全部通过
- 浏览器：发新帖→展开评论→发评论→切换筛选→刷新→帖子在
- 提交: `git add ... && git commit -m "feat: discussion board with LocalStorage persistence and XSS protection"`

---

## Phase 4：复杂交互 Demo

**目标：** 时间轴、人物关系图、思维导图等复杂交互模块，先做独立 Demo 验证交互可用性，验收通过后才允许合入主页面。

**前置依赖：** Phase 2 完成（Phase 3 可与 Phase 4 并行）

**Definition of Done：** 每个 Demo 通过交互验收清单（拖拽、缩放、点击、空数据、错误数据、移动端触摸、性能），再合入主页面。

---

### Task 4.1：时间轴 Demo

**文件：**
- 新建（独立 Demo 页面或独立容器）

**实现要求：**
- 不接正式首页入口，先做独立可运行的 Demo
- 种子数据：每个重点朝代 3—5 条事件
- 实现缩放边界：`timelineZoom = Math.max(-3, Math.min(3, timelineZoom + delta))`
- 实现拖拽边界：
  - `timelineOffsetX`、`timelineOffsetY` 追踪偏移量
  - `minOffsetX`、`maxOffsetX` 限制偏移范围
  - `pointerDown`/`pointerMove`/`pointerUp` 处理鼠标
  - `touchStart`/`touchMove`/`touchEnd` 处理移动端

**交互验收清单：**
- [ ] 连续放大 20 次，仍停留在最大缩放级别
- [ ] 连续缩小 20 次，仍停留在最小缩放级别
- [ ] 持续向左或向右拖拽，节点不会全部离开可视区域
- [ ] 切换朝代后缩放和偏移恢复默认值
- [ ] 点击节点显示详情浮层
- [ ] 点击虚线查看因果关系
- [ ] 移动端触摸缩放和拖拽正常

**文件：**
- 新建: `tests/timeline.test.js`

**测试要求：**
- zoom 边界
- offset 边界
- 朝代切换后状态重置
- 空事件列表边界

**验收步骤：**
- Demo 交互验收清单全部通过
- 测试全部通过
- 合入主页面: `git add ... && git commit -m "feat: timeline module with drag/zoom bounds"`

---

### Task 4.2：人物关系图 Demo

**文件：**
- 新建: `src/data/people.json`（图结构）
- 新建独立 Demo 文件

**数据结构（图结构，替换原 centers 嵌套结构）：**
```json
{
  "people": [
    { "id": "wu-zetian", "name": "武则天", "dynasty": "唐朝", "summary": "...", "yearTable": [...], "evaluation": "..." },
    { "id": "di-renjie", "name": "狄仁杰", "dynasty": "唐朝", "summary": "..." }
  ],
  "relations": [
    { "source": "wu-zetian", "target": "di-renjie", "type": "career", "label": "君臣", "description": "..." }
  ]
}
```

**实现要求：**
- 第一轮种子数据：10—15 人
- 点击人物后该人物移动到 SVG 中心
- 根据邻接关系动态渲染周围人物
- 点击连接线显示二者关系
- 事业/亲属/师友/政治等关系可以筛选
- 检测重复 relation
- 检测不存在的人物 ID（validate-data.js 中已覆盖）

**交互验收清单：**
- [ ] 5 人小网络正常渲染
- [ ] 点击人物→居中动画→显示详情
- [ ] 点击连线→显示关系描述
- [ ] 关系筛选（事业/亲属 切换）
- [ ] 空人物数据
- [ ] 人物无关联时的边界处理
- [ ] 移动端触摸

**文件：**
- 新建: `tests/people.test.js`

**测试要求：**
- 图结构解析
- 邻接关系查询
- 关系筛选
- 重复关系检测
- 不存在的人物 ID 检测

**验收步骤：**
- Demo 交互验收清单全部通过
- 测试全部通过
- 创建 `src/js/people.js` 模块
- 删除 `index.html` 中内联的 `peoData` 和关系网函数
- 提交: `git add ... && git commit -m "feat: people relationship graph with graph-structured data"`

---

### Task 4.3：思维导图 Demo

**文件：**
- 新建: `src/js/mindmap.js`
- 新建: `tests/mindmap.test.js`

**实现要求：**
- 将 `index.html` 中内联的 `swMind`/`openNode`/`saveNode`/`closeNodeNote` 迁移到 `mindmap.js`
- 系统预置导图数据从 JSON 加载
- 节点笔记通过 storageAPI 持久化

**验收步骤：**
- 思维导图笔记保存/读取正常
- 测试全部通过
- 删除 index.html 中对应内联函数
- 提交: `git add ... && git commit -m "feat: mindmap module with note persistence"`

---

## Phase 5：内容扩充与质量检查

**目标：** 在架构和交互都稳定后，扩充内容数据到规划容量，执行内容质量审查。

**前置依赖：** Phase 2-4 完成

**Definition of Done：** 内容数据达到目标数量且通过质量检查校验。

---

### Task 5.1：第一轮内容扩充

**目标数据量：**

| 数据类型 | 当前种子 | 扩充目标 |
|----------|----------|----------|
| 名词解释 | 8—12 条 | 50+ |
| 时间轴事件 | 每朝代 3—5 条 | 40+ |
| 人物 | 10—15 人 | 30+ |
| 影视书目 | 每类 5—8 条 | 每类 15+ |
| 选择题 | 10—15 道 | 30+ |
| 热点文章 | 5—8 条 | 10+ |
| 播客 | 2—4 条 | 5+ |

**实现要求：**
- 每条数据必须是真实历史内容（不可编造史实）
- 使用标准 JSON 格式
- 扩充后立即运行 `node scripts/validate-data.js`

---

### Task 5.2：内容质量检查

**检查清单：**
- [ ] 检查史实是否准确
- [ ] 检查年份格式是否统一（如 `前221年` vs `前221`）
- [ ] 检查朝代字段是否统一（如 `唐朝` vs `唐代`）
- [ ] 检查分类字段是否统一（如 `制度` vs `政治制度`）
- [ ] 检查相关词是否形成有效网络（A 的 related 含 B，B 的 related 也含 A）
- [ ] 检查人物关系是否重复或冲突
- [ ] 检查外链是否可访问
- [ ] 运行 `node scripts/validate-data.js` 全部通过

---

## Phase 6：微信小程序迁移

> **此阶段独立执行，不在当前 Web 补完阶段启动。**

**目标：** 将 Web 原型迁移为原生微信小程序。

**前置依赖：** Phase 0-5 全部完成，Web 原型功能稳定。

**关键任务：**

```text
[ ] 初始化原生微信小程序 TypeScript 项目
[ ] 将 HTML 页面拆为 WXML / WXSS / TS
[ ] 将 window.xxxAPI 全局桥接替换为页面和组件通信
[ ] 替换 storageAPI → wx.setStorageSync / wx.getStorageSync
[ ] 替换 navigationAPI → wx.navigateTo / wx.showToast
[ ] 替换 audioAPI → wx.createInnerAudioContext
[ ] 替换 externalLinkAPI → 复制链接 / web-view 跳转
[ ] 替换 dataLoaderAPI → wx.request / 云开发
[ ] 适配微信登录
[ ] 时间轴 Canvas 2D Demo 验证
[ ] 人物关系图 Canvas 2D Demo 验证
[ ] 真机测试
[ ] 开发版测试
[ ] 体验版发布
[ ] 审核前检查（隐私政策、用户协议、类目核对）
```

详细任务拆分参考 `TASKS/学的是史_微信小程序_端到端开发任务树_v2.md`。

---

## 占位功能处理规则

对所有"开发中"占位功能，按以下规则处理：

| 状态 | 处理方式 |
|------|----------|
| 已完成 | 正常显示入口 |
| 当前阶段不做 | **隐藏入口**（不显示按钮/卡片/链接） |
| 需要提前展示 | 按钮**置灰**，标注"后续版本开放"，点击后不弹 toast |
| 禁止 | **不得保留**"点击后弹出开发中/即将上线提示"的伪入口 |

---

## 原计划到新计划映射表

| 原 Task | 新位置 | 处理方式 | 原因 |
|---------|--------|----------|------|
| Task 1: 名词解释 | Phase 2 Task 2.1 + 2.2 | **拆分** | 拆为"种子数据渲染"和"收藏已学"两个 Task |
| Task 1: 名词数据 50+ | Phase 5 | **后移** | 第一轮种子降到 8-12 条，大量扩充后移 |
| Task 2: 时间轴 | Phase 4 Task 4.1 | **重构** | 先做独立 Demo，通过验收再合入 |
| Task 2: 拖拽边界 | Phase 4 Task 4.1 | **保留+增强** | 原计划仅限 zoom，新增 drag bounds |
| Task 3: 人物专题 | Phase 4 Task 4.2 | **重构** | 数据改为图结构，先做独立 Demo |
| Task 4: 影视书目 | Phase 3 Task 3.2 | **保留** | 后移到 Phase 3 内容型模块 |
| Task 5: AI 播客 | Phase 3 Task 3.3 | **重构** | 通过 audio adapter，第一轮种子 2-4 条 |
| Task 6: 讨论区 | Phase 3 Task 3.4 | **重构** | 修正 toggleComments/展开状态/XSS |
| Task 7: 打卡签到 | Phase 2 Task 2.6 | **保留+增强** | 配合学习记录模块 |
| Task 8: 科学备考 | Phase 2 Task 2.3 + 2.4 | **拆分+重构** | 拆为"选择题"和"错题集"，修正 data-key |
| Task 8: 思维导图 | Phase 4 Task 4.3 | **重构** | 先做 Demo |
| Task 9: 首页热点 | Phase 3 Task 3.1 | **保留** | 后移到 Phase 3 |
| Task 10: 收尾清理 | Phase 0-4 各 Task 中 | **拆分** | 清理工作分散到各相关 Task 的验收中 |
| Task 11: 测试补齐 | Phase 0-5 各 Task 中 | **删除** | 测试不再集中到最后，每个 Task 同步完成 |
| —（新增） | Phase 0 Task 0.1-0.5 | **新增** | 仓库审计与安全护栏 |
| —（新增） | Phase 1 Task 1.1-1.6 | **新增** | 平台适配层 |
| —（新增） | Phase 2 Task 2.5 + 2.7 | **新增** | 学习记录 + 复习专区 |
| —（新增） | Phase 5 Task 5.2 | **新增** | 内容质量检查 |
| —（新增） | Phase 6 | **新增** | 微信小程序迁移阶段 |

---

## 第一轮推荐执行任务

严格限制为以下 Task，**不得**执行其他阶段：

```text
Phase 0：仓库审计与安全护栏
  [ ] Task 0.1：仓库现状扫描与基线文档
  [ ] Task 0.2：占位文案与 innerHTML 审计
  [ ] Task 0.3：建立 HTML 转义工具
  [ ] Task 0.4：建立数据校验脚本
  [ ] Task 0.5：运行现有测试并建立基线

Phase 1：平台适配层与模块边界
  [ ] Task 1.1：创建 storage adapter
  [ ] Task 1.2：创建 navigation adapter
  [ ] Task 1.3：创建 audio adapter
  [ ] Task 1.4：创建 externalLink adapter
  [ ] Task 1.5：创建 dataLoader adapter
  [ ] Task 1.6：现有模块对接 adapter
```

**第一轮禁止：** 批量扩充历史数据、页面大改、AI 功能、联机 PK、云开发、微信小程序迁移、人物星图正式接入、复杂时间轴正式接入。
