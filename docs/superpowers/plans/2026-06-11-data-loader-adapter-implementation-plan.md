# Data Loader Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Task 1.5 by adding a tested JSON data loader adapter at `src/js/adapters/data-loader.js` without changing `src/js/app.js` or existing business modules.

**Architecture:** The adapter exposes one stable asynchronous boundary, `window.dataLoaderAPI.loadJSON(path, fallback)`. It wraps Web `fetch(path)` and JSON parsing, returns parsed data on success, and returns the provided fallback on fetch, HTTP, or JSON parse failures.

**Tech Stack:** Native ES5 JavaScript, IIFE modules, async function, `window.dataLoaderAPI`, Vitest, jsdom, mocked `window.fetch`.

---

## File Structure

- Create: `src/js/adapters/data-loader.js`
  - Responsibility: wrap `fetch` and `response.json()` for JSON data loading.
  - Public API: `loadJSON(path, fallback)`.
- Create: `tests/adapters/data-loader.test.js`
  - Responsibility: mock `window.fetch`, import the adapter, and verify success, HTTP failure, network failure, and JSON parsing failure paths.
- Do not modify: `src/js/app.js`
  - Reason: Task 1.5 is adapter creation only. App initialization wiring is later Task 1.6 work.
- Do not modify: data files or business modules
  - Reason: Business integration and behavior changes are explicitly out of scope for this task.

---

### Task 1: Add failing data loader adapter tests

**Files:**
- Create: `tests/adapters/data-loader.test.js`

- [ ] **Step 1: Write the failing test file**

Create `tests/adapters/data-loader.test.js` with this complete content:

```js
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { resetGlobals } from '../helpers/dom-test-utils.js';

function installFetchMock(implementation) {
  var fetchMock = vi.fn(implementation || function () {
    return Promise.resolve({
      ok: true,
      json: function () {
        return Promise.resolve({});
      }
    });
  });

  Object.defineProperty(window, 'fetch', {
    value: fetchMock,
    configurable: true
  });

  return fetchMock;
}

beforeEach(() => {
  vi.resetModules();
  resetGlobals();
  installFetchMock();
});

describe('data loader adapter', () => {
  test('exposes the expected data loader API method', async () => {
    await import('../../src/js/adapters/data-loader.js');

    expect(window.dataLoaderAPI).toEqual({
      loadJSON: expect.any(Function)
    });
  });

  test('loads and returns parsed JSON data', async () => {
    var data = { title: '学的是史', count: 2 };
    var fetchMock = installFetchMock(function () {
      return Promise.resolve({
        ok: true,
        json: function () {
          return Promise.resolve(data);
        }
      });
    });

    await import('../../src/js/adapters/data-loader.js');

    var result = await window.dataLoaderAPI.loadJSON('./src/data/test.json', { fallback: true });

    expect(result).toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith('./src/data/test.json');
  });

  test('returns fallback and logs when response is not ok', async () => {
    var fallback = { safe: true };
    installFetchMock(function () {
      return Promise.resolve({
        ok: false,
        status: 404,
        json: function () {
          return Promise.resolve({ shouldNotUse: true });
        }
      });
    });
    var errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../src/js/adapters/data-loader.js');

    var result = await window.dataLoaderAPI.loadJSON('./src/data/missing.json', fallback);

    expect(result).toBe(fallback);
    expect(errorSpy).toHaveBeenCalledWith(
      'dataLoaderAdapter.loadJSON failed:',
      './src/data/missing.json',
      expect.any(Error)
    );

    errorSpy.mockRestore();
  });

  test('returns fallback and logs when fetch rejects', async () => {
    var fallback = [];
    var networkError = new Error('network down');
    installFetchMock(function () {
      return Promise.reject(networkError);
    });
    var errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../src/js/adapters/data-loader.js');

    var result = await window.dataLoaderAPI.loadJSON('./src/data/nouns.json', fallback);

    expect(result).toBe(fallback);
    expect(errorSpy).toHaveBeenCalledWith(
      'dataLoaderAdapter.loadJSON failed:',
      './src/data/nouns.json',
      networkError
    );

    errorSpy.mockRestore();
  });

  test('returns fallback and logs when JSON parsing rejects', async () => {
    var fallback = { dynasties: [], events: [] };
    var parseError = new Error('invalid json');
    installFetchMock(function () {
      return Promise.resolve({
        ok: true,
        json: function () {
          return Promise.reject(parseError);
        }
      });
    });
    var errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../src/js/adapters/data-loader.js');

    var result = await window.dataLoaderAPI.loadJSON('./src/data/timeline.json', fallback);

    expect(result).toBe(fallback);
    expect(errorSpy).toHaveBeenCalledWith(
      'dataLoaderAdapter.loadJSON failed:',
      './src/data/timeline.json',
      parseError
    );

    errorSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```powershell
npx vitest run tests/adapters/data-loader.test.js --environment jsdom
```

Expected: FAIL because `../../src/js/adapters/data-loader.js` does not exist yet.

---

### Task 2: Implement the data loader adapter

**Files:**
- Create: `src/js/adapters/data-loader.js`
- Test: `tests/adapters/data-loader.test.js`

- [ ] **Step 1: Write the minimal adapter implementation**

Create `src/js/adapters/data-loader.js` with this complete content:

```js
(function () {
  async function loadJSON(path, fallback) {
    try {
      var response = await fetch(path);
      if (!response.ok) {
        throw new Error('Failed to load data: ' + path);
      }
      return await response.json();
    } catch (error) {
      console.error('dataLoaderAdapter.loadJSON failed:', path, error);
      return fallback;
    }
  }

  window.dataLoaderAPI = {
    loadJSON: loadJSON
  };
})();
```

- [ ] **Step 2: Run the focused data loader adapter test**

Run:

```powershell
npx vitest run tests/adapters/data-loader.test.js --environment jsdom
```

Expected: PASS for all tests in `tests/adapters/data-loader.test.js`.

- [ ] **Step 3: Run existing adapter tests plus the new test**

Run:

```powershell
npx vitest run tests/adapters/storage.test.js tests/adapters/navigation.test.js tests/adapters/audio.test.js tests/adapters/external-link.test.js tests/adapters/data-loader.test.js --environment jsdom
```

Expected: PASS for storage, navigation, audio, external link, and data loader adapter tests.

---

### Task 3: Validate and commit Task 1.5

**Files:**
- Create: `src/js/adapters/data-loader.js`
- Create: `tests/adapters/data-loader.test.js`

- [ ] **Step 1: Check that only Task 1.5 implementation files are staged for this commit**

Run:

```powershell
git status --short
```

Expected: `src/js/adapters/data-loader.js` and `tests/adapters/data-loader.test.js` are new files. Other pre-existing working tree changes may exist, but do not stage them for this commit.

- [ ] **Step 2: Run the focused acceptance test**

Run:

```powershell
npx vitest run tests/adapters/data-loader.test.js --environment jsdom
```

Expected: PASS.

- [ ] **Step 3: Stage only Task 1.5 implementation files**

Run:

```powershell
git add -- src/js/adapters/data-loader.js tests/adapters/data-loader.test.js
```

Expected: no command output.

- [ ] **Step 4: Commit the adapter**

Run:

```powershell
git commit -m "feat: add data loader adapter with tests"
```

Expected: a commit is created with exactly the new data loader adapter and its test file.

- [ ] **Step 5: Report completion**

Report these facts:

```text
Task 1.5 complete.
Created src/js/adapters/data-loader.js and tests/adapters/data-loader.test.js.
Focused data loader adapter tests pass.
src/js/app.js and business module integration were intentionally not changed.
```
