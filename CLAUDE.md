# 学的是史 — 项目指引

## 项目概述

中国历史学习网站 Web 原型。当前阶段：**Web 原型补完与模块化整理**，为后续微信小程序迁移做准备。

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
index.html              # 页面骨架，引用外部 CSS/JS
src/
├── css/
│   ├── base.css        # reset、全局规则
│   ├── components.css  # 可复用组件样式
│   └── pages.css       # 页面级样式
├── js/
│   ├── app.js          # 入口：初始化编排、全局暴露
│   ├── storage.js      # LocalStorage 封装（后续由 adapters/storage.js 取代）
│   ├── navigation.js   # 登录、页面切换、toast
│   ├── noun.js         # 名词解释
│   ├── timeline.js     # 时间轴
│   ├── podcast.js      # AI 播客播放器
│   ├── ai-assistant.js # AI 助手问答与拖拽
│   ├── checkin.js      # 打卡签到
│   ├── favorites.js    # 收藏管理
│   ├── film.js         # 影视书目 + 待看栏
│   └── adapters/       # 平台适配层（Phase 1 构建中）
└── data/
    ├── nouns.json      # 名词数据（当前 4 条，目标 50+）
    ├── timeline.json   # 时间轴事件（当前 13 条，目标 40+）
    ├── people.json     # 人物数据（待从 index.html 迁移）
    ├── films.json      # 影视书目数据
    ├── podcasts.json   # 播客数据
    ├── rankings.json   # 影视书目排行榜
    ├── memes.json      # 梗图轮播
    ├── books.json      # 书籍数据
    ├── discussions.json
    ├── hot-articles.json
    ├── science-tools.json
    ├── profile-menu.json
    └── feedback-types.json
```

## JS 模块规范

- 使用 **IIFE** 模式：`(function () { ... })();`
- 对外暴露通过 `window.xxxAPI = { fn1, fn2 }`
- 函数名使用 **camelCase**
- HTML 通过 `onclick="..."` 内联事件调用，因此关键函数必须暴露到 `window`
- ES5 语法：`var` 非 `let/const`，普通 function 非箭头函数

## 当前阶段与约束

详见 `docs/superpowers/plans/2026-06-10-history-learning-phase1-plan-v2.md`。

### 核心规则

1. **当前不是微信小程序迁移阶段。** 不要将页面重写为 WXML/WXSS。
2. **所有平台能力必须经过 adapter。** 不允许业务模块直接调用 `localStorage`、`window.open`、`new Audio`、`fetch`。
3. **新功能不得写入 index.html 内联脚本。** 必须创建独立 JS 模块文件。
4. **所有用户输入和外部 JSON 数据进入 innerHTML 前必须转义。** 能 textContent 优先 textContent。
5. **第一轮种子数据严格限数量。** 页面交互未验证前不批量生成历史内容。名词 8-12 条、题目 10-15 道、人物 10-15 人。
6. **每个 Task 同步完成测试，不可集中到最后。**
7. **已完成：正常显示入口；不做：隐藏入口；预告：按钮置灰。** 禁止保留"点击后弹开发中"的伪入口。

### Adapter 层（Phase 1 构建中）

```
src/js/adapters/
├── storage.js        # 封装 LocalStorage
├── navigation.js     # 封装页面切换/toast
├── audio.js          # 封装 HTML5 Audio
├── external-link.js  # 封装 window.open
└── data-loader.js    # 封装 fetch JSON
```

未来迁移小程序时只替换 adapter 实现，不重写业务逻辑。

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
