# 学的是史 Task 0.4：数据校验脚本设计

## 1. 背景与目标

当前仓库中的 `src/data/` 已经扩展为多份静态 JSON 数据文件，覆盖：

- 名词解释
- 时间轴
- 人物
- 影视书目
- 播客
- 首页热点
- 讨论区
- 个人页菜单
- 科学备考工具
- 反馈类型
- 书籍与梗图等内容

Phase 1 计划中的 `Task 0.4` 要求新增一个数据校验脚本，用于在进入更深层模块化与 adapter 接入前，先为静态数据建立一层命令行护栏。

本次任务的核心目标是：

1. 确认 `src/data/` 下 JSON 文件都能成功解析
2. 对计划点名的关键数据文件做最小而明确的结构校验
3. 通过命令行报告把错误、告警和通过结果清晰输出

本轮不修数据内容，只建立“可执行的基线校验能力”。

## 2. 设计范围

### 2.1 本次范围内

本次任务包含以下内容：

1. 新建 `scripts/validate-data.js`
2. 扫描 `src/data/*.json`
3. 校验所有 JSON 文件是否可解析
4. 对计划点名文件执行专项规则校验
5. 在终端输出可读的校验报告
6. 用退出码区分“有错误”和“无错误”

### 2.2 明确不在本次范围内

以下内容不属于本次任务：

- 自动修复 JSON 文件
- 新增测试文件
- 引入 JSON Schema 库或第三方校验库
- 为所有数据文件建立完整 schema
- 修改前端代码去适配数据问题
- 改动 `src/data/*.json` 内容

本轮只建立脚本，不进入数据修复或体系化 schema 工程。

## 3. 方案选择

### 3.1 选定方案

本次采用：**单文件 CLI 校验脚本**。

脚本入口为：

- `scripts/validate-data.js`

脚本由 Node 直接运行：

```bash
node scripts/validate-data.js
```

### 3.2 选择理由

该方案最适合当前阶段：

- 与原计划的最小交付完全一致
- 不引入额外依赖
- 易于在本地和 CI 中直接运行
- 对当前原生项目结构侵入最小
- 报告逻辑和规则逻辑可以集中维护

### 3.3 不采用的方案

#### 方案 A：多文件模块化校验器

虽然结构更整齐，但对 `Task 0.4` 来说偏重，当前阶段不需要拆分多个脚本文件。

#### 方案 B：引入通用 JSON Schema 体系

扩展性更强，但会明显超出本轮范围，也会引入额外维护成本，因此不采用。

## 4. 输出文件设计

### 4.1 输出文件

- 新建：`scripts/validate-data.js`

### 4.2 运行方式

脚本通过 Node 直接运行：

```bash
node scripts/validate-data.js
```

不依赖打包工具，不依赖测试框架，不依赖浏览器环境。

### 4.3 技术约束

实现只使用 Node 内置模块：

- `fs`
- `path`

不新增第三方包。

## 5. 数据扫描设计

### 5.1 扫描范围

脚本默认扫描：

- `src/data/*.json`

当前仓库中已存在的数据文件包括：

- `books.json`
- `discussions.json`
- `feedback-types.json`
- `films.json`
- `hot-articles.json`
- `memes.json`
- `nouns.json`
- `people.json`
- `podcasts.json`
- `profile-menu.json`
- `rankings.json`
- `science-tools.json`
- `timeline.json`

### 5.2 缺失文件处理

对于计划点名但当前仓库中不存在的文件，例如 `questions.json`：

- 视为“跳过”
- 不算错误
- 可输出一条简短提示，说明“文件不存在，已跳过专项校验”

这样既满足计划覆盖，又不把当前仓库现状误报成失败。

## 6. 报告设计

### 6.1 报告级别

报告分为三种级别：

- `ERROR`：确定性错误，应导致退出码为 `1`
- `WARN`：结构与计划假设不一致或无法执行专项校验，但不阻断脚本成功运行
- `OK`：文件或专项校验通过

### 6.2 输出形式

控制台输出采用简单文本报告，例如：

```text
[OK] nouns.json parsed
[ERROR] nouns.json entry "xxx" missing field: category
[WARN] people.json structure does not contain relations array, relation checks skipped
```

### 6.3 汇总输出

脚本结束时输出汇总信息，例如：

```text
Summary: 10 OK, 2 WARN, 3 ERROR
```

### 6.4 退出码规则

- 存在 `ERROR`：`process.exitCode = 1`
- 无 `ERROR`：`process.exitCode = 0`

`WARN` 不单独导致失败。

## 7. 通用 JSON 校验设计

### 7.1 通用解析校验

对每个 `src/data/*.json` 文件都执行：

1. 文件读取
2. `JSON.parse`

若解析失败：

- 记录 `ERROR`
- 报告文件名和解析失败信息

### 7.2 解析成功后的通过信息

解析成功时，至少记录一条 `OK`：

- `xxx.json parsed`

这样脚本报告不会只有错误，没有成功反馈。

## 8. 专项校验设计

### 8.1 `nouns.json`

#### 目标

校验名词数据的最小字段完整性和 related 引用有效性。

#### 规则

对每个名词条目：

- `text` 必填
- `dynasty` 必填
- `category` 必填

若缺失任一字段，记录 `ERROR`。

若存在 `related`：

- 必须是数组
- 数组中的每个名词都必须在 `nouns.json` 中存在

若 `related` 指向不存在的名词，记录 `ERROR`。

#### 兼容性假设

该文件当前按“对象映射”结构处理，即：

```js
{
  "秦始皇": { ... },
  "郡县制": { ... }
}
```

若结构不是对象映射，则记录 `WARN` 或 `ERROR`，并跳过 deeper checks。

### 8.2 `timeline.json`

#### 目标

校验时间轴事件的核心数值字段。

#### 规则

计划点名字段：

- `x`
- `pol`
- `eco`
- `cul`

对每个事件：

- 必须能转成有效数字
- 数值应处于约定合理范围

#### 合理范围设计

为避免误判，同时覆盖当前页面坐标系，本次采用宽松区间：

- `x`：`0` 到 `1000`
- `pol` / `eco` / `cul`：`0` 到 `500`

若字段不是有效数字或超出区间，记录 `ERROR`。

#### 兼容性假设

该文件预期结构为：

```js
{
  "dynasties": [...],
  "events": [...]
}
```

若不存在 `events` 数组，则记录 `ERROR`。

### 8.3 `people.json`

#### 目标

尽可能覆盖计划要求中的“人物 ID 重复”和 “relations 引用有效性”。

#### 当前现实

计划中对 `people.json` 的假设可能是图结构人物数据，但当前仓库实际结构未必完全一致。

因此本次脚本要先识别结构，再决定能做哪些校验。

#### 规则

如果 `people.json` 是数组结构，且每项包含 `id`：

- 检查 `id` 是否重复

如果 `people.json` 包含 `relations` 数组，且每项包含 `source` / `target`：

- 检查 `source` 是否指向已存在人物
- 检查 `target` 是否指向已存在人物

#### 结构不匹配时的处理

若文件存在但不符合上述结构：

- 输出 `WARN`
- 说明“当前结构与计划假设不一致，已跳过 ID / relations 专项校验”

这样既尊重计划目标，也尊重当前仓库现实。

### 8.4 `questions.json`

#### 目标

覆盖计划中的可选题库校验。

#### 规则

如果文件存在：

- 检查题目 ID 是否重复
- 检查答案是否属于已有选项

如果文件不存在：

- 输出 `WARN` 或 `OK` 风格的“已跳过”提示
- 不算错误

### 8.5 `films.json` / `podcasts.json` / `hot-articles.json`

#### 目标

校验关键字段是否为空。

#### 规则

这些文件当前都按列表结构处理。

##### `films.json`

每项至少检查：

- `id`
- `title`
- `type`

##### `podcasts.json`

每项至少检查：

- `id`
- `title`

##### `hot-articles.json`

每项至少检查：

- `title`

若关键字段为空字符串、缺失或仅包含空白字符，记录 `ERROR`。

#### 结构不匹配

若文件不是数组，则记录 `ERROR`。

## 9. 内部实现结构

### 9.1 顶层流程

脚本按以下顺序执行：

1. 定位 `src/data` 目录
2. 找到所有 `.json` 文件
3. 逐个执行通用解析校验
4. 对命中的特定文件执行专项校验
5. 输出汇总
6. 设置退出码

### 9.2 结果收集方式

脚本内部维护一个结果数组，每条结果至少包含：

- `level`
- `file`
- `message`

最终统一打印，不采用“边校验边杂乱输出”的方式。

### 9.3 辅助函数建议

单文件内可以拆成若干函数，例如：

- `readJsonFile(filePath)`
- `addResult(level, file, message)`
- `validateNouns(data)`
- `validateTimeline(data)`
- `validatePeople(data)`
- `validateQuestions(data)`
- `validateMediaList(fileName, data, requiredFields)`
- `printSummary()`

这些函数只作为脚本内部组织，不额外拆文件。

## 10. 边界与一致性规则

### 10.1 错误与告警分离

“真实数据错误”和“计划假设与当前结构不一致”不能混为一类。

例如：

- JSON 解析失败：`ERROR`
- `people.json` 结构不符合 relations 假设：`WARN`

### 10.2 优先输出可行动信息

每条报错应尽量包含：

- 文件名
- 条目定位
- 缺失或非法字段名

避免只有“校验失败”这种无用信息。

### 10.3 保持单脚本可维护性

虽然是单文件实现，但函数边界要清晰，避免把所有规则混在一个大函数里。

### 10.4 不误报当前仓库现实

对于计划中提到但当前不存在或结构不同的文件，不应直接判死刑；应按“跳过”或“结构告警”处理。

## 11. 验收标准

当以下条件全部满足时，本次任务视为完成：

1. `scripts/validate-data.js` 已创建
2. `node scripts/validate-data.js` 可成功运行
3. `src/data/*.json` 的解析校验已覆盖
4. `nouns.json`、`timeline.json`、`people.json`、`questions.json`、`films.json`、`podcasts.json`、`hot-articles.json` 的计划要求已被脚本覆盖或按规则跳过
5. 报告中清楚区分 `OK`、`WARN`、`ERROR`
6. 退出码能反映是否存在错误

## 12. 后续衔接

本轮完成后，该脚本可以直接用于：

- `Task 0.5` 的基线记录
- 后续批量扩充种子数据前的快速校验
- 本地提交前的数据自检

这些后续用途仅说明脚本价值，不构成当前任务的额外范围。
