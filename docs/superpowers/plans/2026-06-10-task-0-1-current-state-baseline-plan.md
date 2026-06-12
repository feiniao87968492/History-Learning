# Task 0.1 Current State Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `docs/current-state.md` as a fact-only baseline document that lists the current pages, modules, JSON data files, inline script areas, exposed `window.xxxAPI`, and LocalStorage keys in the repository.

**Architecture:** The implementation stays documentation-first. It does not change product behavior or refactor code. Work proceeds by scanning the current workspace, extracting facts from `index.html`, `src/js`, and `src/data`, and writing them into a stable markdown structure that later tasks can extend with audit results.

**Tech Stack:** Markdown, HTML, ES5 JavaScript, JSON, ripgrep, Git

---

## File Map

- Create: `docs/current-state.md`
- Read: `index.html`
- Read: `src/js/app.js`
- Read: `src/js/storage.js`
- Read: `src/js/navigation.js`
- Read: `src/js/noun.js`
- Read: `src/js/timeline.js`
- Read: `src/js/podcast.js`
- Read: `src/js/ai-assistant.js`
- Read: `src/js/favorites.js`
- Read: `src/js/checkin.js`
- Read: `src/js/film.js`
- Read: `src/data/*.json`
- Read: `README.md`
- Read: `CLAUDE.md`
- Read: `TASKS/2026-06-10-history-learning-phase1-plan-v2.md`

---

### Task 1: Create The Baseline Document Skeleton

**Files:**
- Create: `docs/current-state.md`

- [ ] **Step 1: Verify the Task 0.1 requirements before writing**

Run:

```bash
rg -n "Task 0.1|列出所有页面|window.xxxAPI|LocalStorage key" TASKS/2026-06-10-history-learning-phase1-plan-v2.md
```

Expected:

```text
Matches for Task 0.1 requirements in the Phase 1 plan.
```

- [ ] **Step 2: Create the markdown skeleton with the approved section structure**

Write `docs/current-state.md` with this initial content:

```md
# 学的是史 当前仓库基线

## 1. 项目概览

## 2. 页面与主要容器

## 3. JS 模块与职责

## 4. 数据文件清单

## 5. index.html 内联脚本现状

## 6. 已暴露的 window API

## 7. 已识别的 LocalStorage key

## 8. 当前状态备注
```

- [ ] **Step 3: Run a quick read-back to confirm the file exists and headers are correct**

Run:

```bash
type docs\current-state.md
```

Expected:

```text
The file exists and shows exactly 8 top-level sections.
```

- [ ] **Step 4: Commit the skeleton**

Run:

```bash
git add docs/current-state.md
git commit -m "docs: add current state baseline skeleton"
```

Expected:

```text
[main ...] docs: add current state baseline skeleton
```

---

### Task 2: Fill Project Overview And Page Inventory

**Files:**
- Modify: `docs/current-state.md`
- Read: `README.md`
- Read: `CLAUDE.md`
- Read: `index.html`

- [ ] **Step 1: Identify the project positioning and stack from repository docs**

Run:

```bash
rg -n "中国历史学习网站|原生 HTML|JSON|LocalStorage|Vitest" README.md CLAUDE.md
```

Expected:

```text
Matches describing the project定位 and tech stack.
```

- [ ] **Step 2: Extract page and container ids from `index.html`**

Run:

```bash
rg -n "<div id=\"[^\"]+\" class=\"(page|sub|nd|pplayer|pdc|ckpanel|fov|feov|meme-ov|ap)\"" index.html
```

Expected:

```text
Matches for login/home/discuss/profile pages, sub pages, and overlays/panels.
```

- [ ] **Step 3: Write the project overview section with fact-only summary**

Update the top of `docs/current-state.md` to include content in this shape:

```md
# 学的是史 当前仓库基线

## 1. 项目概览

- 项目定位：中国历史学习网站 Web 原型，当前处于 Web 原型补完与模块化整理阶段。
- 技术栈：原生 HTML / CSS / ES5 JavaScript / JSON 静态数据 / LocalStorage / Vitest + jsdom。
- 页面入口：`index.html`。
- 主要目录：`src/css/`、`src/js/`、`src/data/`、`tests/`、`docs/`、`TASKS/`。
```

- [ ] **Step 4: Write the page and container inventory section**

Append a section in this shape, using the real containers found in `index.html`:

```md
## 2. 页面与主要容器

### 主页面（`.page`）

- `login-page`：登录页。
- `home-page`：首页。
- `discuss-page`：讨论区页面。
- `profile-page`：个人页。

### 子页面（`.sub`）

- `noun-page`：名词解释页。
- `timeline-page`：时间轴页。
- `science-page`：科学备考页。
- `mindmap-page`：思维导图页。
- `people-page`：人物专题页。
- `podcast-page`：AI 播客页。
- `film-page`：影视书目页。

### 详情、面板与弹层

- `noun-detail`：名词详情面板。
- `podcast-player`：播客播放器。
- `people-detail-card`：人物详情卡。
- `checkin-panel`：打卡面板。
- `feedback-overlay`：反馈弹层。
- `post-overlay`：发帖弹层。
- `feat-detail-overlay`：朝代特征详情弹层。
- `meme-overlay`：梗图弹层。
- `ai-panel`：AI 助手面板。
```

- [ ] **Step 5: Verify the page section is complete**

Run:

```bash
rg -n "## 2\\. 页面与主要容器|login-page|film-page|meme-overlay|ai-panel" docs/current-state.md
```

Expected:

```text
Matches for the page inventory section and representative containers.
```

- [ ] **Step 6: Commit the overview and page inventory**

Run:

```bash
git add docs/current-state.md
git commit -m "docs: record project overview and page inventory"
```

Expected:

```text
[main ...] docs: record project overview and page inventory
```

---

### Task 3: Fill Module, Data File, API, And LocalStorage Sections

**Files:**
- Modify: `docs/current-state.md`
- Read: `src/js/*.js`
- Read: `src/data/*.json`

- [ ] **Step 1: Inventory module files and exposed APIs from `src/js`**

Run:

```bash
rg -n "window\\.[A-Za-z0-9_]+API\\s*=|window\\.[A-Za-z0-9_]+\\s*=" src/js
```

Expected:

```text
Matches for storageAPI, navigationAPI, nounAPI, timelineAPI, podcastAPI, aiAssistantAPI, favoritesAPI, checkinAPI, filmAPI, and any compatibility globals.
```

- [ ] **Step 2: Inventory JSON data files**

Run:

```bash
dir /b src\data\*.json
```

Expected:

```text
A file list including nouns.json, timeline.json, films.json, rankings.json, podcasts.json, people.json, discussions.json, hot-articles.json, profile-menu.json, feedback-types.json, science-tools.json, books.json, memes.json.
```

- [ ] **Step 3: Inventory LocalStorage key usage from HTML and JS**

Run:

```bash
rg -n "localStorage|getStoredJSON|getStoredString|setStoredJSON|setStoredString|xds_|checkins|note_" index.html src/js tests
```

Expected:

```text
Matches showing keys such as checkins, note_<name>, xds_watchlist, and any other real keys present in the current workspace.
```

- [ ] **Step 4: Write the module section with real files and responsibilities**

Add a section in this shape, replacing placeholders with the actual modules present:

```md
## 3. JS 模块与职责

- `src/js/app.js`：应用入口，负责初始化和部分全局兼容暴露。
- `src/js/storage.js`：LocalStorage 封装，暴露 `window.storageAPI`。
- `src/js/navigation.js`：登录、子页面切换、Toast，暴露 `window.navigationAPI`。
- `src/js/noun.js`：名词详情、收藏交互、搜索，暴露 `window.nounAPI`。
- `src/js/timeline.js`：时间轴渲染与交互，暴露 `window.timelineAPI`。
- `src/js/podcast.js`：播客筛选与播放器，暴露 `window.podcastAPI`。
- `src/js/ai-assistant.js`：AI 助手面板与问答交互，暴露 `window.aiAssistantAPI`。
- `src/js/favorites.js`：收藏相关渲染，暴露 `window.favoritesAPI`。
- `src/js/checkin.js`：打卡面板、连续天数与统计，暴露 `window.checkinAPI`。
- `src/js/film.js`：影视书目、榜单、待看栏，暴露 `window.filmAPI`。
```

- [ ] **Step 5: Write the data file section with one-line descriptions**

Add a section in this shape, using real file names from `src/data/`:

```md
## 4. 数据文件清单

- `src/data/nouns.json`：名词解释数据。
- `src/data/timeline.json`：时间轴朝代与事件数据。
- `src/data/podcasts.json`：播客列表数据。
- `src/data/films.json`：影视书目数据。
- `src/data/rankings.json`：影视/书籍榜单数据。
- `src/data/people.json`：人物专题数据。
- `src/data/discussions.json`：讨论区帖子数据。
- `src/data/hot-articles.json`：首页热点文章数据。
- `src/data/profile-menu.json`：个人页菜单数据。
- `src/data/feedback-types.json`：反馈类型数据。
- `src/data/science-tools.json`：科学备考工具入口数据。
- `src/data/books.json`：书籍相关数据文件。
- `src/data/memes.json`：梗图内容数据。
```

- [ ] **Step 6: Write the global API and LocalStorage sections**

Add two sections in this shape, replacing the sample keys with the real results of the search:

```md
## 6. 已暴露的 window API

- `window.storageAPI`：来自 `src/js/storage.js`，负责 JSON/字符串存取。
- `window.navigationAPI`：来自 `src/js/navigation.js`，负责登录、页面切换和 Toast。
- `window.nounAPI`：来自 `src/js/noun.js`，负责名词页交互。
- `window.timelineAPI`：来自 `src/js/timeline.js`，负责时间轴交互。
- `window.podcastAPI`：来自 `src/js/podcast.js`，负责播客列表和播放器。
- `window.aiAssistantAPI`：来自 `src/js/ai-assistant.js`，负责 AI 助手交互。
- `window.favoritesAPI`：来自 `src/js/favorites.js`，负责收藏相关渲染。
- `window.checkinAPI`：来自 `src/js/checkin.js`，负责打卡与统计。
- `window.filmAPI`：来自 `src/js/film.js`，负责影视书目与待看栏。

## 7. 已识别的 LocalStorage key

- `checkins`：用于打卡记录。
- `note_<节点名>`：用于思维导图节点笔记。
- `xds_watchlist`：用于影视待看栏状态。
```

- [ ] **Step 7: Verify these sections were populated**

Run:

```bash
rg -n "## 3\\. JS 模块与职责|## 4\\. 数据文件清单|## 6\\. 已暴露的 window API|## 7\\. 已识别的 LocalStorage key|xds_watchlist" docs/current-state.md
```

Expected:

```text
Matches for all four sections and at least one concrete LocalStorage key.
```

- [ ] **Step 8: Commit the module, data, API, and LocalStorage inventory**

Run:

```bash
git add docs/current-state.md
git commit -m "docs: record modules data apis and storage keys"
```

Expected:

```text
[main ...] docs: record modules data apis and storage keys
```

---

### Task 4: Fill Inline Script Inventory And Finalize The Baseline

**Files:**
- Modify: `docs/current-state.md`
- Read: `index.html`

- [ ] **Step 1: Inventory major inline script blocks in `index.html`**

Run:

```bash
rg -n "function swTab|function filterHot|function filFilm|function openPeoDet|function swMind|function submitPost|function doCheckin" index.html
```

Expected:

```text
Matches for the major functional blocks still defined inside the inline script area.
```

- [ ] **Step 2: Write the inline script section as grouped functional blocks**

Add a section in this shape, using the current inline blocks actually present in `index.html`:

```md
## 5. index.html 内联脚本现状

- 页面切换：包含主页面切换和子页面切换逻辑。
- 梗图轮播：包含梗图弹层打开/关闭和滚动指示器逻辑。
- 热点筛选：包含首页热点分类过滤逻辑。
- 影视榜单与待看栏：仍保留筛选、榜单、待看栏相关内联实现。
- 人物关系图：仍保留人物关系渲染、详情卡和搜索相关逻辑。
- 思维导图：仍保留 tab 切换、节点笔记打开/保存逻辑。
- 讨论区：仍保留发帖、评论展开和筛选逻辑。
- 打卡签到：仍保留打卡面板、日历和统计逻辑。
```

- [ ] **Step 3: Write the final factual remarks section**

Append this section shape, adjusting only where the repository facts differ:

```md
## 8. 当前状态备注

- 当前仓库处于“部分模块化、部分内联脚本保留”的过渡状态。
- `src/js/` 已存在多份业务模块文件，但 `index.html` 仍保留较大段内联脚本。
- `src/data/` 下的数据文件已扩展到多个内容模块，不再只有最早期的少量种子文件。
- 当前仓库已存在测试目录和多份测试文件。
```

- [ ] **Step 4: Run a final requirements check against the Task 0.1 acceptance criteria**

Run:

```bash
rg -n "## 2\\. 页面与主要容器|## 3\\. JS 模块与职责|## 4\\. 数据文件清单|## 5\\. index.html 内联脚本现状|## 6\\. 已暴露的 window API|## 7\\. 已识别的 LocalStorage key" docs/current-state.md
```

Expected:

```text
All required sections are present in docs/current-state.md.
```

- [ ] **Step 5: Run a wording check to ensure the file stays fact-only**

Run:

```bash
rg -n "应该|建议|后续将|TODO|TBD|审计|整改方案" docs/current-state.md
```

Expected:

```text
No matches, or only acceptable references inside quoted task names that are intentionally not part of the baseline narrative.
```

- [ ] **Step 6: Read the finished document end-to-end for readability**

Run:

```bash
type docs\current-state.md
```

Expected:

```text
The document reads cleanly top-to-bottom and can be understood by a new developer without extra context.
```

- [ ] **Step 7: Commit the completed Task 0.1 baseline**

Run:

```bash
git add docs/current-state.md
git commit -m "docs: add current state baseline"
```

Expected:

```text
[main ...] docs: add current state baseline
```

---

## Self-Review

- **Spec coverage:** The plan covers all required outputs from the spec: project overview, page inventory, module list, data files, inline scripts, exposed APIs, LocalStorage keys, and factual remarks.
- **Placeholder scan:** No `TODO`, `TBD`, or “implement later” placeholders are used in the actionable steps.
- **Type consistency:** File names, section titles, and key names match the spec and current repository terminology.
