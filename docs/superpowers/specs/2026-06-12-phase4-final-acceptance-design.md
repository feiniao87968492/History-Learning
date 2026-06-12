# Phase 4 最终验收补齐设计

## 1. 背景

`TASKS/2026-06-10-history-learning-phase1-plan-v2.md` 将 Phase 4 定义为“复杂交互 Demo”，范围包括时间轴、人物关系图和思维导图。目标是在正式进入后续内容扩充前，确认这些复杂交互已经可用、可测试、可迁移，并且不会把平台能力或大段内联逻辑继续散落在 `index.html` 中。

当前 `CHANGELOG.md` 已记录 2026-06-12 完成了 Phase 4 Task 4.1、4.2、4.3：

- `src/js/timeline.js` 已补齐时间轴缩放与拖拽边界。
- `src/js/people.js` 与图结构 `src/data/people.json` 已落地。
- `src/js/mindmap.js` 与 `src/data/mindmaps.json` 已落地，节点笔记通过 `storageAPI` 持久化。

本设计不重复重写这些已完成模块，而是进行最终验收补齐：核验现状、修复发现的最小缺口、补齐自动与手工验收记录。

## 2. 目标

本任务完成以下工作：

1. 核验 Phase 4 的三个任务是否仍满足任务文档要求。
2. 对发现的实现、测试或数据校验缺口做最小修复。
3. 补齐 Phase 4 最终验收报告，明确自动测试、数据校验、代码路径核验和需要人工复核的项目。
4. 如有实现或验收记录更新，同步更新 `CHANGELOG.md` 摘要。
5. 保持当前 Web 原型技术栈和 adapter 边界，为后续 Phase 5 内容扩充与未来微信小程序迁移保留清晰接口。

## 3. 非目标

本任务不做以下内容：

- 不把页面重写为 WXML/WXSS。
- 不引入前端框架、构建工具或 TypeScript。
- 不批量扩充历史内容数据；时间轴、人物、导图继续保持第一轮种子规模。
- 不重做已完成的 Phase 4 模块。
- 不新增正式首页入口或伪入口。
- 不做与 Phase 4 无关的重构。
- 不绕过 adapter 直接调用 `localStorage`、`fetch`、`window.open`、`new Audio` 等平台能力。

## 4. 核验范围

### 4.1 时间轴 Demo

核验文件：

- `src/js/timeline.js`
- `src/data/timeline.json`
- `tests/timeline.test.js`
- `src/js/app.js`
- `index.html`

核验项：

1. `timelineZoom` 稳定限制在 `-3` 到 `3`。
2. 鼠标拖拽和触摸拖拽都通过偏移边界限制。
3. 切换朝代时重置缩放和偏移。
4. 空事件列表展示安全空态。
5. 点击节点展示详情浮层。
6. 点击因果虚线展示因果关系。
7. JSON 字段进入 SVG 或 HTML 字符串前经过转义。
8. 现有主页面接线不依赖新增内联脚本。

### 4.2 人物关系图 Demo

核验文件：

- `src/js/people.js`
- `src/data/people.json`
- `tests/people.test.js`
- `scripts/validate-data.js`
- `src/js/app.js`
- `index.html`

核验项：

1. `people.json` 使用 `people` / `relations` 图结构。
2. 第一轮种子人物数量保持在 10 到 15 人。
3. 点击人物后以该人物为中心重新渲染并展示详情。
4. 点击关系线展示关系说明。
5. 支持 `all`、`career`、`family`、`teacher`、`political` 等关系筛选。
6. 空人物数据有降级显示。
7. 孤立人物有边界处理。
8. 重复关系和不存在的人物 ID 能被校验。
9. 外部 JSON 字段进入 HTML/SVG 前经过转义。
10. `index.html` 中旧的 `peoData` 和关系网内联函数已删除。

### 4.3 思维导图 Demo

核验文件：

- `src/js/mindmap.js`
- `src/data/mindmaps.json`
- `tests/mindmap.test.js`
- `src/js/app.js`
- `index.html`

核验项：

1. `swMind`、`openNode`、`saveNode`、`closeNodeNote` 已迁移到独立模块。
2. 预置导图由 JSON 数据驱动渲染。
3. 节点点击打开笔记面板。
4. 节点笔记通过 `storageAPI.getStoredString` / `storageAPI.setStoredString` 持久化。
5. 重新打开节点可读回已保存笔记。
6. 节点文案和笔记展示具备 XSS 防护。
7. 模块暴露必要的全局兼容函数，满足现有内联事件调用。

## 5. 数据流设计

Phase 4 三个模块统一沿用现有数据加载链路：

```text
src/data/*.json
→ dataLoader adapter
→ app.js 初始化注入
→ 业务模块 setXxxData()
→ 模块内部 render()
→ DOM / SVG
```

具体数据流：

- 时间轴：`timeline.json` 由 `app.js` 加载后注入 `timelineAPI`，`timeline.js` 根据当前朝代、缩放和偏移状态渲染 SVG。
- 人物关系图：`people.json` 由 `app.js` 加载后注入 `peopleAPI.setPeopleData()`，`people.js` 根据中心人物、关系筛选和邻接关系渲染 SVG。
- 思维导图：`mindmaps.json` 由 `app.js` 加载后注入 `mindmapAPI.setMindmapData()`，`mindmap.js` 渲染导图 Tab、节点和连线；节点笔记通过 `storageAPI` 读写。

该链路保持业务模块和平台能力分离。未来迁移微信小程序时，优先替换 adapter 和视图层，不把平台 API 改动扩散到业务逻辑。

## 6. 错误处理与边界

最终验收和最小修复遵循以下规则：

- 数据缺失时，模块展示空态或安全降级，不抛出阻断页面的异常。
- 人物关系图中的重复 relation、无效人物 ID 由 `scripts/validate-data.js` 报告。
- 时间轴缩放、拖拽偏移必须通过 clamp 限制，连续操作后仍停留在边界内。
- 朝代或 Tab 切换不保留不合理的旧交互状态。
- 思维导图笔记读写失败时不影响节点面板基本打开/关闭行为。
- 所有外部 JSON 数据和用户输入在进入 `innerHTML` 或 SVG 字符串前必须转义；能用 `textContent` 的地方优先使用 `textContent`。

## 7. 测试与验收策略

### 7.1 自动测试

优先运行 Phase 4 相关测试：

```bash
npx vitest run tests/timeline.test.js tests/people.test.js tests/mindmap.test.js tests/app-static-data.test.js tests/adapter-wiring.test.js --environment jsdom
node scripts/validate-data.js
```

如果核验过程中修改了公共接线或基础工具，再运行全量测试：

```bash
npx vitest run --environment jsdom
```

### 7.2 代码路径核验

自动测试不能完全证明真实浏览器触摸与拖拽手感，因此需要额外检查代码路径：

- 时间轴是否绑定鼠标与触摸事件路径。
- 人物关系图是否支持点击节点、点击关系线和筛选重渲染路径。
- 思维导图是否通过 adapter 读写笔记。
- `index.html` 是否只保留容器和必要的内联调用，不保留大段已迁移业务逻辑。

### 7.3 手工验收记录

最终报告需要区分三类结论：

1. 自动测试已覆盖。
2. 已通过代码路径核验。
3. 需要真实浏览器或移动端人工复核。

对不能在当前环境中完全证明的项目，不写成“已人工通过”，而是明确记录为“需浏览器复核”或“通过代码路径确认事件已接线”。

## 8. 交付物

本任务的交付物包括：

1. 本设计文档：`docs/superpowers/specs/2026-06-12-phase4-final-acceptance-design.md`。
2. 实施计划文档：由 `writing-plans` 阶段生成。
3. Phase 4 最终验收报告，建议路径：`docs/superpowers/reports/2026-06-12-phase4-final-acceptance-report.md`。
4. 如有必要，最小范围代码或测试修复。
5. 如有必要，`CHANGELOG.md` 增加最终验收摘要。
6. Git 提交记录：设计文档单独提交，后续验收补齐和修复单独提交。

## 9. 实施顺序

1. 写入并提交本设计文档。
2. 用户审阅设计文档。
3. 用户批准后，调用 `writing-plans` 技能生成实施计划。
4. 按实施计划核验三个 Phase 4 模块。
5. 对发现的缺口做最小修复并补测试。
6. 运行 Phase 4 相关测试与数据校验。
7. 必要时运行全量测试。
8. 写入最终验收报告，并视情况更新 `CHANGELOG.md`。
9. 提交最终验收补齐改动。
10. 汇报测试结果、提交信息、剩余风险和后续建议。
