# Storage Adapter Task 1.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the Phase 1 Task 1.1 storage adapter with tests while preserving the existing `window.storageAPI` contract.

**Architecture:** Add a focused adapter module at `src/js/adapters/storage.js` that wraps `window.localStorage` behind safe JSON/string helpers and remove helpers. The adapter exposes `window.storageAPI` using the existing method names so current modules can migrate without behavior changes, and it adds aliases for remove behavior needed by Phase 1.

**Tech Stack:** ES5-style browser JavaScript IIFE, `window.storageAPI`, `localStorage`, Vitest, jsdom.

---

## File Structure

- Create: `src/js/adapters/storage.js`
  - Owns all Web LocalStorage access for the new adapter layer.
  - Exposes `window.storageAPI`.
  - Keeps existing methods: `getStoredJSON`, `setStoredJSON`, `getStoredString`, `setStoredString`.
  - Adds remove methods: `removeStoredItem`, `removeItem`.
  - Catches all storage and JSON errors.

- Create: `tests/adapters/storage.test.js`
  - Verifies JSON mode, string mode, fallback behavior, write failures, read failures, and remove behavior.
  - Uses a local mock storage object instead of relying on browser state.

- Modify: `CHANGELOG.md`
  - Add a `Phase 1 / Task 1.1` entry with commands run and result.

- Do not modify in this task:
  - `src/js/storage.js`
  - `src/js/app.js`
  - `src/js/checkin.js`
  - Any business module

Those wiring changes belong to Phase 1 Task 1.6.

---

### Task 1: Add failing storage adapter tests

**Files:**
- Create: `tests/adapters/storage.test.js`

- [ ] **Step 1: Create the test directory if needed**

PowerShell:

```powershell
if (-not (Test-Path "tests/adapters")) { New-Item -ItemType Directory -Path "tests/adapters" }
```

Expected: directory exists at `tests/adapters`.

- [ ] **Step 2: Write the failing test file**

Create `tests/adapters/storage.test.js` with this complete content:

```js
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { makeStorageMock, resetGlobals } from '../helpers/dom-test-utils.js';

function installStorageMock(storage) {
  Object.defineProperty(window, 'localStorage', {
    value: storage,
    configurable: true
  });
}

beforeEach(() => {
  vi.resetModules();
  resetGlobals();
  installStorageMock(makeStorageMock());
});

describe('storage adapter', () => {
  test('writes and reads JSON values', async () => {
    await import('../../src/js/adapters/storage.js');

    var saved = window.storageAPI.setStoredJSON('xds_test_json', { count: 2 });
    var value = window.storageAPI.getStoredJSON('xds_test_json', { count: 0 });

    expect(saved).toBe(true);
    expect(value).toEqual({ count: 2 });
  });

  test('returns fallback when JSON key is missing', async () => {
    await import('../../src/js/adapters/storage.js');

    expect(window.storageAPI.getStoredJSON('missing_key', ['fallback'])).toEqual(['fallback']);
  });

  test('returns fallback when stored JSON is invalid', async () => {
    window.localStorage.setItem('broken_json', '{not valid json');
    var errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../src/js/adapters/storage.js');

    expect(window.storageAPI.getStoredJSON('broken_json', { safe: true })).toEqual({ safe: true });
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  test('writes and reads string values', async () => {
    await import('../../src/js/adapters/storage.js');

    var saved = window.storageAPI.setStoredString('xds_test_string', '学的是史');
    var value = window.storageAPI.getStoredString('xds_test_string', 'fallback');

    expect(saved).toBe(true);
    expect(value).toBe('学的是史');
  });

  test('returns fallback when string key is missing', async () => {
    await import('../../src/js/adapters/storage.js');

    expect(window.storageAPI.getStoredString('missing_string', 'fallback')).toBe('fallback');
  });

  test('returns false when JSON write throws', async () => {
    var failingStorage = makeStorageMock();
    failingStorage.setItem = function () {
      throw new Error('quota exceeded');
    };
    installStorageMock(failingStorage);
    var errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../src/js/adapters/storage.js');

    expect(window.storageAPI.setStoredJSON('xds_fail', { ok: false })).toBe(false);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  test('returns false when string write throws', async () => {
    var failingStorage = makeStorageMock();
    failingStorage.setItem = function () {
      throw new Error('quota exceeded');
    };
    installStorageMock(failingStorage);
    var errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../src/js/adapters/storage.js');

    expect(window.storageAPI.setStoredString('xds_fail', 'value')).toBe(false);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  test('returns fallback when localStorage read throws', async () => {
    var failingStorage = makeStorageMock();
    failingStorage.getItem = function () {
      throw new Error('read blocked');
    };
    installStorageMock(failingStorage);
    var errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../src/js/adapters/storage.js');

    expect(window.storageAPI.getStoredJSON('xds_fail', { fallback: true })).toEqual({ fallback: true });
    expect(window.storageAPI.getStoredString('xds_fail', 'fallback')).toBe('fallback');
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  test('removes a stored item through both remove method names', async () => {
    await import('../../src/js/adapters/storage.js');

    window.storageAPI.setStoredString('xds_remove_one', 'value');
    window.storageAPI.setStoredString('xds_remove_two', 'value');

    expect(window.storageAPI.removeStoredItem('xds_remove_one')).toBe(true);
    expect(window.storageAPI.removeItem('xds_remove_two')).toBe(true);
    expect(window.storageAPI.getStoredString('xds_remove_one', 'fallback')).toBe('fallback');
    expect(window.storageAPI.getStoredString('xds_remove_two', 'fallback')).toBe('fallback');
  });

  test('returns false when remove throws', async () => {
    var failingStorage = makeStorageMock();
    failingStorage.removeItem = function () {
      throw new Error('remove blocked');
    };
    installStorageMock(failingStorage);
    var errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../src/js/adapters/storage.js');

    expect(window.storageAPI.removeStoredItem('xds_fail')).toBe(false);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
```

- [ ] **Step 3: Run the adapter test to verify it fails because the module does not exist**

PowerShell:

```powershell
npx vitest run tests/adapters/storage.test.js --environment jsdom
```

Expected: FAIL with an import error similar to:

```text
Failed to resolve import "../../src/js/adapters/storage.js"
```

---

### Task 2: Implement the storage adapter

**Files:**
- Create: `src/js/adapters/storage.js`
- Test: `tests/adapters/storage.test.js`

- [ ] **Step 1: Create the adapter directory if needed**

PowerShell:

```powershell
if (-not (Test-Path "src/js/adapters")) { New-Item -ItemType Directory -Path "src/js/adapters" }
```

Expected: directory exists at `src/js/adapters`.

- [ ] **Step 2: Write the complete adapter module**

Create `src/js/adapters/storage.js` with this complete content:

```js
(function () {
  function getStoredJSON(key, fallbackValue) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallbackValue;
    } catch (error) {
      console.error('storageAdapter.getStoredJSON failed:', key, error);
      return fallbackValue;
    }
  }

  function setStoredJSON(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('storageAdapter.setStoredJSON failed:', key, error);
      return false;
    }
  }

  function getStoredString(key, fallbackValue) {
    try {
      var value = window.localStorage.getItem(key);
      return value === null ? fallbackValue : value;
    } catch (error) {
      console.error('storageAdapter.getStoredString failed:', key, error);
      return fallbackValue;
    }
  }

  function setStoredString(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('storageAdapter.setStoredString failed:', key, error);
      return false;
    }
  }

  function removeStoredItem(key) {
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('storageAdapter.removeStoredItem failed:', key, error);
      return false;
    }
  }

  window.storageAPI = {
    getStoredJSON: getStoredJSON,
    setStoredJSON: setStoredJSON,
    getStoredString: getStoredString,
    setStoredString: setStoredString,
    removeStoredItem: removeStoredItem,
    removeItem: removeStoredItem
  };
})();
```

Implementation notes:

- Use `window.localStorage`, not bare `localStorage`, so tests can replace the dependency directly.
- Keep ES5-compatible style: `var`, plain functions, IIFE.
- Keep method names stable for existing modules.
- `removeItem` is an alias for the adapter API shape requested by the Phase 1 plan.
- `removeStoredItem` is the project-style explicit name and avoids confusion with raw `localStorage.removeItem`.

- [ ] **Step 3: Run the adapter test to verify it passes**

PowerShell:

```powershell
npx vitest run tests/adapters/storage.test.js --environment jsdom
```

Expected: PASS. Expected summary should show `10` tests passing in `tests/adapters/storage.test.js`.

- [ ] **Step 4: Run the existing storage-adjacent tests for regression coverage**

PowerShell:

```powershell
npx vitest run tests/checkin.test.js tests/navigation.test.js tests/utils/html.test.js --environment jsdom
```

Expected: PASS. These tests verify the new adapter file did not disturb existing global setup patterns.

---

### Task 3: Update changelog and run validation commands

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add a Phase 1 Task 1.1 changelog entry**

Insert this section above the existing `## 2026-06-10` section in `CHANGELOG.md`:

```md
## 2026-06-11

### Phase 1 Task 1.1：storage adapter

- 新增 `src/js/adapters/storage.js`，封装 Web LocalStorage 读写与删除能力。
- 新增 `tests/adapters/storage.test.js`，覆盖 JSON、字符串、fallback、读写异常和删除异常。
- 保持 `window.storageAPI.getStoredJSON`、`setStoredJSON`、`getStoredString`、`setStoredString` 兼容。
- 新增 `window.storageAPI.removeStoredItem` 和 `window.storageAPI.removeItem` 删除接口。
- 本任务未改动业务模块；业务模块统一接入 adapter 留到 Phase 1 Task 1.6。

#### 验证

- `npx vitest run tests/adapters/storage.test.js --environment jsdom`：通过。
- `npx vitest run tests/checkin.test.js tests/navigation.test.js tests/utils/html.test.js --environment jsdom`：通过。
```

- [ ] **Step 2: Run the focused adapter test again**

PowerShell:

```powershell
npx vitest run tests/adapters/storage.test.js --environment jsdom
```

Expected: PASS.

- [ ] **Step 3: Run the required data validation script**

PowerShell:

```powershell
node scripts/validate-data.js
```

Expected for the current baseline: command may exit non-zero because the existing Phase 0 baseline recorded `nouns.json` validation errors. If it fails, confirm the errors match the existing baseline categories in `CHANGELOG.md`: missing `dynasty`, missing `category`, and `related` targets not found. Do not fix those in Task 1.1.

- [ ] **Step 4: Run the full test suite and record the result**

PowerShell:

```powershell
npx vitest run --environment jsdom
```

Expected for the current baseline: command may exit non-zero because the existing Phase 0 baseline recorded failures in `tests/app-static-data.test.js`, `tests/film.test.js`, and `tests/resources-structure.test.js`. Do not fix those in Task 1.1. If new failures appear in `tests/adapters/storage.test.js`, fix the adapter before continuing.

- [ ] **Step 5: If validation or full test output differs from baseline, update the changelog verification text**

Use this exact replacement format under `#### 验证` if baseline failures remain:

```md
#### 验证

- `npx vitest run tests/adapters/storage.test.js --environment jsdom`：通过。
- `npx vitest run tests/checkin.test.js tests/navigation.test.js tests/utils/html.test.js --environment jsdom`：通过。
- `node scripts/validate-data.js`：仍存在 Phase 0 基线中已记录的 `nouns.json` 数据错误，本任务未修改数据文件。
- `npx vitest run --environment jsdom`：仍存在 Phase 0 基线中已记录的静态数据/影视/资源结构失败，本任务未修改相关模块。
```

---

### Task 4: Final review and commit

**Files:**
- Create: `src/js/adapters/storage.js`
- Create: `tests/adapters/storage.test.js`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Check working tree changes**

PowerShell:

```powershell
git status --short
```

Expected: at minimum, these paths are changed:

```text
 M CHANGELOG.md
?? src/js/adapters/storage.js
?? tests/adapters/storage.test.js
```

Other pre-existing uncommitted files may already be present in this repository. Do not include unrelated files in the Task 1.1 commit.

- [ ] **Step 2: Review the adapter file for direct plan compliance**

Confirm `src/js/adapters/storage.js` contains all of these API keys:

```js
window.storageAPI = {
  getStoredJSON: getStoredJSON,
  setStoredJSON: setStoredJSON,
  getStoredString: getStoredString,
  setStoredString: setStoredString,
  removeStoredItem: removeStoredItem,
  removeItem: removeStoredItem
};
```

Expected: exact API keys exist.

- [ ] **Step 3: Review the test file for behavior coverage**

Confirm `tests/adapters/storage.test.js` includes tests named:

```text
writes and reads JSON values
returns fallback when JSON key is missing
returns fallback when stored JSON is invalid
writes and reads string values
returns fallback when string key is missing
returns false when JSON write throws
returns false when string write throws
returns fallback when localStorage read throws
removes a stored item through both remove method names
returns false when remove throws
```

Expected: all names exist.

- [ ] **Step 4: Stage only Task 1.1 files**

PowerShell:

```powershell
git add src/js/adapters/storage.js tests/adapters/storage.test.js CHANGELOG.md
```

Expected: only these three paths are staged for this task.

- [ ] **Step 5: Commit Task 1.1**

PowerShell:

```powershell
git commit -m "feat: add storage adapter with tests"
```

Expected: commit succeeds. Record the commit hash in the implementation report.

---

## Self-Review

- Spec coverage: The plan creates `src/js/adapters/storage.js`, creates `tests/adapters/storage.test.js`, preserves the existing `window.storageAPI` JSON/string methods, adds remove capability, catches read/write/remove errors, and updates `CHANGELOG.md`.
- Scope check: This plan intentionally excludes business-module wiring because the Phase 1 plan assigns that to Task 1.6.
- Placeholder scan: No `TBD`, incomplete sections, or vague test instructions remain.
- Type/signature consistency: The adapter API names are consistent across implementation, tests, changelog, and final review steps.
