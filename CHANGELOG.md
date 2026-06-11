# CHANGELOG

## 2026-06-11

### Phase 1 Task 1.2：navigation adapter

- 新增 `src/js/adapters/navigation.js`，封装 Web DOM 页面切换、子页面开关、Toast 和 AI 悬浮按钮复位。
- 新增 `tests/adapters/navigation.test.js`，覆盖 Toast 文本/定时隐藏、重复 Toast 重置定时器、登录状态切换、子页面打开关闭、页面切换和缺失 DOM 节点安全路径。
- 保持 `window.navigationAPI.resetAIFab`、`showToast`、`login`、`openSub`、`closeSub` 兼容。
- `showToast(message, duration)` 新增可选时长参数；旧调用默认仍为 `2000` ms。
- 本任务未改动业务模块；业务模块统一接入 adapter 留到 Phase 1 Task 1.6。

#### 验证

- `npx vitest run tests/adapters/navigation.test.js --environment jsdom`：通过，`9` 项测试通过。
- `npx vitest run tests/adapters/storage.test.js tests/adapters/navigation.test.js --environment jsdom`：通过，`19` 项测试通过。
- `npx vitest run tests/navigation.test.js --environment jsdom`：通过。
- `node scripts/validate-data.js`：仍存在 Phase 0 基线中已记录的 `nouns.json` 数据错误，本任务未修改数据文件。
- `npx vitest run tests --environment jsdom`：新增的 `tests/adapters/navigation.test.js` 通过；全量 tracked tests 仍存在 Phase 0 基线中已记录的 `tests/app-static-data.test.js`、`tests/film.test.js`、`tests/resources-structure.test.js` 失败，本任务未修改相关模块。

### Phase 1 Task 1.1：storage adapter

- 新增 `src/js/adapters/storage.js`，封装 Web LocalStorage 读写与删除能力。
- 新增 `tests/adapters/storage.test.js`，覆盖 JSON、字符串、fallback、读写异常和删除异常。
- 保持 `window.storageAPI.getStoredJSON`、`setStoredJSON`、`getStoredString`、`setStoredString` 兼容。
- 新增 `window.storageAPI.removeStoredItem` 和 `window.storageAPI.removeItem` 删除接口。
- 本任务未改动业务模块；业务模块统一接入 adapter 留到 Phase 1 Task 1.6。

#### 验证

- `npx vitest run tests/adapters/storage.test.js --environment jsdom`：通过，`10` 项测试通过。
- `npx vitest run tests/checkin.test.js tests/navigation.test.js tests/utils/html.test.js --environment jsdom`：通过，`8` 项测试通过。
- `node scripts/validate-data.js`：仍存在 Phase 0 基线中已记录的 `nouns.json` 数据错误，本任务未修改数据文件。
- `npx vitest run --environment jsdom`：新增的 `tests/adapters/storage.test.js` 通过；全量测试仍存在 Phase 0 基线中已记录的 `tests/app-static-data.test.js`、`tests/film.test.js`、`tests/resources-structure.test.js` 失败，本任务未修改相关模块。

## 2026-06-10 测试与数据校验基线

- 建立测试与数据校验基线。
