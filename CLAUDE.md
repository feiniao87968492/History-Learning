# 学的是史 — 项目指引

## 项目概述

中国历史学习网站 Web 原型。当前阶段：**论坛首页重构（讨论区为主页）**，为后续微信小程序迁移做准备。2026-06-13 完成大架构简化：讨论区升级为首页，热点/人物/影视并入帖子区，AI播客/错题/题目功能移除。

- 线上地址：`http://118.178.140.171:9090`
- GitHub：`https://github.com/feiniao87968492/History-Learning`

## 技术栈

```
原生 HTML / CSS / JavaScript (ES5)
JSON 静态数据（通过 fetch 加载）
LocalStorage 持久化
Vitest + jsdom 测试
Python http.server 静态部署
```

**不引入任何前端框架、构建工具或 TypeScript。**

## 项目结构

```
index.html              # 页面骨架（论坛首页 + 工具页 + 我的）
src/
├── css/
│   ├── base.css        # reset、全局规则
│   ├── components.css  # 可复用组件样式（含论坛帖子类型样式）
│   └── pages.css       # 页面级样式
├── js/
│   ├── app.js          # 入口：初始化编排、全局暴露
│   ├── storage.js      # LocalStorage 封装（后续由 adapters/storage.js 取代）
│   ├── navigation.js   # 页面切换、toast（登录已移除）
│   ├── forum.js        # 论坛核心模块（5种帖子类型 + 标签系统）
│   ├── noun.js         # 名词解释
│   ├── timeline.js     # 时间轴
│   ├── ai-assistant.js # AI 助手问答与拖拽
│   ├── checkin.js      # 打卡签到
│   ├── favorites.js    # 收藏管理
│   ├── tools.js        # 工具页（名词+时间轴+思维导图入口）
│   ├── mindmap.js      # 思维导图
│   └── adapters/       # 平台适配层
│       ├── storage.js
│       ├── navigation.js
│       ├── external-link.js
│       └── data-loader.js
└── data/
    ├── nouns.json      # 名词数据（51 条）
    ├── timeline.json   # 时间轴事件（42 条）
    ├── discussions.json # 论坛种子帖（29 条，5 种类型）
    ├── mindmaps.json   # 思维导图数据
    ├── science-tools.json
    ├── profile-menu.json
    └── feedback-types.json
```

### 已移除的模块（2026-06-13）
podcast.js, quiz.js, review.js, learning-stats.js, film.js, people.js, audio.js adapter
对应数据文件：podcasts.json, questions.json, films.json, people.json, rankings.json, books.json, hot-articles.json, memes.json

## JS 模块规范

- 使用 **IIFE** 模式：`(function () { ... })();`
- 对外暴露通过 `window.xxxAPI = { fn1, fn2 }`
- 函数名使用 **camelCase**
- HTML 通过 `onclick="..."` 内联事件调用，因此关键函数必须暴露到 `window`
- ES5 语法：`var` 非 `let/const`，普通 function 非箭头函数

## 当前阶段与约束

详见 `TASKS/2026-06-10-history-learning-phase1-plan-v2.md`。

### 核心规则

1. **当前不是微信小程序迁移阶段。** 不要将页面重写为 WXML/WXSS。
2. **所有平台能力必须经过 adapter。** 不允许业务模块直接调用 `localStorage`、`window.open`、`new Audio`、`fetch`。
3. **新功能不得写入 index.html 内联脚本。** 必须创建独立 JS 模块文件。
4. **所有用户输入和外部 JSON 数据进入 innerHTML 前必须转义。** 能 textContent 优先 textContent。
5. **第一轮种子数据严格限数量。** 页面交互未验证前不批量生成历史内容。名词 8-12 条、题目 10-15 道、人物 10-15 人。
6. **每个 Task 同步完成测试，不可集中到最后。**
7. **已完成：正常显示入口；不做：隐藏入口；预告：按钮置灰。** 禁止保留"点击后弹开发中"的伪入口。

### Adapter 层（Phase 1 已完成）

```
src/js/adapters/
├── storage.js        # 封装 LocalStorage
├── navigation.js     # 封装页面切换/toast
├── audio.js          # 封装 HTML5 Audio
├── external-link.js  # 封装 window.open
└── data-loader.js    # 封装 fetch JSON
```

未来迁移小程序时只替换 adapter 实现，不重写业务逻辑。

### 当前进度（2026-06-13）

- 当前工作分支：`main`。
- **论坛首页重构已完成**：讨论区升级为首页，热点文章/人物/影视书目内容并入帖子区（29 条种子帖、5 种类型），AI 播客/错题/题目功能移除，登录页移除直接进首页，工具页收纳名词+时间轴+思维导图。
- 最新线上部署 commit：待部署。
- 数据校验：`7 OK`、`0 WARN`、`0 ERROR`。
- 全量测试：`npx vitest run --environment jsdom` 为 22 个测试文件、140 项测试通过。
- 静态资源缓存版本已更新为 `v=20260613-forum-v1`。
- 设计文档：`docs/superpowers/specs/2026-06-13-forum-homepage-redesign.md`
- 实施计划：`docs/superpowers/plans/2026-06-13-forum-homepage-redesign-plan.md`

## 本地运行

```bash
python -m http.server 8000
# 访问 http://localhost:8000
```

## 测试

```bash
npx vitest run --environment jsdom        # 运行全部测试
npx vitest --environment jsdom            # watch 模式
```

## 部署

```bash
./scripts/deploy.sh       # 更新服务器
./scripts/push-github.sh  # 同步 GitHub
./scripts/publish-all.sh  # 同步 GitHub + 更新服务器
```

## 关键设计决策

| 决策 | 原因 |
|------|------|
| 不改技术栈 | 当前 Web 原型需先补完功能再考虑框架 |
| Adapter 模式 | 为小程序迁移预留替换点 |
| 图结构人物数据 | 比 centers 嵌套结构更易扩展 |
| 独立 Demo 先行 | 复杂交互（时间轴、人物图）先验证再合入 |
| 种子数据先少后多 | 先验证架构和交互，内容可后续批量扩充 |

## 关联文档

- 长期路线图：`docs/superpowers/specs/2026-06-10-history-learning-roadmap-design.md`
- 实施计划 v2：`docs/superpowers/plans/2026-06-10-history-learning-phase1-plan-v2.md`
- 实施计划 v1：`docs/superpowers/plans/2026-06-10-history-learning-phase1-plan.md`（已被 v2 取代）
- 重构报告：`docs/refactor-report.md`
- 微信小程序任务树：`TASKS/学的是史_微信小程序_端到端开发任务树_v2.md`
