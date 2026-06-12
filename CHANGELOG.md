# CHANGELOG

## 2026-06-11

### Phase 3 Task 3.4：讨论区

- 新增 `src/js/discuss.js`，讨论区改为独立 ES5 IIFE 模块，暴露 `window.discussAPI` 与内联事件兼容函数。
- 讨论区帖子由 `src/data/discussions.json` 数据驱动渲染，`index.html` 删除硬编码 `.pcard` 帖子并保留 `#discussion-list` 容器。
- 每张帖子卡片新增 `data-post-id`，`toggleComments(postId)` 按帖子 ID 精确展开 / 收起评论区，并在筛选或重渲染后保留展开状态。
- 支持 `all` / `view` / `cold` / `help` / `resource` 分类筛选，空分类展示 `暂无讨论`。
- 发布帖子与新增评论通过 `storageAPI` 持久化到 `xds_discussions`，刷新后优先恢复本地讨论数据。
- 用户发布的标题、正文、评论以及外部 JSON 字段进入 `innerHTML` 前统一转义，防止脚本型内容执行。
- `app.js` 改为将 `discussions.json` 注入 `discussAPI.setInitialDiscussions()`，并统一暴露讨论区全局兼容函数。
- 新增 `tests/discuss.test.js`，覆盖数据驱动 shell、app 接线、分类筛选、精确第三帖展开、展开状态保持、发帖、评论、刷新持久化和 XSS 转义。

#### 验证

- `npx vitest run tests/discuss.test.js --environment jsdom`：通过，`14` 项测试通过。
- `npx vitest run tests/discuss.test.js tests/app-static-data.test.js --environment jsdom`：通过，`2` 个测试文件、`17` 项测试通过。
- `npx vitest run --environment jsdom`：通过，`28` 个测试文件、`167` 项测试通过（Vitest 同时收集了 `.claude/worktrees` 下的历史测试副本）。
- `node scripts/validate-data.js`：`14 OK`、`1 WARN`、`0 ERROR`；剩余 WARN 为 `people.json` 仍使用 centers 结构。

### Phase 3 Task 3.3：播客

- 调整 `src/data/podcasts.json` 为首轮 `4` 条播客种子数据，补齐分类标签、收听量和音频 URL 字段。
- 更新 `src/js/podcast.js`，播客列表由 JSON 数据驱动渲染，空数据时展示 `暂无播客内容`。
- 播客播放继续通过 `audioAPI` adapter 执行 `setSource`、`play`、`pause`、`seek`，不直接创建 `Audio`。
- 新增倍速切换能力，`1.0x → 1.25x → 1.5x → 2.0x` 循环。
- 定时关闭统一通过 `navigationAPI.showToast` 提示，并在计时触发后关闭播放器。
- 音频源设置失败或 adapter error 回调触发时展示 `音频加载失败，请稍后重试`。
- 删除 `index.html` 中硬编码播客卡片，保留 `#podcast-list` 渲染容器，并将倍速按钮接入 `toggleSpeed()`。
- 新增 `tests/podcast.test.js`，覆盖种子数量、列表渲染、分类筛选、audioAPI 播放/暂停/seek、倍速、定时关闭、错误处理和 XSS 转义。

#### 验证

- `npx vitest run tests/podcast.test.js --environment jsdom`：通过，`9` 项测试通过。
- `npx vitest run tests/podcast.test.js tests/podcast-audio-adapter.test.js tests/app-static-data.test.js tests/adapter-wiring.test.js --environment jsdom`：通过，`4` 个测试文件、`22` 项测试通过。
- `node scripts/validate-data.js`：`14 OK`、`1 WARN`、`0 ERROR`；剩余 WARN 为 `people.json` 仍使用 centers 结构。

### Phase 3 Task 3.2：影视书目

- 扩充 `src/data/films.json`，首轮种子数据达到书籍 / 影视 / 纪录片各 `5` 条。
- 更新 `src/data/rankings.json`，书籍榜、影视榜、纪录片榜均按评分降序排列。
- 更新 `src/js/film.js`，榜单渲染时按 `score` 数值降序排序，并用排序后的顺序生成榜单名次。
- 保持影视书目筛选、待看栏 `xds_watchlist` 持久化、待看 / 在看 / 看过状态切换能力。
- 扩展 `tests/film.test.js`，覆盖种子数量、榜单数据排序、渲染排序、筛选、待看栏增删、状态移动、无效 ID 清理和 XSS 安全渲染。

#### 验证

- `npx vitest run tests/film.test.js --environment jsdom`：通过，本仓库 `tests/film.test.js` 的 `9` 项测试通过；Vitest 同时收集了 `.claude/worktrees` 下的历史测试副本，总计 `6` 个测试文件、`24` 项测试通过。
- `npx vitest run tests/film.test.js tests/app-static-data.test.js tests/adapter-wiring.test.js --environment jsdom`：通过，包含历史 worktree 测试副本在内共 `8` 个测试文件、`33` 项测试通过。
- `node scripts/validate-data.js`：`14 OK`、`1 WARN`、`0 ERROR`；剩余 WARN 为 `people.json` 仍使用 centers 结构。

### Phase 3 Task 3.1：首页热点文章

- 首页热点文章改为完全由 `src/data/hot-articles.json` 驱动渲染，保留首轮 `7` 条种子数据。
- 删除 `index.html` 中硬编码的 `.hl` / `.hi` 热点文章元素，保留空的 `#hot-articles` 容器。
- `renderHotArticles()` 支持头条卡片和普通条目卡片，并为卡片添加 `data-article-id` 和 `data-dynasty`。
- 新增 `filterHot()` 全局兼容函数，朝代 Tab 可按 `all` / `qinhan` / `suitang` / `song` / `mingqing` / `modern` 筛选。
- 点击热点卡片通过 `externalLinkAPI.open()` 打开外链。
- 空数据时展示 `暂无热点文章`，所有 JSON 字段进入 `innerHTML` 前进行转义。
- 新增 `tests/hot-articles.test.js`，覆盖数据驱动渲染、index shell 清理、朝代筛选、外链 adapter、空态和 XSS 转义。

#### 验证

- `npx vitest run tests/hot-articles.test.js --environment jsdom`：通过，`6` 项测试通过。
- `npx vitest run tests/hot-articles.test.js tests/app-static-data.test.js tests/adapter-wiring.test.js --environment jsdom`：通过，`3` 个测试文件、`15` 项测试通过。

### Phase 2 Task 2.7：复习专区

- 新增 `src/js/review.js`，聚合 `xds_learned` 已学名词和 `xds_wrong_questions` 未掌握错题。
- 科学备考页“复习专区”入口改为真实入口，新增 `#review-zone-panel` 渲染容器。
- 复习专区展示已学名词列表，按 `learnedAt` 倒序排列，并显示朝代与分类信息。
- 复习专区展示待复习错题，默认隐藏 `mastered: true` 的错题，并显示最近错选和错误次数。
- 支持按近 `1` / `7` / `30` 天筛选已学名词与错题。
- 点击已学名词会打开名词详情，点击错题会跳转到对应题目重新练习。
- 新增 `tests/review.test.js`，覆盖已学名词渲染、错题渲染、时间筛选、空态、点击跳转和 XSS 转义。

#### 验证

- `npx vitest run tests/review.test.js --environment jsdom`：通过，`6` 项测试通过。
- `npx vitest run tests/review.test.js tests/noun-actions.test.js tests/wrong-question.test.js tests/quiz.test.js tests/app-static-data.test.js tests/adapter-wiring.test.js --environment jsdom`：通过，`6` 个测试文件、`38` 项测试通过。

### Phase 2 Task 2.6：打卡签到（增强）

- 更新 `src/js/checkin.js`，打卡数据从旧 `checkins` key 切换到 `xds_checkins`，并继续通过 `storageAPI` 读写。
- 今日成功打卡后同步更新日历、累计打卡、本月打卡、连续天数和学习统计，并记录 `checkin` 学习事件。
- 今日已打卡时不重复写入、不重复记录学习事件，并保持提示 `今日已打卡，明天继续加油！`。
- 连续打卡达到 `3` 天和 `7` 天时显示不同鼓励提示。
- 今日已打卡后按钮显示 `✅ 已打卡`、添加 `done` 样式并置灰禁用。
- 扩展 `tests/checkin.test.js`，覆盖 `xds_checkins` 读写、连续天数、同一天重复打卡、按钮状态、3/7 天提示，以及缺少 `learningStatsAPI` 时的统计降级。

#### 验证

- `npx vitest run tests/checkin.test.js --environment jsdom`：通过，`7` 项测试通过。
- `npx vitest run tests/checkin.test.js tests/learning-stats.test.js tests/adapter-wiring.test.js --environment jsdom`：通过，`3` 个测试文件、`20` 项测试通过。

### Phase 2 Task 2.5：学习记录

- 新增 `src/js/learning-stats.js`，通过 `storageAPI` 将学习事件持久化到 `xds_learning_events`。
- 学习事件统一记录 `type`、`timestamp`、可选 `sourceId`，当前覆盖学名词、答对题、答错题和打卡。
- 个人页统计改由 learning-stats 聚合展示：学习天数、学习分钟、完成练习数和连续天数。
- `src/js/noun.js`、`src/js/quiz.js`、`src/js/checkin.js` 在成功动作后写入学习事件，并在缺少 `learningStatsAPI` 时安全降级。
- `index.html` 加载 `learning-stats.js` 和模块化 `checkin.js`，内联打卡兼容函数改为转发到 `checkinAPI`。
- 新增 `tests/learning-stats.test.js`，覆盖事件记录、聚合统计、个人页渲染、storage adapter 缺失降级，以及名词/选择题/打卡事件集成。

#### 验证

- `npx vitest run tests/learning-stats.test.js --environment jsdom`：通过，`7` 项测试通过。
- `npx vitest run tests/learning-stats.test.js tests/checkin.test.js tests/quiz.test.js tests/wrong-question.test.js tests/noun-actions.test.js --environment jsdom`：通过，`32` 项测试通过。
- `npx vitest run tests/learning-stats.test.js tests/checkin.test.js tests/adapter-wiring.test.js tests/app-static-data.test.js tests/film.test.js tests/quiz.test.js tests/wrong-question.test.js tests/noun-actions.test.js --environment jsdom`：通过，`13` 个测试文件、`61` 项测试通过（Vitest 同时收集了 `.claude/worktrees` 下的历史测试副本）。

### Phase 2 Task 2.4：错题集

- 更新 `src/js/quiz.js`，答错选择题后通过 `storageAPI` 持久化到 `xds_wrong_questions`。
- 同一题多次答错会累加 `wrongCount`，并更新最近答错时间和最近错误答案。
- 科学备考页新增真实“错题集”入口和 `#wrong-question-panel` 渲染容器。
- 错题列表支持“再做一次”跳回对应题目，以及“标记已掌握”隐藏未掌握列表中的记录。
- 新增 `tests/wrong-question.test.js`，覆盖错题写入、累加、答对不写入、列表渲染、再做一次、标记掌握、storage adapter 缺失降级和 XSS 转义。

#### 验证

- `npx vitest run tests/quiz.test.js tests/wrong-question.test.js --environment jsdom`：通过，`16` 项测试通过。
- `npx vitest run tests/wrong-question.test.js tests/quiz.test.js tests/app-static-data.test.js --environment jsdom`：通过，`19` 项测试通过。

### Phase 2 Task 2.3：基础选择题

- 新增 `src/data/questions.json`，提供 `12` 道结构化选择题种子数据。
- 新增 `src/js/quiz.js`，支持开始练习、单选答题、正确/错误反馈、解析展示、下一题和完成页正确率统计。
- 科学备考页新增真实“真题演练”入口和 `#quiz-panel` 渲染容器，并加载 `quiz.js`。
- `app.js` 新增加载 `questions.json` 并注入 `quizAPI`，同时暴露内联事件需要的 quiz 全局函数。
- 新增 `tests/quiz.test.js`，覆盖渲染、答题反馈、题目切换、完成统计、空题库和 XSS 转义。

#### 验证

- `npx vitest run tests/quiz.test.js --environment jsdom`：通过，`8` 项测试通过。
- `npx vitest run tests/quiz.test.js tests/app-static-data.test.js --environment jsdom`：通过，`11` 项测试通过。
- `node scripts/validate-data.js`：`questions.json` 校验通过。

### Phase 2 Task 2.2：名词收藏与标记已学

- 更新 `src/js/noun.js`，通过 `storageAPI` 将名词收藏状态持久化到 `xds_favorites`。
- 名词卡片渲染时会从持久化状态恢复星标，收藏/取消收藏会同步更新按钮和 Toast。
- 详情页新增“标记已学 / 已学”按钮，通过 `storageAPI` 将学习记录持久化到 `xds_learned`，记录 `learnedAt`。
- 新增 `tests/noun-actions.test.js`，覆盖收藏写入、取消收藏、星标恢复、标记已学、已学状态恢复和 storage adapter 缺失降级。

#### 验证

- `npx vitest run tests/noun.test.js tests/noun-actions.test.js --environment jsdom`：通过，`14` 项测试通过。

### Phase 2 Task 2.1：名词解释种子数据与数据驱动渲染

- 将 `src/data/nouns.json` 扩充为 `10` 条结构化种子名词，补齐 `text`、`related`、`dynasty`、`category`、`map`、`year` 字段。
- 更新 `src/js/noun.js`，由 `setNounData()` 触发 `renderNounCards()`，支持按名称、正文、朝代、分类和年份搜索。
- 名词详情新增朝代/分类/年份元信息渲染，相关地图与相关名词由 JSON 数据驱动。
- 删除 `index.html` 中 `#noun-grid` 的硬编码卡片，保留空容器作为渲染目标，并新增 `#nd-meta`。
- 扩展 `tests/noun.test.js`，覆盖数据驱动渲染、搜索空态、详情元信息、XSS 转义、种子数据结构和 index shell。

#### 验证

- `npx vitest run tests/noun.test.js --environment jsdom`：通过，`7` 项测试通过。
- `npx vitest run tests/adapter-wiring.test.js tests/app-static-data.test.js tests/html-hardening.test.js --environment jsdom`：通过，`12` 项测试通过。
- `node scripts/validate-data.js`：`13 OK`、`2 WARN`、`0 ERROR`；剩余 WARN 为 `people.json` centers 结构与 `questions.json` 暂缺，均为既有状态。
- `npx vitest run --environment jsdom`：通过，`20` 个测试文件、`92` 项测试通过。

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
- `node scripts/validate-data.js`：仍存在 Phase 0 基线中已记录的 `nouns.json` 数据错误，本任务未修改数据文件。
- `npx vitest run tests --environment jsdom`：新增的 `tests/adapters/navigation.test.js` 通过；全量 tracked tests 仍存在 Phase 0 基线中已记录的 `tests/app-static-data.test.js`、`tests/film.test.js`、`tests/resources-structure.test.js` 失败，本任务未修改相关模块。

### Phase 1 Task 1.1：storage adapter

- 新增 `src/js/adapters/storage.js`，封装 Web LocalStorage 读写与删除能力。
- 新增 `tests/adapters/storage.test.js`，覆盖 JSON、字符串、fallback、读写异常和删除异常。
- 保持 `window.storageAPI.getStoredJSON`、`setStoredJSON`、`getStoredString`、`setStoredString` 兼容。
- 新增 `window.storageAPI.removeStoredItem` 和 `window.storageAPI.removeItem` 删除接口。
- 本任务未改动业务模块；业务模块统一接入 adapter 留到 Phase 1 Task 1.6。

#### 验证

- `npx vitest run tests/adapters/storage.test.js --environment jsdom`：通过，`10` 项测试通过。
- `npx vitest run tests/checkin.test.js tests/navigation.test.js tests/utils/html.test.js --environment jsdom`：通过，`8` 项测试通过。
- `node scripts/validate-data.js`：仍存在 Phase 0 基线中已记录的 `nouns.json` 数据错误，本任务未修改数据文件。
- `npx vitest run --environment jsdom`：新增的 `tests/adapters/storage.test.js` 通过；全量测试仍存在 Phase 0 基线中已记录的 `tests/app-static-data.test.js`、`tests/film.test.js`、`tests/resources-structure.test.js` 失败，本任务未修改相关模块。

## 2026-06-10

### 测试基线

- 命令：`npx vitest run --environment jsdom`
- 测试文件：`12`
- 通过文件：`9`
- 失败文件：`3`
- 测试总数：`36`
- 通过测试：`32`
- 失败测试：`4`
- 当前失败项：
- `tests/app-static-data.test.js`：`app.js` 尚未接入梗图、反馈类型、热点文章、讨论区、个人菜单等静态数据渲染。
- `tests/film.test.js`：`app.js` 尚未接入影视数据、榜单数据和影视模块初始化。
- `tests/resources-structure.test.js`：`resources/images/...` 目录骨架未满足测试预期。

### 数据校验基线

- 命令：`node scripts/validate-data.js`
- 汇总：`13 OK`、`2 WARN`、`20 ERROR`
- 当前告警：
- `people.json`：当前数据仍为 `centers` 结构，因此跳过计划中的 `id` 和 `relations` 校验。
- `questions.json`：文件当前不存在，因此专项题库校验跳过。
- 当前错误：
- 全部 `20` 个错误均来自 `nouns.json`。
- 当前错误类型为缺少 `dynasty`、缺少 `category`、`related` 指向不存在的名词。

### 说明

- 本条目记录的是 `2026-06-10` 当日仓库实际观测到的测试与数据校验基线。
- 上述失败、告警和错误在本次记录中未做修复，仅作为后续任务对照基线保留。
- 后续任务应与此条目对比，不应覆盖或隐藏这批基线结果。
