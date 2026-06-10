# 学的是史 Task 0.3：HTML 转义工具与 src/js 渲染加固设计

## 1. 背景与目标

`Task 0.2` 已完成占位文案与 `innerHTML` 审计，当前已经确认：

- `src/js` 中存在多处运行时 `innerHTML` 写入点
- 风险来源覆盖 `用户输入`、`外部 JSON / 外部数据`、`存储数据`
- 最高风险点集中在 `src/js/ai-assistant.js`、`src/js/noun.js`、`src/js/favorites.js`、`src/js/film.js`、`src/js/timeline.js`

Phase 1 计划原始要求中的 `Task 0.3` 是：

1. 新建 `src/js/utils/html.js`
2. 提供 `window.htmlUtils.escapeHtml`
3. 为 HTML 转义工具补测试

基于 `Task 0.2` 的审计结果，以及本轮明确确认的范围，本次设计将 `Task 0.3` 扩展为：

- 建立统一 HTML 转义工具
- 在 `src/js` 范围内对当前可处理的动态渲染点做一轮加固

本次目标不是全面移除 `innerHTML`，而是在不打乱现有模块结构的前提下，优先阻断动态文本直接进入 HTML 的风险。

## 2. 设计范围

### 2.1 本次范围内

本次任务包含以下内容：

1. 新建 `src/js/utils/html.js`
2. 暴露 `window.htmlUtils.escapeHtml(value)`
3. 新建 `tests/utils/html.test.js`
4. 在 `src/js` 中对动态文本进入 `innerHTML` 的点位统一接入转义
5. 对少量明显更适合 `textContent` 的场景允许直接改为 `textContent`
6. 运行与本次修改直接相关的测试和诊断检查

### 2.2 明确不在本次范围内

以下内容不属于本次任务：

- 改造 `index.html` 内联脚本
- 全量消除所有 `innerHTML`
- 大规模重写为 `createElement` / `appendChild`
- adapter 层接入
- 页面结构重构
- 数据模型调整
- 批量新增功能

本轮目标是“先加护栏并加固 `src/js`”，不是“完成全仓库渲染重写”。

## 3. 方案选择

### 3.1 选定方案

本次采用：**统一转义工具 + 保守式模块接入**。

具体做法：

1. 通过 `src/js/utils/html.js` 提供统一 `escapeHtml`
2. 对 `src/js` 中仍需保留 `innerHTML` 的模板拼接点，统一对动态字段做转义
3. 对纯文本写入且改动成本低的场景，可直接改为 `textContent`
4. 对纯清空容器和纯常量空状态，不强制改写

### 3.2 选择理由

该方案最适合当前阶段：

- 能快速降低真实风险点暴露面
- 不会把 `Task 0.3` 变成一次大规模 DOM 重写
- 与当前 ES5 + IIFE + `window.xxxAPI` 结构兼容
- 为后续逐步替换高风险 `innerHTML` 留出空间

### 3.3 不采用的方案

#### 方案 A：只做工具和测试，不改业务模块

该方案符合最小范围，但无法把 `Task 0.2` 已识别的高风险点实际降险，因此不采用。

#### 方案 B：把所有 `innerHTML` 改成 DOM API

该方案安全性更高，但范围和改动面明显过大，会打断当前阶段节奏，因此不采用。

## 4. 输出文件设计

### 4.1 新增文件

- `src/js/utils/html.js`
- `tests/utils/html.test.js`

### 4.2 修改文件

- `src/js/ai-assistant.js`
- `src/js/noun.js`
- `src/js/favorites.js`
- `src/js/film.js`
- `src/js/timeline.js`

### 4.3 默认不改的文件

以下文件本轮不处理：

- `index.html`
- `src/js/checkin.js`

`src/js/checkin.js` 的日历 HTML 由内部逻辑生成，当前没有直接拼接用户输入、外部 JSON 或存储中的富文本，本轮不优先处理。

## 5. HTML 转义工具设计

### 5.1 文件位置

- `src/js/utils/html.js`

### 5.2 暴露方式

保持项目现有 IIFE 风格，通过 `window` 暴露：

```js
(function () {
  function escapeHtml(value) {
    // ...
  }

  window.htmlUtils = {
    escapeHtml: escapeHtml
  };
})();
```

### 5.3 函数行为

`escapeHtml(value)` 应满足：

- 接收任意输入值
- 对 `null` 和 `undefined` 不抛异常
- 返回字符串
- 至少转义以下字符：
  - `&`
  - `<`
  - `>`
  - `"`
  - `'`

### 5.4 行为规则

实现上按如下规则处理：

1. `null` 和 `undefined` 转为空字符串
2. 其余值先转为字符串
3. 按固定顺序替换：
   - `&` -> `&amp;`
   - `<` -> `&lt;`
   - `>` -> `&gt;`
   - `"` -> `&quot;`
   - `'` -> `&#39;`

### 5.5 使用原则

所有动态文本在进入 HTML 字符串前都应先经过 `escapeHtml`，包括：

- 元素文本节点内容
- `onclick="..."` 等属性中的动态参数
- `data-*` 属性中的动态值
- 由外部 JSON、用户输入或存储数据驱动的任意模板插值

## 6. src/js 加固策略

### 6.1 总体策略

本次不追求统一改成 DOM API，而是按“动态文本是否进入 HTML”来处理：

- 动态文本进入 HTML：必须转义
- 纯常量模板：可以保留
- 空字符串清空容器：保留
- 纯文本写入且结构简单：可改用 `textContent`

### 6.2 风险来源优先级

处理优先级保持与 `Task 0.2` 审计一致：

1. `用户输入`
2. `外部 JSON / 外部数据`
3. `存储数据`
4. `内部常量 / 模板`

这意味着即使某个模板混合了固定 HTML 和动态字段，也必须先处理动态字段。

## 7. 模块级设计

### 7.1 `src/js/ai-assistant.js`

#### 当前风险

- `aiSend()` 中把用户输入 `q` 直接拼进 `innerHTML`
- 助手回复 `a` 也通过 `innerHTML` 追加
- `a` 虽然部分来自内部预设，但默认分支会带入用户问题内容

#### 设计

这里保留消息模板字符串，但新增统一转义：

- 用户消息中的 `q` 使用 `escapeHtml(q)`
- 机器人消息中的动态问题片段使用 `escapeHtml(q)`
- 若机器人回复允许保留内部固定 `<br>`，则只对动态插值部分做转义，不对整段固定模板盲目转义

#### 边界

不在本次将消息渲染彻底改成 DOM 节点拼装。

### 7.2 `src/js/noun.js`

#### 当前风险

- 相关名词按钮使用 `innerHTML +=` 拼接
- 按钮文本 `r` 来自外部名词数据
- `onclick="openNounDet('...')"` 也直接带入动态参数

#### 设计

这里需要同时处理“文本内容”和“属性值参数”：

- 按钮显示文本使用 `escapeHtml(r)`
- 传给 `openNounDet()` 的动态参数也需要转义后再进入属性字符串

若单纯依赖 HTML 转义不能稳定覆盖单引号场景，则允许将该处改为 DOM 创建方式，例如：

- 创建 `button`
- 用 `textContent` 写入按钮文字
- 用事件绑定替代内联 `onclick`

该点允许采用比其他模块更强的处理方式，因为它同时涉及文本和事件参数注入。

### 7.3 `src/js/favorites.js`

#### 当前风险

- 收藏项来自存储数据
- `item.id` 被写入内联 `onclick`
- `item.title`、`item.subtitle`、`item.icon` 被直接拼入 HTML

#### 设计

这里保留整体列表模板，但统一处理动态字段：

- `item.id` 进入事件参数前做转义
- `item.title`、`item.subtitle`、`item.icon` 进入 HTML 前做转义

若某个字段只用于纯文本显示，也可以改为后续用 `textContent` 填充，但不要求为此重写整段列表逻辑。

### 7.4 `src/js/film.js`

#### 当前风险

- 影视卡片、榜单、待看栏来自外部 JSON 和存储数据
- 动态字段包括 `title`、`subtitle`、`score`、`icon`、`coverStyle`、`id`
- 待看栏还涉及 `onclick` 参数

#### 设计

按字段类型分开处理：

- 文本字段：统一 `escapeHtml`
- 标识类字段（如 `id`）：进入属性或事件参数前统一转义
- 样式字段（如 `coverStyle`）：本轮不新增通用 CSS 白名单工具，默认视为受控数据；若现有结构允许，优先避免把未经控制的样式片段直接拼入属性

#### 边界

本轮不引入新的样式安全系统，也不重构整个影视模块模板体系。

### 7.5 `src/js/timeline.js`

#### 当前风险

- SVG 字符串和事件列表中包含 `d.name`、`d.year`、`d.description`
- 这些字段来自外部数据

#### 设计

保留现有 SVG 与列表模板结构，但对所有动态文本字段做转义：

- 事件名称
- 年份文本
- 描述文本

数值型坐标字段如 `x`、`pol`、`eco`、`cul` 不使用 `escapeHtml` 作为文本转义处理对象，但在现有逻辑中仍视为受控数据输入。

## 8. 不改动点说明

### 8.1 `src/js/checkin.js`

`checkin.js` 当前的日历 HTML 来自：

- 当前日期
- 月份计算
- 打卡布尔状态

没有把可自由编辑的外部文本写入 `innerHTML`，因此本轮不优先修改。

### 8.2 `index.html`

虽然 `index.html` 仍存在多处 `innerHTML`，但这些点位属于后续任务范围，本轮明确不处理。

这样可以保证 `Task 0.3` 的改动面集中在 `src/js` 模块内。

## 9. 测试设计

### 9.1 工具测试

新增 `tests/utils/html.test.js`，至少覆盖以下场景：

- 输入 `<script>alert(1)</script>`，输出 `&lt;script&gt;alert(1)&lt;/script&gt;`
- 输入普通中文，原样输出
- 输入 `"quoted"`，输出 `&quot;quoted&quot;`
- 输入空字符串，不抛异常
- 输入 `null`，返回空字符串
- 输入 `undefined`，返回空字符串

### 9.2 模块级测试

除工具测试外，建议补充少量 focused test，优先覆盖高风险模块：

- `src/js/ai-assistant.js`：验证用户问题写入消息区时不会直接注入 HTML
- `src/js/noun.js`：验证相关名词按钮渲染时不会把动态文本原样注入按钮 HTML

若当前测试基础设施更容易覆盖其他模块，也可在 `favorites.js` 或 `film.js` 上选择一个代表性用例，但不要求为每个模块都新增测试。

### 9.3 校验方式

本轮至少需要：

- 运行新增工具测试
- 运行新增或修改的 focused test
- 对本次修改文件执行诊断检查

## 10. 边界与一致性规则

### 10.1 与项目规范一致

实现必须保持以下约束：

- 使用 IIFE
- 使用 ES5 写法
- 通过 `window.xxxAPI` 或 `window.xxx` 暴露兼容能力
- 不引入框架、构建工具或 TypeScript

### 10.2 优先最小可控改动

同一个风险点如果“补转义”就能解决，就不升级为整段重构。

### 10.3 允许局部更强修复

若某个点同时包含文本和事件参数拼接，且简单转义不足以让实现清晰稳定，则允许局部改成 DOM 创建与事件绑定。

### 10.4 以 `src/js` 为施工边界

本轮不跨到 `index.html` 内联脚本，以保证任务范围稳定。

## 11. 验收标准

当以下条件全部满足时，本次任务视为完成：

1. `src/js/utils/html.js` 已创建并暴露 `window.htmlUtils.escapeHtml`
2. `tests/utils/html.test.js` 已创建并通过
3. `src/js/ai-assistant.js`、`src/js/noun.js`、`src/js/favorites.js`、`src/js/film.js`、`src/js/timeline.js` 的动态渲染点已完成本轮加固
4. 本轮修改不涉及 `index.html`
5. 本轮修改保持 ES5 与 IIFE 风格
6. 相关测试和诊断检查通过

## 12. 后续衔接

本轮完成后，后续任务可以继续沿以下方向推进：

- 继续处理 `index.html` 内联脚本中的高风险渲染点
- 逐步将更复杂的模板从 `innerHTML` 迁移到更清晰的渲染方式
- 在 adapter 层建设完成后，进一步收敛直接平台调用

这些衔接项只用于说明本轮产物的去向，不构成当前任务的额外范围。
