# 论坛首页重构 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将讨论区升级为社区首页，五种帖子类型 + 标签体系，移除 AI 播客/错题/题目/登录，工具页收纳名词+时间轴。

**Architecture:** 将 `discuss.js` 重命名为 `forum.js`，扩展支持 5 种帖子类型 + 双维度标签；精简 `index.html` 页面结构（移除登录页及下线模块 HTML）；`app.js` 简化初始化；底部导航改为首页/工具/我的三 Tab。

**Tech Stack:** 原生 HTML/CSS/JS (ES5), IIFE 模块, JSON 静态数据, LocalStorage + adapters, Vitest + jsdom

---

## 文件变更总览

| 操作 | 文件 |
|------|------|
| **删除** | `src/js/podcast.js`, `src/js/quiz.js`, `src/js/review.js`, `src/js/learning-stats.js`, `src/js/film.js`, `src/js/people.js`, `src/js/adapters/audio.js` |
| **删除** | `src/data/podcasts.json`, `src/data/questions.json`, `src/data/films.json`, `src/data/people.json`, `src/data/rankings.json`, `src/data/books.json`, `src/data/hot-articles.json`, `src/data/memes.json` |
| **删除** | `tests/podcast.test.js`, `tests/quiz.test.js`, `tests/wrong-question.test.js`, `tests/review.test.js`, `tests/learning-stats.test.js`, `tests/film.test.js`, `tests/people.test.js`, `tests/hot-articles.test.js` |
| **新建** | `src/js/forum.js`（由 `discuss.js` 重构而来）, `src/js/tools.js` |
| **新建** | `tests/forum.test.js`, `tests/forum-post-types.test.js`, `tests/forum-tags.test.js`, `tests/forum-xss.test.js`, `tests/tools-page.test.js` |
| **修改** | `index.html`, `src/js/app.js`, `src/js/navigation.js`, `src/data/discussions.json`, `src/css/pages.css`, `src/css/components.css` |
| **修改** | `scripts/validate-data.js`, `tests/validate-data.test.js`, `tests/app-static-data.test.js`, `tests/adapter-wiring.test.js`, `tests/favorites.test.js`, `tests/navigation.test.js`, `CLAUDE.md` |
| **保留** | `src/js/noun.js`, `src/js/timeline.js`, `src/js/checkin.js`, `src/js/favorites.js`, `src/js/ai-assistant.js`, `src/js/mindmap.js`, 全部 adapter（除 audio.js） |

---

### Task 1: 移除下线模块文件

**Files:**
- Delete: `src/js/podcast.js`, `src/js/quiz.js`, `src/js/review.js`, `src/js/learning-stats.js`, `src/js/film.js`, `src/js/people.js`, `src/js/adapters/audio.js`
- Delete: `src/data/podcasts.json`, `src/data/questions.json`, `src/data/films.json`, `src/data/people.json`, `src/data/rankings.json`, `src/data/books.json`, `src/data/hot-articles.json`, `src/data/memes.json`
- Delete: `tests/podcast.test.js`, `tests/quiz.test.js`, `tests/wrong-question.test.js`, `tests/review.test.js`, `tests/learning-stats.test.js`, `tests/film.test.js`, `tests/people.test.js`, `tests/hot-articles.test.js`
- Modify: `index.html`（移除 script 引用）
- Modify: `src/js/app.js`（移除相关 exposeGlobals 和 initializeData 逻辑）

- [ ] **Step 1: 删除 JS 模块文件**

```bash
git rm src/js/podcast.js src/js/quiz.js src/js/review.js src/js/learning-stats.js src/js/film.js src/js/people.js src/js/adapters/audio.js
```

- [ ] **Step 2: 删除数据文件**

```bash
git rm src/data/podcasts.json src/data/questions.json src/data/films.json src/data/people.json src/data/rankings.json src/data/books.json src/data/hot-articles.json src/data/memes.json
```

- [ ] **Step 3: 删除对应测试文件**

```bash
git rm tests/podcast.test.js tests/quiz.test.js tests/wrong-question.test.js tests/review.test.js tests/learning-stats.test.js tests/film.test.js tests/people.test.js tests/hot-articles.test.js
```

- [ ] **Step 4: 更新 index.html，移除已删除模块的 script 引用**

在 `index.html` 中删除以下行：

```html
<!-- 删除这些行 -->
<script src="./src/js/adapters/audio.js?v=20260612-timeline-fix2"></script>
<script src="./src/js/learning-stats.js?v=20260612-timeline-fix2"></script>
<script src="./src/js/people.js?v=20260612-timeline-fix2"></script>
<script src="./src/js/podcast.js?v=20260612-timeline-fix2"></script>
<script src="./src/js/quiz.js?v=20260612-timeline-fix2"></script>
<script src="./src/js/review.js?v=20260612-timeline-fix2"></script>
```

- [ ] **Step 5: 更新 app.js — 清理 exposeGlobals() 中已移除模块的全局暴露**

在 `src/js/app.js` 的 `exposeGlobals()` 函数中，删除以下代码块：

删除 peopleAPI 暴露块（约第 80-86 行）：
```js
    if (window.peopleAPI) {
      window.swPeoGroup = window.peopleAPI.swPeoGroup;
      window.openCenterDet = window.peopleAPI.openCenterDet;
      window.openPeoDet = window.peopleAPI.openPeoDet;
      window.closePeoDet = window.peopleAPI.closePeoDet;
      window.searchPeople = window.peopleAPI.searchPeople;
    }
```

删除 podcastAPI 暴露块（约第 95-106 行）：
```js
    if (window.podcastAPI) {
      window.filterPodcast = window.podcastAPI.filterPodcast;
      window.openPlayer = window.podcastAPI.openPlayer;
      window.closePlayer = window.podcastAPI.closePlayer;
      window.togglePlay = window.podcastAPI.togglePlay;
      window.seekPodcast = window.podcastAPI.seekPodcast;
      window.toggleSpeed = window.podcastAPI.toggleSpeed;
      window.setTimer = window.podcastAPI.setTimer;
      window.showTimer = window.podcastAPI.showTimer;
      window.prevPodcast = window.podcastAPI.prevPodcast;
      window.nextPodcast = window.podcastAPI.nextPodcast;
    }
```

删除 filmAPI 暴露块（约第 108-116 行）：
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

删除 quizAPI 暴露块（约第 124-131 行）：
```js
    if (window.quizAPI) {
      window.startQuiz = window.quizAPI.startQuiz;
      window.selectQuizAnswer = window.quizAPI.selectQuizAnswer;
      window.nextQuizQuestion = window.quizAPI.nextQuizQuestion;
      window.renderWrongQuestions = window.quizAPI.renderWrongQuestions;
      window.retryWrongQuestion = window.quizAPI.retryWrongQuestion;
      window.markWrongQuestionMastered = window.quizAPI.markWrongQuestionMastered;
    }
```

删除 learningStatsAPI 暴露块（约第 141-143 行）：
```js
    if (window.learningStatsAPI) {
      window.updateLearningStats = window.learningStatsAPI.updateProfileStats;
    }
```

删除 reviewAPI 暴露块（约第 145-150 行）：
```js
    if (window.reviewAPI) {
      window.renderReviewZone = window.reviewAPI.renderReviewZone;
      window.filterReviewRange = window.reviewAPI.filterReviewRange;
      window.openReviewNoun = window.reviewAPI.openReviewNoun;
      window.retryReviewQuestion = window.reviewAPI.retryReviewQuestion;
    }
```

将 `window.discussAPI` 引用替换为 `window.forumAPI`（约第 152-161 行）：
```js
    if (window.forumAPI) {
      window.filterForum = window.forumAPI.filterForum;
      window.toggleComments = window.forumAPI.toggleComments;
      window.openPost = window.forumAPI.openPost;
      window.closePost = window.forumAPI.closePost;
      window.togglePostTag = window.forumAPI.togglePostTag;
      window.submitPost = window.forumAPI.submitPost;
      window.addComment = window.forumAPI.addComment;
      window.addCommentFromInput = window.forumAPI.addCommentFromInput;
    }
```

- [ ] **Step 6: 更新 app.js — 清理 initializeData() 中已移除模块的初始化**

在 `src/js/app.js` 的 `initializeData()` 函数中，删除以下代码块：

删除 people 数据加载块（约第 305-309 行）：
```js
    if (window.peopleAPI) {
      var people = await loadJSON('./src/data/people.json?v=20260612-timeline-fix2', { people: [], relations: [] });
      window.peopleAPI.setPeopleData(people);
      try { window.peopleAPI.renderPeopleGraph(); } catch (e) { console.error('renderPeopleGraph err:', e); }
    }
```

删除 podcast 数据加载块（约第 317-318 行）：
```js
    var podcasts = await loadJSON('./src/data/podcasts.json?v=20260612-timeline-fix2', []);
    if (window.podcastAPI) window.podcastAPI.setPodcasts(podcasts);
```

删除 quiz 数据加载块（约第 320-323 行）：
```js
    if (window.quizAPI) {
      var questions = await loadJSON('./src/data/questions.json?v=20260612-timeline-fix2', []);
      window.quizAPI.setQuestions(questions);
    }
```

删除 film/rankings 数据加载块（约第 325-333 行）：
```js
    var films = await loadJSON('./src/data/films.json?v=20260612-timeline-fix2', []);
    var rankings = await loadJSON('./src/data/rankings.json?v=20260612-timeline-fix2', { book: [], film: [], doc: [] });
    if (window.filmAPI) {
      window.filmAPI.setFilms(films);
      window.filmAPI.setRankings(rankings);
      if (typeof window.filmAPI.initializeFilmModule === 'function') {
        window.filmAPI.initializeFilmModule();
      }
    }
```

删除 memes 加载块（约第 335-337 行）：
```js
    if (document.getElementById('meme-scroll')) {
      renderMemes(await loadJSON('./src/data/memes.json?v=20260612-timeline-fix2', []));
    }
```

删除 hot-articles 加载块（约第 341-343 行）：
```js
    if (document.getElementById('hot-articles')) {
      renderHotArticles(await loadJSON('./src/data/hot-articles.json?v=20260612-timeline-fix2', []));
    }
```

删除 learningStats 更新块（约第 351-353 行）：
```js
    if (window.learningStatsAPI && typeof window.learningStatsAPI.updateProfileStats === 'function') {
      window.learningStatsAPI.updateProfileStats();
    }
```

- [ ] **Step 7: 更新 index.html — 移除 discuss.js script 引用（为 Task 2 forum.js 替换做准备）**

在 `index.html` 中，将：
```html
<script src="./src/js/discuss.js?v=20260612-timeline-fix2"></script>
```
替换为（暂时注释，Task 2 完成后取消注释）：
```html
<!-- <script src="./src/js/forum.js?v=20260612-timeline-fix2"></script> -->
```

- [ ] **Step 8: 运行现有测试确认非受影响模块仍通过**

```bash
npx vitest run --environment jsdom
```

预期：被删除的测试文件不再执行；保留的测试（noun, timeline, checkin, favorites, navigation, discuss 等）继续通过。discuss.test.js 此时会因为 `discuss.js` 被删除而失败 — 这是预期的，后续 task 会处理。

- [ ] **Step 9: 提交**

```bash
git add -A
git commit -m "feat: remove podcast, quiz, review, film, people, learning-stats modules"
```

---

### Task 2: 创建 forum.js（由 discuss.js 重构）

**Files:**
- Create: `src/js/forum.js`
- Modify: `index.html`（更新 script 引用）
- Keep: `src/js/discuss.js`（暂时保留为兼容别名，最后删除）

- [ ] **Step 1: 复制 discuss.js 为 forum.js，作为基板**

```bash
cp src/js/discuss.js src/js/forum.js
```

- [ ] **Step 2: 修改 forum.js — 更新存储 Key 和核心数据结构**

将 `STORAGE_KEY` 从 `'xds_discussions'` 改为 `'xds_forum_posts'`：

```js
(function () {
  var STORAGE_KEY = 'xds_forum_posts';
  var discussions = [];
  var expandedPostIds = Object.create(null);
  var activeType = 'all';
  var activeTag = 'all';
  var postTags = [];
```

- [ ] **Step 3: 修改 forum.js — 移除旧 tagCategoryMap，添加类型和标签常量**

删除旧的 `tagCategoryMap`：
```js
  // 删除这些行
  var tagCategoryMap = {
    '史观': 'view',
    '冷知识': 'cold',
    '求助': 'help',
    '资源': 'resource'
  };
```

添加新的类型和标签定义：
```js
  var POST_TYPES = ['discussion', 'article', 'person', 'media', 'resource'];
  var TYPE_LABELS = {
    'discussion': '讨论',
    'article': '文章',
    'person': '人物',
    'media': '书影',
    'resource': '资源'
  };
  var DYNASTY_TAGS = ['先秦', '秦', '汉', '三国', '晋', '南北朝', '隋', '唐', '宋', '元', '明', '清', '近代', '跨朝代'];
  var TOPIC_TAGS = ['政治', '军事', '经济', '文化', '科技', '地理', '社会', '制度'];
```

- [ ] **Step 4: 修改 forum.js — 更新 getCategoryFromTags() 为 getTypeFromTags()**

将旧的 `getCategoryFromTags()` 替换为 `getDefaultPostType()`：
```js
  function getDefaultPostType() {
    return 'discussion';
  }
```

- [ ] **Step 5: 修改 forum.js — 更新 renderPost() 支持五种类型**

将 `renderPost()` 函数替换为以下版本（根据 `post.type` 渲染不同卡片样式）：

```js
  function renderPostMeta(post) {
    var type = post.type || 'discussion';
    if (type === 'article') {
      return '<div class="fm-meta">' +
        '<span class="fm-type-tag article">📄 文章</span>' +
        (post.metadata && post.metadata.externalUrl ? '<a class="fm-link" href="' + escapeHtml(post.metadata.externalUrl) + '" target="_blank" rel="noopener">阅读原文 →</a>' : '') +
        '</div>';
    }
    if (type === 'person') {
      return '<div class="fm-meta">' +
        '<span class="fm-type-tag person">👤 人物</span>' +
        '<span class="fm-dynasty">' + escapeHtml((post.metadata && post.metadata.dynasty) || '') + '</span>' +
        '<span class="fm-role">' + escapeHtml((post.metadata && post.metadata.role) || '') + '</span>' +
        '</div>';
    }
    if (type === 'media') {
      return '<div class="fm-meta">' +
        '<span class="fm-type-tag media">🎬 书影</span>' +
        '<span class="fm-media-type">' + escapeHtml((post.metadata && post.metadata.mediaType) || '') + '</span>' +
        (post.metadata && post.metadata.rating ? '<span class="fm-rating">★ ' + escapeHtml(post.metadata.rating) + '</span>' : '') +
        '</div>';
    }
    if (type === 'resource') {
      return '<div class="fm-meta">' +
        '<span class="fm-type-tag resource">📦 资源</span>' +
        (post.metadata && post.metadata.externalUrl ? '<a class="fm-link" href="' + escapeHtml(post.metadata.externalUrl) + '" target="_blank" rel="noopener">查看链接 →</a>' : '') +
        '</div>';
    }
    // discussion — no special meta
    return '';
  }

  function renderPostTags(post) {
    var tags = Array.isArray(post.tags) ? post.tags : [];
    if (!tags.length) return '';
    return '<div class="fm-tags">' + tags.map(function (tag) {
      return '<span class="fm-tag">' + escapeHtml(tag) + '</span>';
    }).join('') + '</div>';
  }

  function renderPost(post) {
    var type = post.type || 'discussion';
    var visible = true;
    if (activeType !== 'all' && activeType !== type) {
      visible = false;
    }
    if (activeTag !== 'all') {
      var tags = Array.isArray(post.tags) ? post.tags : [];
      if (tags.indexOf(activeTag) === -1) {
        visible = false;
      }
    }
    var commentsCount = post.comments;
    if (commentsCount === null || typeof commentsCount === 'undefined') {
      commentsCount = Array.isArray(post.commentsList) ? post.commentsList.length : 0;
    }

    return '<div class="pcard" data-post-id="' + escapeHtml(post.id || '') + '" data-post-type="' + escapeHtml(type) + '" style="display:' + (visible ? 'block' : 'none') + '">' +
      '<div class="pa"><div class="pav">' + escapeHtml((post.author && post.author.avatar) || post.avatar || '🙂') + '</div><div><div class="nm">' + escapeHtml((post.author && post.author.name) || post.author || '匿名') + '</div><div class="ti">' + escapeHtml(post.time || post.createdAt || '') + '</div></div></div>' +
      '<div class="pc"><h4>' + escapeHtml(post.title || '') + '</h4><p>' + escapeHtml(post.body || post.content || '') + '</p></div>' +
      renderPostMeta(post) +
      renderPostTags(post) +
      '<div class="pact"><span>❤️ ' + escapeHtml((post.stats && post.stats.likes) || post.likes || '0') + '</span><span class="comment-toggle" data-comment-post="' + escapeHtml(post.id || '') + '">💬 ' + escapeHtml(commentsCount) + '</span><span>⭐ ' + escapeHtml((post.stats && post.stats.favorites) || '收藏') + '</span></div>' +
      renderCommentList(post) +
    '</div>';
  }
```

- [ ] **Step 6: 修改 forum.js — 更新 filterDiscuss() 为 filterForum()**

```js
  function filterForum(type, button) {
    activeType = type || 'all';

    document.querySelectorAll('#forum-tabs .htab').forEach(function (tab) {
      tab.classList.remove('act');
    });

    if (button) {
      button.classList.add('act');
    }

    renderDiscussions();
  }

  function filterForumByTag(tag, button) {
    activeTag = (tag === 'all' || !tag) ? 'all' : tag;

    document.querySelectorAll('#forum-tag-tabs .htab').forEach(function (tab) {
      tab.classList.remove('act');
    });

    if (button) {
      button.classList.add('act');
    }

    renderDiscussions();
  }
```

- [ ] **Step 7: 修改 forum.js — 更新 submitPost() 匹配新数据模型**

```js
  function submitPost() {
    var titleInput = document.getElementById('post-title');
    var bodyInput = document.getElementById('post-body');
    var title = titleInput ? titleInput.value.trim() : '';
    var body = bodyInput ? bodyInput.value.trim() : '';
    var typeSelect = document.getElementById('post-type-select');
    var selectedType = typeSelect ? typeSelect.value : 'discussion';
    var post;

    if (!title) {
      showToast('请输入帖子标题');
      return false;
    }

    if (!body) {
      showToast('请输入帖子内容');
      return false;
    }

    if (postTags.length === 0) {
      showToast('请至少选择一个标签');
      return false;
    }

    if (postTags.length > 5) {
      showToast('最多选择5个标签');
      return false;
    }

    post = {
      id: 'post-user-' + new Date().getTime() + '-' + (discussions.length + 1),
      type: selectedType,
      title: title,
      content: body,
      author: {
        id: 'u_local',
        name: '我',
        avatar: '🙂'
      },
      tags: postTags.slice(),
      metadata: {},
      stats: { views: 0, likes: 0, comments: 0, favorites: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      commentsList: [],
      // 兼容旧字段
      body: body,
      authorName: '我',
      avatar: '🙂',
      time: '刚刚',
      likes: '0',
      comments: '0',
      favorite: '收藏'
    };

    discussions.unshift(post);
    saveDiscussions();
    clearPostForm();
    renderDiscussions();
    showToast('帖子发布成功！');
    return post;
  }
```

- [ ] **Step 8: 修改 forum.js — 更新 setInitialDiscussions() 适配新数据模型**

```js
  function setInitialDiscussions(list) {
    var stored = getStoredDiscussions();
    expandedPostIds = Object.create(null);
    activeType = 'all';
    activeTag = 'all';
    discussions = cloneList(Array.isArray(stored) ? stored : list);
    renderDiscussions();
  }
```

- [ ] **Step 9: 修改 forum.js — 更新 API 暴露**

将 `window.discussAPI` 替换为 `window.forumAPI`，扩展 API：

```js
  window.forumAPI = {
    setInitialDiscussions: setInitialDiscussions,
    renderDiscussions: renderDiscussions,
    filterForum: filterForum,
    filterForumByTag: filterForumByTag,
    toggleComments: toggleComments,
    openPost: openPost,
    closePost: closePost,
    togglePostTag: togglePostTag,
    submitPost: submitPost,
    addComment: addComment,
    addCommentFromInput: addCommentFromInput,
    getDiscussions: getDiscussions,
    getPostTypes: function () { return POST_TYPES.slice(); },
    getTypeLabels: function () { return Object.assign({}, TYPE_LABELS); },
    getDynastyTags: function () { return DYNASTY_TAGS.slice(); },
    getTopicTags: function () { return TOPIC_TAGS.slice(); }
  };

  // 旧 API 兼容别名
  window.discussAPI = window.forumAPI;

  // 全局兼容函数
  window.filterForum = filterForum;
  window.filterForumByTag = filterForumByTag;
  window.filterDiscuss = filterForum;
  window.toggleComments = toggleComments;
  window.openPost = openPost;
  window.closePost = closePost;
  window.togglePostTag = togglePostTag;
  window.submitPost = submitPost;
  window.addComment = addComment;
  window.addCommentFromInput = addCommentFromInput;
```

- [ ] **Step 10: 修改 forum.js — 更新 renderDiscussions() 中的空状态文字**

```js
  function renderDiscussions() {
    var root = getListRoot();
    var visibleCount = 0;
    var html;

    if (!root) return;

    if (!discussions.length) {
      root.innerHTML = '<div style="text-align:center;padding:24px;color:#B5ADA5">还没有帖子，来发第一条吧</div>';
      return;
    }

    discussions.forEach(function (post) {
      var type = post.type || 'discussion';
      var tagMatch = activeTag === 'all' || (Array.isArray(post.tags) && post.tags.indexOf(activeTag) !== -1);
      if ((activeType === 'all' || type === activeType) && tagMatch) {
        visibleCount += 1;
      }
    });

    html = discussions.map(renderPost).join('');
    if (!visibleCount) {
      html += '<div class="discussion-empty" style="text-align:center;padding:24px;color:#B5ADA5">该分类下暂无内容</div>';
    }

    root.innerHTML = html;
    bindDiscussionEvents(root);
  }
```

- [ ] **Step 11: 修改 forum.js — 更新 getListRoot() 支持新页面结构**

```js
  function getListRoot() {
    return document.getElementById('forum-list') || document.getElementById('discussion-list') || document.querySelector('#discuss-page .dp');
  }
```

- [ ] **Step 12: 更新 index.html 中的 script 引用**

将：
```html
<!-- <script src="./src/js/forum.js?v=20260612-timeline-fix2"></script> -->
```
改为正式引用：
```html
<script src="./src/js/forum.js?v=20260613-forum-v1"></script>
```

删除旧的 `discuss.js` 引用行。

- [ ] **Step 13: 更新 app.js — 确保 forumAPI 全局暴露使用新 API 名**

在 `exposeGlobals()` 中已有的 `window.forumAPI` 暴露块（Task 1 已更新）保持不变，确认引用了正确的函数名。

在 `initializeData()` 中，将 `renderDiscussions` 调用改为使用 `window.forumAPI`：
```js
    if (document.querySelector('#discuss-page .dp') || document.getElementById('forum-list')) {
      var discussions = await loadJSON('./src/data/discussions.json?v=20260613-forum-v1', []);
      if (window.forumAPI && typeof window.forumAPI.setInitialDiscussions === 'function') {
        window.forumAPI.setInitialDiscussions(discussions);
      }
    }
```

- [ ] **Step 14: 运行测试确认 forum.js 基本可用**

```bash
npx vitest run --environment jsdom
```

预期：discuss.test.js 将因为 `discuss.js` 不再被加载而部分失败。我们将在 Task 9 用新的 forum.test.js 替换。

- [ ] **Step 15: 删除旧的 discuss.js**

```bash
git rm src/js/discuss.js
```

- [ ] **Step 16: 提交**

```bash
git add -A
git commit -m "feat: rename discuss.js to forum.js with 5-type post system and tag support"
```

---

### Task 3: 重写论坛种子数据 discussions.json

**Files:**
- Modify: `src/data/discussions.json`

- [ ] **Step 1: 编写新的 discussions.json**

将 `src/data/discussions.json` 替换为以下内容（29 条种子帖，覆盖五种类型）：

```json
[
  {
    "id": "post-keju-neijuan",
    "type": "discussion",
    "title": "科举制和高考，跨越千年的内卷",
    "content": "从隋唐到明清，科举从取士变成困士。当代高考是否也在经历类似的内卷化过程？",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["隋", "唐", "宋", "制度", "社会"],
    "metadata": {},
    "stats": { "views": 1280, "likes": 986, "comments": 392, "favorites": 86 },
    "createdAt": "2026-06-10T08:00:00Z",
    "updatedAt": "2026-06-12T15:30:00Z",
    "commentsList": [
      { "author": "历史小白", "avatar": "🧒", "body": "科举至少给了寒门一个上升通道，高考也是。" },
      { "author": "教书匠", "avatar": "🧓", "body": "但从八股文到应试教育，形式化的趋势确实很像。" }
    ],
    "time": "3天前", "likes": "986", "comments": "392", "favorite": "收藏"
  },
  {
    "id": "post-wangmang",
    "type": "discussion",
    "title": "王莽改制 — 是理想主义者还是穿越者？",
    "content": "王莽的土地国有、废除奴隶制、计划经济……细看很像现代制度。他到底是超前理想家还是穿越小说主角？",
    "author": { "id": "u_system", "name": "故纸堆里的人", "avatar": "🧔" },
    "tags": ["汉", "制度", "经济"],
    "metadata": {},
    "stats": { "views": 856, "likes": 103, "comments": 28, "favorites": 15 },
    "createdAt": "2026-06-09T14:00:00Z",
    "updatedAt": "2026-06-11T09:00:00Z",
    "commentsList": [],
    "time": "4天前", "likes": "103", "comments": "28", "favorite": "收藏"
  },
  {
    "id": "post-help-liangzhou",
    "type": "discussion",
    "title": "凉州词应该放在哪个专题里？",
    "content": "求助：唐诗中的边塞诗与汉代丝绸之路有什么关系？凉州词应该归入文学史还是边疆史？",
    "author": { "id": "u_system", "name": "边塞新手", "avatar": "🙋" },
    "tags": ["唐", "文化", "地理"],
    "metadata": {},
    "stats": { "views": 234, "likes": 12, "comments": 5, "favorites": 3 },
    "createdAt": "2026-06-12T10:00:00Z",
    "updatedAt": "2026-06-12T10:00:00Z",
    "commentsList": [
      { "author": "助教", "avatar": "🧑‍🏫", "body": "可以先放入隋唐边疆专题，边塞诗本质是军事与文学的交汇。" }
    ],
    "time": "1天前", "likes": "12", "comments": "5", "favorite": "收藏"
  },
  {
    "id": "art-zhenguan",
    "type": "article",
    "title": "贞观之治：中国古代治理的巅峰时刻",
    "content": "唐太宗李世民登基后，虚心纳谏、任用贤能，房玄龄、杜如晦、魏徵等名臣辅佐，开创贞观之治。这一时期政治清明，法律完备，《贞观律》成为后世法典蓝本；经济上推行均田制和租庸调制，农业生产迅速恢复；文化上百家争鸣，佛教、道教与儒家共存共荣。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["唐", "政治", "制度"],
    "metadata": { "externalUrl": "https://baike.baidu.com/item/贞观之治" },
    "stats": { "views": 3200, "likes": 1560, "comments": 210, "favorites": 320 },
    "createdAt": "2026-06-08T06:00:00Z",
    "updatedAt": "2026-06-08T06:00:00Z",
    "commentsList": [],
    "time": "5天前", "likes": "1560", "comments": "210", "favorite": "收藏"
  },
  {
    "id": "art-qinshihuang",
    "type": "article",
    "title": "秦始皇统一六国：中央集权制度的开创",
    "content": "公元前221年秦王嬴政统一六国，建立中国历史上第一个大一统王朝。废分封、设郡县，书同文、车同轨、统一度量衡，建立皇帝制度。秦始皇的中央集权体制影响了此后两千年中国政治的基本格局。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["秦", "政治", "制度"],
    "metadata": { "externalUrl": "https://baike.baidu.com/item/秦始皇" },
    "stats": { "views": 2800, "likes": 1320, "comments": 185, "favorites": 290 },
    "createdAt": "2026-06-07T06:00:00Z",
    "updatedAt": "2026-06-07T06:00:00Z",
    "commentsList": [],
    "time": "6天前", "likes": "1320", "comments": "185", "favorite": "收藏"
  },
  {
    "id": "art-silkroad",
    "type": "article",
    "title": "丝绸之路：连接东西方的文明动脉",
    "content": "张骞出使西域开辟丝绸之路，中国的丝绸、瓷器、造纸术西传，西域的葡萄、胡桃、佛教东来。丝绸之路不仅是贸易通道，更是技术和文化交流的桥梁，深刻改变了欧亚大陆的文明格局。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["汉", "唐", "经济", "地理"],
    "metadata": { "externalUrl": "https://baike.baidu.com/item/丝绸之路" },
    "stats": { "views": 2100, "likes": 980, "comments": 145, "favorites": 210 },
    "createdAt": "2026-06-06T06:00:00Z",
    "updatedAt": "2026-06-06T06:00:00Z",
    "commentsList": [],
    "time": "7天前", "likes": "980", "comments": "145", "favorite": "收藏"
  },
  {
    "id": "art-anlushan",
    "type": "article",
    "title": "安史之乱：盛唐的转折点",
    "content": "755年安禄山起兵叛乱，持续八年的战乱使唐朝从巅峰跌落。人口锐减三分之二，均田制和租庸调制瓦解，藩镇割据局面形成。安史之乱是唐朝由盛转衰的关键节点，也是中国封建社会的一个重要转折。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["唐", "军事", "政治"],
    "metadata": { "externalUrl": "https://baike.baidu.com/item/安史之乱" },
    "stats": { "views": 1800, "likes": 860, "comments": 120, "favorites": 175 },
    "createdAt": "2026-06-05T06:00:00Z",
    "updatedAt": "2026-06-05T06:00:00Z",
    "commentsList": [],
    "time": "8天前", "likes": "860", "comments": "120", "favorite": "收藏"
  },
  {
    "id": "art-song-economy",
    "type": "article",
    "title": "宋朝经济：GDP占全球60%的超级经济体",
    "content": "北宋时期中国GDP占全球60%以上，商品经济高度发达。世界上最早的纸币「交子」在四川出现。海外贸易繁荣，广州、泉州、明州是著名港口。工商业税收首次超过农业税，标志着经济结构的历史性转变。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["宋", "经济", "科技"],
    "metadata": { "externalUrl": "https://baike.baidu.com/item/宋代经济" },
    "stats": { "views": 2400, "likes": 1150, "comments": 170, "favorites": 250 },
    "createdAt": "2026-06-04T06:00:00Z",
    "updatedAt": "2026-06-04T06:00:00Z",
    "commentsList": [],
    "time": "9天前", "likes": "1150", "comments": "170", "favorite": "收藏"
  },
  {
    "id": "art-opium",
    "type": "article",
    "title": "鸦片战争：天朝迷梦的破碎",
    "content": "1840年英国发动鸦片战争，清军惨败。1842年《南京条约》签订，割让香港岛、开放五口通商、赔款2100万银元。中国从此沦为半殖民地半封建社会，开启了近代屈辱与抗争的双重历史。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["清", "近代", "军事", "政治"],
    "metadata": { "externalUrl": "https://baike.baidu.com/item/鸦片战争" },
    "stats": { "views": 3100, "likes": 1480, "comments": 230, "favorites": 340 },
    "createdAt": "2026-06-03T06:00:00Z",
    "updatedAt": "2026-06-03T06:00:00Z",
    "commentsList": [],
    "time": "10天前", "likes": "1480", "comments": "230", "favorite": "收藏"
  },
  {
    "id": "art-ming-zhenghe",
    "type": "article",
    "title": "郑和下西洋：中国人最早的大航海",
    "content": "1405年至1433年间，郑和七次率船队下西洋，远达东非海岸。舰队规模宏大，最多一次达2.7万余人、200余艘船。比哥伦布到达美洲早87年。然而明代后期的海禁政策使中国错失了海洋时代。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["明", "地理", "经济"],
    "metadata": { "externalUrl": "https://baike.baidu.com/item/郑和下西洋" },
    "stats": { "views": 2600, "likes": 1250, "comments": 195, "favorites": 280 },
    "createdAt": "2026-06-02T06:00:00Z",
    "updatedAt": "2026-06-02T06:00:00Z",
    "commentsList": [],
    "time": "11天前", "likes": "1250", "comments": "195", "favorite": "收藏"
  },
  {
    "id": "art-reform",
    "type": "article",
    "title": "戊戌变法：百日维新的理想与悲剧",
    "content": "1898年光绪帝支持康有为、梁启超推行维新变法，废科举、兴学堂、练新军。但变法仅持续103天便被慈禧太后发动政变镇压，六君子血洒菜市口。戊戌变法的失败标志着改良道路在中国的终结。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["清", "近代", "政治", "制度"],
    "metadata": { "externalUrl": "https://baike.baidu.com/item/戊戌变法" },
    "stats": { "views": 1950, "likes": 920, "comments": 140, "favorites": 180 },
    "createdAt": "2026-06-01T06:00:00Z",
    "updatedAt": "2026-06-01T06:00:00Z",
    "commentsList": [],
    "time": "12天前", "likes": "920", "comments": "140", "favorite": "收藏"
  },
  {
    "id": "per-qinshihuang",
    "type": "person",
    "title": "秦始皇嬴政",
    "content": "中国历史上第一位皇帝，统一六国，建立中央集权制度。推行郡县制，书同文车同轨，修筑长城，焚书坑儒。功过争议极大，但「百代皆行秦政制」的历史影响无可否认。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["秦", "政治"],
    "metadata": { "dynasty": "秦朝", "role": "皇帝·政治家·改革者" },
    "stats": { "views": 5600, "likes": 2800, "comments": 420, "favorites": 650 },
    "createdAt": "2026-05-28T06:00:00Z",
    "updatedAt": "2026-05-28T06:00:00Z",
    "commentsList": [],
    "time": "16天前", "likes": "2800", "comments": "420", "favorite": "收藏"
  },
  {
    "id": "per-wuzetian",
    "type": "person",
    "title": "武则天",
    "content": "中国历史上唯一的女皇帝。从唐太宗才人到高宗皇后，再到自立为帝，建立武周王朝。在位期间发展科举、提拔寒门、重视农业生产，为开元盛世奠定基础。其无字碑至今引发后人无限遐想。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["唐", "政治"],
    "metadata": { "dynasty": "唐朝·武周", "role": "皇帝·政治家" },
    "stats": { "views": 4800, "likes": 2350, "comments": 380, "favorites": 520 },
    "createdAt": "2026-05-27T06:00:00Z",
    "updatedAt": "2026-05-27T06:00:00Z",
    "commentsList": [],
    "time": "17天前", "likes": "2350", "comments": "380", "favorite": "收藏"
  },
  {
    "id": "per-zhugeliang",
    "type": "person",
    "title": "诸葛亮",
    "content": "三国时期蜀汉丞相。隆中对策定天下三分之计，辅佐刘备建立蜀汉。刘备托孤后鞠躬尽瘁，五次北伐未能克复中原，最终病逝五丈原。「出师未捷身先死，长使英雄泪满襟」成为千古绝唱。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["三国", "政治", "军事"],
    "metadata": { "dynasty": "三国·蜀汉", "role": "丞相·军事家·政治家" },
    "stats": { "views": 5100, "likes": 2600, "comments": 450, "favorites": 590 },
    "createdAt": "2026-05-26T06:00:00Z",
    "updatedAt": "2026-05-26T06:00:00Z",
    "commentsList": [],
    "time": "18天前", "likes": "2600", "comments": "450", "favorite": "收藏"
  },
  {
    "id": "per-kangxi",
    "type": "person",
    "title": "康熙帝",
    "content": "清朝入关后第二位皇帝，8岁登基，在位61年。擒鳌拜、平三藩、收台湾、平定准噶尔，奠定了清朝鼎盛版图。重视科学文化，编纂《康熙字典》。但晚年倦政，吏治渐趋腐败。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["清", "政治", "军事"],
    "metadata": { "dynasty": "清朝", "role": "皇帝·政治家" },
    "stats": { "views": 3500, "likes": 1700, "comments": 250, "favorites": 380 },
    "createdAt": "2026-05-25T06:00:00Z",
    "updatedAt": "2026-05-25T06:00:00Z",
    "commentsList": [],
    "time": "19天前", "likes": "1700", "comments": "250", "favorite": "收藏"
  },
  {
    "id": "per-yuefei",
    "type": "person",
    "title": "岳飞",
    "content": "南宋抗金名将。率领岳家军北伐，大破金军主力，直捣中原。却被宋高宗和秦桧以「莫须有」罪名杀害于风波亭。精忠报国的精神流传千古，成为中华民族爱国主义的象征。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["宋", "军事"],
    "metadata": { "dynasty": "南宋", "role": "将领·民族英雄" },
    "stats": { "views": 4200, "likes": 2100, "comments": 320, "favorites": 470 },
    "createdAt": "2026-05-24T06:00:00Z",
    "updatedAt": "2026-05-24T06:00:00Z",
    "commentsList": [],
    "time": "20天前", "likes": "2100", "comments": "320", "favorite": "收藏"
  },
  {
    "id": "per-sushi",
    "type": "person",
    "title": "苏轼",
    "content": "北宋文学家、书画家、美食家。诗词文书画俱佳，「大江东去浪淘尽」千古传唱。一生仕途坎坷，多次被贬，但始终乐观豁达。乌台诗案后写下前后《赤壁赋》，将人生困境升华为文学杰作。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["宋", "文化"],
    "metadata": { "dynasty": "北宋", "role": "文学家·书画家·官员" },
    "stats": { "views": 3900, "likes": 1950, "comments": 280, "favorites": 440 },
    "createdAt": "2026-05-23T06:00:00Z",
    "updatedAt": "2026-05-23T06:00:00Z",
    "commentsList": [],
    "time": "21天前", "likes": "1950", "comments": "280", "favorite": "收藏"
  },
  {
    "id": "per-zhangqian",
    "type": "person",
    "title": "张骞",
    "content": "汉代外交家、探险家。两次出使西域，历经十余年艰辛，开辟了通往中亚的道路——史称「凿空之旅」。带回了葡萄、胡桃、石榴等西域物产，为丝绸之路的开通奠定了基础。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["汉", "地理", "政治"],
    "metadata": { "dynasty": "汉朝", "role": "外交家·探险家" },
    "stats": { "views": 3100, "likes": 1500, "comments": 210, "favorites": 350 },
    "createdAt": "2026-05-22T06:00:00Z",
    "updatedAt": "2026-05-22T06:00:00Z",
    "commentsList": [],
    "time": "22天前", "likes": "1500", "comments": "210", "favorite": "收藏"
  },
  {
    "id": "per-linbiao",
    "type": "person",
    "title": "林则徐",
    "content": "清代政治家、民族英雄。1839年受命为钦差大臣赴广东禁烟，虎门销烟震惊中外。鸦片战争爆发后被革职流放伊犁，仍心系国事。「苟利国家生死以，岂因祸福避趋之」成为爱国名言。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["清", "近代", "政治"],
    "metadata": { "dynasty": "清朝", "role": "政治家·民族英雄" },
    "stats": { "views": 3300, "likes": 1650, "comments": 230, "favorites": 370 },
    "createdAt": "2026-05-21T06:00:00Z",
    "updatedAt": "2026-05-21T06:00:00Z",
    "commentsList": [],
    "time": "23天前", "likes": "1650", "comments": "230", "favorite": "收藏"
  },
  {
    "id": "med-wanli",
    "type": "media",
    "title": "万历十五年",
    "content": "黄仁宇著。以1587年为切入点，从「大历史观」审视明朝中晚期的政治、经济与文化困境。万历皇帝、张居正、海瑞、戚继光等人物的命运交织，展现了一个庞大帝国运作的深层逻辑。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["明", "政治", "制度"],
    "metadata": { "mediaType": "书籍", "rating": "9.0", "author": "黄仁宇", "year": "1981" },
    "stats": { "views": 4500, "likes": 2200, "comments": 340, "favorites": 580 },
    "createdAt": "2026-05-20T06:00:00Z",
    "updatedAt": "2026-05-20T06:00:00Z",
    "commentsList": [],
    "time": "24天前", "likes": "2200", "comments": "340", "favorite": "收藏"
  },
  {
    "id": "med-last-emperor",
    "type": "media",
    "title": "末代皇帝",
    "content": "贝纳尔多·贝托鲁奇导演作品。讲述溥仪从三岁登基到成为新中国公民的一生，跨越清末、民国、抗战、新中国四个历史时期。获第60届奥斯卡九项大奖，是理解中国近代变迁的影视经典。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["清", "近代", "政治"],
    "metadata": { "mediaType": "电影", "rating": "9.3", "author": "贝纳尔多·贝托鲁奇", "year": "1987" },
    "stats": { "views": 5200, "likes": 2600, "comments": 390, "favorites": 640 },
    "createdAt": "2026-05-19T06:00:00Z",
    "updatedAt": "2026-05-19T06:00:00Z",
    "commentsList": [],
    "time": "25天前", "likes": "2600", "comments": "390", "favorite": "收藏"
  },
  {
    "id": "med-hexi",
    "type": "media",
    "title": "河西走廊",
    "content": "央视纪录片，以河西走廊为线索探寻中国与西域的文明交汇。从汉代张骞出使到敦煌莫高窟，从丝绸之路到新中国西部开发，跨越两千年的历史画卷。豆瓣评分9.7，是历史纪录片的标杆之作。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["汉", "唐", "明", "地理", "文化"],
    "metadata": { "mediaType": "纪录片", "rating": "9.7", "author": "央视", "year": "2015" },
    "stats": { "views": 6100, "likes": 3200, "comments": 480, "favorites": 780 },
    "createdAt": "2026-05-18T06:00:00Z",
    "updatedAt": "2026-05-18T06:00:00Z",
    "commentsList": [],
    "time": "26天前", "likes": "3200", "comments": "480", "favorite": "收藏"
  },
  {
    "id": "med-daming",
    "type": "media",
    "title": "大明王朝1566",
    "content": "张黎导演的历史剧巅峰之作。以嘉靖皇帝与海瑞的对抗为主线，展现明代中期的政治生态和财政危机。台词精炼、人物饱满，被众多观众评为「中国历史剧第一」。豆瓣评分9.7。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["明", "政治", "经济"],
    "metadata": { "mediaType": "电视剧", "rating": "9.7", "author": "张黎", "year": "2007" },
    "stats": { "views": 5800, "likes": 2900, "comments": 450, "favorites": 700 },
    "createdAt": "2026-05-17T06:00:00Z",
    "updatedAt": "2026-05-17T06:00:00Z",
    "commentsList": [],
    "time": "27天前", "likes": "2900", "comments": "450", "favorite": "收藏"
  },
  {
    "id": "med-sanguo",
    "type": "media",
    "title": "三国演义",
    "content": "罗贯中著，中国四大名著之一。以东汉末年至西晋统一为背景，描写魏蜀吴三国的政治军事斗争。塑造了诸葛亮、关羽、曹操等不朽人物形象，「天下大势分久必合合久必分」的历史观影响深远。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["三国", "文化", "军事"],
    "metadata": { "mediaType": "书籍", "rating": "9.5", "author": "罗贯中", "year": "元末明初" },
    "stats": { "views": 7000, "likes": 3800, "comments": 560, "favorites": 950 },
    "createdAt": "2026-05-16T06:00:00Z",
    "updatedAt": "2026-05-16T06:00:00Z",
    "commentsList": [],
    "time": "28天前", "likes": "3800", "comments": "560", "favorite": "收藏"
  },
  {
    "id": "med-zhongguo",
    "type": "media",
    "title": "中国通史",
    "content": "社科院历史研究所编写，范文澜、蔡美彪等主编。系统梳理从远古到清朝灭亡的中国历史，是大陆最具权威性的通史著作之一。内容全面，史料翔实，适合作为学习中国历史的入门参考书。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["跨朝代", "文化"],
    "metadata": { "mediaType": "书籍", "rating": "9.1", "author": "范文澜等", "year": "1978-2000" },
    "stats": { "views": 3800, "likes": 1850, "comments": 260, "favorites": 450 },
    "createdAt": "2026-05-15T06:00:00Z",
    "updatedAt": "2026-05-15T06:00:00Z",
    "commentsList": [],
    "time": "29天前", "likes": "1850", "comments": "260", "favorite": "收藏"
  },
  {
    "id": "med-daguo",
    "type": "media",
    "title": "大国崛起",
    "content": "央视大型纪录片，梳理葡萄牙、西班牙、荷兰、英国、法国、德国、日本、俄罗斯、美国九国崛起历程。以全球视角理解近代世界格局变迁，有助于从世界史角度回看中国近代化道路。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["近代", "政治", "经济"],
    "metadata": { "mediaType": "纪录片", "rating": "9.2", "author": "央视", "year": "2006" },
    "stats": { "views": 4200, "likes": 2050, "comments": 310, "favorites": 500 },
    "createdAt": "2026-05-14T06:00:00Z",
    "updatedAt": "2026-05-14T06:00:00Z",
    "commentsList": [],
    "time": "30天前", "likes": "2050", "comments": "310", "favorite": "收藏"
  },
  {
    "id": "med-tangshi",
    "type": "media",
    "title": "唐诗三百首",
    "content": "蘅塘退士编选，收录77家诗共311首。涵盖李白、杜甫、王维、白居易等唐代主要诗人代表作。是学习唐诗和了解唐代文化的最佳入门读物，也是理解中国诗歌传统的必读经典。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["唐", "文化"],
    "metadata": { "mediaType": "书籍", "rating": "9.6", "author": "蘅塘退士（编）", "year": "清乾隆年间" },
    "stats": { "views": 5500, "likes": 2700, "comments": 400, "favorites": 680 },
    "createdAt": "2026-05-13T06:00:00Z",
    "updatedAt": "2026-05-13T06:00:00Z",
    "commentsList": [],
    "time": "31天前", "likes": "2700", "comments": "400", "favorite": "收藏"
  },
  {
    "id": "med-qinshihuang-film",
    "type": "media",
    "title": "大秦帝国",
    "content": "孙皓晖著长篇历史小说，完整讲述秦国从秦孝公商鞅变法到秦始皇统一六国再到秦朝灭亡的160年历程。小说以法治、变革为主线，重塑了秦文明的历史地位。被改编为同名电视剧。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["秦", "政治", "制度"],
    "metadata": { "mediaType": "书籍", "rating": "8.8", "author": "孙皓晖", "year": "1993-2008" },
    "stats": { "views": 3700, "likes": 1800, "comments": 270, "favorites": 420 },
    "createdAt": "2026-05-12T06:00:00Z",
    "updatedAt": "2026-05-12T06:00:00Z",
    "commentsList": [],
    "time": "32天前", "likes": "1800", "comments": "270", "favorite": "收藏"
  },
  {
    "id": "med-mingchao",
    "type": "media",
    "title": "明朝那些事儿",
    "content": "当年明月著，以幽默风趣的语言讲述明朝三百年历史。从朱元璋出生到崇祯自缢，将严肃历史写得像小说一样好读。掀起「通俗讲史」热潮，销量超过千万册，是历史通俗化的里程碑。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["明", "文化"],
    "metadata": { "mediaType": "书籍", "rating": "9.1", "author": "当年明月", "year": "2006-2009" },
    "stats": { "views": 6500, "likes": 3400, "comments": 520, "favorites": 820 },
    "createdAt": "2026-05-11T06:00:00Z",
    "updatedAt": "2026-05-11T06:00:00Z",
    "commentsList": [],
    "time": "33天前", "likes": "3400", "comments": "520", "favorite": "收藏"
  },
  {
    "id": "res-timeline-tool",
    "type": "resource",
    "title": "📊 中国历史时间轴工具推荐",
    "content": "整理了几个好用的在线历史时间轴工具，支持朝代对比、事件标注和导出图片，适合辅助学习和备课。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["跨朝代", "科技"],
    "metadata": { "externalUrl": null },
    "stats": { "views": 1200, "likes": 580, "comments": 85, "favorites": 160 },
    "createdAt": "2026-05-10T06:00:00Z",
    "updatedAt": "2026-05-10T06:00:00Z",
    "commentsList": [],
    "time": "34天前", "likes": "580", "comments": "85", "favorite": "收藏"
  },
  {
    "id": "res-study-plan",
    "type": "resource",
    "title": "📝 中国历史自学路线图（高中版）",
    "content": "根据最新考纲整理的中国历史自学路线图。按朝代顺序分为12个学习单元，每个单元包含核心知识点、推荐阅读书目和相关试题链接。适合高考备考和历史爱好者自学使用。",
    "author": { "id": "u_system", "name": "学史小助手", "avatar": "🧑‍🏫" },
    "tags": ["跨朝代", "制度", "文化"],
    "metadata": { "externalUrl": null },
    "stats": { "views": 1800, "likes": 920, "comments": 130, "favorites": 230 },
    "createdAt": "2026-05-09T06:00:00Z",
    "updatedAt": "2026-05-09T06:00:00Z",
    "commentsList": [],
    "time": "35天前", "likes": "920", "comments": "130", "favorite": "收藏"
  }
]
```

- [ ] **Step 2: 验证 JSON 格式**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/data/discussions.json','utf8')); console.log('JSON valid')"
```

预期输出：`JSON valid`

- [ ] **Step 3: 运行数据校验**

```bash
node scripts/validate-data.js
```

- [ ] **Step 4: 提交**

```bash
git add src/data/discussions.json
git commit -m "feat: rewrite discussions.json with 29 seed posts across 5 types"
```

---

### Task 4: 改造 index.html 页面结构

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 移除登录页 HTML**

删除 `index.html` 中的登录页块（约第 13-20 行）：
```html
<!-- 登录页 -->
<div id="login-page" class="page active">
<div class="lb">
<span class="lo">📜</span><h1>学的是史</h1><p>以史为鉴 · 可知兴替</p>
</div>
<button class="lbtn phone" onclick="showToast('手机号登录功能开发中')">📱 手机号登录</button>
<button class="lbtn wechat" onclick="login()">💬 微信登录</button>
</div>
```

- [ ] **Step 2: 将社区首页改为默认 active 页面**

将原来的 `<div id="home-page" class="page">` 替换为 `<div id="forum-page" class="page active">`（论坛首页），移除旧首页内容（梗图轮播、快捷按钮、热点文章区），替换为论坛帖子流：

```html
<!-- 论坛首页 -->
<div id="forum-page" class="page active">
<div class="hh"><h2>学的是史</h2><div class="sch" onclick="showToast('搜索功能开发中')">🔍</div></div>

<!-- 类型 Tab -->
<div class="htabs" id="forum-tabs" style="padding:0 16px 12px;display:flex;gap:8px;overflow-x:auto">
<button class="htab act" onclick="filterForum('all',this)">全部</button>
<button class="htab" onclick="filterForum('discussion',this)">💬 讨论</button>
<button class="htab" onclick="filterForum('article',this)">📄 文章</button>
<button class="htab" onclick="filterForum('person',this)">👤 人物</button>
<button class="htab" onclick="filterForum('media',this)">🎬 书影</button>
<button class="htab" onclick="filterForum('resource',this)">📦 资源</button>
</div>

<!-- 标签筛选 -->
<div class="htabs" id="forum-tag-tabs" style="padding:0 16px 12px;display:flex;gap:6px;overflow-x:auto">
<button class="htab act" onclick="filterForumByTag('all',this)">全部标签</button>
<button class="htab" onclick="filterForumByTag('唐',this)">唐</button>
<button class="htab" onclick="filterForumByTag('宋',this)">宋</button>
<button class="htab" onclick="filterForumByTag('明',this)">明</button>
<button class="htab" onclick="filterForumByTag('清',this)">清</button>
<button class="htab" onclick="filterForumByTag('政治',this)">政治</button>
<button class="htab" onclick="filterForumByTag('军事',this)">军事</button>
<button class="htab" onclick="filterForumByTag('文化',this)">文化</button>
</div>

<div id="forum-list"></div>
<button class="fab" onclick="openPost()">＋</button>
</div>
```

- [ ] **Step 3: 替换旧的讨论区页面为工具页**

将 `<div id="discuss-page" class="page">` 块（约第 298-314 行）替换为工具页：

```html
<!-- ===== 工具页 ===== -->
<div id="tools-page" class="page">
<div class="hh"><h2>学习工具</h2></div>
<div class="sg" style="padding:16px">
<button class="scard" onclick="openSub('noun-page')"><span class="ic">📖</span><h4>名词解释</h4><p>查询重要历史名词</p></button>
<button class="scard" onclick="openSub('timeline-page')"><span class="ic">🕐</span><h4>时间轴</h4><p>按朝代浏览历史事件</p></button>
<button class="scard" onclick="openSub('mindmap-page')"><span class="ic">🧠</span><h4>思维导图</h4><p>知识导图·笔记标注</p></button>
</div>
</div>
```

- [ ] **Step 4: 移除播客、影视书目、人物专题、科学备考页面 HTML**

删除以下 HTML 块：
- `<div id="science-page" class="sub">` 及其全部内容（约第 141-154 行）
- `<div id="people-page" class="sub">` 及其全部内容（约第 178-196 行）
- `<div id="podcast-page" class="sub">` 及其全部内容（约第 216-232 行）
- 播客播放器 `<div class="pplayer" id="podcast-player">` 及其全部内容（约第 235-258 行）
- `<div id="film-page" class="sub">` 及其全部内容（约第 261-295 行）
- 人物资料卡 `<div class="pdc" id="people-detail-card">` 及其全部内容（约第 198-213 行）

- [ ] **Step 5: 移除旧的 discus-page 相关 HTML**

删除旧的 `discuss-page` 块（已在 Step 3 中替换为 tools-page）。删除旧的发布弹窗中的旧标签按钮，替换为新版本。

在发布弹窗（`#post-overlay`）中，将旧的标签按钮：
```html
<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
<button class="ft" onclick="togglePostTag(this,'史观')">史观</button>
<button class="ft" onclick="togglePostTag(this,'冷知识')">冷知识</button>
<button class="ft" onclick="togglePostTag(this,'求助')">求助</button>
<button class="ft" onclick="togglePostTag(this,'资源')">资源</button>
</div>
```

替换为：
```html
<!-- 帖子类型选择 -->
<div style="margin-bottom:12px">
<label style="font-size:12px;color:#8A8279;display:block;margin-bottom:4px">帖子类型</label>
<select id="post-type-select" style="width:100%;padding:10px 14px;border:1.5px solid #EDE8E0;border-radius:14px;font-size:14px;outline:none;color:#2C1810;box-sizing:border-box;background:white">
<option value="discussion">💬 讨论</option>
<option value="article">📄 文章</option>
<option value="person">👤 人物</option>
<option value="media">🎬 书影</option>
<option value="resource">📦 资源</option>
</select>
</div>
<!-- 标签选择 -->
<div style="margin-bottom:12px">
<label style="font-size:12px;color:#8A8279;display:block;margin-bottom:4px">标签（可多选，朝代+主题）</label>
<div style="display:flex;gap:6px;flex-wrap:wrap">
<button class="ft" onclick="togglePostTag(this,'秦')">秦</button>
<button class="ft" onclick="togglePostTag(this,'汉')">汉</button>
<button class="ft" onclick="togglePostTag(this,'唐')">唐</button>
<button class="ft" onclick="togglePostTag(this,'宋')">宋</button>
<button class="ft" onclick="togglePostTag(this,'明')">明</button>
<button class="ft" onclick="togglePostTag(this,'清')">清</button>
<button class="ft" onclick="togglePostTag(this,'近代')">近代</button>
<button class="ft" onclick="togglePostTag(this,'政治')">政治</button>
<button class="ft" onclick="togglePostTag(this,'军事')">军事</button>
<button class="ft" onclick="togglePostTag(this,'经济')">经济</button>
<button class="ft" onclick="togglePostTag(this,'文化')">文化</button>
<button class="ft" onclick="togglePostTag(this,'制度')">制度</button>
</div>
</div>
```

- [ ] **Step 6: 更新旧首页中的快捷按钮区域（因已替换为论坛首页，此步确认无需处理）**

确认 Step 2 中已将旧 `home-page` 替换为 `forum-page`，旧的 `.sng` 快捷按钮已移除。

- [ ] **Step 7: 更新底部导航为三 Tab**

将底部导航（约第 376-380 行）改为：
```html
<!-- ===== 底部导航 ===== -->
<div id="bnav" class="bnav" style="display:flex">
<button class="ni act" onclick="swTab(this,'forum-page')"><span>🏠</span>首页</button>
<button class="ni" onclick="swTab(this,'tools-page')"><span>🔧</span>工具</button>
<button class="ni" onclick="swTab(this,'profile-page')"><span>👤</span>我的</button>
</div>
```

注意：原来的 `style="display:none"` 改为 `style="display:flex"`（不再需要登录后才显示）。

- [ ] **Step 8: 移除内联脚本中的兼容函数（保留最小必要）**

删除以下内联 JS（约第 587-610 行）：
- `filFilm()` 函数
- `togWL()` 函数
- `rankData` 变量
- `swRnkTab()` 函数
- `renderRnk()` 函数
- `wlData` 变量
- `openWL()` / `closeWL()` / `swWLTab()` / `renderWL()` 函数

删除 `swSubTab()` 函数（约第 535-538 行）。

删除 `swTab()` 中对 `login-page` 的判断逻辑，改为：
```js
function swTab(btn, pid) {
  document.querySelectorAll('.sub').forEach(function(p){p.classList.remove('act')});
  document.querySelectorAll('.nd').forEach(function(p){p.classList.remove('act')});
  document.getElementById('node-note-panel').style.display='none';
  document.getElementById('people-detail-card').classList.remove('act');
  document.getElementById('noun-detail').classList.remove('act');
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active')});
  document.querySelectorAll('.ni').forEach(function(n){n.classList.remove('act')});
  document.getElementById(pid).classList.add('active');
  btn.classList.add('act');
  var af = document.getElementById('ai-fab');
  af.classList.add('sh');
  document.getElementById('bnav').style.display='flex';
  resetAIFab();
}
```

- [ ] **Step 9: 更新所有回退按钮的 `closeSub` 目标**

`名词解释` 和 `时间轴` 子页的返回按钮改为回到 `forum-page`（因为旧 `home-page` 不存在了）：
```html
<!-- 名词页返回 -->
<button class="bk" onclick="closeSub('forum-page')">←</button>
<!-- 时间轴页返回 -->
<button class="bk" onclick="closeSub('forum-page')">←</button>
<!-- 思维导图页返回 -->
<button class="bk" onclick="closeSub('tools-page')">←</button>
```

- [ ] **Step 10: 更新缓存版本号**

将 `index.html` 中所有 `v=20260612-timeline-fix2` 替换为 `v=20260613-forum-v1`。

- [ ] **Step 11: 验证 HTML 结构**

用浏览器打开或检查关键元素是否存在：
```bash
# 检查关键 ID 存在
grep -c 'id="forum-page"' index.html
grep -c 'id="forum-list"' index.html
grep -c 'id="tools-page"' index.html
grep -c 'id="forum-tabs"' index.html
grep -c 'id="forum-tag-tabs"' index.html
```

预期：每个命令都返回 `1`。

- [ ] **Step 12: 提交**

```bash
git add index.html
git commit -m "feat: restructure HTML — forum as homepage, tools page, remove login+podcast+film+people"
```

---

### Task 5: 更新 navigation.js（移除登录、适配新页面）

**Files:**
- Modify: `src/js/navigation.js`

- [ ] **Step 1: 移除 login() 函数**

在 `src/js/navigation.js` 中删除 `login()` 函数（约第 36-57 行）。

- [ ] **Step 2: 简化 closeSub() 默认回退逻辑**

修改 `closeSub()` 函数，将默认回退页面从 `home-page` 改为 `forum-page`：
```js
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
```

- [ ] **Step 3: 更新 navigationAPI 暴露，移除 login**

```js
  window.navigationAPI = {
    resetAIFab: resetAIFab,
    showToast: showToast,
    openSub: openSub,
    closeSub: closeSub
  };
```

- [ ] **Step 4: 运行测试确认**

```bash
npx vitest run --environment jsdom tests/navigation.test.js
```

- [ ] **Step 5: 提交**

```bash
git add src/js/navigation.js
git commit -m "feat: remove login from navigation, default to forum-page"
```

---

### Task 6: 更新 app.js（精简初始化、适配论坛首页）

**Files:**
- Modify: `src/js/app.js`

- [ ] **Step 1: 移除 renderMemes() 和 renderHotArticles() 函数**

在 `app.js` 中删除 `renderMemes()` 函数（约第 185-202 行）和 `renderHotArticles()` 函数（约第 213-242 行）。

- [ ] **Step 2: 移除 filterHot() 函数**

删除 `filterHot()` 函数（约第 244-256 行）。

- [ ] **Step 3: 更新 renderDiscussions() → 使用 forumAPI**

保留 `renderDiscussions()` 函数但改为委托给 forumAPI：
```js
  function renderDiscussions(discussions) {
    if (!Array.isArray(discussions)) return;

    if (window.forumAPI && typeof window.forumAPI.setInitialDiscussions === 'function') {
      window.forumAPI.setInitialDiscussions(discussions);
      return;
    }

    // Fallback: direct render
    var root = document.getElementById('forum-list') || document.getElementById('discussion-list');
    if (!root) return;

    root.innerHTML = discussions.map(function (item) {
      var authorName = (item.author && item.author.name) || item.author || '';
      var avatar = (item.author && item.author.avatar) || item.avatar || '';
      var body = item.content || item.body || '';
      return '<div class="pcard" data-post-id="' + escapeHtml(item.id || '') + '" data-post-type="' + escapeHtml(item.type || 'discussion') + '">' +
        '<div class="pa"><div class="pav">' + escapeHtml(avatar) + '</div><div><div class="nm">' + escapeHtml(authorName) + '</div><div class="ti">' + escapeHtml(item.time || item.createdAt || '') + '</div></div></div>' +
        '<div class="pc"><h4>' + escapeHtml(item.title || '') + '</h4><p>' + escapeHtml(body) + '</p></div>' +
        '<div class="pact"><span>❤️ ' + escapeHtml((item.stats && item.stats.likes) || item.likes || '0') + '</span><span>💬 ' + escapeHtml((item.stats && item.stats.comments) || item.comments || '0') + '</span><span>⭐ 收藏</span></div>' +
      '</div>';
    }).join('');
  }
```

- [ ] **Step 4: 更新 exposeGlobals() 中 forumAPI 的暴露**

确认 forumAPI 全局暴露使用正确的函数名（与 Task 2 中 forum.js 暴露的一致）：
```js
    if (window.forumAPI) {
      window.filterForum = window.forumAPI.filterForum;
      window.filterForumByTag = window.forumAPI.filterForumByTag;
      window.toggleComments = window.forumAPI.toggleComments;
      window.openPost = window.forumAPI.openPost;
      window.closePost = window.forumAPI.closePost;
      window.togglePostTag = window.forumAPI.togglePostTag;
      window.submitPost = window.forumAPI.submitPost;
      window.addComment = window.forumAPI.addComment;
      window.addCommentFromInput = window.forumAPI.addCommentFromInput;
    }
```

删除 `window.filterHot = filterHot;` 这一行（因为 filterHot 已移除）。

- [ ] **Step 5: 更新 initializeData()**

修改初始化流程以适配新页面结构：
```js
  async function initializeData() {
    // 名词数据
    var nouns = await loadJSON('./src/data/nouns.json?v=20260613-forum-v1', {});
    if (window.nounAPI) window.nounAPI.setNounData(nouns);

    // 时间轴数据
    var timeline = await loadJSON('./src/data/timeline.json?v=20260613-forum-v1', { dynasties: [], events: [] });
    if (window.timelineAPI) {
      window.timelineAPI.setDynasties(timeline.dynasties);
      window.timelineAPI.setTimelineEvents(timeline.events);
      try { window.timelineAPI.renderTimeline(); } catch (e) { console.error('renderTimeline err:', e); }
      try { window.timelineAPI.renderEventList(); } catch (e) { console.error('renderEventList err:', e); }
    }

    // 思维导图
    if (window.mindmapAPI) {
      var mindmaps = await loadJSON('./src/data/mindmaps.json?v=20260613-forum-v1', { maps: {} });
      window.mindmapAPI.setMindmapData(mindmaps);
      try { window.mindmapAPI.renderAllMindmaps(); } catch (e) { console.error('renderAllMindmaps err:', e); }
    }

    // 论坛帖子（种子数据）
    if (document.getElementById('forum-list') || document.querySelector('#forum-page')) {
      var discussions = await loadJSON('./src/data/discussions.json?v=20260613-forum-v1', []);
      if (window.forumAPI && typeof window.forumAPI.setInitialDiscussions === 'function') {
        window.forumAPI.setInitialDiscussions(discussions);
      } else {
        renderDiscussions(discussions);
      }
    }

    // 反馈类型
    if (document.getElementById('feedback-type-list')) {
      renderFeedbackTypes(await loadJSON('./src/data/feedback-types.json?v=20260613-forum-v1', []));
    }

    // 个人页菜单
    if (document.querySelector('#profile-page .mg')) {
      renderProfileMenu(await loadJSON('./src/data/profile-menu.json?v=20260613-forum-v1', { study: [], settings: [] }));
    }
  }
```

- [ ] **Step 6: 移除 initializeApp() 中重复调用的问题**

当前的 `initializeApp()` 在文件末尾被立即调用一次，又在 `DOMContentLoaded` 时注册一次。修改为仅调用一次：
```js
  function initializeApp() {
    ensureHtmlUtils();
    registerGlobalErrorToast();
    exposeGlobals();
    initializeData().catch(function (err) {
      console.error('Data initialization failed:', err);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }
```

注意：删除文件底部的 `initializeApp();` 独立调用（约第 386 行），仅保留条件判断后的调用。

- [ ] **Step 7: 提交**

```bash
git add src/js/app.js
git commit -m "feat: simplify app.js — remove memes/hot-articles, adapt forum API, single init"
```

---

### Task 7: 创建 tools.js（工具页模块）

**Files:**
- Create: `src/js/tools.js`

- [ ] **Step 1: 编写 tools.js**

```js
(function () {
  if (window.toolsAPI) {
    return;
  }

  function initToolsPage() {
    // 工具页没有需要动态初始化的内容
    // 名词和时间轴通过 openSub/closeSub 切换显示
    var toolsPage = document.getElementById('tools-page');
    if (!toolsPage) return;
    // 工具页就绪
  }

  // 页面切换时初始化
  document.addEventListener('DOMContentLoaded', function () {
    initToolsPage();
  });

  window.toolsAPI = {
    initToolsPage: initToolsPage
  };
})();
```

- [ ] **Step 2: 在 index.html 中引入 tools.js**

在 `index.html` 的 script 区域，forum.js 引用之后添加：
```html
<script src="./src/js/tools.js?v=20260613-forum-v1"></script>
```

- [ ] **Step 3: 提交**

```bash
git add src/js/tools.js index.html
git commit -m "feat: add tools.js module for tools page"
```

---

### Task 8: 更新 CSS

**Files:**
- Modify: `src/css/pages.css`
- Modify: `src/css/components.css`

- [ ] **Step 1: 在 components.css 添加论坛帖子类型样式**

在 `src/css/components.css` 末尾添加：

```css
/* ===== 论坛帖子类型 Meta 行 ===== */
.fm-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 4px 0 8px;
  font-size: 11px;
}
.fm-type-tag {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}
.fm-type-tag.article { background: #E8F0FE; color: #1A73E8; }
.fm-type-tag.person { background: #FCE8E6; color: #C5221F; }
.fm-type-tag.media { background: #E6F4EA; color: #137333; }
.fm-type-tag.resource { background: #FEF7E0; color: #B06000; }
.fm-dynasty {
  color: #8A8279;
  font-size: 11px;
}
.fm-role {
  color: #C9A96E;
  font-size: 11px;
  font-weight: 500;
}
.fm-media-type {
  color: #8A8279;
  font-size: 11px;
}
.fm-rating {
  color: #E8A838;
  font-size: 11px;
  font-weight: 700;
}
.fm-link {
  color: #C9A96E;
  text-decoration: none;
  font-size: 11px;
  margin-left: auto;
}
.fm-link:hover {
  text-decoration: underline;
}

/* ===== 帖子标签 ===== */
.fm-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  padding: 4px 0 8px;
}
.fm-tag {
  padding: 2px 8px;
  background: #F5F0E8;
  border-radius: 10px;
  font-size: 10px;
  color: #8B6914;
  font-weight: 500;
}

/* ===== 发帖面板标签按钮增强 ===== */
.ft.act {
  background: #C9A96E !important;
  color: #fff !important;
  border-color: #C9A96E !important;
}

/* ===== 类型选择下拉框 ===== */
#post-type-select {
  font-family: inherit;
}
```

- [ ] **Step 2: 在 pages.css 中移除下线模块样式**

在 `src/css/pages.css` 中删除以下不再使用的样式块：
- 登录页相关样式（`.lb`, `.lo`, `.lbtn`, `.phone`, `.wechat` 等）
- 梗图轮播样式（`.meme-scroll`, `.meme-card`, `.meme-cap`, `.meme-dots`, `.meme-dot`）
- 播客相关样式（`.pctabs`, `.pctab`, `.pclist`, `.pplayer`, `.plhead`, `.plicon`, `.pltxt`, `.plclose`, `.plbar`, `.plprog`, `.plbtns`, `.plbtn`, `.pltimer`, `.plspeed`）
- 人物专题样式（`.ps`, `.pdc`, `.rs`, `.cb`, `.ig`, `.dl`, `.ch` 中人物卡片特有的）
- 影视书目样式（`.fg2`, `.fg3`, `.fcard`, `.fimg`, `.fin`, `.rt`, `.desc`, `.wbtn`）
- 科学备考样式（`.scard`, `.sg`）
- 子页面 Tab 切换样式（`.tt`）

- [ ] **Step 3: 提交**

```bash
git add src/css/components.css src/css/pages.css
git commit -m "feat: add forum post type styles, remove unused module CSS"
```

---

### Task 9: 编写/更新测试

**Files:**
- Create: `tests/forum.test.js`（替换旧的 `tests/discuss.test.js`）
- Create: `tests/forum-post-types.test.js`
- Create: `tests/forum-tags.test.js`
- Create: `tests/forum-xss.test.js`
- Create: `tests/tools-page.test.js`
- Modify: `tests/app-static-data.test.js`
- Modify: `tests/adapter-wiring.test.js`
- Modify: `tests/validate-data.test.js`
- Modify: `tests/favorites.test.js`
- Modify: `tests/navigation.test.js`
- Delete: `tests/discuss.test.js`

- [ ] **Step 1: 删除旧测试并创建 forum.test.js（基于 discuss.test.js 改写）**

```bash
git rm tests/discuss.test.js
```

创建 `tests/forum.test.js`，将 `discuss.test.js` 的内容适配新模块。关键变更：
- `import('../src/js/discuss.js')` → `import('../src/js/forum.js')`
- `window.discussAPI` → `window.forumAPI`
- `data-discuss-cat` → `data-post-type`
- `xds_discussions` → `xds_forum_posts`
- mount DOM 中使用 `forum-list` 和 `forum-tabs`
- 帖子数据使用新的 type 字段

由于 forum.test.js 内容较长（约 500 行），此处给出关键适配点。完整内容参见旧 discuss.test.js 对照改写。

- [ ] **Step 2: 创建 forum-post-types.test.js**

```js
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

const FORUM_TYPES = ['discussion', 'article', 'person', 'media', 'resource'];

function mountForumDOM() {
  mountDOM(`
    <div id="forum-page" class="page active">
      <div class="htabs" id="forum-tabs">
        <button class="htab act" onclick="filterForum('all',this)">全部</button>
        <button class="htab" onclick="filterForum('discussion',this)">讨论</button>
        <button class="htab" onclick="filterForum('article',this)">文章</button>
        <button class="htab" onclick="filterForum('person',this)">人物</button>
        <button class="htab" onclick="filterForum('media',this)">书影</button>
        <button class="htab" onclick="filterForum('resource',this)">资源</button>
      </div>
      <div id="forum-list"></div>
      <button class="fab" onclick="openPost()">＋</button>
    </div>
    <div id="toast"></div>
  `);
}

function installHtmlUtils() {
  window.htmlUtils = {
    escapeHtml: function (value) {
      if (value === null || typeof value === 'undefined') return '';
      return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#39;');
    }
  };
}

function createStorageMock() {
  return {
    getStoredJSON: vi.fn(function (key, fallback) { return fallback; }),
    setStoredJSON: vi.fn(function () { return true; })
  };
}

async function importForum() {
  await import('../src/js/forum.js');
  return window.forumAPI;
}

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-13T12:00:00.000Z'));
  resetGlobals();
  mountForumDOM();
  installHtmlUtils();
  window.storageAPI = createStorageMock();
  window.navigationAPI = { showToast: vi.fn() };
});

describe('forum post types', () => {
  test('forumAPI exposes getPostTypes and getTypeLabels', async () => {
    var api = await importForum();
    expect(api.getPostTypes()).toEqual(FORUM_TYPES);
    expect(api.getTypeLabels().discussion).toBe('讨论');
    expect(api.getTypeLabels().article).toBe('文章');
    expect(api.getTypeLabels().person).toBe('人物');
    expect(api.getTypeLabels().media).toBe('书影');
    expect(api.getTypeLabels().resource).toBe('资源');
  });

  FORUM_TYPES.forEach(function (type) {
    test('renders ' + type + ' post cards with type-specific markers', async () => {
      var api = await importForum();
      var postData = [{
        id: 'test-' + type,
        type: type,
        title: type + ' title',
        content: 'Body for ' + type,
        author: { id: 'u_test', name: 'Test', avatar: '🙂' },
        tags: ['唐', '政治'],
        metadata: { dynasty: '唐朝', role: '皇帝', mediaType: type === 'media' ? '书籍' : null, rating: type === 'media' ? '9.0' : null, externalUrl: null },
        stats: { views: 100, likes: 10, comments: 3, favorites: 5 },
        createdAt: '2026-06-13T00:00:00Z',
        commentsList: []
      }];

      api.setInitialDiscussions(postData);
      expect(document.querySelector('[data-post-id="test-' + type + '"]')).not.toBeNull();
      expect(document.querySelector('[data-post-id="test-' + type + '"]').getAttribute('data-post-type')).toBe(type);
    });
  });

  test('article posts show external link when url present', async () => {
    var api = await importForum();
    api.setInitialDiscussions([{
      id: 'art-link',
      type: 'article',
      title: 'Article with link',
      content: 'Has external url',
      author: { id: 'u_test', name: 'Test', avatar: '🙂' },
      tags: ['宋'],
      metadata: { externalUrl: 'https://example.com/article' },
      stats: { views: 1, likes: 0, comments: 0, favorites: 0 },
      createdAt: '2026-06-13T00:00:00Z',
      commentsList: []
    }]);

    expect(document.getElementById('forum-list').innerHTML).toContain('阅读原文');
    expect(document.getElementById('forum-list').innerHTML).toContain('https://example.com/article');
  });

  test('person posts show dynasty and role metadata', async () => {
    var api = await importForum();
    api.setInitialDiscussions([{
      id: 'per-test',
      type: 'person',
      title: 'Confucius',
      content: 'Great sage',
      author: { id: 'u_test', name: 'Test', avatar: '🙂' },
      tags: ['先秦', '文化'],
      metadata: { dynasty: '春秋', role: '思想家·教育家' },
      stats: { views: 1, likes: 0, comments: 0, favorites: 0 },
      createdAt: '2026-06-13T00:00:00Z',
      commentsList: []
    }]);

    expect(document.getElementById('forum-list').innerHTML).toContain('春秋');
    expect(document.getElementById('forum-list').innerHTML).toContain('思想家·教育家');
  });

  test('media posts show rating when present', async () => {
    var api = await importForum();
    api.setInitialDiscussions([{
      id: 'med-test',
      type: 'media',
      title: 'Great Book',
      content: 'Must read',
      author: { id: 'u_test', name: 'Test', avatar: '🙂' },
      tags: ['明'],
      metadata: { mediaType: '书籍', rating: '9.5' },
      stats: { views: 1, likes: 0, comments: 0, favorites: 0 },
      createdAt: '2026-06-13T00:00:00Z',
      commentsList: []
    }]);

    expect(document.getElementById('forum-list').innerHTML).toContain('9.5');
    expect(document.getElementById('forum-list').innerHTML).toContain('书籍');
  });
});
```

- [ ] **Step 3: 创建 forum-tags.test.js**

```js
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

function mountForumDOM() {
  mountDOM(`
    <div id="forum-page" class="page active">
      <div class="htabs" id="forum-tabs">
        <button class="htab act" onclick="filterForum('all',this)">全部</button>
        <button class="htab" onclick="filterForum('discussion',this)">讨论</button>
        <button class="htab" onclick="filterForum('article',this)">文章</button>
      </div>
      <div class="htabs" id="forum-tag-tabs">
        <button class="htab act" onclick="filterForumByTag('all',this)">全部标签</button>
        <button class="htab" onclick="filterForumByTag('唐',this)">唐</button>
        <button class="htab" onclick="filterForumByTag('政治',this)">政治</button>
      </div>
      <div id="forum-list"></div>
    </div>
    <div id="toast"></div>
    <div class="fov" id="post-overlay" onclick="closePost(event)">
      <div class="fp" onclick="event.stopPropagation()">
        <input type="text" id="post-title">
        <textarea id="post-body"></textarea>
        <select id="post-type-select">
          <option value="discussion">💬 讨论</option>
          <option value="article">📄 文章</option>
        </select>
        <div id="post-tag-list">
          <button class="ft" onclick="togglePostTag(this,'唐')">唐</button>
          <button class="ft" onclick="togglePostTag(this,'宋')">宋</button>
          <button class="ft" onclick="togglePostTag(this,'政治')">政治</button>
          <button class="ft" onclick="togglePostTag(this,'文化')">文化</button>
        </div>
        <button class="fsub" onclick="submitPost()">发布帖子</button>
      </div>
    </div>
  `);
}

function installHtmlUtils() {
  window.htmlUtils = {
    escapeHtml: function (value) {
      if (value === null || typeof value === 'undefined') return '';
      return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#39;');
    }
  };
}

function createStorageMock() {
  return {
    getStoredJSON: vi.fn(function (key, fallback) { return fallback; }),
    setStoredJSON: vi.fn(function () { return true; })
  };
}

async function importForum() {
  await import('../src/js/forum.js');
  return window.forumAPI;
}

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-13T12:00:00.000Z'));
  resetGlobals();
  mountForumDOM();
  installHtmlUtils();
  window.storageAPI = createStorageMock();
  window.navigationAPI = { showToast: vi.fn() };
});

describe('forum tags', () => {
  test('filterForumByTag hides posts without matching tag', async () => {
    var api = await importForum();
    api.setInitialDiscussions([
      { id: 'p1', type: 'discussion', title: 'Tang topic', content: '...', author: { id: 'u1', name: 'A', avatar: '🙂' }, tags: ['唐'], metadata: {}, stats: { views: 0, likes: 0, comments: 0, favorites: 0 }, createdAt: '2026-06-13T00:00:00Z', commentsList: [] },
      { id: 'p2', type: 'discussion', title: 'Song topic', content: '...', author: { id: 'u1', name: 'A', avatar: '🙂' }, tags: ['宋'], metadata: {}, stats: { views: 0, likes: 0, comments: 0, favorites: 0 }, createdAt: '2026-06-13T00:00:00Z', commentsList: [] }
    ]);

    var tagButton = document.querySelectorAll('#forum-tag-tabs .htab')[1];
    api.filterForumByTag('唐', tagButton);

    expect(document.querySelector('[data-post-id="p1"]').style.display).toBe('block');
    expect(document.querySelector('[data-post-id="p2"]').style.display).toBe('none');
    expect(tagButton.classList.contains('act')).toBe(true);
  });

  test('filterForumByTag "all" shows all posts', async () => {
    var api = await importForum();
    api.setInitialDiscussions([
      { id: 'p1', type: 'discussion', title: 'A', content: '...', author: { id: 'u1', name: 'A', avatar: '🙂' }, tags: ['唐'], metadata: {}, stats: { views: 0, likes: 0, comments: 0, favorites: 0 }, createdAt: '2026-06-13T00:00:00Z', commentsList: [] },
      { id: 'p2', type: 'discussion', title: 'B', content: '...', author: { id: 'u1', name: 'A', avatar: '🙂' }, tags: ['宋'], metadata: {}, stats: { views: 0, likes: 0, comments: 0, favorites: 0 }, createdAt: '2026-06-13T00:00:00Z', commentsList: [] }
    ]);

    var allButton = document.querySelectorAll('#forum-tag-tabs .htab')[0];
    api.filterForumByTag('all', allButton);

    expect(document.querySelectorAll('#forum-list .pcard')).toHaveLength(2);
  });

  test('submitPost requires at least one tag', async () => {
    var api = await importForum();
    api.setInitialDiscussions([]);

    document.getElementById('post-title').value = 'No tags';
    document.getElementById('post-body').value = 'Content';

    api.submitPost();
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('请至少选择一个标签');
  });

  test('submitPost allows up to 5 tags', async () => {
    var api = await importForum();
    api.setInitialDiscussions([]);

    document.getElementById('post-title').value = 'Many tags';
    document.getElementById('post-body').value = 'Content';

    var tagButtons = document.querySelectorAll('#post-tag-list .ft');
    api.togglePostTag(tagButtons[0], '唐');
    api.togglePostTag(tagButtons[1], '宋');
    api.togglePostTag(tagButtons[2], '政治');
    api.togglePostTag(tagButtons[3], '文化');
    // 手动推入第5个 tag 来触发上限
    api.togglePostTag(tagButtons[0], '经济'); // togglePostTag 先 push

    // reset for clean test
    vi.resetModules();
    resetGlobals();
    mountForumDOM();
    installHtmlUtils();
    window.storageAPI = createStorageMock();
    window.navigationAPI = { showToast: vi.fn() };
    var freshApi = await importForum();
    freshApi.setInitialDiscussions([]);

    document.getElementById('post-title').value = 'Many tags';
    document.getElementById('post-body').value = 'Content';
    var freshButtons = document.querySelectorAll('#post-tag-list .ft');
    freshApi.togglePostTag(freshButtons[0], '唐');
    freshApi.togglePostTag(freshButtons[1], '宋');
    freshApi.togglePostTag(freshButtons[2], '政治');
    freshApi.togglePostTag(freshButtons[3], '文化');
    // 第5个
    freshApi.togglePostTag(freshButtons[0], '经济');

    // 再添加第6个（postTags 此时有5个）
    freshApi.togglePostTag(freshButtons[1], '军事');
    // postTags 现在有6个，第6个仍然被push了
    freshApi.submitPost();
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('最多选择5个标签');
  });

  test('getDynastyTags and getTopicTags return expected arrays', async () => {
    var api = await importForum();
    expect(api.getDynastyTags()).toContain('唐');
    expect(api.getDynastyTags()).toContain('近代');
    expect(api.getTopicTags()).toContain('政治');
    expect(api.getTopicTags()).toContain('制度');
  });
});
```

- [ ] **Step 4: 创建 forum-xss.test.js**

```js
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

function mountForumDOM() {
  mountDOM(`
    <div id="forum-page" class="page active">
      <div id="forum-list"></div>
      <button class="fab" onclick="openPost()">＋</button>
    </div>
    <div class="fov" id="post-overlay" onclick="closePost(event)">
      <div class="fp" onclick="event.stopPropagation()">
        <input type="text" id="post-title">
        <textarea id="post-body"></textarea>
        <select id="post-type-select">
          <option value="discussion">讨论</option>
        </select>
        <div id="post-tag-list">
          <button class="ft" onclick="togglePostTag(this,'唐')">唐</button>
        </div>
        <button class="fsub" onclick="submitPost()">发布帖子</button>
      </div>
    </div>
    <div id="toast"></div>
  `);
}

function installHtmlUtils() {
  window.htmlUtils = {
    escapeHtml: function (value) {
      if (value === null || typeof value === 'undefined') return '';
      return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#39;');
    }
  };
}

async function importForum() {
  await import('../src/js/forum.js');
  return window.forumAPI;
}

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-13T12:00:00.000Z'));
  resetGlobals();
  mountForumDOM();
  installHtmlUtils();
  window.storageAPI = {
    getStoredJSON: vi.fn(function (key, fallback) { return fallback; }),
    setStoredJSON: vi.fn(function () { return true; })
  };
  window.navigationAPI = { showToast: vi.fn() };
});

describe('forum XSS safety', () => {
  test('escapes script tags in post title and content', async () => {
    var api = await importForum();
    api.setInitialDiscussions([{
      id: 'xss-1',
      type: 'discussion',
      title: '<script>alert("xss")</script>Title',
      content: '<img src=x onerror="alert(1)">Body',
      author: { id: 'u1', name: '<b>Hacker</b>', avatar: '<script>' },
      tags: ['唐'],
      metadata: {},
      stats: { views: 0, likes: 0, comments: 0, favorites: 0 },
      createdAt: '2026-06-13T00:00:00Z',
      commentsList: [{
        author: 'Commenter',
        avatar: '🙂',
        body: '<script>alert("comment xss")</script>'
      }]
    }]);
    api.toggleComments('xss-1');

    expect(document.querySelector('#forum-list script')).toBeNull();
    expect(document.querySelector('#forum-list img')).toBeNull();
    expect(document.getElementById('forum-list').innerHTML).toContain('&lt;script&gt;');
  });

  test('escapes user input in post creation', async () => {
    var api = await importForum();
    api.setInitialDiscussions([]);

    document.getElementById('post-title').value = '<script>bad</script>User title';
    document.getElementById('post-body').value = '<img onerror="xss">User body';

    var tagBtn = document.querySelector('#post-tag-list .ft');
    api.togglePostTag(tagBtn, '唐');
    api.submitPost();

    expect(document.querySelector('#forum-list script')).toBeNull();
    expect(document.querySelector('#forum-list img')).toBeNull();
    expect(document.getElementById('forum-list').innerHTML).toContain('&lt;script&gt;bad&lt;/script&gt;');
  });

  test('escapes script-like content in comments', async () => {
    var api = await importForum();
    api.setInitialDiscussions([{
      id: 'xss-2',
      type: 'discussion',
      title: 'Test',
      content: 'Body',
      author: { id: 'u1', name: 'A', avatar: '🙂' },
      tags: ['唐'],
      metadata: {},
      stats: { views: 0, likes: 0, comments: 0, favorites: 0 },
      createdAt: '2026-06-13T00:00:00Z',
      commentsList: []
    }]);

    api.addComment('xss-2', '<script>alert("bad")</script>Comment');
    expect(document.getElementById('forum-list').innerHTML).toContain('&lt;script&gt;');
    expect(document.querySelector('#forum-list script')).toBeNull();
  });
});
```

- [ ] **Step 5: 创建 tools-page.test.js**

```js
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

function mountToolsDOM() {
  mountDOM(`
    <div id="tools-page" class="page">
      <div class="hh"><h2>学习工具</h2></div>
      <div class="sg">
        <button class="scard" onclick="openSub('noun-page')"><span class="ic">📖</span><h4>名词解释</h4></button>
        <button class="scard" onclick="openSub('timeline-page')"><span class="ic">🕐</span><h4>时间轴</h4></button>
        <button class="scard" onclick="openSub('mindmap-page')"><span class="ic">🧠</span><h4>思维导图</h4></button>
      </div>
    </div>
    <div id="noun-page" class="sub"><h2>名词</h2></div>
    <div id="timeline-page" class="sub"><h2>时间轴</h2></div>
    <div id="mindmap-page" class="sub"><h2>思维导图</h2></div>
  `);
}

describe('tools page', () => {
  test('tools page renders three tool cards', () => {
    mountToolsDOM();
    var cards = document.querySelectorAll('#tools-page .scard');
    expect(cards.length).toBe(3);
    expect(cards[0].textContent).toContain('名词解释');
    expect(cards[1].textContent).toContain('时间轴');
    expect(cards[2].textContent).toContain('思维导图');
  });

  test('tool cards have onclick handlers to open sub pages', () => {
    mountToolsDOM();
    var nounCard = document.querySelector('#tools-page .scard');
    expect(nounCard.getAttribute('onclick')).toContain('noun-page');
  });

  test('toolsAPI initializes without errors', async () => {
    mountToolsDOM();
    await import('../src/js/tools.js');
    expect(window.toolsAPI).toBeDefined();
    expect(typeof window.toolsAPI.initToolsPage).toBe('function');
    expect(function () { window.toolsAPI.initToolsPage(); }).not.toThrow();
  });
});
```

- [ ] **Step 6: 更新 app-static-data.test.js**

更新 `tests/app-static-data.test.js`，移除对 hot-articles、films、people、podcasts、questions 数据文件的引用，将 discuss 相关断言更新为 forum：

关键修改：
- 删除 `hot-articles.json` 相关的测试
- 删除 `films.json`、`people.json`、`podcasts.json`、`questions.json` 相关的测试
- 将 `discussions.json` 校验更新为新的 forum 数据模型（type, tags, author 对象格式）

- [ ] **Step 7: 更新 adapter-wiring.test.js**

移除 `audio.js` adapter 相关测试。

- [ ] **Step 8: 更新 validate-data.test.js**

更新校验规则以匹配新的 discussions.json 数据模型（type 必填，取值范围 discussion/article/person/media/resource）。

- [ ] **Step 9: 更新 navigation.test.js**

移除 login 相关测试，添加 forum-page 默认显示相关测试。

- [ ] **Step 10: 更新 favorites.test.js**

更新收藏功能以兼容新的帖子数据结构。

- [ ] **Step 11: 运行全部测试**

```bash
npx vitest run --environment jsdom
```

预期：所有保留+新建的测试通过，约 20 个测试文件、180+ 测试项。

- [ ] **Step 12: 提交**

```bash
git add tests/
git commit -m "test: update tests for forum homepage — new forum tests, remove old module tests"
```

---

### Task 10: 更新校验脚本与文档

**Files:**
- Modify: `scripts/validate-data.js`
- Modify: `CLAUDE.md`

- [ ] **Step 1: 更新 validate-data.js**

在 `scripts/validate-data.js` 中添加 forum 帖子校验规则：

```js
// Forum posts validation
if (dataFiles.discussions) {
  var posts = dataFiles.discussions;
  var VALID_TYPES = ['discussion', 'article', 'person', 'media', 'resource'];

  posts.forEach(function (post, index) {
    if (!post.id) errors.push('discussions[' + index + ']: missing id');
    if (!post.type || VALID_TYPES.indexOf(post.type) === -1) {
      errors.push('discussions[' + index + ']: invalid type "' + post.type + '"');
    }
    if (!post.title) errors.push('discussions[' + index + ']: missing title');
    if (!post.content && !post.body) errors.push('discussions[' + index + ']: missing content');
    if (!Array.isArray(post.tags) || post.tags.length === 0) {
      errors.push('discussions[' + index + ']: missing or empty tags');
    }
    if (post.tags && post.tags.length > 5) {
      errors.push('discussions[' + index + ']: too many tags (' + post.tags.length + ')');
    }
  });

  var types = posts.map(function (p) { return p.type; });
  VALID_TYPES.forEach(function (t) {
    if (types.indexOf(t) === -1) {
      warnings.push('discussions: no posts of type "' + t + '"');
    }
  });

  log('discussions: ' + posts.length + ' posts, ' +
    VALID_TYPES.map(function (t) { return types.filter(function (x) { return x === t; }).length + ' ' + t; }).join(', '));
}
```

- [ ] **Step 2: 运行数据校验**

```bash
node scripts/validate-data.js
```

- [ ] **Step 3: 更新 CLAUDE.md**

更新项目进度和技术栈信息：
- 更新当前进度日期为 2026-06-13
- 更新页面结构描述（论坛首页、工具页、我的）
- 移除已删除模块的说明
- 更新数据文件列表

- [ ] **Step 4: 更新缓存版本号**

将所有文件中的 `v=20260612-timeline-fix2` 替换为 `v=20260613-forum-v1`。

- [ ] **Step 5: 最终全量测试**

```bash
npx vitest run --environment jsdom
node scripts/validate-data.js
```

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "chore: update validate-data, CLAUDE.md, cache version for forum homepage"
```

---

## 执行顺序建议

按 Task 1→10 顺序执行，每个 Task 的 commit 独立可回滚。关键依赖：
- Task 2（forum.js）依赖 Task 1（移除旧模块）
- Task 3（种子数据）依赖 Task 2（forum.js 支持新数据模型）
- Task 4（HTML 重构）依赖 Task 2（forum.js 就绪）
- Task 5-6（navigation/app.js）依赖 Task 4（HTML 结构确定）
- Task 7（tools.js）可与 Task 4 并行
- Task 8（CSS）可在 Task 4 后随时进行
- Task 9（测试）贯穿全部，有新模块立即写测试
- Task 10（校验文档）在所有代码完成后进行

## 回滚策略

每个 Task 独立 commit，如需回滚：
1. `git revert <commit>` 逐个回退
2. 或 `git reset --hard <pre-task-1-commit>` 全量回退
