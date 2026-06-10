# 学的是史 当前仓库基线

## 1. 项目概览

- 项目定位：中国历史学习网站 Web 原型，当前处于 Web 原型补完与模块化整理阶段。
- 技术栈：原生 HTML / CSS / ES5 JavaScript / JSON 静态数据 / LocalStorage / Vitest + jsdom。
- 页面入口：`index.html`。
- 主要目录：`src/css/`、`src/js/`、`src/data/`、`tests/`、`docs/`、`TASKS/`。
- 运行方式：本地通过静态服务器访问，当前文档与实现均以当前工作区内容为准。

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
- `film-page`：影视书目推荐页。

### 详情、面板与弹层

- `noun-detail`：名词详情面板。
- `node-note-panel`：思维导图节点笔记面板。
- `people-detail-card`：人物详情卡片。
- `podcast-player`：播客播放器面板。
- `checkin-panel`：打卡面板。
- `post-overlay`：发帖弹层。
- `feedback-overlay`：问题反馈弹层。
- `feat-detail-overlay`：朝代特征详情弹层。
- `meme-overlay`：梗图弹层。
- `ai-panel`：AI 助手面板。
- `bnav`：底部导航容器。

## 3. JS 模块与职责

- `src/js/app.js`：应用入口，负责初始化、基础数据加载和将部分模块能力兼容暴露到全局。
- `src/js/storage.js`：对 `localStorage` 的 JSON 和字符串读写进行封装，暴露 `window.storageAPI`。
- `src/js/navigation.js`：负责登录、子页面开关、Toast 与 AI FAB 复位，暴露 `window.navigationAPI`。
- `src/js/noun.js`：负责名词详情、收藏按钮切换、分享和名词搜索，暴露 `window.nounAPI`。
- `src/js/timeline.js`：负责时间轴朝代切换、事件渲染、缩放和详情展示，暴露 `window.timelineAPI`。
- `src/js/podcast.js`：负责播客筛选、播放器开关、进度条与定时关闭，暴露 `window.podcastAPI`。
- `src/js/ai-assistant.js`：负责 AI 助手面板开关、预设问答和悬浮按钮拖拽，暴露 `window.aiAssistantAPI`。
- `src/js/favorites.js`：负责收藏列表的读取、写入、渲染与移除，暴露 `window.favoritesAPI`。
- `src/js/checkin.js`：负责打卡面板、打卡日历、连续天数和统计展示，暴露 `window.checkinAPI`。
- `src/js/film.js`：负责影视书目、榜单、待看栏状态与面板渲染，暴露 `window.filmAPI`。

### 当前模块边界备注

- `src/js/` 已存在多份业务模块文件。
- `index.html` 中仍保留较大段内联脚本，部分功能与外部模块并存。
- `app.js` 当前会在初始化阶段加载 `nouns.json`、`timeline.json`、`podcasts.json`，并做兼容性全局挂载。

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
- `src/data/books.json`：书籍资源数据。
- `src/data/memes.json`：梗图内容数据。

### 当前数据层备注

- `src/data/` 下的数据文件已经覆盖首页、名词、时间轴、人物、播客、影视、讨论区、个人页等多个模块。
- 当前仓库中并不是所有 JSON 文件都已经由 `app.js` 在初始化时统一加载。

## 5. index.html 内联脚本现状

当前 `index.html` 在外部脚本引入后，仍保留一段较大的内联脚本区域，主要包含以下功能块：

- 页面切换：`swTab()`、`swSubTab()` 负责主页面和子页面切换。
- 梗图轮播：`memeData`、`openMeme()`、`closeMeme()` 和滚动指示器逻辑。
- 热点筛选：`filterHot()` 负责首页热点分类筛选。
- 影视榜单与待看栏：`filFilm()`、`rankData`、`swRnkTab()`、`renderRnk()`、`wlData`、`openWL()`、`renderWL()` 等。
- 反馈弹层：`openFB()`、`closeFB()`、`selFT()`、`subFB()`。
- 人物关系图：`peoData`、`renderRel()`、`openCenterDet()`、`openPeoDet()`、`swPeoGroup()`、`searchPeople()`。
- 思维导图：`swMind()`、`openNode()`、`saveNode()`、`closeNodeNote()`。
- 朝代特征详情：`openFeatDet()`、`closeFeatDet()`。
- 讨论区：`openPost()`、`closePost()`、`togglePostTag()`、`submitPost()`、`toggleComments()`、`filterDiscuss()`。
- 打卡签到：`openCheckin()`、`closeCheckin()`、`doCheckin()`、`renderCheckinCalendar()`、`updateCheckinStats()`、`calcStreak()`。

### 当前内联脚本与模块关系

- 注释中已明确标注一部分逻辑“已迁移到 `src/js/*.js`”。
- 页面切换、人物关系图、思维导图、讨论区、反馈、打卡等功能当前仍主要保留在 `index.html` 内联脚本中。
- 时间轴、名词解释、AI 助手、导航、存储、播客等模块已有对应外部 JS 文件。

## 6. 已暴露的 window API

### `window.xxxAPI`

- `window.storageAPI`：来自 `src/js/storage.js`，负责 JSON 和字符串存取。
- `window.navigationAPI`：来自 `src/js/navigation.js`，负责登录、页面切换和 Toast。
- `window.nounAPI`：来自 `src/js/noun.js`，负责名词页交互。
- `window.timelineAPI`：来自 `src/js/timeline.js`，负责时间轴交互。
- `window.podcastAPI`：来自 `src/js/podcast.js`，负责播客筛选和播放器。
- `window.aiAssistantAPI`：来自 `src/js/ai-assistant.js`，负责 AI 助手交互。
- `window.favoritesAPI`：来自 `src/js/favorites.js`，负责收藏列表交互。
- `window.checkinAPI`：来自 `src/js/checkin.js`，负责打卡与统计。
- `window.filmAPI`：来自 `src/js/film.js`，负责影视书目、榜单和待看栏。

### 兼容性全局函数

- `src/js/app.js` 会将部分模块方法兼容挂载到 `window`，例如：
- 存储兼容函数：`getStoredJSON`、`setStoredJSON`、`getStoredString`、`setStoredString`。
- 导航兼容函数：`resetAIFab`、`showToast`、`login`、`openSub`、`closeSub`。
- 名词兼容函数：`openNounDet`、`closeNounDet`、`togNounFav`、`shareNoun`、`searchNouns`。
- 时间轴兼容函数：`selDyn`、`prevDyn`、`nextDyn`、`showTimelineDetail`、`showTimelineConn`、`renderTimeline`、`renderEventList`、`zoomTL`。
- 播客兼容函数：`filterPodcast`、`openPlayer`、`closePlayer`、`togglePlay`、`seekPodcast`、`setTimer`、`showTimer`、`prevPodcast`、`nextPodcast`。
- AI 助手兼容函数：`togAI`、`aiAsk`、`aiSend`。
- 影视兼容函数：`filterFilms`、`switchRankingTab`、`openWatchlist`、`closeWatchlist`、`switchWatchlistTab`、`toggleWatchlistItem`、`moveWatchlistItem`。

## 7. 已识别的 LocalStorage key

- `xds_favorites`：来自 `src/js/favorites.js`，用于收藏列表。
- `xds_watchlist`：来自 `src/js/film.js`，用于影视待看栏状态。
- `checkins`：出现在 `src/js/checkin.js` 和 `index.html` 内联脚本中，用于打卡记录。
- `note_<节点名>`：出现在 `index.html` 内联脚本中，用于思维导图节点笔记。

### 当前存储层备注

- `src/js/storage.js` 提供了通用存储封装。
- 部分业务模块优先通过 `window.storageAPI` 访问存储。
- `index.html` 内联脚本中仍存在直接使用 `localStorage` 的逻辑。

## 8. 当前状态备注

- 当前仓库处于“部分模块化、部分内联脚本保留”的过渡状态。
- `src/js/` 已存在多份业务模块文件，但 `index.html` 仍保留较大段内联脚本。
- `src/data/` 下的数据文件已扩展到多个内容模块，不再只有最早期的少量种子文件。
- 当前仓库已存在 `tests/` 目录和多份测试文件。
- 当前测试基线不是全绿状态。

## 9. 占位文案审计结果

- `index.html`：`showToast('手机号登录功能开发中')`，用于登录页手机号登录按钮，分类为“占位入口”。
- `index.html`：`showToast('搜索功能开发中')`，用于首页搜索入口，分类为“占位入口”。
- `index.html`：`showToast('挖空练习功能开发中')`，用于科学备考页挖空练习入口，分类为“占位入口”。
- `index.html`：`showToast('笔记上传功能开发中')`，用于科学备考页笔记上传入口，分类为“占位入口”。
- `index.html`：`showToast('联机PK功能开发中')`，用于科学备考页联机 PK 入口，分类为“占位入口”。
- `index.html`：`showToast('复习专区加载中')`，用于科学备考页复习专区入口，分类为“占位入口”。
- `index.html`：`showToast('自定义导图编辑器开发中')`，用于思维导图页新建空白导图按钮，分类为“占位入口”。
- `index.html`：`showToast('搜索功能开发中')`，用于讨论区搜索入口，分类为“占位入口”。
- `index.html`：`showToast('学习记录开发中')`，用于个人页学习记录入口，分类为“占位入口”。
- `index.html`：`showToast('收藏/错题本开发中')`，用于个人页收藏/错题本入口，分类为“占位入口”。
- `index.html`：`showToast('积分兑换开发中')`，用于个人页积分兑换入口，分类为“占位入口”。
- `index.html`：`showToast('设置页面开发中')`，用于个人页设置与账号入口，分类为“占位入口”。

## 10. innerHTML 审计结果

- `src/js/timeline.js`：用于写入时间轴 SVG 图表，来源分类为“外部 JSON / 外部数据”。
- `src/js/timeline.js`：用于写入事件列表和空状态，来源分类为“外部 JSON / 外部数据”。
- `src/js/noun.js`：用于清空相关名词容器，来源分类为“内部常量 / 模板”。
- `src/js/noun.js`：用于追加相关名词按钮，来源分类为“外部 JSON / 外部数据”。
- `src/js/noun.js`：用于写入“暂无相关名词”空状态，来源分类为“内部常量 / 模板”。
- `index.html`：用于渲染影视榜单列表，来源分类为“内部常量 / 模板”。
- `index.html`：用于渲染待看栏内容区域，来源分类为“内部常量 / 模板”。
- `index.html`：用于渲染人物详情信息块，来源分类为“内部常量 / 模板”。
- `index.html`：用于清空人物事迹列表容器，来源分类为“内部常量 / 模板”。
- `index.html`：用于清空人物年表容器，来源分类为“内部常量 / 模板”。
- `index.html`：用于渲染内联打卡日历，来源分类为“存储数据”。
- `src/js/film.js`：用于渲染影视卡片列表和空状态，来源分类为“外部 JSON / 外部数据”。
- `src/js/film.js`：用于写入“暂无榜单内容”空状态，来源分类为“内部常量 / 模板”。
- `src/js/film.js`：用于渲染榜单列表，来源分类为“外部 JSON / 外部数据”。
- `src/js/film.js`：用于写入待看栏空状态，来源分类为“内部常量 / 模板”。
- `src/js/film.js`：用于渲染待看栏条目，来源分类为“外部 JSON / 外部数据”。
- `src/js/checkin.js`：用于渲染打卡日历，来源分类为“存储数据”。
- `src/js/ai-assistant.js`：用于追加用户提问气泡，来源分类为“用户输入”。
- `src/js/ai-assistant.js`：用于追加助手回复气泡，来源分类为“用户输入”。
- `src/js/favorites.js`：用于写入“暂无收藏内容”空状态，来源分类为“内部常量 / 模板”。
- `src/js/favorites.js`：用于渲染收藏列表，来源分类为“存储数据”。

## 11. 审计摘要

- 占位文案 `showToast` 调用点：12 处。
- `innerHTML` 使用点：21 处。
- `innerHTML` 来源分类统计：`用户输入` 2 处，`外部 JSON / 外部数据` 6 处，`存储数据` 3 处，`内部常量 / 模板` 10 处。
