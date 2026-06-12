# Film/Watchlist Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把影视书目区域重构为 `src/js/film.js + src/data/*.json + localStorage` 的数据驱动模块，并补完待看栏的真实持久化与状态迁移。

**Architecture:** 保留现有原生 HTML 与 inline `onclick` 兼容模式，把影视卡片、榜单和待看栏 UI 交给 `film.js` 渲染。`app.js` 继续负责加载 JSON 并把数据注入模块；静态内容写入 `films.json` / `rankings.json`，用户个人状态写入 `localStorage[xds_watchlist]`。

**Tech Stack:** 原生 HTML、原生 JavaScript、JSON、Vitest、jsdom、浏览器 LocalStorage

---

## File Structure Map

### Existing files to modify

- Modify: `index.html:363-398`
  - 用空容器替换硬编码影视卡片
  - 添加“我的待看栏”入口、榜单容器、待看栏面板 DOM
- Modify: `index.html:563-571`
  - 在 `app.js` 之前加入 `film.js` 的 `<script>` 引用
- Modify: `src/js/app.js:2-65,81-95`
  - 暴露 film 全局函数
  - 加载 `films.json` / `rankings.json`
  - 初始化 `filmAPI`
- Modify: `src/css/components.css:88-123`
  - 增加待看栏操作按钮、空状态文案的样式
- Modify: `tests/helpers/dom-test-utils.js:24-32`
  - 重置 `filmAPI` / `storageAPI`，避免测试串扰
- Modify: `README.md:34-49`
  - 把 `film.js` 与 `rankings.json` 写进项目结构说明

### New files to create

- Create: `src/js/film.js`
  - 影视卡片渲染、榜单渲染、待看栏状态管理、状态迁移、失效数据清理
- Create: `src/data/films.json`
  - 影视书目卡片静态内容
- Create: `src/data/rankings.json`
  - 书籍榜 / 影视榜 / 纪录片榜静态数据
- Create: `tests/film.test.js`
  - film 模块的渲染、持久化、迁移、清理、app 装配测试

---

### Task 1: 建立 film 模块渲染骨架

**Files:**
- Create: `src/js/film.js`
- Create: `tests/film.test.js`
- Modify: `tests/helpers/dom-test-utils.js:24-32`

- [ ] **Step 1: 写出 film 模块首批失败测试（卡片渲染 + 分类筛选 + 榜单切换）**

Write `tests/film.test.js`:

```js
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { makeStorageMock, mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

const FILMS = [
  {
    id: 'book-wanli-shiwu-nian',
    type: 'book',
    title: '万历十五年',
    creator: '黄仁宇 著',
    year: '1981年',
    rating: '9.0',
    ratingCount: '21.2万人评',
    description: '以1587年为切入点，从“大历史观”审视明朝中晚期的政治、经济与文化困境。',
    tags: ['历史', '大历史观'],
    coverStyle: 'linear-gradient(135deg,#5A3E1B,#8B6914)',
    badge: '书籍',
    icon: '📖'
  },
  {
    id: 'film-last-emperor',
    type: 'film',
    title: '末代皇帝',
    creator: '贝纳尔多·贝托鲁奇 导演',
    year: '1987年',
    rating: '9.3',
    ratingCount: '66.6万人评',
    description: '从溥仪三岁登基到成为新中国公民，跨越清末、民国、抗战、新中国四个历史时期。',
    tags: ['清朝', '传记', '奥斯卡'],
    coverStyle: 'linear-gradient(135deg,#1A1A2E,#16213E)',
    badge: '影视',
    icon: '🎬'
  },
  {
    id: 'doc-hexi-zoulang',
    type: 'doc',
    title: '河西走廊',
    creator: '央视纪录片',
    year: '2015年 · 10集',
    rating: '9.7',
    ratingCount: '17.1万人评',
    description: '以河西走廊为线索，探寻汉、三国、隋、唐、元、明、清等朝代中，中国与西域的文明交汇。',
    tags: ['历史', '丝绸之路'],
    coverStyle: 'linear-gradient(135deg,#2E7D4F,#27AE60)',
    badge: '纪录片',
    icon: '📺'
  }
];

const RANKINGS = {
  book: [
    { id: 'book-wanli-shiwu-nian', title: '万历十五年', subtitle: '黄仁宇 著', score: '9.0', rank: 1, icon: '📖' }
  ],
  film: [
    { id: 'film-last-emperor', title: '末代皇帝', subtitle: '贝纳尔多·贝托鲁奇 1987', score: '9.3', rank: 1, icon: '🎬' }
  ],
  doc: [
    { id: 'doc-hexi-zoulang', title: '河西走廊', subtitle: '央视纪录片 2015', score: '9.7', rank: 1, icon: '📺' }
  ]
};

function mountFilmDOM() {
  mountDOM(`
    <div id="film-page">
      <div class="fg2">
        <button class="dtab act" id="filter-all">全部</button>
        <button class="dtab" id="filter-book">书籍</button>
        <button class="dtab" id="filter-film">影视</button>
        <button class="dtab" id="filter-doc">纪录片</button>
      </div>
      <div class="fg3" id="film-grid"></div>
      <div class="rnk" id="film-rank">
        <div class="rnktab">
          <button class="rnkt act" id="rank-book">书籍榜</button>
          <button class="rnkt" id="rank-film">影视榜</button>
          <button class="rnkt" id="rank-doc">纪录片榜</button>
        </div>
        <div class="rnklist" id="rnk-list"></div>
      </div>
      <div class="wlpanel" id="watchlist-panel">
        <div class="wltabs">
          <button class="wltab act" id="wl-want">待看</button>
          <button class="wltab" id="wl-watching">在看</button>
          <button class="wltab" id="wl-watched">看过</button>
        </div>
        <div class="wllist" id="wl-list"></div>
      </div>
      <div id="toast"></div>
    </div>
  `);
}

beforeEach(() => {
  vi.resetModules();
  resetGlobals();
  Object.defineProperty(window, 'localStorage', {
    value: makeStorageMock(),
    configurable: true
  });
  window.storageAPI = {
    getStoredJSON(key, fallbackValue) {
      const value = window.localStorage.getItem(key);
      return value ? JSON.parse(value) : fallbackValue;
    },
    setStoredJSON(key, value) {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    }
  };
  window.navigationAPI = {
    showToast: vi.fn()
  };
  mountFilmDOM();
});

describe('film module rendering', () => {
  test('renders all films, filters by type, and switches ranking tabs', async () => {
    await import('../src/js/film.js');

    window.filmAPI.setFilms(FILMS);
    window.filmAPI.setRankings(RANKINGS);
    window.filmAPI.initializeFilmModule();

    expect(document.querySelectorAll('#film-grid .fcard')).toHaveLength(3);
    expect(document.getElementById('rnk-list').textContent).toContain('万历十五年');

    window.filmAPI.filterFilms('book', document.getElementById('filter-book'));
    expect(document.querySelectorAll('#film-grid .fcard')).toHaveLength(1);
    expect(document.getElementById('film-grid').textContent).toContain('万历十五年');

    window.filmAPI.switchRankingTab('film', document.getElementById('rank-film'));
    expect(document.getElementById('rnk-list').textContent).toContain('末代皇帝');
    expect(document.getElementById('rank-film').classList.contains('act')).toBe(true);
  });
});
```

- [ ] **Step 2: 运行新测试，确认当前失败**

Run:

```powershell
npx vitest run tests/film.test.js --environment jsdom
```

Expected: FAIL，报错包含 `Cannot find module '../src/js/film.js'` 或 `window.filmAPI is undefined`。

- [ ] **Step 3: 写最小实现，让卡片/榜单/筛选测试通过**

Write `src/js/film.js`:

```js
(function () {
  var films = [];
  var rankings = { book: [], film: [], doc: [] };
  var currentFilmType = 'all';
  var currentRankingType = 'book';
  var currentWatchlistType = 'want';

  function setFilms(data) {
    films = Array.isArray(data) ? data : [];
  }

  function setRankings(data) {
    rankings = data && typeof data === 'object'
      ? {
          book: Array.isArray(data.book) ? data.book : [],
          film: Array.isArray(data.film) ? data.film : [],
          doc: Array.isArray(data.doc) ? data.doc : []
        }
      : { book: [], film: [], doc: [] };
  }

  function getFilteredFilms() {
    if (currentFilmType === 'all') return films;
    return films.filter(function (item) {
      return item.type === currentFilmType;
    });
  }

  function renderFilmCard(item) {
    var tags = (item.tags || []).map(function (tag) {
      return '<span style="font-size:10px;padding:2px 8px;background:#F5F0E8;border-radius:6px;color:#8A8279">' + tag + '</span>';
    }).join('');

    var meta = [item.creator, item.year].filter(Boolean).join(' · ');
    var ratingLine = item.rating
      ? '<div class="rt">★★★★★ ' + item.rating + (item.ratingCount ? ' <span style="color:#B5ADA5;font-size:11px">(' + item.ratingCount + ')</span>' : '') + '</div>'
      : '';

    return '' +
      '<div class="fcard" data-type="' + item.type + '" data-film-id="' + item.id + '">' +
        '<div class="fimg" style="background:' + item.coverStyle + '"><span style="background:rgba(0,0,0,.5);color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">' + item.badge + '</span></div>' +
        '<div class="fin">' +
          '<h4>' + item.title + '</h4>' +
          (meta ? '<div style="font-size:11px;color:#8A8279;margin-bottom:4px">' + meta + '</div>' : '') +
          ratingLine +
          '<p class="desc">' + item.description + '</p>' +
          '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">' + tags + '</div>' +
        '</div>' +
        '<button class="wbtn" onclick="toggleWatchlistItem(\'' + item.id + '\')">＋ 待看</button>' +
      '</div>';
  }

  function renderFilmGrid() {
    var grid = document.getElementById('film-grid');
    if (!grid) return;
    var list = getFilteredFilms();
    grid.innerHTML = list.map(renderFilmCard).join('') || '<div class="wlempty">暂无影视内容</div>';
  }

  function renderRanking(type) {
    var list = rankings[type] || [];
    var target = document.getElementById('rnk-list');
    if (!target) return;
    if (!list.length) {
      target.innerHTML = '<div class="wlempty">暂无榜单内容</div>';
      return;
    }
    target.innerHTML = list.map(function (item) {
      return '' +
        '<div class="rnkitem">' +
          '<div class="rnkidx">' + item.rank + '</div>' +
          '<div class="rnkimg" style="background:#EDE8E0;font-size:20px">' + (item.icon || '📖') + '</div>' +
          '<div class="rnkname"><h5>' + item.title + '</h5><p>' + item.subtitle + ' · ★ ' + item.score + '</p></div>' +
        '</div>';
    }).join('');
  }

  function filterFilms(type, btn) {
    currentFilmType = type;
    document.querySelectorAll('#film-page .fg2 .dtab').forEach(function (tab) {
      tab.classList.remove('act');
    });
    if (btn) btn.classList.add('act');
    renderFilmGrid();
  }

  function switchRankingTab(type, btn) {
    currentRankingType = type;
    document.querySelectorAll('#film-rank .rnkt').forEach(function (tab) {
      tab.classList.remove('act');
    });
    if (btn) btn.classList.add('act');
    renderRanking(type);
  }

  function initializeFilmModule() {
    renderFilmGrid();
    renderRanking(currentRankingType);
  }

  function openWatchlist() {}
  function closeWatchlist() {}
  function switchWatchlistTab() {}
  function toggleWatchlistItem() {}
  function moveWatchlistItem() {}
  function renderWatchlist() {}

  window.filmAPI = {
    setFilms: setFilms,
    setRankings: setRankings,
    initializeFilmModule: initializeFilmModule,
    filterFilms: filterFilms,
    renderFilmGrid: renderFilmGrid,
    switchRankingTab: switchRankingTab,
    renderRanking: renderRanking,
    openWatchlist: openWatchlist,
    closeWatchlist: closeWatchlist,
    switchWatchlistTab: switchWatchlistTab,
    toggleWatchlistItem: toggleWatchlistItem,
    moveWatchlistItem: moveWatchlistItem,
    renderWatchlist: renderWatchlist
  };
})();
```

Replace `tests/helpers/dom-test-utils.js` with:

```js
export function mountDOM(html) {
  document.body.innerHTML = html;
}

export function makeStorageMock() {
  const store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    }
  };
}

export function resetGlobals() {
  document.body.innerHTML = '';
  delete window.navigationAPI;
  delete window.checkinAPI;
  delete window.peopleAPI;
  delete window.studyToolsAPI;
  delete window.libraryAPI;
  delete window.memesAPI;
  delete window.filmAPI;
  delete window.storageAPI;
}
```

- [ ] **Step 4: 重新运行 film 模块测试，确认通过**

Run:

```powershell
npx vitest run tests/film.test.js --environment jsdom
```

Expected: PASS，输出 `1 passed`。

- [ ] **Step 5: 提交渲染骨架**

Run:

```powershell
git add src/js/film.js tests/film.test.js tests/helpers/dom-test-utils.js
git commit -m "feat: add film module rendering skeleton"
```

Expected: commit 成功，工作区保留后续未提交改动为 0。

---

### Task 2: 接入真实数据文件、HTML 外壳和 app 装配

**Files:**
- Create: `src/data/films.json`
- Create: `src/data/rankings.json`
- Modify: `index.html:363-398`
- Modify: `index.html:563-571`
- Modify: `src/js/app.js:2-65,81-95`
- Modify: `tests/film.test.js`

- [ ] **Step 1: 为 app 装配写失败测试（加载 films/rankings 并初始化模块）**

Append to `tests/film.test.js`:

```js
describe('app wiring for film module', () => {
  test('loads film datasets and initializes film module', async () => {
    vi.resetModules();
    resetGlobals();
    mountDOM('<div id="toast"></div>');
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      value: 'complete'
    });

    window.filmAPI = {
      setFilms: vi.fn(),
      setRankings: vi.fn(),
      initializeFilmModule: vi.fn(),
      filterFilms: vi.fn(),
      switchRankingTab: vi.fn(),
      openWatchlist: vi.fn(),
      closeWatchlist: vi.fn(),
      switchWatchlistTab: vi.fn(),
      toggleWatchlistItem: vi.fn(),
      moveWatchlistItem: vi.fn()
    };

    window.nounAPI = { setNounData: vi.fn() };
    window.timelineAPI = {
      setDynasties: vi.fn(),
      setTimelineEvents: vi.fn(),
      renderTimeline: vi.fn(),
      renderEventList: vi.fn()
    };
    window.podcastAPI = { setPodcasts: vi.fn() };
    window.checkinAPI = { updateCheckinStats: vi.fn() };
    window.navigationAPI = { showToast: vi.fn(), resetAIFab: vi.fn() };
    window.storageAPI = {
      getStoredJSON: vi.fn(),
      setStoredJSON: vi.fn(),
      getStoredString: vi.fn(),
      setStoredString: vi.fn()
    };

    global.fetch = vi.fn(async (path) => {
      if (path.endsWith('nouns.json')) return { ok: true, json: async () => ({}) };
      if (path.endsWith('timeline.json')) return { ok: true, json: async () => ({ dynasties: [], events: [] }) };
      if (path.endsWith('podcasts.json')) return { ok: true, json: async () => [] };
      if (path.endsWith('films.json')) return { ok: true, json: async () => FILMS };
      if (path.endsWith('rankings.json')) return { ok: true, json: async () => RANKINGS };
      throw new Error('Unexpected fetch: ' + path);
    });

    await import('../src/js/app.js');
    await new Promise(function (resolve) { setTimeout(resolve, 0); });

    expect(window.filmAPI.setFilms).toHaveBeenCalledWith(FILMS);
    expect(window.filmAPI.setRankings).toHaveBeenCalledWith(RANKINGS);
    expect(window.filmAPI.initializeFilmModule).toHaveBeenCalledTimes(1);
    expect(window.filterFilms).toBe(window.filmAPI.filterFilms);
    expect(window.openWatchlist).toBe(window.filmAPI.openWatchlist);
  });
});
```

- [ ] **Step 2: 运行测试，确认 app 还没有接入 film 模块**

Run:

```powershell
npx vitest run tests/film.test.js --environment jsdom
```

Expected: FAIL，断言 `setFilms` / `setRankings` / `initializeFilmModule` 未被调用。

- [ ] **Step 3: 创建真实 JSON 数据文件**

Write `src/data/films.json`:

```json
[
  {
    "id": "book-wanli-shiwu-nian",
    "type": "book",
    "title": "万历十五年",
    "creator": "黄仁宇 著",
    "year": "1981年",
    "rating": "9.0",
    "ratingCount": "21.2万人评",
    "description": "以1587年为切入点，从“大历史观”审视明朝中晚期的政治、经济与文化困境。",
    "tags": ["历史", "大历史观"],
    "coverStyle": "linear-gradient(135deg,#5A3E1B,#8B6914)",
    "badge": "书籍",
    "icon": "📖"
  },
  {
    "id": "film-last-emperor",
    "type": "film",
    "title": "末代皇帝",
    "creator": "贝纳尔多·贝托鲁奇 导演",
    "year": "1987年",
    "rating": "9.3",
    "ratingCount": "66.6万人评",
    "description": "从溥仪三岁登基到成为新中国公民，跨越清末、民国、抗战、新中国四个历史时期。",
    "tags": ["清朝", "传记", "奥斯卡"],
    "coverStyle": "linear-gradient(135deg,#1A1A2E,#16213E)",
    "badge": "影视",
    "icon": "🎬"
  },
  {
    "id": "doc-hexi-zoulang",
    "type": "doc",
    "title": "河西走廊",
    "creator": "央视纪录片",
    "year": "2015年 · 10集",
    "rating": "9.7",
    "ratingCount": "17.1万人评",
    "description": "以河西走廊为线索，探寻汉、三国、隋、唐、元、明、清等朝代中，中国与西域的文明交汇。",
    "tags": ["历史", "丝绸之路"],
    "coverStyle": "linear-gradient(135deg,#2E7D4F,#27AE60)",
    "badge": "纪录片",
    "icon": "📺"
  },
  {
    "id": "book-zhongguo-da-lishi",
    "type": "book",
    "title": "中国大历史",
    "creator": "黄仁宇 著",
    "year": "",
    "rating": "8.3",
    "ratingCount": "",
    "description": "黄仁宇另一力作，从宏观视角梳理中国历史脉络。",
    "tags": ["历史", "宏观史观"],
    "coverStyle": "linear-gradient(135deg,#8B6914,#D4A843)",
    "badge": "书籍",
    "icon": "📖"
  }
]
```

Write `src/data/rankings.json`:

```json
{
  "book": [
    {
      "id": "book-wanli-shiwu-nian",
      "title": "万历十五年",
      "subtitle": "黄仁宇 著",
      "score": "9.0",
      "rank": 1,
      "icon": "📖"
    },
    {
      "id": "book-zhongguo-da-lishi",
      "title": "中国大历史",
      "subtitle": "黄仁宇 著",
      "score": "8.3",
      "rank": 2,
      "icon": "📖"
    },
    {
      "id": "book-mingchao-neixieshi",
      "title": "明朝那些事儿",
      "subtitle": "当年明月 著",
      "score": "9.1",
      "rank": 3,
      "icon": "📖"
    }
  ],
  "film": [
    {
      "id": "film-last-emperor",
      "title": "末代皇帝",
      "subtitle": "贝纳尔多·贝托鲁奇 1987",
      "score": "9.3",
      "rank": 1,
      "icon": "🎬"
    },
    {
      "id": "film-da-ming-wang-chao-1566",
      "title": "大明王朝1566",
      "subtitle": "张黎导演 2007",
      "score": "9.7",
      "rank": 2,
      "icon": "🎬"
    }
  ],
  "doc": [
    {
      "id": "doc-hexi-zoulang",
      "title": "河西走廊",
      "subtitle": "央视纪录片 2015",
      "score": "9.7",
      "rank": 1,
      "icon": "📺"
    },
    {
      "id": "doc-da-guo-jue-qi",
      "title": "大国崛起",
      "subtitle": "央视纪录片 2006",
      "score": "9.2",
      "rank": 2,
      "icon": "📺"
    }
  ]
}
```

- [ ] **Step 4: 接入 HTML 外壳与 app 装配代码**

Replace the film block in `index.html` with:

```html
<!-- ===== 影视书目推荐 ===== -->
<div id="film-page" class="sub">
<div class="tt">
<button onclick="swSubTab(this,'podcast-page')">AI播客</button>
<button onclick="swSubTab(this,'people-page')">人物专题</button>
<button class="act" onclick="swSubTab(this,'film-page')">影视书目推荐</button>
</div>
<div class="fg2">
<button class="dtab act" onclick="filterFilms('all',this)">全部</button>
<button class="dtab" onclick="filterFilms('book',this)">📖 书籍</button>
<button class="dtab" onclick="filterFilms('film',this)">🎬 影视</button>
<button class="dtab" onclick="filterFilms('doc',this)">📺 纪录片</button>
</div>
<div class="fg3" id="film-grid"></div>
<div class="fclist">
<div class="fctem" onclick="openWatchlist()">
<div class="fcav">🎬</div>
<div class="fctx">
<h5>我的待看栏</h5>
<p>按待看 / 在看 / 看过管理历史书籍、影视与纪录片</p>
<div class="fcdt">点击查看并调整状态</div>
</div>
</div>
</div>
<div class="rnk" id="film-rank">
<div class="rnktab">
<button class="rnkt act" onclick="switchRankingTab('book',this)">📖 书籍榜</button>
<button class="rnkt" onclick="switchRankingTab('film',this)">🎬 影视榜</button>
<button class="rnkt" onclick="switchRankingTab('doc',this)">📺 纪录片榜</button>
</div>
<div class="rnklist" id="rnk-list"></div>
</div>
</div>

<div class="wlpanel" id="watchlist-panel">
<div class="wlhead">
<button class="bk" onclick="closeWatchlist()">←</button>
<h3>🎬 我的待看栏</h3>
</div>
<div class="wltabs">
<button class="wltab act" onclick="switchWatchlistTab('want',this)">待看</button>
<button class="wltab" onclick="switchWatchlistTab('watching',this)">在看</button>
<button class="wltab" onclick="switchWatchlistTab('watched',this)">看过</button>
</div>
<div class="wllist" id="wl-list"></div>
</div>
```

Add the script include in `index.html` before `app.js`:

```html
<script src="./src/js/film.js"></script>
```

Update `src/js/app.js` so `exposeGlobals()` includes:

```js
    if (window.filmAPI) {
      window.filterFilms = window.filmAPI.filterFilms;
      window.switchRankingTab = window.filmAPI.switchRankingTab;
      window.openWatchlist = window.filmAPI.openWatchlist;
      window.closeWatchlist = window.filmAPI.closeWatchlist;
      window.switchWatchlistTab = window.filmAPI.switchWatchlistTab;
      window.toggleWatchlistItem = window.filmAPI.toggleWatchlistItem;
      window.moveWatchlistItem = window.filmAPI.moveWatchlistItem;
    }
```

Update `initializeData()` in `src/js/app.js` to load film data:

```js
    var films = await loadJSON('./src/data/films.json', []);
    if (window.filmAPI) window.filmAPI.setFilms(films);

    var rankings = await loadJSON('./src/data/rankings.json', { book: [], film: [], doc: [] });
    if (window.filmAPI) window.filmAPI.setRankings(rankings);

    if (window.filmAPI) {
      try { window.filmAPI.initializeFilmModule(); } catch (e) { console.error('initializeFilmModule err:', e); }
    }
```

- [ ] **Step 5: 运行 film 测试，确认 app 装配已经接通**

Run:

```powershell
npx vitest run tests/film.test.js --environment jsdom
```

Expected: PASS，至少输出 `2 passed`。

- [ ] **Step 6: 提交数据与装配接入**

Run:

```powershell
git add src/data/films.json src/data/rankings.json src/js/app.js index.html tests/film.test.js
git commit -m "feat: wire film module to app data loading"
```

Expected: commit 成功。

---

### Task 3: 实现待看栏持久化与卡片按钮同步

**Files:**
- Modify: `src/js/film.js`
- Modify: `tests/film.test.js`

- [ ] **Step 1: 为待看栏持久化和按钮状态写失败测试**

Append to `tests/film.test.js`:

```js
describe('watchlist persistence', () => {
  test('adds and removes a film from the want list and syncs card button text', async () => {
    await import('../src/js/film.js');

    window.filmAPI.setFilms(FILMS);
    window.filmAPI.setRankings(RANKINGS);
    window.filmAPI.initializeFilmModule();

    window.filmAPI.toggleWatchlistItem('film-last-emperor');

    var savedAfterAdd = JSON.parse(window.localStorage.getItem('xds_watchlist'));
    expect(savedAfterAdd.want).toHaveLength(1);
    expect(savedAfterAdd.want[0].id).toBe('film-last-emperor');
    expect(document.querySelector('[data-film-id="film-last-emperor"] .wbtn').textContent).toContain('已添加');
    expect(window.navigationAPI.showToast).toHaveBeenLastCalledWith('已添加到待看栏！');

    window.filmAPI.toggleWatchlistItem('film-last-emperor');

    var savedAfterRemove = JSON.parse(window.localStorage.getItem('xds_watchlist'));
    expect(savedAfterRemove.want).toHaveLength(0);
    expect(document.querySelector('[data-film-id="film-last-emperor"] .wbtn').textContent).toContain('待看');
    expect(window.navigationAPI.showToast).toHaveBeenLastCalledWith('已移出待看栏');
  });
});
```

- [ ] **Step 2: 运行测试，确认持久化逻辑尚未实现**

Run:

```powershell
npx vitest run tests/film.test.js --environment jsdom
```

Expected: FAIL，断言 `xds_watchlist` 为 `null`、长度不对，或按钮文字未更新。

- [ ] **Step 3: 在 `film.js` 中加入待看栏读写、切换和按钮同步逻辑**

Update `src/js/film.js` by adding these helpers and replacing the placeholder no-op functions:

```js
  var WATCHLIST_KEY = 'xds_watchlist';

  function getDefaultWatchlist() {
    return {
      want: [],
      watching: [],
      watched: []
    };
  }

  function normalizeWatchlist(raw) {
    return {
      want: Array.isArray(raw && raw.want) ? raw.want : [],
      watching: Array.isArray(raw && raw.watching) ? raw.watching : [],
      watched: Array.isArray(raw && raw.watched) ? raw.watched : []
    };
  }

  function readWatchlist() {
    if (!window.storageAPI) return getDefaultWatchlist();
    return normalizeWatchlist(window.storageAPI.getStoredJSON(WATCHLIST_KEY, getDefaultWatchlist()));
  }

  function writeWatchlist(data) {
    if (!window.storageAPI) return false;
    return window.storageAPI.setStoredJSON(WATCHLIST_KEY, normalizeWatchlist(data));
  }

  function findWatchlistStatus(filmId) {
    var watchlist = readWatchlist();
    if (watchlist.want.some(function (item) { return item.id === filmId; })) return 'want';
    if (watchlist.watching.some(function (item) { return item.id === filmId; })) return 'watching';
    if (watchlist.watched.some(function (item) { return item.id === filmId; })) return 'watched';
    return null;
  }

  function syncFilmButtons() {
    document.querySelectorAll('#film-grid .fcard').forEach(function (card) {
      var filmId = card.getAttribute('data-film-id');
      var button = card.querySelector('.wbtn');
      if (!button) return;
      if (findWatchlistStatus(filmId)) {
        button.classList.add('add');
        button.textContent = '✓ 已添加';
      } else {
        button.classList.remove('add');
        button.textContent = '＋ 待看';
      }
    });
  }

  function addToWantList(filmId) {
    var watchlist = readWatchlist();
    watchlist.want = watchlist.want.filter(function (item) { return item.id !== filmId; });
    watchlist.watching = watchlist.watching.filter(function (item) { return item.id !== filmId; });
    watchlist.watched = watchlist.watched.filter(function (item) { return item.id !== filmId; });
    watchlist.want.unshift({ id: filmId, addedAt: new Date().toISOString() });
    return writeWatchlist(watchlist);
  }

  function removeFromWatchlist(filmId) {
    var watchlist = readWatchlist();
    watchlist.want = watchlist.want.filter(function (item) { return item.id !== filmId; });
    watchlist.watching = watchlist.watching.filter(function (item) { return item.id !== filmId; });
    watchlist.watched = watchlist.watched.filter(function (item) { return item.id !== filmId; });
    return writeWatchlist(watchlist);
  }

  function toggleWatchlistItem(filmId) {
    var currentStatus = findWatchlistStatus(filmId);
    var ok = currentStatus ? removeFromWatchlist(filmId) : addToWantList(filmId);
    if (!ok) {
      if (window.navigationAPI && window.navigationAPI.showToast) {
        window.navigationAPI.showToast('保存失败，请稍后再试');
      }
      return;
    }
    syncFilmButtons();
    renderWatchlist();
    if (window.navigationAPI && window.navigationAPI.showToast) {
      window.navigationAPI.showToast(currentStatus ? '已移出待看栏' : '已添加到待看栏！');
    }
  }
```

Also update these existing functions:

```js
  function renderFilmGrid() {
    var grid = document.getElementById('film-grid');
    if (!grid) return;
    var list = getFilteredFilms();
    grid.innerHTML = list.map(renderFilmCard).join('') || '<div class="wlempty">暂无影视内容</div>';
    syncFilmButtons();
  }

  function initializeFilmModule() {
    renderFilmGrid();
    renderRanking(currentRankingType);
    renderWatchlist();
  }
```

- [ ] **Step 4: 重新运行 film 测试，确认持久化闭环成立**

Run:

```powershell
npx vitest run tests/film.test.js --environment jsdom
```

Expected: PASS，至少输出 `3 passed`。

- [ ] **Step 5: 提交待看栏持久化功能**

Run:

```powershell
git add src/js/film.js tests/film.test.js
git commit -m "feat: persist film watchlist state"
```

Expected: commit 成功。

---

### Task 4: 完成待看栏面板渲染、状态迁移和失效数据清理

**Files:**
- Modify: `src/js/film.js`
- Modify: `src/css/components.css:116-123`
- Modify: `tests/film.test.js`

- [ ] **Step 1: 写出待看栏面板行为的失败测试**

Append to `tests/film.test.js`:

```js
describe('watchlist panel flows', () => {
  test('opens the panel on want tab and moves items between statuses without changing addedAt', async () => {
    await import('../src/js/film.js');

    window.filmAPI.setFilms(FILMS);
    window.filmAPI.setRankings(RANKINGS);
    window.filmAPI.initializeFilmModule();
    window.filmAPI.toggleWatchlistItem('film-last-emperor');

    var firstSaved = JSON.parse(window.localStorage.getItem('xds_watchlist'));
    var originalAddedAt = firstSaved.want[0].addedAt;

    window.filmAPI.openWatchlist();
    expect(document.getElementById('watchlist-panel').classList.contains('act')).toBe(true);
    expect(document.getElementById('wl-list').textContent).toContain('末代皇帝');

    window.filmAPI.moveWatchlistItem('film-last-emperor', 'watching');

    var afterMove = JSON.parse(window.localStorage.getItem('xds_watchlist'));
    expect(afterMove.want).toHaveLength(0);
    expect(afterMove.watching).toHaveLength(1);
    expect(afterMove.watching[0].id).toBe('film-last-emperor');
    expect(afterMove.watching[0].addedAt).toBe(originalAddedAt);
  });

  test('cleans invalid stored ids during initialization', async () => {
    window.localStorage.setItem('xds_watchlist', JSON.stringify({
      want: [{ id: 'missing-item', addedAt: '2026-06-08T00:00:00.000Z' }],
      watching: [],
      watched: []
    }));

    await import('../src/js/film.js');

    window.filmAPI.setFilms(FILMS);
    window.filmAPI.setRankings(RANKINGS);
    window.filmAPI.initializeFilmModule();

    var cleaned = JSON.parse(window.localStorage.getItem('xds_watchlist'));
    expect(cleaned.want).toEqual([]);
  });
});
```

- [ ] **Step 2: 运行测试，确认待看栏面板与迁移逻辑仍然失败**

Run:

```powershell
npx vitest run tests/film.test.js --environment jsdom
```

Expected: FAIL，断言面板未打开、`wl-list` 未渲染、`watching` 为空，或失效 `id` 仍保留。

- [ ] **Step 3: 在 `film.js` 中实现面板渲染、状态迁移和失效数据清理**

Add these functions to `src/js/film.js` and replace the placeholder implementations:

```js
  function getFilmById(filmId) {
    return films.find(function (item) {
      return item.id === filmId;
    }) || null;
  }

  function cleanInvalidWatchlistIds() {
    var watchlist = readWatchlist();
    var validIds = films.map(function (item) { return item.id; });
    ['want', 'watching', 'watched'].forEach(function (status) {
      watchlist[status] = watchlist[status].filter(function (item) {
        return validIds.indexOf(item.id) >= 0;
      });
    });
    writeWatchlist(watchlist);
  }

  function renderWatchlist() {
    var listRoot = document.getElementById('wl-list');
    if (!listRoot) return;

    var watchlist = readWatchlist();
    var list = watchlist[currentWatchlistType] || [];
    if (!list.length) {
      listRoot.innerHTML = '<div class="wlempty">暂无内容，去添加吧～</div>';
      return;
    }

    listRoot.innerHTML = list.map(function (entry) {
      var film = getFilmById(entry.id);
      if (!film) return '';

      var actions = [
        { key: 'want', label: '待看' },
        { key: 'watching', label: '在看' },
        { key: 'watched', label: '看过' }
      ].map(function (action) {
        return '<button class="wlmove' + (action.key === currentWatchlistType ? ' act' : '') + '" onclick="moveWatchlistItem(\'' + film.id + '\',\'' + action.key + '\')">' + action.label + '</button>';
      }).join('');

      return '' +
        '<div class="wlitem" data-watchlist-id="' + film.id + '">' +
          '<div class="wlthumb" style="background:' + film.coverStyle + '">' + film.icon + '</div>' +
          '<div class="wlinfo">' +
            '<h5>' + film.title + '</h5>' +
            '<p>' + [film.creator, film.year].filter(Boolean).join(' · ') + '</p>' +
            '<p>' + film.description + '</p>' +
            '<div class="wlops">' + actions + '</div>' +
          '</div>' +
          '<button class="wldel" onclick="toggleWatchlistItem(\'' + film.id + '\')">×</button>' +
        '</div>';
    }).join('');
  }

  function openWatchlist() {
    currentWatchlistType = 'want';
    document.getElementById('watchlist-panel').classList.add('act');
    document.querySelectorAll('#watchlist-panel .wltab').forEach(function (tab, index) {
      tab.classList.toggle('act', index === 0);
    });
    renderWatchlist();
  }

  function closeWatchlist() {
    document.getElementById('watchlist-panel').classList.remove('act');
  }

  function switchWatchlistTab(type, btn) {
    currentWatchlistType = type;
    document.querySelectorAll('#watchlist-panel .wltab').forEach(function (tab) {
      tab.classList.remove('act');
    });
    if (btn) btn.classList.add('act');
    renderWatchlist();
  }

  function moveWatchlistItem(filmId, nextStatus) {
    var currentStatus = findWatchlistStatus(filmId);
    if (!currentStatus || currentStatus === nextStatus) {
      renderWatchlist();
      return;
    }

    var watchlist = readWatchlist();
    var existing = null;
    ['want', 'watching', 'watched'].forEach(function (status) {
      watchlist[status] = watchlist[status].filter(function (entry) {
        if (entry.id === filmId) existing = entry;
        return entry.id !== filmId;
      });
    });

    watchlist[nextStatus].unshift({
      id: filmId,
      addedAt: existing ? existing.addedAt : new Date().toISOString()
    });

    if (!writeWatchlist(watchlist)) {
      if (window.navigationAPI && window.navigationAPI.showToast) {
        window.navigationAPI.showToast('保存失败，请稍后再试');
      }
      return;
    }

    currentWatchlistType = nextStatus;
    document.querySelectorAll('#watchlist-panel .wltab').forEach(function (tab) {
      tab.classList.toggle('act', tab.textContent === (nextStatus === 'want' ? '待看' : nextStatus === 'watching' ? '在看' : '看过'));
    });
    renderWatchlist();
    syncFilmButtons();
  }
```

Update `initializeFilmModule()` so it starts with cleanup:

```js
  function initializeFilmModule() {
    cleanInvalidWatchlistIds();
    renderFilmGrid();
    renderRanking(currentRankingType);
    renderWatchlist();
  }
```

Update `src/css/components.css` by appending:

```css
.wlempty{background:#fff;border-radius:14px;padding:18px;text-align:center;color:#B5ADA5;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.04)}
.wlops{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
.wlmove{padding:4px 8px;border-radius:10px;border:1px solid #EDE8E0;background:#F5F0E8;color:#8A8279;font-size:10px;cursor:pointer;transition:all .2s}
.wlmove.act{background:#C9A96E;color:#fff;border-color:#C9A96E}
```

- [ ] **Step 4: 重新运行 film 测试，确认面板与迁移逻辑通过**

Run:

```powershell
npx vitest run tests/film.test.js --environment jsdom
```

Expected: PASS，至少输出 `5 passed`。

- [ ] **Step 5: 提交待看栏面板完成版**

Run:

```powershell
git add src/js/film.js src/css/components.css tests/film.test.js
git commit -m "feat: complete film watchlist panel flows"
```

Expected: commit 成功。

---

### Task 5: 更新文档并执行完整回归验证

**Files:**
- Modify: `README.md:34-49`
- Optionally inspect: `docs/superpowers/specs/2026-06-08-film-watchlist-design.md`

- [ ] **Step 1: 更新 README 的项目结构说明**

Update the structure block in `README.md` so the JS and data sections become:

```text
│   ├── js/
│   │   ├── app.js
│   │   ├── checkin.js
│   │   ├── storage.js
│   │   ├── navigation.js
│   │   ├── favorites.js
│   │   ├── film.js
│   │   ├── noun.js
│   │   ├── timeline.js
│   │   ├── podcast.js
│   │   └── ai-assistant.js
│   └── data/
│       ├── nouns.json
│       ├── timeline.json
│       ├── podcasts.json
│       ├── books.json
│       ├── memes.json
│       ├── films.json
│       └── rankings.json
```

- [ ] **Step 2: 运行完整自动化测试**

Run:

```powershell
npm test
```

Expected: PASS，`tests/navigation.test.js`、`tests/checkin.test.js`、`tests/film.test.js` 全部通过。

- [ ] **Step 3: 做一次本地手工冒烟验证**

Run:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000` and verify these exact behaviors manually:

1. 进入“影视书目推荐”页后，卡片由 JSON 渲染，不再是写死在 HTML 中。
2. 点击“📖 书籍 / 🎬 影视 / 📺 纪录片”，列表会切换。
3. 点击“我的待看栏”，面板默认停在“待看”。
4. 在卡片上点击“＋ 待看”，按钮变成“✓ 已添加”，刷新页面后仍保留。
5. 在待看栏里把同一项目从“待看”切到“在看”再切到“看过”，项目始终只存在于一个分组。
6. 返回根目录查看浏览器控制台，无新的阻断性报错。

Expected: 六项都满足。

- [ ] **Step 4: 停止静态服务器并检查工作区**

If the server is still running, stop it with `Ctrl+C`, then run:

```powershell
git status --short
```

Expected: 只看到本任务涉及的文件改动；如果已经完成最后提交，则输出为空。

- [ ] **Step 5: 提交 README 与验证结果**

Run:

```powershell
git add README.md
git commit -m "docs: update film module project structure"
```

Expected: commit 成功。如果 README 在本任务前已经处于未提交修改状态，先只暂存本次结构调整，再提交。

---

## Self-Review Checklist

- Spec coverage:
  - `film.js` 独立模块 → Task 1 / 3 / 4
  - `films.json` / `rankings.json` → Task 2
  - `xds_watchlist` 三态持久化 → Task 3 / 4
  - 默认打开 `want` → Task 4
  - 迁移保留 `addedAt` 且插入目标分组头部 → Task 4
  - 失效 `filmId` 清理 → Task 4
  - `app.js` 装配与全局函数暴露 → Task 2
  - 测试覆盖 → Task 1 / 2 / 3 / 4 / 5
- Placeholder scan: 本计划没有 `TODO` / `TBD` / “类似任务 N” 形式的占位。
- Type consistency:
  - 使用统一方法名：`filterFilms`、`switchRankingTab`、`openWatchlist`、`closeWatchlist`、`switchWatchlistTab`、`toggleWatchlistItem`、`moveWatchlistItem`
  - storage key 统一为 `xds_watchlist`

---

Plan complete and saved to `docs/superpowers/plans/2026-06-08-film-watchlist.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
