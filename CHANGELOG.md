# CHANGELOG

## 2026-06-11

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
