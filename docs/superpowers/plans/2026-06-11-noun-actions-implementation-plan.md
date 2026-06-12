# Noun Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent noun favorite and learned-state actions for Phase 2 Task 2.2.

**Architecture:** Keep noun actions inside `src/js/noun.js`, matching the existing ES5 IIFE/global API pattern. Persist favorite noun names to `xds_favorites` and learned records to `xds_learned` through `window.storageAPI` only, and render UI state from those persisted values whenever cards or details are drawn.

**Tech Stack:** Native ES5 JavaScript IIFE, DOM APIs, `window.storageAPI`, `window.navigationAPI.showToast`, Vitest, jsdom.

---

## File Structure

- Create: `tests/noun-actions.test.js`
  - Responsibility: TDD coverage for favorite toggling, favorite UI restore, learned marking, learned UI restore, and storage-adapter-missing safety.
- Modify: `src/js/noun.js`
  - Responsibility: store/read noun favorite and learned state through `storageAPI`; update card star state; render detail learned action; expose action APIs for tests and inline handlers.
- Modify: `CHANGELOG.md`
  - Responsibility: record Phase 2 Task 2.2 behavior and validation results.

---

### Task 1: Add failing noun action tests

**Files:**
- Create: `tests/noun-actions.test.js`

- [ ] **Step 1: Write the failing test file**

Create `tests/noun-actions.test.js` with this complete content:

```js
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

function mountNounDOM() {
  mountDOM(`
    <input id="noun-search-input" />
    <div class="nc" id="noun-grid"></div>
    <div id="noun-detail" class="nd">
      <h2 id="nd-title"></h2>
      <div id="nd-meta"></div>
      <p id="nd-text"></p>
      <div class="mp"></div>
      <div id="nd-related"></div>
    </div>
    <div id="toast"></div>
  `);
}

const NOUNS = {
  '郡县制': {
    text: '秦统一后在全国推行郡县制，地方长官由中央任免，行政权力不再世袭。',
    related: ['分封制', '商鞅变法'],
    dynasty: '秦朝',
    category: '制度',
    map: '秦统一后的郡县分布示意',
    year: '前221年'
  },
  '科举制': {
    text: '科举制是隋唐以后通过考试选拔官员的制度。',
    related: ['三省六部制', '军机处'],
    dynasty: '隋唐',
    category: '制度',
    map: '唐代贡举入京路线示意',
    year: '605年'
  }
};

function createStorageMock(initial) {
  var store = initial || {};

  return {
    getStoredJSON: vi.fn(function (key, fallbackValue) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : fallbackValue;
    }),
    setStoredJSON: vi.fn(function (key, value) {
      store[key] = value;
      return true;
    }),
    getStore: function () {
      return store;
    }
  };
}

beforeEach(() => {
  vi.resetModules();
  resetGlobals();
  mountNounDOM();
  window.navigationAPI = { showToast: vi.fn() };
  window.storageAPI = createStorageMock();
  window.htmlUtils = {
    escapeHtml(value) {
      if (value === null || typeof value === 'undefined') return '';
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  };
});

describe('noun favorite actions', () => {
  test('togNounFav stores a favorite noun and updates the clicked button', async () => {
    await import('../src/js/noun.js');
    window.nounAPI.setNounData(NOUNS);

    var button = document.querySelector('#noun-grid .nfav');
    window.nounAPI.togNounFav(button, '郡县制');

    expect(window.storageAPI.setStoredJSON).toHaveBeenCalledWith('xds_favorites', ['郡县制']);
    expect(button.classList.contains('faved')).toBe(true);
    expect(button.textContent).toBe('★');
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('已收藏「郡县制」');
  });

  test('togNounFav removes an existing favorite noun', async () => {
    window.storageAPI = createStorageMock({ xds_favorites: ['郡县制'] });
    await import('../src/js/noun.js');
    window.nounAPI.setNounData(NOUNS);

    var button = document.querySelector('#noun-grid .nfav');
    window.nounAPI.togNounFav(button, '郡县制');

    expect(window.storageAPI.setStoredJSON).toHaveBeenCalledWith('xds_favorites', []);
    expect(button.classList.contains('faved')).toBe(false);
    expect(button.textContent).toBe('☆');
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('已取消收藏「郡县制」');
  });

  test('renderNounCards restores favorite star state from storage', async () => {
    window.storageAPI = createStorageMock({ xds_favorites: ['科举制'] });
    await import('../src/js/noun.js');

    window.nounAPI.setNounData(NOUNS);

    var buttons = document.querySelectorAll('#noun-grid .nfav');
    expect(buttons[0].textContent).toBe('☆');
    expect(buttons[0].classList.contains('faved')).toBe(false);
    expect(buttons[1].textContent).toBe('★');
    expect(buttons[1].classList.contains('faved')).toBe(true);
  });
});

describe('noun learned actions', () => {
  test('openNounDet renders a mark learned button for unlearned nouns', async () => {
    await import('../src/js/noun.js');
    window.nounAPI.setNounData(NOUNS);

    window.nounAPI.openNounDet('郡县制');

    var button = document.getElementById('nd-learned-btn');
    expect(button).toBeTruthy();
    expect(button.textContent).toBe('标记已学');
    expect(button.classList.contains('learned')).toBe(false);
  });

  test('markNounLearned stores learned record with timestamp and updates detail button', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-11T12:00:00.000Z'));

    await import('../src/js/noun.js');
    window.nounAPI.setNounData(NOUNS);
    window.nounAPI.openNounDet('郡县制');

    window.nounAPI.markNounLearned('郡县制');

    expect(window.storageAPI.setStoredJSON).toHaveBeenCalledWith('xds_learned', {
      '郡县制': {
        name: '郡县制',
        learnedAt: '2026-06-11T12:00:00.000Z'
      }
    });
    expect(document.getElementById('nd-learned-btn').textContent).toBe('已学');
    expect(document.getElementById('nd-learned-btn').classList.contains('learned')).toBe(true);
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('已标记「郡县制」为已学');

    vi.useRealTimers();
  });

  test('openNounDet restores learned button state from storage', async () => {
    window.storageAPI = createStorageMock({
      xds_learned: {
        '科举制': {
          name: '科举制',
          learnedAt: '2026-06-11T12:00:00.000Z'
        }
      }
    });
    await import('../src/js/noun.js');
    window.nounAPI.setNounData(NOUNS);

    window.nounAPI.openNounDet('科举制');

    var button = document.getElementById('nd-learned-btn');
    expect(button.textContent).toBe('已学');
    expect(button.classList.contains('learned')).toBe(true);
  });

  test('noun action APIs do not throw when storageAPI is unavailable', async () => {
    delete window.storageAPI;
    await import('../src/js/noun.js');
    window.nounAPI.setNounData(NOUNS);

    expect(function () {
      window.nounAPI.toggleNounFavorite('郡县制');
      window.nounAPI.markNounLearned('郡县制');
      window.nounAPI.renderNounCards();
      window.nounAPI.openNounDet('郡县制');
    }).not.toThrow();

    expect(window.nounAPI.getFavoriteNouns()).toEqual([]);
    expect(window.nounAPI.getLearnedNouns()).toEqual({});
  });
});
```

- [ ] **Step 2: Run the new tests to verify RED**

Run:

```powershell
npx vitest run tests/noun-actions.test.js --environment jsdom
```

Expected: FAIL because `getFavoriteNouns`, `toggleNounFavorite`, `getLearnedNouns`, `markNounLearned`, and `#nd-learned-btn` are not implemented.

---

### Task 2: Implement storage-backed favorite actions

**Files:**
- Modify: `src/js/noun.js`
- Test: `tests/noun-actions.test.js`

- [ ] **Step 1: Add storage constants and safe helpers**

In `src/js/noun.js`, immediately after `var nounData = {};`, add:

```js
  var FAV_KEY = 'xds_favorites';
  var LEARNED_KEY = 'xds_learned';

  function showToast(message) {
    if (window.navigationAPI && typeof window.navigationAPI.showToast === 'function') {
      window.navigationAPI.showToast(message);
    }
  }

  function readStoredJSON(key, fallbackValue) {
    if (!window.storageAPI || typeof window.storageAPI.getStoredJSON !== 'function') {
      return fallbackValue;
    }

    return window.storageAPI.getStoredJSON(key, fallbackValue);
  }

  function writeStoredJSON(key, value) {
    if (!window.storageAPI || typeof window.storageAPI.setStoredJSON !== 'function') {
      return false;
    }

    return window.storageAPI.setStoredJSON(key, value);
  }

  function normalizeFavoriteList(value) {
    return Array.isArray(value) ? value.filter(function (item, index, list) {
      return item && list.indexOf(item) === index;
    }) : [];
  }

  function normalizeLearnedMap(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function getFavoriteNouns() {
    return normalizeFavoriteList(readStoredJSON(FAV_KEY, []));
  }

  function setFavoriteNouns(list) {
    return writeStoredJSON(FAV_KEY, normalizeFavoriteList(list));
  }

  function isNounFavorite(name) {
    return getFavoriteNouns().indexOf(name) !== -1;
  }

  function getLearnedNouns() {
    return normalizeLearnedMap(readStoredJSON(LEARNED_KEY, {}));
  }

  function setLearnedNouns(map) {
    return writeStoredJSON(LEARNED_KEY, normalizeLearnedMap(map));
  }

  function isNounLearned(name) {
    return !!getLearnedNouns()[name];
  }
```

- [ ] **Step 2: Add favorite state rendering inside `renderNounCards`**

In `renderNounCards`, replace this block:

```js
      var safeName = escapeJSString(name);

      return '<div class="ncard" onclick="openNounDet(\'' + safeName + '\')">' +
```

with:

```js
      var safeName = escapeJSString(name);
      var favorite = isNounFavorite(name);
      var favClass = favorite ? 'nfav faved' : 'nfav';
      var favText = favorite ? '★' : '☆';

      return '<div class="ncard" onclick="openNounDet(\'' + safeName + '\')">' +
```

Then replace the favorite button line:

```js
            '<button class="nfav" onclick="event.stopPropagation();togNounFav(this,\'' + safeName + '\')">☆</button>' +
```

with:

```js
            '<button class="' + favClass + '" onclick="event.stopPropagation();togNounFav(this,\'' + safeName + '\')">' + favText + '</button>' +
```

- [ ] **Step 3: Replace `togNounFav` with persistent favorite functions**

In `src/js/noun.js`, replace the existing `togNounFav` function with:

```js
  function toggleNounFavorite(name) {
    var list = getFavoriteNouns();
    var index = list.indexOf(name);
    var added;

    if (index === -1) {
      list.push(name);
      added = true;
    } else {
      list.splice(index, 1);
      added = false;
    }

    setFavoriteNouns(list);
    return added;
  }

  function updateFavoriteButton(btn, name) {
    if (!btn) return;

    if (isNounFavorite(name)) {
      btn.classList.add('faved');
      btn.textContent = '★';
    } else {
      btn.classList.remove('faved');
      btn.textContent = '☆';
    }
  }

  function togNounFav(btn, name) {
    var added = toggleNounFavorite(name);
    updateFavoriteButton(btn, name);

    if (added) {
      showToast('已收藏「' + name + '」');
    } else {
      showToast('已取消收藏「' + name + '」');
    }
  }
```

- [ ] **Step 4: Expose favorite APIs**

In `window.nounAPI`, add these properties before `openNounDet`:

```js
    getFavoriteNouns: getFavoriteNouns,
    toggleNounFavorite: toggleNounFavorite,
    isNounFavorite: isNounFavorite,
```

The resulting API block should include:

```js
  window.nounAPI = {
    setNounData: setNounData,
    getNoun: getNoun,
    getNounNames: getNounNames,
    renderNounCards: renderNounCards,
    getFavoriteNouns: getFavoriteNouns,
    toggleNounFavorite: toggleNounFavorite,
    isNounFavorite: isNounFavorite,
    openNounDet: openNounDet,
    closeNounDet: closeNounDet,
    togNounFav: togNounFav,
    shareNoun: shareNoun,
    searchNouns: searchNouns
  };
```

- [ ] **Step 5: Run favorite action tests**

Run:

```powershell
npx vitest run tests/noun-actions.test.js --environment jsdom
```

Expected: favorite tests PASS; learned action tests still FAIL because learned actions are not implemented yet.

---

### Task 3: Implement learned-state detail action

**Files:**
- Modify: `src/js/noun.js`
- Test: `tests/noun-actions.test.js`

- [ ] **Step 1: Add detail action container helper**

In `src/js/noun.js`, add this function before `openNounDet`:

```js
  function getDetailActionsContainer() {
    var meta = document.getElementById('nd-meta');
    var container = document.getElementById('nd-actions');

    if (container) {
      return container;
    }

    container = document.createElement('div');
    container.id = 'nd-actions';
    container.style.padding = '0 16px 12px';

    if (meta && meta.parentNode) {
      meta.parentNode.insertBefore(container, meta.nextSibling);
    }

    return container;
  }
```

- [ ] **Step 2: Add learned action functions**

In `src/js/noun.js`, add these functions before `openNounDet`:

```js
  function renderLearnedAction(name) {
    var container = getDetailActionsContainer();
    var learned = isNounLearned(name);

    if (!container) return;

    container.innerHTML = '';

    var button = document.createElement('button');
    button.id = 'nd-learned-btn';
    button.className = learned ? 'learned' : '';
    button.textContent = learned ? '已学' : '标记已学';
    button.style.padding = '8px 14px';
    button.style.border = 'none';
    button.style.borderRadius = '999px';
    button.style.background = learned ? '#7EBDA6' : '#C9A96E';
    button.style.color = '#fff';
    button.style.fontSize = '13px';
    button.style.cursor = learned ? 'default' : 'pointer';
    button.onclick = function () {
      markNounLearned(name);
    };

    container.appendChild(button);
  }

  function markNounLearned(name) {
    var learned = getLearnedNouns();

    if (!learned[name]) {
      learned[name] = {
        name: name,
        learnedAt: new Date().toISOString()
      };
      setLearnedNouns(learned);
      showToast('已标记「' + name + '」为已学');
    }

    renderLearnedAction(name);
    return learned[name];
  }
```

- [ ] **Step 3: Render learned action from `openNounDet`**

In `openNounDet`, after this existing line:

```js
    renderMeta(d);
```

add:

```js
    renderLearnedAction(name);
```

- [ ] **Step 4: Expose learned APIs**

In `window.nounAPI`, add these properties after `isNounFavorite`:

```js
    getLearnedNouns: getLearnedNouns,
    markNounLearned: markNounLearned,
    isNounLearned: isNounLearned,
```

The resulting API block should include:

```js
  window.nounAPI = {
    setNounData: setNounData,
    getNoun: getNoun,
    getNounNames: getNounNames,
    renderNounCards: renderNounCards,
    getFavoriteNouns: getFavoriteNouns,
    toggleNounFavorite: toggleNounFavorite,
    isNounFavorite: isNounFavorite,
    getLearnedNouns: getLearnedNouns,
    markNounLearned: markNounLearned,
    isNounLearned: isNounLearned,
    openNounDet: openNounDet,
    closeNounDet: closeNounDet,
    togNounFav: togNounFav,
    shareNoun: shareNoun,
    searchNouns: searchNouns
  };
```

- [ ] **Step 5: Run noun action tests**

Run:

```powershell
npx vitest run tests/noun-actions.test.js --environment jsdom
```

Expected: PASS.

---

### Task 4: Run noun regression tests and update changelog

**Files:**
- Modify: `CHANGELOG.md`
- Test: `tests/noun.test.js`
- Test: `tests/noun-actions.test.js`

- [ ] **Step 1: Run noun-focused tests**

Run:

```powershell
npx vitest run tests/noun.test.js tests/noun-actions.test.js --environment jsdom
```

Expected: PASS.

- [ ] **Step 2: Update `CHANGELOG.md`**

Insert this section under `## 2026-06-11`, above the Task 2.1 entry:

```md
### Phase 2 Task 2.2：名词收藏与标记已学

- 更新 `src/js/noun.js`，通过 `storageAPI` 将名词收藏状态持久化到 `xds_favorites`。
- 名词卡片渲染时会从持久化状态恢复星标，收藏/取消收藏会同步更新按钮和 Toast。
- 详情页新增“标记已学 / 已学”按钮，通过 `storageAPI` 将学习记录持久化到 `xds_learned`，记录 `learnedAt`。
- 新增 `tests/noun-actions.test.js`，覆盖收藏写入、取消收藏、星标恢复、标记已学、已学状态恢复和 storage adapter 缺失降级。

#### 验证

- `npx vitest run tests/noun.test.js tests/noun-actions.test.js --environment jsdom`：通过。
```

- [ ] **Step 3: Run noun-focused tests again**

Run:

```powershell
npx vitest run tests/noun.test.js tests/noun-actions.test.js --environment jsdom
```

Expected: PASS.

---

### Task 5: Final validation and optional commit

**Files:**
- Modify: `src/js/noun.js`
- Modify: `CHANGELOG.md`
- Create: `tests/noun-actions.test.js`

- [ ] **Step 1: Run data validation**

Run:

```powershell
node scripts/validate-data.js
```

Expected: `0 ERROR`. Existing WARN entries for `people.json` centers structure and missing `questions.json` may remain.

- [ ] **Step 2: Run the full test suite**

Run:

```powershell
npx vitest run --environment jsdom
```

Expected: PASS.

- [ ] **Step 3: Inspect changed files**

Run:

```powershell
git status --short
git diff --stat -- src/js/noun.js tests/noun-actions.test.js CHANGELOG.md
```

Expected: Task 2.2 changes appear in `src/js/noun.js`, `tests/noun-actions.test.js`, and `CHANGELOG.md`. Pre-existing unrelated files may remain in the working tree and should not be staged for this task.

- [ ] **Step 4: Stage only Task 2.2 files if the user authorizes a commit**

Run only after explicit commit approval:

```powershell
git add -- src/js/noun.js tests/noun-actions.test.js CHANGELOG.md
```

Expected: no command output.

- [ ] **Step 5: Commit Task 2.2 if the user authorizes a commit**

Run only after explicit commit approval:

```powershell
git commit -m "feat: persist noun favorites and learned status"
```

Expected: a commit is created with only Task 2.2 files.

- [ ] **Step 6: Report completion**

Report these facts:

```text
Task 2.2 complete.
Noun favorites persist to xds_favorites through storageAPI.
Learned noun records persist to xds_learned through storageAPI.
Card stars and detail learned button restore from persisted state.
Focused noun action tests, data validation, and full Vitest suite pass.
```
