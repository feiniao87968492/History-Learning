# 学的是史 film/watchlist 模块设计

## 1. 背景与目标

当前项目已经完成第一轮静态原型拆分，部分页面逻辑已迁移到 `src/js/*.js` 模块中，但影视书目区域仍保留在 `index.html` 的内联脚本里，包含内容筛选、榜单渲染、待看栏状态和面板渲染等逻辑。

当前影视相关逻辑主要位于：

- 影视书目页面结构：`index.html`
- 影视筛选：`filFilm()`
- 待看按钮切换：`togWL()`
- 榜单切换与渲染：`swRnkTab()` / `renderRnk()`
- 待看栏面板：`openWL()` / `closeWL()` / `swWLTab()` / `renderWL()`

其中 `renderWL()` 仍保留 `TODO`，说明该区域尚未完成真实功能闭环。

本次设计目标是将影视区域重构为一个独立、数据驱动、可维护、可测试的模块，同时保持当前 UI 风格与主要交互基本不变。

目标包括：

1. 将影视相关主要逻辑从 `index.html` 迁移到 `src/js/film.js`
2. 将影视条目数据迁移到 `src/data/films.json`
3. 将榜单数据迁移到 `src/data/rankings.json`
4. 将用户待看状态持久化到 localStorage
5. 补完待看栏真实渲染与状态迁移
6. 保持与当前 `app.js + 模块 API + JSON + localStorage` 模式一致

## 2. 设计范围

本次设计覆盖以下功能边界：

### 2.1 模块负责内容

film/watchlist 模块负责四类能力：

1. **影视条目展示**
   - 渲染书籍 / 影视 / 纪录片卡片
   - 支持按 `all / book / film / doc` 分类筛选

2. **榜单展示**
   - 渲染书籍榜 / 影视榜 / 纪录片榜
   - 支持榜单 tab 切换

3. **待看栏状态管理**
   - 支持加入待看栏
   - 支持移除待看项
   - 支持三种状态分组：`want / watching / watched`

4. **待看栏面板渲染**
   - 渲染空状态
   - 渲染各分组列表
   - 支持待看项状态迁移

### 2.2 明确不在本次范围内的内容

以下内容不纳入本模块：

- 全局导航、登录、Toast：继续由 `navigation.js` 负责
- 通用 localStorage 读写：继续由 `storage.js` 负责
- 全站收藏夹 `favorites.js`：本次不与待看栏合并
- 人物关系网、讨论区、思维导图等其他内联模块
- UI 改版或样式重构
- 后端接口、用户账户同步、云端持久化

## 3. 方案选择

本次选用：**单模块 + 双数据源 + localStorage 状态对象**。

### 3.1 选定方案

- `src/js/film.js`：统一负责影视内容渲染、榜单渲染、待看栏状态管理和面板渲染
- `src/data/films.json`：保存影视卡片静态内容
- `src/data/rankings.json`：保存榜单静态内容
- `localStorage[xds_watchlist]`：保存用户待看状态

### 3.2 选择理由

该方案最符合当前项目现状：

- 已有 `noun.js`、`timeline.js` 采用“模块内部管理状态与渲染，`app.js` 负责注入数据”的模式
- 已有 `storage.js` 可直接复用 JSON 存取
- 当前项目规模还不需要再额外拆成 `watchlist.js`
- 可先做出完整闭环，未来若待看栏功能继续增长，再从 `film.js` 中二次拆分状态子模块

### 3.3 未采用方案

#### 拆成 `film.js + watchlist.js`

该方案边界更清晰，但对当前项目规模来说偏提前抽象，会增加模块协作成本。

#### 将待看栏并入 `favorites.js`

该方案复用性看似更高，但“收藏”和“待看/在看/看过”语义不同。若强行合并，容易让 `favorites.js` 变成杂糅模块，后续维护边界不清。

## 4. 文件结构设计

### 4.1 新增/调整文件

- `src/js/film.js`
- `src/data/films.json`
- `src/data/rankings.json`

### 4.2 修改文件

- `index.html`
  - 保留影视书目页面容器和基础结构
  - 移除影视相关内联脚本实现
  - 将静态卡片替换为可渲染容器
  - 保持必要的全局函数入口兼容现有 `onclick`

- `src/js/app.js`
  - 加载 `films.json`
  - 加载 `rankings.json`
  - 调用 `filmAPI.setFilms()` / `filmAPI.setRankings()`
  - 在应用初始化时启动 film 模块

## 5. 数据结构设计

核心原则：**静态内容进 JSON，用户个人状态进 localStorage。**

### 5.1 `src/data/films.json`

建议采用数组结构，每条内容一个对象。

示例结构：

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
  }
]
```

字段说明：

- `id`：唯一标识，用于待看栏状态绑定
- `type`：`book | film | doc`
- `title`：标题
- `creator`：作者/导演/来源
- `year`：年份或时间补充
- `rating`：评分文本
- `ratingCount`：评分人数文本
- `description`：内容简介
- `tags`：标签数组
- `coverStyle`：封面背景样式
- `badge`：角标文案
- `icon`：封面 emoji 或图标文本

说明：第一版允许在 JSON 中保留轻量展示字段（如 `coverStyle`、`badge`、`icon`），以降低模板分支复杂度，避免为当前原型阶段过度抽象。

### 5.2 `src/data/rankings.json`

建议采用按类别分组的对象结构。

示例结构：

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
    }
  ]
}
```

榜单数据与影视卡片数据分离，不从 `films.json` 自动推导。这样允许后续榜单项与卡片列表部分错位，也允许独立排序维护。

### 5.3 localStorage：`xds_watchlist`

待看栏状态采用对象结构，不使用单数组。

```json
{
  "want": [
    {
      "id": "film-last-emperor",
      "addedAt": "2026-06-08T10:00:00.000Z"
    }
  ],
  "watching": [],
  "watched": [
    {
      "id": "book-wanli-shiwu-nian",
      "addedAt": "2026-06-07T09:30:00.000Z"
    }
  ]
}
```

字段设计：

- `want`：待看
- `watching`：在看
- `watched`：看过
- 每项仅存 `id` 和轻量元信息（当前只要求 `addedAt`）

规则补充：

- `addedAt` 表示项目首次加入待看体系的时间
- 项目在 `want / watching / watched` 之间迁移时，保留原有 `addedAt`，不在每次迁移时重写
- 渲染顺序以分组数组顺序为准；项目迁入目标分组时插入到数组头部，确保最近操作的项目优先可见

完整展示内容始终以 `films.json` 为准，渲染时通过 `id` 进行关联查找，避免在 localStorage 冗余保存完整内容副本。

## 6. 模块 API 设计

`src/js/film.js` 暴露 `window.filmAPI`，风格与现有 `nounAPI`、`timelineAPI` 保持一致。

建议 API：

```js
window.filmAPI = {
  setFilms,
  setRankings,
  initializeFilmModule,
  filterFilms,
  renderFilmGrid,
  switchRankingTab,
  renderRanking,
  openWatchlist,
  closeWatchlist,
  switchWatchlistTab,
  toggleWatchlistItem,
  moveWatchlistItem,
  renderWatchlist
}
```

### 6.1 各 API 责任

- `setFilms(films)`：注入影视卡片静态数据
- `setRankings(rankings)`：注入榜单静态数据
- `initializeFilmModule()`：执行模块初始化与初始渲染
- `filterFilms(type, btn)`：切换分类并刷新影视列表
- `renderFilmGrid()`：根据当前筛选状态渲染影视卡片
- `switchRankingTab(type, btn)`：切换榜单 tab
- `renderRanking(type)`：渲染榜单区域
- `openWatchlist()` / `closeWatchlist()`：控制待看栏面板开关
- `switchWatchlistTab(type, btn)`：切换待看栏状态页签
- `toggleWatchlistItem(filmId)`：从影视卡片入口加入/移除待看栏
- `moveWatchlistItem(filmId, nextStatus)`：在面板内切换状态
- `renderWatchlist()`：渲染当前待看栏列表

## 7. 模块内部状态设计

`film.js` 内部维护以下状态：

- `films`：影视内容数组
- `rankings`：榜单对象
- `currentFilmType`：当前筛选类型，默认 `all`
- `currentRankingType`：当前榜单类型，默认 `book`
- `currentWatchlistType`：当前待看栏 tab，默认 `want`

说明：当前代码中的待看栏默认打开 `watching`，本次设计改为默认 `want`，因为用户更常从“加入待看”开始使用该功能。

## 8. 页面交互设计

### 8.1 影视分类筛选

用户点击分类按钮后：

1. 更新 `currentFilmType`
2. 更新分类按钮激活态
3. 调用 `renderFilmGrid()`

渲染目标：`#film-grid`

### 8.2 榜单切换

用户点击榜单 tab 后：

1. 更新 `currentRankingType`
2. 更新榜单按钮激活态
3. 调用 `renderRanking(type)`

渲染目标：`#rnk-list`

### 8.3 卡片按钮：加入/移除待看栏

影视卡片按钮只负责简单语义：

- 不在待看栏：`＋ 待看`
- 已在待看栏：`✓ 已添加`

点击逻辑：

- 不存在时，默认加入 `want`
- 已存在时，直接移除

更复杂的状态迁移（如 `want -> watching -> watched`）只在待看栏面板中执行，不放在卡片按钮上，以避免首页按钮承担过多语义。

### 8.4 待看栏面板

打开待看栏面板时：

1. 展示 `#watchlist-panel`
2. 默认选中 `want`
3. 渲染当前 tab 项目列表

### 8.5 待看栏内部状态迁移

每个待看栏项目提供：

- 移除
- 移到待看
- 移到在看
- 移到看过

执行流程：

1. 从旧分组移除该 `id`
2. 将项目插入目标分组数组头部，并保留原有 `addedAt`
3. 写回 localStorage
4. 重新渲染待看栏
5. 同步刷新影视卡片按钮状态

若用户选择的目标状态与当前状态相同，则不改写数据，只允许直接返回，避免无意义重排。

### 8.6 HTML 交互兼容策略

第一版继续兼容 inline `onclick` 风格，不强行重构为统一事件绑定。

原因：

- 当前项目已广泛使用全局函数暴露模式
- 修改范围更小，迁移风险更低
- 与现有 `navigation.js` / `noun.js` / `timeline.js` 模式一致

后续如果启动第二轮“去内联事件”重构，可再统一调整。

## 9. 初始化与数据流设计

### 9.1 `app.js` 装配职责

`app.js` 负责数据加载和注入，不由 `film.js` 自己 `fetch`。

初始化流程：

1. `app.js` 加载 `films.json`
2. `app.js` 加载 `rankings.json`
3. 调用 `filmAPI.setFilms(films)`
4. 调用 `filmAPI.setRankings(rankings)`
5. 调用 `filmAPI.initializeFilmModule()`

该流程与现有：

- `nounAPI.setNounData(...)`
- `timelineAPI.setDynasties(...)`
- `podcastAPI.setPodcasts(...)`

保持同样职责边界。

### 9.2 `initializeFilmModule()` 责任

建议在模块初始化时执行：

1. 校验并补齐待看栏默认结构
2. 清理 localStorage 中引用失效的 `filmId`
3. 渲染影视卡片
4. 渲染默认榜单
5. 渲染待看栏默认状态
6. 同步影视卡片按钮状态

## 10. 状态规则与一致性约束

### 10.1 单项目单状态约束

同一 `filmId` 在任意时刻只能存在于以下一个分组中：

- `want`
- `watching`
- `watched`

禁止同一项目同时出现在多个分组。

### 10.2 状态迁移规则

当项目从一个状态迁到另一个状态时：

1. 先从旧状态数组删除
2. 再加入新状态数组
3. 再写回存储

### 10.3 失效数据清理

若 localStorage 中存在的 `filmId` 不在当前 `films.json` 中，应在初始化时自动清理，避免待看栏渲染空壳项或产生异常。

## 11. 错误处理与回退策略

### 11.1 JSON 加载失败

沿用 `app.js` 当前 `loadJSON(path, fallback)` 机制。

- `films.json` 失败时，回退为 `[]`
- `rankings.json` 失败时，回退为 `{ book: [], film: [], doc: [] }`

页面行为：

- 影视区显示空状态
- 榜单区显示“暂无榜单内容”
- 控制台打印错误
- 不因单个数据源失败导致整页不可用

### 11.2 localStorage 读写失败

继续复用 `storage.js` 的保护逻辑。

- 读取失败：回退到默认结构
- 写入失败：不崩溃，并可提示一次轻量 Toast，例如“保存失败，请稍后再试”

### 11.3 数据引用不一致

若待看栏某项在渲染时找不到对应影视内容：

- 第一优先：初始化时清理失效项
- 防御性兜底：渲染阶段若仍找不到，直接跳过该项

## 12. 兼容性说明

- 保持现有视觉风格与主要布局基本不变
- 保持 inline `onclick` 兼容
- 不修改 `storage.js` 与 `favorites.js` 的现有职责边界
- 不与全站收藏体系共用 storage key
- 不引入构建工具或新框架

## 13. 测试设计

新增 `tests/film.test.js`，至少覆盖以下场景：

### 13.1 影视筛选

- 默认渲染全部内容
- 切换到 `book` 仅显示书籍
- 切换到 `film` 仅显示影视
- 切换到 `doc` 仅显示纪录片

### 13.2 榜单渲染

- 默认榜单渲染正确
- 切换榜单 tab 后渲染对应榜单
- 空榜单显示空状态

### 13.3 加入/移除待看栏

- 点击加入后写入 `xds_watchlist`
- 重复加入不会重复插入
- 再次移除能从存储中删除
- 卡片按钮文案会同步变化

### 13.4 状态迁移

- `want -> watching`
- `watching -> watched`
- 同一 `id` 不会同时存在于多个分组

### 13.5 失效 `id` 清理

- localStorage 中含不存在的 `filmId`
- 初始化后能自动清除

## 14. 验收标准

当以下条件全部满足时，本次设计视为落地成功：

### 14.1 结构完成

- 影视相关主要逻辑从 `index.html` 迁移到 `src/js/film.js`
- 静态影视数据迁移到 `src/data/films.json`
- 榜单数据迁移到 `src/data/rankings.json`

### 14.2 功能完成

- 分类筛选正常
- 榜单切换正常
- 待看栏支持真实添加/移除/状态迁移
- localStorage 持久化正常
- 页面刷新后状态可恢复

### 14.3 稳定性完成

- JSON 缺失不导致白屏
- localStorage 异常有回退策略
- 失效 `filmId` 能被清理
- 新增测试覆盖核心交互

## 15. 实施边界与后续演进

本次只完成 film/watchlist 的独立模块化与真实功能闭环，不扩展到：

- 后端同步
- 用户登录后跨设备同步
- 推荐算法
- 评分系统
- 批量导入内容后台

后续若待看栏逻辑继续增长，可将 `film.js` 中的状态管理进一步拆出为 `watchlist.js`。但在本次范围内，不提前做该拆分。