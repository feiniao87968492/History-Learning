# External Link Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Task 1.4 by adding a tested Web external link adapter at `src/js/adapters/external-link.js` without changing existing business modules.

**Architecture:** The adapter exposes one stable `window.externalLinkAPI.open(url)` boundary and hides Web-specific `window.open` details from future callers. Valid URLs open in a new tab with `noopener,noreferrer`; invalid inputs and synchronous platform errors return `false`.

**Tech Stack:** Native ES5 JavaScript, IIFE modules, `window.externalLinkAPI`, Vitest, jsdom, mocked `window.open`.

---

## File Structure

- Create: `src/js/adapters/external-link.js`
  - Responsibility: wrap `window.open` and expose `window.externalLinkAPI.open(url)`.
  - Public API: `open(url)`.
- Create: `tests/adapters/external-link.test.js`
  - Responsibility: mock `window.open`, import the adapter, and verify valid, invalid, and failure paths.
- Do not modify: `index.html`
  - Reason: Task 1.4 is adapter creation only. Existing direct `window.open(...)` wiring is later Task 1.6 work.
- Do not modify: `src/js/app.js`, `src/js/film.js`, or other business modules
  - Reason: Business integration is explicitly out of scope for this task.

---

### Task 1: Add failing external link adapter tests

**Files:**
- Create: `tests/adapters/external-link.test.js`

- [ ] **Step 1: Write the failing test file**

Create `tests/adapters/external-link.test.js` with this complete content:

```js
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { resetGlobals } from '../helpers/dom-test-utils.js';

function installWindowOpenMock(implementation) {
  var openMock = vi.fn(implementation || function () {});
  Object.defineProperty(window, 'open', {
    value: openMock,
    configurable: true
  });
  return openMock;
}

beforeEach(() => {
  vi.resetModules();
  resetGlobals();
  installWindowOpenMock();
});

describe('external link adapter', () => {
  test('exposes the expected external link API method', async () => {
    await import('../../src/js/adapters/external-link.js');

    expect(window.externalLinkAPI).toEqual({
      open: expect.any(Function)
    });
  });

  test('opens a valid URL in a new browser tab with safe features', async () => {
    var openMock = installWindowOpenMock();

    await import('../../src/js/adapters/external-link.js');

    expect(window.externalLinkAPI.open('https://example.com/history')).toBe(true);
    expect(openMock).toHaveBeenCalledWith('https://example.com/history', '_blank', 'noopener,noreferrer');
    expect(openMock).toHaveBeenCalledTimes(1);
  });

  test('returns false and does not open for invalid URL inputs', async () => {
    var openMock = installWindowOpenMock();

    await import('../../src/js/adapters/external-link.js');

    expect(window.externalLinkAPI.open()).toBe(false);
    expect(window.externalLinkAPI.open(null)).toBe(false);
    expect(window.externalLinkAPI.open(123)).toBe(false);
    expect(window.externalLinkAPI.open('')).toBe(false);
    expect(window.externalLinkAPI.open('   ')).toBe(false);
    expect(openMock).not.toHaveBeenCalled();
  });

  test('logs and returns false when window.open throws synchronously', async () => {
    installWindowOpenMock(function () {
      throw new Error('popup blocked');
    });
    var errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../src/js/adapters/external-link.js');

    expect(window.externalLinkAPI.open('https://example.com/fail')).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(
      'externalLinkAdapter.open failed:',
      'https://example.com/fail',
      expect.any(Error)
    );

    errorSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```powershell
npx vitest run tests/adapters/external-link.test.js --environment jsdom
```

Expected: FAIL because `../../src/js/adapters/external-link.js` does not exist yet.

---

### Task 2: Implement the external link adapter

**Files:**
- Create: `src/js/adapters/external-link.js`
- Test: `tests/adapters/external-link.test.js`

- [ ] **Step 1: Write the minimal adapter implementation**

Create `src/js/adapters/external-link.js` with this complete content:

```js
(function () {
  function isValidUrl(url) {
    return typeof url === 'string' && url.trim() !== '';
  }

  function open(url) {
    if (!isValidUrl(url)) {
      return false;
    }

    try {
      window.open(url, '_blank', 'noopener,noreferrer');
      return true;
    } catch (error) {
      console.error('externalLinkAdapter.open failed:', url, error);
      return false;
    }
  }

  window.externalLinkAPI = {
    open: open
  };
})();
```

- [ ] **Step 2: Run the focused external link adapter test**

Run:

```powershell
npx vitest run tests/adapters/external-link.test.js --environment jsdom
```

Expected: PASS for all tests in `tests/adapters/external-link.test.js`.

- [ ] **Step 3: Run existing adapter tests plus the new test**

Run:

```powershell
npx vitest run tests/adapters/storage.test.js tests/adapters/navigation.test.js tests/adapters/audio.test.js tests/adapters/external-link.test.js --environment jsdom
```

Expected: PASS for storage, navigation, audio, and external link adapter tests.

---

### Task 3: Validate and commit Task 1.4

**Files:**
- Create: `src/js/adapters/external-link.js`
- Create: `tests/adapters/external-link.test.js`

- [ ] **Step 1: Check that only Task 1.4 implementation files are staged for this commit**

Run:

```powershell
git status --short
```

Expected: `src/js/adapters/external-link.js` and `tests/adapters/external-link.test.js` are new files. Other pre-existing working tree changes may exist, but do not stage them for this commit.

- [ ] **Step 2: Run the focused acceptance test**

Run:

```powershell
npx vitest run tests/adapters/external-link.test.js --environment jsdom
```

Expected: PASS.

- [ ] **Step 3: Stage only Task 1.4 implementation files**

Run:

```powershell
git add -- src/js/adapters/external-link.js tests/adapters/external-link.test.js
```

Expected: no command output.

- [ ] **Step 4: Commit the adapter**

Run:

```powershell
git commit -m "feat: add external link adapter with tests"
```

Expected: a commit is created with exactly the new external link adapter and its test file.

- [ ] **Step 5: Report completion**

Report these facts:

```text
Task 1.4 complete.
Created src/js/adapters/external-link.js and tests/adapters/external-link.test.js.
Focused external link adapter tests pass.
Business module integration was intentionally not changed.
```
