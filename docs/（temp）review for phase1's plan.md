你现在需要修改仓库中的开发计划文件：

```text
2026-06-10-history-learning-phase1-plan.md
```

本轮任务仅限于**审查、修订和重构开发计划**。不要开始实现任何业务代码，不要修改现有页面，不要批量生成历史内容数据。

# 一、项目背景

这是一个历史学习产品“学的是史”的现有 Web 原型。当前技术栈为：

```text
原生 HTML / CSS / JavaScript
JSON 静态数据
LocalStorage
Vitest + jsdom
```

当前阶段的目标是：

```text
先补完整 Web 原型
→ 清理内联脚本和占位功能
→ 将业务逻辑与浏览器 DOM 操作逐步解耦
→ 为后续迁移到微信小程序做好准备
```

注意：

```text
当前阶段不是微信小程序正式迁移阶段。
```

不要在当前计划中直接要求将全部页面重写为 WXML、WXSS 或微信小程序原生组件。微信小程序迁移应作为单独 Phase 明确列出。

# 二、修改目标

将现有计划重构为一份可供 Coding Agent 长期执行的端到端任务树。

新版计划必须做到：

1. 明确当前阶段属于 Web 原型补完与模块化整理。
2. 按依赖关系重新排序任务，而不是仅按页面排列。
3. 每一个 Task 都是独立、可验收、可提交的最小工作单元。
4. 每个 Task 都必须同步增加测试，不允许把测试统一堆积到最后。
5. 所有未来可能迁移到微信小程序的平台能力，都必须经过 adapter 适配层。
6. 修复原计划示例代码中存在的逻辑问题。
7. 降低第一轮内容填充量，优先验证架构和交互。
8. 为后续微信小程序迁移增加单独阶段。
9. 保留现有计划中有价值的内容，不要简单推倒重写。
10. 输出的新版计划应可以直接保存为仓库中的 `TASKS.md` 或新版 Phase Plan。

# 三、首先增加“Agent 强制执行规则”

在新版计划顶部加入以下规则，并根据仓库实际情况适当完善：

```md
## Agent 强制执行规则

1. 当前阶段是 Web 原型补完与模块化整理，不是微信小程序正式迁移。
2. 不得直接复制计划中的示例代码。示例仅用于表达目标，正式实现前必须检查仓库真实结构。
3. 每个 Task 开始前，必须先检查涉及的文件、函数名、DOM 结构和已有实现是否真实存在。
4. 所有用户输入和外部 JSON 数据在进入 innerHTML 前必须进行 HTML 转义；能使用 textContent 时优先使用 textContent。
5. 每完成一个 Task，必须同时完成：
   - 数据校验；
   - 对应单元测试；
   - 浏览器手动验收；
   - CHANGELOG.md 更新；
   - 单独 Git commit。
6. 不得在页面交互尚未验证时批量生成大量历史内容。
7. 所有平台相关能力必须经过 adapter 封装：
   - storageAPI
   - navigationAPI
   - audioAPI
   - externalLinkAPI
   - dataLoaderAPI
8. 新功能不得继续写入 index.html 内联脚本。
9. 若计划示例与仓库真实结构冲突，以仓库现状为准，并在执行报告中说明。
10. 每个 Task 完成后必须输出：
   - 修改文件；
   - 新增能力；
   - 自动化测试结果；
   - 手动验证步骤；
   - 遗留问题；
   - commit hash。
```

# 四、重新组织整体阶段

请将新版计划拆分为以下 Phase，并为每个 Phase 提供：

```text
目标
前置依赖
Task 列表
每个 Task 的文件范围
实现要求
测试要求
浏览器验收步骤
Git commit 建议
完成定义 Definition of Done
```

## Phase 0：仓库审计与安全护栏

新增以下任务：

```text
[ ] 扫描当前目录结构并输出 docs/current-state.md
[ ] 记录现有页面、模块、JSON 文件和内联脚本位置
[ ] 搜索所有 “开发中”“加载中”“即将上线” 占位文案
[ ] 搜索所有 innerHTML 使用点
[ ] 建立 src/js/utils/html.js 或等价工具文件
[ ] 实现 escapeHtml
[ ] 建立 scripts/validate-data.js
[ ] 运行现有测试并记录基线
[ ] 建立 CHANGELOG.md
```

`validate-data.js` 至少校验：

```text
JSON 是否可以解析
必填字段是否缺失
ID 是否重复
相关名词是否真实存在
人物关系 source / target 是否真实存在
题目答案是否属于已有选项
文章 URL 是否为空
音频路径是否为空
时间轴坐标是否为有效数字
时间轴坐标是否处于合理范围
```

## Phase 1：平台适配层与模块边界

新增以下 adapter：

```text
storageAPI
navigationAPI
audioAPI
externalLinkAPI
dataLoaderAPI
```

要求：

```text
现有 Web 版本使用浏览器能力实现。
未来迁移到微信小程序时，只替换 adapter，不重写业务逻辑。
业务模块不得直接散落调用 localStorage、window.open、new Audio 或 fetch。
```

至少拆分为：

```text
src/js/adapters/storage.js
src/js/adapters/navigation.js
src/js/adapters/audio.js
src/js/adapters/external-link.js
src/js/adapters/data-loader.js
```

为 adapter 增加单元测试。

## Phase 2：核心学习闭环

按以下顺序调整现有任务：

```text
[ ] 名词解释种子数据
[ ] 名词搜索与筛选
[ ] 名词详情
[ ] 收藏
[ ] 标记已学
[ ] 学习记录
[ ] 基础选择题
[ ] 错题集
[ ] 打卡
[ ] 复习专区
```

核心端到端验收路径必须写入计划：

```text
用户进入首页
→ 搜索“郡县制”
→ 打开详情
→ 收藏并标记已学
→ 完成一道秦朝选择题
→ 故意答错
→ 错题进入错题集
→ 完成今日打卡
→ 在个人页看到学习记录变化
→ 在复习专区看到已学名词
```

## Phase 3：内容型扩展模块

按以下顺序整理：

```text
[ ] 首页热点文章
[ ] 影视书目
[ ] 播客
[ ] 讨论区
```

要求每个模块先使用少量高质量种子数据验证页面逻辑，再单独增加“内容扩充任务”。

## Phase 4：复杂交互 Demo

将以下模块从普通页面任务中拆出，单独做独立 Demo：

```text
[ ] 时间轴 Demo
[ ] 人物关系图 Demo
[ ] 思维导图 Demo
```

每个 Demo 必须先验证：

```text
拖拽
缩放
点击
状态切换
空数据
错误数据
移动端触摸
性能
```

只有 Demo 验收通过后，才允许合入主页面。

## Phase 5：内容扩充与内容质量检查

将原计划中一次性要求的大量内容填充移到这里。

第一轮种子数据数量调整为：

```text
名词解释：8—12 条
时间轴事件：每个重点朝代 3—5 条
人物：10—15 人
影视书目：每类 5—8 条
选择题：10—15 道
热点文章：5—8 条
播客：2—4 条
```

架构稳定后再扩充到：

```text
名词解释：50+
时间轴事件：40+
人物：30+
影视书目：每类 15+
选择题：30+
热点文章：10+
```

增加内容质量检查任务：

```text
[ ] 检查史实是否准确
[ ] 检查年份格式是否统一
[ ] 检查朝代字段是否统一
[ ] 检查分类字段是否统一
[ ] 检查相关词是否形成有效网络
[ ] 检查人物关系是否重复或冲突
[ ] 检查外链是否可访问
```

## Phase 6：微信小程序迁移

新增单独阶段，不在当前 Web 补完阶段执行。

至少列出：

```text
[ ] 初始化原生微信小程序 TypeScript 项目
[ ] 将 HTML 页面拆为 WXML / WXSS / TS
[ ] 将 window 全局桥接替换为页面和组件通信
[ ] 替换 storageAPI
[ ] 替换 navigationAPI
[ ] 替换 audioAPI
[ ] 替换 externalLinkAPI
[ ] 适配微信登录
[ ] 真机测试
[ ] 开发版测试
[ ] 体验版发布
[ ] 审核前检查
```

# 五、修复原计划中的具体问题

请在新版计划中显式修正以下问题。

## 1. 讨论区评论展开逻辑

原计划中的 `toggleComments(postId)` 没有根据 `postId` 精确定位帖子。

请修改计划，要求：

```text
每个帖子卡片必须有 data-post-id
评论展开必须根据 postId 查找目标帖子
维护 expandedPostIds 或等价状态
重新 render 后仍需恢复展开状态
不得默认只操作第一条帖子
```

增加测试：

```text
点击第 3 条帖子，只展开第 3 条评论
切换筛选后展开状态行为符合设计
重新渲染后状态符合设计
```

## 2. XSS 与 HTML 转义

原计划大量直接拼接 `innerHTML`。

请增加统一要求：

```text
用户输入必须转义
JSON 外部数据必须转义
禁止直接把用户标题、正文、评论插入 innerHTML
能用 textContent 时优先使用 textContent
```

增加测试：

```text
输入 <script>alert(1)</script>
页面只能显示文本，不执行脚本
```

## 3. 题目选项识别

原计划中存在：

```js
btn.textContent.indexOf(key) === 2
```

请改为：

```text
按钮使用 data-key
判定时使用 btn.dataset.key
答错后：
- 错误选项红色
- 正确选项绿色
- 所有按钮禁用
```

## 4. 错题集真实落地

原计划的答题模块只保存当前轮结果，没有真正写入错题集。

请增加：

```text
xds_quiz_attempts
xds_wrong_questions
xds_question_mastery
```

每条错题至少包含：

```json
{
  "questionId": "q001",
  "wrongCount": 2,
  "lastWrongAt": "ISO 时间",
  "lastUserAnswer": "A",
  "mastered": false
}
```

增加：

```text
[ ] 错题列表
[ ] 错题详情
[ ] 标记已掌握
[ ] 再做一次
[ ] 错题统计
```

用户上传错题图片放入后续阶段，不要求本轮实现。

## 5. 时间轴拖拽边界

原计划仅限制 zoom，没有真正实现 drag bounds。

请增加：

```text
timelineOffsetX
timelineOffsetY
minOffsetX
maxOffsetX
pointerDown
pointerMove
pointerUp
touchStart
touchMove
touchEnd
```

验收：

```text
连续放大 20 次，仍停留在最大缩放级别
连续缩小 20 次，仍停留在最小缩放级别
持续向左或向右拖拽，节点不会全部离开可视区域
切换朝代后缩放和偏移恢复默认值
```

## 6. 人物关系图数据结构

原计划使用 `centers` 为每个人物重复维护关系，不适合长期扩展。

改为图结构：

```json
{
  "people": [
    {
      "id": "wu-zetian",
      "name": "武则天",
      "dynasty": "唐朝",
      "summary": "..."
    }
  ],
  "relations": [
    {
      "source": "wu-zetian",
      "target": "di-renjie",
      "type": "career",
      "label": "君臣",
      "description": "..."
    }
  ]
}
```

要求：

```text
点击人物后移动至中心
根据邻接关系动态渲染周围人物
点击连接线显示二者关系
事业 / 亲属 / 师友 / 政治等关系可以筛选
检测重复关系
检测不存在的人物 ID
```

## 7. 测试前移

删除“最后统一补测试”的做法。

改为：

```text
每个 Task 必须同步增加或修改测试
最后只保留全量回归测试和 smoke test
```

建议新增：

```text
tests/adapters/
tests/noun.test.js
tests/quiz.test.js
tests/wrong-question.test.js
tests/checkin.test.js
tests/discuss.test.js
tests/timeline.test.js
tests/people.test.js
tests/film.test.js
tests/podcast.test.js
tests/smoke.test.js
```

# 六、处理占位功能的规则

不要仅仅把：

```text
功能开发中
```

替换为：

```text
功能即将上线
```

请在新版计划中加入规则：

```text
已完成：正常显示入口
当前阶段不做：隐藏入口
需要提前展示：按钮置灰，并明确标注“后续版本开放”
不得保留点击后才弹出“开发中”或“即将上线”的伪入口
```

# 七、对现有 Task 的处理方式

请保留现有计划中仍然有价值的内容，例如：

```text
文件范围
JSON 数据结构
浏览器验收步骤
Git commit 建议
LocalStorage 持久化
Vitest + jsdom
内联脚本迁移
热点文章数据驱动
播客真实播放
签到联动
影视书目排序
```

但不要盲目保留现有顺序。

将每个原始 Task 标注为：

```text
保留
重构
拆分
后移
删除
```

在新版计划最后增加一个映射表：

| 原 Task | 新位置 | 处理方式 | 原因 |
| ------ | --- | ---- | -- |

# 八、输出文件要求

完成后：

1. 不要修改原始计划文件。
2. 新建文件：

```text
2026-06-10-history-learning-phase1-plan-v2.md
```

3. 新版文件必须包含：

   * 总体目标；
   * 阶段划分；
   * Agent 强制执行规则；
   * 每个 Task 的 checklist；
   * 文件范围；
   * 测试要求；
   * 手动验收步骤；
   * commit 建议；
   * Definition of Done；
   * 原计划到新计划映射表；
   * 微信小程序迁移阶段；
   * 第一轮推荐执行任务。

4. 第一轮推荐执行任务必须严格限制为：

```text
Phase 0：仓库审计与安全护栏
Phase 1：adapter 骨架
```

第一轮不要开始：

```text
批量扩充历史数据
页面大改
AI 功能
联机 PK
云开发
微信小程序迁移
人物星图正式接入
复杂时间轴正式接入
```

# 九、完成后汇报格式

完成后只输出：

```text
1. 新建文件路径
2. 新版计划的阶段结构
3. 相比原计划的主要变化
4. 被修正的风险点
5. 第一轮建议执行的 Task
6. 是否修改了业务代码：必须回答“否”
```
