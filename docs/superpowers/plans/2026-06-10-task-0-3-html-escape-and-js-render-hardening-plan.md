# Task 0.3 HTML Escape And JS Render Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable HTML escape utility and harden dynamic `src/js` rendering paths so user input, JSON data, and stored content no longer flow into `innerHTML` unescaped.

**Architecture:** The work stays inside the existing ES5 + IIFE structure. First add `window.htmlUtils.escapeHtml` and a small runtime bridge in `app.js`, then harden the highest-risk modules in `src/js` with focused tests. Keep `index.html` untouched and avoid broad DOM rewrites except where a local event-binding change is clearer and safer.

**Tech Stack:** ES5 JavaScript, Vitest, jsdom, Markdown, Git

---

## File Map

- Create: `src/js/utils/html.js`
- Create: `tests/utils/html.test.js`
- Create: `tests/html-hardening.test.js`
- Modify: `src/js/app.js`
- Modify: `src/js/ai-assistant.js`
- Modify: `src/js/noun.js`
- Modify: `src/js/favorites.js`
- Modify: `src/js/film.js`
- Modify: `src/js/timeline.js`
- Read: `tests/helpers/dom-test-utils.js`

---

### Task 1: Add The Shared HTML Escape Utility

**Files:**
- Create: `src/js/utils/html.js`
- Create: `tests/utils/html.test.js`
- Modify: `src/js/app.js`

- [ ] **Step 1: Write the failing utility test**

Create `tests/utils/html.test.js` with:

```js
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { resetGlobals } from '../helpers/dom-test-utils.js';

beforeEach(() => {
  vi.resetModules();
  resetGlobals();
  delete window.htmlUtils;
});

describe('htmlUtils.escapeHtml', () => {
  test('escapes script-like HTML', async () => {
    await import('../../src/js/utils/html.js');
    expect(window.htmlUtils.escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  test('keeps plain Chinese text unchanged', async () => {
    await import('../../src/js/utils/html.js');
    expect(window.htmlUtils.escapeHtml('学的是史')).toBe('学的是史');
  });

  test('escapes double and single quotes', async () => {
    await import('../../src/js/utils/html.js');
    expect(window.htmlUtils.escapeHtml('"quoted" and \'single\'')).toBe('&quot;quoted&quot; and &#39;single&#39;');
  });

  test('returns empty string for null and undefined', async () => {
    await import('../../src/js/utils/html.js');
    expect(window.htmlUtils.escapeHtml(null)).toBe('');
    expect(window.htmlUtils.escapeHtml(undefined)).toBe('');
  });

  test('accepts empty string without throwing', async () => {
    await import('../../src/js/utils/html.js');
    expect(window.htmlUtils.escapeHtml('')).toBe('');
  });
});
```

- [ ] **Step 2: Run the utility test and verify it fails**

Run:

```bash
npx vitest run tests/utils/html.test.js --environment jsdom
```

Expected:

```text
FAIL because src/js/utils/html.js does not exist yet.
```

- [ ] **Step 3: Implement `window.htmlUtils.escapeHtml`**

Create `src/js/utils/html.js` with:

```js
(function () {
  function escapeHtml(value) {
    if (value === null || typeof value === 'undefined') {
      return '';
    }

    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  window.htmlUtils = {
    escapeHtml: escapeHtml
  };
})();
```

- [ ] **Step 4: Add a runtime bridge so existing script order can use the utility without touching `index.html`**

Update `src/js/app.js` near the top with:

```js
(function () {
  function ensureHtmlUtils() {
    if (window.htmlUtils && typeof window.htmlUtils.escapeHtml === 'function') {
      return;
    }

    window.htmlUtils = {
      escapeHtml: function (value) {
        if (value === null || typeof value === 'undefined') {
          return '';
        }

        return String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }
    };
  }

  function exposeGlobals() {
    // existing code...
  }

  function initializeApp() {
    ensureHtmlUtils();
    registerGlobalErrorToast();
    exposeGlobals();
    initializeData().catch(function (err) {
      console.error('Data initialization failed:', err);
    });
  }

  // existing code...
})();
```

- [ ] **Step 5: Re-run the utility test and verify it passes**

Run:

```bash
npx vitest run tests/utils/html.test.js --environment jsdom
```

Expected:

```text
PASS tests/utils/html.test.js
```

- [ ] **Step 6: Commit the shared utility**

Run:

```bash
git add src/js/utils/html.js src/js/app.js tests/utils/html.test.js
git commit -m "feat: add html escape utility"
```

Expected:

```text
[main ...] feat: add html escape utility
```

---

### Task 2: Add Focused Hardening Tests For AI Assistant And Noun Rendering

**Files:**
- Create: `tests/html-hardening.test.js`
- Modify: `src/js/ai-assistant.js`
- Modify: `src/js/noun.js`

- [ ] **Step 1: Write focused failing tests for the two highest-risk modules**

Create `tests/html-hardening.test.js` with:

```js
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

beforeEach(() => {
  vi.resetModules();
  vi.useRealTimers();
  resetGlobals();
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

describe('ai assistant hardening', () => {
  test('escapes user input before appending chat bubble HTML', async () => {
    mountDOM(`
      <div id="ai-panel"></div>
      <div id="ai-body"></div>
      <input id="ai-input" />
      <button id="ai-fab"></button>
    `);
    vi.useFakeTimers();
    await import('../src/js/ai-assistant.js');

    document.getElementById('ai-input').value = '<img src=x onerror=alert(1)>';
    window.aiAssistantAPI.aiSend();
    vi.runAllTimers();

    expect(document.getElementById('ai-body').innerHTML).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(document.getElementById('ai-body').innerHTML).not.toContain('<img src=x onerror=alert(1)>');
  });
});

describe('noun related item hardening', () => {
  test('renders related nouns without injecting raw HTML into buttons', async () => {
    mountDOM(`
      <div id="nd-title"></div>
      <div id="nd-text"></div>
      <div id="nd-related"></div>
      <div id="noun-detail"></div>
    `);
    await import('../src/js/noun.js');

    window.nounAPI.setNounData({
      test: {
        text: '说明',
        related: ['<b>危险词</b>', '秦始皇']
      }
    });

    window.nounAPI.openNounDet('test');

    expect(document.getElementById('nd-related').innerHTML).toContain('&lt;b&gt;危险词&lt;/b&gt;');
    expect(document.getElementById('nd-related').innerHTML).not.toContain('<b>危险词</b>');
  });
});
```

- [ ] **Step 2: Run the focused hardening tests and verify they fail**

Run:

```bash
npx vitest run tests/html-hardening.test.js --environment jsdom
```

Expected:

```text
FAIL because ai-assistant.js and noun.js still inject raw dynamic HTML.
```

- [ ] **Step 3: Harden `src/js/ai-assistant.js`**

Update `src/js/ai-assistant.js` with the following helper and replacements:

```js
(function () {
  function escapeHtml(value) {
    if (window.htmlUtils && typeof window.htmlUtils.escapeHtml === 'function') {
      return window.htmlUtils.escapeHtml(value);
    }

    if (value === null || typeof value === 'undefined') {
      return '';
    }

    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function aiReply(q) {
    var safeQuestion = escapeHtml(q);
    var m = {
      '贞观之治是什么？': '贞观之治是唐太宗李世民在位期间（627-649年）出现的政治清明、社会安定的盛世局面。核心特征：虚心纳谏（魏征）、任用贤能（房玄龄、杜如晦）、轻徭薄赋、厉行节约。被史学家视为中国古代治世的典范。',
      '科举制的发展历程': '科举制始于隋炀帝大业元年（605年），唐代进一步完善，宋代达到鼎盛（殿试、糊名法、誊录制），明代实行八股取士，清代沿明制，1905年废除。共延续1300年，是古代中国最重要的选官制度。',
      '明朝灭亡的原因': '明朝灭亡是多重因素叠加的结果：1.财政危机（辽饷、剿饷、练饷三饷加派）；2.农民起义（李自成、张献忠等）；3.满洲兴起（后金/清的外在压力）；4.政治腐败（万历怠政、魏忠贤专权等）；5.小冰期气候导致农业大量减产。'
    };
    return m[q] || '这是一个很好的历史问题！📜<br>关于「' + safeQuestion + '」，建议查阅相关史料和学术论文来获取更深入的理解。你也可以在学习模块中找到相关内容～';
  }

  function aiSend() {
    var inp = document.getElementById('ai-input'), q = inp.value.trim();
    if (!q) return;
    var b = document.getElementById('ai-body');
    b.innerHTML += '<div class="amsg usr"><div class="amb">' + escapeHtml(q) + '</div></div>';
    inp.value = '';
    b.scrollTop = b.scrollHeight;
    setTimeout(function () {
      var a = aiReply(q);
      b.innerHTML += '<div class="amsg bot"><div class="amb">' + a + '</div></div>';
      b.scrollTop = b.scrollHeight;
    }, 800);
  }

  // existing drag logic + exports...
})();
```

- [ ] **Step 4: Harden `src/js/noun.js` using DOM buttons instead of `innerHTML +=`**

Update `openNounDet()` in `src/js/noun.js` to:

```js
function openNounDet(name) {
  document.getElementById('nd-title').textContent = name;
  var d = getNoun(name);
  document.getElementById('nd-text').textContent = (d && d.text) || '暂无详细解释。';
  var rel = document.getElementById('nd-related');
  rel.innerHTML = '';

  if (d && Array.isArray(d.related) && d.related.length) {
    d.related.forEach(function (r) {
      var button = document.createElement('button');
      button.className = 'nrtag';
      button.textContent = r;
      button.onclick = function () {
        openNounDet(r);
      };
      rel.appendChild(button);
    });
  } else {
    rel.innerHTML = '<span style="font-size:12px;color:#B5ADA5">暂无相关名词</span>';
  }

  document.getElementById('noun-detail').classList.add('act');
}
```

- [ ] **Step 5: Re-run the focused hardening tests and verify they pass**

Run:

```bash
npx vitest run tests/html-hardening.test.js --environment jsdom
```

Expected:

```text
PASS tests/html-hardening.test.js
```

- [ ] **Step 6: Commit the high-risk module hardening**

Run:

```bash
git add src/js/ai-assistant.js src/js/noun.js tests/html-hardening.test.js
git commit -m "fix: harden ai assistant and noun rendering"
```

Expected:

```text
[main ...] fix: harden ai assistant and noun rendering
```

---

### Task 3: Harden Stored And JSON-Driven Card Rendering

**Files:**
- Modify: `src/js/favorites.js`
- Modify: `src/js/film.js`

- [ ] **Step 1: Extend the focused test with storage-backed rendering assertions**

Add this block to `tests/html-hardening.test.js`:

```js
describe('favorites and film rendering hardening', () => {
  test('escapes stored favorite fields and film JSON fields before innerHTML rendering', async () => {
    mountDOM(`
      <div id="fav-list"></div>
      <div id="film-page">
        <div id="film-grid"></div>
        <div id="film-rank"><div id="rnk-list"></div></div>
        <div id="watchlist-panel"><div id="wl-list"></div></div>
      </div>
    `);

    window.storageAPI = {
      getStoredJSON(key, fallbackValue) {
        if (key === 'xds_favorites') {
          return [{
            id: 'fav-1\');alert(1);//',
            title: '<img src=x onerror=alert(1)>',
            subtitle: '<b>副标题</b>',
            icon: '<svg>'
          }];
        }
        if (key === 'xds_watchlist') {
          return { want: [{ id: 'film-1' }], watching: [], watched: [] };
        }
        return fallbackValue;
      },
      setStoredJSON() {
        return true;
      }
    };
    window.navigationAPI = { showToast: vi.fn() };

    await import('../src/js/favorites.js');
    await import('../src/js/film.js');

    window.favoritesAPI.renderFavorites();
    expect(document.getElementById('fav-list').innerHTML).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(document.getElementById('fav-list').innerHTML).not.toContain('<img src=x onerror=alert(1)>');

    window.filmAPI.setFilms([{
      id: 'film-1',
      type: 'film',
      title: '<img src=x onerror=1>',
      creator: '<b>导演</b>',
      year: '2024',
      rating: '9.0',
      ratingCount: '<i>1人评</i>',
      description: '<script>bad()</script>',
      tags: ['<b>tag</b>'],
      coverStyle: 'linear-gradient(135deg,#1A1A2E,#16213E)',
      badge: '<b>影视</b>',
      icon: '<svg>'
    }]);
    window.filmAPI.setRankings({
      book: [],
      film: [{ id: 'film-1', title: '<b>榜单片名</b>', subtitle: '<i>副标题</i>', score: '9.3', rank: 1, icon: '<svg>' }],
      doc: []
    });
    window.filmAPI.initializeFilmModule();

    expect(document.getElementById('film-grid').innerHTML).toContain('&lt;img src=x onerror=1&gt;');
    expect(document.getElementById('rnk-list').innerHTML).toContain('&lt;b&gt;榜单片名&lt;/b&gt;');
    expect(document.getElementById('film-grid').innerHTML).not.toContain('<script>bad()</script>');
  });
});
```

- [ ] **Step 2: Run the updated focused test and verify it fails**

Run:

```bash
npx vitest run tests/html-hardening.test.js --environment jsdom
```

Expected:

```text
FAIL because favorites.js and film.js still render raw dynamic HTML.
```

- [ ] **Step 3: Harden `src/js/favorites.js`**

Add a shared helper at the top and use it in `renderFavorites()`:

```js
function escapeHtml(value) {
  if (window.htmlUtils && typeof window.htmlUtils.escapeHtml === 'function') {
    return window.htmlUtils.escapeHtml(value);
  }

  if (value === null || typeof value === 'undefined') {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderFavorites() {
  var container = document.getElementById('fav-list');
  if (!container) return;
  var list = getFavorites();
  if (!list.length) {
    container.innerHTML = '<div style="text-align:center;padding:24px;color:#B5ADA5;font-size:13px">暂无收藏内容</div>';
    return;
  }
  var html = '';
  list.forEach(function (item) {
    html += '<div class="wlitem">' +
      '<div class="wlthumb">' + escapeHtml(item.icon || '📖') + '</div>' +
      '<div class="wlinfo"><h5>' + escapeHtml(item.title || '') + '</h5><p>' + escapeHtml(item.subtitle || '') + '</p></div>' +
      '<button class="wldel" onclick="window.favoritesAPI.removeFav(\'' + escapeHtml(item.id) + '\')">×</button>' +
      '</div>';
  });
  container.innerHTML = html;
}
```

- [ ] **Step 4: Harden `src/js/film.js`**

Add helpers near the top:

```js
function escapeHtml(value) {
  if (window.htmlUtils && typeof window.htmlUtils.escapeHtml === 'function') {
    return window.htmlUtils.escapeHtml(value);
  }

  if (value === null || typeof value === 'undefined') {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeInlineStyle(value, fallbackValue) {
  var text = value == null ? '' : String(value);
  if (/^(linear-gradient|radial-gradient|#|rgb|rgba|hsl|hsla)/.test(text)) {
    return text;
  }
  return fallbackValue;
}
```

Then update the renderers:

```js
function renderFilmCard(item) {
  var meta = [item.creator, item.year].filter(Boolean).map(escapeHtml).join(' · ');
  var rating = item.rating
    ? '<div class="rt">★★★★★ ' + escapeHtml(item.rating) + (item.ratingCount ? ' <span style="color:#B5ADA5;font-size:11px">(' + escapeHtml(item.ratingCount) + ')</span>' : '') + '</div>'
    : '';
  var tags = (item.tags || []).map(function (tag) {
    return '<span style="font-size:10px;padding:2px 8px;background:#F5F0E8;border-radius:6px;color:#8A8279">' + escapeHtml(tag) + '</span>';
  }).join('');

  return '' +
    '<div class="fcard" data-type="' + escapeHtml(item.type) + '" data-film-id="' + escapeHtml(item.id) + '">' +
      '<div class="fimg" style="background:' + sanitizeInlineStyle(item.coverStyle, '#EDE8E0') + '">' +
        '<div style="display:flex;flex-direction:column;align-items:center;gap:8px;color:#fff">' +
          '<div>' + escapeHtml(item.icon || '') + '</div>' +
          '<span style="background:rgba(0,0,0,.5);padding:2px 8px;border-radius:4px;font-size:11px">' + escapeHtml(item.badge || '') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="fin">' +
        '<h4>' + escapeHtml(item.title || '') + '</h4>' +
        (meta ? '<div style="font-size:11px;color:#8A8279;margin-bottom:4px">' + meta + '</div>' : '') +
        rating +
        '<p class="desc">' + escapeHtml(item.description || '') + '</p>' +
        '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">' + tags + '</div>' +
      '</div>' +
      '<button class="wbtn" onclick="toggleWatchlistItem(\'' + escapeHtml(item.id) + '\')">＋ 待看</button>' +
    '</div>';
}

function renderRanking(type) {
  var target = document.getElementById('rnk-list');
  if (!target) return;

  var list = rankings[type] || [];
  if (!list.length) {
    target.innerHTML = '<div class="wlempty">暂无榜单内容</div>';
    return;
  }

  target.innerHTML = list.map(function (item) {
    return '' +
      '<div class="rnkitem">' +
        '<div class="rnkidx">' + escapeHtml(item.rank) + '</div>' +
        '<div class="rnkimg" style="background:#EDE8E0">' + escapeHtml(item.icon || '📖') + '</div>' +
        '<div class="rnkname">' +
          '<h5>' + escapeHtml(item.title || '') + '</h5>' +
          '<p>' + escapeHtml(item.subtitle || '') + ' · ★ ' + escapeHtml(item.score || '') + '</p>' +
        '</div>' +
      '</div>';
  }).join('');
}
```

And update the watchlist renderer:

```js
listRoot.innerHTML = list.map(function (entry) {
  var film = getFilmById(entry.id);
  if (!film) return '';

  var actions = [
    { key: 'want', label: '待看' },
    { key: 'watching', label: '在看' },
    { key: 'watched', label: '看过' }
  ].map(function (action) {
    return '<button class="wlmove' + (action.key === currentWatchlistType ? ' act' : '') + '" onclick="moveWatchlistItem(\'' + escapeHtml(film.id) + '\',\'' + action.key + '\')">' + action.label + '</button>';
  }).join('');

  return '' +
    '<div class="wlitem" data-watchlist-id="' + escapeHtml(film.id) + '">' +
      '<div class="wlthumb" style="background:' + sanitizeInlineStyle(film.coverStyle, '#EDE8E0') + '">' + escapeHtml(film.icon || '') + '</div>' +
      '<div class="wlinfo">' +
        '<h5>' + escapeHtml(film.title || '') + '</h5>' +
        '<p>' + escapeHtml(film.creator || '') + '</p>' +
        '<div class="wlmeta">' + escapeHtml(film.year || '') + '</div>' +
        '<div class="wlops">' + actions + '</div>' +
      '</div>' +
    '</div>';
}).join('');
```

- [ ] **Step 5: Re-run the focused hardening test and verify it passes**

Run:

```bash
npx vitest run tests/html-hardening.test.js --environment jsdom
```

Expected:

```text
PASS tests/html-hardening.test.js
```

- [ ] **Step 6: Commit storage-backed and JSON-backed rendering hardening**

Run:

```bash
git add src/js/favorites.js src/js/film.js tests/html-hardening.test.js
git commit -m "fix: harden favorites and film rendering"
```

Expected:

```text
[main ...] fix: harden favorites and film rendering
```

---

### Task 4: Harden Timeline Rendering And Final Validation

**Files:**
- Modify: `src/js/timeline.js`
- Modify: `tests/html-hardening.test.js`

- [ ] **Step 1: Add a focused timeline rendering test**

Append this block to `tests/html-hardening.test.js`:

```js
describe('timeline rendering hardening', () => {
  test('escapes timeline event fields before injecting SVG and list HTML', async () => {
    mountDOM(`
      <div id="coord-chart"></div>
      <div id="event-list"></div>
    `);
    window.openFeatDet = vi.fn();
    window.showToast = vi.fn();
    await import('../src/js/timeline.js');

    window.timelineAPI.setTimelineEvents([
      {
        name: '<script>alert(1)</script>',
        year: '<b>前221</b>',
        description: '<img src=x onerror=1>',
        x: 100,
        pol: 100,
        eco: 160,
        cul: 220,
        conn: { next: '<i>汉</i>', pol: '影响', eco: '影响', cul: '影响' }
      }
    ]);

    window.timelineAPI.renderTimeline();
    window.timelineAPI.renderEventList();

    expect(document.getElementById('coord-chart').innerHTML).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(document.getElementById('event-list').innerHTML).toContain('&lt;img src=x onerror=1&gt;');
    expect(document.getElementById('event-list').innerHTML).not.toContain('<img src=x onerror=1>');
  });
});
```

- [ ] **Step 2: Run the focused hardening test and verify timeline still fails**

Run:

```bash
npx vitest run tests/html-hardening.test.js --environment jsdom
```

Expected:

```text
FAIL in the timeline hardening case because timeline.js still injects raw event values.
```

- [ ] **Step 3: Harden `src/js/timeline.js`**

Add helpers near the top:

```js
function escapeHtml(value) {
  if (window.htmlUtils && typeof window.htmlUtils.escapeHtml === 'function') {
    return window.htmlUtils.escapeHtml(value);
  }

  if (value === null || typeof value === 'undefined') {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeNumber(value, fallbackValue) {
  var num = Number(value);
  return isFinite(num) ? num : fallbackValue;
}
```

Update `showTimelineDetail()`, `showTimelineConn()`, `renderTimeline()`, and `renderEventList()`:

```js
function showTimelineDetail(idx) {
  var e = timelineEvents[idx];
  if (!e) return;
  window.openFeatDet('📅 ' + e.name + '（' + e.year + '）', e.description);
}

function renderTimeline() {
  var c = document.getElementById('coord-chart');
  if (!c) return;
  var pad = timelineZoom * 20;
  var x0 = 60 - pad, x1 = 400 + pad, y0 = 40 - pad, y1 = 400 + pad;
  var w = x1 - x0 + 40;
  var s = '<svg viewBox="0 0 ' + (w + 60) + ' 480" xmlns="http://www.w3.org/2000/svg">';
  // existing static SVG prefix...

  for (var i = 0; i < timelineEvents.length - 1; i++) {
    var a = timelineEvents[i], b = timelineEvents[i + 1];
    if (!a.conn || !b) continue;
    s += '<line x1="' + safeNumber(a.x, 0) + '" y1="' + safeNumber(a.pol, 0) + '" x2="' + safeNumber(b.x, 0) + '" y2="' + safeNumber(b.pol, 0) + '" stroke="#C0392B" stroke-width="1" stroke-dasharray="5,3" opacity="0.4" class="tldash" data-i="' + i + '" data-dim="pol" onclick="showTimelineConn(' + i + ',\'pol\')" style="cursor:pointer"/>';
    s += '<line x1="' + safeNumber(a.x, 0) + '" y1="' + safeNumber(a.eco, 0) + '" x2="' + safeNumber(b.x, 0) + '" y2="' + safeNumber(b.eco, 0) + '" stroke="#27AE60" stroke-width="1" stroke-dasharray="5,3" opacity="0.4" class="tldash" data-i="' + i + '" data-dim="eco" onclick="showTimelineConn(' + i + ',\'eco\')" style="cursor:pointer"/>';
    s += '<line x1="' + safeNumber(a.x, 0) + '" y1="' + safeNumber(a.cul, 0) + '" x2="' + safeNumber(b.x, 0) + '" y2="' + safeNumber(b.cul, 0) + '" stroke="#8B6914" stroke-width="1" stroke-dasharray="5,3" opacity="0.4" class="tldash" data-i="' + i + '" data-dim="cul" onclick="showTimelineConn(' + i + ',\'cul\')" style="cursor:pointer"/>';
  }

  timelineEvents.forEach(function (d) {
    s += '<circle cx="' + safeNumber(d.x, 0) + '" cy="' + safeNumber(d.pol, 0) + '" r="6" fill="#C0392B" opacity="0.85" stroke="#fff" stroke-width="1" class="tlevt" onclick="showTimelineDetail(' + timelineEvents.indexOf(d) + ')" style="cursor:pointer"/>';
    s += '<text x="' + safeNumber(d.x, 0) + '" y="' + (safeNumber(d.pol, 0) - 10) + '" font-size="8" text-anchor="middle" fill="#C0392B" font-weight="700">' + escapeHtml(d.name) + '</text>';
    s += '<text x="' + safeNumber(d.x, 0) + '" y="' + (safeNumber(d.pol, 0) - 20) + '" font-size="7" text-anchor="middle" fill="#8A7A6A">' + escapeHtml(d.year) + '</text>';
    s += '<circle cx="' + safeNumber(d.x, 0) + '" cy="' + safeNumber(d.eco, 0) + '" r="5" fill="#27AE60" opacity="0.85" stroke="#fff" stroke-width="1"/>';
    s += '<circle cx="' + safeNumber(d.x, 0) + '" cy="' + safeNumber(d.cul, 0) + '" r="4" fill="#8B6914" opacity="0.85" stroke="#fff" stroke-width="1"/>';
  });

  s += '</svg>';
  c.innerHTML = s;
}

function renderEventList() {
  var el = document.getElementById('event-list');
  if (!el) return;
  var h = '';
  timelineEvents.forEach(function (d, i) {
    h += '<div class="evitem" onclick="showTimelineDetail(' + i + ')"><div class="evdot pol"></div><div class="evtxt"><h5>' + escapeHtml(d.name) + ' <span class="evyr">' + escapeHtml(d.year) + '</span></h5><div class="evdesc">' + escapeHtml(d.description) + '</div></div></div>';
  });
  el.innerHTML = h || '<div style="padding:16px;text-align:center;color:#B5ADA5">暂无事件数据</div>';
}
```

- [ ] **Step 4: Run the targeted tests and then the nearby regression tests**

Run:

```bash
npx vitest run tests/utils/html.test.js tests/html-hardening.test.js tests/checkin.test.js tests/film.test.js --environment jsdom
```

Expected:

```text
PASS for the new utility test, the new hardening tests, and the unchanged nearby module tests.
```

- [ ] **Step 5: Run diagnostics for the edited files**

Check diagnostics for:

```text
src/js/app.js
src/js/ai-assistant.js
src/js/noun.js
src/js/favorites.js
src/js/film.js
src/js/timeline.js
src/js/utils/html.js
tests/utils/html.test.js
tests/html-hardening.test.js
```

Expected:

```text
No new diagnostics introduced by Task 0.3 changes.
```

- [ ] **Step 6: Commit the final hardening pass**

Run:

```bash
git add src/js/timeline.js tests/html-hardening.test.js
git commit -m "fix: harden timeline html rendering"
```

Expected:

```text
[main ...] fix: harden timeline html rendering
```

---

### Task 5: Final Task 0.3 Completion Check

**Files:**
- Read: `src/js/utils/html.js`
- Read: `src/js/app.js`
- Read: `src/js/ai-assistant.js`
- Read: `src/js/noun.js`
- Read: `src/js/favorites.js`
- Read: `src/js/film.js`
- Read: `src/js/timeline.js`
- Read: `tests/utils/html.test.js`
- Read: `tests/html-hardening.test.js`

- [ ] **Step 1: Verify the scope stayed inside `src/js`**

Run:

```bash
git status --short
```

Expected:

```text
Only the planned src/js and tests files appear as changed for Task 0.3. index.html is not listed.
```

- [ ] **Step 2: Verify the utility is exposed on `window`**

Run:

```bash
rg -n "window\\.htmlUtils|escapeHtml" src/js/app.js src/js/utils/html.js src/js/ai-assistant.js src/js/noun.js src/js/favorites.js src/js/film.js src/js/timeline.js
```

Expected:

```text
Matches confirm the shared utility exists and each hardened module uses it or its equivalent fallback.
```

- [ ] **Step 3: Create the final Task 0.3 summary commit if additional cleanup was needed**

Run:

```bash
git status --short
```

Expected:

```text
No unexpected modified files remain for Task 0.3.
```

If there are final staged adjustments after diagnostics, finish with:

```bash
git add src/js/app.js src/js/ai-assistant.js src/js/noun.js src/js/favorites.js src/js/film.js src/js/timeline.js src/js/utils/html.js tests/utils/html.test.js tests/html-hardening.test.js
git commit -m "feat: add html escaping and harden js rendering"
```

Expected:

```text
[main ...] feat: add html escaping and harden js rendering
```

---

## Self-Review

- **Spec coverage:** The plan covers the shared utility, runtime availability via `app.js`, hardening of all `src/js` modules listed in the approved spec, focused tests, and final diagnostics.
- **Placeholder scan:** The plan contains concrete file paths, code snippets, and exact commands; no `TODO` or deferred instructions remain.
- **Type consistency:** The shared public API stays `window.htmlUtils.escapeHtml`. The hardened modules all refer to the same helper name and keep the existing `window.xxxAPI` exports intact.
