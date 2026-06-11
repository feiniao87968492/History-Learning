# Navigation Adapter Task 1.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the Phase 1 Task 1.2 navigation adapter with tests while preserving the existing `window.navigationAPI` contract.

**Architecture:** Add a focused adapter module at `src/js/adapters/navigation.js` that wraps the current Web DOM navigation/toast behavior behind `window.navigationAPI`. This task intentionally does not wire business modules to the adapter; it creates and tests the adapter boundary so Task 1.6 can migrate consumers later.

**Tech Stack:** ES5-style browser JavaScript IIFE, DOM class toggling, `setTimeout`/`clearTimeout`, Vitest, jsdom fake timers.

---

## File Structure

- Create: `src/js/adapters/navigation.js`
  - Owns Web page/subpage class toggling and toast display for the adapter layer.
  - Exposes `window.navigationAPI`.
  - Keeps existing methods: `resetAIFab`, `showToast`, `login`, `openSub`, `closeSub`.
  - Adds optional `duration` argument to `showToast(message, duration)` while keeping the default `2000` ms behavior.
  - Catches missing DOM nodes by no-op checks, not exceptions.

- Create: `tests/adapters/navigation.test.js`
  - Verifies toast text, show/hide timing, timer reset, login DOM transitions, subpage open/close, page target close behavior, and missing-node safety.
  - Uses jsdom and fake timers.

- Modify: `CHANGELOG.md`
  - Add a `Phase 1 Task 1.2` entry with commands run and result.

- Do not modify in this task:
  - `src/js/navigation.js`
  - `src/js/app.js`
  - `index.html`
  - Any business module

Those wiring changes belong to Phase 1 Task 1.6.

---

### Task 1: Add failing navigation adapter tests

**Files:**
- Create: `tests/adapters/navigation.test.js`

- [ ] **Step 1: Ensure the adapter test directory exists**

PowerShell:

```powershell
if (-not (Test-Path "tests/adapters")) { New-Item -ItemType Directory -Path "tests/adapters" }
```

Expected: directory exists at `tests/adapters`.

- [ ] **Step 2: Write the failing test file**

Create `tests/adapters/navigation.test.js` with this complete content:

```js
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from '../helpers/dom-test-utils.js';

function mountNavigationDOM() {
  mountDOM(`
    <div id="login-page" class="page active"></div>
    <div id="home-page" class="page"></div>
    <div id="profile-page" class="page"></div>
    <div id="noun-page" class="sub"></div>
    <div id="timeline-page" class="sub act"></div>
    <div id="bnav" style="display:none"></div>
    <div id="ai-fab" style="top: 20px; left: 30px; bottom: 40px; right: 50px;"></div>
    <div id="toast"></div>
  `);
}

beforeEach(() => {
  vi.resetModules();
  resetGlobals();
  vi.useFakeTimers();
  mountNavigationDOM();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('navigation adapter', () => {
  test('shows toast text and hides it after the default duration', async () => {
    await import('../../src/js/adapters/navigation.js');

    window.navigationAPI.showToast('欢迎学习');

    expect(document.getElementById('toast').textContent).toBe('欢迎学习');
    expect(document.getElementById('toast').classList.contains('sh')).toBe(true);

    vi.advanceTimersByTime(1999);
    expect(document.getElementById('toast').classList.contains('sh')).toBe(true);

    vi.advanceTimersByTime(1);
    expect(document.getElementById('toast').classList.contains('sh')).toBe(false);
  });

  test('uses custom toast duration and resets previous timer', async () => {
    await import('../../src/js/adapters/navigation.js');

    window.navigationAPI.showToast('第一次', 1000);
    vi.advanceTimersByTime(500);
    window.navigationAPI.showToast('第二次', 1000);
    vi.advanceTimersByTime(600);

    expect(document.getElementById('toast').textContent).toBe('第二次');
    expect(document.getElementById('toast').classList.contains('sh')).toBe(true);

    vi.advanceTimersByTime(400);
    expect(document.getElementById('toast').classList.contains('sh')).toBe(false);
  });

  test('login switches from login page to home page and shows shell UI', async () => {
    await import('../../src/js/adapters/navigation.js');

    window.navigationAPI.login();

    expect(document.getElementById('login-page').classList.contains('active')).toBe(false);
    expect(document.getElementById('home-page').classList.contains('active')).toBe(true);
    expect(document.getElementById('ai-fab').classList.contains('sh')).toBe(true);
    expect(document.getElementById('bnav').style.display).toBe('flex');
    expect(document.getElementById('toast').textContent).toBe('欢迎回来，历史学习者！');
  });

  test('resetAIFab clears dragged inline positioning', async () => {
    await import('../../src/js/adapters/navigation.js');

    window.navigationAPI.resetAIFab();

    expect(document.getElementById('ai-fab').style.top).toBe('auto');
    expect(document.getElementById('ai-fab').style.left).toBe('auto');
    expect(document.getElementById('ai-fab').style.bottom).toBe('');
    expect(document.getElementById('ai-fab').style.right).toBe('');
  });

  test('openSub marks the requested sub panel active', async () => {
    await import('../../src/js/adapters/navigation.js');

    window.navigationAPI.openSub('noun-page');

    expect(document.getElementById('noun-page').classList.contains('act')).toBe(true);
  });

  test('closeSub closes all sub panels when no target is provided', async () => {
    await import('../../src/js/adapters/navigation.js');

    window.navigationAPI.closeSub();

    expect(document.getElementById('noun-page').classList.contains('act')).toBe(false);
    expect(document.getElementById('timeline-page').classList.contains('act')).toBe(false);
  });

  test('closeSub activates a target sub panel without changing active page', async () => {
    await import('../../src/js/adapters/navigation.js');
    document.getElementById('home-page').classList.add('active');

    window.navigationAPI.closeSub('noun-page');

    expect(document.getElementById('timeline-page').classList.contains('act')).toBe(false);
    expect(document.getElementById('noun-page').classList.contains('act')).toBe(true);
    expect(document.getElementById('home-page').classList.contains('active')).toBe(true);
  });

  test('closeSub activates a target page and deactivates other pages', async () => {
    await import('../../src/js/adapters/navigation.js');
    document.getElementById('home-page').classList.add('active');

    window.navigationAPI.closeSub('profile-page');

    expect(document.getElementById('timeline-page').classList.contains('act')).toBe(false);
    expect(document.getElementById('login-page').classList.contains('active')).toBe(false);
    expect(document.getElementById('home-page').classList.contains('active')).toBe(false);
    expect(document.getElementById('profile-page').classList.contains('active')).toBe(true);
  });

  test('missing DOM nodes do not throw', async () => {
    mountDOM('');

    await import('../../src/js/adapters/navigation.js');

    expect(function () {
      window.navigationAPI.showToast('no toast node');
      window.navigationAPI.login();
      window.navigationAPI.resetAIFab();
      window.navigationAPI.openSub('missing-page');
      window.navigationAPI.closeSub('missing-page');
    }).not.toThrow();
  });
});
```

- [ ] **Step 3: Run the adapter test to verify it fails because the module does not exist**

PowerShell:

```powershell
npx vitest run tests/adapters/navigation.test.js --environment jsdom
```

Expected: FAIL with an import error similar to:

```text
Failed to resolve import "../../src/js/adapters/navigation.js"
```

---

### Task 2: Implement the navigation adapter

**Files:**
- Create: `src/js/adapters/navigation.js`
- Test: `tests/adapters/navigation.test.js`

- [ ] **Step 1: Ensure the adapter directory exists**

PowerShell:

```powershell
if (-not (Test-Path "src/js/adapters")) { New-Item -ItemType Directory -Path "src/js/adapters" }
```

Expected: directory exists at `src/js/adapters`.

- [ ] **Step 2: Write the complete adapter module**

Create `src/js/adapters/navigation.js` with this complete content:

```js
(function () {
  var toastTimer = null;
  var DEFAULT_TOAST_DURATION = 2000;

  function resetAIFab() {
    var fab = document.getElementById('ai-fab');
    if (fab) {
      fab.style.top = 'auto';
      fab.style.left = 'auto';
      fab.style.bottom = '';
      fab.style.right = '';
    }
  }

  function showToast(message, duration) {
    var toast = document.getElementById('toast');
    var hideAfter = typeof duration === 'number' ? duration : DEFAULT_TOAST_DURATION;

    if (!toast) {
      return;
    }

    toast.textContent = message;
    toast.classList.add('sh');

    if (toastTimer) {
      clearTimeout(toastTimer);
    }

    toastTimer = setTimeout(function () {
      toast.classList.remove('sh');
    }, hideAfter);
  }

  function login() {
    var loginPage = document.getElementById('login-page');
    var homePage = document.getElementById('home-page');
    var aiFab = document.getElementById('ai-fab');
    var bottomNav = document.getElementById('bnav');

    if (loginPage) {
      loginPage.classList.remove('active');
    }
    if (homePage) {
      homePage.classList.add('active');
    }
    if (aiFab) {
      aiFab.classList.add('sh');
    }
    if (bottomNav) {
      bottomNav.style.display = 'flex';
    }

    resetAIFab();
    showToast('欢迎回来，历史学习者！');
  }

  function openSub(id) {
    var target = document.getElementById(id);
    if (target) {
      target.classList.add('act');
    }
  }

  function closeSub(id) {
    document.querySelectorAll('.sub').forEach(function (panel) {
      panel.classList.remove('act');
    });

    if (typeof id === 'string' && id) {
      var target = document.getElementById(id);
      if (target) {
        if (!target.classList.contains('sub')) {
          document.querySelectorAll('.page').forEach(function (page) {
            page.classList.remove('active');
          });
        }
        target.classList.add(target.classList.contains('sub') ? 'act' : 'active');
      }
    }
  }

  window.navigationAPI = {
    resetAIFab: resetAIFab,
    showToast: showToast,
    login: login,
    openSub: openSub,
    closeSub: closeSub
  };
})();
```

Implementation notes:

- Keep ES5-compatible style: `var`, plain functions, IIFE.
- Keep method names stable for existing modules and inline handlers.
- The optional `duration` argument is adapter-only backward-compatible behavior. Existing callers that pass only `message` keep the 2000 ms behavior.
- Do not import or call `src/js/navigation.js` from this adapter. Task 1.2 creates an adapter boundary; Task 1.6 wires consumers.

- [ ] **Step 3: Run the adapter test to verify it passes**

PowerShell:

```powershell
npx vitest run tests/adapters/navigation.test.js --environment jsdom
```

Expected: PASS. Expected summary should show `9` tests passing in `tests/adapters/navigation.test.js`.

- [ ] **Step 4: Run adapter-suite regression tests**

PowerShell:

```powershell
npx vitest run tests/adapters/storage.test.js tests/adapters/navigation.test.js --environment jsdom
```

Expected: PASS. Expected summary should show `2` test files and `19` tests passing.

- [ ] **Step 5: Run existing navigation baseline test**

PowerShell:

```powershell
npx vitest run tests/navigation.test.js --environment jsdom
```

Expected: PASS. This confirms the existing non-adapter navigation module still loads.

---

### Task 3: Update changelog and run validation commands

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add a Phase 1 Task 1.2 changelog entry**

Insert this section under the existing `## 2026-06-11` heading and above the Task 1.1 section in `CHANGELOG.md`:

```md
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
```

- [ ] **Step 2: Run the focused navigation adapter test again**

PowerShell:

```powershell
npx vitest run tests/adapters/navigation.test.js --environment jsdom
```

Expected: PASS.

- [ ] **Step 3: Run the required data validation script**

PowerShell:

```powershell
node scripts/validate-data.js
```

Expected for the current baseline: command may exit non-zero because the existing Phase 0 baseline recorded `nouns.json` validation errors. If it fails, confirm the errors match the existing baseline categories in `CHANGELOG.md`: missing `dynasty`, missing `category`, and `related` targets not found. Do not fix those in Task 1.2.

- [ ] **Step 4: Run the full test suite from tracked tests directory**

PowerShell:

```powershell
npx vitest run tests --environment jsdom
```

Expected for the current baseline: command may exit non-zero because the existing Phase 0 baseline recorded failures in `tests/app-static-data.test.js`, `tests/film.test.js`, and `tests/resources-structure.test.js`. Do not fix those in Task 1.2. If new failures appear in `tests/adapters/navigation.test.js`, fix the adapter before continuing.

- [ ] **Step 5: If validation or full test output differs from baseline, update the changelog verification text**

Use this exact replacement format under Task 1.2 `#### 验证` if baseline failures remain:

```md
#### 验证

- `npx vitest run tests/adapters/navigation.test.js --environment jsdom`：通过，`9` 项测试通过。
- `npx vitest run tests/adapters/storage.test.js tests/adapters/navigation.test.js --environment jsdom`：通过，`19` 项测试通过。
- `npx vitest run tests/navigation.test.js --environment jsdom`：通过。
- `node scripts/validate-data.js`：仍存在 Phase 0 基线中已记录的 `nouns.json` 数据错误，本任务未修改数据文件。
- `npx vitest run tests --environment jsdom`：新增的 `tests/adapters/navigation.test.js` 通过；全量 tracked tests 仍存在 Phase 0 基线中已记录的 `tests/app-static-data.test.js`、`tests/film.test.js`、`tests/resources-structure.test.js` 失败，本任务未修改相关模块。
```

---

### Task 4: Review and commit Task 1.2

**Files:**
- Create: `src/js/adapters/navigation.js`
- Create: `tests/adapters/navigation.test.js`
- Create: `docs/superpowers/plans/2026-06-11-navigation-adapter-task-1-2.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Request focused code review**

Ask a reviewer to inspect only:

```text
src/js/adapters/navigation.js
tests/adapters/navigation.test.js
CHANGELOG.md
docs/superpowers/plans/2026-06-11-navigation-adapter-task-1-2.md
```

Expected: no Critical or Important findings before commit.

- [ ] **Step 2: Check working tree changes**

PowerShell:

```powershell
git status --short CHANGELOG.md src/js/adapters/navigation.js tests/adapters/navigation.test.js docs/superpowers/plans/2026-06-11-navigation-adapter-task-1-2.md
```

Expected: at minimum, these paths are changed:

```text
 M CHANGELOG.md
?? docs/superpowers/plans/2026-06-11-navigation-adapter-task-1-2.md
?? src/js/adapters/navigation.js
?? tests/adapters/navigation.test.js
```

Other pre-existing uncommitted files may already be present in this repository. Do not include unrelated files in the Task 1.2 commit.

- [ ] **Step 3: Stage only Task 1.2 files**

Because `CHANGELOG.md` may contain pre-existing working-tree edits, stage only the intended Task 1.2 changelog entry plus the three new Task 1.2 files. If the whole `CHANGELOG.md` is safe to stage, use:

```powershell
git add CHANGELOG.md src/js/adapters/navigation.js tests/adapters/navigation.test.js docs/superpowers/plans/2026-06-11-navigation-adapter-task-1-2.md
```

If `CHANGELOG.md` contains unrelated unstaged content, stage only the exact Task 1.2 entry with an index-only patch or a temporary blob. The staged diff must show only Task 1.2 additions for `CHANGELOG.md`.

- [ ] **Step 4: Commit Task 1.2**

PowerShell:

```powershell
git commit -m "feat: add navigation adapter with tests"
```

Expected: commit succeeds. Record the commit hash in the implementation report.

---

## Self-Review

- Spec coverage: The plan creates `src/js/adapters/navigation.js`, creates `tests/adapters/navigation.test.js`, preserves the existing `window.navigationAPI` methods, adds optional toast duration, verifies DOM state transitions, updates `CHANGELOG.md`, and excludes business-module wiring.
- Scope check: This plan intentionally excludes modifying `src/js/navigation.js`, `src/js/app.js`, `index.html`, or business modules because the Phase 1 plan assigns wiring to Task 1.6.
- Placeholder scan: No `TBD`, incomplete sections, or vague test instructions remain.
- Type/signature consistency: The adapter API names are consistent across implementation, tests, changelog, and final review steps.
